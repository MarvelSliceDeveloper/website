import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiStar, FiArrowRight, FiArrowLeft, FiUsers, FiBarChart2, FiClock, FiBookOpen, FiAward, FiBell, FiCode, FiChevronDown, FiChevronUp, FiPlus, FiMinus, FiVideo, FiCalendar, FiRefreshCw, FiMessageCircle, FiBriefcase, FiGlobe, FiCpu, FiDatabase, FiLayers, FiZap, FiShield, FiTrendingUp, FiX, FiCheck, FiAlertCircle, FiSend, FiPlay, FiCheckCircle } from 'react-icons/fi';
import Button from '../components/ui/Button';
import TabBar from '../components/ui/TabBar';
import { trackFormSubmit, trackDownload, trackCtaClick, trackVideoPlay } from '../lib/analytics';
import CourseCard from '../components/ui/CourseCard';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import AccordionItem from '../components/ui/AccordionItem';
import Countdown from '../components/ui/Countdown';
import { useCourse, useRelatedCourses } from '../hooks/useSupabase';
import { supabase } from '../lib/supabaseClient';
import CourseCTA from '../components/ui/CourseCTA';
import CourseUnlockAnimation from '../components/ui/CourseUnlockAnimation';
import CourseHero from '../components/ui/CourseHero';

const HIGHLIGHT_ICONS = {
  code: FiCode,
  star: FiStar,
  award: FiAward,
  users: FiUsers,
  clock: FiClock,
  target: FiBarChart2,
  book: FiBookOpen,
  video: FiVideo,
  calendar: FiCalendar,
  refresh: FiRefreshCw,
  message: FiMessageCircle,
  briefcase: FiBriefcase,
  globe: FiGlobe,
  cpu: FiCpu,
  database: FiDatabase,
  layers: FiLayers,
  zap: FiZap,
  shield: FiShield,
  trending: FiTrendingUp,
};

function AccordionQA({ items }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div className="space-y-3 mt-4">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200/80 rounded-xl overflow-hidden bg-white shadow-xs transition-shadow hover:shadow-md">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left font-bold text-dark-navy bg-slate-50 hover:bg-slate-100/80 transition-colors gap-3 cursor-pointer"
          >
            <span className="text-sm sm:text-base leading-snug flex-1">{item.question}</span>
            <span className="shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-xs transition-transform duration-200">
              {openIdx === i ? <FiChevronUp className="w-4 h-4 text-brand-blue" /> : <FiChevronDown className="w-4 h-4" />}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {openIdx === i && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-5 text-sm text-gray-600 leading-relaxed bg-white border-t border-gray-100 space-y-2.5">
                  {item.answers?.map((ans, ai) => (
                    <div key={ai} className="flex items-start gap-2.5 text-left">
                      <FiCheckCircle className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm sm:text-base font-medium">{ans}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

function CourseTabs({ tabs, onApplyNow }) {
  if (!tabs || tabs.length === 0) return null;
  const [active, setActive] = useState(0);
  const activeTab = tabs[active];

  function renderContent(t) {
    const content = t.content || {};
    const hasMain = content.heading || content.paragraph || content.subheading || content.text;
    const align = (key) => {
      const a = content[key + "Align"] || "left";
      return a === "left" ? "text-left" : a === "right" ? "text-right" : "text-center";
    };
    return (
      <div className="space-y-6">
        {content.heading && (
          <h2 className={`text-2xl font-bold text-dark-navy ${align("heading")}`}>
            {content.heading}
          </h2>
        )}
        {content.paragraph && (
          <p className={`text-gray-500 leading-relaxed ${align("paragraph")} ${align("paragraph") === "text-center" ? "max-w-2xl mx-auto" : ""}`}>
            {content.paragraph}
          </p>
        )}
        {content.subheading && (
          <h3 className={`text-lg font-semibold text-black ${align("subheading")}`}>
            {content.subheading}
          </h3>
        )}
        {content.text && (
          <div className={`text-gray-700 leading-relaxed whitespace-pre-line ${align("text")}`}>
            {content.text}
          </div>
        )}
        {content.qa?.length > 0 && <AccordionQA items={content.qa} />}
        {!hasMain && !content.qa?.length && <p className="text-gray-400 text-center py-8">Content coming soon.</p>}
      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal variant="up">
          <div className="flex items-center justify-between gap-4">
            <TabBar
              tabs={tabs.map(t => t.label)}
              activeIndex={active}
              onChange={setActive}
            />
            <button
              type="button"
              onClick={() => onApplyNow?.('Apply Now')}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-full hover:bg-brand-orange/90 hover:shadow-lg hover:-translate-y-0.5 transition-all text-sm font-bold shadow-sm cursor-pointer active:scale-95"
            >
              Apply Now
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white rounded-b-xl border-x border-b border-gray-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab?.id || active}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {renderContent(activeTab)}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function OverviewSection({ course }) {
  if (!course) return null;

  return (
    <section id="overview" data-section="overview" className="py-16 bg-bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {course.highlights?.length > 0 && (
          <div>
            <Reveal as="h2" className="text-2xl font-bold text-dark-navy text-center mb-10">Key Highlights</Reveal>
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {course.highlights.map((h, i) => (
                <StaggerItem key={h.id || i}>
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-brand-orange/30 flex items-center gap-4 px-4 py-4 border border-gray-100 transition-all duration-300 group cursor-pointer">
                    <div className="shrink-0 w-1 self-stretch rounded-full bg-blue-600 group-hover:bg-brand-orange transition-colors" />
                    <div className="w-10 h-10 rounded-full bg-indigo-50 group-hover:bg-amber-100/70 flex items-center justify-center shrink-0 transition-colors">
                      {(() => {
                        const IconComp = HIGHLIGHT_ICONS[h.icon] || FiAward;
                        return <IconComp className="w-5 h-5 text-indigo-500 group-hover:text-brand-orange transition-colors" />;
                      })()}
                    </div>
                    <span className="font-semibold text-dark-navy text-sm group-hover:text-brand-orange transition-colors">{h.label}</span>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        )}
      </div>
    </section>
  );
}



function ProjectsSection({ projects }) {
  if (!projects || projects.length === 0) return null;
  return (
    <section id="projects" data-section="projects" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-2xl font-bold text-dark-navy mb-8">Hands-On Projects</Reveal>
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p, i) => (
            <StaggerItem key={p.id || i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-brand-orange/40 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 group-hover:bg-brand-orange flex items-center justify-center mb-4 transition-colors duration-300">
                <FiBookOpen className="w-6 h-6 text-brand-orange group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-dark-navy mb-2 group-hover:text-brand-orange transition-colors">{p.title}</h3>
              {p.difficulty && <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{p.difficulty}</span>}
              {p.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                  {p.technologies.map((tech, j) => (
                    <span key={j} className="text-xs bg-gray-100 group-hover:bg-amber-50 group-hover:text-amber-800 text-gray-600 px-2 py-0.5 rounded-full transition-colors">{tech}</span>
                  ))}
                </div>
              )}
              {p.description && <p className="text-sm text-gray-600 leading-relaxed">{p.description}</p>}
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}



function CertificationSection({ certifications }) {
  if (!certifications || certifications.length === 0) return null;
  return (
    <section id="certification" data-section="certification" className="py-16 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-2xl sm:text-3xl font-extrabold text-[#1B365D] mb-10 text-center">
          Certification
        </Reveal>
        <div className="max-w-5xl mx-auto space-y-8">
          {certifications.map((cert, i) => (
            <Reveal key={i} className="bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0 items-stretch">
                {(cert.image_url || cert.certificate_image_url) && (
                  <div className="md:col-span-6 bg-slate-100/80 border-b md:border-b-0 md:border-r border-slate-200/80 p-4 sm:p-6 flex items-center justify-center min-h-[300px] sm:min-h-[360px]">
                    <img
                      src={cert.image_url || cert.certificate_image_url}
                      alt="Certification Certificate"
                      className="w-full h-full max-h-[400px] object-contain rounded-xl shadow-lg border border-slate-200 bg-white transition-transform duration-300 hover:scale-[1.01]"
                    />
                  </div>
                )}
                <div className={`${(cert.image_url || cert.certificate_image_url) ? "md:col-span-6" : "md:col-span-12"} p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5`}>
                  {cert.description && (
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-normal">
                      {cert.description}
                    </p>
                  )}
                  {cert.skills_earned?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                        Skills You'll Earn
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills_earned.map((s, j) => (
                          <span
                            key={j}
                            className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-3 py-1.5 rounded-full"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {cert.recognized_companies?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                        Recognized by
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cert.recognized_companies.map((c, j) => (
                          <span
                            key={j}
                            className="text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60 px-3 py-1.5 rounded-full hover:bg-slate-200/70 transition-colors"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ faqs }) {
  if (!faqs || faqs.length === 0) return null;
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <section id="faqs" data-section="faqs" className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">
          Frequently Asked Questions
        </Reveal>
        <Stagger className="space-y-2 w-full">
          {faqs.map((f, i) => (
            <StaggerItem key={f.id || i}>
              <AccordionItem
                title={f.question}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <p className="text-gray-500 text-base leading-relaxed">{f.answer}</p>
              </AccordionItem>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function RelatedCoursesWithId({ courseId }) {
  const { data: related } = useRelatedCourses(courseId);
  const displayCourses = related?.slice(0, 4) || [];
  if (displayCourses.length === 0) return null;
  return (
    <div>
      <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {displayCourses.map((rc) => (
          <StaggerItem key={rc.id} className="h-full">
            <CourseCard course={rc} bannerSize="sm" variant="initial" />
          </StaggerItem>
        ))}
      </Stagger>
      {related.length > 4 && (
        <div className="text-center mt-8">
          <Link to="/courses" className="inline-flex items-center gap-2 text-brand-orange font-semibold hover:underline">
            View More Courses <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CourseDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: course, isLoading } = useCourse(slug);

  function handleBackNavigation(e) {
    if (e) e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/courses');
    }
  }
  const [showBrochure, setShowBrochure] = useState(false);
  const [brochureForm, setBrochureForm] = useState({ name: '', email: '', phone: '' });
  const [brochureSubmitting, setBrochureSubmitting] = useState(false);
  const [brochureDone, setBrochureDone] = useState(false);
  const [brochureError, setBrochureError] = useState('');
  const [brochureAgree, setBrochureAgree] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [interestForm, setInterestForm] = useState({ name: '', email: '', phone: '' });
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestDone, setInterestDone] = useState(false);
  const [interestError, setInterestError] = useState('');
  const [interestAgree, setInterestAgree] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const [notifiedSuccess, setNotifiedSuccess] = useState(false);

  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquirySource, setEnquirySource] = useState('Apply Now');
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '' });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryDone, setEnquiryDone] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');
  const [enquiryAgree, setEnquiryAgree] = useState(false);
  const [forceUnlocked, setForceUnlocked] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  function openEnquiryModal(sourceLabel) {
    setEnquirySource(sourceLabel || 'Apply Now');
    setEnquiryForm({ name: '', email: '', phone: '' });
    setEnquiryDone(false);
    setEnquiryError('');
    setEnquiryAgree(false);
    setShowEnquiry(true);
  }

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    if (!enquiryForm.name.trim() || !enquiryForm.email.trim() || !enquiryForm.phone.trim()) {
      setEnquiryError('Please fill in all required fields.');
      return;
    }
    if (!enquiryAgree) {
      setEnquiryError('Please agree to the Terms of Use and Privacy Policy.');
      return;
    }
    setEnquirySubmitting(true);
    setEnquiryError('');

    const payload = {
      full_name: enquiryForm.name.trim(),
      email: enquiryForm.email.trim(),
      phone: enquiryForm.phone.trim(),
      course_id: course?.id,
      course_title: course?.title,
      button_clicked: enquirySource,
      terms_accepted: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('course_enquiries').insert(payload);
    if (error) {
      setEnquiryError(error.message);
      setEnquirySubmitting(false);
      return;
    }

    fetch('/api/submit-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    trackFormSubmit('course_enquiry');
    setEnquirySubmitting(false);
    setEnquiryDone(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-dark-navy mb-4">Course not found</h1>
        <Link to="/courses" className="text-brand-orange hover:underline">Browse all courses</Link>
      </div>
    );
  }

  async function handleInterestSubmit(e) {
    e.preventDefault();
    if (!interestForm.name.trim() || !interestForm.email.trim() || !interestForm.phone.trim()) return;
    if (!interestAgree) { setInterestError('Please agree to the terms and conditions.'); return; }
    setInterestSubmitting(true);
    setInterestError('');

    const payload = {
      full_name: interestForm.name.trim(),
      email: interestForm.email.trim(),
      phone: interestForm.phone.trim(),
      course_id: course.id,
      course_title: course.title,
      launch_date: course.start_date || null,
    };

    const { error } = await supabase.from('upcoming_course_interests').insert(payload);
    if (error) { setInterestError(error.message); setInterestSubmitting(false); return; }

    trackFormSubmit('course_interest');
    setInterestSubmitting(false);
    setInterestDone(true);
    setNotifiedSuccess(true);
  }

  const isLaunchPassed = course?.start_date && new Date(course.start_date).getTime() <= Date.now();

  if (course.status === 'Coming Soon' && !isLaunchPassed && !forceUnlocked) {
    return (
      <div>
        <CourseUnlockAnimation
          isUnlocking={isUnlocking}
          courseTitle={course.title}
          onComplete={() => {
            setIsUnlocking(false);
            setForceUnlocked(true);
          }}
        />
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-8 sm:pt-4 sm:pb-10 lg:pt-6 lg:pb-12">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-brand-orange transition-colors mb-2 cursor-pointer group"
            >
              <FiArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-brand-orange transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <h1 className="text-[clamp(1.75rem,3.5vw,3rem)] font-extrabold text-dark-navy leading-[1.15]">
                  {course.title}
                  <span className="ml-3 inline-block align-middle text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                    Coming Soon
                  </span>
                </h1>
                {course.description && (
                  <p className="mt-4 text-base text-gray-600 leading-relaxed">{course.description}</p>
                )}
                {course.checklist_items?.length > 0 && (
                  <ul className="mt-6 space-y-2.5 w-full max-w-xl text-left">
                    {course.checklist_items.slice(0, 6).map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                        <FiCheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{(item || "").slice(0, 80)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  {notifiedSuccess ? (
                    <button
                      type="button"
                      disabled
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-md cursor-default transition-all"
                    >
                      <FiCheckCircle className="w-5 h-5" /> You're Notified!
                    </button>
                  ) : (
                    <Button
                      variant="accent"
                      size="lg"
                      onClick={() => {
                        setInterestForm({ name: '', email: '', phone: '' });
                        setInterestDone(false);
                        setInterestError('');
                        setInterestAgree(false);
                        setShowInterest(true);
                      }}
                      className="w-full sm:w-auto"
                    >
                      <FiBell className="w-4 h-4" /> Notify Me
                    </Button>
                  )}
                  <Button variant="outline" size="lg" to="/courses" className="w-full sm:w-auto !bg-brand-blue !text-white hover:!bg-blue-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    Explore All Courses <FiArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                  <div className="px-6 pt-6">
                    <span className="inline-flex items-center gap-1.5 bg-brand-orange/10 text-brand-orange text-xs font-semibold px-3 py-1 rounded-full">
                      <FiClock className="w-3.5 h-3.5" /> Course launches in
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    {course.start_date ? (
                      <Countdown target={course.start_date} onFinish={() => setIsUnlocking(true)} />
                    ) : (
                      <p className="text-sm text-gray-500">Start date will be announced soon.</p>
                    )}
                  </div>
                  <div className="px-6 sm:px-8 pb-6">
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Be the first to know when <strong className="text-dark-navy">{course.title}</strong> opens for enrollment. Click{' '}
                      <strong className="text-brand-orange">Notify Me</strong> to get notified.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {showInterest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowInterest(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Register Your Interest</h2>
                <button onClick={() => setShowInterest(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {interestDone ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">You're on the list!</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    You've successfully registered your interest for{' '}
                    <strong className="text-gray-900">{course.title}</strong>.
                    {course.start_date
                      ? <> We'll email you on {new Date(course.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} when it launches.</>
                      : ' We\'ll notify you as soon as it launches.'}
                  </p>
                  <button onClick={() => setShowInterest(false)} className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors cursor-pointer">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInterestSubmit} className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    Get notified the moment enrollment opens for <strong className="text-gray-900">{course.title}</strong>.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input value={interestForm.name} onChange={e => setInterestForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input type="email" value={interestForm.email} onChange={e => setInterestForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                    <input type="tel" value={interestForm.phone} onChange={e => setInterestForm(p => ({ ...p, phone: e.target.value }))} placeholder="Your phone number" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  {interestError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                      <FiAlertCircle className="w-4 h-4 shrink-0" /> {interestError}
                    </div>
                  )}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={interestAgree} onChange={(e) => {
                      setInterestAgree(e.target.checked);
                      if (interestError) setInterestError('');
                    }} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-600 underline hover:text-blue-700">Terms of Use</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</a>.
                    </span>
                  </label>
                  <button type="submit" disabled={interestSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors disabled:opacity-60 cursor-pointer">
                    {interestSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend className="w-4 h-4" />}
                    {interestSubmitting ? 'Registering...' : 'Notify Me'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  const embedUrl = course.video_url ? getYoutubeEmbedUrl(course.video_url) : null;

  async function handleBrochureSubmit(e) {
    e.preventDefault();
    if (!brochureForm.name.trim() || !brochureForm.email.trim() || !brochureForm.phone.trim()) return;
    if (!brochureAgree) { setBrochureError('Please agree to the terms and conditions.'); return; }
    setBrochureSubmitting(true);
    setBrochureError('');

    const payload = {
      name: brochureForm.name.trim(),
      email: brochureForm.email.trim(),
      phone: brochureForm.phone.trim(),
      course_id: course.id,
      course_title: course.title,
    };

    const { error } = await supabase.from('brochure_downloads').insert(payload);
    if (error) { setBrochureError(error.message); setBrochureSubmitting(false); return; }

    fetch('/api/submit-brochure', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    trackFormSubmit('brochure_download');
    trackDownload(payload.course_title);
    setBrochureSubmitting(false);
    setBrochureDone(true);
  }

  return (
    <div>
      {/* Hero */}
      <CourseHero
        course={course}
        handleBackNavigation={handleBackNavigation}
        openEnquiryModal={openEnquiryModal}
        videoPlaying={videoPlaying}
        setVideoPlaying={setVideoPlaying}
        trackVideoPlay={trackVideoPlay}
        embedUrl={embedUrl}
      />



      {/* Overview */}
      <OverviewSection course={course} />

      {/* Course Tabs */}
      <CourseTabs tabs={course.course_tabs} onApplyNow={(label) => openEnquiryModal(label || 'Apply Now')} />

      {/* Dynamic Futuristic Course CTA */}
      <CourseCTA
        course={course}
        onCtaClick={(label) => openEnquiryModal(label || 'Apply Now')}
      />


      {/* Projects */}
      <ProjectsSection projects={course.projects} />

      {/* Certification */}
      <CertificationSection certifications={course.certifications} />

      {/* Related Courses */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <Reveal as="h2" className="text-2xl font-bold text-dark-navy">More Courses You Might Like</Reveal>
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-orange-600 transition-colors group shrink-0 w-fit"
            >
              <span>Explore All Courses</span>
              <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <RelatedCoursesWithId courseId={course.id} />
        </div>
      </section>

      {/* FAQs */}
      <FAQSection faqs={course.faqs} />

      {/* Brochure Download Modal */}
      <AnimatePresence>
        {showBrochure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowBrochure(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Download Brochure</h2>
                <button onClick={() => setShowBrochure(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                  <FiX className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              {brochureDone ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Thank You!</h3>
                  <p className="text-sm text-gray-500">We've received your request. The brochure will be sent to your email shortly.</p>
                  <button onClick={() => setShowBrochure(false)} className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors cursor-pointer">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBrochureSubmit} className="p-6 space-y-4">
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    Request a brochure for <strong className="text-gray-900">{course.title}</strong>
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input value={brochureForm.name} onChange={e => setBrochureForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input type="email" value={brochureForm.email} onChange={e => setBrochureForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                    <input type="tel" value={brochureForm.phone} onChange={e => setBrochureForm(p => ({ ...p, phone: e.target.value }))} placeholder="Your phone number" required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange" />
                  </div>
                  {brochureError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                      <FiAlertCircle className="w-4 h-4 shrink-0" /> {brochureError}
                    </div>
                  )}
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={brochureAgree} onChange={(e) => {
                      setBrochureAgree(e.target.checked);
                      if (brochureError) setBrochureError('');
                    }} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600/20" />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <a href="/terms" className="text-blue-600 underline hover:text-blue-700">Terms of Use</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-blue-600 underline hover:text-blue-700">Privacy Policy</a>.
                    </span>
                  </label>
                  <button type="submit" disabled={brochureSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors disabled:opacity-60 cursor-pointer">
                    {brochureSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend className="w-4 h-4" />}
                    {brochureSubmitting ? 'Sending...' : 'Get Brochure'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enquiry Modal */}
      <AnimatePresence>
        {showEnquiry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm cursor-pointer"
            onClick={() => setShowEnquiry(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-5 py-4 bg-[#f59e0b] rounded-t-2xl flex items-start justify-between relative">
                <div className="pr-4 min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold !text-white leading-snug" style={{ color: '#ffffff' }}>Enquire Now</h2>
                  <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white text-dark-navy text-[11px] sm:text-xs font-semibold shadow-2xs max-w-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] shrink-0"></span>
                    <span className="truncate">{course.title}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowEnquiry(false)}
                  className="p-1 rounded-full bg-black/15 hover:bg-black/25 text-white transition-colors cursor-pointer shrink-0 mt-0.5"
                  aria-label="Close modal"
                >
                  <FiX className="w-4 h-4 text-white" style={{ color: '#ffffff' }} />
                </button>
              </div>

              {enquiryDone ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <FiCheck className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Enquiry Submitted!</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Thank you <strong className="text-gray-900">{enquiryForm.name}</strong>! Your enquiry for{' '}
                    <strong className="text-gray-900">{course.title}</strong> via <span className="font-semibold text-brand-orange">"{enquirySource}"</span> has been recorded.
                    Our course advisor will contact you shortly.
                  </p>
                  <button onClick={() => setShowEnquiry(false)} className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors cursor-pointer">
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={enquiryForm.name}
                      onChange={e => setEnquiryForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Enter your full name"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={enquiryForm.email}
                      onChange={e => setEnquiryForm(p => ({ ...p, email: e.target.value }))}
                      placeholder="you@example.com"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={enquiryForm.phone}
                      onChange={e => setEnquiryForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="Enter 10-digit mobile number"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                    />
                  </div>

                  {enquiryError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                      <FiAlertCircle className="w-4 h-4 shrink-0" /> {enquiryError}
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={enquiryAgree}
                      onChange={e => {
                        setEnquiryAgree(e.target.checked);
                        if (enquiryError) setEnquiryError('');
                      }}
                      required
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange/20"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      I agree to the{' '}
                      <a href="/terms" className="text-brand-blue underline hover:text-blue-700">Terms of Use</a>
                      {' '}and{' '}
                      <a href="/privacy" className="text-brand-blue underline hover:text-blue-700">Privacy Policy</a>.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={enquirySubmitting}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 transition-all disabled:opacity-60 cursor-pointer shadow-md shadow-brand-orange/20 active:scale-95"
                  >
                    {enquirySubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend className="w-4 h-4" />}
                    {enquirySubmitting ? 'Submitting Enquiry...' : 'Submit Enquiry'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
