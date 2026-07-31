import Reveal from '../ui/Reveal';

export default function EmpoweringSection({ section }) {
  if (!section) return null;

  const heading = section.heading || '';
  const description = section.content?.description || '';

  if (!heading && !description) return null;

  return (
    <section className="pb-0 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center">
            {heading && (
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy mb-3">{heading}</h2>
            )}
            <div className="w-80 h-[3px] bg-brand-orange mx-auto mb-5" />
            {description && (
              <p className="text-text-gray text-base sm:text-lg leading-relaxed">{description}</p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
