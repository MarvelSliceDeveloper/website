import Card from '../ui/Card';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';

export default function ProjectsSection({ section }) {
  if (!section) return null;

  const heading = section.heading || 'Projects';
  const items = section.content?.items || [];

  if (items.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-center text-dark-navy mb-10">
          {heading}
        </Reveal>
        <Stagger className="grid md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <StaggerItem key={i} className="h-full">
              <Card className="p-8 h-full">
                <h3 className="font-bold text-brand-orange text-xl mb-3">
                  {item.title}
                </h3>
                <p className="text-text-gray text-base leading-relaxed">
                  {item.description}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
