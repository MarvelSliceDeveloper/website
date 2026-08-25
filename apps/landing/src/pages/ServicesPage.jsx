import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiBriefcase } from "react-icons/fi";
import * as LuIcons from "react-icons/lu";
import { supabase } from "../lib/supabaseClient";
import Reveal, { Stagger, StaggerItem } from "../components/ui/Reveal";
import AccordionItem from "../components/ui/AccordionItem";
import LearningJourney from "../components/ui/LearningTimeline";

const serviceStyles = [
  {
    accent: "text-orange-500",
    underline: "bg-orange-500",
    bg: "bg-orange-50",
    blob: "bg-orange-50",
    border: "border-orange-100",
    dots: "bg-orange-200",
  },
  {
    accent: "text-blue-500",
    underline: "bg-blue-500",
    bg: "bg-blue-50",
    blob: "bg-blue-50",
    border: "border-blue-100",
    dots: "bg-blue-200",
  },
  {
    accent: "text-emerald-500",
    underline: "bg-emerald-500",
    bg: "bg-emerald-50",
    blob: "bg-emerald-50",
    border: "border-emerald-100",
    dots: "bg-emerald-200",
  },
  {
    accent: "text-violet-500",
    underline: "bg-violet-500",
    bg: "bg-violet-50",
    blob: "bg-violet-50",
    border: "border-violet-100",
    dots: "bg-violet-200",
  },
  {
    accent: "text-pink-500",
    underline: "bg-pink-500",
    bg: "bg-pink-50",
    blob: "bg-pink-50",
    border: "border-pink-100",
    dots: "bg-pink-200",
  },
  {
    accent: "text-cyan-500",
    underline: "bg-cyan-500",
    bg: "bg-cyan-50",
    blob: "bg-cyan-50",
    border: "border-cyan-100",
    dots: "bg-cyan-200",
  },
  {
    accent: "text-indigo-500",
    underline: "bg-indigo-500",
    bg: "bg-indigo-50",
    blob: "bg-indigo-50",
    border: "border-indigo-100",
    dots: "bg-indigo-200",
  },
  {
    accent: "text-teal-500",
    underline: "bg-teal-500",
    bg: "bg-teal-50",
    blob: "bg-teal-50",
    border: "border-teal-100",
    dots: "bg-teal-200",
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
          {String(colorIdx + 1).padStart(2, "0")}
        </span>

        <div
          className={`mt-2 h-[3px] w-9 rounded-full ${style.underline} transition-all duration-300 group-hover:w-14`}
        />
      </div>

      {/* Icon */}
      <div
        className={`
          absolute
          right-5
          top-5
          z-10
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          ${style.bg}
          transition-transform
          duration-300
          group-hover:scale-110
          group-hover:rotate-6
        `}
      >
        {IconComp ? (
          <IconComp
            className={`h-5 w-5 ${style.accent} transition-transform duration-300 group-hover:scale-110`}
          />
        ) : (
          <FiBriefcase
            className={`h-5 w-5 ${style.accent} transition-transform duration-300 group-hover:scale-110`}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 mt-8">
        <h3 className="max-w-[85%] text-[17px] font-bold leading-snug text-slate-900 transition-colors duration-300 group-hover:text-slate-700">
          {title}
        </h3>

        {description && (
          <p className="mt-3 text-[13.5px] leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-5 right-6 grid grid-cols-3 gap-1.5 opacity-70">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${style.dots}`} />
        ))}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [faqOpen, setFaqOpen] = useState(null);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["servicesPage", "nav_pages"],
    queryFn: async () => {
      try {
        const { data: navItems } = await supabase
          .from("nav_items")
          .select("id")
          .eq("path", "/services")
          .eq("is_active", true)
          .limit(1);
        const navItem = navItems?.[0];
        if (!navItem) return {};
        const { data: pages } = await supabase
          .from("nav_pages")
          .select("*")
          .eq("nav_item_id", navItem.id)
          .eq("is_published", true)
          .limit(1);
        const page = pages?.[0];
        if (!page) return {};
        const sections = page.sections || [];
        const cards = sections.find((s) => s.section_type === "cards");
        const timeline = sections.find((s) => s.section_type === "timeline");
        const faqsSec = sections.find((s) => s.section_type === "faq_list");
        return {
          hero_image: page.hero_image || "",
          heading: page.heading || "",
          subheading: page.subheading || "",
          services: cards?.items || [],
          faqs: faqsSec?.items || [],
          faqHeading: faqsSec?.heading || "Frequently Asked Questions",
          faqSubheading: faqsSec?.subheading || "",
          timeline: timeline || null,
        };
      } catch {
        return {};
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="w-9 h-9 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const {
    hero_image,
    heading,
    subheading,
    services = [],
    faqs = [],
    faqHeading,
    faqSubheading,
    timeline = null,
  } = pageData || {};

  return (
    <div className="bg-white">
      {hero_image && (
        <Reveal
          variant="fadeIn"
          className="w-full max-w-[1900px] mx-auto h-auto sm:h-[400px] lg:h-[400px] overflow-hidden"
        >
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
                <StaggerItem key={`service-card-${i}`} className="h-full">
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

      <LearningJourney data={timeline} />

      {faqs.length > 0 && (
        <section className="pt-12 pb-16 bg-neutral-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="div" className="mb-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-blue-700">
                {faqHeading || "Frequently Asked Questions"}
              </h2>
              <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand-orange" />
              {faqSubheading && (
                <p className="mx-auto mt-4 max-w-2xl text-base text-slate-500 sm:text-lg">
                  {faqSubheading}
                </p>
              )}
            </Reveal>
            <Stagger className="space-y-2 mt-16">
              {faqs.map((faq, i) => (
                <StaggerItem key={`faq-item-${i}`}>
                  <AccordionItem
                    title={faq.question}
                    isOpen={faqOpen === i}
                    onToggle={() => setFaqOpen(faqOpen === i ? null : i)}
                  >
                    <p className="text-gray-500 text-base leading-relaxed">
                      {faq.answer}
                    </p>
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
