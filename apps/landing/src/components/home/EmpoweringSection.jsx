import Reveal from '../ui/Reveal';

export default function EmpoweringSection({ section }) {
  if (!section) return null;

  const heading = section.heading || '';
  const description = section.content?.description || '';

  if (!heading && !description) return null;

  return (
    <section className="pt-16 pb-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal variant="up" className="space-y-4 sm:space-y-6 text-center lg:text-left">
          {heading && (
            <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy text-center lg:text-left leading-tight sm:leading-snug whitespace-pre-line">
              {heading}
            </h2>
          )}
          {description && (
            <p className="text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full indent-6 sm:indent-10 whitespace-pre-line">
              {description}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
