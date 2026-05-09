import { prisma } from '../../utils/prisma';
import { getMeetingRecordings } from '../graph/graph.recordings';
import { GraphError } from '../graph/graph.client';

export const recordingService = {
  /**
   * Synchronize recordings for a specific live session.
   * This is typically called by a background job after the session ends.
   */
  async syncRecordingsForSession(sessionId: string) {
    // 1. Get session and instructor info
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        batch: { select: { instructorId: true } },
        recording: true,
      },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Skip if recording already synced
    if (session.recording) {
      return session.recording;
    }

    const instructorId = session.batch.instructorId;
    const teamsMeetingId = session.teamsMeetingId;

    try {
      // 2. Fetch recordings from Microsoft Graph
      const msRecordings = await getMeetingRecordings(instructorId, teamsMeetingId);

      if (!msRecordings || msRecordings.length === 0) {
        console.log(`[RecordingSync] No recordings found yet for session ${sessionId}`);
        return null;
      }

      // Take the first recording (most meetings only have one)
      const msRecording = msRecordings[0];

      // 3. Store in database
      const recording = await prisma.recording.create({
        data: {
          sessionId,
          teamsRecordingId: msRecording.id,
          sharePointUrl: msRecording.webUrl || '', // The webUrl points to SharePoint/OneDrive
          duration: 0, // Duration is not always immediately available in metadata
          syncedAt: new Date(),
        },
      });

      console.log(`[RecordingSync] Successfully synced recording for session ${sessionId}`);
      return recording;
    } catch (error: any) {
      if (error instanceof GraphError && error.statusCode === 404) {
        console.log(`[RecordingSync] Meeting or recordings not found for session ${sessionId}`);
        return null;
      }
      console.error(`[RecordingSync] Failed to sync recordings for session ${sessionId}:`, error.message);
      throw error;
    }
  },

  /**
   * Get recordings for a specific batch.
   */
  async getRecordingsForBatch(batchId: string, userId: string) {
    // Verify enrollment
    const enrollment = await prisma.enrollmentRequest.findFirst({
      where: { userId, batchId, status: 'APPROVED' },
    });

    // If not enrolled and not the instructor, access denied
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { instructorId: true },
    });

    if (!enrollment && batch?.instructorId !== userId) {
      // Allow ADMINs bypass if necessary, usually handled by guards.
      // For now we keep it strict to the service layer rules.
      throw new Error('Access denied: You are not enrolled in this batch');
    }

    return prisma.recording.findMany({
      where: {
        session: { batchId },
      },
      include: {
        session: {
          select: {
            id: true,
            scheduledAt: true,
            module: { select: { title: true } },
          },
        },
        progress: {
          where: { userId },
          select: { watchedSeconds: true, completedAt: true },
        },
      },
      orderBy: { session: { scheduledAt: 'asc' } },
    });
  },

  /**
   * Get recording details with watch progress for the current user.
   */
  async getRecording(recordingId: string, userId: string) {
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        session: {
          include: {
            batch: { select: { name: true, instructorId: true, course: { select: { title: true } } } },
            module: { select: { title: true } },
          },
        },
        progress: {
          where: { userId },
        },
      },
    });

    if (!recording) {
      throw new Error('Recording not found');
    }

    return recording;
  },

  /**
   * Track watch progress for a recording.
   */
  async updateProgress(userId: string, recordingId: string, watchedSeconds: number) {
    // 1. Get recording to check duration
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      select: { duration: true },
    });

    if (!recording) throw new Error('Recording not found');

    // 2. Update progress record
    const progress = await prisma.progress.upsert({
      where: {
        userId_recordingId: { userId, recordingId },
      },
      create: {
        userId,
        recordingId,
        watchedSeconds,
      },
      update: {
        watchedSeconds,
      },
    });

    // 3. Check for completion (90% threshold)
    // If duration is 0, we can't mark as complete automatically yet
    if (recording.duration > 0 && !progress.completedAt) {
      const completionThreshold = recording.duration * 0.9;
      if (watchedSeconds >= completionThreshold) {
        await prisma.progress.update({
          where: { id: progress.id },
          data: { completedAt: new Date() },
        });
      }
    }

    return progress;
  },

  /**
   * Fetch a fresh playback URL from Microsoft Graph.
   */
  async getPlaybackUrl(recordingId: string, userId: string) {
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        session: {
          select: { teamsMeetingId: true, batch: { select: { instructorId: true } } },
        },
      },
    });

    if (!recording) throw new Error('Recording not found');

    // For recordings, we use the instructor's token as they are the "owner"
    // of the meeting and recording.
    const instructorId = recording.session.batch.instructorId;
    
    // Import dynamically to avoid circular dependencies if any
    const { getRecordingContent } = await import('../graph/graph.recordings');
    
    try {
      const contentUrl = await getRecordingContent(instructorId, recording.session.teamsMeetingId, recording.teamsRecordingId);
      
      return {
        url: contentUrl,
        expiresAt: new Date(Date.now() + 3600000), // ~1 hour
      };
    } catch (error: any) {
      console.error(`[Recording] Failed to get playback URL:`, error.message);
      throw error;
    }
  },
};
