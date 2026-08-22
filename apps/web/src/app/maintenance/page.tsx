import { IconTool } from "@tabler/icons-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Maintenance",
  description: "The platform is temporarily under maintenance.",
};

async function getMaintenanceMessage(): Promise<string> {
  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/maintenance-status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = (await res.json()) as { enabled?: boolean; message?: string };
      return data.message || "";
    }
  } catch {
    /* API unreachable — fall through to the default copy */
  }
  return "";
}

export default async function MaintenancePage() {
  const message = await getMaintenanceMessage();
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16"
      style={{
        backgroundColor: "#0F2338",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px),
          linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)
        `,
        backgroundSize: "16px 16px, 16px 16px, 96px 96px, 96px 96px",
      }}
    >
      <style>{`
        @keyframes bp-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bp-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        .bp-sweep {
          animation: bp-sweep 6s linear infinite;
          transform-origin: 50% 50%;
        }
        .bp-blink {
          animation: bp-blink 1.4s steps(1) infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bp-sweep, .bp-blink { animation: none; }
        }
      `}</style>

      {/* panel */}
      <div
        className="relative w-full max-w-lg border border-dashed px-8 py-12 sm:px-14 sm:py-16"
        style={{ borderColor: "rgba(143,168,201,0.45)", backgroundColor: "rgba(15,35,56,0.55)" }}
      >
        {/* corner registration marks */}
        {[
          "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
          "top-0 right-0 translate-x-1/2 -translate-y-1/2",
          "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
          "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden
            className={`absolute h-3.5 w-3.5 ${pos}`}
            style={{ color: "#8FA8C4" }}
          >
            <svg viewBox="0 0 14 14" fill="none" className="h-full w-full">
              <path d="M7 0V14M0 7H14" stroke="currentColor" strokeWidth="1" />
            </svg>
          </span>
        ))}

        {/* status stamp */}
        <div
          className="absolute -top-4 right-6 -rotate-6 select-none border px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.2em]"
          style={{ borderColor: "#FFB627", color: "#FFB627", backgroundColor: "#0F2338" }}
        >
          Status · Maintenance
        </div>

        {/* gauge / tool badge */}
        <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            aria-hidden
            className="bp-sweep absolute h-full w-full"
          >
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * 360;
              const major = i % 6 === 0;
              return (
                <line
                  key={i}
                  x1="50"
                  y1={major ? "4" : "7"}
                  x2="50"
                  y2="12"
                  stroke={major ? "#FFB627" : "#3D5C7D"}
                  strokeWidth={major ? 1.6 : 1}
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
          </svg>
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full border"
            style={{ borderColor: "#3D5C7D", backgroundColor: "#132A45" }}
          >
            <IconTool size={28} style={{ color: "#FFB627" }} />
          </div>
        </div>

        {/* headline */}
        <h1
          className="text-center font-mono text-2xl font-semibold uppercase tracking-[0.14em] sm:text-3xl"
          style={{ color: "#EAF2FA" }}
        >
          Under Maintenance
        </h1>
        <div className="mx-auto my-4 h-px w-16" style={{ backgroundColor: "#3D5C7D" }} />

        {/* body copy */}
        <p className="mx-auto max-w-sm text-center text-sm leading-relaxed" style={{ color: "#93AFC9" }}>
          {message
            ? message
            : "Scheduled work is underway. The team is verifying every system before reopening access — thanks for your patience while we finish the checks."}
        </p>

        {/* status ticker */}
        <div
          className="mx-auto mt-8 flex max-w-xs items-center gap-2 border px-4 py-2 font-mono text-xs"
          style={{ borderColor: "rgba(143,168,201,0.35)", color: "#8FA8C4" }}
        >
          <span className="bp-blink h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "#FFB627" }} />
          <span>running system checks&hellip;</span>
        </div>

        {/* footer */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center text-xs" style={{ color: "#6E88A3" }}>
          <p>Need help now? Contact support.</p>
          <Link
            href="/login"
            className="font-mono uppercase tracking-[0.14em] underline underline-offset-4 transition-colors hover:text-[#FFB627] focus-visible:outline-none focus-visible:ring-1"
            style={{ color: "#8FA8C4" }}
          >
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}