import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';
import {
  FiChevronRight, FiBriefcase, FiBookOpen, FiTarget,
  FiClock, FiVideo, FiCode, FiAward, FiCalendar, FiRefreshCw,
  FiMessageSquare, FiUsers, FiStar, FiBarChart2, FiGlobe,
  FiCpu, FiDatabase, FiLayers, FiZap, FiShield, FiTrendingUp,
  FiMail, FiBell, FiHelpCircle, FiChevronLeft,
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
  const serviceCards = c.service_cards || [];

  const [cardIdx, setCardIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const maxCardIdx = Math.max(0, serviceCards.length - 3);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (maxCardIdx === 0 || paused) return;
    intervalRef.current = setInterval(() => {
      setCardIdx((prev) => (prev >= maxCardIdx ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [maxCardIdx, paused]);

  useEffect(() => {
    setCardIdx(0);
  }, [serviceCards.length]);

  if (!section) return null;

  const heading = section.heading || 'Featured Services';
  const intro = c.intro || '';
  const leftImageUrl = c.left_image_url || '';
  const leftHeading = c.left_heading || 'Transform Your Future with Industry-Focused Training';
  const leftDescription = c.left_description || '';
  const ctaText = c.cta_text || 'Explore Our Services';
  const ctaLink = c.cta_link || '#';
  const servicesList = c.services_list || [];

  function CardContent({ card }) {
    return (
      <>
        {card.image_url ? (
          <img src={card.image_url} alt={card.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center">
            <FiTarget className="w-8 h-8 text-white/70" />
          </div>
        )}
        <div className="p-6 flex flex-col flex-1">
          <h4 className="font-semibold text-dark-navy">{card.title}</h4>
          <p className="text-text-gray text-sm mt-2">{card.description}</p>
        </div>
      </>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-fit mx-auto text-center">
          <Reveal as="h2" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-dark-navy mb-6">
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
            <h3 className="font-bold text-xl mt-6 text-dark-navy">{leftHeading}</h3>
            {leftDescription && (
              <p className="text-text-gray mt-3">{leftDescription}</p>
            )}
            <Button
              variant="accent"
              shape="pill"
              href={ctaLink}
              className="mt-4 self-start"
            >
              {ctaText} <FiChevronRight />
            </Button>
          </Reveal>

          <Reveal variant="left" className="flex flex-col justify-center">
            {servicesList.map((service, i) => {
              const Icon = ICON_MAP[service.icon_name] || FiBriefcase;
              return (
                <div key={i}>
                  <div className="flex gap-4 py-5">
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

        {serviceCards.length > 0 && (
          <div
            className="relative mt-12"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${cardIdx * (100 / 3)}%)` }}
              >
                {serviceCards.map((card, i) => (
                  <div key={i} className="w-1/3 shrink-0 px-2">
                    {card.is_clickable && card.link_url ? (
                      <Link
                        to={card.link_url}
                        className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <CardContent card={card} />
                      </Link>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <CardContent card={card} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {serviceCards.length > 3 && (
              <>
                <button
                  onClick={() => setCardIdx((p) => Math.max(0, p - 1))}
                  disabled={cardIdx === 0}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer z-10"
                >
                  <FiChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCardIdx((p) => Math.min(maxCardIdx, p + 1))}
                  disabled={cardIdx === maxCardIdx}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer z-10"
                >
                  <FiChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
            <div className="flex justify-center gap-2 mt-4">
              {serviceCards.slice(0, maxCardIdx + 1).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCardIdx(i)}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                    i === cardIdx ? 'bg-brand-orange' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
