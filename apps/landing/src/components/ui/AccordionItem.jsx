import { useState } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccordionItem({ title, children, defaultOpen = false, isOpen, onToggle }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = isOpen !== undefined ? isOpen : internalOpen;

  function handleToggle() {
    if (onToggle) onToggle();
    else setInternalOpen(!internalOpen);
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 text-left text-white bg-brand-orange hover:bg-brand-orange/90 transition-colors gap-3 cursor-pointer"
      >
        <span className="text-sm sm:text-base leading-snug flex-1 font-semibold">{title}</span>
        <span className="shrink-0 w-6 h-6 p-1 flex items-center justify-center rounded-full bg-white text-brand-orange">
          {open ? <FiMinus className="w-3.5 h-3.5" strokeWidth={3} /> : <FiPlus className="w-3.5 h-3.5" strokeWidth={3} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 text-base text-gray-500 leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
