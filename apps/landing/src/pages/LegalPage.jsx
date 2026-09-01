import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';
import Reveal from '../components/ui/Reveal';

function alignClass(align) {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

const DEFAULT_LEGAL_DATA = {
  terms: {
    title: 'Terms & Conditions',
    intro: 'Welcome to Marvel Slice. By accessing or using our website, courses, and educational services, you agree to be bound by the following terms and conditions.',
    sections: [
      {
        id: '1',
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using our platform, courses, and educational services, you confirm that you have read, understood, and agree to these Terms & Conditions. If you do not agree, please refrain from using our services.',
      },
      {
        id: '2',
        heading: '2. Educational Services & Enrollment',
        body: 'Marvel Slice provides software training, competitive exam coaching, and career guidance. Course enrollments are subject to availability and payment verification. We reserve the right to refine curriculum or class schedules to maximize learning outcomes.',
      },
      {
        id: '3',
        heading: '3. Intellectual Property Rights',
        body: 'All study materials, video content, branding, logos, and course assets provided by Marvel Slice are protected by copyright and intellectual property laws. Redistribution, resale, or unauthorized sharing of course content is strictly prohibited.',
      },
      {
        id: '4',
        heading: '4. User Responsibilities & Conduct',
        body: 'Users must provide accurate registration details and maintain the confidentiality of their credentials. Any unauthorized access, tampering, or misuse of our digital systems may result in immediate suspension of services.',
      },
      {
        id: '5',
        heading: '5. Contact & Inquiries',
        body: 'If you have questions or require clarification regarding these Terms & Conditions, please contact us through our official support email or contact form.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'At Marvel Slice, we respect your privacy and are dedicated to safeguarding the personal data you share with us.',
    sections: [
      {
        id: '1',
        heading: '1. Information We Collect',
        body: 'We collect personal information that you voluntarily provide when registering for courses, filling enquiry forms, or contacting us. This includes your name, email address, phone number, and educational interests.',
      },
      {
        id: '2',
        heading: '2. How We Use Your Information',
        body: 'We utilize your information to deliver course materials, process enrollments, respond to inquiries, send relevant updates, and improve overall platform user experience.',
      },
      {
        id: '3',
        heading: '3. Data Security & Protection',
        body: 'We implement industry-standard technical and organizational security measures to protect your personal information against unauthorized access, loss, or disclosure. We do not sell or trade your data to third parties.',
      },
      {
        id: '4',
        heading: '4. Cookies & Usage Analytics',
        body: 'Our platform uses cookies and analytical tools to understand user behavior and optimize performance. You can manage or disable cookie preferences through your web browser settings.',
      },
      {
        id: '5',
        heading: '5. Updates to This Policy',
        body: 'We may update this Privacy Policy periodically to reflect changes in legal or operational practices. Continued use of our website constitutes acceptance of any revisions.',
      },
    ],
  },
};

export default function LegalPage({ pageKey }) {
  const { data, isLoading } = useQuery({
    queryKey: ['legal-page', pageKey],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('page_key', pageKey)
          .eq('is_published', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Legal page Supabase error, falling back to default:', error.message);
          return DEFAULT_LEGAL_DATA[pageKey] || null;
        }
        return data || DEFAULT_LEGAL_DATA[pageKey] || null;
      } catch {
        return DEFAULT_LEGAL_DATA[pageKey] || null;
      }
    },
    enabled: !!pageKey,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" /></div>;
  }

  const contentData = data || DEFAULT_LEGAL_DATA[pageKey];
  const sections = Array.isArray(contentData?.sections) ? contentData.sections : [];

  if (!contentData || (!contentData.title && !contentData.intro && sections.length === 0)) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-dark-navy mb-4">Coming Soon</h1>
        <p className="!text-text-gray mb-8">This page is being prepared and will be available shortly.</p>
        <Link to="/" className="inline-flex items-center gap-2 text-brand-orange hover:underline"><FiArrowLeft className="w-4 h-4" /> Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <Reveal className="mb-10 sm:mb-12">
        {contentData.title && <h1 className="text-3xl sm:text-4xl font-extrabold text-dark-navy mb-4">{contentData.title}</h1>}
        {contentData.intro && <p className="!text-text-gray text-base sm:text-lg">{contentData.intro}</p>}
      </Reveal>

      {sections.map((section, i) => (
        <Reveal key={section.id || i} className="mb-8 sm:mb-10">
          {section.heading && (
            <h2 className={`text-xl sm:text-2xl font-bold text-dark-navy mb-3 ${alignClass(section.heading_align)}`}>
              {section.heading}
            </h2>
          )}
          {section.body && (
            <div className={`whitespace-pre-line text-base leading-relaxed !text-text-gray ${alignClass(section.body_align)}`}>
              {section.body}
            </div>
          )}
        </Reveal>
      ))}
    </div>
  );
}
