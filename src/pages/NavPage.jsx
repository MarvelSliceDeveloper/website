import { useParams, Link } from 'react-router-dom';
import CourseCard from '../components/ui/CourseCard';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import SectionRenderer from '../components/ui/SectionRenderer';
import { FiArrowLeft } from 'react-icons/fi';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export default function NavPage() {
  const { slug } = useParams();
  const splat = useParams()['*'];
  const path = splat ? `/${slug}/${splat}` : `/${slug}`;

  const { data, isLoading } = useQuery({
    queryKey: ['navPageData', path],
    queryFn: async () => {
      const { data: navItems } = await supabase
        .from('nav_items')
        .select('id, label, parent_label')
        .eq('path', path)
        .eq('is_active', true)
        .order('id')
        .limit(1);
      const navItem = navItems?.[0] || null;
      if (!navItem) return null;

      const [pageRes, directCoursesRes, childItemsRes] = await Promise.all([
        supabase.from('nav_pages').select('*').eq('nav_item_id', navItem.id).eq('is_published', true).order('id').limit(1),
        supabase.from('courses').select('*').eq('nav_item_id', navItem.id).eq('is_published', true).order('created_at', { ascending: false }),
        supabase.from('nav_items').select('id').eq('parent_id', navItem.id).eq('is_active', true),
      ]);

      const directCourses = directCoursesRes.data || [];
      const childIds = (childItemsRes.data || []).map(c => c.id);
      let childCourses = [];
      if (childIds.length > 0) {
        const { data } = await supabase.from('courses').select('*').in('nav_item_id', childIds).eq('is_published', true).order('created_at', { ascending: false });
        childCourses = data || [];
      }

      const allCourses = [...directCourses, ...childCourses];
      const unique = allCourses.filter((c, i, a) => a.findIndex(x => x.id === c.id) === i);

      const parentSlug = navItem.parent_label
        ? navItem.parent_label.toLowerCase().replace(/\s+/g, '-')
        : null;
      const categorySlug = path.replace(/.*\//, '');
      const exploreLink = parentSlug
        ? `/courses?parent=${parentSlug}&category=${categorySlug}`
        : `/courses`;

      const pageData = pageRes.data?.[0] || null;
      const page = pageData
        ? { ...pageData, courses: unique, navLabel: navItem.label, exploreLink }
        : { courses: unique, navLabel: navItem.label, exploreLink };
      return page;
    },
    enabled: !!path,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;
  }

  const hasContent = data && (data.heading || data.subheading || data.sections?.length > 0 || data.courses?.length > 0);

  if (!hasContent) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-dark-navy mb-4">Page Not Found</h1>
        <p className="text-text-gray mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-brand-orange hover:underline"><FiArrowLeft className="w-4 h-4" /> Back to Home</Link>
      </div>
    );
  }

  return (
    <div>
      {data.hero_image && (
        <div className="h-48 sm:h-72 lg:h-96 w-full overflow-hidden"><img src={data.hero_image} alt="" className="w-full h-full object-cover" /></div>
      )}

      {(data.heading || data.subheading) && (
        <Reveal className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          {data.heading && <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark-navy mb-4">{data.heading}</h1>}
          {data.subheading && <p className="text-base sm:text-lg text-text-gray max-w-2xl mx-auto">{data.subheading}</p>}
        </Reveal>
      )}

      {!data.heading && !data.subheading && data.courses?.length > 0 && (
        <Reveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-dark-navy mb-4">{data.navLabel}</h1>
          <p className="text-base sm:text-lg text-text-gray max-w-2xl mx-auto">Explore our {data.navLabel?.toLowerCase()} courses</p>
        </Reveal>
      )}

      {data.sections?.length > 0 && data.sections.filter(s => !s.hidden).map((section, i) => (
        <div key={i} className={`py-10 sm:py-14 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionRenderer section={section} />
          </div>
        </div>
      ))}

      {data.courses?.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
          <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 sm:mb-8">
            {data.navLabel ? `${data.navLabel} Courses` : 'Available Courses'}
          </Reveal>
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.courses.map((course) => (
              <StaggerItem key={course.id} className="h-full">
                <CourseCard course={course} variant="image" showReviewCount />
              </StaggerItem>
            ))}
          </Stagger>
          <div className="text-right mt-6">
            <Link
              to={data.exploreLink}
              className="text-sm font-semibold text-brand-orange hover:underline"
            >
              Explore All Courses →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
