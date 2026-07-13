"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Testimonial Data ───────────────────────────────────────────────────────────

const testimonials = [
  {
    name: "Rajesh Venaganti",
    role: "Data Scientist",
    company: "Wipro",
    borderColor: "#F97316",
    avatarId: 11,
    quote: "Transitioned to Data Science smoothly with high-quality mentorship!",
  },
  {
    name: "Rudra Barik",
    role: "Data Architect",
    company: "Tech Mahindra",
    borderColor: "#6366F1",
    avatarId: 12,
    quote: "The curriculum is incredibly structured and aligns perfectly with industry needs.",
  },
  {
    name: "Jayakumar B",
    role: "Head of Marketing",
    company: "BigWelt",
    borderColor: "#22C55E",
    avatarId: 13,
    quote: "Highly recommended! Learned valuable growth and design strategies.",
  },
  {
    name: "Amit Kalwar",
    role: "Specialist - SFDC",
    company: "L&T",
    borderColor: "#F97316",
    avatarId: 14,
    quote: "Interactive live sessions and practical assignments are a game-changer.",
  },
  {
    name: "Hitesh D Rajput",
    role: "Solution Architect",
    company: "Cognizant",
    borderColor: "#6366F1",
    avatarId: 32,
    quote: "Helped me refine my architect skills with hands-on practice.",
  },
  {
    name: "Prateek Prakash",
    role: "Sr. DevOps Engineer",
    company: "Elsevier",
    borderColor: "#22C55E",
    avatarId: 53,
    quote: "The practical devops modules and labs were excellent.",
  },
  {
    name: "Abhishek Patil",
    role: "Digital Marketing Specialist",
    company: "Fugetron",
    borderColor: "#F97316",
    avatarId: 52,
    quote: "Boosted my marketing career! Extremely structured curriculum.",
  },
  {
    name: "Sonu Kumar",
    role: "Manager",
    company: "HSBC",
    borderColor: "#6366F1",
    avatarId: 33,
    quote: "Amazing mentorship support and session quality throughout.",
  },
  {
    name: "Ajay",
    role: "Data Scientist Engineer",
    company: "TCS",
    borderColor: "#22C55E",
    avatarId: 57,
    quote: "Got placed as a Data Scientist! Best platform for career growth.",
  },
];

// ── Company Logo Component (Styled CSS/SVG Logos) ─────────────────────────────

function CompanyLogo({ company }: { company: string }) {
  switch (company) {
    case "Wipro":
      return (
        <div className="flex items-center gap-1">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="7" stroke="url(#wipro-g)" strokeWidth="2.5" strokeDasharray="3 2" />
            <defs>
              <linearGradient id="wipro-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-[12px] font-black text-gray-700 tracking-tighter">wipro</span>
        </div>
      );
    case "Tech Mahindra":
      return (
        <div className="flex flex-col items-start leading-none shrink-0">
          <span className="text-[8px] font-medium text-gray-500 uppercase tracking-tighter">Tech</span>
          <span className="text-[13px] font-black text-red-600 tracking-tighter -mt-0.5">Mahindra</span>
        </div>
      );
    case "BigWelt":
      return (
        <span className="text-[14px] font-black italic text-amber-800 tracking-tight shrink-0">
          Big<span className="text-orange-500">Welt</span>
        </span>
      );
    case "L&T":
      return (
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-[8px] font-black text-white ring-1 ring-blue-900">
            L&T
          </div>
          <span className="text-[9px] font-extrabold text-blue-900 tracking-tighter">LARSEN & TOUBRO</span>
        </div>
      );
    case "Cognizant":
      return (
        <div className="flex items-center gap-1 shrink-0">
          <svg className="w-4 h-4 text-blue-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="text-[12px] font-bold text-[#0033a0] tracking-tight">Cognizant</span>
        </div>
      );
    case "Elsevier":
      return (
        <span className="text-[12px] font-serif font-black text-amber-800 tracking-widest uppercase shrink-0">
          ELSEVIER
        </span>
      );
    case "Fugetron":
      return (
        <div className="flex items-center gap-1 shrink-0">
          <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
            <span className="bg-blue-600 rounded-sm"></span>
            <span className="bg-purple-600 rounded-sm"></span>
            <span className="bg-pink-600 rounded-sm"></span>
            <span className="bg-indigo-600 rounded-sm"></span>
          </div>
          <span className="text-[11px] font-black text-slate-800 tracking-tighter">FUGETRON</span>
        </div>
      );
    case "HSBC":
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative w-4 h-3 flex items-center justify-center">
            <div className="absolute w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-red-600 transform rotate-90"></div>
            <div className="absolute w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[9px] border-b-red-600 transform -rotate-90"></div>
            <div className="w-2 h-1.5 bg-white z-10"></div>
          </div>
          <span className="text-[13px] font-extrabold text-black tracking-tighter">HSBC</span>
        </div>
      );
    case "TCS":
      return (
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[14px] font-extrabold text-blue-600 leading-none">t</span>
          <span className="text-[14px] font-extrabold text-teal-500 leading-none">c</span>
          <span className="text-[14px] font-extrabold text-orange-500 leading-none">s</span>
        </div>
      );
    default:
      return <span className="text-xs font-bold text-gray-500">{company}</span>;
  }
}

// ── Main Login Page ────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const result = await api.post<{
        user?: { role?: string };
      }>("/api/auth/login", {
        email: normalizedEmail,
        password,
      });

      toast.success("Signed in successfully");
      const role = result?.user?.role;

      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
        return;
      }
      if (role === "INSTRUCTOR") {
        router.push("/instructor/dashboard");
        return;
      }
      router.push("/student/");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] px-4 py-8">
      {/* Container card */}
      <div className="grid w-full max-w-[1140px] overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.25fr_0.75fr]">
        
        {/* ─── LEFT: Success Stories ─── */}
        <section className="hidden border-r border-gray-100 px-8 py-10 lg:flex lg:flex-col lg:justify-center">
          <h1 className="text-center text-[30px] font-extrabold leading-snug text-gray-800">
            Success Stories of many
            <br />
            professionals Like You
          </h1>
          <p className="mt-2 text-center text-sm font-semibold text-orange-500">
            10+ Million Learners
          </p>

          {/* Testimonial Grid with styled physical cards & shadow */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex flex-col rounded-xl border border-gray-150 bg-white p-4 transition-all duration-300 hover:scale-[1.02] shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] min-h-[160px]"
                style={{ borderLeftWidth: 4, borderLeftColor: t.borderColor }}
              >
                {/* Top row: avatar + details */}
                <div className="flex items-center gap-3">
                  <img
                    src={`https://i.pravatar.cc/80?img=${t.avatarId}`}
                    alt={t.name}
                    className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gray-100 shadow-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold leading-tight text-gray-800 truncate">
                      {t.name}
                    </p>
                    <p className="text-[10px] text-gray-450 leading-tight mt-0.5 truncate">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Success Quote */}
                <p className="mt-2 text-[10.5px] italic text-gray-500 leading-normal line-clamp-3">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Company Logo at bottom */}
                <div className="mt-auto pt-3 flex items-center">
                  <CompanyLogo company={t.company} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── RIGHT: Login Form ─── */}
        <section className="flex flex-col items-center justify-center px-8 py-10 sm:px-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img
              src="/images/logo.svg"
              alt="Marvel Slice"
              className="h-11 w-auto object-contain"
            />
            <span className="text-2xl font-extrabold tracking-tight">
              <span className="text-orange-500">Marvel</span>{" "}
              <span className="text-green-600">Slice</span>
            </span>
          </div>

          <h2 className="mt-6 text-xl font-bold text-gray-800">Welcome back!</h2>
          <p className="mt-0.5 text-sm text-gray-400">
            Log in to continue learning
          </p>

          {/* Form */}
          <form
            onSubmit={handleSignIn}
            className="mt-6 w-full max-w-[340px] space-y-4"
          >
            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <IconEyeOff size={18} stroke={1.5} />
                ) : (
                  <IconEye size={18} stroke={1.5} />
                )}
              </button>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-gray-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-orange-500"
                />
                Remember Me
              </label>
              <button
                type="button"
                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Log In */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-orange-500 py-3 text-sm font-bold text-white transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-4 flex w-full max-w-[340px] items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* SSO Button */}
          <button
            type="button"
            className="mt-4 w-full max-w-[340px] rounded-lg border-2 border-orange-400 py-2.5 text-sm font-semibold text-orange-500 transition-all hover:bg-orange-50 active:scale-[0.98]"
          >
            Click For Single Sign On
          </button>

          {/* Demo Accounts */}
          <div className="mt-5 w-full max-w-[340px] rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Demo Accounts (dev only)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Student", email: "student@lms.local", pw: "student123" },
                { label: "Instructor", email: "instructor@lms.local", pw: "instructor123" },
                { label: "Admin", email: "admin@lms.local", pw: "admin123" },
                { label: "Super Admin", email: "superadmin@lms.local", pw: "superadmin123" },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.pw);
                    toast.info(`Filled ${d.label} credentials`);
                  }}
                  className="rounded border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:border-orange-300 hover:text-orange-600"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
