import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware';
import { prisma } from '../../utils/prisma';

const router = Router();

router.use(requireAuth);

// GET /api/courses/enrolled
router.get('/enrolled', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const enrollments = await prisma.enrollmentRequest.findMany({
      where: { userId },
      include: {
        batch: {
          include: {
            course: true,
            instructor: {
              select: { name: true }
            },
            sessions: {
              include: {
                recording: {
                  include: {
                    progress: {
                      where: { userId }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const pendingCourseIds = enrollments.filter(e => !e.batch).map(e => e.courseId);
    const pendingCourses = await prisma.course.findMany({
      where: { id: { in: pendingCourseIds } }
    });

    const courses = enrollments.map(e => {
      if (e.status === 'PENDING' || !e.batch) {
        const course = pendingCourses.find(c => c.id === e.courseId);
        return {
          id: course?.id || e.courseId,
          title: course?.title || 'Unknown Course',
          thumbnail: course?.thumbnailUrl || '📚',
          batchId: '',
          batchLabel: '—',
          instructor: '—',
          progress: 0,
          status: 'PENDING'
        };
      }

      const batch = e.batch;
      const course = batch.course;

      // Calculate progress based on recording watch status
      const sessions = batch.sessions;
      const totalRecordings = sessions.filter(s => s.recording).length;
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
                const percent = Math.min(100, Math.round((watchProgress.watchedSeconds / session.recording.duration) * 100));
                totalWatchedPercent += percent;
              }
            }
          }
        }
        progress = Math.round(totalWatchedPercent / totalRecordings);
      }

      const status = batch.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE';

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnailUrl || '📚',
        batchId: batch.id,
        batchLabel: batch.name,
        instructor: batch.instructor.name,
        progress,
        status
      };
    });

    return res.status(200).json({ courses });
  } catch (error: any) {
    console.error('Error fetching enrolled courses:', error);
    return res.status(500).json({ error: 'Failed to fetch enrolled courses' });
  }
});

// GET /api/courses/catalogue
router.get('/catalogue', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const courses = await prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        modules: {
          include: {
            sessions: true
          }
        },
        batches: {
          where: {
            status: { in: ['UPCOMING', 'ACTIVE'] }
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 1,
          include: {
            instructor: {
              select: { name: true }
            }
          }
        }
      }
    });

    const userEnrollments = await prisma.enrollmentRequest.findMany({
      where: { userId }
    });
    const enrolledCourseIds = new Set(userEnrollments.map(e => e.courseId));

    const catalogue = courses.map(course => {
      const nextBatch = course.batches[0];
      const instructorName = nextBatch?.instructor?.name || 'TBD';
      const nextBatchLabel = nextBatch
        ? nextBatch.startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : 'TBD';

      const durationHours = course.durationMinutes
        ? `${Math.ceil(course.durationMinutes / 60)} weeks`
        : `${course.modules.length * 2} weeks`;

      const tags = (course.tags as string[]) || [];
      const learningObjectives = (course.learningObjectives as string[]) || [];

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnailUrl || '📚',
        duration: durationHours,
        instructor: instructorName,
        price: course.price,
        nextBatch: nextBatchLabel,
        isEnrolled: enrolledCourseIds.has(course.id),
        tags,
        curriculum: course.modules.map(m => ({
          title: m.title,
          sessions: m.sessions.length || 1
        })),
        whatYouLearn: learningObjectives
      };
    });

    return res.status(200).json({ courses: catalogue });
  } catch (error: any) {
    console.error('Error fetching course catalogue:', error);
    return res.status(500).json({ error: 'Failed to fetch course catalogue' });
  }
});

// GET /api/courses/:courseId/content — full course content for enrolled student
router.get('/:courseId/content', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.params;

    // Verify user is enrolled
    const enrollment = await prisma.enrollmentRequest.findFirst({
      where: { userId, courseId, status: 'APPROVED' },
      include: { batch: true }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Not enrolled in this course' });
    }

    const batchId = enrollment.batchId;

    // Fetch course with modules and lessons
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
            quizzes: {
              include: { questions: true }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Fetch batch sessions and recordings
    let sessions: any[] = [];
    let recordings: any[] = [];

    if (batchId) {
      const batchSessions = await prisma.liveSession.findMany({
        where: { batchId },
        orderBy: { scheduledAt: 'asc' },
        include: {
          module: { select: { id: true, title: true } },
          recording: {
            include: {
              progress: {
                where: { userId }
              }
            }
          }
        }
      });

      sessions = batchSessions.map(s => ({
        id: s.id,
        moduleId: s.moduleId,
        moduleTitle: s.module?.title || null,
        scheduledAt: s.scheduledAt,
        endedAt: s.endedAt,
        joinUrl: s.joinUrl,
        isLive: new Date(s.scheduledAt) <= new Date() && (!s.endedAt || new Date(s.endedAt) > new Date()),
        isUpcoming: new Date(s.scheduledAt) > new Date(),
        hasRecording: !!s.recording,
      }));

      recordings = batchSessions
        .filter(s => s.recording)
        .map((s, index) => {
          const rec = s.recording!;
          const progress = rec.progress[0];
          const watchedPercent = progress
            ? progress.completedAt
              ? 100
              : Math.min(100, Math.round((progress.watchedSeconds / rec.duration) * 100))
            : 0;

          return {
            id: rec.id,
            sessionId: s.id,
            moduleId: s.moduleId,
            moduleTitle: s.module?.title || 'Session Recording',
            dayLabel: `Day ${index + 1}`,
            title: s.module?.title || 'Session Recording',
            scheduledAt: s.scheduledAt,
            duration: rec.duration,
            durationLabel: `${Math.floor(rec.duration / 60)}:${String(rec.duration % 60).padStart(2, '0')}`,
            watchedPercent,
            isCompleted: !!progress?.completedAt,
          };
        });
    }

    // Build modules with lessons and completion info
    const modules = course.modules.map(m => {
      const moduleRecordings = recordings.filter(r => r.moduleId === m.id);
      const moduleSessions = sessions.filter(s => s.moduleId === m.id);
      const totalItems = moduleRecordings.length || 1;
      const completedItems = moduleRecordings.filter(r => r.isCompleted).length;
      const completionPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const lessons = m.lessons.map(l => ({
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
        lessons,
        completionPercent,
        recordingsCount: moduleRecordings.length,
        sessionsCount: moduleSessions.length,
        hasQuiz: m.quizzes.length > 0,
      };
    });

    // Overall progress
    const totalRecordings = recordings.length;
    const overallProgress = totalRecordings > 0
      ? Math.round(recordings.reduce((sum, r) => sum + r.watchedPercent, 0) / totalRecordings)
      : 0;

    return res.status(200).json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnailUrl: course.thumbnailUrl,
        status: course.status,
      },
      batch: enrollment.batch ? {
        id: enrollment.batch.id,
        name: enrollment.batch.name,
        status: enrollment.batch.status,
        startDate: enrollment.batch.startDate,
        endDate: enrollment.batch.endDate,
      } : null,
      modules,
      sessions,
      recordings,
      overallProgress,
    });
  } catch (error: any) {
    console.error('Error fetching course content:', error);
    return res.status(500).json({ error: 'Failed to fetch course content' });
  }
});

// POST /api/courses/enroll — student submits enrollment request for a course
router.post('/enroll', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required' });
    }

    // Check course exists and is published
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Course not found or not available' });
    }

    // Check if already enrolled or has a pending request
    const existing = await prisma.enrollmentRequest.findFirst({
      where: { userId, courseId, status: { in: ['PENDING', 'APPROVED'] } },
    });
    if (existing) {
      return res.status(400).json({ error: 'You already have an active enrollment for this course' });
    }

    // Create PENDING enrollment request
    const enrollment = await prisma.enrollmentRequest.create({
      data: {
        userId,
        courseId,
        status: 'PENDING',
      },
    });

    return res.status(201).json({
      message: 'Enrollment request submitted. Admin will review and assign you to a batch.',
      enrollment,
    });
  } catch (error: any) {
    console.error('Error creating enrollment request:', error);
    return res.status(500).json({ error: 'Failed to submit enrollment request' });
  }
});

export const studentCourseRouter = router;
