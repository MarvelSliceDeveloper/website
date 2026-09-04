import HeroBackground from './HeroBackground';
import { FiArrowLeft, FiCheckCircle, FiPlay, FiBarChart2 } from 'react-icons/fi';

function VideoVisual({ embedUrl, videoPlaying, setVideoPlaying, trackVideoPlay, course }) {
  return (
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
  );
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

  const rawPoints = course.checklist_items || course.points || course.highlights || [];
  const points = (Array.isArray(rawPoints) ? rawPoints : []).filter(Boolean).slice(0, 6);

  return (
    <section className="relative overflow-hidden bg-white py-8 sm:py-14 lg:py-16">
      {/* Reusable Modular Hero Visual Background */}
      <HeroBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link - Hidden on Mobile */}
        {handleBackNavigation && (
          <button
            type="button"
            onClick={handleBackNavigation}
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E56C7] hover:text-blue-700 transition-colors mb-5 cursor-pointer group"
          >
            <FiArrowLeft className="w-4 h-4 text-[#1E56C7] group-hover:-translate-x-1 transition-transform duration-200" />
            <span>Back</span>
          </button>
        )}

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT SIDE (Content) ~ 48% width */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Dynamic Title */}
            <h1 className="text-[22px] sm:text-3xl lg:text-4xl xl:text-[2.65rem] font-extrabold text-[#1E56C7] leading-tight tracking-tight max-w-xl text-left whitespace-pre-line">
              {course.title}
            </h1>

            {/* Optional Status Badge */}
            {course.status && course.status !== 'Active' && (
              <span className="inline-block mt-3 align-middle text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200/60">
                {course.status}
              </span>
            )}

            {/* Dynamic Description */}
            {course.description && (
              <p className="mt-4 lg:mt-5 text-xs sm:text-base lg:text-lg text-slate-600 leading-relaxed lg:leading-[1.6] text-justify [text-align-last:left] sm:text-left sm:indent-0 w-full indent-6 whitespace-pre-line max-w-[600px]">
                {course.description}
              </p>
            )}

            {/* Dynamic Course Points */}
            {points.length > 0 && (
              <div className="mt-5 lg:mt-6 w-full max-w-[600px]">
                <div className="grid grid-cols-2 lg:block lg:space-y-2.5 gap-2.5 sm:gap-3.5 text-left">
                  {points.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 sm:gap-2.5 min-w-0">
                      <FiCheckCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-[10px] sm:text-sm lg:text-[15px] font-medium text-slate-600 leading-snug break-words">
                        {typeof item === 'string' ? item.slice(0, 85) : (item?.label || item?.title || '').slice(0, 85)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Only: Video directly after description and text */}
            <div className="lg:hidden w-full mt-6">
              <VideoVisual
                embedUrl={embedUrl}
                videoPlaying={videoPlaying}
                setVideoPlaying={setVideoPlaying}
                trackVideoPlay={trackVideoPlay}
                course={course}
              />
            </div>

            {/* Mobile CTA Buttons: 2-in-1 line side-by-side below video */}
            <div className="flex lg:hidden flex-row items-center justify-center gap-2.5 sm:gap-3 mt-6 w-full max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  if (onLeftCtaClick) {
                    onLeftCtaClick();
                  } else {
                    openEnquiryModal?.(course.cta_left || 'Talk to Advisor/Pay Now');
                  }
                }}
                className="flex-1 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-brand-orange hover:bg-amber-600 text-white font-bold text-[10px] sm:text-sm rounded-full shadow-md active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-center"
              >
                {course.cta_left || 'Talk to Advisor/Pay Now'}
              </button>

              <button
                type="button"
                onClick={() => openEnquiryModal?.(course.cta_right || 'Download Brochure')}
                className="flex-1 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-[10px] sm:text-sm rounded-full shadow-md active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap text-center"
              >
                {course.cta_right || 'Download Brochure'}
              </button>
            </div>

            {/* Desktop CTA Buttons: Standard placement */}
            <div className="hidden lg:flex flex-row items-center justify-start gap-3.5 mt-8 w-auto">
              <button
                type="button"
                onClick={() => {
                  if (onLeftCtaClick) {
                    onLeftCtaClick();
                  } else {
                    openEnquiryModal?.(course.cta_left || 'Talk to Advisor/Pay Now');
                  }
                }}
                className="px-8 py-3.5 bg-brand-orange hover:bg-amber-600 text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
              >
                {course.cta_left || 'Talk to Advisor/Pay Now'}
              </button>

              <button
                type="button"
                onClick={() => openEnquiryModal?.(course.cta_right || 'Download Brochure')}
                className="px-8 py-3.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap"
              >
                {course.cta_right || 'Download Brochure'}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE (Desktop Video Visual) ~ 52% width */}
          <div className="hidden lg:flex lg:col-span-6 relative items-center justify-center w-full lg:translate-y-6">
            <VideoVisual
              embedUrl={embedUrl}
              videoPlaying={videoPlaying}
              setVideoPlaying={setVideoPlaying}
              trackVideoPlay={trackVideoPlay}
              course={course}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
