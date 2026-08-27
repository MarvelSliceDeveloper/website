import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FiCheckCircle } from 'react-icons/fi';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { Link } from 'react-router-dom';

export default function HeroSection({ section }) {
  const reduce = useReducedMotion();
  const container = reduce ? undefined : staggerContainer;
  const item = reduce ? undefined : staggerItem;
  const mount = reduce ? {} : { initial: 'hidden', animate: 'visible' };

  const content = section?.content || {};
  const heroMode = content.hero_mode || 'normal';
  const carouselEnabled = heroMode === 'carousel' && Array.isArray(content.slides) && content.slides.length > 0;
  const slides = carouselEnabled ? content.slides : [];

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => setCurrent(p => (p + 1) % (slides.length || 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(p => (p - 1 + slides.length) % (slides.length || 1)), [slides.length]);

  // Keep each slide for 5 seconds
  useEffect(() => {
    if (!carouselEnabled || slides.length < 2 || isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [carouselEnabled, isPaused, next, slides.length]);

  if (!section) return null;

  const carouselType = content.carousel_type || 'image';

  const slide = carouselEnabled ? slides[current] : null;
  const bannerImage = carouselEnabled ? (carouselType === 'image' ? slide?.image : '') : (content.banner_image || '');
  const bannerHeading = carouselEnabled ? (slide?.heading || '') : (content.banner_heading || '');
  const bannerDescription = carouselEnabled ? (slide?.description || '') : (content.banner_description || '');
  const showGradient = carouselEnabled && carouselType === 'text';
  const headline = content.headline || '';
  const description = content.description || '';
  const rawBullets = content.feature_bullets;
  const featureBullets = Array.isArray(rawBullets) ? rawBullets : (rawBullets ? rawBullets.split('\n').filter(Boolean) : []);
  const studentImageUrl = content.student_image_url || '';
  const stats = Array.isArray(content.stats) ? content.stats : [];
  const badgeText = content.badge_text || '';
  const buttons = Array.isArray(content.buttons) ? content.buttons : [];

  return (
    <section className="relative overflow-hidden">
      {bannerImage && (
        <div 
          className="relative w-full overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Base image dictates natural aspect ratio and natural image height automatically */}
          <img src={bannerImage} alt="" className="w-full h-auto opacity-0 block pointer-events-none" />

          <AnimatePresence initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <img src={bannerImage} alt="" className="w-full h-auto" />
              
              {(bannerHeading || bannerDescription) && (
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {bannerHeading && (
                      <h1 className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-white leading-[1.15] text-pretty drop-shadow-md">
                        {bannerHeading}
                      </h1>
                    )}
                    {bannerDescription && (
                      <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/90 leading-relaxed max-w-xl drop-shadow-sm">
                        {bannerDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {carouselEnabled && slides.length > 1 && (
            <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-8 flex items-center gap-2 z-10 bg-black/35 backdrop-blur-xs px-3 py-1.5 rounded-full shadow-md">
              {slides.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current ? 'bg-white w-7 shadow-xs' : 'bg-white/40 hover:bg-white/80 w-2.5'
                  }`} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showGradient && (
        <div 
          className="relative w-full min-h-[300px] flex flex-col justify-center"
          style={{ background: 'linear-gradient(135deg, #f59e0b 50%, #1B3A6B 50%)' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={current}
              initial={{ opacity: 0, filter: 'blur(6px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(6px)' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center"
            >
              {bannerHeading && <h1 className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-white leading-[1.15] text-pretty">{bannerHeading}</h1>}
              {bannerDescription && <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto">{bannerDescription}</p>}
            </motion.div>
          </AnimatePresence>

          {slides.length > 1 && (
            <div className="flex justify-center gap-2 pb-12">
              {slides.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === current ? 'bg-white w-7 shadow-sm' : 'bg-white/40 hover:bg-white/60 w-2.5'
                  }`} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(bannerImage || showGradient) && headline && (
        <div className="bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark-navy leading-[1.15] text-pretty">
              {headline}
            </h1>
          </div>
        </div>
      )}

      {!bannerImage && !showGradient && (headline || description || featureBullets.length > 0 || buttons.length > 0 || studentImageUrl) && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b 50%, #1B3A6B 50%)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
                <motion.div variants={container} {...mount} className="flex flex-col justify-center text-center items-center lg:text-left lg:items-start">
                  {badgeText && (
                    <Reveal as="div" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold text-white w-fit mb-6 mx-auto lg:mx-0">
                      <span className="w-2 h-2 rounded-full bg-brand-blue" />
                      {badgeText}
                    </Reveal>
                  )}

                  {headline && (
                    <motion.h1 variants={item} className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-white leading-[1.15] text-pretty">
                      {headline}
                    </motion.h1>
                  )}

                  {description && (
                    <motion.p variants={item} className="mt-4 sm:mt-5 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto lg:mx-0">
                      {description}
                    </motion.p>
                  )}

                  {featureBullets.length > 0 && (
                    <motion.ul variants={item} className="mt-8 space-y-3 text-left">
                      {featureBullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-base text-white">
                          <FiCheckCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}

                  {buttons.length > 0 && (
                    <motion.div variants={item} className="mt-8 sm:mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                      {buttons.map((btn, i) => (
                        btn.link ? (
                          <Link key={i} to={btn.link}
                            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold text-sm transition-colors"
                            style={{ backgroundColor: btn.color || '#f59e0b' }}
                          >
                            {btn.label}
                          </Link>
                        ) : null
                      ))}
                    </motion.div>
                  )}
                </motion.div>

                {studentImageUrl && (
                  <Reveal variant="right" className="flex self-center">
                    <div className="w-full rounded-2xl overflow-hidden bg-white/10">
                      <img src={studentImageUrl} alt="Students" className="w-full" />
                    </div>
                  </Reveal>
                )}
              </div>
            </div>
          </div>

          {stats.length > 0 && (
            <div className="bg-dark-navy">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {stats.map((stat, i) => (
                    <StaggerItem key={i} className="text-center">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white">{stat.value}</p>
                      <p className="text-sm sm:text-base text-white/70 mt-1">{stat.label}</p>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
