import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiChevronDown, FiChevronRight, FiMail, FiPhone, FiMenu, FiDollarSign, FiBarChart2, FiCpu, FiBook, FiShield, FiClock, FiCheckSquare, FiSettings, FiUser, FiMoreVertical, FiAward } from 'react-icons/fi';
import { FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackSocialClick } from '../../lib/analytics';
import AnimatedHamburgerIcon from '../ui/AnimatedHamburgerIcon';

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
  const [theme, setTheme] = useState('light');
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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('sidebar-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('sidebar-open');
    };
  }, [mobileMenuOpen]);

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
              <span>{settings?.contact_phone ? settings.contact_phone.replace(/\s*\/\s*/g, ' | ') : '+91 63809 57390 | +91 80882 18609'}</span>
            </div>
          </div>

          {/* Right Social Links */}
          <div className="flex items-center gap-2">
            {social.youtube && (
              <a
                href={social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('youtube', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white border border-white shadow-xs flex items-center justify-center transition-transform hover:scale-110"
                aria-label="YouTube"
              >
                <FaYoutube className="w-3.5 h-3.5 text-[#FF0000]" />
              </a>
            )}
            {social.linkedin && (
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('linkedin', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white border border-white shadow-xs flex items-center justify-center transition-transform hover:scale-110"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn className="w-3.5 h-3.5 text-[#0A66C2]" />
              </a>
            )}
            {social.instagram && (
              <a
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSocialClick('instagram', 'banking_header')}
                className="w-6 h-6 rounded-full bg-white border border-white shadow-xs flex items-center justify-center transition-transform hover:scale-110"
                aria-label="Instagram"
              >
                <FaInstagram className="w-3.5 h-3.5 text-[#E4405F]" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* TIER 2: MAIN WHITE LOGO + SEARCH + LOG IN / SIGN UP BAR */}
      <div className="bg-white py-1 sm:py-1.5 lg:py-3 px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            {settings?.logo_url && (
              <img
                src={settings.logo_url}
                alt="Marvel Slice Logo"
                className="h-14 sm:h-16 lg:h-10 w-auto object-contain"
              />
            )}
            <span className="text-[22px] sm:text-[26px] font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
              Marvel <span className="text-brand-orange">Slice</span>
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

          {/* Mobile Hamburger Menu Button - Animated 3 lines morphing to X with spring animation */}
          <motion.button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1 text-slate-700 hover:text-brand-blue transition-colors cursor-pointer flex items-center justify-center z-[101] relative"
            aria-label="Toggle menu"
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          >
            <AnimatedHamburgerIcon isOpen={mobileMenuOpen} className="w-[26px] h-[26px] text-slate-800" />
          </motion.button>
        </div>
      </div>

      {/* TIER 3: SUB-HEADER NAVIGATION BAR */}
      <div className="hidden sm:block bg-blue-50/90 border-b border-blue-100/80 shadow-xs relative" ref={dropdownRef}>
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
          </nav>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[99] sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Modern 80% Slide-Over Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-[100] w-[80vw] sm:hidden bg-slate-50 shadow-2xl flex flex-col rounded-none overflow-hidden overflow-x-hidden border-l border-slate-200/80 will-change-transform transform-gpu"
            >
              {/* Header - White Header */}
              <div className="relative z-10 flex items-center justify-between px-4 py-2 sm:px-5 sm:py-2.5 border-b border-slate-200/80 shrink-0 bg-white min-h-[64px] shadow-[0_3px_14px_rgba(148,163,184,0.4)]">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 min-w-0"
                >
                  {settings?.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt="Marvel Slice Logo"
                      className="h-14 sm:h-16 w-auto object-contain shrink-0"
                    />
                  )}
                  <span className="text-[clamp(20px,4.5vw,24px)] font-black text-brand-blue tracking-tight font-['Roboto',sans-serif] shrink-0">
                    Marvel <span className="text-brand-orange">Slice</span>
                  </span>
                </Link>

                {/* Reserved space for z-[101] animated toggle button */}
                <div className="w-8 h-8 shrink-0" />
              </div>

              {/* Navigation Items - Grey Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 space-y-1 bg-slate-50">
                <Link
                  to="/banking"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[clamp(13px,3.6vw,15px)] font-semibold transition-all ${
                    isAboutActive
                      ? 'bg-blue-50 text-brand-blue font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-blue-50/60 hover:text-brand-blue'
                  }`}
                >
                  <FiDollarSign className={`w-4.5 h-4.5 shrink-0 ${isAboutActive ? 'text-brand-blue' : 'text-slate-400'}`} />
                  <span>Banking</span>
                </Link>
              </div>

              {/* Drawer Footer - Left-Aligned Log In Brand Button with Slightly Darker Shadow */}
              <div className="relative z-10 p-4 border-t border-slate-200/80 bg-white shrink-0 flex justify-start shadow-[0_-3px_14px_rgba(148,163,184,0.4)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenLoginModal) onOpenLoginModal('general', 'Log In');
                  }}
                  className="py-2 px-4 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <FiUser className="w-4 h-4 text-white" />
                  <span>Log In</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
