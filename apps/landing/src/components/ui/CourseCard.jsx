import { Link } from 'react-router-dom';
import { FiStar, FiBookOpen, FiClock, FiMonitor } from 'react-icons/fi';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';

const bannerHeights = { sm: 'h-40', md: 'h-44', lg: 'h-48' };
const contentPaddings = { sm: 'p-5', md: 'p-5', lg: 'p-6' };

export default function CourseCard({
  course,
  bannerSize = 'md',
  showReviewCount = false,
  showViewLink = false,
  variant = 'icon',
}) {
  const queryClient = useQueryClient();
  const bannerH = bannerHeights[bannerSize] || bannerHeights.md;
  const pad = contentPaddings[bannerSize] || contentPaddings.md;
  const titleSize = bannerSize === 'lg' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg';

  function handlePrefetch() {
    if (course?.slug) {
      queryClient.prefetchQuery({
        queryKey: ['course', course.slug],
        queryFn: () =>
          supabase
            .from('courses')
            .select('*, highlights(*), overview_faqs(*), course_fees(*), projects(*), certifications(*), course_tabs(*), faqs(*)')
            .eq('slug', course.slug)
            .eq('is_published', true)
            .maybeSingle()
            .then(({ data }) => data || null),
        staleTime: 0,
      });
    }
  }

  function renderBanner() {
    if (course.hero_image_url) {
      return <img src={course.hero_image_url} alt={course.title} className="w-full h-full object-cover" />;
    }
    if (variant === 'initial') {
      return <span className="text-white/15 text-4xl sm:text-5xl font-bold">{course.title?.charAt(0)}</span>;
    }
    return <FiBookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-white/30" />;
  }

  return (
    <Link to={`/courses/${course.slug}`}
      onMouseEnter={handlePrefetch}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group h-full flex flex-col"
    >
      <div className={`${bannerH} bg-gradient-to-br from-brand-blue to-dark-navy flex items-center justify-center shrink-0 overflow-hidden`}>
        <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none">
          {renderBanner()}
        </div>
      </div>
      <div className={`${pad} flex flex-col flex-1`}>
        <h3 className={`font-bold text-dark-navy ${titleSize} group-hover:text-brand-orange transition-colors`}>
          {course.title}
        </h3>
        <p className="text-sm text-text-gray mt-2 line-clamp-2 flex-1">{course.description}</p>
        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          {course.duration && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <FiClock className="w-3 h-3" /> {course.duration}
            </span>
          )}
          {course.mode && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <FiMonitor className="w-3 h-3" /> {course.mode}
            </span>
          )}
          {course.status && course.status !== 'Active' && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              course.status === 'Coming Soon' ? 'text-amber-600 bg-amber-50' : 'text-gray-400 bg-gray-100'
            }`}>
              {course.status}
            </span>
          )}
        </div>
        <div className={`flex items-center ${showViewLink ? 'justify-between' : 'gap-4'} pt-4 border-t border-gray-100 text-sm text-text-gray mt-auto`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-500 fill-current" />
              {course.rating || 4.5}
            </span>
            {showReviewCount && (
              <span className="text-text-gray">({course.review_count || 0})</span>
            )}
            <span>{(course.learner_count || 0).toLocaleString()} {(bannerSize === 'lg' ? 'learners' : 'Learners')}</span>
          </div>
          {showViewLink && (
            <span className="text-sm font-semibold text-brand-orange">View Course &rarr;</span>
          )}
        </div>
      </div>
    </Link>
  );
}
