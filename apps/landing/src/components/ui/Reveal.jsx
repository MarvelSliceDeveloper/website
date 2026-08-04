import { motion, useReducedMotion } from 'framer-motion';
import {
  fadeUp, fadeIn, fadeLeft, fadeRight, scaleIn,
  staggerContainer, staggerItem, viewportOnce,
} from '../../lib/motion';

const VARIANTS = {
  up: fadeUp,
  in: fadeIn,
  left: fadeLeft,
  right: fadeRight,
  scale: scaleIn,
};

/**
 * Scroll-triggered reveal wrapper. Animates once when it enters the viewport.
 * Honors the user's "reduce motion" OS setting by rendering statically.
 *
 * Props:
 *  - variant: 'up' | 'in' | 'left' | 'right' | 'scale' (default 'up')
 *  - as: element/component to render (default 'div')
 *  - delay: seconds to delay the animation
 */
export default function Reveal({
  children,
  variant = 'up',
  as = 'div',
  delay = 0,
  className = '',
  ...props
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className} {...props}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={VARIANTS[variant] || fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={delay ? { delay } : undefined}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

/**
 * Container that staggers its children into view on scroll.
 * Wrap each child in <StaggerItem> (or use variants="staggerItem" motion elements).
 */
export function Stagger({ children, as = 'div', className = '', ...props }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className} {...props}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      {...props}
    >
      {children}
    </MotionTag>
  );
}

export function StaggerItem({ children, as = 'div', className = '', ...props }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    const Tag = as;
    return <Tag className={className} {...props}>{children}</Tag>;
  }

  return (
    <MotionTag className={className} variants={staggerItem} {...props}>
      {children}
    </MotionTag>
  );
}
