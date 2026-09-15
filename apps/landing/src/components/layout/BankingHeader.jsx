import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiX, FiChevronDown, FiChevronRight, FiMail, FiPhone, FiDollarSign, FiBook, FiUser, FiAward, FiLayers, FiHelpCircle, FiCheckSquare } from 'react-icons/fi';
import { FaLinkedinIn, FaYoutube } from 'react-icons/fa';
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
      { title: 'IBPS PO Prelims Full Mock', path: '/mock-exam', desc: '100 Questions Timed Simulation' },
      { title: 'IBPS Clerk Speed Test', path: '/mock-exam', desc: 'Sectional Speed Booster Test' },
      { title: 'RRB Officer Scale I Practice', path: '/mock-exam', desc: 'Prelims & Mains Model Test' },
      { title: 'Specialist Officer Test Series', path: '/mock-exam', desc: 'Domain Knowledge Mocks' }
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState(null);
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

  const isV2Context = pathname.startsWith('/bankingv2');
  const basePrefix = isV2Context ? '/bankingv2' : '/banking';

  const isBankingActive = pathname === '/banking' || pathname === '/bankingv2';
  const isAptitudeActive = pathname.includes('/aptitude');
  const isReasoningActive = pathname.includes('/reasoning');
  const isEnglishActive = pathname.includes('/english');
  const isBankingAwarenessActive = pathname.includes('/banking-awareness');
  const isAffairsActive = pathname.includes('/current-affairs') || pathname.includes('/todays-affairs') || pathname.includes('/affairs');
  const isMockExamActive = pathname.includes('/mock-exam');

  const showV2Menus = isV2Context || isAptitudeActive || isReasoningActive || isEnglishActive || isBankingAwarenessActive || isAffairsActive || isMockExamActive;

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

          {/* Mobile Hamburger Menu Button */}
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
            className="flex items-center justify-start gap-1 sm:gap-2 py-1.5 overflow-x-auto no-scrollbar whitespace-nowrap text-xs sm:text-sm font-semibold"
          >
            {/* 1. Banking Pill */}
            <Link
              to="/banking"
              className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                isBankingActive
                  ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                  : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
              }`}
            >
              Banking
            </Link>

            {showV2Menus && (
              <>
                {/* 3. Aptitude Link */}
                <Link
                  to={`${basePrefix}/aptitude`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                    isAptitudeActive
                      ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                  }`}
                >
                  Aptitude
                </Link>

                {/* 4. Reasoning Link */}
                <Link
                  to={`${basePrefix}/reasoning`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                    isReasoningActive
                      ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                  }`}
                >
                  Reasoning
                </Link>

                {/* 5. English Link */}
                <Link
                  to={`${basePrefix}/english`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                    isEnglishActive
                      ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                  }`}
                >
                  English
                </Link>

                {/* 6. Banking Awareness Link */}
                <Link
                  to={`${basePrefix}/banking-awareness`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                    isBankingAwarenessActive
                      ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                  }`}
                >
                  Banking Awareness
                </Link>

                {/* 7. Affairs Link */}
                <Link
                  to={`${basePrefix}/current-affairs`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                    isAffairsActive
                      ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                  }`}
                >
                  Affairs
                </Link>

                {/* 8. Mock Exam Link */}
                <Link
                  to={`${basePrefix}/mock-exam`}
                  className={`shrink-0 px-3.5 py-1.5 rounded-md transition-all ${
                    isMockExamActive
                      ? 'bg-brand-blue text-white font-extrabold shadow-xs'
                      : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
                  }`}
                >
                  Mock Exam
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[99] sm:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-[100] w-[85vw] max-w-sm sm:hidden bg-slate-50 shadow-2xl flex flex-col overflow-hidden border-l border-slate-200"
            >
              <div className="relative z-10 flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0 bg-white min-h-[60px]">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5"
                >
                  {settings?.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt="Marvel Slice Logo"
                      className="h-10 w-auto object-contain shrink-0"
                    />
                  )}
                  <span className="text-xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
                    Marvel <span className="text-brand-orange">Slice</span>
                  </span>
                </Link>
              </div>

              {/* Navigation Items in Mobile Drawer */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-slate-50">
                <Link
                  to="/banking"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isBankingActive
                      ? 'bg-blue-50 text-brand-blue font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-blue-50/60'
                  }`}
                >
                  <FiDollarSign className="w-4.5 h-4.5 text-brand-blue" />
                  <span>Banking</span>
                </Link>



                {showV2Menus && Object.entries(BANKING_MENU_DROPDOWNS).map(([key, menu]) => {
                  const isExpanded = expandedMobileMenu === key;
                  return (
                    <div key={key} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setExpandedMobileMenu(isExpanded ? null : key)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-blue-50/60 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <FiBook className="w-4.5 h-4.5 text-slate-400" />
                          <span>{menu.label}</span>
                        </div>
                        <FiChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="pl-9 pr-3 py-1 space-y-1.5 border-l-2 border-slate-200 ml-5">
                          {menu.categories ? (
                            menu.categories.map((cat) => (
                              <div key={cat.id} className="space-y-1">
                                <p className="text-[11px] font-bold text-brand-blue uppercase">{cat.name}</p>
                                <ul className="space-y-1 pl-2 text-xs text-slate-600">
                                  {cat.items.map((item, idx) => (
                                    <li key={idx}>
                                      <Link
                                        to={menu.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block py-1 hover:text-brand-orange"
                                      >
                                        {item}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          ) : (
                            menu.items.map((item, idx) => (
                              <Link
                                key={idx}
                                to={item.path || menu.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className="block py-1 text-xs text-slate-700 hover:text-brand-orange font-medium"
                              >
                                {item.title}
                              </Link>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-200 bg-white shrink-0 flex justify-start">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onOpenLoginModal) onOpenLoginModal('general', 'Log In');
                  }}
                  className="py-2 px-4 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-2 cursor-pointer"
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
