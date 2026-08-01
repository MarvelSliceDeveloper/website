import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabaseClient";
import ImageUploader from "../components/ImageUploader";
import AdminButton from "../components/AdminButton";
import { FiPlus, FiTrash2, FiMove, FiArrowLeft, FiLayers, FiCheck, FiClock, FiVideo, FiCode, FiAward, FiCalendar, FiRefreshCw, FiMessageCircle, FiUsers, FiStar, FiBarChart2, FiBookOpen, FiBriefcase, FiTarget, FiGlobe, FiCpu, FiDatabase, FiZap, FiShield, FiTrendingUp, FiChevronDown, FiChevronUp, FiSettings, FiFileText, FiTag, FiAlertCircle, FiSave, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';
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
      <AdminButton onClick={addItem} variant="ghost" size="sm">
        <FiPlus className="w-4 h-4" /> Add {labelKey}
      </AdminButton>
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
  curriculum: { label: "Curriculum", Icon: FiLayers },
  hero: { label: "Hero", Icon: FiVideo },
  tabs: { label: "Tabs", Icon: FiFileText },
  highlights: { label: "Highlights", Icon: FiStar },
  projects: { label: "Projects", Icon: FiBriefcase },
  certification: { label: "Certification", Icon: FiAward },
  faqs: { label: "FAQs", Icon: FiMessageCircle },
  tags: { label: "Tags", Icon: FiTag },
};

const editorTabs = Object.keys(tabMeta);

export default function CourseEditor() {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get("return") || "/admin/courses";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = id === "new";
  const [tab, setTab] = useState("basic");
  const sidebarOpen = true;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [courseTags, setCourseTags] = useState([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [navItems, setNavItems] = useState([]);
  const [availablePaths, setAvailablePaths] = useState([]);
  const [catL1, setCatL1] = useState("");
  const [catL2, setCatL2] = useState("");
  const [catL3, setCatL3] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    hero_image_url: "",
    video_thumbnail_url: "",
    video_url: "",
    nav_item_id: "",
    is_published: true,
    duration: "3 months",
    mode: "Online",
    status: "Active",
    checklist_items: [],
    highlights: [],
    overview_faqs: [],
    course_fees: [],
    show_pricing: false,
    cta_heading: '',
    cta_description: '',
    cta_text: '',
    cta_link: '',
    cta_phone: '',
    cta_background_image: '',
    projects: [],
    certifications: [],
    faqs: [],
    tabs: [],
    curriculum: [],
  });

  const { dirty, reset } = useDirty([course, courseTags], loading);

  useEffect(() => {
    async function fetchData() {
      const [{ data: tagsData }, { data: navData }] = await Promise.all([
        supabase.from("tags").select("*").order("name"),
        supabase.from("nav_items").select("*").order("sort_order")
      ]);
      setAllTags(tagsData || []);
      setNavItems(navData || []);
      setAvailablePaths(navData || []);

      if (!isNew) {
        const [courseRes, tabsRes, faqsRes, tagsRes] = await Promise.all([
          supabase.from("courses").select(`*, highlights(*), overview_faqs(*), course_fees(*), projects(*), certifications(*)`).eq("id", id).single(),
          supabase.from("course_tabs").select("*").eq("course_id", id).order("sort_order"),
          supabase.from("faqs").select("*").eq("course_id", id).order("sort_order"),
          supabase.from("course_tags").select("tag_id").eq("course_id", id),
        ]);

        if (courseRes.data && !courseRes.error) {
          setCourse((p) => ({ ...p, ...courseRes.data, tabs: tabsRes.data || [], faqs: faqsRes.data || [] }));
        }
        setCourseTags(tagsRes.data?.map((t) => t.tag_id) || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, isNew]);

  useEffect(() => {
    if (!catL1) { setCatL2(""); setCatL3(""); return; }
    const kids = getChildren(catL1);
    if (kids.length === 0) { setCatL2(""); setCatL3("");
      const item = findItem(catL1);
      if (item) update("nav_item_id", catL1);
      return;
    }
  }, [catL1]);

  useEffect(() => {
    if (!catL2) { setCatL3("");
      if (course.nav_item_id) {
        const item = findItem(course.nav_item_id);
        if (item && item.parent_id === catL1) update("nav_item_id", catL2);
      }
      return;
    }
    const kids = getChildren(catL2);
    if (kids.length === 0) { setCatL3("");
      const item = findItem(catL2);
      if (item) update("nav_item_id", catL2);
      return;
    }
  }, [catL2]);

  useEffect(() => {
    if (catL3) {
      const item = findItem(catL3);
      if (item) update("nav_item_id", catL3);
    }
  }, [catL3]);

  useEffect(() => {
    if (course.nav_item_id && availablePaths.length > 0) {
      setNavItemIdFromPath(course.nav_item_id);
    }
  }, [course.nav_item_id, availablePaths.length]);

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

  function getChildren(pid) {
    return availablePaths.filter((p) => p.parent_id === pid);
  }

  function findItem(id) {
    return availablePaths.find((p) => p.id === id);
  }

  function resetCategoryPath() {
    setCatL1(""); setCatL2(""); setCatL3("");
  }

  function setNavItemIdFromPath(navId) {
    if (!navId || availablePaths.length === 0) return;
    const item = findItem(navId);
    if (!item) return;
    const section = !item.parent_id
      ? item.parent_label
      : (findItem(item.parent_id)?.parent_label);
    if (section === "Software Learning" || section === "Competitive Exam") {
      setFilterSection(section);
    }
    if (!item.parent_id) {
      setCatL1(navId);
    } else {
      const parent = findItem(item.parent_id);
      if (parent) {
        if (!parent.parent_id) {
          setCatL1(parent.id);
          setCatL2(navId);
        } else {
          const grandparent = findItem(parent.parent_id);
          if (grandparent) {
            setCatL1(grandparent.id);
            setCatL2(parent.id);
            setCatL3(navId);
          }
        }
      }
    }
  }

  const categories = ["Software Learning", "Competitive Exam"];

  function update(field, value) {
    setCourse((prev) => ({ ...prev, [field]: value }));
  }

  function handleCourseTagsChange(newTags) {
    setCourseTags(newTags);
  }

  async function saveRelated(table, records) {
    const { error: delErr } = await supabase.from(table).delete().eq("course_id", id);
    if (delErr) throw new Error(delErr.message);
    if (records.length > 0) {
      const clean = records.map((r, i) => {
        const { id: _, ...rest } = r;
        return { ...rest, course_id: id, sort_order: i };
      });
      const { error: insErr } = await supabase.from(table).insert(clean);
      if (insErr) throw new Error(insErr.message);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        description: course.description,
        hero_image_url: course.hero_image_url,
        video_thumbnail_url: course.video_thumbnail_url,
        video_url: course.video_url,
        nav_item_id: course.nav_item_id || null,
        show_pricing: course.show_pricing,
        cta_heading: course.cta_heading,
        cta_description: course.cta_description,
        cta_text: course.cta_text,
        cta_link: course.cta_link,
        cta_phone: course.cta_phone,
        cta_background_image: course.cta_background_image,
        is_published: course.is_published,
        duration: course.duration,
        mode: course.mode,
        status: course.status,
        checklist_items: (course.checklist_items || []).filter(Boolean),
        curriculum: course.curriculum,
      };
      if (isNew) {
        const { data, error } = await supabase
          .from("courses")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (course.certifications.length > 0) {
          const cleanCert = course.certifications.map((c) => {
            const { id: _, ...rest } = c;
            return { ...rest, course_id: data.id };
          });
          const { error: certErr } = await supabase.from("certifications").insert(cleanCert);
          if (certErr) throw new Error(certErr.message);
        }
      } else {
        const { error } = await supabase
          .from("courses")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        await saveRelated("highlights", course.highlights);
        await saveRelated("overview_faqs", course.overview_faqs);
        await saveRelated("projects", course.projects);
        await saveRelated("course_tabs", course.tabs);
        await supabase.from("certifications").delete().eq("course_id", id);
        if (course.certifications.length > 0) {
          const cleanCert = course.certifications.map((c) => {
            const { id: _, ...rest } = c;
            return { ...rest, recognized_companies: (rest.recognized_companies || []).filter(Boolean), course_id: id };
          });
          const { error: certErr } = await supabase.from("certifications").insert(cleanCert);
          if (certErr) throw new Error(certErr.message);
        }
        await supabase.from("faqs").delete().eq("course_id", id);
        if (course.faqs.length > 0) {
          const cleanFaqs = course.faqs.map((f, i) => {
            const { id: _, ...rest } = f;
            return { ...rest, course_id: id, sort_order: i };
          });
          const { error: faqsErr } = await supabase.from("faqs").insert(cleanFaqs);
          if (faqsErr) throw new Error(faqsErr.message);
        }
        await supabase.from("course_tags").delete().eq("course_id", id);
        if (courseTags.length > 0) {
          await supabase
            .from("course_tags")
            .insert(
              courseTags.map((tagId) => ({ course_id: id, tag_id: tagId })),
            );
        }
      }
      queryClient.invalidateQueries({ queryKey: ['course', course.slug] });
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCourses'] });
      queryClient.invalidateQueries({ queryKey: ['courseNavCategories'] });
      setMessage("Course saved successfully.");
      setSaved(true);
      reset();
      setTimeout(() => navigate(returnUrl, { replace: true }), 500);
      setTimeout(() => setSaved(false), 2000);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.message);
      setSaveError(err.message);
    }
    setSaving(false);
  }

  return (
    <PageShell
      backTo="/admin/courses"
      title={isNew ? "New Course" : `Edit: ${course.title || "Untitled"}`}
    >
      {message && (
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-xl animate-fade-in-up pointer-events-auto min-w-[300px] ${
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

      <div className="flex gap-6 items-start">
        <div className="transition-all duration-200 w-[220px] shrink-0">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-visible">
            <div className="bg-white rounded-md flex flex-col overflow-visible ring-1 ring-gray-300" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
              {editorTabs.map((t, index) => {
                const meta = tabMeta[t];
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative w-full flex items-center gap-2 text-left px-4 py-3 border-b border-gray-100 last:border-b-0 focus:outline-none ${
                      index === 0 ? 'rounded-t-md' : ''
                    } ${
                      index === editorTabs.length - 1 ? 'rounded-b-md' : ''
                    } ${
                      isActive ? 'bg-admin-600 text-white shadow-md z-10' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title={meta.label}
                  >
                    <meta.Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-neutral-400'
                    }`} />
                    <span className="font-semibold text-sm flex-1 truncate">{meta.label}</span>
                    {isActive && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-[15px] w-0 h-0 border-y-[15px] border-y-transparent border-l-[30px] border-l-admin-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="flex-1 min-w-0">
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
                    value={course.title}
                    onChange={(e) => update("title", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Slug *
                  </label>
                  <input
                    value={course.slug}
                    onChange={(e) => update("slug", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Subtitle
                </label>
                <input
                  value={course.subtitle || ""}
                  onChange={(e) => update("subtitle", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Description
                </label>
                <textarea
                  value={course.description || ""}
                  onChange={(e) => update("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
              </div>
              <div className="border-t border-admin-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Hero Section</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Feature Bullet Points (one per line)</label>
                    <textarea
                      value={(course.checklist_items || []).join('\n')}
                      onChange={(e) => update("checklist_items", e.target.value.split('\n').filter(Boolean))}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      placeholder="Expert Led Live Training Sessions&#10;Angular Fundamentals to Advanced Concepts&#10;Real Time Project Development Experience"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Left Button Label</label>
                      <input value={course.cta_left || ''} onChange={(e) => update('cta_left', e.target.value)}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        placeholder="Talk to Advisor" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Right Button Label</label>
                      <input value={course.cta_right || ''} onChange={(e) => update('cta_right', e.target.value)}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        placeholder="Download Brochure" />
                    </div>
                  </div>
                </div>
              </div>
              {categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Category *</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setFilterSection(cat); resetCategoryPath(); }}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          filterSection === cat
                            ? "border-admin-500 bg-white text-admin-600"
                            : "border-admin-200 text-admin-600 hover:border-admin-300 hover:bg-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Duration</label>
                  <select value={course.duration} onChange={(e) => update("duration", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white">
                    {["1 month","2 months","3 months","4 months","6 months","8 months","12 months"].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Mode</label>
                  <select value={course.mode} onChange={(e) => update("mode", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white">
                    {["Online","Offline"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">Status</label>
                  <select value={course.status} onChange={(e) => update("status", e.target.value)}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white">
                    <option value="Active">Active</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={course.is_published}
                  onChange={(e) => update("is_published", e.target.checked)}
                  className="rounded"
                />
                Published
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={course.show_pricing}
                  onChange={(e) => update("show_pricing", e.target.checked)}
                  className="rounded"
                />
                Show pricing on page
              </label>

              <div className="border-t border-admin-200 pt-6 mt-6">
                <h3 className="text-sm font-semibold text-neutral-700 mb-4">Call to Action</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">CTA Heading</label>
                    <input value={course.cta_heading || ''} onChange={(e) => update('cta_heading', e.target.value)}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      placeholder="Ready to start your learning journey?" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">CTA Description</label>
                    <textarea value={course.cta_description || ''} onChange={(e) => update('cta_description', e.target.value)} rows={2}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      placeholder="Enroll now and gain industry-ready skills with expert mentors." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Button Text</label>
                      <input value={course.cta_text || ''} onChange={(e) => update('cta_text', e.target.value)}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        placeholder="Enroll Now" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">Button Link (URL)</label>
                      <input value={course.cta_link || ''} onChange={(e) => update('cta_link', e.target.value)}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        placeholder="/courses or https://..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Phone Number (tel:)</label>
                    <input value={course.cta_phone || ''} onChange={(e) => update('cta_phone', e.target.value)}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      placeholder="+916380957390" />
                  </div>
                  <div>
                    <ImageUploader value={course.cta_background_image || ''} onChange={(v) => update('cta_background_image', v)} label="Background Image" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "curriculum" && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black">Curriculum / Modules</h2>
                <AdminButton onClick={() => update("curriculum", [...course.curriculum, { title: "", topics: [] }])} variant="ghost" size="sm">
                  <FiPlus className="w-4 h-4" /> Add Module
                </AdminButton>
              </div>
              {course.curriculum.length === 0 && (
                <div className="text-center py-12 text-neutral-400 bg-white rounded-xl border-2 border-dashed border-admin-200">
                  <FiLayers className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No modules yet. Click "Add Module" to build your curriculum.</p>
                </div>
              )}
              <div className="space-y-3">
                {course.curriculum.map((mod, i) => (
                  <div key={i} className="border border-admin-200 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Module {i + 1}</span>
                      <button onClick={() => update("curriculum", course.curriculum.filter((_, j) => j !== i))}
                        className="p-1 text-red-500 hover:text-red-600 rounded hover:bg-destructive-50 transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input value={mod.title || ""}
                      onChange={(e) => { const n = [...course.curriculum]; n[i] = { ...n[i], title: e.target.value }; update("curriculum", n); }}
                      className="w-full px-3 py-2.5 border border-admin-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-admin-500 focus:border-admin-500 mb-3"
                      placeholder="Module title (e.g. Introduction to HTML)" />
                    <div className="space-y-2">
                      {(mod.topics || []).map((topic, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400 w-5 text-right shrink-0">{j + 1}.</span>
                          <input value={topic}
                            onChange={(e) => { const n = [...course.curriculum]; const topics = [...(n[i].topics || [])]; topics[j] = e.target.value; n[i] = { ...n[i], topics }; update("curriculum", n); }}
                            className="flex-1 px-3 py-1.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500"
                            placeholder="Topic" />
                          <button onClick={() => { const n = [...course.curriculum]; n[i] = { ...n[i], topics: n[i].topics.filter((_, k) => k !== j) }; update("curriculum", n); }}
                            className="p-1 text-destructive-300 hover:text-destructive-500 transition-colors">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <AdminButton onClick={() => { const n = [...course.curriculum]; n[i] = { ...n[i], topics: [...(n[i].topics || []), ""] }; update("curriculum", n); }}
                        variant="ghost" size="xs"><FiPlus className="w-3 h-3" /> Add Topic</AdminButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "hero" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Hero Image
                </label>
                <ImageUploader
                  bucket="hero-images"
                  value={course.hero_image_url}
                  onChange={(url) => update("hero_image_url", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Video Thumbnail
                </label>
                <ImageUploader
                  bucket="hero-images"
                  value={course.video_thumbnail_url}
                  onChange={(url) => update("video_thumbnail_url", url)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Course Introduction Video URL (YouTube)
                </label>
                <input
                  value={course.video_url || ""}
                  onChange={(e) => update("video_url", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            </div>
          )}

          {tab === "tabs" && !isNew && (
            <div className="space-y-6">
              <h3 className="font-semibold text-black mb-3">Course Tabs</h3>
              {course.tabs.map((t, i) => (
                <div
                  key={t.id || i}
                  className="border border-admin-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-black mb-1">
                        Label
                      </label>
                      <input
                        value={t.label}
                        onChange={(e) => {
                          const n = [...course.tabs];
                          n[i] = { ...n[i], label: e.target.value };
                          update("tabs", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-black mb-1">
                        Content Type
                      </label>
                      <select
                        value={t.content_type}
                        onChange={(e) => {
                          const n = [...course.tabs];
                          n[i] = { ...n[i], content_type: e.target.value };
                          update("tabs", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      >
                        <option value="overview">Overview</option>
                        <option value="syllabus">Syllabus</option>
                        <option value="pricing">Pricing</option>
                        <option value="apply_now">Apply Now</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={async () => {
                          await supabase
                            .from("course_tabs")
                            .delete()
                            .eq("id", t.id);
                          update(
                            "tabs",
                            course.tabs.filter((_, j) => j !== i),
                          );
                        }}
                        className="text-destructive-500 hover:text-destructive-700 text-sm px-3 py-2"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {["heading","paragraph","subheading","text"].map(field => {
                      const alignKey = field + "Align";
                      const align = t.content?.[alignKey] || "center";
                      return (
                        <div key={field}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-medium text-neutral-500 capitalize">{field}</label>
                            <div className="flex items-center gap-1">
                              {["left","center","right"].map(a => (
                                <button
                                  key={a}
                                  type="button"
                                  onClick={() => {
                                    const n = [...course.tabs];
                                    n[i] = { ...n[i], content: { ...n[i].content, [alignKey]: a } };
                                    update("tabs", n);
                                  }}
                                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold border transition-colors ${
                                    align === a
                                      ? "bg-admin-100 border-admin-500 text-admin-700"
                                      : "border-admin-200 text-admin-400 hover:border-admin-300"
                                  }`}
                                  title={`Align ${a}`}
                                >
                                  {a === "left" ? "≡" : a === "center" ? "≣" : "≡"}
                                </button>
                              ))}
                            </div>
                          </div>
                          {field === "text" || field === "paragraph" ? (
                            <textarea
                              value={t.content?.[field] || ""}
                              onChange={(e) => {
                                const n = [...course.tabs];
                                n[i] = { ...n[i], content: { ...n[i].content, [field]: e.target.value } };
                                update("tabs", n);
                              }}
                              rows={field === "text" ? 6 : 2}
                              className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                              placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} content`}
                            />
                          ) : (
                            <input
                              value={t.content?.[field] || ""}
                              onChange={(e) => {
                                const n = [...course.tabs];
                                n[i] = { ...n[i], content: { ...n[i].content, [field]: e.target.value } };
                                update("tabs", n);
                              }}
                              className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                              placeholder={`${field.charAt(0).toUpperCase() + field.slice(1)} content`}
                            />
                          )}
                        </div>
                      );
                    })}
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-neutral-500">Q&A Items</label>
                        <button
                          onClick={() => {
                            const n = [...course.tabs];
                            const qa = [...(n[i].content?.qa || []), { question: "", answers: [""] }];
                            n[i] = { ...n[i], content: { ...n[i].content, qa } };
                            update("tabs", n);
                          }}
                          className="text-xs text-admin-600 font-semibold hover:underline"
                        >
                          + Add Question
                        </button>
                      </div>
                      <div className="space-y-3">
                        {(t.content?.qa || []).map((qa, qi) => (
                          <div key={qi} className="border border-admin-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-neutral-500">Question {qi + 1}</span>
                              <button
                                onClick={() => {
                                  const n = [...course.tabs];
                                  const qa = n[i].content.qa.filter((_, j) => j !== qi);
                                  n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                  update("tabs", n);
                                }}
                                className="text-xs text-destructive-500 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              value={qa.question}
                              onChange={(e) => {
                                const n = [...course.tabs];
                                const qa = [...n[i].content.qa];
                                qa[qi] = { ...qa[qi], question: e.target.value };
                                n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                update("tabs", n);
                              }}
                              className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all mb-2"
                              placeholder="Question"
                            />
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-neutral-500">Answers (one per line)</span>
                                <button
                                  onClick={() => {
                                    const n = [...course.tabs];
                                    const qa = [...n[i].content.qa];
                                    qa[qi] = { ...qa[qi], answers: [...qa[qi].answers, ""] };
                                    n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                    update("tabs", n);
                                  }}
                                  className="text-xs text-admin-600 hover:underline"
                                >
                                  + Add bullet
                                </button>
                              </div>
                              {qa.answers.map((ans, ai) => (
                                <div key={ai} className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-neutral-400">•</span>
                                  <input
                                    value={ans}
                                    onChange={(e) => {
                                      const n = [...course.tabs];
                                      const qa = [...n[i].content.qa];
                                      const answers = [...qa[qi].answers];
                                      answers[ai] = e.target.value;
                                      qa[qi] = { ...qa[qi], answers };
                                      n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                      update("tabs", n);
                                    }}
                                    className="flex-1 px-2 py-1 border border-admin-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-admin-500"
                                    placeholder="Answer bullet"
                                  />
                                  <button
                                    onClick={() => {
                                      const n = [...course.tabs];
                                      const qa = [...n[i].content.qa];
                                      qa[qi] = { ...qa[qi], answers: qa[qi].answers.filter((_, j) => j !== ai) };
                                      n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                      update("tabs", n);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-600"
                                    >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={async () => {
                  const { data } = await supabase
                    .from("course_tabs")
                    .insert({
                      course_id: id,
                      label: "New Tab",
                      content_type: "overview",
                      content: {},
                      sort_order: course.tabs.length,
                    })
                    .select()
                    .single();
                  if (data) update("tabs", [...course.tabs, data]);
                }}
                className="bg-admin-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-admin-700 transition-colors"
              >
                Add Tab
              </button>
            </div>
          )}

          {tab === "highlights" && !isNew && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">
                Key Highlights
              </h3>
              <div className="space-y-6">
                {course.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="border border-admin-200 rounded-lg p-4 space-y-3 relative"
                  >
                    <button
                      onClick={() =>
                        update(
                          "highlights",
                          course.highlights.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <IconPicker
                      value={h.icon || ""}
                      onChange={(val) => {
                        const n = [...course.highlights];
                        n[i] = { ...n[i], icon: val };
                        update("highlights", n);
                      }}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Label
                      </label>
                      <input
                        value={h.label || ""}
                        onChange={(e) => {
                          const n = [...course.highlights];
                          n[i] = { ...n[i], label: e.target.value };
                          update("highlights", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <AdminButton
                  onClick={() =>
                    update("highlights", [
                      ...course.highlights,
                      { icon: "", label: "" },
                    ])
                  }
                  variant="ghost"
                  size="sm"
                >
                  <FiPlus className="w-4 h-4" /> Add Highlight
                </AdminButton>
              </div>
            </div>
          )}

          {tab === "projects" && !isNew && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Projects</h3>
              <div className="space-y-6">
                {course.projects.map((p, i) => (
                  <div
                    key={i}
                    className="border border-admin-200 rounded-lg p-4 space-y-3 relative"
                  >
                    <button
                      onClick={() =>
                        update(
                          "projects",
                          course.projects.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Title
                      </label>
                      <input
                        value={p.title || ""}
                        onChange={(e) => {
                          const n = [...course.projects];
                          n[i] = { ...n[i], title: e.target.value };
                          update("projects", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Description
                      </label>
                      <textarea
                        value={p.description || ""}
                        onChange={(e) => {
                          const n = [...course.projects];
                          n[i] = { ...n[i], description: e.target.value };
                          update("projects", n);
                        }}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <AdminButton
                  onClick={() =>
                    update("projects", [
                      ...course.projects,
                      { title: "", description: "" },
                    ])
                  }
                  variant="ghost"
                  size="sm"
                >
                  <FiPlus className="w-4 h-4" /> Add Project
                </AdminButton>
              </div>
            </div>
          )}

          {tab === "certification" && (
            <div className="max-w-2xl space-y-4">
              <h3 className="font-semibold text-black mb-4">Certification</h3>
              {(course.certifications.length === 0
                ? [
                    {
                      description: "",
                      image_url: "",
                      certificate_image_url: "",
                      recognized_companies: [],
                    },
                  ]
                : course.certifications
              ).map((cert, i) => (
                <div key={i} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">
                      Description
                    </label>
                    <textarea
                      value={cert.description || ""}
                      onChange={(e) => {
                        const n = [
                          ...(course.certifications.length
                            ? course.certifications
                            : [{ ...cert }]),
                        ];
                        n[i] = { ...n[i], description: e.target.value };
                        update("certifications", n);
                      }}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">
                      Classroom Image
                    </label>
                    <ImageUploader
                      bucket="certificates"
                      value={cert.image_url || ""}
                      onChange={(url) => {
                        const n = [
                          ...(course.certifications.length
                            ? course.certifications
                            : [{ ...cert }]),
                        ];
                        n[i] = { ...n[i], image_url: url };
                        update("certifications", n);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">
                      Certificate Image
                    </label>
                    <ImageUploader
                      bucket="certificates"
                      value={cert.certificate_image_url || ""}
                      onChange={(url) => {
                        const n = [
                          ...(course.certifications.length
                            ? course.certifications
                            : [{ ...cert }]),
                        ];
                        n[i] = { ...n[i], certificate_image_url: url };
                        update("certifications", n);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">
                      Recognized Companies (one per line)
                    </label>
                    <textarea
                      value={(cert.recognized_companies || []).join("\n")}
                      onChange={(e) => {
                        const n = [
                          ...(course.certifications.length
                            ? course.certifications
                            : [{ ...cert }]),
                        ];
                        n[i] = {
                          ...n[i],
                          recognized_companies: e.target.value
                            .split("\n"),
                        };
                        update("certifications", n);
                      }}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "faqs" && !isNew && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">General FAQs</h3>
              <div className="space-y-6">
                {course.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-admin-200 rounded-lg p-4 space-y-3 relative"
                  >
                    <button
                      onClick={() =>
                        update(
                          "faqs",
                          course.faqs.filter((_, j) => j !== i),
                        )
                      }
                      className="absolute top-3 right-3 text-red-500 hover:text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Question
                      </label>
                      <input
                        value={faq.question || ""}
                        onChange={(e) => {
                          const n = [...course.faqs];
                          n[i] = { ...n[i], question: e.target.value };
                          update("faqs", n);
                        }}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-black mb-1">
                        Answer
                      </label>
                      <textarea
                        value={faq.answer || ""}
                        onChange={(e) => {
                          const n = [...course.faqs];
                          n[i] = { ...n[i], answer: e.target.value };
                          update("faqs", n);
                        }}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <AdminButton
                  onClick={() =>
                    update("faqs", [...course.faqs, { question: "", answer: "" }])
                  }
                  variant="ghost"
                  size="sm"
                >
                  <FiPlus className="w-4 h-4" /> Add FAQ
                </AdminButton>
              </div>
            </div>
          )}

          {tab === "tags" && !isNew && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-black mb-4">Tags</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Select tags that apply to this course.
              </p>
              {allTags.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No tags created yet. Go to <Link to="/admin/tags" className="text-admin-600 hover:underline">Tags page</Link> to add some.
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
                            onClick={(e) => { e.stopPropagation(); handleCourseTagsChange(courseTags.filter(t => t !== id)); }}
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
                                handleCourseTagsChange(
                                  courseTags.includes(tag.id)
                                    ? courseTags.filter(t => t !== tag.id)
                                    : [...courseTags, tag.id]
                                );
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
            </div>
          )}

        </div>
      </div>
      </div>
      <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
    </PageShell>
  );
}
