import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiLoader, FiX, FiCheckCircle, FiCalendar } from 'react-icons/fi';
import Reveal from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { trackRegister } from '../../lib/analytics';
import { formatDateTime } from '../../lib/datetime';

export default function UpcomingClassesTableSection({ section, imageSection }) {
  const queryClient = useQueryClient();
  const { data: classes = [] } = useQuery({
    queryKey: ['upcomingClasses', 'table'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upcoming_classes')
        .select('id, course_name, batch, date_time, is_active')
        .eq('is_active', true)
        .order('date_time', { ascending: true });
      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return (data || []).filter((c) => c.date_time);
    },
  });

  const [selectedClass, setSelectedClass] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!section) return null;

  const heading = section.heading || 'Upcoming Classes';
  const subheading = section.subheading || '';
  const imageUrl = imageSection?.content?.image_url || '';
  const imageLink = imageSection?.content?.image_link || '';

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
      batch: selectedClass.batch || null,
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
    });
    if (error) {
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
    <section className="pt-10 pb-16 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            {heading && (
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">{heading}</h2>
            )}
            <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-14" />
            {subheading && (
              <p className="text-text-gray text-base sm:text-lg leading-relaxed max-w-2xl mt-4">{subheading}</p>
            )}
          </div>
        </Reveal>

        {classes.length > 0 && (
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch mt-12">
            <Reveal className="lg:col-span-7">
              <div className="space-y-4">
                {classes.slice(0, 4).map((cls, i) => (
                  <div key={cls.id} className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-4 rounded-2xl border border-gray-200 bg-white shadow-md hover:shadow-lg hover:border-brand-blue/40 transition-all p-5">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="w-12 h-12 shrink-0 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                        <FiCalendar className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-dark-navy text-base leading-snug truncate">{cls.course_name}</p>
                          {cls.batch && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-brand-blue text-[11px] font-bold shrink-0">{cls.batch}</span>
                          )}
                        </div>
                        {cls.date_time && (
                          <p className="flex items-center gap-1.5 text-text-gray text-sm mt-1">
                            <FiClock className="w-3.5 h-3.5 shrink-0 text-brand-orange" />
                            {formatDateTime(cls.date_time)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedClass(cls)}
                        className="w-full sm:w-auto inline-block bg-brand-blue text-white font-bold text-sm py-2.5 px-6 rounded-full transition-colors hover:bg-blue-700"
                      >
                        Register Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
            {imageUrl && (
              <Reveal className="lg:col-span-5 min-w-0 flex items-center justify-center">
                {imageLink ? (
                  <a href={imageLink} target={imageLink.startsWith('http') ? '_blank' : undefined} rel={imageLink.startsWith('http') ? 'noopener noreferrer' : undefined} className="block w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-md group lg:-translate-y-[1%]">
                    <img src={imageUrl} alt="Upcoming classes" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  </a>
                ) : (
                  <div className="w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-md lg:-translate-y-[1%]">
                    <img src={imageUrl} alt="Upcoming classes" className="w-full h-full object-contain" />
                  </div>
                )}
              </Reveal>
            )}
          </div>
        )}
        {classes.length === 0 && (
          <p className="text-center text-text-gray mt-12">New batches will be announced soon.</p>
        )}
      </div>

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
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
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
                    className="w-full py-3 rounded-lg bg-[#1E56C7] text-white font-semibold text-sm hover:bg-[#1642a0] transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-6 py-5 bg-[#1E56C7] rounded-t-2xl flex items-start justify-between relative">
                    <div className="pr-4">
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                        {selectedClass.course_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {selectedClass.batch && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 text-white text-xs font-semibold">
                            <FiCalendar className="w-3.5 h-3.5 text-brand-orange" />
                            <span>{selectedClass.batch}</span>
                          </span>
                        )}
                        {selectedClass.date_time && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/15 text-white text-xs font-semibold">
                            <FiClock className="w-3.5 h-3.5 text-brand-orange" />
                            <span>{formatDateTime(selectedClass.date_time)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
                      aria-label="Close"
                    >
                      <FiX className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Your Name <span className="text-red-500">*</span></label>
                      <input type="text" placeholder="Your Name" value={formName} onChange={(e) => { setFormName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }} required
                        className={`w-full px-4 py-2.5 border text-xs bg-white rounded-lg outline-none placeholder-gray-400 focus:ring-2 focus:ring-brand-blue/30 transition-all ${errors.name ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-brand-blue'}`} />
                      {errors.name && <p className="!text-red-600 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Email Address <span className="text-red-500">*</span></label>
                      <input type="email" placeholder="your@email.com" value={formEmail} onChange={(e) => { setFormEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }} required
                        className={`w-full px-4 py-2.5 border text-xs bg-white rounded-lg outline-none placeholder-gray-400 focus:ring-2 focus:ring-brand-blue/30 transition-all ${errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-brand-blue'}`} />
                      {errors.email && <p className="!text-red-600 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
                      <input type="tel" placeholder="Your Phone Number" value={formPhone} onChange={(e) => { setFormPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }} required
                        className={`w-full px-4 py-2.5 border text-xs bg-white rounded-lg outline-none placeholder-gray-400 focus:ring-2 focus:ring-brand-blue/30 transition-all ${errors.phone ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-brand-blue'}`} />
                      {errors.phone && <p className="!text-red-600 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    {errors.form && <p className="!text-red-600 text-xs">{errors.form}</p>}
                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 text-sm cursor-pointer">
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
