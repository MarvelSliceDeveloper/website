import { FiMail, FiPhone } from 'react-icons/fi';
import { FaTwitter, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackCtaClick } from '../../lib/analytics';

export default function TopBar() {
  const { data: settings } = useSiteSettings();

  const email = settings?.contact_email || '';
  const phone = settings?.contact_phone || '';
  const social = settings?.social_links || {};

  return (
    <div className="bg-brand-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-2">
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
          {phone && phone.split(',').map(p => p.trim()).filter(Boolean).map((num, i) => (
            <a
              key={i}
              href={`tel:${num.replace(/\s+/g, '')}`}
              className="flex items-center gap-1 text-xs lg:text-sm hover:underline"
            >
              <FiPhone className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">{num}</span>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs lg:text-sm">
          <a href="#" className="hover:underline" onClick={() => trackCtaClick('Login', 'topbar')}>Login</a>
          <span className="text-white/40">|</span>
          <a href="#" className="hover:underline font-semibold" onClick={() => trackCtaClick('Sign Up', 'topbar')}>SIGN UP</a>
          <span className="text-white/40">|</span>
          <div className="flex items-center gap-3 ml-2">
            <a href={social.twitter || '#'} aria-label="Twitter" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaTwitter className="w-2.5 h-2.5" />
            </a>
            <a href={social.facebook || '#'} aria-label="Facebook" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaFacebookF className="w-2.5 h-2.5" />
            </a>
            <a href={social.instagram || '#'} aria-label="Instagram" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaInstagram className="w-2.5 h-2.5" />
            </a>
            <a href={social.linkedin || '#'} aria-label="LinkedIn" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
              <FaLinkedinIn className="w-2.5 h-2.5" />
            </a>
            {social.youtube && (
              <a href={social.youtube} aria-label="YouTube" target="_blank" rel="noopener noreferrer" className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white transition-all duration-300 hover:border-transparent hover:bg-brand-orange hover:-translate-y-0.5">
                <FaYoutube className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
