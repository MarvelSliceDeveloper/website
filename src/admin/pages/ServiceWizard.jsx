import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import AdminButton from "../components/AdminButton";
import ImageUploader from "../components/ImageUploader";
import {
  FiPlus,
  FiTrash2,
  FiArrowLeft,
  FiCheck,
  FiClock,
  FiMonitor,
  FiUsers,
  FiAward,
  FiBookOpen,
  FiLayers,
  FiVideo,
  FiCode,
  FiCalendar,
  FiRefreshCw,
  FiMessageCircle,
  FiStar,
  FiBarChart2,
  FiBriefcase,
  FiGlobe,
  FiCpu,
  FiDatabase,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiChevronUp,
  FiAlertCircle,
  FiX,
  FiSettings,
  FiFileText,
  FiImage
, FiChevronDown} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';

const STEPS = [
  { label: "Basics", icon: FiSettings },
  { label: "Details", icon: FiFileText },
  { label: "Media", icon: FiImage },
  { label: "SEO", icon: FiGlobe },
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
        className="w-full flex items-center gap-2 px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white text-left transition-all"
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

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function ServiceWizard() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
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
    highlights: [],
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

  useEffect(() => {
    async function loadData() {
      const { data: catData } = await supabase.from("service_categories").select("*").order("sort_order");
      setCategories(catData || []);
    }
    loadData();
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

  function update(field, val) {
    setService((prev) => ({ ...prev, [field]: val }));
  }

  function handleTitleChange(value) {
    update("title", value);
    if (!service.slug || service.slug === slugify(service.title)) {
      update("slug", slugify(value));
    }
  }

  function canNext() {
    if (step === 0) return service.title.trim() !== "" && service.slug.trim() !== "";
    return true;
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
        highlights: service.highlights || [],
        curriculum: service.curriculum || [],
        seo_title: service.seo_title,
        seo_description: service.seo_description,
        seo_keywords: service.seo_keywords,
        canonical_url: service.canonical_url,
      };

      const { data, error } = await supabase.from("services").insert(payload).select().single();
      if (error) throw error;

      await insertRelated("service_benefits", service.benefits, data.id);
      await insertRelated("service_steps", service.steps, data.id);
      await insertRelated("service_faqs", service.faqs, data.id);
      await insertRelated("service_testimonials", service.testimonials, data.id);
      await insertRelated("service_gallery", service.gallery, data.id);
      await insertRelated("service_statistics", service.statistics, data.id);

      navigate("/admin/services");
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
    <PageShell title="Create New Service" maxWidth="max-w-[1600px]">
      {message && (
        <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 text-sm ${
          message.includes("successfully")
            ? "bg-success-50 border border-success-500 text-success-700"
            : "bg-destructive-50 border border-destructive-500 text-destructive-700"
        }`}>
          {message.includes("successfully") ? (
            <FiCheck className="w-4 h-4 shrink-0" />
          ) : (
            <FiAlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
          {step === 0 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-black mb-4">Basic Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Title *</label>
                  <input
                    value={service.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Slug *</label>
                  <input
                    value={service.slug}
                    onChange={(e) => update("slug", slugify(e.target.value))}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 font-mono text-sm transition-all"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Category</label>
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
                <IconPicker value={service.icon} onChange={(val) => update("icon", val)} />
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Status</label>
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
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.featured}
                    onChange={(e) => update("featured", e.target.checked)}
                    className="rounded text-admin-600 focus:ring-admin-500"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.popular}
                    onChange={(e) => update("popular", e.target.checked)}
                    className="rounded text-admin-600 focus:ring-admin-500"
                  />
                  Popular
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={service.trending}
                    onChange={(e) => update("trending", e.target.checked)}
                    className="rounded text-admin-600 focus:ring-admin-500"
                  />
                  Trending
                </label>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-black mb-4">Service Details</h2>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Short Description</label>
                <textarea
                  value={service.short_description || ""}
                  onChange={(e) => update("short_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Full Description</label>
                <textarea
                  value={service.full_description || ""}
                  onChange={(e) => update("full_description", e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Duration</label>
                  <input
                    value={service.duration || ""}
                    onChange={(e) => update("duration", e.target.value)}
                    placeholder="e.g. 3 months"
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Mode</label>
                  <select
                    value={service.mode}
                    onChange={(e) => update("mode", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Price</label>
                  <input
                    type="number"
                    value={service.price ?? ""}
                    onChange={(e) => update("price", e.target.value ? e.target.valueAsNumber : null)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Discount</label>
                  <input
                    type="number"
                    value={service.discount ?? ""}
                    onChange={(e) => update("discount", e.target.value ? e.target.valueAsNumber : null)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-black mb-4">Media</h2>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Thumbnail</label>
                <ImageUploader
                  bucket="service-images"
                  value={service.thumbnail_url}
                  onChange={(url) => update("thumbnail_url", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Banner / Hero Image</label>
                <ImageUploader
                  bucket="service-images"
                  value={service.banner_url}
                  onChange={(url) => update("banner_url", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Meta Image (OG)</label>
                <ImageUploader
                  bucket="service-images"
                  value={service.meta_image_url}
                  onChange={(url) => update("meta_image_url", url)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-black mb-4">SEO Metadata</h2>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">SEO Title</label>
                <input
                  value={service.seo_title || ""}
                  onChange={(e) => update("seo_title", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">SEO Description</label>
                <textarea
                  value={service.seo_description || ""}
                  onChange={(e) => update("seo_description", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">SEO Keywords</label>
                <input
                  value={service.seo_keywords || ""}
                  onChange={(e) => update("seo_keywords", e.target.value)}
                  placeholder="e.g. web dev, full stack"
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all text-sm"
                />
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-admin-200">
        <div>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-admin-200 hover:bg-admin-50 rounded-lg transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
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
              disabled={saving || !service.title.trim() || !service.slug.trim()}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-admin-600 hover:bg-admin-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? "Saving..." : "Save Service"}
            </button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
