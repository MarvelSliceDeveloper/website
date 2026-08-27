import HeroBackground from './HeroBackground';
import { FiArrowLeft, FiCheck, FiCheckCircle, FiMessageCircle, FiArrowRight, FiDownload, FiPlay, FiBarChart2 } from 'react-icons/fi';

/**
 * Dynamically split any course title into a 2-line visual hierarchy.
 * Line 1: Marvel Slice Primary Blue
 * Line 2: Marvel Slice Orange Accent
 */
function splitCourseTitle(title) {
  if (!title) return { line1: '', line2: '' };
  const words = title.trim().split(/\s+/);
  if (words.length === 1) {
    return { line1: words[0], line2: '' };
  }
  if (words.length === 2) {
    return { line1: words[0], line2: words[1] };
  }

  const lastWord = words[words.length - 1];
  const commonSuffixes = [
    'masterclass', 'bootcamp', 'program', 'course', 'specialization',
    'certification', 'diploma', 'training', 'essentials', 'fundamentals',
    'advanced', 'pro', 'express', 'complete', 'series'
  ];

  if (commonSuffixes.includes(lastWord.toLowerCase()) && words.length > 2) {
    return {
      line1: words.slice(0, words.length - 1).join(' '),
      line2: lastWord,
    };
  }

  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' '),
    line2: words.slice(mid).join(' '),
  };
}

export default function CourseHero({
  course,
  handleBackNavigation,
  openEnquiryModal,
  onLeftCtaClick,
  videoPlaying,
  setVideoPlaying,
  trackVideoPlay,
  embedUrl,
}) {
  if (!course) return null;

  const { line1, line2 } = splitCourseTitle(course.title);
  const rawPoints = course.checklist_items || course.points || course.highlights || [];
  const points = (Array.isArray(rawPoints) ? rawPoints : []).filter(Boolean).slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-white py-10 sm:py-14 lg:py-16">
      {/* Reusable Modular Hero Visual Background */}
      <HeroBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        {handleBackNavigation && (
          <button
            type="button"
            onClick={handleBackNavigation}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E56C7] hover:text-blue-700 transition-colors mb-5 cursor-pointer group"
          >
            <FiArrowLeft className="w-4 h-4 text-[#1E56C7] group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back</span>
          </button>
        )}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT SIDE (Content) ~ 48% width */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Dynamic Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.65rem] font-extrabold text-[#1E56C7] leading-tight tracking-tight max-w-xl">
              <span>{line1}</span>
              {line2 && <span className="block mt-0.5">{line2}</span>}
            </h1>

            {/* Optional Status Badge */}
            {course.status && course.status !== 'Active' && (
              <span className="inline-block mt-3 align-middle text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                {course.status}
              </span>
            )}

            {/* Dynamic Description */}
            {course.description && (
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-[1.6] max-w-[600px]">
                {course.description}
              </p>
            )}

            {/* Dynamic Course Points (Clean Compact Vertical List) */}
            {points.length > 0 && (
              <div className="mt-6 w-full max-w-[600px]">
                <div className="space-y-2.5 text-left">
                  {points.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <FiCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[14px] sm:text-[15px] font-medium text-slate-600 leading-snug">
                        {typeof item === 'string' ? item.slice(0, 85) : (item?.label || item?.title || '').slice(0, 85)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 mt-8 w-full sm:w-auto">
              {/* Left CTA - Solid Orange */}
              <button
                type="button"
                onClick={() => {
                  if (onLeftCtaClick) {
                    onLeftCtaClick();
                  } else {
                    openEnquiryModal?.(course.cta_left || 'Talk to Advisor/Pay Now');
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold text-sm sm:text-base rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
              >
                {course.cta_left || 'Talk to Advisor/Pay Now'}
              </button>

              {/* Right CTA - White with Blue Border */}
              <button
                type="button"
                onClick={() => openEnquiryModal?.(course.cta_right || 'Download Brochure')}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-blue-50/50 text-[#1E56C7] font-semibold text-sm sm:text-base rounded-xl border-2 border-[#1E56C7] hover:border-blue-700 transition-all duration-200 cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
              >
                {course.cta_right || 'Download Brochure'}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE (Large Dynamic Video Visual) ~ 52% width */}
          <div className="lg:col-span-6 relative flex items-center justify-center w-full mt-10 lg:mt-14 lg:translate-y-6">
            {/* Clean Premium Video Container (No colored lines, borders, or corner overlays) */}
            <div className="w-full relative z-10 rounded-2xl lg:rounded-3xl bg-slate-900 shadow-xl overflow-hidden group">
              {embedUrl && !videoPlaying ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video group-hover:scale-[1.008] transition-transform duration-500">
                  {course.hero_image_url ? (
                    <img
                      src={course.hero_image_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                      <FiBarChart2 className="w-16 h-16 text-white/30" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setVideoPlaying?.(true);
                      trackVideoPlay?.(course.title);
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/35 transition-colors cursor-pointer"
                    aria-label="Play course video"
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300">
                      <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                      <FiPlay className="w-7 h-7 sm:w-8 sm:h-8 text-[#1E56C7] ml-1 relative z-10" />
                    </div>
                  </button>
                </div>
              ) : embedUrl && videoPlaying ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                  <iframe
                    src={`${embedUrl}?autoplay=1&mute=1&controls=1`}
                    title="Course Introduction Video"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : course.hero_image_url ? (
                <div className="relative rounded-2xl overflow-hidden aspect-video">
                  <img
                    src={course.hero_image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="rounded-2xl aspect-video bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
                  <FiBarChart2 className="w-16 h-16 text-white/30 mb-2" />
                  <p className="text-white/70 text-sm font-medium">{course.title}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
