import { useState, useRef } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function FormRow({
  label,
  error,
  required,
  hint,
  children,
  className = "",
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-destructive-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-neutral-400">{hint}</p>}
      {error && <p className="text-xs text-destructive-500">{error}</p>}
    </div>
  );
}

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full h-10 lg:h-9 px-3 rounded-lg border border-admin-300 bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all disabled:bg-neutral-50 disabled:text-admin-400 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full h-10 lg:h-9 px-3 rounded-lg border border-admin-300 bg-neutral-50 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all disabled:bg-neutral-50 disabled:text-neutral-400 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2 rounded-lg border border-admin-300 bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all disabled:bg-neutral-50 disabled:text-neutral-400 resize-y min-h-[80px] ${className}`}
      {...props}
    />
  );
}

export function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0 ${value ? "bg-admin-600" : "bg-admin-300"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${value ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  );
}

export function ImageUpload({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("pages").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("pages").getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste URL or upload..."
          className="flex-1 h-9 px-3 rounded-lg border border-admin-300 bg-neutral-50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
        />
        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-admin-300 rounded-lg text-xs text-admin-500 hover:border-admin-500 hover:text-admin-600 transition-all shrink-0">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            ref={inputRef}
          />
        </label>
      </div>
      {value && (
        <div className="mt-2 rounded-xl overflow-hidden border border-admin-200 shadow-sm">
          <img src={value} alt="" className="h-28 w-full object-cover" />
        </div>
      )}
    </div>
  );
}
