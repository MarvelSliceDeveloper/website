"use client";

import { useEffect, useRef, useState } from "react";

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: number) => void;
  initialTime?: number;
}

export default function VideoPlayer({ url, onProgress, initialTime = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (initialTime > 0) {
      video.currentTime = initialTime;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onProgress && Math.floor(video.currentTime) % 15 === 0) {
        onProgress(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [onProgress, initialTime]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div 
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Overlay Controls */}
      <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        
        {/* Progress Bar */}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-primary outline-none transition-all hover:h-2"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="text-2xl text-white hover:text-primary transition-colors">
              {isPlaying ? "⏸" : "▶"}
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-white/90">
              <span>{formatTime(currentTime)}</span>
              <span className="opacity-50">/</span>
              <span>{formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">Vol</span>
              <input 
                type="range" min="0" max="1" step="0.1" value={volume} 
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if(videoRef.current) videoRef.current.volume = v;
                }}
                className="w-16 h-1 bg-white/20 accent-white outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select 
              value={playbackSpeed} 
              onChange={(e) => {
                const s = parseFloat(e.target.value);
                setPlaybackSpeed(s);
                if(videoRef.current) videoRef.current.playbackRate = s;
              }}
              className="bg-transparent text-xs font-bold text-white outline-none border border-white/20 rounded px-1"
            >
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <option key={s} value={s} className="bg-zinc-900">{s}x</option>
              ))}
            </select>
            <button 
              onClick={() => videoRef.current?.requestFullscreen()}
              className="text-xl text-white hover:text-primary transition-colors"
            >
              ⛶
            </button>
          </div>
        </div>
      </div>

      {/* Center Play/Pause Large Icon on Toggle */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          onClick={togglePlay}
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-4xl text-white animate-pulse">
            ▶
          </div>
        </div>
      )}
    </div>
  );
}
