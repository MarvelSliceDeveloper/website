import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiArrowLeft, FiCheckCircle, FiArrowRight, FiTarget, FiChevronDown, FiX, FiLoader, FiZoomIn } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import AccordionItem from '../components/ui/AccordionItem';
import { supabase } from '../lib/supabaseClient';
import { trackRegister, trackFormSubmit } from '../lib/analytics';
import BankingTestimonialsSection from '../components/banking/BankingTestimonialsSection';

const FAQS = [
  {
    question: "What are the key eligibility criteria for IBPS examinations?",
    answer: "For IBPS PO, Clerk, and RRB roles, a recognized Bachelor's degree in any discipline is generally required. Age limits usually range between 20 to 30 years for PO and 18 to 28 years for Clerk/Assistant, with age relaxation applicable for reserved categories. For IBPS Specialist Officer (SO), specific degree qualifications in IT, Agriculture, Law, HR, or Marketing are mandatory."
  },
  {
    question: "Is there a personal interview stage for all IBPS exams?",
    answer: "No. IBPS PO/MT, RRB Officer Scale I, and Specialist Officer (SO) include a personal interview after the Main examination. However, for clerical and office assistant positions like IBPS Clerk/CSA and RRB Office Assistant, selection is based purely on written examination performance without a personal interview."
  },
  {
    question: "Can final-year college students apply for IBPS recruitment?",
    answer: "Yes, final-year students can apply provided their final graduation results are declared on or before the official document verification / registration cutoff date specified in the official IBPS notification for that recruitment cycle."
  },
  {
    question: "How many public sector and rural banks recruit through IBPS?",
    answer: "IBPS conducts recruitment for 11 major Public Sector Banks across India (including Bank of Baroda, Punjab National Bank, Canara Bank, Union Bank, etc.) as well as over 40 Regional Rural Banks (RRBs) operating across various states."
  },
  {
    question: "What is the typical selection process and exam pattern?",
    answer: "Most IBPS examinations follow a two-tier objective online exam format: a Preliminary Exam (testing Reasoning, Quantitative Aptitude, and English) followed by a Main Exam (including General/Banking Awareness and Computer Knowledge). Officer-level posts also include a final interview stage."
  }
];

const EXAMS = [
  {
    id: 'section-01',
    number: '01',
    title: 'IBPS PO / MT',
    subtitle: 'Start Your Journey as a Bank Officer',
    badge: 'OFFICER LEVEL',
    badgeStyle: 'bg-blue-50 text-brand-blue border-blue-200/80',
    image: '/images/banking/banking_ibps_po_1787149162525.jpg',
    imageAlt: 'IBPS PO Officer in modern bank office',
    paragraphs: [
      'The IBPS Probationary Officer / Management Trainee examination is one of the most sought-after banking examinations for graduates who want to begin their career in an officer-level position.',
      'A Probationary Officer is exposed to different areas of banking during the early stages of their career. The role can involve customer service, account operations, loans and credit, branch administration, financial products, and day-to-day banking activities.',
      'It is a strong choice for candidates who want a career with responsibility, structured growth, and opportunities to move into higher managerial positions.'
    ],
    difference: 'The PO pathway is designed for candidates aiming directly for an officer role. It generally involves a Preliminary Examination, Main Examination, and Interview.',
    idealFor: 'Graduates who want leadership responsibilities, career progression, and a long-term career in banking.'
  },
  {
    id: 'section-02',
    number: '02',
    title: 'IBPS Clerk / Customer Service Associate',
    subtitle: 'Be the First Point of Contact for Customers',
    badge: 'CLERICAL / CUSTOMER SERVICE',
    badgeStyle: 'bg-amber-50 text-brand-orange border-amber-200/80',
    image: '/images/banking/banking_ibps_clerk_1787149180592.jpg',
    imageAlt: 'IBPS Clerk Customer Service Associate assisting customer',
    paragraphs: [
      'The IBPS Clerk recruitment, now associated with the Customer Service Associate role, is an excellent entry point into the banking sector.',
      'Customer Service Associates work closely with customers and support essential branch operations. Their responsibilities may include account services, cash-related activities, documentation, customer requests, and assisting customers with banking products and services.',
      'The role provides practical exposure to how a bank operates while offering a structured path for professional growth.'
    ],
    difference: 'Unlike PO recruitment, the usual Clerk/CSA selection process does not include an interview. Candidates are selected through the examination stages specified for the recruitment cycle.',
    idealFor: 'Candidates who enjoy customer interaction, branch operations, and want to enter the banking sector through a clerical/customer-service position.'
  },
  {
    id: 'section-03',
    number: '03',
    title: 'IBPS RRB Officer Scale I',
    subtitle: 'Build a Career Closer to the Community',
    badge: 'REGIONAL RURAL BANK OFFICER',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    image: '/images/banking/banking_rrb_officer_1787149492894.jpg',
    imageAlt: 'IBPS RRB Officer interacting with rural community',
    paragraphs: [
      'Regional Rural Banks play an important role in providing banking and financial services to rural and semi-urban communities.',
      'The IBPS RRB Officer Scale I examination is designed for candidates seeking an officer-level position in a Regional Rural Bank.',
      'An Officer Scale I can work across areas such as branch operations, customer services, agricultural and rural banking, credit-related activities, and other banking functions.',
      'The role offers the opportunity to combine a professional banking career with direct exposure to communities and local economic activity.'
    ],
    difference: 'The RRB Officer Scale I role is specifically connected with Regional Rural Banks, giving candidates an opportunity to work in a banking environment focused strongly on rural and semi-urban customers.',
    idealFor: 'Candidates interested in officer-level banking roles and who are comfortable working with rural and semi-urban communities.'
  },
  {
    id: 'section-04',
    number: '04',
    title: 'IBPS RRB Office Assistant',
    subtitle: 'Begin with Strong Banking Fundamentals',
    badge: 'REGIONAL RURAL BANK ASSISTANT',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/80',
    image: '/images/banking/banking_hero_editorial_1787149136213.jpg',
    imageAlt: 'IBPS RRB Office Assistant branch operations',
    paragraphs: [
      'The RRB Office Assistant role provides an opportunity to begin a banking career within the Regional Rural Banking ecosystem.',
      'Office Assistants support day-to-day branch activities and interact directly with customers. Their work can involve account-related services, documentation, cash and transaction support, customer assistance, and routine branch operations.',
      'For many candidates, this role provides a practical foundation for understanding banking operations while building valuable professional experience.'
    ],
    difference: 'The position is focused on office and customer-service responsibilities within Regional Rural Banks rather than the officer-level responsibilities associated with Scale I recruitment.',
    idealFor: 'Candidates looking for an accessible entry into banking and who are interested in serving customers in rural and semi-urban regions.'
  },
  {
    id: 'section-05',
    number: '05',
    title: 'IBPS Specialist Officer',
    subtitle: 'Turn Your Specialisation into a Banking Career',
    badge: 'SPECIALISED ROLES',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    image: '/images/banking/banking_ibps_po_1787149162525.jpg',
    imageAlt: 'IBPS Specialist Officer IT & Finance expertise',
    paragraphs: [
      'Banking is not limited to general banking and customer service. Modern banks also require professionals with expertise in technology, agriculture, law, human resources, marketing, and other specialised fields.',
      'IBPS Specialist Officer recruitment provides opportunities for candidates with specific educational backgrounds to enter banking through specialist positions.',
      'Depending on the recruitment cycle, specialist roles can include IT Officer, Agriculture Field Officer, Law Officer, Rajbhasha Adhikari, HR/Personnel Officer, and Marketing Officer.',
      'Instead of starting with a general banking profile, Specialist Officer candidates bring their existing academic or professional specialisation into the banking environment.'
    ],
    difference: 'The eligibility requirements and examination content are linked to the specific specialist position. Candidates therefore need to meet the educational requirements of the post they are targeting.',
    idealFor: 'Graduates and professionals with a relevant specialist qualification who want to combine their technical or professional expertise with a career in banking.'
  }
];

export default function Banking() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [enquiryType, setEnquiryType] = useState('general');
  const [selectedTopic, setSelectedTopic] = useState('General Banking Enquiry');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  function openApplyModal(type = 'general', topic = 'General Banking Enquiry') {
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

    const buttonClicked = enquiryType === 'topic' ? `Enquire Now (${selectedTopic})` : 'Explore Banking Paths';

    const payload = {
      full_name: formName.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      enquiry_type: enquiryType,
      topic_title: selectedTopic || 'General Banking Enquiry',
      button_clicked: buttonClicked,
      terms_accepted: true,
      is_read: false,
    };

    const { error } = await supabase.from('banking_enquiries').insert(payload);
    if (error) {
      console.error('Banking enquiry DB error:', error);
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
          topic_title: selectedTopic || 'General Banking Enquiry',
          button_clicked: buttonClicked,
        }),
      });
    } catch {
      // Non-blocking email attempt
    }

    trackRegister('Banking');
    trackFormSubmit('Banking');

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

  const upcomingImage = upcomingSectionData?.image_url || '/images/banking/banking_hero_editorial_1787149136213.jpg';
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
      <div className="banking-career-content">
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
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-brand-blue leading-[1.18] tracking-tight">
                  Build Your Career <br className="hidden sm:inline" />
                  in Banking
                </h1>

                <p className="text-slate-600 text-base sm:text-lg leading-[1.8] font-normal">
                  Banking is one of India's most popular career paths for graduates who are looking for stability, professional growth, and opportunities to work across different areas of financial services. The Institute of Banking Personnel Selection (IBPS) conducts recruitment examinations for several public-sector banking positions. These examinations open doors to roles ranging from customer-facing branch operations to officer-level responsibilities and specialised banking functions. Explore the major IBPS examinations below and find the path that matches your career goals.
                </p>
              </Reveal>

              {/* Right Column: Visual Container with Image & Decorative Banking Accents */}
              <Reveal variant="right" className="lg:col-span-5 flex justify-center">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full max-w-md lg:max-w-none rounded-3xl bg-gradient-to-b from-blue-50/80 to-amber-50/40 border border-blue-100 p-4 sm:p-5 shadow-lg overflow-hidden"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-md border border-white/80 aspect-[4/3] group">
                    <img
                      src="/images/banking/banking_hero_editorial_1787149136213.jpg"
                      alt="Banking Career Overview"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/60 via-transparent to-transparent opacity-60" />
                    
                    {/* Soft Floating Badge Accent */}
                    <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-white/80 flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand-blue text-white flex items-center justify-center font-extrabold text-xs shadow-md">
                          IBPS
                        </div>
                        <div>
                          <p className="text-xs font-bold text-dark-navy">Public Sector Banking</p>
                          <p className="text-[10px] text-slate-500 font-semibold">5 Major Career Examinations</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-amber-50 text-brand-orange border border-brand-orange/30 shadow-xs">
                        Official
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* 2. BANKING CAREER CARDS SECTION */}
        <section id="banking-cards" className="py-12 sm:py-16 lg:py-20 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
            {EXAMS.map((exam) => (
              <Reveal key={exam.id} variant="up">
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  id={exam.id}
                  className="bg-white border border-[#E5ECF5] hover:border-brand-orange/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-9 shadow-sm hover:shadow-2xl hover:shadow-brand-blue/10 transition-all duration-300 group"
                >
                  <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                    {/* LEFT — Image (~35% width / lg:col-span-4) */}
                    <div className="lg:col-span-4 shrink-0">
                      <div className="relative w-full h-56 lg:h-full min-h-[220px] rounded-2xl overflow-hidden shadow-xs border border-slate-100">
                        <img
                          src={exam.image}
                          alt={exam.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-navy/40 via-transparent to-transparent opacity-40" />
                      </div>
                    </div>

                    {/* MIDDLE — Main Information (lg:col-span-5) */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {/* Number Badge & Category Pill */}
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-brand-blue text-white flex items-center justify-center font-extrabold text-sm font-mono shadow-md shadow-brand-blue/20 shrink-0">
                            {exam.number}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold tracking-wider uppercase border ${exam.badgeStyle}`}>
                            {exam.badge}
                          </span>
                        </div>

                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-dark-navy leading-tight group-hover:text-brand-blue transition-colors">
                            {exam.title}
                          </h2>
                          <h3 className="text-xs sm:text-sm font-semibold text-brand-orange mt-0.5">
                            {exam.subtitle}
                          </h3>
                        </div>

                        {/* Existing Paragraphs */}
                        <div className="space-y-2 text-slate-600 text-xs sm:text-sm leading-relaxed font-normal">
                          {exam.paragraphs.map((p, idx) => (
                            <p key={idx}>{p}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT — Supporting Information (lg:col-span-3) */}
                    <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[#E5ECF5] pt-5 lg:pt-0 lg:pl-6 space-y-5 flex flex-col justify-between">
                      <div className="space-y-4">
                        {/* What Makes It Different */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-brand-blue uppercase tracking-wider">
                            <div className="w-5.5 h-5.5 rounded-md bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
                              <FiTarget className="w-3.5 h-3.5" />
                            </div>
                            <span>What Makes It Different?</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {exam.difference}
                          </p>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* Ideal For */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-dark-navy uppercase tracking-wider">
                            <div className="w-5.5 h-5.5 rounded-md bg-amber-50 flex items-center justify-center text-brand-orange shrink-0">
                              <FiCheckCircle className="w-3.5 h-3.5" />
                            </div>
                            <span>Ideal For</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-normal">
                            {exam.idealFor}
                          </p>
                        </div>
                      </div>

                      {/* Enquire Action Button */}
                      <button
                        type="button"
                        onClick={() => openApplyModal('topic', exam.title)}
                        className="w-full py-2.5 px-4 bg-brand-blue hover:bg-brand-orange text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg hover:shadow-brand-orange/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5 group/btn cursor-pointer mt-2"
                      >
                        <span>Enquire Now</span>
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

      {/* 3. EDITORIAL INFOGRAPHIC FULL-WIDTH CAREER CTA BANNER SECTION */}
      <section className="relative py-14 sm:py-18 lg:py-20 bg-gradient-to-r from-[#07193C] via-[#0B2A6F] to-[#1558D6] text-white overflow-hidden w-full border-y border-white/10 shadow-2xl">
        {/* SVG HALF CIRCLE & CURVED CONCENTRIC LINE VECTOR PATTERN (BLUE & WHITE ONLY) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top-Right Half Circle Arc Lines */}
          <svg className="absolute -top-24 -right-24 w-[480px] sm:w-[540px] h-[480px] sm:h-[540px] text-white/15" viewBox="0 0 500 500" fill="none">
            <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="250" cy="250" r="180" stroke="currentColor" strokeWidth="2" />
            <circle cx="250" cy="250" r="130" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx="250" cy="250" r="80" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Bottom-Left Half Circle Arc Lines */}
          <svg className="absolute -bottom-24 -left-24 w-[420px] sm:w-[480px] h-[420px] sm:h-[480px] text-white/15" viewBox="0 0 450 450" fill="none">
            <circle cx="225" cy="225" r="205" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" />
            <circle cx="225" cy="225" r="155" stroke="currentColor" strokeWidth="2" />
            <circle cx="225" cy="225" r="105" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" />
            <circle cx="225" cy="225" r="55" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Subtle Horizontal Curved Wave Lines */}
          <svg className="absolute inset-0 w-full h-full text-white/5" viewBox="0 0 1200 400" preserveAspectRatio="none" fill="none">
            <path d="M 0 200 Q 300 100 600 200 T 1200 200" stroke="currentColor" strokeWidth="2" />
            <path d="M 0 240 Q 300 140 600 240 T 1200 240" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
          </svg>
        </div>

        {/* SOFT BLUE & WHITE AMBIENT GLOW ORBS */}
        <div className="absolute -top-32 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            {/* LEFT COLUMN: SINGLE LINE HEADING, DIVIDER & EXPANDED CONTENT (~70% width) */}
            <Reveal variant="left" className="lg:col-span-8 space-y-4 text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-brand-orange tracking-tight leading-tight">
                Your Banking Career <br />
                Starts with the Right Choice
              </h2>

              <p className="!text-white text-white text-sm sm:text-base leading-relaxed font-medium max-w-3xl" style={{ color: '#ffffff' }}>
                Whether you are aiming for officer profiles like IBPS PO & RRB Scale I, customer-facing roles like IBPS Clerk & Office Assistant, or specialized technical positions, our structured banking curriculum offers end-to-end guidance from Prelims to Final Interviews. Gain deep conceptual clarity, daily speed tests, and personalized mentorship from former banking professionals.
              </p>
            </Reveal>

            {/* RIGHT COLUMN: BUTTON ALIGNED TO BOTTOM RIGHT (~30% width) */}
            <Reveal variant="right" className="lg:col-span-4 flex lg:justify-end justify-start items-end pt-4 lg:pt-0">
              <button
                type="button"
                onClick={() => openApplyModal('general', 'General Banking Enquiry')}
                className="group inline-flex items-center gap-2.5 h-[52px] px-8 bg-gradient-to-r from-brand-orange via-amber-500 to-orange-500 hover:from-brand-orange/90 hover:to-orange-500/90 text-white rounded-xl font-bold text-sm sm:text-base shadow-xl shadow-brand-orange/25 hover:scale-105 active:scale-100 transition-all duration-300 cursor-pointer shrink-0"
              >
                <span>Explore Banking Paths</span>
                <FiArrowRight className="w-4.5 h-4.5 text-white transition-transform duration-300 group-hover:translate-x-1.5" />
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 4. COURSE HIGHLIGHTS & UPCOMING IMAGE SECTION */}
      <section id="why-prepare-section" className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Column: Heading & 4 Course Bullet Points */}
            <Reveal variant="left" className="lg:col-span-7 space-y-6">
              <div>
                <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-brand-blue leading-tight">
                  Why Prepare for Banking <br />
                  Exams with Us?
                </h2>
              </div>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
                Our specialized Banking & IBPS coaching program is designed to build strong concepts, enhance speed and accuracy, and provide end-to-end guidance from Prelims to Final Interviews.
              </p>

              <ul className="space-y-4 pt-2">
                <Stagger className="space-y-4">
                  <StaggerItem>
                    <li className="flex items-start gap-3.5 group">
                      <div className="p-1 rounded-full bg-amber-50 border border-brand-orange/40 text-brand-orange mt-0.5 shrink-0 group-hover:scale-110 transition-transform">
                        <FiCheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Comprehensive Syllabus Coverage</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          In-depth preparation for Quantitative Aptitude, Reasoning Ability, English Language, and General/Banking Awareness.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Structured Prelims & Mains Training</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Targeted strategy covering two-tier objective exams, speed tests, and descriptive paper practice.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Expert Banking Faculty & Mentorship</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Learn directly from experienced competitive exam specialists and former banking professionals.
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
                        <h3 className="font-bold text-dark-navy text-base sm:text-lg group-hover:text-brand-blue transition-colors">Full-Length Mock Tests & Analytics</h3>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                          Regular section-wise speed tests, exam-pattern simulations, and detailed performance tracking.
                        </p>
                      </div>
                    </li>
                  </StaggerItem>
                </Stagger>
              </ul>
            </Reveal>

            {/* Right Column: Upcoming Image Positioned ~10% down & CLICKABLE (MATCHING HOME) */}
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
                      alt="Banking Course & Upcoming Classes"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </a>
              ) : (
                <div
                  onClick={() => openApplyModal('general', 'Upcoming Banking Batch')}
                  className="w-full h-[320px] lg:w-[480px] lg:h-[400px] rounded-3xl overflow-hidden border border-blue-100 shadow-xl group bg-white p-2 cursor-pointer transition-all duration-300 hover:shadow-2xl relative"
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    <img
                      src={upcomingImage}
                      alt="Banking Course & Upcoming Classes"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  </div>
                </div>
              )}
            </Reveal>
          </div>
        </div>
      </section>

      {/* BANKING TESTIMONIALS SECTION */}
      <BankingTestimonialsSection />

      {/* 5. FREQUENTLY ASKED QUESTIONS SECTION */}
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

      {/* APPLY NOW REGISTRATION MODAL */}
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
              {/* Modal Header */}
              <div className="bg-brand-blue text-white px-6 py-5 flex items-center justify-between relative border-b border-blue-600/30">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold leading-snug">
                    Banking Enquiry
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="bg-white/15 text-white border border-white/25 text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                      {enquiryType === 'topic' ? `Exam: ${selectedTopic}` : 'General Banking Enquiry'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeApplyModal}
                  className="p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form Content */}
              <div className="p-6 sm:p-7 bg-[#F8FAFD]">
                {isSubmitted ? (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto border border-blue-200 shadow-sm">
                      <FiCheckCircle className="w-8 h-8 text-brand-blue" />
                    </div>
                    <h4 className="text-xl font-bold text-dark-navy">Application Submitted!</h4>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
                      Thank you for applying. Our banking academic advisors will reach out to you shortly.
                    </p>
                    <button
                      type="button"
                      onClick={closeApplyModal}
                      className="mt-2 w-full py-3 bg-brand-blue hover:bg-brand-orange text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplySubmit} className="space-y-4">
                    {formErrors.form && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                        {formErrors.form}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-dark-navy uppercase tracking-wider mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="Enter your full name"
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
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
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
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
                        className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${
                          formErrors.phone
                            ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                            : 'border-slate-200 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 bg-white'
                        }`}
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-xs text-red-500 font-medium">{formErrors.phone}</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-brand-blue hover:bg-brand-orange text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg hover:shadow-brand-orange/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                      >
                        {isSubmitting ? (
                          <>
                            <FiLoader className="w-4 h-4 animate-spin" />
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <span>Submit Application</span>
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
