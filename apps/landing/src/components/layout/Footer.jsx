import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUp, FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../hooks/useSupabase';
import { topNav } from './Header';
import { useNavChildren } from '../../hooks/useSupabase';

function NavColumn({ parentLabel }) {
  const { data: children } = useNavChildren(parentLabel);
  if (!children || children.length === 0) return null;
  return (
    <div className="lg:pt-10">
      <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-white/80">
        {parentLabel}
      </h4>
      <ul className="space-y-2">
        {children.map((child, i) => (
          <li key={i}>
            <Link to={child.path || '#'}
              className="text-sm text-gray-400 hover:text-brand-orange transition-colors">
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { data: settings } = useSiteSettings();

  const phone = settings?.contact_phone || '';
  const email = settings?.contact_email || '';
  const address = settings?.address || '';
  const hours = settings?.working_hours || {};

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const linkItems = topNav.filter((item) => item.path);
  const columnItems = topNav.filter((item) => !item.path);

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-8">
          <div className="lg:col-span-1">
            <div className="flex justify-center mb-3">
              {settings?.logo_url && (
                <img src={settings.logo_url} alt="Marvel Slice" className="h-[100px] w-auto object-contain" />
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              {address && (
                <p className="flex items-start gap-2">
                  <FiMapPin className="w-4 h-4 mt-0.5 shrink-0 text-brand-orange" />
                  <span>{address}</span>
                </p>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-brand-orange transition-colors">
                  <FiPhone className="w-4 h-4 shrink-0 text-brand-orange" />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-brand-orange transition-colors">
                  <FiMail className="w-4 h-4 shrink-0 text-brand-orange" />
                  <span>{email}</span>
                </a>
              )}
            </div>
          </div>

          <div className="lg:pt-10">
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-white/80">Quick Links</h4>
            <ul className="space-y-2">
              {linkItems.map((item, i) => (
                <li key={i}>
                  <Link to={item.path} className="text-sm text-gray-400 hover:text-brand-orange transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {columnItems.map((item) => (
            <NavColumn key={item.label} parentLabel={item.label} />
          ))}

          {(hours.weekday || hours.saturday) && (
            <div className="lg:pt-10">
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-white/80">Working Hours</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {hours.weekday && (
                  <li className="flex items-start gap-2">
                    <FiClock className="w-4 h-4 mt-0.5 shrink-0 text-brand-orange" />
                    <div>
                      <p className="text-white/80 font-medium">Monday - Friday</p>
                      <p>{hours.weekday}</p>
                    </div>
                  </li>
                )}
                {hours.saturday && (
                  <li className="flex items-start gap-2">
                    <FiClock className="w-4 h-4 mt-0.5 shrink-0 text-brand-orange" />
                    <div>
                      <p className="text-white/80 font-medium">Saturday</p>
                      <p>{hours.saturday}</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="bg-brand-orange py-[15px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1 text-xs sm:text-sm text-white">
          <span>&copy; Marvel Slice. All rights reserved.</span>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <span className="text-white/60">|</span>
            <a href="#" className="hover:underline">Terms of Service</a>
            <span className="text-white/60">|</span>
            <a href="#" className="hover:underline">Designed by Marvel Slice</a>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-0 bg-brand-blue text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 cursor-pointer"
            aria-label="Scroll to top"
          >
            <FiArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
