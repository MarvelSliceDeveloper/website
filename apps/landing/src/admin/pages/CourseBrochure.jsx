import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminButton from "../components/AdminButton";
import PageShell from "../components/ui/PageShell";
import { FiDownload, FiLoader, FiCheck, FiSearch, FiX } from "react-icons/fi";

const categories = [
  "Software Learning",
  "Competitive Exam",
  "Services",
  "Training",
  "Career",
];

export default function CourseBrochure() {
  const [courses, setCourses] = useState([]);
  const [navItems, setNavItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const [coursesRes, navRes] = await Promise.all([
        supabase
          .from("courses")
          .select(
            "*, highlights(*), overview_faqs(*), course_fees(*), projects(*), certifications(*), course_tabs(*)",
          )
          .order("id", { ascending: false }),
        supabase
          .from("nav_items")
          .select("id, label, parent_label, parent_id")
          .order("sort_order"),
      ]);
      setCourses(coursesRes.data || []);
      setNavItems(navRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  function getCourseCategory(course) {
    if (!course.nav_item_id) return null;
    const item = navItems.find((n) => n.id === course.nav_item_id);
    return item?.parent_label || null;
  }

  return (
    <PageShell
      backTo="/admin"
      title="Course Brochure"
      subtitle="Generate combined brochure PDFs for courses"
      actions={
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <AdminButton
            onClick={() => setOpen(true)}
            variant="primary"
            size="md"
          >
            <FiDownload className="w-4 h-4" />
            Download
          </AdminButton>
        </div>
      }
    >
      {open && (
        <GenerateDialog
          courses={courses}
          navItems={navItems}
          getCourseCategory={getCourseCategory}
          onClose={() => setOpen(false)}
        />
      )}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {!loading && (
        <div className="text-center py-16 text-neutral-400">
          <FiDownload className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">
            Click "Download" to generate a brochure PDF
          </p>
          <p className="text-xs mt-1">
            Select courses by category or individually to include in the PDF
          </p>
        </div>
      )}
    </PageShell>
  );
}

function GenerateDialog({ courses, navItems, getCourseCategory, onClose }) {
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [generating, setGenerating] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const coursesByCategory = useMemo(() => {
    const map = {};
    for (const c of courses) {
      const cat = getCourseCategory(c) || "Uncategorized";
      if (!map[cat]) map[cat] = [];
      map[cat].push(c);
    }
    return map;
  }, [courses, getCourseCategory]);

  function toggleCategory(cat) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
        return next;
      }
      next.add(cat);
      return next;
    });
    setSelectedCourses(new Set());
  }

  function toggleCourse(id) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectedCategories(new Set());
  }

  function selectAll() {
    if (selectedCourses.size === courses.length) setSelectedCourses(new Set());
    else setSelectedCourses(new Set(courses.map((c) => c.id)));
    setSelectedCategories(new Set());
  }

  const searchedCourses = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [search, courses]);

  const hasSelection = selectedCategories.size > 0 || selectedCourses.size > 0;

  function getSelectedCoursesList() {
    if (selectedCategories.size > 0)
      return courses.filter((c) =>
        selectedCategories.has(getCourseCategory(c)),
      );
    if (selectedCourses.size > 0)
      return courses.filter((c) => selectedCourses.has(c.id));
    return [];
  }

  async function generate() {
    const target = getSelectedCoursesList();
    if (target.length === 0) return;
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 100));

    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = 190;
    let y = 20;

    function addText(text, size, style, color, indent) {
      if (!text) return;
      const lines = pdf.splitTextToSize(
        String(text),
        pageW - (indent || 0) * 5,
      );
      pdf.setFontSize(size);
      pdf.setTextColor(color || "#1e293b");
      if (style === "bold") pdf.setFont("Helvetica", "bold");
      else pdf.setFont("Helvetica", "normal");
      const lineH = size * 0.3528;
      if (y + lines.length * lineH > 280) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(lines, 10 + (indent || 0) * 5, y);
      y += lines.length * lineH + 2;
    }

    target.forEach((course, ci) => {
      if (ci > 0) {
        pdf.addPage();
        y = 20;
      }
      pdf.setFontSize(18);
      pdf.setTextColor("#0f172a");
      pdf.setFont("Helvetica", "bold");
      pdf.text(String(course.title || ""), 10, y);
      y += 8;

      if (course.subtitle) {
        pdf.setFontSize(11);
        pdf.setTextColor("#475569");
        pdf.setFont("Helvetica", "normal");
        pdf.text(String(course.subtitle), 10, y);
        y += 6;
      }
      y += 2;

      if (course.description) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("About the Course", 10, y);
        y += 5;
        addText(course.description, 10, "normal", "#475569");
        y += 2;
      }

      if (course.checklist_items?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("Key Highlights", 10, y);
        y += 5;
        course.checklist_items.forEach((item) => {
          const text =
            typeof item === "string" ? item : item.text || item.label || "";
          addText("• " + text, 10, "normal", "#475569", 1);
        });
        y += 2;
      }

      if (course.highlights?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("Highlights", 10, y);
        y += 5;
        const labels = course.highlights
          .map((h) => String(h.label || ""))
          .filter(Boolean);
        if (labels.length > 0) {
          pdf.setFontSize(10);
          pdf.setTextColor("#2563eb");
          pdf.setFont("Helvetica", "normal");
          const line = labels.join("  •  ");
          const wrapped = pdf.splitTextToSize(line, pageW);
          if (y + wrapped.length * 4 > 280) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(wrapped, 10, y);
          y += wrapped.length * 4 + 2;
        }
      }

      if (course.course_tabs?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("Course Content", 10, y);
        y += 5;
        course.course_tabs.forEach((tab) => {
          const label = tab.label || tab.tab_label || "";
          if (y > 275) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFontSize(11);
          pdf.setTextColor("#1e293b");
          pdf.setFont("Helvetica", "bold");
          pdf.text(String(label), 10, y);
          y += 5;
          const c = tab.content || {};
          if (c.heading) addText(c.heading, 11, "bold", "#0f172a", 1);
          if (c.subheading) addText(c.subheading, 10, "normal", "#334155", 1);
          const body = c.text || c.paragraph || "";
          if (body) addText(body, 10, "normal", "#475569", 1);
          if (c.qa && Array.isArray(c.qa)) {
            c.qa.forEach((qa) => {
              if (qa.question)
                addText("Q: " + String(qa.question), 10, "bold", "#0f172a", 1);
              if (qa.answers && Array.isArray(qa.answers)) {
                qa.answers.forEach((ans) => {
                  if (ans)
                    addText("• " + String(ans), 9, "normal", "#475569", 2);
                });
              }
            });
          }
          y += 2;
        });
      }

      if (course.projects?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("Projects", 10, y);
        y += 5;
        course.projects.forEach((p) => {
          const title = p.title || p.name || "";
          if (title) addText(title, 10, "bold", "#1e293b", 1);
          if (p.description) addText(p.description, 10, "normal", "#475569", 1);
          y += 1;
        });
      }

      if (course.course_fees?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("Pricing Plans", 10, y);
        y += 5;
        const headers = [["Plan", "Price", "Duration"]];
        const rows = course.course_fees.map((plan) => [
          String(plan.plan_name || ""),
          "₹" + String(plan.price || ""),
          String(plan.duration || ""),
        ]);
        if (y + rows.length * 8 > 280) {
          pdf.addPage();
          y = 20;
        }
        autoTable(pdf, {
          head: headers,
          body: rows,
          startY: y,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        });
        y = pdf.lastAutoTable.finalY + 6;
      }

      if (course.certifications?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("Certifications", 10, y);
        y += 5;
        course.certifications.forEach((cert) => {
          const name = cert.title || cert.name || "";
          if (name) addText(name, 10, "bold", "#1e293b", 1);
          if (cert.description)
            addText(cert.description, 9, "normal", "#475569", 1);
          y += 1;
        });
      }

      if (course.overview_faqs?.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor("#0f172a");
        pdf.setFont("Helvetica", "bold");
        pdf.text("FAQs", 10, y);
        y += 5;
        course.overview_faqs.forEach((faq, i) => {
          if (faq.question)
            addText(
              i + 1 + ". " + String(faq.question),
              10,
              "bold",
              "#1e293b",
              1,
            );
          if (faq.answer)
            addText(String(faq.answer), 10, "normal", "#475569", 1);
          y += 1;
        });
      }
    });

    let label = "course-brochure";
    if (selectedCategories.size > 0)
      label = Array.from(selectedCategories)
        .join("-")
        .toLowerCase()
        .replace(/\s+/g, "-");
    else if (selectedCourses.size === courses.length) label = "all-courses";
    else if (selectedCourses.size > 0)
      label = `selected-${selectedCourses.size}-courses`;
    pdf.save(`${label}.pdf`);
    setGenerating(false);
    onClose();
  }

  const selectedCount =
    selectedCategories.size > 0
      ? courses.filter((c) => selectedCategories.has(getCourseCategory(c)))
          .length
      : selectedCourses.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 cursor-pointer"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg border border-admin-200 w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-black">Generate Report</h2>
            <p className="text-xs text-neutral-400">
              Select courses to include in the PDF
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-admin-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-admin-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto admin-scrollbar px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              By Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategories.has(cat);
                const count = coursesByCategory[cat]?.length || 0;
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${active ? "bg-admin-600 text-white border-admin-600" : "bg-white text-admin-600 border-admin-200 hover:border-admin-300"}`}
                  >
                    {cat}
                    <span
                      className={`ml-1.5 text-xs ${active ? "text-white/70" : "text-neutral-400"} `}
                    >
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-admin-200" />
            <span className="text-xs text-neutral-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-admin-200" />
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Select Courses
              </p>
              <button
                onClick={selectAll}
                className="text-xs text-admin-600 font-medium hover:underline"
              >
                {selectedCourses.size === courses.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>
            <div className="relative mb-3">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                placeholder="Search courses..."
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 h-9 border border-admin-200 rounded-lg text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
              />
            </div>
            <div className="max-h-52 overflow-y-auto admin-scrollbar border border-admin-100 rounded-lg divide-y divide-admin-50">
              {(() => {
                const display = search.trim() ? searchedCourses : courses;
                const totalPages = Math.ceil(display.length / 5);
                const safePage = Math.min(page, totalPages);
                const paginated = display.slice(
                  (safePage - 1) * 5,
                  safePage * 5,
                );
                return paginated.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-4">
                    No courses found.
                  </p>
                ) : (
                  paginated.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => toggleCourse(course.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white transition-colors ${selectedCourses.has(course.id) ? "bg-white" : ""}`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedCourses.has(course.id) ? "bg-admin-600 border-admin-600" : "border-admin-300"}`}
                      >
                        {selectedCourses.has(course.id) && (
                          <FiCheck className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span className="text-sm text-black truncate">
                        {course.title}
                      </span>
                      <span className="text-xs text-neutral-400 ml-auto shrink-0">
                        {getCourseCategory(course) || "Uncategorized"}
                      </span>
                    </button>
                  ))
                );
              })()}
            </div>
            {(() => {
              const total = search.trim()
                ? searchedCourses.length
                : courses.length;
              const pages = Math.ceil(total / 5);
              if (pages <= 1) return null;
              return (
                <div className="flex items-center justify-center gap-1 pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-2 py-1 text-xs font-medium text-admin-500 hover:text-admin-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded text-xs font-medium transition-colors ${p === page ? "bg-admin-600 text-white" : "text-admin-500 hover:bg-admin-100"}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="px-2 py-1 text-xs font-medium text-admin-500 hover:text-admin-900 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-admin-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-neutral-400">
            {selectedCount > 0
              ? `${selectedCount} course${selectedCount > 1 ? "s" : ""} selected`
              : "No courses selected"}
          </span>
          <AdminButton
            onClick={generate}
            disabled={!hasSelection || generating}
            variant="primary"
            size="md"
          >
            {generating ? (
              <FiLoader className="w-4 h-4 animate-spin" />
            ) : (
              <FiDownload className="w-4 h-4" />
            )}
            {generating ? "Generating..." : "Generate PDF"}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}
