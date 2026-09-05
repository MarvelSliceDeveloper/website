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
    question: "Why is Reasoning Ability crucial for banking and competitive exams?",
    answer: "Reasoning Ability tests your analytical thinking, pattern recognition, and problem-solving under pressure. It carries high weightage in Prelims and Mains exams, where fast puzzle solving can significantly boost your total score."
  },
  {
    question: "How can I master high-level Puzzles & Seating Arrangements?",
    answer: "Mastering puzzles requires a systematic diagrammatic approach—learning how to list possibilities, identify definite clues vs conditional statements, and eliminate invalid cases without getting stuck."
  },
  {
    question: "What is the new pattern of Syllogisms in recent competitive exams?",
    answer: "Modern exams focus on statements with 'Only a Few', 'Can Never Be', and 'Possibility' conditions. We teach Venn Diagram rules and deduction logic to solve 5 syllogism questions with 100% accuracy in 2 minutes."
  },
  {
    question: "How much time should I spend on Reasoning in Prelims?",
    answer: "In a 20-minute Prelims sectional timer, aim to spend 6-8 minutes on miscellaneous topics (Syllogisms, Inequalities, Coding, Blood Relations) and 10-12 minutes on 3 to 4 Puzzles."
  },
  {
    question: "Does the course cover Mains-level Machine Input-Output and Critical Reasoning?",
    answer: "Yes, our curriculum includes advanced machine input-output shifting logic, statement-assumptions, cause-and-effect, course of action, and decision-making questions asked in Mains exams."
  }
];

const MODULES = [
  {
    id: 'reas-01',
    number: '01',
    title: 'Puzzles & Seating Arrangements',
    subtitle: 'Conquer Multi-Variable Linear, Circular & Floor Puzzles',
    badge: 'HIGH WEIGHTAGE MODULE',
    badgeStyle: 'bg-blue-50 text-brand-blue border-blue-200/80',
    image: '/images/banking/2.png',
    imageAlt: 'Puzzles and Seating Arrangements',
    paragraphs: [
      'Puzzles and Seating Arrangements account for nearly 60% to 70% of the Reasoning section in competitive examinations.',
      'Includes Linear Seating (Single & Dual Rows), Circular & Triangular Tables, Floor-and-Flat Puzzles, Box Stacking, Month-Date Scheduling, and Multi-Variable Matrix Puzzles.',
      'Learn condition-mapping techniques to quickly eliminate invalid cases and solve 5-question puzzle sets with 100% confidence.'
    ],
    difference: 'Teaches structured case-elimination templates that prevent aspirants from getting trapped in complex multi-possibility puzzles.',
    idealFor: 'Candidates wanting to master complex puzzles in IBPS PO, SBI PO, and RRB Officer Scale exams.'
  },
  {
    id: 'reas-02',
    number: '02',
    title: 'Syllogism & Deductive Logic',
    subtitle: '100% Accuracy in Venn Diagram & Statement Deductions',
    badge: 'ACCURACY & SPEED',
    badgeStyle: 'bg-amber-50 text-brand-orange border-amber-200/80',
    image: '/images/banking/3.png',
    imageAlt: 'Syllogism and Deductive Logic',
    paragraphs: [
      'Syllogism questions offer easy, high-speed marks if you understand exact set-theoretic rules and Venn diagrams.',
      'Master the latest examination keywords including "Only a few", "Some...are not", "All can be", and "Definite vs Possibility" conclusions.',
      'Practice 200+ trick questions to achieve 100% accuracy in under 2 minutes per 5-question set.'
    ],
    difference: 'Removes ambiguity by applying standard, proven Venn diagram rules for complex "Only a few" conditions.',
    idealFor: 'Aspirants looking to score guaranteed quick marks in Prelims and Mains reasoning sections.'
  },
  {
    id: 'reas-03',
    number: '03',
    title: 'Coding-Decoding & Machine Input-Output',
    subtitle: 'Decode Complex Shifting & Binary Pattern Rules',
    badge: 'MAINS SPECIAL',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    image: '/images/banking/4.png',
    imageAlt: 'Coding-Decoding and Machine Input-Output',
    paragraphs: [
      'Modern competitive exams have introduced advanced rule-based Coding-Decoding and multi-step Machine Input-Output logic.',
      'Learn to identify step-by-step sorting rules (alphabetical, numerical, word length, vowel-consonant positioning, and mathematical operations).',
      'Master new-pattern symbol coding, matrix-based coding, and conditional letter coding.'
    ],
    difference: 'Provides step identification shortcuts to crack complex Mains input-output patterns rapidly.',
    idealFor: 'Students preparing for Mains level competitive exams where high-level pattern decoding is tested.'
  },
  {
    id: 'reas-04',
    number: '04',
    title: 'Inequalities, Blood Relations & Directions',
    subtitle: 'Fast Miscellaneous Problem Solving',
    badge: 'SPEED BOOSTER',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/80',
    image: '/images/banking/5.png',
    imageAlt: 'Inequalities and Blood Relations',
    paragraphs: [
      'Miscellaneous reasoning topics are essential for building immediate confidence and securing fast marks in the first 5 minutes of your exam.',
      'Covers Coded & Direct Inequalities, Family Tree Blood Relations, Direction & Distance (including Coded Directions), and Order & Ranking.',
      'Learn the "Open Gate / Closed Gate" method for solving Inequalities without writing anything down.'
    ],
    difference: 'Oral & visual solving shortcuts that allow candidates to complete 10 miscellaneous questions in under 4 minutes.',
    idealFor: 'All competitive exam candidates aiming to build high speed and confidence early in the test.'
  },
  {
    id: 'reas-05',
    number: '05',
    title: 'Critical & Logical Reasoning',
    subtitle: 'Master Statement-Assumptions, Cause & Effect, & Decision Making',
    badge: 'ANALYTICAL MASTERY',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    image: '/images/banking/1.png',
    imageAlt: 'Critical and Logical Reasoning',
    paragraphs: [
      'Critical Reasoning is a high-yield area in Officer-level Mains examinations and interview discussions.',
      'Covers Statement & Assumptions, Statement & Argument, Cause & Effect, Course of Action, Inferences, and Data Sufficiency.',
      'Learn how to evaluate arguments logically without personal bias or fallacious reasoning.'
    ],
    difference: 'Clear logical framework guidelines to eliminate false choices in subjective verbal reasoning questions.',
    idealFor: 'Aspirants targeting Officer-rank positions requiring sharp analytical evaluation skills.'
  }
];

export default function Reasoning() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [enquiryType, setEnquiryType] = useState('general');
  const [selectedTopic, setSelectedTopic] = useState('General Reasoning Coaching');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function openApplyModal(type = 'general', topic = 'General Reasoning Coaching') {
    trackEnroll(topic, 'reasoning_exams');
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
    const buttonClicked = enquiryType === 'topic' ? `Enroll Now (${selectedTopic})` : 'Explore Reasoning Paths';

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      enquiry_type: enquiryType,
      topic_title: selectedTopic || 'General Reasoning Enrollment',
      button_clicked: buttonClicked,
      terms_accepted: true,
      is_read: false,
    };

    const { error } = await supabase.from('banking_enquiries').insert(payload);
    if (error) {
      console.error('Reasoning enquiry DB error:', error);
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
          topic_title: selectedTopic || 'General Reasoning Coaching',
          button_clicked: buttonClicked,
        }),
      });
    } catch {
      // Non-blocking fallback
    }

    trackRegister('Reasoning');
    trackFormSubmit('Reasoning');

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
      <div className="reasoning-content">
        <section className="bg-white pt-8 pb-12 sm:pb-16 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal variant="left" className="lg:col-span-7 space-y-5">
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight sm:leading-snug max-w-none">
                  Reasoning Ability & Logical Aptitude
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                  Reasoning Ability tests your mental agility, logical analysis, and puzzle-solving capability under exam time constraints. Master multi-variable seating arrangements, complex floor puzzles, modern syllogism rules, machine input-output, and critical reasoning with expert guidance and daily structured practice.
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
                      src="/images/banking/2.png"
                      alt="Reasoning Ability Overview"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* MODULE CARDS SECTION */}
        <section id="reasoning-cards" className="py-12 sm:py-16 lg:py-20 bg-slate-50/70">
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
                Sharpen Your Reasoning Skills <br />
                Crack Puzzles & Logic With Confidence
              </h2>
              <p className="!text-white text-white text-sm sm:text-base leading-relaxed font-medium max-w-3xl" style={{ color: '#ffffff' }}>
                Transform complex puzzles and logical statements into easy marks. Master case-mapping techniques, fast Venn diagram rules, and high-level critical reasoning with expert faculty.
              </p>
            </Reveal>

            <Reveal variant="right" className="lg:col-span-4 flex lg:justify-end justify-start items-end pt-4 lg:pt-0">
              <button
                type="button"
                onClick={() => openApplyModal('general', 'General Reasoning Coaching')}
                className="group inline-flex items-center gap-2.5 h-[52px] px-8 bg-gradient-to-r from-brand-orange via-amber-500 to-orange-500 hover:from-brand-orange/90 hover:to-orange-500/90 text-white rounded-xl font-bold text-sm sm:text-base shadow-xl shadow-brand-orange/25 hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer shrink-0"
              >
                <span>Explore Reasoning Paths</span>
                <FiArrowRight className="w-4.5 h-4.5 text-white transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY PREPARE SECTION */}
      <section id="why-prepare-reasoning" className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <Reveal variant="left" className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight">
                  Why Prepare Reasoning Ability With Us?
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                Our Reasoning curriculum equips you with foolproof strategies for solving high-variable puzzles and fast logical deductions.
              </p>

              <ul className="space-y-4 pt-2">
                <Stagger className="space-y-4">
                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Case-Elimination Templates</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Step-by-step puzzle frameworks that systematically rule out false conditions.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Oral Inequality & Syllogism Shortcuts</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Solve direct statements visually without wasting precious seconds on rough sheets.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Complete Mains Pattern Coverage</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          In-depth practice for machine input-output, coded directions, and critical reasoning.
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
                      alt="Reasoning Preparation Batch"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </a>
              ) : (
                <div
                  onClick={() => openApplyModal('general', 'Upcoming Reasoning Batch')}
                  className="w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-3xl overflow-hidden border border-blue-100 shadow-xl group bg-white p-2 cursor-pointer transition-all duration-300 hover:shadow-2xl relative"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={upcomingImage}
                      alt="Reasoning Preparation Batch"
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
              <div className="bg-brand-blue text-white px-5 sm:px-6 py-3.5 text-center relative border-b border-blue-600/30">
                <div className="flex flex-col items-center justify-center px-4">
                  <h3 className="text-base sm:text-lg font-extrabold leading-tight text-center">
                    Reasoning Course Enrollment
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="bg-white/15 text-white border border-white/25 text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                      {enquiryType === 'topic' ? `Topic: ${selectedTopic}` : 'General Reasoning Enrollment'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="absolute top-3 right-3 bg-white shadow-md text-red-600 hover:text-red-700 hover:scale-105 p-1 rounded-full transition-all cursor-pointer border border-slate-200 z-10 flex items-center justify-center"
                  aria-label="Close modal"
                >
                  <FiX className="w-4 h-4 text-red-600" />
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
