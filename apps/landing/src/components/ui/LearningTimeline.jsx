import { useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import * as LuIcons from "react-icons/lu";
import {
  LuClipboardCheck,
  LuBookOpen,
  LuWrench,
  LuAward,
  LuRocket,
  LuUserCheck,
  LuClipboardList,
  LuShieldCheck,
  LuSparkles,
} from "react-icons/lu";
import { supabase } from "../../lib/supabaseClient";

/* ================================================================
   FALLBACK DATA (Used if DB data is loading/empty)
   ================================================================ */

const FALLBACK_STEPS = [
  {
    number: "01",
    title: "Enroll",
    description:
      "Select your program and begin your journey with guided counselor support.",
    icon: "ClipboardCheck",
  },
  {
    number: "02",
    title: "Learn",
    description:
      "Master concepts through live sessions, labs, and expert-led courses.",
    icon: "BookOpen",
  },
  {
    number: "03",
    title: "Build",
    description:
      "Apply skills on real-world projects to build a professional portfolio.",
    icon: "Wrench",
  },
  {
    number: "04",
    title: "Assess",
    description:
      "Track growth through evaluations, mock interviews, and feedback.",
    icon: "ClipboardCheck",
  },
  {
    number: "05",
    title: "Certify",
    description:
      "Earn industry-recognized certifications that validate your expertise.",
    icon: "Award",
  },
  {
    number: "06",
    title: "Succeed",
    description:
      "Launch your career with placement support and hiring-partner connections.",
    icon: "Rocket",
  },
];

const FALLBACK_FEATURES = [
  {
    icon: "ClipboardCheck",
    title: "Personalized Guidance",
    description: "One-on-one counselor support at every stage.",
  },
  {
    icon: "UserCheck",
    title: "Hands-on Learning",
    description: "Projects & labs to build real industry skills.",
  },
  {
    icon: "ClipboardList",
    title: "Career Support",
    description: "Resume building, mock interviews & placements.",
  },
  {
    icon: "ShieldCheck",
    title: "Lifetime Access",
    description: "Access resources & updates even after you succeed.",
  },
];

const PRESET_COLORS = [
  { color: "#7C3AED", soft: "#f3f0ff", ring: "#ede9fe" },
  { color: "#EC4899", soft: "#fdf2f8", ring: "#fce7f3" },
  { color: "#F59E0B", soft: "#fffbeb", ring: "#fef3c7" },
  { color: "#06B6D4", soft: "#ecfeff", ring: "#cffafe" },
  { color: "#3B82F6", soft: "#eff6ff", ring: "#dbeafe" },
  { color: "#22C55E", soft: "#f0fdf4", ring: "#dcfce7" },
];

const COLOR_NAME_MAP = {
  purple: "#7C3AED",
  violet: "#7C3AED",
  pink: "#EC4899",
  orange: "#F59E0B",
  amber: "#F59E0B",
  cyan: "#06B6D4",
  blue: "#3B82F6",
  green: "#22C55E",
  emerald: "#22C55E",
  red: "#EF4444",
  indigo: "#6366F1",
  teal: "#14B8A6",
};

function resolveStepColors(step, index) {
  const preset = PRESET_COLORS[index % PRESET_COLORS.length];
  const raw = String(step?.colorHex || step?.color || step?.accent || "")
    .trim()
    .toLowerCase();

  let color = preset.color;

  if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) {
    color = raw;
  } else {
    for (const [name, hex] of Object.entries(COLOR_NAME_MAP)) {
      if (raw.includes(name)) {
        color = hex;
        break;
      }
    }
  }

  return {
    color,
    soft:
      typeof step?.soft === "string" && step.soft.startsWith("#")
        ? step.soft
        : `${color}18`,
    ring:
      typeof step?.ring === "string" && step.ring.startsWith("#")
        ? step.ring
        : `${color}35`,
  };
}

function DynamicIcon({ name, fallback: Fallback, className, style }) {
  if (name) {
    const key = name.startsWith("Lu") ? name : `Lu${name}`;
    const IconComp = LuIcons[key];
    if (IconComp) return <IconComp className={className} style={style} />;
  }
  return Fallback ? <Fallback className={className} style={style} /> : null;
}

const DEFAULT_STEP_FALLBACK_ICONS = [
  LuClipboardCheck,
  LuBookOpen,
  LuWrench,
  LuClipboardCheck,
  LuAward,
  LuRocket,
];

const DEFAULT_FEATURE_FALLBACK_ICONS = [
  LuClipboardCheck,
  LuUserCheck,
  LuClipboardList,
  LuShieldCheck,
];

/* ================================================================
   ANIMATION VARIANTS
   ================================================================ */

const fadeUp = (delay = 0, y = 24, reduced = false) =>
  reduced
    ? {
        initial: { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.3, delay },
      }
    : {
        initial: { opacity: 0, y },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.6, delay, ease: [0.215, 0.61, 0.355, 1] },
      };

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function LearningJourney({ data }) {
  const sectionRef = useRef(null);
  const rm = useReducedMotion();

  const { data: fetchedTimeline } = useQuery({
    queryKey: ["learningJourney", "nav_pages"],
    queryFn: async () => {
      try {
        const { data: navItems } = await supabase
          .from("nav_items")
          .select("id")
          .eq("path", "/services")
          .eq("is_active", true)
          .limit(1);
        const navItem = navItems?.[0];
        if (!navItem) return null;
        const { data: pages } = await supabase
          .from("nav_pages")
          .select("sections")
          .eq("nav_item_id", navItem.id)
          .eq("is_published", true)
          .limit(1);
        const page = pages?.[0];
        const sections = page?.sections || [];
        return sections.find((s) => s.section_type === "timeline") || null;
      } catch {
        return null;
      }
    },
    enabled: data === undefined,
    staleTime: 1000 * 60 * 5,
  });

  const timelineData = data || fetchedTimeline;

  const heading = timelineData?.heading || "Your Learning Journey";
  const subheading =
    timelineData?.subheading ||
    "A structured path from enrollment to career success.";

  const rawSteps = timelineData?.items?.length
    ? timelineData.items
    : FALLBACK_STEPS;
  const rawFeatures = timelineData?.features?.length
    ? timelineData.features
    : FALLBACK_FEATURES;

  const steps = rawSteps.map((step, i) => {
    const colors = resolveStepColors(step, i);
    return {
      ...step,
      number: step.number || String(i + 1).padStart(2, "0"),
      color: colors.color,
      soft: colors.soft,
      ring: colors.ring,
      FallbackIcon:
        DEFAULT_STEP_FALLBACK_ICONS[i % DEFAULT_STEP_FALLBACK_ICONS.length],
    };
  });

  const features = rawFeatures.map((feat, i) => {
    const colors = resolveStepColors(feat, i);
    return {
      ...feat,
      color: colors.color,
      soft: colors.soft,
      FallbackIcon:
        DEFAULT_FEATURE_FALLBACK_ICONS[
          i % DEFAULT_FEATURE_FALLBACK_ICONS.length
        ],
    };
  });

  const numSteps = steps.length;
  const colWidth = 1200 / numSteps;
  const startX = colWidth * 0.5;
  const endX = colWidth * (numSteps - 0.5);

  const BADGE_SIZE = 40;
  const CONNECTOR_H = 10;
  const CARD_TOP = BADGE_SIZE + CONNECTOR_H;
  const CARD_MIN_H = 295;

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden py-16 bg-gradient-to-b from-white via-slate-50/50 to-white"
    >
      {/* Subtle background glows */}
      <div className="absolute top-[10%] left-[-3%] w-[26%] h-[38%] rounded-full bg-purple-100/20 blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] left-[37%] w-[24%] h-[32%] rounded-full bg-cyan-100/15 blur-[90px] pointer-events-none" />
      <div className="absolute top-[16%] right-[-3%] w-[25%] h-[35%] rounded-full bg-emerald-100/15 blur-[90px] pointer-events-none" />

      <div className="relative mx-auto max-w-[1380px] px-4 sm:px-6 lg:px-8">
        {/* ════════════════════════════════════════════
            SECTION 1: TITLE & SUBTITLE
            ════════════════════════════════════════════ */}
        <div className="mb-14 text-center">
          <motion.h2
            {...fadeUp(0.1, 16, rm)}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-700"
          >
            {heading}
          </motion.h2>

          {/* Brand Underline */}
          <motion.div
            {...fadeUp(0.18, 8, rm)}
            className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand-orange"
          />

          {/* Subtitle */}
          {subheading && (
            <motion.p
              {...fadeUp(0.24, 14, rm)}
              className="mx-auto mt-4 max-w-2xl text-base text-slate-500 sm:text-lg"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* ════════════════════════════════════════════
            SECTION 2: CARDS & TIMELINE TRACK (DESKTOP)
            ════════════════════════════════════════════ */}
        <div className="hidden min-[1200px]:block relative overflow-visible pr-12 lg:pr-16">
          <div className="relative overflow-visible">
            {/* Unified Background SVG Overlay Mapped Dynamic Grid */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible"
              viewBox="0 0 1200 389"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="timeline-gradient"
                  x1={startX}
                  y1="0"
                  x2={endX}
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="20%" stopColor="#EC4899" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="60%" stopColor="#06B6D4" />
                  <stop offset="80%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#22C55E" />
                </linearGradient>
              </defs>

              {/* 1. Top Gradient Line (Left to Right) */}
              <motion.path
                initial={rm ? undefined : { pathLength: 0, opacity: 0 }}
                whileInView={rm ? undefined : { pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
                d={`M ${startX} 20 H ${endX}`}
                stroke="url(#timeline-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* 2. Bottom Solid Gradient Line (Right to Left) */}
              <motion.path
                initial={rm ? undefined : { pathLength: 0, opacity: 0 }}
                whileInView={rm ? undefined : { pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 1.0, delay: 0.7, ease: "easeInOut" }}
                d={`M ${endX} 383 H ${startX}`}
                stroke="url(#timeline-gradient)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* 3. Dotted Right Connection */}
              <motion.path
                initial={rm ? undefined : { opacity: 0 }}
                whileInView={rm ? undefined : { opacity: 0.2 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                d={`M ${endX} 20 H 1240 C 1310 20, 1310 383, 1240 383 H ${endX}`}
                stroke="#22C55E"
                strokeWidth="2.5"
                strokeDasharray="6 6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Animated Stage Cards Grid */}
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.14,
                    delayChildren: 0.1,
                  },
                },
              }}
              className="grid gap-6 relative z-10"
              style={{
                gridTemplateColumns: `repeat(${numSteps}, minmax(0, 1fr))`,
              }}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={`step-card-${i}`}
                  variants={
                    rm
                      ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
                      : {
                          hidden: { opacity: 0, y: 32, scale: 0.92 },
                          show: {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                              type: "spring",
                              stiffness: 220,
                              damping: 18,
                            },
                          },
                        }
                  }
                  className="relative flex flex-col items-center group"
                >
                  {/* Number badge */}
                  <motion.div
                    whileHover={rm ? undefined : { scale: 1.12 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center
                               rounded-full text-white text-[12px] font-bold cursor-pointer"
                    style={{
                      top: 0,
                      width: `${BADGE_SIZE}px`,
                      height: `${BADGE_SIZE}px`,
                      backgroundColor: step.color,
                      boxShadow:
                        "0 0 0 4px #ffffff, 0 4px 10px rgba(15,23,42,0.08)",
                    }}
                  >
                    {step.number}
                  </motion.div>

                  {/* Vertical connector badge -> card */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-0"
                    style={{
                      top: `${BADGE_SIZE}px`,
                      height: `${CONNECTOR_H}px`,
                      width: "1px",
                      background: "rgba(148,163,184,0.22)",
                    }}
                  />

                  {/* White Card */}
                  <motion.div
                    whileHover={rm ? undefined : { y: -6, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-full bg-white rounded-[22px] border border-[rgba(226,232,240,0.7)]
                               shadow-[0_10px_30px_rgba(15,23,42,0.055)]
                               pt-[20px] px-5 pb-6
                               flex flex-col items-center text-center relative overflow-hidden
                               transition-shadow duration-300 ease-out
                               group-hover:shadow-[0_20px_45px_rgba(15,23,42,0.11)] cursor-pointer"
                    style={{
                      marginTop: `${CARD_TOP}px`,
                      height: `${CARD_MIN_H}px`,
                    }}
                  >
                    {/* Icon Circle INSIDE Card */}
                    <motion.div
                      whileHover={rm ? undefined : { scale: 1.1, rotate: 4 }}
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 15,
                      }}
                      className="flex items-center justify-center rounded-full mb-3 transition-transform duration-300 shrink-0"
                      style={{
                        width: "52px",
                        height: "52px",
                        backgroundColor: step.soft,
                        border: `2.5px solid ${step.ring}`,
                        boxShadow:
                          "0 0 0 3px rgba(255,255,255,0.8), 0 5px 14px rgba(15,23,42,0.05)",
                      }}
                    >
                      <DynamicIcon
                        name={step.icon}
                        fallback={step.FallbackIcon}
                        className="w-[22px] h-[22px]"
                        style={{ color: step.color }}
                      />
                    </motion.div>

                    {/* Title */}
                    <h3
                      className="text-[17px] font-bold leading-snug text-center mb-2"
                      style={{ color: step.color }}
                    >
                      {step.title}
                    </h3>

                    {/* Subtext */}
                    <p className="text-slate-500 text-[13px] leading-[1.65] max-w-[195px] text-center">
                      {step.description}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>

            {/* Bottom Timeline Track Dots (Right to Left Flow) */}
            <div className="relative mt-8 z-10">
              {/* Continuous gradient line connecting dot 06 to dot 01 (Right to Left) */}
              <motion.div
                initial={rm ? undefined : { scaleX: 0 }}
                whileInView={rm ? undefined : { scaleX: 1 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 1.0, delay: 0.7, ease: "easeInOut" }}
                className="absolute top-1/2 -translate-y-1/2 h-[3.5px] rounded-full z-0 bg-gradient-to-r from-[#7C3AED] via-[#06B6D4] to-[#22C55E] origin-right"
                style={{
                  left: `${(100 / numSteps) * 0.5}%`,
                  right: `${(100 / numSteps) * 0.5}%`,
                }}
              />

              <div
                className="relative grid gap-6 z-10"
                style={{
                  gridTemplateColumns: `repeat(${numSteps}, minmax(0, 1fr))`,
                }}
              >
                {steps.map((step, i) => (
                  <div
                    key={`dot-${i}`}
                    className="relative flex justify-center items-center"
                  >
                    <motion.div
                      initial={rm ? undefined : { opacity: 0, scale: 0 }}
                      whileInView={rm ? undefined : { opacity: 1, scale: 1 }}
                      viewport={{ once: true, amount: 0.1 }}
                      transition={
                        rm
                          ? { duration: 0.3 }
                          : {
                              type: "spring",
                              stiffness: 300,
                              damping: 16,
                              delay: (numSteps - 1 - i) * 0.12 + 0.8,
                            }
                      }
                      whileHover={rm ? undefined : { scale: 1.4 }}
                      className="w-[12px] h-[12px] rounded-full ring-[3px] ring-white shadow-sm z-20 cursor-pointer"
                      style={{ backgroundColor: step.color }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════
            RESPONSIVE TIMELINE (MOBILE/TABLET)
            ════════════════════════════════════════════ */}
        <div className="min-[1200px]:hidden relative my-6 px-1 sm:px-4">
          {/* Continuous Vertical Timeline Track Line */}
          <motion.div
            initial={rm ? undefined : { scaleY: 0 }}
            whileInView={rm ? undefined : { scaleY: 1 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[20px] sm:left-[22px] -translate-x-1/2 top-5 bottom-8 w-[2.5px] rounded-full bg-gradient-to-b from-[#7C3AED] via-[#06B6D4] to-[#22C55E] origin-top z-0"
          />

          <div className="relative z-10 flex flex-col space-y-6 sm:space-y-8">
            {steps.map((step, i) => (
              <motion.div
                key={`step-mobile-${i}`}
                initial={rm ? undefined : { opacity: 0, y: 24, x: 8 }}
                whileInView={rm ? undefined : { opacity: 1, y: 0, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                className="flex items-start gap-3.5 sm:gap-5 group"
              >
                {/* Numbered Circle Badge on Vertical Timeline */}
                <motion.div
                  initial={rm ? undefined : { scale: 0.7, opacity: 0 }}
                  whileInView={rm ? undefined : { scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    type: "spring",
                    stiffness: 340,
                    damping: 18,
                    delay: i * 0.08 + 0.05,
                  }}
                  className="relative z-10 flex items-center justify-center shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white text-xs sm:text-sm font-bold shadow-md cursor-pointer transition-transform duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: step.color,
                    boxShadow: `0 0 0 3.5px #ffffff, 0 4px 14px ${step.color}35`,
                  }}
                >
                  {step.number}
                </motion.div>

                {/* Card Content beside Timeline Circle */}
                <motion.div
                  initial={rm ? undefined : { opacity: 0, x: 12 }}
                  whileInView={rm ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: i * 0.08 + 0.1,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  whileHover={rm ? undefined : { y: -2 }}
                  className="flex-1 min-w-0 bg-white rounded-[20px] border border-slate-200/80 p-4 sm:p-5 shadow-[0_4px_20px_rgba(15,23,42,0.05)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.09)] transition-all duration-300 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {/* Icon inside Card */}
                    <motion.div
                      initial={rm ? undefined : { scale: 0.8 }}
                      whileInView={rm ? undefined : { scale: 1 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        delay: i * 0.08 + 0.15,
                      }}
                      className="flex items-center justify-center rounded-full shrink-0 w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundColor: step.soft,
                        border: `2px solid ${step.ring}`,
                      }}
                    >
                      <DynamicIcon
                        name={step.icon}
                        fallback={step.FallbackIcon}
                        className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                        style={{ color: step.color }}
                      />
                    </motion.div>

                    {/* Step Title */}
                    <h3
                      className="font-bold text-base sm:text-lg leading-snug truncate"
                      style={{ color: step.color }}
                    >
                      {step.title}
                    </h3>
                  </div>

                  {/* Step Description */}
                  <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════
            SECTION 3: FEATURES / BENEFITS BANNER
            ════════════════════════════════════════════ */}
        {features.length > 0 && (
          <motion.div
            initial={rm ? undefined : { opacity: 0, y: 28 }}
            whileInView={rm ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.5,
              ease: [0.215, 0.61, 0.355, 1],
            }}
            className="bg-white rounded-2xl p-5 sm:p-7 mx-auto mt-10 sm:mt-14 max-w-[1340px] border border-[rgba(226,232,240,0.8)] shadow-[0_14px_38px_rgba(15,23,42,0.085)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.12)] transition-shadow duration-300"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-y-0 lg:divide-x divide-slate-200 gap-3 sm:gap-6 lg:gap-0">
              {features.map((feat, i) => (
                <motion.div
                  key={`feat-banner-${i}`}
                  initial={rm ? undefined : { opacity: 0, y: 16 }}
                  whileInView={rm ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.08,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  whileHover={rm ? undefined : { y: -2 }}
                  className={`flex items-start gap-3.5 sm:gap-4 py-3.5 sm:py-3 lg:py-1 ${
                    i === 0 ? "lg:pr-6" : "lg:px-6"
                  }`}
                >
                  {/* Colored Icon on Left */}
                  <motion.div
                    whileHover={rm ? undefined : { scale: 1.12, rotate: 4 }}
                    transition={{ type: "spring", stiffness: 350, damping: 15 }}
                    className="flex shrink-0 h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: feat.soft,
                      color: feat.color,
                    }}
                  >
                    <DynamicIcon
                      name={feat.icon}
                      fallback={feat.FallbackIcon}
                      className="h-5 w-5"
                    />
                  </motion.div>

                  {/* Title & Subtext Stacked on Right */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {feat.title}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
