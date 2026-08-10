import { FiMail, FiPhone } from 'react-icons/fi';
import { FaTwitter, FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackCtaClick } from '../../lib/analytics';

export default function TopBar() {
  const { data: settings } = useSiteSettings();

  const email = settings?.contact_email || '';
  const phone = settings?.contact_phone || '';
  const social = settings?.social_links || {};

  return (
    <div className="bg-brand-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-[10px]">
        <div className="flex items-center gap-3">
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1 text-xs lg:text-sm hover:underline"
            >
              <FiMail className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{email}</span>
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-1 text-xs lg:text-sm hover:underline"
            >
              <FiPhone className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{phone}</span>
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <a href="#" className="hover:underline" onClick={() => trackCtaClick('Login', 'topbar')}>Login</a>
          <span className="text-white/40">|</span>
          <a href="#" className="hover:underline font-semibold" onClick={() => trackCtaClick('Sign Up', 'topbar')}>SIGN UP</a>
          <span className="text-white/40">|</span>
          <div className="flex items-center gap-2">
            <a href={social.twitter || '#'} aria-label="Twitter"><FaTwitter className="w-3 h-3 hover:text-brand-orange transition-colors" /></a>
            <a href={social.facebook || '#'} aria-label="Facebook"><FaFacebookF className="w-3 h-3 hover:text-brand-orange transition-colors" /></a>
            <a href={social.instagram || '#'} aria-label="Instagram"><FaInstagram className="w-3 h-3 hover:text-brand-orange transition-colors" /></a>
            <a href={social.linkedin || '#'} aria-label="LinkedIn"><FaLinkedinIn className="w-3 h-3 hover:text-brand-orange transition-colors" /></a>
          </div>
        </div>
      </div>
    </div>
  );
}
