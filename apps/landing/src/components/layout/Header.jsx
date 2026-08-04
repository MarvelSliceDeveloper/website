import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import NavDropdown, { MobileNav } from './NavDropdown';
import { useSiteSettings } from '../../hooks/useSupabase';

export const topNav = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Software Learning' },
  { label: 'Competitive Exam' },
  { label: 'Services', path: '/services' },
  { label: 'Training', path: '/training' },
  { label: 'Career', path: '/career' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { data: settings } = useSiteSettings();

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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-100 lg:hidden"
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
