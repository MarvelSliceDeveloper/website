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
    question: "What is Banking Awareness and why is it crucial for Mains and Interviews?",
    answer: "Banking Awareness covers the structure of Indian financial systems, RBI functions, monetary policies, banking terms, and digital payment frameworks. It carries high weightage in Mains exams and forms 70% of questions asked during PO/Officer interviews."
  },
  {
    question: "How does the curriculum balance Static Banking and Current Financial News?",
    answer: "Static banking fundamentals (like inflation tools, capital markets, and banking acts) are covered systematically alongside weekly RBI notifications, monetary policy updates, and contemporary financial developments."
  },
  {
    question: "Which exams require specialized Banking & General Financial Awareness?",
    answer: "Exams including IBPS PO, IBPS Clerk, IBPS RRB Officer & Assistant, SBI PO, SBI Clerk, RBI Grade B, and Insurance exams (LIC, NIACL) feature dedicated General & Banking Awareness sections."
  },
  {
    question: "Are mock interviews included as part of Banking Awareness training?",
    answer: "Yes! Candidates targeting Officer roles receive specialized Banking Awareness interview panels with former bank senior managers and industry experts."
  },
  {
    question: "What study materials and notes are provided for Banking Awareness?",
    answer: "Aspirants receive updated monthly Banking PDF capsules, static banking term glossaries, RBI circular summaries, and section-wise practice quizzes."
  }
];

const MODULES = [
  {
    id: 'ba-01',
    number: '01',
    title: 'RBI Functions & Monetary Policy',
    subtitle: 'Understand Reserve Bank of India & Financial Management Tools',
    badge: 'CORE FINANCIAL MODULE',
    badgeStyle: 'bg-blue-50 text-brand-blue border-blue-200/80',
    image: '/images/banking/4.png',
    imageAlt: 'RBI Functions and Monetary Policy',
    paragraphs: [
      'The Reserve Bank of India (RBI) is the central monetary authority governing the Indian financial framework.',
      'Covers Quantitative Tools (Repo Rate, Reverse Repo, SDF, MSF, CRR, SLR, Open Market Operations) and Qualitative Credit Controls.',
      'Understand inflation indices (CPI, WPI), currency management, forex reserves, and liquidity adjustment facility (LAF).'
    ],
    difference: 'Deep conceptual explanations of RBI policy mechanisms rather than simple memorization of current rates.',
    idealFor: 'Aspirants wanting full marks in RBI policy questions and confident answers in PO interview rounds.'
  },
  {
    id: 'ba-02',
    number: '02',
    title: 'Indian Banking Structure & Bank Types',
    subtitle: 'From Public Sector Banks to Payment & Small Finance Banks',
    badge: 'STATIC BANKING MASTERY',
    badgeStyle: 'bg-amber-50 text-brand-orange border-amber-200/80',
    image: '/images/banking/5.png',
    imageAlt: 'Indian Banking Structure',
    paragraphs: [
      'Comprehensive overview of commercial banking classifications in India.',
      'Learn about Scheduled Commercial Banks, Public Sector Banks, Private Banks, Regional Rural Banks (RRBs), Foreign Banks, Small Finance Banks (SFBs), and Payment Banks.',
      'Understand capital adequacy ratios (Basel III norms), priority sector lending (PSL) targets, and branch licensing rules.'
    ],
    difference: 'Clear comparative breakdowns of capital requirements, target limits, and operational scopes across bank types.',
    idealFor: 'Candidates preparing for IBPS RRB, SBI PO, and clerical banking examinations.'
  },
  {
    id: 'ba-03',
    number: '03',
    title: 'Money Market & Capital Market Instruments',
    subtitle: 'Financial Markets, Securities & Foreign Exchange',
    badge: 'FINANCIAL MARKETS',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    image: '/images/banking/1.png',
    imageAlt: 'Money and Capital Markets',
    paragraphs: [
      'Financial markets provide liquidity and capital to the Indian economy.',
      'Covers Money Market instruments (Call Money, Commercial Papers, Certificates of Deposit, Treasury Bills) and Capital Market instruments (Shares, Bonds, Debentures, Mutual Funds, IPOs).',
      'Learn the roles of SEBI, IRDAI, PFRDA, NABARD, SIDBI, and EXIM Bank.'
    ],
    difference: 'Simplifies complex financial securities and regulatory bodies into clear exam-oriented concepts.',
    idealFor: 'Students preparing for Mains General Awareness and specialist officer roles.'
  },
  {
    id: 'ba-04',
    number: '04',
    title: 'Digital Banking, Payments & Fintech Innovations',
    subtitle: 'UPI, NEFT, RTGS, SWIFT & Central Bank Digital Currency',
    badge: 'DIGITAL BANKING',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/80',
    image: '/images/banking/2.png',
    imageAlt: 'Digital Banking and Technology',
    paragraphs: [
      'Digital banking has revolutionized financial service delivery across India.',
      'Covers NPCI payment frameworks (UPI, IMPS, NETC FASTag, AePS, RuPay), traditional settlement systems (NEFT, RTGS, SWIFT), Core Banking Solution (CBS), and Digital Rupee (e-Rupee CBDC).',
      'Understand cyber security measures, ATM types (White Label, Brown Label), and digital banking units (DBUs).'
    ],
    difference: 'Includes the latest 2026 fintech innovations, NPCI developments, and digital currency updates.',
    idealFor: 'All banking aspirants needing up-to-date knowledge on modern banking technologies.'
  },
  {
    id: 'ba-05',
    number: '05',
    title: 'NPA Management, SARFAESI & Financial Inclusion',
    subtitle: 'Banking Ombudsman, Insolvency & Government Schemes',
    badge: 'REGULATORY & ACTS',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    image: '/images/banking/3.png',
    imageAlt: 'NPA Management and Banking Acts',
    paragraphs: [
      'Addressing Non-Performing Assets (NPAs) and expanding financial inclusion are central to modern banking policy.',
      'Covers NPA classifications (Substandard, Doubtful, Loss assets), SARFAESI Act 2002, Insolvency & Bankruptcy Code (IBC), NARCL (Bad Bank), and Integrated Ombudsman Scheme.',
      'Master financial inclusion initiatives: PMJDY, PMJJBY, PMSBY, APY, and MUDRA Yojana.'
    ],
    difference: 'Thorough coverage of banking laws, recovery mechanisms, and welfare schemes asked in Mains and Interviews.',
    idealFor: 'PO and Specialist Officer candidates needing in-depth knowledge of banking legal frameworks.'
  }
];

export default function BankingAwareness() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [enquiryType, setEnquiryType] = useState('general');
  const [selectedTopic, setSelectedTopic] = useState('General Banking Awareness');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function openApplyModal(type = 'general', topic = 'General Banking Awareness') {
    trackEnroll(topic, 'banking_awareness_exams');
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
    const buttonClicked = enquiryType === 'topic' ? `Enroll Now (${selectedTopic})` : 'Explore Banking Awareness';

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      enquiry_type: enquiryType,
      topic_title: selectedTopic || 'Banking Awareness Enrollment',
      button_clicked: buttonClicked,
      terms_accepted: true,
      is_read: false,
    };

    const { error } = await supabase.from('banking_enquiries').insert(payload);
    if (error) {
      console.error('Banking Awareness enquiry DB error:', error);
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
          topic_title: selectedTopic || 'General Banking Awareness',
          button_clicked: buttonClicked,
        }),
      });
    } catch {
      // Non-blocking fallback
    }

    trackRegister('Banking Awareness');
    trackFormSubmit('Banking Awareness');

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
      <div className="banking-awareness-content">
        <section className="bg-white pt-8 pb-12 sm:pb-16 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal variant="left" className="lg:col-span-7 space-y-5">
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight sm:leading-snug max-w-none">
                  Banking & Financial Awareness
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                  Banking Awareness is an essential pillar for clearing General Awareness in Mains examinations and standing out during bank officer interviews. Master RBI monetary policy tools, Indian financial market instruments, payment systems, NPA recovery laws, digital banking, and government financial inclusion initiatives.
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
                      src="/images/banking/4.png"
                      alt="Banking Awareness Overview"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* MODULE CARDS SECTION */}
        <section id="ba-cards" className="py-12 sm:py-16 lg:py-20 bg-slate-50/70">
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
                Master Banking & Financial Awareness <br />
                For High Mains Scores & Interview Success
              </h2>
              <p className="!text-white text-white text-sm sm:text-base leading-relaxed font-medium max-w-3xl" style={{ color: '#ffffff' }}>
                Gain in-depth clarity on RBI policies, money markets, digital payment infrastructure, and banking regulations. Ace Mains General Awareness and enter your interview room with complete authority.
              </p>
            </Reveal>

            <Reveal variant="right" className="lg:col-span-4 flex lg:justify-end justify-start items-end pt-4 lg:pt-0">
              <button
                type="button"
                onClick={() => openApplyModal('general', 'General Banking Awareness')}
                className="group inline-flex items-center gap-2.5 h-[52px] px-8 bg-gradient-to-r from-brand-orange via-amber-500 to-orange-500 hover:from-brand-orange/90 hover:to-orange-500/90 text-white rounded-xl font-bold text-sm sm:text-base shadow-xl shadow-brand-orange/25 hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer shrink-0"
              >
                <span>Explore Banking Awareness</span>
                <FiArrowRight className="w-4.5 h-4.5 text-white transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHY PREPARE SECTION */}
      <section id="why-prepare-ba" className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <Reveal variant="left" className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight">
                  Why Prepare Banking Awareness With Us?
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-600 w-full">
                Our Banking Awareness course blends static banking fundamentals with live RBI updates and interview coaching.
              </p>

              <ul className="space-y-4 pt-2">
                <Stagger className="space-y-4">
                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Monthly Banking PDF Capsules</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Updated notes covering RBI circulars, financial events, and banking terms.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Complete RBI & Monetary Coverage</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Deep explanation of inflation control, interest rate shifts, and money market instruments.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Mock Interview & Panel Guidance</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Direct practice with former banking officials for PO personal interview preparation.
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
                      alt="Banking Awareness Preparation Batch"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </a>
              ) : (
                <div
                  onClick={() => openApplyModal('general', 'Upcoming Banking Awareness Batch')}
                  className="w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-3xl overflow-hidden border border-blue-100 shadow-xl group bg-white p-2 cursor-pointer transition-all duration-300 hover:shadow-2xl relative"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={upcomingImage}
                      alt="Banking Awareness Preparation Batch"
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
                    Banking Awareness Enrollment
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="bg-white/15 text-white border border-white/25 text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                      {enquiryType === 'topic' ? `Topic: ${selectedTopic}` : 'General Banking Awareness Enrollment'}
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
