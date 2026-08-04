import { useState } from 'react';
import AccordionItem from '../ui/AccordionItem';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';
import { useSiteSettings } from '../../hooks/useSupabase';

export default function CourseOverview({ section }) {
  if (!section) return null;
  const { data: settings } = useSiteSettings();
  const phone = settings?.contact_phone || '';

  const heading = section.heading || 'Overview';
  const content = section.content || {};
  const description = content.description || '';
  const items = content.items || [];
  const [openIdx, setOpenIdx] = useState(null);

  if (items.length === 0 && !description) return null;

  return (
    <section className="py-12 sm:py-16 bg-bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Reveal as="h2" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-dark-navy mb-4">
              {heading}
            </Reveal>
            {description && (
              <Reveal as="p" className="text-text-gray text-base lg:text-lg leading-relaxed mb-8">
                {description}
              </Reveal>
            )}

            {items.length > 0 && (
              <Stagger className="space-y-2 w-full max-w-[70%]">
                {items.map((item, i) => (
                  <StaggerItem key={i}>
                    <AccordionItem
                      title={item.question}
                      isOpen={openIdx === i}
                      onToggle={() => setOpenIdx(openIdx === i ? null : i)}
                    >
                      <p className="text-text-gray text-base leading-relaxed mb-3">{item.answer}</p>
                      {item.list_items && item.list_items.length > 0 && (
                        <ol className="list-decimal pl-6 space-y-1.5 text-base text-text-gray">
                          {item.list_items.map((li, j) => (
                            <li key={j}>{li}</li>
                          ))}
                        </ol>
                      )}
                    </AccordionItem>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </div>

          {phone && (
            <Reveal variant="left" className="bg-gradient-to-br from-brand-blue to-brand-blue rounded-xl p-6 sm:p-8 text-white">
              <h4 className="font-semibold text-lg sm:text-xl mb-3">Talk To Us</h4>
              <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="text-brand-orange font-bold text-xl sm:text-2xl block mb-6 hover:underline">
                {phone}
              </a>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
