import { useAlumniCompanies } from '../../hooks/useSupabase';
import Reveal, { Stagger, StaggerItem } from '../ui/Reveal';

export default function AlumniCompanies() {
  const { data: companies } = useAlumniCompanies();

  if (!companies || companies.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-center text-dark-navy mb-6">
          Land Your Dream Job Like Our Alumni
        </Reveal>
        <div className="bg-bg-light rounded-xl p-8 lg:p-10">
          <Stagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {companies.map((company) => (
              <StaggerItem
                key={company.id}
                className="bg-white rounded-lg px-5 py-4 text-center text-base font-semibold text-dark-navy shadow-sm border border-gray-100"
              >
                {company.name}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
