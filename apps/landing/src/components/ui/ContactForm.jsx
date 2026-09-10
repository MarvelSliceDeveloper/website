import { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../ui/Reveal';

export default function ContactForm() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[\d\s+\-()]{7,15}$/.test(form.phone.trim())) errs.phone = 'Invalid phone number';
    if (!agreeTerms) errs.agree = 'Please agree to the terms and conditions';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('submitting');

    try {
      const res = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setForm({ full_name: '', email: '', phone: '' });
        setAgreeTerms(false);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <Reveal className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 p-8">
        <h3 className="text-xl font-bold text-[#1A1A2E] mb-1">Get in Touch</h3>
        <p className="text-sm text-neutral-500 mb-6">Fill out the form below and we'll get back to you shortly.</p>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <FiCheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-lg font-bold text-[#1A1A2E]">Success!</h4>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                      errors.full_name ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                    }`}
                  />
                </div>
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                      errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                      errors.phone ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                    }`}
                  />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAgreeTerms(checked);
                    if (checked) {
                      setErrors((prev) => ({ ...prev, agree: undefined }));
                    } else {
                      setErrors((prev) => ({ ...prev, agree: 'Please agree to the terms and conditions' }));
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#1E56C7] focus:ring-[#1E56C7]/20 shrink-0"
                />
                <span className="text-xs text-neutral-600 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" className="text-[#1E56C7] underline hover:text-blue-700">Terms of Use</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-[#1E56C7] underline hover:text-blue-700">Privacy Policy</a>.
                </span>
              </label>
              {errors.agree && (
                <p className="text-xs font-medium !text-red-600 mt-1.5 flex items-center gap-1 text-left" style={{ color: '#dc2626' }}>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#dc2626' }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{errors.agree}</span>
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#1E56C7] text-white font-semibold text-sm hover:bg-[#1642a0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {status === 'submitting' ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Submit'
                )}
              </button>

              {status === 'error' && (
                <p className="text-xs text-red-500 text-center">Something went wrong. Please try again.</p>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}
