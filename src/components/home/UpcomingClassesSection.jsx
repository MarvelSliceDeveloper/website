import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiLoader, FiX, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { trackRegister } from '../../lib/analytics';
import { formatDateTime } from '../../lib/datetime';

export default function UpcomingClassesSection({ section }) {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useQuery({
    queryKey: ['upcomingClasses', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upcoming_classes')
        .select('id, course_name, date_time, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data || [];
    },
  });

  const [selectedClass, setSelectedClass] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const timerRef = useRef(null);
  const isSlider = classes.length > 3;
  const n = classes.length;
  const visible = isSlider ? visibleCount : classes.length;
  const doubled = isSlider ? [...classes, ...classes] : classes;

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setVisibleCount(w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isSlider) {
      setPos(0);
      setAnimate(true);
      return undefined;
    }
    startAutoScroll();
    return () => clearInterval(timerRef.current);
  }, [isSlider]);

  useEffect(() => {
    setPos(0);
    setAnimate(true);
  }, [classes.length, isSlider, visible]);

  function startAutoScroll() {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setAnimate(true);
      setPos((prev) => prev + 1);
    }, 4000);
  }

  function stopAutoScroll() {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function go(dir) {
    if (dir < 0 && pos === 0) {
      setAnimate(false);
      setPos(n - 1);
      setTimeout(() => setAnimate(true), 100);
      return;
    }
    setAnimate(true);
    setPos((prev) => prev + dir);
  }

  function jumpTo(i) {
    setAnimate(false);
    setPos(i);
    setTimeout(() => setAnimate(true), 100);
  }

  if (!section) return null;

  const heading = section.heading || '';
  const subheading = section.subheading || '';

  if (!heading && classes.length === 0) return null;

  function closeModal() {
    if (submitting) return;
    setSelectedClass(null);
    setFormName(''); setFormEmail(''); setFormPhone('');
    setErrors({});
    setShowSuccess(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedClass?.id) {
      setErrors({ form: 'Invalid class. Please refresh the page and try again.' });
      return;
    }
    const errs = {};
    if (!formName.trim()) errs.name = 'Please enter your name';
    if (!formEmail.trim()) errs.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) errs.email = 'Please enter a valid email';
    if (!formPhone.trim()) errs.phone = 'Please enter your phone number';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('upcoming_class_registrations').insert({
      upcoming_class_id: selectedClass.id,
      course_name: selectedClass.course_name,
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
    });
    if (error) {
      console.error('Registration insert failed:', error);
      setErrors({ form: 'Submission failed. Please try again.' });
      setSubmitting(false);
      return;
    }
    trackRegister(selectedClass.course_name);
    queryClient.invalidateQueries({ queryKey: ['upcomingClassRegistrations'] });
    setSubmitting(false);
    setShowSuccess(true);
    setFormName(''); setFormEmail(''); setFormPhone('');
    setErrors({});
  }

  return (
    <section className="pt-8 pb-16 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              {heading && (
                <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">{heading}</h2>
              )}
              <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-4/5" />
            </div>
            {subheading && (
              <p className="text-text-gray text-base sm:text-lg leading-relaxed mt-4 mb-10">{subheading}</p>
            )}
          </div>
        </Reveal>

        {classes.length > 0 && (
          isSlider ? (
            <div className="relative mx-auto lg:max-w-[85%] mt-16" onMouseEnter={stopAutoScroll} onMouseLeave={() => { if (isSlider) startAutoScroll(); }}>
              <div className="overflow-hidden">
                <motion.div
                  animate={{ x: `-${pos * (100 / visible)}%` }}
                  transition={animate ? { duration: 0.5, ease: 'easeInOut' } : { duration: 0 }}
                  onAnimationComplete={() => {
                    if (isSlider && pos >= n) {
                      setAnimate(false);
                      setPos(0);
                    }
                  }}
                  className="flex"
                >
                  {doubled.map((cls, i) => (
                    <div key={`${cls.id}-${i}`} className="shrink-0 px-3" style={{ width: `${100 / visible}%` }}>
                      <div className="group w-full bg-white rounded-xl p-5 flex flex-col shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full">
                        <h4 className="text-dark-navy text-xl font-medium">{cls.course_name}</h4>
                        {cls.date_time && (
                          <p className="text-text-gray text-[15px] mt-3">
                            {formatDateTime(cls.date_time)}
                          </p>
                        )}
                        <div className="mt-auto pt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedClass(cls)}
                            className="inline-block bg-brand-orange text-white font-bold text-sm py-2 px-6 rounded-full transition-colors group-hover:bg-[#e0951f]"
                          >
                            Register now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
              <button
                type="button"
                aria-label="Previous classes"
                onClick={() => go(-1)}
                className="hidden sm:flex absolute -left-2 sm:-left-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 items-center justify-center text-text-gray hover:text-brand-orange hover:border-brand-orange/40 transition-colors cursor-pointer"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="Next classes"
                onClick={() => go(1)}
                className="hidden sm:flex absolute -right-2 sm:-right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-gray-200 items-center justify-center text-text-gray hover:text-brand-orange hover:border-brand-orange/40 transition-colors cursor-pointer"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
              <div className="flex justify-center gap-2 mt-6">
                {classes.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to class ${i + 1}`}
                    onClick={() => jumpTo(i)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${i === pos % n ? 'w-6 bg-brand-orange' : 'w-2 bg-gray-300 hover:bg-gray-400'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mx-auto lg:max-w-[80%] mt-16">
              {classes.map((cls) => (
                <div key={cls.id} className="group w-full max-w-[500px] bg-white rounded-xl p-5 flex flex-col shadow-md border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                  <h4 className="text-dark-navy text-xl font-medium">{cls.course_name}</h4>
                  {cls.date_time && (
                    <p className="text-text-gray text-[15px] mt-3">
                      {formatDateTime(cls.date_time)}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex justify-end">
                    <button
                      onClick={() => setSelectedClass(cls)}
                      className="inline-block bg-brand-orange text-white font-bold text-sm py-2 px-6 rounded-full transition-colors group-hover:bg-[#e0951f]"
                    >
                      Register now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Register Popup */}
      <AnimatePresence>
        {selectedClass && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              {showSuccess ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <FiCheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Registration Successful!</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                    Thank you for registering for {selectedClass.course_name}. We will reach out to you shortly.
                  </p>
                  <button
                    onClick={closeModal}
                    className="w-full py-3 rounded-lg bg-[#1E56C7] text-white font-semibold text-sm hover:bg-[#1642a0] transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-orange mb-1">Upcoming Class</p>
                    <h3 className="text-lg font-bold text-[#1A1A2E]">{selectedClass.course_name}</h3>
                    {selectedClass.date_time && (
                      <p className="flex items-center gap-2 text-text-gray text-xs mt-1">
                        <FiClock className="w-3.5 h-3.5 shrink-0 text-brand-orange" />
                        <span>{formatDateTime(selectedClass.date_time)}</span>
                      </p>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Your Name <span className="text-destructive-500">*</span></label>
                      <input type="text" placeholder="Your Name" value={formName} onChange={(e) => { setFormName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }} required
                        className={`w-full px-4 py-2.5 border text-xs bg-white rounded-lg outline-none placeholder-gray-400 focus:ring-2 focus:ring-brand-blue/30 transition-all ${errors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-brand-blue'}`} />
                      {errors.name && <p className="!text-red-600 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Email Address <span className="text-destructive-500">*</span></label>
                      <input type="email" placeholder="your@email.com" value={formEmail} onChange={(e) => { setFormEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }} required
                        className={`w-full px-4 py-2.5 border text-xs bg-white rounded-lg outline-none placeholder-gray-400 focus:ring-2 focus:ring-brand-blue/30 transition-all ${errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-brand-blue'}`} />
                      {errors.email && <p className="!text-red-600 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Phone Number <span className="text-destructive-500">*</span></label>
                      <input type="tel" placeholder="Your Phone Number" value={formPhone} onChange={(e) => { setFormPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }} required
                        className={`w-full px-4 py-2.5 border text-xs bg-white rounded-lg outline-none placeholder-gray-400 focus:ring-2 focus:ring-brand-blue/30 transition-all ${errors.phone ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-brand-blue'}`} />
                      {errors.phone && <p className="!text-red-600 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    {errors.form && <p className="!text-red-600 text-xs">{errors.form}</p>}
                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-orange/90 transition-colors disabled:opacity-70 text-sm">
                      {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : null}
                      {submitting ? 'Submitting...' : 'Confirm Registration'}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
