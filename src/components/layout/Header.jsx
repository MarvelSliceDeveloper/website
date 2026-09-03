import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
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

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();

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
    <header className="bg-white sticky top-0 z-50" style={{ boxShadow: '0 15px 35px rgba(0, 0, 0, 0.15)' }}>
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
