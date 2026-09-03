import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiArrowRight, FiX, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import AccordionItem from '../components/ui/AccordionItem';
import { supabase } from '../lib/supabaseClient';
import { trackRegister, trackFormSubmit, trackEnroll } from '../lib/analytics';
import BankingTestimonialsSection from '../components/banking/BankingTestimonialsSection';

const FAQS = [
  {
    question: "What format are the Mock Exams conducted in?",
    answer: "All mock exams replicate the exact online exam interface of IBPS and SBI, featuring timed sections, question palettes, mark for review options, and negative marking rules."
  },
  {
    question: "How soon do I receive test analysis and rank reports?",
    answer: "Detailed test analytics, including section-wise accuracy, time per question, percentile rank, and comparison with toppers, are generated immediately after test submission."
  },
  {
    question: "Are solution videos and explanation PDFs provided for all mocks?",
    answer: "Yes! Every mock test comes with step-by-step written solutions, shortcut approach notes, and live video walkthroughs by expert faculty."
  },
  {
    question: "Which exams are covered in the Banking Mock Test Series?",
    answer: "The series covers IBPS PO, IBPS Clerk, IBPS RRB Officer Scale-I & Office Assistant, SBI PO, SBI Clerk, RBI Grade B, and major insurance recruitment exams."
  },
  {
    question: "Can I take sectional and speed tests separately?",
    answer: "Yes, you can practice topic-wise speed drills for Quantitative Aptitude, Reasoning, English Language, and Banking Awareness independently."
  }
];

const MODULES = [
  {
    id: 'mock-01',
    number: '01',
    title: 'Full-Length Prelims & Mains Mocks',
    subtitle: 'Real Exam Interface & Environment Simulation',
    badge: 'FULL-LENGTH TESTS',
    badgeStyle: 'bg-blue-50 text-brand-blue border-blue-200/80',
    image: '/images/banking/1.png',
    imageAlt: 'Full-Length Prelims and Mains Mock Tests',
    paragraphs: [
      'Experience the exact pressure, interface, and time constraints of IBPS PO, SBI PO, and Clerk Prelims & Mains examinations.',
      'Fresh test patterns updated continuously according to the latest notification guidelines and actual exam trends.',
      'Receive all-India rank benchmarking, section cut-off analysis, and speed vs accuracy mapping.'
    ],
    difference: 'Simulates exact exam day conditions with balanced difficulty levels curated by senior exam toppers.',
    idealFor: 'Aspirants preparing for complete examination cycles from Prelims through Mains.'
  },
  {
    id: 'mock-02',
    number: '02',
    title: 'Sectional & Speed Drill Practice',
    subtitle: 'Target Weak Areas & Improve Time Management',
    badge: 'SECTIONAL DRILLS',
    badgeStyle: 'bg-amber-50 text-brand-orange border-amber-200/80',
    image: '/images/banking/2.png',
    imageAlt: 'Sectional and Speed Drill Practice',
    paragraphs: [
      'Topic-wise speed tests designed to sharpen problem-solving speed in Data Interpretation, Puzzles, Grammar, and Current Affairs.',
      'Build speed and accuracy under timed section constraints to minimize negative marking.',
      'Track accuracy progress per topic week-by-week with targeted improvement recommendations.'
    ],
    difference: 'Helps eliminate specific topic bottlenecks through short, focused 15-minute speed drills.',
    idealFor: 'Candidates seeking to boost section cut-off scores in Quantitative Aptitude, Reasoning, and English.'
  },
  {
    id: 'mock-03',
    number: '03',
    title: 'Detailed Video Solutions & PDF Capsules',
    subtitle: 'Learn Shortcut Methods & Time-Saving Hacks',
    badge: 'SOLUTION CAPSULES',
    badgeStyle: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    image: '/images/banking/3.png',
    imageAlt: 'Video Solutions and PDF Capsules',
    paragraphs: [
      'Comprehensive step-by-step solution breakdowns for every single question in the mock test series.',
      'Master shortcut methods, elimination techniques, and fast calculation formulas explained by expert faculty.',
      'Downloadable revision PDF capsules summarizing high-yield questions, formula sheets, and solution keys.'
    ],
    difference: 'Focuses on teaching the fastest solving methodology rather than standard lengthy textbook methods.',
    idealFor: 'Students wanting to understand why their answers went wrong and how to solve faster.'
  }
];

export default function MockExam() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [enquiryType, setEnquiryType] = useState('general');
  const [selectedTopic, setSelectedTopic] = useState('General Mock Exam Series Enquiry');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function openApplyModal(type = 'general', topic = 'General Mock Exam Series Enquiry') {
    trackEnroll(topic, 'mock_exams');
    setEnquiryType(type);
    setSelectedTopic(topic);
    setShowApplyModal(true);
  }

  function closeApplyModal() {
    if (isSubmitting) return;
    setShowApplyModal(false);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormErrors({});
    setIsSubmitted(false);
  }

  async function handleApplySubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!formName.trim()) errs.name = 'Please enter your full name';
    if (!formEmail.trim()) errs.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) errs.email = 'Please enter a valid email address';
    if (!formPhone.trim()) errs.phone = 'Please enter your phone number';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);

    const buttonClicked = enquiryType === 'topic' ? `Enroll Now (${selectedTopic})` : 'Join Mock Exam Series';

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      enquiry_type: enquiryType,
      topic_title: selectedTopic || 'Mock Exam Series Enrollment',
      button_clicked: buttonClicked,
      terms_accepted: true,
      is_read: false,
    };

    const { error } = await supabase.from('banking_enquiries').insert(payload);
    if (error) {
      console.error('Mock Exam enquiry DB error:', error);
    }

    try {
      await fetch('/api/submit-banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          enquiry_type: enquiryType,
          topic_title: selectedTopic || 'Mock Exam Series Enquiry',
          button_clicked: buttonClicked,
        }),
      });
    } catch {
      // Non-blocking email attempt
    }

    trackRegister('MockExam');
    trackFormSubmit('MockExam');

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormErrors({});
  }

  function handleBackNavigation(e) {
    if (e) e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/banking');
    }
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      <div className="banking-career-content">
        {/* HERO SECTION */}
        <section className="bg-white pt-8 pb-12 sm:pb-16 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors mb-6 cursor-pointer group"
            >
              <FiArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-orange transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal variant="left" className="lg:col-span-7 space-y-5">
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight sm:leading-snug max-w-none">
                  Mock Exam Series & Exam Practice
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full indent-6 sm:indent-10 whitespace-pre-line">
                  Real exam simulation is the key to cracking competitive banking examinations. Our Mock Exam Series provides real-time test interface practice, section-wise accuracy analytics, all-India percentile ranking, and step-by-step video solutions for IBPS PO, IBPS Clerk, IBPS RRB, and SBI PO/Clerk examinations. Practice under authentic time constraints and boost your confidence before exam day.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => openApplyModal('general', 'Mock Exam Series Enrollment')}
                    className="inline-flex items-center justify-center gap-2 bg-brand-orange text-white font-bold text-sm py-3 px-8 rounded-full hover:bg-brand-orange/90 hover:shadow-lg hover:shadow-brand-orange/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Join Mock Exam Series</span>
                    <FiArrowRight className="w-4 h-4 text-white shrink-0" />
                  </button>
                </div>
              </Reveal>

              <Reveal variant="right" className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[460px] aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-slate-50">
                  <img
                    src="/images/banking/1.png"
                    alt="Mock Exam Series & Exam Practice"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* EXAM MODULES LIST */}
        <section className="py-12 sm:py-16 bg-slate-50/60 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
            <Reveal className="text-center max-w-3xl mx-auto">
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">
                Mock Exam Series Highlights
              </h2>
              <div className="w-16 h-[3px] bg-brand-orange rounded-full mt-3 mb-6 mx-auto" />
              <p className="text-xs sm:text-sm font-normal text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Structured test packages designed to sharpen your time management, accuracy, and section scores.
              </p>
            </Reveal>

            <Stagger className="space-y-12 sm:space-y-16">
              {MODULES.map((mod) => (
                <StaggerItem key={mod.id}>
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300">
                    <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                      <div className="lg:col-span-8 space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-2xl font-bold text-brand-orange">{mod.number}</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${mod.badgeStyle}`}>
                            {mod.badge}
                          </span>
                        </div>

                        <div>
                          <h3 className="font-bold text-xl sm:text-2xl text-dark-navy leading-snug">
                            {mod.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-brand-orange font-semibold mt-1">
                            {mod.subtitle}
                          </p>
                        </div>

                        <div className="space-y-3 pt-1">
                          {mod.paragraphs.map((p, idx) => (
                            <p key={idx} className={`text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full whitespace-pre-line ${idx === 0 ? 'indent-6 sm:indent-10' : 'indent-0'}`}>
                              {p}
                            </p>
                          ))}
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => openApplyModal('topic', mod.title)}
                            className="inline-flex items-center gap-2 bg-brand-blue text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-full hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shadow-xs"
                          >
                            <span>Enroll for {mod.title}</span>
                            <FiArrowRight className="w-4 h-4 text-white shrink-0" />
                          </button>
                        </div>
                      </div>

                      <div className="lg:col-span-4 flex justify-center">
                        <div className="w-full max-w-[320px] aspect-[4/3] rounded-xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-100">
                          <img
                            src={mod.image}
                            alt={mod.imageAlt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <BankingTestimonialsSection />

        {/* FAQS SECTION */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-10">
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">
                Mock Exam Series FAQs
              </h2>
              <div className="w-16 h-[3px] bg-brand-orange rounded-full mt-3 mb-6 mx-auto" />
              <p className="text-xs sm:text-sm font-normal text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Frequently asked questions regarding our banking mock test series and pattern analytics.
              </p>
            </Reveal>

            <Stagger className="space-y-3">
              {FAQS.map((faq, idx) => (
                <StaggerItem key={idx}>
                  <AccordionItem
                    title={faq.question}
                    isOpen={openFaqIndex === idx}
                    onToggle={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  >
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{faq.answer}</p>
                  </AccordionItem>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      </div>

      {/* ENROLLMENT MODAL */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" onClick={closeApplyModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-brand-blue px-6 py-5 text-white relative">
                <button
                  onClick={closeApplyModal}
                  className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <FiX className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-bold text-white">Enroll for Mock Exam Series</h3>
                <p className="text-xs text-white/80 mt-0.5">{selectedTopic}</p>
              </div>

              {isSubmitted ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <FiCheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-xl text-dark-navy">Enrollment Request Received!</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Thank you! Our academic team will contact you shortly with mock exam schedule details.
                  </p>
                  <button
                    onClick={closeApplyModal}
                    className="inline-flex items-center justify-center bg-brand-blue text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-full hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                        formErrors.name ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                      }`}
                    />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address <span className="text-red-400">*</span></label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="john@example.com"
                      className={`w-full px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                        formErrors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                      }`}
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number <span className="text-red-400">*</span></label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className={`w-full px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                        formErrors.phone ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                      }`}
                    />
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeApplyModal}
                      className="px-5 py-2.5 rounded-full border border-slate-300 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-brand-orange text-white font-bold text-xs sm:text-sm hover:bg-brand-orange/90 transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
                    >
                      {isSubmitting ? <><FiLoader className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Request'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
