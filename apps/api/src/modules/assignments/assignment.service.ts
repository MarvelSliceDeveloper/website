import { z } from "zod";
import { prisma } from "../../utils/prisma";
import { notificationService } from "../notifications/notification.service";

// ── Zod Schemas ──────────────────────────────────────────────────────────────

// Schema for creating a QUIZ (MCQ-based, auto-graded)
export const CreateQuizSchema = z.object({
  courseId: z.string().cuid(),
  batchId: z.string().cuid(),
  title: z.string().min(3).max(150),
  description: z.string().min(3),
  dueDate: z.string().datetime(),
  maxPoints: z.number().int().min(1).default(100),
  questions: z
    .array(
      z.object({
        questionText: z.string().min(1),
        marks: z.number().int().min(1).default(1),
        options: z
          .array(
            z.object({
              optionText: z.string().min(1),
              isCorrect: z.boolean().default(false),
            }),
          )
          .min(2)
          .max(10),
      }),
    )
    .min(1),
});

// Schema for creating an ASSIGNMENT (PDF questions, file-upload answers)
export const CreateFileAssignmentSchema = z.object({
  courseId: z.string().cuid(),
  batchId: z.string().cuid(),
  title: z.string().min(3).max(150),
  description: z.string().min(3),
  dueDate: z.string().datetime(),
  maxPoints: z.number().int().min(1).default(100),
  questionPdfUrl: z.string().min(1),
});

export const SubmitMcqAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid(),
        selectedOptionId: z.string().cuid(),
      }),
    )
    .min(1),
});

export const GradeSubmissionSchema = z.object({
  grade: z.string().min(1),
  feedback: z.string().optional(),
});

export const assignmentService = {
  // ── Helper: verify instructor owns the batch ─────────────────────────────
  // Verifies the instructor owns the given batch
  async _verifyBatchInstructor(
    instructorId: string,
    batchId: string,
    courseId: string,
  ) {
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new Error("Batch not found");
    if (batch.instructorId !== instructorId) {
      throw new Error("You are not the instructor of this batch");
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
        throw new Error("Batch does not belong to the selected course");
      }
    }
    return batch;
  },

  // Creates a new MCQ quiz with nested questions and options
  async createQuiz(
    instructorId: string,
    data: z.infer<typeof CreateQuizSchema>,
  ) {
    await this._verifyBatchInstructor(
      instructorId,
      data.batchId,
      data.courseId,
    );

    return prisma.assignment.create({
      data: {
        courseId: data.courseId,
        batchId: data.batchId,
        title: data.title,
        description: data.description,
        type: "QUIZ",
        dueDate: new Date(data.dueDate),
        maxPoints: data.maxPoints,
        questions: {
          create: data.questions.map((q, qIndex) => ({
            questionText: q.questionText,
            marks: q.marks,
            orderIndex: qIndex,
            options: {
              create: q.options.map((opt) => ({
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });
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

    return prisma.assignment.create({
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
  },

  // Lists assignments filtered by role and batch
  async listAssignments(filters: {
    batchId?: string;
    courseId?: string;
    instructorId?: string;
    studentId?: string;
  }) {
    const where: any = {};
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.courseId) where.courseId = filters.courseId;
    if (filters.instructorId) {
      where.batch = { instructorId: filters.instructorId };
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

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
        batch: { select: { id: true, name: true } },
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
        _count: { select: { submissions: true, questions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return assignments.map((a) => {
      const submission = filters.studentId ? a.submissions[0] || null : null;
      const { submissions, ...rest } = a;
      return {
        ...rest,
        submission,
      };
    });
  },

  // Fetches assignment questions; hides correct answers from students
  async getAssignmentQuestions(
    assignmentId: string,
    userId: string,
    isInstructor: boolean,
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        batch: true,
        questions: {
          orderBy: { orderIndex: "asc" },
          include: {
            options: true,
          },
        },
      },
    });

    if (!assignment) throw new Error("Assignment not found");

    if (!isInstructor) {
      // Check enrollment via EnrollmentRequest or PackageEnrollmentCourse
      // (same pattern as the course content endpoint)
      const enrollmentRequest = await prisma.enrollmentRequest.findFirst({
        where: {
          userId,
          courseId: assignment.courseId,
          batchId: assignment.batchId,
          status: "APPROVED",
        },
      });

      if (!enrollmentRequest) {
        const packageCourse = await prisma.packageEnrollmentCourse.findFirst({
          where: {
            courseId: assignment.courseId,
            batchId: assignment.batchId,
            enrollment: { userId, status: "APPROVED" },
          },
        });

        if (!packageCourse) {
          throw new Error("You are not enrolled in this batch");
        }
      }
    }

    const questions = assignment.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      marks: q.marks,
      orderIndex: q.orderIndex,
      options: q.options.map((o) => ({
        id: o.id,
        optionText: o.optionText,
        isCorrect: isInstructor ? o.isCorrect : undefined,
      })),
    }));

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      maxPoints: assignment.maxPoints,
      type: assignment.type,
      questionPdfUrl: assignment.questionPdfUrl,
      questions,
    };
  },

  // Auto-grades MCQ answers submitted by a student
  async submitMcqAnswers(
    studentId: string,
    assignmentId: string,
    answers: { questionId: string; selectedOptionId: string }[],
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        batch: {
          include: {
            enrollments: {
              where: { userId: studentId, status: "APPROVED" },
            },
          },
        },
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!assignment) throw new Error("Assignment not found");

    if (new Date() > assignment.dueDate) {
      throw new Error("Assignment due date has passed");
    }

    if (assignment.batch.enrollments.length === 0) {
      throw new Error("You are not enrolled in the batch for this assignment");
    }

    const existing = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId,
        },
      },
    });
    if (existing) throw new Error("You have already submitted this assignment");

    return prisma.$transaction(async (tx) => {
      const submission = await tx.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId,

          status: "PENDING",
        },
      });

      let totalScore = 0;
      const responsesData: Array<{
        submissionId: string;
        questionId: string;
        selectedOptionId: string;
        isCorrect: boolean;
      }> = [];

      for (const ans of answers) {
        const question = assignment.questions.find(
          (q) => q.id === ans.questionId,
        );
        if (!question) throw new Error(`Question ${ans.questionId} not found`);

        const option = question.options.find(
          (o) => o.id === ans.selectedOptionId,
        );
        if (!option)
          throw new Error(`Option ${ans.selectedOptionId} not found`);

        const isCorrect = option.isCorrect;
        if (isCorrect) {
          totalScore += question.marks;
        }

        responsesData.push({
          submissionId: submission.id,
          questionId: ans.questionId,
          selectedOptionId: ans.selectedOptionId,
          isCorrect,
        });
      }

      await tx.studentQuestionResponse.createMany({
        data: responsesData,
      });

      const grade = `${totalScore}/${assignment.maxPoints}`;

      const updated = await tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          status: "GRADED",
          totalScore,
          grade,
          feedback: "Auto-graded by System.",
          gradedAt: new Date(),
        },
        include: {
          questionResponses: true,
        },
      });
      notificationService.notifyAssignmentGraded(submission.id);
      return updated;
    });
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
            questions: {
              orderBy: { orderIndex: "asc" },
              include: {
                options: true,
              },
            },
          },
        },
        student: {
          select: { id: true, name: true, email: true },
        },
        questionResponses: true,
      },
    });

    if (!submission) throw new Error("Submission not found");

    if (role === "STUDENT" && submission.studentId !== userId) {
      throw new Error("Access denied");
    }
    if (
      role === "INSTRUCTOR" &&
      submission.assignment.batch.instructorId !== userId
    ) {
      throw new Error("Access denied");
    }

    return submission;
  },

  // Lists all student submissions for an assignment
  async listSubmissionsForAssignment(
    assignmentId: string,
    instructorId: string,
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { batch: true },
    });
    if (!assignment) throw new Error("Assignment not found");
    if (assignment.batch.instructorId !== instructorId) {
      throw new Error("You are not the instructor of this batch");
    }

    return prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  },

  // Manually grades a submission with score and feedback
  async gradeSubmission(
    instructorId: string,
    submissionId: string,
    grade: string,
    feedback?: string,
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

    if (!submission) throw new Error("Submission not found");
    if (submission.assignment.batch.instructorId !== instructorId) {
      throw new Error("You are not the instructor of this batch");
    }

    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback: feedback || null,
        status: "GRADED",
        gradedAt: new Date(),
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
  ) {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        batch: {
          include: {
            enrollments: {
              where: { userId: studentId, status: "APPROVED" },
            },
          },
        },
      },
    });

    if (!assignment) throw new Error("Assignment not found");
    if (assignment.type !== "ASSIGNMENT")
      throw new Error("This is a quiz, not a file-upload assignment");
    if (new Date() > assignment.dueDate)
      throw new Error("Assignment due date has passed");
    if (assignment.batch.enrollments.length === 0) {
      throw new Error("You are not enrolled in the batch for this assignment");
    }

    // Upsert — allow re-submission before grading
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
        status: "PENDING",
      },
      update: {
        answerFileUrl,
        submittedAt: new Date(),
      },
    });
  },
};
