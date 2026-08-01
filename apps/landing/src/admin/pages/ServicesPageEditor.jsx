import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import useDirty from '../hooks/useDirty';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import { FiSave, FiAlertCircle, FiPlus, FiTrash2, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import SectionAccordion from '../components/ui/SectionAccordion';
import FolderTabs from '../components/ui/FolderTabs';
import { RepeatableItemList } from '../components/ui/RepeatableItemList';
import { RepeatableItemCard } from '../components/ui/RepeatableItemCard';

function ImageUploader({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `services/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('pages').getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-transparent transition-all" placeholder="Paste URL or upload..." />
        <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2.5 border-2 border-dashed border-admin-200 rounded-lg text-sm text-admin-500 hover:border-admin-500 hover:text-admin-600 transition-colors">
          {uploading ? <span className="w-4 h-4 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /> : <FiUpload className="w-4 h-4" />}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {value && <img src={value} alt="" className="mt-2 h-28 w-full object-cover rounded-lg border border-admin-200" />}
    </div>
  );
}

const PAGE_PATH = '/services';

export default function ServicesPageEditor() {

  const [activeTab, setActiveTab] = useState('hero-section');
const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [navItem, setNavItem] = useState(null);
  const [navItemId, setNavItemId] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const navItemIdRef = useRef(null);
  const savingRef = useRef(false);

  const [hero, setHero] = useState({ heading: '', subheading: '', hero_image: '' });
  const [services, setServices] = useState([]);
  const [cta, setCta] = useState({ heading: '', content: '', link: '' });
  const [faqs, setFaqs] = useState([]);
  const { dirty, reset } = useDirty([hero, services, cta, faqs], loading);

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
      setNavItem(item);
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
          if (cardsSec?.items) setServices(cardsSec.items.map(i => typeof i === 'string' ? { title: i, description: '' } : i));
          const ctaSec = secs.find(s => s.section_type === 'cta');
          if (ctaSec) setCta({ heading: ctaSec.heading || '', content: ctaSec.content || '', link: ctaSec.image_url || '' });
          const faqSec = secs.find(s => s.section_type === 'faq_list');
          if (faqSec?.items) setFaqs(faqSec.items);
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
    const sections = [
      services.length > 0 ? { section_type: 'cards', heading: 'Our Services', items: services } : null,
      cta.heading || cta.content ? { section_type: 'cta', heading: cta.heading, content: cta.content, image_url: cta.link || null } : null,
      faqs.length > 0 ? { section_type: 'faq_list', heading: 'Frequently Asked Questions', items: faqs } : null,
    ].filter(Boolean);
    if (!navItemId && !navItemIdRef.current) { setSaveError('No nav item linked'); setSaving(false); savingRef.current = false; return; }
    const payload = { nav_item_id: navItemId || navItemIdRef.current, heading: hero.heading, subheading: hero.subheading, hero_image: hero.hero_image || null, sections, is_published: true };
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
      setTimeout(() => setSaved(false), 2000);
      savingRef.current = false;
      setSaving(false);
    }
  }

  const inputClass = 'w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all';

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /></div>;

  const tabs = [
    { id: 'hero-section', title: 'Hero' },
    { id: 'services', title: 'Services' },
    { id: 'call-to-action', title: 'CTA' },
    { id: 'faqs', title: 'FAQs' },
  ];

  return (
    <PageShell backTo="/admin" title="">
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <div className="flex flex-col">
        <div className="flex items-end justify-between">
          <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <form onSubmit={handleSave} className="bg-white border border-gray-300 rounded-b-[20px] rounded-tr-[20px] shadow-sm p-6 space-y-6 relative z-30 -mt-[2px]">

      {activeTab === 'hero-section' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
              <input type="text" value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} placeholder="Heading" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
              <input type="text" value={hero.subheading} onChange={(e) => setHero({ ...hero, subheading: e.target.value })} placeholder="Subheading" className={inputClass} />
            </div>
          </div>
          <div>
            <ImageUploader value={hero.hero_image} onChange={(v) => setHero({ ...hero, hero_image: v })} label="Hero Image" />
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="space-y-6">
          <RepeatableItemList 
             title="Services" 
             items={services} 
             onAdd={() => setServices([...services, { title: '', description: '' }])}
             addLabel="Add Service"
             renderItem={(s, i) => (
               <RepeatableItemCard key={i} index={i} label="Service" onRemove={() => setServices(services.filter((_, j) => j !== i))}>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Service Title</label>
                     <input type="text" value={s.title} onChange={(e) => { const u = [...services]; u[i] = { ...u[i], title: e.target.value }; setServices(u); }} placeholder="Service title" className={inputClass} />
                   </div>
                   <div>
                     <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                     <textarea value={s.description} onChange={(e) => { const u = [...services]; u[i] = { ...u[i], description: e.target.value }; setServices(u); }} rows={2} placeholder="Brief description..." className={inputClass} />
                   </div>
                 </div>
               </RepeatableItemCard>
             )}
          />
        </div>
      )}

      {activeTab === 'call-to-action' && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
              <input type="text" value={cta.heading} onChange={(e) => setCta({ ...cta, heading: e.target.value })} placeholder="Heading" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subtext</label>
              <input type="text" value={cta.content} onChange={(e) => setCta({ ...cta, content: e.target.value })} placeholder="Subtext" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Button Link</label>
            <input type="text" value={cta.link} onChange={(e) => setCta({ ...cta, link: e.target.value })} placeholder="Button link URL" className={inputClass} />
          </div>
        </div>
      )}

      {activeTab === 'faqs' && (
        <div className="space-y-6">
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
