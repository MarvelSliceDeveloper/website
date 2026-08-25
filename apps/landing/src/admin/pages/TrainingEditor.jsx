import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabaseClient";
import ImageUploader from "../components/ImageUploader";
import AddButton from "../components/AddButton";
import { FiTrash2, FiMove, FiLayers, FiCheck, FiClock, FiVideo, FiCode, FiAward, FiCalendar, FiRefreshCw, FiMessageCircle, FiUsers, FiStar, FiBarChart2, FiBookOpen, FiBriefcase, FiGlobe, FiCpu, FiDatabase, FiZap, FiShield, FiTrendingUp, FiChevronDown, FiSettings, FiFileText, FiImage, FiHeart, FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';
import SaveBar from '../components/SaveBar';
import FolderTabs from '../components/ui/FolderTabs';
import useDirty from '../hooks/useDirty';

function ListEditor({ items, onChange, fields, labelKey = "label" }) {
  const addItem = () =>
    onChange([
      ...items,
      Object.fromEntries(fields.map((f) => [f.key, f.default || ""])),
    ]);
  const updateItem = (i, key, value) => {
    const next = items.map((item, j) =>
      j === i ? { ...item, [key]: value } : item,
    );
    onChange(next);
  };
  const removeItem = (i) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="space-y-6">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-admin-200 rounded-lg p-4 space-y-3 relative"
        >
          <div className="flex items-center gap-2 absolute top-3 right-3">
            <FiMove className="w-4 h-4 text-admin-300 cursor-move" />
            <button
              onClick={() => removeItem(i)}
              className="text-red-500 hover:text-red-600"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-semibold text-black mb-1">
                {f.label}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={item[f.key] || ""}
                  onChange={(e) => updateItem(i, f.key, e.target.value)}
                  rows={f.rows || 3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              ) : f.type === "number" ? (
                <input
                  type="number"
                  value={item[f.key] ?? ""}
                  onChange={(e) =>
                    updateItem(i, f.key, e.target.valueAsNumber ?? null)
                  }
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              ) : (
                <input
                  value={item[f.key] || ""}
                  onChange={(e) => updateItem(i, f.key, e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              )}
            </div>
          ))}
        </div>
      ))}
      <AddButton onClick={addItem} label={`Add ${labelKey}`} />
    </div>
  );
}

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
        className="w-full flex items-center gap-2 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white text-left"
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
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-admin-200 rounded-lg max-h-60 overflow-y-auto admin-scrollbar">
          {ICON_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                value === opt.key
                  ? "bg-white text-admin-600"
                  : "hover:bg-white text-admin-700"
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

const STEPS = [
  { label: "Basics", icon: FiSettings },
  { label: "Media & Content", icon: FiFileText },
  { label: "Curriculum & Skills", icon: FiBookOpen },
  { label: "More", icon: FiGlobe },
];

export default function TrainingEditor() {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = id === 'new';
  const [step, setStep] = useState(0);
  const folderTabs = STEPS.map((s, i) => ({ id: i, title: s.label }));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [training, setTraining] = useState({
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

  const [loading, setLoading] = useState(true);
  const { dirty, reset } = useDirty([training], loading);
  const savingRef = useRef(false);
  const slugEditedRef = useRef(false);

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function update(field, value) {
    setTraining((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !slugEditedRef.current) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  useEffect(() => {
    async function loadData() {
      const { data: catData } = await supabase.from("training_categories").select("*").order("sort_order");
      setCategories(catData || []);

      if (!isNew) {
        const related = [
          ["trainingModules", "training_modules"],
          ["trainingSkills", "training_skills"],
          ["trainingBenefits", "training_benefits"],
          ["faqs", "training_faqs"],
          ["testimonials", "training_testimonials"],
          ["gallery", "training_gallery"],
          ["statistics", "training_statistics"],
        ];
        const relatedQueries = related.map(([key, table]) =>
          supabase.from(table).select("*").eq("training_program_id", id).order("sort_order")
        );
        const [progRes, ...relatedRes] = await Promise.all([
          supabase.from("training_programs").select("*").eq("id", id).single(),
          ...relatedQueries,
        ]);
        if (progRes.data && !progRes.error) {
          setTraining((p) => ({ ...p, ...progRes.data }));
          slugEditedRef.current = true;
        }
        relatedRes.forEach((res, i) => {
          if (res.data) setTraining((prev) => ({ ...prev, [related[i][0]]: res.data }));
        });
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  const handleSaveRef = useRef();
  handleSaveRef.current = handleSave;

  useEffect(() => {
    function handler(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (currentUser?.role !== "admin" && currentUser?.role !== "editor" && currentUser?.role !== "master_admin") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border border-admin-200 p-6 text-center">
          <h1 className="text-2xl font-bold text-black mb-4">
            Access Denied
          </h1>
          <p className="text-neutral-500">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  async function saveRelated(table, records) {
    const { error: delErr } = await supabase.from(table).delete().eq("training_program_id", id);
    if (delErr) throw new Error(delErr.message);
    if (records.length > 0) {
      const clean = records.map((r, i) => {
        const { id: _, ...rest } = r;
        return { ...rest, training_program_id: id, sort_order: i };
      });
      const { error: insErr } = await supabase.from(table).insert(clean);
      if (insErr) throw new Error(insErr.message);
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
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        title: training.title,
        slug: training.slug,
        category_id: training.category_id || null,
        icon: training.icon,
        short_description: training.short_description,
        description: training.description,
        duration: training.duration,
        mode: training.mode,
        difficulty: training.difficulty,
        price: training.price,
        discount: training.discount,
        badge: training.badge,
        status: training.status,
        sort_order: training.sort_order,
        featured: training.featured,
        popular: training.popular,
        trending: training.trending,
        certificate: training.certificate,
        thumbnail: training.thumbnail,
        banner: training.banner,
        meta_image: training.meta_image,
        eligibility: training.eligibility,
        learning_outcomes: training.learning_outcomes || [],
        placement_support: training.placement_support,
        assessment: training.assessment,
        seo_title: training.seo_title,
        seo_description: training.seo_description,
        seo_keywords: training.seo_keywords,
        canonical_url: training.canonical_url,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("training_programs")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        await insertRelated("training_modules", training.trainingModules, data.id);
        await insertRelated("training_skills", training.trainingSkills, data.id);
        await insertRelated("training_benefits", training.trainingBenefits, data.id);
        await insertRelated("training_faqs", training.faqs, data.id);
        await insertRelated("training_testimonials", training.testimonials, data.id);
        await insertRelated("training_gallery", training.gallery, data.id);
        await insertRelated("training_statistics", training.statistics, data.id);
        navigate(`/admin/training/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase
          .from("training_programs")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        await saveRelated("training_modules", training.trainingModules);
        await saveRelated("training_skills", training.trainingSkills);
        await saveRelated("training_benefits", training.trainingBenefits);
        await saveRelated("training_faqs", training.faqs);
        await saveRelated("training_testimonials", training.testimonials);
        await saveRelated("training_gallery", training.gallery);
        await saveRelated("training_statistics", training.statistics);
      }

      queryClient.invalidateQueries({ queryKey: ['trainingPrograms'] });
      queryClient.invalidateQueries({ queryKey: ['trainingProgram', training.slug] });
      queryClient.invalidateQueries({ queryKey: ['trainingProgram', id] });
      setMessage("Training program saved successfully.");
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setMessage(err.message);
      setSaveError(err.message);
    }
    setSaving(false);
    savingRef.current = false;
  }

  function canNext() {
    if (step === 0) return training.title.trim() !== "" && training.slug.trim() !== "";
    return true;
  }

  function handleStepClick(targetStep) {
    if (targetStep > step && !canNext()) return;
    setStep(targetStep);
  }

  return (
    <PageShell
      backTo="/admin/training"
      title={isNew ? "New Training Program" : `Edit: ${training.title || "Untitled"}`}
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />

      {message && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-xl animate-fade-in-up pointer-events-auto min-w-[300px] max-w-[calc(100vw-2rem)] ${
            message.includes("successfully") || message.includes("success")
              ? "bg-success-50 border border-success-500 text-success-700"
              : "bg-destructive-50 border border-destructive-500 text-destructive-700"
          }`}>
            {message.includes("successfully") || message.includes("success") ? (
              <FiCheck className="w-5 h-5 shrink-0 text-success-600" />
            ) : (
              <FiAlertCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      <div className="-mt-4">
        <FolderTabs tabs={folderTabs} activeTab={step} onChange={(id) => handleStepClick(id)} />
        <div className="bg-white border border-gray-300 rounded-b-[20px] rounded-tr-[20px] shadow-sm p-6 relative z-30 -mt-[2px]">
        {step === 0 && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Title *
                </label>
                <input
                  value={training.title}
                  onChange={(e) => update("title", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Slug *
                </label>
                <input
                  value={training.slug}
                  onChange={(e) => {
                    slugEditedRef.current = true;
                    update("slug", e.target.value);
                  }}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">
                Short Description
              </label>
              <textarea
                value={training.short_description || ""}
                onChange={(e) => update("short_description", e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Category
                </label>
                <select
                  value={training.category_id}
                  onChange={(e) => update("category_id", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                >
                  <option value="">— Select Category —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <IconPicker
                value={training.icon}
                onChange={(val) => update("icon", val)}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Duration
                </label>
                <input
                  value={training.duration || ""}
                  onChange={(e) => update("duration", e.target.value)}
                  placeholder="e.g. 3 months"
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Mode
                </label>
                <select
                  value={training.mode}
                  onChange={(e) => update("mode", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Difficulty
                </label>
                <select
                  value={training.difficulty}
                  onChange={(e) => update("difficulty", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={training.price ?? ""}
                  onChange={(e) => update("price", e.target.value ? e.target.valueAsNumber : null)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  value={training.discount ?? ""}
                  onChange={(e) => update("discount", e.target.value ? e.target.valueAsNumber : null)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Badge
                </label>
                <select
                  value={training.badge}
                  onChange={(e) => update("badge", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                >
                  <option value="none">None</option>
                  <option value="Trending">Trending</option>
                  <option value="New">New</option>
                  <option value="Popular">Popular</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Status
                </label>
                <select
                  value={training.status}
                  onChange={(e) => update("status", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={training.sort_order ?? 0}
                onChange={(e) => update("sort_order", e.target.valueAsNumber ?? 0)}
                className="w-32 px-3 py-2 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-admin-200">
              <input
                type="checkbox"
                checked={training.certificate}
                onChange={(e) => update("certificate", e.target.checked)}
                className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20"
              />
              <label className="text-sm font-medium text-black cursor-pointer">
                Certificate
              </label>
            </div>
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={training.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                  className="rounded"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={training.popular}
                  onChange={(e) => update("popular", e.target.checked)}
                  className="rounded"
                />
                Popular
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={training.trending}
                  onChange={(e) => update("trending", e.target.checked)}
                  className="rounded"
                />
                Trending
              </label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-black flex items-center gap-2">
              <FiImage className="w-5 h-5 text-cyan-600" /> Media
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Thumbnail
                </label>
                <ImageUploader
                  bucket="training-images"
                  value={training.thumbnail}
                  onChange={(url) => update("thumbnail", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Banner / Hero Image
                </label>
                <ImageUploader
                  bucket="training-images"
                  value={training.banner}
                  onChange={(url) => update("banner", url)}
                />
              </div>
            </div>
            <div className="max-w-2xl">
              <label className="block text-sm font-semibold text-black mb-1">
                Meta Image (OG)
              </label>
              <ImageUploader
                bucket="training-images"
                value={training.meta_image}
                onChange={(url) => update("meta_image", url)}
              />
            </div>

            <hr className="border-admin-200" />

            <h2 className="text-lg font-semibold text-black flex items-center gap-2">
              <FiFileText className="w-5 h-5 text-violet-600" /> Content
            </h2>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">
                Full Description
              </label>
              <textarea
                value={training.description || ""}
                onChange={(e) => update("description", e.target.value)}
                rows={10}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">
                Eligibility
              </label>
              <textarea
                value={training.eligibility || ""}
                onChange={(e) => update("eligibility", e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                placeholder="Describe who this training is for..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">
                Placement Support
              </label>
              <textarea
                value={training.placement_support || ""}
                onChange={(e) => update("placement_support", e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                placeholder="Describe placement support offered..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">
                Assessment
              </label>
              <textarea
                value={training.assessment || ""}
                onChange={(e) => update("assessment", e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                placeholder="Describe assessment methods..."
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-black mb-2">Learning Outcomes</h4>
              <ListEditor
                items={training.learning_outcomes || []}
                onChange={(val) => update("learning_outcomes", val)}
                fields={[{ key: "item", label: "Outcome" }]}
                labelKey="Outcome"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2">
                  <FiBookOpen className="w-5 h-5 text-cyan-600" /> Modules
                </h2>
                <AddButton
                  onClick={() => update("trainingModules", [...training.trainingModules, { title: "", duration: "", topics: [], outcomes: [], sort_order: training.trainingModules.length }])}
                  label="Add Module"
                />
              </div>
              <div className="space-y-3">
                {training.trainingModules.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 bg-white rounded-lg border-2 border-dashed border-admin-200">
                    <FiBookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No modules yet. Click "Add Module" to build your curriculum.</p>
                  </div>
                )}
                {training.trainingModules.map((mod, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Module {i + 1}</span>
                      <button
                        onClick={() => update("trainingModules", training.trainingModules.filter((_, j) => j !== i))}
                        className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-destructive-50 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Title</label>
                        <input
                          value={mod.title || ""}
                          onChange={(e) => {
                            const n = [...training.trainingModules];
                            n[i] = { ...n[i], title: e.target.value };
                            update("trainingModules", n);
                          }}
                          className="w-full px-3 py-2 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="Module title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Duration</label>
                        <input
                          value={mod.duration || ""}
                          onChange={(e) => {
                            const n = [...training.trainingModules];
                            n[i] = { ...n[i], duration: e.target.value };
                            update("trainingModules", n);
                          }}
                          className="w-full px-3 py-2 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="e.g. 2 weeks"
                        />
                      </div>
                    </div>
                    <div className="space-y-2 mb-3">
                      <label className="block text-sm font-semibold text-black mb-1">Topics</label>
                      {(mod.topics || []).map((topic, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input
                            value={typeof topic === "string" ? topic : ""}
                            onChange={(e) => {
                              const n = [...training.trainingModules];
                              const topics = [...(n[i].topics || [])];
                              topics[j] = e.target.value;
                              n[i] = { ...n[i], topics };
                              update("trainingModules", n);
                            }}
                            className="flex-1 px-3 py-1.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                            placeholder="Topic"
                          />
                          <button
                            onClick={() => {
                              const n = [...training.trainingModules];
                              n[i] = { ...n[i], topics: n[i].topics.filter((_, k) => k !== j) };
                              update("trainingModules", n);
                            }}
                            className="p-1 text-destructive-300 hover:text-destructive-500"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <AddButton
                        onClick={() => {
                          const n = [...training.trainingModules];
                          n[i] = { ...n[i], topics: [...(n[i].topics || []), ""] };
                          update("trainingModules", n);
                        }}
                        size="xs"
                        label="Add Topic"
                      />
                    </div>
                    <div className="space-y-2 mb-3">
                      <label className="block text-sm font-semibold text-black mb-1">Outcomes</label>
                      {(mod.outcomes || []).map((outcome, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <input
                            value={typeof outcome === "string" ? outcome : ""}
                            onChange={(e) => {
                              const n = [...training.trainingModules];
                              const outcomes = [...(n[i].outcomes || [])];
                              outcomes[j] = e.target.value;
                              n[i] = { ...n[i], outcomes };
                              update("trainingModules", n);
                            }}
                            className="flex-1 px-3 py-1.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                            placeholder="Outcome"
                          />
                          <button
                            onClick={() => {
                              const n = [...training.trainingModules];
                              n[i] = { ...n[i], outcomes: n[i].outcomes.filter((_, k) => k !== j) };
                              update("trainingModules", n);
                            }}
                            className="p-1 text-destructive-300 hover:text-destructive-500"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <AddButton
                        onClick={() => {
                          const n = [...training.trainingModules];
                          n[i] = { ...n[i], outcomes: [...(n[i].outcomes || []), ""] };
                          update("trainingModules", n);
                        }}
                        size="xs"
                        label="Add Outcome"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={mod.sort_order ?? i}
                        onChange={(e) => {
                          const n = [...training.trainingModules];
                          n[i] = { ...n[i], sort_order: e.target.valueAsNumber ?? i };
                          update("trainingModules", n);
                        }}
                        className="w-24 px-3 py-2 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                  <FiZap className="w-5 h-5 text-amber-600" /> Skills
                </h3>
                <AddButton
                  onClick={() => update("trainingSkills", [...training.trainingSkills, { icon: "", title: "", description: "", sort_order: training.trainingSkills.length }])}
                  label="Add Skill"
                />
              </div>
              <div className="space-y-3">
                {training.trainingSkills.map((s, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => update("trainingSkills", training.trainingSkills.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <IconPicker
                        value={s.icon || ""}
                        onChange={(val) => {
                          const n = [...training.trainingSkills];
                          n[i] = { ...n[i], icon: val };
                          update("trainingSkills", n);
                        }}
                      />
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Title</label>
                        <input
                          value={s.title || ""}
                          onChange={(e) => {
                            const n = [...training.trainingSkills];
                            n[i] = { ...n[i], title: e.target.value };
                            update("trainingSkills", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-black mb-1">Description</label>
                      <textarea
                        value={s.description || ""}
                        onChange={(e) => {
                          const n = [...training.trainingSkills];
                          n[i] = { ...n[i], description: e.target.value };
                          update("trainingSkills", n);
                        }}
                        rows={2}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-black mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={s.sort_order ?? i}
                        onChange={(e) => {
                          const n = [...training.trainingSkills];
                          n[i] = { ...n[i], sort_order: e.target.valueAsNumber ?? i };
                          update("trainingSkills", n);
                        }}
                        className="w-24 px-3 py-2 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                  <FiHeart className="w-5 h-5 text-rose-600" /> Benefits
                </h3>
                <AddButton
                  onClick={() => update("trainingBenefits", [...training.trainingBenefits, { icon: "", title: "", description: "", sort_order: training.trainingBenefits.length }])}
                  label="Add Benefit"
                />
              </div>
              <div className="space-y-3">
                {training.trainingBenefits.map((b, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => update("trainingBenefits", training.trainingBenefits.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <IconPicker
                        value={b.icon || ""}
                        onChange={(val) => {
                          const n = [...training.trainingBenefits];
                          n[i] = { ...n[i], icon: val };
                          update("trainingBenefits", n);
                        }}
                      />
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Title</label>
                        <input
                          value={b.title || ""}
                          onChange={(e) => {
                            const n = [...training.trainingBenefits];
                            n[i] = { ...n[i], title: e.target.value };
                            update("trainingBenefits", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-black mb-1">Description</label>
                      <textarea
                        value={b.description || ""}
                        onChange={(e) => {
                          const n = [...training.trainingBenefits];
                          n[i] = { ...n[i], description: e.target.value };
                          update("trainingBenefits", n);
                        }}
                        rows={2}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-black mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={b.sort_order ?? i}
                        onChange={(e) => {
                          const n = [...training.trainingBenefits];
                          n[i] = { ...n[i], sort_order: e.target.valueAsNumber ?? i };
                          update("trainingBenefits", n);
                        }}
                        className="w-24 px-3 py-2 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">FAQs</h3>
                <AddButton
                  onClick={() => update("faqs", [...training.faqs, { question: "", answer: "", category: "", is_active: true }])}
                  label="Add FAQ"
                />
              </div>
              <div className="space-y-3">
                {training.faqs.map((faq, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => update("faqs", training.faqs.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Question</label>
                        <input
                          value={faq.question || ""}
                          onChange={(e) => {
                            const n = [...training.faqs];
                            n[i] = { ...n[i], question: e.target.value };
                            update("faqs", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Answer</label>
                        <textarea
                          value={faq.answer || ""}
                          onChange={(e) => {
                            const n = [...training.faqs];
                            n[i] = { ...n[i], answer: e.target.value };
                            update("faqs", n);
                          }}
                          rows={3}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Category</label>
                          <input
                            value={faq.category || ""}
                            onChange={(e) => {
                              const n = [...training.faqs];
                              n[i] = { ...n[i], category: e.target.value };
                              update("faqs", n);
                            }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                            placeholder="e.g. Pricing, General"
                          />
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={faq.is_active !== false}
                              onChange={(e) => {
                                const n = [...training.faqs];
                                n[i] = { ...n[i], is_active: e.target.checked };
                                update("faqs", n);
                              }}
                              className="rounded"
                            />
                            Active
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-admin-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">Testimonials</h3>
                <AddButton
                  onClick={() => update("testimonials", [...training.testimonials, { student_name: "", photo: "", college: "", company: "", rating: 5, review: "" }])}
                  label="Add Testimonial"
                />
              </div>
              <div className="space-y-3">
                {training.testimonials.map((t, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => update("testimonials", training.testimonials.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Student Name</label>
                          <input
                            value={t.student_name || ""}
                            onChange={(e) => {
                              const n = [...training.testimonials];
                              n[i] = { ...n[i], student_name: e.target.value };
                              update("testimonials", n);
                            }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Photo</label>
                          <ImageUploader
                            bucket="training-images"
                            value={t.photo || ""}
                            onChange={(url) => {
                              const n = [...training.testimonials];
                              n[i] = { ...n[i], photo: url };
                              update("testimonials", n);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">College</label>
                          <input
                            value={t.college || ""}
                            onChange={(e) => {
                              const n = [...training.testimonials];
                              n[i] = { ...n[i], college: e.target.value };
                              update("testimonials", n);
                            }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Company</label>
                          <input
                            value={t.company || ""}
                            onChange={(e) => {
                              const n = [...training.testimonials];
                              n[i] = { ...n[i], company: e.target.value };
                              update("testimonials", n);
                            }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Rating</label>
                        <select
                          value={t.rating ?? 5}
                          onChange={(e) => {
                            const n = [...training.testimonials];
                            n[i] = { ...n[i], rating: Number(e.target.value) };
                            update("testimonials", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                        >
                          {[1, 2, 3, 4, 5].map((r) => (
                            <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Review</label>
                        <textarea
                          value={t.review || ""}
                          onChange={(e) => {
                            const n = [...training.testimonials];
                            n[i] = { ...n[i], review: e.target.value };
                            update("testimonials", n);
                          }}
                          rows={3}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-admin-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">Gallery</h3>
                <AddButton
                  onClick={() => update("gallery", [...training.gallery, { image: "", caption: "", type: "image" }])}
                  label="Add Gallery Item"
                />
              </div>
              <div className="space-y-3">
                {training.gallery.map((g, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => update("gallery", training.gallery.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Image</label>
                        <ImageUploader
                          bucket="training-images"
                          value={g.image || ""}
                          onChange={(url) => {
                            const n = [...training.gallery];
                            n[i] = { ...n[i], image: url };
                            update("gallery", n);
                          }}
                        />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Caption</label>
                          <input
                            value={g.caption || ""}
                            onChange={(e) => {
                              const n = [...training.gallery];
                              n[i] = { ...n[i], caption: e.target.value };
                              update("gallery", n);
                            }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-black mb-1">Type</label>
                          <select
                            value={g.type || "image"}
                            onChange={(e) => {
                              const n = [...training.gallery];
                              n[i] = { ...n[i], type: e.target.value };
                              update("gallery", n);
                            }}
                            className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-admin-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">Statistics</h3>
                <AddButton
                  onClick={() => update("statistics", [...training.statistics, { title: "", value: "", icon: "" }])}
                  label="Add Statistic"
                />
              </div>
              <div className="space-y-3">
                {training.statistics.map((s, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button
                      onClick={() => update("statistics", training.statistics.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Title</label>
                        <input
                          value={s.title || ""}
                          onChange={(e) => {
                            const n = [...training.statistics];
                            n[i] = { ...n[i], title: e.target.value };
                            update("statistics", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="e.g. Students Trained"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Value</label>
                        <input
                          value={s.value || ""}
                          onChange={(e) => {
                            const n = [...training.statistics];
                            n[i] = { ...n[i], value: e.target.value };
                            update("statistics", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="e.g. 10,000+"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <IconPicker
                        value={s.icon || ""}
                        onChange={(val) => {
                          const n = [...training.statistics];
                          n[i] = { ...n[i], icon: val };
                          update("statistics", n);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-admin-200" />

            <div>
              <h3 className="text-sm font-semibold text-black mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    SEO Title
                  </label>
                  <input
                    value={training.seo_title || ""}
                    onChange={(e) => update("seo_title", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    SEO Description
                  </label>
                  <textarea
                    value={training.seo_description || ""}
                    onChange={(e) => update("seo_description", e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    SEO Keywords
                  </label>
                  <input
                    value={training.seo_keywords || ""}
                    onChange={(e) => update("seo_keywords", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Canonical URL
                  </label>
                  <input
                    value={training.canonical_url || ""}
                    onChange={(e) => update("canonical_url", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-admin-200">
        <div></div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
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
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-admin-600 hover:bg-admin-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? "Saving..." : "Save Training"}
            </button>
          )}
        </div>
      </div>
      </div>

    </PageShell>
  );
}
