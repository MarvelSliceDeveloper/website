import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiStar, FiTrendingUp, FiZap, FiClock, FiMonitor,
  FiBookOpen, FiTarget, FiUsers, FiAward, FiCode,
  FiGlobe, FiCalendar, FiRefreshCw, FiMessageSquare,
  FiChevronLeft, FiChevronRight, FiArrowRight,
  FiMapPin, FiPlus, FiMinus, FiBriefcase, FiBarChart2,
  FiEdit3, FiHeart, FiCamera, FiThumbsUp, FiFileText,
  FiUserCheck, FiCpu, FiLifeBuoy, FiCheckCircle,
  FiCrosshair, FiCompass, FiTool, FiLock, FiLayers,
} from 'react-icons/fi';
import { supabase } from '../lib/supabaseClient';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import { usePublishedTraining } from '../hooks/useTraining';
import { staggerContainer, staggerItem } from '../lib/motion';

const WHY_CHOOSE = [
  {
    icon: FiUsers,
    title: 'Industry Mentors',
    description: 'Learn from experienced professionals who bring real-world insights and practical knowledge to every session.',
  },
  {
    icon: FiCode,
    title: 'Practical Activities',
    description: 'Engage in hands-on exercises, role plays, and real-world simulations that reinforce your learning.',
  },
  {
    icon: FiUserCheck,
    title: 'Mock Interviews',
    description: 'Practice with industry-standard mock interviews that prepare you for real hiring processes.',
  },
  {
    icon: FiMessageSquare,
    title: 'Interactive Sessions',
    description: 'Participate in dynamic group discussions, debates, and collaborative learning activities.',
  },
  {
    icon: FiEdit3,
    title: 'Individual Feedback',
    description: 'Receive personalized feedback and one-on-one coaching to accelerate your improvement.',
  },
  {
    icon: FiBriefcase,
    title: 'Placement Assistance',
    description: 'Get dedicated support with job placement, including referrals and career counseling.',
  },
  {
    icon: FiGlobe,
    title: 'Real Corporate Scenarios',
    description: 'Work on case studies and projects derived from actual corporate environments and challenges.',
  },
  {
    icon: FiCompass,
    title: 'Career Guidance',
    description: 'Receive expert advice on career paths, goal setting, and professional development strategies.',
  },
  {
    icon: FiBookOpen,
    title: 'Industry-Oriented Curriculum',
    description: 'Our curriculum is designed in collaboration with industry experts to meet current market demands.',
  },
  {
    icon: FiCalendar,
    title: 'Flexible Learning',
    description: 'Choose from weekday, weekend, online, or offline batches to fit your schedule perfectly.',
  },
];

const SKILLS = [
  { icon: FiMessageSquare, title: 'Professional Communication' },
  { icon: FiAward, title: 'Leadership' },
  { icon: FiThumbsUp, title: 'Confidence Building' },
  { icon: FiMonitor, title: 'Presentation Skills' },
  { icon: FiUserCheck, title: 'Interview Confidence' },
  { icon: FiFileText, title: 'Resume Writing' },
  { icon: FiUsers, title: 'Team Collaboration' },
  { icon: FiCpu, title: 'Problem Solving' },
  { icon: FiCrosshair, title: 'Critical Thinking' },
  { icon: FiLock, title: 'Workplace Ethics' },
  { icon: FiHeart, title: 'Emotional Intelligence' },
  { icon: FiTarget, title: 'Decision Making' },
];

const TIMELINE_STEPS = [
  { number: '01', title: 'Registration', description: 'Sign up for your chosen program and complete the enrollment process online or at our center.', icon: FiEdit3 },
  { number: '02', title: 'Skill Assessment', description: 'Undergo a comprehensive evaluation to identify your strengths, gaps, and learning needs.', icon: FiTarget },
  { number: '03', title: 'Interactive Training', description: 'Participate in engaging sessions led by industry experts with real-world scenarios.', icon: FiMonitor },
  { number: '04', title: 'Assignments', description: 'Complete practical assignments designed to reinforce concepts and build confidence.', icon: FiBookOpen },
  { number: '05', title: 'Mock Interviews', description: 'Practice with simulated interviews that mirror real corporate hiring processes.', icon: FiUserCheck },
  { number: '06', title: 'Final Assessment', description: 'Demonstrate your skills through a comprehensive final evaluation and project submission.', icon: FiAward },
  { number: '07', title: 'Placement Preparation', description: 'Get resume reviews, aptitude training, and direct referrals to our hiring partners.', icon: FiBriefcase },
  { number: '08', title: 'Career Support', description: 'Receive ongoing career guidance, alumni network access, and lifelong learning resources.', icon: FiLifeBuoy },
];

const BENEFITS = [
  { icon: FiUsers, title: 'Industry Experts', description: 'Learn from seasoned professionals with years of corporate experience.' },
  { icon: FiMonitor, title: 'Live Sessions', description: 'Attend live interactive classes with real-time doubt clearing.' },
  { icon: FiCamera, title: 'Recorded Classes', description: 'Access recorded sessions for revision and flexible learning.' },
  { icon: FiTool, title: 'Hands-on Activities', description: 'Practice with real-world exercises and simulations.' },
  { icon: FiBarChart2, title: 'Weekly Assessments', description: 'Track your progress with regular quizzes and evaluations.' },
  { icon: FiLifeBuoy, title: 'Career Mentoring', description: 'Get personalized guidance from career mentors.' },
  { icon: FiUserCheck, title: 'Mock Interviews', description: 'Build confidence with industry-standard mock interviews.' },
  { icon: FiFileText, title: 'Resume Reviews', description: 'Get your resume polished by HR professionals.' },
  { icon: FiAward, title: 'Certification', description: 'Earn recognized certificates upon successful completion.' },
  { icon: FiBriefcase, title: 'Placement Assistance', description: 'Receive job referrals and placement support.' },
];

const PLACEMENT = [
  { icon: FiFileText, title: 'Resume Building', description: 'Craft a professional resume that highlights your strengths and catches recruiters attention.' },
  { icon: FiCheckCircle, title: 'ATS Resume Review', description: 'Ensure your resume passes Applicant Tracking Systems with optimized formatting and keywords.' },
  { icon: FiUsers, title: 'Mock HR Interview', description: 'Practice common HR questions and learn how to present yourself confidently.' },
  { icon: FiCode, title: 'Technical Interview Guidance', description: 'Prepare for technical rounds with subject-specific coaching and problem-solving practice.' },
  { icon: FiMessageSquare, title: 'Group Discussion Practice', description: 'Develop effective communication skills for group discussions and panel interviews.' },
  { icon: FiBarChart2, title: 'Aptitude Preparation', description: 'Sharpen your quantitative, logical, and verbal reasoning skills for aptitude tests.' },
  { icon: FiGlobe, title: 'LinkedIn Profile Optimization', description: 'Build a compelling LinkedIn profile that attracts recruiters and showcases your brand.' },
  { icon: FiCamera, title: 'Portfolio Guidance', description: 'Create a standout portfolio that demonstrates your projects, skills, and achievements.' },
];

const DEFAULT_STATS = [
  { label: 'Students Trained', value: 15000, suffix: '+' },
  { label: 'Mock Interviews Conducted', value: 8500, suffix: '+' },
  { label: 'Placement Success Rate', value: 92, suffix: '%' },
  { label: 'Hiring Partners', value: 350, suffix: '+' },
  { label: 'Certificates Issued', value: 12000, suffix: '+' },
  { label: 'Expert Trainers', value: 75, suffix: '+' },
];

const DEFAULT_TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    college: 'MIT World Peace University',
    program: 'Professional Communication',
    review: 'The training program completely transformed my confidence. I went from being nervous in conversations to leading team meetings with ease. The mock interviews were incredibly helpful.',
    rating: 5,
    photo: '',
  },
  {
    name: 'Rahul Verma',
    college: 'Pune Institute of Technology',
    program: 'Leadership Development',
    review: 'The leadership training gave me the tools I needed to step into a management role. The practical exercises and real corporate scenarios were invaluable.',
    rating: 5,
    photo: '',
  },
  {
    name: 'Ananya Patel',
    college: 'Delhi University',
    program: 'Interview Preparation',
    review: 'I was struggling with interview anxiety. After this program, I cracked three interviews and landed my dream job. The one-on-one feedback made all the difference.',
    rating: 5,
    photo: '',
  },
  {
    name: 'Vikram Singh',
    college: 'BITS Pilani',
    program: 'Corporate Readiness',
    review: 'Excellent program that bridges the gap between academia and industry. The placement assistance and resume review were top-notch.',
    rating: 4,
    photo: '',
  },
  {
    name: 'Neha Gupta',
    college: 'Christ University',
    program: 'Soft Skills Mastery',
    review: 'The soft skills training was comprehensive and practical. I now feel confident presenting to senior leadership and collaborating across teams.',
    rating: 5,
    photo: '',
  },
];

const DEFAULT_FAQS = [
  { question: 'Who are these training programs for?', answer: 'Our training programs are designed for students, fresh graduates, and working professionals who want to enhance their soft skills, communication abilities, and corporate readiness.' },
  { question: 'Are the programs available online?', answer: 'Yes! We offer flexible training modes — online, offline, and hybrid — so you can learn in the way that suits you best.' },
  { question: 'How long are the training programs?', answer: 'Program durations vary depending on the course. Typically, they range from 4 to 16 weeks, with both fast-track and regular-paced options available.' },
  { question: 'Do you provide placement assistance?', answer: 'Absolutely. Our dedicated placement cell provides resume building, mock interviews, aptitude training, and direct referrals to our network of hiring partners.' },
  { question: 'Will I receive a certificate?', answer: 'Yes, upon successful completion of the program and assessments, you will receive an industry-recognized certificate from Marvel Slice Academy.' },
  { question: 'Can I switch between online and offline modes?', answer: 'Yes, our hybrid programs allow you to seamlessly switch between online and offline modes based on your convenience.' },
  { question: 'What is the class size?', answer: 'We maintain small batch sizes to ensure personalized attention. Typically, batches have 15-20 students for an optimal learning experience.' },
];

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    if (!ref.current || counted.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}{suffix}
    </span>
  );
}

function Badge({ children, variant = 'orange' }) {
  const colors = {
    orange: 'bg-brand-orange text-white',
    blue: 'bg-brand-blue text-white',
    green: 'bg-green-500 text-white',
  };
  return (
    <span className={`absolute top-3 left-3 z-10 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors[variant] || colors.orange}`}>
      {children}
    </span>
  );
}

const DIFFICULTY_COLORS = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
  'All Levels': 'bg-purple-100 text-purple-700',
};

function TrainingCard({ program, featured = false }) {
  const hasImage = program.thumbnail;
  const badges = [];
  if (program.featured) badges.push({ label: 'Featured', variant: 'blue' });
  if (program.trending) badges.push({ label: 'Trending', variant: 'orange' });
  if (program.popular) badges.push({ label: 'Popular', variant: 'green' });
  const diffColor = DIFFICULTY_COLORS[program.difficulty] || 'bg-gray-100 text-gray-600';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 ${featured ? 'lg:col-span-2' : ''}`}
    >
      <div className="relative overflow-hidden">
        {hasImage ? (
          <img
            src={program.thumbnail}
            alt={program.title}
            className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-brand-blue/20 via-brand-orange/10 to-brand-blue/30 flex items-center justify-center">
            <FiLayers className="w-12 h-12 text-brand-orange/40" />
          </div>
        )}
        {badges.map((b, i) => (
          <Badge key={i} variant={b.variant}>{b.label}</Badge>
        ))}
        <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <FiMonitor className="w-5 h-5 text-brand-orange" />
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-[#175cdd] group-hover:text-brand-orange transition-colors line-clamp-1">
          {program.title}
        </h3>
        {program.description && (
          <p className="text-[#333333] text-sm mt-2 line-clamp-2 leading-relaxed">
            {program.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {program.duration && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              <FiClock className="w-3 h-3" />
              {program.duration}
            </span>
          )}
          {program.mode && (
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              <FiMonitor className="w-3 h-3" />
              {program.mode}
            </span>
          )}
        </div>
        {program.difficulty && (
          <div className="mt-3">
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${diffColor}`}>
              {program.difficulty}
            </span>
          </div>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <Link
            to={`/training/${program.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange group/link hover:text-brand-orange/80 transition-colors"
          >
            Learn More
            <FiArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }, (_, i) => (
          <FiStar
            key={i}
            className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-[#333333] text-sm leading-relaxed flex-1 italic">
        &ldquo;{testimonial.review}&rdquo;
      </p>
      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
          {testimonial.photo ? (
            <img src={testimonial.photo} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)
          )}
        </div>
        <div>
          <p className="font-semibold text-[#175cdd] text-sm">{testimonial.name}</p>
          <p className="text-gray-400 text-xs">{testimonial.program}{testimonial.college ? ` · ${testimonial.college}` : ''}</p>
        </div>
      </div>
    </div>
  );
}

export default function TrainingPage() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const testimonialInterval = useRef(null);

  const { data: training, isLoading, error } = usePublishedTraining();
  const featuredTraining = usePublishedTraining({ featured: true });

  const { data: pageData } = useQuery({
    queryKey: ['trainingPage', 'nav_pages'],
    queryFn: async () => {
      try {
        const { data: navItems } = await supabase
          .from('nav_items')
          .select('id')
          .eq('path', '/training')
          .eq('is_active', true)
          .limit(1);
        const navItem = navItems?.[0];
        if (!navItem) return {};
        const { data: pages } = await supabase
          .from('nav_pages')
          .select('*')
          .eq('nav_item_id', navItem.id)
          .eq('is_published', true)
          .limit(1);
        const page = pages?.[0];
        if (!page) return {};
        const sections = page.sections || [];
        const heroSec = sections.find(s => s.section_type === 'hero');
        return {
          hero_heading: heroSec?.heading || page.heading || 'Our Training Programs',
          hero_subheading: heroSec?.subheading || page.subheading || '',
          hero_description: heroSec?.description || page.description || '',
          hero_image: heroSec?.image || page.hero_image || '',
          cta_text: heroSec?.cta_text || 'Join Training',
          cta_link: heroSec?.cta_link || '#training-grid',
          secondary_cta_text: heroSec?.secondary_cta_text || 'Book Free Demo',
          secondary_cta_link: heroSec?.secondary_cta_link || '/contact',
        };
      } catch {
        return {};
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const hero = pageData || {};
  const trainingList = training || [];
  const featuredList = featuredTraining.data || [];
  const testimonials = DEFAULT_TESTIMONIALS;
  const timersPerView = 3;

  const totalTestimonialSlides = Math.ceil(testimonials.length / timersPerView);
  const maxTestimonialIdx = Math.max(0, totalTestimonialSlides - 1);

  const nextTestimonial = useCallback(() => {
    setTestimonialIdx(prev => (prev >= maxTestimonialIdx ? 0 : prev + 1));
  }, [maxTestimonialIdx]);

  const prevTestimonial = useCallback(() => {
    setTestimonialIdx(prev => (prev <= 0 ? maxTestimonialIdx : prev - 1));
  }, [maxTestimonialIdx]);

  useEffect(() => {
    if (testimonials.length <= timersPerView || paused) return;
    testimonialInterval.current = setInterval(nextTestimonial, 5000);
    return () => clearInterval(testimonialInterval.current);
  }, [testimonials.length, paused, nextTestimonial]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading training programs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FiZap className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-gray-600 font-medium">Failed to load training programs.</p>
          <p className="text-gray-400 text-sm mt-1">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#175cdd] via-[#175cdd]/90 to-brand-orange/80">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-white/5" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-white/[0.03]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col"
            >
              <motion.h1
                variants={staggerItem}
                className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold text-white leading-[1.1]"
              >
                {hero.hero_heading || 'Our Training Programs'}
              </motion.h1>
              {hero.hero_subheading && (
                <motion.p
                  variants={staggerItem}
                  className="text-lg sm:text-xl text-white/90 font-semibold mt-3"
                >
                  {hero.hero_subheading}
                </motion.p>
              )}
              {hero.hero_description && (
                <motion.p
                  variants={staggerItem}
                  className="mt-3 sm:mt-4 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl"
                >
                  {hero.hero_description}
                </motion.p>
              )}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap gap-4 mt-8 sm:mt-10"
              >
                <a
                  href={hero.cta_link || '#training-grid'}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-brand-orange text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-orange/30"
                >
                  {hero.cta_text || 'Join Training'}
                  <FiArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={hero.secondary_cta_link || '/contact'}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/60 transition-all"
                >
                  {hero.secondary_cta_text || 'Book Free Demo'}
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              {hero.hero_image ? (
                <img src={hero.hero_image} alt="" className="w-full max-w-md h-auto object-contain drop-shadow-2xl" />
              ) : (
                <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <FiLayers className="w-20 h-20 text-white/40" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 2. TRAINING PROGRAMS ─── */}
      <section id="training-grid" className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Training Programs
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Comprehensive skill-development programs designed to make you corporate-ready and career-confident.
            </p>
          </Reveal>

          {trainingList.length === 0 ? (
            <div className="text-center py-12">
              <FiBookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No training programs available at the moment.</p>
              <p className="text-gray-400 text-sm mt-1">Check back soon for new offerings.</p>
            </div>
          ) : (
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trainingList.map((program) => (
                <StaggerItem key={program.id}>
                  <TrainingCard program={program} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      {/* ─── 3. FEATURED TRAINING ─── */}
      {featuredList.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FiStar className="w-4 h-4" />
                Featured Programs
              </span>
              <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
                Featured Training Programs
              </h2>
              <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
                Our most popular programs handpicked for maximum career impact.
              </p>
            </Reveal>

            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredList.slice(0, 6).map((program) => (
                <StaggerItem key={program.id}>
                  <TrainingCard program={{ ...program, featured: true }} featured />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ─── 4. WHY CHOOSE OUR TRAINING ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Why Choose Our Training
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              What makes our training programs stand out and deliver real results.
            </p>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {WHY_CHOOSE.map((item, i) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={i}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-brand-orange/20 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-4 group-hover:bg-brand-orange transition-colors duration-300">
                      <Icon className="w-6 h-6 text-brand-orange group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-sm font-bold text-[#175cdd] mb-2 leading-snug">{item.title}</h3>
                    <p className="text-[#333333] text-xs leading-relaxed">{item.description}</p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ─── 5. SKILLS YOU'LL DEVELOP ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Skills You&apos;ll Develop
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Build a comprehensive skill set that employers value and look for.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SKILLS.map((skill, i) => {
              const Icon = skill.icon;
              return (
                <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-brand-orange/20 transition-all duration-300 group text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 flex items-center justify-center mx-auto mb-3 group-hover:from-brand-orange group-hover:to-brand-orange/80 transition-all duration-300">
                      <Icon className="w-6 h-6 text-brand-orange group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-xs font-bold text-[#175cdd] leading-snug">{skill.title}</h3>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ─── 6. TRAINING JOURNEY ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Your Training Journey
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              A structured path from registration to career success.
            </p>
          </Reveal>

          <div className="relative">
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-orange via-brand-blue to-brand-orange hidden sm:block" />
            <div className="space-y-8 sm:space-y-12">
              {TIMELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLeft = i % 2 === 0;
                return (
                  <Reveal key={i} variant={isLeft ? 'right' : 'left'}>
                    <div className={`relative flex flex-col sm:flex-row items-start gap-6 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                      <div className={`flex-1 ${isLeft ? 'sm:text-right sm:pr-12' : 'sm:text-left sm:pl-12'}`}>
                        <div className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow ${isLeft ? 'sm:text-right' : 'sm:text-left'}`}>
                          <span className="text-brand-orange font-black text-sm tracking-widest">{step.number}</span>
                          <h3 className="text-xl font-bold text-[#175cdd] mt-1 flex items-center gap-2">
                            <Icon className="w-5 h-5 text-brand-orange shrink-0" />
                            {step.title}
                          </h3>
                          <p className="text-[#333333] text-sm mt-2 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center justify-center shrink-0 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center text-white font-bold text-sm shadow-lg">
                          {step.number}
                        </div>
                      </div>
                      <div className="flex-1 hidden sm:block" />
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. PROGRAM BENEFITS ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Program Benefits
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Every training program comes with a comprehensive set of benefits to ensure your success.
            </p>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-brand-orange/20 transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 flex items-center justify-center mb-4 group-hover:from-brand-orange group-hover:to-brand-orange/80 transition-all duration-300">
                      <Icon className="w-7 h-7 text-brand-orange group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-[#175cdd] mb-2">{benefit.title}</h3>
                    <p className="text-[#333333] text-sm leading-relaxed">{benefit.description}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ─── 8. PLACEMENT PREPARATION ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-brand-blue/10 text-[#175cdd] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <FiBriefcase className="w-4 h-4" />
              Placement Ready
            </span>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Placement Preparation
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Comprehensive placement support to help you land your dream job.
            </p>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLACEMENT.map((item, i) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-brand-blue/20 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-4 group-hover:bg-[#175cdd] transition-colors duration-300">
                      <Icon className="w-6 h-6 text-[#175cdd] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-base font-bold text-[#175cdd] mb-2">{item.title}</h3>
                    <p className="text-[#333333] text-sm leading-relaxed">{item.description}</p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ─── 9. STUDENT SUCCESS STATISTICS ─── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#175cdd] to-[#175cdd]/90 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/[0.03]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-white/[0.02]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white">
              Student Success Statistics
            </h2>
            <p className="text-white/70 mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Our track record speaks for itself. Join thousands of successful graduates.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {DEFAULT_STATS.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center p-4">
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-white/70 text-sm mt-2 font-medium">{stat.label}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── 10. TESTIMONIALS ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              What Our Students Say
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Hear from our students about how our training programs transformed their careers.
            </p>
          </Reveal>

          <div
            className="relative"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="overflow-hidden">
              <motion.div
                className="flex"
                animate={{ x: `-${testimonialIdx * 100}%` }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {Array.from({ length: totalTestimonialSlides }, (_, slideIdx) => (
                  <div key={slideIdx} className="min-w-full grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.slice(slideIdx * timersPerView, slideIdx * timersPerView + timersPerView).map((t, i) => (
                      <TestimonialCard key={i} testimonial={t} />
                    ))}
                  </div>
                ))}
              </motion.div>
            </div>

            {totalTestimonialSlides > 1 && (
              <>
                <button
                  onClick={prevTestimonial}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-brand-orange hover:border-brand-orange transition-all cursor-pointer z-10"
                  aria-label="Previous testimonials"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:text-brand-orange hover:border-brand-orange transition-all cursor-pointer z-10"
                  aria-label="Next testimonials"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalTestimonialSlides }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    i === testimonialIdx ? 'bg-brand-orange w-6' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 11. FAQS ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
              Frequently Asked Questions
            </h2>
            <p className="text-[#333333] mt-3 max-w-xl mx-auto">
              Got questions? We have answers. If you need more information, feel free to contact us.
            </p>
          </Reveal>

          <Stagger className="space-y-3">
            {(DEFAULT_FAQS).map((faq, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#175cdd] flex-1">{faq.question}</span>
                    <span className="shrink-0 w-7 h-7 rounded-full bg-brand-orange/10 flex items-center justify-center">
                      {faqOpen === i ? (
                        <FiMinus className="w-3.5 h-3.5 text-brand-orange" strokeWidth={3} />
                      ) : (
                        <FiPlus className="w-3.5 h-3.5 text-brand-orange" strokeWidth={3} />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-[#333333] leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── 12. CTA SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-orange via-brand-orange/90 to-[#175cdd] py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/[0.03] rounded-bl-[50%]" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-white/[0.02] rounded-tr-[50%]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-white leading-tight">
              Ready to Become Industry Ready?
            </h2>
            <p className="text-white/80 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
              Take the first step toward a brighter future. Join thousands of successful students who transformed their careers with Marvel Slice Academy.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8 sm:mt-10">
              <a
                href="/training"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-brand-orange font-bold text-sm hover:bg-gray-100 transition-all shadow-xl shadow-black/10"
              >
                Join Training
                <FiArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/60 transition-all"
              >
                Talk to Career Advisor
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 13. RELATED / POPULAR TRAINING ─── */}
      {trainingList.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-10">
              <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#175cdd]">
                Popular Training Programs
              </h2>
              <p className="text-[#333333] mt-3 max-w-2xl mx-auto">
                Explore more programs designed to boost your career.
              </p>
            </Reveal>

            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trainingList.slice(0, 4).map((program) => (
                <StaggerItem key={program.id}>
                  <TrainingCard program={program} />
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="text-center mt-10">
              <Link
                to="/training"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-orange text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-orange/20"
              >
                View All Programs
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
