import Reveal from '../ui/Reveal';
import {
  FiChevronRight, FiBriefcase, FiBookOpen,
  FiClock, FiVideo, FiCode, FiAward, FiCalendar, FiRefreshCw,
  FiMessageSquare, FiUsers, FiStar, FiBarChart2, FiGlobe,
  FiCpu, FiDatabase, FiLayers, FiZap, FiShield, FiTrendingUp,
  FiMail, FiBell, FiHelpCircle,
} from 'react-icons/fi';
import Button from '../ui/Button';

const ICON_MAP = {
  briefcase: FiBriefcase, book: FiBookOpen, target: FiBarChart2,
  code: FiCode, star: FiStar, award: FiAward, users: FiUsers,
  clock: FiClock, video: FiVideo, calendar: FiCalendar,
  refresh: FiRefreshCw, message: FiMessageSquare, globe: FiGlobe,
  cpu: FiCpu, database: FiDatabase, layers: FiLayers,
  zap: FiZap, shield: FiShield, trending: FiTrendingUp,
  mail: FiMail, bell: FiBell, help: FiHelpCircle,
};

export default function ServicesSection({ section }) {
  const c = section?.content || {};

  if (!section) return null;

  const heading = section.heading || 'Featured Services';
  const intro = c.intro || '';
  const leftImageUrl = c.left_image_url || '';
  const leftHeading = c.left_heading || 'Transform Your Future with Industry-Focused Training';
  const leftDescription = c.left_description || '';
  const ctaText = c.cta_text || 'Explore Our Services';
  const ctaLink = c.cta_link || '#';
  const servicesList = c.services_list || [];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-fit mx-auto text-center">
          <Reveal as="h2" className="font-bold text-2xl sm:text-3xl text-dark-navy leading-tight sm:leading-snug whitespace-pre-line">
            {heading}
          </Reveal>
          <div className="w-16 h-[3px] bg-brand-orange rounded-full mx-auto mt-3 mb-6" />
        </div>
        {intro && (
          <Reveal className="text-text-gray mb-12">
            <div className="max-w-4xl mx-auto space-y-4">
              {intro.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                <p key={i} className="text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full indent-6 sm:indent-10 whitespace-pre-line">
                  {p.trim()}
                </p>
              ))}
            </div>
          </Reveal>
        )}

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          <Reveal variant="right" className="flex flex-col h-full">
            {leftImageUrl ? (
              <img
                src={leftImageUrl}
                alt={leftHeading}
                className="w-full h-auto rounded-2xl shrink-0"
              />
            ) : (
              <div className="w-full h-52 sm:h-60 md:h-56 lg:h-72 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange shrink-0" />
            )}
            <h3 className="font-bold text-lg sm:text-xl mt-4 sm:mt-5 text-dark-navy text-center sm:text-left leading-snug line-clamp-2">{leftHeading}</h3>
            {leftDescription && (
              <div className="space-y-3 mt-2.5">
                {leftDescription.split(/\n\s*\n/).filter(Boolean).map((p, i) => (
                  <p key={i} className="text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full indent-6 sm:indent-10 whitespace-pre-line">
                    {p.trim()}
                  </p>
                ))}
              </div>
            )}
          </Reveal>

          <Reveal variant="left" className="flex flex-col justify-center space-y-1">
            {servicesList.map((service, i) => {
              const Icon = ICON_MAP[service.icon_name] || FiBriefcase;
              return (
                <div key={i}>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3.5 py-3.5 sm:py-4">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-brand-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-base sm:text-lg text-dark-navy leading-snug line-clamp-2">{service.title}</h4>
                      <p className="text-sm sm:text-base font-normal leading-relaxed text-slate-600 whitespace-pre-line mt-1">{service.description}</p>
                    </div>
                  </div>
                  {i < servicesList.length - 1 && <div className="border-b border-gray-100" />}
                </div>
              );
            })}
          </Reveal>
        </div>

        {ctaText && (
          <Reveal variant="up" className="mt-10 text-center flex justify-center">
            <a
              href={ctaLink}
              className="inline-flex items-center justify-center gap-2 bg-brand-orange text-white font-bold text-sm py-3 px-8 rounded-full hover:bg-brand-orange/90 hover:shadow-md hover:shadow-brand-orange/25 active:scale-95 transition-all cursor-pointer"
            >
              <span>{ctaText}</span>
              <FiChevronRight className="w-4 h-4 text-white" />
            </a>
          </Reveal>
        )}
      </div>
    </section>
  );
}
