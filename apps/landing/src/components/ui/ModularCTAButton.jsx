import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

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

export default function ModularCTAButton({
  text,
  onClick,
  href,
  to,
  ariaLabel,
  variant = 'solid', // 'solid' | 'glass' | 'neon'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon = FiArrowRight,
  animatePulse = true,
  className = '',
}) {
  if (!text) return null;
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const targetUrl = href || to;
  const Component = targetUrl ? motion.a : motion.button;

  // Size variations
  const sizeClasses = {
    sm: 'min-w-[180px] min-h-[52px] px-6 py-3 text-base sm:text-lg',
    md: 'min-w-[220px] min-h-[60px] px-8 py-4 text-lg sm:text-xl',
    lg: 'min-w-[250px] min-h-[68px] px-9 py-4.5 text-xl sm:text-2xl',
  }[size] || 'min-w-[220px] min-h-[60px] px-8 py-4 text-lg sm:text-xl';

  // Variant backgrounds & glowing shadows
  const getVariantStyles = () => {
    if (variant === 'glass') {
      return {
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(13, 4, 36, 0.92) 50%, rgba(255, 159, 28, 0.35) 100%)',
        boxShadow: isHovered
          ? '0 0 35px rgba(255, 159, 28, 0.6), 0 0 70px rgba(168, 85, 247, 0.7), inset 0 0 20px rgba(255, 159, 28, 0.2)'
          : '0 0 22px rgba(255, 159, 28, 0.3), 0 0 45px rgba(139, 92, 246, 0.4), inset 0 0 12px rgba(255, 159, 28, 0.15)',
        border: '2px solid rgba(168, 85, 247, 0.8)',
      };
    }
    // 'solid' / default vibrant glowing orange gradient
    return {
      background: 'linear-gradient(135deg, #ff9f1c 0%, #ff5e00 100%)',
      boxShadow: isHovered
        ? '0 0 45px rgba(255, 159, 28, 0.85), 0 0 85px rgba(255, 94, 0, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.4)'
        : '0 0 28px rgba(255, 159, 28, 0.55), 0 0 55px rgba(255, 94, 0, 0.4), inset 0 0 12px rgba(255, 255, 255, 0.3)',
      border: 'none',
    };
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 15, scale: 0.92 }}
      animate={
        shouldReduceMotion || !animatePulse
          ? { opacity: 1, y: 0, scale: 1 }
          : {
              opacity: 1,
              y: 0,
              scale: isHovered ? 1.04 : [1, 1.025, 1],
            }
      }
      transition={
        shouldReduceMotion || !animatePulse || isHovered
          ? { duration: 0.25, ease: 'easeOut' }
          : {
              scale: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
              opacity: { duration: 0.6, ease: 'easeOut' },
              y: { duration: 0.6, ease: 'easeOut' },
            }
      }
      className={`flex items-center justify-center w-full lg:w-auto ${className}`}
    >
      <Component
        {...(targetUrl ? { href: targetUrl } : { type: 'button', onClick })}
        aria-label={ariaLabel || (typeof text === 'string' ? text : '')}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative group cursor-pointer select-none inline-flex items-center justify-center w-full sm:w-auto focus:outline-none focus:ring-4 focus:ring-amber-400/50 rounded-2xl overflow-hidden shadow-2xl ${sizeClasses}`}
        whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.02 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Dynamic Background & Animated Neon Glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl transition-all duration-300 pointer-events-none"
          style={getVariantStyles()}
        />

        {/* Shimmer Light Sweep Animation (Sweeps every 3.5s or on hover) */}
        {!shouldReduceMotion && (
          <motion.div
            className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] pointer-events-none"
            initial={{ x: '-150%' }}
            animate={{
              x: isHovered ? ['-150%', '250%'] : ['-150%', '250%', '-150%'],
            }}
            transition={{
              repeat: isHovered ? 0 : Infinity,
              repeatDelay: 3.5,
              duration: isHovered ? 0.6 : 1.2,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* High Contrast Content & Spring Arrow Animation */}
        <div className="relative z-10 flex items-center justify-center gap-3.5 whitespace-nowrap">
          <span className="text-white font-black tracking-wide drop-shadow-md">
            {text}
          </span>
          {Icon && (
            <motion.div
              animate={{
                x: isHovered && !shouldReduceMotion ? 7 : 0,
                scale: isHovered && !shouldReduceMotion ? 1.15 : 1,
              }}
              transition={{ type: 'spring', stiffness: 350, damping: 18 }}
              className="text-white shrink-0 drop-shadow-md"
            >
              <Icon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
            </motion.div>
          )}
        </div>
      </Component>
    </motion.div>
  );
}
