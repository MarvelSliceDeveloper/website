import { useState } from "react";
import { FiPhone, FiX, FiSend, FiCheck } from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import { trackFormSubmit } from "../lib/analytics";

const SUBJECT_OPTIONS = ["Course Enquiry", "Intern Enquiry", "Other Enquiry"];

const inputCls = (hasError) =>
  `w-full px-4 py-2.5 rounded-xl border bg-slate-50/50 text-slate-800 text-sm focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none placeholder:text-slate-400 ${
    hasError ? "border-red-300" : "border-slate-200"
  }`;

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs !text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

export default function FloatingContactButton() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    if (!form.subject) errs.subject = "Please select an enquiry type";
    if (!form.message.trim()) errs.message = "Message is required";
    if (!agreeTerms) errs.agree = "Please agree to the terms and conditions";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("about_submissions").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      if (error) throw error;
      fetch("/api/submit-about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).catch(() => {});
      trackFormSubmit("about");
      setSent(true);
      setTimeout(() => {
        setOpen(false);
        setSent(false);
        setAgreeTerms(false);
        setForm({
          full_name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });
      }, 1200);
    } catch {
      setErrors({ form: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  function close() {
    if (sent || submitting) return;
    setOpen(false);
  }

  return (
    <>
      <style>{`
        @keyframes fcb-pop {
          0% { opacity: 0; transform: scale(0.3); }
          60% { opacity: 1; transform: scale(1.15); }
          80% { transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fcb-ping {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        @keyframes fcb-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fcb-modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .fcb-btn {
          animation: fcb-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards;
        }
        .fcb-ring {
          animation: fcb-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .fcb-backdrop {
          animation: fcb-fade-in 0.2s ease-out both;
        }
        .fcb-modal {
          animation: fcb-modal-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>

      <div className="fixed bottom-4 left-3 sm:bottom-6 sm:left-6 z-40">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Contact us"
          className="fcb-btn relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-lg shadow-brand-blue/30 hover:bg-brand-blue/90 transition-colors cursor-pointer"
        >
          <span
            className="fcb-ring absolute inset-0 rounded-full border-2 border-brand-blue"
            aria-hidden="true"
          />
          <FiPhone className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div
          className="fcb-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onClick={close}
        >
          <div
            className="fcb-modal relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white relative">
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute top-3 right-3 bg-white shadow-md text-slate-600 hover:text-slate-800 p-1.5 rounded-full transition-all cursor-pointer border border-slate-200"
              >
                <FiX className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold">Enquiry</h3>
              <div className="text-white text-xs mt-0.5">
                Fill the form and our team will contact you shortly.
              </div>
            </div>

            {sent ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">
                  Message sent.
                </h4>
                <p className="text-sm text-slate-500">
                  We have received your enquiry. Our team will get in touch with
                  you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required error={errors.full_name}>
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) =>
                        handleChange("full_name", e.target.value)
                      }
                      placeholder="John Doe"
                      className={inputCls(errors.full_name)}
                    />
                  </Field>
                  <Field label="Email" required error={errors.email}>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john@example.com"
                      className={inputCls(errors.email)}
                    />
                  </Field>
                  <Field label="Phone Number" required error={errors.phone}>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+1 234 567 890"
                      className={inputCls(errors.phone)}
                    />
                  </Field>
                  <Field label="Subject" required error={errors.subject}>
                    <div className="relative">
                      <select
                        value={form.subject}
                        onChange={(e) =>
                          handleChange("subject", e.target.value)
                        }
                        className={`${inputCls(errors.subject)} appearance-none ${!form.subject ? "text-slate-400" : ""}`}
                      >
                        <option value="" disabled>
                          Select enquiry type
                        </option>
                        {SUBJECT_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
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
                    </div>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Message" required error={errors.message}>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) =>
                          handleChange("message", e.target.value)
                        }
                        placeholder="Tell us how we can help..."
                        className={`${inputCls(errors.message)} resize-y`}
                      />
                    </Field>
                  </div>
                </div>
                {errors.form && (
                  <p className="!text-red-500 text-xs mt-2">{errors.form}</p>
                )}
                <label className="mt-4 flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.agree)
                        setErrors((prev) => ({ ...prev, agree: undefined }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20"
                  />
                  <span className="text-sm text-slate-600 leading-relaxed">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      Terms of Use
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="text-blue-600 underline hover:text-blue-700"
                    >
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>
                {errors.agree && (
                  <p className="!text-red-500 text-xs mt-1.5">{errors.agree}</p>
                )}
                <div className="mt-6 flex justify-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-2 px-5 rounded-lg shadow-sm transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {submitting ? (
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
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" /> Send message
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
