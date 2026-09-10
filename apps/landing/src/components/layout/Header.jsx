import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown, FiChevronRight, FiSettings, FiUser, FiMoreVertical, FiAward } from 'react-icons/fi';
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
  const isBankingActive = currentPath === '/banking' || currentPath === '/bankingv2';

  return (
    <div className="hidden sm:block bg-blue-50/90 border-t border-b border-blue-100/80 shadow-xs relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          role="menubar"
          className="flex items-center justify-start gap-1 sm:gap-2.5 py-1.5 overflow-x-auto lg:overflow-visible no-scrollbar whitespace-nowrap text-xs sm:text-sm font-semibold"
        >
          <Link
            to="/banking"
            onClick={onItemClick}
            className={`shrink-0 px-3 py-1.5 rounded-md transition-colors ${
              isBankingActive
                ? 'bg-brand-blue text-white font-bold shadow-xs'
                : 'text-slate-700 hover:text-brand-blue hover:bg-blue-100/70 font-semibold'
            }`}
          >
            Banking
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default function Header({ onOpenLoginModal }) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[60px] flex items-center justify-between py-1 lg:py-0">
        <Link to="/" className="flex items-center gap-2.5">
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

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center">
          <NavDropdown items={topNav} currentPath={pathname} />
        </div>

        {/* Mobile Hamburger Toggle Button - Animated 3 lines morphing to X with spring animation */}
        <motion.button
          type="button"
          ref={hamburgerBtnRef}
          className="lg:hidden p-1 text-gray-900 hover:text-brand-blue transition-colors cursor-pointer z-[101] flex items-center justify-center relative"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: mobileOpen ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <AnimatedHamburgerIcon isOpen={mobileOpen} className="w-[26px] h-[26px] text-slate-800" />
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
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
              className="fixed inset-y-0 right-0 z-[100] w-[80vw] sm:w-80 bg-slate-50 shadow-2xl flex flex-col lg:hidden rounded-none overflow-hidden overflow-x-hidden border-l border-slate-200/80 will-change-transform transform-gpu"
            >
              {/* Header - White Header */}
              <div className="relative z-10 flex items-center justify-between px-4 py-2 sm:px-5 sm:py-2.5 border-b border-slate-200/80 shrink-0 bg-white min-h-[64px] shadow-[0_3px_14px_rgba(148,163,184,0.4)]">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
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
                <div className="w-9 h-9 shrink-0" />
              </div>

              {/* Navigation Links List - Grey Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-3 bg-slate-50">
                <MobileNav
                  items={topNav}
                  currentPath={pathname}
                  onItemClick={() => setMobileOpen(false)}
                />
              </div>

              {/* Drawer Footer - Left-Aligned Log In Brand Button with Slightly Darker Shadow */}
              <div className="relative z-10 p-4 border-t border-slate-200/80 bg-white shrink-0 flex justify-start shadow-[0_-3px_14px_rgba(148,163,184,0.4)]">
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
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

