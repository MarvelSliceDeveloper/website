"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { IconVideo, IconRefresh, IconUsers, IconCalendar, IconCheck, IconSearch, IconX } from "@tabler/icons-react";

type Session = {
  id: string;
  joinUrl: string;
  scheduledAt: string;
  endedAt: string | null;
  createdFrom: string;
  createdBy: string;
  batch: { id: string; name: string; course: { title: string } };
  recording: { id: string } | null;
};

type AttendanceRecord = {
  id: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export default function InstructorSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  // Attendance modal state
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchSessions = async () => {
    try {
      const response = await api.get<{ sessions?: Session[] }>("/api/sessions");
      setSessions(Array.isArray(response.sessions) ? response.sessions : []);
    } catch (err) {
      console.error(err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSyncRecording = async (sessionId: string) => {
    setSyncingId(sessionId);
    try {
      await api.post(`/api/recordings/${sessionId}/sync`);
      alert("Recording synced successfully! The video is now available for students.");
      fetchSessions();
    } catch (err: any) {
      alert(err.message || "No recording was found on Teams. Please note that Teams recordings take a few minutes to process after a session ends.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleViewAttendance = async (session: Session) => {
    setSelectedSession(session);
    setLoadingAttendance(true);
    try {
      const data = await api.get<{ attendance: AttendanceRecord[] }>(`/api/attendance/${session.id}`);
      setAttendance(data.attendance || []);
    } catch (err: any) {
      console.error(err);
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const now = new Date();
  const upcoming = sessions.filter((s) => !s.endedAt && new Date(s.scheduledAt) >= now);
  const past = sessions.filter((s) => s.endedAt || new Date(s.scheduledAt) < now);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Instructor</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Live Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your scheduled and past live classes.</p>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <p className="text-muted animate-pulse">Loading live sessions...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-4xl mb-3">🎥</div>
          <p className="text-lg font-semibold text-foreground">No sessions assigned</p>
          <p className="text-sm text-muted-foreground mt-1">
            You do not have any sessions scheduled. Please contact your Admin to schedule sessions for your batches.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
                <span className="live-pulse h-2 w-2 rounded-full bg-emerald-500" />
                Upcoming Live Classes ({upcoming.length})
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {upcoming.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    upcoming 
                    onViewAttendance={handleViewAttendance}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                Past Sessions ({past.length})
              </h2>
              <div className="space-y-3">
                {past.map((session) => (
                  <SessionCard 
                    key={session.id} 
                    session={session} 
                    upcoming={false}
                    syncing={syncingId === session.id}
                    onSyncRecording={handleSyncRecording}
                    onViewAttendance={handleViewAttendance}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attendance Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-card p-4">
              <div>
                <h3 className="font-bold text-foreground">Session Attendance</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedSession.batch.course.title} · {selectedSession.batch.name}
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="rounded-lg p-1 hover:bg-card-hover text-muted-foreground hover:text-foreground"
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 max-h-[350px] overflow-y-auto">
              {loadingAttendance ? (
                <div className="py-8 text-center text-sm text-muted animate-pulse">
                  Loading attendance sheet...
                </div>
              ) : attendance.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No attendance records found. Either no students clicked &quot;Join Now&quot;, or the session hasn&apos;t started.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {attendance.map((record) => (
                    <div key={record.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{record.user.name}</p>
                        <p className="text-xs text-muted-foreground">{record.user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <IconCheck size={12} />
                          Joined
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(record.joinedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border bg-card p-3 flex justify-end">
              <button 
                onClick={() => setSelectedSession(null)}
                className="btn-secondary text-xs px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ 
  session, 
  upcoming, 
  syncing,
  onSyncRecording,
  onViewAttendance 
}: { 
  session: Session; 
  upcoming: boolean; 
  syncing?: boolean;
  onSyncRecording?: (id: string) => void;
  onViewAttendance: (session: Session) => void;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-4 border border-border/80 hover:border-violet-500/20 hover:shadow-lg transition-all duration-200 justify-between">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
          upcoming ? "bg-violet-500/20 text-violet-400" : "bg-muted/10"
        }`}>
          {upcoming ? "📅" : "🎬"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {new Date(session.scheduledAt).toLocaleString("en-IN", {
              weekday: "short", day: "numeric", month: "short",
              year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {session.batch.course.title}
          </p>
          <p className="text-xs text-muted font-medium mt-0.5 truncate">
            Batch: {session.batch.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-[10px] uppercase font-bold bg-accent/15 text-accent px-1.5 py-0.5 rounded">
              {session.createdFrom}
            </span>
            {session.recording ? (
              <span className="text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                <IconCheck size={10} /> Sync Complete
              </span>
            ) : !upcoming ? (
              <span className="text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">
                Pending Sync
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
        {/* Join button for upcoming classes */}
        <a
          href={session.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-xs flex-1 justify-center py-1.5 px-3 bg-violet-600 hover:bg-violet-700"
        >
          {upcoming ? "Start Class →" : "View Link"}
        </a>

        {/* View Attendance button */}
        <button
          onClick={() => onViewAttendance(session)}
          className="btn-secondary text-xs flex-1 justify-center py-1.5 px-3 flex items-center gap-1.5"
        >
          <IconUsers size={14} />
          Attendance
        </button>

        {/* Manual recording sync button (only for ended past classes without recordings) */}
        {!upcoming && !session.recording && onSyncRecording && (
          <button
            onClick={() => onSyncRecording(session.id)}
            disabled={syncing}
            className="btn-secondary text-xs flex-1 justify-center py-1.5 px-3 flex items-center gap-1 border-violet-500/20 text-violet-400 hover:bg-violet-500/10 disabled:opacity-50"
          >
            <IconRefresh size={14} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Teams"}
          </button>
        )}
      </div>
    </div>
  );
}
