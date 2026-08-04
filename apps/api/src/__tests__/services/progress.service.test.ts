import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateLessonProgress } from "../../modules/courses/student-course.service";
import { recordingService } from "../../modules/recordings/recording.service";

// Mock Prisma — vi.hoisted() initializes this before the hoisted vi.mock runs
const mockPrisma = vi.hoisted(() => ({
  lesson: { findUnique: vi.fn() },
  lessonProgress: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  recording: { findUnique: vi.fn() },
  progress: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../utils/prisma", () => ({ prisma: mockPrisma }));

// recording.service pulls in the Graph module at import time — stub it out so
// no env/config side effects run during the test.
vi.mock("../../modules/graph/graph.client", () => ({
  GraphError: class GraphError extends Error {},
}));
vi.mock("../../modules/graph/graph.recordings", () => ({
  getMeetingRecordings: vi.fn(),
  getRecordingContent: vi.fn(),
}));
vi.mock("../../modules/notifications/notification.service", () => ({
  notificationService: { notifyRecordingAvailable: vi.fn() },
}));
vi.mock("../../utils/super-admin", () => ({ getSuperAdminId: vi.fn() }));

describe("progress tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateLessonProgress", () => {
    it("throws AppError 404 when the lesson does not exist", async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        updateLessonProgress("user-1", "lesson-missing", 30),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("upserts progress with the maximum watchedSeconds", async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        durationSeconds: 600,
      });
      mockPrisma.lessonProgress.findUnique.mockResolvedValue({
        watchedSeconds: 50,
      });
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        watchedSeconds: 50,
        completedAt: null,
      });
      mockPrisma.lessonProgress.findUnique.mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        watchedSeconds: 50,
        completedAt: null,
      });

      await updateLessonProgress("user-1", "lesson-1", 30);

      expect(mockPrisma.lessonProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { watchedSeconds: 50 },
          create: expect.objectContaining({ watchedSeconds: 50 }),
        }),
      );
      // 30s does not reach the 90% threshold → no completion update
      expect(mockPrisma.lessonProgress.update).not.toHaveBeenCalled();
    });

    it("marks the lesson complete at the 90% threshold", async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        durationSeconds: 600,
      });
      mockPrisma.lessonProgress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "lp-1",
          userId: "user-1",
          lessonId: "lesson-1",
          watchedSeconds: 0,
          completedAt: null,
        });
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        watchedSeconds: 600,
        completedAt: null,
      });
      mockPrisma.lessonProgress.update.mockResolvedValue({
        id: "lp-1",
        completedAt: new Date(),
      });

      await updateLessonProgress("user-1", "lesson-1", 600);

      expect(mockPrisma.lessonProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });

    it("marks complete when the completed flag is passed with unknown duration", async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue({
        id: "lesson-1",
        durationSeconds: null,
      });
      mockPrisma.lessonProgress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "lp-1",
          userId: "user-1",
          lessonId: "lesson-1",
          watchedSeconds: 0,
          completedAt: null,
        });
      mockPrisma.lessonProgress.upsert.mockResolvedValue({
        id: "lp-1",
        userId: "user-1",
        lessonId: "lesson-1",
        watchedSeconds: 0,
        completedAt: null,
      });
      mockPrisma.lessonProgress.update.mockResolvedValue({
        id: "lp-1",
        completedAt: new Date(),
      });

      await updateLessonProgress("user-1", "lesson-1", 0, true);

      expect(mockPrisma.lessonProgress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("recordingService.updateProgress", () => {
    it("never regresses watchedSeconds on seek-back", async () => {
      mockPrisma.recording.findUnique.mockResolvedValue({
        duration: 900,
      });
      mockPrisma.progress.findUnique.mockResolvedValue({
        watchedSeconds: 300,
      });
      mockPrisma.progress.upsert.mockResolvedValue({
        id: "p-1",
        userId: "user-1",
        recordingId: "rec-1",
        watchedSeconds: 300,
        completedAt: null,
      });
      mockPrisma.progress.findUnique.mockResolvedValue({
        id: "p-1",
        userId: "user-1",
        recordingId: "rec-1",
        watchedSeconds: 300,
        completedAt: null,
      });

      await recordingService.updateProgress("user-1", "rec-1", 100);

      expect(mockPrisma.progress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { watchedSeconds: 300 },
          create: expect.objectContaining({ watchedSeconds: 300 }),
        }),
      );
    });

    it("marks complete at 90% of the recording duration", async () => {
      mockPrisma.recording.findUnique.mockResolvedValue({
        duration: 900,
      });
      mockPrisma.progress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "p-1",
          userId: "user-1",
          recordingId: "rec-1",
          watchedSeconds: 0,
          completedAt: null,
        });
      mockPrisma.progress.upsert.mockResolvedValue({
        id: "p-1",
        userId: "user-1",
        recordingId: "rec-1",
        watchedSeconds: 850,
        completedAt: null,
      });
      mockPrisma.progress.update.mockResolvedValue({
        id: "p-1",
        completedAt: new Date(),
      });

      await recordingService.updateProgress("user-1", "rec-1", 850);

      expect(mockPrisma.progress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });

    it("marks complete with the completed flag when duration is unknown", async () => {
      mockPrisma.recording.findUnique.mockResolvedValue({
        duration: 0,
      });
      mockPrisma.progress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "p-1",
          userId: "user-1",
          recordingId: "rec-1",
          watchedSeconds: 0,
          completedAt: null,
        });
      mockPrisma.progress.upsert.mockResolvedValue({
        id: "p-1",
        userId: "user-1",
        recordingId: "rec-1",
        watchedSeconds: 0,
        completedAt: null,
      });
      mockPrisma.progress.update.mockResolvedValue({
        id: "p-1",
        completedAt: new Date(),
      });

      await recordingService.updateProgress("user-1", "rec-1", 0, true);

      expect(mockPrisma.progress.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ completedAt: expect.any(Date) }),
        }),
      );
    });
  });
});
