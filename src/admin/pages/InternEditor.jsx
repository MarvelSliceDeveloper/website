import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import PageShell from '../components/ui/PageShell';
import useDirty from '../hooks/useDirty';

export default function InternEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [categories, setCategories] = useState([]);

  const defaultForm = {
    title: '', role_category_id: null, location: '', type: 'Internship',
    duration: '', stipend: '', experience: '', apply_url: '', description: '',
    is_active: true, sort_order: 0,
  };
  const [form, setForm] = useState(defaultForm);

  const { dirty, reset } = useDirty([form], loading);

  useEffect(() => {
    async function loadData() {
      const { data: catRes } = await supabase.from('role_categories').select('*').order('display_order', { ascending: true });
      if (catRes) setCategories(catRes);

      if (!isNew) {
        const { data } = await supabase.from('internships').select('*').eq('id', id).single();
        if (data) {
          setForm({
            title: data.title || '', role_category_id: data.role_category_id || null, location: data.location || '',
            type: data.type || 'Internship', duration: data.duration || '', stipend: data.stipend || '',
            experience: data.experience || '', apply_url: data.apply_url || '', description: data.description || '',
            is_active: data.is_active, sort_order: data.sort_order || 0,
          });
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : (e.target.tagName === 'SELECT' && value === '' ? null : value);
    setForm(prev => ({ ...prev, [name]: newVal }));
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.role_category_id) return;
    if (!form.location?.trim()) return;
    if (!form.duration?.trim()) return;
    if (!form.stipend?.trim()) return;
    if (!form.experience?.trim()) return;
    if (!form.description?.trim()) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const payload = {
      title: form.title.trim(),
      role_category_id: form.role_category_id && form.role_category_id !== '' ? form.role_category_id : null,
      location: form.location?.trim() || null,
      type: form.type?.trim() || null,
      duration: form.duration?.trim() || null,
      stipend: form.stipend?.trim() || null,
      experience: form.experience?.trim() || null,
      description: form.description?.trim() || null,
      apply_url: form.apply_url?.trim() || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    let res;
    if (isNew) {
      res = await supabase.from('internships').insert(payload);
    } else {
      res = await supabase.from('internships').update(payload).eq('id', id);
    }
    if (res?.error) {
      setSaveError(res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    reset();
    setTimeout(() => {
      navigate('/admin/internships');
    }, 1000);
  }

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading internship...</div>;

  return (
    <PageShell
      backTo="/admin/internships"
      title={isNew ? 'Add New Internship' : 'Edit Internship'}
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-300 rounded-xl p-6 space-y-4" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>

        {/* Row 1: Title | Category | Type */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1fr] gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Internship Title <span className="text-destructive-500">*</span></label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Frontend Developer Intern"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Category <span className="text-destructive-500">*</span></label>
            <select name="role_category_id" value={form.role_category_id || ''} onChange={handleChange} required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white">
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Type <span className="text-destructive-500">*</span></label>
            <select name="type" value={form.type} onChange={handleChange} required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white">
              <option value="Internship">Internship</option>
              <option value="Summer Internship">Summer Internship</option>
              <option value="Winter Internship">Winter Internship</option>
              <option value="Part-time Internship">Part-time Internship</option>
            </select>
          </div>
        </div>

        {/* Row 2: Location | Duration | Stipend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Location <span className="text-destructive-500">*</span></label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote / New York" required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Duration <span className="text-destructive-500">*</span></label>
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 months" required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Stipend <span className="text-destructive-500">*</span></label>
            <input name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. ₹15,000/month" required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
          </div>
        </div>

        {/* Row 3: Experience | Description */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Experience <span className="text-destructive-500">*</span></label>
            <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. Freshers / 0-1 year" required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description <span className="text-destructive-500">*</span></label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} required
              placeholder="Brief description or requirements..."
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y" />
          </div>
        </div>

        {/* Row 4: Apply URL | Active | Sort Order */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_auto] gap-4 items-end pt-2 border-t border-admin-200">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Apply URL</label>
            <input name="apply_url" value={form.apply_url} onChange={handleChange} placeholder="https://apply.example.com/internship"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Active</label>
            <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors h-[38px]">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20" />
              <span className="text-sm font-medium text-black whitespace-nowrap">Visible on site</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Sort Order</label>
            <input type="number" name="sort_order" value={form.sort_order} onChange={handleChange}
              className="w-28 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
          </div>
        </div>

        </div>
      </form>
        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
    </PageShell>
  );
}
