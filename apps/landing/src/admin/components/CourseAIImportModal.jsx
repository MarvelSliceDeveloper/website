import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiSparkles } from "react-icons/hi2";
import {
  FiX,
  FiDownload,
  FiUpload,
  FiCheck,
  FiFileText,
  FiCpu,
  FiAlertCircle,
  FiCode,
  FiInfo,
} from "react-icons/fi";

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SAMPLE_JSON = {
  _SCHEMA_RULES_: {
    title: "Required course name",
    description: "Required course summary (2-4 sentences)",
    cta_left: "Talk to Advisor",
    cta_right: "Download Brochure",
    cta_heading: "Required banner CTA heading",
    cta_description: "Required banner CTA description",
    cta_text: "Apply Now",
    checklist_items: "Array of 4 to 8 topic strings",
    highlights: "EXACTLY 9 objects with icon and label",
    projects: "EXACTLY 3 objects with title and description",
    overview_faqs: "Minimum 2 Tabmenu Q&A objects with multi-sentence answers",
    faqs: "EXACTLY 4 general FAQ objects",
    tabs: "4 tab objects (Overview, Curriculum, Projects, Certification) with title, heading, and paragraph",
    note: "Do NOT include image URLs or tags in JSON",
  },
  title: "UI/UX Design Masterclass",
  slug: "ui-ux-design-masterclass",
  description:
    "Master UI/UX design from scratch through user research, wireframing, prototyping, and modern interface design.",
  cta_left: "Talk to Advisor",
  cta_right: "Download Brochure",
  cta_heading: "Design Better Digital Experiences with UI/UX",
  cta_description:
    "Learn user research, wireframing, prototyping, and visual design with expert mentors.",
  cta_text: "Apply Now",
  duration: "3 months",
  mode: "Online",
  checklist_items: [
    "UI Design Principles & Visual Hierarchy",
    "UX Research & User-Centered Design",
    "Wireframing & Interactive Prototyping",
    "Figma & Modern Design Systems",
  ],
  highlights: [
    { icon: "code", label: "Practical Projects" },
    { icon: "shield", label: "Beginner Friendly" },
    { icon: "trending", label: "Industry Relevant" },
    { icon: "star", label: "4.9/5 Rating" },
    { icon: "users", label: "500+ Enrolled" },
    { icon: "award", label: "Verified Certificate" },
    { icon: "clock", label: "Flexible Schedule" },
    { icon: "video", label: "HD Recorded Sessions" },
    { icon: "zap", label: "Career Support" },
  ],
  projects: [
    {
      title: "E-Commerce UI/UX Design",
      description:
        "Design a complete e-commerce experience with user flows, wireframes, and high-fidelity prototypes.",
    },
    {
      title: "Mobile App Design",
      description:
        "Create a modern mobile application from user research and wireframes to an interactive Figma prototype.",
    },
    {
      title: "SaaS Dashboard Design",
      description:
        "Design a responsive analytics dashboard with reusable components and a scalable design system.",
    },
  ],
  overview_faqs: [
    {
      question: "What key skills will I master in this program?",
      answer:
        "You will master UX research, user-centered design, information architecture, wireframing, visual design, prototyping, and design systems. The program focuses on creating practical digital experiences and building a strong professional design portfolio.",
    },
    {
      question: "How is the learning structured for working professionals?",
      answer:
        "Classes are structured through flexible learning sessions with practical assignments and project-based activities. Recorded sessions and portfolio-focused projects help learners continue their progress at their own pace.",
    },
  ],
  faqs: [
    {
      question: "Are there any prerequisites for this course?",
      answer:
        "No prior UI/UX experience is required. Basic computer knowledge and an interest in design are recommended.",
    },
    {
      question: "Will I receive a verified certificate upon completion?",
      answer:
        "Yes, you will receive an industry-recognized certificate of completion.",
    },
    {
      question: "Is placement assistance provided?",
      answer:
        "Yes, we provide resume building, portfolio guidance, mock interviews, and career support.",
    },
    {
      question: "What is the mode of instruction?",
      answer:
        "This course is offered in online interactive live and self-paced modes.",
    },
  ],
  tabs: [
    {
      title: "Overview",
      heading: "Overview",
      paragraph:
        "Learn the fundamentals of UI/UX design, user-centered thinking, design principles, and modern product design workflows.",
      qa: [
        {
          question: "What key design tools will I master?",
          answers: [
            "Figma for UI Design & Modern Design Systems",
            "Miro & FigJam for User Research & Journey Mapping",
            "Protopie for Micro-Interactions & Prototyping",
          ],
        },
        {
          question: "Who is this program designed for?",
          answers: [
            "Aspiring UI/UX Designers building a job-ready portfolio",
            "Frontend Developers mastering UX design principles",
            "Product Managers enhancing user interface design skills",
          ],
        },
      ],
    },
    {
      title: "Curriculum",
      heading: "Curriculum",
      paragraph:
        "Structured learning from UX research and information architecture to wireframing, UI design, Figma, prototyping, and design systems.",
      qa: [
        {
          question: "Module 1: User Research & IA",
          answers: [
            "User Personas & Customer Journey Maps",
            "Information Architecture & Card Sorting",
          ],
        },
        {
          question: "Module 2: Figma & Design Systems",
          answers: [
            "Auto-Layout, Components & Variants",
            "Color Palettes & Typography Scales",
          ],
        },
      ],
    },
    {
      title: "Projects",
      heading: "Projects",
      paragraph:
        "Build real-world portfolio projects including e-commerce interfaces, mobile applications, and SaaS dashboards.",
      qa: [
        {
          question: "Capstone Project 1: E-Commerce App",
          answers: [
            "End-to-end shopping experience design",
            "High-fidelity mobile and desktop prototypes",
          ],
        },
      ],
    },
    {
      title: "Certification",
      heading: "Certification",
      paragraph:
        "Earn a verified UI/UX skill certification after successfully completing the course.",
      qa: [
        {
          question: "Verification & Industry Recognition",
          answers: [
            "Shareable digital certificate badge",
            "Recognized by leading design agencies",
          ],
        },
      ],
    },
  ],
};

const SAMPLE_CSV = `title,description,cta_left,cta_right,cta_heading,cta_description,cta_text,checklist_items,duration,mode
"UI/UX Design Masterclass","Master UI/UX design from scratch through user research, wireframing, prototyping, and modern interface design.","Talk to Advisor","Download Brochure","Design Better Digital Experiences with UI/UX","Learn user research, wireframing, prototyping, and visual design with expert mentors.","Apply Now","UI Design Principles | UX Research | Wireframing | Figma Design Systems","3 months","Online"`;

export default function CourseAIImportModal({ isOpen, onClose, onImportData }) {
  const [activeTab, setActiveTab] = useState("templates");
  const [pastedContent, setPastedContent] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  function handleDownloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadJSONTemplate() {
    handleDownloadFile(
      JSON.stringify(SAMPLE_JSON, null, 2),
      "course_template.json",
      "application/json",
    );
  }

  function handleDownloadCSVTemplate() {
    handleDownloadFile(SAMPLE_CSV, "course_template.csv", "text/csv");
  }

  function processParsedJSON(parsed) {
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid JSON format. Expected an object.");
    }

    const title =
      parsed.title || parsed.course_title || parsed.cta_heading || "";
    if (!title.trim()) {
      throw new Error('JSON is missing required field: "title".');
    }

    // Normalize highlights (must have 9 items)
    let rawHighlights = parsed.highlights || [];
    if (!Array.isArray(rawHighlights)) rawHighlights = [];
    const formattedHighlights = Array.from({ length: 9 }, (_, index) => {
      const existing = rawHighlights[index];
      if (existing) {
        return {
          icon: existing.icon || "star",
          label: typeof existing === "string" ? existing : existing.label || "",
        };
      }
      return { icon: "star", label: "" };
    });

    // Normalize projects (must have 3 items)
    let rawProjects = parsed.projects || [];
    if (!Array.isArray(rawProjects)) rawProjects = [];
    const formattedProjects = Array.from({ length: 3 }, (_, index) => {
      const existing = rawProjects[index];
      if (existing) {
        return {
          title: existing.title || "",
          description: existing.description || "",
        };
      }
      return { title: "", description: "" };
    });

    // Parse Course Tabs directly from JSON matching CourseWizard expected format
    let formattedTabs = [];
    if (Array.isArray(parsed.tabs)) {
      formattedTabs = parsed.tabs
        .map((t) => {
          const titleStr = typeof t === "string" ? t : t.title || t.label || "";
          const headingStr =
            typeof t === "object" && t.content?.heading
              ? t.content.heading
              : t.heading || titleStr;
          const paragraphStr =
            typeof t === "object"
              ? typeof t.content === "string"
                ? t.content
                : t.content?.paragraph || t.paragraph || t.description || ""
              : "";

          // Extract QA / Features items for this tab
          let rawQa = [];
          if (typeof t === "object") {
            rawQa =
              t.qa ||
              t.content?.qa ||
              t.items ||
              t.features ||
              t.questions ||
              [];
          }
          if (!Array.isArray(rawQa)) rawQa = [];

          const formattedQa = rawQa
            .map((qItem) => {
              if (typeof qItem === "string") {
                return { question: qItem, answers: [qItem] };
              }
              const question = qItem.question || qItem.title || qItem.q || "";
              let answers =
                qItem.answers ||
                qItem.answer ||
                qItem.bullets ||
                qItem.items ||
                [];
              if (typeof answers === "string") {
                answers = answers
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean);
              } else if (!Array.isArray(answers)) {
                answers = [];
              }
              return { question, answers };
            })
            .filter((q) => q.question.trim());

          return {
            label: titleStr,
            title: titleStr,
            content_type: "overview",
            content: {
              heading: headingStr,
              paragraph: paragraphStr,
              subheading:
                typeof t === "object" && t.content?.subheading
                  ? t.content.subheading
                  : t.subheading || "",
              subparagraph:
                typeof t === "object" && t.content?.subparagraph
                  ? t.content.subparagraph
                  : t.subparagraph || "",
              headingAlign: "left",
              paragraphAlign: "left",
              subheadingAlign: "left",
              subparagraphAlign: "left",
              qa: formattedQa,
            },
          };
        })
        .filter((t) => (t.label || t.title).trim());
    }

    // Parse Tabmenu Questions (overview_faqs: minimum 2 items)
    let formattedOverviewFaqs = [];
    let rawOverviewFaqs = parsed.overview_faqs || parsed.tabmenu_faqs || [];
    if (Array.isArray(rawOverviewFaqs)) {
      formattedOverviewFaqs = rawOverviewFaqs
        .map((f) => ({
          question: f.question || f.q || "",
          answer: f.answer || f.a || "",
        }))
        .filter((f) => f.question.trim());
    }

    // Parse General FAQs (faqs: 4 items)
    let formattedFaqs = [];
    if (Array.isArray(parsed.faqs)) {
      formattedFaqs = parsed.faqs
        .map((f) => ({
          question: f.question || f.q || "",
          answer: f.answer || f.a || "",
        }))
        .filter((f) => f.question.trim());
    }

    // Parse Certifications directly from JSON if provided (without image URLs)
    let formattedCertifications = [];
    if (Array.isArray(parsed.certifications)) {
      formattedCertifications = parsed.certifications.map((c) => ({
        description: c.description || "",
        certificate_image_url: "",
        recognized_companies: Array.isArray(c.recognized_companies)
          ? c.recognized_companies.filter(Boolean)
          : [],
      }));
    }

    // Normalize checklist items
    let checklist = parsed.checklist_items || parsed.checklist || [];
    if (typeof checklist === "string") {
      checklist = checklist
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const courseData = {
      title: title,
      slug: parsed.slug || slugify(title),
      description: parsed.description || "",
      hero_image_url: "",
      video_thumbnail_url: "",
      video_url: "",
      cta_left: parsed.cta_left || "Talk to Advisor",
      cta_right: parsed.cta_right || "Download Brochure",
      cta_heading: parsed.cta_heading || title || "",
      cta_description: parsed.cta_description || parsed.description || "",
      cta_text: parsed.cta_text || "Apply Now",
      cta_link: parsed.cta_link || "",
      cta_background_image: "",
      checklist_items: checklist,
      tabs: formattedTabs,
      highlights: formattedHighlights,
      projects: formattedProjects,
      certifications: formattedCertifications,
      overview_faqs: formattedOverviewFaqs,
      faqs: formattedFaqs,
      duration: parsed.duration || "3 months",
      mode: parsed.mode || "Online",
    };

    onImportData(courseData);
    setSuccessMsg("Successfully parsed and auto-filled course data!");
    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1200);
  }

  function handleProcessText() {
    setError("");
    setSuccessMsg("");

    if (!pastedContent.trim()) {
      setError("Please paste JSON text from your editor.");
      return;
    }

    try {
      let cleanText = pastedContent.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText
          .replace(/^```(?:json)?\n?/, "")
          .replace(/\n?```$/, "");
      }

      const parsed = JSON.parse(cleanText);
      processParsedJSON(parsed);
    } catch (err) {
      setError(
        `Failed to parse JSON: ${err.message}. Please verify JSON formatting.`,
      );
    }
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2)
      throw new Error("CSV must contain a header row and at least 1 data row.");

    const parseRow = (line) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ""));
      return result;
    };

    const headers = parseRow(lines[0]).map((h) => h.toLowerCase());
    const values = parseRow(lines[1]);

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || "";
    });
    return obj;
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSuccessMsg("");

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result;
        if (file.name.endsWith(".csv")) {
          const parsedCsv = parseCSV(content);
          processParsedJSON(parsedCsv);
        } else {
          const parsedJson = JSON.parse(content);
          processParsedJSON(parsedJson);
        }
      } catch (err) {
        setError(`Failed to process file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-neutral-200 max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <HiSparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 leading-tight">
                  Course Data Import
                </h3>
                <p className="text-xs text-neutral-500">
                  Download templates, paste JSON, or upload JSON/CSV
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-200/60 rounded-xl transition-colors text-neutral-400 hover:text-neutral-600 cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-neutral-200 bg-neutral-100/50 px-6 gap-2 pt-2">
            {[
              {
                id: "templates",
                label: "1. Download Templates",
                icon: FiFileText,
              },
              { id: "paste", label: "2. Paste JSON", icon: FiCpu },
              { id: "upload", label: "3. Upload File", icon: FiUpload },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
                    isActive
                      ? "bg-white text-neutral-900 border-amber-500 shadow-2xs"
                      : "text-neutral-500 border-transparent hover:text-neutral-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 font-medium">
                <FiAlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                <FiCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: 2 TEMPLATES ONLY */}
            {activeTab === "templates" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Download Official Course Templates
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleDownloadJSONTemplate}
                      className="flex flex-col items-center justify-center p-5 bg-neutral-50 hover:bg-amber-50/40 border border-neutral-200 hover:border-amber-400 rounded-2xl text-center transition-all group cursor-pointer"
                    >
                      <FiCode className="w-7 h-7 text-neutral-600 group-hover:text-amber-600 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-neutral-800">
                        JSON Template
                      </span>
                      <span className="text-[11px] text-neutral-400 mt-0.5">
                        Pre-filled .json format with rules
                      </span>
                    </button>

                    <button
                      onClick={handleDownloadCSVTemplate}
                      className="flex flex-col items-center justify-center p-5 bg-neutral-50 hover:bg-amber-50/40 border border-neutral-200 hover:border-amber-400 rounded-2xl text-center transition-all group cursor-pointer"
                    >
                      <FiDownload className="w-7 h-7 text-neutral-600 group-hover:text-amber-600 mb-2 transition-colors" />
                      <span className="text-xs font-bold text-neutral-800">
                        CSV Template
                      </span>
                      <span className="text-[11px] text-neutral-400 mt-0.5">
                        Spreadsheet .csv headers
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PASTE JSON */}
            {activeTab === "paste" && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Paste JSON data below. The form will parse and auto-populate
                  all course fields!
                </p>
                <textarea
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  rows={9}
                  placeholder={`Paste JSON here...\n\nExample:\n{\n  "title": "UI/UX Design Masterclass",\n  "description": "...",\n  "cta_heading": "..."\n}`}
                  className="w-full p-3.5 border border-neutral-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-neutral-50/50"
                />
                <button
                  onClick={handleProcessText}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <HiSparkles className="w-4 h-4" /> Auto-Fill Course Form
                </button>
              </div>
            )}

            {/* TAB 3: UPLOAD FILE */}
            {activeTab === "upload" && (
              <div className="space-y-4 text-center py-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-amber-500 bg-neutral-50 hover:bg-amber-50/30 rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiUpload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-800">
                      Click to Upload JSON or CSV File
                    </span>
                    <span className="block text-[11px] text-neutral-400 mt-0.5">
                      Supports .json and .csv template files
                    </span>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
