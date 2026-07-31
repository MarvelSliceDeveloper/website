import { useState } from 'react';
import { FiCheckCircle, FiMapPin, FiPhone, FiMail, FiBriefcase } from 'react-icons/fi';
import * as LuIcons from 'react-icons/lu';
import Button from './Button';
import Card from './Card';
import AccordionItem from './AccordionItem';
import Reveal, { Stagger, StaggerItem } from './Reveal';
import ContactSection from './ContactSection';

function safeParse(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  if (val && typeof val === 'object' && !Array.isArray(val)) return [val];
  return [];
}

function safeString(val) {
  if (typeof val === 'string') return val;
  if (val && typeof val === 'object') return String(val);
  return val || '';
}

function DynamicIcon({ name, className }) {
  if (!name) return null;
  const IconComp = LuIcons[`Lu${name}`];
  if (!IconComp) return null;
  return <IconComp className={className} />;
}

function FaqListSection({ section }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Reveal className="w-full max-w-[70%] mx-auto">
      {section.heading && <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">{section.heading}</h2>}
      <div className="space-y-2">
        {(section.items || []).map((faq, i) => (
          <AccordionItem
            key={i}
            title={faq.question}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          >{faq.answer}</AccordionItem>
        ))}
      </div>
    </Reveal>
  );
}

export default function SectionRenderer({ section }) {
  switch (section.section_type) {
    case 'text': {
      const paragraphs = safeParse(section.content);
      const content = Array.isArray(paragraphs) && paragraphs.length > 0
        ? paragraphs.join('\n\n')
        : safeString(section.content);
      const ha = section.headingAlign || 'center';
      const ca = section.contentAlign || 'center';
      return (
        <Reveal className={`py-16 max-w-4xl mx-auto text-${ca}`}>
          {section.heading && <h2 className={`text-3xl sm:text-4xl font-bold text-blue-700 mb-6 text-${ha}`}>{section.heading}</h2>}
          {content && <div className="text-gray-700 text-base leading-relaxed">{content}</div>}
        </Reveal>
      );
    }
    case 'text_stats': {
      const paragraphs = safeParse(section.content);
      const content = Array.isArray(paragraphs) && paragraphs.length > 0
        ? paragraphs.join('\n\n')
        : safeString(section.content);
      const items = safeParse(section.items);
      const ha = section.headingAlign || 'center';
      const ca = section.contentAlign || 'center';
      return (
        <div className="py-16">
          <div className={`max-w-4xl mx-auto text-${ca}`}>
            {section.heading && <h2 className={`text-3xl sm:text-4xl font-bold text-blue-700 mb-6 text-${ha}`}>{section.heading}</h2>}
            {content && <div className="text-gray-700 text-base leading-relaxed mb-10">{content}</div>}
          </div>
          {items.length > 0 && (
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {items.map((stat, i) => (
                <div key={i} className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-default">
                  <div className="text-3xl sm:text-4xl font-bold text-orange-500">{stat.number}</div>
                  <div className="text-sm sm:text-base text-gray-600 mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    case 'image':
      return (
        <Reveal className="max-w-4xl mx-auto text-center">
          {section.heading && <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-4">{section.heading}</h2>}
          {section.image_url && <img src={section.image_url} alt={section.heading || ''} className="w-full max-h-96 object-cover rounded-xl shadow-sm" />}
          {section.content && <p className="text-text-gray text-base mt-4">{section.content}</p>}
        </Reveal>
      );
    case 'cards':
      return (
        <div>
          {section.heading && <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">{section.heading}</Reveal>}
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(section.content || '').split('\n').filter(Boolean).map((item, i) => (
              <StaggerItem key={i} className="h-full">
                <Card className="p-6">
                  {section.image_url && <img src={section.image_url} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />}
                  <p className="text-dark-navy font-medium">{item}</p>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    case 'features':
      return (
        <div className="max-w-3xl mx-auto">
          {section.heading && <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">{section.heading}</Reveal>}
          <Stagger className="space-y-4">
            {(section.items || (section.content || '').split('\n').filter(Boolean)).map((item, i) => (
              <StaggerItem key={i} className="flex items-start gap-3">
                <FiCheckCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                <span className="text-text-gray text-base">{(typeof item === 'string') ? item : item.title}</span>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    case 'stats_row': {
      const items = safeParse(section.items);
      if (items.length === 0) return null;
      const ha = section.headingAlign || 'center';
      return (
        <Reveal className="py-16">
          {section.heading && <h2 className={`text-3xl sm:text-4xl font-bold text-dark-navy mb-8 text-${ha}`}>{section.heading}</h2>}
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((stat, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-default">
                <div className="text-3xl sm:text-4xl font-bold text-orange-500">{stat.number}</div>
                <div className="text-sm sm:text-base text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      );
    }
    case 'team_grid': {
      const items = safeParse(section.items);
      if (items.length === 0) return null;
      return (
        <div>
          {section.heading && <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-8 text-center">{section.heading}</Reveal>}
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {items.map((member, i) => (
              <StaggerItem key={i} className="h-full">
                <Card className="p-6 text-center h-full">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-blue to-brand-orange flex items-center justify-center text-white text-2xl font-bold mb-3 overflow-hidden">
                    {member.image_url ? <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" /> : (member.name?.[0] || '?')}
                  </div>
                  <h3 className="font-bold text-dark-navy">{member.name}</h3>
                  <p className="text-sm text-brand-orange font-medium mt-0.5">{member.role}</p>
                  {member.bio && <p className="text-xs text-text-gray mt-2 line-clamp-3">{member.bio}</p>}
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    }
    case 'contact_info':
      return (
        <Reveal className="max-w-lg mx-auto">
          {section.heading && <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">{section.heading}</h2>}
          <div className="space-y-4">
            {section.address && <div className="flex items-start gap-4"><div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0"><FiMapPin className="w-5 h-5 text-brand-orange" /></div><div className="text-text-gray text-base whitespace-pre-line">{section.address}</div></div>}
            {section.phone && <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0"><FiPhone className="w-5 h-5 text-brand-orange" /></div><a href={`tel:${section.phone}`} className="text-text-gray text-base hover:text-brand-orange transition-colors">{section.phone}</a></div>}
            {section.email && <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center shrink-0"><FiMail className="w-5 h-5 text-brand-orange" /></div><a href={`mailto:${section.email}`} className="text-text-gray text-base hover:text-brand-orange transition-colors">{section.email}</a></div>}
          </div>
        </Reveal>
      );
    case 'map_embed': {
      const raw = section.content || '';
      const match = raw.match(/src=["']([^"']+)["']/);
      const mapSrc = (match ? match[1] : raw).trim();
      if (!mapSrc) return null;
      return (
        <Reveal>
          {section.heading && <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-6 text-center">{section.heading}</h2>}
          <div className="relative left-1/2 -translate-x-1/2 w-screen">
            <iframe
              src={mapSrc}
              className="w-full aspect-[16/9] max-h-[450px]"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Map"
            />
          </div>
        </Reveal>
      );
    }
    case 'faq_list':
      return <FaqListSection section={section} />;
    case 'positions':
      return (
        <div>
          {section.heading && <Reveal as="h2" className="text-xl sm:text-2xl font-bold text-dark-navy mb-8 text-center">{section.heading}</Reveal>}
          <Stagger className="max-w-4xl mx-auto space-y-4">
            {(section.items || []).map((pos, i) => (
              <StaggerItem key={i}>
                <Card className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-dark-navy text-lg">{pos.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-text-gray">
                      {pos.location && <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5" />{pos.location}</span>}
                      {pos.type && <span className="flex items-center gap-1"><FiBriefcase className="w-3.5 h-3.5" />{pos.type}</span>}
                    </div>
                    {pos.description && <p className="text-sm text-text-gray mt-3">{pos.description}</p>}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0">Apply Now</Button>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      );
    case 'cta':
      return (
        <section className="relative overflow-hidden" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
          <div className="absolute inset-0 bg-[#0B2D6B]">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0B2D6B 0%, #1642a0 25%, #1a8a7d 65%, #2ec4b6 100%)' }} />
            <div className="absolute top-[-60px] right-[10%] w-48 h-48 rounded-full border-[3px] border-white/10" />
            <div className="absolute top-[20px] right-[5%] w-28 h-28 rounded-full border-[2px] border-white/8" />
            <div className="absolute bottom-[-40px] left-[15%] w-36 h-36 rounded-full border-[3px] border-white/10" />
            <div className="absolute bottom-[30px] left-[8%] w-20 h-20 rounded-full border-[2px] border-white/8" />
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
            <div className="absolute top-0 left-[30%] w-[350px] h-[350px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(23,92,221,0.3) 0%, transparent 60%)' }} />
            <div className="absolute bottom-0 right-[20%] w-[300px] h-[300px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(46,196,182,0.25) 0%, transparent 60%)' }} />
          </div>
          <Reveal variant="scale">
            <div className="relative max-w-7xl mx-auto px-10 sm:px-16 lg:px-20 py-16 sm:py-20">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
                <div className="flex-1 text-center lg:text-left">
                  {section.heading && <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-white">{section.heading}</h2>}
                  {section.content && <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">{section.content}</p>}
                </div>
                <div className="shrink-0">
                  <Button to={section.cta_link || '/contact'} variant="outline" size="lg" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20">
                    {section.heading || 'Get in Touch'}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      );
    case 'feature_grid': {
      const items = safeParse(section.items);
      if (items.length === 0) return null;
      const circleBgColors = ['bg-orange-100', 'bg-blue-100', 'bg-green-100', 'bg-purple-100'];
      const iconColors = ['text-orange-500', 'text-blue-500', 'text-green-500', 'text-purple-500'];
      const ha = section.headingAlign || 'center';
      const sa = section.subheadingAlign || 'center';
      const barMargin = ha === 'center' ? 'mx-auto' : ha === 'right' ? 'ml-auto' : 'mr-auto';
      return (
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            {section.heading && (
              <Reveal as="div" className={`mb-4 text-${ha}`}>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">{section.heading}</h2>
                <div className={`w-16 h-1 bg-orange-500 mt-2 ${barMargin}`} />
              </Reveal>
            )}
            {section.subheading && (
              <Reveal as="p" className={`text-gray-500 text-base max-w-2xl leading-relaxed text-${sa} ${sa === 'center' ? 'mx-auto' : ''}`}>
                {section.subheading}
              </Reveal>
            )}
            <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
              {items.map((item, i) => (
                <StaggerItem key={i} className="h-full">
                  <Card className="p-6 text-center h-full bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                    <div className={`w-16 h-16 rounded-full ${circleBgColors[i % 4]} flex items-center justify-center mx-auto mb-4`}>
                      <DynamicIcon name={item.icon} className={`w-7 h-7 ${iconColors[i % 4]}`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      );
    }
    case 'content_media_list': {
      const listItems = safeParse(section.list_items);
      return (
        <Reveal>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              {section.heading && <h2 className="text-xl sm:text-2xl font-bold text-dark-navy mb-4">{section.heading}</h2>}
              {section.content && <p className="text-text-gray text-base leading-relaxed mb-4">{section.content}</p>}
              {listItems.length > 0 && (
                <ul className="space-y-2">
                  {listItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <FiCheckCircle className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                      <span className="text-text-gray">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {section.image_url && (
              <div className="flex justify-center">
                <img src={section.image_url} alt={section.heading || ''} className="w-full max-w-md rounded-xl shadow-sm border border-gray-100" />
              </div>
            )}
          </div>
        </Reveal>
      );
    }
    case 'contact_form':
      return <ContactSection section={section} />;
    default:
      return null;
  }
}
