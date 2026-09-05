import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiBriefcase, FiAward } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

function TestimonialCard({ item }) {
  const count = Math.min(5, Math.max(1, parseInt(item.rating, 10) || 5));

  return (
    <div className="group relative w-full h-full min-h-[380px] sm:min-h-[420px] md:min-h-[460px] flex flex-col justify-center overflow-hidden rounded-3xl border border-blue-100/90 bg-white p-6 sm:p-10 md:p-12 shadow-[0_12px_36px_rgba(30,86,199,0.08)] transition-all duration-300 hover:shadow-[0_20px_48px_rgba(30,86,199,0.14)]">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-stretch h-full w-full relative z-10">
        {/* LEFT HALF (~ 5 cols): Image on top -> Below: Name, Position, Star Rating */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center text-center justify-center border-b md:border-b-0 md:border-r border-blue-100/80 pb-6 md:pb-0 md:pr-8 h-full">
          {/* Avatar Image */}
          <div className="relative shrink-0 rounded-2xl p-1.5 bg-gradient-to-tr from-brand-blue via-blue-500 to-brand-orange shadow-lg mb-4">
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt={item.name}
                className="h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 rounded-xl object-cover object-top border-2 border-white shadow-inner"
              />
            ) : (
              <div className="flex h-32 w-32 sm:h-40 sm:w-40 md:h-48 md:w-48 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-blue-700 text-3xl sm:text-4xl font-extrabold text-white border-2 border-white">
                {(item.name || '?').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1E48] tracking-tight leading-snug">{item.name}</h3>

          {/* Position & Bank Badges */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 min-h-[32px]">
            {item.role && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 px-3 py-1 text-xs sm:text-sm font-semibold text-[#1E56C7] border border-blue-100">
                <FiBriefcase className="w-3.5 h-3.5 text-[#1E56C7] shrink-0" />
                <span>{item.role}</span>
              </div>
            )}

            {item.bank_name && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 px-3 py-1 text-xs sm:text-sm font-semibold text-emerald-700 border border-emerald-200">
                <FiAward className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{item.bank_name}</span>
              </div>
            )}

            {!item.role && !item.bank_name && (item.exam_name || item.badge_text) && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 px-3 py-1 text-xs sm:text-sm font-semibold text-[#1E56C7] border border-blue-100">
                <FiBriefcase className="w-3.5 h-3.5 text-[#1E56C7] shrink-0" />
                <span>{item.exam_name || item.badge_text}</span>
              </div>
            )}
          </div>

          {/* Star Rating */}
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <FiStar key={i} className={`w-4 h-4 sm:w-5 sm:h-5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
        </div>

        {/* RIGHT HALF (~ 7 cols): Description / Quote Text */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col justify-center text-left md:pl-4 h-full">
          <p className="text-base sm:text-lg md:text-xl font-medium leading-relaxed text-slate-700 whitespace-pre-line text-justify [text-align-last:left]">
            {item.quote}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BankingTestimonialsSection() {
  const { data: items = [] } = useQuery({
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

  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const timerRef = useRef(null);
  const n = items.length;
  const tripled = n > 0 ? [...items, ...items, ...items] : [];

  useEffect(() => {
    if (n <= 1) return undefined;
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [n]);

  function startAutoScroll() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimate(true);
      setPos((prev) => prev + 1);
    }, 7000);
  }

  function stopAutoScroll() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function jumpTo(idx) {
    setAnimate(true);
    setPos(idx);
  }

  if (items.length === 0) return null;

  const activeIndex = pos % n;

  return (
    <section className="relative overflow-hidden pt-8 pb-16 bg-neutral-50 border-t border-gray-100">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-[720px] max-w-full -translate-x-1/2 rounded-full bg-brand-blue/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-48 w-96 max-w-full rounded-full bg-brand-orange/[0.06] blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy whitespace-pre-line">
              Banking Aspirants, Real Success Stories
            </h2>
            <div className="w-16 h-[3px] bg-brand-orange rounded-full mx-auto mt-3" />
            <p className="text-text-gray text-base sm:text-lg leading-relaxed mt-4 max-w-2xl mx-auto whitespace-pre-line">
              Hear from successful aspirants who transformed their preparation into results with focused guidance and structured training for banking examinations.
            </p>
          </div>
        </Reveal>

        {/* 1-at-a-time Carousel */}
        <div className="relative mx-auto w-full mt-6" onMouseEnter={stopAutoScroll} onMouseLeave={startAutoScroll}>
          <div className="overflow-hidden py-4">
            <motion.div
              animate={{ x: `-${pos * 100}%` }}
              transition={animate ? { duration: 0.65, ease: [0.25, 1, 0.5, 1] } : { duration: 0 }}
              onAnimationComplete={() => {
                if (pos >= n) {
                  setAnimate(false);
                  setPos(0);
                }
              }}
              className="flex items-stretch"
            >
              {tripled.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="h-full w-full shrink-0 px-2 flex">
                  <TestimonialCard item={item} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Pagination Indicators */}
          {n > 1 && (
            <div className="flex justify-center items-center gap-2.5 mt-8">
              {items.map((t, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={t.id || idx}
                    type="button"
                    aria-label={`Go to slide ${idx + 1}`}
                    onClick={() => jumpTo(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      isActive ? 'w-8 bg-brand-orange shadow-xs' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
