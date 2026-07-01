import { useState, useRef, useEffect, useCallback, type MouseEvent } from "react";

type VideoPlayerProps = {
  url?: string;
  initialTime?: number;
  onProgress?: (watchedSeconds: number) => Promise<void> | void;
};

/* ─── Icons ──────────────────────────────────────────────────── */
// SVG icon renderer for the video player controls
const Icon = ({ d, size = 20, stroke = "currentColor", fill = "none", strokeWidth = 1.6 }: { d: string | string[]; size?: number; stroke?: string; fill?: string; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const icons = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5a2.5 2.5 0 0 1 2.5-2.5H20v15",
  video: ["M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"],
  people: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  calendar: ["M3 9h18M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z", "M8 2v3M16 2v3"],
  chat: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"],
  search: ["M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0"],
  bell: ["M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9", "M13.73 21a2 2 0 0 1-3.46 0"],
  more: "M12 5v.01M12 12v.01M12 19v.01",
  skipBack: "M19 20L9 12l10-8v16zM5 19V5",
  skipFwd: "M5 4l10 8-10 8V4zM19 5v14",
  play: "M5 3l14 9-14 9V3z",
  pause: "M6 4h4v16H6zM14 4h4v16h-4z",
  volume2: ["M11 5L6 9H2v6h4l5 4V5z", "M15.54 8.46a5 5 0 0 1 0 7.07"],
  mute: ["M11 5L6 9H2v6h4l5 4V5z", "M23 9l-6 6M17 9l6 6"],
  captions: ["M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z", "M7 12h4M7 16h8M15 12h2"],
  maximize: "M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3",
  dotsH: "M5 12h.01M12 12h.01M19 12h.01",
};

/* ─── Video Player ─────────────────────────────────────────────── */
function VideoPlayer({ url = "", initialTime = 0, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(initialTime || 0);
  const [duration] = useState(2265);           // demo 37:45
  const [vol, setVol] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [show, setShow] = useState(false);
  const [hoverT, setHoverT] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  // Format seconds to HH:MM:SS or MM:SS
  const fmt = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60);
    return `${h ? h + ":" : ""}${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // Reset the auto-hide timer for controls when user interacts
  const resetHide = useCallback(() => {
    setShow(true);
    if (hideRef.current) clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setShow(false), 2800);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) { setPlaying(p => !p); return; }
    if (videoRef.current.paused) { videoRef.current.play(); } else { videoRef.current.pause(); }
    setPlaying(p => !p);
  };

  // Seek to clicked position on the progress bar
  const handleProgressClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const r = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const t = ratio * duration;
    setCurrent(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  // Show hovered timestamp on the progress bar
  const handleProgressHover = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const r = progressRef.current.getBoundingClientRect();
    setHoverX(e.clientX - r.left);
    setHoverT(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  useEffect(() => {
    Promise.resolve().then(() => {
      setCurrent(initialTime || 0);
    });
    if (videoRef.current && typeof initialTime === "number") {
      videoRef.current.currentTime = initialTime;
    }
  }, [initialTime]);

  useEffect(() => {
    if (!videoRef.current || !onProgress) return undefined;

    const video = videoRef.current;
    let lastReported = -1;

    const handleTimeUpdate = () => {
      const watchedSeconds = Math.floor(video.currentTime || 0);
      setCurrent(watchedSeconds);

      if (watchedSeconds !== lastReported && watchedSeconds > 0 && watchedSeconds % 30 === 0) {
        lastReported = watchedSeconds;
        void onProgress(watchedSeconds);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [onProgress]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: "#0d0d10",
        borderRadius: 12,
        overflow: "hidden",
        cursor: show ? "default" : "none",
        userSelect: "none",
      }}
      onMouseMove={resetHide}
      onMouseLeave={() => setShow(false)}
    >
      {url && <video ref={videoRef} src={url} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />}

      {/* Gradient overlays */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 40%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 25%)", pointerEvents: "none" }} />

      {/* Top-right dots */}
      <div style={{ position: "absolute", top: 14, right: 16, zIndex: 10, opacity: show ? 1 : 0, transition: "opacity 0.3s", cursor: "pointer" }}>
        <span style={{ color: "rgba(255,255,255,0.6)", display: "flex" }}>
          <Icon d={icons.dotsH} size={20} strokeWidth={2.2} />
        </span>
      </div>

      {/* Center — idle state */}
      {!show && (
        <div onClick={togglePlay} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, cursor: "pointer", zIndex: 5 }}>
          <div style={{
            width: 64, height: 64,
            borderRadius: "50%",
            background: "rgba(108, 92, 231, 0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 32px rgba(108,92,231,0.5)",
            backdropFilter: "blur(4px)",
          }}>
            <Icon d={icons.play} size={26} fill="white" stroke="none" />
          </div>
          <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.04em" }}>
            Hover to see controls
          </span>
        </div>
      )}

      {/* Bottom control panel */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0 0 0",
        zIndex: 10,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        pointerEvents: show ? "auto" : "none",
      }}>
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverT(null)}
          style={{ position: "relative", width: "100%", height: 20, cursor: "pointer", display: "flex", alignItems: "center", padding: "0 0" }}
        >
          <div style={{ position: "relative", width: "100%", height: 3, background: "rgba(255,255,255,0.15)", borderRadius: 99 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #7c6ee0, #a09af0)", borderRadius: 99, position: "relative" }}>
              <div style={{ position: "absolute", right: -5, top: "50%", transform: "translateY(-50%)", width: 11, height: 11, borderRadius: "50%", background: "#fff", boxShadow: "0 0 6px rgba(255,255,255,0.6)" }} />
            </div>
          </div>
          {hoverT !== null && (
            <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: hoverX, transform: "translateX(-50%)", background: "rgba(15,14,20,0.9)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", fontSize: 10, fontFamily: "monospace", padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap", backdropFilter: "blur(8px)", pointerEvents: "none" }}>
              {fmt(hoverT)}
            </div>
          )}
        </div>

        {/* Controls row */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(10,10,14,0.82)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "10px 18px",
          gap: 8,
        }}>
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CtrlBtn icon={icons.skipBack} />
            <button onClick={togglePlay} style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(108,92,231,0.2)",
              border: "1px solid rgba(108,92,231,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "#fff", flexShrink: 0,
              transition: "background 0.2s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(108,92,231,0.4)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(108,92,231,0.2)"}
            >
              <Icon d={playing ? icons.pause : icons.play} size={16} fill="white" stroke="none" />
            </button>
            <CtrlBtn icon={icons.skipFwd} />

            {/* Timestamp */}
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Mono', monospace", marginLeft: 6, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>
              <span style={{ color: "#fff" }}>{fmt(current)}</span>
              <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 4px" }}>/</span>
              {fmt(duration)}
            </span>

            {/* Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
              <button onClick={() => setMuted(m => !m)} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: muted ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.75)", transition: "color 0.2s" }}>
                <Icon d={muted ? icons.mute : icons.volume2} size={16} />
              </button>
              <VolSlider value={muted ? 0 : vol} onChange={v => { setVol(v); if (videoRef.current) videoRef.current.volume = v; }} />
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Speed */}
            <select
              value={speed}
              onChange={e => { const s = +e.target.value; setSpeed(s); if (videoRef.current) videoRef.current.playbackRate = s; }}
              style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "'DM Mono', monospace",
                padding: "6px 10px", borderRadius: 8, cursor: "pointer", outline: "none", letterSpacing: "0.04em",
              }}
            >
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(s => <option key={s} value={s} style={{ background: "#0d0d10" }}>{s}x</option>)}
            </select>
            <CtrlBtn icon={icons.captions} />
            <CtrlBtn icon={icons.maximize} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Button control for video player (skip back/forward, captions, fullscreen)
function CtrlBtn({ icon, onClick }: { icon: string | string[]; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.7)", borderRadius: 8, width: 34, height: 34,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", transition: "background 0.2s, color 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
    >
      <Icon d={icon} size={15} />
    </button>
  );
}

// Volume slider control for the video player
function VolSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ position: "relative", width: 80, height: 34, display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", width: "100%", height: 3, background: "rgba(255,255,255,0.12)", borderRadius: 99 }}>
        <div style={{ width: `${value * 100}%`, height: "100%", background: "rgba(255,255,255,0.5)", borderRadius: 99 }} />
      </div>
      <input type="range" min="0" max="1" step="0.05" value={value}
        onChange={e => onChange(+e.target.value)}
        style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: 20, margin: 0 }}
      />
    </div>
  );
}

/* ─── Sidebar (demo only) ──────────────────────────────────────── */
type IconKey = keyof typeof icons;

const navItems: { id: string; icon: IconKey; active?: boolean }[] = [
  { id: "grid", icon: "grid" },
  { id: "library", icon: "book" },
  { id: "videos", icon: "video" },
  { id: "people", icon: "people" },
  { id: "calendar", icon: "calendar" },
  { id: "chat", icon: "chat", active: true },
];

export default VideoPlayer;