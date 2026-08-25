import { useState, useMemo } from "react";
import {
  FiX,
  FiSend,
  FiLoader,
  FiUpload,
  FiSearch,
  FiFileText,
  FiBookOpen,
} from "react-icons/fi";
import { supabase } from "../../lib/supabaseClient";
import { SubmitButton } from "./FormButtons";

export default function ReplyModal({ submission, type, onClose }) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [brochureTab, setBrochureTab] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseSearch, setCourseSearch] = useState("");
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);

  const recipientName = submission?.full_name || submission?.name || "";
  const recipientEmail = submission?.email || "";

  async function loadCourses() {
    if (courses.length > 0) return;
    setCoursesLoading(true);
    const { data } = await supabase
      .from("courses")
      .select("id, title, slug")
      .eq("is_published", true)
      .order("title");
    setCourses(data || []);
    setCoursesLoading(false);
  }

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [courses, courseSearch]);

  async function handleUploadFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const filePath = `brochure-reply/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("pages")
      .upload(filePath, file);
    if (upErr) {
      setError("Upload failed: " + upErr.message);
      setUploadingFile(false);
      return;
    }
    const { data: urlData } = supabase.storage
      .from("pages")
      .getPublicUrl(filePath);
    setUploadFile(file);
    setUploadUrl(urlData.publicUrl);
    setUploadingFile(false);
  }

  function getAttachmentInfo() {
    if (type === "brochure" && brochureTab === "upload" && uploadUrl) {
      return { url: uploadUrl, name: uploadFile?.name || "brochure.pdf" };
    }
    if (type === "brochure" && brochureTab === "select" && selectedCourse) {
      return { courseTitle: selectedCourse.title, courseId: selectedCourse.id };
    }
    return null;
  }

  async function handleSend() {
    if (!subject.trim() || !message.trim()) {
      setError("Subject and message are required");
      return;
    }

    setSending(true);
    setError("");

    const payload = {
      to_email: recipientEmail,
      to_name: recipientName,
      subject: subject.trim(),
      message: message.trim(),
      type,
      attachment: getAttachmentInfo(),
    };

    try {
      const res = await fetch("/api/admin-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
      } else {
        setError("Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-black">
              Reply to {recipientName}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">{recipientEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-admin-400 hover:text-admin-600 hover:bg-admin-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mb-4">
              <FiSend className="w-7 h-7 text-success-500" />
            </div>
            <h3 className="text-lg font-bold text-black mb-2">Reply Sent!</h3>
            <p className="text-sm text-neutral-500 max-w-xs">
              Your reply has been sent to {recipientEmail}.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-admin-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-4">
              {/* Brochure tabs */}
              {type === "brochure" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-2 uppercase tracking-wider">
                    Attach Brochure
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => {
                        setBrochureTab("upload");
                        setSelectedCourse(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${brochureTab === "upload" ? "bg-admin-600 text-white" : "border border-admin-200 text-admin-600 hover:bg-white"}`}
                    >
                      <FiUpload className="w-4 h-4" /> Upload
                    </button>
                    <button
                      onClick={() => {
                        setBrochureTab("select");
                        loadCourses();
                        setUploadUrl("");
                        setUploadFile(null);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${brochureTab === "select" ? "bg-admin-600 text-white" : "border border-admin-200 text-admin-600 hover:bg-white"}`}
                    >
                      <FiBookOpen className="w-4 h-4" /> Select Course
                    </button>
                  </div>

                  {brochureTab === "upload" && (
                    <div className="border border-admin-200 rounded-lg p-4 bg-white">
                      {uploadUrl ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiFileText className="w-5 h-5 text-admin-600" />
                            <span className="text-sm text-neutral-700 truncate max-w-[250px]">
                              {uploadFile?.name || "brochure.pdf"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setUploadUrl("");
                              setUploadFile(null);
                            }}
                            className="text-xs text-destructive-500 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 py-6 border-2 border-dashed border-admin-200 rounded-lg cursor-pointer hover:border-admin-500 transition-colors">
                          {uploadingFile ? (
                            <FiLoader className="w-5 h-5 animate-spin text-admin-400" />
                          ) : (
                            <>
                              <FiUpload className="w-5 h-5 text-admin-400" />
                              <span className="text-sm text-neutral-500">
                                Click to upload a brochure PDF
                              </span>
                            </>
                          )}
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleUploadFile}
                            className="hidden"
                            disabled={uploadingFile}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {brochureTab === "select" && (
                    <div className="border border-admin-200 rounded-lg overflow-hidden">
                      <div className="relative border-b border-admin-200">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-400" />
                        <input
                          type="text"
                          value={courseSearch}
                          onChange={(e) => setCourseSearch(e.target.value)}
                          placeholder="Search courses..."
                          className="w-full pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-admin-500"
                        />
                      </div>
                      <div className="max-h-36 overflow-y-auto admin-scrollbar divide-y divide-admin-100">
                        {coursesLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <FiLoader className="w-5 h-5 animate-spin text-admin-400" />
                          </div>
                        ) : filteredCourses.length === 0 ? (
                          <p className="text-sm text-neutral-400 text-center py-6">
                            No courses found
                          </p>
                        ) : (
                          filteredCourses.map((c) => (
                            <button
                              key={c.id}
                              onClick={() =>
                                setSelectedCourse(
                                  selectedCourse?.id === c.id ? null : c,
                                )
                              }
                              className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${selectedCourse?.id === c.id ? "bg-white text-admin-700 font-medium" : "text-admin-700 hover:bg-white"}`}
                            >
                              <FiBookOpen
                                className={`w-4 h-4 shrink-0 ${selectedCourse?.id === c.id ? "text-admin-600" : "text-admin-400"}`}
                              />
                              {c.title}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Subject{" "}
                  {type === "career" && (
                    <span className="text-neutral-400 normal-case">
                      (optional — leave blank to use default)
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-4 py-2.5 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1.5 uppercase tracking-wider">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Write your reply message here..."
                  className="w-full px-4 py-2.5 border border-admin-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-admin-500 resize-none"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive-500 bg-destructive-50 border border-destructive-500 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-admin-200 shrink-0">
              <span className="text-xs text-neutral-400">
                {type === "brochure" &&
                brochureTab === "select" &&
                selectedCourse
                  ? `Will send "${selectedCourse.title}" overview`
                  : type === "brochure" && brochureTab === "upload" && uploadUrl
                    ? "Will attach uploaded file"
                    : "Reply via email"}
              </span>
              <SubmitButton
                onClick={handleSend}
                saving={sending}
                savingLabel="Sending..."
                label="Send Reply"
                disabled={!subject.trim() || !message.trim()}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
