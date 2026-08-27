import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiUsers, FiBriefcase, FiStar, FiClock, FiAward, FiCheckCircle, FiLoader, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';
import { supabase } from '../../lib/supabaseClient';
import { trackFormSubmit } from '../../lib/analytics';

function getStatIcon(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('course') || l.includes('program')) return FiBookOpen;
  if (l.includes('student') || l.includes('alumni')) return FiUsers;
  if (l.includes('placement')) return FiBriefcase;
  if (l.includes('trainer') || l.includes('expert') || l.includes('faculty')) return FiStar;
  if (l.includes('year') || l.includes('experience')) return FiClock;
  return FiAward;
}

function CourseButtons() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-1 w-full max-w-md sm:max-w-none mx-auto lg:mx-0 justify-center lg:justify-start">
      <Link
        to="/courses?parent=software-learning"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-brand-orange text-white font-bold text-xs sm:text-sm hover:bg-brand-orange/90 transition-all shadow-md active:scale-95 text-center"
      >
        Software Learning
      </Link>
      <Link
        to="/banking"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#74a916] text-white font-bold text-xs sm:text-sm hover:bg-[#74a916]/90 transition-all shadow-md active:scale-95 text-center"
      >
        Competitive Exam
      </Link>
    </div>
  );
}

function StatsGrid({ stats }) {
  return (
    <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md sm:max-w-none mx-auto">
      {stats.map((stat, i) => {
        const Icon = getStatIcon(stat.label);
        return (
          <StaggerItem key={i} className="w-full">
            <div className="bg-white rounded-xl border border-gray-100 p-3.5 sm:p-4 text-center hover:-translate-y-1 transition-all duration-300 w-full h-full min-h-[88px] sm:min-h-[104px] flex flex-col items-center justify-center shadow-md">
              <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg bg-brand-orange/10 flex items-center justify-center mb-1.5 sm:mb-2 shrink-0">
                <Icon className="w-4 h-4 text-brand-orange" />
              </div>
              <p className="text-lg sm:text-2xl font-extrabold text-brand-blue leading-none">{stat.value}</p>
              <p className="text-[11px] sm:text-xs mt-1 text-slate-800 font-medium leading-snug">{stat.label}</p>
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

function PillGrid({ pills }) {
  return (
    <Stagger className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-md sm:max-w-none mx-auto">
      {pills.map((label, i) => (
        <StaggerItem key={i} className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-lg border border-gray-100 px-2.5 sm:px-3 py-2.5 shadow-sm min-w-0 h-full min-h-[48px]">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0">
              <FiCheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-blue" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-brand-blue leading-tight whitespace-nowrap flex-1 min-w-0 truncate">{label}</span>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export default function IntroFormSection({ section }) {
  const content = section?.content || {};
  const heading = section?.heading || '';
  const introText = content.intro_text || '';
  const stats = content.stats || [];
  const rawPills = Array.isArray(content.pill_buttons) ? content.pill_buttons : (content.pill_buttons || '').split('\n').filter(Boolean);
  const formTitle = content.form_title || 'Book Your Free Demo Class';

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!formName.trim()) errs.name = 'Please enter your name';
    if (!formEmail.trim()) errs.email = 'Please enter your email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) errs.email = 'Please enter a valid email';
    if (!formPhone.trim()) errs.phone = 'Please enter your phone number';
    setErrors(errs);
    if (!agreeTerms) {
      setFormMsg({ type: 'error', text: 'Please agree to the terms and conditions.' });
      return;
    }
    setFormMsg(null);
    if (Object.keys(errs).length > 0) return;
    setSubmitting(true);
    const { error } = await supabase.from('form_submissions').insert({
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
    });
    if (error) {
      setFormMsg({ type: 'error', text: 'Submission failed. Please try again.' });
      setSubmitting(false);
      return;
    }
    fetch('/api/submit-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
      }),
    }).catch(() => {});
    trackFormSubmit('demo_class');
    setShowSuccessModal(true);
    setFormName(''); setFormEmail(''); setFormPhone('');
    setAgreeTerms(false);
    setSubmitting(false);
  }

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:py-16">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          <Reveal variant="up" className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-6 text-center lg:text-left">
            {heading && (
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy text-center lg:text-left leading-tight sm:leading-snug max-w-xl">
                {heading}
              </h2>
            )}
            {introText && (
              <p className="text-sm sm:text-base leading-relaxed text-center lg:text-left text-slate-600 max-w-3xl px-1 sm:px-0">
                {introText}
              </p>
            )}

            <div className="mt-6 hidden lg:block space-y-6">
              {stats.length > 0 && <StatsGrid stats={stats} />}
              <CourseButtons />
            </div>
          </Reveal>

          <Reveal variant="right" className="lg:col-span-5 xl:col-span-4 w-full flex flex-col items-center lg:items-end">
            <div className="max-w-sm w-full flex flex-col items-center text-center">
              <p className="text-sm sm:text-base font-[600] text-center mb-1 w-full pt-3 sm:pt-5" style={{ color: '#ef4444' }}>
                Book Your Demo Now!
              </p>
              <div className="rounded-2xl overflow-hidden w-full mt-4 sm:mt-5" style={{ backgroundColor: '#74a916', boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
                <div className="relative h-16" style={{ backgroundColor: '#f59e0b' }}>
                  <div
                    className="absolute inset-0"
                    style={{
                      clipPath: 'polygon(0 0, 55% 0, 35% 100%, 0 100%)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div className="h-full flex items-center pl-5">
                      <span className="text-xl font-serif font-bold" style={{ color: '#f59e0b' }}>Career</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-end">
                    <span className="bg-white rounded-[6px] px-3 py-1 text-base font-serif font-bold shadow-sm mr-1.5" style={{ color: '#f59e0b' }}>
                      Counselling
                    </span>
                  </div>
                </div>

                <div className="relative p-4 sm:p-5">
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M10 50 Q 30 20 50 50 T 90 50\' stroke=\'white\' fill=\'none\' stroke-width=\'2\'/%3E%3C/svg%3E")',
                      backgroundSize: '120px 120px',
                    }}
                  />
                  <form onSubmit={handleSubmit} className="relative z-10 space-y-3">
                    <div>
                      <input type="text" placeholder="Your Name" value={formName} onChange={(e) => { setFormName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: undefined })); }} required
                        className={`w-full px-4 py-2.5 border-0 text-xs bg-white rounded-[8px] outline-none placeholder-gray-400 focus:ring-2 focus:ring-white/50 transition-all ${errors.name ? 'ring-2 ring-red-400' : ''}`} />
                      {errors.name && <p className="!text-red-600 text-xs mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <input type="email" placeholder="your@email.com" value={formEmail} onChange={(e) => { setFormEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }} required
                        className={`w-full px-4 py-2.5 border-0 text-xs bg-white rounded-[8px] outline-none placeholder-gray-400 focus:ring-2 focus:ring-white/50 transition-all ${errors.email ? 'ring-2 ring-red-400' : ''}`} />
                      {errors.email && <p className="!text-red-600 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <input type="tel" placeholder="Your Phone Number" value={formPhone} onChange={(e) => { setFormPhone(e.target.value); if (errors.phone) setErrors((p) => ({ ...p, phone: undefined })); }} required
                        className={`w-full px-4 py-2.5 border-0 text-xs bg-white rounded-[8px] outline-none placeholder-gray-400 focus:ring-2 focus:ring-white/50 transition-all ${errors.phone ? 'ring-2 ring-red-400' : ''}`} />
                      {errors.phone && <p className="!text-red-600 text-xs mt-1">{errors.phone}</p>}
                    </div>
                    {formMsg?.type === 'error' && (
                      <p className="!text-red-600 text-xs">{formMsg.text}</p>
                    )}
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 border-white/50 accent-white shrink-0" />
                      <span className="text-xs text-white/90 leading-relaxed">
                        I agree to the{' '}
                        <a href="/terms" className="text-blue-300 underline hover:text-blue-200">Terms of Use</a>
                        {' '}and{' '}
                        <a href="/privacy" className="text-blue-300 underline hover:text-blue-200">Privacy Policy</a>.
                      </span>
                    </label>
                    <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 px-[30px] py-[15px] bg-[#f59e0b] text-white font-semibold rounded hover:bg-[#f59e0b]/90 transition-colors disabled:opacity-70 text-sm cursor-pointer active:scale-95">
                      {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : null}
                      {submitting ? 'Submitting...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-6 hidden lg:block w-full">
                {rawPills.length > 0 && <PillGrid pills={rawPills} />}
              </div>
            </div>
          </Reveal>

          {/* Mobile Only: Flow order -> Form (28px gap) -> Stats stack (1-col) (24px gap) -> Features (2-col) (24px gap) -> Action Buttons (32px to Upcoming Classes) */}
          <div className="lg:hidden mt-7 space-y-6 w-full max-w-md mx-auto mb-4 sm:mb-0">
            {stats.length > 0 && <StatsGrid stats={stats} />}
            {rawPills.length > 0 && <PillGrid pills={rawPills} />}
            <Reveal variant="up">
              <CourseButtons />
            </Reveal>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-4">
                <FiCheckCircle className="w-8 h-8 text-green-500" />
              </div>

              <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Successfully Submitted!</h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-6">
                Thank you for your interest. We will reach out to you shortly.
              </p>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 rounded-lg bg-[#1E56C7] text-white font-semibold text-sm hover:bg-[#1642a0] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
