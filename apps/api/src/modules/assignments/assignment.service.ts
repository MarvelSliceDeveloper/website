import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { notificationService } from "../notifications/notification.service";
import { paginate } from "../../utils/paginate";

// ── Zod Schemas ──────────────────────────────────────────────────────────────

// Schema for creating a file-based assignment (PDF questions, file-upload answers)
export const CreateFileAssignmentSchema = z.object({
  courseId: z.string().min(1),
  batchId: z.string().min(1),
  title: z.string().min(3).max(150),
  description: z.string().min(3),
  dueDate: z.string().datetime(),
  maxPoints: z.number().int().min(1).default(100),
  questionPdfUrl: z.string().min(1),
});

export const GradeSubmissionSchema = z.object({
  grade: z.number().int().min(0).max(100),
  feedback: z.string().optional(),
  latePenaltyPercent: z.number().int().min(1).max(25).optional(),
});

export const assignmentService = {
  // ── Helper: verify instructor owns the batch ─────────────────────────────
  // Verifies the instructor owns the given batch
  async _verifyBatchInstructor(
    instructorId: string,
    batchId: string,
    courseId: string,
  ) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { courseMentors: true },
    });
    if (!batch) throw new AppError(404, "Batch not found");
    if (batch.instructorId !== instructorId) {
      const isMentor = batch.courseMentors?.some(
        (m) => m.mentorId === instructorId && m.courseId === courseId,
      );
      if (!isMentor) {
        throw new AppError(403, "You are not the instructor of this batch");
      }
    }
    if (batch.courseId !== courseId) {
      // Package-level batch: verify the course is part of the package
      if (
        batch.courseId === null &&
        batch.packageId &&
        (await prisma.packageCourse.findUnique({
          where: {
            packageId_courseId: {
              packageId: batch.packageId,
              courseId,
            },
          },
        }))
      ) {
        // Course belongs to this package — valid
      } else {
        throw new AppError(400, "Batch does not belong to the selected course");
      }
    }
    return batch;
  },

  // Creates a file-based assignment with a PDF question document
  async createFileAssignment(
    instructorId: string,
    data: z.infer<typeof CreateFileAssignmentSchema>,
    questionPdfUrl: string,
  ) {
    await this._verifyBatchInstructor(
      instructorId,
      data.batchId,
      data.courseId,
    );

    const assignment = await prisma.assignment.create({
      data: {
        courseId: data.courseId,
        batchId: data.batchId,
        title: data.title,
        description: data.description,
        type: "ASSIGNMENT",
        questionPdfUrl,
        dueDate: new Date(data.dueDate),
        maxPoints: data.maxPoints,
      },
    });

    try {
      const enrollments = await prisma.enrollmentRequest.findMany({
        where: { batchId: data.batchId, status: "APPROVED" },
        select: { userId: true },
      });
      if (enrollments.length > 0) {
        await notificationService.createMany(
          enrollments.map((e) => ({
            userId: e.userId,
            title: "New Assignment Posted",
            message: `A new assignment "${data.title}" has been posted.`,
            type: "ASSIGNMENT_CREATED",
            metadata: { assignmentId: assignment.id, batchId: data.batchId },
          })),
        );
      }
    } catch (e) {
      console.error("Failed to send assignment notification:", e);
    }

    return assignment;
  },

  // Lists assignments filtered by role and batch
  async listAssignments(filters: {
    batchId?: string;
    courseId?: string;
    instructorId?: string;
    studentId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { deletedAt: null };
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.instructorId) {
      const mentorCourses = await prisma.batchCourseMentor.findMany({
        where: { mentorId: filters.instructorId },
        select: { batchId: true, courseId: true },
      });

      if (mentorCourses.length > 0) {
        where.OR = mentorCourses.map((mc) => ({
          batchId: mc.batchId,
          courseId: mc.courseId,
        }));
      }
    }
    if (filters.studentId) {
      where.batch = {
        enrollments: {
          some: {
            userId: filters.studentId,
            status: "APPROVED",
          },
        },
      };
    }

    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({
      page: filters.page,
      limit: filters.limit,
    });

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          course: { select: { id: true, title: true } },
          batch: { select: { id: true, name: true, passingScore: true } },
          submissions: filters.studentId
            ? {
                where: { studentId: filters.studentId },
                select: {
                  id: true,
                  status: true,
                  totalScore: true,
                  submittedAt: true,
                },
              }
            : undefined,
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.assignment.count({ where }),
    ]);

    const items = assignments.map((a) => {
      const submission = filters.studentId
        ? (a as any).submissions?.[0] || null
        : null;
      const { submissions: _sub, ...rest } = a as any;
      return {
        ...rest,
        submission,
      };
    });

    return { items, total, page: currentPage, limit: currentLimit };
  },

  // Gets a submission result with score breakdown
  async getSubmissionResult(
    submissionId: string,
    userId: string,
    role: string,
  ) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            batch: true,
          },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!submission) throw new AppError(404, "Submission not found");

    if (role === "STUDENT" && submission.studentId !== userId) {
      throw new AppError(403, "Access denied");
    }
    if (role === "INSTRUCTOR") {
      const batch = (submission as any).assignment?.batch;
      if (batch?.instructorId !== userId) {
        const isMentor = await prisma.batchCourseMentor.findFirst({
          where: {
            batchId: batch?.id,
            mentorId: userId,
            courseId: submission.assignment.courseId,
          },
        });
        if (!isMentor) throw new AppError(403, "Access denied");
      }
    }

    return submission;
  },

  // Lists all student submissions for an assignment
  async listSubmissionsForAssignment(
    assignmentId: string,
    instructorId: string,
    page?: number,
    limit?: number,
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { batch: true },
    });
    if (!assignment) throw new AppError(404, "Assignment not found");
    if (assignment.batch.instructorId !== instructorId) {
      const isMentor = await prisma.batchCourseMentor.findFirst({
        where: {
          batchId: assignment.batchId,
          mentorId: instructorId,
          courseId: assignment.courseId,
        },
      });
      if (!isMentor) {
        throw new AppError(403, "You are not the instructor of this batch");
      }
    }

    const {
      skip,
      take,
      page: currentPage,
      limit: currentLimit,
    } = paginate({ page, limit });

    const [submissions, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where: { assignmentId },
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take,
      }),
      prisma.assignmentSubmission.count({ where: { assignmentId } }),
    ]);

    return {
      items: submissions,
      total,
      page: currentPage,
      limit: currentLimit,
    };
  },

  // Manually grades a submission with score and feedback
  async gradeSubmission(
    instructorId: string,
    submissionId: string,
    grade: number,
    feedback?: string,
    latePenaltyPercent?: number,
  ) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!submission) throw new AppError(404, "Submission not found");
    if (submission.assignment.batch.instructorId !== instructorId) {
      const isMentor = await prisma.batchCourseMentor.findFirst({
        where: {
          batchId: submission.assignment.batchId,
          mentorId: instructorId,
          courseId: submission.assignment.courseId,
        },
      });
      if (!isMentor) {
        throw new AppError(403, "You are not the instructor of this batch");
      }
    }

    const pct = latePenaltyPercent ?? submission.latePenaltyPercent ?? 0;
    const originalScore = grade;
    const penaltyAmount = pct > 0 ? Math.round((grade * pct) / 100) : 0;
    const totalScore = Math.max(0, originalScore - penaltyAmount);

    const passingScore = submission.assignment.batch?.passingScore ?? 50;
    const newStatus = totalScore >= passingScore ? "GRADED" : "PENDING";

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade: String(totalScore),
        feedback: feedback || null,
        status: newStatus,
        gradedAt: new Date(),
        totalScore,
        originalScore,
        latePenaltyPercent: pct > 0 ? pct : null,
        latePenaltyAmount: pct > 0 ? penaltyAmount : null,
      },
    });
    notificationService.notifyAssignmentGraded(submissionId);
    return updated;
  },

  // Submits a file answer for a file-based assignment
  async submitFileAnswer(
    studentId: string,
    assignmentId: string,
    answerFileUrl: string,
    comment?: string,
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        batch: {
          select: {
            lateSubmissionPenaltyPercent: true,
            enrollments: {
              where: { userId: studentId, status: "APPROVED" },
            },
          },
        },
      },
    });

    if (!assignment) throw new AppError(404, "Assignment not found");
    if (assignment.type !== "ASSIGNMENT")
      throw new AppError(400, "This is a quiz, not a file-upload assignment");

    let effectiveDueDate = assignment.dueDate;
    if (assignment.batchId) {
      const ext = await prisma.batchAssignmentExtension.findUnique({
        where: { batchId_assignmentId: { batchId: assignment.batchId, assignmentId } },
        select: { extendedDueDate: true },
      });
      if (ext) effectiveDueDate = ext.extendedDueDate;
    }
    const isLate = effectiveDueDate ? new Date() > effectiveDueDate : false;
    if (assignment.batch) {
      const hasBatchEnrollment = assignment.batch.enrollments.length > 0;
      const hasPackageEnrollment =
        !hasBatchEnrollment &&
        (await prisma.packageEnrollmentCourse.findFirst({
          where: {
            batchId: assignment.batchId!,
            enrollment: { userId: studentId, status: "APPROVED" },
          },
        }));
      if (!hasBatchEnrollment && !hasPackageEnrollment) {
        throw new AppError(403, "You are not enrolled in the batch for this assignment");
      }
    }

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
        answerFileUrl,
        comment,
        status: "PENDING",
        isLate,
        latePenaltyPercent: isLate ? assignment.batch?.lateSubmissionPenaltyPercent ?? null : null,
      },
      update: {
        answerFileUrl,
        comment,
        submittedAt: new Date(),
        status: "PENDING",
        isLate,
        latePenaltyPercent: isLate ? assignment.batch?.lateSubmissionPenaltyPercent ?? null : null,
        grade: null,
        feedback: null,
        gradedAt: null,
        totalScore: null,
        originalScore: null,
        latePenaltyAmount: null,
      },
    });
  },
};
