import type { CourseContentData, SidebarTab } from "./types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface Props {
  data: CourseContentData;
  sidebarTab: SidebarTab;
  onSetSidebarTab: (tab: SidebarTab) => void;
}

export function SessionSidebar({ data, sidebarTab, onSetSidebarTab }: Props) {
  const liveSessions = data.sessions.filter((s) => s.isLive);
  const upcomingSessions = data.sessions.filter((s) => s.isUpcoming && !s.isLive);
  const pastSessions = data.sessions.filter((s) => !s.isLive && !s.isUpcoming);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border flex-shrink-0">
        {(["all", "live", "recordings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onSetSidebarTab(tab)}
            className={`flex-1 py-2.5 text-[11px] text-center cursor-pointer transition-colors ${sidebarTab === tab
              ? "text-primary border-b-2 border-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "all" ? "All" : tab === "live" ? "Live" : "Recordings"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {(sidebarTab === "all" || sidebarTab === "live") && liveSessions.length > 0 && (
          <div className="px-4 py-3 space-y-3">
            <p className="text-[11px] font-medium text-danger uppercase tracking-wider">Live Now</p>
            {liveSessions.map((session) => (
              <div key={session.id} className="flex items-start gap-2.5">
                <div className="mt-1 w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{session.moduleTitle ?? "Live Session"}</p>
                  <p className="text-[11px] text-muted-foreground">Started {timeAgo(session.scheduledAt)}</p>
                </div>
                {session.joinUrl && (
                  <a href={session.joinUrl} target="_blank" rel="noreferrer"
                    className="text-[10px] px-2 py-1 rounded-md bg-danger text-white shrink-0 font-medium">Join</a>
                )}
              </div>
            ))}
          </div>
        )}

        {(sidebarTab === "all" || sidebarTab === "live") && upcomingSessions.length > 0 && (
          <div className="px-4 py-3 space-y-3 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Upcoming</p>
            {upcomingSessions.map((session) => (
              <div key={session.id} className="flex items-start gap-2.5">
                <div className="mt-1 w-2 h-2 rounded-full bg-accent shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{session.moduleTitle ?? "Live Session"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(session.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · {new Date(session.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {(sidebarTab === "all" || sidebarTab === "recordings") && pastSessions.length > 0 && (
          <div className="px-4 py-3 space-y-3 border-t border-border">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Past Sessions</p>
            {pastSessions.map((session) => (
              <div key={session.id} className="flex items-start gap-2.5">
                <div className="mt-1 w-2 h-2 rounded-full bg-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{session.moduleTitle ?? "Live Session"}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(session.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                </div>
                {session.hasRecording && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 font-medium">Recording</span>
                )}
              </div>
            ))}
          </div>
        )}

        {liveSessions.length === 0 && upcomingSessions.length === 0 && pastSessions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No sessions available.</p>
        )}
      </div>
    </div>
  );
}
