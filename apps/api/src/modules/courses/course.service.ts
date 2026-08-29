/**
 * Course service — manages course CRUD, publishing, content ordering,
 * and permanent deletion with cascade cleanup.
 *
 * Uses Zod schemas for input validation on all write operations.
 * Slugs are auto-generated from titles and made unique with counter suffix.
 */
import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { moduleService } from "./module.service";

// --- Zod Schemas ---

export const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.string().max(100).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  category: z.string().max(100).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
});

// --- Helpers ---

/**
 * Generates a URL-safe slug from a course title.
 * Strips special characters, collapses whitespace/hyphens, and lowercases.
 *
 * @param title - The course title to slugify
 * @returns URL-safe slug string
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensures a slug is unique by appending -1, -2, etc. if it already exists.
 * Falls back to base slug if DB schema is outdated (no slug column).
 *
 * @param baseSlug - The initial slug to check
 * @returns Unique slug string
 */
async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  try {
    // Attempt to ensure database uniqueness; if the DB schema is out-of-date
    // (e.g. slug column missing), fall back to returning the base slug.
    // This avoids crashes during early development when migrations haven't been run.
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  } catch (err: any) {
    console.warn(
      "Could not verify slug uniqueness (DB may be outdated):",
      err.message || err,
    );
    return baseSlug;
  }

  return slug;
}

// --- Service ---

export const courseService = {
  // Creates a new course in DRAFT status
  async createCourse(
    adminUserId: string,
    data: z.infer<typeof CreateCourseSchema>,
  ) {
    const slug = await ensureUniqueSlug(generateSlug(data.title));

    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        category: data.category,
        categoryId: data.categoryId,
        tags: data.tags ?? [],
        learningObjectives: data.learningObjectives ?? [],
        thumbnailUrl: data.thumbnailUrl,
        coverImageUrl: data.coverImageUrl,
        createdBy: adminUserId,
        status: "DRAFT",
      },
    });

    if (data.tagIds?.length) {
      await prisma.courseTag.createMany({
        data: data.tagIds.map((tagId) => ({ courseId: course.id, tagId })),
      });
    }

    await moduleService.ensureCertificationModule(course.id);

    return course;
  },

  // Lists courses with optional filters
  async listCourses(filters: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { deletedAt: null };

    if (filters.status) {
      where.status = filters.status;
    }

    // Exclude archived by default unless explicitly requested
    if (!filters.status) {
      where.status = { not: "ARCHIVED" };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [coursesRaw, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: { select: { modules: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    // Batches are now package-level (courseId=null) — _count.batches would
    // be 0 for courses that live inside packages. Compute true count as:
    // direct batches (batch.courseId == courseId) + package batches for any
    // package that contains the course via PackageCourse.
    const courseIds = coursesRaw.map((c) => c.id);
    let batchesByCourse = new Map<string, number>();
    if (courseIds.length) {
      const [packageCourses, directCounts, allPackageBatches] = await Promise.all([
        prisma.packageCourse.findMany({
          where: { courseId: { in: courseIds } },
          select: { courseId: true, packageId: true },
        }),
        prisma.batch.groupBy({
          by: ["courseId"],
          where: { courseId: { in: courseIds } },
          _count: { _all: true },
        }),
        prisma.batch.findMany({
          where: { packageId: { not: null } },
          select: { packageId: true },
        }),
      ]);

      const packageBatchCount = new Map<string, number>();
      for (const b of allPackageBatches) {
        if (b.packageId) {
          packageBatchCount.set(b.packageId, (packageBatchCount.get(b.packageId) || 0) + 1);
        }
      }

      const packagesByCourse = new Map<string, Set<string>>();
      for (const pc of packageCourses) {
        if (!packagesByCourse.has(pc.courseId)) packagesByCourse.set(pc.courseId, new Set());
        packagesByCourse.get(pc.courseId)!.add(pc.packageId);
      }

      const directByCourse = new Map<string, number>();
      for (const g of directCounts) {
        if (g.courseId) directByCourse.set(g.courseId, g._count._all);
      }

      for (const id of courseIds) {
        let count = directByCourse.get(id) || 0;
        const pkgIds = packagesByCourse.get(id);
        if (pkgIds) {
          for (const pid of pkgIds) count += packageBatchCount.get(pid) || 0;
        }
        batchesByCourse.set(id, count);
      }
    }

    const courses = coursesRaw.map((c) => ({
      ...c,
      _count: {
        modules: (c as any)._count.modules,
        batches: batchesByCourse.get(c.id) || 0,
      },
    }));

    return { courses, total, page, limit };
  },

  // Gets a single course by ID or slug with its modules
  async getCourseById(idOrSlug: string) {
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" } },
            quizzes: {
              include: { questions: true },
            },
            assignments: {
              orderBy: { dueDate: "asc" },
            },
            practicals: {
              orderBy: { order: "asc" },
            },
          },
        },
        courseTags: { include: { tag: true } },
        categoryRelation: true,
        _count: { select: { batches: true } },
      },
    });

    if (!course) throw new AppError(404, "Course not found");
    // Patch batches count same as listCourses: include package-level batches
    const directCount = (course as any)._count?.batches ?? 0;
    const packageCourses = await prisma.packageCourse.findMany({
      where: { courseId: course.id },
      select: { packageId: true },
    });
    let packageBatchCount = 0;
    if (packageCourses.length) {
      const packageIds = packageCourses.map((pc) => pc.packageId);
      packageBatchCount = await prisma.batch.count({
        where: { packageId: { in: packageIds } },
      });
    }
    (course as any)._count = {
      batches: directCount + packageBatchCount,
      // preserve other counts if needed
    };
    return course;
  },

  // Updates course fields
  async updateCourse(
    idOrSlug: string,
    data: z.infer<typeof UpdateCourseSchema>,
  ) {
    const existing = await prisma.course.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!existing) throw new AppError(404, "Course not found");
    const courseId = existing.id;

    const { tagIds, ...restData } = data;
    const updateData: any = { ...restData };

    if (data.title && data.title !== existing.title) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.title));
    }

    return prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id: courseId },
        data: updateData,
      });

      if (tagIds !== undefined) {
        await tx.courseTag.deleteMany({ where: { courseId } });
        if (tagIds.length) {
          await tx.courseTag.createMany({
            data: tagIds.map((tagId) => ({ courseId, tagId })),
          });
        }
      }

      return course;
    });
  },

  // Resolves a course id or slug to its primary id.
  async resolveCourseId(idOrSlug: string): Promise<string> {
    const existing = await prisma.course.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      select: { id: true },
    });
    if (!existing) throw new AppError(404, "Course not found");
    return existing.id;
  },

  // Soft-deletes a course (sets status to ARCHIVED)
  async deleteCourse(idOrSlug: string, deletedBy?: string) {
    const courseId = await this.resolveCourseId(idOrSlug);

    return prisma.course.update({
      where: { id: courseId },
      data: {
        status: "ARCHIVED",
        deletedAt: new Date(),
        deletedBy: deletedBy ?? null,
      },
    });
  },

  // Publishes a course after validation checklist
  async publishCourse(idOrSlug: string) {
    const courseId = await this.resolveCourseId(idOrSlug);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    if (!course) throw new AppError(404, "Course not found");

    const allLessons = course.modules.flatMap((m) => m.lessons);

    // Pre-publish checklist
    const checklist = [
      { item: "Course has a title", passed: !!course.title },
      {
        item: "Course has a description",
        passed: !!course.description && course.description.length > 0,
      },
      { item: "At least one module exists", passed: course.modules.length > 0 },
      {
        item: "At least one lesson has a video",
        passed: allLessons.some((l) => !!l.videoUrl || !!l.videoEmbedId),
      },
      { item: "Thumbnail image is uploaded", passed: !!course.thumbnailUrl },
    ];

    const allPassed = checklist.every((c) => c.passed);

    if (!allPassed) {
      return { published: false, checklist };
    }

    // Compute total duration from lessons
    const totalSeconds = allLessons.reduce(
      (sum, l) => sum + (l.durationSeconds || 0),
      0,
    );

    await prisma.course.update({
      where: { id: courseId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        durationMinutes: Math.ceil(totalSeconds / 60) || null,
      },
    });

    await moduleService.ensureCertificationModule(courseId);

    return { published: true, checklist };
  },

  // Unpublishes a course (reverts to DRAFT)
  async unpublishCourse(idOrSlug: string) {
    const courseId = await this.resolveCourseId(idOrSlug);
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!existing) throw new AppError(404, "Course not found");
    if (existing.status !== "PUBLISHED")
      throw new AppError(400, "Course is not published");

    return prisma.course.update({
      where: { id: courseId },
      data: { status: "DRAFT", publishedAt: null },
    });
  },

  async recoverCourse(idOrSlug: string, restoredBy?: string) {
    const courseId = await this.resolveCourseId(idOrSlug);
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!existing) throw new AppError(404, "Course not found");
    if (existing.status !== "ARCHIVED")
      throw new AppError(400, "Only archived courses can be recovered");

    return prisma.course.update({
      where: { id: courseId },
      data: {
        status: "DRAFT",
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date(),
        restoredBy: restoredBy ?? null,
      },
    });
  },

  // Permanently deletes a course and all related records (irreversible)
  async permanentDeleteCourse(idOrSlug: string) {
    const courseId = await this.resolveCourseId(idOrSlug);
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!existing) throw new AppError(404, "Course not found");

    await prisma.$transaction(async (tx) => {
      // Gather batch & module IDs for cascading cleanups
      const batchIds = (
        await tx.batch.findMany({ where: { courseId }, select: { id: true } })
      ).map((b: { id: string }) => b.id);
      const moduleIds = (
        await tx.module.findMany({ where: { courseId }, select: { id: true } })
      ).map((m: { id: string }) => m.id);

      // Collect session IDs from batches and modules
      const orConditions: Record<string, unknown>[] = [];
      if (batchIds.length) orConditions.push({ batchId: { in: batchIds } });
      if (moduleIds.length) orConditions.push({ moduleId: { in: moduleIds } });
      const sessionIds = orConditions.length
        ? (
            await tx.liveSession.findMany({
              where: { OR: orConditions },
              select: { id: true },
            })
          ).map((s: { id: string }) => s.id)
        : [];

      // Recording → Progress chain
      if (sessionIds.length) {
        const recordingIds = (
          await tx.recording.findMany({
            where: { sessionId: { in: sessionIds } },
            select: { id: true },
          })
        ).map((r: { id: string }) => r.id);
        await tx.progress.deleteMany({
          where: { recordingId: { in: recordingIds } },
        });
        await tx.recording.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });
        await tx.attendance.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });
        await tx.calendarEvent.deleteMany({
          where: { sessionId: { in: sessionIds } },
        });
        await tx.liveSession.deleteMany({ where: { id: { in: sessionIds } } });
      }

      // Assignment chain (assignments may link to course or its batches)
      const assignmentWhere: Record<string, unknown>[] = [{ courseId }];
      if (batchIds.length) assignmentWhere.push({ batchId: { in: batchIds } });
      const assignmentIds = (
        await tx.assignment.findMany({
          where: { OR: assignmentWhere },
          select: { id: true },
        })
      ).map((a: { id: string }) => a.id);

      if (assignmentIds.length) {
        const submissionIds = (
          await tx.assignmentSubmission.findMany({
            where: { assignmentId: { in: assignmentIds } },
            select: { id: true },
          })
        ).map((s: { id: string }) => s.id);
        await tx.assignmentSubmission.deleteMany({
          where: { assignmentId: { in: assignmentIds } },
        });

        await tx.assignment.deleteMany({
          where: { id: { in: assignmentIds } },
        });
      }

      // Enrollment cleanup
      await tx.enrollmentRequest.deleteMany({ where: { courseId } });

      // Quiz → Question (via module)
      if (moduleIds.length) {
        const quizIds = (
          await tx.quiz.findMany({
            where: { moduleId: { in: moduleIds } },
            select: { id: true },
          })
        ).map((q: { id: string }) => q.id);
        await tx.question.deleteMany({ where: { quizId: { in: quizIds } } });
        await tx.quiz.deleteMany({ where: { moduleId: { in: moduleIds } } });
      }

      // Direct course-dependent tables
      await tx.module.deleteMany({ where: { courseId } });
      await tx.batch.deleteMany({ where: { courseId } });
      await tx.note.deleteMany({ where: { courseId } });
      await tx.certificate.deleteMany({ where: { courseId } });
      await tx.mentorshipTicket.deleteMany({ where: { courseId } });

      // Finally delete the course itself
      await tx.course.delete({ where: { id: courseId } });
    });
  },
};
