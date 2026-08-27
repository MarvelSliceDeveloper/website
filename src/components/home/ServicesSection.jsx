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
          <Reveal as="h2" className="font-bold text-2xl sm:text-3xl text-dark-navy mb-6">
            {heading}
          </Reveal>
          <div className="w-4/5 h-[3px] bg-brand-orange mx-auto mb-6" />
        </div>
        {intro && (
          <Reveal className="text-text-gray mb-12 text-center">
            <p className="text-lg">{intro}</p>
          </Reveal>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <Reveal variant="right" className="flex flex-col">
            {leftImageUrl ? (
              <img
                src={leftImageUrl}
                alt={leftHeading}
                className="w-full h-72 object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-72 rounded-2xl bg-gradient-to-br from-brand-blue to-brand-orange" />
            )}
            <h3 className="font-bold text-xl mt-6 text-dark-navy text-center sm:text-left">{leftHeading}</h3>
            {leftDescription && (
              <p className="text-text-gray mt-3 text-center sm:text-left">{leftDescription}</p>
            )}
            <Button
              variant="accent"
              shape="pill"
              href={ctaLink}
              className="mt-4 self-center sm:self-start"
            >
              {ctaText} <FiChevronRight />
            </Button>
          </Reveal>

          <Reveal variant="left" className="flex flex-col justify-center">
            {servicesList.map((service, i) => {
              const Icon = ICON_MAP[service.icon_name] || FiBriefcase;
              return (
                <div key={i}>
                  <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 py-5">
                    <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center shrink-0 mt-1">
                      <Icon className="w-6 h-6 text-brand-orange" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-dark-navy text-base">{service.title}</h4>
                      <p className="text-text-gray text-base mt-1">{service.description}</p>
                    </div>
                  </div>
                  {i < servicesList.length - 1 && <div className="border-b border-gray-100" />}
                </div>
              );
            })}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
