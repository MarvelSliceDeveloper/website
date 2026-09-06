import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiLoader, FiX, FiCheckCircle, FiChevronLeft, FiChevronRight, FiCalendar, FiSend, FiCheck } from 'react-icons/fi';
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
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 text-center sm:text-left mb-8 sm:mb-10">
            <div>
              {heading && (
                <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy whitespace-pre-line">{heading}</h2>
              )}
              <div className="w-16 h-[3px] bg-brand-orange rounded-full mt-3 mx-auto sm:mx-0" />
              {subheading && (
                <p className="text-text-gray text-sm sm:text-base leading-relaxed mt-3 whitespace-pre-line">{subheading}</p>
              )}
            </div>
            <Link
              to="/career"
              className="shrink-0 text-xl sm:text-2xl font-extrabold text-brand-blue leading-tight hover:underline cursor-pointer"
            >
              Recent Job Openings !
            </Link>
          </div>
        </Reveal>

        {classes.length > 0 && (
          isSlider ? (
            <div className="relative mx-auto w-full mt-16" onMouseEnter={stopAutoScroll} onMouseLeave={() => { if (isSlider) startAutoScroll(); }}>
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
                      <div className="group w-full bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 h-full">
                        <h4 className="text-dark-navy text-[16px] sm:text-lg font-bold">{cls.course_name}</h4>
                        {cls.date_time && (
                          <p className="text-text-gray text-[11px] sm:text-sm mt-3">
                            {formatDateTime(cls.date_time)}
                          </p>
                        )}
                        <div className="mt-auto pt-4 flex justify-center sm:justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedClass(cls)}
                            className="inline-flex items-center justify-center bg-brand-orange text-white font-bold text-[11px] sm:text-sm py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-full transition-all hover:bg-brand-orange/90 hover:shadow-md hover:shadow-brand-orange/25 active:scale-95 cursor-pointer"
                          >
                            Register Now
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center mx-auto w-full mt-16">
              {classes.map((cls) => (
                <div key={cls.id} className="group w-full bg-white rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
                  <h4 className="text-dark-navy text-[16px] sm:text-lg font-bold">{cls.course_name}</h4>
                  {cls.date_time && (
                    <p className="text-text-gray text-[11px] sm:text-sm mt-3">
                      {formatDateTime(cls.date_time)}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex justify-center sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setSelectedClass(cls)}
                      className="inline-flex items-center justify-center bg-brand-orange text-white font-bold text-[11px] sm:text-sm py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-full transition-all hover:bg-brand-orange/90 hover:shadow-md hover:shadow-brand-orange/25 active:scale-95 cursor-pointer"
                    >
                      Register Now
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {showSuccess ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Registration Successful!</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Thank you for registering for {selectedClass.course_name}. We will reach out to you shortly.
                  </p>
                  <button
                    onClick={closeModal}
                    className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-brand-blue px-6 py-5 text-white relative text-center flex flex-col items-center justify-center">
                    <button
                      onClick={closeModal}
                      className="absolute top-3 right-3 bg-white shadow-md text-red-600 hover:text-red-700 hover:scale-105 p-1.5 rounded-full transition-all cursor-pointer border border-slate-200 z-10 flex items-center justify-center"
                      aria-label="Close modal"
                    >
                      <FiX className="w-4 h-4 text-red-600" />
                    </button>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug text-center">
                      {selectedClass.course_name}
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      {selectedClass.batch && (
                        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/10 text-center">
                          <FiCalendar className="w-3.5 h-3.5 text-brand-orange" />
                          <span>{selectedClass.batch}</span>
                        </span>
                      )}
                      {selectedClass.date_time && (
                        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-medium text-white/90 border border-white/10 text-center">
                          <FiClock className="w-3.5 h-3.5 text-brand-orange" />
                          <span>{formatDateTime(selectedClass.date_time)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Your Name <span className="text-red-400 ml-0.5">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={formName}
                        onChange={(e) => { setFormName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }}
                        required
                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 ${
                          errors.name ? 'border-red-300' : 'border-slate-200'
                        }`}
                      />
                      {errors.name && (
                        <p className="text-xs !text-red-500 mt-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Email Address <span className="text-red-400 ml-0.5">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={formEmail}
                        onChange={(e) => { setFormEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                        required
                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 ${
                          errors.email ? 'border-red-300' : 'border-slate-200'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs !text-red-500 mt-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          {errors.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                        Phone Number <span className="text-red-400 ml-0.5">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Your Phone Number"
                        value={formPhone}
                        onChange={(e) => { setFormPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }}
                        required
                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 ${
                          errors.phone ? 'border-red-300' : 'border-slate-200'
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-xs !text-red-500 mt-1.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    {errors.form && <p className="!text-red-600 text-xs">{errors.form}</p>}
                    <div className="pt-1 flex justify-center">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-fit mx-auto bg-brand-blue hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FiSend className="w-4 h-4" />
                            Submit
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
