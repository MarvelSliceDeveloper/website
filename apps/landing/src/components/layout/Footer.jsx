import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUp, FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';
import { FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useSiteSettings } from '../../hooks/useSupabase';
import { topNav } from './Header';
import { useNavChildren } from '../../hooks/useSupabase';
import { extractPhoneNumbers, cleanTelHref } from '../../lib/phoneUtils';
import { trackPhoneClick, trackEmailClick, trackSocialClick } from '../../lib/analytics';

function formatFooterLabel(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str.replace(/(?:\s+[vV]|\s*[∨▼🔻])\s*$/g, '').trim();
}

function NavColumn({ parentLabel, defaultChildren }) {
  const { data: children } = useNavChildren(parentLabel);
  const items = (children && children.length > 0)
    ? [...children]
    : (defaultChildren ? [...defaultChildren] : []);

  if (parentLabel === 'Competitive Exam') {
    const ceDefaults = [
      { label: 'Banking', path: '/banking' }
    ];
    return (
      <div className="text-center sm:text-left shrink-0">
        <h4 className="text-[15px] sm:text-base font-medium uppercase tracking-wider mb-3 text-white whitespace-nowrap">
          {formatFooterLabel(parentLabel)}
        </h4>
        <ul className="space-y-2 text-center sm:text-left">
          {ceDefaults.map((child, i) => (
            <li key={i}>
              <Link to={child.path || '#'}
                className="text-sm sm:text-base text-gray-200 hover:text-brand-orange transition-colors py-1 inline-block">
                {formatFooterLabel(child.label)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (items.length === 0) return null;
  return (
    <div className="text-center sm:text-left shrink-0">
      <h4 className="text-[15px] sm:text-base font-medium uppercase tracking-wider mb-3 text-white whitespace-nowrap">
        {formatFooterLabel(parentLabel)}
      </h4>
      <ul className="space-y-2 text-center sm:text-left">
        {items.map((child, i) => (
          <li key={i}>
            <Link to={child.path || '#'}
              className="text-sm sm:text-base text-gray-200 hover:text-brand-orange transition-colors py-1 inline-block">
              {formatFooterLabel(child.label)}
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

  const phoneNumbers = extractPhoneNumbers(settings?.contact_phone || '+91 63809 57390, +91 80882 18609');
  const email = settings?.contact_email || '';
  const address = settings?.address || '';
  const hours = settings?.working_hours || {};
  const social = settings?.social_links || {};

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-12 xl:gap-16">
          {/* Logo & Contact Info Section */}
          <div className="w-full lg:w-[260px] xl:w-[290px] shrink-0 sm:pb-6 sm:border-b sm:border-white/10 lg:border-b-0 lg:pb-0 text-center sm:text-left flex flex-col items-center sm:items-start">
            <div className="flex justify-center sm:justify-start mb-4 -mt-1 sm:-mt-3">
              <Link to="/" aria-label="Go to Homepage" className="flex flex-col items-center sm:items-start justify-center sm:justify-start gap-2 sm:gap-2.5 group">
                {settings?.logo_url && (
                  <img src={settings.logo_url} alt="Marvel Slice Logo" className="h-24 sm:h-32 lg:h-36 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105" />
                )}
              </Link>
            </div>
            <div className="space-y-3.5 text-sm sm:text-base text-gray-200 text-center sm:text-left flex flex-col items-center sm:items-start w-full">
              {address && (
                <div className="flex items-start justify-center sm:justify-start gap-2.5 text-center sm:text-left">
                  <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-brand-orange mt-0.5" />
                  <span className="leading-snug">{address}</span>
                </div>
              )}
              {phoneNumbers.length > 0 && (
                <div className="space-y-3 text-center sm:text-left w-full">
                  {phoneNumbers.map((num, i) => {
                    const label = i === 0 ? 'Competitive Exam Enquiry' : i === 1 ? 'Software Enquiry' : 'Enquiry';
                    return (
                      <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                        <h5 className="font-medium text-white uppercase tracking-wider text-xs sm:text-sm mb-1">
                          {label}
                        </h5>
                        <div className="inline-flex items-center gap-2 mt-0.5">
                          <FiPhone className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-white" />
                          <a
                            href={cleanTelHref(num)}
                            onClick={() => trackPhoneClick(num, 'footer')}
                            className="text-brand-orange font-normal hover:underline transition-colors text-sm sm:text-base inline-block"
                          >
                            {num}
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {email && (
                <div className="flex items-center justify-center sm:justify-start gap-2.5 hover:text-brand-orange transition-colors text-center sm:text-left">
                  <FiMail className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-brand-orange" />
                  <a 
                    href={`mailto:${email}`}
                    onClick={() => trackEmailClick(email, 'footer')}
                    className="leading-snug hover:text-brand-orange transition-colors"
                  >
                    {email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Navigation Columns with evenly balanced spacing */}
          <div className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:justify-between gap-y-8 sm:gap-y-10 gap-x-6 sm:gap-x-12 lg:gap-x-6 items-start">
            {/* Quick Links Column */}
            <div className="text-center sm:text-left shrink-0">
              <h4 className="text-[15px] sm:text-base font-medium uppercase tracking-wider mb-3 text-white whitespace-nowrap">Quick Links</h4>
              <ul className="space-y-2 text-center sm:text-left">
                {linkItems.map((item, i) => (
                  <li key={i}>
                    <Link to={item.path} className="text-sm sm:text-base text-gray-200 hover:text-brand-orange transition-colors py-1 inline-block">
                      {formatFooterLabel(item.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic Category Navigation Columns */}
            {columnItems.map((item) => (
              <NavColumn key={item.label} parentLabel={item.label} defaultChildren={item.children} />
            ))}

            {/* Working Hours & Social Links Column */}
            {(hours.weekday || hours.saturday) && (
              <div className="text-center sm:text-left flex flex-col items-center sm:items-start shrink-0">
                <h4 className="text-[15px] sm:text-base font-medium uppercase tracking-wider mb-3 text-white whitespace-nowrap">Working Hours</h4>
                <ul className="space-y-3 text-sm sm:text-base text-gray-200 text-center sm:text-left flex flex-col items-center sm:items-start">
                  {hours.weekday && (
                    <li className="text-center sm:text-left">
                      <p className="text-white font-medium inline-flex items-center gap-1.5 justify-center sm:justify-start">
                        <FiClock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-brand-orange" />
                        <span>Monday - Friday</span>
                      </p>
                      <p className="text-gray-200 mt-0.5">{hours.weekday}</p>
                    </li>
                  )}
                  {hours.saturday && (
                    <li className="text-center sm:text-left">
                      <p className="text-white font-medium inline-flex items-center gap-1.5 justify-center sm:justify-start">
                        <FiClock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-brand-orange" />
                        <span>Saturday</span>
                      </p>
                      <p className="text-gray-200 mt-0.5">{hours.saturday}</p>
                    </li>
                  )}
                </ul>
                <h4 className="text-[15px] sm:text-base font-medium uppercase tracking-wider mb-3 mt-6 text-white whitespace-nowrap">Social Links</h4>
                <div className="flex flex-wrap items-center gap-2.5 mt-3 justify-center sm:justify-start">
                  <a href={social.youtube || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('YouTube', social.youtube)} aria-label="YouTube" className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white border border-white shadow-xs shrink-0 aspect-square transition-all duration-300 hover:scale-110 hover:shadow-md hover:-translate-y-0.5"><FaYoutube className="w-4 h-4 text-[#FF0000]" /></a>
                  <a href={social.linkedin || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('LinkedIn', social.linkedin)} aria-label="LinkedIn" className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-white border border-white shadow-xs shrink-0 aspect-square transition-all duration-300 hover:scale-110 hover:shadow-md hover:-translate-y-0.5"><FaLinkedinIn className="w-4 h-4 text-[#0A66C2]" /></a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar: Stacked on Mobile, Flex on Desktop */}
      <div className="bg-brand-orange py-3.5 sm:py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-base text-white font-medium">
          <span className="text-center sm:text-left">&copy; Marvel Slice. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span className="text-white/60">|</span>
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
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
            className="fixed bottom-6 right-4 sm:right-6 bg-brand-blue text-white p-2.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 cursor-pointer"
            aria-label="Scroll to top"
          >
            <FiArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </footer>
  );
}
