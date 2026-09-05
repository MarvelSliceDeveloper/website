"use client";
import { IconCheck, IconPlayerPlay } from "@tabler/icons-react";
import HeroBackground from "./HeroBackground";

function getYoutubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  const patterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, /^([a-zA-Z0-9_-]{11})$/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

function VideoVisual({ embedUrl, course }: { embedUrl: string | null; course: any }) {
  const img = course.coverImageUrl || course.thumbnailUrl;
  if (embedUrl) {
    return (
      <div className="w-full relative rounded-2xl overflow-hidden aspect-video bg-black">
        <iframe src={`${embedUrl}?autoplay=0&controls=1`} title="Course video" className="w-full h-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  if (img) {
    return (
      <div className="w-full rounded-2xl overflow-hidden aspect-video bg-slate-900">
        <img src={img} alt={course.title} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className="w-full rounded-2xl aspect-video bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
      <IconPlayerPlay size={48} className="text-white/30 mb-2" />
      <p className="text-white/70 text-sm">{course.title}</p>
    </div>
  );
}

export default function CourseHero({ course, onEnroll, onEnquire }: { course: any; onEnroll?: () => void; onEnquire?: () => void }) {
  const points = (course.learningObjectives || course.highlights || []) as any[];
  const embedUrl = getYoutubeEmbedUrl(course.videoUrl || course.modules?.[0]?.lessons?.[0]?.videoUrl);
  return (
    <section className="relative overflow-hidden bg-white py-8 sm:py-14 lg:py-16">
      <HeroBackground />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <h1 className="text-[22px] sm:text-3xl lg:text-4xl font-extrabold text-primary leading-tight">{course.title}</h1>
            {course.description && <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed whitespace-pre-line max-w-[600px]">{course.description}</p>}
            {points.length > 0 && (
              <div className="mt-6 w-full max-w-[600px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {points.slice(0, 6).map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <IconCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-600">{typeof item === "string" ? item.slice(0, 85) : (item?.label || item?.title || "").slice(0, 85)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-8">
              {course.price != null && course.price > 0 ? (
                <>
                  <button onClick={onEnroll} className="px-8 py-3.5 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-full shadow-md transition-colors">
                    Enroll Now — ₹{(course.price / 100).toLocaleString("en-IN")}
                  </button>
                  <button onClick={onEnquire} className="px-8 py-3.5 bg-white border border-border text-foreground font-bold text-sm rounded-full hover:bg-card transition-colors">Talk to Advisor</button>
                </>
              ) : (
                <button onClick={onEnquire} className="px-8 py-3.5 bg-primary text-white font-bold text-sm rounded-full">Enquire Now</button>
              )}
            </div>
          </div>
          <div className="lg:col-span-6 flex items-center justify-center w-full">
            <VideoVisual embedUrl={embedUrl} course={course} />
          </div>
        </div>
      </div>
    </section>
  );
}
