import { FiCheck } from 'react-icons/fi';
import Button from '../ui/Button';
import { useCourse } from '../../hooks/useSupabase';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';

export default function CourseFees() {
  const { data: course } = useCourse('angular');
  const plans = course?.course_fees || [];

  return (
    <section className="py-12 sm:py-16 bg-brand-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-center mb-8 sm:mb-10">
          Angular Course Fees
        </Reveal>
        <Stagger className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <StaggerItem key={plan.id} className="bg-white rounded-xl p-6 sm:p-8 text-dark-navy">
              <h3 className="text-xl font-bold mb-5">{plan.plan_name}</h3>
              <ul className="space-y-3 mb-8">
                {(plan.features || []).map((feat, j) => (
                  <li key={j} className="flex items-center gap-3 text-base text-text-gray">
                    <FiCheck className="w-5 h-5 text-brand-blue shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              {plan.price != null && (
                <p className="text-3xl font-extrabold text-brand-blue mb-6">
                  {plan.currency === 'INR' ? '₹' : '$'}{plan.price}
                </p>
              )}
              <Button variant={plan.price != null ? 'orange' : 'outline'}>
                {plan.cta_label || (plan.price != null ? 'Enroll Now' : 'Contact Us')}
              </Button>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
