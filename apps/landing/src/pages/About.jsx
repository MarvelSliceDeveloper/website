import { Link } from 'react-router-dom';
import Reveal from '../components/ui/Reveal';
import SectionRenderer from '../components/ui/SectionRenderer';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

const PAGE_PATH = '/about';

export default function About() {
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
    return (
      <div className="min-h-[70vh] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8 animate-pulse">
        <div className="h-64 bg-slate-100 rounded-2xl w-full" />
        <div className="h-10 bg-slate-100 rounded-lg w-1/3 mx-auto" />
        <div className="h-4 bg-slate-100 rounded w-1/2 mx-auto" />
        <div className="space-y-4 pt-6">
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  const hasContent = data && (data.heading || data.subheading || data.sections?.length > 0);

  if (!hasContent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-dark-navy mb-4">Page Not Found</h1>
        <p className="text-text-gray mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-brand-orange hover:underline"><FiArrowLeft className="w-4 h-4" /> Back to Home</Link>
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
              <img src={heroImg || mobileHeroImg} alt="" className="w-full h-auto" />
            </picture>
          ) : (
            <img src={heroImg} alt="" className="w-full h-auto" />
          )}
        </Reveal>
      )}

      {data.subheading && (
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 text-center">
          <p className="text-sm sm:text-base text-text-gray max-w-2xl mx-auto leading-relaxed">{data.subheading}</p>
        </Reveal>
      )}

      {data.sections?.length > 0 && data.sections.filter(s => !s.hidden).map((section, i) => (
        <Reveal key={i} variant="up" className={`py-10 sm:py-16 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionRenderer section={section} className="pt-0 pb-16" />
          </div>
        </Reveal>
      ))}
    </div>
  );
}
