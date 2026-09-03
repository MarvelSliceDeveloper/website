import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import PageShell from '../components/ui/PageShell';
import { FiArrowLeft } from 'react-icons/fi';
import useDirty from '../hooks/useDirty';

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [categories, setCategories] = useState([]);

  const defaultJobForm = {
    title: '', division: '', role_category_id: '', location: '', type: 'Full-time',
    experience: '', salary: '', apply_url: '', description: '',
    key_requirements: '', responsibilities: '', qualifications: '',
    is_active: true, sort_order: 0,
  };
  const [jobForm, setJobForm] = useState(defaultJobForm);

  const { dirty, reset } = useDirty([jobForm], loading);

  useEffect(() => {
    async function loadData() {
      const { data: catRes } = await supabase.from('role_categories').select('*').order('display_order', { ascending: true });
      if (catRes) setCategories(catRes);

      if (!isNew) {
        const { data } = await supabase.from('job_openings').select('*').eq('id', id).single();
        if (data) {
          setJobForm({
            title: data.title || '',
            division: data.division || data.department || '',
            role_category_id: data.role_category_id || '',
            location: data.location || '',
            type: data.type || 'Full-time',
            experience: data.experience || '',
            salary: data.salary || '',
            apply_url: data.apply_url || '',
            description: data.description || '',
            key_requirements: data.key_requirements || '',
            responsibilities: data.responsibilities || '',
            qualifications: data.qualifications || '',
            is_active: data.is_active !== undefined ? data.is_active : true,
            sort_order: data.sort_order || 0
          });
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setJobForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!jobForm.title.trim()) return;
    if (!jobForm.role_category_id) return;
    if (!jobForm.type) return;
    if (!jobForm.location?.trim()) return;
    if (!jobForm.description?.trim()) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');

    const payload = {
      title: jobForm.title.trim(),
      division: jobForm.division?.trim() || null,
      department: jobForm.division?.trim() || null,
      role_category_id: jobForm.role_category_id || null,
      location: jobForm.location?.trim() || null,
      type: jobForm.type?.trim() || null,
      experience: jobForm.experience?.trim() || null,
      salary: jobForm.salary?.trim() || null,
      description: jobForm.description?.trim() || null,
      key_requirements: jobForm.key_requirements?.trim() || null,
      responsibilities: jobForm.responsibilities?.trim() || null,
      qualifications: jobForm.qualifications?.trim() || null,
      apply_url: jobForm.apply_url?.trim() || null,
      is_active: jobForm.is_active,
      sort_order: jobForm.sort_order,
    };

    let currentPayload = { ...payload };
    let res;
    for (let attempt = 0; attempt < 6; attempt++) {
      if (isNew) {
        res = await supabase.from('job_openings').insert(currentPayload);
      } else {
        res = await supabase.from('job_openings').update(currentPayload).eq('id', id);
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
      navigate('/admin/jobs');
    }, 1000);
  }

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading job...</div>;

  return (
    <PageShell
      backTo="/admin/jobs"
      title={isNew ? 'Add New Job' : 'Edit Job Opening'}
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <form onSubmit={handleSave}>
        <div className="bg-white border border-gray-300 rounded-xl p-6 space-y-5" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>

          {/* Row 1: Position / Title | Division | Category | Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Position / Title <span className="text-destructive-500">*</span></label>
              <input name="title" value={jobForm.title} onChange={handleChange} placeholder="e.g. Full Stack Developer"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Division / Department</label>
              <input name="division" value={jobForm.division} onChange={handleChange} placeholder="e.g. Marketing / Engineering"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Category <span className="text-destructive-500">*</span></label>
              <select name="role_category_id" value={jobForm.role_category_id} onChange={handleChange} required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white">
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Type <span className="text-destructive-500">*</span></label>
              <select name="type" value={jobForm.type} onChange={handleChange} required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>

          {/* Row 2: Minimum Experience | Location | Salary Range */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Minimum Experience</label>
              <input name="experience" value={jobForm.experience} onChange={handleChange} placeholder="e.g. 4 years / 2-4 years"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Location <span className="text-destructive-500">*</span></label>
              <input name="location" value={jobForm.location} onChange={handleChange} placeholder="e.g. New York, NY / Remote" required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Salary Range</label>
              <input name="salary" value={jobForm.salary} onChange={handleChange} placeholder="e.g. ₹6L–₹10L"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
          </div>

          {/* Row 3: Main Duties & Responsibilities (Summary/Overview) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Main Duties &amp; Responsibilities (Overview / Summary) <span className="text-destructive-500">*</span>
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Overview description introducing the role and primary mission.</p>
            <textarea name="description" value={jobForm.description} onChange={handleChange} rows={4} required
              placeholder="We are seeking to hire a Full stack developer to initiate and develop company website and web app projects..."
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y" />
          </div>

          {/* Row 4: Key Requirements */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Key Requirements
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Enter each point on a new line or with bullet points (•).</p>
            <textarea name="key_requirements" value={jobForm.key_requirements} onChange={handleChange} rows={5}
              placeholder="• Good experience of website UI/UX designing&#10;• Management of hosting environment, preferably AWS&#10;• Integrating data from back-end services and databases"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y font-mono text-xs leading-relaxed" />
          </div>

          {/* Row 5: Responsibilities */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Responsibilities
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Enter each responsibility on a new line or with bullet points (•).</p>
            <textarea name="responsibilities" value={jobForm.responsibilities} onChange={handleChange} rows={5}
              placeholder="• Design of the overall architecture of the web application&#10;• Implementation of a robust set of services and APIs&#10;• Optimization of the application for maximum speed and scalability"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y font-mono text-xs leading-relaxed" />
          </div>

          {/* Row 6: Qualification & Experience */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
              Qualification &amp; Experience
            </label>
            <p className="text-[11px] text-neutral-500 mb-1.5">Enter each qualification/experience requirement on a new line or with bullet points (•).</p>
            <textarea name="qualifications" value={jobForm.qualifications} onChange={handleChange} rows={5}
              placeholder="• Graduates/Post Graduates in BCA/MCA with minimum 4 years of work experience&#10;• Ability to work on multiple projects in a fast-paced environment&#10;• Pleasant, personable demeanour"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y font-mono text-xs leading-relaxed" />
          </div>

          {/* Row 7: Apply URL | Active | Sort Order */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_auto] gap-4 items-end pt-3 border-t border-admin-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">External Apply URL (Optional)</label>
              <input name="apply_url" value={jobForm.apply_url} onChange={handleChange} placeholder="https://apply.example.com/position"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Active</label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors h-[38px]">
                <input type="checkbox" name="is_active" checked={jobForm.is_active} onChange={handleChange}
                  className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20" />
                <span className="text-sm font-medium text-black whitespace-nowrap">Visible on site</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Sort Order</label>
              <input type="number" name="sort_order" value={jobForm.sort_order} onChange={handleChange}
                className="w-28 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
            </div>
          </div>

        </div>
      </form>
      <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
    </PageShell>
  );
}
