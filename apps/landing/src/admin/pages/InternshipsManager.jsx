import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/EmptyState';
import { FiEdit2, FiEdit3, FiTrash2, FiClock, FiX } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import AdminButton from '../components/AdminButton';
import ExportDialog from '../components/ExportDialog';
import { CancelButton } from '../components/FormButtons';
import useConfirm from '../hooks/useConfirm';

export default function InternshipsManager() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();
  const [exportModal, setExportModal] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);

  const defaultForm = {
    title: '', division: '', role_category_id: null, location: '', type: 'Internship',
    duration: '', stipend: '', experience: '', apply_url: '', description: '',
    key_requirements: '', responsibilities: '', qualifications: '',
    is_active: true, sort_order: 0,
  };
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [res, catRes] = await Promise.all([
        supabase.from('internships').select('*, role_categories(name)').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
        supabase.from('role_categories').select('*').order('display_order', { ascending: true })
      ]);
      if (res.data) setInternships(res.data);
      if (catRes.data) setCategories(catRes.data);
    } catch {
      setInternships([]);
    }
    setLoading(false);
  }

  function openForm(item = null) {
    if (item) {
      setEditing(item);
      setForm({
        title: item.title || '',
        division: item.division || item.department || '',
        role_category_id: item.role_category_id || null,
        location: item.location || '',
        type: item.type || 'Internship',
        duration: item.duration || '',
        stipend: item.stipend || '',
        experience: item.experience || '',
        apply_url: item.apply_url || '',
        description: item.description || '',
        key_requirements: item.key_requirements || '',
        responsibilities: item.responsibilities || '',
        qualifications: item.qualifications || '',
        is_active: item.is_active ?? true,
        sort_order: item.sort_order || 0,
      });
    } else {
      setEditing(null);
      setForm(defaultForm);
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setForm(defaultForm);
    setEditing(null);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : (e.target.tagName === 'SELECT' && value === '' ? null : value);
    setForm(prev => ({ ...prev, [name]: newVal }));
  }

  async function save(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.role_category_id) return;
    if (!form.location?.trim()) return;
    if (!form.duration?.trim()) return;
    if (!form.description?.trim()) return;
    setSaving(true);
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
      if (editing) {
        res = await supabase.from('internships').update(currentPayload).eq('id', editing.id);
      } else {
        res = await supabase.from('internships').insert(currentPayload);
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
      console.error('Failed to save internship:', res.error);
      alert('Failed to save internship: ' + res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    closeForm();
    loadData();
  }

  async function deleteItem(id) {
    if (!(await confirm('Delete Internship? This cannot be undone.'))) return;
    const { error } = await supabase.from('internships').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete internship:', error);
      alert('Failed to delete internship: ' + error.message);
      return;
    }
    loadData();
  }

  const columns = [
    { header: 'SL NO', accessor: 'slno', cell: (_, i) => <span className="text-neutral-500 font-medium">{i + 1}</span>, width: '80px' },
    { header: 'Title', accessor: 'title', cell: (row) => <span className="font-semibold text-black">{row.title}</span> },
    { header: 'Category', accessor: 'role_categories', cell: (row) => row.role_categories?.name || <span className="text-neutral-400 italic">Uncategorized</span> },
    { header: 'Location', accessor: 'location', cell: (row) => row.location || '-' },
    { header: 'Duration', accessor: 'duration', cell: (row) => row.duration || '-' },
    { header: 'Stipend', accessor: 'stipend', cell: (row) => row.stipend || '-' },
    { header: 'Status', accessor: 'is_active', cell: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => navigate(`/admin/internships/${row.id}`)} className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button onClick={() => deleteItem(row.id)} className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const exportColumns = [
    { header: 'SL NO', accessor: 'slno', exportValue: (_, i) => i + 1 },
    { header: 'Title', accessor: 'title' },
    { header: 'Division / Department', accessor: 'division', exportValue: (row) => row.division || row.department || '-' },
    { header: 'Category', accessor: 'role_categories', exportValue: (row) => row.role_categories?.name || 'Uncategorized' },
    { header: 'Location', accessor: 'location' },
    { header: 'Type', accessor: 'type' },
    { header: 'Duration', accessor: 'duration' },
    { header: 'Stipend', accessor: 'stipend' },
    { header: 'Experience', accessor: 'experience' },
    { header: 'Apply URL', accessor: 'apply_url' },
    { header: 'Description / Overview', accessor: 'description' },
    { header: 'Key Requirements', accessor: 'key_requirements' },
    { header: 'Responsibilities', accessor: 'responsibilities' },
    { header: 'Qualification & Experience', accessor: 'qualifications' },
    { header: 'Status', accessor: 'is_active', exportValue: (row) => row.is_active ? 'Active' : 'Inactive' },
  ];

  return (
    <PageShell backTo="/admin"
      title="Internships"
      description="Manage internship opportunities"
      actions={
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <AdminButton onClick={() => setExportModal('csv')} variant="primary" size="sm">
            Export CSV
          </AdminButton>
          <AdminButton onClick={() => setExportModal('pdf')} variant="primary" size="sm">
            Export PDF
          </AdminButton>
        </div>
      }
    >
      <div className="bg-white shadow-sm border border-admin-200 overflow-hidden">
        {internships.length > 0 ? (
          <DataTable data={internships} columns={columns} isLoading={loading} />
        ) : (
          <EmptyState icon={FiClock} title="No internships added" description="Get started by creating your first internship opportunity."
            action={{ onClick: () => openForm(), label: 'Add Internship' }}
          />
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 pt-8 sm:pt-12 cursor-pointer" onClick={closeForm}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col cursor-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-admin-200 bg-gray-50/50 shrink-0">
              <h3 className="font-semibold text-black">{editing ? 'Edit Internship' : 'Add Internship'}</h3>
              <button type="button" onClick={closeForm} className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto admin-scrollbar">
              <form id="internshipForm" onSubmit={save} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Position / Title *</label>
                    <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Frontend Developer Intern" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Division / Department</label>
                    <input name="division" value={form.division} onChange={handleChange} placeholder="e.g. Marketing" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Category *</label>
                    <select name="role_category_id" value={form.role_category_id || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white">
                      <option value="">-- Select Category --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Type</label>
                    <select name="type" value={form.type} onChange={handleChange} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white">
                      <option value="Internship">Internship</option>
                      <option value="Summer Internship">Summer Internship</option>
                      <option value="Winter Internship">Winter Internship</option>
                      <option value="Part-time Internship">Part-time Internship</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Duration *</label>
                    <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 months" required className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Minimum Experience</label>
                    <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. Freshers / 0-1 year" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Stipend</label>
                    <input name="stipend" value={form.stipend} onChange={handleChange} placeholder="e.g. ₹15,000/month" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Location *</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote / New York" required className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Main Duties &amp; Responsibilities (Overview / Summary) *</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3} required
                    placeholder="We are looking for a motivated Intern to join our team..." className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Key Requirements</label>
                  <textarea name="key_requirements" value={form.key_requirements} onChange={handleChange} rows={4}
                    placeholder="• Familiarity with HTML, CSS, JavaScript&#10;• Good problem solving skills&#10;• Eager to learn" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y font-mono text-xs leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Responsibilities</label>
                  <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange} rows={4}
                    placeholder="• Assist the development team in building features&#10;• Write clean code&#10;• Participate in code reviews" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y font-mono text-xs leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Qualification &amp; Experience</label>
                  <textarea name="qualifications" value={form.qualifications} onChange={handleChange} rows={4}
                    placeholder="• Pursuing/Completed Bachelor's in CS or IT&#10;• Good communication skills" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y font-mono text-xs leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">External Apply URL (Optional)</label>
                  <input name="apply_url" value={form.apply_url} onChange={handleChange} placeholder="e.g. https://apply.example.com/internship" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange}
                      className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20" />
                    <span className="text-sm font-medium text-black">Active</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-admin-200 bg-gray-50/50 shrink-0">
              <CancelButton onClick={closeForm} />
              <button type="button" onClick={save} disabled={saving}
                className="w-28 min-w-[100px] inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium rounded-[20px] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-70">
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiEdit2 className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : editing ? 'Save' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
      {exportModal && (
        <ExportDialog
          type={exportModal}
          data={internships}
          columns={exportColumns}
          exportFilename="internships"
          onClose={() => setExportModal(null)}
        />
      )}
    </PageShell>
  );
}
