import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiChevronDown, FiChevronRight, FiMail, FiPhone, FiMenu } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackSocialClick } from '../../lib/analytics';

const BANKING_MENU_DROPDOWNS = {
  aptitude: {
    label: 'Aptitude',
    path: '/aptitude',
    categories: [
      {
        id: 'di',
        name: 'Data Interpretation',
        items: ['Pie Chart & Line Graphs', 'Tabular DI & Caselets', 'Radar & Bar Graphs', 'Missing Data DI']
      },
      {
        id: 'arithmetic',
        name: 'Arithmetic',
        items: ['Percentage & Profit Loss', 'Simple & Compound Interest', 'Time & Work / Pipes', 'Ratios & Mixtures']
      },
      {
        id: 'speedMaths',
        name: 'Speed Calculation',
        items: ['Vedic Tricks & Squares', 'Simplification & Approximation', 'Quadratic Equations', 'Number Series (Missing & Wrong)']
      }
    ]
  },
  reasoning: {
    label: 'Reasoning',
    path: '/reasoning',
    categories: [
      {
        id: 'puzzles',
        name: 'Puzzles & Seating',
        items: ['Floor & Flat Puzzles', 'Linear & Circular Arrangement', 'Box & Month Based Puzzles', 'Matrix & Schedule Puzzles']
      },
      {
        id: 'logical',
        name: 'Logical Reasoning',
        items: ['Syllogisms (Only a Few)', 'Coded Inequalities', 'Blood Relations & Direction', 'Input-Output Machine']
      }
    ]
  },
  english: {
    label: 'English',
    path: '/english',
    categories: [
      {
        id: 'grammar',
        name: 'Grammar & Reading',
        items: ['Reading Comprehension Passages', 'Error Spotting & Sentence Correction', 'Cloze Test & Fillers', 'Para Jumbles & Rearrangement']
      },
      {
        id: 'vocab',
        name: 'Vocabulary',
        items: ['Editorial Vocabulary', 'Idioms & Phrases', 'One Word Substitution', 'Synonyms & Antonyms']
      }
    ]
  },
  bankingAwareness: {
    label: 'Banking Awareness',
    path: '/banking-awareness',
    categories: [
      {
        id: 'financial',
        name: 'Banking & Finance',
        items: ['RBI & Monetary Policy', 'Types of Bank Accounts & Cheques', 'NPA, PCA & Insolvency Code', 'Inflation, Repo Rate & CRR/SLR']
      },
      {
        id: 'markets',
        name: 'Capital & Money Market',
        items: ['SEBI & Stock Exchanges', 'Treasury Bills & Commercial Paper', 'Priority Sector Lending', 'Digital Banking & UPI/NEFT/RTGS']
      }
    ]
  },
  affairs: {
    label: 'Affairs',
    path: '/current-affairs',
    items: [
      { title: 'Current Affairs', path: '/current-affairs', desc: 'Daily National & International News' },
      { title: "Today's Affairs", path: '/current-affairs?filter=today', desc: 'Real-time Daily News Updates' },
      { title: 'Monthly Current Affairs Capsule', path: '/current-affairs', desc: 'Comprehensive Exam-focused Summary' },
      { title: 'Banking & Economy News', path: '/current-affairs', desc: 'Financial Sector Weekly Updates' }
    ]
  },
  mockExam: {
    label: 'Mock Exam',
    path: '/mock-exam',
    items: [
      { title: 'IBPS PO Prelims Full Mock', desc: '100 Questions Timed Simulation' },
      { title: 'IBPS Clerk Speed Test', desc: 'Sectional Speed Booster Test' },
      { title: 'RRB Officer Scale I Practice', desc: 'Prelims & Mains Model Test' },
      { title: 'Specialist Officer Test Series', desc: 'Domain Knowledge Mocks' }
    ]
  }
};

export default function BankingHeader({ onOpenLoginModal }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: settings } = useSiteSettings();
  const social = settings?.social_links || {};

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const searchQuery = searchParams.get('q') || '';

  const handleSearchChange = (val) => {
    if (val) {
      if (pathname !== '/banking' && pathname !== '/bankingv2') {
        navigate(`/banking?q=${encodeURIComponent(val)}`);
      } else {
        setSearchParams({ q: val }, { replace: true });
      }
    } else {
      if (pathname === '/banking' || pathname === '/bankingv2') {
        searchParams.delete('q');
        setSearchParams(searchParams, { replace: true });
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAboutActive = pathname === '/banking' || pathname === '/bankingv2';
  const isAptitudeActive = pathname === '/aptitude';
  const isReasoningActive = pathname === '/reasoning';
  const isEnglishActive = pathname === '/english';
  const isBankingAwarenessActive = pathname === '/banking-awareness';
  const isAffairsActive = pathname === '/current-affairs' || pathname === '/todays-affairs';
  const isMockExamActive = pathname === '/mock-exam';

  return (
    <header className="w-full bg-white border-b border-gray-100 shadow-xs relative z-50">
      {/* TIER 1: TOP BAR */}
      <div className="bg-brand-blue text-white text-xs py-2 px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-wrap items-center justify-between gap-2">
          {/* Left Contact Details */}
          <div className="flex items-center gap-4 sm:gap-6 text-slate-100 font-medium">
            <a
              href={`mailto:${settings?.contact_email || 'sales@marvelslice.com'}`}
              className="flex items-center gap-1.5 hover:text-brand-orange transition-colors"
            >
              <FiMail className="w-3.5 h-3.5 text-brand-orange" />
              <span>{settings?.contact_email || 'sales@marvelslice.com'}</span>
            </a>

            <div className="hidden sm:flex items-center gap-1.5 text-slate-100">
              <FiPhone className="w-3.5 h-3.5 text-brand-orange" />
              <span>{settings?.contact_phone || '+91 63809 57390 / +91 80882 18609'}</span>
            </div>
          </div>

          {/* Right Social Links */}
          <div className="flex items-center gap-2">
            {social.facebook && (
              <a
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('facebook', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-3 h-3" />
              </a>
            )}
            {social.twitter && (
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('twitter', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Twitter"
              >
                <FaXTwitter className="w-3 h-3" />
              </a>
            )}
            {social.instagram && (
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('instagram', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Instagram"
              >
                <FaInstagram className="w-3 h-3" />
              </a>
            )}
            {social.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('linkedin', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="w-3 h-3" />
              </a>
            )}
            {social.youtube && (
              <a
                href={social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('youtube', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="YouTube"
              >
                <FaYoutube className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* TIER 2: MAIN WHITE LOGO + SEARCH + LOG IN / SIGN UP BAR */}
      <div className="bg-white py-3 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {settings?.logo_url && (
              <img
                src={settings.logo_url}
                alt="Marvel Slice Logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            )}
            <span className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight">
              MARVEL<span className="text-brand-orange">SLICE</span>
            </span>
          </Link>

          {/* Center Search Bar Pill */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative w-full">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search banking topics, exams..."
                className="w-full pl-9 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 text-slate-700 placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Log In / Sign Up */}
          <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm font-semibold shrink-0">
            <button
              type="button"
              onClick={() => onOpenLoginModal && onOpenLoginModal('general', 'Log In')}
              className="text-slate-700 hover:text-brand-blue transition-colors cursor-pointer px-2 py-1"
            >
              Log In
            </button>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => onOpenLoginModal && onOpenLoginModal('general', 'Sign Up')}
              className="text-brand-blue hover:text-brand-orange transition-colors font-bold cursor-pointer px-2 py-1"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-700 hover:text-brand-blue transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* TIER 3: SUB-HEADER NAVIGATION BAR */}
      <div className="bg-blue-50/90 border-b border-blue-100/80 shadow-xs relative" ref={dropdownRef}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav
            role="menubar"
            className="flex items-center justify-start gap-1 sm:gap-2.5 py-1.5 overflow-x-auto no-scrollbar whitespace-nowrap text-xs sm:text-sm font-semibold"
          >
            {/* 1. Banking Pill */}
            <Link
              to="/banking"
              className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                isAboutActive
                  ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                  : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
              }`}
            >
              Banking
            </Link>

            {/* 2. Aptitude Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setActiveDropdown('aptitude')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/aptitude"
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isAptitudeActive || activeDropdown === 'aptitude'
                    ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                }`}
              >
                <span>Aptitude</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'aptitude' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-[500px] sm:w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[100] flex gap-4 text-slate-800"
                  >
                    <div className="w-44 border-r border-slate-100 pr-3 space-y-1 shrink-0">
                      {BANKING_MENU_DROPDOWNS.aptitude.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => setSelectedSubCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            (selectedSubCategory || 'di') === cat.id
                              ? 'bg-blue-50 text-brand-blue'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2 p-1">
                      {BANKING_MENU_DROPDOWNS.aptitude.categories
                        .find((c) => c.id === (selectedSubCategory || 'di'))
                        ?.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to="/aptitude"
                            onClick={() => setActiveDropdown(null)}
                            className="p-2 rounded-xl border border-slate-100 hover:border-brand-blue/30 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-brand-blue shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-blue transition-colors">
                              {item}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Reasoning Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setActiveDropdown('reasoning')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/reasoning"
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isReasoningActive || activeDropdown === 'reasoning'
                    ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                }`}
              >
                <span>Reasoning</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'reasoning' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-[500px] sm:w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[100] flex gap-4 text-slate-800"
                  >
                    <div className="w-44 border-r border-slate-100 pr-3 space-y-1 shrink-0">
                      {BANKING_MENU_DROPDOWNS.reasoning.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => setSelectedSubCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            (selectedSubCategory || 'puzzles') === cat.id
                              ? 'bg-blue-50 text-brand-blue'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2 p-1">
                      {BANKING_MENU_DROPDOWNS.reasoning.categories
                        .find((c) => c.id === (selectedSubCategory || 'puzzles'))
                        ?.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to="/reasoning"
                            onClick={() => setActiveDropdown(null)}
                            className="p-2 rounded-xl border border-slate-100 hover:border-brand-blue/30 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-brand-blue shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-blue transition-colors">
                              {item}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 4. English Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setActiveDropdown('english')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/english"
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isEnglishActive || activeDropdown === 'english'
                    ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                }`}
              >
                <span>English</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'english' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-[500px] sm:w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[100] flex gap-4 text-slate-800"
                  >
                    <div className="w-44 border-r border-slate-100 pr-3 space-y-1 shrink-0">
                      {BANKING_MENU_DROPDOWNS.english.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => setSelectedSubCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            (selectedSubCategory || 'grammar') === cat.id
                              ? 'bg-blue-50 text-brand-blue'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2 p-1">
                      {BANKING_MENU_DROPDOWNS.english.categories
                        .find((c) => c.id === (selectedSubCategory || 'grammar'))
                        ?.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to="/english"
                            onClick={() => setActiveDropdown(null)}
                            className="p-2 rounded-xl border border-slate-100 hover:border-brand-blue/30 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-brand-blue shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-blue transition-colors">
                              {item}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Banking Awareness Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setActiveDropdown('bankingAwareness')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/banking-awareness"
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isBankingAwarenessActive || activeDropdown === 'bankingAwareness'
                    ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                }`}
              >
                <span>Banking Awareness</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'bankingAwareness' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-[500px] sm:w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[100] flex gap-4 text-slate-800"
                  >
                    <div className="w-44 border-r border-slate-100 pr-3 space-y-1 shrink-0">
                      {BANKING_MENU_DROPDOWNS.bankingAwareness.categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onMouseEnter={() => setSelectedSubCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                            (selectedSubCategory || 'financial') === cat.id
                              ? 'bg-blue-50 text-brand-blue'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{cat.name}</span>
                          <FiChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                    <div className="flex-1 grid grid-cols-1 gap-2 p-1">
                      {BANKING_MENU_DROPDOWNS.bankingAwareness.categories
                        .find((c) => c.id === (selectedSubCategory || 'financial'))
                        ?.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to="/banking-awareness"
                            onClick={() => setActiveDropdown(null)}
                            className="p-2 rounded-xl border border-slate-100 hover:border-brand-blue/30 hover:bg-blue-50/50 transition-all cursor-pointer group flex items-center gap-2"
                          >
                            <div className="w-2 h-2 rounded-full bg-brand-blue shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="text-xs font-semibold text-slate-700 group-hover:text-brand-blue transition-colors">
                              {item}
                            </span>
                          </Link>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 6. Affairs Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setActiveDropdown('affairs')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/current-affairs"
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isAffairsActive || activeDropdown === 'affairs'
                    ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                }`}
              >
                <span>Affairs</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'affairs' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[100] text-slate-800"
                  >
                    {BANKING_MENU_DROPDOWNS.affairs.items.map((item, idx) => (
                      <Link
                        key={idx}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className="block px-4 py-2.5 hover:bg-blue-50/60 transition-colors cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors">{item.title}</p>
                        <p className="text-[11px] text-slate-500 font-normal">{item.desc}</p>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 7. Mock Exam Dropdown */}
            <div
              className="relative shrink-0"
              onMouseEnter={() => setActiveDropdown('mockExam')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <Link
                to="/mock-exam"
                className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md transition-all cursor-pointer ${
                  isMockExamActive || activeDropdown === 'mockExam'
                    ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                    : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                }`}
              >
                <span>Mock Exam</span>
              </Link>

              <AnimatePresence>
                {activeDropdown === 'mockExam' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-[100] text-slate-800"
                  >
                    {BANKING_MENU_DROPDOWNS.mockExam.items.map((item, idx) => (
                      <Link
                        key={idx}
                        to="/mock-exam"
                        onClick={() => setActiveDropdown(null)}
                        className="block px-4 py-2.5 hover:bg-blue-50/60 transition-colors cursor-pointer group"
                      >
                        <p className="text-xs font-bold text-slate-800 group-hover:text-brand-blue transition-colors">{item.title}</p>
                        <p className="text-[11px] text-slate-500 font-normal">{item.desc}</p>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-b border-slate-200 overflow-hidden px-4 py-4 space-y-3"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal && onOpenLoginModal('general', 'Log In');
                }}
                className="flex-1 py-2 bg-blue-50 text-brand-blue font-bold text-xs rounded-xl text-center"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLoginModal && onOpenLoginModal('general', 'Sign Up');
                }}
                className="flex-1 py-2 bg-brand-blue text-white font-bold text-xs rounded-xl text-center"
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-1 text-sm font-semibold">
              <Link
                to="/banking"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isAboutActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                Banking
              </Link>
              <Link
                to="/aptitude"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isAptitudeActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                Aptitude
              </Link>
              <Link
                to="/reasoning"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isReasoningActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                Reasoning
              </Link>
              <Link
                to="/english"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isEnglishActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                English
              </Link>
              <Link
                to="/banking-awareness"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isBankingAwarenessActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                Banking Awareness
              </Link>
              <Link
                to="/current-affairs"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isAffairsActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                Affairs
              </Link>
              <Link
                to="/mock-exam"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg ${isMockExamActive ? 'bg-brand-blue text-white' : 'text-slate-700'}`}
              >
                Mock Exam
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
