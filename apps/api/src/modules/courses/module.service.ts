import { z } from 'zod';
import { prisma } from '../../utils/prisma';
import * as fs from 'fs';
import * as path from 'path';

// --- Zod Schemas ---

export const CreateModuleSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  videoType: z.enum(['upload', 'youtube', 'vimeo', 'loom', 'url']).optional(),
  videoUrl: z.string().url().optional(),
  videoEmbedId: z.string().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  isFreePreview: z.boolean().optional(),
  resources: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
  })).optional(),
});

export const UpdateModuleSchema = CreateModuleSchema.partial();

export const ReorderModulesSchema = z.object({
  moduleIds: z.array(z.string().cuid()),
});

// --- Video URL Parser ---

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
  /**
   * Add a module to a course. Auto-assigns next sort order.
   */
  async addModule(courseId: string, data: z.infer<typeof CreateModuleSchema>) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error('Course not found');

    // Get the next order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (lastModule?.order ?? -1) + 1;

    // Auto-parse video URL if provided
    let videoType = data.videoType as string | undefined;
    let videoEmbedId = data.videoEmbedId;

    if (data.videoUrl && !videoType) {
      const parsed = parseVideoUrl(data.videoUrl);
      if (parsed) {
        videoType = parsed.type;
        videoEmbedId = parsed.embedId;
      } else {
        videoType = 'url';
      }
    }

    return prisma.module.create({
      data: {
        courseId,
        title: data.title,
        description: data.description,
        order: nextOrder,
        videoType,
        videoUrl: data.videoUrl,
        videoEmbedId,
        durationSeconds: data.durationSeconds,
        isFreePreview: data.isFreePreview ?? false,
        resources: data.resources ?? [],
      },
    });
  },

  /**
   * Update a module.
   */
  async updateModule(moduleId: string, data: z.infer<typeof UpdateModuleSchema>) {
    const existing = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!existing) throw new Error('Module not found');

    const updateData: any = { ...data };

    // Re-parse video URL if it changed
    if (data.videoUrl && data.videoUrl !== existing.videoUrl) {
      const parsed = parseVideoUrl(data.videoUrl);
      if (parsed) {
        updateData.videoType = parsed.type;
        updateData.videoEmbedId = parsed.embedId;
      } else if (!data.videoType) {
        updateData.videoType = 'url';
      }
    }

    return prisma.module.update({
      where: { id: moduleId },
      data: updateData,
    });
  },

  /**
   * Delete a module. Re-orders remaining modules.
   */
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

  /**
   * Reorder modules via drag-and-drop.
   * Receives an ordered array of module IDs.
   */
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

  /**
   * Add a resource file to a module
   */
  async addResource(
    moduleId: string,
    filename: string,
    originalName: string,
    fileType: string,
    fileSize: number,
    url: string
  ) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error('Module not found');

    const resourceId = require('crypto').randomUUID();
    const resources = Array.isArray(module.resources) ? module.resources : [];

    const newResource = {
      id: resourceId,
      name: filename,
      originalName,
      url,
      fileType,
      size: fileSize,
      uploadedAt: new Date().toISOString(),
    };

    resources.push(newResource);

    await prisma.module.update({
      where: { id: moduleId },
      data: { resources },
    });

    return newResource;
  },

  /**
   * Delete a resource file from a module
   */
  async deleteResource(moduleId: string, resourceId: string) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error('Module not found');

    const resources = Array.isArray(module.resources) ? module.resources : [];
    const resource = resources.find((r: any) => r.id === resourceId);

    if (!resource) throw new Error('Resource not found');

    // Delete file from disk
    try {
      const uploadsRoot = path.resolve(__dirname, '..', '..', '..', 'uploads');
      const filePath = path.join(uploadsRoot, (resource as any).url.replace(/^.*\/uploads/, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting resource file:', err);
    }

    // Remove from resources array
    const updatedResources = resources.filter((r: any) => r.id !== resourceId);

    await prisma.module.update({
      where: { id: moduleId },
      data: { resources: updatedResources },
    });

    return { deleted: true };
  },
};
