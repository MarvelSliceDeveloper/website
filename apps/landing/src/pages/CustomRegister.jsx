import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiHash, FiHome, FiMapPin, FiAward, FiGrid, FiCheckCircle, FiLoader, FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';

const inputCls =
  'w-full h-11 pl-10 pr-3 border border-neutral-200 rounded-lg bg-white text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all';
const labelCls = 'block text-xs font-bold text-neutral-700 mb-1.5';

function Field({ icon: Icon, label, error, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        {children}
      </div>
      {error && <p className="text-[11px] text-red-600 mt-1 font-medium">{error}</p>}
    </div>
  );
}

export default function CustomRegister() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    reg_no: '',
    college_name: '',
    address: '',
    degree: '',
    department: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function set(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: '' }));
    setSubmitError('');
  }

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required.';
    if (!form.last_name.trim()) e.last_name = 'Last name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^[+\d][\d\s-]{7,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number.';
    if (!form.college_name.trim()) e.college_name = 'College name is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        reg_no: form.reg_no.trim() || null,
        college_name: form.college_name.trim(),
        address: form.address.trim() || null,
        degree: form.degree.trim() || null,
        department: form.department.trim() || null,
      };
      const { error } = await supabase.from('custom_register').insert(payload);
      if (error) throw error;
      setDone(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Custom register submit error:', err);
      setSubmitError(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-14">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center shadow-sm">
          <FiCheckCircle className="w-14 h-14 mx-auto mb-4 text-emerald-500" />
          <h1 className="text-xl font-extrabold text-neutral-900 mb-2">Registration Successful!</h1>
          <p className="text-sm text-neutral-500 mb-6">
            Thank you, {form.first_name}. Your registration has been received. Our team will contact you soon.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white text-sm font-bold rounded-lg hover:bg-brand-blue/90 transition-all"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mb-2">Student Registration</h1>
        <p className="text-sm text-neutral-500">Fill in your details below to register with Marvel Slice.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={FiUser} label="First Name *" error={errors.first_name}>
            <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="First name" className={inputCls} />
          </Field>
          <Field icon={FiUser} label="Last Name *" error={errors.last_name}>
            <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Last name" className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={FiMail} label="Email *" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@email.com" className={inputCls} />
          </Field>
          <Field icon={FiPhone} label="Phone Number *" error={errors.phone}>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={FiHash} label="Register Number" error={errors.reg_no}>
            <input value={form.reg_no} onChange={(e) => set('reg_no', e.target.value)} placeholder="e.g. 2021CS001" className={inputCls} />
          </Field>
          <Field icon={FiHome} label="College Name *" error={errors.college_name}>
            <input value={form.college_name} onChange={(e) => set('college_name', e.target.value)} placeholder="Your college" className={inputCls} />
          </Field>
        </div>

        <Field icon={FiMapPin} label="Address" error={errors.address}>
          <textarea value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, city, state, pincode" rows={2} className={`${inputCls} h-auto py-2.5 resize-none`} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field icon={FiAward} label="College Degree" error={errors.degree}>
            <input value={form.degree} onChange={(e) => set('degree', e.target.value)} placeholder="e.g. B.E / B.Tech / BCA" className={inputCls} />
          </Field>
          <Field icon={FiGrid} label="Department" error={errors.department}>
            <input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Computer Science" className={inputCls} />
          </Field>
        </div>

        {submitError && (
          <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 inline-flex items-center justify-center gap-2 bg-brand-blue text-white text-sm font-bold rounded-lg hover:bg-brand-blue/90 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99]"
        >
          {submitting ? (
            <>
              <FiLoader className="w-4 h-4 animate-spin" /> Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </button>
      </form>
    </div>
  );
}
