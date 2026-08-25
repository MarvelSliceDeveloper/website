import { useState } from "react";
import AccordionItem from "../ui/AccordionItem";
import Reveal, { Stagger, StaggerItem } from "../ui/Reveal";

export default function FAQSection({ section }) {
  if (!section) return null;

  const heading = section.heading || "Frequently Asked Questions";
  const items = section.content?.items || [];
  const [openIdx, setOpenIdx] = useState(null);

  if (items.length === 0) return null;

  return (
    <section className="pt-8 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex flex-col items-center">
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">
                {heading}
              </h2>
              <div className="mt-3 h-[3px] bg-brand-orange rounded-full w-4/5" />
            </div>
          </div>
        </Reveal>
        <Stagger className="space-y-2 mt-16 w-full">
          {items.map((item, i) => (
            <StaggerItem key={i}>
              <AccordionItem
                title={item.question}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <p className="text-gray-500 text-base leading-relaxed">
                  {item.answer}
                </p>
              </AccordionItem>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
