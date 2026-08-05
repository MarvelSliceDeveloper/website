import { prisma } from "../../utils/prisma";
import { AppError } from "../../utils/errors";
import { resolveEffectiveDueDate } from "../../services/due-date.service";

// Business logic for the student course endpoints (enrolled list, catalogue,
// course content, enrollment requests). Kept separate from the route layer so
// the heavy data fetching/transformation can be unit-tested in isolation.

// GET /api/courses/enrolled — list the user's enrolled courses (individual +
// package), computing watch progress from session recordings.
export async function getEnrolledCourses(userId: string) {
  // Fetch individual enrollments (exclude rejected)
  const enrollments = await prisma.enrollmentRequest.findMany({
    where: { userId, status: { not: "REJECTED" } },
    include: {
      batch: {
        include: {
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
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

    const recordings = batch.sessions.filter((s) => s.recording);
    // Only video lessons participate in progress (text-only lessons can't be watched)
    const videoLessons = (course?.modules ?? []).flatMap((m) =>
      m.lessons.filter((l) => l.videoUrl || l.videoEmbedId),
    );
    const totalItems = recordings.length + videoLessons.length;
    let progress = 0;

    if (totalItems > 0) {
      let totalWatchedPercent = 0;
      for (const session of recordings) {
        if (!session.recording) continue;
        const watchProgress = session.recording.progress[0];
        if (watchProgress) {
          if (watchProgress.completedAt) {
            totalWatchedPercent += 100;
          } else {
            const percent = Math.min(
              100,
              Math.round(
                (watchProgress.watchedSeconds / session.recording.duration) *
                  100,
              ),
            );
            totalWatchedPercent += percent;
          }
        }
      }
      for (const lesson of videoLessons) {
        const lp = lesson.progress?.[0];
        if (lp) {
          if (lp.completedAt) {
            totalWatchedPercent += 100;
          } else {
            const percent = Math.min(
              100,
              Math.round(
                (lp.watchedSeconds / Math.max(1, lesson.durationSeconds ?? 1)) *
                  100,
              ),
            );
            totalWatchedPercent += percent;
          }
        }
      }
      progress = Math.round(totalWatchedPercent / totalItems);
    }

    const status = batch.status === "COMPLETED" ? "COMPLETED" : "ACTIVE";

    return {
      id: course.id,
      title: course.title,
      thumbnail: course.thumbnailUrl || "📚",
      batchId: batch.id,
      batchLabel: batch.name,
      instructor: batch.instructor?.name ?? "Unknown",
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
          course: {
            include: {
              modules: {
                include: {
                  lessons: {
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
        const recordings = sessions.filter((s) => s.recording);
        // Only video lessons participate in progress (text-only lessons can't be watched)
        const videoLessons = (pec.course.modules ?? []).flatMap((m) =>
          m.lessons.filter((l) => l.videoUrl || l.videoEmbedId),
        );
        const totalItems = recordings.length + videoLessons.length;
        let progress = 0;

        if (totalItems > 0) {
          let totalWatchedPercent = 0;
          for (const session of recordings) {
            if (!session.recording) continue;
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
          for (const lesson of videoLessons) {
            const lp = lesson.progress?.[0];
            if (lp) {
              if (lp.completedAt) {
                totalWatchedPercent += 100;
              } else {
                const percent = Math.min(
                  100,
                  Math.round(
                    (lp.watchedSeconds /
                      Math.max(1, lesson.durationSeconds ?? 1)) *
                      100,
                  ),
                );
                totalWatchedPercent += percent;
              }
            }
          }
          progress = Math.round(totalWatchedPercent / totalItems);
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

  return { courses: Array.from(courseMap.values()) };
}

// GET /api/courses/catalogue — list published courses with next batch info and
// whether the user is already enrolled.
export async function getCatalogue(userId: string) {
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

  return { courses: catalogue };
}

// GET /api/courses/:courseId/content — full course content for enrolled student.
// Heavy load (enrollment checks + multi-level includes); route wraps this in
// getCachedSingleFlight to collapse concurrent cache misses.
export async function loadCourseContent(userId: string, courseId: string) {
  // Verify user is enrolled (check both individual and package enrollments)
  let batchId: string | null = null;
  let batch: any = null;
  let enrollmentDate: Date | null = null;

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
    enrollmentDate = enrollment.appliedAt;
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
        enrollment: { select: { createdAt: true } },
      },
    });

    if (!packageCourse) {
      throw new AppError(403, "Not enrolled in this course");
    }

    batchId = packageCourse.batchId;
    batch = packageCourse.batch;
    enrollmentDate = packageCourse.enrollment.createdAt;
  }

  // Check visibility for package-level batches
  if (batch?.packageId) {
    const bc = await prisma.batchCourseVisibility.findUnique({
      where: { batchId_courseId: { batchId: batch.id, courseId } },
    });
    if (bc && !bc.isVisible) {
      throw new AppError(403, "This course is not yet available");
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
              progress: {
                where: { userId },
                select: { watchedSeconds: true, completedAt: true },
              },
            },
          },
          quizzes: {
            select: {
              id: true,
              title: true,
              order: true,
              dueDate: true,
              daysFromEnrollment: true,
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
              description: true,
              maxPoints: true,
              dueDate: true,
              daysFromEnrollment: true,
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
    throw new AppError(404, "Course not found");
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
          watchedSeconds: progress?.watchedSeconds ?? 0,
          isCompleted: !!progress?.completedAt,
        };
      });
  }

  // Build modules with lessons and completion info
  const modules = course.modules.map((m) => {
    const moduleRecordings = recordings.filter((r) => r.moduleId === m.id);
    const moduleSessions = sessions.filter((s) => s.moduleId === m.id);

    const lessons = m.lessons.map((l) => {
      const lp = l.progress?.[0];
      const watchedPercent = lp
        ? lp.completedAt
          ? 100
          : Math.min(
              100,
              Math.round(
                (lp.watchedSeconds / Math.max(1, l.durationSeconds ?? 1)) * 100,
              ),
            )
        : 0;
      return {
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
        watchedPercent,
        watchedSeconds: lp?.watchedSeconds ?? 0,
        isCompleted: !!lp?.completedAt,
      };
    });

    // Only video lessons participate in progress (text-only lessons can't be watched)
    const videoLessons = lessons.filter((l) => l.videoUrl || l.videoEmbedId);
    const totalItems = moduleRecordings.length + videoLessons.length;
    const completedItems =
      moduleRecordings.filter((r) => r.isCompleted).length +
      videoLessons.filter((l) => l.isCompleted).length;
    const completionPercent =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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
      quizzes: m.quizzes.map((q) => {
        const effectiveDueDate = resolveEffectiveDueDate(
          q.dueDate,
          q.daysFromEnrollment,
          enrollmentDate,
        );
        return {
          id: q.id,
          title: q.title,
          questionCount: q._count.questions,
          dueDate: effectiveDueDate ? effectiveDueDate.toISOString() : null,
          isSpecialExam: q.isSpecialExam,
          passingScore: q.passingScore,
          timeLimitMin: q.timeLimitMin,
          maxAttempts: q.maxAttempts,
          examType: q.examType,
        };
      }),
      assignments: m.assignments.map((a) => {
        const effectiveDueDate = resolveEffectiveDueDate(
          a.dueDate,
          a.daysFromEnrollment,
          enrollmentDate,
        );
        return {
          id: a.id,
          title: a.title,
          type: a.type,
          description: a.description,
          maxPoints: a.maxPoints,
          dueDate: effectiveDueDate ? effectiveDueDate.toISOString() : null,
          questionPdfUrl: a.questionPdfUrl,
        };
      }),
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
  const progressPercentages = [
    ...recordings.map((r) => r.watchedPercent),
    ...modules.flatMap((m) =>
      m.lessons
        .filter((l) => l.videoUrl || l.videoEmbedId)
        .map((l) => l.watchedPercent),
    ),
  ];
  const overallProgress =
    progressPercentages.length > 0
      ? Math.round(
          progressPercentages.reduce((sum, p) => sum + p, 0) /
            progressPercentages.length,
        )
      : 0;

  return {
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
          examEnabled: batch.examEnabled,
        }
      : null,
    modules,
    sessions,
    recordings,
    overallProgress,
  };
}

// POST /api/courses/enroll — student submits an enrollment request.
export async function requestEnrollment(userId: string, courseId: string) {
  if (!courseId) {
    throw new AppError(400, "courseId is required");
  }

  // Check course exists and is published
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.status !== "PUBLISHED") {
    throw new AppError(404, "Course not found or not available");
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
    throw new AppError(
      400,
      "You already have an active enrollment for this course",
    );
  }

  // Create PENDING enrollment request
  const enrollment = await prisma.enrollmentRequest.create({
    data: {
      userId,
      courseId,
      status: "PENDING",
    },
  });

  return {
    message:
      "Enrollment request submitted. Admin will review and assign you to a batch.",
    enrollment,
  };
}

// POST /api/courses/lessons/:lessonId/progress — save a student's watch
// progress for a course-content lesson. watchedSeconds is monotonic (never
// regresses on seek-back); completedAt is set when the student has watched
// >=90% of the lesson or explicitly reports completion (videos with unknown
// duration).
export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  watchedSeconds: number,
  completed?: boolean,
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, durationSeconds: true },
  });

  if (!lesson) {
    throw new AppError(404, "Lesson not found");
  }

  const safeSeconds = Math.max(0, Math.floor(Number(watchedSeconds) || 0));

  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { watchedSeconds: true },
  });
  const nextSeconds = Math.max(existing?.watchedSeconds ?? 0, safeSeconds);

  const progress = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, watchedSeconds: nextSeconds },
    update: { watchedSeconds: nextSeconds },
  });

  const isComplete =
    completed === true ||
    (lesson.durationSeconds != null &&
      lesson.durationSeconds > 0 &&
      nextSeconds >= lesson.durationSeconds * 0.9);

  if (isComplete && !progress.completedAt) {
    await prisma.lessonProgress.update({
      where: { id: progress.id },
      data: { completedAt: new Date() },
    });
  }

  return prisma.lessonProgress.findUnique({
    where: { id: progress.id },
  });
}
