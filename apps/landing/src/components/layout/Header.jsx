import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown, FiChevronRight, FiLogIn, FiSettings, FiUser, FiMoreVertical, FiAward } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import NavDropdown, { MobileNav } from './NavDropdown';
import { useSiteSettings } from '../../hooks/useSupabase';
import AnimatedHamburgerIcon from '../ui/AnimatedHamburgerIcon';

export const topNav = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Software Learning' },
  {
    label: 'Competitive Exam',
    children: [
      { label: 'Banking', path: '/banking' },
    ],
  },
  { label: 'Services', path: '/services' },
  { label: 'Career', path: '/career' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

const subNavItems = [
  { label: 'Aptitude', path: '/aptitude' },
  { label: 'Reasoning', path: '/reasoning' },
  { label: 'English', path: '/english' },
  { label: 'Banking Awareness', path: '/banking-awareness' },
  {
    label: 'Affairs',
    path: '/current-affairs',
    children: [
      { label: 'Current Affairs', path: '/current-affairs' },
      { label: "Today's Affairs", path: '/current-affairs?filter=today' },
    ],
  },
  { label: 'Mock Exam', path: '/mock-exam' },
];

function SubHeaderMenu({ currentPath, onItemClick }) {
  const [affairsOpen, setAffairsOpen] = useState(false);
  const affairsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (affairsRef.current && !affairsRef.current.contains(e.target)) {
        setAffairsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAffairsActive = currentPath === '/current-affairs' || currentPath === '/todays-affairs';

  return (
    <div className="hidden sm:block bg-blue-50/90 border-t border-b border-blue-100/80 shadow-xs relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          role="menubar"
          className="flex items-center justify-start gap-1 sm:gap-2.5 py-1.5 overflow-x-auto lg:overflow-visible no-scrollbar whitespace-nowrap text-xs sm:text-sm font-semibold"
        >
          <Link
            to="/aptitude"
            onClick={onItemClick}
            className={`shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              currentPath === '/aptitude'
                ? 'bg-brand-blue text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
            }`}
          >
            Aptitude
          </Link>

          <Link
            to="/reasoning"
            onClick={onItemClick}
            className={`shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              currentPath === '/reasoning'
                ? 'bg-brand-blue text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
            }`}
          >
            Reasoning
          </Link>

          <Link
            to="/english"
            onClick={onItemClick}
            className={`shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              currentPath === '/english'
                ? 'bg-brand-blue text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
            }`}
          >
            English
          </Link>

          <Link
            to="/banking-awareness"
            onClick={onItemClick}
            className={`shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              currentPath === '/banking-awareness'
                ? 'bg-brand-blue text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
            }`}
          >
            Banking Awareness
          </Link>

          <div
            ref={affairsRef}
            className="relative shrink-0"
            onMouseEnter={() => setAffairsOpen(true)}
            onMouseLeave={() => setAffairsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setAffairsOpen((prev) => !prev)}
              aria-expanded={affairsOpen}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                isAffairsActive || affairsOpen
                  ? 'bg-brand-blue text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
              }`}
            >
              <span>Affairs</span>
            </button>

            <AnimatePresence>
              {affairsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[90] lg:hidden"
                    onClick={() => setAffairsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="fixed lg:absolute left-4 lg:left-0 right-4 lg:right-auto top-[98px] lg:top-full mt-1 lg:mt-1.5 w-auto lg:w-48 bg-white rounded-xl shadow-xl border border-blue-100 py-1.5 z-[100] text-left"
                  >
                    <Link
                      to="/current-affairs"
                      onClick={() => {
                        setAffairsOpen(false);
                        if (onItemClick) onItemClick();
                      }}
                      className={`block px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                        currentPath === '/current-affairs'
                          ? 'bg-blue-50 text-brand-blue font-bold border-l-4 border-brand-blue'
                          : 'text-slate-700 hover:bg-blue-50/60 hover:text-brand-blue'
                      }`}
                    >
                      Current Affairs
                    </Link>

                    <Link
                      to="/todays-affairs"
                      onClick={() => {
                        setAffairsOpen(false);
                        if (onItemClick) onItemClick();
                      }}
                      className={`block px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                        currentPath === '/todays-affairs'
                          ? 'bg-blue-50 text-brand-blue font-bold border-l-4 border-brand-blue'
                          : 'text-slate-700 hover:bg-blue-50/60 hover:text-brand-blue'
                      }`}
                    >
                      Today's Affairs
                    </Link>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <Link
            to="/mock-exam"
            onClick={onItemClick}
            className={`shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              currentPath === '/mock-exam'
                ? 'bg-brand-blue text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
            }`}
          >
            Mock Exam
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();
  const mobileMenuRef = useRef(null);
  const hamburgerBtnRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        mobileOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        hamburgerBtnRef.current &&
        !hamburgerBtnRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
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
  }, [mobileOpen]);

  const isBankingPage = [
    '/banking',
    '/bankingv2',
    '/aptitude',
    '/reasoning',
    '/english',
    '/banking-awareness',
    '/current-affairs',
    '/todays-affairs',
    '/mock-exam'
  ].some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <header className="bg-white border-b border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt="Marvel Slice Logo"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          )}
          <span className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
            Marvel <span className="text-brand-orange">Slice</span>
          </span>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center">
          <NavDropdown items={topNav} currentPath={pathname} />
        </div>

        {/* Mobile Hamburger Toggle Button - Animated 3 lines morphing to X with spring animation */}
        <motion.button
          type="button"
          ref={hamburgerBtnRef}
          className="lg:hidden p-2 text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer z-[101] flex items-center justify-center relative"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: mobileOpen ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <AnimatedHamburgerIcon isOpen={mobileOpen} className="w-6 h-6 text-slate-800" />
        </motion.button>
      </div>

      {isBankingPage && <SubHeaderMenu currentPath={pathname} />}

      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Modern Glassmorphic Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[99] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Modern 80% Slide-Over Drawer Panel */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 right-0 z-[100] w-[80vw] sm:w-80 bg-gray-100 shadow-2xl flex flex-col lg:hidden rounded-none overflow-hidden overflow-x-hidden border-l border-gray-200 will-change-transform transform-gpu"
            >
              {/* Header - White Header */}
              <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-gray-200 shrink-0 bg-white min-h-[60px]">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  {settings?.logo_url && (
                    <img
                      src={settings.logo_url}
                      alt="Marvel Slice Logo"
                      className="h-10 sm:h-11 w-auto object-contain shrink-0"
                    />
                  )}
                  <span className="text-[clamp(15px,4vw,19px)] font-black text-brand-blue tracking-tight font-['Roboto',sans-serif] shrink-0">
                    Marvel <span className="text-brand-orange">Slice</span>
                  </span>
                </Link>

                {/* Reserved space for z-[101] animated toggle button */}
                <div className="w-9 h-9 shrink-0" />
              </div>

              {/* Navigation Links List - Grey Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 bg-gray-100">
                <MobileNav
                  items={topNav}
                  currentPath={pathname}
                  onItemClick={() => setMobileOpen(false)}
                />
              </div>

              {/* Bottom Action Footer - Single Blue Log In Button Aligned Left */}
              <div className="p-4 border-t border-gray-200 mt-auto shrink-0 bg-white flex justify-start">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-extrabold text-xs sm:text-sm rounded-xl text-center shadow-md shadow-brand-blue/20 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <FiLogIn className="w-4 h-4 text-white" />
                  <span>Log In</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

