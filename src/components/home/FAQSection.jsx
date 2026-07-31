import { useState } from 'react';
import AccordionItem from '../ui/AccordionItem';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';

export default function FAQSection({ section }) {
  if (!section) return null;

  const heading = section.heading || 'Frequently Asked Questions';
  const items = section.content?.items || [];
  const [openIdx, setOpenIdx] = useState(null);

  if (items.length === 0) return null;

  return (
    <section className="py-10">
      <div className="w-full max-w-[70%] mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">
          {heading}
        </Reveal>
        <Stagger className="space-y-2">
          {items.map((item, i) => (
            <StaggerItem key={i}>
              <AccordionItem
                title={item.question}
                isOpen={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <p className="text-gray-500 text-base leading-relaxed">{item.answer}</p>
              </AccordionItem>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
