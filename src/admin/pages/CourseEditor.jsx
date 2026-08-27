import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from "../../lib/supabaseClient";
import ImageUploader from "../components/ImageUploader";
import AddButton from "../components/AddButton";
import { FiTrash2, FiMove, FiArrowLeft, FiLayers, FiCheck, FiClock, FiVideo, FiCode, FiAward, FiCalendar, FiRefreshCw, FiMessageCircle, FiUsers, FiStar, FiBarChart2, FiBookOpen, FiBriefcase, FiTarget, FiGlobe, FiCpu, FiDatabase, FiZap, FiShield, FiTrendingUp, FiChevronDown, FiChevronUp, FiSettings, FiFileText, FiTag, FiAlertCircle, FiSave, FiChevronLeft, FiChevronRight, FiX, FiSearch } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import PageShell from '../components/ui/PageShell';
import SectionSelect from '../components/ui/SectionSelect';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import { toDateTimeLocal, fromDateTimeLocal } from '../../lib/datetime';
import DateTimePicker from '../components/ui/DateTimePicker';
function limitDescriptionText(val) {
  if (!val) return "";
  let text = val.slice(0, 300);
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 35) {
    text = words.slice(0, 35).join(" ");
  }
  return text;
}

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
  const rawReturn = searchParams.get("return");
  const returnUrl = rawReturn ? decodeURIComponent(rawReturn) : "/admin/courses";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = id === "new";
  const [tab, setTab] = useState("basic");
  const sidebarOpen = true;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [startDateError, setStartDateError] = useState(false);
  const [message, setMessage] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [courseTags, setCourseTags] = useState([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
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
    video_url: "",
    nav_item_id: "",
    is_published: true,
    duration: "3 months",
    mode: "Online",
    status: "Active",
    start_date: '',
    checklist_items: [],
    highlights: [],
    overview_faqs: [],
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
          supabase.from("courses").select(`*, highlights(*), overview_faqs(*), projects(*), certifications(*)`).eq("id", id).single(),
          supabase.from("course_tabs").select("*").eq("course_id", id).order("sort_order"),
          supabase.from("faqs").select("*").eq("course_id", id).order("sort_order"),
          supabase.from("course_tags").select("tag_id").eq("course_id", id),
        ]);

        if (courseRes.data && !courseRes.error) {
          setCourse((p) => ({
            ...p,
            ...courseRes.data,
            status: courseRes.data.status === 'Inactive' || courseRes.data.status === 'Unpublished' ? 'Draft' : courseRes.data.status,
            is_published: courseRes.data.status === 'Inactive' || courseRes.data.status === 'Unpublished' || courseRes.data.status === 'Draft' ? false : !!courseRes.data.is_published,
            tabs: tabsRes.data || [],
            faqs: faqsRes.data || [],
          }));
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
        if (table === "course_tabs") {
          return {
            course_id: id,
            sort_order: i,
            label: r.label || r.title || "Tab",
            content_type: r.content_type || "overview",
            content: r.content || {}
          };
        }
        const { id: _, ...rest } = r;
        return { ...rest, course_id: id, sort_order: i };
      });
      const { error: insErr } = await supabase.from(table).insert(clean);
      if (insErr) throw new Error(insErr.message);
    }
  }

  const isSavingRef = useRef(false);

  async function handleSave() {
    if (isSavingRef.current || saving) return;
    isSavingRef.current = true;
    setSaving(true);
    setMessage("");
    if (!course.title?.trim()) {
      setTab('basic');
      setMessage('Cannot save course: Course Title is required.');
      setSaveError('Course Title is required.');
      isSavingRef.current = false;
      setSaving(false);
      return;
    }
    // Only enforce full required fields if status is Active or Coming Soon (bypassed in Draft mode)
    if (course.status !== 'Draft') {
      if ((course.highlights || []).length < 9) {
        setTab('highlights');
        setMessage(`Cannot save course: Minimum 9 Key Highlights are required for ${course.status} status. Currently configured: ${(course.highlights || []).length}/9.`);
        setSaveError(`Minimum 9 Key Highlights are required (currently ${(course.highlights || []).length}/9). Use preset buttons to add 9, 12, or 15 items.`);
        isSavingRef.current = false;
        setSaving(false);
        return;
      }
      if ((course.projects || []).length !== 3) {
        setTab('projects');
        setMessage(`Cannot save course: Exactly 3 Projects are required for ${course.status} status. Currently configured: ${(course.projects || []).length}/3.`);
        setSaveError(`Exactly 3 Projects are required (currently ${(course.projects || []).length}/3). Please configure exactly 3 projects.`);
        isSavingRef.current = false;
        setSaving(false);
        return;
      }
      if ((course.faqs || []).length > 4) {
        setTab('faqs');
        setMessage(`Cannot save course: Maximum 4 General FAQs allowed. Currently configured: ${(course.faqs || []).length}/4.`);
        setSaveError(`Maximum 4 General FAQs allowed (currently ${(course.faqs || []).length}/4). Please remove extra FAQs.`);
        isSavingRef.current = false;
        setSaving(false);
        return;
      }
      if (!course.cta_background_image || !course.cta_background_image.trim()) {
        setTab('basic');
        setMessage(`Cannot save course: CTA Background Image is required for ${course.status} status.`);
        setSaveError(`CTA Background Image is required.`);
        isSavingRef.current = false;
        setSaving(false);
        return;
      }
    }
    if (course.status === 'Coming Soon' && !course.start_date) {
      setStartDateError(true);
      setTab('basic');
      setMessage('Please set the start date and time — it is required for "Coming Soon" courses.');
      setSaveError('Start date and time is required for "Coming Soon" courses.');
      isSavingRef.current = false;
      setSaving(false);
      return;
    }
    setStartDateError(false);
    try {
      let slug = course.slug;
      if (!slug) slug = String(course.title || 'course').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'course';
      let slugQuery = supabase.from('courses').select('id').eq('slug', slug);
      if (!isNew) slugQuery = slugQuery.neq('id', id);
      const { data: slugHits } = await slugQuery;
      if (slugHits && slugHits.length > 0) {
        let n = 2;
        while (true) {
          const candidate = `${slug}-${n}`;
          let q = supabase.from('courses').select('id').eq('slug', candidate);
          if (!isNew) q = q.neq('id', id);
          const { data: hits } = await q;
          if (!hits || hits.length === 0) { slug = candidate; break; }
          n += 1;
        }
      }
      const payload = {
        title: course.title,
        slug,
        subtitle: course.subtitle,
        description: course.description,
        hero_image_url: course.hero_image_url,
        video_thumbnail_url: null,
        video_url: course.video_url || null,
        nav_item_id: course.nav_item_id || null,
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
        start_date: course.start_date ? fromDateTimeLocal(course.start_date) : null,
        checklist_items: (course.checklist_items || []).filter(Boolean).slice(0, 4),
        curriculum: [],
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
    isSavingRef.current = false;
    setSaving(false);
  }

  return (
    <PageShell
      backTo={returnUrl}
      title={isNew ? "New Course" : `Edit: ${course.title || "Untitled"}`}
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
        <div className="hidden lg:block transition-all duration-200 lg:w-[220px] lg:shrink-0">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-visible">
            <div className="bg-white rounded-xl flex flex-col overflow-visible border border-gray-300" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
              {editorTabs.map((t, index) => {
                const meta = tabMeta[t];
                const isActive = tab === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative w-full flex items-center gap-2.5 text-left px-4 py-3 border-b border-gray-200 last:border-b-0 focus:outline-none transition-colors ${
                      index === 0 ? 'rounded-t-xl' : ''
                    } ${
                      index === editorTabs.length - 1 ? 'rounded-b-xl' : ''
                    } ${
                      isActive ? 'bg-admin-600 text-white shadow-md z-10' : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    title={meta.label}
                  >
                    <meta.Icon className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-neutral-400'
                    }`} />
                    <span className="font-semibold text-sm flex-1 truncate">{meta.label}</span>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-black">
                    Description
                  </label>
                  <span className={`text-xs font-semibold ${
                    (course.description || "").length >= 300 || ((course.description || "").trim().split(/\s+/).filter(Boolean).length >= 35)
                      ? "text-amber-600 font-bold"
                      : "text-neutral-400"
                  }`}>
                    {(course.description || "").trim().split(/\s+/).filter(Boolean).length}/35 words | {(course.description || "").length}/300 chars
                  </span>
                </div>
                <textarea
                  value={course.description || ""}
                  onChange={(e) => update("description", limitDescriptionText(e.target.value))}
                  maxLength={300}
                  rows={4}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="Detailed course description (max 35 words / 300 characters)..."
                />
              </div>
              <div className="border-t border-admin-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-neutral-700 mb-3">Hero Section</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-semibold text-black">Feature Bullet Points (one per line) <span className="text-xs text-neutral-400 font-normal">(Max 80 chars per line)</span></label>
                      <span className="text-xs font-semibold text-neutral-400">
                        {((course.checklist_items || []).slice(0, 4)).length}/4 items max
                      </span>
                    </div>
                    <textarea
                      value={(course.checklist_items || []).map(line => (line || '').slice(0, 80)).slice(0, 4).join('\n')}
                      onChange={(e) => {
                        const items = e.target.value
                          .split('\n')
                          .map(line => line.slice(0, 80))
                          .filter(Boolean)
                          .slice(0, 4);
                        update("checklist_items", items);
                      }}
                      rows={4}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      placeholder="Expert Led Live Training Sessions (max 80 chars per line)&#10;Angular Fundamentals to Advanced Concepts&#10;Real Time Project Development Experience"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="block text-xs font-medium text-neutral-500 mb-2">Category <span className="text-destructive-500">*</span></label>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <select value={course.status} onChange={(e) => {
                    const v = e.target.value;
                    update("status", v);
                    update("is_published", v === 'Draft' ? false : true);
                  }}
                    className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white">
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Coming Soon">Coming Soon</option>
                  </select>
                  {course.status === 'Coming Soon' ? (
                    <p className="text-xs text-neutral-500 mt-1.5">Listed in the home page Upcoming Courses section with a launch countdown. It becomes Active automatically once the start date arrives.</p>
                  ) : (
                    <p className="text-xs text-neutral-400 mt-1.5">Selecting "Coming Soon" lists this course in the home page Upcoming Courses section with a launch countdown.</p>
                  )}
                </div>
              </div>
              {course.status === 'Coming Soon' && (
                <div>
                  <label className="block text-sm font-semibold text-black mb-1">
                    Start Date & Time <span className="text-destructive-500">*</span>
                  </label>
                  <DateTimePicker
                    value={toDateTimeLocal(course.start_date)}
                    onChange={(v) => { update("start_date", v || null); if (startDateError) setStartDateError(false); }}
                    error={!!startDateError}
                  />
                  {startDateError && (
                    <p className="text-xs text-destructive-500 mt-1.5">Please set the start date and time for this Coming Soon course.</p>
                  )}
                  {!startDateError && (
                    <p className="text-xs text-neutral-500 mt-1.5">The course becomes Active automatically once this date arrives.</p>
                  )}
                </div>
              )}

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
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Button Text</label>
                    <input value={course.cta_text || ''} onChange={(e) => update('cta_text', e.target.value)}
                      className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      placeholder="Enroll Now" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">CTA Background Image <span className="text-destructive-500">*</span></label>
                    <ImageUploader value={course.cta_background_image || ''} onChange={(v) => update('cta_background_image', v)} />
                  </div>
                </div>
              </div>
            </div>
          )}



          {tab === "hero" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-1">
                  Hero Image *
                </label>
                <ImageUploader
                  bucket="hero-images"
                  value={course.hero_image_url}
                  onChange={(url) => update("hero_image_url", url)}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-black">
                    Course Introduction Video URL (YouTube)
                  </label>
                  <span className="text-xs text-neutral-400 font-normal">(Optional)</span>
                </div>
                <input
                  value={course.video_url || ""}
                  onChange={(e) => update("video_url", e.target.value)}
                  className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                  placeholder="https://www.youtube.com/watch?v=... (optional)"
                />
              </div>
            </div>
          )}

          {tab === "tabs" && !isNew && (
            <div className="space-y-6">
              {(() => {
                const contentTabs = course.tabs.filter(t => t.content_type === "overview" || t.content_type === "syllabus");
                const qaCounts = contentTabs.map(t => (t.content?.qa || []).length);
                const maxQA = qaCounts.length > 0 ? Math.max(...qaCounts) : 0;
                const minQA = qaCounts.length > 0 ? Math.min(...qaCounts) : 0;
                const qaDiff = maxQA - minQA;
                const isUnbalanced = contentTabs.length > 1 && maxQA > 0 && minQA === 0;

                return (
                  <div className={`rounded-xl p-4 mb-4 border transition-all ${
                    isUnbalanced
                      ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs'
                      : 'bg-blue-50/70 border-blue-200/80 text-blue-900'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 font-bold text-xs uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiAlertCircle className={`w-4 h-4 shrink-0 ${isUnbalanced ? 'text-amber-600' : 'text-blue-600'}`} />
                        <span>{isUnbalanced ? '⚠️ Tab Content Unbalanced' : 'Tab Content Balance Guidance'}</span>
                      </div>
                      {contentTabs.length > 1 && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${isUnbalanced ? 'bg-amber-200 text-amber-900' : 'bg-blue-200/70 text-blue-900'}`}>
                          Tally Diff: {qaDiff} items
                        </span>
                      )}
                    </div>
                    {isUnbalanced ? (
                      <p className="text-xs leading-relaxed text-amber-800 font-medium">
                        <strong>Attention:</strong> One or more tabs have {maxQA} Q&A items while another tab has 0 Q&A items. To keep the course page looking balanced and even, please add Q&A items to all tabs or keep item counts matched!
                      </p>
                    ) : (
                      <p className="text-xs leading-relaxed text-blue-800">
                        To ensure tabs look even on the course page, aim for consistent content density across overview & syllabus tabs:
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-xs font-medium">
                      <div className="bg-white/80 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isUnbalanced ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <span><strong>Q&A Items:</strong> 2 – 4 per tab</span>
                      </div>
                      <div className="bg-white/80 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span><strong>Paragraph Text:</strong> 30 – 80 words</span>
                      </div>
                      <div className="bg-white/80 border border-slate-200/80 rounded-lg px-3 py-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span><strong>First Accordion:</strong> Opens automatically</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-black">Course Tabs <span className="text-destructive-500">*</span></h3>
                <AddButton
                  onClick={() => {
                    const n = [...course.tabs, { label: "New Tab", content_type: "overview", content: { headingAlign: "center", paragraphAlign: "left" } }];
                    update("tabs", n);
                  }}
                  label="Add Tab"
                />
              </div>
              <div className="space-y-4">
                {course.tabs.map((t, i) => (
                  <div key={t.id || i} className="border border-admin-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-admin-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-neutral-500">Tab #{i + 1}</span>
                        {(() => {
                          const contentTabs = course.tabs.filter(tab => tab.content_type === "overview" || tab.content_type === "syllabus");
                          const qaCounts = contentTabs.map(tab => (tab.content?.qa || []).length);
                          const maxQA = qaCounts.length > 0 ? Math.max(...qaCounts) : 0;
                          const qaCount = (t.content?.qa || []).length;
                          const textWords = ((t.content?.paragraph || '') + ' ' + (t.content?.heading || '')).trim().split(/\s+/).filter(Boolean).length;
                          
                          let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          let badgeLabel = `✓ Balanced Content (${qaCount} Q&As, ~${textWords} words)`;
                          
                          if (t.content_type === "apply_now") {
                            badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
                            badgeLabel = "Form Action Tab";
                          } else if (qaCount === 0 && maxQA > 0) {
                            badgeColor = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                            badgeLabel = `⚠ Unbalanced: 0 Q&As (vs ${maxQA} in other tabs)`;
                          } else if (qaCount === 0 && textWords < 15) {
                            badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                            badgeLabel = `⚠ Light Content (~${textWords} words)`;
                          } else if (qaCount > 5) {
                            badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                            badgeLabel = `ℹ Heavy Content (${qaCount} Q&As)`;
                          }
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-admin-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-neutral-500">Tab #{i + 1}</span>
                        {(() => {
                          const contentTabs = course.tabs.filter(tab => tab.content_type === "overview" || tab.content_type === "syllabus");
                          const qaCounts = contentTabs.map(tab => (tab.content?.qa || []).length);
                          const maxQA = qaCounts.length > 0 ? Math.max(...qaCounts) : 0;
                          const qaCount = (t.content?.qa || []).length;
                          const textWords = ((t.content?.paragraph || '') + ' ' + (t.content?.heading || '')).trim().split(/\s+/).filter(Boolean).length;
                          
                          let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          let badgeLabel = `✓ Balanced Content (${qaCount} Q&As, ~${textWords} words)`;
                          
                          if (t.content_type === "apply_now") {
                            badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
                            badgeLabel = "Form Action Tab";
                          } else if (qaCount === 0 && maxQA > 0) {
                            badgeColor = "bg-amber-100 text-amber-900 border-amber-300 font-bold";
                            badgeLabel = `⚠ Unbalanced: 0 Q&As (vs ${maxQA} in other tabs)`;
                          } else if (qaCount === 0 && textWords < 15) {
                            badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                            badgeLabel = `⚠ Light Content (~${textWords} words)`;
                          } else if (qaCount > 5) {
                            badgeColor = "bg-blue-50 text-blue-700 border-blue-200";
                            badgeLabel = `ℹ Heavy Content (${qaCount} Q&As)`;
                          }
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          );
                        })()}
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (t.id) {
                            await supabase.from("course_tabs").delete().eq("id", t.id);
                          }
                          update("tabs", course.tabs.filter((_, j) => j !== i));
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors shrink-0 cursor-pointer"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove Tab
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full pt-1">
                      <div>
                        <div className="flex items-center justify-between h-6 mb-1">
                          <label className="text-xs font-semibold text-neutral-600">Tab Label <span className="text-destructive-500">*</span></label>
                        </div>
                        <input
                          value={t.label || ""}
                          onChange={(e) => {
                            const n = [...course.tabs];
                            n[i] = { ...n[i], content_type: "overview", label: e.target.value };
                            update("tabs", n);
                          }}
                          required
                          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                          placeholder="e.g. Overview"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between h-6 mb-1">
                          <label className="text-xs font-semibold text-neutral-600">Section Heading <span className="text-destructive-500">*</span></label>
                          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
                            <span className="text-[10px] text-neutral-400 font-medium px-1">Align:</span>
                            {['left', 'center', 'right'].map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => {
                                  const n = [...course.tabs];
                                  n[i] = { ...n[i], content_type: "overview", content: { ...n[i].content, headingAlign: align } };
                                  update("tabs", n);
                                }}
                                className={`px-2 py-0.5 rounded text-xs font-semibold capitalize transition-all ${
                                  (t.content?.headingAlign || 'left') === align
                                    ? 'bg-admin-600 text-white shadow-xs'
                                    : 'text-neutral-600 hover:text-neutral-900'
                                }`}
                              >
                                {align}
                              </button>
                            ))}
                          </div>
                        </div>
                        <input
                          value={t.content?.heading || ""}
                          onChange={(e) => {
                            const n = [...course.tabs];
                            n[i] = { ...n[i], content_type: "overview", content: { ...n[i].content, heading: e.target.value } };
                            update("tabs", n);
                          }}
                          required
                          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                          placeholder="Heading text (left-aligned by default)"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">

                        {/* Paragraph (Description) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-neutral-700">Paragraph / Description <span className="text-destructive-500">*</span></label>
                            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
                              <span className="text-[10px] text-neutral-400 font-medium px-1">Align:</span>
                              {['left', 'center', 'right'].map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => {
                                    const n = [...course.tabs];
                                    n[i] = { ...n[i], content: { ...n[i].content, paragraphAlign: align } };
                                    update("tabs", n);
                                  }}
                                  className={`px-2 py-0.5 rounded text-xs font-semibold capitalize transition-all ${
                                    (t.content?.paragraphAlign || 'left') === align
                                      ? 'bg-admin-600 text-white shadow-xs'
                                      : 'text-neutral-600 hover:text-neutral-900'
                                  }`}
                                >
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={t.content?.paragraph || ""}
                            onChange={(e) => {
                              const n = [...course.tabs];
                              n[i] = { ...n[i], content: { ...n[i].content, paragraph: e.target.value } };
                              update("tabs", n);
                            }}
                            rows={3}
                            required
                            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                            placeholder="Description text (left-aligned by default)"
                          />
                        </div>

                        {/* Subheading */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-neutral-700">Sub Heading</label>
                            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
                              <span className="text-[10px] text-neutral-400 font-medium px-1">Align:</span>
                              {['left', 'center', 'right'].map((align) => (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => {
                                    const n = [...course.tabs];
                                    n[i] = { ...n[i], content: { ...n[i].content, subheadingAlign: align } };
                                    update("tabs", n);
                                  }}
                                  className={`px-2 py-0.5 rounded text-xs font-semibold capitalize transition-all ${
                                    (t.content?.subheadingAlign || 'left') === align
                                      ? 'bg-admin-600 text-white shadow-xs'
                                      : 'text-neutral-600 hover:text-neutral-900'
                                  }`}
                                >
                                  {align}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            value={t.content?.subheading || ""}
                            onChange={(e) => {
                              const n = [...course.tabs];
                              n[i] = { ...n[i], content: { ...n[i].content, subheading: e.target.value } };
                              update("tabs", n);
                            }}
                            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                            placeholder="Sub heading text"
                          />
                        </div>

                        {/* Features / Q&A Items */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Features / Q&A Items</label>
                            <AddButton
                              onClick={() => {
                                const n = [...course.tabs];
                                const qa = [...(n[i].content?.qa || []), { question: "", answers: [""] }];
                                n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                update("tabs", n);
                              }}
                              size="xs"
                              label="Add Question / Feature"
                            />
                          </div>
                          <div className="space-y-4">
                            {(t.content?.qa || []).map((qa, qi) => (
                              <div key={qi} className="bg-neutral-50/80 border border-admin-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-admin-600 uppercase tracking-wider">Feature #{qi + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const n = [...course.tabs];
                                      const qa = n[i].content.qa.filter((_, j) => j !== qi);
                                      n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                      update("tabs", n);
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-neutral-600 mb-1">Title / Question</label>
                                  <input
                                    value={qa.question || ""}
                                    onChange={(e) => {
                                      const n = [...course.tabs];
                                      const qa = [...n[i].content.qa];
                                      qa[qi] = { ...qa[qi], question: e.target.value };
                                      n[i] = { ...n[i], content: { ...n[i].content, qa } };
                                      update("tabs", n);
                                    }}
                                    required
                                    className="w-full px-3 py-2 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                                    placeholder="Feature title or question"
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-medium text-neutral-600">Feature Bullets / Answers (one per line)</label>
                                    <span className="text-[10px] text-neutral-400 font-medium">1 bullet point per line</span>
                                  </div>
                                  <textarea
                                    value={(qa.answers || []).join("\n")}
                                    onChange={(e) => {
                                      const n = [...course.tabs];
                                      const qaArr = [...n[i].content.qa];
                                      qaArr[qi] = { ...qaArr[qi], answers: e.target.value.split("\n") };
                                      n[i] = { ...n[i], content: { ...n[i].content, qa: qaArr } };
                                      update("tabs", n);
                                    }}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 font-sans"
                                    placeholder="Enter bullet point 1&#10;Enter bullet point 2&#10;Enter bullet point 3"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "highlights" && !isNew && (
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-admin-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-black text-lg">Key Highlights</h3>
                  {course.highlights.length < 9 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      ⚠ Minimum 9 Required ({course.highlights.length}/9)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Grid Ready ({course.highlights.length} items = {Math.ceil(course.highlights.length / 3)} rows)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 font-medium">Presets:</span>
                  {[9, 12, 15].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => {
                        const current = [...course.highlights];
                        if (current.length < count) {
                          const added = Array.from({ length: count - current.length }, () => ({ icon: "star", label: "" }));
                          update("highlights", [...current, ...added]);
                        } else {
                          update("highlights", current.slice(0, count));
                        }
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                        course.highlights.length === count
                          ? 'bg-admin-600 text-white shadow-xs'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {count} Items
                    </button>
                  ))}
                  <AddButton
                    onClick={() =>
                      update("highlights", [
                        ...course.highlights,
                        { icon: "star", label: "" },
                      ])
                    }
                    label="Add"
                  />
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Key Highlights display as a 3-column grid on the course page. Require at least <strong>9 items</strong> (recommended <strong>9, 12, or 15 items</strong> for balanced rows).
              </p>
              <div className="space-y-4">
                {course.highlights.map((h, i) => (
                  <div
                    key={i}
                    className="border border-admin-200 rounded-lg p-4 space-y-3 relative bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Highlight #{i + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "highlights",
                            course.highlights.filter((_, j) => j !== i),
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">Icon</label>
                        <IconPicker
                          value={h.icon || "star"}
                          onChange={(val) => {
                            const n = [...course.highlights];
                            n[i] = { ...n[i], icon: val };
                            update("highlights", n);
                          }}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-neutral-600 mb-1">
                          Label
                        </label>
                        <input
                          value={h.label || ""}
                          onChange={(e) => {
                            const n = [...course.highlights];
                            n[i] = { ...n[i], label: e.target.value };
                            update("highlights", n);
                          }}
                          placeholder={`Highlight #${i + 1} label...`}
                          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "projects" && !isNew && (
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-admin-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-black text-lg">Projects</h3>
                  {course.projects.length !== 3 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      ⚠ Exactly 3 Required ({course.projects.length}/3)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Exactly 3 Projects Configured
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {course.projects.length !== 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "projects",
                          Array.from({ length: 3 }, (_, idx) => course.projects[idx] || { title: "", description: "" })
                        )
                      }
                      className="px-2.5 py-1 bg-admin-600 hover:bg-admin-700 text-white rounded text-xs font-bold transition-colors cursor-pointer"
                    >
                      Reset to 3 Projects
                    </button>
                  )}
                  {course.projects.length < 3 && (
                    <AddButton
                      onClick={() =>
                        update("projects", [
                          ...course.projects,
                          { title: "", description: "" },
                        ])
                      }
                      label="Add Project"
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-neutral-500">
                Each course requires <strong>exactly 3 projects</strong> to display in a balanced 3-column row on the course page.
              </p>
              <div className="space-y-4">
                {course.projects.map((p, i) => (
                  <div
                    key={i}
                    className="border border-admin-200 rounded-lg p-4 space-y-3 relative bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">Project #{i + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "projects",
                            course.projects.filter((_, j) => j !== i),
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">
                        Title
                      </label>
                      <input
                        value={p.title || ""}
                        onChange={(e) => {
                          const n = [...course.projects];
                          n[i] = { ...n[i], title: e.target.value };
                          update("projects", n);
                        }}
                        placeholder={`Project #${i + 1} title...`}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">
                        Description
                      </label>
                      <textarea
                        value={p.description || ""}
                        onChange={(e) => {
                          const n = [...course.projects];
                          n[i] = { ...n[i], description: e.target.value };
                          update("projects", n);
                        }}
                        placeholder={`Project #${i + 1} description...`}
                        rows={3}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "certification" && (
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-admin-200">
                <h3 className="font-semibold text-black text-lg">Certification <span className="text-destructive-500">*</span></h3>
                {course.certifications.length < 2 && (
                  <AddButton
                    onClick={() =>
                      update("certifications", [
                        ...course.certifications,
                        { description: "", certificate_image_url: "", recognized_companies: [] },
                      ])
                    }
                    label="Add Certification"
                  />
                )}
              </div>
              {(course.certifications.length === 0
                ? [
                    {
                      description: "",
                      certificate_image_url: "",
                      recognized_companies: [],
                    },
                  ]
                : course.certifications
              ).map((cert, i) => (
                <div key={i} className="bg-white border border-admin-200 rounded-xl p-5 shadow-xs space-y-4 relative">
                  <div className="flex items-center justify-between pb-2 border-b border-admin-100">
                    <span className="text-xs font-bold text-neutral-500">Certification #{i + 1}</span>
                    {course.certifications.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "certifications",
                            course.certifications.filter((_, j) => j !== i)
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">
                        Description <span className="text-destructive-500">*</span>
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
                        required
                        className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        placeholder="Describe the certification value..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">
                        Recognized Companies (one per line) <span className="text-destructive-500">*</span>
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
                            recognized_companies: e.target.value.split("\n"),
                          };
                          update("certifications", n);
                        }}
                        rows={4}
                        required
                        className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                        placeholder="Google&#10;Microsoft&#10;Amazon"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1">
                      Certificate Image <span className="text-destructive-500">*</span>
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
                </div>
              ))}
            </div>
          )}

          {tab === "faqs" && !isNew && (
            <div className="max-w-3xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-admin-200">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-black text-lg">General FAQs</h3>
                  {course.faqs.length > 4 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      ⚠ Maximum 4 Allowed ({course.faqs.length}/4)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Max 4 Limit ({course.faqs.length}/4)
                    </span>
                  )}
                </div>
                {course.faqs.length < 4 && (
                  <AddButton
                    onClick={() =>
                      update("faqs", [...course.faqs, { question: "", answer: "" }])
                    }
                    label="Add FAQ"
                  />
                )}
              </div>
              <div className="space-y-4">
                {course.faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="bg-white border border-admin-200 rounded-xl p-5 shadow-xs space-y-4 relative"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-admin-100">
                      <span className="text-xs font-bold text-neutral-500">FAQ #{i + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          update(
                            "faqs",
                            course.faqs.filter((_, j) => j !== i)
                          )
                        }
                        className="text-xs text-red-500 hover:text-red-600 font-medium hover:underline flex items-center gap-1"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">
                        Question
                      </label>
                      <input
                        value={faq.question || ""}
                        onChange={(e) => {
                          const n = [...course.faqs];
                          n[i] = { ...n[i], question: e.target.value };
                          update("faqs", n);
                        }}
                        placeholder={`General FAQ #${i + 1} question...`}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-600 mb-1">
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
                        placeholder={`General FAQ #${i + 1} answer...`}
                        className="w-full px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                      />
                    </div>
                  </div>
                ))}
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
                      <div className="fixed inset-0 z-10" onClick={() => { setTagsDropdownOpen(false); setTagSearch(""); }} />
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-hidden bg-white border border-admin-200 rounded-lg shadow-lg z-20 flex flex-col">
                        <div className="p-2 border-b border-admin-100 bg-neutral-50 shrink-0">
                          <div className="relative flex items-center">
                            <FiSearch className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400" />
                            <input
                              type="text"
                              value={tagSearch}
                              onChange={(e) => setTagSearch(e.target.value)}
                              placeholder="Search tags..."
                              className="w-full pl-8 pr-7 py-1.5 bg-white border border-admin-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-admin-500/20"
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            {tagSearch && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setTagSearch(""); }}
                                className="absolute right-2 text-neutral-400 hover:text-neutral-600"
                              >
                                <FiX className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto admin-scrollbar py-1">
                          {allTags.filter(t => (t.name || '').toLowerCase().includes(tagSearch.toLowerCase())).length === 0 ? (
                            <div className="px-3 py-2.5 text-xs text-neutral-400 italic text-center">No matching tags found</div>
                          ) : (
                            allTags
                              .filter(t => (t.name || '').toLowerCase().includes(tagSearch.toLowerCase()))
                              .map(tag => (
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
                              ))
                          )}
                        </div>
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
      <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => navigate(returnUrl)} />
    </PageShell>
  );
}
