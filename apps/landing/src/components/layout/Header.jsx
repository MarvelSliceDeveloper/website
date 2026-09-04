import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import NavDropdown, { MobileNav } from './NavDropdown';
import { useSiteSettings } from '../../hooks/useSupabase';

export const topNav = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Software Learning' },
  {
    label: 'Competitive Exam',
    children: [
      {
        label: 'Banking',
        children: [
          { label: 'About Banking', path: '/banking' },
          { label: 'Aptitude', path: '/aptitude' },
          { label: 'Reasoning', path: '/reasoning' },
          { label: 'English', path: '/english' },
          { label: 'Banking Awareness', path: '/banking-awareness' },
          {
            label: 'Affairs',
            children: [
              { label: 'Current Affairs', path: '/current-affairs' },
              { label: "Today's Affairs", path: '/todays-affairs' },
            ],
          },
          { label: 'Mock Exam', path: '/mock-exam' },
        ],
      },
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
      { label: "Today's Affairs", path: '/todays-affairs' },
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
    <div className="bg-blue-50/90 border-t border-b border-blue-100/80 shadow-xs relative z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          role="menubar"
          className="flex items-center justify-start lg:justify-center gap-1 sm:gap-2.5 py-1.5 overflow-x-auto lg:overflow-visible no-scrollbar whitespace-nowrap text-xs sm:text-sm font-semibold"
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
              <FiChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  affairsOpen ? 'rotate-180' : ''
                }`}
              />
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
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();

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
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={`bg-white transition-all duration-300 ${
        scrolled
          ? 'shadow-[0_12px_30px_rgba(0,0,0,0.14)] border-b border-gray-100'
          : 'shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[60px] lg:h-[68px]">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          {settings?.logo_url && (
            <img src={settings.logo_url} alt="Marvel Slice" className="h-10 lg:h-14 w-auto object-contain" />
          )}
          <span className="text-xl lg:text-2xl font-extrabold text-brand-blue">
            Marvel <span className="text-brand-orange">Slice</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center">
          <NavDropdown items={topNav} currentPath={pathname} />
        </div>

        <button
          className="lg:hidden p-2.5 -mr-2 text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <FiX className="w-6 h-6" />
          ) : (
            <FiMenu className="w-6 h-6" />
          )}
        </button>
      </div>

      {pathname === '/bankingv2' && <SubHeaderMenu currentPath={pathname} />}

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute right-4 sm:right-6 top-full mt-2 w-64 sm:w-72 bg-white rounded-2xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.16)] lg:hidden z-50 max-h-[calc(100vh-80px)] overflow-y-auto overscroll-contain"
          >
            <MobileNav
              items={topNav}
              currentPath={pathname}
              onItemClick={() => setMobileOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

