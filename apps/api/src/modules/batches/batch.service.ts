/**
 * Batch service — manages course batches (class groups), student enrollment,
 * course visibility toggling, and capacity enforcement.
 *
 * A batch links to either a single course (courseId) or a package (packageId).
 * Students are enrolled via userIds with automatic capacity checks.
 * Instructors can only manage their own batches.
 */
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { UserRole } from "@lms/types";
import { paginate } from "../../utils/paginate";
import { AppError } from "../../utils/errors";

// --- Zod Schemas ---

/**
 * Schema for creating a batch. Requires either courseId or packageId.
 * For package batches, courseInstructors can assign instructors per course.
 * Uses .refine() to enforce the either/or constraint at the schema level.
 */
export const CreateBatchSchema = z
  .object({
    courseId: z.string().optional(),
    packageId: z.string().optional(),
    instructorId: z.string().min(1).optional(),
    courseInstructors: z
      .array(
        z.object({
          courseId: z.string().min(1, "Course ID is required"),
          instructorId: z.string().optional(),
        }),
      )
      .optional(),
    name: z.string().min(3).max(100),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    maxStudents: z.number().int().min(1).optional(),
    description: z.string().optional(),
    defaultDaysToComplete: z.number().int().min(1).optional(),
  })
  .refine((data) => data.courseId || data.packageId, {
    message: "Either courseId or packageId is required",
  });

export const UpdateBatchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxStudents: z.number().int().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]).optional(),
  isActive: z.boolean().optional(),
  defaultDaysToComplete: z.number().int().min(1).nullable().optional(),
});

export const AddStudentsSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1),
});

// --- Service ---

export const batchService = {
  // Creates a new batch linked to a course (courseId must be provided)
  async createBatch(data: z.infer<typeof CreateBatchSchema>) {
    if (!data.courseId)
      throw new Error("courseId is required for single batch creation");
    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new Error("Course not found");

    // Verify the instructor exists and has INSTRUCTOR role (if provided)
    if (data.instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: data.instructorId },
      });
      if (!instructor) throw new Error("Instructor not found");
      if (
        instructor.role !== "INSTRUCTOR" &&
        instructor.role !== "ADMIN" &&
        instructor.role !== "SUPER_ADMIN"
      ) {
        throw new Error("User is not an instructor");
      }
    }

    // If packageId is provided, verify package exists, is ACTIVE, and course belongs to it
    if (data.packageId) {
      const pkg = await prisma.coursePackage.findUnique({
        where: { id: data.packageId },
      });
      if (!pkg) throw new Error("Package not found");
      if (pkg.status !== "ACTIVE") throw new Error("Package is not active");

      const packageCourse = await prisma.packageCourse.findUnique({
        where: {
          packageId_courseId: {
            packageId: data.packageId,
            courseId: data.courseId,
          },
        },
      });
      if (!packageCourse) {
        throw new Error("Course does not belong to the specified package");
      }
    }

    return prisma.batch.create({
      data: {
        courseId: data.courseId,
        packageId: data.packageId,
        instructorId: data.instructorId ?? null,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxStudents: data.maxStudents,
        description: data.description,
        defaultDaysToComplete: data.defaultDaysToComplete,
        status: "UPCOMING",
      },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
      },
    });
  },

  // Creates a single batch for an entire package (courseId=null) with per-course instructors
  async createBatchesForPackage(data: z.infer<typeof CreateBatchSchema>) {
    if (!data.packageId) throw new Error("packageId is required");

    // Verify package exists and is active
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: data.packageId },
    });
    if (!pkg) throw new Error("Package not found");
    if (pkg.status !== "ACTIVE") throw new Error("Package is not active");

    // Verify primary instructor if provided
    if (data.instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: data.instructorId },
      });
      if (!instructor) throw new Error("Instructor not found");
      if (
        instructor.role !== "INSTRUCTOR" &&
        instructor.role !== "ADMIN" &&
        instructor.role !== "SUPER_ADMIN"
      ) {
        throw new Error("User is not an instructor");
      }
    }

    // Verify course instructors if provided
    const courseInstructorIds = new Set<string>();
    if (data.courseInstructors?.length) {
      for (const ci of data.courseInstructors) {
        if (!ci.instructorId) continue;
        if (courseInstructorIds.has(ci.instructorId)) continue;
        courseInstructorIds.add(ci.instructorId);
        const instructor = await prisma.user.findUnique({
          where: { id: ci.instructorId },
        });
        if (!instructor) {
          throw new Error(`Course instructor ${ci.instructorId} not found`);
        }
        if (
          instructor.role !== "INSTRUCTOR" &&
          instructor.role !== "ADMIN" &&
          instructor.role !== "SUPER_ADMIN"
        ) {
          throw new Error(
            `User ${instructor.name} is not an instructor`,
          );
        }
      }
    }

    // Get all courses in the package
    const packageCourses = await prisma.packageCourse.findMany({
      where: { packageId: data.packageId },
      include: { course: { select: { id: true, title: true } } },
      orderBy: { order: "asc" },
    });
    if (packageCourses.length === 0) {
      throw new Error("Package has no courses. Add courses first.");
    }

    // Build courseInstructors map for quick lookup
    const instructorMap = new Map(
      data.courseInstructors?.map((ci) => [ci.courseId, ci.instructorId]) ?? [],
    );

    // Create one batch for the entire package (courseId=null means it covers all package courses)
    const batch = await prisma.batch.create({
      data: {
        courseId: null,
        packageId: data.packageId,
        instructorId: data.instructorId ?? null,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxStudents: data.maxStudents,
        description: data.description,
        defaultDaysToComplete: data.defaultDaysToComplete,
        status: "UPCOMING",
      },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
        courseMentors: { include: { mentor: { select: { id: true, name: true, email: true } }, course: { select: { id: true, title: true } } } },
      },
    });

    // Create BatchCourseMentor records for each course-instructor assignment
    if (data.courseInstructors?.length) {
      const mentorsToCreate = data.courseInstructors
        .filter((ci) => ci.instructorId && packageCourses.some((pc) => pc.course.id === ci.courseId))
        .map((ci) => ({
          batchId: batch.id,
          courseId: ci.courseId,
          mentorId: ci.instructorId!,
        }));

      if (mentorsToCreate.length > 0) {
        await prisma.batchCourseMentor.createMany({
          data: mentorsToCreate,
          skipDuplicates: true,
        });
      }
    }

    // Create BatchCourseVisibility for each course (hidden by default)
    const visibilityData = packageCourses.map((pc) => ({
      batchId: batch.id,
      courseId: pc.course.id,
      isVisible: false,
      isExamRequired: true,
    }));

    await prisma.batchCourseVisibility.createMany({
      data: visibilityData,
      skipDuplicates: true,
    });

    // Re-fetch with all includes
    return prisma.batch.findUnique({
      where: { id: batch.id },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
        courseMentors: { include: { mentor: { select: { id: true, name: true, email: true } }, course: { select: { id: true, title: true } } } },
      },
    });
  },

  // Lists batches with optional filters
  async listBatches(filters: {
    courseId?: string;
    status?: string;
    search?: string;
    instructorId?: string;
    packageId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { deletedAt: null };

    if (filters.courseId) {
      // Also include package-only batches whose package contains this course
      const pkgIds = await prisma.packageCourse
        .findMany({
          where: { courseId: filters.courseId },
          select: { packageId: true },
        })
        .then((rows) => rows.map((r) => r.packageId))
        .catch(() => [] as string[]);

      const courseFilter: any[] = [{ courseId: filters.courseId }];
      if (pkgIds.length > 0) {
        courseFilter.push({ courseId: null, packageId: { in: pkgIds } });
      }
      where.OR = courseFilter;
    }
    if (filters.status) where.status = filters.status;
    if (filters.instructorId) {
      const mentorOrInstructor = [
        { instructorId: filters.instructorId },
        { courseMentors: { some: { mentorId: filters.instructorId } } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: mentorOrInstructor }];
        delete where.OR;
      } else {
        where.OR = mentorOrInstructor;
      }
    }
    if (filters.packageId) where.packageId = filters.packageId;
    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({ page: filters.page, limit: filters.limit });

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip,
        take,
        include: {
          course: { select: { id: true, title: true } },
          instructor: { select: { id: true, name: true, email: true } },
          package: { select: { id: true, name: true } },
          packageEnrollmentCourses: {
            distinct: ["enrollmentId"],
            select: { enrollmentId: true },
          },
          _count: {
            select: {
              enrollments: { where: { status: "APPROVED" } },
              sessions: true,
            },
          },
        },
        orderBy: { startDate: "desc" },
      }),
      prisma.batch.count({ where }),
    ]);

    const formattedBatches = batches.map((b) => {
      const { packageEnrollmentCourses, ...rest } = b;
      const enrollmentCount = rest._count.enrollments;
      return {
        ...rest,
        totalStudents: enrollmentCount + packageEnrollmentCourses.length,
        _count: {
          ...rest._count,
          packageEnrollmentCourses: packageEnrollmentCourses.length,
        },
      };
    });

    return {
      batches: formattedBatches,
      total,
      page: currentPage,
      limit: currentLimit,
    };
  },

  // Gets all batches grouped by course for a given package
  async getBatchesByPackage(packageId: string) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new Error("Package not found");

    const packageCourses = await prisma.packageCourse.findMany({
      where: { packageId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            batches: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                status: true,
                maxStudents: true,
                instructor: { select: { id: true, name: true } },
                packageEnrollmentCourses: {
                  distinct: ["enrollmentId"],
                  select: { enrollmentId: true },
                },
                _count: {
                  select: {
                    enrollments: { where: { status: "APPROVED" } },
                  },
                },
              },
              orderBy: { startDate: "desc" },
            },
          },
        },
      },
      orderBy: { order: "asc" },
    });

    return {
      courses: packageCourses.map((pc) => ({
        courseId: pc.course.id,
        courseTitle: pc.course.title,
        batches: pc.course.batches.map((b) => ({
          ...b,
          totalStudents:
            b._count.enrollments + b.packageEnrollmentCourses.length,
        })),
      })),
    };
  },

  // Gets a single batch with full details
  async getBatchById(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
        enrollments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        packageEnrollmentCourses: {
          distinct: ["enrollmentId"],
          include: {
            enrollment: {
              include: {
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
        sessions: {
          orderBy: { scheduledAt: "asc" },
          include: {
            recording: { select: { id: true, syncedAt: true } },
          },
        },
        _count: {
          select: {
            enrollments: { where: { status: "APPROVED" } },
            sessions: true,
          },
        },
      },
    });

    if (!batch) throw new Error("Batch not found");
    return {
      ...batch,
      _count: {
        ...batch._count,
        packageEnrollmentCourses: batch.packageEnrollmentCourses.length,
      },
    };
  },

  // Updates batch details
  async updateBatch(batchId: string, data: z.infer<typeof UpdateBatchSchema>) {
    const existing = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!existing) throw new Error("Batch not found");

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.defaultDaysToComplete === null) {
      updateData.defaultDaysToComplete = null;
    }

    return prisma.batch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });
  },

  // Soft-deletes a batch
  async deleteBatch(batchId: string, deletedBy?: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!batch) throw new Error("Batch not found");
    if (batch._count.enrollments > 0) {
      throw new Error(
        "Cannot delete batch with enrolled students. Remove students first.",
      );
    }

    await prisma.batch.update({
      where: { id: batchId },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy ?? null,
      },
    });
    return { deleted: true };
  },

  // Lists enrolled students in a batch
  async listStudents(
    batchId: string,
    options?: { page?: number; limit?: number },
  ) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");

    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({ page: options?.page, limit: options?.limit });

    const where = { batchId, status: "APPROVED" as const };

    const [students, total] = await Promise.all([
      prisma.enrollmentRequest.findMany({
        where,
        skip,
        take,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { appliedAt: "desc" },
      }),
      prisma.enrollmentRequest.count({ where }),
    ]);

    return { students, total, page: currentPage, limit: currentLimit };
  },

  // Adds students to a batch via approved enrollments
  async addStudents(batchId: string, userIds: string[]) {
    const [batch, approvedCount] = await Promise.all([
      prisma.batch.findUnique({ where: { id: batchId } }),
      prisma.enrollmentRequest.count({
        where: { batchId, status: "APPROVED" },
      }),
    ]);
    if (!batch) throw new Error("Batch not found");

    // Package-only batches: use the package enrollment flow instead
    if (!batch.courseId) {
      throw new Error(
        "This is a package-level batch. Use the package enrollment flow to add students.",
      );
    }

    // Check capacity (only count approved enrollments)
    if (
      batch.maxStudents &&
      approvedCount + userIds.length > batch.maxStudents
    ) {
      throw new Error(
        `Batch capacity exceeded. Max: ${batch.maxStudents}, current: ${approvedCount}`,
      );
    }

    // Create enrollment requests for each student
    const results = await Promise.allSettled(
      userIds.map(async (userId) => {
        // Check if student already enrolled
        const existing = await prisma.enrollmentRequest.findFirst({
          where: { userId, batchId, status: "APPROVED" },
        });
        if (existing) return { userId, skipped: true };

        return prisma.enrollmentRequest.create({
          data: {
            userId,
            courseId: batch.courseId as string,
            batchId,
            status: "APPROVED",
            reviewedAt: new Date(),
          },
        });
      }),
    );

    const added = results.filter((r) => r.status === "fulfilled").length;
    return { added, total: userIds.length };
  },

  // Removes a student from a batch
  async removeStudent(
    batchId: string,
    userId: string,
    authUser: { userId: string; role: string },
  ) {
    if (authUser.role === UserRole.INSTRUCTOR) {
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: { instructorId: true },
      });
      if (!batch) throw new Error("Batch not found");
      const isMentor = await prisma.batchCourseMentor.findFirst({
        where: { batchId, mentorId: authUser.userId },
      });
      if (batch.instructorId !== authUser.userId && !isMentor)
        throw new Error("You can only remove students from your own batches");
    }

    const enrollment = await prisma.enrollmentRequest.findFirst({
      where: { batchId, userId, status: "APPROVED" },
    });

    if (!enrollment) throw new Error("Student not found in this batch");

    await prisma.enrollmentRequest.delete({ where: { id: enrollment.id } });
    return { removed: true };
  },

  // Gets all instructors for dropdown selection
  async getInstructors() {
    return prisma.user.findMany({
      where: { role: { in: ["INSTRUCTOR", "ADMIN"] } },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
  },

  // Gets all published courses for dropdown selection
  async getCoursesForBatch() {
    return prisma.course.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  },

  // Lists all courses for a batch with their visibility state and exam requirement state
  async getBatchCourses(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { id: true, packageId: true, courseId: true },
    });
    if (!batch) throw new Error("Batch not found");

    if (!batch.packageId) {
      return [];
    }

    // Fetch courses from PackageCourse (single source of truth) + left join visibility
    const packageCourses = await prisma.packageCourse.findMany({
      where: { packageId: batch.packageId },
      orderBy: { order: "asc" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    // Fetch existing visibility records for this batch
    const visibilityRecords = await prisma.batchCourseVisibility.findMany({
      where: { batchId },
      select: { courseId: true, isVisible: true, isExamRequired: true },
    });
    const visibilityMap = new Map(
      visibilityRecords.map((v) => [
        v.courseId,
        { isVisible: v.isVisible, isExamRequired: v.isExamRequired },
      ]),
    );

    return packageCourses.map((pc) => {
      const rec = visibilityMap.get(pc.course.id);
      return {
        id: pc.id,
        courseId: pc.course.id,
        order: pc.order,
        isVisible: rec?.isVisible ?? false,
        isExamRequired: rec?.isExamRequired ?? true,
        course: pc.course,
      };
    });
  },

  // Toggles isVisible for a course in a batch (upserts visibility record)
  async toggleCourseVisibility(batchId: string, courseId: string) {
    const existing = await prisma.batchCourseVisibility.findUnique({
      where: { batchId_courseId: { batchId, courseId } },
    });

    const newIsVisible = existing ? !existing.isVisible : true;

    const result = await prisma.batchCourseVisibility.upsert({
      where: { batchId_courseId: { batchId, courseId } },
      update: { isVisible: newIsVisible },
      create: {
        batchId,
        courseId,
        isVisible: newIsVisible,
        isExamRequired: true,
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true },
    });

    return {
      id: result.id,
      courseId: result.courseId,
      order: 0,
      isVisible: result.isVisible,
      isExamRequired: result.isExamRequired,
      course: course!,
    };
  },

  // Toggles isExamRequired for a course in a batch
  async toggleCourseExamRequired(batchId: string, courseId: string) {
    const existing = await prisma.batchCourseVisibility.findUnique({
      where: { batchId_courseId: { batchId, courseId } },
    });

    const newIsExamRequired = existing ? !existing.isExamRequired : false;

    const result = await prisma.batchCourseVisibility.upsert({
      where: { batchId_courseId: { batchId, courseId } },
      update: { isExamRequired: newIsExamRequired },
      create: {
        batchId,
        courseId,
        isVisible: false,
        isExamRequired: newIsExamRequired,
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, slug: true },
    });

    return {
      id: result.id,
      courseId: result.courseId,
      order: 0,
      isVisible: result.isVisible,
      isExamRequired: result.isExamRequired,
      course: course!,
    };
  },

  // Toggles batch-level exam enablement (controls certificate visibility for students)
  async toggleExamEnabled(batchId: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) {
      throw new AppError(404, "Batch not found");
    }

    const newExamEnabled = !batch.examEnabled;

    const updated = await prisma.batch.update({
      where: { id: batchId },
      data: { examEnabled: newExamEnabled },
    });

    return {
      id: updated.id,
      name: updated.name,
      examEnabled: updated.examEnabled,
    };
  },
};
