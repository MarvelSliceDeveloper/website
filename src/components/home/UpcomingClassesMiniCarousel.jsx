import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiBookOpen, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

const SLIDE_MS = 700;

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function ClassCard({ cls }) {
  const seatsLeft = cls.seats_left != null ? Number(cls.seats_left) : null;

  return (
    <div
      className="relative z-10 h-[168px] w-full flex flex-col bg-white rounded-2xl p-5 border border-[#EAEAEA] transition-transform duration-300 hover:-translate-y-1"
      style={{ boxShadow: '0 2px 8px rgba(17, 24, 39, 0.05)' }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand-blue">
          <FiBookOpen size={18} />
        </div>

        <h3 className="min-w-0 truncate text-[17px] font-semibold text-brand-blue">
          {cls.course_name}
        </h3>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs text-text-gray">
        <span>📅 {formatDate(cls.date_time)}</span>
        <span>•</span>
        <span>🕒 {formatTime(cls.date_time)}</span>
      </div>

      {seatsLeft != null && seatsLeft <= 5 && (
        <span className="mt-2 inline-flex w-fit items-center rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-semibold text-white">
          🔥 Only {seatsLeft} Seats Left
        </span>
      )}

      <div className="mt-auto pt-3">
        <a
          href={cls.registration_link || '/contact'}
          className="flex h-9 w-full items-center justify-center rounded-[10px] bg-brand-orange px-4 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#e0951f]"
        >
          Register Now
        </a>
      </div>
    </div>
  );
}

export default function UpcomingClassesMiniCarousel({ title = 'Upcoming Classes' }) {
  const { data: classes = [] } = useQuery({
    queryKey: ['upcomingClasses', 'active-mini'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upcoming_classes')
        .select('*')
        .eq('is_active', true)
        .order('date_time', { ascending: true });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return (data || []).filter((c) => c.date_time).sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    },
  });

  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  const count = classes.length;
  const canSlide = count > 1;

  useEffect(() => {
    setIndex(0);
    setNoTransition(false);
  }, [count]);

  useEffect(() => {
    if (!canSlide || paused) return;
    const t = setInterval(() => {
      setIndex((i) => {
        if (i >= count - 1) return count;
        return i + 1;
      });
    }, 7500);
    return () => clearInterval(t);
  }, [canSlide, paused, count]);

  const next = useCallback(() => {
    if (!canSlide) return;
    if (noTransition) setNoTransition(false);
    if (index >= count - 1) {
      setIndex(count);
    } else {
      setIndex((i) => i + 1);
    }
  }, [canSlide, count, index, noTransition]);

  const prev = useCallback(() => {
    if (!canSlide) return;
    if (noTransition) setNoTransition(false);
    if (index === 0) {
      setNoTransition(true);
      setIndex(count);
      requestAnimationFrame(() => {
        setNoTransition(false);
        setIndex(count - 1);
      });
    } else {
      setIndex((i) => i - 1);
    }
  }, [canSlide, count, index, noTransition]);

  const handleTransitionEnd = () => {
    if (index >= count && count > 0) {
      setNoTransition(true);
      setIndex(index - count);
    }
  };

  const items = [...classes, ...classes];

  return (
    <div
      className="mt-6 max-w-sm w-full mx-auto lg:ml-auto"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-end gap-3">
        {canSlide && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={prev}
              aria-label="Previous classes"
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-dark-navy hover:bg-brand-orange hover:text-white transition-colors duration-300"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next classes"
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-dark-navy hover:bg-brand-orange hover:text-white transition-colors duration-300"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {count === 0 ? (
        <p className="text-center text-text-gray text-sm mt-6">New batches will be announced soon.</p>
      ) : (
        <>
          <div className="relative w-full overflow-hidden rounded-2xl mt-4"
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const delta = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(delta) > 40) {
                if (delta < 0) next();
                else prev();
              }
            }}
          >
            <div
              className="flex w-full"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(-${index * 100}%)`,
                transition: noTransition ? 'none' : `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
                willChange: 'transform',
              }}
            >
              {items.map((cls, i) => (
                <div key={`${cls.id}-${i}`} className="w-full min-w-full shrink-0">
                  <ClassCard cls={cls} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <Link to="/upcoming-classes" className="inline-flex items-center gap-1 text-brand-orange font-medium text-xs hover:text-[#e0951f] transition-colors">
              View All →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
