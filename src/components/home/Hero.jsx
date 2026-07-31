import { useState } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Button from '../ui/Button';
import { staggerContainer, staggerItem, fadeLeft } from '../../lib/motion';

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`;
  }
  return null;
}

export default function Hero({ section }) {
  const [showVideo, setShowVideo] = useState(false);
  const reduce = useReducedMotion();
  const container = reduce ? undefined : staggerContainer;
  const item = reduce ? undefined : staggerItem;
  const mount = reduce ? {} : { initial: 'hidden', animate: 'visible' };

  if (!section) return null;

  const heading = section.heading || '';
  const subheading = section.subheading || '';
  const content = section.content || {};
  const description = content.description || '';
  const ctaLeft = content.cta_left || 'Talk to Advisor';
  const ctaRight = content.cta_right || 'Download Brochure';
  const checklist = (content.checklist || '').split('\n').filter(Boolean);
  const videoUrl = content.video_url || '';
  const embedUrl = getYoutubeEmbedUrl(videoUrl);

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16 items-center">
          <motion.div variants={container} {...mount}>
            <motion.h1 variants={item} className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-dark-navy leading-[1.15] text-pretty">
              {heading}
            </motion.h1>
            {subheading && (
              <motion.p variants={item} className="mt-3 text-base sm:text-lg text-brand-orange font-semibold">{subheading}</motion.p>
            )}
            <motion.p variants={item} className="mt-4 sm:mt-5 text-base sm:text-lg text-text-gray leading-relaxed max-w-xl">
              {description}
            </motion.p>

            {checklist.length > 0 && (
              <motion.ul variants={item} className="mt-8 space-y-3">
                {checklist.map((c, i) => (
                  <li key={i} className="flex items-start gap-3 text-base text-dark-navy">
                    <FiCheckCircle className="w-6 h-6 text-brand-blue shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.div variants={item} className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-8 sm:mt-10">
              <Button variant="orange">{ctaLeft}</Button>
              <Button variant="outline">{ctaRight}</Button>
            </motion.div>
          </motion.div>

          <motion.div
            variants={reduce ? undefined : fadeLeft}
            {...mount}
            className="relative lg:[clip-path:polygon(8%_0%,100%_0%,100%_100%,0%_100%)]">
            <div className="bg-brand-blue rounded-lg p-6 sm:p-8 lg:p-12 text-white">
              <div className="text-center">
                <p className="font-bold text-lg sm:text-xl lg:text-2xl">ONLINE & OFFLINE TRAINING</p>
                <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-6">
                  <div className="bg-white/10 rounded-xl p-4 sm:p-5">
                    <p className="font-semibold text-base sm:text-lg">Online Training</p>
                    <p className="text-sm text-white/70 mt-1.5">Live interactive sessions</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 sm:p-5">
                    <p className="font-semibold text-base sm:text-lg">Offline Training</p>
                    <p className="text-sm text-white/70 mt-1.5">Classroom learning</p>
                  </div>
                </div>
                {embedUrl && (
                  <>
                    <div className="mt-6 sm:mt-8 flex justify-center">
                      <button onClick={() => setShowVideo(true)}
                        className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-3 text-base text-white/80">Course Introduction</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showVideo && embedUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setShowVideo(false)}
                className="absolute top-3 right-3 z-10 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
              <iframe src={embedUrl} title="Course Introduction"
                className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
