import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi2';
import {
  FiX,
  FiDownload,
  FiUpload,
  FiCheck,
  FiFileText,
  FiCpu,
  FiAlertCircle,
  FiCode,
  FiLoader
} from 'react-icons/fi';
import { generateFullCourseWithAI, synthesizeFallbackCourse } from '../../lib/courseAIService';

function slugify(text) {
  return (text || '').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

const SAMPLE_JSON = {
  "_SCHEMA_RULES_": {
    "title": "Required course name",
    "description": "Required course summary (2-4 sentences)",
    "cta_left": "Talk to Advisor/Pay Now",
    "cta_right": "Download Brochure",
    "cta_heading": "Required banner CTA heading",
    "cta_description": "Required banner CTA description",
    "cta_text": "Apply Now",
    "checklist_items": "Array of EXACTLY 4 topic strings",
    "highlights": "EXACTLY 9 objects with icon and label",
    "projects": "EXACTLY 3 objects with title and description",
    "overview_faqs": "Minimum 2 Tabmenu Q&A objects with multi-sentence answers",
    "faqs": "EXACTLY 4 general FAQ objects",
    "tabs": "4 tab objects (Overview, Curriculum, Projects, Certification) with title, heading, paragraph, and qa array",
    "note": "Do NOT include image URLs or tags in JSON"
  },
  title: "UI/UX Design Masterclass",
  slug: "ui-ux-design-masterclass",
  subtitle: "Master UI/UX Design from Scratch with User Research, Wireframing, and Figma Systems",
  description: "Master UI/UX design from scratch through user research, wireframing, prototyping, and modern interface design.",
  cta_left: "Talk to Advisor/Pay Now",
  cta_right: "Download Brochure",
  cta_heading: "Design Better Digital Experiences with UI/UX",
  cta_description: "Learn user research, wireframing, prototyping, and visual design with expert mentors.",
  cta_text: "Apply Now",
  duration: "3 months",
  mode: "Online",
  checklist_items: [
    "UI Design Principles & Visual Hierarchy",
    "UX Research & User-Centered Design",
    "Wireframing & Interactive Prototyping",
    "Figma & Modern Design Systems"
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
    { icon: "zap", label: "Career Support" }
  ],
  projects: [
    {
      title: "E-Commerce UI/UX Design",
      description: "Design a complete e-commerce experience with user flows, wireframes, and high-fidelity prototypes."
    },
    {
      title: "Mobile App Design",
      description: "Create a modern mobile application from user research and wireframes to an interactive Figma prototype."
    },
    {
      title: "SaaS Dashboard Design",
      description: "Design a responsive analytics dashboard with reusable components and a scalable design system."
    }
  ],
  overview_faqs: [
    {
      question: "What key skills will I master in this program?",
      answer: "You will master UX research, user-centered design, information architecture, wireframing, visual design, prototyping, and design systems. The program focuses on creating practical digital experiences and building a strong professional design portfolio."
    },
    {
      question: "How is the learning structured for working professionals?",
      answer: "Classes are structured through flexible learning sessions with practical assignments and project-based activities. Recorded sessions and portfolio-focused projects help learners continue their progress at their own pace."
    }
  ],
  faqs: [
    { question: "Are there any prerequisites for this course?", answer: "No prior UI/UX experience is required. Basic computer knowledge and an interest in design are recommended." },
    { question: "Will I receive a verified certificate upon completion?", answer: "Yes, you will receive an industry-recognized certificate of completion." },
    { question: "Is placement assistance provided?", answer: "Yes, we provide resume building, portfolio guidance, mock interviews, and career support." },
    { question: "What is the mode of instruction?", answer: "This course is offered in online interactive live and self-paced modes." }
  ],
  tabs: [
    {
      label: "Overview",
      title: "Overview",
      content_type: "overview",
      content: {
        heading: "Course Overview & Learning Objectives",
        paragraph: "Learn the fundamentals of UI/UX design, user-centered thinking, design principles, and modern product design workflows.",
        subheading: "Key Competencies & Learning Methodology",
        subparagraph: "Over 70% of program time is dedicated to live design sprints, Figma prototypes, and portfolio deliverables.",
        qa: [
          {
            question: "What key design tools will I master?",
            answers: [
              "Figma for UI Design & Modern Design Systems",
              "Miro & FigJam for User Research & Journey Mapping",
              "Protopie for Micro-Interactions & Prototyping"
            ]
          }
        ]
      }
    },
    {
      label: "Curriculum",
      title: "Curriculum",
      content_type: "overview",
      content: {
        heading: "Structured In-Depth Curriculum",
        paragraph: "Structured learning from UX research and information architecture to wireframing, UI design, Figma, prototyping, and design systems.",
        subheading: "Phase-by-Phase Technical Mastery",
        subparagraph: "Every module combines design theory with hands-on Figma lab assignments.",
        qa: [
          {
            question: "Module 1: User Research & Information Architecture",
            answers: [
              "User Personas & Customer Journey Maps",
              "Information Architecture & Card Sorting"
            ]
          }
        ]
      }
    },
    {
      label: "Projects",
      title: "Projects",
      content_type: "overview",
      content: {
        heading: "Industry Capstone Projects",
        paragraph: "Build real-world portfolio projects including e-commerce interfaces, mobile applications, and SaaS dashboards.",
        subheading: "Portfolio-Ready Design Applications",
        subparagraph: "Every project includes Figma prototypes ready to showcase to hiring managers.",
        qa: [
          {
            question: "Capstone Project 1: E-Commerce App",
            answers: [
              "End-to-end shopping experience design",
              "High-fidelity mobile and desktop prototypes"
            ]
          }
        ]
      }
    },
    {
      label: "Certification",
      title: "Certification",
      content_type: "overview",
      content: {
        heading: "Verified Industry Credential",
        paragraph: "Earn a verified UI/UX skill certification after successfully completing the course.",
        subheading: "Credential Validation & Career Support",
        subparagraph: "Shareable credential badge recognized across top product companies.",
        qa: [
          {
            question: "Verification & Industry Recognition",
            answers: [
              "Shareable digital certificate badge",
              "Recognized by leading design agencies"
            ]
          }
        ]
      }
    }
  ]
};

const SAMPLE_CSV = `title,description,cta_left,cta_right,cta_heading,cta_description,cta_text,checklist_items,duration,mode
"UI/UX Design Masterclass","Master UI/UX design from scratch through user research, wireframing, prototyping, and modern interface design.","Talk to Advisor/Pay Now","Download Brochure","Design Better Digital Experiences with UI/UX","Learn user research, wireframing, prototyping, and visual design with expert mentors.","Apply Now","UI Design Principles | UX Research | Wireframing | Figma Design Systems","3 months","Online"`;

export default function CourseAIImportModal({ isOpen, onClose, onImportData, initialCourseName = '' }) {
  const [activeTab, setActiveTab] = useState('ai_prompt');
  const [courseName, setCourseName] = useState(initialCourseName);
  const [keyPoints, setKeyPoints] = useState('');
  const [duration, setDuration] = useState('3 to 6 months');
  const [mode, setMode] = useState('Online');
  const [generating, setGenerating] = useState(false);

  const [pastedContent, setPastedContent] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  async function handleAIGenerate() {
    if (!courseName.trim()) {
      setError('Please enter a Course Name (e.g. "Full Stack Java Developer" or "Data Science & AI").');
      return;
    }
    setError('');
    setSuccessMsg('');
    setGenerating(true);

    try {
      const generatedCourse = await generateFullCourseWithAI({
        courseName: courseName.trim(),
        keyPoints: keyPoints.trim(),
        duration,
        mode,
      });

      onImportData(generatedCourse);
      setSuccessMsg(`Successfully generated all fields and tabs for "${generatedCourse.title}"!`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('AI Generation error:', err);
      setError(`Generation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleDownloadJSONTemplate() {
    handleDownloadFile(JSON.stringify(SAMPLE_JSON, null, 2), 'course_template.json', 'application/json');
  }

  function handleDownloadCSVTemplate() {
    handleDownloadFile(SAMPLE_CSV, 'course_template.csv', 'text/csv');
  }

  function processParsedJSON(parsed) {
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON format. Expected an object.');
    }

    const title = parsed.title || parsed.course_title || parsed.cta_heading || '';
    if (!title.trim()) {
      throw new Error('JSON is missing required field: "title".');
    }

    const fallbackCourse = synthesizeFallbackCourse({ courseName: title });

    let rawHighlights = parsed.highlights || [];
    if (!Array.isArray(rawHighlights) || rawHighlights.length === 0) {
      rawHighlights = fallbackCourse.highlights;
    }
    const formattedHighlights = Array.from({ length: 9 }, (_, index) => {
      const existing = rawHighlights[index];
      if (existing) {
        return {
          icon: existing.icon || fallbackCourse.highlights[index]?.icon || 'star',
          label: typeof existing === 'string' ? existing : (existing.label || fallbackCourse.highlights[index]?.label || '')
        };
      }
      return fallbackCourse.highlights[index] || { icon: 'star', label: '' };
    });

    let rawProjects = parsed.projects || [];
    if (!Array.isArray(rawProjects) || rawProjects.length === 0) {
      rawProjects = fallbackCourse.projects;
    }
    const formattedProjects = Array.from({ length: 3 }, (_, index) => {
      const existing = rawProjects[index];
      if (existing) {
        return {
          title: existing.title || fallbackCourse.projects[index]?.title || '',
          description: existing.description || fallbackCourse.projects[index]?.description || ''
        };
      }
      return fallbackCourse.projects[index] || { title: '', description: '' };
    });

    let formattedTabs = [];
    if (Array.isArray(parsed.tabs) && parsed.tabs.length > 0) {
      formattedTabs = parsed.tabs.map((t, idx) => {
        const titleStr = typeof t === 'string' ? t : (t.label || t.title || fallbackCourse.tabs[idx]?.label || `Tab ${idx + 1}`);
        const headingStr = typeof t === 'object' && t.content?.heading ? t.content.heading : (t.heading || fallbackCourse.tabs[idx]?.content?.heading || titleStr);
        const paragraphStr = typeof t === 'object' ? (typeof t.content === 'string' ? t.content : (t.content?.paragraph || t.paragraph || t.description || fallbackCourse.tabs[idx]?.content?.paragraph || '')) : (fallbackCourse.tabs[idx]?.content?.paragraph || '');

        let rawQa = [];
        if (typeof t === 'object') {
          rawQa = t.qa || t.content?.qa || t.items || t.features || t.questions || fallbackCourse.tabs[idx]?.content?.qa || [];
        }
        if (!Array.isArray(rawQa) || rawQa.length === 0) {
          rawQa = fallbackCourse.tabs[idx]?.content?.qa || [];
        }

        const formattedQa = rawQa.map(qItem => {
          if (typeof qItem === 'string') {
            return { question: qItem, answers: [qItem] };
          }
          const question = qItem.question || qItem.title || qItem.q || '';
          let answers = qItem.answers || qItem.answer || qItem.bullets || qItem.items || [];
          if (typeof answers === 'string') {
            answers = answers.split('\n').map(s => s.trim()).filter(Boolean);
          } else if (!Array.isArray(answers)) {
            answers = [];
          }
          return { question, answers };
        }).filter(q => q.question.trim());

        return {
          label: titleStr,
          title: titleStr,
          content_type: 'overview',
          content: {
            heading: headingStr,
            paragraph: paragraphStr,
            subheading: typeof t === 'object' && t.content?.subheading ? t.content.subheading : (t.subheading || fallbackCourse.tabs[idx]?.content?.subheading || ''),
            subparagraph: typeof t === 'object' && t.content?.subparagraph ? t.content.subparagraph : (t.subparagraph || fallbackCourse.tabs[idx]?.content?.subparagraph || ''),
            headingAlign: 'left',
            paragraphAlign: 'left',
            subheadingAlign: 'left',
            subparagraphAlign: 'left',
            qa: formattedQa
          }
        };
      }).filter(t => (t.label || t.title).trim());
    }

    if (formattedTabs.length === 0) {
      formattedTabs = fallbackCourse.tabs;
    }

    let formattedOverviewFaqs = [];
    let rawOverviewFaqs = parsed.overview_faqs || parsed.tabmenu_faqs || [];
    if (Array.isArray(rawOverviewFaqs) && rawOverviewFaqs.length > 0) {
      formattedOverviewFaqs = rawOverviewFaqs.map(f => ({
        question: f.question || f.q || '',
        answer: f.answer || f.a || ''
      })).filter(f => f.question.trim());
    }
    if (formattedOverviewFaqs.length === 0) {
      formattedOverviewFaqs = fallbackCourse.overview_faqs;
    }

    let formattedFaqs = [];
    if (Array.isArray(parsed.faqs) && parsed.faqs.length > 0) {
      formattedFaqs = parsed.faqs.map(f => ({
        question: f.question || f.q || '',
        answer: f.answer || f.a || ''
      })).filter(f => f.question.trim());
    }
    if (formattedFaqs.length === 0) {
      formattedFaqs = fallbackCourse.faqs;
    }

    let formattedCertifications = [];
    if (Array.isArray(parsed.certifications) && parsed.certifications.length > 0) {
      formattedCertifications = parsed.certifications.map(c => ({
        description: c.description || fallbackCourse.certifications[0]?.description || '',
        certificate_image_url: '',
        recognized_companies: Array.isArray(c.recognized_companies) ? c.recognized_companies.filter(Boolean) : fallbackCourse.certifications[0]?.recognized_companies || []
      }));
    }
    if (formattedCertifications.length === 0) {
      formattedCertifications = fallbackCourse.certifications;
    }

    let checklist = parsed.checklist_items || parsed.checklist || [];
    if (typeof checklist === 'string') {
      checklist = checklist.split('|').map(s => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(checklist) || checklist.length === 0) {
      checklist = fallbackCourse.checklist_items;
    }

    const courseData = {
      title: title,
      slug: parsed.slug || slugify(title),
      subtitle: parsed.subtitle || fallbackCourse.subtitle,
      description: parsed.description || fallbackCourse.description,
      hero_image_url: '',
      video_url: '',
      cta_left: parsed.cta_left || 'Talk to Advisor/Pay Now',
      cta_right: parsed.cta_right || 'Download Brochure',
      cta_heading: parsed.cta_heading || fallbackCourse.cta_heading,
      cta_description: parsed.cta_description || fallbackCourse.cta_description,
      cta_text: parsed.cta_text || 'Apply Now',
      cta_link: parsed.cta_link || '',
      cta_background_image: '',
      checklist_items: checklist.slice(0, 4),
      tabs: formattedTabs,
      highlights: formattedHighlights,
      projects: formattedProjects,
      certifications: formattedCertifications,
      overview_faqs: formattedOverviewFaqs,
      faqs: formattedFaqs,
      duration: parsed.duration || '3 to 6 months',
      mode: parsed.mode || 'Online',
    };

    onImportData(courseData);
    setSuccessMsg('Successfully parsed and auto-filled course data!');
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1000);
  }

  function handleProcessText() {
    setError('');
    setSuccessMsg('');

    if (!pastedContent.trim()) {
      setError('Please paste JSON text from your editor.');
      return;
    }

    try {
      let cleanText = pastedContent.trim();
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleanText);
      processParsedJSON(parsed);
    } catch (err) {
      setError(`Failed to parse JSON: ${err.message}. Please verify JSON formatting.`);
    }
  }

  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must contain a header row and at least 1 data row.');

    const parseRow = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseRow(lines[0]).map(h => h.toLowerCase());
    const values = parseRow(lines[1]);

    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    return obj;
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result;
        if (file.name.endsWith('.csv')) {
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-neutral-200 max-h-[90vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-orange/20 to-orange-500/20 border border-brand-orange/40 flex items-center justify-center text-brand-orange">
                <HiSparkles className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900 leading-tight">AI Course Creator &amp; Auto-Fill</h3>
                <p className="text-xs text-neutral-500">Provide course name &amp; key points to generate all fields instantly</p>
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
              { id: 'ai_prompt', label: '1. AI Prompt Generator', icon: HiSparkles },
              { id: 'paste', label: '2. Paste JSON', icon: FiCpu },
              { id: 'upload', label: '3. Upload File', icon: FiUpload },
              { id: 'templates', label: '4. Templates', icon: FiFileText },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setError(''); setSuccessMsg(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 ${
                    isActive
                      ? 'bg-white text-neutral-900 border-brand-orange shadow-2xs'
                      : 'text-neutral-500 border-transparent hover:text-neutral-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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

            {/* TAB 1: AI PROMPT GENERATOR */}
            {activeTab === 'ai_prompt' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Course Name / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Python Full Stack with Django & React"
                    className="w-full h-10 px-3.5 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Key Topics, Syllabus Points &amp; Instructions <span className="text-neutral-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={keyPoints}
                    onChange={(e) => setKeyPoints(e.target.value)}
                    rows={4}
                    placeholder="e.g. Cover Python 3.12, Django REST Framework, React Hooks, PostgreSQL, Docker, AWS EC2, automated tests, for freshers and IT professionals with 3 capstone projects..."
                    className="w-full p-3 border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full h-9 px-3 border border-neutral-300 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-brand-orange"
                    >
                      <option value="1 month">1 month</option>
                      <option value="2 months">2 months</option>
                      <option value="3 months">3 months</option>
                      <option value="4 months">4 months</option>
                      <option value="6 months">6 months</option>
                      <option value="8 months">8 months</option>
                      <option value="12 months">12 months</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">Mode</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="w-full h-9 px-3 border border-neutral-300 rounded-xl text-xs bg-white text-neutral-800 focus:outline-none focus:border-brand-orange"
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={generating}
                  className="w-full py-3 px-4 bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  {generating ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      <span>Generating Deep Course Tabs &amp; Content via AI...</span>
                    </>
                  ) : (
                    <>
                      <HiSparkles className="w-4 h-4 text-amber-200" />
                      <span>Generate &amp; Fill Course Details</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 2: PASTE JSON */}
            {activeTab === 'paste' && (
              <div className="space-y-3">
                <p className="text-xs text-neutral-600">
                  Paste raw JSON data below. The form will parse and auto-populate all course fields!
                </p>
                <textarea
                  value={pastedContent}
                  onChange={(e) => setPastedContent(e.target.value)}
                  rows={9}
                  placeholder={`Paste JSON here...\n\nExample:\n{\n  "title": "UI/UX Design Masterclass",\n  "description": "...",\n  "cta_heading": "..."\n}`}
                  className="w-full p-3.5 border border-neutral-300 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all bg-neutral-50/50"
                />
                <button
                  onClick={handleProcessText}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <HiSparkles className="w-4 h-4" /> Auto-Fill Course Form
                </button>
              </div>
            )}

            {/* TAB 3: UPLOAD FILE */}
            {activeTab === 'upload' && (
              <div className="space-y-4 text-center py-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-brand-orange bg-neutral-50 hover:bg-orange-50/30 rounded-2xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FiUpload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-neutral-800">Click to Upload JSON or CSV File</span>
                    <span className="block text-[11px] text-neutral-400 mt-0.5">Supports .json and .csv template files</span>
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

            {/* TAB 4: TEMPLATES */}
            {activeTab === 'templates' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                    Download Official Course Templates
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleDownloadJSONTemplate}
                      className="flex flex-col items-center justify-center p-5 bg-neutral-50 hover:bg-orange-50/40 border border-neutral-200 hover:border-brand-orange rounded-2xl text-center transition-all group cursor-pointer"
                    >
                      <FiCode className="w-7 h-7 text-neutral-600 group-hover:text-brand-orange mb-2 transition-colors" />
                      <span className="text-xs font-bold text-neutral-800">JSON Template</span>
                      <span className="text-[11px] text-neutral-400 mt-0.5">Pre-filled .json format</span>
                    </button>

                    <button
                      onClick={handleDownloadCSVTemplate}
                      className="flex flex-col items-center justify-center p-5 bg-neutral-50 hover:bg-orange-50/40 border border-neutral-200 hover:border-brand-orange rounded-2xl text-center transition-all group cursor-pointer"
                    >
                      <FiDownload className="w-7 h-7 text-neutral-600 group-hover:text-brand-orange mb-2 transition-colors" />
                      <span className="text-xs font-bold text-neutral-800">CSV Template</span>
                      <span className="text-[11px] text-neutral-400 mt-0.5">Spreadsheet .csv format</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
