import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import AddButton from '../components/AddButton';
import useDirty from '../hooks/useDirty';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import EmptyState from '../components/EmptyState';
import {
  FiSave, FiAlertCircle, FiTrash2, FiEdit2,
  FiUpload, FiCheck, FiX, FiBriefcase, FiArrowLeft,
  FiAlignLeft, FiAlignCenter, FiAlignRight, FiChevronLeft, FiChevronRight,
  FiHome, FiGrid, FiTarget, FiUsers,
} from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import SectionAccordion from '../components/ui/SectionAccordion';
import FolderTabs from '../components/ui/FolderTabs';
import useConfirm from '../hooks/useConfirm';

function AlignButtons({ value, onChange }) {
  const options = [
    { value: 'left', icon: FiAlignLeft },
    { value: 'center', icon: FiAlignCenter },
    { value: 'right', icon: FiAlignRight },
  ];
  return (
    <div className="flex items-center gap-1 p-1 bg-admin-100 rounded-lg w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${value === opt.value ? 'bg-white text-neutral-700 shadow-sm' : 'text-admin-400 hover:text-admin-600'}`}
        >
          <opt.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

function ImageUploader({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `career/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('pages').getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" placeholder="Paste URL or upload..." />
        <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-admin-200 rounded-lg text-sm text-admin-500 hover:border-admin-500 hover:text-admin-600 transition-colors">
          {uploading ? <span className="w-4 h-4 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /> : <FiUpload className="w-4 h-4" />}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {value && <img src={value} alt="" className="mt-2 h-28 w-full object-cover rounded-lg border border-admin-200" />}
    </div>
  );
}

const FORM_FIELD_DEFAULTS = {
  full_name: { key: 'full_name', label: 'Full Name', enabled: true, required: true, placeholder: 'John Doe', type: 'text' },
  email: { key: 'email', label: 'Email Address', enabled: true, required: true, placeholder: 'john@example.com', type: 'email' },
  phone: { key: 'phone', label: 'Phone Number', enabled: true, required: true, placeholder: '+1 234 567 890', type: 'tel' },
  department: { key: 'department', label: 'Department', enabled: true, required: false, placeholder: 'Select department', type: 'select', options: ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Design', 'Content', 'Other'] },
  category: { key: 'category', label: 'Category', enabled: true, required: false, placeholder: 'Select category', type: 'select', options: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Freelance'] },
  description: { key: 'description', label: 'Description', enabled: true, required: false, placeholder: 'Tell us about yourself...', type: 'textarea' },
  file_upload: { key: 'file_upload', label: 'Upload Resume / Documents', enabled: true, required: false, type: 'file' },
};

function buildDefaultFormConfig() {
  return {
    enabled: true,
    heading: 'Apply Now',
    description: "Fill out the form below and we'll get back to you.",
    cta: { text: 'Submit Application', variant: 'accent' },
    fields: Object.fromEntries(
      Object.entries(FORM_FIELD_DEFAULTS).map(([k, v]) => [k, { label: v.label, enabled: v.enabled, required: v.required, placeholder: v.placeholder, options: v.options || null }])
    ),
  };
}

const defaultJobForm = {
  title: '',
  role_category_id: '',
  location: '',
  type: '',
  experience: '',
  salary: '',
  description: '',
  apply_url: '',
  is_active: true,
  sort_order: 0,
};

export default function CareerPageEditor() {

  const [activeTab, setActiveTab] = useState('hero-section');
  const [confirm, confirmDialog] = useConfirm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pageId, setPageId] = useState(null);

  const [hero, setHero] = useState({ heading: '', subheading: '', hero_image: '' });
  const [section1, setSection1] = useState({
    badgeText: 'WE\'RE HIRING!',
    headline: 'We\'re Hiring!',
    subtitle: 'Find Your Role. Find Your Fit.',
    description: 'Join a team that\'s passionate about innovation, collaboration, and making a real impact. Your dream role is waiting.',
    categoriesHeading: '',
    categoriesSubtitle: 'Find the role that fits you best',
  });
  const [section2, setSection2] = useState({ heading: 'Job Openings', subheading: '', heading_align: 'center', subheading_align: 'center', eyebrow: '' });
  const [cta, setCta] = useState({
    heading: 'Ready to start your dream career?',
    subheading: '',
    description: 'Talk to our team today and find the perfect role for you.',
    cta_text: 'Request a Call Back',
    cta_link: '',
    background_image: '',
  });
  const [formConfig, setFormConfig] = useState(buildDefaultFormConfig());

  const [openings, setOpenings] = useState([]);
  const [roleCategories, setRoleCategories] = useState([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', display_order: 0, is_active: true });
  const [categorySaving, setCategorySaving] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [jobSaving, setJobSaving] = useState(false);
  const [catPage, setCatPage] = useState(1);
  const [catPageSize, setCatPageSize] = useState(10);

  const catTotalPages = Math.ceil(roleCategories.length / catPageSize) || 1;
  useEffect(() => { if (catPage > catTotalPages) setCatPage(catTotalPages); }, [roleCategories.length, catPageSize]);

  const { dirty, reset } = useDirty([hero, section1, section2, cta, formConfig, openings], loading);

  useEffect(() => {
    async function load() {
      const { data: content } = await supabase
        .from('career_page_content')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (content) {
        setPageId(content.id);
        setHero({ heading: content.hero_heading || '', subheading: content.hero_subheading || '', hero_image: content.hero_image || '' });
        const fc = content.form_config || {};
        setSection1({
          badgeText: fc.badgeText || 'WE\'RE HIRING!',
          headline: fc.headline || content.section1_heading || 'We\'re Hiring!',
          subtitle: fc.subtitle || content.section1_subheading || 'Find Your Role. Find Your Fit.',
          description: fc.description || content.section1_description || '',
          categoriesHeading: fc.categoriesHeading || '',
          categoriesSubtitle: fc.categoriesSubtitle || 'Find the role that fits you best',
        });
        setSection2({ heading: content.section2_heading || 'Job Openings', subheading: content.section2_subheading || '', heading_align: fc.section2_heading_align || 'center', subheading_align: fc.section2_subheading_align || 'center', eyebrow: fc.section2_eyebrow || '' });
        const cb = fc.cta_banner || {};
        setCta({
          heading: cb.heading || '',
          subheading: cb.subheading || '',
          description: cb.description || '',
          cta_text: cb.cta_text || '',
          cta_link: cb.cta_link || '',
          background_image: cb.background_image || '',
        });
        const rawForm = fc.form || {};
        if (rawForm.enabled !== undefined || Object.keys(rawForm).length > 0) {
          setFormConfig({ ...buildDefaultFormConfig(), ...rawForm });
        } else if (content.form_config && typeof content.form_config === 'object' && content.form_config.enabled !== undefined) {
          setFormConfig({ ...buildDefaultFormConfig(), ...content.form_config });
        }
      } else {
        const { data: navItems } = await supabase
          .from('nav_items')
          .select('id')
          .eq('path', '/career')
          .eq('is_active', true)
          .order('id')
          .limit(1);
        const navItem = navItems?.[0] || null;
        if (navItem?.id) {
          const { data: pages } = await supabase
            .from('nav_pages')
            .select('*')
            .eq('nav_item_id', navItem.id)
            .eq('is_published', true)
            .order('id')
            .limit(1);
          const page = pages?.[0] || null;
          if (page) {
            setHero({ heading: page.heading || '', subheading: page.subheading || '', hero_image: page.hero_image || '' });
          }
        }
      }

      const { data: jobs } = await supabase
        .from('job_openings')
        .select('*, role_categories(name)')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      setOpenings(jobs || []);

      const { data: cats } = await supabase
        .from('role_categories')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      setRoleCategories(cats || []);

      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError('');

    const payload = {
      hero_heading: hero.heading,
      hero_subheading: hero.subheading,
      hero_image: hero.hero_image || null,
      section1_heading: section1.headline,
      section1_subheading: section1.subtitle,
      section1_description: section1.description,
      section2_heading: section2.heading || 'Job Openings',
      section2_subheading: section2.subheading,
      form_config: {
        badgeText: section1.badgeText,
        headline: section1.headline,
        subtitle: section1.subtitle,
        description: section1.description,
        categoriesHeading: section1.categoriesHeading,
        categoriesSubtitle: section1.categoriesSubtitle,
        section2_eyebrow: section2.eyebrow,
        section2_heading_align: section2.heading_align || 'center',
        section2_subheading_align: section2.subheading_align || 'center',
        cta_banner: {
          heading: cta.heading,
          subheading: cta.subheading,
          description: cta.description,
          cta_text: cta.cta_text,
          cta_link: cta.cta_link,
          background_image: cta.background_image || null,
        },
        form: formConfig,
      },
      is_published: true,
    };

    let res;
    if (pageId) {
      res = await supabase.from('career_page_content').update(payload).eq('id', pageId);
    } else {
      res = await supabase.from('career_page_content').insert(payload).select('id').single();
    }

    if (res.error) {
      setSaveError(res.error.message);
    } else {
      if (res.data?.id) setPageId(res.data.id);
      setSaved(true);
      reset();
      queryClient.invalidateQueries({ queryKey: ['career-page-content'] });
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function openJobForm() {
    setJobForm(defaultJobForm);
    setEditingJob(null);
    setShowJobForm(true);
  }

  function openEditJob(job) {
    setJobForm({ ...job });
    setEditingJob(job.id);
    setShowJobForm(true);
  }

  function closeJobForm() {
    setShowJobForm(false);
    setEditingJob(null);
    setJobForm(defaultJobForm);
  }

  function handleJobChange(e) {
    const { name, value, type, checked } = e.target;
    setJobForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleJobSave(e) {
    e.preventDefault();
    if (!jobForm.title.trim()) return;
    setJobSaving(true);

    const payload = {
      title: jobForm.title.trim(),
      role_category_id: jobForm.role_category_id || null,
      location: jobForm.location.trim() || null,
      type: jobForm.type.trim() || null,
      experience: jobForm.experience.trim() || null,
      salary: jobForm.salary.trim() || null,
      description: jobForm.description.trim() || null,
      apply_url: jobForm.apply_url.trim() || null,
      is_active: jobForm.is_active,
      sort_order: jobForm.sort_order,
    };

    if (editingJob) {
      await supabase.from('job_openings').update(payload).eq('id', editingJob);
    } else {
      const { data } = await supabase.from('job_openings').insert(payload).select('*').single();
      if (data) payload.id = data.id;
    }

    queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    setJobSaving(false);
    closeJobForm();

    const { data: jobs } = await supabase
      .from('job_openings')
      .select('*, role_categories(name)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setOpenings(jobs || []);
  }

  async function deleteJob(id) {
    if (!(await confirm('Delete this job opening?'))) return;
    await supabase.from('job_openings').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    setOpenings(prev => prev.filter(j => j.id !== id));
  }

  async function toggleActive(job) {
    await supabase.from('job_openings').update({ is_active: !job.is_active }).eq('id', job.id);
    queryClient.invalidateQueries({ queryKey: ['job-openings'] });
    setOpenings(prev => prev.map(j => j.id === job.id ? { ...j, is_active: !j.is_active } : j));
  }

  function openCategoryForm() {
    setCategoryForm({ name: '', display_order: roleCategories.length, is_active: true });
    setEditingCategory(null);
    setShowCategoryForm(true);
  }

  function openEditCategory(cat) {
    setCategoryForm({ name: cat.name, display_order: cat.display_order, is_active: cat.is_active });
    setEditingCategory(cat.id);
    setShowCategoryForm(true);
  }

  function closeCategoryForm() {
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', slug: '', display_order: 0, is_active: true });
  }

  function handleCategoryChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === 'checkbox' ? checked : value;
    setCategoryForm(prev => ({ ...prev, [name]: newVal }));
  }

  async function handleCategorySave(e) {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    setCategorySaving(true);

    const payload = {
      name: categoryForm.name.trim(),
      display_order: categoryForm.display_order,
      is_active: categoryForm.is_active,
    };

    if (editingCategory) {
      const { error } = await supabase.from('role_categories').update(payload).eq('id', editingCategory);
      if (error) return alert('Update error: ' + error.message);
    } else {
      const { error } = await supabase.from('role_categories').insert(payload);
      if (error) return alert('Insert error: ' + error.message);
    }

    queryClient.invalidateQueries({ queryKey: ['role-categories'] });
    setCategorySaving(false);
    closeCategoryForm();

    const { data: cats } = await supabase
      .from('role_categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    setRoleCategories(cats || []);
  }

  async function deleteCategory(id) {
    if (!(await confirm('Delete this role category?'))) return;
    await supabase.from('role_categories').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['role-categories'] });
    setRoleCategories(prev => prev.filter(c => c.id !== id));
  }

  async function toggleCategoryActive(cat) {
    await supabase.from('role_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    queryClient.invalidateQueries({ queryKey: ['role-categories'] });
    setRoleCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  }

  const inputClass = 'w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all';

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { id: 'hero-section', title: 'Hero', icon: FiHome },
    { id: 'hiring-header', title: 'Hiring', icon: FiBriefcase },
    { id: 'categories-section', title: 'Categories', icon: FiGrid },
    { id: 'cta-section', title: 'CTA', icon: FiTarget },
    { id: 'role-categories', title: 'View Role', icon: FiUsers },
  ];

  return (
    <PageShell backTo="/admin" title="">
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <div className="flex flex-col">
        <div className="flex items-end justify-between">
          <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          <div className="pb-2 pr-1 relative z-40">
            <AddButton onClick={openCategoryForm} label="Add Role" />
          </div>
        </div>

        <form onSubmit={handleSave} className="bg-white border border-gray-300 rounded-b-[20px] rounded-tr-[20px] shadow-sm p-6 space-y-6 relative z-30 -mt-[2px]">

          {activeTab === 'hero-section' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                  <input type="text" value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })}
                    placeholder="Heading" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
                  <input type="text" value={hero.subheading} onChange={(e) => setHero({ ...hero, subheading: e.target.value })}
                    placeholder="Subheading" className={inputClass} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Hero Image</label>
                  <button type="button" onClick={() => {
                    if (hero.hero_image) {
                      setHero({ ...hero, hero_image: '' });
                    }
                  }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${hero.hero_image ? 'bg-admin-600' : 'bg-admin-300'}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${hero.hero_image ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {hero.hero_image ? (
                  <div className="relative">
                    <img src={hero.hero_image} alt="" className="w-full h-32 object-cover rounded-lg" />
                    <button type="button" onClick={() => setHero({ ...hero, hero_image: '' })}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-colors cursor-pointer">
                      <FiX className="w-4 h-4 text-admin-600" />
                    </button>
                  </div>
                ) : (
                  <ImageUploader value={hero.hero_image} onChange={(v) => setHero({ ...hero, hero_image: v })} label="Upload Hero Image" />
                )}
              </div>
            </div>
          </div>
        )}

          {activeTab === 'hiring-header' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Headline</label>
                <input type="text" value={section1.headline} onChange={(e) => setSection1({ ...section1, headline: e.target.value })}
                  placeholder="Hiring" className={`${inputClass} w-full`} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subtitle</label>
                <input type="text" value={section1.subtitle} onChange={(e) => setSection1({ ...section1, subtitle: e.target.value })}
                  placeholder="Find Your Role. Find Your Fit." className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea value={section1.description} onChange={(e) => setSection1({ ...section1, description: e.target.value })}
                  rows={2} placeholder="Brief description about working at your company..." className={inputClass} />
              </div>
            </div>
          </div>
        )}

          {activeTab === 'categories-section' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                <input type="text" value={section1.categoriesHeading} onChange={(e) => setSection1({ ...section1, categoriesHeading: e.target.value })}
                  placeholder="Heading" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subtitle</label>
                <input type="text" value={section1.categoriesSubtitle} onChange={(e) => setSection1({ ...section1, categoriesSubtitle: e.target.value })}
                  placeholder="Find the role that fits you best" className={inputClass} />
              </div>
            </div>
          </div>
        )}

          {activeTab === 'cta-section' && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                <input type="text" value={cta.heading} onChange={(e) => setCta({ ...cta, heading: e.target.value })}
                  placeholder="Ready to start your dream career?" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
                <input type="text" value={cta.subheading} onChange={(e) => setCta({ ...cta, subheading: e.target.value })}
                  placeholder="Optional subheading" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
              <textarea value={cta.description} onChange={(e) => setCta({ ...cta, description: e.target.value })}
                rows={2} placeholder="Talk to our team today and find the perfect role for you." className={inputClass} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">CTA Button Text</label>
                <input type="text" value={cta.cta_text} onChange={(e) => setCta({ ...cta, cta_text: e.target.value })}
                  placeholder="Request a Call Back" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                <input type="text" value={cta.cta_link} onChange={(e) => setCta({ ...cta, cta_link: e.target.value })}
                  placeholder="+1 (555) 019-2834" className={inputClass} />
              </div>
            </div>
            <div>
              <ImageUploader value={cta.background_image} onChange={(v) => setCta({ ...cta, background_image: v })} label="Background Image" />
            </div>
          </div>
        )}

          {activeTab === 'role-categories' && (
          <div className="space-y-6">

            {roleCategories.length === 0 ? (
              <EmptyState
                icon={FiBriefcase}
                title="No role categories yet"
                description="Categories appear as interactive cards in the Explore Opportunities grid."
                action={{ onClick: openCategoryForm, label: 'Add Role Category' }}
              />
            ) : (
              <>
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-admin-200 bg-blue-600">
                        <th className="text-left px-3 py-2.5 font-semibold text-white">Name</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-white">Order</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-white">Active</th>
                        <th className="text-right px-3 py-2.5 font-semibold text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const start = (catPage - 1) * catPageSize;
                        const paginated = roleCategories.slice(start, start + catPageSize);
                        const totalPages = Math.ceil(roleCategories.length / catPageSize);
                        return paginated.map((cat, i) => (
                          <tr key={cat.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${(start + i) % 2 === 1 ? 'bg-gray-50' : 'bg-white'}`}>
                            <td className="px-3 py-2.5 font-medium text-black">{cat.name}</td>
                            <td className="px-3 py-2.5 text-center text-neutral-500">{cat.display_order}</td>
                            <td className="px-3 py-2.5 text-center">
                              <button type="button" onClick={() => toggleCategoryActive(cat)}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                  cat.is_active
                                    ? 'bg-success-50 text-success-500 hover:bg-success-50'
                                    : 'bg-admin-100 text-admin-400 hover:bg-admin-200'
                                }`}>
                                {cat.is_active ? <FiCheck className="w-3 h-3" /> : <FiX className="w-3 h-3" />}
                                {cat.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" onClick={() => openEditCategory(cat)}
                                  className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer">
                                  <FiEdit2 className="w-4 h-4" />
                                </button>
                                <button type="button" onClick={() => deleteCategory(cat.id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>{roleCategories.length} total</span>
                    <span className="text-neutral-300">|</span>
                    <span className="text-xs text-neutral-400">Show</span>
                    <select value={catPageSize} onChange={(e) => { setCatPageSize(Number(e.target.value)); setCatPage(1); }}
                      className="h-7 px-1.5 border border-admin-200 bg-white text-xs text-neutral-500 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setCatPage(p => Math.max(1, p - 1))} disabled={catPage <= 1}
                      className="p-1 text-neutral-400 hover:bg-admin-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer">
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-xs text-neutral-500">{catPage} / {Math.ceil(roleCategories.length / catPageSize) || 1}</span>
                    <button type="button" onClick={() => setCatPage(p => Math.min(Math.ceil(roleCategories.length / catPageSize), p + 1))} disabled={catPage >= Math.ceil(roleCategories.length / catPageSize)}
                      className="p-1 text-neutral-400 hover:bg-admin-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer">
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </form>

        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />

      </div>

      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeCategoryForm} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  name="name"
                  value={categoryForm.name}
                  onChange={handleCategoryChange}
                  placeholder="Category name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Display Order</label>
                <input
                  type="number"
                  name="display_order"
                  value={categoryForm.display_order}
                  onChange={handleCategoryChange}
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={categoryForm.is_active}
                  onChange={handleCategoryChange}
                  className="w-4 h-4 rounded border-gray-300 text-admin-600 focus:ring-admin-500"
                />
                <span className="text-sm font-medium text-neutral-700">Active</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={closeCategoryForm}
                className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleCategorySave}
                className="px-4 py-2 text-sm font-medium text-white bg-admin-600 rounded-lg hover:bg-admin-700 transition-colors cursor-pointer">
                {editingCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
    </PageShell>
  );
}
