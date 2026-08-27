import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiStar } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';

function TestimonialCard({ item }) {
  const count = Math.min(5, Math.max(1, parseInt(item.rating, 10) || 5));
  return (
    <div className="group relative flex h-[240px] w-full flex-col overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white p-5 shadow-[0_10px_25px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_2px_6px_rgba(0,0,0,0.07),0_18px_44px_rgba(0,0,0,0.15)]">
      <div className="flex flex-1 min-h-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10">
          <span aria-hidden="true" className="select-none font-serif text-xl font-bold leading-none text-brand-blue">&ldquo;</span>
        </div>
        <blockquote className="flex-1 text-[15px] leading-[1.6] text-text-gray line-clamp-4">
          “{item.quote}”
        </blockquote>
      </div>
      <div className="mt-3 flex items-start gap-3 border-t border-gray-100 pt-3">
        <div className="shrink-0 rounded-full bg-gradient-to-br from-brand-blue to-brand-orange p-[2px]">
          {item.avatar_url ? (
            <img src={item.avatar_url} alt={item.name} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-base font-bold text-brand-blue">
              {(item.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-dark-navy">{item.name}</p>
          {item.role && <p className="mt-0.5 truncate text-xs text-text-gray">{item.role}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <FiStar key={i} className={`w-3.5 h-3.5 ${i < count ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection({ section }) {
  const { data: items = [] } = useQuery({
    queryKey: ['testimonials', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(6);
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
  });

  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const timerRef = useRef(null);
  const n = items.length;
  const isSlider = n > 0;
  const visible = visibleCount;
  const doubled = n > 0 ? [...items, ...items, ...items] : [];

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setVisibleCount(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (n === 0) return undefined;
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [n, visibleCount]);

  function startAutoScroll() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimate(true);
      setPos((prev) => prev + 1);
    }, 7500);
  }

  function stopAutoScroll() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function jumpTo(dotIndex) {
    setAnimate(true);
    const stepSize = Math.max(1, Math.ceil(n / 3));
    setPos(dotIndex * stepSize);
  }

  if (!section) return null;

  const content = section.content || {};
  const heading = content.heading || section.heading || 'What Our Students Say';
  const subheading = content.subheading || section.subheading || '';

  if (items.length === 0) return null;

  // Active dot calculation (always 3 dots max)
  const groupSize = Math.max(1, Math.ceil(n / 3));
  const activeDotIndex = Math.floor((pos % n) / groupSize);

  return (
    <section className="relative overflow-hidden pt-8 pb-16 bg-neutral-50">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-64 w-[720px] max-w-full -translate-x-1/2 rounded-full bg-brand-blue/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-48 w-96 max-w-full rounded-full bg-brand-orange/[0.06] blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              {heading && (
                <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">{heading}</h2>
              )}
              <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-4/5" />
            </div>
            {subheading && (
              <p className="text-text-gray text-base sm:text-lg leading-relaxed mt-4 mb-10">{subheading}</p>
            )}
          </div>
        </Reveal>

        <div className="relative mx-auto w-full mt-12" onMouseEnter={stopAutoScroll} onMouseLeave={startAutoScroll}>
          <div className="overflow-hidden py-4">
            <motion.div
              animate={{ x: `-${pos * (100 / visible)}%` }}
              transition={animate ? { duration: 0.65, ease: [0.25, 1, 0.5, 1] } : { duration: 0 }}
              onAnimationComplete={() => {
                if (pos >= n) {
                  setAnimate(false);
                  setPos(0);
                }
              }}
              className="flex items-stretch"
            >
              {doubled.map((item, i) => (
                <div key={`${item.id}-${i}`} className="h-full shrink-0 px-3" style={{ width: `${100 / visible}%` }}>
                  <TestimonialCard item={item} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* EXACTLY 3 PAGINATION DOT INDICATORS (...) */}
          <div className="flex justify-center items-center gap-2.5 mt-8">
            {[0, 1, 2].map((dotIndex) => {
              const isActive = activeDotIndex === dotIndex;
              return (
                <button
                  key={dotIndex}
                  type="button"
                  aria-label={`Go to slide group ${dotIndex + 1}`}
                  onClick={() => jumpTo(dotIndex)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive ? 'w-8 bg-brand-orange shadow-xs' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
