import Reveal from '../ui/Reveal';
import { FiCheckCircle } from 'react-icons/fi';

export default function FeatureCardsSection({ section }) {
  if (!section) return null;

  const cards = section.content?.cards || [];

  if (cards.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 justify-items-center">
          {cards.map((card, i) => (
            <Reveal key={i} variant={i === 0 ? 'right' : 'left'}>
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col w-full max-w-[90%]">
                <div className="p-6 pb-0 text-center">
                  <h3 className="font-bold text-xl sm:text-2xl text-brand-blue">
                    {card.heading}
                  </h3>
                </div>
                {card.description && (
                  <div className="px-6 pt-3">
                    <p className="text-text-gray text-base leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                )}
                {card.image_url ? (
                  <div className="px-6 pt-4">
                    <img
                      src={card.image_url}
                      alt={card.heading || ''}
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="mx-6 mt-4 h-48 bg-gradient-to-r from-brand-blue to-brand-orange rounded-xl" />
                )}
                <div className="p-6 flex flex-col flex-1">
                  {card.bullets && card.bullets.length > 0 && (
                    <ul className="space-y-2 flex-1">
                      {card.bullets.map((bullet, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <FiCheckCircle className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                          <span className="text-text-gray text-base">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <a
                    href={card.button_link || '/courses'}
                    className="inline-flex items-center justify-center gap-2 mt-6 bg-brand-orange text-white px-[30px] py-[15px] text-base font-semibold rounded-full hover:bg-brand-orange/90 active:scale-[0.97] transition-all duration-200 self-start"
                  >
                    {card.button_text || 'View More'}
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
