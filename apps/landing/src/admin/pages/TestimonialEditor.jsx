import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import SaveBar from "../components/SaveBar";
import SaveCancelBar from "../components/SaveCancelBar";
import PageShell from "../components/ui/PageShell";
import useDirty from "../hooks/useDirty";
import { FiUpload, FiStar } from "react-icons/fi";

export default function TestimonialEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);

  const defaultForm = {
    name: "",
    role: "",
    quote: "",
    rating: 5,
    avatar_url: "",
    is_active: true,
    sort_order: 0,
  };
  const [form, setForm] = useState(defaultForm);

  const { dirty, reset } = useDirty([form], loading);

  useEffect(() => {
    async function loadData() {
      if (!isNew) {
        const { data } = await supabase
          .from("testimonials")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setForm({
            name: data.name || "",
            role: data.role || "",
            quote: data.quote || "",
            rating: data.rating ?? 5,
            avatar_url: data.avatar_url || "",
            is_active: data.is_active,
            sort_order: data.sort_order || 0,
          });
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id, isNew]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const newVal = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: newVal }));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `testimonials/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("pages").upload(path, file);
    if (error) {
      setSaveError("Avatar upload failed: " + error.message);
    } else {
      const { data } = supabase.storage.from("pages").getPublicUrl(path);
      setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }));
    }
    setUploading(false);
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    const errs = [];
    if (!form.name.trim()) errs.push("Name is required.");
    if (!form.quote.trim()) errs.push("Quote is required.");
    if (errs.length > 0) {
      setSaveError(errs.join(" "));
      return;
    }
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const payload = {
      name: form.name.trim(),
      role: form.role?.trim() || null,
      quote: form.quote.trim(),
      rating: Math.min(5, Math.max(1, parseInt(form.rating, 10) || 5)),
      avatar_url: form.avatar_url?.trim() || null,
      is_active: form.is_active,
      sort_order: form.sort_order,
    };

    let res;
    if (isNew) {
      res = await supabase.from("testimonials").insert(payload);
    } else {
      res = await supabase.from("testimonials").update(payload).eq("id", id);
    }
    if (res?.error) {
      setSaveError(res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    reset();
    setTimeout(() => navigate("/admin/testimonials"), 1000);
  }

  if (loading)
    return (
      <div className="p-8 text-center text-neutral-500">
        Loading testimonial...
      </div>
    );

  return (
    <PageShell
      backTo="/admin/testimonials"
      title={isNew ? "Add Testimonial" : "Edit Testimonial"}
    >
      <SaveBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        label="Testimonial"
        top
      />
      <form onSubmit={handleSave}>
        <div
          className="bg-white border border-gray-300 rounded-xl p-6 space-y-4"
          style={{ boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1fr] gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Name <span className="text-destructive-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Role / Company
              </label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. Frontend Developer at TCS"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Rating (1-5)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="rating"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={handleChange}
                  className="w-24 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                />
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-4 h-4 ${i < (parseInt(form.rating, 10) || 0) ? "fill-brand-orange text-brand-orange" : "text-gray-300"}`}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Quote <span className="text-destructive-500">*</span>
            </label>
            <textarea
              name="quote"
              value={form.quote}
              onChange={handleChange}
              rows={4}
              required
              placeholder="What did the student say?"
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Avatar Image
            </label>
            <div className="flex items-center gap-3">
              {form.avatar_url ? (
                <img
                  src={form.avatar_url}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover shrink-0 border border-admin-200"
                />
              ) : null}
              <input
                type="text"
                name="avatar_url"
                value={form.avatar_url}
                onChange={handleChange}
                placeholder="Paste image URL or upload..."
                className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all bg-white shrink-0">
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[auto_auto_1fr] gap-4 items-end pt-2 border-t border-admin-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Active
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors h-[38px]">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20"
                />
                <span className="text-sm font-medium text-black whitespace-nowrap">
                  Visible on site
                </span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Sort Order
              </label>
              <input
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                className="w-28 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </form>
      <SaveCancelBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        onSave={handleSave}
        onDiscard={() => navigate("/admin/testimonials")}
      />
    </PageShell>
  );
}
