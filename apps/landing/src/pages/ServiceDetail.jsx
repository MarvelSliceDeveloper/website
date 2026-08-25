import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiStar, FiArrowLeft, FiArrowRight, FiClock, FiBookOpen, FiAward, FiChevronDown, FiChevronUp,
  FiChevronLeft, FiChevronRight, FiPlus, FiMinus, FiUsers, FiGlobe, FiCheckCircle,
  FiCheck, FiX, FiSend, FiAlertCircle, FiImage, FiVideo, FiLayers, FiZap, FiShield,
  FiTrendingUp, FiBarChart2, FiBriefcase, FiHeart, FiTarget, FiPlay, FiStar as FiStarFull,
} from 'react-icons/fi';
import Button from '../components/ui/Button';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import { trackVideoPlay, trackCtaClick } from '../lib/analytics';
import { useService, usePublishedServices } from '../hooks/useServices';
import { supabase } from '../lib/supabaseClient';

const MODE_ICONS = {
  online: FiGlobe,
  classroom: FiUsers,
  hybrid: FiLayers,
  'one-on-one': FiTarget,
};

const HIGHLIGHT_ICONS = {
  clock: FiClock,
  users: FiUsers,
  award: FiAward,
  star: FiStar,
  book: FiBookOpen,
  briefcase: FiBriefcase,
  globe: FiGlobe,
  layers: FiLayers,
  zap: FiZap,
  shield: FiShield,
  trending: FiTrendingUp,
  bar: FiBarChart2,
  heart: FiHeart,
  target: FiTarget,
};

function getYoutubeEmbedUrl(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

function AnimatedCounter({ value, suffix = '', prefix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const num = parseInt(value, 10) || 0;
    if (num === 0) return;
    const duration = 1500;
    const steps = 30;
    const increment = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [visible, value]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

function StarRating({ rating = 0 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <FiStarFull
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function Accordion({ items, titleKey = 'question', contentKey = 'answer' }) {
  const [open, setOpen] = useState(null);
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id || i} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-2.5 text-left font-semibold text-brand-orange hover:bg-gray-50 transition-colors gap-3 cursor-pointer"
          >
            <span>{item[titleKey]}</span>
            <span className="shrink-0 w-8 h-8 p-1.5 flex items-center justify-center rounded-full bg-white text-brand-orange">
              {open === i ? <FiMinus className="w-3.5 h-3.5" strokeWidth={3} /> : <FiPlus className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-gray-500 leading-relaxed">{item[contentKey]}</div>
          )}
        </div>
      ))}
    </div>
  );
}

function LightboxModal({ images, index, onClose }) {
  const [current, setCurrent] = useState(index);

  useEffect(() => {
    if (images.length === 0) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((c) => (c + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrent((c) => (c - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  if (images.length === 0) return null;
  const item = images[current];
  const isVideo = item.type === 'video' || item.video_url;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <FiX className="w-6 h-6" />
        </button>
        {images.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + images.length) % images.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % images.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        {isVideo ? (
          <div className="aspect-video rounded-xl overflow-hidden">
            <iframe
              src={item.video_url ? getYoutubeEmbedUrl(item.video_url) : item.url}
              title="Gallery media"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <img
            src={item.url || item.image_url}
            alt={item.alt_text || item.title || ''}
            className="w-full max-h-[80vh] object-contain rounded-xl"
          />
        )}
        {item.title && (
          <p className="text-white/80 text-sm text-center mt-3">{item.title}</p>
        )}
      </div>
    </div>
  );
}

function GallerySection({ images }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [filter, setFilter] = useState('all');

  if (!images || images.length === 0) return null;

  const filtered = filter === 'all' ? images : images.filter((img) => img.type === filter);

  return (
    <section className="py-16 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Gallery</Reveal>
        <Reveal as="p" className="text-gray-500 mb-6" delay={0.1}>A glimpse into the program experience</Reveal>
        <div className="flex items-center gap-3 mb-8">
          {['all', 'image', 'video'].map((f) => {
            const count = f === 'all' ? images.length : images.filter((i) => i.type === f).length;
            if (count === 0) return null;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  filter === f
                    ? 'bg-brand-orange text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-orange hover:text-brand-orange'
                }`}
              >
                {f === 'all' ? null : f === 'image' ? <FiImage className="w-4 h-4" /> : <FiVideo className="w-4 h-4" />}
                {f === 'all' ? 'All' : f === 'image' ? 'Images' : 'Videos'} ({count})
              </button>
            );
          })}
        </div>
        <Stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((img, i) => (
            <StaggerItem key={img.id || i}>
              <button
                onClick={() => { setLightboxIndex(i); setLightboxOpen(true); if (img.type === 'video' || img.video_url) trackVideoPlay(img.title || 'service_gallery'); }}
                className="group relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
              >
                {img.type === 'video' || img.video_url ? (
                  <>
                    <img
                      src={img.thumbnail_url || img.url || img.image_url}
                      alt={img.alt_text || img.title || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <FiPlay className="w-5 h-5 text-brand-orange ml-0.5" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={img.url || img.image_url}
                    alt={img.alt_text || img.title || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{img.title || ''}</p>
                </div>
              </button>
            </StaggerItem>
          ))}
        </Stagger>
        {lightboxOpen && (
          <LightboxModal
            images={filtered}
            index={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    </section>
  );
}

function InfoBadge({ label, value, icon: Icon }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0 mt-0.5">
        {Icon && <Icon className="w-4.5 h-4.5 text-brand-orange" style={{ width: 18, height: 18 }} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function YesNoBadge({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0 mt-0.5">
        {Icon && <Icon className="w-4.5 h-4.5 text-brand-orange" style={{ width: 18, height: 18 }} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <span
          className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      </div>
    </div>
  );
}

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data: service, isLoading } = useService(slug);
  const { data: related } = usePublishedServices({
    limit: 4,
    not_id: service?.id,
    category_id: service?.category_id,
  });
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryForm, setEnquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [enquirySubmitting, setEnquirySubmitting] = useState(false);
  const [enquiryDone, setEnquiryDone] = useState(false);
  const [enquiryError, setEnquiryError] = useState('');

  const relatedServices = related?.slice(0, 4) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <FiAlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
        <p className="text-gray-500 mb-6">The service you are looking for does not exist or has been removed.</p>
        <Link to="/services" className="inline-flex items-center gap-2 text-brand-orange font-semibold hover:underline">
          <FiArrowLeft className="w-4 h-4" /> Back to Services
        </Link>
      </div>
    );
  }

  const heroImage = service.banner || service.thumbnail;
  const hasBadge = service.badge || service.status === 'trending' || service.popular || service.featured;
  const badgeText = service.badge || (service.trending ? 'Trending' : service.popular ? 'Popular' : service.featured ? 'Featured' : null);
  const eligibilityHighlights = service.eligibility_highlights
    ? (typeof service.eligibility_highlights === 'string'
        ? JSON.parse(service.eligibility_highlights)
        : service.eligibility_highlights)
    : [];
  const learningOutcomes = service.learning_outcomes
    ? (typeof service.learning_outcomes === 'string'
        ? JSON.parse(service.learning_outcomes)
        : service.learning_outcomes)
    : [];
  const curriculum = service.curriculum
    ? (typeof service.curriculum === 'string'
        ? JSON.parse(service.curriculum)
        : service.curriculum)
    : [];
  const requirements = service.requirements
    ? (typeof service.requirements === 'string'
        ? JSON.parse(service.requirements)
        : service.requirements)
    : [];
  const trainingModeDetails = service.training_mode_details
    ? (typeof service.training_mode_details === 'string'
        ? JSON.parse(service.training_mode_details)
        : service.training_mode_details)
    : null;

  const ModeIcon = MODE_ICONS[service.training_mode?.toLowerCase().replace(/\s+/g, '-')] || FiLayers;

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    if (!enquiryForm.name.trim() || !enquiryForm.email.trim() || !enquiryForm.phone.trim() || !enquiryForm.message.trim()) return;
    setEnquirySubmitting(true);
    setEnquiryError('');

    const payload = {
      name: enquiryForm.name.trim(),
      email: enquiryForm.email.trim(),
      phone: enquiryForm.phone.trim(),
      message: enquiryForm.message.trim(),
      service_id: service.id,
      service_title: service.title,
    };

    const { error } = await supabase.from('enquiries').insert(payload);
    if (error) { setEnquiryError(error.message); setEnquirySubmitting(false); return; }

    fetch('/api/submit-enquiry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    setEnquirySubmitting(false);
    setEnquiryDone(true);
  }

  return (
    <div>
      {/* ============ 1. HERO ============ */}
      <section className="relative min-h-[60vh] sm:min-h-[65vh] flex items-end overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt={service.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent" />
        <div className="relative z-10 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20">
            <Reveal variant="up">
              <nav className="flex items-center gap-2 text-sm text-white/60 mb-6">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <span>/</span>
                <Link to="/services" className="hover:text-white transition-colors">Services</Link>
                <span>/</span>
                <span className="text-white/90 truncate max-w-[200px] sm:max-w-xs">{service.title}</span>
              </nav>
            </Reveal>
            <Reveal variant="up" delay={0.1}>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <h1 className="text-[clamp(1.75rem,4vw,3.25rem)] font-extrabold text-white leading-[1.15]">
                  {service.title}
                </h1>
                {hasBadge && badgeText && (
                  <span className="inline-block align-middle text-xs font-bold px-3 py-1 rounded-full bg-brand-orange text-white shadow-sm whitespace-nowrap">
                    {badgeText}
                  </span>
                )}
              </div>
            </Reveal>
            {service.description && (
              <Reveal variant="up" delay={0.15}>
                <p className="text-white/80 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
                  {service.description}
                </p>
              </Reveal>
            )}
            <Reveal variant="up" delay={0.2}>
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm mb-6">
                {service.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiClock className="w-4 h-4" /> {service.duration}
                  </span>
                )}
                {service.training_mode && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white">
                    <ModeIcon className="w-3.5 h-3.5" /> {service.training_mode}
                  </span>
                )}
                {service.price > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-brand-orange font-bold text-base">
                    Starting at ₹{service.price?.toLocaleString()}
                  </span>
                )}
              </div>
            </Reveal>
            <Reveal variant="up" delay={0.25}>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="lg" to="/contact" onClick={() => trackCtaClick('Enroll Now', 'service_hero')} className="shadow-lg shadow-brand-orange/25">
                  Enroll Now <FiArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="outline-white" size="lg" onClick={() => setEnquiryOpen(true)}>
                  Get Free Demo
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 2. SERVICE OVERVIEW ============ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-10 lg:gap-14">
            <div className="lg:col-span-2">
              <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-6">About This Program</Reveal>
              <Reveal delay={0.1}>
                <div className="text-gray-600 leading-relaxed space-y-4">
                  {service.full_description?.split('\n').filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </Reveal>
            </div>
            <Reveal variant="right" delay={0.15}>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:sticky lg:top-24">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Info</h3>
                <div className="divide-y divide-gray-100">
                  <InfoBadge label="Duration" value={service.duration} icon={FiClock} />
                  <InfoBadge label="Training Mode" value={service.training_mode} icon={ModeIcon} />
                  <InfoBadge label="Language" value={service.language} icon={FiGlobe} />
                  {service.difficulty_level && (
                    <InfoBadge label="Difficulty" value={service.difficulty_level} icon={FiBarChart2} />
                  )}
                  <YesNoBadge label="Certificate" value={service.certificate_available} icon={FiAward} />
                  <YesNoBadge label="Placement Support" value={service.placement_support} icon={FiBriefcase} />
                  <YesNoBadge label="Internship" value={service.internship_available} icon={FiStar} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============ 3. WHO CAN JOIN (ELIGIBILITY) ============ */}
      {(service.eligibility || eligibilityHighlights.length > 0) && (
        <section className="py-16 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Who Can Join?</Reveal>
            <Reveal as="p" className="text-gray-500 mb-8" delay={0.1}>Eligibility criteria for this program</Reveal>
            <div className="grid lg:grid-cols-2 gap-8">
              {service.eligibility && (
                <Reveal>
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <p className="text-gray-600 leading-relaxed">{service.eligibility}</p>
                  </div>
                </Reveal>
              )}
              {eligibilityHighlights.length > 0 && (
                <Reveal delay={0.1}>
                  <ul className="space-y-3">
                    {eligibilityHighlights.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                        <FiCheckCircle className="w-5 h-5 text-brand-green shrink-0 mt-0.5" />
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============ 4. BENEFITS ============ */}
      {service.service_benefits?.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Benefits of This Program</Reveal>
            <Reveal as="p" className="text-gray-500 mb-10" delay={0.1}>What you gain by enrolling</Reveal>
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.service_benefits.map((benefit) => (
                <StaggerItem key={benefit.id}>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className="w-12 h-12 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-4">
                      {(() => {
                        const IconComp = HIGHLIGHT_ICONS[benefit.icon] || FiAward;
                        return <IconComp className="w-6 h-6 text-brand-orange" />;
                      })()}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    {benefit.description && (
                      <p className="text-sm text-gray-500 leading-relaxed">{benefit.description}</p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ============ 5. LEARNING OUTCOMES ============ */}
      {learningOutcomes.length > 0 && (
        <section className="py-16 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">What You'll Learn</Reveal>
            <Reveal as="p" className="text-gray-500 mb-8" delay={0.1}>Key skills and knowledge you will gain</Reveal>
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningOutcomes.map((outcome, i) => {
                const label = typeof outcome === 'string' ? outcome : outcome.title || outcome.label;
                return (
                  <StaggerItem key={i}>
                    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm h-full">
                      <div className="w-7 h-7 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0 mt-0.5">
                        <FiCheck className="w-4 h-4 text-brand-green" />
                      </div>
                      <span className="text-gray-700 text-sm leading-relaxed">{label}</span>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>
      )}

      {/* ============ 6. CURRICULUM ============ */}
      {curriculum.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Program Curriculum</Reveal>
            <Reveal as="p" className="text-gray-500 mb-8" delay={0.1}>Structured modules designed for practical learning</Reveal>
            <Reveal>
              <div className="space-y-4">
                {curriculum.map((module, idx) => {
                  const items = module.items || module.topics || [];
                  return (
                    <CurriculumModule key={idx} index={idx} module={module} items={items} />
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ 7. LEARNING TIMELINE ============ */}
      {service.service_steps?.length > 0 && (
        <section className="py-16 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Your Learning Journey</Reveal>
            <Reveal as="p" className="text-gray-500 mb-10" delay={0.1}>Step-by-step path to mastery</Reveal>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-brand-orange/20 hidden sm:block" />
              <Stagger className="space-y-8">
                {service.service_steps
                  .sort((a, b) => (a.sort_order || a.step_number || 0) - (b.sort_order || b.step_number || 0))
                  .map((step, i) => (
                    <StaggerItem key={step.id || i}>
                      <div className="relative flex items-start gap-5 sm:gap-8">
                        <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-full bg-brand-orange text-white items-center justify-center font-bold text-sm shadow-md relative z-10">
                          {step.step_number || step.sort_order || i + 1}
                        </div>
                        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center sm:hidden">
                              <span className="text-xs font-bold text-brand-orange">{step.step_number || step.sort_order || i + 1}</span>
                            </div>
                            {step.icon && (
                              <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center shrink-0">
                                {(() => {
                                  const IconComp = HIGHLIGHT_ICONS[step.icon] || FiTarget;
                                  return <IconComp className="w-4 h-4 text-brand-orange" />;
                                })()}
                              </div>
                            )}
                            <h3 className="font-bold text-gray-900">{step.title}</h3>
                          </div>
                          {step.description && (
                            <p className="text-sm text-gray-500 leading-relaxed pl-0 sm:pl-11">{step.description}</p>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
              </Stagger>
            </div>
          </div>
        </section>
      )}

      {/* ============ 8. REQUIREMENTS ============ */}
      {requirements.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Prerequisites</Reveal>
            <Reveal as="p" className="text-gray-500 mb-8" delay={0.1}>What you need before starting</Reveal>
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {requirements.map((req, i) => {
                const label = typeof req === 'string' ? req : req.title || req.label;
                return (
                  <StaggerItem key={i}>
                    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <FiCheckCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{label}</span>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </div>
        </section>
      )}

      {/* ============ 9. TRAINING MODE DETAILS ============ */}
      {trainingModeDetails && (
        <section className="py-16 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">
              {service.training_mode || 'Training'} Mode Details
            </Reveal>
            <Reveal as="p" className="text-gray-500 mb-8" delay={0.1}>How the program is delivered</Reveal>
            <div className="grid lg:grid-cols-2 gap-8">
              {trainingModeDetails.map((detail, i) => {
                const items = detail.items || detail.topics || [];
                return (
                  <Reveal key={i} delay={0.05 * i}>
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full">
                      <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center mb-4">
                        {(() => {
                          const IconComp = HIGHLIGHT_ICONS[detail.icon] || FiLayers;
                          return <IconComp className="w-5 h-5 text-brand-orange" />;
                        })()}
                      </div>
                      <h3 className="font-bold text-gray-900 mb-3">{detail.title}</h3>
                      {detail.description && (
                        <p className="text-sm text-gray-500 mb-3">{detail.description}</p>
                      )}
                      {items.length > 0 && (
                        <ul className="space-y-2">
                          {items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                              <FiCheck className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                              <span>{typeof item === 'string' ? item : item.label || item.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ============ 10. GALLERY ============ */}
      <GallerySection images={service.service_gallery} />

      {/* ============ 11. TESTIMONIALS ============ */}
      {service.service_testimonials?.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Student Testimonials</Reveal>
            <Reveal as="p" className="text-gray-500 mb-10" delay={0.1}>Hear from our students</Reveal>
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.service_testimonials.map((t) => (
                <StaggerItem key={t.id}>
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      {t.photo ? (
                        <img
                          src={t.photo}
                          alt={t.name || 'Student'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-brand-orange/10 flex items-center justify-center">
                          <FiUsers className="w-5 h-5 text-brand-orange" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400">
                          {[t.course, t.company].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </div>
                    {t.rating > 0 && (
                      <div className="mb-3">
                        <StarRating rating={t.rating} />
                      </div>
                    )}
                    {t.review && (
                      <p className="text-sm text-gray-500 leading-relaxed flex-1 italic">"{t.review}"</p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ============ 12. FAQS ============ */}
      {service.service_faqs?.filter((f) => f.is_active !== false).length > 0 && (
        <section className="py-16 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2 text-center">Frequently Asked Questions</Reveal>
            <Reveal as="p" className="text-gray-500 mb-8 text-center" delay={0.1}>Everything you need to know</Reveal>
            <Reveal>
              <Accordion items={service.service_faqs.filter((f) => f.is_active !== false)} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ 13. STATISTICS ============ */}
      {service.service_statistics?.length > 0 && (
        <section className="py-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-blue to-blue-800" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.08),transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-white mb-2 text-center">By the Numbers</Reveal>
            <Reveal as="p" className="text-white/70 mb-10 text-center" delay={0.1}>Our impact in numbers</Reveal>
            <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {service.service_statistics.map((stat) => (
                <StaggerItem key={stat.id}>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-6 text-center">
                    <p className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                      <AnimatedCounter
                        value={stat.value}
                        prefix={stat.prefix || ''}
                        suffix={stat.suffix || ''}
                      />
                    </p>
                    {stat.label && (
                      <p className="text-white/70 text-sm font-medium">{stat.label}</p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ============ 14. RELATED SERVICES ============ */}
      {relatedServices.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal as="h2" className="text-2xl font-bold text-gray-900 mb-2">Related Services</Reveal>
            <Reveal as="p" className="text-gray-500 mb-8" delay={0.1}>Explore similar programs</Reveal>
            <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedServices.map((rs) => (
                <StaggerItem key={rs.id}>
                  <Link
                    to={`/services/${rs.slug}`}
                    className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full"
                  >
                    {rs.thumbnail ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={rs.thumbnail}
                          alt={rs.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center">
                        <FiLayers className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 group-hover:text-brand-orange transition-colors text-sm leading-snug">
                        {rs.title}
                      </h3>
                      {rs.service_categories?.name && (
                        <span className="text-xs text-gray-400 mt-1 block">{rs.service_categories.name}</span>
                      )}
                      {rs.duration && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-2">
                          <FiClock className="w-3 h-3" /> {rs.duration}
                        </span>
                      )}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}

      {/* ============ 15. CTA SECTION ============ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-orange to-orange-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <Reveal>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left text-white">
                <h2 className="text-2xl sm:text-3xl font-bold">Ready to Start Your Journey?</h2>
                <p className="text-white/80 mt-3 max-w-xl text-base sm:text-lg">
                  Take the first step towards mastering new skills. Enroll now or talk to our counsellor.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Button variant="primary" size="lg" to="/contact" className="bg-white text-brand-orange hover:bg-gray-100 shadow-lg">
                  Enroll Now <FiArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline-white"
                  size="lg"
                  onClick={() => setEnquiryOpen(true)}
                >
                  Talk to Counsellor
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ 16. ENQUIRY FORM MODAL ============ */}
      {enquiryOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setEnquiryOpen(false)}
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Enquire Now</h2>
              <button
                onClick={() => setEnquiryOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            {enquiryDone ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Thank You!</h3>
                <p className="text-sm text-gray-500">We have received your enquiry. Our team will get in touch with you shortly.</p>
                <button
                  onClick={() => setEnquiryOpen(false)}
                  className="mt-6 px-6 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="p-6 space-y-4">
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  Enquiring about <strong className="text-gray-900">{service.title}</strong>
                </p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                  <input
                    type="email"
                    value={enquiryForm.email}
                    onChange={(e) => setEnquiryForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Your phone number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Message *</label>
                  <textarea
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="Your message or question"
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all resize-none"
                  />
                </div>
                {enquiryError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                    <FiAlertCircle className="w-4 h-4 shrink-0" /> {enquiryError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={enquirySubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-brand-orange text-white hover:bg-brand-orange/90 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {enquirySubmitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FiSend className="w-4 h-4" />
                  )}
                  {enquirySubmitting ? 'Sending...' : 'Send Enquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CurriculumModule({ index, module, items }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center text-sm font-bold text-brand-orange shrink-0">
            {index + 1}
          </span>
          <span className="font-semibold text-gray-900 text-sm sm:text-base">{module.title}</span>
        </div>
        <span className="text-gray-400 shrink-0">
          {open ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
        </span>
      </button>
      {open && items.length > 0 && (
        <div className="px-4 pb-4">
          <ul className="space-y-2 ml-11">
            {items.map((item, j) => {
              const label = typeof item === 'string' ? item : item.title || item.label;
              return (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                  <FiCheckCircle className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                  <span>{label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
