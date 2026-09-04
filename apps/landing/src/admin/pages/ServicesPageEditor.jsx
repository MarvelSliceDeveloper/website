import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import useDirty from '../hooks/useDirty';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import { FiServer, FiTrendingUp, FiHelpCircle, FiChevronRight, FiHome } from 'react-icons/fi';
import * as LuIcons from 'react-icons/lu';
import PageShell from '../components/ui/PageShell';
import FolderTabs from '../components/ui/FolderTabs';
import ImageUploader from '../components/ImageUploader';
import { RepeatableItemList } from '../components/ui/RepeatableItemList';
import { RepeatableItemCard } from '../components/ui/RepeatableItemCard';

const LUCIDE_ICON_NAMES = Object.keys(LuIcons).filter(k => k.startsWith('Lu')).map(k => k.slice(2)).sort();

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return LUCIDE_ICON_NAMES.slice(0, 100);
    const q = search.toLowerCase();
    return LUCIDE_ICON_NAMES.filter(n => n.toLowerCase().includes(q)).slice(0, 100);
  }, [search]);

  const isValid = value && LUCIDE_ICON_NAMES.includes(value);
  const IconComp = value ? LuIcons[`Lu${value}`] : null;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Icon</label>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all cursor-pointer hover:border-admin-400">
        {IconComp ? <IconComp className="w-5 h-5 text-admin-500" /> : <div className="w-5 h-5" />}
        <span className={`flex-1 ${value ? '' : 'text-admin-400'}`}>{value || 'Select an icon...'}</span>
        <FiChevronRight className={`w-4 h-4 text-admin-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {!isValid && value && <p className="text-xs text-destructive-500 mt-1">Invalid icon name — must be a valid Lucide icon</p>}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-admin-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-admin-100">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search icons..." autoFocus
              className="w-full px-2 py-1.5 bg-white border border-admin-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-admin-500/20" />
          </div>
          <div className="overflow-y-auto admin-scrollbar flex-1">
            {filtered.length === 0 ? (
              <p className="p-3 text-sm text-neutral-400 text-center">No icons found</p>
            ) : (
              filtered.map((name) => {
                const Ic = LuIcons[`Lu${name}`];
                return (
                  <button key={name} type="button" onClick={() => { onChange(name); setOpen(false); setSearch(''); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left hover:bg-white transition-colors cursor-pointer ${value === name ? 'bg-white text-admin-700 font-medium' : 'text-admin-700'}`}>
                    {Ic && <Ic className="w-5 h-5 text-admin-500 shrink-0" />}
                    <span>{name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PAGE_PATH = '/services';

const DEFAULT_STEPS = [
  { number: '01', title: 'Enroll', description: 'Select your program and begin your journey with guided counselor support.', icon: 'ClipboardCheck', colorHex: '#7C3AED' },
  { number: '02', title: 'Learn', description: 'Master concepts through live sessions, labs, and expert-led courses.', icon: 'BookOpen', colorHex: '#EC4899' },
  { number: '03', title: 'Build', description: 'Apply skills on real-world projects to build a professional portfolio.', icon: 'Wrench', colorHex: '#F59E0B' },
  { number: '04', title: 'Assess', description: 'Track growth through evaluations, mock interviews, and feedback.', icon: 'ClipboardCheck', colorHex: '#06B6D4' },
  { number: '05', title: 'Certify', description: 'Earn industry-recognized certifications that validate your expertise.', icon: 'Award', colorHex: '#3B82F6' },
  { number: '06', title: 'Succeed', description: 'Launch your career with placement support and hiring-partner connections.', icon: 'Rocket', colorHex: '#22C55E' },
];

const DEFAULT_FEATURES = [
  { title: 'Personalized Guidance', description: 'One-on-one counselor support at every stage.', icon: 'ClipboardCheck', colorHex: '#7C3AED' },
  { title: 'Hands-on Learning', description: 'Projects & labs to build real industry skills.', icon: 'UserCheck', colorHex: '#EC4899' },
  { title: 'Career Support', description: 'Resume building, mock interviews & placements.', icon: 'ClipboardList', colorHex: '#06B6D4' },
  { title: 'Lifetime Access', description: 'Access resources & updates even after you succeed.', icon: 'ShieldCheck', colorHex: '#22C55E' },
];

export default function ServicesPageEditor() {
  const [activeTab, setActiveTab] = useState('services');
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [navItemId, setNavItemId] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const navItemIdRef = useRef(null);
  const savingRef = useRef(false);

  const [services, setServices] = useState([]);
  const [journeyHeading, setJourneyHeading] = useState('Your Learning Journey');
  const [journeySubheading, setJourneySubheading] = useState('A structured path from enrollment to career success.');
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [journeyFeatures, setJourneyFeatures] = useState(DEFAULT_FEATURES);
  const [faqHeading, setFaqHeading] = useState('Frequently Asked Questions');
  const [faqSubheading, setFaqSubheading] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [hero, setHero] = useState({ heading: '', subheading: '', hero_image: '' });
  const { dirty, reset } = useDirty([hero, services, journeyHeading, journeySubheading, steps, journeyFeatures, faqHeading, faqSubheading, faqs], loading);

  useEffect(() => {
    async function resolve() {
      let { data: items } = await supabase.from('nav_items').select('*').eq('path', PAGE_PATH).eq('is_active', true).order('id').limit(1);
      let item = items?.[0] || null;
      if (!item) {
        const { data: inactiveItems } = await supabase.from('nav_items').select('*').eq('path', PAGE_PATH).order('id').limit(1);
        item = inactiveItems?.[0] || null;
        if (item) {
          await supabase.from('nav_items').update({ is_active: true }).eq('id', item.id);
          await supabase.from('nav_items').update({ is_active: false }).eq('path', PAGE_PATH).neq('id', item.id);
        }
      }
      if (!item) {
        const { data: newItem } = await supabase.from('nav_items').insert({ label: 'Services', path: PAGE_PATH, is_active: true, sort_order: 99 }).select('*').single();
        item = newItem || null;
      }
      setNavItemId(item?.id);
      navItemIdRef.current = item?.id;
      if (item?.id) {
        const { data: pages } = await supabase.from('nav_pages').select('*').eq('nav_item_id', item.id).order('id').limit(1);
        const page = pages?.[0] || null;
        if (page) {
          setPageId(page.id);
          setHero({ heading: page.heading || '', subheading: page.subheading || '', hero_image: page.hero_image || '' });
          const secs = page.sections || [];
          const cardsSec = secs.find(s => s.section_type === 'cards');
          if (cardsSec?.items) setServices(cardsSec.items.map(i => typeof i === 'string' ? { title: i, description: '', icon: '' } : { ...i, icon: i.icon || '' }));
          const timelineSec = secs.find(s => s.section_type === 'timeline');
          if (timelineSec) {
            setJourneyHeading(timelineSec.heading || 'Your Learning Journey');
            setJourneySubheading(timelineSec.subheading || 'A structured path from enrollment to career success.');
            if (timelineSec.items?.length) setSteps(timelineSec.items);
            else setSteps(DEFAULT_STEPS);
            if (timelineSec.features?.length) setJourneyFeatures(timelineSec.features);
            else setJourneyFeatures(DEFAULT_FEATURES);
          } else {
            setSteps(DEFAULT_STEPS);
            setJourneyFeatures(DEFAULT_FEATURES);
          }
          const faqSec = secs.find(s => s.section_type === 'faq_list');
          if (faqSec) {
            setFaqHeading(faqSec.heading || 'Frequently Asked Questions');
            setFaqSubheading(faqSec.subheading || '');
            if (faqSec.items) setFaqs(faqSec.items);
          }
        }
      }
      setLoading(false);
    }
    resolve();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');

    const wordCount = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
    const validate = (items, label) => {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if ((item.title || '').length > 50) return `${label} ${i + 1}: title exceeds 50 characters.`;
        if (wordCount(item.description) > 40) return `${label} ${i + 1}: description exceeds 40 words.`;
        if (item.number !== undefined && (item.number || '').length > 2) return `${label} ${i + 1}: step number exceeds 2 characters.`;
        if (item.colorHex && !/^#[0-9a-fA-F]{6}$/.test(item.colorHex)) return `${label} ${i + 1}: color must be a valid hex (#RRGGBB).`;
      }
      return null;
    };
    const validationError = validate(services, 'Service') || validate(steps, 'Step');
    if (validationError) {
      setSaveError(validationError);
      setSaving(false);
      savingRef.current = false;
      return;
    }

    const sections = [
      services.length > 0 ? { section_type: 'cards', heading: 'What We Offer', items: services } : null,
      steps.length > 0 ? {
        section_type: 'timeline',
        heading: journeyHeading || 'Your Learning Journey',
        subheading: journeySubheading || 'A structured path from enrollment to career success.',
        items: steps,
        features: journeyFeatures,
      } : null,
      faqs.length > 0 ? {
        section_type: 'faq_list',
        heading: faqHeading || 'Frequently Asked Questions',
        subheading: faqSubheading || '',
        items: faqs,
      } : null,
    ].filter(Boolean);
    if (!navItemId && !navItemIdRef.current) { setSaveError('No nav item linked'); setSaving(false); savingRef.current = false; return; }
    const payload = { nav_item_id: navItemId || navItemIdRef.current, heading: hero.heading || null, subheading: hero.subheading, hero_image: hero.hero_image || null, sections, is_published: true };
    let res;
    if (pageId) {
      res = await supabase.from('nav_pages').update(payload).eq('id', pageId);
    } else {
      res = await supabase.from('nav_pages').insert(payload).select('id').single();
    }
    if (res.error) {
      setSaveError(res.error.message);
      savingRef.current = false;
      setSaving(false);
    } else {
      if (res.data?.id) setPageId(res.data.id);
      setSaved(true);
      reset();
      queryClient.invalidateQueries({ queryKey: ['navPage', navItemId] });
      queryClient.invalidateQueries({ queryKey: ['navPageData'] });
      queryClient.invalidateQueries({ queryKey: ['servicesPage'] });
      queryClient.invalidateQueries({ queryKey: ['learningJourney'] });
      setTimeout(() => setSaved(false), 2000);
      savingRef.current = false;
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all';

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { id: 'hero-section', title: 'Hero', icon: FiHome },
    { id: 'services', title: 'What We Offer', icon: FiServer },
    { id: 'journey', title: 'Learning Journey', icon: FiTrendingUp },
    { id: 'faqs', title: 'FAQs', icon: FiHelpCircle },
  ];

  return (
    <PageShell backTo="/admin" title="">
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <div className="flex flex-col">
        <div className="flex items-end justify-between">
          <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <form
          onSubmit={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
          }}
          className="bg-white border border-gray-300 rounded-b-[20px] rounded-tr-[20px] shadow-sm p-6 space-y-6 relative z-30 -mt-[2px]"
        >

          {activeTab === 'hero-section' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                  <input type="text" value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} placeholder="Our Services" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
                  <input type="text" value={hero.subheading} onChange={(e) => setHero({ ...hero, subheading: e.target.value })} placeholder="A short intro line..." className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Hero Image</label>
                <ImageUploader value={hero.hero_image} onChange={(v) => setHero({ ...hero, hero_image: v })} bucket="pages" />
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              <RepeatableItemList
                title="Services"
                items={services}
                onAdd={() => setServices([...services, { title: '', description: '', icon: '' }])}
                addLabel="Add Service"
                renderItem={(s, i) => (
                  <RepeatableItemCard key={i} index={i} label="Service" onRemove={() => setServices(services.filter((_, j) => j !== i))}>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <IconPicker value={s.icon} onChange={(v) => { const u = [...services]; u[i] = { ...u[i], icon: v }; setServices(u); }} />
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Service Title (max 50 chars)</label>
                          <input type="text" value={s.title} onChange={(e) => { const v = e.target.value.slice(0, 50); const u = [...services]; u[i] = { ...u[i], title: v }; setServices(u); }} placeholder="Service title" maxLength={50} className={inputClass} />
                          <p className="text-[10px] text-neutral-400 mt-1">{(s.title || '').length}/50</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                        <textarea
                          value={s.description}
                          onChange={(e) => {
                            let v = e.target.value;
                            const words = v.split(/\s+/).filter(Boolean);
                            if (words.length > 40) v = words.slice(0, 40).join(' ');
                            const u = [...services]; u[i] = { ...u[i], description: v }; setServices(u);
                          }}
                          rows={3}
                          placeholder="Brief description..."
                          className={inputClass}
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">{(s.description || '').trim().split(/\s+/).filter(Boolean).length}/40 words</p>
                      </div>
                    </div>
                  </RepeatableItemCard>
                )}
              />
            </div>
          )}

          {activeTab === 'journey' && (
            <div className="space-y-8">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">Section Titles</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Section Heading</label>
                    <input type="text" value={journeyHeading} onChange={(e) => setJourneyHeading(e.target.value)} placeholder="Your Learning Journey" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Section Subheading</label>
                    <input type="text" value={journeySubheading} onChange={(e) => setJourneySubheading(e.target.value)} placeholder="A structured path from enrollment to career success." className={inputClass} />
                  </div>
                </div>
              </div>

              <RepeatableItemList
                title="Learning Journey Steps"
                items={steps}
                onAdd={() => setSteps([...steps, { number: String(steps.length + 1).padStart(2, '0'), title: '', description: '', icon: 'ClipboardCheck' }])}
                addLabel="Add Step"
                renderItem={(s, i) => (
                  <RepeatableItemCard key={i} index={i} label="Step" onRemove={() => setSteps(steps.filter((_, j) => j !== i))}>
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Step Number</label>
                          <input type="text" value={s.number || String(i + 1).padStart(2, '0')} onChange={(e) => { const u = [...steps]; u[i] = { ...u[i], number: e.target.value }; setSteps(u); }} placeholder="01" maxLength={2} className={inputClass} />
                        </div>
                        <IconPicker value={s.icon} onChange={(v) => { const u = [...steps]; u[i] = { ...u[i], icon: v }; setSteps(u); }} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Step Title (max 50 chars)</label>
                        <input type="text" value={s.title} onChange={(e) => { const v = e.target.value.slice(0, 50); const u = [...steps]; u[i] = { ...u[i], title: v }; setSteps(u); }} placeholder="Step title" maxLength={50} className={inputClass} />
                        <p className="text-[10px] text-neutral-400 mt-1">{(s.title || '').length}/50</p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                        <textarea
                          value={s.description}
                          onChange={(e) => {
                            let v = e.target.value;
                            const words = v.split(/\s+/).filter(Boolean);
                            if (words.length > 40) v = words.slice(0, 40).join(' ');
                            const u = [...steps]; u[i] = { ...u[i], description: v }; setSteps(u);
                          }}
                          rows={3}
                          placeholder="Brief description..."
                          className={inputClass}
                        />
                        <p className="text-[10px] text-neutral-400 mt-1">{(s.description || '').trim().split(/\s+/).filter(Boolean).length}/40 words</p>
                      </div>
                    </div>
                  </RepeatableItemCard>
                )}
              />

              <RepeatableItemList
                title="Bottom Feature Banner Items"
                items={journeyFeatures}
                onAdd={() => setJourneyFeatures([...journeyFeatures, { title: '', description: '', icon: 'ClipboardCheck' }])}
                addLabel="Add Feature"
                renderItem={(f, i) => (
                  <RepeatableItemCard key={i} index={i} label="Feature" onRemove={() => setJourneyFeatures(journeyFeatures.filter((_, j) => j !== i))}>
                    <div className="space-y-4">
                      {/* Icon & Title in 1 line */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <IconPicker value={f.icon} onChange={(v) => { const u = [...journeyFeatures]; u[i] = { ...u[i], icon: v }; setJourneyFeatures(u); }} />
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Feature Title</label>
                          <input type="text" value={f.title} onChange={(e) => { const u = [...journeyFeatures]; u[i] = { ...u[i], title: e.target.value }; setJourneyFeatures(u); }} placeholder="Feature title" className={inputClass} />
                        </div>
                      </div>
                      {/* Description below */}
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                        <input type="text" value={f.description} onChange={(e) => { const u = [...journeyFeatures]; u[i] = { ...u[i], description: e.target.value }; setJourneyFeatures(u); }} placeholder="Brief description..." className={inputClass} />
                      </div>
                    </div>
                  </RepeatableItemCard>
                )}
              />
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-800">FAQ Section Header</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                    <input type="text" value={faqHeading} onChange={(e) => setFaqHeading(e.target.value)} placeholder="Frequently Asked Questions" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading (Optional)</label>
                    <input type="text" value={faqSubheading} onChange={(e) => setFaqSubheading(e.target.value)} placeholder="Find answers to common questions" className={inputClass} />
                  </div>
                </div>
              </div>

              <RepeatableItemList
                title="FAQs"
                items={faqs}
                onAdd={() => setFaqs([...faqs, { question: '', answer: '' }])}
                addLabel="Add FAQ"
                renderItem={(f, i) => (
                  <RepeatableItemCard key={i} index={i} label="FAQ" onRemove={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Question</label>
                        <input type="text" value={f.question} onChange={(e) => { const u = [...faqs]; u[i] = { ...u[i], question: e.target.value }; setFaqs(u); }} placeholder="Question" className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Answer</label>
                        <textarea value={f.answer} onChange={(e) => { const u = [...faqs]; u[i] = { ...u[i], answer: e.target.value }; setFaqs(u); }} rows={2} placeholder="Answer..." className={inputClass} />
                      </div>
                    </div>
                  </RepeatableItemCard>
                )}
              />
            </div>
          )}

        </form>
        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
      </div>
    </PageShell>
  );
}
