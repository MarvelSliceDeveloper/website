// In-memory live presence tracker for live sessions.
//
// Tracks which students are currently "in" a session (heartbeat seen within TTL)
// and the peak concurrent count for each session.
//
// NOTE: In-memory only — presence resets on server restart. If a persistent /
// multi-instance presence layer is ever needed, swap this for Redis
// (SETEX userId + SCARD for live count, a sorted set for peaks).

// Students send a heartbeat every 45s; a user is considered gone after 90s
// without one.
const PRESENCE_TTL_MS = 90 * 1000;

interface SessionPresence {
  /** userId -> lastSeenAt (epoch ms) */
  users: Map<string, number>;
  /** Highest concurrent user count observed for this process lifetime */
  peak: number;
}

const sessions = new Map<string, SessionPresence>();

function getSession(sessionId: string): SessionPresence {
  let session = sessions.get(sessionId);
  if (!session) {
    session = { users: new Map(), peak: 0 };
    sessions.set(sessionId, session);
  }
  return session;
}

function pruneExpired(session: SessionPresence, now: number) {
  for (const [userId, lastSeenAt] of session.users) {
    if (now - lastSeenAt > PRESENCE_TTL_MS) {
      session.users.delete(userId);
    }
  }
}

export const presenceService = {
  /** Marks a user as present in a session (called from join/heartbeat). */
  markPresent(sessionId: string, userId: string) {
    const session = getSession(sessionId);
    const now = Date.now();
    session.users.set(userId, now);
    if (session.users.size > session.peak) {
      session.peak = session.users.size;
    }
  },

  /** Removes a user from presence (called from leave). Never throws. */
  markAbsent(sessionId: string, userId: string) {
    sessions.get(sessionId)?.users.delete(userId);
  },

  /** Current number of users present in the session. */
  liveCount(sessionId: string): number {
    const session = sessions.get(sessionId);
    if (!session) return 0;
    pruneExpired(session, Date.now());
    return session.users.size;
  },

  /** Peak concurrent users for the session (process lifetime). */
  getPeak(sessionId: string): number {
    return sessions.get(sessionId)?.peak ?? 0;
  },

  /** Drops all presence state for a session. */
  clear(sessionId: string) {
    sessions.delete(sessionId);
  },
};
