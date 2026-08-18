import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { trackFormSubmit, trackDownload } from '../lib/analytics';
import Reveal from '../components/ui/Reveal';
import CTABannerSection from '../components/home/CTABannerSection';
import {
  FiMapPin, FiClock, FiDollarSign,
  FiSearch, FiExternalLink, FiChevronRight,
  FiBriefcase, FiUpload, FiSend, FiCheck,
  FiAlertCircle, FiX, FiArrowRight,
} from 'react-icons/fi';

function getFieldConfig(formConfig, key, defaults) {
  return { ...defaults, ...(formConfig?.fields?.[key] || {}) };
}

async function uploadWithRetry(bucket, path, file, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) return { error: null };
    if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    else return { error };
  }
  return { error: new Error('Upload failed after retries') };
}

async function compressImage(file, maxWidth = 1920, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Compression failed'));
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs !text-red-500 mt-1.5 flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>{error}</p>}
    </div>
  );
}

function BookDemoForm() {
  const [demoForm, setDemoForm] = useState({ name: '', email: '', phone: '' });
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoMsg, setDemoMsg] = useState(null);
  const [demoAgree, setDemoAgree] = useState(false);

  async function handleDemoSubmit(e) {
    e.preventDefault();
    if (!demoAgree) {
      setDemoMsg({ type: 'error', text: 'Please agree to the terms and conditions.' });
      return;
    }
    setDemoSubmitting(true);
    setDemoMsg(null);
    const { error } = await supabase.from('career_contact_submissions').insert({
      full_name: demoForm.name.trim(),
      email: demoForm.email.trim(),
      phone: demoForm.phone.trim(),
    });
    if (error) {
      setDemoMsg({ type: 'error', text: 'Submission failed. Please try again.' });
      setDemoSubmitting(false);
      return;
    }
    fetch('/api/submit-career-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: demoForm.name.trim(), email: demoForm.email.trim(), phone: demoForm.phone.trim() }),
    }).catch(() => {});
    trackFormSubmit('career_contact');
    setDemoDone(true);
    setDemoSubmitting(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
      <div className="bg-brand-orange px-6 py-4">
        <h3 className="text-xl font-bold text-white">Enquiry</h3>
        <div className="text-white text-xs mt-0.5">Fill the form and our team will contact you shortly.</div>
      </div>
      <div className="p-6">
        {demoDone ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-1">Thank You!</h4>
            <p className="text-sm text-slate-500">We have received your request. Our team will get in touch with you shortly.</p>
            <button onClick={() => { setDemoDone(false); setDemoForm({ name: '', email: '', phone: '' }); setDemoAgree(false); }} className="mt-6 text-sm font-semibold text-brand-orange hover:underline">
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleDemoSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={demoForm.name}
                onChange={(e) => setDemoForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Your Name *"
                required
                className="w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors border-gray-300 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              />
            </div>
            <div>
              <input
                type="email"
                value={demoForm.email}
                onChange={(e) => setDemoForm(p => ({ ...p, email: e.target.value }))}
                placeholder="Email Address *"
                required
                className="w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors border-gray-300 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              />
            </div>
            <div>
              <input
                type="tel"
                value={demoForm.phone}
                onChange={(e) => setDemoForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="Phone Number *"
                required
                className="w-full px-4 py-3 text-sm border rounded-lg outline-none transition-colors border-gray-300 focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange"
              />
            </div>
            {demoMsg && (
              <p className="!text-red-500 text-xs">{demoMsg.text}</p>
            )}
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={demoAgree} onChange={(e) => {
                setDemoAgree(e.target.checked);
                if (demoMsg?.type === 'error') setDemoMsg(null);
              }} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/20" />
              <span className="text-xs text-slate-600 leading-relaxed">
                I agree to the{' '}
                <a href="/terms" className="text-brand-orange underline hover:text-brand-orange/80">Terms of Use</a>
                {' '}and{' '}
                <a href="/privacy" className="text-brand-orange underline hover:text-brand-orange/80">Privacy Policy</a>.
              </span>
            </label>
            <button
              type="submit"
              disabled={demoSubmitting}
              className="w-1/2 mx-auto block py-2.5 rounded-lg bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange/90 transition-colors disabled:opacity-60 cursor-pointer"
            >
              {demoSubmitting ? 'Submitting...' : 'Send'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Career() {
  const formRef = useRef(null);
  const jobsRef = useRef(null);
  const [searchParams] = useSearchParams();
  const applyTitle = searchParams.get('apply');
  const [showForm, setShowForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    category: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const visibleJobs = 4;

  const { data: pageContent, isLoading: pageLoading } = useQuery({
    queryKey: ['career-page-content'],
    queryFn: async () => {
      const { data } = await supabase
        .from('career_page_content')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) return data;

      const { data: navItems } = await supabase
        .from('nav_items')
        .select('id')
        .eq('path', '/career')
        .eq('is_active', true)
        .order('id')
        .limit(1);
      const navItem = navItems?.[0] || null;
      if (!navItem?.id) return {};

      const { data: pages } = await supabase
        .from('nav_pages')
        .select('*')
        .eq('nav_item_id', navItem.id)
        .eq('is_published', true)
        .order('id')
        .limit(1);
      const page = pages?.[0] || null;
      if (!page) return {};

      return {
        hero_heading: page.heading || '',
        hero_subheading: page.subheading || '',
        hero_image: page.hero_image || '',
        section2_heading: 'Job Openings',
      };
    },
  });

  const fc = pageContent?.form_config || {};
  const formCfg = fc.form || {};
  const section2HeadingAlign = fc.section2_heading_align || 'center';
  const section2SubheadingAlign = fc.section2_subheading_align || 'center';
  const formEnabled = formCfg.enabled !== false;

  const ctaConfig = fc.cta_banner || {};
  const ctaSection = {
    heading: ctaConfig.heading || '',
    subheading: ctaConfig.subheading || '',
    content: {
      description: ctaConfig.description || '',
      cta_text: ctaConfig.cta_text || '',
      cta_link: ctaConfig.cta_link || '',
      background_image: ctaConfig.background_image || '',
    },
  };

  const { data: roleCategories, isLoading: catsLoading } = useQuery({
    queryKey: ['role-categories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('role_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      return data || [];
    },
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['job-openings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('job_openings')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: internships, isLoading: internshipsLoading } = useQuery({
    queryKey: ['internships'],
    queryFn: async () => {
      const { data } = await supabase
        .from('internships')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  useEffect(() => {
    if (selectedJob) {
      setForm(prev => ({
        ...prev,
        position: selectedJob.title || '',
        category: selectedJob._type === 'intern' ? 'Internship' : (selectedJob.type || prev.category),
      }));
    }
  }, [selectedJob]);

  useEffect(() => {
    if (applyTitle && (jobs?.length > 0 || internships?.length > 0) && formEnabled) {
      const job = jobs?.find(j => j.title === applyTitle) || null;
      const intern = internships?.find(i => i.title === applyTitle) || null;
      const selected = job || intern;
      setSelectedJob(selected);
      setForm(prev => ({
        ...prev,
        position: applyTitle,
        category: intern ? 'Internship' : prev.category,
      }));
      setShowForm(true);
      setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTitle, jobs, internships, formEnabled]);

  const isLoading = pageLoading || catsLoading || jobsLoading || internshipsLoading;
  const isInternship = form.category === 'Internship';

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[\d\s+\-()]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number';
    if (!form.position.trim()) errs.position = 'Position is required';
    if (!form.category) errs.category = 'Please select a category';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!agreeTerms) errs.agree = 'Please agree to the terms and conditions';
    if (!file) errs.file = 'Resume is required';
    else {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
      if (!allowed.includes(file.type)) errs.file = 'Only PDF, DOC, DOCX, JPG, PNG files are allowed';
      if (file.size > 10 * 1024 * 1024) errs.file = 'File must be under 10 MB';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setStatus(null);

    let file_url = '';

    if (file) {
      setUploading(true);
      let uploadFile = file;
      const isImage = ['image/jpeg', 'image/png'].includes(file.type);
      if (isImage) {
        try {
          uploadFile = await compressImage(file);
        } catch { }
      }
      const ext = uploadFile.name.split('.').pop();
      const path = `career/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await uploadWithRetry('career-uploads', path, uploadFile);
      if (uploadError) {
        setStatus({ type: 'error', message: `Upload failed: ${uploadError.message || 'Please try again.'}` });
        setUploading(false);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('career-uploads').getPublicUrl(path);
      file_url = urlData.publicUrl;
      setUploading(false);
    }

    const { error: insertError } = await supabase
      .from('career_submissions')
      .insert({ full_name: form.full_name, email: form.email, phone: form.phone, department: form.position, category: form.category, description: form.description, file_url });

    if (insertError) {
      setStatus({ type: 'error', message: 'Failed to save submission. Please try again.' });
      setSubmitting(false);
      return;
    }

    fetch('/api/submit-career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, file_url }),
    }).catch(() => {});

    trackFormSubmit('career');
    if (file_url) trackDownload('career_resume');
    setStatus({ type: 'success', message: 'Application submitted successfully! We will get back to you soon.' });
    setAgreeTerms(false);
    setSubmitting(false);
  }

  function renderForm() {
    if (!formEnabled) return null;
    const ctaText = formCfg.cta?.text || 'Submit Application';

    const fieldDefs = {
      full_name: { type: 'text', ...getFieldConfig(formCfg, 'full_name', { label: 'Full Name', enabled: true, required: true, placeholder: 'John Doe' }) },
      email: { type: 'email', ...getFieldConfig(formCfg, 'email', { label: 'Email Address', enabled: true, required: true, placeholder: 'john@example.com' }) },
      phone: { type: 'tel', ...getFieldConfig(formCfg, 'phone', { label: 'Phone Number', enabled: true, required: true, placeholder: '+1 234 567 890' }) },
      position: { type: 'text', ...getFieldConfig(formCfg, 'position', { label: 'Position', enabled: true, required: true }) },
      category: { type: 'select', ...getFieldConfig(formCfg, 'category', { label: 'Category', enabled: true, required: true, placeholder: 'Select category', options: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'] }) },
      description: { type: 'textarea', ...getFieldConfig(formCfg, 'description', { label: 'Description', enabled: true, required: true, placeholder: 'Tell us about yourself...' }) },
      file_upload: { type: 'file', ...getFieldConfig(formCfg, 'file_upload', { label: 'Upload Resume', enabled: true, required: true }) },
    };

    if (status?.type === 'success') {
      return (
        <div className="p-6 sm:p-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Application Submitted!</h3>
            <p className="text-sm text-slate-500 mb-6">{status.message}</p>
            <button onClick={() => { setShowForm(false); setSelectedJob(null); }}
              className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer">
              Close
            </button>
          </motion.div>
        </div>
      );
    }

    return (
      <div>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mx-6 sm:mx-8 mt-6 p-4 rounded-lg flex items-start gap-3 text-sm ${
              status.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}
          >
            {status.type === 'error' ? <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : <FiCheck className="w-5 h-5 shrink-0 mt-0.5" />}
            <span className="flex-1">{status.message}</span>
            <button onClick={() => setStatus(null)} className="p-1 hover:opacity-70 rounded transition-opacity cursor-pointer">
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 sm:p-8">
            {fieldDefs.full_name.enabled !== false && (
              <Field label={fieldDefs.full_name.label} required={fieldDefs.full_name.required !== false} error={errors.full_name}>
                <input name="full_name" value={form.full_name} onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 ${
                    errors.full_name ? 'border-red-300' : 'border-slate-200'
                  }`} placeholder={fieldDefs.full_name.placeholder} />
              </Field>
            )}
            {fieldDefs.email.enabled !== false && (
              <Field label={fieldDefs.email.label} required={fieldDefs.email.required !== false} error={errors.email}>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 ${
                    errors.email ? 'border-red-300' : 'border-slate-200'
                  }`} placeholder={fieldDefs.email.placeholder} />
              </Field>
            )}

            {fieldDefs.phone.enabled !== false && (
              <Field label={fieldDefs.phone.label} required={fieldDefs.phone.required !== false} error={errors.phone}>
                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 ${
                    errors.phone ? 'border-red-300' : 'border-slate-200'
                  }`} placeholder={fieldDefs.phone.placeholder} />
              </Field>
            )}
            {fieldDefs.position.enabled !== false && (
              <Field label={fieldDefs.position.label} required={fieldDefs.position.required !== false} error={errors.position}>
                <input name="position" value={form.position} readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 text-sm cursor-not-allowed" />
              </Field>
            )}

            {fieldDefs.category.enabled !== false && (
              <Field label={fieldDefs.category.label} required={fieldDefs.category.required !== false} error={errors.category}>
                <div className="relative">
                  {isInternship ? (
                    <input name="category" value={form.category} readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 text-sm cursor-not-allowed" />
                  ) : (
                    <>
                      <select name="category" value={form.category} onChange={handleChange}
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none ${
                          errors.category ? 'border-red-300' : 'border-slate-200'
                        } ${!form.category ? 'text-slate-400' : ''}`}>
                        <option value="" disabled>{fieldDefs.category.placeholder}</option>
                        {(fieldDefs.category.options || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </>
                  )}
                </div>
              </Field>
            )}

            {fieldDefs.description.enabled !== false && (
              <div className="sm:col-span-2">
                <Field label={fieldDefs.description.label} required={fieldDefs.description.required !== false} error={errors.description}>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 resize-y ${
                      errors.description ? 'border-red-300' : 'border-slate-200'
                    }`} placeholder={fieldDefs.description.placeholder} />
                </Field>
              </div>
            )}

            {fieldDefs.file_upload.enabled !== false && (
              <div className="sm:col-span-2">
                <Field label={fieldDefs.file_upload.label} required={fieldDefs.file_upload.required !== false} error={errors.file}>
                  <label className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${
                    errors.file
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-brand-orange/40 hover:border-brand-orange bg-orange-50/40 hover:bg-orange-50/80'
                  }`}>
                    <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <FiUpload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      {file ? (
                        <span className="text-sm font-semibold text-brand-orange">{file.name}</span>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
                          <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX (max 10MB)</p>
                        </>
                      )}
                    </div>
                    <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => {
                      const f = e.target.files?.[0];
                      setFile(f || null);
                      if (errors.file) setErrors(prev => ({ ...prev, file: '' }));
                    }} className="hidden" />
                    {file && (
                      <button type="button" onClick={() => { setFile(null); if (formRef.current) formRef.current.querySelector('input[type="file"]').value = ''; }}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </label>
                </Field>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={agreeTerms} onChange={(e) => {
                  setAgreeTerms(e.target.checked);
                  if (errors.agree) setErrors(prev => ({ ...prev, agree: '' }));
                }} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/20" />
                <span className="text-sm text-slate-600 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms" className="underline hover:opacity-80 text-brand-orange">Terms of Use</a>
                  {' '}and{' '}
                  <a href="/privacy" className="underline hover:opacity-80 text-brand-orange">Privacy Policy</a>.
                </span>
              </label>
              {errors.agree && <p className="text-xs text-red-500 mt-1">{errors.agree}</p>}
            </div>

            <div className="sm:col-span-2 pt-1">
              <button type="submit" disabled={submitting || uploading}
                className="w-fit mx-auto bg-brand-orange hover:bg-brand-orange/90 active:scale-[0.99] text-white font-semibold py-2 px-5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {uploading ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Uploading...</>
                ) : submitting ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Submitting...</>
                ) : (
                  <><FiSend className="w-4 h-4" /> {ctaText}</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="space-y-4 text-center">
          <div className="h-6 w-32 bg-gray-100 rounded-full animate-pulse mx-auto" />
          <div className="h-10 w-96 bg-gray-100 rounded-lg animate-pulse mx-auto" />
          <div className="h-5 w-64 bg-gray-100 rounded animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div>

      {pageContent?.hero_image ? (
        <div className="relative w-full max-w-[1900px] mx-auto h-auto sm:h-[400px] lg:h-[400px] overflow-hidden">
          <img src={pageContent.hero_image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8 lg:pb-10">
              {pageContent.hero_heading && (
                <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-white">
                  {pageContent.hero_heading}
                </h1>
              )}
              {pageContent.hero_subheading && (
                <p className="text-sm sm:text-base text-white/80 mt-1.5 max-w-2xl">
                  {pageContent.hero_subheading}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (pageContent?.hero_heading || pageContent?.hero_subheading) ? (
        <div className="bg-gradient-to-br from-dark-navy to-brand-blue py-16 sm:py-20">
          <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {pageContent?.hero_heading && (
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
                {pageContent.hero_heading}
              </h1>
            )}
            {pageContent?.hero_subheading && (
              <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto">
                {pageContent.hero_subheading}
              </p>
            )}
          </Reveal>
        </div>
      ) : null}

      <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
        {fc.headline && (
          <h2 className="text-4xl font-extrabold text-brand-orange">
            {fc.headline}
          </h2>
        )}
        <div className="w-16 h-0.5 bg-brand-orange mx-auto rounded-full mt-3" />

        {fc.subtitle && (
          <p className="text-xl font-bold text-brand-orange mt-8">
            {fc.subtitle}
          </p>
        )}

        {fc.description && (
          <p className="text-slate-500 text-base w-full max-w-none mx-auto mt-3">
            {fc.description}
          </p>
        )}

        <div className="mt-10">
        {fc.categoriesSubtitle && (
          <h3 className="text-2xl font-bold text-brand-orange mt-1">
            {fc.categoriesSubtitle}
          </h3>
        )}
        <div className="w-12 h-1 bg-brand-orange mx-auto rounded-full mt-2" />

        {roleCategories?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-6xl mx-auto text-left">
            {roleCategories.map((cat, idx) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-3 group"
              >
                <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${idx % 2 === 0 ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                  <FiBriefcase className="w-5 h-5" />
                </div>
                <span className="text-gray-900 font-semibold text-sm md:text-base">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiSearch className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">No role categories available right now.</p>
          </div>
        )}
        </div>
      </Reveal>

      <CTABannerSection section={ctaSection} />

      <div ref={jobsRef} className="bg-gradient-to-b from-orange-50/40 via-slate-50 to-slate-50">
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className={`mb-10 text-${section2HeadingAlign}`}>
            {pageContent?.section2_heading && (
              <h2 className="text-3xl font-extrabold text-slate-900 mt-2">
                {pageContent.section2_heading}
              </h2>
            )}
            {pageContent?.section2_subheading && (
              <p className="text-slate-600 text-sm mt-1">
                {pageContent.section2_subheading}
              </p>
            )}
            <div className="w-12 h-1 bg-brand-orange mx-auto rounded-full mt-3" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
            <div className="order-2 lg:order-1">
          {(jobs?.length > 0 || internships?.length > 0) ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  const allItems = [];
                  const maxLen = Math.max(jobs?.length || 0, internships?.length || 0);
                  for (let i = 0; i < maxLen; i++) {
                    if (internships?.[i]) allItems.push({ ...internships[i], _type: 'intern' });
                    if (jobs?.[i]) allItems.push({ ...jobs[i], _type: 'job' });
                  }
                  return allItems.slice(0, visibleJobs).map((item, i) => {
                    if (item._type === 'intern') {
                      return (
                        <motion.div
                          key={`intern-${item.id}`}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-brand-orange/10 text-brand-orange p-2.5 rounded-xl shrink-0">
                              <FiBriefcase className="w-5 h-5" />
                            </div>
                            <h3 className="flex-1 font-bold text-slate-800 text-lg leading-tight">{item.title}</h3>
                            <span className="text-xs font-semibold text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full shrink-0">Internship</span>
                          </div>
                          {(item.duration || item.stipend || item.experience) && (
                            <div className="flex items-center gap-4 flex-wrap border-y border-slate-100 py-2.5 px-3 my-3 rounded-lg bg-orange-50/40 text-sm text-slate-600">
                              {item.duration && (
                                <span className="flex items-center gap-1.5">
                                  <FiClock className="w-3.5 h-3.5 text-brand-orange" />{item.duration}
                                </span>
                              )}
                              {item.stipend && (
                                <span className="flex items-center gap-1.5">
                                  <FiDollarSign className="w-3.5 h-3.5 text-brand-orange" />{item.stipend}
                                </span>
                              )}
                              {item.experience && (
                                <span className="flex items-center gap-1.5">
                                  <FiBriefcase className="w-3.5 h-3.5 text-brand-orange" />{item.experience}
                                </span>
                              )}
                            </div>
                          )}
                          {item.description && (
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-3 flex-1">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto pt-2">
                            {item.location ? (
                              <span className="text-slate-600 text-sm flex items-center gap-1 font-medium">
                                <FiMapPin className="w-3.5 h-3.5 shrink-0" />{item.location}
                              </span>
                            ) : <span />}
                            <button
                              onClick={() => {
                                if (item.apply_url?.trim()) {
                                  window.open(item.apply_url.trim(), '_blank', 'noopener,noreferrer');
                                } else {
                                  setSelectedJob(item);
                                  setShowForm(true);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all cursor-pointer">
                              Apply Now <FiArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    }
                    return (
                      <motion.div
                        key={`job-${item.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-brand-blue/10 text-brand-blue p-2.5 rounded-xl shrink-0">
                            <FiBriefcase className="w-5 h-5" />
                          </div>
                          <h3 className="flex-1 font-bold text-slate-800 text-lg leading-tight">{item.title}</h3>
                          <span className="text-xs font-semibold text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full shrink-0">Job</span>
                        </div>
                        {(item.experience || item.salary) && (
                          <div className="flex items-center gap-4 flex-wrap border-y border-slate-100 py-2.5 px-3 my-3 rounded-lg bg-orange-50/40 text-sm text-slate-600">
                            {item.experience && (
                              <span className="flex items-center gap-1.5">
                                <FiClock className="w-3.5 h-3.5 text-brand-orange" />{item.experience}
                              </span>
                            )}
                            {item.salary && (
                              <span className="flex items-center gap-1.5">
                                <FiDollarSign className="w-3.5 h-3.5 text-brand-orange" />{item.salary}
                              </span>
                            )}
                          </div>
                        )}
                        {item.description && (
                          <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 mb-3 flex-1">
                            {item.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto pt-2">
                          {item.location ? (
                            <span className="text-slate-600 text-sm flex items-center gap-1 font-medium">
                              <FiMapPin className="w-3.5 h-3.5 shrink-0" />{item.location}
                            </span>
                          ) : <span />}
                          <button
                            onClick={() => {
                              if (item.apply_url?.trim()) {
                                window.open(item.apply_url.trim(), '_blank', 'noopener,noreferrer');
                              } else {
                                setSelectedJob(item);
                                setShowForm(true);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-all cursor-pointer">
                            Apply Now <FiArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>
              {(jobs?.length || 0) + (internships?.length || 0) > visibleJobs && (
                <div className="flex justify-end mt-4">
                  <Link
                    to="/career/jobs"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors cursor-pointer"
                  >
                    View More <FiArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <FiSearch className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No openings right now — check back soon!</p>
            </div>
          )}
            </div>
            <aside className="order-1 lg:order-2">
              <BookDemoForm />
            </aside>
          </div>
        </Reveal>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setSelectedJob(null); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-brand-orange px-6 py-4 text-white relative">
              <button onClick={() => { setShowForm(false); setSelectedJob(null); }} className="absolute top-3 right-3 bg-white shadow-md text-slate-600 hover:text-slate-800 p-1.5 rounded-full transition-all cursor-pointer border border-slate-200 z-10" aria-label="Close">
                <FiX className="w-4 h-4" />
              </button>
              {selectedJob && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-medium text-white/90 mt-1 border border-white/10">
                  Applying for: <span className="font-semibold">{selectedJob.title}</span>
                </span>
              )}
            </div>
            {renderForm()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
