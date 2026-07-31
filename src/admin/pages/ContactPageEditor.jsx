import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import AdminButton from '../components/AdminButton';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import { FiSave, FiAlertCircle, FiPlus, FiTrash2, FiUpload, FiArrowLeft } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import SectionAccordion from '../components/ui/SectionAccordion';
import { RepeatableItemList } from '../components/ui/RepeatableItemList';
import { RepeatableItemCard } from '../components/ui/RepeatableItemCard';

function ImageUploader({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `contact/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
          className="flex-1 px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" placeholder="Paste URL or upload..." />
        <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-admin-200 rounded-lg text-sm text-admin-500 hover:border-admin-500 hover:text-admin-600 transition-colors">
          {uploading ? <span className="w-4 h-4 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /> : <FiUpload className="w-4 h-4" />}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {value && <img src={value} alt="" className="mt-2 h-28 w-full object-cover rounded-lg border border-admin-200" />}
    </div>
  );
}

const PAGE_PATH = '/contact';

const DEFAULT_CONTACT_CONTENT = {
  left_heading: 'Get in Touch',
  left_subtitle: "We'd love to hear from you. Reach out to us and we'll get back to you as soon as possible.",
  address: '',
  display_phone: '',
  tel_link: '',
  email: '',
  business_hours: '',
  gradient_start: '#0B2D6B',
  gradient_end: '#1E56C7',
  show_shadow: true,
  success_message: 'Thank you! Your message has been received. Our team will contact you soon.',
  map_embed_url: '',
};

export default function ContactPageEditor() {

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
  const [contactContent, setContactContent] = useState(DEFAULT_CONTACT_CONTENT);
  const [showContactSection, setShowContactSection] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const { dirty, reset } = useDirty([hero, contactContent, faqs], loading);

  function updateContent(field, value) {
    setContactContent((prev) => ({ ...prev, [field]: value }));
  }

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
        const { data: newItem } = await supabase.from('nav_items').insert({ label: 'Contact', path: PAGE_PATH, is_active: true, sort_order: 99 }).select('*').single();
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

          const contactFormSec = secs.find(s => s.section_type === 'contact_form');
          if (contactFormSec) {
            setShowContactSection(true);
            setContactContent({ ...DEFAULT_CONTACT_CONTENT, ...contactFormSec.content });
          } else {
            const contactInfoSec = secs.find(s => s.section_type === 'contact_info');
            if (contactInfoSec) {
              setShowContactSection(true);
              setContactContent((prev) => ({
                ...prev,
                left_heading: contactInfoSec.heading || prev.left_heading,
                address: contactInfoSec.address || prev.address,
                display_phone: contactInfoSec.phone || prev.display_phone,
                tel_link: contactInfoSec.phone || prev.tel_link,
                email: contactInfoSec.email || prev.email,
              }));
            }
          }

          const faqSec = secs.find(s => s.section_type === 'faq_list');
          if (faqSec?.items) setFaqs(faqSec.items);

          const mapSec = secs.find(s => s.section_type === 'map_embed');
          if (mapSec?.content) {
            const raw = mapSec.content;
            const match = raw.match(/src="([^"]+)"/);
            updateContent('map_embed_url', match ? match[1] : raw);
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

    const sections = [
      showContactSection ? { section_type: 'contact_form', content: contactContent } : null,
      faqs.length > 0 ? { section_type: 'faq_list', heading: 'Frequently Asked Questions', items: faqs } : null,
      contactContent.map_embed_url ? { section_type: 'map_embed', content: contactContent.map_embed_url } : null,
    ].filter(Boolean);

    if (!navItemId && !navItemIdRef.current) { setSaveError('No nav item linked — please refresh and try again'); setSaving(false); savingRef.current = false; return; }

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

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" /></div>;

  const inputCls = "w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all";
  const labelCls = "block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider";

  const tabs = [
    { id: 'hero-section', title: 'Hero' },
    { id: 'contact-section', title: 'Contact' },
    { id: 'left-side-company-details', title: 'Company Details' },
    { id: 'right-side-form-settings', title: 'Form' },
    { id: 'style-settings', title: 'Style' },
    { id: 'map-embed', title: 'Map' },
    { id: 'faqs', title: 'FAQs' },
  ];
  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <PageShell backTo="/admin"
      title=""
      maxWidth="max-w-none"
    >
      <div className="flex gap-6 items-start">

        <div className="transition-all duration-200 w-[240px] shrink-0">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-visible">
            <div className="bg-white rounded-md flex flex-col overflow-visible ring-1 ring-gray-300" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative w-full flex flex-col text-left px-4 py-3 border-b border-gray-100 last:border-b-0 focus:outline-none ${
                      index === 0 ? 'rounded-t-md' : ''
                    } ${
                      index === tabs.length - 1 ? 'rounded-b-md' : ''
                    } ${
                      isActive ? 'bg-admin-600 text-white shadow-md z-10' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {tab.title}
                    </div>
                    {isActive && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-[15px] w-0 h-0 border-y-[15px] border-y-transparent border-l-[30px] border-l-admin-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} label="Page" top />
          <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
            <form onSubmit={handleSave} className="space-y-6">

        {/* Hero Section */}
        {activeTab === 'hero-section' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Heading</label>
                <input type="text" value={hero.heading} onChange={(e) => setHero({ ...hero, heading: e.target.value })} placeholder="Heading" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Subheading</label>
                <input type="text" value={hero.subheading} onChange={(e) => setHero({ ...hero, subheading: e.target.value })} placeholder="Subheading" className={inputCls} />
              </div>
            </div>
            <div>
              <ImageUploader value={hero.hero_image} onChange={(v) => setHero({ ...hero, hero_image: v })} label="Hero Image" />
            </div>
          </div>
        </div>
      )}

        {/* Contact Section Toggle */}
        {activeTab === 'contact-section' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 mt-0.5">Split-screen layout: company details on the left, contact form on the right.</p>
            </div>
            <button type="button" onClick={() => setShowContactSection(!showContactSection)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showContactSection ? 'bg-admin-600' : 'bg-admin-300'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showContactSection ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      )}

        {/* Left Side: Company Details */}
        {showContactSection && (
          <>
            {activeTab === 'left-side-company-details' && (
        <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Heading</label>
                    <input type="text" value={contactContent.left_heading} onChange={(e) => updateContent('left_heading', e.target.value)} className={inputCls} placeholder="Get in Touch" />
                  </div>
                  <div>
                    <label className={labelCls}>Subtitle</label>
                    <input type="text" value={contactContent.left_subtitle} onChange={(e) => updateContent('left_subtitle', e.target.value)} className={inputCls} placeholder="Short welcome text" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <textarea value={contactContent.address} onChange={(e) => updateContent('address', e.target.value)} rows={2} className={inputCls} placeholder="Full street address" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Display Phone</label>
                    <input type="text" value={contactContent.display_phone} onChange={(e) => updateContent('display_phone', e.target.value)} className={inputCls} placeholder="+1 (555) 019-2834" />
                  </div>
                  <div>
                    <label className={labelCls}>Tel Link Phone</label>
                    <input type="tel" value={contactContent.tel_link} onChange={(e) => updateContent('tel_link', e.target.value)} className={inputCls} placeholder="15550192834" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Company Email</label>
                    <input type="email" value={contactContent.email} onChange={(e) => updateContent('email', e.target.value)} className={inputCls} placeholder="contact@marvelslice.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Business Hours</label>
                    <input type="text" value={contactContent.business_hours} onChange={(e) => updateContent('business_hours', e.target.value)} className={inputCls} placeholder="Mon-Fri: 9AM-6PM" />
                  </div>
                </div>
              </div>
            </div>
      )}

            {/* Right Side: Form Settings */}
            {activeTab === 'right-side-form-settings' && (
        <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Success Message</label>
                  <input type="text" value={contactContent.success_message} onChange={(e) => updateContent('success_message', e.target.value)} className={inputCls} placeholder="Thank you! Your message has been received." />
                </div>
              </div>
            </div>
      )}

            {/* Style Settings */}
            {activeTab === 'style-settings' && (
        <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Gradient Start</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={contactContent.gradient_start} onChange={(e) => updateContent('gradient_start', e.target.value)} className="w-10 h-10 rounded-lg border border-admin-200 cursor-pointer" />
                      <input type="text" value={contactContent.gradient_start} onChange={(e) => updateContent('gradient_start', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Gradient End</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={contactContent.gradient_end} onChange={(e) => updateContent('gradient_end', e.target.value)} className="w-10 h-10 rounded-lg border border-admin-200 cursor-pointer" />
                      <input type="text" value={contactContent.gradient_end} onChange={(e) => updateContent('gradient_end', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => updateContent('show_shadow', !contactContent.show_shadow)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${contactContent.show_shadow ? 'bg-admin-600' : 'bg-admin-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${contactContent.show_shadow ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <label className="text-sm text-neutral-700">Card Shadow</label>
                </div>
              </div>
            </div>
      )}
          </>
        )}

        {/* Map Embed */}
        {activeTab === 'map-embed' && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-500 mt-0.5">Embed a Google Maps location below the contact section.</p>
              </div>
            </div>
            <div>
              <label className={labelCls}>Map Embed URL</label>
              <input type="text" value={contactContent.map_embed_url || ''} onChange={(e) => updateContent('map_embed_url', e.target.value)} className={inputCls} placeholder="https://www.google.com/maps/embed?pb=..." />
              <p className="text-xs text-neutral-400 mt-1">Paste the <strong>src</strong> URL from a Google Maps embed iframe. Leave empty to hide the map.</p>
            </div>
          </div>
        </div>
      )}

        {/* FAQs */}
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
                    <label className={labelCls}>Question</label>
                    <input type="text" value={f.question} onChange={(e) => { const u = [...faqs]; u[i] = { ...u[i], question: e.target.value }; setFaqs(u); }} placeholder="Question" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Answer</label>
                    <textarea value={f.answer} onChange={(e) => { const u = [...faqs]; u[i] = { ...u[i], answer: e.target.value }; setFaqs(u); }} rows={2} placeholder="Answer..." className={inputCls} />
                  </div>
                </div>
              </RepeatableItemCard>
            )}
          />
        </div>
      )}

      </form>
        </div>
        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
        </div>
      </div>
    </PageShell>
  );
}
