import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import AdminButton from "../components/AdminButton";
import ImageUploader from "../components/ImageUploader";
import { useQueryClient } from '@tanstack/react-query';
import {
  FiPlus, FiTrash2, FiArrowLeft, FiCheck, FiBookOpen,
  FiMonitor, FiLayers, FiAward, FiCode, FiStar, FiClock,
  FiBarChart2, FiVideo, FiCalendar, FiRefreshCw,
  FiMessageCircle, FiBriefcase, FiGlobe, FiCpu, FiDatabase,
  FiZap, FiShield, FiTrendingUp, FiChevronUp, FiAlertCircle, FiUsers
, FiChevronDown} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';

const STEPS = [
  { label: "Basics", icon: FiBookOpen },
  { label: "Details", icon: FiLayers },
  { label: "Modules", icon: FiMonitor },
  { label: "Media & SEO", icon: FiGlobe },
];

const ICON_OPTIONS = [
  { key: "code", label: "Code", Icon: FiCode },
  { key: "star", label: "Star", Icon: FiStar },
  { key: "award", label: "Award", Icon: FiAward },
  { key: "users", label: "Users", Icon: FiUsers },
  { key: "clock", label: "Clock", Icon: FiClock },
  { key: "target", label: "Target", Icon: FiBarChart2 },
  { key: "book", label: "Book", Icon: FiBookOpen },
  { key: "video", label: "Video", Icon: FiVideo },
  { key: "calendar", label: "Calendar", Icon: FiCalendar },
  { key: "refresh", label: "Refresh", Icon: FiRefreshCw },
  { key: "message", label: "Message", Icon: FiMessageCircle },
  { key: "briefcase", label: "Briefcase", Icon: FiBriefcase },
  { key: "globe", label: "Globe", Icon: FiGlobe },
  { key: "cpu", label: "CPU", Icon: FiCpu },
  { key: "database", label: "Database", Icon: FiDatabase },
  { key: "layers", label: "Layers", Icon: FiLayers },
  { key: "zap", label: "Zap", Icon: FiZap },
  { key: "shield", label: "Shield", Icon: FiShield },
  { key: "trending", label: "Trending", Icon: FiTrendingUp },
];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  const selected = ICON_OPTIONS.find((o) => o.key === value);
  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-semibold text-black mb-1">Icon</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white text-left"
      >
        {selected ? (
          <>
            <selected.Icon className="w-4 h-4 text-admin-600 shrink-0" />
            <span>{selected.label}</span>
          </>
        ) : (
          <span className="text-neutral-400">Select icon</span>
        )}
        <FiChevronDown className={`w-4 h-4 ml-auto text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-admin-200 rounded-lg shadow-lg max-h-60 overflow-y-auto admin-scrollbar">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                value === opt.key ? "bg-white text-admin-600" : "hover:bg-white text-admin-700"
              }`}
            >
              <opt.Icon className="w-4 h-4 shrink-0" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ListEditor({ items, onChange, fields, labelKey = "label" }) {
  const addItem = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, f.default || ""]))]);
  const updateItem = (i, key, value) => onChange(items.map((item, j) => (j === i ? { ...item, [key]: value } : item)));
  const removeItem = (i) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="space-y-6">
      {items.map((item, i) => (
        <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative bg-white">
          <div className="flex items-center gap-2 absolute top-3 right-3">
            <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-600">
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-black mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  value={item[f.key] || ""}
                  onChange={(e) => updateItem(i, f.key, e.target.value)}
                  rows={f.rows || 3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                />
              ) : f.type === "number" ? (
                <input
                  type="number"
                  value={item[f.key] ?? ""}
                  onChange={(e) => updateItem(i, f.key, e.target.valueAsNumber ?? null)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                />
              ) : (
                <input
                  value={item[f.key] || ""}
                  onChange={(e) => updateItem(i, f.key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <AdminButton onClick={addItem} variant="ghost" size="sm" className="text-admin-600 border-admin-200 hover:bg-admin-50 hover:border-admin-300">
        <FiPlus className="w-4 h-4" /> Add {labelKey}
      </AdminButton>
    </div>
  );
}

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function TrainingWizard() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);

  const [t, setT] = useState({
    title: "",
    slug: "",
    category_id: "",
    icon: "",
    short_description: "",
    description: "",
    duration: "",
    mode: "Online",
    difficulty: "Beginner",
    price: null,
    discount: null,
    badge: "none",
    status: "draft",
    sort_order: 0,
    featured: false,
    popular: false,
    trending: false,
    certificate: false,
    thumbnail: "",
    banner: "",
    meta_image: "",
    eligibility: "",
    learning_outcomes: [],
    modules: [],
    skills: [],
    benefits: [],
    placement_support: "",
    assessment: "",
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    canonical_url: "",
    trainingModules: [],
    trainingSkills: [],
    trainingBenefits: [],
    faqs: [],
    testimonials: [],
    gallery: [],
    statistics: [],
  });

  useEffect(() => {
    supabase.from("training_categories").select("*").order("sort_order").then(({ data }) => setCategories(data || []));
  }, []);

  const handleSaveRef = useRef();
  handleSaveRef.current = handleSave;
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (step === STEPS.length - 1 && !saving) {
          handleSaveRef.current();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [step, saving]);

  if (currentUser?.role !== "admin" && currentUser?.role !== "editor" && currentUser?.role !== "master_admin") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-admin-200 p-6 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Access Denied</h1>
          <p className="text-neutral-500">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  function u(field, val) {
    setT((prev) => ({ ...prev, [field]: val }));
  }

  function canNext() {
    if (step === 0) return t.title.trim() !== "" && t.slug.trim() !== "";
    return true;
  }

  function handleTitleChange(value) {
    u("title", value);
    if (!t.slug || t.slug === slugify(t.title)) {
      u("slug", slugify(value));
    }
  }

  async function insertRelated(table, records, trainingProgramId) {
    if (records.length > 0) {
      const clean = records.map((r, i) => {
        const { id: _, ...rest } = r;
        return { ...rest, training_program_id: trainingProgramId, sort_order: i };
      });
      const { error } = await supabase.from(table).insert(clean);
      if (error) throw new Error(error.message);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        title: t.title,
        slug: t.slug,
        category_id: t.category_id || null,
        icon: t.icon,
        short_description: t.short_description,
        description: t.description,
        duration: t.duration,
        mode: t.mode,
        difficulty: t.difficulty,
        price: t.price,
        discount: t.discount,
        badge: t.badge,
        status: t.status,
        sort_order: t.sort_order,
        featured: t.featured,
        popular: t.popular,
        trending: t.trending,
        certificate: t.certificate,
        thumbnail: t.thumbnail,
        banner: t.banner,
        meta_image: t.meta_image,
        eligibility: t.eligibility,
        learning_outcomes: t.learning_outcomes || [],
        modules: t.modules || [],
        skills: t.skills || [],
        benefits: t.benefits || [],
        placement_support: t.placement_support,
        assessment: t.assessment,
        seo_title: t.seo_title,
        seo_description: t.seo_description,
        seo_keywords: t.seo_keywords,
        canonical_url: t.canonical_url,
      };

      const { data: newTraining, error } = await supabase.from("training_programs").insert(payload).select().single();
      if (error) throw error;

      await insertRelated("training_modules", t.trainingModules, newTraining.id);
      await insertRelated("training_skills", t.trainingSkills, newTraining.id);
      await insertRelated("training_benefits", t.trainingBenefits, newTraining.id);
      await insertRelated("training_faqs", t.faqs, newTraining.id);
      await insertRelated("training_testimonials", t.testimonials, newTraining.id);
      await insertRelated("training_gallery", t.gallery, newTraining.id);
      await insertRelated("training_statistics", t.statistics, newTraining.id);

      queryClient.invalidateQueries({ queryKey: ['trainingPrograms'] });
      navigate("/admin/training");
    } catch (err) {
      setMessage(err.message);
    }
    setSaving(false);
  }

  function handleStepClick(targetStep) {
    if (targetStep > step && !canNext()) return;
    setStep(targetStep);
  }

  return (
    <PageShell title="Create New Training Program" maxWidth="max-w-[1600px]">
      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
          message.includes("successfully") ? "bg-success-50 border border-success-500 text-success-700" : "bg-destructive-50 border border-destructive-500 text-destructive-700"
        }`}>
          {message.includes("successfully") ? <FiCheck className="w-4 h-4 shrink-0" /> : <FiAlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className="flex gap-6 items-start">        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-[2]">
                  <label className="block text-sm font-semibold text-black mb-1">Title *</label>
                  <input
                    value={t.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                    placeholder="e.g. Advanced React Training"
                  />
                </div>
                <div className="flex-[2]">
                  <label className="block text-sm font-semibold text-black mb-1">Slug *</label>
                  <input
                    value={t.slug}
                    onChange={(e) => u("slug", slugify(e.target.value))}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 font-mono text-sm transition-all bg-white"
                    placeholder="advanced-react-training"
                  />
                </div>
                <div className="w-full lg:w-48 shrink-0">
                  <label className="block text-sm font-semibold text-black mb-1">Category</label>
                  <select
                    value={t.category_id}
                    onChange={(e) => u("category_id", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                  >
                    <option value="">— Select Category —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full lg:w-32 shrink-0">
                  <IconPicker value={t.icon} onChange={(val) => u("icon", val)} />
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Duration</label>
                  <input
                    value={t.duration}
                    onChange={(e) => u("duration", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                    placeholder="e.g. 3 months"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Mode</label>
                  <select
                    value={t.mode}
                    onChange={(e) => u("mode", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Difficulty</label>
                  <select
                    value={t.difficulty}
                    onChange={(e) => u("difficulty", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>
              
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Price</label>
                  <input
                    type="number"
                    value={t.price ?? ""}
                    onChange={(e) => u("price", e.target.value ? e.target.valueAsNumber : null)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Discount</label>
                  <input
                    type="number"
                    value={t.discount ?? ""}
                    onChange={(e) => u("discount", e.target.value ? e.target.valueAsNumber : null)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Status</label>
                  <select
                    value={t.status}
                    onChange={(e) => u("status", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={t.certificate} onChange={(e) => u("certificate", e.target.checked)} className="rounded" /> Certificate
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={t.featured} onChange={(e) => u("featured", e.target.checked)} className="rounded" /> Featured
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={t.popular} onChange={(e) => u("popular", e.target.checked)} className="rounded" /> Popular
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={t.trending} onChange={(e) => u("trending", e.target.checked)} className="rounded" /> Trending
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Short Description</label>
                <textarea
                  value={t.short_description || ""}
                  onChange={(e) => u("short_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Full Description</label>
                <textarea
                  value={t.description || ""}
                  onChange={(e) => u("description", e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Eligibility</label>
                <textarea
                  value={t.eligibility || ""}
                  onChange={(e) => u("eligibility", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Learning Outcomes</h4>
                <ListEditor
                  items={t.learning_outcomes || []}
                  onChange={(val) => u("learning_outcomes", val)}
                  fields={[{ key: "item", label: "Outcome" }]}
                  labelKey="Outcome"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-black">Modules</h3>
                    <AdminButton onClick={() => u("trainingModules", [...t.trainingModules, { title: "", duration: "", content: "" }])} variant="ghost" size="sm" className="text-admin-600 border-admin-200 hover:bg-admin-50 hover:border-admin-300"><FiPlus className="w-4 h-4" /> Add Module</AdminButton>
                  </div>
                  <div className="space-y-3">
                    {t.trainingModules.map((mod, i) => (
                      <div key={i} className="border border-admin-200 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Module {i + 1}</span>
                          <button onClick={() => u("trainingModules", t.trainingModules.filter((_, j) => j !== i))} className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-destructive-50 transition-colors">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <input
                            value={mod.title || ""}
                            onChange={(e) => { const n = [...t.trainingModules]; n[i] = { ...n[i], title: e.target.value }; u("trainingModules", n); }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                            placeholder="Module title (e.g. Introduction)"
                          />
                          <input
                            value={mod.duration || ""}
                            onChange={(e) => { const n = [...t.trainingModules]; n[i] = { ...n[i], duration: e.target.value }; u("trainingModules", n); }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                            placeholder="Duration (e.g. 2 weeks)"
                          />
                        </div>
                        <textarea
                          value={mod.content || ""}
                          onChange={(e) => { const n = [...t.trainingModules]; n[i] = { ...n[i], content: e.target.value }; u("trainingModules", n); }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                          placeholder="Content details..."
                          rows={2}
                        />
                      </div>
                    ))}
                    {t.trainingModules.length === 0 && (
                      <div className="text-center py-8 text-neutral-400 bg-white rounded-lg border-2 border-dashed border-admin-200">
                        <FiLayers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No modules yet. Click "Add Module" to build your curriculum.</p>
                      </div>
                    )}
                  </div>
                </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Thumbnail Image</label>
                  <ImageUploader value={t.thumbnail} onChange={(url) => u("thumbnail", url)} bucket="training-images" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Banner Image</label>
                  <ImageUploader value={t.banner} onChange={(url) => u("banner", url)} bucket="training-images" />
                </div>
              </div>
              <hr className="border-admin-200" />
              <div>
                <label className="block text-sm font-semibold text-black mb-1">SEO Title</label>
                <input
                  value={t.seo_title || ""}
                  onChange={(e) => u("seo_title", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">SEO Description</label>
                <textarea
                  value={t.seo_description || ""}
                  onChange={(e) => u("seo_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">SEO Keywords</label>
                <input
                  value={t.seo_keywords || ""}
                  onChange={(e) => u("seo_keywords", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-admin-200">
            <div></div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
              >
                Cancel
              </button>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-admin-200 hover:bg-admin-50 rounded-lg transition-colors"
                >
                  Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => handleStepClick(step + 1)}
                  disabled={!canNext()}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-admin-600 hover:bg-admin-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Next Step
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !canNext()}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-admin-600 hover:bg-admin-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? "Saving..." : "Save Training Program"}
                </button>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
