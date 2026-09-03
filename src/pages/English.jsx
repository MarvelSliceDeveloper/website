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
    question: "Why is English Language vital in competitive exams?",
    answer: "English carries substantial weight in both Prelims and Mains sections. Unlike math calculations, English questions can be answered rapidly—making it the highest scoring section when grammar and reading comprehension are well prepared."
  },
  {
    question: "How can I improve my speed in Reading Comprehension (RC)?",
    answer: "Speed in RC comes from active scanning techniques, skimming financial & editorial passages, recognizing key thesis statements, and practicing inference-based context questions rather than reading every word passively."
  },
  {
    question: "How does the course prepare candidates for Mains Descriptive English?",
    answer: "Our curriculum includes dedicated guidance on Essay Writing (economic trends, banking digital innovations, environmental policies) and Formal/Informal Letter Writing with live review and feedback on structure, tone, and grammar."
  },
  {
    question: "What is the best way to retain vocabulary and phrasal verbs?",
    answer: "Instead of rote memorization, we teach vocabulary in context through daily editorial root-word breakdowns, contextual fill-in-the-blanks, and phrasal verb usage in real sentences."
  },
  {
    question: "Can regional-medium students easily follow the English curriculum?",
    answer: "Yes! We teach grammar rules systematically from core principles (subject-verb agreement, tense consistency, modifiers) with clear explanations that bridge the gap for all candidates."
  }
];

const MODULES = [
  {
    id: 'eng-01',
    number: '01',
    title: 'Reading Comprehension & Contextual Inference',
    subtitle: 'Master Financial, Economic & Editorial Passages',
    badge: 'CORE SECTIONAL MODULE',
    badgeStyle: 'bg-blue-50 text-brand-blue border-blue-200/80',
    image: '/images/banking/3.png',
    imageAlt: 'Reading Comprehension and Passages',
    paragraphs: [
      'Reading Comprehension accounts for 10-15 marks per examination paper.',
      'Includes passages on global economic trends, Indian financial reforms, environmental policies, social issues, and technological advancements.',
      'Learn active skimming, main-idea identification, tone analysis (analytical, critical, optimistic), and fast contextual vocabulary solving.'
    ],
    difference: 'Focuses on financial and editorial passage analysis designed specifically for competitive exam patterns.',
    idealFor: 'Aspirants who struggle with lengthy RC passages and want to boost reading speed and accuracy.'
  },
  {
    id: 'eng-02',
    number: '02',
    title: 'Grammar Rules & Error Spotting',
    subtitle: 'Comprehensive Coverage of High-Yield Grammar Rules',
    badge: 'GRAMMAR MASTERY',
    badgeStyle: 'bg-amber-50 text-brand-orange border-amber-200/80',
    image: '/images/banking/4.png',
    imageAlt: 'Grammar Rules and Error Spotting',
    paragraphs: [
      'Spotting Errors and Sentence Improvement questions test core grammatical accuracy.',
      'Master Subject-Verb Agreement, Tenses, Prepositional combinations, Pronoun antecedent rules, Parallelism, Modifiers, and Conditional Sentences.',
      'Learn the "Rule of 100 Grammar Formulas" that frequently recur across competitive exam papers.'
    ],
    difference: 'Eliminates guesswork by replacing intuitive reading with concrete grammatical rule application.',
    idealFor: 'Candidates looking to secure maximum error-spotting marks without second-guessing options.'
  },
  {
    id: 'eng-03',
    number: '03',
    title: 'Vocabulary, Phrasal Verbs & Cloze Tests',
    subtitle: 'Expand Active Word Bank & Contextual Fillers',
    badge: 'VOCABULARY & FILLERS',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    image: '/images/banking/5.png',
    imageAlt: 'Vocabulary and Cloze Tests',
    paragraphs: [
      'Cloze tests and fill-in-the-blanks evaluate both vocabulary range and contextual grammatical fit.',
      'Covers Root-Word etymology, Synonyms & Antonyms, Idioms & Phrases, Phrasal Verbs, and Single/Double Fillers.',
      'Daily contextual vocabulary flashcards and weekly cloze test speed drills.'
    ],
    difference: 'Teaches root-word decoding so you can deduce the meaning of unfamiliar words during live exams.',
    idealFor: 'Aspirants wanting to build a robust English vocabulary for competitive exams and interviews.'
  },
  {
    id: 'eng-04',
    number: '04',
    title: 'Sentence Rearrangement & Para Jumbles',
    subtitle: 'Logical Cohesion & Paragraph Structuring',
    badge: 'PARAGRAPH LOGIC',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/80',
    image: '/images/banking/1.png',
    imageAlt: 'Sentence Rearrangement and Para Jumbles',
    paragraphs: [
      'Para Jumble sets require identifying opening statements, mandatory pairs, logical transition signals, and concluding remarks.',
      'Learn how pronouns, conjunctions (however, furthermore, consequently), and chronological indicators connect disjointed sentences.',
      'Master new-pattern sentence connections and paragraph completion exercises.'
    ],
    difference: 'Teaches mandatory pair identification rules that solve 6-sentence para jumbles in under 2 minutes.',
    idealFor: 'Candidates aiming for high scores in paragraph logic and sentence structure sections.'
  },
  {
    id: 'eng-05',
    number: '05',
    title: 'Mains Descriptive English & Essay Writing',
    subtitle: 'Format & Writing Practice for Officer Examinations',
    badge: 'DESCRIPTIVE SPECIAL',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    image: '/images/banking/2.png',
    imageAlt: 'Mains Descriptive English and Essay Writing',
    paragraphs: [
      'Officer-level Mains exams (IBPS PO, SBI PO) feature a mandatory Descriptive Test testing Essay and Letter Writing.',
      'Covers Formal & Informal Letter formats (Bank Managers, Editors, Branch Requests) and Essay Writing on contemporary banking, socio-economic, and tech topics.',
      'Includes personalized feedback on paragraph structure, grammar accuracy, typing speed, and vocabulary usage.'
    ],
    difference: 'Direct essay evaluation and letter formatting feedback tailored for competitive exam criteria.',
    idealFor: 'PO and Officer-level aspirants needing confidence and structure in descriptive writing tests.'
  }
];

export default function English() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [enquiryType, setEnquiryType] = useState('general');
  const [selectedTopic, setSelectedTopic] = useState('General English Coaching');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function openApplyModal(type = 'general', topic = 'General English Coaching') {
    trackEnroll(topic, 'english_exams');
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
    const buttonClicked = enquiryType === 'topic' ? `Enroll Now (${selectedTopic})` : 'Explore English Paths';

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      enquiry_type: enquiryType,
      topic_title: selectedTopic || 'General English Enrollment',
      button_clicked: buttonClicked,
      terms_accepted: true,
      is_read: false,
    };

    const { error } = await supabase.from('banking_enquiries').insert(payload);
    if (error) {
      console.error('English enquiry DB error:', error);
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
          topic_title: selectedTopic || 'General English Coaching',
          button_clicked: buttonClicked,
        }),
      });
    } catch {
      // Non-blocking fallback
    }

    trackRegister('English');
    trackFormSubmit('English');

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
      <div className="english-content">
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
                  English Language & Verbal Ability
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                  English Language is one of the most scoring sections in competitive examinations when approached with strong grammar fundamentals, active reading skills, and contextual vocabulary. Master Reading Comprehension, error spotting, cloze tests, para jumbles, and Mains descriptive letter & essay writing.
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
                      src="/images/banking/3.png"
                      alt="English Language Overview"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* MODULE CARDS SECTION */}
        <section id="english-cards" className="py-12 sm:py-16 lg:py-20 bg-slate-50/70">
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
                Excel in English Language <br />
                From Prelims to Mains & Descriptive Writing
              </h2>
              <p className="!text-white text-white text-sm sm:text-base leading-relaxed font-medium max-w-3xl" style={{ color: '#ffffff' }}>
                Build unflappable confidence in Reading Comprehension, Error Spotting, Cloze Tests, and Descriptive Essays. Transform English into your highest-scoring competitive exam section.
              </p>
            </Reveal>

            <Reveal variant="right" className="lg:col-span-4 flex lg:justify-end justify-start items-end pt-4 lg:pt-0">
              <button
                type="button"
                onClick={() => openApplyModal('general', 'General English Coaching')}
                className="group inline-flex items-center gap-2.5 h-[52px] px-8 bg-gradient-to-r from-brand-orange via-amber-500 to-orange-500 hover:from-brand-orange/90 hover:to-orange-500/90 text-white rounded-xl font-bold text-sm sm:text-base shadow-xl shadow-brand-orange/25 hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer shrink-0"
              >
                <span>Explore English Paths</span>
                <FiArrowRight className="w-4.5 h-4.5 text-white transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY PREPARE SECTION */}
      <section id="why-prepare-english" className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <Reveal variant="left" className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight">
                  Why Prepare English Language With Us?
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                Our English curriculum delivers practical grammar application, editorial reading techniques, and descriptive writing excellence.
              </p>

              <ul className="space-y-4 pt-2">
                <Stagger className="space-y-4">
                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Daily Editorial Reading Breakdown</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Analysis of economic and financial editorials for vocabulary and context.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">100 Core Grammar Formulas</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Rule-based approaches that make error spotting objective and error-free.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Descriptive Essay & Letter Mentorship</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Personalized evaluation of format, vocabulary, and grammar for Mains papers.
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
                      alt="English Preparation Batch"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </a>
              ) : (
                <div
                  onClick={() => openApplyModal('general', 'Upcoming English Batch')}
                  className="w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-3xl overflow-hidden border border-blue-100 shadow-xl group bg-white p-2 cursor-pointer transition-all duration-300 hover:shadow-2xl relative"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={upcomingImage}
                      alt="English Preparation Batch"
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
                    English Course Enrollment
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/15 text-white border border-white/25 text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                      {enquiryType === 'topic' ? `Topic: ${selectedTopic}` : 'General English Enrollment'}
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
