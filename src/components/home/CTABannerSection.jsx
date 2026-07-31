import { FaPhoneAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Reveal from '../ui/Reveal';

export default function CTABannerSection({ section }) {
  if (!section) return null;

  const heading = section.heading || '';
  const subheading = section.subheading || '';
  const content = section.content || {};
  const description = content.description || '';
  const ctaText = content.cta_text || '';
  const ctaLink = content.cta_link || '';
  const bgImage = content.background_image || '';

  const displayHeading = heading || subheading || description;
  const displayDescription = description || subheading;
  const phone = ctaLink;

  if (!displayHeading) return null;

  return (
    <section className="relative">
      <div className="overflow-hidden relative">
        {/* Background image or gradient */}
        {bgImage ? (
          <>
            <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(40%)' }} />
            <div className="absolute inset-0 bg-black/40" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[#0B2D6B]">
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #0B2D6B 0%, #1642a0 25%, #1a8a7d 65%, #2ec4b6 100%)',
              }}
            />
            <div className="absolute top-[-60px] right-[10%] w-48 h-48 rounded-full border-[3px] border-white/10" />
            <div className="absolute top-[20px] right-[5%] w-28 h-28 rounded-full border-[2px] border-white/8" />
            <div className="absolute bottom-[-40px] left-[15%] w-36 h-36 rounded-full border-[3px] border-white/10" />
            <div className="absolute bottom-[30px] left-[8%] w-20 h-20 rounded-full border-[2px] border-white/8" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div
              className="absolute top-0 left-[30%] w-[350px] h-[350px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(23,92,221,0.3) 0%, transparent 60%)' }}
            />
            <div
              className="absolute bottom-0 right-[20%] w-[300px] h-[300px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(46,196,182,0.25) 0%, transparent 60%)' }}
            />
          </div>
        )}

        <div className="relative max-w-7xl mx-auto px-10 sm:px-16 lg:px-20 py-16 sm:py-20">
          <Reveal>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
              {/* Left Column */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-white">
                  {heading || (
                    <>
                      Ready to start your{' '}
                      <span className="text-[#2ec4b6]">dream career</span>?
                    </>
                  )}
                </h2>
                {displayDescription && (
                  <p className="mt-5 text-base sm:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0" style={{ color: '#ffffff' }}>
                    {displayDescription}
                  </p>
                )}
              </div>

              {/* Right Column */}
              <div className="shrink-0 flex flex-col items-center lg:items-end gap-3">
                <div className="flex items-center gap-5 px-7 py-5 rounded-2xl bg-white/[0.12] backdrop-blur-md border border-white/15">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white uppercase tracking-widest">
                      {ctaText || 'Request a Call Back'}
                    </span>
                    <span className="mt-1.5 text-xl font-bold text-white tracking-wide">
                      {phone || ''}
                    </span>
                  </div>
                  <motion.a
                      href={`tel:${(phone || '').replace(/[^0-9+]/g, '')}`}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#F7941D] text-white shrink-0 shadow-lg"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FaPhoneAlt className="w-5 h-5" />
                  </motion.a>
                </div>
                <span className="text-sm text-white lg:pr-2">
                  Available 24/7 for counseling.
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
