import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { trackFormSubmit, trackDownload } from '../lib/analytics';
import Reveal from '../components/ui/Reveal';
import {
  FiArrowLeft, FiArrowRight, FiBriefcase, FiSend,
  FiCheck, FiAlertCircle, FiX, FiUpload, FiMapPin, FiClock, FiDollarSign, FiFileText
} from 'react-icons/fi';

async function uploadWithRetry(bucket, path, file, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (!error) return { error: null };
    if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    else return { error };
  }
  return { error: new Error('Upload failed after retries') };
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs !text-red-500 mt-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

function renderBulletList(content) {
  if (!content) return null;
  if (Array.isArray(content)) {
    return content.map((item, idx) => (
      <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm sm:text-base leading-relaxed">
        <span className="w-2 h-2 rounded-full bg-brand-blue shrink-0 mt-2" />
        <span className="flex-1">{typeof item === 'string' ? item : item.text || item.title}</span>
      </li>
    ));
  }
  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.replace(/^[•\-\*]\s*/, ''));

  return lines.map((line, idx) => (
    <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm sm:text-base leading-relaxed">
      <span className="w-2 h-2 rounded-full bg-brand-blue shrink-0 mt-2" />
      <span className="flex-1">{line}</span>
    </li>
  ));
}

export default function JobDetail() {
  const { type, id } = useParams();
  const formRef = useRef(null);

  // Full Application Modal State (career_submissions)
  const [showForm, setShowForm] = useState(false);
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

  // Quick Career Enquiry Form State (career_contact_submissions)
  const [enquiryForm, setEnquiryForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryStatus, setEnquiryStatus] = useState(null);
  const [enquiryErrors, setEnquiryErrors] = useState({});
  const [enquiryAgree, setEnquiryAgree] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-detail', type, id],
    queryFn: async () => {
      const isIntern = type === 'intern';
      const tableName = isIntern ? 'internships' : 'job_openings';

      let query = supabase.from(tableName).select('*').eq('id', id).single();
      const { data, error: fetchErr } = await query;

      if (fetchErr && !isIntern) {
        const { data: internData } = await supabase.from('internships').select('*').eq('id', id).maybeSingle();
        if (internData) return { ...internData, _type: 'intern' };
      }

      if (data) return { ...data, _type: isIntern ? 'intern' : 'job' };
      return null;
    },
  });

  const isIntern = job?._type === 'intern';
  const empType = job?.type || job?.department || (isIntern ? 'Internship' : 'Job');
  const salaryVal = job?.salary || job?.stipend;
  const expVal = job?.experience || job?.duration;
  const locVal = job?.location;

  function openApplyModal() {
    if (job) {
      if (job.apply_url?.trim()) {
        window.open(job.apply_url.trim(), '_blank', 'noopener,noreferrer');
        return;
      }
      setForm(prev => ({
        ...prev,
        position: job.title || '',
        category: isIntern ? 'Internship' : (job.type || 'Full-time'),
      }));
      setShowForm(true);
    }
  }

  // Handle Quick Career Enquiry input change
  function handleEnquiryChange(e) {
    const { name, value } = e.target;
    setEnquiryForm(prev => ({ ...prev, [name]: value }));
    if (enquiryErrors[name]) setEnquiryErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validateEnquiry() {
    const errs = {};
    if (!enquiryForm.full_name.trim()) errs.full_name = 'Full name is required';
    if (!enquiryForm.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiryForm.email)) errs.email = 'Invalid email format';
    if (!enquiryForm.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^[\d\s+\-()]{7,20}$/.test(enquiryForm.phone)) errs.phone = 'Invalid phone number';
    if (!enquiryAgree) errs.agree = 'Please agree to the terms';
    setEnquiryErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    if (!validateEnquiry()) return;

    setEnquirySubmitting(true);
    setEnquiryStatus(null);

    try {
      const { error: insertErr } = await supabase
        .from('career_contact_submissions')
        .insert({
          full_name: enquiryForm.full_name.trim(),
          email: enquiryForm.email.trim(),
          phone: enquiryForm.phone.trim(),
        });

      if (insertErr) {
        console.error('Career contact insert error:', insertErr);
        setEnquiryStatus({ type: 'error', message: 'Failed to submit enquiry. Please try again.' });
        setEnquirySubmitting(false);
        return;
      }

      trackFormSubmit('career_enquiry');
      setEnquiryStatus({ type: 'success', message: 'Thank you! Your enquiry has been received. Our recruitment team will get in touch with you shortly.' });
      setEnquiryForm({ full_name: '', email: '', phone: '' });
      setEnquiryAgree(false);
    } catch (err) {
      console.error('Enquiry error:', err);
      setEnquiryStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setEnquirySubmitting(false);
    }
  }

  // Handle Full Application Form
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
    if (!file) errs.file = 'Resume is required';
    else {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExts = ['pdf', 'doc', 'docx'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!allowed.includes(file.type) && !allowedExts.includes(ext)) {
        errs.file = 'Only PDF, DOC, or DOCX document files are allowed';
      }
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
      const ext = file.name.split('.').pop();
      const path = `career/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await uploadWithRetry('career-uploads', path, file);
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
      .insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        department: form.position,
        category: form.category,
        description: form.description,
        file_url
      });

    if (insertError) {
      console.error('Career submission insert error:', insertError);
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

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="h-6 w-36 bg-slate-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-96 bg-white rounded-2xl border border-slate-200/80 p-8 animate-pulse" />
            <div className="lg:col-span-5 h-96 bg-white rounded-2xl border border-slate-200/80 p-8 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="bg-slate-50 min-h-screen py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center mx-auto mb-4 border border-orange-200/50">
            <FiBriefcase className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-navy mb-3">Job Opening Not Found</h1>
          <p className="text-slate-600 mb-8 text-sm sm:text-base">The position you are looking for is no longer active or does not exist.</p>
          <Link
            to="/career"
            className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Career Openings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      
      {/* HERO / TOP JOB HEADER BANNER (Grey Section Band) */}
      <section className="bg-slate-50 border-b border-slate-200/80 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="mb-6">
            <Link
              to="/career"
              className="group inline-flex items-center gap-2 text-slate-500 hover:text-brand-blue font-medium text-sm transition-all cursor-pointer"
            >
              <FiArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to All Openings</span>
            </Link>
          </Reveal>

          <Reveal>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-dark-navy tracking-tight leading-tight mt-1 mb-5">
              {job.title}
            </h1>

            {/* Quick Metadata Row with Apply Now Button on the Right */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-t border-slate-200/80 pt-5 mt-2">
              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm text-slate-600">
                {(job.division || job.department) && (
                  <div className="flex items-center gap-2">
                    <FiBriefcase className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="font-semibold text-dark-navy">Division: </span>
                    <span className="text-slate-600">{job.division || job.department}</span>
                  </div>
                )}
                {empType && (
                  <div className="flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="font-semibold text-dark-navy">Type: </span>
                    <span className="text-slate-600">{empType}</span>
                  </div>
                )}
                {locVal && (
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="font-semibold text-dark-navy">Location: </span>
                    <span className="text-slate-600">{locVal}</span>
                  </div>
                )}
                {expVal && (
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="font-semibold text-dark-navy">Experience: </span>
                    <span className="text-slate-600">{expVal}</span>
                  </div>
                )}
                {salaryVal && (
                  <div className="flex items-center gap-2">
                    <FiDollarSign className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="font-semibold text-dark-navy">{isIntern ? 'Stipend: ' : 'Salary: '}</span>
                    <span className="text-slate-600">{salaryVal.startsWith('₹') ? salaryVal : `₹${salaryVal}`}</span>
                  </div>
                )}
                {job.duration && (
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-brand-blue shrink-0" />
                    <span className="font-semibold text-dark-navy">Duration: </span>
                    <span className="text-slate-600">{job.duration}</span>
                  </div>
                )}
              </div>

              {/* Brand Apply Now Button on the Right */}
              <div className="shrink-0 pt-1 lg:pt-0">
                <button
                  type="button"
                  onClick={openApplyModal}
                  className="inline-flex items-center gap-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm sm:text-base py-3 px-8 rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Apply Now</span>
                  <FiArrowRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 1. MAIN DUTIES & RESPONSIBILITIES (White Section Band) */}
      {job.description && (
        <section className="bg-white py-12 sm:py-16 border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy tracking-tight leading-tight">
                Main Duties &amp; Responsibilities
              </h2>
              <div className="w-14 h-[3px] bg-brand-orange rounded-full mt-2.5 mb-5" />
              <div className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line pl-4 sm:pl-6 lg:pl-8">
                {job.description}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* 2. KEY REQUIREMENTS (Grey Section Band) */}
      {job.key_requirements && (
        <section className="bg-slate-50 py-12 sm:py-16 border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy tracking-tight leading-tight">
                Key Requirements
              </h2>
              <div className="w-14 h-[3px] bg-brand-orange rounded-full mt-2.5 mb-5" />
              <ul className="space-y-3 pl-4 sm:pl-6 lg:pl-8">
                {renderBulletList(job.key_requirements)}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {/* 3. RESPONSIBILITIES (White Section Band) */}
      {job.responsibilities && (
        <section className="bg-white py-12 sm:py-16 border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy tracking-tight leading-tight">
                Responsibilities
              </h2>
              <div className="w-14 h-[3px] bg-brand-orange rounded-full mt-2.5 mb-5" />
              <ul className="space-y-3 pl-4 sm:pl-6 lg:pl-8">
                {renderBulletList(job.responsibilities)}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {/* 4. QUALIFICATION & EXPERIENCE (Grey Section Band) */}
      {job.qualifications && (
        <section className="bg-slate-50 py-12 sm:py-16 border-b border-slate-200/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy tracking-tight leading-tight">
                Qualification &amp; Experience
              </h2>
              <div className="w-14 h-[3px] bg-brand-orange rounded-full mt-2.5 mb-5" />
              <ul className="space-y-3 pl-4 sm:pl-6 lg:pl-8">
                {renderBulletList(job.qualifications)}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {/* 5. POSITION SUMMARY / JOB OVERVIEW TABLE & BRAND APPLY CTA */}
      <section className="bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-12">
              
              {/* Left Column: Position Summary */}
              <div className="w-full md:w-1/2 shrink-0">
                <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy tracking-tight leading-tight">
                  Position Summary
                </h2>
                <div className="w-14 h-[3px] bg-brand-orange rounded-full mt-2.5 mb-6" />

                <div className="pl-4 sm:pl-6">
                  {(empType || expVal || locVal || salaryVal || job.division || job.department || job.duration) && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs w-full">
                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <tbody className="divide-y divide-slate-200">
                          {empType && (
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-dark-navy bg-slate-50/70 w-5/12 sm:w-1/3">
                                Type
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">
                                {empType}
                              </td>
                            </tr>
                          )}
                          {(job.division || job.department) && (
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-dark-navy bg-slate-50/70">
                                Division / Department
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">
                                {job.division || job.department}
                              </td>
                            </tr>
                          )}
                          {job.duration && (
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-dark-navy bg-slate-50/70">
                                Duration
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">
                                {job.duration}
                              </td>
                            </tr>
                          )}
                          {expVal && (
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-dark-navy bg-slate-50/70">
                                Experience Required
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">
                                {expVal}
                              </td>
                            </tr>
                          )}
                          {locVal && (
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-dark-navy bg-slate-50/70">
                                Location
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">
                                {locVal}
                              </td>
                            </tr>
                          )}
                          {salaryVal && (
                            <tr className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-5 font-semibold text-dark-navy bg-slate-50/70">
                                {isIntern ? 'Stipend' : 'Salary Range'}
                              </td>
                              <td className="py-3.5 px-5 font-medium text-slate-700">
                                {salaryVal.startsWith('₹') ? salaryVal : `₹${salaryVal}`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Take the Next Step in Your Career (Aligned straight with top of table) */}
              <div className="flex-1 w-full md:w-auto flex flex-col items-start text-left md:pl-6 lg:pl-10 md:pt-[58px]">
                <h3 className="font-bold text-2xl sm:text-3xl text-dark-navy tracking-tight leading-tight">
                  Take the Next Step in Your Career
                </h3>
                <div className="w-14 h-[3px] bg-brand-orange rounded-full mt-2.5 mb-6" />

                <div className="pl-4 sm:pl-6 space-y-4 w-full">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-sm">
                    Apply today and explore an opportunity to grow with our team.
                  </p>
                  <div className="pt-2 w-full flex justify-center">
                    <button
                      type="button"
                      onClick={openApplyModal}
                      className="inline-flex items-center gap-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm sm:text-base py-3.5 px-10 rounded-full shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Apply Now</span>
                      <FiArrowRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </Reveal>
        </div>
      </section>

      {/* Application Form Modal (Submits to career_submissions with Resume upload) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-gray-100"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-brand-blue px-5 py-4 sm:px-6 sm:py-4.5 text-white relative">
              <button onClick={() => setShowForm(false)} className="absolute top-3.5 right-3.5 bg-white shadow-md text-red-600 hover:text-red-700 hover:scale-105 p-1.5 rounded-full transition-all cursor-pointer border border-slate-200 z-10" aria-label="Close">
                <FiX className="w-4 h-4 text-red-600" />
              </button>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight pr-10">
                {job.title}
              </h3>
            </div>

            {status?.type === 'success' ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Application Submitted!</h3>
                <p className="text-sm text-slate-500 mb-6">{status.message}</p>
                <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-2 bg-brand-blue hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer">
                  Close
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                {status && (
                  <div className="mx-4 sm:mx-6 md:mx-8 mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-lg flex items-start gap-3 text-xs sm:text-sm bg-red-50 border border-red-200 text-red-700">
                    <FiAlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
                    <span className="flex-1">{status.message}</span>
                    <button type="button" onClick={() => setStatus(null)} className="p-1 hover:opacity-70 rounded transition-opacity cursor-pointer">
                      <FiX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 p-4 sm:p-6 md:p-8">
                  <Field label="Full Name" required error={errors.full_name}>
                    <input name="full_name" value={form.full_name} onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 ${errors.full_name ? 'border-red-300' : 'border-slate-200'}`} placeholder="John Doe" />
                  </Field>
                  <Field label="Email Address" required error={errors.email}>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 ${errors.email ? 'border-red-300' : 'border-slate-200'}`} placeholder="john@example.com" />
                  </Field>
                  <Field label="Phone Number" required error={errors.phone}>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 ${errors.phone ? 'border-red-300' : 'border-slate-200'}`} placeholder="+1 234 567 890" />
                  </Field>
                  <Field label="Position" required error={errors.position}>
                    <input name="position" value={form.position} readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 text-sm cursor-not-allowed" />
                  </Field>
                  <Field label="Category" required error={errors.category}>
                    <input name="category" value={form.category} readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 text-sm cursor-not-allowed" />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Description" required error={errors.description}>
                      <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 transition-all outline-none placeholder:text-slate-400 resize-y ${errors.description ? 'border-red-300' : 'border-slate-200'}`} placeholder="Tell us about yourself..." />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Upload Resume" required error={errors.file}>
                      <label className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${errors.file ? 'border-red-300 bg-red-50/50' : 'border-brand-blue/40 hover:border-brand-blue bg-blue-50/40 hover:bg-blue-50/80'}`}>
                        <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                          <FiUpload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                          {file ? (
                            <span className="text-sm font-semibold text-brand-blue">{file.name}</span>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</p>
                              <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX (max 10MB)</p>
                            </>
                          )}
                        </div>
                        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => {
                          const f = e.target.files?.[0];
                          setFile(f || null);
                          if (errors.file) setErrors(prev => ({ ...prev, file: '' }));
                        }} className="hidden" />
                      </label>
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreeTerms} onChange={(e) => {
                        setAgreeTerms(e.target.checked);
                        if (errors.agree) setErrors(prev => ({ ...prev, agree: '' }));
                      }} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue/20" />
                      <span className="text-sm text-slate-600 leading-relaxed">
                        I agree to the{' '}
                        <a href="/terms" className="underline hover:opacity-80 text-brand-blue">Terms of Use</a>
                        {' '}and{' '}
                        <a href="/privacy" className="underline hover:opacity-80 text-brand-blue">Privacy Policy</a>.
                      </span>
                    </label>
                    {errors.agree && <p className="text-xs text-red-500 mt-1">{errors.agree}</p>}
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <button type="submit" disabled={submitting || uploading}
                      className="w-fit mx-auto bg-brand-blue hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-2.5 px-6 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                      {uploading ? 'Uploading...' : submitting ? 'Submitting...' : <><FiSend className="w-4 h-4" /> Submit Application</>}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
