import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ModularCTAButton from './ModularCTAButton';

export { ModularCTAButton };

function useReducedMotion() {
  const [shouldReduce, setShouldReduce] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduce(mediaQuery.matches);
    const handleChange = (e) => setShouldReduce(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  return shouldReduce;
}

function DynamicBackground({ background, shouldReduceMotion }) {
  if (!background) return null;

  let bgStr = String(background).trim();
  // Ensure relative URLs start with '/' so browser resolves from domain root
  if (bgStr && !bgStr.startsWith('http') && !bgStr.startsWith('/') && !bgStr.startsWith('data:')) {
    bgStr = `/${bgStr}`;
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: "easeOut" }}
      className="absolute inset-0 pointer-events-none overflow-hidden z-0"
    >
      {/* Background layer directly from DB */}
      <div
        className="cta-background absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${bgStr}")`
        }}
      />

      {/* Readability Contrast Overlay */}
      <div
        className="cta-overlay absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, rgba(3, 5, 26, 0.90) 0%, rgba(3, 5, 26, 0.72) 48%, rgba(3, 5, 26, 0.40) 100%)'
        }}
      />
    </motion.div>
  );
}

export default function CourseCTA({
  ctaHeading,
  ctaDescription,
  buttonText,
  background,
  // Props Aliases:
  cta_heading,
  cta_description,
  cta_text,
  cta_background_image,
  ctaBackground,
  course,
  href,
  onClick,
  onCtaClick,
  className = ''
}) {
  const shouldReduceMotion = useReducedMotion();

  // Purely DB-Driven Content (No hardcoded fallback text or background)
  const finalHeading = ctaHeading || cta_heading || course?.cta_heading || course?.ctaHeading || '';
  const finalDescription = ctaDescription || cta_description || course?.cta_description || course?.ctaDescription || '';
  const finalButtonText = buttonText || cta_text || course?.cta_text || course?.cta_left || '';
  const finalBackground = background || ctaBackground || cta_background_image || course?.cta_background_image || course?.ctaBackground || course?.background_image || null;

  const finalHref = href || course?.cta_link || undefined;
  const handleButtonClick = onClick || (onCtaClick ? () => onCtaClick(finalButtonText) : undefined);

  return (
    <section className={`relative w-full max-w-[1900px] mx-auto min-h-[350px] lg:min-h-[400px] overflow-hidden my-6 sm:my-10 flex items-center rounded-none ${className}`}>
      {/* Background & Overlay Layer (Directly from DB background value) */}
      <DynamicBackground background={finalBackground} shouldReduceMotion={shouldReduceMotion} />

      {/* Two-Column Layout Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] items-center gap-8 lg:gap-[clamp(2rem,5vw,6rem)]">
          {/* Left Column (Heading + Description) */}
          <div className="flex flex-col items-start gap-4 sm:gap-5 text-left w-full">
            {finalHeading && (
              <motion.h2
                initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut" }}
                className="text-white font-extrabold tracking-tight leading-[1.1] max-w-[800px] text-left"
                style={{
                  fontSize: 'clamp(1.8rem, 3.2vw, 3.2rem)',
                  textWrap: 'balance'
                }}
              >
                {finalHeading}
              </motion.h2>
            )}

            {finalDescription && (
              <motion.p
                initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut", delay: 0.1 }}
                className="text-slate-300 font-normal leading-relaxed max-w-[620px] text-left"
                style={{
                  fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)'
                }}
              >
                {finalDescription}
              </motion.p>
            )}
          </div>

          {/* Right Column (Modular CTA Button) */}
          <div className="flex items-center justify-start lg:justify-end w-full">
            {finalButtonText && (
              <ModularCTAButton
                text={finalButtonText}
                href={finalHref}
                onClick={handleButtonClick}
                ariaLabel={finalHeading ? `Apply for ${finalHeading}` : finalButtonText}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
