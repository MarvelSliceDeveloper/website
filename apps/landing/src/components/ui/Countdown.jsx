import { useEffect, useState } from "react";

function getTimeLeft(target) {
  const diff = new Date(target).getTime() - Date.now();
  if (isNaN(diff) || diff <= 0) return null;
  const total = Math.floor(diff / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export default function Countdown({ target, onFinish, className = "" }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const next = getTimeLeft(target);
    setTimeLeft(next);
    if (!next) {
      onFinish?.();
      return;
    }

    const interval = setInterval(() => {
      const current = getTimeLeft(target);
      setTimeLeft(current);
      if (!current) {
        clearInterval(interval);
        onFinish?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [target, onFinish]);

  const pad = (n) => String(n).padStart(2, "0");

  if (!timeLeft) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
        <p className="text-emerald-700 font-bold text-base">
          🚀 Course is Now Live!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-4 gap-3 ${className}`}>
      {[
        { label: "Days", value: timeLeft?.days ?? 0 },
        { label: "Hours", value: pad(timeLeft?.hours ?? 0) },
        { label: "Minutes", value: pad(timeLeft?.minutes ?? 0) },
        { label: "Seconds", value: pad(timeLeft?.seconds ?? 0) },
      ].map((box) => (
        <div
          key={box.label}
          className="bg-gray-50 rounded-xl border border-gray-100 py-4 text-center"
        >
          <div className="text-[28px] leading-none font-bold text-brand-orange tabular-nums">
            {box.value}
          </div>
          <div className="text-[11px] text-gray-400 mt-2 uppercase tracking-wider">
            {box.label}
          </div>
        </div>
      ))}
    </div>
  );
}
