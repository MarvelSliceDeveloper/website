import { useState } from "react";
import {
  FiMapPin,
  FiPhone,
  FiMail,
  FiClock,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Reveal from "./Reveal";
import { supabase } from "../../lib/supabaseClient";
import { trackFormSubmit } from "../../lib/analytics";

function FloatingCircles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-sm" />
      <div className="absolute top-1/3 -right-16 w-48 h-48 rounded-full bg-white/8 blur-xs" />
      <div className="absolute bottom-10 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-sm" />
      <div className="absolute -bottom-10 -right-10 w-56 h-56 rounded-full bg-white/6 blur-sm" />
      <div className="absolute top-10 left-1/2 w-20 h-20 rounded-full border border-white/15" />
      <div className="absolute bottom-1/3 left-8 w-28 h-28 rounded-full border border-white/10" />
    </div>
  );
}

function hexToRgba(hex, alpha) {
  let h = String(hex || "").replace("#", "");
  if (!h) return `rgba(255, 255, 255, ${alpha})`;
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function ContactDetailItem({ icon: Icon, label, value, href, textColor }) {
  const content = href ? (
    <a
      href={href}
      className="hover:opacity-80 transition-opacity text-xs sm:text-sm leading-relaxed block break-words"
      style={{ color: hexToRgba(textColor, 0.9) }}
    >
      {value}
    </a>
  ) : (
    <span
      className="text-xs sm:text-sm leading-relaxed block break-words"
      style={{ color: hexToRgba(textColor, 0.9) }}
    >
      {value}
    </span>
  );
  return (
    <div className="flex flex-col sm:flex-row items-start text-left gap-2 sm:gap-3">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: textColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5"
          style={{ color: hexToRgba(textColor, 0.65) }}
        >
          {label}
        </p>
        {content}
      </div>
    </div>
  );
}

export default function ContactSection({ section }) {
  const c = section?.content || {};

  const headingColor = c.heading_color || "#ffffff";
  const subheadingColor = c.subheading_color || "#ffffff";
  const textColor = c.text_color || "#ffffff";

  const leftHeading = c.left_heading || section?.heading || "Get in Touch";
  const leftSubtitle =
    c.left_subtitle ||
    "We'd love to hear from you. Reach out to us and we'll get back to you as soon as possible.";
  const address = c.address || "";
  const displayPhone = c.display_phone || c.phone || "";
  const telLink = c.tel_link || c.phone || "";
  const companyEmail = c.email || "";
  const businessHours = c.business_hours || "";

  const successMessage =
    c.success_message ||
    "Thank you! Your message has been received. Our team will contact you soon.";

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);

  function validate() {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else if (!/^[\d\s+\-()]{7,15}$/.test(form.phone.trim()))
      errs.phone = "Invalid phone number";
    if (!form.message.trim()) errs.message = "Message is required";
    if (!agreeTerms) errs.agree = "Please agree to the terms and conditions";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/submit-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        await supabase.from("contact_submissions").insert({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          message: form.message,
        });
        trackFormSubmit("contact");
        setStatus("success");
        setForm({ full_name: "", email: "", phone: "", message: "" });
        setAgreeTerms(false);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0 lg:min-h-[520px]">
        {/* Left: Get in Touch */}
        <div
          className="relative p-6 sm:p-10 flex flex-col justify-center text-center lg:text-left h-auto min-h-0"
          style={{
            background: `linear-gradient(135deg, ${c.gradient_start || "#0B2D6B"}, ${c.gradient_end || "#1E56C7"})`,
          }}
        >
          <FloatingCircles />
          <div className="relative z-10 space-y-6 sm:space-y-7 max-w-md mx-auto lg:max-w-none w-full">
            <div className="text-center lg:text-left">
              <h2
                className="text-2xl sm:text-3xl font-bold mb-2.5"
                style={{ color: headingColor }}
              >
                {leftHeading}
                {c.left_heading_line_2 && (
                  <>
                    <br />
                    <span
                      style={{ color: c.heading_line_2_color || headingColor }}
                    >
                      {c.left_heading_line_2}
                    </span>
                  </>
                )}
              </h2>
              <p
                className="text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md mx-auto lg:mx-0"
                style={{ color: subheadingColor }}
              >
                {leftSubtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-5 text-left w-full mx-auto lg:mx-0">
              {address && (
                <ContactDetailItem
                  icon={FiMapPin}
                  label="Address"
                  value={address}
                  textColor={textColor}
                />
              )}
              {displayPhone && (
                <ContactDetailItem
                  icon={FiPhone}
                  label="Phone"
                  value={displayPhone}
                  href={`tel:${telLink}`}
                  textColor={textColor}
                />
              )}
              {companyEmail && (
                <ContactDetailItem
                  icon={FiMail}
                  label="Email"
                  value={companyEmail}
                  href={`mailto:${companyEmail}`}
                  textColor={textColor}
                />
              )}
              {businessHours && (
                <ContactDetailItem
                  icon={FiClock}
                  label="Business Hours"
                  value={businessHours}
                  textColor={textColor}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Send us a Message Form */}
        <div className="bg-white p-6 sm:p-10 flex flex-col justify-center border-t border-gray-200 lg:border-t-0">
          <h3 className="text-xl sm:text-2xl font-bold text-[#0B2D6B] mb-1 text-center lg:text-left">
            Send us a Message
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mb-6 text-center lg:text-left">
            Fill out the form below and we'll get back to you shortly.
          </p>

          <AnimatePresence mode="wait">
            {status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center py-8 sm:py-10 text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <FiCheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-green-500" />
                </div>
                <h4 className="text-lg font-bold text-[#0B2D6B] mb-2">
                  Thank You!
                </h4>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-xs">
                  {successMessage}
                </p>
                <button
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm font-semibold text-[#1E56C7] hover:underline"
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 text-left">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) =>
                        handleChange("full_name", e.target.value)
                      }
                      placeholder="John Doe"
                      className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                        errors.full_name
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]"
                      }`}
                    />
                    {errors.full_name && (
                      <p className="text-xs text-red-500 mt-1 text-left">
                        {errors.full_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 text-left">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="john@example.com"
                      className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                        errors.email
                          ? "border-red-400 focus:ring-2 focus:ring-red-200"
                          : "border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]"
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1 text-left">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 text-left">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
                      errors.phone
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]"
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1 text-left">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-1.5 text-left">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    required
                    onChange={(e) => handleChange("message", e.target.value)}
                    rows={4}
                    placeholder="Write your message here..."
                    className={`w-full px-3.5 sm:px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors resize-none ${
                      errors.message
                        ? "border-red-400 focus:ring-2 focus:ring-red-200"
                        : "border-neutral-300 focus:ring-2 focus:ring-[#1E56C7]/20 focus:border-[#1E56C7]"
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500 mt-1 text-left">
                      {errors.message}
                    </p>
                  )}
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (errors.agree)
                        setErrors((prev) => ({ ...prev, agree: undefined }));
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20 shrink-0"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
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
                  <p className="text-xs text-red-500 mt-1 text-left">
                    {errors.agree}
                  </p>
                )}
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="min-h-[48px] sm:min-h-[52px] px-8 sm:px-[36px] py-3 sm:py-[15px] rounded-full bg-[#1E56C7] text-white font-semibold text-sm hover:bg-[#1642a0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {status === "submitting" ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Message"
                    )}
                  </button>
                </div>
                {status === "error" && (
                  <p className="text-xs text-red-500 text-center">
                    Something went wrong. Please try again.
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
