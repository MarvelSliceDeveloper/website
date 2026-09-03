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
    title: '', division: '', role_category_id: null, location: '', type: 'Internship',
    duration: '', stipend: '', experience: '', apply_url: '', description: '',
    key_requirements: '', responsibilities: '', qualifications: '',
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
            title: data.title || '',
            division: data.division || data.department || '',
            role_category_id: data.role_category_id || null,
            location: data.location || '',
            type: data.type || 'Internship',
            duration: data.duration || '',
            stipend: data.stipend || '',
            experience: data.experience || '',
            apply_url: data.apply_url || '',
            description: data.description || '',
            key_requirements: data.key_requirements || '',
            responsibilities: data.responsibilities || '',
            qualifications: data.qualifications || '',
            is_active: data.is_active !== undefined ? data.is_active : true,
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
    const newVal = type === 'checkbox' ? checked : (e.target.tagName === 'SELECT' && value === '' ? null : value);
    setForm(prev => ({ ...prev, [name]: newVal }));
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.role_category_id) return;
    if (!form.location?.trim()) return;
    if (!form.duration?.trim()) return;
    if (!form.description?.trim()) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const payload = {
      title: form.title.trim(),
      division: form.division?.trim() || null,
      role_category_id: form.role_category_id && form.role_category_id !== '' ? form.role_category_id : null,
      location: form.location?.trim() || null,
      type: form.type?.trim() || null,
      duration: form.duration?.trim() || null,
      stipend: form.stipend?.trim() || null,
      experience: form.experience?.trim() || null,
      description: form.description?.trim() || null,
      key_requirements: form.key_requirements?.trim() || null,
      responsibilities: form.responsibilities?.trim() || null,
      qualifications: form.qualifications?.trim() || null,
      apply_url: form.apply_url?.trim() || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    let currentPayload = { ...payload };
    let res;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (isNew) {
        res = await supabase.from('internships').insert(currentPayload);
      } else {
        res = await supabase.from('internships').update(currentPayload).eq('id', id);
      }
      if (res?.error) {
        const match = res.error.message?.match(/Could not find the '([^']+)' column/i);
        if (match && match[1] && currentPayload[match[1]] !== undefined) {
          delete currentPayload[match[1]];
          continue;
        }
        break;
      } else {
        break;
      }
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
        <div className="bg-white border border-gray-300 rounded-xl p-6 space-y-5" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>

          {/* Row 1: Title | Division | Category | Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Internship Title <span className="text-destructive-500">*</span></label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Frontend Developer Intern"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Division / Department</label>
              <input name="division" value={form.division} onChange={handleChange} placeholder="e.g. Marketing / Engineering"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
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

          {/* Row 2: Duration | Minimum Experience | Stipend | Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Duration <span className="text-destructive-500">*</span></label>
              <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 months / 6 months" required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Minimum Experience</label>
              <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. Freshers / 0-1 year"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Stipend</label>
              <input name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. ₹15,000/month"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Location <span className="text-destructive-500">*</span></label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote / New York" required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
          </div>

          {/* Row 3: Main Duties & Responsibilities (Summary/Overview) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Main Duties &amp; Responsibilities (Overview / Summary) <span className="text-destructive-500">*</span>
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Overview description introducing the internship role and primary mission.</p>
            <textarea name="description" value={form.description} onChange={handleChange} rows={4} required
              placeholder="We are looking for a motivated Intern to join our engineering and development team..."
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y" />
          </div>

          {/* Row 4: Key Requirements */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Key Requirements
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Enter each point on a new line or with bullet points (•).</p>
            <textarea name="key_requirements" value={form.key_requirements} onChange={handleChange} rows={5}
              placeholder="• Familiarity with HTML, CSS, JavaScript&#10;• Good problem solving skills&#10;• Eager to learn and collaborate"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y font-mono text-xs leading-relaxed" />
          </div>

          {/* Row 5: Responsibilities */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Responsibilities
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Enter each responsibility on a new line or with bullet points (•).</p>
            <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange} rows={5}
              placeholder="• Assist the development team in building features&#10;• Write clean, maintainable code&#10;• Participate in code reviews and team meetings"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y font-mono text-xs leading-relaxed" />
          </div>

          {/* Row 6: Qualification & Experience */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Qualification &amp; Experience
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Enter each qualification/experience requirement on a new line or with bullet points (•).</p>
            <textarea name="qualifications" value={form.qualifications} onChange={handleChange} rows={5}
              placeholder="• Pursuing/Completed Bachelor's in CS, IT, or related fields&#10;• Strong communication skills&#10;• Available for full duration"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y font-mono text-xs leading-relaxed" />
          </div>

          {/* Row 7: Apply URL | Active | Sort Order */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_auto] gap-4 items-end pt-3 border-t border-admin-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">External Apply URL (Optional)</label>
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
