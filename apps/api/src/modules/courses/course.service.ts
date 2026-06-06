import { z } from 'zod';
import { prisma } from '../../utils/prisma';

// --- Zod Schemas ---

export const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.number().min(0),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().optional(),
  coverImageUrl: z.string().url().optional(),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  category: z.string().max(100).nullable().optional(),
  tags: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
});

// --- Helpers ---

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

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
    console.warn('Could not verify slug uniqueness (DB may be outdated):', err.message || err);
    return baseSlug;
  }

  return slug;
}

// --- Service ---

export const courseService = {
  /**
   * Create a new course in DRAFT status.
   */
  async createCourse(adminUserId: string, data: z.infer<typeof CreateCourseSchema>) {
    const slug = await ensureUniqueSlug(generateSlug(data.title));

    return prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        category: data.category,
        tags: data.tags ?? [],
        learningObjectives: data.learningObjectives ?? [],
        thumbnailUrl: data.thumbnailUrl,
        coverImageUrl: data.coverImageUrl,
        createdBy: adminUserId,
        status: 'DRAFT',
      },
    });
  },

  /**
   * List courses with optional filters.
   */
  async listCourses(filters: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    // Exclude archived by default unless explicitly requested
    if (!filters.status) {
      where.status = { not: 'ARCHIVED' };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: { select: { modules: true, batches: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.course.count({ where }),
    ]);

    return { courses, total, page, limit };
  },

  /**
   * Get a single course by ID with its modules.
   */
  async getCourseById(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
        },
        _count: { select: { batches: true } },
      },
    });

    if (!course) throw new Error('Course not found');
    return course;
  },

  /**
   * Update course fields.
   */
  async updateCourse(courseId: string, data: z.infer<typeof UpdateCourseSchema>) {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) throw new Error('Course not found');

    const updateData: any = { ...data };

    // If title changed, regenerate slug
    if (data.title && data.title !== existing.title) {
      updateData.slug = await ensureUniqueSlug(generateSlug(data.title));
    }

    return prisma.course.update({
      where: { id: courseId },
      data: updateData,
    });
  },

  /**
   * Soft-delete a course (set status to ARCHIVED).
   */
  async deleteCourse(courseId: string) {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) throw new Error('Course not found');

    return prisma.course.update({
      where: { id: courseId },
      data: { status: 'ARCHIVED' },
    });
  },

  /**
   * Publish a course after validation.
   * Returns a checklist with pass/fail status per item.
   */
  async publishCourse(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { modules: true },
    });

    if (!course) throw new Error('Course not found');

    // Pre-publish checklist
    const checklist = [
      { item: 'Course has a title', passed: !!course.title },
      { item: 'Course has a description', passed: !!course.description && course.description.length > 0 },
      { item: 'At least one module exists', passed: course.modules.length > 0 },
      { item: 'At least one module has a video', passed: course.modules.some(m => !!m.videoUrl || !!m.videoEmbedId) },
      { item: 'Thumbnail image is uploaded', passed: !!course.thumbnailUrl },
    ];

    const allPassed = checklist.every(c => c.passed);

    if (!allPassed) {
      return { published: false, checklist };
    }

    // Compute total duration from modules
    const totalSeconds = course.modules.reduce((sum, m) => sum + (m.durationSeconds || 0), 0);

    await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        durationMinutes: Math.ceil(totalSeconds / 60) || null,
      },
    });

    return { published: true, checklist };
  },

  /**
   * Unpublish a course (revert to DRAFT).
   */
  async unpublishCourse(courseId: string) {
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) throw new Error('Course not found');
    if (existing.status !== 'PUBLISHED') throw new Error('Course is not published');

    return prisma.course.update({
      where: { id: courseId },
      data: { status: 'DRAFT', publishedAt: null },
    });
  },
};
