import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FiBriefcase } from 'react-icons/fi';
import * as LuIcons from 'react-icons/lu';
import { supabase } from '../lib/supabaseClient';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import AccordionItem from '../components/ui/AccordionItem';

const serviceStyles = [
  {
    accent: 'text-orange-500',
    underline: 'bg-orange-500',
    bg: 'bg-orange-50',
    blob: 'bg-orange-50',
    border: 'border-orange-100',
    dots: 'bg-orange-200',
  },
  {
    accent: 'text-blue-500',
    underline: 'bg-blue-500',
    bg: 'bg-blue-50',
    blob: 'bg-blue-50',
    border: 'border-blue-100',
    dots: 'bg-blue-200',
  },
  {
    accent: 'text-emerald-500',
    underline: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    blob: 'bg-emerald-50',
    border: 'border-emerald-100',
    dots: 'bg-emerald-200',
  },
  {
    accent: 'text-violet-500',
    underline: 'bg-violet-500',
    bg: 'bg-violet-50',
    blob: 'bg-violet-50',
    border: 'border-violet-100',
    dots: 'bg-violet-200',
  },
  {
    accent: 'text-pink-500',
    underline: 'bg-pink-500',
    bg: 'bg-pink-50',
    blob: 'bg-pink-50',
    border: 'border-pink-100',
    dots: 'bg-pink-200',
  },
  {
    accent: 'text-cyan-500',
    underline: 'bg-cyan-500',
    bg: 'bg-cyan-50',
    blob: 'bg-cyan-50',
    border: 'border-cyan-100',
    dots: 'bg-cyan-200',
  },
  {
    accent: 'text-indigo-500',
    underline: 'bg-indigo-500',
    bg: 'bg-indigo-50',
    blob: 'bg-indigo-50',
    border: 'border-indigo-100',
    dots: 'bg-indigo-200',
  },
  {
    accent: 'text-teal-500',
    underline: 'bg-teal-500',
    bg: 'bg-teal-50',
    blob: 'bg-teal-50',
    border: 'border-teal-100',
    dots: 'bg-teal-200',
  },
];

function ServiceCard({ title, description, icon, colorIdx = 0 }) {
  const IconComp = icon ? LuIcons[`Lu${icon}`] : null;
  const style = serviceStyles[colorIdx % serviceStyles.length];

  return (
    <div
      className={`
        group
        relative
        h-full
        min-h-[285px]
        overflow-hidden
        rounded-[22px]
        border
        ${style.border}
        bg-white
        px-7
        py-6
        shadow-[0_8px_30px_rgba(15,23,42,0.06)]
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-[0_12px_24px_rgba(15,23,42,0.10),0_24px_56px_rgba(15,23,42,0.12)]
      `}
    >
      {/* Soft decorative shape */}
      <div
        className={`
          absolute
          -right-12
          -top-12
          h-36
          w-36
          rounded-full
          ${style.blob}
          opacity-80
          transition-all
          duration-300
          group-hover:scale-125
        `}
      />

      {/* Service number */}
      <div className="relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
        <span
          className={`
            text-2xl
            font-semibold
            tracking-tight
            ${style.accent}
          `}
        >
          {String(colorIdx + 1).padStart(2, '0')}
        </span>

        <div
          className={`mt-2 h-[3px] w-9 rounded-full ${style.underline} transition-all duration-300 group-hover:w-14`}
        />
      </div>

      {/* Icon */}
      <div
        className={`
          absolute
          right-6
          top-6
          z-10
          flex
          h-14
          w-14
          items-center
          justify-center
          rounded-2xl
          ${style.bg}
          transition-transform
          duration-300
          group-hover:scale-110
          group-hover:rotate-6
        `}
      >
        {IconComp ? (
          <IconComp className={`h-7 w-7 ${style.accent} transition-transform duration-300 group-hover:scale-110`} />
        ) : (
          <FiBriefcase className={`h-7 w-7 ${style.accent} transition-transform duration-300 group-hover:scale-110`} />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-9">
        <h3 className="max-w-[90%] text-[18px] font-bold leading-snug text-slate-900 transition-colors duration-300 group-hover:text-slate-700">
          {title}
        </h3>

        {description && (
          <p className="mt-4 text-[14px] leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-5 right-6 grid grid-cols-3 gap-1.5 opacity-70">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${style.dots}`}
          />
        ))}
      </div>
    </div>
  );
}

function JourneyCard({ step, index }) {
  const ref = useRef(null);
  const isLeft = index % 2 === 0;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.18], [48, 0]);
  const x = useTransform(scrollYProgress, [0, 0.18], [isLeft ? -40 : 40, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y, x }}>
      <div className={`relative flex flex-col sm:flex-row items-center gap-6 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
        <div className="flex-1 w-full">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col sm:flex-row sm:h-[300px]">
            <div className="sm:w-1/2 h-[230px] sm:h-full">
              {step.image ? (
                <img src={step.image} alt={step.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-5xl font-black text-white">
                  {step.number}
                </div>
              )}
            </div>
            <div className="sm:w-1/2 px-6 pt-4 pb-6 flex flex-col justify-start">
              <h3 className="text-[25px] font-bold text-[#175cdd] line-clamp-1">{step.title}</h3>
              <p className="text-[#333333] text-sm mt-2 leading-relaxed line-clamp-11">{step.description}</p>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center justify-center shrink-0 relative z-10">
          <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center text-white font-bold text-sm shadow-lg">
            {step.number}
          </div>
        </div>
        <div className="flex-1 hidden sm:block" />
      </div>
    </motion.div>
  );
}

export default function ServicesPage() {
  const [faqOpen, setFaqOpen] = useState(null);

  const { data: pageData } = useQuery({
    queryKey: ['servicesPage', 'nav_pages'],
    queryFn: async () => {
      try {
        const { data: navItems } = await supabase
          .from('nav_items')
          .select('id')
          .eq('path', '/services')
          .eq('is_active', true)
          .limit(1);
        const navItem = navItems?.[0];
        if (!navItem) return {};
        const { data: pages } = await supabase
          .from('nav_pages')
          .select('*')
          .eq('nav_item_id', navItem.id)
          .eq('is_published', true)
          .limit(1);
        const page = pages?.[0];
        if (!page) return {};
        const sections = page.sections || [];
        const cards = sections.find((s) => s.section_type === 'cards');
        const timeline = sections.find((s) => s.section_type === 'timeline');
        const faqs = sections.find((s) => s.section_type === 'faq_list');
        return {
          hero_image: page.hero_image || '',
          heading: page.heading || '',
          subheading: page.subheading || '',
          services: cards?.items || [],
          steps: timeline?.items || [],
          faqs: faqs?.items || [],
        };
      } catch {
        return {};
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const { hero_image, heading, subheading, services = [], steps = [], faqs = [] } = pageData || {};

  return (
    <div className="bg-white">
      {hero_image && (
        <Reveal variant="fadeIn" className="w-full max-w-[1900px] mx-auto h-auto sm:h-[320px] lg:h-[400px] overflow-hidden">
          <img src={hero_image} alt="" className="w-full h-full object-cover" />
        </Reveal>
      )}

      {services.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="div" className="mb-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-700">
                {heading}
              </h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand-orange" />
              {subheading && (
                <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 sm:text-lg">
                  {subheading}
                </p>
              )}
            </Reveal>
            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 mt-12">
              {services.map((service, i) => (
                <StaggerItem key={service.id ?? i} className="h-full">
                  <ServiceCard
                    title={service.title}
                    description={service.description}
                    icon={service.icon}
                    colorIdx={i}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section className="py-16 sm:py-20 bg-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-14">
              <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
                Your Learning Journey
              </h2>
              <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
                A structured path from enrollment to career success.
              </p>
            </Reveal>

            <div className="relative">
              <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-brand-blue hidden sm:block" />
              <div className="space-y-8 sm:space-y-12">
                {steps.map((step, i) => (
                  <JourneyCard key={i} step={step} index={i} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <section className="pt-8 pb-16 bg-neutral-50">
          <div className="w-full max-w-[92%] sm:max-w-[70%] mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="text-center">
                <div className="inline-flex flex-col items-center">
                  <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">
                    Frequently Asked Questions
                  </h2>
                  <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-4/5" />
                </div>
              </div>
            </Reveal>
            <Stagger className="space-y-2 mt-16">
              {faqs.map((faq, i) => (
                <StaggerItem key={i}>
                  <AccordionItem
                    title={faq.question}
                    isOpen={faqOpen === i}
                    onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <p className="text-gray-500 text-base leading-relaxed">{faq.answer}</p>
                  </AccordionItem>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}
    </div>
  );
}
