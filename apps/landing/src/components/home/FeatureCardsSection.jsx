import Reveal from '../ui/Reveal';
import { FiCheckCircle, FiArrowRight } from 'react-icons/fi';

export default function FeatureCardsSection({ section }) {
  if (!section) return null;

  const cards = section.content?.cards || [];
  const heading = section.heading || '';
  const subheading = section.subheading || '';

  if (cards.length === 0) return null;

  return (
    <section className="py-16 sm:py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(heading || subheading) && (
          <Reveal>
            <div className="text-center mb-12">
              {heading && (
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 mb-3 tracking-tight">
                  {heading}
                </h2>
              )}
              <div className="w-24 h-[3px] bg-brand-orange mx-auto mb-4 rounded-full" />
              {subheading && (
                <p className="text-text-gray text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  {subheading}
                </p>
              )}
            </div>
          </Reveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-7 sm:gap-8 items-stretch">
          {cards.map((card, i) => {
            const cardTitle = card.heading || card.title || '';
            const cardDesc = card.description || card.desc || '';
            const imageUrl = card.image_url || card.image || card.hero_image_url || '';
            const categoryBadge = card.category || card.type || card.badge || card.category_name || '';
            const bullets = card.bullets || card.features || card.highlights || [];
            const buttonText = card.button_text || card.cta_text || card.button_label || 'Explore';
            const buttonLink = card.button_link || card.link || card.url || '/courses';

            return (
              <Reveal key={i} variant={i % 2 === 0 ? 'right' : 'left'} className="h-full w-full">
                <div className="group relative bg-white rounded-[20px] border border-slate-200/70 shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-xl hover:border-brand-blue/30 hover:-translate-y-1.5 transition-all duration-300 ease-out flex flex-col h-full w-full overflow-hidden">
                  
                  {/* 1. IMAGE HEADER & BADGE */}
                  <div className="relative w-full aspect-[16/9] sm:aspect-[16/8.5] overflow-hidden bg-slate-100 shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={cardTitle}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-blue/90 to-brand-orange/90 group-hover:scale-[1.03] transition-transform duration-500 ease-out" />
                    )}
                    
                    {/* Subtle Overlay Gradient for Depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                    {/* 2. CATEGORY / LABEL BADGE (if present in dynamic data) */}
                    {categoryBadge && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-brand-blue bg-white/90 backdrop-blur-md shadow-sm border border-white/50">
                          {categoryBadge}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3. CONTENT AREA */}
                  <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Dynamic Title */}
                      {cardTitle && (
                        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-brand-blue transition-colors duration-200 line-clamp-2 mb-2.5">
                          {cardTitle}
                        </h3>
                      )}

                      {/* Dynamic Description */}
                      {cardDesc && (
                        <p className="text-text-gray text-sm sm:text-base leading-relaxed line-clamp-3 mb-6">
                          {cardDesc}
                        </p>
                      )}

                      {/* 4. DYNAMIC FEATURES GRID */}
                      {bullets.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6">
                          {bullets.map((bullet, j) => (
                            <div key={j} className="flex items-start gap-2 min-w-0">
                              <FiCheckCircle className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                              <span className="text-brand-blue text-xs sm:text-sm font-medium leading-tight truncate">
                                {bullet}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 5. CTA BUTTON (Anchored at Bottom) */}
                    <div className="pt-2 mt-auto">
                      <a
                        href={buttonLink}
                        className="group/btn inline-flex items-center gap-2 bg-brand-orange hover:bg-amber-600 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-md shadow-brand-orange/20 hover:shadow-lg hover:shadow-brand-orange/30 transition-all duration-200 active:scale-[0.99]"
                      >
                        <span>{buttonText}</span>
                        <FiArrowRight className="w-3.5 h-3.5 text-white group-hover/btn:translate-x-1 transition-transform duration-200 shrink-0" />
                      </a>
                    </div>

                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
