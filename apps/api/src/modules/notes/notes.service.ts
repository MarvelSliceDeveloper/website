import { prisma } from "../../utils/prisma";

export const notesService = {
  async list(
    userId: string,
    courseId?: string,
    moduleId?: string,
    isSticky?: boolean,
  ) {
    const where: any = { userId };
    if (courseId) where.courseId = courseId;
    if (moduleId) where.moduleId = moduleId;
    if (isSticky !== undefined) where.isSticky = isSticky;
    return prisma.note.findMany({
      where,
      orderBy: [{ isSticky: "desc" }, { updatedAt: "desc" }],
      include: { course: { select: { id: true, title: true } } },
    });
  },

  async get(id: string, userId: string) {
    return prisma.note.findFirst({ where: { id, userId } });
  },

  async create(data: {
    userId: string;
    courseId: string;
    moduleId?: string;
    title: string;
    body: string;
    isSticky?: boolean;
  }) {
    return prisma.note.create({ data });
  },

  async update(
    id: string,
    userId: string,
    data: { title?: string; body?: string; isSticky?: boolean },
  ) {
    return prisma.note.updateMany({ where: { id, userId }, data });
  },

  async delete(id: string, userId: string) {
    return prisma.note.deleteMany({ where: { id, userId } });
  },
};
