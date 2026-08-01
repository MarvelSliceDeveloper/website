import { useState, useEffect, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

  const next = useCallback(() => setCurrent(p => (p + 1) % (slides.length || 1)), [slides.length]);
  const prev = useCallback(() => setCurrent(p => (p - 1 + slides.length) % (slides.length || 1)), [slides.length]);

  useEffect(() => {
    if (!carouselEnabled || slides.length < 2) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [carouselEnabled, next, slides.length]);

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
        <div className="relative w-full overflow-hidden">
          <img src={bannerImage} alt="" className="w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          {(bannerHeading || bannerDescription) && (
            <div className="absolute inset-0 flex items-center">
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {bannerHeading && <h1 className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-white leading-[1.15] text-pretty">{bannerHeading}</h1>}
                {bannerDescription && <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">{bannerDescription}</p>}
              </div>
            </div>
          )}
          {carouselEnabled && slides.length > 1 && (
            <>
              <button onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-2 h-2 rounded-full transition-all cursor-pointer ${i === current ? 'bg-white w-5' : 'bg-white/50 hover:bg-white/70'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {showGradient && (
        <div style={{ background: 'linear-gradient(135deg, #F7941D 50%, #1B3A6B 50%)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center">
            {bannerHeading && <h1 className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-white leading-[1.15] text-pretty">{bannerHeading}</h1>}
            {bannerDescription && <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-2xl mx-auto">{bannerDescription}</p>}
            {slides.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === current ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {(bannerImage || showGradient) && headline && (
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-dark-navy leading-[1.15] text-pretty">
              {headline}
            </h1>
          </div>
        </div>
      )}

      {!bannerImage && !showGradient && (headline || description || featureBullets.length > 0 || buttons.length > 0 || studentImageUrl) && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #F7941D 50%, #1B3A6B 50%)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
              <div className="grid lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
                <motion.div variants={container} {...mount} className="flex flex-col justify-center">
                  {badgeText && (
                    <Reveal as="div" className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold text-white w-fit mb-6">
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
                    <motion.p variants={item} className="mt-4 sm:mt-5 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
                      {description}
                    </motion.p>
                  )}

                  {featureBullets.length > 0 && (
                    <motion.ul variants={item} className="mt-8 space-y-3">
                      {featureBullets.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-3 text-base text-white">
                          <FiCheckCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </motion.ul>
                  )}

                  {buttons.length > 0 && (
                    <motion.div variants={item} className="mt-8 sm:mt-10 flex flex-wrap gap-4">
                      {buttons.map((btn, i) => (
                        btn.link ? (
                          <Link key={i} to={btn.link}
                            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-white font-semibold text-sm transition-colors"
                            style={{ backgroundColor: btn.color || '#F7941D' }}
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
                <Stagger className="grid grid-cols-3 gap-4">
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
