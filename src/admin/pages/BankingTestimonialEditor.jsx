import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import PageShell from '../components/ui/PageShell';
import useDirty from '../hooks/useDirty';
import { FiUpload, FiStar, FiAward } from 'react-icons/fi';

export default function BankingTestimonialEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);

  const defaultForm = {
    name: '',
    role: '',
    exam_name: 'IBPS PO',
    quote: '',
    rating: 5,
    avatar_url: '',
    badge_text: '',
    is_active: true,
    sort_order: 0,
  };
  const [form, setForm] = useState(defaultForm);

  const { dirty, reset } = useDirty([form], loading);

  useEffect(() => {
    async function loadData() {
      if (!isNew) {
        const { data, error } = await supabase.from('banking_testimonials').select('*').eq('id', id).single();
        if (data) {
          setForm({
            name: data.name || '',
            role: data.role || '',
            exam_name: data.exam_name || 'IBPS PO',
            quote: data.quote || '',
            rating: data.rating ?? 5,
            avatar_url: data.avatar_url || '',
            badge_text: data.badge_text || '',
            is_active: data.is_active ?? true,
            sort_order: data.sort_order || 0,
          });
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: newVal }));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `testimonials/banking_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (error) {
      setSaveError('Photo upload failed: ' + error.message);
    } else {
      const { data } = supabase.storage.from('pages').getPublicUrl(path);
      setForm(prev => ({ ...prev, avatar_url: data.publicUrl }));
    }
    setUploading(false);
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    const errs = [];
    if (!form.name.trim()) errs.push('Candidate Name is required.');
    if (!form.quote.trim()) errs.push('Quote / Testimonial review is required.');
    if (errs.length > 0) {
      setSaveError(errs.join(' '));
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const payload = {
      name: form.name.trim(),
      role: form.role?.trim() || null,
      exam_name: form.exam_name?.trim() || null,
      quote: form.quote.trim(),
      rating: Math.min(5, Math.max(1, parseInt(form.rating, 10) || 5)),
      avatar_url: form.avatar_url?.trim() || null,
      badge_text: form.badge_text?.trim() || null,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
      updated_at: new Date().toISOString(),
    };

    let res;
    if (isNew) {
      res = await supabase.from('banking_testimonials').insert(payload);
    } else {
      res = await supabase.from('banking_testimonials').update(payload).eq('id', id);
    }

    if (res?.error) {
      setSaveError(res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    reset();
    setTimeout(() => navigate('/admin/banking-testimonials'), 800);
  }

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading banking testimonial...</div>;

  return (
    <PageShell backTo="/admin/banking-testimonials" title={isNew ? 'Add Banking Testimonial' : 'Edit Banking Testimonial'}>
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Banking Testimonial" top />
      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-300 rounded-xl p-6 space-y-5 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Candidate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Ananya Sharma"
                className="w-full px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Role / Bank Designation
              </label>
              <input
                type="text"
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Probationary Officer - Bank of Baroda"
                className="w-full px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Exam Name / Category
              </label>
              <select
                name="exam_name"
                value={form.exam_name}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all bg-white"
              >
                <option value="IBPS PO">IBPS PO</option>
                <option value="IBPS Clerk">IBPS Clerk / CSA</option>
                <option value="IBPS RRB Officer">IBPS RRB Officer Scale I</option>
                <option value="IBPS RRB Assistant">IBPS RRB Office Assistant</option>
                <option value="IBPS SO">IBPS Specialist Officer (SO)</option>
                <option value="SBI PO">SBI PO</option>
                <option value="General Banking">General Banking Career</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Achievement Badge (e.g. AIR 14 / 1st Attempt)
              </label>
              <input
                type="text"
                name="badge_text"
                value={form.badge_text}
                onChange={handleChange}
                placeholder="e.g. Cleared 1st Attempt, AIR 28, 2024 Batch"
                className="w-full px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Rating (1 - 5 Stars)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="rating"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={handleChange}
                  className="w-24 px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
                />
                <span className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar key={i} className={`w-4 h-4 ${i < (parseInt(form.rating, 10) || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Quote / Testimonial Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              name="quote"
              value={form.quote}
              onChange={handleChange}
              rows={4}
              required
              placeholder="What did the candidate say about their preparation and success?"
              className="w-full px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Candidate Photo / Avatar
            </label>
            <div className="flex items-center gap-3">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Candidate" className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-xs" />
              ) : null}
              <input
                type="text"
                name="avatar_url"
                value={form.avatar_url}
                onChange={handleChange}
                placeholder="Paste photo image URL or upload file..."
                className="flex-1 px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/50 transition-all bg-white shrink-0 font-medium">
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <FiUpload className="w-4 h-4" />
                    <span>Upload</span>
                  </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-admin-200">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">Status</label>
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-admin-200 text-brand-blue focus:ring-brand-blue/20"
                />
                <span className="text-sm font-semibold text-slate-800">Visible on Banking Page</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">Sort Order</label>
              <input
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
              />
            </div>
          </div>
        </div>
      </form>
      <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => navigate('/admin/banking-testimonials')} />
    </PageShell>
  );
}
