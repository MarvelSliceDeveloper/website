import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nxlsxywqvvuiljsulito.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54bHN4eXdxdnZ1aWxqc3VsaXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NTU3NTEsImV4cCI6MjA5ODUzMTc1MX0.OMgBhyUiAPwsC3oPx9Htv5obXXgCPm6h9QD6KHgi3lA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedServices() {
  console.log('\n=== Seeding Services ===\n');

  // Categories
  const categories = [
    { name: 'Software Learning', slug: 'software-learning', icon: 'FiCode', description: 'Programming & software development courses', sort_order: 1, status: true },
    { name: 'Competitive Exams', slug: 'competitive-exams', icon: 'FiTarget', description: 'Exam preparation and coaching', sort_order: 2, status: true },
    { name: 'Internship', slug: 'internship', icon: 'FiBriefcase', description: 'Industry internship programs', sort_order: 3, status: true },
    { name: 'Placement Training', slug: 'placement-training', icon: 'FiTrendingUp', description: 'Job placement preparation programs', sort_order: 4, status: true },
    { name: 'Certification', slug: 'certification', icon: 'FiAward', description: 'Professional certification courses', sort_order: 5, status: true },
    { name: 'Career Services', slug: 'career-services', icon: 'FiStar', description: 'Career guidance and support services', sort_order: 6, status: true },
    { name: 'Corporate Training', slug: 'corporate-training', icon: 'FiUsers', description: 'Corporate employee training programs', sort_order: 7, status: true },
    { name: 'Others', slug: 'others', icon: 'FiLayers', description: 'Other specialized training programs', sort_order: 8, status: true },
  ];

  const { error: catErr } = await supabase.from('service_categories').upsert(categories, { onConflict: 'slug' });
  if (catErr) { console.error('Category error:', catErr.message); return; }
  console.log('✓ Service categories seeded');

  const { data: cats } = await supabase.from('service_categories').select('id, slug');

  function catId(slug) { return cats?.find(c => c.slug === slug)?.id; }

  const services = [
    {
      title: 'Internship Programs', slug: 'internship-programs', category_id: catId('internship'),
      icon: 'FiBriefcase', short_description: 'Gain real-world experience with our industry-focused internship programs. Work on live projects under expert mentorship.',
      description: 'Our internship programs bridge the gap between academic learning and industry requirements. Students work on real-world projects, gain hands-on experience, and build a professional portfolio. Interns are mentored by industry experts and receive regular feedback to accelerate their learning. Successful interns receive a completion certificate and placement assistance.',
      duration: '3-6 Months', mode: 'Hybrid', price: 14999, discount: 20, badge: 'Popular', difficulty: 'All Levels',
      certificate: true, placement_support: true, internship: true,
      eligibility: 'Students currently enrolled in or graduated from any degree program. Basic understanding of relevant field preferred but not mandatory.',
      learning_outcomes: ["Real-world project experience","Industry mentorship","Professional portfolio","Completion certificate","Placement assistance","Networking opportunities","Stipend for eligible interns","Letter of recommendation"],
      highlights: ["Live project work","Expert mentorship","Flexible timings","Work-from-home option","Stipend available","Certificate on completion"],
      requirements: ["Currently pursuing or completed graduation","Basic knowledge of relevant domain","Strong communication skills","Commitment of minimum 3 months"],
      featured: true, popular: true, trending: true, status: 'published', sort_order: 1
    },
    {
      title: 'Certification Courses', slug: 'certification-courses', category_id: catId('certification'),
      icon: 'FiAward', short_description: 'Industry-recognized certification programs to validate your skills and boost your career prospects.',
      description: 'Our certification courses are designed to validate your expertise in specific domains. Each course includes comprehensive training, hands-on projects, and a final assessment. Upon successful completion, you receive a certification that is recognized by leading companies. The curriculum is regularly updated to align with industry standards and the latest technologies.',
      duration: '2-6 Months', mode: 'Online', price: 19999, discount: 15, badge: 'Trending', difficulty: 'Intermediate',
      certificate: true, placement_support: true,
      eligibility: 'Basic understanding of the subject area. Prior experience or completion of foundational course recommended.',
      learning_outcomes: ["Industry-recognized certification","Comprehensive curriculum","Hands-on projects","Expert instruction","Lifetime access to materials","Community access","Career guidance","Resume building support"],
      highlights: ["Industry recognized","Expert instructors","Flexible schedule","Project-based learning","Career support","Lifetime access"],
      featured: true, popular: true, trending: true, status: 'published', sort_order: 2
    },
    {
      title: 'Online Classes', slug: 'online-classes', category_id: catId('software-learning'),
      icon: 'FiVideo', short_description: 'Learn from anywhere with our interactive online classes. Live sessions, recorded lectures, and hands-on assignments.',
      description: 'Our online classes offer the flexibility to learn from anywhere while maintaining the quality of classroom training. Each course features live interactive sessions with industry experts, recorded lectures for revision, hands-on assignments, and real-time doubt clearing.',
      duration: '1-6 Months', mode: 'Online', price: 9999, discount: 10, badge: 'New', difficulty: 'All Levels',
      certificate: true,
      learning_outcomes: ["Learn from anywhere","Live interactive sessions","Recorded lectures","Hands-on assignments","Doubt clearing sessions","Progress tracking","Certificate on completion","Flexible schedule"],
      highlights: ["Learn from anywhere","Live instruction","Recorded backup","Hands-on practice","Doubt clearing","Certificate included"],
      featured: true, status: 'published', sort_order: 3
    },
    {
      title: 'Offline Classes', slug: 'offline-classes', category_id: catId('software-learning'),
      icon: 'FiMap', short_description: 'Classroom training at our state-of-the-art facility. Face-to-face interaction with instructors and peers.',
      description: 'Our offline classes provide an immersive learning experience at our modern training facility. Students benefit from direct face-to-face interaction with expert instructors, collaborative learning with peers, and access to our computer labs and library.',
      duration: '1-6 Months', mode: 'Offline', price: 14999, discount: 5, difficulty: 'All Levels',
      certificate: true,
      learning_outcomes: ["Face-to-face instruction","Campus access","Lab facilities","Peer learning","Networking events","Workshops & hackathons","Library access","Placement support"],
      highlights: ["Campus-based learning","Direct instructor access","Lab facilities","Peer collaboration","Networking events","Placement support"],
      status: 'published', sort_order: 4
    },
    {
      title: 'Placement Training', slug: 'placement-training', category_id: catId('placement-training'),
      icon: 'FiTrendingUp', short_description: 'Comprehensive placement preparation program covering aptitude, soft skills, technical interviews, and more.',
      description: 'Our placement training program is designed to make you job-ready. We cover everything from aptitude testing and technical interview preparation to soft skills and group discussions.',
      duration: '2-4 Months', mode: 'Hybrid', price: 12999, discount: 25, badge: 'Popular', difficulty: 'All Levels',
      placement_support: true,
      eligibility: 'Final year students or recent graduates. Basic knowledge of your domain is required.',
      learning_outcomes: ["Job-ready skills","Mock interviews","Resume building","Aptitude mastery","Technical preparation","Soft skills enhancement","Company referrals","Placement assistance"],
      highlights: ["Mock interviews","Personalized coaching","Company-specific prep","Resume review","Group discussion practice","Placement support"],
      featured: true, popular: true, status: 'published', sort_order: 5
    },
    {
      title: 'Mock Interviews', slug: 'mock-interviews', category_id: catId('placement-training'),
      icon: 'FiMessageCircle', short_description: 'Practice interviews with industry experts to build confidence and ace your real interviews.',
      description: 'Our mock interview program simulates real interview scenarios to help you prepare effectively. Industry professionals conduct one-on-one mock interviews, provide detailed feedback, and share tips.',
      duration: '1 Month', mode: 'Online', price: 4999, difficulty: 'All Levels',
      eligibility: 'Job seekers preparing for interviews. Relevant experience or education in the target domain.',
      learning_outcomes: ["Real interview experience","Industry expert feedback","Personalized improvement plan","Confidence building","Multiple interview formats","Flexible scheduling","Performance tracking","Company-specific preparation"],
      highlights: ["Industry expert mock interviews","Detailed feedback","Flexible scheduling","Company-specific prep","Performance tracking"],
      status: 'published', sort_order: 6
    },
    {
      title: 'Aptitude Training', slug: 'aptitude-training', category_id: catId('placement-training'),
      icon: 'FiBarChart2', short_description: 'Master quantitative aptitude, logical reasoning, and verbal ability for competitive exams and placements.',
      description: 'Our aptitude training program covers all aspects of aptitude testing including quantitative aptitude, logical reasoning, verbal ability, and data interpretation.',
      duration: '2-3 Months', mode: 'Hybrid', price: 7999, discount: 10, difficulty: 'Beginner',
      eligibility: 'Anyone preparing for competitive exams or placement tests. Basic mathematics knowledge at 10+2 level.',
      learning_outcomes: ["Strong aptitude foundation","Speed & accuracy","Test-taking strategies","Mock test practice","Performance analytics","Confidence building","Time management","Competitive edge"],
      highlights: ["Structured curriculum","Practice drills","Mock tests","Performance tracking","Expert instruction","Flexible schedule"],
      status: 'published', sort_order: 7
    },
    {
      title: 'Corporate Training', slug: 'corporate-training', category_id: catId('corporate-training'),
      icon: 'FiUsers', short_description: 'Tailored training programs for organizations to upskill employees and boost productivity.',
      description: 'Our corporate training programs are customized to meet the specific needs of your organization. We offer training in software development, project management, soft skills, leadership, and more.',
      duration: 'Customizable', mode: 'Hybrid', difficulty: 'All Levels',
      certificate: true,
      eligibility: 'Designed for organizations. Teams of any size can participate. Programs are tailored to skill levels.',
      learning_outcomes: ["Customized curriculum","Expert trainers","Flexible delivery","Team upskilling","Productivity boost","Industry best practices","Certification","Post-training support"],
      highlights: ["Customized programs","Expert trainers","Flexible delivery modes","Hands-on approach","Post-training support"],
      status: 'published', sort_order: 8
    },
    {
      title: 'Software Development Courses', slug: 'software-development-courses', category_id: catId('software-learning'),
      icon: 'FiCode', short_description: 'Comprehensive software development courses covering modern technologies, frameworks, and best practices.',
      description: 'Our software development courses provide end-to-end training in modern programming languages, frameworks, and tools. Our project-based curriculum ensures you gain practical, job-ready skills.',
      duration: '3-6 Months', mode: 'Hybrid', price: 24999, discount: 20, badge: 'Trending', difficulty: 'All Levels',
      certificate: true, placement_support: true, internship: true,
      eligibility: 'Beginners welcome. Intermediate/advanced levels require basic programming knowledge.',
      learning_outcomes: ["Full-stack development skills","Real-world projects","Industry best practices","Portfolio & GitHub","Interview preparation","Certificate","Placement support","Lifetime community access"],
      highlights: ["Project-based learning","Industry mentors","Flexible schedule","Career support","Modern curriculum"],
      featured: true, popular: true, trending: true, status: 'published', sort_order: 9
    },
    {
      title: 'Career Guidance', slug: 'career-guidance', category_id: catId('career-services'),
      icon: 'FiStar', short_description: 'Expert career counseling and guidance to help you make informed career decisions.',
      description: 'Our career guidance service helps students and professionals make informed decisions about their career path through one-on-one counseling sessions, psychometric assessments, and industry insights.',
      duration: 'Customizable', mode: 'Online', price: 4999, badge: 'New', difficulty: 'All Levels',
      eligibility: 'Anyone seeking career guidance - students, graduates, or professionals looking for a career change.',
      learning_outcomes: ["Clarity on career path","Personalized action plan","Industry insights","Confidence building","Skill gap identification","Network building","Ongoing support","Better career decisions"],
      highlights: ["Personalized counseling","Psychometric assessment","Industry insights","Action plan","Follow-up support"],
      status: 'published', sort_order: 10
    },
    {
      title: 'Resume Building', slug: 'resume-building', category_id: catId('career-services'),
      icon: 'FiFileText', short_description: 'Professional resume writing and optimization services to make your application stand out.',
      description: 'Our resume building service helps you create a compelling, ATS-friendly resume that gets noticed by recruiters. We also provide LinkedIn profile optimization and cover letter writing services.',
      duration: '3-7 Days', mode: 'Online', price: 2999, difficulty: 'All Levels',
      learning_outcomes: ["Professional, ATS-friendly resume","LinkedIn optimization","Cover letter","Interview-ready format","Expert feedback","Quick turnaround","Multiple revisions","Format for all platforms"],
      highlights: ["Professional writing","ATS-optimized","Quick delivery","Multiple revisions","LinkedIn profile update","Cover letter included"],
      status: 'published', sort_order: 11
    },
    {
      title: 'Soft Skills Training', slug: 'soft-skills-training', category_id: catId('placement-training'),
      icon: 'FiUsers', short_description: 'Enhance your communication, leadership, and interpersonal skills for professional success.',
      description: 'Our soft skills training program develops essential workplace skills including communication, teamwork, leadership, time management, and emotional intelligence.',
      duration: '1-2 Months', mode: 'Hybrid', price: 5999, difficulty: 'All Levels',
      eligibility: 'Anyone looking to improve their professional and interpersonal skills. No prerequisites.',
      learning_outcomes: ["Improved communication","Leadership skills","Time management","Emotional intelligence","Professional etiquette","Confidence building","Team collaboration","Career readiness"],
      highlights: ["Interactive workshops","Real-world scenarios","Expert trainers","Flexible schedule","Practical exercises"],
      featured: true, status: 'published', sort_order: 12
    },
  ];

  for (const s of services) {
    const { error } = await supabase.from('services').upsert(s, { onConflict: 'slug' });
    if (error) console.error(`  ✗ ${s.title}: ${error.message}`);
    else console.log(`  ✓ ${s.title}`);
  }

  // Seed benefits, steps, testimonials, FAQs, statistics, gallery
  const { data: svcs } = await supabase.from('services').select('id, slug');
  const svcId = (slug) => svcs?.find(s => s.slug === slug)?.id;

  const benefits = [
    { service_id: svcId('internship-programs'), icon: 'FiCode', title: 'Real Projects', description: 'Work on live industry projects that add real value to your portfolio.', sort_order: 1 },
    { service_id: svcId('internship-programs'), icon: 'FiStar', title: 'Expert Mentorship', description: 'Get guidance from experienced industry professionals throughout your internship.', sort_order: 2 },
    { service_id: svcId('internship-programs'), icon: 'FiAward', title: 'Certificate', description: 'Receive a completion certificate and letter of recommendation.', sort_order: 3 },
    { service_id: svcId('internship-programs'), icon: 'FiBriefcase', title: 'Placement Support', description: 'Get priority access to our placement programs after internship completion.', sort_order: 4 },
    { service_id: svcId('internship-programs'), icon: 'FiUsers', title: 'Networking', description: 'Build professional connections with industry experts and fellow interns.', sort_order: 5 },
    { service_id: svcId('internship-programs'), icon: 'FiTrendingUp', title: 'Stipend', description: 'Earn a stipend based on performance during the internship period.', sort_order: 6 },
    { service_id: svcId('certification-courses'), icon: 'FiAward', title: 'Industry Recognition', description: 'Get certified with credentials recognized by top companies.', sort_order: 1 },
    { service_id: svcId('certification-courses'), icon: 'FiBookOpen', title: 'Comprehensive Curriculum', description: 'Thorough coverage of all topics with regular curriculum updates.', sort_order: 2 },
    { service_id: svcId('certification-courses'), icon: 'FiCode', title: 'Hands-on Projects', description: 'Apply your learning through practical projects and assignments.', sort_order: 3 },
    { service_id: svcId('certification-courses'), icon: 'FiVideo', title: 'Flexible Learning', description: 'Self-paced learning with lifetime access to course materials.', sort_order: 4 },
    { service_id: svcId('software-development-courses'), icon: 'FiCode', title: 'Full Stack Skills', description: 'Learn both frontend and backend development with modern technologies.', sort_order: 1 },
    { service_id: svcId('software-development-courses'), icon: 'FiLayers', title: 'Project Portfolio', description: 'Build a strong portfolio with real-world projects.', sort_order: 2 },
    { service_id: svcId('software-development-courses'), icon: 'FiStar', title: 'Industry Mentors', description: 'Learn from experienced software developers and engineers.', sort_order: 3 },
    { service_id: svcId('software-development-courses'), icon: 'FiBriefcase', title: 'Career Support', description: 'Get help with job placement and interview preparation.', sort_order: 4 },
    { service_id: svcId('placement-training'), icon: 'FiTrendingUp', title: 'Job Readiness', description: 'Become completely job-ready with comprehensive preparation.', sort_order: 1 },
    { service_id: svcId('placement-training'), icon: 'FiMessageCircle', title: 'Mock Interviews', description: 'Practice with industry experts through realistic mock interviews.', sort_order: 2 },
    { service_id: svcId('placement-training'), icon: 'FiFileText', title: 'Resume Building', description: 'Get a professional, ATS-optimized resume.', sort_order: 3 },
    { service_id: svcId('placement-training'), icon: 'FiBarChart2', title: 'Aptitude Mastery', description: 'Master quantitative, logical, and verbal aptitude.', sort_order: 4 },
  ];
  await supabase.from('service_benefits').delete().in('service_id', benefits.map(b => b.service_id).filter(Boolean));
  const { error: bErr } = await supabase.from('service_benefits').insert(benefits.filter(b => b.service_id));
  if (bErr) console.error('Benefits error:', bErr.message); else console.log('✓ Service benefits seeded');

  const testimonials = [
    { service_id: svcId('internship-programs'), student_name: 'Priya Sharma', course: 'Full Stack Development', company: 'TechSolutions Pvt Ltd', rating: 5, review: 'The internship program gave me hands-on experience with real projects. I was able to build a strong portfolio and got placed at a top tech company.', sort_order: 1 },
    { service_id: svcId('certification-courses'), student_name: 'Rahul Verma', course: 'Data Science', company: 'DataCraft Analytics', rating: 5, review: 'The certification course was comprehensive and well-structured. The projects helped me understand real-world applications.', sort_order: 1 },
    { service_id: svcId('placement-training'), student_name: 'Vikram Singh', course: 'Placement Training', company: 'GlobalTech Systems', rating: 5, review: 'The placement training program transformed my approach to job interviews. The mock interviews were incredibly realistic.', sort_order: 1 },
    { service_id: svcId('software-development-courses'), student_name: 'Neha Patel', course: 'Software Development', company: 'InnoSoft Solutions', rating: 5, review: 'The software development course was exactly what I needed to transition into tech. Got placed before completing the course!', sort_order: 1 },
  ];
  await supabase.from('service_testimonials').delete().in('service_id', testimonials.map(t => t.service_id).filter(Boolean));
  const { error: tErr } = await supabase.from('service_testimonials').insert(testimonials.filter(t => t.service_id));
  if (tErr) console.error('Testimonials error:', tErr.message); else console.log('✓ Service testimonials seeded');

  const faqs = [
    { service_id: svcId('internship-programs'), question: 'What is the duration of the internship?', answer: 'Our internship programs typically run for 3-6 months depending on the domain and project requirements.', sort_order: 1, is_active: true, category: 'Program Details' },
    { service_id: svcId('internship-programs'), question: 'Is there any stipend?', answer: 'Yes, eligible interns receive a performance-based stipend.', sort_order: 2, is_active: true, category: 'Compensation' },
    { service_id: svcId('internship-programs'), question: 'Will I get a certificate?', answer: 'Yes, upon successful completion of the internship, you will receive a certificate and a letter of recommendation.', sort_order: 3, is_active: true, category: 'Completion' },
    { service_id: svcId('online-classes'), question: 'What if I miss a live class?', answer: 'All live sessions are recorded and made available in your learning dashboard.', sort_order: 1, is_active: true, category: 'Classes' },
    { service_id: svcId('certification-courses'), question: 'Is the certification valid?', answer: 'Yes, our certifications are recognized by industry partners and can be added to your LinkedIn profile.', sort_order: 1, is_active: true, category: 'Certification' },
    { service_id: svcId('placement-training'), question: 'What companies have hired from Marvel Slice?', answer: 'Our students have been placed at 500+ companies including TCS, Infosys, Wipro, Accenture, Amazon, and many more.', sort_order: 1, is_active: true, category: 'Placement' },
  ];
  await supabase.from('service_faqs').delete().in('service_id', faqs.map(f => f.service_id).filter(Boolean));
  const { error: fErr } = await supabase.from('service_faqs').insert(faqs.filter(f => f.service_id));
  if (fErr) console.error('FAQs error:', fErr.message); else console.log('✓ Service FAQs seeded');

  console.log('\n✓ Services seeding complete!');
}

async function seedTraining() {
  console.log('\n=== Seeding Training ===\n');

  const categories = [
    { name: 'Student Development', slug: 'student-development', icon: 'FiUsers', description: 'Holistic development programs for students', sort_order: 1, status: true },
    { name: 'Placement Training', slug: 'training-placement', icon: 'FiTrendingUp', description: 'Job placement preparation programs', sort_order: 2, status: true },
    { name: 'Communication Skills', slug: 'communication-skills', icon: 'FiMessageCircle', description: 'Enhance verbal and written communication', sort_order: 3, status: true },
    { name: 'Soft Skills', slug: 'soft-skills', icon: 'FiHeart', description: 'Essential soft skills for professional success', sort_order: 4, status: true },
    { name: 'Career Development', slug: 'career-development', icon: 'FiStar', description: 'Career planning and growth programs', sort_order: 5, status: true },
    { name: 'Interview Preparation', slug: 'interview-preparation', icon: 'FiTarget', description: 'Complete interview readiness training', sort_order: 6, status: true },
    { name: 'Corporate Skills', slug: 'corporate-skills', icon: 'FiBriefcase', description: 'Skills needed in corporate environments', sort_order: 7, status: true },
    { name: 'Professional Development', slug: 'professional-development', icon: 'FiAward', description: 'Professional skill enhancement programs', sort_order: 8, status: true },
    { name: 'Personality Development', slug: 'personality-development', icon: 'FiZap', description: 'Build confidence and personality', sort_order: 9, status: true },
    { name: 'Leadership Training', slug: 'leadership-training', icon: 'FiGlobe', description: 'Leadership and management skills', sort_order: 10, status: true },
  ];

  const { error: catErr } = await supabase.from('training_categories').upsert(categories, { onConflict: 'slug' });
  if (catErr) { console.error('Training category error:', catErr.message); return; }
  console.log('✓ Training categories seeded');

  const { data: tcats } = await supabase.from('training_categories').select('id, slug');
  const tcatId = (slug) => tcats?.find(c => c.slug === slug)?.id;

  const programs = [
    {
      title: 'Student Skill Development', slug: 'student-skill-development', category_id: tcatId('student-development'),
      icon: 'FiUsers', short_description: 'Comprehensive skill development program designed to prepare students for academic and professional success.',
      description: 'Our Student Skill Development program bridges the gap between academic learning and industry expectations. Through a structured approach, students develop essential skills including communication, leadership, problem-solving, and workplace readiness.',
      duration: '3 Months', mode: 'Hybrid', difficulty: 'Beginner', badge: 'Popular',
      certificate: true, featured: true, popular: true, trending: true, status: 'published', sort_order: 1,
      eligibility: 'High school and college students looking to build foundational professional skills.',
      learning_outcomes: ["Enhanced communication skills","Leadership abilities","Problem-solving mindset","Workplace readiness","Confidence building","Team collaboration skills","Time management mastery","Professional etiquette"],
      placement_support: 'Get priority access to our placement preparation programs upon successful completion.',
      assessment: 'Weekly quizzes, mid-term project, final presentation, participation evaluation'
    },
    {
      title: 'Communication Skills', slug: 'training-communication', category_id: tcatId('communication-skills'),
      icon: 'FiMessageCircle', short_description: 'Master the art of effective communication for professional and personal success.',
      description: 'Effective communication is the cornerstone of professional success. This program covers verbal, non-verbal, written, and digital communication skills through practical exercises and role-playing.',
      duration: '2 Months', mode: 'Hybrid', difficulty: 'Beginner', badge: 'Best Seller',
      certificate: true, featured: true, popular: true, trending: true, status: 'published', sort_order: 2,
      eligibility: 'Anyone looking to improve their communication skills. No prerequisites.',
      learning_outcomes: ["Clear verbal expression","Active listening skills","Professional writing ability","Presentation confidence","Persuasive communication","Cross-cultural sensitivity"],
      placement_support: 'Strong communication skills enhance placement prospects.',
      assessment: 'Communication assessments, presentation projects, written assignments'
    },
    {
      title: 'Soft Skills Development', slug: 'training-soft-skills', category_id: tcatId('soft-skills'),
      icon: 'FiHeart', short_description: 'Develop essential soft skills that employers value most for career success.',
      description: 'Soft skills are the differentiator in today\'s competitive job market. This program focuses on developing interpersonal skills, emotional intelligence, adaptability, and professional behavior.',
      duration: '2 Months', mode: 'Hybrid', difficulty: 'Beginner', badge: 'Popular',
      certificate: true, featured: true, trending: true, status: 'published', sort_order: 3,
      eligibility: 'Open to all. Ideal for students and professionals seeking to enhance their interpersonal skills.',
      learning_outcomes: ["Emotional intelligence","Adaptability and resilience","Professional relationships","Conflict resolution","Empathy and understanding","Positive mindset"],
      assessment: 'Self-assessments, group activities, role-play evaluations, final project presentation'
    },
    {
      title: 'Placement Preparation', slug: 'training-placement-prep', category_id: tcatId('training-placement'),
      icon: 'FiTrendingUp', short_description: 'Complete placement preparation program covering aptitude, interviews, and professional skills.',
      description: 'Our comprehensive Placement Preparation program is designed to make you job-ready. From aptitude training and technical preparation to mock interviews and soft skills, every aspect of the placement process is covered.',
      duration: '3 Months', mode: 'Hybrid', difficulty: 'Intermediate', badge: 'Best Seller',
      certificate: true, featured: true, popular: true, trending: true, status: 'published', sort_order: 4,
      eligibility: 'Final year students and recent graduates preparing for campus placements and job interviews.',
      learning_outcomes: ["Crack any aptitude test","Excel in group discussions","Ace technical interviews","Master HR interviews","Build a standout resume","Confident presentation"],
      placement_support: 'Direct placement support with 500+ partner companies. Resume referrals and interview coordination provided.',
      assessment: 'Weekly mock tests, group discussion evaluations, mock interview rounds, final assessment'
    },
    {
      title: 'Interview Skills', slug: 'training-interview-skills', category_id: tcatId('interview-preparation'),
      icon: 'FiTarget', short_description: 'Master interview techniques and build the confidence to ace any job interview.',
      description: 'This focused program covers every aspect of interview preparation. From understanding interview formats to handling tricky questions, participants gain the skills and confidence needed to make a lasting impression.',
      duration: '1 Month', mode: 'Online', difficulty: 'Intermediate', badge: 'Popular',
      featured: true, status: 'published', sort_order: 5,
      eligibility: 'Job seekers and students preparing for upcoming interviews.',
      learning_outcomes: ["Understand interview formats","Answer questions confidently","Handle pressure situations","Build instant rapport","Showcase achievements effectively","Negotiate offers"],
      assessment: 'Multiple mock interview rounds with detailed scoring and feedback'
    },
    {
      title: 'Resume Building', slug: 'training-resume-building', category_id: tcatId('career-development'),
      icon: 'FiFileText', short_description: 'Create a powerful, ATS-friendly resume that gets you noticed by recruiters.',
      description: 'Your resume is your first impression. This program teaches you how to create a compelling resume that stands out. From formatting and content to ATS optimization and LinkedIn alignment.',
      duration: '2 Weeks', mode: 'Online', difficulty: 'Beginner', badge: 'New',
      popular: true, trending: true, status: 'published', sort_order: 6,
      learning_outcomes: ["Create ATS-optimized resume","Write compelling summaries","Highlight achievements effectively","Optimize LinkedIn profile","Tailor resumes for each job","Format professionally"],
      placement_support: 'An optimized resume increases interview calls by 60%. We refer well-prepared candidates to hiring partners.',
      assessment: 'Final resume submission and review, LinkedIn profile assessment'
    },
    {
      title: 'Aptitude Training', slug: 'training-aptitude', category_id: tcatId('training-placement'),
      icon: 'FiBarChart2', short_description: 'Comprehensive aptitude training to crack placement tests and competitive exams.',
      description: 'Master quantitative aptitude, logical reasoning, and verbal ability through our structured training program. With concept sessions, practice drills, and full-length mock tests.',
      duration: '2 Months', mode: 'Hybrid', difficulty: 'Intermediate', badge: 'Popular',
      popular: true, status: 'published', sort_order: 7,
      eligibility: 'Students preparing for placement tests, competitive exams, or aptitude assessments.',
      learning_outcomes: ["Master quantitative aptitude","Excel in logical reasoning","Improve verbal ability","Solve data interpretation","Build calculation speed","Develop test strategy"],
      assessment: 'Weekly sectional tests, full-length mock tests, performance analysis reports'
    },
    {
      title: 'Personality Development', slug: 'training-personality', category_id: tcatId('personality-development'),
      icon: 'FiZap', short_description: 'Transform your personality to make a powerful and lasting impression in every situation.',
      description: 'Personality development goes beyond external appearance. This program focuses on holistic growth including confidence building, communication style, attitude, and professional presence.',
      duration: '2 Months', mode: 'Hybrid', difficulty: 'Beginner', badge: 'Popular',
      certificate: true, trending: true, status: 'published', sort_order: 8,
      learning_outcomes: ["Build unshakable confidence","Develop positive mindset","Improve personal presence","Master social etiquette","Handle pressure gracefully","Build authentic relationships"],
      assessment: 'Self-assessments, presentation tasks, role-play evaluations, final personality showcase'
    },
    {
      title: 'Leadership Skills', slug: 'training-leadership', category_id: tcatId('leadership-training'),
      icon: 'FiGlobe', short_description: 'Develop authentic leadership skills to inspire teams and drive results.',
      description: 'Leadership is not about titles but about influence and impact. This program develops authentic leadership skills including vision-setting, team motivation, decision-making, and effective delegation.',
      duration: '2 Months', mode: 'Hybrid', difficulty: 'Intermediate', badge: 'Best Seller',
      certificate: true, featured: true, trending: true, status: 'published', sort_order: 9,
      learning_outcomes: ["Develop leadership vision","Motivate and inspire teams","Make effective decisions","Delegate and empower","Resolve conflicts","Drive change"],
      assessment: 'Leadership simulation exercises, team project, 360-degree feedback assessment'
    },
    {
      title: 'Public Speaking', slug: 'training-public-speaking', category_id: tcatId('communication-skills'),
      icon: 'FiGlobe', short_description: 'Overcome stage fear and become a confident, engaging public speaker.',
      description: 'Public speaking is a critical skill for professional success. This program helps participants overcome stage fear, structure compelling presentations, and deliver with confidence.',
      duration: '1 Month', mode: 'Online', difficulty: 'Beginner', badge: 'New',
      trending: true, status: 'published', sort_order: 10,
      learning_outcomes: ["Overcome stage fear","Structure presentations","Engage audiences","Use voice effectively","Handle Q&A confidently","Use visual aids"],
      assessment: 'Multiple practice presentations, final speech delivery, peer and expert evaluations'
    },
    {
      title: 'Workplace Readiness', slug: 'training-workplace', category_id: tcatId('student-development'),
      icon: 'FiBriefcase', short_description: 'Be fully prepared for your first job with essential workplace skills and knowledge.',
      description: 'Transitioning from college to corporate can be challenging. This comprehensive program prepares students for the workplace by covering professional expectations, workplace culture, and career management.',
      duration: '2 Months', mode: 'Hybrid', difficulty: 'Beginner', badge: 'Popular',
      certificate: true, featured: true, popular: true, status: 'published', sort_order: 11,
      eligibility: 'College students in their final year or recent graduates preparing to enter the workforce.',
      learning_outcomes: ["Understand workplace culture","Communicate professionally","Manage workplace relationships","Handle responsibilities","Navigate office politics","Build professional network"],
      placement_support: 'Direct placement support with our partner companies. Workplace-ready candidates preferred.',
      assessment: 'Workplace simulation exercises, professional conduct assessment, final career readiness evaluation'
    },
    {
      title: 'Career Guidance', slug: 'training-career-guidance', category_id: tcatId('career-development'),
      icon: 'FiStar', short_description: 'Get personalized career guidance to make informed decisions about your professional future.',
      description: 'Choosing the right career path is one of the most important decisions you will make. Our career guidance program provides personalized counseling, psychometric assessments, and industry insights.',
      duration: 'Customizable', mode: 'Online', difficulty: 'All Levels', badge: 'Popular',
      popular: true, status: 'published', sort_order: 12,
      learning_outcomes: ["Identify career strengths","Explore career options","Create career roadmap","Build professional network","Develop job search strategy","Make informed decisions"],
      assessment: 'Career assessment analysis, personalized roadmap creation, follow-up sessions'
    },
    {
      title: 'Teamwork & Collaboration', slug: 'training-teamwork', category_id: tcatId('professional-development'),
      icon: 'FiUsers', short_description: 'Master the art of collaboration to achieve exceptional results through teamwork.',
      description: 'In today\'s interconnected workplace, the ability to collaborate effectively is essential. This program develops teamwork skills including role clarity, communication, and conflict resolution.',
      duration: '1 Month', mode: 'Hybrid', difficulty: 'Beginner', status: 'published', sort_order: 13,
      learning_outcomes: ["Understand team dynamics","Communicate effectively","Resolve team conflicts","Collaborate on projects","Build team trust","Leverage diverse strengths"],
      assessment: 'Team project evaluation, peer assessments, facilitator feedback'
    },
    {
      title: 'Time Management', slug: 'training-time-mgmt', category_id: tcatId('professional-development'),
      icon: 'FiClock', short_description: 'Master time management techniques to boost productivity and reduce stress.',
      description: 'Effective time management is the key to productivity and work-life balance. This program teaches proven techniques including prioritization, planning, delegation, and focus management.',
      duration: '2 Weeks', mode: 'Online', difficulty: 'Beginner', status: 'published', sort_order: 14,
      learning_outcomes: ["Prioritize tasks effectively","Plan daily/weekly schedules","Overcome procrastination","Manage distractions","Set SMART goals","Use productivity tools"],
      assessment: 'Time audit analysis, productivity challenge, final action plan review'
    },
    {
      title: 'Presentation Skills', slug: 'training-presentation', category_id: tcatId('communication-skills'),
      icon: 'FiMonitor', short_description: 'Create and deliver powerful presentations that captivate and persuade audiences.',
      description: 'Whether presenting to a small team or a large audience, the ability to communicate ideas effectively is crucial. This program covers presentation design, storytelling, visual aids, and delivery.',
      duration: '3 Weeks', mode: 'Hybrid', difficulty: 'Intermediate',
      certificate: true, status: 'published', sort_order: 15,
      learning_outcomes: ["Design compelling presentations","Tell stories effectively","Use visual aids strategically","Engage audiences","Handle Q&A confidently","Present data clearly"],
      assessment: 'Multiple presentation rounds with expert evaluation and feedback'
    },
    {
      title: 'Critical Thinking', slug: 'training-critical-thinking', category_id: tcatId('professional-development'),
      icon: 'FiLayers', short_description: 'Develop critical thinking skills to analyze problems and make better decisions.',
      description: 'Critical thinking is one of the most sought-after skills in the modern workplace. This program develops analytical thinking, logical reasoning, and decision-making abilities.',
      duration: '1 Month', mode: 'Online', difficulty: 'Intermediate', status: 'published', sort_order: 16,
      learning_outcomes: ["Analyze problems systematically","Evaluate arguments logically","Identify biases","Make data-driven decisions","Think creatively","Question assumptions"],
      assessment: 'Case study analysis, problem-solving exercises, final analytical project'
    },
    {
      title: 'Problem Solving', slug: 'training-problem-solving', category_id: tcatId('professional-development'),
      icon: 'FiCode', short_description: 'Master structured problem-solving techniques to tackle any challenge effectively.',
      description: 'Problem-solving is an essential skill in every profession. This program teaches structured approaches including design thinking, root cause analysis, and creative problem-solving.',
      duration: '1 Month', mode: 'Hybrid', difficulty: 'Intermediate',
      certificate: true, status: 'published', sort_order: 17,
      learning_outcomes: ["Apply structured problem-solving","Use design thinking","Conduct root cause analysis","Generate creative solutions","Evaluate options effectively","Implement solutions"],
      assessment: 'Problem-solving exercises, case study analysis, final project presentation'
    },
    {
      title: 'Email & Business Communication', slug: 'training-email-comm', category_id: tcatId('corporate-skills'),
      icon: 'FiMail', short_description: 'Master professional email writing and business communication for workplace success.',
      description: 'Professional communication, especially email, is a critical workplace skill. This program covers email etiquette, business correspondence, report writing, and professional messaging.',
      duration: '2 Weeks', mode: 'Online', difficulty: 'Beginner', badge: 'New',
      trending: true, status: 'published', sort_order: 18,
      learning_outcomes: ["Write clear professional emails","Master email etiquette","Structure business documents","Communicate across platforms","Handle difficult conversations","Write reports"],
      assessment: 'Writing assignments, email drafting exercises, final business document submission'
    },
    {
      title: 'Corporate Etiquette', slug: 'training-corp-etiquette', category_id: tcatId('corporate-skills'),
      icon: 'FiBriefcase', short_description: 'Learn the unwritten rules of corporate behavior and professional conduct.',
      description: 'Corporate etiquette is essential for building professional relationships and advancing your career. This program covers meeting etiquette, dining etiquette, dress code, and cross-cultural behavior.',
      duration: '2 Weeks', mode: 'Online', difficulty: 'Beginner', status: 'published', sort_order: 19,
      learning_outcomes: ["Demonstrate professional etiquette","Navigate corporate culture","Handle meetings professionally","Practice proper dining etiquette","Dress appropriately","Interact with senior professionals"],
      assessment: 'Etiquette demonstrations, role-play evaluations, final professional conduct assessment'
    },
    {
      title: 'Group Discussion Training', slug: 'training-gd', category_id: tcatId('interview-preparation'),
      icon: 'FiUsers', short_description: 'Master the art of group discussion with confidence, structure, and impact.',
      description: 'Group discussions are a critical part of the selection process. This program trains participants to express ideas clearly, listen actively, and contribute meaningfully.',
      duration: '3 Weeks', mode: 'Online', difficulty: 'Beginner', status: 'published', sort_order: 20,
      learning_outcomes: ["Initiate discussions confidently","Structure arguments logically","Listen and respond effectively","Handle counterpoints","Demonstrate leadership","Summarize effectively"],
      assessment: 'Multiple mock GD sessions with expert evaluation and feedback reports'
    },
  ];

  for (const p of programs) {
    const { error } = await supabase.from('training_programs').upsert(p, { onConflict: 'slug' });
    if (error) console.error(`  ✗ ${p.title}: ${error.message}`);
    else console.log(`  ✓ ${p.title}`);
  }

  // Seed testimonials
  const { data: tprogs } = await supabase.from('training_programs').select('id, slug');
  const tprogId = (slug) => tprogs?.find(p => p.slug === slug)?.id;

  const testimonials = [
    { training_id: tprogId('training-placement-prep'), student_name: 'Priya Sharma', college: 'Delhi University', company: 'TCS', rating: 5, review: 'The placement preparation program was incredible. The mock interviews and aptitude training helped me crack TCS with ease.', sort_order: 1 },
    { training_id: tprogId('training-communication'), student_name: 'Rahul Verma', college: 'Mumbai University', company: 'Infosys', rating: 4, review: 'The communication skills program transformed my confidence. I can now present ideas clearly and handle interviews with ease.', sort_order: 1 },
    { training_id: tprogId('training-soft-skills'), student_name: 'Ananya Gupta', college: 'Pune University', company: 'Amazon', rating: 5, review: 'Soft skills development at Marvel Slice was a game-changer. The trainers are experts and the curriculum is very practical.', sort_order: 1 },
    { training_id: tprogId('training-leadership'), student_name: 'Vikram Singh', college: 'BITS Pilani', company: 'Microsoft', rating: 5, review: 'The leadership skills program helped me become a better team lead. I still use the frameworks I learned here.', sort_order: 1 },
  ];
  await supabase.from('training_testimonials').delete().in('training_id', testimonials.map(t => t.training_id).filter(Boolean));
  const { error: ttErr } = await supabase.from('training_testimonials').insert(testimonials.filter(t => t.training_id));
  if (ttErr) console.error('Training testimonials error:', ttErr.message); else console.log('✓ Training testimonials seeded');

  const faqs = [
    { training_id: tprogId('student-skill-development'), question: 'What is the duration of the training program?', answer: 'Program durations vary from 2 weeks to 3 months depending on the specific program.', sort_order: 1, is_active: true, category: 'Program Details' },
    { training_id: tprogId('student-skill-development'), question: 'Is this program online or offline?', answer: 'We offer both modes. Most programs are hybrid, allowing you to attend in-person or online.', sort_order: 2, is_active: true, category: 'Mode' },
    { training_id: tprogId('training-placement-prep'), question: 'Is there placement support?', answer: 'Yes, our top performers get placement assistance and referrals to our 500+ partner companies.', sort_order: 1, is_active: true, category: 'Placement' },
  ];
  await supabase.from('training_faqs').delete().in('training_id', faqs.map(f => f.training_id).filter(Boolean));
  const { error: tfErr } = await supabase.from('training_faqs').insert(faqs.filter(f => f.training_id));
  if (tfErr) console.error('Training FAQs error:', tfErr.message); else console.log('✓ Training FAQs seeded');

  console.log('\n✓ Training seeding complete!');
}

async function main() {
  console.log('=== Marvel Slice Data Seeder ===\n');
  console.log('Make sure you have run the schema SQL files first:');
  console.log('  services-schema.sql');
  console.log('  training-schema.sql');

  await seedServices();
  await seedTraining();
  console.log('\n=== All seeding complete! ===');
}

main().catch(console.error);
