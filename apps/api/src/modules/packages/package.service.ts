import { z } from "zod";
import { prisma } from "../../utils/prisma";
import {
  notificationService,
  dispatchEmailsForNotification,
} from "../notifications/notification.service";

// --- Zod Schemas ---

export const CreatePackageSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  price: z.number().int().positive().optional(),
  courseIds: z
    .array(z.string().cuid())
    .min(1, "At least one course is required"),
});

export const UpdatePackageSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().nullable().optional(),
  price: z.number().int().positive().nullable().optional(),
  courseIds: z.array(z.string().cuid()).min(1).optional(),
});

export const EnrollStudentSchema = z.object({
  userId: z.string().cuid(),
});

export const ApproveEnrollmentSchema = z.object({
  courseBatchAssignments: z.array(
    z.object({
      courseId: z.string().cuid(),
      batchId: z.string().min(1),
    }),
  ),
});

// --- Service ---

export const packageService = {
  // Create a new package with courses
  async createPackage(data: z.infer<typeof CreatePackageSchema>) {
    // Verify all courses exist
    const courses = await prisma.course.findMany({
      where: { id: { in: data.courseIds } },
    });
    if (courses.length !== data.courseIds.length) {
      throw new Error("One or more courses not found");
    }

    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return prisma.coursePackage.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        price: data.price,
        courses: {
          create: data.courseIds.map((courseId, index) => ({
            courseId,
            order: index,
          })),
        },
      },
      include: {
        courses: {
          include: {
            course: {
              select: { id: true, title: true, slug: true, thumbnailUrl: true },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
    });
  },

  // List all packages with filters
  async listPackages(filters: { status?: string; search?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    return prisma.coursePackage.findMany({
      where,
      include: {
        courses: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get a single package by ID
  async getPackageById(packageId: string) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                status: true,
                _count: { select: { modules: true, batches: true } },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        enrollments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            courses: {
              include: {
                course: { select: { id: true, title: true } },
                batch: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!pkg) throw new Error("Package not found");
    return pkg;
  },

  // Update a package
  async updatePackage(
    packageId: string,
    data: z.infer<typeof UpdatePackageSchema>,
  ) {
    const existing = await prisma.coursePackage.findUnique({
      where: { id: packageId },
    });
    if (!existing) throw new Error("Package not found");

    // If updating courses, verify they all exist
    if (data.courseIds && data.courseIds.length > 0) {
      const courses = await prisma.course.findMany({
        where: { id: { in: data.courseIds } },
      });
      if (courses.length !== data.courseIds.length) {
        throw new Error("One or more courses not found");
      }

      // Remove old course links and create new ones
      await prisma.packageCourse.deleteMany({ where: { packageId } });
      await prisma.packageCourse.createMany({
        data: data.courseIds.map((courseId, index) => ({
          packageId,
          courseId,
          order: index,
        })),
      });
    }

    const { courseIds, ...updateData } = data;
    return prisma.coursePackage.update({
      where: { id: packageId },
      data: updateData,
      include: {
        courses: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { enrollments: true } },
      },
    });
  },

  // Delete a package (only DRAFT)
  async deletePackage(packageId: string) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!pkg) throw new Error("Package not found");
    if (pkg.status !== "DRAFT") {
      throw new Error("Only DRAFT packages can be deleted");
    }
    if (pkg._count.enrollments > 0) {
      throw new Error("Cannot delete package with enrolled students");
    }

    await prisma.coursePackage.delete({ where: { id: packageId } });
    return { deleted: true };
  },

  // Update package status
  async updatePackageStatus(packageId: string, status: string) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
    });
    if (!pkg) throw new Error("Package not found");

    return prisma.coursePackage.update({
      where: { id: packageId },
      data: { status: status as any },
      include: {
        courses: {
          include: {
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
  },

  // Enroll a student into a package
  async enrollStudent(
    packageId: string,
    data: z.infer<typeof EnrollStudentSchema>,
  ) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { id: packageId },
      include: { courses: { select: { courseId: true } } },
    });
    if (!pkg) throw new Error("Package not found");
    if (pkg.status !== "ACTIVE") {
      throw new Error("Only ACTIVE packages can be used for enrollment");
    }

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (!student) throw new Error("Student not found");

    // Check for existing enrollment
    const existingEnrollment = await prisma.packageEnrollment.findFirst({
      where: {
        userId: data.userId,
        packageId,
        status: { not: "REJECTED" },
      },
    });
    if (existingEnrollment) {
      throw new Error("Student is already enrolled in this package");
    }

    // Create enrollment - batches will be assigned during approval
    return prisma.packageEnrollment.create({
      data: {
        userId: data.userId,
        packageId,
        status: "PENDING",
        courses: {
          create: pkg.courses.map((c) => ({
            courseId: c.courseId,
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
        courses: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  // List package enrollments with filters
  async listEnrollments(filters: { status?: string; packageId?: string }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.packageId) where.packageId = filters.packageId;

    return prisma.packageEnrollment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: {
          select: {
            id: true,
            name: true,
            _count: { select: { courses: true } },
          },
        },
        courses: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Approve a package enrollment
  async approveEnrollment(
    enrollmentId: string,
    data: z.infer<typeof ApproveEnrollmentSchema>,
  ) {
    const enrollment = await prisma.packageEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        package: {
          include: { courses: { select: { courseId: true } } },
        },
        courses: true,
      },
    });
    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.status !== "PENDING") {
      throw new Error(
        `Cannot approve enrollment with status: ${enrollment.status}`,
      );
    }

    // Verify all batch assignments are for courses in this package
    const packageCourseIds = enrollment.package.courses.map((c) => c.courseId);
    for (const assignment of data.courseBatchAssignments) {
      if (!packageCourseIds.includes(assignment.courseId)) {
        throw new Error(`Course ${assignment.courseId} is not in this package`);
      }
      // Verify batch exists and belongs to the course
      const batch = await prisma.batch.findUnique({
        where: { id: assignment.batchId },
        include: {
          _count: {
            select: {
              enrollments: { where: { status: "APPROVED" } },
              packageEnrollmentCourses: true,
            },
          },
        },
      });
      if (!batch) throw new Error(`Batch ${assignment.batchId} not found`);
      if (batch.courseId !== null && batch.courseId !== assignment.courseId) {
        throw new Error(
          `Batch ${assignment.batchId} does not belong to course ${assignment.courseId}`,
        );
      }
      const totalEnrolled =
        batch._count.enrollments + batch._count.packageEnrollmentCourses;
      if (batch.maxStudents && totalEnrolled >= batch.maxStudents) {
        throw new Error(
          `Batch "${batch.name}" has reached maximum capacity (${batch.maxStudents})`,
        );
      }
    }

    // Update batch assignments and approve
    await prisma.$transaction(
      data.courseBatchAssignments.map((a) =>
        prisma.packageEnrollmentCourse.updateMany({
          where: {
            enrollmentId,
            courseId: a.courseId,
          },
          data: { batchId: a.batchId },
        }),
      ),
    );

    const updated = await prisma.packageEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "APPROVED" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
        courses: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
    });

    notificationService.create({
      userId: enrollment.userId,
      type: "ENROLLMENT_APPROVED",
      title: "Package Enrollment Approved!",
      message: `Your enrollment in package "${enrollment.package.name}" has been approved.`,
      metadata: { packageId: enrollment.packageId },
    });

    dispatchEmailsForNotification([enrollment.userId], "ENROLLMENT_APPROVED", {
      courseName: enrollment.package.name,
      batchName: "",
    });

    return updated;
  },

  // Reject a package enrollment
  async rejectEnrollment(enrollmentId: string) {
    const enrollment = await prisma.packageEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        package: { select: { name: true } },
      },
    });
    if (!enrollment) throw new Error("Enrollment not found");
    if (enrollment.status !== "PENDING") {
      throw new Error(
        `Cannot reject enrollment with status: ${enrollment.status}`,
      );
    }

    const updated = await prisma.packageEnrollment.update({
      where: { id: enrollmentId },
      data: { status: "REJECTED" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        package: { select: { id: true, name: true } },
      },
    });

    notificationService.create({
      userId: enrollment.userId,
      type: "ENROLLMENT_REJECTED",
      title: "Package Enrollment Update",
      message:
        "Unfortunately, your package enrollment request was not approved at this time.",
      metadata: { packageId: enrollment.packageId },
    });

    dispatchEmailsForNotification([enrollment.userId], "ENROLLMENT_REJECTED", {
      courseName: enrollment.package.name,
      reason: undefined,
    });

    return updated;
  },

  // Get a single ACTIVE package by slug with full course detail (no auth required)
  async getPublicPackageBySlug(slug: string) {
    const pkg = await prisma.coursePackage.findUnique({
      where: { slug, status: "ACTIVE" },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
                learningObjectives: true,
                modules: {
                  select: { id: true, title: true, order: true },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
          orderBy: { order: "asc" },
        },
        batches: {
          where: { isActive: true },
          select: { id: true, name: true, startDate: true, maxStudents: true },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!pkg) throw new Error("Package not found");
    return pkg;
  },

  // Get public catalogue of ACTIVE packages (no auth required)
  async getPublicCatalogue() {
    return prisma.coursePackage.findMany({
      where: { status: "ACTIVE" },
      include: {
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                thumbnailUrl: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        batches: {
          where: { isActive: true },
          select: { id: true, name: true, startDate: true, maxStudents: true },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // Get student's enrolled packages
  async getStudentPackages(userId: string) {
    return prisma.packageEnrollment.findMany({
      where: { userId, status: "APPROVED" },
      include: {
        package: {
          include: {
            courses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    thumbnailUrl: true,
                    modules: {
                      select: { id: true, title: true, order: true },
                    },
                    batches: {
                      where: { isActive: true },
                      select: { id: true, name: true },
                    },
                  },
                },
              },
              orderBy: { order: "asc" },
            },
          },
        },
        courses: {
          include: {
            course: { select: { id: true, title: true } },
            batch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },
};
