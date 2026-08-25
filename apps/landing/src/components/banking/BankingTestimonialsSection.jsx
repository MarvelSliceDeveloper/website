import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiChevronLeft, FiChevronRight, FiCheckCircle, FiUser } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

export default function BankingTestimonialsSection() {
  const { data: testimonials = [] } = useQuery({
    queryKey: ['banking_testimonials', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banking_testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = testimonials.length;

  useEffect(() => {
    if (isPaused || total <= 1) return undefined;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % total);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, total]);

  if (total === 0) return null;

  function handlePrev() {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  }

  function handleNext() {
    setActiveIndex((prev) => (prev + 1) % total);
  }

  const current = testimonials[activeIndex] || testimonials[0];

  return (
    <section className="relative py-10 sm:py-12 bg-slate-50/70 border-t border-[#E5ECF5] text-slate-800 overflow-hidden">
      {/* Background Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute -top-32 left-1/3 w-[350px] h-[350px] bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-brand-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <Reveal variant="up" className="text-center mb-8 sm:mb-12">
          <div className="inline-flex flex-col items-center">
            <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-dark-navy tracking-tight">
              Banking Aspirants, Real Success Stories
            </h2>
            <div className="mt-3.5 h-[3.5px] bg-brand-orange rounded-full w-16 sm:w-20" />
          </div>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-4 max-w-xl mx-auto font-normal">
            Hear from successful aspirants who transformed their preparation into results with focused guidance, expert mentorship, and structured training for IBPS and other banking examinations.
          </p>
        </Reveal>

        {/* Compact Reduced-Size Card Container */}
        <div
          className="max-w-3xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="bg-white border border-[#E5ECF5] hover:border-brand-orange/40 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id || activeIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="grid sm:grid-cols-12 items-stretch"
              >
                {/* LEFT IMAGE (~33% width / sm:col-span-4) */}
                <div className="sm:col-span-4 relative w-full h-44 sm:h-auto min-h-[160px] bg-slate-900 overflow-hidden group">
                  {current.avatar_url ? (
                    <img
                      src={current.avatar_url}
                      alt={current.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-blue via-blue-800 to-dark-navy flex flex-col items-center justify-center p-4 text-white text-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-1.5 border border-white/20">
                        <FiUser className="w-6 h-6 text-white/80" />
                      </div>
                      <span className="text-xl font-extrabold tracking-wide">
                        {(current.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Gradient Overlay & Verified Badge overlay on image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/70 via-transparent to-transparent opacity-70" />

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/80 shadow-2xs">
                    <div className="flex items-center gap-1 min-w-0">
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <FiCheckCircle className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-[10px] font-bold text-dark-navy truncate">
                        Verified
                      </span>
                    </div>
                    {current.exam_name && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-200 shrink-0">
                        {current.exam_name}
                      </span>
                    )}
                  </div>
                </div>

                {/* RIGHT CONTENTS (~67% width / sm:col-span-8) */}
                <div className="sm:col-span-8 p-4 sm:p-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5">
                    {/* Top Row: Exam Badge, Achievement Tag & Stars */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {current.exam_name && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-blue-50 text-brand-blue border border-blue-200/80">
                            {current.exam_name}
                          </span>
                        )}
                        {current.badge_text && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-50 text-brand-orange border border-amber-200/80">
                            {current.badge_text}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiStar
                            key={i}
                            className={`w-3.5 h-3.5 ${i < (parseInt(current.rating, 10) || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Quote Content */}
                    <div className="relative pt-0.5">
                      <svg className="absolute -top-2.5 -left-1.5 text-brand-blue/10 w-7 h-7 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                      <blockquote className="relative z-10 text-slate-700 text-xs sm:text-sm font-normal leading-relaxed italic pl-2 line-clamp-3">
                        &ldquo;{current.quote}&rdquo;
                      </blockquote>
                    </div>

                    {/* Candidate Details */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-dark-navy leading-snug">
                        {current.name}
                      </h3>
                      {current.role && (
                        <p className="text-[11px] font-semibold text-brand-orange mt-0.5">
                          {current.role}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Navigation Controls Row */}
                  {total > 1 && (
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 tracking-wider">
                        <span className="text-brand-blue font-mono">{String(activeIndex + 1).padStart(2, '0')}</span> / <span className="font-mono">{String(total).padStart(2, '0')}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrev}
                          className="p-1 sm:p-1.5 rounded-md bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-700 transition-all duration-200 cursor-pointer border border-slate-200 active:scale-95"
                          aria-label="Previous candidate"
                        >
                          <FiChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="p-1 sm:p-1.5 rounded-md bg-slate-100 hover:bg-brand-orange hover:text-white text-slate-700 transition-all duration-200 cursor-pointer border border-slate-200 active:scale-95"
                          aria-label="Next candidate"
                        >
                          <FiChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicator Dots Bar */}
          {total > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {testimonials.map((t, idx) => (
                <button
                  key={t.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeIndex === idx
                      ? 'w-6 bg-brand-orange shadow-2xs'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
