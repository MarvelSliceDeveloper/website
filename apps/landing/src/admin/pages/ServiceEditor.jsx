import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabaseClient";
import ImageUploader from "../components/ImageUploader";
import AddButton from "../components/AddButton";
import { FiTrash2, FiMove, FiArrowLeft, FiLayers, FiCheck, FiClock, FiVideo, FiCode, FiAward, FiCalendar, FiRefreshCw, FiMessageCircle, FiUsers, FiStar, FiBarChart2, FiBookOpen, FiBriefcase, FiTarget, FiGlobe, FiCpu, FiDatabase, FiZap, FiShield, FiTrendingUp, FiChevronDown, FiChevronUp, FiSettings, FiFileText, FiTag, FiImage, FiHeart, FiAlertCircle, FiSave, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';
import SectionSelect from '../components/ui/SectionSelect';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
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

const tabMeta = {
  basic: { label: "Basic", Icon: FiSettings },
  description: { label: "Description", Icon: FiFileText },
  media: { label: "Media", Icon: FiImage },
  details: { label: "Details", Icon: FiLayers },
  benefits: { label: "Benefits", Icon: FiHeart },
  steps: { label: "Steps", Icon: FiClock },
  faqs: { label: "FAQs", Icon: FiMessageCircle },
  testimonials: { label: "Testimonials", Icon: FiStar },
  gallery: { label: "Gallery", Icon: FiVideo },
  statistics: { label: "Stats", Icon: FiBarChart2 },
  seo: { label: "SEO", Icon: FiGlobe },
};

const editorTabs = Object.keys(tabMeta);

export default function ServiceEditor() {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = id === 'new';
  const [tab, setTab] = useState('basic');
  const sidebarOpen = true;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [service, setService] = useState({
    title: "",
    slug: "",
    category_id: "",
    icon: "",
    short_description: "",
    full_description: "",
    duration: "",
    mode: "Online",
    price: null,
    discount: null,
    badge: "none",
    difficulty: "Beginner",
    language: "English",
    certificate: false,
    placement_support: false,
    internship: false,
    status: "draft",
    sort_order: 0,
    featured: false,
    popular: false,
    trending: false,
    thumbnail_url: "",
    banner_url: "",
    meta_image_url: "",
    eligibility: "",
    requirements: [],
    learning_outcomes: [],
    curriculum: [],
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
    canonical_url: "",
    benefits: [],
    steps: [],
    faqs: [],
    testimonials: [],
    gallery: [],
    statistics: [],
  });

  const [loading, setLoading] = useState(true);
  const { dirty, reset } = useDirty([service], loading);

  const savingRef = useRef(false);
  const slugEditedRef = useRef(false);

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function update(field, value) {
    setService((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "title" && !slugEditedRef.current) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  useEffect(() => {
    async function loadData() {
      const { data: catData } = await supabase.from("service_categories").select("*").order("sort_order");
      setCategories(catData || []);

      if (!isNew) {
        const related = [
          ["benefits", "service_benefits"],
          ["steps", "service_steps"],
          ["faqs", "service_faqs"],
          ["testimonials", "service_testimonials"],
          ["gallery", "service_gallery"],
          ["statistics", "service_statistics"],
        ];
        const relatedQueries = related.map(([key, table]) =>
          supabase.from(table).select("*").eq("service_id", id).order("sort_order")
        );
        const [svcRes, ...relatedRes] = await Promise.all([
          supabase.from("services").select("*").eq("id", id).single(),
          ...relatedQueries,
        ]);
        if (svcRes.data && !svcRes.error) {
          setService((p) => ({ ...p, ...svcRes.data }));
          slugEditedRef.current = true;
        }
        relatedRes.forEach((res, i) => {
          if (res.data) setService((prev) => ({ ...prev, [related[i][0]]: res.data }));
        });
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  const handleSaveRef = useRef(handleSave);
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
    const { error: delErr } = await supabase.from(table).delete().eq("service_id", id);
    if (delErr) throw new Error(delErr.message);
    if (records.length > 0) {
      const clean = records.map((r, i) => {
        const { id: _, ...rest } = r;
        return { ...rest, service_id: id, sort_order: i };
      });
      const { error: insErr } = await supabase.from(table).insert(clean);
      if (insErr) throw new Error(insErr.message);
    }
  }

  async function insertRelated(table, records, serviceId) {
    if (records.length > 0) {
      const clean = records.map((r, i) => {
        const { id: _, ...rest } = r;
        return { ...rest, service_id: serviceId, sort_order: i };
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
        title: service.title,
        slug: service.slug,
        category_id: service.category_id || null,
        icon: service.icon,
        short_description: service.short_description,
        full_description: service.full_description,
        duration: service.duration,
        mode: service.mode,
        price: service.price,
        discount: service.discount,
        badge: service.badge,
        difficulty: service.difficulty,
        language: service.language,
        certificate: service.certificate,
        placement_support: service.placement_support,
        internship: service.internship,
        status: service.status,
        sort_order: service.sort_order,
        featured: service.featured,
        popular: service.popular,
        trending: service.trending,
        thumbnail_url: service.thumbnail_url,
        banner_url: service.banner_url,
        meta_image_url: service.meta_image_url,
        eligibility: service.eligibility,
        requirements: service.requirements || [],
        learning_outcomes: service.learning_outcomes || [],
        curriculum: service.curriculum || [],
        seo_title: service.seo_title,
        seo_description: service.seo_description,
        seo_keywords: service.seo_keywords,
        canonical_url: service.canonical_url,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("services")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        await insertRelated("service_benefits", service.benefits, data.id);
        await insertRelated("service_steps", service.steps, data.id);
        await insertRelated("service_faqs", service.faqs, data.id);
        await insertRelated("service_testimonials", service.testimonials, data.id);
        await insertRelated("service_gallery", service.gallery, data.id);
        await insertRelated("service_statistics", service.statistics, data.id);
        navigate(`/admin/services/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase
          .from("services")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        await saveRelated("service_benefits", service.benefits);
        await saveRelated("service_steps", service.steps);
        await saveRelated("service_faqs", service.faqs);
        await saveRelated("service_testimonials", service.testimonials);
        await saveRelated("service_gallery", service.gallery);
        await saveRelated("service_statistics", service.statistics);
      }

      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service', service.slug] });
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setMessage("Service saved successfully.");
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

  return (
    <PageShell
      backTo="/admin/services"
      title={isNew ? "New Service" : `Edit: ${service.title || "Untitled"}`}
    >

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

      <div className="flex flex-col lg:flex-row gap-[15px] items-start">
        <div className="hidden lg:block transition-all duration-200 lg:w-[240px] lg:shrink-0">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-visible">
            <div className="bg-white rounded-xl flex flex-col overflow-visible border border-gray-300" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
              {editorTabs.map((t, index) => {
                const meta = tabMeta[t];
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`relative w-full flex items-center gap-2.5 text-left px-4 py-3 border-b border-gray-200 last:border-b-0 focus:outline-none transition-colors ${
                      index === 0 ? 'rounded-t-xl' : ''
                    } ${
                      index === editorTabs.length - 1 ? 'rounded-b-xl' : ''
                    } ${
                      isActive ? 'bg-admin-600 text-white shadow-md z-10' : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <meta.Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                    <div className="font-semibold text-sm">
                      {meta.label}
                    </div>
                    {isActive && (
                      <div className="hidden lg:block absolute top-1/2 -translate-y-1/2 -right-[15px] w-0 h-0 border-y-[15px] border-y-transparent border-l-[27px] border-l-admin-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <SectionSelect items={editorTabs.map(t => ({ key: t, label: tabMeta[t].label }))} value={tab} onChange={setTab} label="Section" />
          <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
          <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
          {tab === "basic" && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Title *
                  </label>
                  <input
                    value={service.title}
                    onChange={(e) => update("title", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Slug *
                  </label>
                  <input
                    value={service.slug}
                    onChange={(e) => {
                      slugEditedRef.current = true;
                      update("slug", e.target.value);
                    }}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Category
                  </label>
                  <select
                    value={service.category_id}
                    onChange={(e) => update("category_id", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  >
                    <option value="">— Select Category —</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <IconPicker
                  value={service.icon}
                  onChange={(val) => update("icon", val)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Short Description
                </label>
                <textarea
                  value={service.short_description || ""}
                  onChange={(e) => update("short_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Duration
                  </label>
                  <input
                    value={service.duration || ""}
                    onChange={(e) => update("duration", e.target.value)}
                    placeholder="e.g. 3 months"
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Mode
                  </label>
                  <select
                    value={service.mode}
                    onChange={(e) => update("mode", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Weekend">Weekend</option>
                    <option value="Weekday">Weekday</option>
                    <option value="Fast Track">Fast Track</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Price
                  </label>
                  <input
                    type="number"
                    value={service.price ?? ""}
                    onChange={(e) => update("price", e.target.value ? e.target.valueAsNumber : null)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Discount
                  </label>
                  <input
                    type="number"
                    value={service.discount ?? ""}
                    onChange={(e) => update("discount", e.target.value ? e.target.valueAsNumber : null)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Badge
                  </label>
                  <select
                    value={service.badge}
                    onChange={(e) => update("badge", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  >
                    <option value="none">None</option>
                    <option value="Trending">Trending</option>
                    <option value="New">New</option>
                    <option value="Popular">Popular</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Difficulty
                  </label>
                  <select
                    value={service.difficulty}
                    onChange={(e) => update("difficulty", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Language
                  </label>
                  <input
                    value={service.language || ""}
                    onChange={(e) => update("language", e.target.value)}
                    placeholder="English"
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Status
                  </label>
                  <select
                    value={service.status}
                    onChange={(e) => update("status", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
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
                  value={service.sort_order ?? 0}
                  onChange={(e) => update("sort_order", e.target.valueAsNumber ?? 0)}
                  className="w-32 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.certificate}
                    onChange={(e) => update("certificate", e.target.checked)}
                    className="rounded"
                  />
                  Certificate
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.placement_support}
                    onChange={(e) => update("placement_support", e.target.checked)}
                    className="rounded"
                  />
                  Placement Support
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.internship}
                    onChange={(e) => update("internship", e.target.checked)}
                    className="rounded"
                  />
                  Internship
                </label>
              </div>
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.featured}
                    onChange={(e) => update("featured", e.target.checked)}
                    className="rounded"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.popular}
                    onChange={(e) => update("popular", e.target.checked)}
                    className="rounded"
                  />
                  Popular
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.trending}
                    onChange={(e) => update("trending", e.target.checked)}
                    className="rounded"
                  />
                  Trending
                </label>
              </div>
            </div>
          )}

          {tab === "description" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Full Description
                </label>
                <textarea
                  value={service.full_description || ""}
                  onChange={(e) => update("full_description", e.target.value)}
                  rows={20}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all font-mono"
                />
              </div>
            </div>
          )}

          {tab === "media" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Thumbnail
                </label>
                <ImageUploader
                  bucket="service-images"
                  value={service.thumbnail_url}
                  onChange={(url) => update("thumbnail_url", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Banner / Hero Image
                </label>
                <ImageUploader
                  bucket="service-images"
                  value={service.banner_url}
                  onChange={(url) => update("banner_url", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Meta Image (OG)
                </label>
                <ImageUploader
                  bucket="service-images"
                  value={service.meta_image_url}
                  onChange={(url) => update("meta_image_url", url)}
                />
              </div>
            </div>
          )}

          {tab === "details" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Eligibility
                </label>
                <textarea
                  value={service.eligibility || ""}
                  onChange={(e) => update("eligibility", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="Describe who this service is for..."
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Requirements</h4>
                <ListEditor
                  items={service.requirements || []}
                  onChange={(val) => update("requirements", val)}
                  fields={[{ key: "item", label: "Requirement" }]}
                  labelKey="Requirement"
                />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">Learning Outcomes</h4>
                <ListEditor
                  items={service.learning_outcomes || []}
                  onChange={(val) => update("learning_outcomes", val)}
                  fields={[{ key: "item", label: "Outcome" }]}
                  labelKey="Outcome"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-neutral-700">Curriculum</h4>
                  <AddButton
                    onClick={() => update("curriculum", [...service.curriculum, { title: "", items: [] }])}
                    label="Add Module"
                  />
                </div>
                {service.curriculum.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 bg-white rounded-xl border-2 border-dashed border-admin-200">
                    <FiLayers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No modules yet.</p>
                  </div>
                )}
                <div className="space-y-3">
                  {service.curriculum.map((mod, i) => (
                    <div key={i} className="border border-admin-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Module {i + 1}</span>
                        <button
                          onClick={() => update("curriculum", service.curriculum.filter((_, j) => j !== i))}
                          className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-destructive-50 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        value={mod.title || ""}
                        onChange={(e) => {
                          const n = [...service.curriculum];
                          n[i] = { ...n[i], title: e.target.value };
                          update("curriculum", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all mb-3"
                        placeholder="Module title"
                      />
                      <div className="space-y-2">
                        {(mod.items || []).map((item, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400 w-5 text-right shrink-0">{j + 1}.</span>
                            <input
                              value={item}
                              onChange={(e) => {
                                const n = [...service.curriculum];
                                const items = [...(n[i].items || [])];
                                items[j] = e.target.value;
                                n[i] = { ...n[i], items };
                                update("curriculum", n);
                              }}
                              className="flex-1 px-3 py-1.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500"
                              placeholder="Item"
                            />
                            <button
                              onClick={() => {
                                const n = [...service.curriculum];
                                n[i] = { ...n[i], items: n[i].items.filter((_, k) => k !== j) };
                                update("curriculum", n);
                              }}
                              className="p-1 text-destructive-300 hover:text-destructive-500 transition-colors"
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <AddButton
                          onClick={() => {
                            const n = [...service.curriculum];
                            n[i] = { ...n[i], items: [...(n[i].items || []), ""] };
                            update("curriculum", n);
                          }}
                          size="xs"
                          label="Add Item"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "benefits" && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Benefits</h3>
              <div className="space-y-6">
                {service.benefits.map((b, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => update("benefits", service.benefits.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <IconPicker
                      value={b.icon || ""}
                      onChange={(val) => {
                        const n = [...service.benefits];
                        n[i] = { ...n[i], icon: val };
                        update("benefits", n);
                      }}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Title</label>
                      <input
                        value={b.title || ""}
                        onChange={(e) => {
                          const n = [...service.benefits];
                          n[i] = { ...n[i], title: e.target.value };
                          update("benefits", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Description</label>
                      <textarea
                        value={b.description || ""}
                        onChange={(e) => {
                          const n = [...service.benefits];
                          n[i] = { ...n[i], description: e.target.value };
                          update("benefits", n);
                        }}
                        rows={2}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <AddButton
                  onClick={() => update("benefits", [...service.benefits, { icon: "", title: "", description: "" }])}
                  label="Add Benefit"
                />
              </div>
            </div>
          )}

          {tab === "steps" && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Timeline Steps</h3>
              <div className="space-y-6">
                {service.steps.map((s, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => update("steps", service.steps.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <IconPicker
                      value={s.icon || ""}
                      onChange={(val) => {
                        const n = [...service.steps];
                        n[i] = { ...n[i], icon: val };
                        update("steps", n);
                      }}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Title</label>
                      <input
                        value={s.title || ""}
                        onChange={(e) => {
                          const n = [...service.steps];
                          n[i] = { ...n[i], title: e.target.value };
                          update("steps", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Description</label>
                      <textarea
                        value={s.description || ""}
                        onChange={(e) => {
                          const n = [...service.steps];
                          n[i] = { ...n[i], description: e.target.value };
                          update("steps", n);
                        }}
                        rows={2}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <AddButton
                  onClick={() => update("steps", [...service.steps, { icon: "", title: "", description: "" }])}
                  label="Add Step"
                />
              </div>
            </div>
          )}

          {tab === "faqs" && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">FAQs</h3>
              <div className="space-y-6">
                {service.faqs.map((faq, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => update("faqs", service.faqs.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Question</label>
                      <input
                        value={faq.question || ""}
                        onChange={(e) => {
                          const n = [...service.faqs];
                          n[i] = { ...n[i], question: e.target.value };
                          update("faqs", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Answer</label>
                      <textarea
                        value={faq.answer || ""}
                        onChange={(e) => {
                          const n = [...service.faqs];
                          n[i] = { ...n[i], answer: e.target.value };
                          update("faqs", n);
                        }}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Category</label>
                        <input
                          value={faq.category || ""}
                          onChange={(e) => {
                            const n = [...service.faqs];
                            n[i] = { ...n[i], category: e.target.value };
                            update("faqs", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="e.g. Pricing, General"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={faq.is_active !== false}
                            onChange={(e) => {
                              const n = [...service.faqs];
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
                ))}
                <AddButton
                  onClick={() => update("faqs", [...service.faqs, { question: "", answer: "", category: "", is_active: true }])}
                  label="Add FAQ"
                />
              </div>
            </div>
          )}

          {tab === "testimonials" && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Testimonials</h3>
              <div className="space-y-6">
                {service.testimonials.map((t, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => update("testimonials", service.testimonials.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Student Name</label>
                      <input
                        value={t.student_name || ""}
                        onChange={(e) => {
                          const n = [...service.testimonials];
                          n[i] = { ...n[i], student_name: e.target.value };
                          update("testimonials", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Photo</label>
                      <ImageUploader
                        bucket="service-images"
                        value={t.photo || ""}
                        onChange={(url) => {
                          const n = [...service.testimonials];
                          n[i] = { ...n[i], photo: url };
                          update("testimonials", n);
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Course / Role</label>
                        <input
                          value={t.course || ""}
                          onChange={(e) => {
                            const n = [...service.testimonials];
                            n[i] = { ...n[i], course: e.target.value };
                            update("testimonials", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Company</label>
                        <input
                          value={t.company || ""}
                          onChange={(e) => {
                            const n = [...service.testimonials];
                            n[i] = { ...n[i], company: e.target.value };
                            update("testimonials", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Rating</label>
                      <select
                        value={t.rating ?? 5}
                        onChange={(e) => {
                          const n = [...service.testimonials];
                          n[i] = { ...n[i], rating: Number(e.target.value) };
                          update("testimonials", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
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
                          const n = [...service.testimonials];
                          n[i] = { ...n[i], review: e.target.value };
                          update("testimonials", n);
                        }}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <AddButton
                  onClick={() => update("testimonials", [...service.testimonials, { student_name: "", photo: "", course: "", company: "", rating: 5, review: "" }])}
                  label="Add Testimonial"
                />
              </div>
            </div>
          )}

          {tab === "gallery" && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Gallery</h3>
              <div className="space-y-6">
                {service.gallery.map((g, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => update("gallery", service.gallery.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Image</label>
                      <ImageUploader
                        bucket="service-images"
                        value={g.image || ""}
                        onChange={(url) => {
                          const n = [...service.gallery];
                          n[i] = { ...n[i], image: url };
                          update("gallery", n);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Caption</label>
                      <input
                        value={g.caption || ""}
                        onChange={(e) => {
                          const n = [...service.gallery];
                          n[i] = { ...n[i], caption: e.target.value };
                          update("gallery", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Type</label>
                      <select
                        value={g.type || "image"}
                        onChange={(e) => {
                          const n = [...service.gallery];
                          n[i] = { ...n[i], type: e.target.value };
                          update("gallery", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>
                ))}
                <AddButton
                  onClick={() => update("gallery", [...service.gallery, { image: "", caption: "", type: "image" }])}
                  label="Add Gallery Item"
                />
              </div>
            </div>
          )}

          {tab === "statistics" && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Statistics</h3>
              <div className="space-y-6">
                {service.statistics.map((s, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => update("statistics", service.statistics.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <IconPicker
                      value={s.icon || ""}
                      onChange={(val) => {
                        const n = [...service.statistics];
                        n[i] = { ...n[i], icon: val };
                        update("statistics", n);
                      }}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Title</label>
                        <input
                          value={s.title || ""}
                          onChange={(e) => {
                            const n = [...service.statistics];
                            n[i] = { ...n[i], title: e.target.value };
                            update("statistics", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="e.g. Students Trained"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">Value</label>
                        <input
                          value={s.value || ""}
                          onChange={(e) => {
                            const n = [...service.statistics];
                            n[i] = { ...n[i], value: e.target.value };
                            update("statistics", n);
                          }}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                          placeholder="e.g. 10,000+"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <AddButton
                  onClick={() => update("statistics", [...service.statistics, { title: "", value: "", icon: "" }])}
                  label="Add Statistic"
                />
              </div>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-6">
              <h3 className="font-semibold text-black mb-4">SEO Settings</h3>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  SEO Title
                </label>
                <input
                  value={service.seo_title || ""}
                  onChange={(e) => update("seo_title", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  SEO Description
                </label>
                <textarea
                  value={service.seo_description || ""}
                  onChange={(e) => update("seo_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  SEO Keywords
                </label>
                <input
                  value={service.seo_keywords || ""}
                  onChange={(e) => update("seo_keywords", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Canonical URL
                </label>
                <input
                  value={service.canonical_url || ""}
                  onChange={(e) => update("canonical_url", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
    </PageShell>
  );
}
