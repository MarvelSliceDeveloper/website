import { z } from 'zod';
import { prisma } from '../../utils/prisma';

// --- Zod Schemas ---

export const CreateAssignmentSchema = z.object({
  batchId: z.string().min(1, 'Batch is required'),
  courseId: z.string().min(1, 'Course is required'),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().optional(),
  dueDate: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, 'Due date must be in the future'),
});

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  instructions: z.string().optional(),
  dueDate: z.string().optional(),
});

export const SubmitAssignmentSchema = z.object({
  submissionText: z.string().min(1, 'Submission cannot be empty'),
});

export const GradeSchema = z.object({
  grade: z.string().min(1, 'Grade is required'),
  feedback: z.string().optional(),
});

// --- Service ---

export const assignmentService = {
  /**
   * Create a new assignment
   */
  async createAssignment(
    instructorId: string,
    data: z.infer<typeof CreateAssignmentSchema>
  ) {
    // Verify instructor is assigned to this batch
    const batch = await prisma.batch.findUnique({
      where: { id: data.batchId },
    });

    if (!batch) throw new Error('Batch not found');
    if (batch.instructorId !== instructorId) {
      throw new Error('Only the assigned instructor can create assignments for this batch');
    }

    return prisma.assignment.create({
      data: {
        batchId: data.batchId,
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        instructions: data.instructions || null,
        dueDate: new Date(data.dueDate),
        createdBy: instructorId,
      },
    });
  },

  /**
   * List assignments for instructor
   */
  async listAssignments(instructorId: string, filters: {
    batchId?: string;
    courseId?: string;
  } = {}) {
    return prisma.assignment.findMany({
      where: {
        createdBy: instructorId,
        ...(filters.batchId && { batchId: filters.batchId }),
        ...(filters.courseId && { courseId: filters.courseId }),
      },
      include: {
        batch: true,
        course: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get assignment by ID
   */
  async getAssignmentById(assignmentId: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        batch: true,
        course: true,
        submissions: {
          include: {
            student: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!assignment) throw new Error('Assignment not found');
    return assignment;
  },

  /**
   * Update assignment
   */
  async updateAssignment(
    assignmentId: string,
    creatorId: string,
    data: z.infer<typeof UpdateAssignmentSchema>
  ) {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) throw new Error('Assignment not found');
    if (existing.createdBy !== creatorId) {
      throw new Error('Only the creator can update this assignment');
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.instructions !== undefined) updateData.instructions = data.instructions || null;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);

    return prisma.assignment.update({
      where: { id: assignmentId },
      data: updateData,
    });
  },

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId: string, creatorId: string) {
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing) throw new Error('Assignment not found');
    if (existing.createdBy !== creatorId) {
      throw new Error('Only the creator can delete this assignment');
    }

    return prisma.assignment.delete({
      where: { id: assignmentId },
    });
  },

  /**
   * Submit assignment (student)
   */
  async submitAssignment(
    assignmentId: string,
    studentId: string,
    data: z.infer<typeof SubmitAssignmentSchema>
  ) {
    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new Error('Assignment not found');

    // Check if student is enrolled in the batch
    const enrollment = await prisma.enrollmentRequest.findFirst({
      where: {
        userId: studentId,
        batchId: assignment.batchId,
        status: 'APPROVED',
      },
    });

    if (!enrollment) throw new Error('Student is not enrolled in this batch');

    // Upsert submission
    return prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      create: {
        assignmentId,
        studentId,
        submissionText: data.submissionText,
        status: 'PENDING',
        submittedAt: new Date(),
      },
      update: {
        submissionText: data.submissionText,
        submittedAt: new Date(),
      },
    });
  },

  /**
   * List submissions for assignment (instructor)
   */
  async listSubmissions(
    assignmentId: string,
    instructorId: string,
    filters: { status?: string; page?: number; limit?: number } = {}
  ) {
    // Verify instructor owns the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new Error('Assignment not found');
    if (assignment.createdBy !== instructorId) {
      throw new Error('Only the creator can view submissions');
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { assignmentId };
    if (filters.status) where.status = filters.status;

    const [submissions, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.assignmentSubmission.count({ where }),
    ]);

    return { submissions, total, page, limit };
  },

  /**
   * Grade submission
   */
  async gradeSubmission(
    assignmentId: string,
    studentId: string,
    instructorId: string,
    data: z.infer<typeof GradeSchema>
  ) {
    // Verify instructor owns the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) throw new Error('Assignment not found');
    if (assignment.createdBy !== instructorId) {
      throw new Error('Only the creator can grade submissions');
    }

    // Verify submission exists
    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });

    if (!submission) throw new Error('Submission not found');

    return prisma.assignmentSubmission.update({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
      data: {
        grade: data.grade,
        feedback: data.feedback || null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    });
  },
};
