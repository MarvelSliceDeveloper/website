import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { parseVideoUrl } from "../../utils/video";
import { appendToContentOrder, removeFromContentOrder } from "./module.service";

export const CreatePracticalSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().optional(),
  videoType: z.enum(["upload", "youtube", "vimeo", "loom", "url"]).optional(),
  videoUrl: z.string().url().optional(),
  videoEmbedId: z.string().optional(),
  pdfUrl: z.string().url().optional(),
  resources: z
    .array(z.object({ name: z.string(), url: z.string().url() }))
    .optional(),
});

export const UpdatePracticalSchema = CreatePracticalSchema.partial();

export const practicalService = {
  async getPracticalsByModule(moduleId: string) {
    return prisma.practical.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
    });
  },

  async addPractical(
    moduleId: string,
    data: z.infer<typeof CreatePracticalSchema>,
  ) {
    const module = await prisma.module.findUnique({ where: { id: moduleId } });
    if (!module) throw new Error("Module not found");

    const lastPractical = await prisma.practical.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastPractical?.order ?? -1) + 1;

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

    const practical = await prisma.practical.create({
      data: {
        moduleId,
        title: data.title,
        description: data.description,
        order: nextOrder,
        videoType,
        videoUrl: data.videoUrl,
        videoEmbedId,
        pdfUrl: data.pdfUrl,
        resources: data.resources ?? [],
      },
    });

    await appendToContentOrder(moduleId, "PRACTICAL", practical.id);

    return practical;
  },

  async updatePractical(
    practicalId: string,
    data: z.infer<typeof UpdatePracticalSchema>,
  ) {
    const existing = await prisma.practical.findUnique({
      where: { id: practicalId },
    });
    if (!existing) throw new Error("Practical not found");

    const updateData: Record<string, unknown> = { ...data };
    if (data.videoUrl && data.videoUrl !== existing.videoUrl) {
      const parsed = parseVideoUrl(data.videoUrl);
      if (parsed) {
        updateData.videoType = parsed.type;
        updateData.videoEmbedId = parsed.embedId;
      } else if (!data.videoType) {
        updateData.videoType = "url";
      }
    }

    return prisma.practical.update({
      where: { id: practicalId },
      data: updateData,
    });
  },

  async deletePractical(practicalId: string) {
    const practical = await prisma.practical.findUnique({
      where: { id: practicalId },
    });
    if (!practical) throw new Error("Practical not found");

    await prisma.practical.delete({ where: { id: practicalId } });
    await removeFromContentOrder(practical.moduleId, practicalId);

    const remaining = await prisma.practical.findMany({
      where: { moduleId: practical.moduleId },
      orderBy: { order: "asc" },
    });
    await Promise.all(
      remaining.map((p, index) =>
        prisma.practical.update({
          where: { id: p.id },
          data: { order: index },
        }),
      ),
    );
    return { deleted: true };
  },

  async addResource(
    practicalId: string,
    filename: string,
    originalName: string,
    fileType: string,
    fileSize: number,
    url: string,
  ) {
    const practical = await prisma.practical.findUnique({
      where: { id: practicalId },
    });
    if (!practical) throw new Error("Practical not found");

    const resourceId = require("crypto").randomUUID();
    const resources = Array.isArray(practical.resources)
      ? practical.resources
      : [];

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

    await prisma.practical.update({
      where: { id: practicalId },
      data: { resources },
    });
    return newResource;
  },

  async deleteResource(practicalId: string, resourceId: string) {
    const practical = await prisma.practical.findUnique({
      where: { id: practicalId },
    });
    if (!practical) throw new Error("Practical not found");

    const resources = Array.isArray(practical.resources)
      ? practical.resources
      : [];
    const resource = resources.find((r: any) => r.id === resourceId);
    if (!resource) throw new Error("Resource not found");

    const updatedResources = resources.filter((r: any) => r.id !== resourceId);
    await prisma.practical.update({
      where: { id: practicalId },
      data: { resources: updatedResources },
    });
    return { deleted: true };
  },
};
