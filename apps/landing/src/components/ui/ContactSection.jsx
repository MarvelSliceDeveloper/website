import { useState, useEffect } from 'react';
import { FiMapPin, FiPhone, FiMail, FiClock, FiCheckCircle, FiCheck, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { trackFormSubmit, trackPhoneClick, trackEmailClick } from '../../lib/analytics';

import { extractPhoneNumbers, cleanTelHref } from '../../lib/phoneUtils';

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

function hexToRgba(hex, alpha) {
  let h = String(hex || '').replace('#', '');
  if (!h) return `rgba(255, 255, 255, ${alpha})`;
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ContactDetailItem({ icon: Icon, heading, value, href, textColor, onClick, alignTop = false, iconColor = '#1E56C7' }) {
  const content = href ? (
    <a href={href} onClick={onClick} className="hover:opacity-80 transition-opacity text-xs sm:text-sm leading-relaxed block break-words text-left" style={{ color: hexToRgba(textColor, 0.95) }}>{value}</a>
  ) : (
    <span className="text-xs sm:text-sm leading-relaxed block break-words whitespace-pre-line text-left" style={{ color: hexToRgba(textColor, 0.95) }}>{value}</span>
  );
  return (
    <div className="flex flex-col text-left items-start w-full">
      {heading && (
        <h5 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs mb-1 text-left" style={{ color: hexToRgba(textColor, 0.75) }}>
          {heading}
        </h5>
      )}
      <div className={`flex ${alignTop ? 'items-start' : 'items-center'} justify-start gap-2.5 sm:gap-3 mt-0.5 w-full`}>
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md border border-white/40 ring-1 ring-black/5 ${alignTop ? 'mt-0.5' : ''}`}
        >
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.75]" style={{ color: iconColor }} strokeWidth={2.75} />
        </div>
        <div className="min-w-0 flex-1 text-left">
          {content}
        </div>
      </div>
    </div>
  );
}

export default function ContactSection({ section }) {
  const c = section?.content || {};

  const headingColor = c.heading_color || '#ffffff';
  const subheadingColor = c.subheading_color || '#ffffff';
  const textColor = c.text_color || '#ffffff';
  const iconColor = c.icon_color || '#1E56C7';

  const leftHeading = c.left_heading || section?.heading || 'Get in Touch';
  const leftSubtitle = c.left_subtitle || 'We\'d love to hear from you. Reach out to us and we\'ll get back to you as soon as possible.';
  const address = c.address || '';
  
  // Phone numbers: Competitive Exam Enquiry & Software Enquiry
  const phoneItems = [];
  const phoneComp = c.phone_competitive || c.phone_1;
  const phoneSoft = c.phone_software || c.phone_2;

  if (phoneComp) {
    phoneItems.push({
      heading: c.phone_competitive_heading || c.phone_1_heading || 'Competitive Exam Enquiry',
      phone: phoneComp,
    });
  }
  if (phoneSoft) {
    phoneItems.push({
      heading: c.phone_software_heading || c.phone_2_heading || 'Software Enquiry',
      phone: phoneSoft,
    });
  }
  // Fallback for legacy display_phone or phone strings
  if (phoneItems.length === 0 && (c.display_phone || c.phone)) {
    const rawPhones = extractPhoneNumbers(c.display_phone || c.phone);
    rawPhones.forEach((ph, idx) => {
      phoneItems.push({
        heading: idx === 0 ? 'Competitive Exam Enquiry' : idx === 1 ? 'Software Enquiry' : 'Enquiry',
        phone: ph,
      });
    });
  }

  // Email addresses: multiple emails with optional heading
  let emailItems = [];
  if (Array.isArray(c.emails) && c.emails.length > 0) {
    emailItems = c.emails
      .filter(e => e && (e.email || e.heading))
      .map(e => ({ heading: e.heading || '', email: e.email || '' }));
  } else if (c.email) {
    emailItems = [{ heading: c.email_heading || '', email: c.email }];
  }

  const workingTime = c.working_time || c.business_hours || '';
  const workingTimeSaturday = c.working_time_saturday || c.saturday_hours || '';

  const successMessage = c.success_message || 'Thank you! Your message has been received. Our team will contact you soon.';

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 2000);
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
    if (!form.message.trim()) errs.message = 'Message is required';
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
      const { error: dbError } = await supabase.from('contact_submissions').insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });

      if (dbError) {
        console.error('Contact form DB error:', dbError);
      }

      fetch('/api/submit-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).catch(() => {});

      trackFormSubmit('contact');
      setStatus('success');
      setForm({ full_name: '', email: '', phone: '', message: '' });
      setAgreeTerms(false);
    } catch (err) {
      console.error('Contact form submission exception:', err);
      setStatus('error');
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const [imgFailed, setImgFailed] = useState(false);
  const hasValidBgImage = Boolean(c.enable_bg_image && c.left_bg_image && !imgFailed);

  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)] max-w-[600px] lg:max-w-none mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
        {/* Left: Get in Touch */}
        <div
          className="relative p-4 sm:p-6 lg:p-7 flex flex-col text-center lg:text-left h-auto min-h-0 overflow-hidden w-full items-center lg:items-stretch justify-center lg:justify-start"
          style={
            hasValidBgImage
              ? { backgroundColor: c.gradient_start || '#0B2D6B' }
              : { background: `linear-gradient(135deg, ${c.gradient_start || '#0B2D6B'}, ${c.gradient_end || '#1E56C7'})` }
          }
        >
          {hasValidBgImage ? (
            <img
              src={c.left_bg_image}
              alt="Contact Background"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-all duration-300"
              style={{
                opacity: (c.image_opacity ?? 100) / 100,
                filter: `blur(${c.image_blur ?? 4}px)`,
                transform: 'scale(1.06)',
              }}
            />
          ) : (
            <FloatingCircles />
          )}
          <div className="relative z-10 flex flex-col h-full space-y-5 sm:space-y-6 max-w-[600px] mx-auto lg:max-w-none w-full">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2.5" style={{ color: headingColor }}>
                {leftHeading}
                {c.left_heading_line_2 && <><br /><span style={{ color: c.heading_line_2_color || headingColor }}>{c.left_heading_line_2}</span></>}
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md mx-auto lg:mx-0" style={{ color: subheadingColor }}>{leftSubtitle}</p>
            </div>
            <div className="space-y-4 sm:space-y-5 text-left w-full max-w-[280px] sm:max-w-none mx-auto lg:mx-0 my-auto py-2 flex flex-col items-start">
              {address && (
                <ContactDetailItem
                  icon={FiMapPin}
                  heading="Address"
                  value={address}
                  textColor={textColor}
                  iconColor={iconColor}
                  alignTop
                />
              )}

              {/* Contact Numbers & Email Section: 1-column on mobile, 2-column on tablet & PC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 items-start w-full">
                {/* Left (Column 1): Contact Numbers */}
                {phoneItems.length > 0 && (
                  <div className="space-y-4 w-full flex flex-col items-start">
                    {phoneItems.map((ph, idx) => (
                      <ContactDetailItem
                        key={`phone-${idx}`}
                        icon={FiPhone}
                        heading={ph.heading}
                        value={ph.phone}
                        href={cleanTelHref(ph.phone)}
                        onClick={() => trackPhoneClick(ph.phone, 'contact_section')}
                        textColor={textColor}
                        iconColor={iconColor}
                      />
                    ))}
                  </div>
                )}

                {/* Right (Column 2): Email Section */}
                {emailItems.length > 0 && (
                  <div className="flex flex-col text-left items-start w-full">
                    <h5 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs mb-1 text-left" style={{ color: hexToRgba(textColor, 0.75) }}>
                      EMAIL
                    </h5>
                    <div className="space-y-2.5 mt-0.5 flex flex-col items-start w-full">
                      {emailItems.map((em, idx) => (
                        <div key={`email-${idx}`} className="flex items-center justify-start gap-2.5 sm:gap-3 w-full">
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md border border-white/40 ring-1 ring-black/5"
                          >
                            <FiMail className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.75]" style={{ color: iconColor }} strokeWidth={2.75} />
                          </div>
                          <a
                            href={em.email ? `mailto:${em.email}` : undefined}
                            onClick={() => em.email && trackEmailClick(em.email, 'contact_section')}
                            className="hover:opacity-80 transition-opacity text-xs sm:text-sm leading-relaxed block break-words text-left min-w-0 flex-1"
                            style={{ color: hexToRgba(textColor, 0.95) }}
                          >
                            {em.email}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {(workingTime || workingTimeSaturday) && (
                <div className="flex flex-col text-left items-start w-full">
                  <h5 className="font-bold uppercase tracking-wider text-[10px] sm:text-xs mb-1 text-left" style={{ color: hexToRgba(textColor, 0.75) }}>
                    WORKING TIME
                  </h5>
                  <div className="space-y-2 mt-0.5 flex flex-col items-start w-full">
                    {workingTime && (
                      <div className="flex items-center justify-start gap-2.5 sm:gap-3 w-full">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md border border-white/40 ring-1 ring-black/5"
                        >
                          <FiClock className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.75]" style={{ color: iconColor }} strokeWidth={2.75} />
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed block break-words text-left min-w-0 flex-1" style={{ color: hexToRgba(textColor, 0.95) }}>
                          {workingTime}
                        </span>
                      </div>
                    )}
                    {workingTimeSaturday && (
                      <div className="flex items-center justify-start gap-2.5 sm:gap-3 w-full">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-md border border-white/40 ring-1 ring-black/5"
                        >
                          <FiClock className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 stroke-[2.75]" style={{ color: iconColor }} strokeWidth={2.75} />
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed block break-words text-left min-w-0 flex-1" style={{ color: hexToRgba(textColor, 0.95) }}>
                          {workingTimeSaturday}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Send us a Message Form */}
        <div className="relative bg-white p-4 sm:p-6 lg:p-7 flex flex-col justify-center lg:justify-start items-center lg:items-stretch border-t border-gray-200 lg:border-t-0 overflow-hidden w-full">
          <form
            onSubmit={handleSubmit}
            className="space-y-3.5 w-full max-w-[600px] mx-auto lg:max-w-none lg:mx-0"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-left">Full Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                    errors.full_name ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                  }`}
                />
                {errors.full_name && <p className="text-xs !text-red-600 mt-1 text-left" style={{ color: '#dc2626' }}>{errors.full_name}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-left">Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="john@example.com"
                  className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                    errors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                  }`}
                />
                {errors.email && <p className="text-xs !text-red-600 mt-1 text-left" style={{ color: '#dc2626' }}>{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-left">Phone Number <span className="text-red-400">*</span></label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 (555) 019-2834"
                className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                  errors.phone ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                }`}
              />
              {errors.phone && <p className="text-xs !text-red-600 mt-1 text-left" style={{ color: '#dc2626' }}>{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 text-left">Message <span className="text-red-400">*</span></label>
              <textarea
                value={form.message}
                required
                onChange={(e) => handleChange('message', e.target.value)}
                rows={3}
                placeholder="Write your message here..."
                className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors resize-none ${
                  errors.message ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                }`}
              />
              {errors.message && <p className="text-xs !text-red-600 mt-1 text-left" style={{ color: '#dc2626' }}>{errors.message}</p>}
            </div>
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
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20 shrink-0"
              />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to the{' '}
                <a href="/terms" className="text-brand-blue underline hover:text-blue-700">Terms of Use</a>
                {' '}and{' '}
                <a href="/privacy" className="text-brand-blue underline hover:text-blue-700">Privacy Policy</a>.
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
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="min-h-[44px] sm:min-h-[48px] px-8 sm:px-9 py-2.5 sm:py-3 rounded-full bg-[#1E56C7] text-white font-bold text-xs sm:text-sm hover:bg-[#1642a0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 cursor-pointer"
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
          </form>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                key="success-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm text-center"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full flex flex-col items-center"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-100 ring-4 ring-emerald-50">
                    <FiCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white stroke-[3]" strokeWidth={3} />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                    Submission Successful!
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed mb-6 font-normal">
                    {successMessage || 'Thank you for contacting us. We have received your message and will reach out to you shortly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm py-2.5 px-8 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    OK
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
