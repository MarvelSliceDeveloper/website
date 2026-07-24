import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../../middleware/auth.middleware";
import { prisma } from "../../utils/prisma";
import { quizController } from "./quiz.controller";
import { getCached, setCache } from "../../utils/memory-cache";

const router = Router();

router.use(requireAuth);

// GET /api/courses/enrolled
router.get("/enrolled", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Fetch individual enrollments (exclude rejected)
    const enrollments = await prisma.enrollmentRequest.findMany({
      where: { userId, status: { not: "REJECTED" } },
      include: {
        batch: {
          include: {
            course: true,
            instructor: {
              select: { name: true },
            },
            sessions: {
              include: {
                recording: {
                  include: {
                    progress: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const pendingCourseIds = enrollments
      .filter((e) => !e.batch)
      .map((e) => e.courseId);
    const pendingCourses = await prisma.course.findMany({
      where: { id: { in: pendingCourseIds } },
    });

    const individualCourses = enrollments.map((e) => {
      if (e.status === "PENDING" || !e.batch) {
        const course = pendingCourses.find((c) => c.id === e.courseId);
        return {
          id: course?.id || e.courseId,
          title: course?.title || "Unknown Course",
          thumbnail: course?.thumbnailUrl || "📚",
          batchId: "",
          batchLabel: "—",
          instructor: "—",
          progress: 0,
          status: e.status,
          source: "enrollment" as const,
        };
      }

      const batch = e.batch;
      // Individual enrollment batches always have a course assigned
      const course = batch.course!;

      const sessions = batch.sessions;
      const totalRecordings = sessions.filter((s) => s.recording).length;
      let progress = 0;

      if (totalRecordings > 0) {
        let totalWatchedPercent = 0;
        for (const session of sessions) {
          if (session.recording) {
            const watchProgress = session.recording.progress[0];
            if (watchProgress) {
              if (watchProgress.completedAt) {
                totalWatchedPercent += 100;
              } else {
                const percent = Math.min(
                  100,
                  Math.round(
                    (watchProgress.watchedSeconds /
                      session.recording.duration) *
                      100,
                  ),
                );
                totalWatchedPercent += percent;
              }
            }
          }
        }
        progress = Math.round(totalWatchedPercent / totalRecordings);
      }

      const status = batch.status === "COMPLETED" ? "COMPLETED" : "ACTIVE";

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnailUrl || "📚",
        batchId: batch.id,
        batchLabel: batch.name,
        instructor: batch.instructor.name,
        progress,
        status,
        source: "enrollment" as const,
      };
    });

    // Fetch package enrollments
    const packageEnrollments = await prisma.packageEnrollment.findMany({
      where: { userId, status: "APPROVED" },
      include: {
        courses: {
          include: {
            course: true,
            batch: {
              include: {
                instructor: { select: { name: true } },
                courseVisibility: {
                  where: { isVisible: true },
                  select: { courseId: true },
                },
                sessions: {
                  include: {
                    recording: {
                      include: {
                        progress: { where: { userId } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const packageCourses = packageEnrollments.flatMap((pe) =>
      pe.courses
        .filter((pec) => {
          if (!pec.batch) return true;
          return pec.batch.courseVisibility.some(
            (bc) => bc.courseId === pec.course.id,
          );
        })
        .map((pec) => {
          if (!pec.batch) {
            return {
              id: pec.course.id,
              title: pec.course.title,
              thumbnail: pec.course.thumbnailUrl || "📚",
              batchId: "",
              batchLabel: "—",
              instructor: "—",
              progress: 0,
              status: pe.status,
              source: "package" as const,
            };
          }

          const batch = pec.batch;
          // Filter sessions: only show sessions for this course + package-wide sessions (courseId=null)
          const sessions = batch.sessions.filter(
            (s) => !s.courseId || s.courseId === pec.course.id,
          );
          const totalRecordings = sessions.filter((s) => s.recording).length;
          let progress = 0;

          if (totalRecordings > 0) {
            let totalWatchedPercent = 0;
            for (const session of sessions) {
              if (session.recording) {
                const watchProgress = session.recording.progress[0];
                if (watchProgress) {
                  if (watchProgress.completedAt) {
                    totalWatchedPercent += 100;
                  } else {
                    const percent = Math.min(
                      100,
                      Math.round(
                        (watchProgress.watchedSeconds /
                          session.recording.duration) *
                          100,
                      ),
                    );
                    totalWatchedPercent += percent;
                  }
                }
              }
            }
            progress = Math.round(totalWatchedPercent / totalRecordings);
          }

          const status = batch.status === "COMPLETED" ? "COMPLETED" : "ACTIVE";

          return {
            id: pec.course.id,
            title: pec.course.title,
            thumbnail: pec.course.thumbnailUrl || "📚",
            batchId: batch.id,
            batchLabel: batch.name,
            instructor: batch.instructor?.name || "—",
            progress,
            status,
            source: "package" as const,
          };
        }),
    );

    // Merge and deduplicate (prefer individual enrollment if both exist)
    const courseMap = new Map<string, any>();
    for (const course of [...individualCourses, ...packageCourses]) {
      if (!courseMap.has(course.id)) {
        courseMap.set(course.id, course);
      }
    }

    return res.status(200).json({ courses: Array.from(courseMap.values()) });
  } catch (error: any) {
    console.error("Error fetching enrolled courses:", error);
    return res.status(500).json({ error: "Failed to fetch enrolled courses" });
  }
});

// GET /api/courses/catalogue
router.get("/catalogue", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const courses = await prisma.course.findMany({
      where: { status: "PUBLISHED" },
      include: {
        modules: {
          include: {
            sessions: true,
          },
        },
        batches: {
          where: {
            status: { in: ["UPCOMING", "ACTIVE"] },
          },
          orderBy: {
            startDate: "asc",
          },
          take: 1,
          include: {
            instructor: {
              select: { name: true },
            },
          },
        },
      },
    });

    const [userEnrollments, packageCourseEnrollments] = await Promise.all([
      prisma.enrollmentRequest.findMany({ where: { userId } }),
      prisma.packageEnrollmentCourse.findMany({
        where: { enrollment: { userId, status: "APPROVED" } },
        select: { courseId: true },
      }),
    ]);
    const enrolledCourseIds = new Set([
      ...userEnrollments.map((e) => e.courseId),
      ...packageCourseEnrollments.map((p) => p.courseId),
    ]);

    const catalogue = courses.map((course) => {
      const nextBatch = course.batches[0];
      const instructorName = nextBatch?.instructor?.name || "TBD";
      const nextBatchLabel = nextBatch
        ? nextBatch.startDate.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric",
          })
        : "TBD";

      const durationHours = course.durationMinutes
        ? `${Math.ceil(course.durationMinutes / 60)} weeks`
        : `${course.modules.length * 2} weeks`;

      const tags = (course.tags as string[]) || [];
      const learningObjectives = (course.learningObjectives as string[]) || [];

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnailUrl || "📚",
        duration: durationHours,
        instructor: instructorName,
        nextBatch: nextBatchLabel,
        isEnrolled: enrolledCourseIds.has(course.id),
        tags,
        curriculum: course.modules.map((m) => ({
          title: m.title,
          sessions: m.sessions.length || 1,
        })),
        whatYouLearn: learningObjectives,
      };
    });

    return res.status(200).json({ courses: catalogue });
  } catch (error: any) {
    console.error("Error fetching course catalogue:", error);
    return res.status(500).json({ error: "Failed to fetch course catalogue" });
  }
});

// GET /api/courses/:courseId/content — full course content for enrolled student
router.get("/:courseId/content", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    const cacheKey = `content:${courseId}:${userId}`;
    const cached = getCached<object>(cacheKey);
    if (cached) return res.json(cached);

    // Verify user is enrolled (check both individual and package enrollments)
    let batchId: string | null = null;
    let batch: any = null;

    const enrollment = await prisma.enrollmentRequest.findFirst({
      where: { userId, courseId, status: "APPROVED" },
      include: {
        batch: {
          include: {
            instructor: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (enrollment) {
      batchId = enrollment.batchId;
      batch = enrollment.batch;
    } else {
      const packageCourse = await prisma.packageEnrollmentCourse.findFirst({
        where: {
          courseId,
          enrollment: { userId, status: "APPROVED" },
        },
        include: {
          batch: {
            include: {
              instructor: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!packageCourse) {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }

      batchId = packageCourse.batchId;
      batch = packageCourse.batch;
    }

    // Check visibility for package-level batches
    if (batch?.packageId) {
      const bc = await prisma.batchCourseVisibility.findUnique({
        where: { batchId_courseId: { batchId: batch.id, courseId } },
      });
      if (bc && !bc.isVisible) {
        return res
          .status(403)
          .json({ error: "This course is not yet available" });
      }
    }

    // Fetch course with modules and lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        status: true,
        modules: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            isFreePreview: true,
            contentOrder: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                videoType: true,
                videoUrl: true,
                videoEmbedId: true,
                durationSeconds: true,
                isFreePreview: true,
                resources: true,
              },
            },
            quizzes: {
              select: {
                id: true,
                title: true,
                order: true,
                dueDate: true,
                isSpecialExam: true,
                passingScore: true,
                timeLimitMin: true,
                maxAttempts: true,
                examType: true,
                _count: { select: { questions: true } },
              },
              orderBy: { order: "asc" },
            },
            assignments: {
              select: {
                id: true,
                title: true,
                type: true,
                dueDate: true,
                questionPdfUrl: true,
              },
              orderBy: { dueDate: "asc" },
            },
            practicals: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                videoType: true,
                videoUrl: true,
                videoEmbedId: true,
                pdfUrl: true,
                resources: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Fetch batch sessions and recordings
    let sessions: any[] = [];
    let recordings: any[] = [];

    if (batchId) {
      const batchSessions = await prisma.liveSession.findMany({
        where: {
          batchId,
          OR: [{ courseId }, { courseId: null }],
        },
        orderBy: { scheduledAt: "asc" },
        include: {
          module: { select: { id: true, title: true } },
          recording: {
            include: {
              progress: {
                where: { userId },
              },
            },
          },
        },
      });

      sessions = batchSessions.map((s) => ({
        id: s.id,
        moduleId: s.moduleId,
        moduleTitle: s.module?.title || null,
        scheduledAt: s.scheduledAt,
        endedAt: s.endedAt,
        joinUrl: s.joinUrl,
        isLive:
          new Date(s.scheduledAt) <= new Date() &&
          (!s.endedAt || new Date(s.endedAt) > new Date()) &&
          new Date(s.scheduledEndAt) > new Date(),
        isUpcoming: new Date(s.scheduledAt) > new Date(),
        hasRecording: !!s.recording,
      }));

      recordings = batchSessions
        .filter((s) => s.recording)
        .map((s, index) => {
          const rec = s.recording!;
          const progress = rec.progress[0];
          const watchedPercent = progress
            ? progress.completedAt
              ? 100
              : Math.min(
                  100,
                  Math.round((progress.watchedSeconds / rec.duration) * 100),
                )
            : 0;

          return {
            id: rec.id,
            sessionId: s.id,
            moduleId: s.moduleId,
            moduleTitle: s.module?.title || "Session Recording",
            dayLabel: `Day ${index + 1}`,
            title: s.module?.title || "Session Recording",
            scheduledAt: s.scheduledAt,
            duration: rec.duration,
            durationLabel: `${Math.floor(rec.duration / 60)}:${String(rec.duration % 60).padStart(2, "0")}`,
            watchedPercent,
            isCompleted: !!progress?.completedAt,
          };
        });
    }

    // Build modules with lessons and completion info
    const modules = course.modules.map((m) => {
      const moduleRecordings = recordings.filter((r) => r.moduleId === m.id);
      const moduleSessions = sessions.filter((s) => s.moduleId === m.id);
      const totalItems = moduleRecordings.length || 1;
      const completedItems = moduleRecordings.filter(
        (r) => r.isCompleted,
      ).length;
      const completionPercent =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const lessons = m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        order: l.order,
        videoType: l.videoType,
        videoUrl: l.videoUrl,
        videoEmbedId: l.videoEmbedId,
        durationSeconds: l.durationSeconds,
        isFreePreview: l.isFreePreview,
        resources: l.resources,
      }));

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        order: m.order,
        isFreePreview: m.isFreePreview,
        contentOrder: m.contentOrder,
        lessons,
        completionPercent,
        recordingsCount: moduleRecordings.length,
        sessionsCount: moduleSessions.length,
        quizzes: m.quizzes.map((q) => ({
          id: q.id,
          title: q.title,
          questionCount: q._count.questions,
          dueDate: q.dueDate ? q.dueDate.toISOString() : null,
          isSpecialExam: q.isSpecialExam,
          passingScore: q.passingScore,
          timeLimitMin: q.timeLimitMin,
          maxAttempts: q.maxAttempts,
          examType: q.examType,
        })),
        assignments: m.assignments.map((a) => ({
          id: a.id,
          title: a.title,
          type: a.type,
          dueDate: a.dueDate.toISOString(),
          questionPdfUrl: a.questionPdfUrl,
        })),
        practicals: m.practicals.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          order: p.order,
          videoType: p.videoType,
          videoUrl: p.videoUrl,
          videoEmbedId: p.videoEmbedId,
          pdfUrl: p.pdfUrl,
          resources: p.resources,
        })),
      };
    });

    // Overall progress
    const totalRecordings = recordings.length;
    const overallProgress =
      totalRecordings > 0
        ? Math.round(
            recordings.reduce((sum, r) => sum + r.watchedPercent, 0) /
              totalRecordings,
          )
        : 0;

    const body = {
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        status: course.status,
      },
      batch: batch
        ? {
            id: batch.id,
            name: batch.name,
            status: batch.status,
            startDate: batch.startDate,
            endDate: batch.endDate,
            instructor: batch.instructor?.name || "TBD",
          }
        : null,
      modules,
      sessions,
      recordings,
      overallProgress,
    };
    setCache(cacheKey, body);
    return res.status(200).json(body);
  } catch (error: any) {
    console.error("Error fetching course content:", error);
    return res.status(500).json({ error: "Failed to fetch course content" });
  }
});

// POST /api/courses/enroll — student submits enrollment request for a course
router.post("/enroll", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    // Check course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== "PUBLISHED") {
      return res
        .status(404)
        .json({ error: "Course not found or not available" });
    }

    // Check if already enrolled or has a pending request (individual or package)
    const [existingEnrollment, existingPackage] = await Promise.all([
      prisma.enrollmentRequest.findFirst({
        where: { userId, courseId, status: { in: ["PENDING", "APPROVED"] } },
      }),
      prisma.packageEnrollmentCourse.findFirst({
        where: {
          courseId,
          enrollment: { userId, status: { in: ["PENDING", "APPROVED"] } },
        },
      }),
    ]);
    if (existingEnrollment || existingPackage) {
      return res.status(400).json({
        error: "You already have an active enrollment for this course",
      });
    }

    // Create PENDING enrollment request
    const enrollment = await prisma.enrollmentRequest.create({
      data: {
        userId,
        courseId,
        status: "PENDING",
      },
    });

    return res.status(201).json({
      message:
        "Enrollment request submitted. Admin will review and assign you to a batch.",
      enrollment,
    });
  } catch (error: any) {
    console.error("Error creating enrollment request:", error);
    return res
      .status(500)
      .json({ error: "Failed to submit enrollment request" });
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

      // Check for existing attempt
      const existing = await prisma.quizAttempt.findFirst({
        where: { quizId, userId },
      });

      if (existing) {
        return res
          .status(400)
          .json({ error: "Quiz already submitted", attempt: existing });
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
      const passingScore = quiz.passingScore ?? 65;
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

export const studentCourseRouter = router;
