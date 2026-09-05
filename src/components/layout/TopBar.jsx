import { FiMail, FiPhone } from 'react-icons/fi';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackCtaClick, trackPhoneClick, trackEmailClick, trackSocialClick } from '../../lib/analytics';

import { extractPhoneNumbers, cleanTelHref } from '../../lib/phoneUtils';

export default function TopBar() {
  const { data: settings } = useSiteSettings();

  const email = settings?.contact_email || '';
  const phoneNumbers = extractPhoneNumbers(settings?.contact_phone || '+91 63809 57390, +91 80882 18609');
  const social = settings?.social_links || {};

  return (
    <div className="hidden lg:block bg-brand-blue text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          {email && (
            <a
              href={`mailto:${email}`}
              onClick={() => trackEmailClick(email, 'topbar')}
              className="flex items-center gap-1 text-xs lg:text-sm hover:underline"
            >
              <FiMail className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{email}</span>
            </a>
          )}
          {phoneNumbers.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs lg:text-sm">
              <FiPhone className="w-3 h-3 shrink-0 text-white/90" />
              {phoneNumbers.map((num, i) => (
                <span key={i} className="inline-flex items-center">
                  {i > 0 && <span className="text-white/60 mx-1.5 font-normal">/</span>}
                  <a
                    href={cleanTelHref(num)}
                    onClick={() => trackPhoneClick(num, 'topbar')}
                    className="hover:underline hover:text-amber-200 transition-colors"
                  >
                    {num}
                  </a>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs lg:text-sm font-medium">
          <a href="#" className="hover:underline transition-colors" onClick={() => trackCtaClick('Login', 'topbar')}>Login</a>
          <span className="text-white/40">|</span>
          <a href="#" className="hover:underline transition-colors" onClick={() => trackCtaClick('Sign Up', 'topbar')}>Sign Up</a>
          <span className="text-white/40">|</span>
          <div className="flex items-center gap-3 ml-2">
            <a href={social.twitter || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('Twitter', social.twitter)} aria-label="X (Twitter)" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaXTwitter className="w-2.5 h-2.5" />
            </a>
            <a href={social.facebook || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('Facebook', social.facebook)} aria-label="Facebook" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaFacebookF className="w-2.5 h-2.5" />
            </a>
            <a href={social.instagram || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('Instagram', social.instagram)} aria-label="Instagram" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaInstagram className="w-2.5 h-2.5" />
            </a>
            <a href={social.linkedin || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('LinkedIn', social.linkedin)} aria-label="LinkedIn" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaLinkedinIn className="w-2.5 h-2.5" />
            </a>
            <a href={social.youtube || '#'} target="_blank" rel="noopener noreferrer" onClick={() => trackSocialClick('YouTube', social.youtube)} aria-label="YouTube" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaYoutube className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
