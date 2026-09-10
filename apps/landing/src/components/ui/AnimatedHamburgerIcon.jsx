import { motion } from 'framer-motion';

/**
 * Animated Hamburger Icon that smoothly morphs between 3 horizontal lines and an 'X' icon.
 * @param {boolean} isOpen - Whether the menu/sidebar is open.
 * @param {string} className - Optional Tailwind CSS classes for size/color.
 */
export default function AnimatedHamburgerIcon({ isOpen, className = 'w-[26px] h-[26px] text-slate-800' }) {
  const smoothTransition = { duration: 0.35, ease: [0.16, 1, 0.3, 1] };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <motion.path
        animate={isOpen ? { d: 'M 5 5 L 19 19' } : { d: 'M 4 6 L 20 6' }}
        transition={smoothTransition}
      />
      <motion.path
        d="M 4 12 L 20 12"
        animate={isOpen ? { opacity: 0, scale: 0.2 } : { opacity: 1, scale: 1 }}
        transition={smoothTransition}
      />
      <motion.path
        animate={isOpen ? { d: 'M 5 19 L 19 5' } : { d: 'M 4 18 L 20 18' }}
        transition={smoothTransition}
      />
    </svg>
  );
}
