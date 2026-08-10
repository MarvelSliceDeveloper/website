import { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';

export default function AnimatedNumber({ value, duration = 1.5, ...rest }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState('0');

  const str = String(value ?? '');
  const match = str.match(/^(\d+([.,]\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1].replace(',', '.')) : null;
  const suffix = match ? match[3] : str;
  const decimals = match && match[1].includes('.') ? match[1].split('.')[1].length : 0;

  useEffect(() => {
    if (!inView || target === null) {
      setDisplay(str);
      return;
    }
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })),
    });
    return () => controls.stop();
  }, [inView, target, str, duration, decimals]);

  return <span ref={ref} {...rest}>{display}{target !== null ? suffix : ''}</span>;
}
