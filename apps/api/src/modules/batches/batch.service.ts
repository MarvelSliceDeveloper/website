import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { UserRole } from "@lms/types";

// --- Zod Schemas ---

export const CreateBatchSchema = z.object({
  courseId: z.string().cuid(),
  instructorId: z.string().cuid(),
  name: z.string().min(3).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxStudents: z.number().int().min(1).optional(),
  description: z.string().optional(),
});

export const UpdateBatchSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxStudents: z.number().int().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED"]).optional(),
  isActive: z.boolean().optional(),
});

export const AddStudentsSchema = z.object({
  userIds: z.array(z.string().cuid()).min(1),
});

// --- Service ---

export const batchService = {
  // Creates a new batch linked to a course
  async createBatch(data: z.infer<typeof CreateBatchSchema>) {
    // Verify the course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new Error("Course not found");

    // Verify the instructor exists and has INSTRUCTOR role
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId },
    });
    if (!instructor) throw new Error("Instructor not found");
    if (instructor.role !== "INSTRUCTOR" && instructor.role !== "ADMIN" && instructor.role !== "SUPER_ADMIN") {
      throw new Error("User is not an instructor");
    }

    return prisma.batch.create({
      data: {
        courseId: data.courseId,
        instructorId: data.instructorId,
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        maxStudents: data.maxStudents,
        description: data.description,
        status: "UPCOMING",
      },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });
  },

  // Lists batches with optional filters
  async listBatches(filters: {
    courseId?: string;
    status?: string;
    search?: string;
    instructorId?: string;
  }) {
    const where: any = {};

    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.status) where.status = filters.status;
    if (filters.instructorId) where.instructorId = filters.instructorId;
    if (filters.search) {
      where.name = { contains: filters.search, mode: "insensitive" };
    }

    return prisma.batch.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            enrollments: { where: { status: "APPROVED" } },
            sessions: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  },

  // Gets a single batch with full details
  async getBatchById(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
        enrollments: {
          include: {
            user: { select: { id: true, name: true, email: true } },
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
    return batch;
  },

  // Updates batch details
  async updateBatch(batchId: string, data: z.infer<typeof UpdateBatchSchema>) {
    const existing = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!existing) throw new Error("Batch not found");

    const updateData: any = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    return prisma.batch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        course: { select: { id: true, title: true } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });
  },

  // Hard-deletes a batch if no enrollments exist
  async deleteBatch(batchId: string) {
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

    await prisma.batch.delete({ where: { id: batchId } });
    return { deleted: true };
  },

  // Lists enrolled students in a batch
  async listStudents(batchId: string) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");

    return prisma.enrollmentRequest.findMany({
      where: { batchId, status: "APPROVED" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { appliedAt: "desc" },
    });
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
            courseId: batch.courseId,
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
      if (batch.instructorId !== authUser.userId)
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
};
