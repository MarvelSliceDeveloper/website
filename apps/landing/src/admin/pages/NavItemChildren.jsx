import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import {
  FiEdit2,
  FiTrash2,
  FiArrowLeft,
  FiBookOpen,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import PageShell from "../components/ui/PageShell";
import AddButton from "../components/AddButton";
import { SubmitButton, CancelButton } from "../components/FormButtons";
import useConfirm from "../hooks/useConfirm";

export default function NavItemChildren() {
  const [confirm, confirmDialog] = useConfirm();
  const { id } = useParams();
  const [parentItem, setParentItem] = useState(null);
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    label: "",
    path: "",
    is_active: true,
    course_ids: new Set(),
  });
  const [coursePickerOpen, setCoursePickerOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: navData } = await supabase
      .from("nav_items")
      .select("*")
      .order("sort_order");
    const { data: courseData } = await supabase
      .from("courses")
      .select("id, title, slug, nav_item_id")
      .order("title");
    if (navData) {
      if (id) {
        setParentItem(navData.find((i) => i.id === id) || null);
        setItems(navData.filter((i) => i.parent_id === id));
      }
    }
    if (courseData) setCourses(courseData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function linkedCourses(item) {
    return courses.filter((c) => c.nav_item_id === item.id);
  }

  function openAdd() {
    setEditing(null);
    setForm({ label: "", path: "", is_active: true, course_ids: new Set() });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      label: item.label,
      path: item.path || "",
      is_active: item.is_active !== false,
      course_ids: new Set(
        courses.filter((c) => c.nav_item_id === item.id).map((c) => c.id),
      ),
    });
    setShowForm(true);
  }

  function toggleCourse(courseId) {
    setForm((prev) => {
      const next = new Set(prev.course_ids);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return { ...prev, course_ids: next };
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.label.trim()) return;

    let childId;
    if (editing) {
      childId = editing.id;
      await supabase
        .from("nav_items")
        .update({
          label: form.label.trim(),
          path: form.path.trim() || null,
          is_active: form.is_active,
        })
        .eq("id", childId);
    } else {
      const { data } = await supabase
        .from("nav_items")
        .insert({
          label: form.label.trim(),
          path: form.path.trim() || null,
          parent_id: id,
          parent_label: null,
          is_active: form.is_active,
          sort_order: items.length,
        })
        .select("id")
        .single();
      childId = data?.id;
    }

    if (childId) {
      const currentlyLinked = new Set(
        courses.filter((c) => c.nav_item_id === childId).map((c) => c.id),
      );
      const toAdd = [...form.course_ids].filter(
        (cid) => !currentlyLinked.has(cid),
      );
      const toRemove = [...currentlyLinked].filter(
        (cid) => !form.course_ids.has(cid),
      );

      if (toAdd.length > 0) {
        await supabase
          .from("courses")
          .update({ nav_item_id: childId })
          .in("id", toAdd);
      }
      if (toRemove.length > 0) {
        await supabase
          .from("courses")
          .update({ nav_item_id: null })
          .in("id", toRemove);
      }
    }

    fetchData();
    setShowForm(false);
  }

  async function handleDelete(item) {
    if (!(await confirm(`Delete "${item.label}"?`))) return;
    const linked = courses.filter((c) => c.nav_item_id === item.id);
    if (linked.length > 0) {
      await supabase
        .from("courses")
        .update({ nav_item_id: null })
        .in(
          "id",
          linked.map((c) => c.id),
        );
    }
    await supabase.from("nav_items").delete().eq("id", item.id);
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      backTo="/admin/nav-menu/manage"
      title={parentItem ? `Children: ${parentItem.label}` : "Nav Item Children"}
      subtitle={`${items.length} child item${items.length !== 1 ? "s" : ""}`}
    >
      {!showForm && (
        <div className="mb-6">
          <AddButton onClick={openAdd} label="Add Child Item" />
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSave}
          className="p-5 mb-6 rounded-xl border border-admin-200 bg-white"
        >
          <p className="text-sm font-semibold text-black mb-4">
            {editing ? `Edit: ${editing.label}` : "Add Child Item"}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
                Label *
              </label>
              <input
                value={form.label}
                onChange={(e) =>
                  setForm((p) => ({ ...p, label: e.target.value }))
                }
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500"
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
                Path
              </label>
              <input
                value={form.path}
                onChange={(e) =>
                  setForm((p) => ({ ...p, path: e.target.value }))
                }
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-admin-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1 uppercase tracking-wider">
                Linked Courses ({form.course_ids.size} selected)
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCoursePickerOpen(!coursePickerOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-admin-200 rounded-lg text-sm bg-white hover:border-admin-400 transition-colors"
                >
                  <span
                    className={
                      form.course_ids.size > 0
                        ? "text-admin-900"
                        : "text-admin-400"
                    }
                  >
                    {form.course_ids.size > 0
                      ? `${form.course_ids.size} course${form.course_ids.size !== 1 ? "s" : ""} selected`
                      : "Select courses..."}
                  </span>
                  <FiChevronDown
                    className={`w-4 h-4 text-admin-400 transition-transform ${coursePickerOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {coursePickerOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-admin-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto admin-scrollbar">
                    {courses.map((c) => {
                      const linkedToOther =
                        c.nav_item_id &&
                        c.nav_item_id !== (editing?.id || null);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors ${linkedToOther ? "text-admin-300 cursor-not-allowed" : "hover:bg-white text-admin-700"}`}
                        >
                          <input
                            type="checkbox"
                            checked={form.course_ids.has(c.id)}
                            disabled={linkedToOther}
                            onChange={() => {
                              if (!linkedToOther) toggleCourse(c.id);
                            }}
                            className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500"
                          />
                          <span className="truncate">{c.title}</span>
                          {linkedToOther && (
                            <span className="text-[10px] text-neutral-400 ml-auto shrink-0">
                              linked elsewhere
                            </span>
                          )}
                        </label>
                      );
                    })}
                    {courses.length === 0 && (
                      <p className="px-3 py-4 text-sm text-neutral-400 text-center">
                        No courses available.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-end">
              <label className="flex items-center gap-2.5 p-3 bg-white rounded-lg border border-admin-200 cursor-pointer hover:bg-admin-100 transition-colors w-full">
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? "bg-white0" : "bg-admin-200"}`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${form.is_active ? "translate-x-4" : ""}`}
                  />
                </div>
                <span className="text-sm font-medium text-black">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <SubmitButton type="submit" label={editing ? "Save" : "Submit"} />
            <CancelButton onClick={() => setShowForm(false)} />
          </div>
        </form>
      )}

      <div className="rounded-xl border border-admin-200 bg-white overflow-hidden">
        {items.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 text-sm">
            {showForm
              ? ""
              : 'No child items yet. Click "Add Child Item" to create one.'}
          </div>
        ) : (
          <div className="divide-y divide-admin-100">
            {items.map((item) => {
              const linked = linkedCourses(item);
              return (
                <div
                  key={item.id}
                  className="px-5 py-3 hover:bg-white transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-black font-medium flex-1 truncate">
                      {item.label}
                    </span>
                    {item.path && (
                      <span className="text-[11px] text-neutral-400 bg-white px-2 py-0.5 rounded-full truncate max-w-[100px] hidden sm:inline">
                        {item.path}
                      </span>
                    )}
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${item.is_active !== false ? "bg-success-50 text-success-700" : "bg-destructive-50 text-destructive-700"}`}
                    >
                      {item.is_active !== false ? "On" : "Off"}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {linked.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                      {linked.map((c) => (
                        <Link
                          key={c.id}
                          to={`/admin/courses/${c.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-neutral-700 bg-white px-2 py-0.5 rounded-full hover:bg-neutral-100 transition-colors"
                        >
                          <FiBookOpen className="w-3 h-3" /> {c.title}
                        </Link>
                      ))}
                    </div>
                  )}
                  {linked.length === 0 && (
                    <p className="text-[11px] text-neutral-400 mt-1.5 ml-1">
                      No courses linked
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {confirmDialog}
    </PageShell>
  );
}
