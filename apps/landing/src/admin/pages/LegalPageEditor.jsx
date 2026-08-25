import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabaseClient";
import useDirty from "../hooks/useDirty";
import useConfirm from "../hooks/useConfirm";
import SaveBar from "../components/SaveBar";
import SaveCancelBar from "../components/SaveCancelBar";
import AddButton from "../components/AddButton";
import PageShell from "../components/ui/PageShell";
import {
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiEdit3,
} from "react-icons/fi";

function uid() {
  return (
    crypto?.randomUUID?.() ||
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

function AlignButtons({ value, onChange }) {
  const options = [
    { value: "left", icon: FiAlignLeft },
    { value: "center", icon: FiAlignCenter },
    { value: "right", icon: FiAlignRight },
  ];
  return (
    <div className="flex items-center gap-1 p-1 bg-admin-100 rounded-lg w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${value === opt.value ? "bg-white text-neutral-700 shadow-sm" : "text-admin-400 hover:text-admin-600"}`}
        >
          <opt.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

export default function LegalPageEditor({ pageKey }) {
  const isTerms = pageKey === "terms";
  const label = isTerms ? "Terms & Conditions" : "Privacy Policy";
  const queryClient = useQueryClient();
  const [confirm, confirmDialog] = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [pageId, setPageId] = useState(null);
  const [title, setTitle] = useState("");
  const [intro, setIntro] = useState("");
  const [sections, setSections] = useState([]);

  const { reset } = useDirty([title, intro, sections], loading);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("legal_pages")
        .select("*")
        .eq("page_key", pageKey)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setPageId(data.id);
        setTitle(data.title || "");
        setIntro(data.intro || "");
        setSections(Array.isArray(data.sections) ? data.sections : []);
      } else {
        setPageId(null);
        setTitle("");
        setIntro("");
        setSections([]);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  function updateSection(id, patch) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }

  function addSection() {
    setSections((prev) => [
      ...prev,
      {
        id: uid(),
        heading: "",
        body: "",
        heading_align: "left",
        body_align: "left",
      },
    ]);
  }

  async function removeSection(id) {
    if (!(await confirm("Delete this section?"))) return;
    setSections((prev) => prev.filter((s) => s.id !== id));
  }

  function moveSection(index, dir) {
    setSections((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError("");

    const payload = {
      page_key: pageKey,
      title: title.trim(),
      intro: intro.trim(),
      sections: sections.map((s) => ({
        id: s.id,
        heading: (s.heading || "").trim(),
        body: (s.body || "").trim(),
        heading_align: s.heading_align || "left",
        body_align: s.body_align || "left",
      })),
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    let res;
    if (pageId) {
      res = await supabase.from("legal_pages").update(payload).eq("id", pageId);
    } else {
      res = await supabase
        .from("legal_pages")
        .insert(payload)
        .select("id")
        .single();
    }

    if (res.error) {
      setSaveError(res.error.message);
    } else {
      if (res.data?.id) setPageId(res.data.id);
      setSaved(true);
      reset();
      queryClient.invalidateQueries({ queryKey: ["legal-page", pageKey] });
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const inputClass =
    "w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all";

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <PageShell backTo="/admin" title={label}>
      <SaveBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        label={label}
        top
      />

      <form
        onSubmit={handleSave}
        className="bg-white border border-gray-300 rounded-[20px] shadow-sm p-6 space-y-6"
      >
        <div className="grid sm:grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title shown at the top"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
            Intro
          </label>
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={3}
            placeholder="Optional intro paragraph below the title"
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
              Sections
            </label>
            <AddButton onClick={addSection} label="Add Section" />
          </div>

          {sections.length === 0 ? (
            <div className="border-2 border-dashed border-admin-200 rounded-lg p-8 text-center">
              <FiEdit3 className="w-6 h-6 mx-auto mb-2 text-admin-300" />
              <p className="text-sm text-neutral-500 mb-4">
                No sections yet. Add sections with headings and body text.
              </p>
              <AddButton onClick={addSection} label="Add Section" />
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className="border border-admin-200 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-admin-500 uppercase tracking-wider">
                      Section {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(index, -1)}
                        disabled={index === 0}
                        className="p-1.5 text-admin-400 hover:text-admin-600 hover:bg-admin-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <FiArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 1)}
                        disabled={index === sections.length - 1}
                        className="p-1.5 text-admin-400 hover:text-admin-600 hover:bg-admin-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      >
                        <FiArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Heading
                      </label>
                      <AlignButtons
                        value={section.heading_align}
                        onChange={(v) =>
                          updateSection(section.id, { heading_align: v })
                        }
                      />
                    </div>
                    <input
                      type="text"
                      value={section.heading}
                      onChange={(e) =>
                        updateSection(section.id, { heading: e.target.value })
                      }
                      placeholder="Section heading"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                        Body
                      </label>
                      <AlignButtons
                        value={section.body_align}
                        onChange={(v) =>
                          updateSection(section.id, { body_align: v })
                        }
                      />
                    </div>
                    <textarea
                      value={section.body}
                      onChange={(e) =>
                        updateSection(section.id, { body: e.target.value })
                      }
                      rows={6}
                      placeholder="Body text. Use plain text; blank lines create paragraph breaks."
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      <SaveCancelBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        onSave={handleSave}
        onDiscard={() => window.location.reload()}
      />

      {confirmDialog}
    </PageShell>
  );
}
