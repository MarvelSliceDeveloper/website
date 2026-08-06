import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";
import { quizController } from "./quiz.controller";
import { getCachedSingleFlight } from "../../utils/single-flight-cache";
import { handleControllerError } from "../../utils/errors";
import { moduleService } from "./module.service";
import {
  getEnrolledCourses,
  getCatalogue,
  loadCourseContent,
  requestEnrollment,
  updateLessonProgress,
} from "./student-course.service";
import { getCourseContentProgress } from "../certificates/certificate-completion.service";

const router = Router();

router.use(requireAuth);

// GET /api/courses/enrolled
router.get("/enrolled", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await getEnrolledCourses(userId);
    return res.status(200).json(result);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// GET /api/courses/catalogue
router.get("/catalogue", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const result = await getCatalogue(userId);
    return res.status(200).json(result);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// GET /api/courses/:courseId/content — full course content for enrolled student.
//
// The heavy load (enrollment checks + multi-level includes) is wrapped in
// getCachedSingleFlight so concurrent cache-miss requests collapse into a
// single DB fetch instead of a thundering herd.
router.get("/:courseId/content", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    const cacheKey = `content:${courseId}:${userId}`;
    const body = await getCachedSingleFlight(
      cacheKey,
      () => loadCourseContent(userId, courseId),
      30_000,
    );
    return res.status(200).json(body);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// GET /api/courses/:courseId/progress — certificate completion progress for a course
router.get("/:courseId/progress", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;
    const progress = await getCourseContentProgress(courseId, userId);
    return res.status(200).json(progress);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// POST /api/courses/lessons/:lessonId/progress — save watch progress for a lesson
router.post("/lessons/:lessonId/progress", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { lessonId } = req.params;
    const { watchedSeconds, completed } = req.body ?? {};

    if (watchedSeconds === undefined && completed !== true) {
      return res
        .status(400)
        .json({ error: "watchedSeconds is required (or pass completed: true)" });
    }

    const progress = await updateLessonProgress(
      userId,
      lessonId,
      watchedSeconds,
      completed === true,
    );
    return res.status(200).json({ progress });
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// POST /api/courses/enroll — student submits enrollment request for a course
router.post("/enroll", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.body;
    const result = await requestEnrollment(userId, courseId);
    return res.status(201).json(result);
  } catch (err: unknown) {
    const { statusCode, body } = handleControllerError(err, (req as any).log);
    return res.status(statusCode).json(body);
  }
});

// GET /api/courses/quizzes/:quizId/questions — get a course quiz's questions
router.get("/quizzes/:quizId/questions", quizController.getQuestions);

// POST /api/courses/quizzes/:quizId/submit — submit quiz answers and get score
router.post(
  "/quizzes/:quizId/submit",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { quizId } = req.params;
      const { answers } = req.body; // [{ questionId, selectedOptionId }]

      if (!Array.isArray(answers) || answers.length === 0) {
        return res
          .status(400)
          .json({ error: "answers must be a non-empty array" });
      }

      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: { questions: true },
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Check for existing attempt — allow re-attempt only if previous was failed
      const existing = await prisma.quizAttempt.findFirst({
        where: { quizId, userId },
        orderBy: { createdAt: "desc" },
      });

      if (existing && existing.isPassed) {
        return res.status(400).json({
          error: "You have already passed this quiz",
          attempt: existing,
        });
      }

      // Score the answers
      let score = 0;
      const enrichedAnswers = answers.map(
        (a: { questionId: string; selectedOptionId: string }) => {
          const question = quiz.questions.find((q) => q.id === a.questionId);
          if (!question)
            return {
              questionId: a.questionId,
              selectedOptionId: a.selectedOptionId,
              isCorrect: false,
            };

          const options = question.options as Array<{
            label: string;
            isCorrect: boolean;
          }>;
          const selectedIdx = parseInt(a.selectedOptionId, 10);
          const isCorrect =
            !isNaN(selectedIdx) && options[selectedIdx]?.isCorrect === true;
          if (isCorrect) score++;
          return {
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            isCorrect,
          };
        },
      );

      const total = quiz.questions.length;
      const passingScore = quiz.passingScore ?? 60;
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
      const isPassed = percentage >= passingScore;

      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId,
          userId,
          answers: enrichedAnswers,
          score,
          total,
          percentage,
          isPassed,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      if (process.env.AUTO_CERTIFICATE !== "false") {
        const { checkAndIssueForQuiz } =
          await import("../certificates/certificate-completion.service");
        checkAndIssueForQuiz(quizId, userId).catch((err: unknown) =>
          (req as any).log?.error?.("[certificate] Auto-issue failed:", err),
        );
      }

      return res.status(201).json({
        attemptId: attempt.id,
        score,
        total,
        percentage,
        isPassed,
        passingScore,
        isSpecialExam: quiz.isSpecialExam,
        answers: enrichedAnswers,
        submittedAt: attempt.createdAt,
      });
    } catch (err: unknown) {
      (req as any).log?.error?.("[quiz] Submit failed:", err);
      return res.status(500).json({ error: "Failed to submit quiz" });
    }
  },
);

// GET /api/courses/quizzes/:quizId/attempt — get user's existing attempt for this quiz
router.get(
  "/quizzes/:quizId/attempt",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { quizId } = req.params;

      const attempt = await prisma.quizAttempt.findFirst({
        where: { quizId, userId },
        orderBy: { createdAt: "desc" },
      });

      if (!attempt) {
        return res.status(404).json({ error: "No attempt found" });
      }

      return res.json({
        attemptId: attempt.id,
        score: attempt.score,
        total: attempt.total,
        percentage:
          attempt.total > 0
            ? Math.round((attempt.score / attempt.total) * 100)
            : 0,
        answers: attempt.answers,
        submittedAt: attempt.createdAt,
      });
    } catch (error: any) {
      console.error("Error fetching quiz attempt:", error);
      return res.status(500).json({ error: "Failed to fetch quiz attempt" });
    }
  },
);

// GET /api/courses/:courseId/certification — get certification exam data
router.get(
  "/:courseId/certification",
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.userId;
      const { courseId } = req.params;

      const certModule = await moduleService.getCertificationModule(courseId);
      if (!certModule) {
        return res.json({ module: null, quiz: null, progress: null });
      }

      const quiz = certModule.quizzes[0] ?? null;
      let quizWithQuestions: {
          id: string;
          title: string;
          passingScore: number;
          timeLimitMin: number | null;
          hasMcq: boolean;
          hasAssignment: boolean;
          assignmentInstructions: string | null;
          questionCount: number;
          questions: Array<{
            id: string;
            questionText: string;
            orderIndex: number;
            options: Array<{ id: string; optionText: string }>;
          }>;
        } | null = null;
      if (quiz) {
        const questions = quiz.questions.map((q, qIdx) => {
          const rawOptions = q.options as Array<{
            label: string;
            isCorrect: boolean;
          }>;
          const options = rawOptions.map((opt, oIdx) => ({
            id: `${oIdx}`,
            optionText: opt.label,
          }));
          return {
            id: q.id,
            questionText: q.text,
            orderIndex: qIdx,
            options,
          };
        });

        quizWithQuestions = {
          id: quiz.id,
          title: quiz.title,
          passingScore: quiz.passingScore,
          timeLimitMin: quiz.timeLimitMin,
          hasMcq: quiz.hasMcq,
          hasAssignment: quiz.hasAssignment,
          assignmentInstructions: quiz.assignmentInstructions,
          questionCount: questions.length,
          questions,
        };
      }

      const existingAttempt = quiz
        ? await prisma.quizAttempt.findFirst({
            where: { quizId: quiz.id, userId },
            orderBy: { createdAt: "desc" },
          })
        : null;

      return res.json({
        module: { id: certModule.id, title: certModule.title },
        quiz: quizWithQuestions,
        attempt: existingAttempt
          ? {
              id: existingAttempt.id,
              score: existingAttempt.score,
              total: existingAttempt.total,
              percentage: existingAttempt.percentage,
              isPassed: existingAttempt.isPassed,
              submittedAt: existingAttempt.createdAt,
            }
          : null,
      });
    } catch (err: unknown) {
      (req as any).log?.error?.("[certification] Fetch failed:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch certification data" });
    }
  },
);

export const studentCourseRouter = router;
