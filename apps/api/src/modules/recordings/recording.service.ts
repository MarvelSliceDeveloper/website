import { prisma } from '../../utils/prisma';
import { getMeetingRecordings } from '../graph/graph.recordings';
import { GraphError } from '../graph/graph.client';
import { notificationService } from '../notifications/notification.service';

export const recordingService = {
  // Syncs recordings from Microsoft Teams for a session
  async syncRecordingsForSession(sessionId: string) {
    // 1. Get session and info
    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
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

    const creatorId = session.createdBy;
    const teamsMeetingId = session.teamsMeetingId;

    // Skip sessions without a real Teams meeting (custom URL, error, or fallback)
    if (!teamsMeetingId || teamsMeetingId.startsWith('custom-') || teamsMeetingId.startsWith('teams-error') || teamsMeetingId.startsWith('fallback-')) {
      console.log(`[RecordingSync] Skipping session ${sessionId}: no real Teams meeting (${teamsMeetingId || 'empty'})`);
      return null;
    }

    try {
      // 2. Fetch recordings from Microsoft Graph using the creator's tokens
      const msRecordings = await getMeetingRecordings(creatorId, teamsMeetingId);

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

      // Notify students that the recording is ready
      await notificationService.notifyRecordingAvailable(sessionId).catch(err => {
        console.error('Failed to send recording notifications:', err.message);
      });

      return recording;
    } catch (error: any) {
      if (error instanceof GraphError && error.statusCode === 404) {
        console.log(`[RecordingSync] Meeting or recordings not found for session ${sessionId}`);
        return null;
      }
      // Token/auth errors — log the specific issue for debugging
      if (error instanceof GraphError && (error.statusCode === 401 || error.statusCode === 403)) {
        console.error(`[RecordingSync] Auth/Token error for session ${sessionId} (${error.statusCode} ${error.graphErrorCode}): ${error.message}`);
      } else {
        console.error(`[RecordingSync] Failed to sync recordings for session ${sessionId}:`, error.message);
      }
      throw error;
    }
  },

  // Gets recordings for a batch with user progress
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

    const recordings = await prisma.recording.findMany({
      where: {
        session: { batchId },
      },
      include: {
        session: {
          select: {
            id: true,
            moduleId: true,
            scheduledAt: true,
            module: { select: { id: true, title: true } },
          },
        },
        progress: {
          where: { userId },
          select: { watchedSeconds: true, completedAt: true },
        },
      },
      orderBy: { session: { scheduledAt: 'asc' } },
    });

    return recordings.map((recording: typeof recordings[number]) => ({
      ...recording,
      sessionId: recording.session.id,
      moduleId: recording.session.moduleId,
      moduleTitle: recording.session.module?.title ?? null,
    }));
  },

  // Gets a single recording with user's watch progress
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

  // Tracks watch progress and marks complete at 90%
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

  // Fetches a fresh playback URL from Microsoft Graph
  async getPlaybackUrl(recordingId: string, userId: string) {
    const recording = await prisma.recording.findUnique({
      where: { id: recordingId },
      include: {
        session: {
          select: { teamsMeetingId: true, createdBy: true },
        },
      },
    });

    if (!recording) throw new Error('Recording not found');

    // For recordings, we use the session creator's token as they are the "owner"
    // of the meeting and recording.
    const creatorId = recording.session.createdBy;

    // Import dynamically to avoid circular dependencies if any
    const { getRecordingContent } = await import('../graph/graph.recordings');

    try {
      const contentUrl = await getRecordingContent(creatorId, recording.session.teamsMeetingId, recording.teamsRecordingId);

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
