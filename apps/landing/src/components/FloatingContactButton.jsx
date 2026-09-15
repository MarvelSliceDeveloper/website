import { useState, useEffect } from 'react';
import { FiPhone, FiPhoneCall, FiX, FiSend, FiCheck, FiMessageCircle } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { supabase } from '../lib/supabaseClient';
import { useSiteSettings } from '../hooks/useSupabase';
import { extractPhoneNumbers, cleanTelHref, cleanWaHref } from '../lib/phoneUtils';
import { trackFormSubmit, trackCtaClick, trackPhoneClick, trackSocialClick } from '../lib/analytics';

const SUBJECT_OPTIONS = ['Course Enquiry', 'Intern Enquiry', 'Other Enquiry'];

const inputCls = (hasError) =>
  `w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-slate-400 ${
    hasError ? 'border-red-300' : 'border-slate-200'
  }`;

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs !text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

export default function FloatingContactButton() {
  const { data: settings } = useSiteSettings();
  const phoneNumbers = extractPhoneNumbers(settings?.contact_phone || '+91 63809 57390');
  const primaryPhone = phoneNumbers[0] || '+91 63809 57390';
  const telLink = cleanTelHref(primaryPhone);
  const waLink = cleanWaHref(primaryPhone, 'Hello, I have an enquiry regarding courses.');

  const [open, setOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleStatus = (e) => setIsChatOpen(!!e.detail?.open);
    const handleOpen = () => setIsChatOpen(true);
    window.addEventListener('chat-widget-status', handleStatus);
    window.addEventListener('open-chat-widget', handleOpen);
    return () => {
      window.removeEventListener('chat-widget-status', handleStatus);
      window.removeEventListener('open-chat-widget', handleOpen);
    };
  }, []);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    if (!form.subject) errs.subject = 'Please select an enquiry type';
    if (!form.message.trim()) errs.message = 'Message is required';
    if (!agreeTerms) errs.agree = 'Please agree to the terms and conditions';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('about_submissions').insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      if (error) throw error;
      fetch('/api/submit-about', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => {});
      trackFormSubmit('floating_enquiry', { subject: form.subject });
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setAgreeTerms(false);
        setForm({ full_name: '', email: '', phone: '', subject: '', message: '' });
      }, 1000);
    } catch {
      setErrors({ form: 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    if (sent || submitting) return;
    setOpen(false);
  }

  return (
    <>
      <style>{`
        @keyframes fcb-pop {
          0% { opacity: 0; transform: scale(0.3); }
          60% { opacity: 1; transform: scale(1.15); }
          80% { transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fcb-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fcb-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes phone-ring {
          0%, 100% { transform: rotate(0deg) scale(1); }
          12% { transform: rotate(-12deg) scale(1.12); }
          24% { transform: rotate(12deg) scale(1.12); }
          36% { transform: rotate(-8deg) scale(1.08); }
          48% { transform: rotate(8deg) scale(1.08); }
          60% { transform: rotate(0deg) scale(1); }
        }
        @keyframes wa-bounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          15% { transform: scale(1.16) rotate(-6deg); }
          30% { transform: scale(1.08) rotate(6deg); }
          45% { transform: scale(1.16) rotate(-3deg); }
          60% { transform: scale(1.04) rotate(0deg); }
        }
        .fcb-btn {
          animation: fcb-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .fcb-backdrop {
          animation: fcb-fade-in 0.2s ease-out both;
        }
        .fcb-modal {
          animation: fcb-modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-phone-ring {
          animation: phone-ring 2.8s ease-in-out infinite;
        }
        .animate-wa-bounce {
          animation: wa-bounce 2.8s ease-in-out 0.9s infinite;
        }
      `}</style>

      {/* Floating Action Buttons Stack (Vertically Centered on Right Side) */}
      {!isChatOpen && (
        <div className="fixed top-1/2 -translate-y-1/2 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 pointer-events-auto">

          {/* 1. Chat Button (Smooth expandable pill with animated starburst icon) */}
          <div className="relative flex items-center justify-end">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-chat-widget'))}
              aria-label="Open Chat"
              className="fcb-btn group/chat flex h-12 w-12 sm:h-13 sm:w-13 hover:w-28 sm:hover:w-30 items-center justify-start rounded-full bg-brand-green text-white font-bold shadow-lg hover:bg-brand-green/90 hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer select-none overflow-hidden"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
                <span className="relative w-5 h-5 sm:w-6 sm:h-6 text-white flex items-center justify-center">
                  <FiMessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  <svg className="absolute inset-0 w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <circle
                        key={i}
                        cx={9 + i * 3}
                        cy="12.5"
                        r="1.4"
                        fill="currentColor"
                        style={{
                          transformBox: 'fill-box',
                          animation: `chat-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </svg>
                </span>
              </div>
              <span className="opacity-0 group-hover/chat:opacity-100 translate-x-2 group-hover/chat:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap text-white font-extrabold tracking-wide text-sm sm:text-base pr-4 select-none">
                Chat
              </span>
            </button>
          </div>

          {/* 2. Direct Call Button (Blue - smooth expandable pill) */}
          <div className="relative flex items-center justify-end">
            <a
              href={telLink}
              onClick={() => trackPhoneClick(primaryPhone, 'floating_call_btn')}
              aria-label="Call Us"
              className="fcb-btn group/call flex h-12 w-12 sm:h-13 sm:w-13 hover:w-30 sm:hover:w-32 items-center justify-start rounded-full bg-brand-blue text-white font-bold shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer select-none overflow-hidden"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
                <FiPhoneCall className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-phone-ring group-hover/call:scale-110" />
              </div>
              <span className="opacity-0 group-hover/call:opacity-100 translate-x-2 group-hover/call:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap text-white font-extrabold tracking-wide text-sm sm:text-base pr-4 select-none">
                Call Us
              </span>
            </a>
          </div>

          {/* 3. Direct WhatsApp Button (Green - smooth expandable pill) */}
          <div className="relative flex items-center justify-end">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackSocialClick('WhatsApp', primaryPhone)}
              aria-label="WhatsApp Us"
              className="fcb-btn group/wa flex h-12 w-12 sm:h-13 sm:w-13 hover:w-32 sm:hover:w-36 items-center justify-start rounded-full bg-[#25D366] text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 ease-out cursor-pointer select-none overflow-hidden"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 flex items-center justify-center shrink-0">
                <FaWhatsapp className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-white animate-wa-bounce group-hover/wa:scale-110" />
              </div>
              <span className="opacity-0 group-hover/wa:opacity-100 translate-x-2 group-hover/wa:translate-x-0 transition-all duration-300 ease-out whitespace-nowrap text-white font-extrabold tracking-wide text-sm sm:text-base pr-4 select-none">
                WhatsApp
              </span>
            </a>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fcb-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="fcb-modal relative w-full max-w-xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {!sent && (
              <button
                type="button"
                onClick={close}
                aria-label="Close modal"
                className="absolute -top-3 -right-3 sm:-top-3 sm:-right-3 md:-top-3.5 md:-right-3.5 lg:-top-3.5 lg:-right-3.5 bg-white shadow-lg text-red-600 hover:text-red-700 p-2 rounded-full transition-all cursor-pointer border border-slate-200 z-50 flex items-center justify-center"
              >
                <FiX className="w-5 h-5 text-red-600" />
              </button>
            )}

            <div className="overflow-y-auto rounded-3xl flex-1">
              {!sent && (
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white relative text-center flex flex-col items-center justify-center">
                  <h3 className="text-xl font-bold text-center">Enquiry</h3>
                  <div className="text-white text-xs mt-0.5 text-center">Fill the form and our team will contact you shortly.</div>
                </div>
              )}

            {sent ? (
              <div className="p-6 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Success!</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required error={errors.full_name}>
                    <input type="text" value={form.full_name} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="John Doe" className={inputCls(errors.full_name)} />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="john@example.com" className={inputCls(errors.email)} />
                  </Field>
                  <Field label="Phone Number" required error={errors.phone}>
                    <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="+1 234 567 890" className={inputCls(errors.phone)} />
                  </Field>
                  <Field label="Subject" required error={errors.subject}>
                    <div className="relative">
                      <select value={form.subject} onChange={(e) => handleChange('subject', e.target.value)} className={`${inputCls(errors.subject)} appearance-none ${!form.subject ? 'text-slate-400' : ''}`}>
                        <option value="" disabled>Select enquiry type</option>
                        {SUBJECT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Message" required error={errors.message}>
                      <textarea rows={3} value={form.message} onChange={(e) => handleChange('message', e.target.value)} placeholder="Tell us how we can help..." className={`${inputCls(errors.message)} resize-y`} />
                    </Field>
                  </div>
                </div>
                {errors.form && <p className="!text-red-500 text-xs mt-2">{errors.form}</p>}
                <label className="mt-4 flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={agreeTerms} onChange={(e) => {
                    const checked = e.target.checked;
                    setAgreeTerms(checked);
                    if (checked) {
                      if (errors.agree) setErrors((prev) => ({ ...prev, agree: undefined }));
                    } else {
                      setErrors((prev) => ({ ...prev, agree: 'Please agree to the terms and conditions' }));
                    }
                  }} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{' '}
                    <a href="/terms" className="text-blue-600 underline hover:text-blue-700">Terms of Use</a>
                    {' '}and{' '}
                    <a href="/privacy" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</a>.
                  </span>
                </label>
                {errors.agree && <p className="!text-red-500 text-xs mt-1.5 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>{errors.agree}</p>}
                <div className="mt-6 flex justify-center">
                  <button type="submit" disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {submitting ? (
                      <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sending...</>
                    ) : (
                      <><FiSend className="w-4 h-4" /> Send message</>
                    )}
                  </button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
