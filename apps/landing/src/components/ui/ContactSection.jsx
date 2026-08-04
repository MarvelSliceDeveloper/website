import { useState } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from './Reveal';
import { supabase } from '../../lib/supabaseClient';
import { trackFormSubmit } from '../../lib/analytics';

function FloatingCircles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-sm" />
      <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-white/8 blur-xs" />
      <div className="absolute bottom-10 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/6 blur-sm" />
      <div className="absolute top-10 left-1/2 w-20 h-20 rounded-full border border-white/15" />
      <div className="absolute bottom-1/3 left-8 w-28 h-28 rounded-full border border-white/10" />
    </div>
  );
}

function ContactDetailItem({ icon: Icon, label, value, href }) {
  const content = href ? (
    <a href={href} className="text-white/90 hover:text-white transition-colors text-sm leading-relaxed">{value}</a>
  ) : (
    <span className="text-white/90 text-sm leading-relaxed">{value}</span>
  );
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{label}</p>
        {content}
      </div>
    </div>
  );
}

export default function ContactSection({ section }) {
  const c = section?.content || {};

  const leftHeading = c.left_heading || section?.heading || 'Get in Touch';
  const leftSubtitle = c.left_subtitle || 'We\'d love to hear from you. Reach out to us and we\'ll get back to you as soon as possible.';
  const address = c.address || '';
  const displayPhone = c.display_phone || c.phone || '';
  const telLink = c.tel_link || c.phone || '';
  const companyEmail = c.email || '';
  const businessHours = c.business_hours || '';

  const successMessage = c.success_message || 'Thank you! Your message has been received. Our team will contact you soon.';

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[\d\s+\-()]{7,15}$/.test(form.phone.trim())) errs.phone = 'Invalid phone number';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
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
        await supabase.from('contact_submissions').insert({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        });
        trackFormSubmit('contact');
        setStatus('success');
        setForm({ full_name: '', email: '', phone: '', subject: '', message: '' });
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
    <div className="rounded-2xl shadow-lg">
      <div className="grid lg:grid-cols-2 min-h-[520px] rounded-2xl overflow-hidden">
      {/* Left: Details */}
      <div
        className="relative p-8 sm:p-10 flex flex-col justify-center"
        style={{ background: `linear-gradient(135deg, ${c.gradient_start || '#0B2D6B'}, ${c.gradient_end || '#1E56C7'})` }}
      >
        <FloatingCircles />
        <div className="relative z-10 space-y-7">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{leftHeading}</h2>
            <p className="text-white/70 text-sm leading-relaxed">{leftSubtitle}</p>
          </div>
          <div className="space-y-5">
            {address && <ContactDetailItem icon={FiMapPin} label="Address" value={address} />}
            {displayPhone && <ContactDetailItem icon={FiPhone} label="Phone" value={displayPhone} href={`tel:${telLink}`} />}
            {companyEmail && <ContactDetailItem icon={FiMail} label="Email" value={companyEmail} href={`mailto:${companyEmail}`} />}
            {businessHours && <ContactDetailItem icon={FiClock} label="Business Hours" value={businessHours} />}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#0B2D6B] mb-1">Send us a Message</h3>
            <p className="text-sm text-neutral-500 mb-6">Fill out the form below and we'll get back to you shortly.</p>

            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center py-10 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <FiCheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h4 className="text-lg font-bold text-[#0B2D6B] mb-2">Thank You!</h4>
                  <p className="text-sm text-neutral-500 max-w-xs">{successMessage}</p>
                  <button onClick={() => setStatus('idle')} className="mt-6 text-sm font-semibold text-[#1E56C7] hover:underline">
                    Send Another Message
                  </button>
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
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.full_name}
                        onChange={(e) => handleChange('full_name', e.target.value)}
                        placeholder="John Doe"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                          errors.full_name ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                        }`}
                      />
                      {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-400">*</span></label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="john@example.com"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                          errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                        }`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                      <input
                        type="tel"
                        required
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                          errors.phone ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                        }`}
                      />
                      {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Subject <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.subject}
                        onChange={(e) => handleChange('subject', e.target.value)}
                        placeholder="How can we help you?"
                        className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                          errors.subject ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                        }`}
                      />
                      {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5">Message <span className="text-red-400">*</span></label>
                    <textarea
                      value={form.message}
                      required
                      onChange={(e) => handleChange('message', e.target.value)}
                      rows={4}
                      placeholder="Write your message here..."
                      className={`w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors resize-none ${
                        errors.message ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]'
                      }`}
                    />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                  </div>
                  <div className="flex justify-center">
                    <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center justify-center gap-2 px-[30px] py-[15px] rounded-full bg-[#1E56C7] text-white font-semibold text-sm hover:bg-[#1642a0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                  </div>
                  {status === 'error' && (
                    <p className="text-xs text-red-500 text-center">Something went wrong. Please try again.</p>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
      </div>
    </div>
  );
}
