import { describe, it, expect, vi, beforeEach } from "vitest";
import { attendanceService } from "../../modules/attendance/attendance.service";
import { presenceService } from "../../services/presence.service";

// Mock Prisma — vi.hoisted() initializes this before the hoisted vi.mock runs
const mockPrisma = vi.hoisted(() => ({
  liveSession: {
    findUnique: vi.fn(),
  },
  attendance: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../utils/prisma", () => ({ prisma: mockPrisma }));

const SESSION_ID = "session-1";

function enrolledSession() {
  return {
    id: SESSION_ID,
    batch: {
      id: "batch-1",
      enrollments: [{ userId: "user-1", status: "APPROVED" }],
    },
  };
}

describe("attendanceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    presenceService.clear(SESSION_ID);
  });

  describe("recordAttendance", () => {
    it("throws 404 when the session does not exist", async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(null);

      await expect(
        attendanceService.recordAttendance("user-1", SESSION_ID),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws 403 when the student is not enrolled in the batch", async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        id: SESSION_ID,
        batch: { id: "batch-1", enrollments: [] },
      });

      await expect(
        attendanceService.recordAttendance("user-1", SESSION_ID),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("creates a new record and marks the student present", async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(enrolledSession());
      mockPrisma.attendance.findUnique.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(),
        leftAt: null,
        rejoinCount: 0,
        qualified: false,
      });

      const attendance = await attendanceService.recordAttendance(
        "user-1",
        SESSION_ID,
      );

      expect(mockPrisma.attendance.create).toHaveBeenCalledWith({
        data: { userId: "user-1", sessionId: SESSION_ID },
      });
      expect(attendance.id).toBe("att-1");
      expect(presenceService.liveCount(SESSION_ID)).toBe(1);
      expect(presenceService.getPeak(SESSION_ID)).toBe(1);
    });

    it("reopens a left record and increments rejoinCount", async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(enrolledSession());
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(Date.now() - 60_000),
        leftAt: new Date(),
        rejoinCount: 1,
        qualified: false,
      });
      mockPrisma.attendance.update.mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(),
        leftAt: null,
        rejoinCount: 2,
        qualified: false,
      });

      await attendanceService.recordAttendance("user-1", SESSION_ID);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: "att-1" },
        data: {
          leftAt: null,
          joinedAt: expect.any(Date),
          rejoinCount: { increment: 1 },
        },
      });
    });

    it("is idempotent when the record is already open", async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(enrolledSession());
      const existing = {
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(),
        leftAt: null,
        rejoinCount: 0,
        qualified: false,
      };
      mockPrisma.attendance.findUnique.mockResolvedValue(existing);

      const attendance = await attendanceService.recordAttendance(
        "user-1",
        SESSION_ID,
      );

      expect(attendance).toBe(existing);
      expect(mockPrisma.attendance.create).not.toHaveBeenCalled();
      expect(mockPrisma.attendance.update).not.toHaveBeenCalled();
    });
  });

  describe("leaveSession", () => {
    it("throws 400 when there is no open record", async () => {
      mockPrisma.attendance.findUnique.mockResolvedValue(null);

      await expect(
        attendanceService.leaveSession("user-1", SESSION_ID),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it("marks qualified when duration is at least half the session", async () => {
      const now = Date.now();
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(now - 3600_000),
        leftAt: null,
        rejoinCount: 0,
      });
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        scheduledAt: new Date(now - 7200_000),
        scheduledEndAt: new Date(now),
        endedAt: null,
      });
      mockPrisma.attendance.update.mockResolvedValue({ id: "att-1" });

      await attendanceService.leaveSession("user-1", SESSION_ID);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: "att-1" },
        data: {
          leftAt: expect.any(Date),
          durationSeconds: 3600,
          qualified: true,
          lastSeenAt: expect.any(Date),
        },
      });
      expect(presenceService.liveCount(SESSION_ID)).toBe(0);
    });

    it("does not mark qualified when duration is below half", async () => {
      const now = Date.now();
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(now - 600_000),
        leftAt: null,
        rejoinCount: 0,
      });
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        scheduledAt: new Date(now - 7200_000),
        scheduledEndAt: new Date(now),
        endedAt: null,
      });
      mockPrisma.attendance.update.mockResolvedValue({ id: "att-1" });

      await attendanceService.leaveSession("user-1", SESSION_ID);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationSeconds: 600,
            qualified: false,
          }),
        }),
      );
    });

    it("uses endedAt as the actual end when the session was ended early", async () => {
      const now = Date.now();
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(now - 3600_000),
        leftAt: null,
        rejoinCount: 0,
      });
      // Session scheduled 2h but ended after 1h — student attended the full hour
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        scheduledAt: new Date(now - 7200_000),
        scheduledEndAt: new Date(now),
        endedAt: new Date(now - 3600_000),
      });
      mockPrisma.attendance.update.mockResolvedValue({ id: "att-1" });

      await attendanceService.leaveSession("user-1", SESSION_ID);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationSeconds: 3600,
            qualified: true,
          }),
        }),
      );
    });
  });

  describe("heartbeat", () => {
    it("updates lastSeenAt when a record is open", async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue({ id: "att-1" });
      mockPrisma.attendance.update.mockResolvedValue({
        id: "att-1",
        lastSeenAt: new Date(),
      });

      const result = await attendanceService.heartbeat("user-1", SESSION_ID);

      expect(mockPrisma.attendance.update).toHaveBeenCalledWith({
        where: { id: "att-1" },
        data: { lastSeenAt: expect.any(Date) },
        select: { id: true, lastSeenAt: true },
      });
      expect(result?.id).toBe("att-1");
      expect(presenceService.liveCount(SESSION_ID)).toBe(1);
    });

    it("returns null but still marks presence when no record is open", async () => {
      mockPrisma.attendance.findFirst.mockResolvedValue(null);

      const result = await attendanceService.heartbeat("user-1", SESSION_ID);

      expect(result).toBeNull();
      expect(presenceService.liveCount(SESSION_ID)).toBe(1);
    });
  });

  describe("getSessionStats", () => {
    it("throws 404 when the session does not exist", async () => {
      mockPrisma.liveSession.findUnique.mockResolvedValue(null);

      await expect(
        attendanceService.getSessionStats(SESSION_ID),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("computes all aggregate metrics", async () => {
      const now = Date.now();
      mockPrisma.liveSession.findUnique.mockResolvedValue({
        scheduledAt: new Date(now - 7200_000),
        scheduledEndAt: new Date(now),
        endedAt: null,
      });
      mockPrisma.attendance.findMany.mockResolvedValue([
        // Attended full hour, joined 1h late
        {
          durationSeconds: 3600,
          qualified: true,
          joinedAt: new Date(now - 3600_000),
          leftAt: new Date(now - 600_000),
        },
        // Attended 20 min, on time, left on time
        {
          durationSeconds: 1200,
          qualified: false,
          joinedAt: new Date(now - 7000_000),
          leftAt: new Date(now - 300_000),
        },
        // Attended ~1.5h, on time, left 20 min early
        {
          durationSeconds: 5600,
          qualified: true,
          joinedAt: new Date(now - 6800_000),
          leftAt: new Date(now - 1200_000),
        },
      ]);

      presenceService.markPresent(SESSION_ID, "user-1");
      presenceService.markPresent(SESSION_ID, "user-2");

      const { stats } = await attendanceService.getSessionStats(SESSION_ID);

      expect(stats).toEqual({
        uniqueAttendees: 3,
        liveNow: 2,
        peakConcurrent: 2,
        avgDurationSeconds: 3467,
        qualifiedCount: 2,
        lateJoins: 1,
        earlyLeaves: 1,
        attendanceRate: 67,
        totalWatchMinutes: 173,
      });
    });
  });

  describe("getAttendance", () => {
    it("returns the record for the user in the session", async () => {
      const record = {
        id: "att-1",
        userId: "user-1",
        sessionId: SESSION_ID,
        joinedAt: new Date(),
        leftAt: null,
        rejoinCount: 0,
        qualified: false,
      };
      mockPrisma.attendance.findUnique.mockResolvedValue(record);

      const result = await attendanceService.getAttendance(
        "user-1",
        SESSION_ID,
      );

      expect(mockPrisma.attendance.findUnique).toHaveBeenCalledWith({
        where: {
          userId_sessionId: { userId: "user-1", sessionId: SESSION_ID },
        },
      });
      expect(result).toBe(record);
    });
  });

  describe("listForSession", () => {
    it("lists records with student info ordered by joinedAt", async () => {
      const records = [
        {
          id: "att-1",
          userId: "user-1",
          sessionId: SESSION_ID,
          joinedAt: new Date(),
          leftAt: null,
          rejoinCount: 0,
          qualified: false,
          user: { id: "user-1", name: "Student One", email: "s1@test.local" },
        },
      ];
      mockPrisma.attendance.findMany.mockResolvedValue(records);

      const result = await attendanceService.listForSession(SESSION_ID);

      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith({
        where: { sessionId: SESSION_ID },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      });
      expect(result).toBe(records);
    });
  });
});
