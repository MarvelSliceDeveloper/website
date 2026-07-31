import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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
FiChevronDown} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';

const STEPS = [
  { label: "Basics", icon: FiBookOpen },
  { label: "Media & Content", icon: FiMonitor },
  { label: "Curriculum & Pricing", icon: FiLayers },
  { label: "FAQs & Tags", icon: FiAward },
];

const HIGHLIGHT_ICONS = [
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
  const selected = HIGHLIGHT_ICONS.find((o) => o.key === value);
  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-medium text-neutral-500 mb-1">Icon</label>
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
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-admin-200 rounded-lg shadow-lg max-h-60 overflow-y-auto admin-scrollbar">
          {HIGHLIGHT_ICONS.map((opt) => (
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

const DURATIONS = ["1 month", "2 months", "3 months", "4 months", "6 months", "8 months", "12 months"];
const MODES = ["Online", "Offline"];

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export default function CourseWizard() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [courseTags, setCourseTags] = useState([]);
  const [navItemId, setNavItemId] = useState("");
  const [availablePaths, setAvailablePaths] = useState([]);
  const [catL1, setCatL1] = useState("");
  const [catL2, setCatL2] = useState("");
  const [catL3, setCatL3] = useState("");
  const [filterSection, setFilterSection] = useState(searchParams.get("category") || "Software Learning");
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);

  const [c, setC] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    hero_image_url: "",
    video_thumbnail_url: "",
    video_url: "",
    cta_left: "",
    cta_right: "",
    cta_heading: '',
    cta_description: '',
    cta_text: '',
    cta_link: '',
    cta_phone: '',
    cta_background_image: '',
    is_published: true,
    status: "Active",
    duration: "3 months",
    mode: "Online",
    checklist_items: [],
    tabs: [],
    highlights: [],
    overview_faqs: [],
    course_fees: [],
    show_pricing: false,
    projects: [],
    certifications: [{ description: "", image_url: "", certificate_image_url: "", recognized_companies: [] }],
    faqs: [],
    curriculum: [],
  });

  function resetCategoryPath() {
    setCatL1(""); setCatL2(""); setCatL3(""); setNavItemId("");
  }

  useEffect(() => {
    supabase.from("tags").select("*").order("name").then(({ data }) => setAllTags(data || []));
  }, []);

  useEffect(() => {
    if (!catL1) { setCatL2(""); setCatL3(""); setNavItemId(""); return; }
    const kids = getChildren(catL1);
    if (kids.length === 0) { setCatL2(""); setCatL3(""); setNavItemId(catL1); return; }
    setNavItemId("");
  }, [catL1]);

  useEffect(() => {
    if (!catL2) { setCatL3(""); setNavItemId(""); return; }
    const kids = getChildren(catL2);
    if (kids.length === 0) { setCatL3(""); setNavItemId(catL2); return; }
    setNavItemId("");
  }, [catL2]);

  useEffect(() => {
    if (catL3) setNavItemId(catL3);
  }, [catL3]);

  useEffect(() => {
    supabase
      .from("nav_items")
      .select("id, label, path, parent_label, parent_id")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const items = data || [];
        setAvailablePaths(items);
      });
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

  const categories = ["Software Learning", "Competitive Exam"];

  function u(field, val) {
    setC((prev) => ({ ...prev, [field]: val }));
  }

  function canNext() {
    if (step === 0) return c.title.trim() !== "" && c.slug.trim() !== "" && navItemId !== "";
    return true;
  }

  function getChildren(pid) {
    return availablePaths.filter((p) => p.parent_id === pid);
  }

  function findItem(id) {
    return availablePaths.find((p) => p.id === id);
  }

  function addModule() {
    u("curriculum", [...c.curriculum, { title: "", topics: [] }]);
  }

  function updateModule(i, field, val) {
    const next = [...c.curriculum];
    next[i] = { ...next[i], [field]: val };
    u("curriculum", next);
  }

  function addTopic(moduleIdx) {
    const next = [...c.curriculum];
    next[moduleIdx] = { ...next[moduleIdx], topics: [...(next[moduleIdx].topics || []), ""] };
    u("curriculum", next);
  }

  function updateTopic(moduleIdx, topicIdx, val) {
    const next = [...c.curriculum];
    const topics = [...(next[moduleIdx].topics || [])];
    topics[topicIdx] = val;
    next[moduleIdx] = { ...next[moduleIdx], topics };
    u("curriculum", next);
  }

  function removeTopic(moduleIdx, topicIdx) {
    const next = [...c.curriculum];
    next[moduleIdx] = { ...next[moduleIdx], topics: next[moduleIdx].topics.filter((_, j) => j !== topicIdx) };
    u("curriculum", next);
  }

  function removeModule(i) {
    u("curriculum", c.curriculum.filter((_, j) => j !== i));
  }

  function handleTitleChange(value) {
    u("title", value);
    if (!c.slug || c.slug === slugify(c.title)) {
      u("slug", slugify(value));
    }
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    setCreatingTag(true);
    const { data, error } = await supabase.from("tags").insert({ name }).select().single();
    if (!error && data) {
      setAllTags((prev) => [...prev, data]);
      setCourseTags((prev) => [...prev, data.id]);
      setNewTagName("");
    }
    setCreatingTag(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        title: c.title,
        slug: c.slug,
        subtitle: c.subtitle,
        description: c.description,
        hero_image_url: c.hero_image_url,
        video_thumbnail_url: c.video_thumbnail_url,
        video_url: c.video_url,
        cta_left: c.cta_left,
        cta_right: c.cta_right,
        cta_heading: c.cta_heading,
        cta_description: c.cta_description,
        cta_text: c.cta_text,
        cta_link: c.cta_link,
        cta_phone: c.cta_phone,
        cta_background_image: c.cta_background_image,
        is_published: c.is_published,
        status: c.status,
        duration: c.duration,
        mode: c.mode,
        checklist_items: (c.checklist_items || []).filter(Boolean),
        curriculum: c.curriculum,
        show_pricing: c.show_pricing,
        nav_item_id: navItemId || null,
      };

      const { data: newCourse, error } = await supabase.from("courses").insert(payload).select().single();
      if (error) throw error;

      const cid = newCourse.id;
      const inserts = [];

      if (c.tabs.length > 0)
        inserts.push(supabase.from("course_tabs").insert(c.tabs.map((t, i) => ({ ...t, course_id: cid, sort_order: i }))));
      if (c.highlights.length > 0)
        inserts.push(supabase.from("highlights").insert(c.highlights.map((h, i) => ({ ...h, course_id: cid, sort_order: i }))));
      if (c.overview_faqs.length > 0)
        inserts.push(supabase.from("overview_faqs").insert(c.overview_faqs.map((f, i) => ({ ...f, course_id: cid, sort_order: i }))));
      if (c.projects.length > 0)
        inserts.push(supabase.from("projects").insert(c.projects.map((p, i) => ({ ...p, course_id: cid, sort_order: i }))));
      if (c.certifications.length > 0)
        inserts.push(supabase.from("certifications").insert(c.certifications.map((x) => ({ ...x, course_id: cid }))));
      if (c.faqs.length > 0)
        inserts.push(supabase.from("faqs").insert(c.faqs.map((f, i) => ({ ...f, course_id: cid, sort_order: i }))));
      if (courseTags.length > 0)
        inserts.push(supabase.from("course_tags").insert(courseTags.map((tid) => ({ course_id: cid, tag_id: tid }))));

      const results = await Promise.all(inserts);
      for (const r of results) {
        if (r.error) throw new Error(r.error.message);
      }
      navigate("/admin/courses");
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
    <PageShell
      title="Create New Course"
      maxWidth="max-w-[1600px]"
    >

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
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
          {step === 0 && (
          <div className="space-y-6">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-admin-50 text-admin-600 rounded-md font-semibold text-sm border border-admin-200">
                Category: {filterSection}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                {filterSection && (() => {
                  const topLevel = availablePaths.filter((p) => p.parent_label === filterSection && !p.parent_id);
                  const kids1 = catL1 ? getChildren(catL1) : [];
                  const kids2 = catL2 ? getChildren(catL2) : [];
                  function dd(label, items, val, setter) {
                    return (
                      <div>
                        <label className="block text-sm font-semibold text-black mb-1">{label}</label>
                        <select
                          value={val}
                          onChange={(e) => setter(e.target.value)}
                          className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
                        >
                          <option value="">— Select —</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-3">
                      {dd(`Topic under ${filterSection}`, topLevel, catL1, setCatL1)}
                      {catL1 && kids1.length > 0 && dd(`Sub-topic under ${findItem(catL1)?.label || ''}`, kids1, catL2, setCatL2)}
                      {catL2 && kids2.length > 0 && dd(`Sub-topic under ${findItem(catL2)?.label || ''}`, kids2, catL3, setCatL3)}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Course Title *</label>
                <input
                  value={c.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="e.g. Full Stack Web Development"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-1">Slug *</label>
                <input
                  value={c.slug}
                  onChange={(e) => u("slug", slugify(e.target.value))}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500/20 font-mono text-sm transition-all"
                  placeholder="full-stack-web-development"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1">Subtitle</label>
              <input
                value={c.subtitle || ""}
                onChange={(e) => u("subtitle", e.target.value)}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500/20 transition-all"
                placeholder="A short tagline for the course"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1">Description</label>
              <textarea
                value={c.description || ""}
                onChange={(e) => u("description", e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500/20 transition-all"
                placeholder="Detailed course description..."
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Duration</label>
                <select
                  value={c.duration}
                  onChange={(e) => u("duration", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 bg-white"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Mode</label>
                <select
                  value={c.mode}
                  onChange={(e) => u("mode", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 bg-white"
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Status</label>
                <select
                  value={c.status}
                  onChange={(e) => u("status", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Coming Soon">Coming Soon</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-admin-200">
              <input type="checkbox" id="published" checked={c.is_published} onChange={(e) => u("is_published", e.target.checked)} className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-neutral-500/20" />
              <label htmlFor="published" className="text-sm font-medium text-black cursor-pointer">Published (visible on site)</label>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-black flex items-center gap-2"><FiMonitor className="w-5 h-5 text-cyan-600" /> Media</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Hero / Banner Image</label>
                <ImageUploader value={c.hero_image_url} onChange={(url) => u("hero_image_url", url)} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">Video Thumbnail</label>
                <ImageUploader value={c.video_thumbnail_url} onChange={(url) => u("video_thumbnail_url", url)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-1">Course Video (YouTube URL)</label>
              <input
                value={c.video_url || ""}
                onChange={(e) => u("video_url", e.target.value)}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500/20 text-sm transition-all"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <hr className="border-admin-200" />

            <h2 className="text-lg font-semibold text-black flex items-center gap-2"><FiBookOpen className="w-5 h-5 text-violet-600" /> Content</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">CTA Left</label>
                <input value={c.cta_left || ""} onChange={(e) => u("cta_left", e.target.value)} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="Enroll Now" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">CTA Right</label>
                <input value={c.cta_right || ""} onChange={(e) => u("cta_right", e.target.value)} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="Download Brochure" />
              </div>
            </div>

            <div className="border-t border-admin-200 pt-6 mt-2">
              <h3 className="text-sm font-semibold text-black mb-4 flex items-center gap-2">Call to Action Banner</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">CTA Heading</label>
                  <input value={c.cta_heading || ''} onChange={(e) => u("cta_heading", e.target.value)} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="Ready to start your learning journey?" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">CTA Description</label>
                  <textarea value={c.cta_description || ''} onChange={(e) => u("cta_description", e.target.value)} rows={2} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="Enroll now and gain industry-ready skills with expert mentors." />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Button Text</label>
                    <input value={c.cta_text || ''} onChange={(e) => u("cta_text", e.target.value)} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="Enroll Now" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Button Link (URL)</label>
                    <input value={c.cta_link || ''} onChange={(e) => u("cta_link", e.target.value)} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="/courses or https://..." />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Phone Number (tel:)</label>
                  <input value={c.cta_phone || ''} onChange={(e) => u("cta_phone", e.target.value)} className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-500/20 text-sm transition-all" placeholder="+916380957390" />
                </div>
                <div>
                  <ImageUploader value={c.cta_background_image || ''} onChange={(v) => u("cta_background_image", v)} label="Background Image" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-1">What You'll Learn (one per line)</label>
              <textarea
                value={(c.checklist_items || []).join("\n")}
                onChange={(e) => u("checklist_items", e.target.value.split("\n"))}
                rows={4}
                className="w-full px-3 py-2.5 border border-admin-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-500/20 transition-all"
                placeholder="Live classes&#10;Industry mentors&#10;Placement assistance"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">Course Tabs</h3>
                <AdminButton onClick={() => u("tabs", [...c.tabs, { label: "New Tab", content_type: "overview", content: {} }])} variant="ghost" size="sm" className="text-admin-600 font-semibold">
                  <FiPlus className="w-4 h-4" /> Add Tab
                </AdminButton>
              </div>
              <div className="space-y-3">
                {c.tabs.map((t, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button onClick={() => u("tabs", c.tabs.filter((_, j) => j !== i))} className="absolute top-3 right-3 p-1 text-red-500 hover:text-red-600 rounded hover:bg-destructive-50 transition-colors">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Label</label>
                        <input value={t.label || ""} onChange={(e) => { const n = [...c.tabs]; n[i] = { ...n[i], label: e.target.value }; u("tabs", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Type</label>
                        <select value={t.content_type || "overview"} onChange={(e) => { const n = [...c.tabs]; n[i] = { ...n[i], content_type: e.target.value }; u("tabs", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 bg-white">
                          <option value="overview">Overview</option>
                          <option value="syllabus">Syllabus</option>
                          <option value="pricing">Pricing</option>
                          <option value="apply_now">Apply Now</option>
                        </select>
                      </div>
                    </div>
                    {(t.content_type === "overview" ||
                      t.content_type === "syllabus") && (
                      <div className="mt-3 space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Heading (centered)</label>
                          <input value={t.content?.heading || ""} onChange={(e) => { const n = [...c.tabs]; n[i] = { ...n[i], content: { ...n[i].content, heading: e.target.value } }; u("tabs", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20" placeholder="Main heading" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Paragraph</label>
                          <textarea value={t.content?.paragraph || ""} onChange={(e) => { const n = [...c.tabs]; n[i] = { ...n[i], content: { ...n[i].content, paragraph: e.target.value } }; u("tabs", n); }} rows={2} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20" placeholder="Paragraph text" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-500 mb-1">Sub Heading</label>
                          <input value={t.content?.subheading || ""} onChange={(e) => { const n = [...c.tabs]; n[i] = { ...n[i], content: { ...n[i].content, subheading: e.target.value } }; u("tabs", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20" placeholder="Sub heading" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-neutral-500">Q&A Items</label>
                            <button onClick={() => { const n = [...c.tabs]; const qa = [...(n[i].content?.qa || []), { question: "", answers: [""] }]; n[i] = { ...n[i], content: { ...n[i].content, qa } }; u("tabs", n); }} className="text-xs text-admin-600 font-semibold hover:underline">+ Add Question</button>
                          </div>
                          <div className="space-y-3">
                            {(t.content?.qa || []).map((qa, qi) => (
                              <div key={qi} className="border border-admin-200 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-neutral-400">Question {qi + 1}</span>
                                  <button onClick={() => { const n = [...c.tabs]; const qa = n[i].content.qa.filter((_, j) => j !== qi); n[i] = { ...n[i], content: { ...n[i].content, qa } }; u("tabs", n); }} className="text-xs text-destructive-500 hover:underline">Remove</button>
                                </div>
                                <input value={qa.question} onChange={(e) => { const n = [...c.tabs]; const qa = [...n[i].content.qa]; qa[qi] = { ...qa[qi], question: e.target.value }; n[i] = { ...n[i], content: { ...n[i].content, qa } }; u("tabs", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 mb-2" placeholder="Question" />
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-neutral-400">Answers (one per line)</span>
                                    <button onClick={() => { const n = [...c.tabs]; const qa = [...n[i].content.qa]; qa[qi] = { ...qa[qi], answers: [...qa[qi].answers, ""] }; n[i] = { ...n[i], content: { ...n[i].content, qa } }; u("tabs", n); }} className="text-xs text-admin-600 hover:underline">+ Add bullet</button>
                                  </div>
                                  {qa.answers.map((ans, ai) => (
                                    <div key={ai} className="flex items-center gap-2 mb-1">
                                      <span className="text-xs text-neutral-300">•</span>
                                      <input value={ans} onChange={(e) => { const n = [...c.tabs]; const qa = [...n[i].content.qa]; const an = [...qa[qi].answers]; an[ai] = e.target.value; qa[qi] = { ...qa[qi], answers: an }; n[i] = { ...n[i], content: { ...n[i].content, qa } }; u("tabs", n); }} className="flex-1 px-2 py-1 border border-admin-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20" placeholder="Answer bullet" />
                                      <button onClick={() => { const n = [...c.tabs]; const qa = [...n[i].content.qa]; qa[qi] = { ...qa[qi], answers: qa[qi].answers.filter((_, j) => j !== ai) }; n[i] = { ...n[i], content: { ...n[i].content, qa } }; u("tabs", n); }} className="text-xs text-red-500 hover:text-red-600">×</button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black flex items-center gap-2"><FiLayers className="w-5 h-5 text-cyan-600" /> Curriculum / Modules</h2>
                <AdminButton onClick={addModule} variant="ghost" size="sm" className="text-admin-600 font-semibold"><FiPlus className="w-4 h-4" /> Add Module</AdminButton>
              </div>
              <div className="space-y-3">
                {c.curriculum.map((mod, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Module {i + 1}</span>
                      <button onClick={() => removeModule(i)} className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-destructive-50 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      value={mod.title}
                      onChange={(e) => updateModule(i, "title", e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-500/20 mb-3"
                      placeholder="Module title (e.g. Introduction to HTML)"
                    />
                    <div className="space-y-2">
                      {mod.topics?.map((topic, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 w-5 text-right">{j + 1}.</span>
                          <input
                            value={topic}
                            onChange={(e) => updateTopic(i, j, e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20"
                            placeholder="Topic"
                          />
                          <button onClick={() => removeTopic(i, j)} className="p-1 text-destructive-300 hover:text-destructive-500 transition-colors">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <AdminButton onClick={() => addTopic(i)} variant="ghost" size="xs" className="text-admin-600 font-semibold"><FiPlus className="w-3 h-3" /> Add Topic</AdminButton>
                    </div>
                  </div>
                ))}
                {c.curriculum.length === 0 && (
                  <div className="text-center py-8 text-neutral-400 bg-white rounded-lg border-2 border-dashed border-admin-200">
                    <FiLayers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No modules yet. Click "Add Module" to build your curriculum.</p>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-admin-200" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">Key Highlights</h3>
                <AdminButton onClick={() => u("highlights", [...c.highlights, { icon: "", label: "" }])} variant="ghost" size="sm" className="text-admin-600 font-semibold"><FiPlus className="w-4 h-4" /> Add</AdminButton>
              </div>
              <div className="space-y-3">
                {c.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 border border-admin-200 rounded-lg p-3">
                    <div className="w-32">
                      <IconPicker
                        value={h.icon || ""}
                        onChange={(val) => { const n = [...c.highlights]; n[i] = { ...n[i], icon: val }; u("highlights", n); }}
                      />
                    </div>
                    <input value={h.label || ""} onChange={(e) => { const n = [...c.highlights]; n[i] = { ...n[i], label: e.target.value }; u("highlights", n); }} className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20" placeholder="Label" />
                    <button onClick={() => u("highlights", c.highlights.filter((_, j) => j !== i))} className="p-1 text-red-500 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-admin-200">
              <input type="checkbox" id="show_pricing" checked={c.show_pricing} onChange={(e) => u("show_pricing", e.target.checked)} className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-neutral-500/20" />
              <label htmlFor="show_pricing" className="text-sm font-medium text-black cursor-pointer">Show pricing on page</label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-black">Projects</h3>
                <AdminButton onClick={() => u("projects", [...c.projects, { title: "", description: "" }])} variant="ghost" size="sm" className="text-admin-600 font-semibold"><FiPlus className="w-4 h-4" /> Add</AdminButton>
              </div>
              <div className="space-y-3">
                {c.projects.map((p, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button onClick={() => u("projects", c.projects.filter((_, j) => j !== i))} className="absolute top-3 right-3 p-1 text-red-500 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                    <input value={p.title || ""} onChange={(e) => { const n = [...c.projects]; n[i] = { ...n[i], title: e.target.value }; u("projects", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 mb-2" placeholder="Project title" />
                    <textarea value={p.description || ""} onChange={(e) => { const n = [...c.projects]; n[i] = { ...n[i], description: e.target.value }; u("projects", n); }} rows={2} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20" placeholder="Description..." />
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
                <h3 className="text-sm font-semibold text-black">General FAQs</h3>
                <AdminButton onClick={() => u("faqs", [...c.faqs, { question: "", answer: "" }])} variant="ghost" size="sm" className="text-admin-600 font-semibold"><FiPlus className="w-4 h-4" /> Add FAQ</AdminButton>
              </div>
              <div className="space-y-3">
                {c.faqs.map((f, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-4 relative">
                    <button onClick={() => u("faqs", c.faqs.filter((_, j) => j !== i))} className="absolute top-3 right-3 p-1 text-red-500 hover:text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                    <input value={f.question || ""} onChange={(e) => { const n = [...c.faqs]; n[i] = { ...n[i], question: e.target.value }; u("faqs", n); }} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 mb-2" placeholder="Question" />
                    <textarea value={f.answer || ""} onChange={(e) => { const n = [...c.faqs]; n[i] = { ...n[i], answer: e.target.value }; u("faqs", n); }} rows={2} className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20" placeholder="Answer..." />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-black mb-3">Tags *</h3>
              {courseTags.length === 0 && (
                <p className="text-xs text-destructive-500 mb-2">Select at least one tag to enable saving</p>
              )}
              {allTags.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  No tags available. Create them in{' '}
                  <Link to="/admin/tags" className="text-admin-600 hover:underline">Tags Manager</Link>.
                </p>
              ) : (
                <div className="relative">
                  <div
                    onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                    className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-admin-200 bg-white text-sm focus-within:ring-2 focus-within:ring-admin-500/20 focus-within:border-admin-500 cursor-pointer flex flex-wrap gap-1 items-center"
                  >
                    {courseTags.length === 0 && <span className="text-neutral-400">Select tags...</span>}
                    {courseTags.map(id => {
                      const tag = allTags.find(t => t.id === id);
                      return tag ? (
                        <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-admin-100 text-admin-700 rounded-md text-xs font-medium">
                          {tag.name}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCourseTags(courseTags.filter(t => t !== id)); }}
                            className="hover:text-admin-900"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  {tagsDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setTagsDropdownOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-white border border-admin-200 rounded-lg shadow-lg z-20 py-1">
                        {allTags.map(tag => (
                          <label key={tag.id} className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={courseTags.includes(tag.id)}
                              onChange={() => {
                                setCourseTags(prev => prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]);
                              }}
                              className="rounded border-admin-300 text-admin-600 focus:ring-admin-500"
                            />
                            <span className="text-sm text-neutral-700">{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mt-4">
                <input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                  placeholder="New tag name..."
                />
                <AdminButton onClick={handleCreateTag} disabled={creatingTag || !newTagName.trim()} variant="primary" size="sm">
                  {creatingTag ? "..." : "Create"}
                </AdminButton>
              </div>
            </div>
          </div>
        )}
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
              disabled={saving || !c.title.trim() || !c.slug.trim() || !navItemId || courseTags.length === 0}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-sm font-medium text-white bg-admin-600 hover:bg-admin-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {saving ? "Saving..." : "Save Course"}
            </button>
          )}
        </div>
      </div>

    </PageShell>
  );
}
