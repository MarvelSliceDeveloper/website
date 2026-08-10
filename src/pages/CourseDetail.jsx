import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="w-full flex items-center justify-between p-2.5 text-left font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors gap-3 cursor-pointer"
          >
            <span className="text-sm sm:text-base leading-snug flex-1">{item.question}</span>
            <span className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400">
              {openIdx === i ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </span>
          </button>
          {openIdx === i && (
            <div className="px-4 sm:px-5 pb-4 text-sm text-gray-500 leading-relaxed bg-white space-y-1">
              {item.answers?.map((ans, ai) => (
                <p key={ai}>{ans}</p>
              ))}
            </div>
          )}
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

function CourseTabs({ tabs }) {
  if (!tabs || tabs.length === 0) return null;
  const [active, setActive] = useState(0);
  const activeTab = tabs[active];

  function renderContent(t) {
    const content = t.content || {};
    const hasMain = content.heading || content.paragraph || content.subheading || content.text;
    const align = (key) => {
      const a = content[key + "Align"] || "center";
      return a === "left" ? "text-left" : a === "right" ? "text-right" : "text-center";
    };
    return (
      <div className="space-y-6">
        {content.heading && <h2 className={`text-2xl font-bold text-dark-navy ${align("heading")}`}>{content.heading}</h2>}
        {content.paragraph && <p className={`text-gray-600 leading-relaxed ${align("paragraph")} ${align("paragraph") === "text-center" ? "max-w-2xl mx-auto" : ""}`}>{content.paragraph}</p>}
        {content.subheading && <h3 className={`text-lg font-semibold text-dark-navy ${align("subheading")}`}>{content.subheading}</h3>}
        {content.text && <div className={`text-gray-700 leading-relaxed whitespace-pre-line ${align("text")}`}>{content.text}</div>}
        {content.qa?.length > 0 && <AccordionQA items={content.qa} />}
        {!hasMain && !content.qa?.length && <p className="text-gray-400 text-center py-8">Content coming soon.</p>}
      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <TabBar
            tabs={tabs.map(t => t.label)}
            activeIndex={active}
            onChange={setActive}
          />
          <Link
            to="/contact"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-brand-orange text-white rounded-full hover:bg-brand-orange/90 transition-colors text-sm font-bold shadow-sm"
          >
            Apply Now
            <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-white rounded-b-xl border-x border-b border-gray-200 shadow-sm">
          <div className="p-6 sm:p-8 max-h-[420px] lg:max-h-none overflow-y-auto lg:overflow-visible">
            {renderContent(activeTab)}
          </div>
        </div>
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
                  <div className="bg-white rounded-xl shadow-sm flex items-center gap-4 px-4 py-4 border border-gray-100">
                    <div className="shrink-0 w-1 self-stretch rounded-full bg-blue-600" />
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                      {(() => {
                        const IconComp = HIGHLIGHT_ICONS[h.icon] || FiAward;
                        return <IconComp className="w-5 h-5 text-indigo-500" />;
                      })()}
                    </div>
                    <span className="font-semibold text-dark-navy text-sm">{h.label}</span>
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
            <StaggerItem key={p.id || i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-4">
                <FiBookOpen className="w-6 h-6 text-brand-orange" />
              </div>
              <h3 className="font-bold text-dark-navy mb-2">{p.title}</h3>
              {p.difficulty && <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{p.difficulty}</span>}
              {p.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                  {p.technologies.map((tech, j) => (
                    <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tech}</span>
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
    <section id="certification" data-section="certification" className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-2xl font-bold text-dark-navy mb-8 text-center">Certification</Reveal>
        <div className="max-w-4xl mx-auto">
          {certifications.map((cert, i) => (
            <Reveal key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="grid md:grid-cols-2">
                {(cert.image_url || cert.certificate_image_url) && (
                  <div className="bg-gray-50 flex items-center justify-center p-8">
                    <img src={cert.image_url || cert.certificate_image_url} alt="Certification" className="max-w-full max-h-48 object-contain" />
                  </div>
                )}
                <div className="p-8 flex flex-col justify-center">
                  {cert.description && <p className="text-gray-700 mb-4 leading-relaxed">{cert.description}</p>}
                  {cert.skills_earned?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-dark-navy mb-2">Skills You'll Earn</p>
                      <div className="flex flex-wrap gap-2">
                        {cert.skills_earned.map((s, j) => (
                          <span key={j} className="text-xs bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {cert.recognized_companies?.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-dark-navy mb-2">Recognized by</p>
                      <div className="flex flex-wrap gap-2">
                        {cert.recognized_companies.map((c, j) => (
                          <span key={j} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{c}</span>
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
      <div className="w-full max-w-[92%] sm:max-w-[70%] mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">
          Frequently Asked Questions
        </Reveal>
        <Stagger className="space-y-2">
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
  const { data: course, isLoading } = useCourse(slug);
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

    const { error } = await supabase.from('course_interests').insert(payload);
    if (error) { setInterestError(error.message); setInterestSubmitting(false); return; }

    trackFormSubmit('course_interest');
    setInterestSubmitting(false);
    setInterestDone(true);
  }

  if (course.status === 'Coming Soon') {
    return (
      <div>
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-brand-orange font-semibold hover:text-brand-orange/80 mb-6 transition-colors">
              <FiArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
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
                  <ul className="mt-6 space-y-2.5">
                    {course.checklist_items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                        <FiCheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
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
                      <Countdown target={course.start_date} />
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
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <Link to="/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-orange mb-6 transition-colors">
            Explore All Courses <FiArrowRight className="w-4 h-4" />
          </Link>
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h1 className="text-[clamp(1.75rem,3.5vw,3rem)] font-extrabold text-dark-navy leading-[1.15]">
                {course.title}
                {course.status && course.status !== 'Active' && (
                  <span className={`ml-3 inline-block align-middle text-xs font-semibold px-2.5 py-1 rounded-full ${
                    course.status === 'Coming Soon' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {course.status}
                  </span>
                )}
              </h1>
              <p className="mt-4 text-base text-gray-600 leading-relaxed">{course.description}</p>
              {course.checklist_items?.length > 0 && (
                <ul className="mt-6 space-y-2.5">
                  {course.checklist_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <FiCheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button variant="accent" size="lg" to={course.cta_link || '#contact'} onClick={() => trackCtaClick(course.cta_left || 'Talk to Advisor', 'course_hero')} className="w-full sm:w-auto">
                  {course.cta_left || 'Talk to Advisor'}
                </Button>
                <Button variant="outline" size="lg" onClick={() => { trackCtaClick(course.cta_right || 'Download Brochure', 'course_hero'); setBrochureForm({ name: '', email: '', phone: '' }); setBrochureDone(false); setBrochureError(''); setBrochureAgree(false); setShowBrochure(true); }} className="w-full sm:w-auto">
                  {course.cta_right || 'Download Brochure'}
                </Button>
              </div>
            </div>
            <div className="relative">
              {embedUrl && !videoPlaying ? (
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  {course.video_thumbnail_url ? (
                    <img src={course.video_thumbnail_url} alt="Course video thumbnail" className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center">
                      <FiBarChart2 className="w-16 h-16 text-gray-300" />
                    </div>
                  )}
                  <button onClick={() => { setVideoPlaying(true); trackVideoPlay(course.title); }} className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                      <FiPlay className="w-7 h-7 text-brand-orange ml-0.5" />
                    </div>
                  </button>
                </div>
              ) : embedUrl && videoPlaying ? (
                <div className="relative rounded-xl overflow-hidden shadow-lg">
                  <iframe
                    src={`${embedUrl}?autoplay=1&mute=1&controls=1`}
                    title="Course Introduction Video"
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden shadow-lg bg-gray-100 p-12 text-center">
                  <FiBarChart2 className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Course preview video</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>



      {/* Overview */}
      <OverviewSection course={course} />

      {/* Course Tabs */}
      <CourseTabs tabs={course.course_tabs} />

      {/* CTA Banner */}
      {course.cta_heading && course.cta_heading.trim() ? (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            {course.cta_background_image ? (
              <img src={course.cta_background_image} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-brand-blue to-blue-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
            <Reveal>
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="text-center lg:text-left text-white">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">{course.cta_heading}</h2>
                  {course.cta_description && <p className="text-white/80 mt-3 max-w-xl text-base sm:text-lg">{course.cta_description}</p>}
                </div>
                <Button
                  variant="outline-white"
                  size="lg"
                  href={course.cta_link || (course.cta_phone ? `tel:${course.cta_phone}` : undefined)}
                  className="shrink-0"
                >
                  {course.cta_text || 'Enroll Now'} <FiArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* Projects */}
      <ProjectsSection projects={course.projects} />

      {/* Certification */}
      <CertificationSection certifications={course.certifications} />

      {/* Related Courses */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal as="h2" className="text-2xl font-bold text-dark-navy mb-8">More Courses You Might Like</Reveal>
          <RelatedCoursesWithId courseId={course.id} />
        </div>
      </section>

      {/* FAQs */}
      <FAQSection faqs={course.faqs} />

      {/* Brochure Download Modal */}
      {showBrochure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowBrochure(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Download Brochure</h2>
              <button onClick={() => setShowBrochure(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
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
                <button onClick={() => setShowBrochure(false)} className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors">
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors disabled:opacity-60">
                  {brochureSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSend className="w-4 h-4" />}
                  {brochureSubmitting ? 'Sending...' : 'Get Brochure'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
