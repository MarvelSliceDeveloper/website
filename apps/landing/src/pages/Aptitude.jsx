import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiCheckCircle, FiArrowRight, FiTarget, FiX, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import AccordionItem from '../components/ui/AccordionItem';
import { supabase } from '../lib/supabaseClient';
import { trackRegister, trackFormSubmit, trackEnroll } from '../lib/analytics';
import BankingTestimonialsSection from '../components/banking/BankingTestimonialsSection';

const FAQS = [
  {
    question: "How important is Quantitative Aptitude in Banking and Competitive Exams?",
    answer: "Quantitative Aptitude carries significant weight in Prelims and Mains examinations across IBPS PO, IBPS Clerk, SBI PO, SSC CGL, and Railway exams. Mastering shortcut tricks, Data Interpretation, and calculation speed is critical to clearing high sectional cutoffs."
  },
  {
    question: "How can I improve my speed and accuracy in Data Interpretation (DI)?",
    answer: "Speed in DI comes from mastering mental calculation, percentage-to-fraction conversions, ratio simplifications, and practice with diverse formats like Pie charts, Radar charts, Bar graphs, and missing DI caselets."
  },
  {
    question: "Are non-math background students able to excel in Aptitude?",
    answer: "Absolutely. Our Aptitude curriculum starts from fundamental high-school math principles, teaching Vedic calculation tricks, structured formula-free methods, and step-by-step problem-solving suited for all academic backgrounds."
  },
  {
    question: "What is the recommended daily practice time for Aptitude?",
    answer: "Aspirants should allocate at least 1.5 to 2 hours daily—combining speed calculation drills (15 mins), topic-wise practice (45 mins), and full-length timed DI/Mocks (45 mins)."
  },
  {
    question: "Does the course cover both Prelims speed tests and Mains high-level problems?",
    answer: "Yes, our training covers two distinct tiers: fast speed-booster techniques for Prelims and conceptual, multi-concept arithmetic & caselet DI for Mains."
  }
];

const MODULES = [
  {
    id: 'apt-01',
    number: '01',
    title: 'Data Interpretation & Caselets',
    subtitle: 'Master High-Weightage Visual & Tabular Data Problems',
    badge: 'CORE MAINS & PRELIMS',
    badgeStyle: 'bg-blue-50 text-brand-blue border-blue-200/80',
    image: '/images/banking/1.png',
    imageAlt: 'Data Interpretation and Caselet Analysis',
    paragraphs: [
      'Data Interpretation is the cornerstone of Quantitative Aptitude in competitive exams. Candidates must quickly extract, compute, and compare data from visual charts.',
      'Our module covers Tabular DI, Bar Graphs, Line Graphs, Pie Charts, Radar Graphs, Missing Data DI, and Paragraph-based Caselets.',
      'Learn fast calculation techniques, percentage shortcuts, and visual estimation tricks to solve 5-question DI sets in under 3 minutes.'
    ],
    difference: 'Focuses on visual data elimination techniques and mental arithmetic approximations to save maximum time in exams.',
    idealFor: 'Aspirants targeting high scores in IBPS PO, SBI PO, and SSC CGL Mains where DI dominates the quantitative section.'
  },
  {
    id: 'apt-02',
    number: '02',
    title: 'Arithmetic & Commercial Mathematics',
    subtitle: 'Build Unshakable Problem-Solving Foundations',
    badge: 'ARITHMETIC MASTERY',
    badgeStyle: 'bg-amber-50 text-brand-orange border-amber-200/80',
    image: '/images/banking/2.png',
    imageAlt: 'Arithmetic and Commercial Math Overview',
    paragraphs: [
      'Arithmetic concepts form the backbone of both standalone quantitative questions and advanced arithmetic-based Caselet DI.',
      'Covers Profit & Loss, Simple & Compound Interest, Time & Work, Pipes & Cisterns, Speed Distance & Time, Trains & Boats, Mixtures & Alligations, Ratios, and Averages.',
      'Emphasis is placed on ratio-proportion methods and unitary techniques rather than memorizing long formulas.'
    ],
    difference: 'Replaces complex algebraic equations with smart ratio and percentage conversion techniques.',
    idealFor: 'Students looking to build strong conceptual clarity and solve word problems quickly without formula overload.'
  },
  {
    id: 'apt-03',
    number: '03',
    title: 'Speed Math & Vedic Calculations',
    subtitle: 'Supercharge Calculation Speed for Prelims',
    badge: 'SPEED BOOSTER',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    image: '/images/banking/3.png',
    imageAlt: 'Speed Math and Vedic Calculation',
    paragraphs: [
      'In Prelims exams, speed is everything. 10 to 15 marks are directly awarded for fast calculation speed in Simplification, Approximation, and Series.',
      'Learn Vedic multiplication methods, square & cube root shortcuts, percentage equivalence tables, Quadratic Equations sign tricks, and Number Series pattern recognition.',
      'Includes daily timed calculation worksheets to double your calculation speed within 2 weeks.'
    ],
    difference: 'Dedicated daily speed-drills designed to secure 10-15 quick marks in Prelims within 5 minutes.',
    idealFor: 'All competitive exam candidates wanting to maximize attempt speed and confidence in time-restricted Prelims.'
  },
  {
    id: 'apt-04',
    number: '04',
    title: 'Advanced Quantitative Aptitude',
    subtitle: 'Tackle Higher-Level Permutations & Geometry',
    badge: 'ADVANCED LEVEL',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/80',
    image: '/images/banking/4.png',
    imageAlt: 'Advanced Quantitative Aptitude',
    paragraphs: [
      'Higher-level competitive exams frequently test probability, counting principles, and spatial mensuration.',
      'Covers Permutations & Combinations, Probability distribution, Mensuration 2D & 3D (Area, Volume, Surfaces), and Data Sufficiency in Quantitative Aptitude.',
      'Master decision-making techniques to determine whether given statements are sufficient to answer quantitative queries.'
    ],
    difference: 'Step-by-step logical frameworks for complex counting and spatial problems commonly skipped by average candidates.',
    idealFor: 'Aspirants targeting top percentile cutoffs in Officer-grade banking and central government examinations.'
  },
  {
    id: 'apt-05',
    number: '05',
    title: 'Sectional Mock Tests & Exam Strategy',
    subtitle: 'Simulated Testing with Real-Time Performance Analytics',
    badge: 'TEST SERIES & MENTORSHIP',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    image: '/images/banking/5.png',
    imageAlt: 'Sectional Mocks and Speed Drills',
    paragraphs: [
      'Testing under real exam conditions is essential to overcome exam anxiety and fine-tune question selection strategies.',
      'Provides full-length sectional mock tests, speed-based topic quizzes, negative marking control strategies, and personalized performance analytics.',
      'Identify your strongest topic areas, eliminate calculation errors, and master time allocation per section.'
    ],
    difference: 'Combines adaptive online test series with 1-on-1 mentorship feedback on accuracy and speed analytics.',
    idealFor: 'Candidates preparing for upcoming exam cycles needing real test experience and strategic guidance.'
  }
];

export default function Aptitude() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [enquiryType, setEnquiryType] = useState('general');
  const [selectedTopic, setSelectedTopic] = useState('General Aptitude Coaching');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function openApplyModal(type = 'general', topic = 'General Aptitude Coaching') {
    trackEnroll(topic, 'aptitude_exams');
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
    const buttonClicked = enquiryType === 'topic' ? `Enroll Now (${selectedTopic})` : 'Explore Aptitude Paths';

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      enquiry_type: enquiryType,
      topic_title: selectedTopic || 'General Aptitude Enrollment',
      button_clicked: buttonClicked,
      terms_accepted: true,
      is_read: false,
    };

    const { error } = await supabase.from('banking_enquiries').insert(payload);
    if (error) {
      console.error('Aptitude enquiry DB error:', error);
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
          topic_title: selectedTopic || 'General Aptitude Coaching',
          button_clicked: buttonClicked,
        }),
      });
    } catch {
      // Non-blocking fallback
    }

    trackRegister('Aptitude');
    trackFormSubmit('Aptitude');

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormErrors({});
  }

  const { data: upcomingSectionData } = useQuery({
    queryKey: ['homeSections', 'upcoming_image'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('home_sections')
        .select('*')
        .eq('section_key', 'upcoming_image')
        .maybeSingle();
      if (error) return null;
      return data?.content || null;
    },
  });

  const upcomingImage = upcomingSectionData?.image_url || '/images/banking/b.png';
  const upcomingLink = upcomingSectionData?.image_link || '';

  function handleBackNavigation(e) {
    if (e) e.preventDefault();
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      <div className="aptitude-content">
        <section className="bg-white pt-8 pb-12 sm:pb-16 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={handleBackNavigation}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors mb-6 cursor-pointer group"
            >
              <FiArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-orange transition-transform group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>

            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal variant="left" className="lg:col-span-7 space-y-5">
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight sm:leading-snug max-w-none">
                  Quantitative Aptitude for Competitive Exams
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                  Quantitative Aptitude tests your numerical ability, problem-solving speed, and logical interpretation of mathematical data. Whether you are aiming for IBPS PO/Clerk, SBI, RRB, SSC CGL, or Insurance examinations, our structured Quantitative Aptitude curriculum provides conceptual foundation, Vedic speed math, shortcut techniques, and comprehensive Data Interpretation mastery.
                </p>
              </Reveal>

              <Reveal variant="right" className="lg:col-span-5 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full max-w-md lg:max-w-none rounded-3xl bg-gradient-to-b from-blue-50/80 to-amber-50/40 border border-blue-100 p-4 sm:p-5 shadow-lg overflow-hidden"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-white/80 aspect-[4/3] group">
                    <img
                      src="/images/banking/1.png"
                      alt="Quantitative Aptitude Overview"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* MODULE CARDS SECTION */}
        <section id="aptitude-cards" className="py-12 sm:py-16 lg:py-20 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
            {MODULES.map((mod) => (
              <Reveal key={mod.id} variant="up">
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  id={mod.id}
                  className="bg-white border border-[#E5ECF5] hover:border-brand-orange/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-sm hover:shadow-2xl hover:shadow-brand-blue/10 transition-all duration-300 group min-h-[380px] flex flex-col justify-center"
                >
                  <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch h-full">
                    <div className="lg:col-span-4 shrink-0 flex">
                      <div className="relative w-full h-60 lg:h-full min-h-[260px] rounded-2xl overflow-hidden shadow-xs border border-slate-100">
                        <img
                          src={mod.image}
                          alt={mod.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/40 via-transparent to-transparent opacity-40" />
                      </div>
                    </div>

                    <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center font-extrabold text-sm font-mono shadow-md shadow-brand-blue/20 shrink-0">
                            {mod.number}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase border ${mod.badgeStyle}`}>
                            {mod.badge}
                          </span>
                        </div>

                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-dark-navy leading-tight group-hover:text-brand-blue transition-colors">
                            {mod.title}
                          </h2>
                          <h3 className="text-xs sm:text-sm font-semibold text-brand-orange mt-0.5">
                            {mod.subtitle}
                          </h3>
                        </div>

                        <div className="space-y-2 text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                          {mod.paragraphs.map((p, idx) => (
                            <p key={idx}>{p}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[#E5ECF5] pt-5 lg:pt-0 lg:pl-6 space-y-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-brand-blue uppercase tracking-wider">
                            <div className="w-5.5 h-5.5 rounded-md bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
                              <FiTarget className="w-3.5 h-3.5" />
                            </div>
                            <span>What Makes It Different?</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {mod.difference}
                          </p>
                        </div>

                        <div className="h-px bg-slate-100" />

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-dark-navy uppercase tracking-wider">
                            <div className="w-5.5 h-5.5 rounded-md bg-amber-50 flex items-center justify-center text-brand-orange shrink-0">
                              <FiCheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <span>Ideal For</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {mod.idealFor}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openApplyModal('topic', mod.title)}
                        className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-orange text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:shadow-brand-orange/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5 group/btn cursor-pointer mt-2"
                      >
                        <span>Enroll Now</span>
                        <FiArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-1.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>

      {/* CTA BANNER */}
      <section className="relative py-14 sm:py-18 lg:py-20 bg-gradient-to-r from-[#07193C] via-[#0B2A6F] to-[#1558D6] text-white overflow-hidden w-full border-y border-white/10 shadow-2xl">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="absolute -top-24 -right-24 w-[480px] sm:w-[540px] h-[480px] sm:h-[540px] text-white/15" viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="250" cy="250" r="180" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <Reveal variant="left" className="lg:col-span-8 space-y-4 text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-brand-orange tracking-tight leading-tight">
                Master Quantitative Aptitude <br />
                With Speed, Precision & Accuracy
              </h2>
              <p className="!text-white text-white text-sm sm:text-base leading-relaxed font-medium max-w-3xl" style={{ color: '#ffffff' }}>
                Gain the upper hand in Prelims speed calculation and Mains complex Data Interpretation. Learn ratio methods, mental math shortcuts, and real exam problem selection strategies from top faculty.
              </p>
            </Reveal>

            <Reveal variant="right" className="lg:col-span-4 flex lg:justify-end justify-start items-end pt-4 lg:pt-0">
              <button
                type="button"
                onClick={() => openApplyModal('general', 'General Aptitude Coaching')}
                className="group inline-flex items-center gap-2.5 h-[52px] px-8 bg-gradient-to-r from-brand-orange via-amber-500 to-orange-500 hover:from-brand-orange/90 hover:to-orange-500/90 text-white rounded-xl font-bold text-sm sm:text-base shadow-xl shadow-brand-orange/25 hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer shrink-0"
              >
                <span>Explore Aptitude Paths</span>
                <FiArrowRight className="w-4.5 h-4.5 text-white transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY PREPARE SECTION */}
      <section id="why-prepare-aptitude" className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <Reveal variant="left" className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight">
                  Why Prepare Quantitative Aptitude With Us?
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                Our Aptitude coaching builds solid conceptual clarity while honing rapid speed techniques required under strict exam time limits.
              </p>

              <ul className="space-y-4 pt-2">
                <Stagger className="space-y-4">
                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Vedic Math & Mental Calculations</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Daily speed math drills to eliminate pen-and-paper calculation delays.
                        </p>
                      </div>
                    </li>
                  </StaggerItem>

                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Zero-Formula Ratio Approach</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Solve complex profit/loss, interest, and work-time problems using intuitive ratio methods.
                        </p>
                      </div>
                    </li>
                  </StaggerItem>

                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Advanced DI & Caselet Workshops</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Specialized focus on paragraph caselets, radar charts, and multi-variable Data Interpretation.
                        </p>
                      </div>
                    </li>
                  </StaggerItem>
                </Stagger>
              </ul>
            </Reveal>

            <Reveal variant="right" className="lg:col-span-5 flex justify-center lg:justify-end self-center my-auto pt-8 lg:pt-10">
              {upcomingLink ? (
                <a
                  href={upcomingLink}
                  target={upcomingLink.startsWith('http') ? '_blank' : undefined}
                  rel={upcomingLink.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-3xl overflow-hidden border border-blue-100 shadow-xl group bg-white p-2 cursor-pointer transition-all duration-300 hover:shadow-2xl"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={upcomingImage}
                      alt="Aptitude Preparation Batch"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </a>
              ) : (
                <div
                  onClick={() => openApplyModal('general', 'Upcoming Aptitude Batch')}
                  className="w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-3xl overflow-hidden border border-blue-100 shadow-xl group bg-white p-2 cursor-pointer transition-all duration-300 hover:shadow-2xl relative"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={upcomingImage}
                      alt="Aptitude Preparation Batch"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <BankingTestimonialsSection />

      {/* FAQS SECTION */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10 sm:mb-14">
              <div className="inline-flex flex-col items-center">
                <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-dark-navy tracking-tight">
                  Frequently Asked Questions
                </h2>
                <div className="mt-3.5 h-[3.5px] bg-brand-orange rounded-full w-16 sm:w-20" />
              </div>
            </div>
          </Reveal>

          <Stagger className="space-y-3.5 w-full max-w-4xl mx-auto">
            {FAQS.map((faq, i) => (
              <StaggerItem key={i}>
                <AccordionItem
                  variant="clean"
                  title={faq.question}
                  isOpen={openFaqIndex === i}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                >
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                </AccordionItem>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* REGISTRATION MODAL */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100"
            >
              <div className="bg-brand-blue text-white px-5 sm:px-6 py-3.5 flex items-center justify-between relative border-b border-blue-600/30">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold leading-tight">
                    Aptitude Course Enrollment
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/15 text-white border border-white/25 text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                      {enquiryType === 'topic' ? `Topic: ${selectedTopic}` : 'General Aptitude Enrollment'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="w-7 h-7 rounded-full bg-white text-red-500 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                  aria-label="Close modal"
                >
                  <FiX className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <div className="p-5 sm:p-6 bg-[#F8FAFD]">
                {isSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                      <FiCheckCircle className="w-8 h-8 text-brand-blue" />
                    </div>
                    <h4 className="text-xl font-bold text-dark-navy">Enrollment Submitted!</h4>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                      Thank you for enrolling. Our academic advisors will reach out to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={closeApplyModal}
                      className="mt-2 px-8 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm rounded-full transition-all shadow-md cursor-pointer mx-auto block"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-dark-navy uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Enter your full name"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                          formErrors.name
                            ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                            : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 bg-white'
                        }`}
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark-navy uppercase tracking-wider mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                          formErrors.email
                            ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                            : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 bg-white'
                        }`}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark-navy uppercase tracking-wider mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                          formErrors.phone
                            ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                            : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 bg-white'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.phone}</p>
                      )}
                    </div>

                    <div className="pt-2 flex justify-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 sm:px-10 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 active:scale-95 mx-auto"
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
