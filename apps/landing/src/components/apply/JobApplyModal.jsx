import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiUpload, FiSend, FiCheck, FiAlertCircle, FiX } from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";
import { trackFormSubmit, trackDownload } from "../../lib/analytics";

async function uploadWithRetry(bucket, path, file, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    if (!error) return { error: null };
    if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    else return { error };
  }
  return { error: new Error("Upload failed after retries") };
}

async function compressImage(file, maxWidth = 1920, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs !text-red-500 mt-1.5 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

export default function JobApplyModal({ job, onClose }) {
  const formRef = useRef(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    position: "",
    category: "",
    description: "",
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  useEffect(() => {
    if (job) {
      setForm((prev) => ({
        ...prev,
        position: job.title || "",
        category:
          job._type === "intern" ? "Internship" : job.type || prev.category,
      }));
      setStatus(null);
      setErrors({});
      setFile(null);
      setAgreeTerms(false);
    }
  }, [job]);

  if (!job) return null;

  const isInternship = form.category === "Internship";

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^[\d\s+\-()]{7,20}$/.test(form.phone))
      errs.phone = "Invalid phone number";
    if (!form.position.trim()) errs.position = "Position is required";
    if (!form.category) errs.category = "Please select a category";
    if (!form.description.trim()) errs.description = "Description is required";
    if (!agreeTerms) errs.agree = "Please agree to the terms and conditions";
    if (!file) errs.file = "Resume is required";
    else {
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
      ];
      if (!allowed.includes(file.type))
        errs.file = "Only PDF, DOC, DOCX, JPG, PNG files are allowed";
      if (file.size > 10 * 1024 * 1024) errs.file = "File must be under 10 MB";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setStatus(null);

    let file_url = "";

    if (file) {
      setUploading(true);
      let uploadFile = file;
      const isImage = ["image/jpeg", "image/png"].includes(file.type);
      if (isImage) {
        try {
          uploadFile = await compressImage(file);
        } catch {}
      }
      const ext = uploadFile.name.split(".").pop();
      const path = `career/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await uploadWithRetry(
        "career-uploads",
        path,
        uploadFile,
      );
      if (uploadError) {
        setStatus({
          type: "error",
          message: `Upload failed: ${uploadError.message || "Please try again."}`,
        });
        setUploading(false);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("career-uploads")
        .getPublicUrl(path);
      file_url = urlData.publicUrl;
      setUploading(false);
    }

    const { error: insertError } = await supabase
      .from("career_submissions")
      .insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        department: form.position,
        category: form.category,
        description: form.description,
        file_url,
      });

    if (insertError) {
      setStatus({
        type: "error",
        message: "Failed to save submission. Please try again.",
      });
      setSubmitting(false);
      return;
    }

    fetch("/api/submit-career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, file_url }),
    }).catch(() => {});

    trackFormSubmit("career");
    if (file_url) trackDownload("career_resume");
    setStatus({
      type: "success",
      message:
        "Application submitted successfully! We will get back to you soon.",
    });
    setAgreeTerms(false);
    setSubmitting(false);
  }

  function closeModal() {
    if (submitting || uploading) return;
    setForm({
      full_name: "",
      email: "",
      phone: "",
      position: "",
      category: "",
      description: "",
    });
    setFile(null);
    setErrors({});
    setStatus(null);
    setAgreeTerms(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={closeModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-brand-orange px-6 py-4 text-white relative">
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 bg-white shadow-md text-slate-600 hover:text-slate-800 p-1.5 rounded-full transition-all cursor-pointer border border-slate-200 z-10"
            aria-label="Close"
          >
            <FiX className="w-4 h-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-0.5 rounded-full text-xs font-medium text-white/90 mt-1 border border-white/10">
            Applying for: <span className="font-semibold">{job.title}</span>
          </span>
        </div>

        {status?.type === "success" ? (
          <div className="p-6 sm:p-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                Application Submitted!
              </h3>
              <p className="text-sm text-slate-500 mb-6">{status.message}</p>
              <button
                onClick={closeModal}
                className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            {status && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mx-6 sm:mx-8 mt-6 p-4 rounded-lg flex items-start gap-3 text-sm ${
                  status.type === "error"
                    ? "bg-red-50 border border-red-200 text-red-700"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                }`}
              >
                {status.type === "error" ? (
                  <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <FiCheck className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span className="flex-1">{status.message}</span>
                <button
                  onClick={() => setStatus(null)}
                  className="p-1 hover:opacity-70 rounded transition-opacity cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 sm:p-8">
              <Field label="Full Name" required error={errors.full_name}>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 ${
                    errors.full_name ? "border-red-300" : "border-slate-200"
                  }`}
                  placeholder="John Doe"
                />
              </Field>
              <Field label="Email Address" required error={errors.email}>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 ${
                    errors.email ? "border-red-300" : "border-slate-200"
                  }`}
                  placeholder="john@example.com"
                />
              </Field>
              <Field label="Phone Number" required error={errors.phone}>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 ${
                    errors.phone ? "border-red-300" : "border-slate-200"
                  }`}
                  placeholder="+1 234 567 890"
                />
              </Field>
              <Field label="Position" required error={errors.position}>
                <input
                  name="position"
                  value={form.position}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 text-sm cursor-not-allowed"
                />
              </Field>
              <Field label="Category" required error={errors.category}>
                <div className="relative">
                  {isInternship ? (
                    <input
                      name="category"
                      value={form.category}
                      readOnly
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-500 text-sm cursor-not-allowed"
                    />
                  ) : (
                    <>
                      <select
                        name="category"
                        value={form.category}
                        onChange={handleChange}
                        style={{
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                          appearance: "none",
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none ${
                          errors.category
                            ? "border-red-300"
                            : "border-slate-200"
                        } ${!form.category ? "text-slate-400" : ""}`}
                      >
                        <option value="" disabled>
                          Select category
                        </option>
                        {[
                          "Full-time",
                          "Part-time",
                          "Internship",
                          "Contract",
                          "Freelance",
                        ].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </div>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" required error={errors.description}>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/15 transition-all outline-none placeholder:text-slate-400 resize-y ${
                      errors.description ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Upload Resume" required error={errors.file}>
                  <label
                    className={`relative flex flex-col items-center justify-center p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all group ${
                      errors.file
                        ? "border-red-300 bg-red-50/50"
                        : "border-brand-orange/40 hover:border-brand-orange bg-orange-50/40 hover:bg-orange-50/80"
                    }`}
                  >
                    <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                      <FiUpload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      {file ? (
                        <span className="text-sm font-semibold text-brand-orange">
                          {file.name}
                        </span>
                      ) : (
                        <>
                          <p className="text-sm font-semibold text-slate-700">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            PDF, DOC, DOCX (max 10MB)
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setFile(f || null);
                        if (errors.file)
                          setErrors((prev) => ({ ...prev, file: "" }));
                      }}
                      className="hidden"
                    />
                    {file && (
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          if (formRef.current)
                            formRef.current.querySelector(
                              'input[type="file"]',
                            ).value = "";
                        }}
                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    )}
                  </label>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.agree)
                        setErrors((prev) => ({ ...prev, agree: "" }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange/20"
                  />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="underline hover:opacity-80 text-brand-orange"
                    >
                      Terms of Use
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="underline hover:opacity-80 text-brand-orange"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
                {errors.agree && (
                  <p className="text-xs text-red-500 mt-1">{errors.agree}</p>
                )}
              </div>
              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-fit mx-auto bg-brand-orange hover:bg-brand-orange/90 active:scale-[0.99] text-white font-semibold py-2 px-5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>{" "}
                      Uploading...
                    </>
                  ) : submitting ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-4 h-4" /> Submit Application
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
