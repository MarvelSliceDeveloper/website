import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiBriefcase, FiAward } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

function TestimonialCard({ item }) {
  const count = Math.min(5, Math.max(1, parseInt(item.rating, 10) || 5));

  return (
    <div className="group relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-blue-100/80 bg-white p-6 sm:p-8 md:px-10 shadow-[0_10px_28px_rgba(30,86,199,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(30,86,199,0.13)]">
      {/* Background Watermark Quotation Marks */}
      <span aria-hidden="true" className="pointer-events-none absolute top-4 right-8 select-none font-serif text-6xl text-blue-100/60 font-bold leading-none">
        ”
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute bottom-4 right-8 select-none font-serif text-6xl text-blue-100/60 font-bold leading-none">
        ”
      </span>

      {/* TOP HEADER: Avatar + Name + Badge + Star Rating */}
      <div className="relative z-10 flex items-center gap-4 sm:gap-6 text-left">
        {/* Avatar with Outer Ring Glow */}
        <div className="relative shrink-0 rounded-full p-1 bg-white ring-4 ring-blue-100/80 shadow-md border border-blue-200/50">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.name} className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover object-top" />
          ) : (
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-blue-600 text-lg font-bold text-white">
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[#0B1E48] tracking-tight leading-snug break-words">{item.name}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {item.role && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 px-3 py-0.5 text-xs sm:text-sm font-semibold text-[#1E56C7] border border-blue-100/80 w-fit max-w-full">
                <FiBriefcase className="w-3.5 h-3.5 text-[#1E56C7] shrink-0" />
                <span className="leading-snug break-words">{item.role}</span>
              </div>
            )}

            {item.bank_name && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/90 px-3 py-0.5 text-xs sm:text-sm font-semibold text-emerald-700 border border-emerald-200/80 w-fit max-w-full">
                <FiAward className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="leading-snug break-words">{item.bank_name}</span>
              </div>
            )}

            {!item.role && !item.bank_name && (item.exam_name || item.badge_text) && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 px-3 py-0.5 text-xs sm:text-sm font-semibold text-[#1E56C7] border border-blue-100/80 w-fit max-w-full">
                <FiBriefcase className="w-3.5 h-3.5 text-[#1E56C7] shrink-0" />
                <span className="leading-snug break-words">{item.exam_name || item.badge_text}</span>
              </div>
            )}
          </div>

          {/* Star Rating */}
          <div className="mt-1.5 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <FiStar key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal Divider Line */}
      <div className="relative z-10 my-4 sm:my-5 border-t border-blue-50/90" />

      {/* QUOTE CONTENT BODY */}
      <div className="relative z-10 flex-1 flex flex-col justify-start">
        <p className="text-justify [text-align-last:left] text-sm sm:text-base md:text-[17px] font-medium leading-relaxed text-slate-700 whitespace-pre-line">
          “{item.quote}”
        </p>
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
  const [visibleCount, setVisibleCount] = useState(2);
  const timerRef = useRef(null);
  const n = items.length;
  const tripled = n > 0 ? [...items, ...items, ...items] : [];

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setVisibleCount(w >= 1024 ? 2 : 1);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const shouldScroll = n > visibleCount;

  useEffect(() => {
    if (!shouldScroll) return undefined;
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [shouldScroll, visibleCount, n]);

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
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {!shouldScroll ? (
          /* Grid mode when items are <= visibleCount */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4 max-w-7xl mx-auto">
            {items.map((item) => (
              <TestimonialCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          /* Seamless Carousel mode when items > visibleCount */
          <div className="relative mx-auto w-full mt-6" onMouseEnter={stopAutoScroll} onMouseLeave={startAutoScroll}>
            <div className="overflow-hidden py-4">
              <motion.div
                animate={{ x: `-${pos * (100 / visibleCount)}%` }}
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
                  <div key={`${item.id}-${idx}`} className="h-full shrink-0 px-3 flex" style={{ width: `${100 / visibleCount}%` }}>
                    <TestimonialCard item={item} />
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Pagination Indicators */}
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
          </div>
        )}
      </div>
    </section>
  );
}
