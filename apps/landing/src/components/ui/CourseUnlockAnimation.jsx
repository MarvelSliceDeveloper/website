import { motion, AnimatePresence } from 'framer-motion';
import { FiUnlock, FiZap, FiCheckCircle } from 'react-icons/fi';

export default function CourseUnlockAnimation({ isUnlocking, onComplete, courseTitle }) {
  if (!isUnlocking) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6 } }}
        onAnimationComplete={() => {
          setTimeout(() => {
            onComplete?.();
          }, 2200);
        }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#03051a]/95 backdrop-blur-xl overflow-hidden text-center px-4"
      >
        {/* Ambient Brand Radial Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-blue/30 via-amber-500/20 to-brand-orange/30 rounded-full blur-[100px] pointer-events-none animate-pulse" />

        {/* Expanding Golden Shockwave Rings */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-40 h-40 rounded-full border-2 border-amber-400/80 shadow-[0_0_50px_#ff9f1c] pointer-events-none"
        />
        <motion.div
          initial={{ scale: 0.5, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 1.8, delay: 0.4, repeat: Infinity, ease: 'easeOut' }}
          className="absolute w-40 h-40 rounded-full border-2 border-orange-500/80 shadow-[0_0_50px_#ff5e00] pointer-events-none"
        />

        {/* Floating Sparkle Particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: (i % 2 === 0 ? 1 : -1) * (Math.random() * 80 + 20),
              y: (i < 6 ? 1 : -1) * (Math.random() * 80 + 20),
              opacity: 0,
              scale: 0.5,
            }}
            animate={{
              y: [0, (i % 2 === 0 ? -120 : 120)],
              x: [0, (i % 3 === 0 ? 80 : -80)],
              opacity: [0, 1, 0],
              scale: [0.5, 1.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeOut',
            }}
            className="absolute text-amber-400 drop-shadow-[0_0_12px_#ff9f1c]"
          >
            <FiZap className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>
        ))}

        {/* Central High-Tech Glowing Unlock Badge */}
        <motion.div
          initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
          animate={{ scale: [0.3, 1.2, 1], rotate: [ -20, 10, 0 ], opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-amber-400 via-brand-orange to-orange-600 p-[3px] shadow-[0_0_60px_rgba(255,159,28,0.7)] mb-8"
        >
          <div className="w-full h-full bg-[#0c0422] rounded-[22px] flex items-center justify-center relative overflow-hidden">
            {/* Inner Shimmer Reflection */}
            <motion.div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
              animate={{ x: ['-150%', '250%'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-amber-400 drop-shadow-[0_0_20px_#ff9f1c]"
            >
              <FiUnlock className="w-14 h-14 sm:w-16 sm:h-16 stroke-[2.5]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Text Ceremony Announcements */}
        <div className="relative z-10 space-y-3 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs sm:text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,159,28,0.3)]"
          >
            <FiCheckCircle className="w-4 h-4 text-amber-400" /> Course Launch Complete
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg"
          >
            Unlocking Syllabus...
          </motion.h2>

          {courseTitle && (
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="text-slate-300 text-base sm:text-lg font-medium max-w-md mx-auto"
            >
              Welcome to <strong className="text-amber-400">{courseTitle}</strong>. Full curriculum and enrollment now live!
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
