import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import CourseCard from '../ui/CourseCard';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';

export default function RelatedCourses() {
  const { data: courses } = useQuery({
    queryKey: ['featuredCourses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  if (!courses || courses.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <Reveal as="h2" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-dark-navy">
            Latest Courses
          </Reveal>
          <Link to="/courses" className="text-brand-orange font-medium text-base hover:underline">
            View All &rarr;
          </Link>
        </div>
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {courses.map((rc) => (
            <StaggerItem key={rc.id} className="h-full">
              <CourseCard course={rc} bannerSize="sm" variant="image" showReviewCount />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
