import { z } from 'zod';
import { prisma } from '../../utils/prisma';

// --- Zod Schemas ---

export const CreateModuleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  isFreePreview: z.boolean().optional(),
});

export const UpdateModuleSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  isFreePreview: z.boolean().optional(),
});

export const ReorderModulesSchema = z.object({
  moduleIds: z.array(z.string().cuid()),
});

// --- Video URL Parser ---

// Parses a video URL to extract type and embed ID
function parseVideoUrl(url: string): { type: string; embedId: string } | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return { type: 'youtube', embedId: ytMatch[1] };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: 'vimeo', embedId: vimeoMatch[1] };

  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) return { type: 'loom', embedId: loomMatch[1] };

  return null;
}

// --- Service ---

export const moduleService = {
  // Adds a module (container) to a course with auto-assigned order
  async addModule(courseId: string, data: z.infer<typeof CreateModuleSchema>) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (lastModule?.order ?? -1) + 1;

    return prisma.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        order: nextOrder,
        isFreePreview: data.isFreePreview ?? false,
      },
    });
  },

  // Updates a module's title/description
  async updateModule(moduleId: string, data: z.infer<typeof UpdateModuleSchema>) {
    const existing = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!existing) throw new Error('Module not found');

    return prisma.module.update({
      where: { id: moduleId },
      data,
    });
  },

  // Deletes a module and re-orders remaining ones
  async deleteModule(moduleId: string) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error('Module not found');

    await prisma.module.delete({ where: { id: moduleId } });

    // Re-order remaining modules
    const remaining = await prisma.module.findMany({
      where: { courseId: module.courseId },
      orderBy: { order: 'asc' },
    });

    await Promise.all(
      remaining.map((m, index) =>
        prisma.module.update({
          where: { id: m.id },
          data: { order: index },
        })
      )
    );

    return { deleted: true };
  },

  // Reorders modules by an ordered array of IDs
  async reorderModules(courseId: string, moduleIds: string[]) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    // Verify all moduleIds belong to this course
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: { id: true },
    });

    const existingIds = new Set(modules.map((m) => m.id));
    const allBelong = moduleIds.every((id) => existingIds.has(id));
    if (!allBelong) throw new Error('Some module IDs do not belong to this course');

    // Update order for each module
    await Promise.all(
      moduleIds.map((id, index) =>
        prisma.module.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return { reordered: true };
  },

};
