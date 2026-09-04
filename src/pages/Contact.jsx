import { Link } from 'react-router-dom';
import Reveal from '../components/ui/Reveal';
import SectionRenderer from '../components/ui/SectionRenderer';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const PAGE_PATH = '/contact';

function HeroHeading({ data }) {
  const cfg = data.form_config?.hero || {};
  const line2 = cfg.heading_line_2;
  const headingText = data.heading || 'Get In Touch';

  return (
    <div className="flex flex-col items-center mb-4 text-center">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-dark-navy">
        <span>{headingText}</span>
        {line2 && <span className="block mt-1">{line2}</span>}
      </h1>
      <div className="w-16 h-[3px] bg-brand-orange rounded-full mx-auto mt-3 mb-6" />
    </div>
  );
}

export default function Contact() {
  const { data, isLoading } = useQuery({
    queryKey: ['navPageData', PAGE_PATH],
    queryFn: async () => {
      const { data: navItems } = await supabase
        .from('nav_items')
        .select('id, label')
        .eq('path', PAGE_PATH)
        .eq('is_active', true)
        .order('id')
        .limit(1);
      const navItem = navItems?.[0] || null;
      if (!navItem) return null;

      const { data: pages } = await supabase
        .from('nav_pages')
        .select('*')
        .eq('nav_item_id', navItem.id)
        .eq('is_published', true)
        .order('id')
        .limit(1);
      return pages?.[0] || null;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;
  }

  const hasContent = data && (data.heading || data.subheading || data.sections?.length > 0);

  if (!hasContent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-dark-navy mb-4">Page Not Found</h1>
        <p className="text-slate-500 text-xs sm:text-sm mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-brand-orange hover:underline text-sm font-semibold"><FiArrowLeft className="w-4 h-4" /> Back to Home</Link>
      </div>
    );
  }

  const heroImg = data?.hero_image || '';
  const mobileHeroImg = data?.mobile_hero_image || data?.form_config?.mobile_hero_image || '';

  return (
    <div>
      {(heroImg || mobileHeroImg) && (
        <Reveal variant="fadeIn" className="w-full max-w-[1900px] mx-auto overflow-hidden">
          {mobileHeroImg ? (
            <picture>
              <source media="(max-width: 639px)" srcSet={mobileHeroImg} />
              <img src={heroImg || mobileHeroImg} alt="" className="w-full h-[260px] sm:h-auto object-cover" />
            </picture>
          ) : (
            <img src={heroImg} alt="" className="w-full h-[260px] sm:h-auto object-cover" />
          )}
        </Reveal>
      )}

      {(data.heading || data.subheading) && (
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          {data.heading && <HeroHeading data={data} />}
          {data.subheading && (
            <p className="text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full indent-6 sm:indent-10 whitespace-pre-line max-w-2xl mx-auto">
              {data.subheading}
            </p>
          )}
        </Reveal>
      )}

      {data.sections?.length > 0 && data.sections.filter(s => !s.hidden).map((section, i) => (
        <Reveal key={i} variant="up" className={`py-10 sm:py-14 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          {section.type === 'map_embed' ? (
            <SectionRenderer section={section} />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionRenderer section={section} />
            </div>
          )}
        </Reveal>
      ))}
    </div>
  );
}
