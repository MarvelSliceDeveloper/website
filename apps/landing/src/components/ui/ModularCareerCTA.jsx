import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Reveal from './Reveal';

export default function ModularCareerCTA({
  sectionHeader,
  eyebrow = 'READY FOR THE NEXT STEP?',
  title = 'Your Banking Career Starts with the Right Choice',
  description = 'Find the banking exam that matches your goals, understand the role, and start preparing with confidence.',
  buttonText = 'Explore Banking Paths',
  onButtonClick,
  modules = [
    {
      id: 'mod-01',
      number: '01',
      title: 'Choose Your Path',
      description: 'Compare officer, branch operations, and specialist banking opportunities.',
      onClick: () => {
        const el = document.getElementById('section-01');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'mod-02',
      number: '02',
      title: 'Prepare with Purpose',
      description: 'Understand the role, exam structure, and preparation direction before you begin.',
      isActive: true,
      onClick: () => {
        const el = document.getElementById('why-prepare-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'mod-03',
      number: '03',
      title: 'Start Your Career',
      description: 'Take the next step toward building a professional career in banking.',
      onClick: onButtonClick,
    },
  ],
}) {
  const reduce = useReducedMotion();
  const [activeModule, setActiveModule] = useState('mod-02');

  // Generate 16 deterministic particles for full-width background depth
  const particles = [
    { top: '15%', left: '8%', size: '3px', duration: '6s', delay: '0s' },
    { top: '25%', left: '35%', size: '4px', duration: '8s', delay: '1s' },
    { top: '70%', left: '18%', size: '2px', duration: '5s', delay: '2s' },
    { top: '80%', left: '55%', size: '3px', duration: '7s', delay: '0.5s' },
    { top: '40%', left: '82%', size: '4px', duration: '9s', delay: '1.5s' },
    { top: '10%', left: '72%', size: '2px', duration: '6s', delay: '2.5s' },
    { top: '60%', left: '30%', size: '3px', duration: '7.5s', delay: '3s' },
    { top: '85%', left: '88%', size: '2px', duration: '5.5s', delay: '1.2s' },
    { top: '30%', left: '12%', size: '4px', duration: '8.5s', delay: '0.8s' },
    { top: '50%', left: '48%', size: '2px', duration: '6.5s', delay: '2.1s' },
    { top: '20%', left: '92%', size: '3px', duration: '7s', delay: '1.7s' },
    { top: '75%', left: '4%', size: '2px', duration: '6.2s', delay: '0.3s' },
    { top: '18%', left: '50%', size: '3px', duration: '7.2s', delay: '1.1s' },
    { top: '65%', left: '68%', size: '2px', duration: '6.8s', delay: '2.3s' },
    { top: '35%', left: '25%', size: '4px', duration: '8.1s', delay: '0.7s' },
    { top: '82%', left: '42%', size: '3px', duration: '5.8s', delay: '1.9s' },
  ];

  return (
    <section className="relative py-14 sm:py-20 cta-animated-bg text-white overflow-hidden w-full shadow-2xl shadow-blue-950/20 border-y border-white/10">
      {/* Embedded CSS Animations for high-performance background effects */}
      <style>{`
        @keyframes subtle-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float-orb-1 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(40px, 25px) scale(1.1); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float-orb-2 {
          0% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-35px, -20px) scale(1.08); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes particle-float {
          0% { transform: translateY(0px); opacity: 0.2; }
          50% { transform: translateY(-14px); opacity: 0.75; }
          100% { transform: translateY(0px); opacity: 0.2; }
        }
        @keyframes light-streak {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); opacity: 0; }
          20% { opacity: 0.15; }
          40% { transform: translateX(200%) translateY(200%) rotate(45deg); opacity: 0; }
          100% { transform: translateX(200%) translateY(200%) rotate(45deg); opacity: 0; }
        }
        .cta-animated-bg {
          background: linear-gradient(135deg, #0b192e 0%, #163e8c 35%, #1e56c7 70%, #0d2347 100%);
          background-size: 200% 200%;
          animation: subtle-gradient 16s ease infinite;
        }
        .orb-glow-1 {
          animation: float-orb-1 12s ease-in-out infinite;
        }
        .orb-glow-2 {
          animation: float-orb-2 15s ease-in-out infinite;
        }
        .light-streak-anim {
          animation: light-streak 14s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cta-animated-bg, .orb-glow-1, .orb-glow-2, .light-streak-anim, .particle-item {
            animation: none !important;
          }
        }
      `}</style>

      {/* LAYER 2 & 3 — ATMOSPHERIC GLOW ORBS */}
      {!reduce && (
        <>
          <div className="orb-glow-1 absolute -top-32 left-10 w-96 h-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
          <div className="orb-glow-2 absolute -bottom-32 right-10 w-96 h-96 rounded-full bg-brand-orange/25 blur-3xl pointer-events-none" />
        </>
      )}

      {/* LAYER 4 — LINEAR GRID PATTERN */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* LAYER 5 — FLOATING PARTICLES */}
      {!reduce && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map((p, idx) => (
            <span
              key={idx}
              className="particle-item absolute rounded-full bg-white/75"
              style={{
                top: p.top,
                left: p.left,
                width: p.size,
                height: p.size,
                animation: `particle-float ${p.duration} ease-in-out infinite ${p.delay}`,
              }}
            />
          ))}
        </div>
      )}

      {/* LAYER 6 — LIGHT STREAK */}
      {!reduce && (
        <div className="light-streak-anim absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      )}

      {/* FOREGROUND CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {sectionHeader && (
          <div className="text-center mb-6 sm:mb-8">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
              {sectionHeader}
            </span>
          </div>
        )}

        <Reveal variant="up">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* LEFT COLUMN: Main CTA Content (~58% width) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-2.5">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-amber-300">
                    {eyebrow}
                  </span>
                  <div className="h-[2px] w-8 bg-brand-orange rounded-full" />
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-white leading-[1.15]">
                  {title}
                </h2>
              </div>

              <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-xl">
                {description}
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="group inline-flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-brand-orange to-amber-500 hover:from-brand-orange/90 hover:to-amber-500/90 text-white rounded-full font-bold text-sm shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all cursor-pointer active:scale-95"
                >
                  <span>{buttonText}</span>
                  <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: 3 Glassmorphism Modules (~42% width) */}
            <div className="lg:col-span-5 relative">
              {/* Vertical connecting line between 01 -> 02 -> 03 */}
              <div className="hidden lg:block absolute left-[27px] top-[30px] bottom-[30px] w-[2px] bg-gradient-to-b from-white/10 via-amber-400/40 to-white/10 pointer-events-none z-0" />

              <div className="relative z-10 space-y-3.5">
                {modules.map((mod, idx) => {
                  const modId = mod.id || `mod-0${idx + 1}`;
                  const isActive = activeModule === modId;

                  return (
                    <div
                      key={modId}
                      onMouseEnter={() => setActiveModule(modId)}
                      onClick={(e) => {
                        setActiveModule(modId);
                        if (mod.onClick) mod.onClick(e);
                      }}
                      className={`group relative flex items-center justify-between p-4 sm:p-5 rounded-2xl backdrop-blur-md transition-all duration-300 cursor-pointer shadow-sm ${
                        isActive
                          ? 'bg-white/20 border-2 border-brand-orange/90 shadow-lg shadow-orange-950/30 translate-x-1'
                          : 'bg-white/10 hover:bg-white/15 border border-white/20 hover:border-brand-orange/60 hover:translate-x-1'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 pr-2">
                        <span
                          className={`text-xs font-black font-mono px-2 py-1 rounded-md shrink-0 transition-colors ${
                            isActive
                              ? 'bg-brand-orange text-white'
                              : 'bg-white/15 text-amber-300 group-hover:bg-brand-orange group-hover:text-white'
                          }`}
                        >
                          {mod.number}
                        </span>
                        <div className="space-y-0.5">
                          <h3
                            className={`text-sm sm:text-base font-bold transition-colors ${
                              isActive ? 'text-white font-extrabold' : 'text-slate-100 group-hover:text-white'
                            }`}
                          >
                            {mod.title}
                          </h3>
                          <p className="text-[12px] sm:text-xs text-slate-200/90 leading-snug font-normal line-clamp-2">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? 'bg-brand-orange text-white'
                            : 'bg-white/15 text-white/80 group-hover:bg-brand-orange group-hover:text-white'
                        }`}
                      >
                        <FiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
