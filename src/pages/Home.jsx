import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import HeroSection from '../components/home/HeroSection';
import IntroFormSection from '../components/home/IntroFormSection';
import EmpoweringSection from '../components/home/EmpoweringSection';
import FeatureCardsSection from '../components/home/FeatureCardsSection';
import ServicesSection from '../components/home/ServicesSection';
import CTABannerSection from '../components/home/CTABannerSection';
import FAQSection from '../components/home/FAQSection';

export default function Home() {
  const { data: homeSections } = useQuery({
    queryKey: ['homeSections', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('home_sections').select('*').order('sort_order');
      if (error) {
        if (error.code === '42P01') return {};
        throw error;
      }
      const map = {};
      (data || []).forEach((s) => { map[s.section_key] = s; });
      return map;
    },
  });

  const hasData = homeSections && Object.keys(homeSections).length > 0;

  function sec(key) {
    return hasData ? homeSections[key] || null : null;
  }

  return (
    <>
      <HeroSection section={sec('hero')} />
      <IntroFormSection section={sec('intro_form')} />
      <EmpoweringSection section={sec('empowering')} />
      <FeatureCardsSection section={sec('featured_courses')} />
      <ServicesSection section={sec('services')} />
      <CTABannerSection section={sec('cta_banner')} />
      <FAQSection section={sec('faqs')} />
    </>
  );
}
