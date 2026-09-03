import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import AddButton from '../components/AddButton';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/EmptyState';
import { FiEdit2, FiTrash2, FiBriefcase, FiX, FiArrowLeft } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import { SubmitButton, CancelButton } from '../components/FormButtons';
import useConfirm from '../hooks/useConfirm';

export default function CareerJobsManager() {
const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();
  
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobSaving, setJobSaving] = useState(false);
  
  const [categories, setCategories] = useState([]);

  const defaultJobForm = {
    title: '', division: '', role_category_id: '', location: '', type: 'Full-time',
    experience: '', salary: '', apply_url: '', description: '',
    key_requirements: '', responsibilities: '', qualifications: '',
    is_active: true, sort_order: 0,
  };
  const [jobForm, setJobForm] = useState(defaultJobForm);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [jobsRes, catRes] = await Promise.all([
      supabase.from('job_openings').select('*, role_categories(name)').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('role_categories').select('*').order('display_order', { ascending: true })
    ]);
    if (jobsRes.data) setJobs(jobsRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  }

  function openJobForm(job = null) {
    if (job) {
      setEditingJob(job);
      setJobForm({
        ...job,
        division: job.division || job.department || '',
        key_requirements: job.key_requirements || '',
        responsibilities: job.responsibilities || '',
        qualifications: job.qualifications || '',
      });
    } else {
      setEditingJob(null);
      setJobForm(defaultJobForm);
    }
    setShowJobForm(true);
  }

  function closeJobForm() {
    setShowJobForm(false);
    setJobForm(defaultJobForm);
    setEditingJob(null);
  }

  function handleJobChange(e) {
    const { name, value, type, checked } = e.target;
    setJobForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function saveJob(e) {
    e.preventDefault();
    if (!jobForm.title.trim()) return;
    setJobSaving(true);
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
      if (editingJob) {
        res = await supabase.from('job_openings').update(currentPayload).eq('id', editingJob.id);
      } else {
        res = await supabase.from('job_openings').insert(currentPayload);
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
      console.error('Failed to save job opening:', res.error);
      alert('Failed to save job: ' + res.error.message);
      setJobSaving(false);
      return;
    }
    setJobSaving(false);
    closeJobForm();
    loadData();
  }

  async function deleteJob(id) {
    if (!(await confirm('Delete this job opening? This cannot be undone.'))) return;
    const { error } = await supabase.from('job_openings').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete job opening:', error);
      alert('Failed to delete job: ' + error.message);
      return;
    }
    loadData();
  }

  const columns = [
    { header: 'SL NO', accessor: 'slno', cell: (_, i) => <span className="text-neutral-500 font-medium">{i + 1}</span>, width: '80px' },
    { header: 'Job Title', accessor: 'title', cell: (row) => <span className="font-semibold text-black">{row.title}</span> },
    { header: 'Category', accessor: 'role_categories', cell: (row) => row.role_categories?.name || <span className="text-neutral-400 italic">Uncategorized</span> },
    { header: 'Location', accessor: 'location', cell: (row) => row.location || '-' },
    { header: 'Type', accessor: 'type', cell: (row) => row.type || '-' },
    { header: 'Status', accessor: 'is_active', cell: (row) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ) 
    },
  ];

  return (
    <PageShell backTo="/admin" 
      title="Job Openings" 
      description="Manage your company's career opportunities"
      actions={
        <div className="flex items-center gap-3 self-start sm:self-auto">
<AddButton onClick={() => openJobForm()} label="Add Job" size="md" />
        </div>
      }
    >
      <div className="bg-white shadow-sm border border-admin-200 overflow-hidden">
        {jobs.length > 0 ? (
          <DataTable data={jobs} columns={columns} />
        ) : (
          <EmptyState icon={FiBriefcase} title="No jobs added" description="Get started by creating your first job opening."
            action={{ onClick: () => openJobForm(), label: 'Add Job Opening' }}
          />
        )}
      </div>

      {showJobForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 pt-8 sm:pt-12 cursor-pointer" onClick={closeJobForm}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col cursor-auto overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-admin-200 bg-gray-50/50 shrink-0">
              <h3 className="font-semibold text-black">{editingJob ? 'Edit Job Opening' : 'Add Job Opening'}</h3>
              <button type="button" onClick={closeJobForm} className="p-1.5 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto admin-scrollbar">
              <form id="jobForm" onSubmit={saveJob} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Position / Title *</label>
                    <input name="title" value={jobForm.title} onChange={handleJobChange} placeholder="e.g. Full Stack Developer" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Division / Department</label>
                    <input name="division" value={jobForm.division} onChange={handleJobChange} placeholder="e.g. Marketing" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Category</label>
                    <select name="role_category_id" value={jobForm.role_category_id} onChange={handleJobChange} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white">
                      <option value="">-- No Category --</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Type</label>
                    <select name="type" value={jobForm.type} onChange={handleJobChange} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Minimum Experience</label>
                    <input name="experience" value={jobForm.experience} onChange={handleJobChange} placeholder="e.g. 4 years" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Location</label>
                    <input name="location" value={jobForm.location} onChange={handleJobChange} placeholder="e.g. New York, NY" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">Salary Range</label>
                    <input name="salary" value={jobForm.salary} onChange={handleJobChange} placeholder="e.g. ₹6L–₹10L" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Main Duties &amp; Responsibilities (Overview / Summary)</label>
                  <textarea name="description" value={jobForm.description} onChange={handleJobChange} rows={3}
                    placeholder="We are seeking to hire a Full stack developer to initiate and develop company website and web app projects..." className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Key Requirements</label>
                  <textarea name="key_requirements" value={jobForm.key_requirements} onChange={handleJobChange} rows={4}
                    placeholder="• Good experience of website UI/UX designing&#10;• Management of hosting environment, preferably AWS&#10;• Integrating data from back-end services and databases" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y font-mono text-xs leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Responsibilities</label>
                  <textarea name="responsibilities" value={jobForm.responsibilities} onChange={handleJobChange} rows={4}
                    placeholder="• Design of the overall architecture of the web application&#10;• Implementation of a robust set of services and APIs&#10;• Optimization of the application for maximum speed and scalability" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y font-mono text-xs leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1 uppercase tracking-wider">Qualification &amp; Experience</label>
                  <textarea name="qualifications" value={jobForm.qualifications} onChange={handleJobChange} rows={4}
                    placeholder="• Graduates/Post Graduates in BCA/MCA with minimum 4 years of work experience&#10;• Ability to work on multiple projects in a fast-paced environment&#10;• Pleasant, personable demeanour" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all resize-y font-mono text-xs leading-relaxed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black mb-1.5 uppercase tracking-wider">External Apply URL (Optional)</label>
                  <input name="apply_url" value={jobForm.apply_url} onChange={handleJobChange} placeholder="e.g. https://apply.example.com/position" className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="is_active" checked={jobForm.is_active} onChange={handleJobChange}
                      className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20" />
                    <span className="text-sm font-medium text-black">Active</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-admin-200 bg-gray-50/50 shrink-0">
              <CancelButton onClick={closeJobForm} />
              <SubmitButton type="submit" form="jobForm" saving={jobSaving} savingLabel="Saving..." label={editingJob ? 'Save' : 'Submit'} />
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </PageShell>
  );
}
