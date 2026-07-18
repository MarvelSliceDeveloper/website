import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { parseVideoUrl } from "../../utils/video";
import * as fs from "fs";
import * as path from "path";
import { appendToContentOrder, removeFromContentOrder } from "./module.service";

export const CreateLessonSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  videoType: z.enum(["upload", "youtube", "vimeo", "loom", "url"]).optional(),
  videoUrl: z.string().url().optional(),
  videoEmbedId: z.string().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  isFreePreview: z.boolean().optional(),
  resources: z
    .array(z.object({ name: z.string(), url: z.string().url() }))
    .optional(),
});

export const UpdateLessonSchema = CreateLessonSchema.partial();

export const ReorderLessonsSchema = z.object({
  lessonIds: z.array(z.string().cuid()),
});

export const lessonService = {
  async getLessonsByModule(moduleId: string) {
    return prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
    });
  },
  async addLesson(moduleId: string, data: z.infer<typeof CreateLessonSchema>) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastLesson?.order ?? -1) + 1;

    let videoType = data.videoType as string | undefined;
    let videoEmbedId = data.videoEmbedId;
    if (data.videoUrl && !videoType) {
      const parsed = parseVideoUrl(data.videoUrl);
      if (parsed) {
        videoType = parsed.type;
        videoEmbedId = parsed.embedId;
      } else {
        videoType = "url";
      }
    }

    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
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

    await appendToContentOrder(moduleId, "LESSON", lesson.id);

    return lesson;
  },

  async updateLesson(
    lessonId: string,
    data: z.infer<typeof UpdateLessonSchema>,
  ) {
    const existing = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });
    if (!existing) throw new Error("Lesson not found");

    const updateData: any = { ...data };
    if (data.videoUrl && data.videoUrl !== existing.videoUrl) {
      const parsed = parseVideoUrl(data.videoUrl);
      if (parsed) {
        updateData.videoType = parsed.type;
        updateData.videoEmbedId = parsed.embedId;
      } else if (!data.videoType) {
        updateData.videoType = "url";
      }
    }

    return prisma.lesson.update({ where: { id: lessonId }, data: updateData });
  },

  async deleteLesson(lessonId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error("Lesson not found");

    await prisma.lesson.delete({ where: { id: lessonId } });
    await removeFromContentOrder(lesson.moduleId, lessonId);

    const remaining = await prisma.lesson.findMany({
      where: { moduleId: lesson.moduleId },
      orderBy: { order: "asc" },
    });
    await Promise.all(
      remaining.map((l, index) =>
        prisma.lesson.update({ where: { id: l.id }, data: { order: index } }),
      ),
    );
    return { deleted: true };
  },

  async reorderLessons(moduleId: string, lessonIds: string[]) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    const lessons = await prisma.lesson.findMany({
      where: { moduleId },
      select: { id: true },
    });
    const existingIds = new Set(lessons.map((l) => l.id));
    if (!lessonIds.every((id) => existingIds.has(id)))
      throw new Error("Some lesson IDs do not belong to this module");

    await Promise.all(
      lessonIds.map((id, index) =>
        prisma.lesson.update({ where: { id }, data: { order: index } }),
      ),
    );
    return { reordered: true };
  },

  async addResource(
    lessonId: string,
    filename: string,
    originalName: string,
    fileType: string,
    fileSize: number,
    url: string,
  ) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error("Lesson not found");

    const resourceId = require("crypto").randomUUID();
    const resources = Array.isArray(lesson.resources) ? lesson.resources : [];

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

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { resources },
    });
    return newResource;
  },

  async deleteResource(lessonId: string, resourceId: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error("Lesson not found");

    const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
    const resource = resources.find((r: any) => r.id === resourceId);
    if (!resource) throw new Error("Resource not found");

    try {
      const uploadsRoot = path.resolve(__dirname, "..", "..", "..", "uploads");
      const filePath = path.join(
        uploadsRoot,
        (resource as any).url.replace(/^.*\/uploads/, ""),
      );
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {
      console.error("Error deleting resource file:", err);
    }

    const updatedResources = resources.filter((r: any) => r.id !== resourceId);
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { resources: updatedResources },
    });
    return { deleted: true };
  },

  async reorderResources(lessonId: string, resourceIds: string[]) {
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new Error("Lesson not found");

    const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
    const reordered = resourceIds
      .map((id) => resources.find((r: any) => r.id === id))
      .filter(<T>(r: T | undefined): r is T => r != null);

    if (reordered.length !== resourceIds.length)
      throw new Error("Some resource IDs do not belong to this lesson");

    await prisma.lesson.update({
      where: { id: lessonId },
      data: { resources: reordered },
    });
    return { reordered: true };
  },
};
