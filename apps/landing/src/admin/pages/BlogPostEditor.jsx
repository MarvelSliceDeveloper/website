import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import SaveBar from "../components/SaveBar";
import SaveCancelBar from "../components/SaveCancelBar";
import useDirty from "../hooks/useDirty";
import {
  FiSave,
  FiArrowLeft,
  FiUpload,
  FiTrash2,
  FiTag,
  FiX,
} from "react-icons/fi";
import PageShell from "../components/ui/PageShell";

function ImageUploader({ value, onChange, label }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("pages").upload(path, file);
    if (error) {
      alert("Upload failed: " + error.message);
    } else {
      const { data } = supabase.storage.from("pages").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
          placeholder="Paste image URL or upload..."
        />
        <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-admin-200 rounded-lg text-sm text-admin-500 hover:border-admin-500 hover:text-admin-600 transition-colors">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiUpload className="w-4 h-4" />
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>
      {value && (
        <div className="mt-2 relative group rounded-lg overflow-hidden border border-admin-200">
          <img src={value} alt="" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 bg-destructive-500 text-white rounded-full opacity-100 shadow-lg"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function BlogPostEditor() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = !id || location.pathname.endsWith("/new");
  const savingRef = useRef(false);
  const queryClient = useQueryClient();
  const formRef = useRef(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image_url: "",
    category_id: "",
    author: "Admin",
    is_published: false,
    is_featured: false,
  });
  const [categories, setCategories] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsDropdownOpen, setTagsDropdownOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [slugStatus, setSlugStatus] = useState("idle");
  const [slugSuggestion, setSlugSuggestion] = useState("");
  const { dirty, reset } = useDirty([form, selectedTags], loading);

  useEffect(() => {
    if (!form.slug || !isNew) {
      setSlugStatus("idle");
      return;
    }
    let active = true;
    setSlugStatus("checking");
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("slug", form.slug)
        .maybeSingle();
      if (!active) return;
      if (data) {
        setSlugStatus("taken");
        let attempt = 1;
        while (attempt < 20) {
          const testSlug = `${form.slug}-${attempt}`;
          const { data: existing } = await supabase
            .from("blog_posts")
            .select("id")
            .eq("slug", testSlug)
            .maybeSingle();
          if (!existing) {
            setSlugSuggestion(testSlug);
            break;
          }
          attempt++;
        }
      } else {
        setSlugStatus("available");
        setSlugSuggestion("");
      }
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [form.slug, isNew]);

  useEffect(() => {
    async function loadData() {
      const [catRes, tagsRes] = await Promise.all([
        supabase.from("blog_categories").select("*").order("sort_order"),
        supabase.from("tags").select("*").order("name"),
      ]);
      setCategories(catRes.data || []);
      setAllTags(tagsRes.data || []);

      if (!isNew) {
        const { data } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setForm({
            title: data.title || "",
            slug: data.slug || "",
            excerpt: data.excerpt || "",
            content: data.content || "",
            image_url: data.image_url || "",
            category_id: data.category_id || "",
            author: data.author || "Admin",
            is_published: data.is_published || false,
            is_featured: data.is_featured || false,
          });
          const { data: tagData } = await supabase
            .from("blog_post_tags")
            .select("tag_id")
            .eq("post_id", data.id);
          setSelectedTags((tagData || []).map((t) => t.tag_id));
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(value) {
    setForm({ ...form, title: value, slug: slugify(value) });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!form.slug.trim()) return;
    if (!form.author.trim()) return;
    if (!form.excerpt.trim()) return;
    if (!form.content.trim()) return;
    if (!form.category_id) return;
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const payload = {
      ...form,
      category_id: form.category_id || null,
      slug: form.slug || slugify(form.title),
      ...(isNew ? { created_at: new Date().toISOString() } : {}),
      published_at:
        form.is_published && !isNew
          ? undefined
          : form.is_published
            ? new Date().toISOString()
            : null,
    };
    let postId = id;
    let insertError = false;
    if (isNew) {
      let { data, error } = await supabase
        .from("blog_posts")
        .insert(payload)
        .select()
        .single();
      let attempt = 0;
      while (
        error &&
        error.message?.includes("blog_posts_slug_key") &&
        attempt < 10
      ) {
        attempt++;
        payload.slug = `${payload.slug || slugify(payload.title)}-${attempt}`;
        setForm((f) => ({ ...f, slug: payload.slug }));
        const retry = await supabase
          .from("blog_posts")
          .insert(payload)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }
      if (error) {
        insertError = true;
        savingRef.current = false;
        setSaving(false);
        setSaveError("Failed to save post: " + error.message);
        return;
      } else if (data) {
        postId = data.id;
        window.history.replaceState(null, "", `/admin/blog/${data.id}`);
      }
    } else {
      await supabase.from("blog_posts").update(payload).eq("id", id);
    }

    if (!insertError && postId && postId !== "new") {
      await supabase.from("blog_post_tags").delete().eq("post_id", postId);
      if (selectedTags.length > 0) {
        await supabase
          .from("blog_post_tags")
          .insert(selectedTags.map((tag_id) => ({ post_id: postId, tag_id })));
      }
    }

    queryClient.invalidateQueries({ queryKey: ["blogPosts"] });
    queryClient.invalidateQueries({ queryKey: ["blogPost", form.slug] });
    queryClient.invalidateQueries({ queryKey: ["recentPosts"] });
    queryClient.invalidateQueries({ queryKey: ["popularTags"] });
    setSaved(true);
    reset();
    setSaving(false);
    savingRef.current = false;
    setTimeout(() => {
      setSaved(false);
      navigate("/admin/blog");
    }, 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      title={isNew ? "Add New Post" : "Edit Post"}
      backTo="/admin/blog"
    >
      <SaveBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        onSave={handleSave}
        label="Post"
        top
      />

      <form ref={formRef} onSubmit={handleSave}>
        <div
          className="bg-white border border-gray-300 rounded-xl p-6 space-y-4"
          style={{ boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
        >
          {/* Row 1: Title | Slug | Author */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_2fr_1fr] gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Title <span className="text-destructive-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                placeholder="Post title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Slug <span className="text-destructive-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:border-transparent transition-all font-mono text-xs ${
                    slugStatus === "taken"
                      ? "border-destructive-500 focus:ring-destructive-500 bg-destructive-50"
                      : slugStatus === "available"
                        ? "border-success-500 focus:ring-success-500 bg-success-50"
                        : "border-admin-200 focus:ring-admin-500/20"
                  }`}
                  placeholder="post-slug"
                />
                {slugStatus === "checking" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    <span className="w-4 h-4 border-2 border-admin-500 border-t-transparent rounded-full animate-spin block" />
                  </span>
                )}
              </div>
              {slugStatus === "taken" && (
                <p className="text-xs text-destructive-500 mt-1">
                  Slug taken. Suggested:{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, slug: slugSuggestion });
                      setSlugStatus("checking");
                    }}
                    className="text-admin-600 hover:underline font-medium"
                  >
                    {slugSuggestion}
                  </button>
                </p>
              )}
              {slugStatus === "available" && (
                <p className="text-xs text-success-500 mt-1">Available</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Author <span className="text-destructive-500">*</span>
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                placeholder="Author name"
              />
            </div>
          </div>

          {/* Row 2: Image URL (full width, compact) */}
          <ImageUploader
            value={form.image_url}
            onChange={(v) => setForm({ ...form, image_url: v })}
            label="Featured Image URL"
          />

          {/* Row 3: Excerpt + Content */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Excerpt <span className="text-destructive-500">*</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              rows={2}
              required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              placeholder="Short description shown in cards"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Content <span className="text-destructive-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={12}
              required
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500/20 transition-all font-mono text-xs"
              placeholder="Full article content (HTML or markdown supported)"
            />
          </div>

          {/* Row 4: Category | Tags | Published | Featured — all in one line */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_auto_auto] gap-4 items-end pt-2 border-t border-admin-100">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Category <span className="text-destructive-500">*</span>
              </label>
              <select
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: e.target.value })
                }
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
              >
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Tags
              </label>
              {allTags.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  No tags. Create in{" "}
                  <Link
                    to="/admin/tags"
                    className="text-admin-600 hover:underline"
                  >
                    Tags Manager
                  </Link>
                  .
                </p>
              ) : (
                <div className="relative">
                  <div
                    onClick={() => setTagsDropdownOpen(!tagsDropdownOpen)}
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-admin-200 bg-white text-sm cursor-pointer flex flex-wrap gap-1 items-center"
                  >
                    {selectedTags.length === 0 && (
                      <span className="text-neutral-400 text-sm">
                        Select tags...
                      </span>
                    )}
                    {selectedTags.map((id) => {
                      const tag = allTags.find((t) => t.id === id);
                      return tag ? (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-admin-100 text-admin-700 rounded-md text-xs font-medium"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTags(
                                selectedTags.filter((t) => t !== id),
                              );
                            }}
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
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setTagsDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto admin-scrollbar bg-white border border-admin-200 rounded-lg shadow-lg z-20 py-1">
                        {allTags.map((tag) => (
                          <label
                            key={tag.id}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag.id)}
                              onChange={() => {
                                setSelectedTags((prev) =>
                                  prev.includes(tag.id)
                                    ? prev.filter((t) => t !== tag.id)
                                    : [...prev, tag.id],
                                );
                              }}
                              className="rounded border-admin-300 text-admin-600 focus:ring-admin-500"
                            />
                            <span className="text-sm text-neutral-700">
                              {tag.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Published toggle */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Published
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors h-[38px]">
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${form.is_published ? "bg-admin-600" : "bg-admin-300"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_published ? "translate-x-4" : ""}`}
                  />
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={(e) =>
                      setForm({ ...form, is_published: e.target.checked })
                    }
                    className="sr-only"
                  />
                </div>
                <span className="text-sm font-medium text-black whitespace-nowrap">
                  {form.is_published ? "Live" : "Draft"}
                </span>
              </label>
            </div>

            {/* Featured checkbox */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Featured
              </label>
              <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors h-[38px]">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) =>
                    setForm({ ...form, is_featured: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-admin-600 focus:ring-admin-500/20"
                />
                <span className="text-sm font-medium text-black whitespace-nowrap">
                  Featured
                </span>
              </label>
            </div>
          </div>
        </div>
      </form>
      <SaveCancelBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        onSave={() => formRef.current?.requestSubmit()}
        onDiscard={() => window.location.reload()}
      />
    </PageShell>
  );
}
