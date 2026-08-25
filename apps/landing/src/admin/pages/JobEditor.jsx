import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import SaveBar from "../components/SaveBar";
import SaveCancelBar from "../components/SaveCancelBar";
import PageShell from "../components/ui/PageShell";
import { FiArrowLeft } from "react-icons/fi";
import useDirty from "../hooks/useDirty";

export default function JobEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [categories, setCategories] = useState([]);

  const defaultJobForm = {
    title: "",
    role_category_id: "",
    location: "",
    type: "Full-time",
    experience: "",
    salary: "",
    apply_url: "",
    description: "",
    is_active: true,
    sort_order: 0,
  };
  const [jobForm, setJobForm] = useState(defaultJobForm);

  const { dirty, reset } = useDirty([jobForm], loading);

  useEffect(() => {
    async function loadData() {
      const { data: catRes } = await supabase
        .from("role_categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (catRes) setCategories(catRes);

      if (!isNew) {
        const { data } = await supabase
          .from("job_openings")
          .select("*")
          .eq("id", id)
          .single();
        if (data) {
          setJobForm({
            title: data.title || "",
            role_category_id: data.role_category_id || "",
            location: data.location || "",
            type: data.type || "Full-time",
            experience: data.experience || "",
            salary: data.salary || "",
            apply_url: data.apply_url || "",
            description: data.description || "",
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
    setJobForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!jobForm.title.trim()) return;
    if (!jobForm.role_category_id) return;
    if (!jobForm.type) return;
    if (!jobForm.location?.trim()) return;
    if (!jobForm.experience?.trim()) return;
    if (!jobForm.salary?.trim()) return;
    if (!jobForm.description?.trim()) return;
    setSaving(true);
    setSaved(false);
    setSaveError("");

    const payload = {
      title: jobForm.title.trim(),
      role_category_id: jobForm.role_category_id || null,
      location: jobForm.location?.trim() || null,
      type: jobForm.type?.trim() || null,
      experience: jobForm.experience?.trim() || null,
      salary: jobForm.salary?.trim() || null,
      description: jobForm.description?.trim() || null,
      apply_url: jobForm.apply_url?.trim() || null,
      is_active: jobForm.is_active,
      sort_order: jobForm.sort_order,
    };

    let res;
    if (isNew) {
      res = await supabase.from("job_openings").insert(payload);
    } else {
      res = await supabase.from("job_openings").update(payload).eq("id", id);
    }
    if (res?.error) {
      setSaveError(res.error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setSaved(true);
    reset();
    setTimeout(() => {
      navigate("/admin/jobs");
    }, 1000);
  }

  if (loading)
    return (
      <div className="p-8 text-center text-neutral-500">Loading job...</div>
    );

  return (
    <PageShell
      backTo="/admin/jobs"
      title={isNew ? "Add New Job" : "Add New Job"}
    >
      <SaveBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        label="Page"
        top
      />
      <form onSubmit={handleSave}>
        <div
          className="bg-white border border-gray-300 rounded-xl p-6 space-y-4"
          style={{ boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px" }}
        >
          {/* Row 1: Title | Category | Type */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.5fr_1fr] gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Job Title <span className="text-destructive-500">*</span>
              </label>
              <input
                name="title"
                value={jobForm.title}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Category <span className="text-destructive-500">*</span>
              </label>
              <select
                name="role_category_id"
                value={jobForm.role_category_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Type <span className="text-destructive-500">*</span>
              </label>
              <select
                name="type"
                value={jobForm.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Row 2: Location | Experience | Salary Range */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Location <span className="text-destructive-500">*</span>
              </label>
              <input
                name="location"
                value={jobForm.location}
                onChange={handleChange}
                placeholder="e.g. New York, NY"
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Experience <span className="text-destructive-500">*</span>
              </label>
              <input
                name="experience"
                value={jobForm.experience}
                onChange={handleChange}
                placeholder="e.g. 2-4 years"
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Salary Range <span className="text-destructive-500">*</span>
              </label>
              <input
                name="salary"
                value={jobForm.salary}
                onChange={handleChange}
                placeholder="e.g. $80k-$120k"
                required
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
          </div>

          {/* Row 3: Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Description <span className="text-destructive-500">*</span>
            </label>
            <textarea
              name="description"
              value={jobForm.description}
              onChange={handleChange}
              rows={6}
              required
              placeholder="Brief description or requirements..."
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all resize-y"
            />
          </div>

          {/* Row 4: Apply URL | Active | Sort Order — all in one line */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_auto_auto] gap-4 items-end pt-2 border-t border-admin-200">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Apply URL
              </label>
              <input
                name="apply_url"
                value={jobForm.apply_url}
                onChange={handleChange}
                placeholder="https://apply.example.com/position"
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Active
              </label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors h-[38px]">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={jobForm.is_active}
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
                value={jobForm.sort_order}
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
        onDiscard={() => window.location.reload()}
      />
    </PageShell>
  );
}
