import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiStar,
  FiTrendingUp,
  FiZap,
  FiClock,
  FiMonitor,
  FiBookOpen,
  FiTarget,
  FiUsers,
  FiAward,
  FiCode,
  FiGlobe,
  FiCalendar,
  FiRefreshCw,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiMapPin,
  FiPlus,
  FiMinus,
  FiBriefcase,
} from "react-icons/fi";
import { supabase } from "../lib/supabaseClient";
import Reveal, { Stagger, StaggerItem } from "../components/ui/Reveal";
import { trackCtaClick } from "../lib/analytics";
import { usePublishedServices } from "../hooks/useServices";
import { staggerContainer, staggerItem } from "../lib/motion";

const WHY_CHOOSE = [
  {
    icon: FiUsers,
    title: "Expert Trainers",
    description:
      "Learn from industry veterans with years of hands-on experience and a passion for teaching.",
  },
  {
    icon: FiCode,
    title: "Hands-on Projects",
    description:
      "Build real-world applications and portfolios that showcase your skills to employers.",
  },
  {
    icon: FiAward,
    title: "Placement Assistance",
    description:
      "Dedicated career support with resume building, mock interviews, and job referrals.",
  },
  {
    icon: FiGlobe,
    title: "Flexible Learning",
    description:
      "Choose from online, offline, or hybrid modes to fit your schedule and learning style.",
  },
  {
    icon: FiRefreshCw,
    title: "Updated Curriculum",
    description:
      "Courses are regularly updated to match the latest industry trends and technologies.",
  },
  {
    icon: FiMessageSquare,
    title: "Lifetime Support",
    description:
      "Get ongoing mentorship and doubt-clearing sessions even after course completion.",
  },
];

const TIMELINE_STEPS = [
  {
    number: "01",
    title: "Enroll",
    description:
      "Choose your program and complete enrollment online or at our center.",
    icon: FiBookOpen,
  },
  {
    number: "02",
    title: "Learn",
    description:
      "Industry-led training with expert instructors and hands-on lab sessions.",
    icon: FiMonitor,
  },
  {
    number: "03",
    title: "Build",
    description:
      "Work on real-world projects that simulate actual industry scenarios.",
    icon: FiCode,
  },
  {
    number: "04",
    title: "Assess",
    description:
      "Regular evaluations, quizzes, and mock tests to track your progress.",
    icon: FiTarget,
  },
  {
    number: "05",
    title: "Certify",
    description:
      "Earn industry-recognized certificates upon successful completion.",
    icon: FiAward,
  },
  {
    number: "06",
    title: "Succeed",
    description:
      "Get placement support and career guidance to launch your dream career.",
    icon: FiTrendingUp,
  },
];

const TRAINING_MODES = [
  {
    icon: FiMonitor,
    title: "Online",
    description:
      "Live interactive sessions from anywhere with recorded backups.",
  },
  {
    icon: FiMapPin,
    title: "Offline",
    description: "Classroom training at our state-of-the-art learning centers.",
  },
  {
    icon: FiGlobe,
    title: "Hybrid",
    description:
      "Blend of online and offline learning for maximum flexibility.",
  },
  {
    icon: FiCalendar,
    title: "Weekend",
    description:
      "Weekend batches designed for working professionals and students.",
  },
  {
    icon: FiClock,
    title: "Weekday",
    description: "Regular weekday batches for focused and structured learning.",
  },
  {
    icon: FiZap,
    title: "Fast Track",
    description:
      "Accelerated programs for quick skill acquisition and certification.",
  },
];

const DEFAULT_STATS = [
  { label: "Students Trained", value: 10000, suffix: "+" },
  { label: "Placements", value: 7500, suffix: "+" },
  { label: "Courses", value: 50, suffix: "+" },
  { label: "Expert Trainers", value: 100, suffix: "+" },
  { label: "Partner Companies", value: 300, suffix: "+" },
  { label: "Certificates Issued", value: 8000, suffix: "+" },
];

const DEFAULT_TESTIMONIALS = [
  {
    name: "Priya Sharma",
    course: "Full Stack Development",
    review:
      "Marvel Slice transformed my career. The hands-on projects and mentorship helped me land my dream job at a top tech company.",
    rating: 5,
    company: "TechCorp India",
    photo: "",
  },
  {
    name: "Rahul Verma",
    course: "Data Science & AI",
    review:
      "The curriculum is incredibly well-structured. I went from zero to job-ready in just 6 months. Highly recommended!",
    rating: 5,
    company: "DataPro Solutions",
    photo: "",
  },
  {
    name: "Ananya Patel",
    course: "UI/UX Design",
    review:
      "The trainers are industry experts who genuinely care about your growth. The portfolio-building approach is fantastic.",
    rating: 5,
    company: "DesignStudio",
    photo: "",
  },
  {
    name: "Vikram Singh",
    course: "Cloud Computing",
    review:
      "Excellent training with real-world cloud projects. The certification helped me get a promotion within months.",
    rating: 4,
    company: "CloudBase Inc.",
    photo: "",
  },
  {
    name: "Neha Gupta",
    course: "Digital Marketing",
    review:
      "The practical approach to learning and the placement support made all the difference. Truly life-changing experience.",
    rating: 5,
    company: "MarketLeap",
    photo: "",
  },
];

const DEFAULT_FAQS = [
  {
    question: "What courses do you offer?",
    answer:
      "We offer a wide range of courses including Full Stack Development, Data Science, AI/ML, Cloud Computing, Cybersecurity, UI/UX Design, Digital Marketing, and many more across Software Learning and Competitive Exam categories.",
  },
  {
    question: "Are the courses available online?",
    answer:
      "Yes! We offer flexible training modes — online, offline, and hybrid — so you can learn in the way that suits you best.",
  },
  {
    question: "Do you provide placement assistance?",
    answer:
      "Absolutely. We have a dedicated placement cell that provides resume building, mock interviews, skill assessments, and job referrals to help you land your dream role.",
  },
  {
    question: "What is the duration of the courses?",
    answer:
      "Course durations vary depending on the program. Typically, our courses range from 3 to 12 months, with both fast-track and regular-paced options available.",
  },
  {
    question: "Are there any prerequisites?",
    answer:
      "Prerequisites vary by course. Many of our beginner-friendly programs require no prior experience. Advanced courses may require basic knowledge in the relevant field.",
  },
  {
    question: "Do you offer certifications?",
    answer:
      "Yes, upon successful completion of the course and assessments, you will receive an industry-recognized certificate from Marvel Slice Training Academy.",
  },
  {
    question: "Can I switch from online to offline mode?",
    answer:
      "Yes, our hybrid programs allow you to seamlessly switch between online and offline modes based on your convenience.",
  },
];

function AnimatedCounter({ target, suffix = "", duration = 2000 }) {
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
      { threshold: 0.3 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

function Badge({ children, variant = "orange" }) {
  const colors = {
    orange: "bg-brand-orange text-white",
    blue: "bg-brand-blue text-white",
    green: "bg-brand-green text-white",
  };
  return (
    <span
      className={`absolute top-3 left-3 z-10 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors[variant] || colors.orange}`}
    >
      {children}
    </span>
  );
}

function ServiceCard({ service, featured = false }) {
  const hasImage = service.thumbnail || service.hero_image_url;
  const badges = [];
  if (service.featured) badges.push({ label: "Featured", variant: "blue" });
  if (service.trending) badges.push({ label: "Trending", variant: "orange" });
  if (service.popular) badges.push({ label: "Popular", variant: "green" });

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 ${featured ? "lg:col-span-2" : ""}`}
    >
      <div className="relative overflow-hidden">
        {hasImage ? (
          <img
            src={service.thumbnail || service.hero_image_url}
            alt={service.title}
            className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-52 bg-gradient-to-br from-brand-blue/20 via-brand-orange/10 to-brand-blue/30 flex items-center justify-center">
            <FiBriefcase className="w-12 h-12 text-brand-orange/40" />
          </div>
        )}
        {badges.map((b, i) => (
          <Badge key={i} variant={b.variant}>
            {b.label}
          </Badge>
        ))}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-[#2551d9] group-hover:text-brand-orange transition-colors line-clamp-1">
          {service.title}
        </h3>
        {service.description && (
          <p className="text-[#333333] text-sm mt-2 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        )}
        {(service.duration || service.mode) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {service.duration && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                <FiClock className="w-3 h-3" />
                {service.duration}
              </span>
            )}
            {service.mode && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                <FiMonitor className="w-3 h-3" />
                {service.mode}
              </span>
            )}
          </div>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          {service.price && (
            <span className="text-lg font-bold text-[#2551d9]">
              ₹{service.price.toLocaleString()}
            </span>
          )}
          <Link
            to={`/services/${service.slug}`}
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
            className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-[#333333] text-sm leading-relaxed flex-1 italic">
        &ldquo;{testimonial.review}&rdquo;
      </p>
      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-orange to-brand-blue flex items-center justify-center text-white text-sm font-bold shrink-0">
          {testimonial.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-[#2551d9] text-sm">
            {testimonial.name}
          </p>
          <p className="text-gray-400 text-xs">
            {testimonial.course}
            {testimonial.company ? ` · ${testimonial.company}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [faqOpen, setFaqOpen] = useState(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const testimonialInterval = useRef(null);

  const { data: services, isLoading, error } = usePublishedServices();
  const featuredServices = usePublishedServices({ featured: true });

  const { data: pageData } = useQuery({
    queryKey: ["servicesPage", "nav_pages"],
    queryFn: async () => {
      try {
        const { data: navItems } = await supabase
          .from("nav_items")
          .select("id")
          .eq("path", "/services")
          .eq("is_active", true)
          .limit(1);
        const navItem = navItems?.[0];
        if (!navItem) return {};
        const { data: pages } = await supabase
          .from("nav_pages")
          .select("*")
          .eq("nav_item_id", navItem.id)
          .eq("is_published", true)
          .limit(1);
        const page = pages?.[0];
        if (!page) return {};
        const sections = page.sections || [];
        const heroSec = sections.find((s) => s.section_type === "hero");
        return {
          hero_heading: heroSec?.heading || page.heading || "Our Services",
          hero_subheading: heroSec?.subheading || page.subheading || "",
          hero_description: heroSec?.description || page.description || "",
          hero_image: heroSec?.image || page.hero_image || "",
          cta_text: heroSec?.cta_text || "Explore Services",
          cta_link: heroSec?.cta_link || "#services-grid",
          secondary_cta_text:
            heroSec?.secondary_cta_text || "Get Free Consultation",
          secondary_cta_link: heroSec?.secondary_cta_link || "/contact",
        };
      } catch {
        return {};
      }
    },
    staleTime: 1000 * 60 * 10,
  });

  const hero = pageData || {};
  const servicesList = services || [];
  const featuredList = featuredServices.data || [];
  const testimonials = DEFAULT_TESTIMONIALS;
  const timersPerView = 3;

  const totalTestimonialSlides = Math.ceil(testimonials.length / timersPerView);
  const maxTestimonialIdx = Math.max(0, totalTestimonialSlides - 1);

  const nextTestimonial = useCallback(() => {
    setTestimonialIdx((prev) => (prev >= maxTestimonialIdx ? 0 : prev + 1));
  }, [maxTestimonialIdx]);

  const prevTestimonial = useCallback(() => {
    setTestimonialIdx((prev) => (prev <= 0 ? maxTestimonialIdx : prev - 1));
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
          <p className="text-gray-400 text-sm font-medium">
            Loading services...
          </p>
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
          <p className="text-gray-600 font-medium">Failed to load services.</p>
          <p className="text-gray-400 text-sm mt-1">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2551d9] via-[#2551d9]/90 to-brand-orange/80">
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
                {hero.hero_heading || "Our Services"}
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
                  href={hero.cta_link || "#services-grid"}
                  onClick={() =>
                    trackCtaClick(
                      hero.cta_text || "Explore Services",
                      "services_hero",
                    )
                  }
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-brand-orange text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-orange/30"
                >
                  {hero.cta_text || "Explore Services"}
                  <FiArrowRight className="w-4 h-4" />
                </a>
                <a
                  href={hero.secondary_cta_link || "/contact"}
                  onClick={() =>
                    trackCtaClick(
                      hero.secondary_cta_text || "Get Free Consultation",
                      "services_hero",
                    )
                  }
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/60 transition-all"
                >
                  {hero.secondary_cta_text || "Get Free Consultation"}
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2,
              }}
              className="hidden lg:flex justify-center"
            >
              {hero.hero_image ? (
                <img
                  src={hero.hero_image}
                  alt=""
                  className="w-full max-w-md h-auto object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="w-full max-w-md aspect-[4/3] rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <FiBriefcase className="w-20 h-20 text-white/40" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── 2. SERVICES OVERVIEW ─── */}
      <section id="services-grid" className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
              What We Offer
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Comprehensive training programs designed to equip you with
              in-demand skills and accelerate your career growth.
            </p>
          </Reveal>

          {servicesList.length === 0 ? (
            <div className="text-center py-12">
              <FiBookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">
                No services available at the moment.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Check back soon for new offerings.
              </p>
            </div>
          ) : (
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {servicesList.map((service) => (
                <StaggerItem key={service.id}>
                  <ServiceCard service={service} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </section>

      {/* ─── 3. FEATURED SERVICES ─── */}
      {featuredList.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <span className="inline-flex items-center gap-2 bg-brand-orange/10 text-brand-orange text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                <FiStar className="w-4 h-4" />
                Featured
              </span>
              <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
                Featured Services
              </h2>
              <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
                Our most popular programs handpicked for maximum career impact.
              </p>
            </Reveal>

            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredList.slice(0, 6).map((service) => (
                <StaggerItem key={service.id}>
                  <ServiceCard
                    service={{ ...service, featured: true }}
                    featured
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ─── 4. WHY CHOOSE US ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
              Why Choose Marvel Slice
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              What sets us apart and makes us the preferred choice for thousands
              of learners.
            </p>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item, i) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={i}>
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-brand-orange/20 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-4 group-hover:bg-brand-orange transition-colors duration-300">
                      <Icon className="w-6 h-6 text-brand-orange group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2551d9] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[#333333] text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ─── 5. LEARNING PROCESS TIMELINE ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
              Your Learning Journey
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              A structured path from enrollment to career success.
            </p>
          </Reveal>

          <div className="relative">
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-brand-orange via-brand-blue to-brand-orange hidden sm:block" />
            <div className="space-y-8 sm:space-y-12">
              {TIMELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                const isLeft = i % 2 === 0;
                return (
                  <Reveal key={i} variant={isLeft ? "right" : "left"}>
                    <div
                      className={`relative flex flex-col sm:flex-row items-start gap-6 ${isLeft ? "sm:flex-row" : "sm:flex-row-reverse"}`}
                    >
                      <div
                        className={`flex-1 ${isLeft ? "sm:text-right sm:pr-12" : "sm:text-left sm:pl-12"}`}
                      >
                        <div
                          className={`bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow ${isLeft ? "sm:text-right" : "sm:text-left"}`}
                        >
                          <span className="text-brand-orange font-black text-sm tracking-widest">
                            {step.number}
                          </span>
                          <h3 className="text-xl font-bold text-[#2551d9] mt-1 flex items-center gap-2">
                            <Icon className="w-5 h-5 text-brand-orange shrink-0" />
                            {step.title}
                          </h3>
                          <p className="text-[#333333] text-sm mt-2 leading-relaxed">
                            {step.description}
                          </p>
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

      {/* ─── 6. TRAINING MODES ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
              Flexible Training Modes
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Choose the learning format that fits your lifestyle and schedule.
            </p>
          </Reveal>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRAINING_MODES.map((mode, i) => {
              const Icon = mode.icon;
              return (
                <StaggerItem key={i}>
                  <motion.div
                    whileHover={{ y: -3 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg hover:border-brand-orange/20 transition-all duration-300 group cursor-default"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-orange/20 to-brand-orange/5 flex items-center justify-center mb-4 group-hover:from-brand-orange group-hover:to-brand-orange/80 transition-all duration-300">
                      <Icon className="w-7 h-7 text-brand-orange group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-bold text-[#2551d9] mb-2">
                      {mode.title}
                    </h3>
                    <p className="text-[#333333] text-sm leading-relaxed">
                      {mode.description}
                    </p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ─── 7. SERVICE STATISTICS ─── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#2551d9] to-[#2551d9]/90 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/[0.03]" />
          <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-white/[0.02]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-white">
              Our Impact in Numbers
            </h2>
            <p className="text-white/70 mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Thousands of students trust us for their career transformation.
            </p>
          </Reveal>

          <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {DEFAULT_STATS.map((stat, i) => (
              <StaggerItem key={i}>
                <div className="text-center p-4">
                  <p className="text-3xl sm:text-4xl font-extrabold text-white">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-white/70 text-sm mt-2 font-medium">
                    {stat.label}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─── 8. TESTIMONIALS CAROUSEL ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
              What Our Students Say
            </h2>
            <p className="text-[#333333] mt-3 max-w-2xl mx-auto text-base sm:text-lg">
              Hear from our alumni about their transformative learning
              experience.
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
                {Array.from(
                  { length: totalTestimonialSlides },
                  (_, slideIdx) => (
                    <div
                      key={slideIdx}
                      className="min-w-full grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {testimonials
                        .slice(
                          slideIdx * timersPerView,
                          slideIdx * timersPerView + timersPerView,
                        )
                        .map((t, i) => (
                          <TestimonialCard key={i} testimonial={t} />
                        ))}
                    </div>
                  ),
                )}
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
                    i === testimonialIdx
                      ? "bg-brand-orange w-6"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to testimonial slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. FAQS ─── */}
      <section className="py-16 sm:py-20 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-10">
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
              Frequently Asked Questions
            </h2>
            <p className="text-[#333333] mt-3 max-w-xl mx-auto">
              Got questions? We have answers. If you need more information, feel
              free to contact us.
            </p>
          </Reveal>

          <Stagger className="space-y-3">
            {DEFAULT_FAQS.map((faq, i) => (
              <StaggerItem key={i}>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-semibold text-[#2551d9] flex-1">
                      {faq.question}
                    </span>
                    <span className="shrink-0 w-7 h-7 rounded-full bg-brand-orange/10 flex items-center justify-center">
                      {faqOpen === i ? (
                        <FiMinus
                          className="w-3.5 h-3.5 text-brand-orange"
                          strokeWidth={3}
                        />
                      ) : (
                        <FiPlus
                          className="w-3.5 h-3.5 text-brand-orange"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {faqOpen === i && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
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

      {/* ─── 10. CTA SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-orange via-brand-orange/90 to-[#2551d9] py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/[0.03] rounded-bl-[50%]" />
          <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-white/[0.02] rounded-tr-[50%]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-white leading-tight">
              Ready to Start Your Career?
            </h2>
            <p className="text-white/80 text-base sm:text-lg mt-4 max-w-2xl mx-auto">
              Take the first step toward a brighter future. Join thousands of
              successful students who transformed their careers with Marvel
              Slice.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8 sm:mt-10">
              <a
                href="/courses"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white text-brand-orange font-bold text-sm hover:bg-gray-100 transition-all shadow-xl shadow-black/10"
              >
                Apply Now
                <FiArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border-2 border-white/40 text-white font-semibold text-sm hover:bg-white/10 hover:border-white/60 transition-all"
              >
                Talk to Counsellor
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── 11. RELATED SERVICES ─── */}
      {servicesList.length > 0 && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-10">
              <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] font-bold text-[#2551d9]">
                Popular Services
              </h2>
              <p className="text-[#333333] mt-3 max-w-2xl mx-auto">
                Explore more programs designed to boost your career.
              </p>
            </Reveal>

            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicesList.slice(0, 4).map((service) => (
                <StaggerItem key={service.id}>
                  <ServiceCard service={service} />
                </StaggerItem>
              ))}
            </Stagger>

            <Reveal className="text-center mt-10">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-orange text-white font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-brand-orange/20"
              >
                View All Services
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>
      )}
    </div>
  );
}
