import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiClock, FiCalendar, FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { formatDateTime } from '../../lib/datetime';

const GAP = 24;

function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="group block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
    >
      <div className="relative w-full h-44 bg-gradient-to-br from-brand-blue to-brand-orange">
        {course.hero_image_url ? (
          <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiCalendar className="w-8 h-8 text-white/70" />
          </div>
        )}
        <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          Coming Soon
        </span>
      </div>
      <div className="p-5 flex flex-col">
        <h4 className="font-semibold text-dark-navy text-base leading-snug group-hover:text-brand-orange transition-colors">
          {course.title}
        </h4>
        {course.start_date && (
          <p className="flex items-center gap-2 text-text-gray text-xs mt-2">
            <FiClock className="w-3.5 h-3.5 shrink-0 text-brand-orange" />
            <span>{formatDateTime(course.start_date)}</span>
          </p>
        )}
        <span className="inline-flex items-center gap-1.5 mt-4 text-brand-blue text-xs font-semibold">
          View Details <FiArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

export default function UpcomingCoursesSection({ section }) {
  const { data: courses = [] } = useQuery({
    queryKey: ['upcomingCourses', 'coming-soon'],
    queryFn: async () => {
      try {
        await supabase.rpc('promote_upcoming_courses');
      } catch {
        // RPC is optional; ignore if not available
      }
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug, start_date, status, hero_image_url')
        .eq('status', 'Coming Soon')
        .order('start_date', { ascending: true, nullsLast: true });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
  });

  const containerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [noTransition, setNoTransition] = useState(false);
  const [trackW, setTrackW] = useState(0);

  const N = courses.length;
  const isSlider = N > 4;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isSlider) return;
    const measure = () => setTrackW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isSlider]);

  useEffect(() => {
    setIndex(0);
    setNoTransition(false);
  }, [N]);

  const visible = trackW >= 1024 ? 4 : trackW >= 768 ? 2 : 1;
  const slideW = trackW > 0 && isSlider ? (trackW - (visible - 1) * GAP) / visible : 0;
  const pages = Math.ceil(N / visible);
  const page = isSlider ? Math.floor(index / visible) % pages : 0;
  const items = isSlider ? [...courses, ...courses, ...courses] : [];

  useEffect(() => {
    if (!isSlider || index >= N) return undefined;
    const t = setInterval(() => {
      setNoTransition(false);
      setIndex((i) => i + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [isSlider, index, N]);

  const handleTransitionEnd = () => {
    if (index >= N && N > 0) {
      setNoTransition(true);
      setIndex(index - N);
    }
  };

  function goNext() {
    if (!isSlider) return;
    setNoTransition(false);
    setIndex((i) => (i < N ? i + 1 : N));
  }

  function goPrev() {
    if (!isSlider) return;
    if (index === 0) {
      setNoTransition(true);
      setIndex(N);
      requestAnimationFrame(() => {
        setNoTransition(false);
        setIndex(N - 1);
      });
    } else {
      setIndex((i) => i - 1);
    }
  }

  const heading = section?.heading || '';
  const subheading = section?.subheading || '';

  if (!heading && courses.length === 0) return null;

  return (
    <section className="pt-8 pb-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
            <div className="text-center sm:text-left">
              <div className="inline-flex flex-col items-center sm:items-start">
                {heading && (
                  <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">{heading}</h2>
                )}
                <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-4/5" />
              </div>
              {subheading && (
                <p className="text-text-gray text-base sm:text-lg leading-relaxed mt-4">{subheading}</p>
              )}
            </div>
            {isSlider && (
              <div className="flex items-center gap-2 shrink-0 pt-1">
                <button
                  type="button"
                  aria-label="Previous courses"
                  onClick={goPrev}
                  className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-text-gray hover:text-brand-orange hover:border-brand-orange/40 transition-colors cursor-pointer"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next courses"
                  onClick={goNext}
                  className="w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center text-text-gray hover:text-brand-orange hover:border-brand-orange/40 transition-colors cursor-pointer"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {courses.length > 0 && (
          isSlider ? (
            <div className="relative mt-8">
              <div className="overflow-hidden" ref={containerRef}>
                <div
                  className="flex"
                  onTransitionEnd={handleTransitionEnd}
                  style={{
                    gap: `${GAP}px`,
                    transform: `translateX(-${index * (slideW + GAP)}px)`,
                    transition: noTransition ? 'none' : `transform 600ms cubic-bezier(0.22, 1, 0.36, 1)`,
                    willChange: 'transform',
                  }}
                >
                  {items.map((course, i) => (
                    <div key={`${course.id}-${i}`} className="shrink-0" style={{ width: `${slideW}px` }}>
                      <CourseCard course={course} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: pages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to course page ${i + 1}`}
                    onClick={() => setIndex(i * visible)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${i === page ? 'w-6 bg-brand-orange' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  );
}
