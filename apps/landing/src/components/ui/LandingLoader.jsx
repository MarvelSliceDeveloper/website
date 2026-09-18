import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingLoader({ onComplete }) {
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    // Prevent scrolling while loading
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const startTime = Date.now();
    const MAX_DURATION = 2000; // Max 2 seconds
    let timeoutId;
    let windowLoaded = document.readyState === 'complete';

    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, Math.min(MAX_DURATION - elapsed, 400));

      timeoutId = setTimeout(() => {
        setIsFinished(true);
        document.body.style.overflow = originalOverflow || '';
        if (onComplete) onComplete();
      }, remainingTime);
    };

    if (windowLoaded) {
      finishLoading();
    } else {
      const handleLoad = () => finishLoading();
      window.addEventListener('load', handleLoad, { once: true });
      // Safety cap at 2 seconds
      timeoutId = setTimeout(() => {
        window.removeEventListener('load', handleLoad);
        finishLoading();
      }, MAX_DURATION);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.body.style.overflow = originalOverflow || '';
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isFinished && (
        <motion.div
          key="landing-loader-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white text-slate-800 select-none"
        >
          <div className="flex flex-col items-center justify-center">
            {/* Round Loading Circle */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-slate-100 border-t-[#1E56C7] rounded-full animate-spin shadow-xs" />

            {/* Loading text below circle */}
            <p className="mt-4 text-base sm:text-lg font-medium text-slate-700 tracking-wide">
              Loading...
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
