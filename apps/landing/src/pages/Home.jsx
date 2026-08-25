import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import HeroSection from '../components/home/HeroSection';
import IntroFormSection from '../components/home/IntroFormSection';
import EmpoweringSection from '../components/home/EmpoweringSection';
import UpcomingClassesTableSection from '../components/home/UpcomingClassesTableSection';
import FeatureCardsSection from '../components/home/FeatureCardsSection';
import UpcomingCoursesSection from '../components/home/UpcomingCoursesSection';
import ServicesSection from '../components/home/ServicesSection';
import CTABannerSection from '../components/home/CTABannerSection';
import FAQSection from '../components/home/FAQSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import LatestBlogSection from '../components/home/LatestBlogSection';

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
      <UpcomingClassesTableSection section={{ ...(sec('upcoming_classes') || {}), heading: 'Upcoming Classes' }} imageSection={sec('upcoming_image')} />
      <EmpoweringSection section={sec('empowering')} />
      <FeatureCardsSection section={sec('featured_courses')} />
      <ServicesSection section={sec('services')} />
      <UpcomingCoursesSection section={{ ...(sec('upcoming_classes') || {}), heading: 'Upcoming Courses' }} />
      <CTABannerSection section={sec('cta_banner')} />
      <TestimonialsSection section={sec('testimonials')} />
      <FAQSection section={sec('faqs')} />
      <LatestBlogSection section={sec('latest_blog')} />
    </>
  );
}
