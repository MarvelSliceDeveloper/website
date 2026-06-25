import { prisma } from '../../utils/prisma';

export const attendanceService = {
  // Records a student joining a live session
  async recordAttendance(userId: string, sessionId: string) {
    // 1. Verify the session exists
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          select: {
            id: true,
            enrollments: {
              where: { userId, status: 'APPROVED' }
            }
          }
        }
      }
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // 2. Verify student enrollment in the batch of this session
    if (session.batch.enrollments.length === 0) {
      throw new Error('You are not enrolled in the batch for this session');
    }

    // 3. Upsert attendance record
    return prisma.attendance.upsert({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
      create: {
        userId,
        sessionId,
      },
      update: {}, // No updates needed if already recorded
    });
  },

  // Gets attendance record for a user in a session
  async getAttendance(userId: string, sessionId: string) {
    return prisma.attendance.findUnique({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
    });
  },

  // Lists all attendance records for a session
  async listForSession(sessionId: string) {
    return prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  },
};
