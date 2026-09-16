import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { uploadFile } from '../../lib/uploadHelper';
import { formatPhoneNumber, extractPhoneNumbers } from '../../lib/phoneUtils';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import { FiTrash2, FiUpload, FiHome, FiBriefcase, FiMessageSquare, FiSettings, FiMapPin, FiHelpCircle, FiPhone, FiMail, FiPlus, FiClock } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import SectionSelect from '../components/ui/SectionSelect';
import { RepeatableItemList } from '../components/ui/RepeatableItemList';
import { RepeatableItemCard } from '../components/ui/RepeatableItemCard';

function ImageUploader({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
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
      {value && (
        <div className="mt-2 relative group rounded-lg overflow-hidden border border-admin-200">
          <img src={value} alt="" className="h-28 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 p-1.5 bg-destructive-500 text-white rounded-full opacity-100 shadow-lg"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

const PAGE_PATH = '/contact';

const DEFAULT_CONTACT_CONTENT = {
  left_heading: 'Get in Touch',
  left_heading_line_2: '',
  left_subtitle: "We'd love to hear from you. Reach out to us and we'll get back to you as soon as possible.",
  address: '',
  phone_competitive: '',
  phone_competitive_heading: 'Competitive Exam Enquiry',
  phone_software: '',
  phone_software_heading: 'Software Enquiry',
  display_phone: '',
  tel_link: '',
  emails: [{ heading: '', email: '' }],
  email: '',
  working_time: '',
  business_hours: '',
  gradient_start: '#0B2D6B',
  gradient_end: '#1E56C7',
  heading_color: '#ffffff',
  heading_line_2_color: '#ffffff',
  subheading_color: '#ffffff',
  text_color: '#ffffff',
  show_shadow: true,
  success_message: 'Thank you! Your message has been received. Our team will contact you soon.',
  map_embed_url: '',
};

export default function ContactPageEditor() {

  const [activeTab, setActiveTab] = useState('hero-section');
const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [_navItem, setNavItem] = useState(null);
  const [navItemId, setNavItemId] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const navItemIdRef = useRef(null);
  const savingRef = useRef(false);

  const [hero, setHero] = useState({ heading: '', subheading: '', hero_image: '', mobile_hero_image: '', heading_line_2: '' });
  const [contactContent, setContactContent] = useState(DEFAULT_CONTACT_CONTENT);
  const [formConfig, setFormConfig] = useState({});
  const [faqs, setFaqs] = useState([]);
  const { reset } = useDirty([hero, contactContent, formConfig, faqs], loading);

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
          setHero({
            heading: page.heading || '',
            subheading: page.subheading || '',
            hero_image: page.hero_image || '',
            mobile_hero_image: page.mobile_hero_image || page.form_config?.mobile_hero_image || '',
            heading_line_2: page.form_config?.hero?.heading_line_2 || '',
          });
          setFormConfig(page.form_config || {});
          const secs = page.sections || [];

          const contactFormSec = secs.find(s => s.section_type === 'contact_form');
          if (contactFormSec) {
            const cData = contactFormSec.content || {};
            let emails = Array.isArray(cData.emails) && cData.emails.length > 0
              ? cData.emails.map(e => ({ heading: e?.heading || '', email: e?.email || '' }))
              : cData.email
                ? [{ heading: cData.email_heading || '', email: cData.email }]
                : [{ heading: '', email: '' }];

            let phoneComp = cData.phone_competitive || cData.phone_1 || '';
            let phoneSoft = cData.phone_software || cData.phone_2 || '';
            if (!phoneComp && !phoneSoft && (cData.display_phone || cData.phone)) {
              const raw = extractPhoneNumbers(cData.display_phone || cData.phone);
              phoneComp = raw[0] || '';
              phoneSoft = raw[1] || '';
            }

            setContactContent({
              ...DEFAULT_CONTACT_CONTENT,
              ...cData,
              phone_competitive: phoneComp,
              phone_competitive_heading: cData.phone_competitive_heading || cData.phone_1_heading || 'Competitive Exam Enquiry',
              phone_software: phoneSoft,
              phone_software_heading: cData.phone_software_heading || cData.phone_2_heading || 'Software Enquiry',
              emails,
              working_time: cData.working_time || cData.business_hours || '',
              business_hours: cData.working_time || cData.business_hours || '',
            });
          } else {
            const contactInfoSec = secs.find(s => s.section_type === 'contact_info');
            if (contactInfoSec) {
              const raw = extractPhoneNumbers(contactInfoSec.phone || '');
              setContactContent((prev) => ({
                ...prev,
                left_heading: contactInfoSec.heading || prev.left_heading,
                address: contactInfoSec.address || prev.address,
                phone_competitive: raw[0] || '',
                phone_competitive_heading: 'Competitive Exam Enquiry',
                phone_software: raw[1] || '',
                phone_software_heading: 'Software Enquiry',
                display_phone: contactInfoSec.phone || prev.display_phone,
                tel_link: contactInfoSec.phone || prev.tel_link,
                email: contactInfoSec.email || prev.email,
                emails: contactInfoSec.email ? [{ heading: '', email: contactInfoSec.email }] : [{ heading: '', email: '' }],
                working_time: contactInfoSec.working_time || contactInfoSec.business_hours || prev.working_time,
                business_hours: contactInfoSec.working_time || contactInfoSec.business_hours || prev.business_hours,
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

    const cleanedEmails = (contactContent.emails || [])
      .map(e => ({ heading: (e?.heading || '').trim(), email: (e?.email || '').trim() }))
      .filter(e => e.email || e.heading);
    const primaryEmail = cleanedEmails.find(e => e.email)?.email || contactContent.email || '';
    const phoneComp = (contactContent.phone_competitive || '').trim();
    const phoneSoft = (contactContent.phone_software || '').trim();
    const combinedPhone = [phoneComp, phoneSoft].filter(Boolean).join(' / ');
    const workingTimeVal = (contactContent.working_time || contactContent.business_hours || '').trim();

    const contentToSave = {
      ...contactContent,
      phone_competitive: phoneComp,
      phone_competitive_heading: (contactContent.phone_competitive_heading || '').trim() || 'Competitive Exam Enquiry',
      phone_software: phoneSoft,
      phone_software_heading: (contactContent.phone_software_heading || '').trim() || 'Software Enquiry',
      display_phone: combinedPhone || contactContent.display_phone || '',
      emails: cleanedEmails.length > 0 ? cleanedEmails : (primaryEmail ? [{ heading: '', email: primaryEmail }] : []),
      email: primaryEmail,
      working_time: workingTimeVal,
      business_hours: workingTimeVal,
    };

    const sections = [
      { section_type: 'contact_form', content: contentToSave },
      faqs.length > 0 ? { section_type: 'faq_list', heading: 'Frequently Asked Questions', items: faqs } : null,
      contactContent.map_embed_url ? { section_type: 'map_embed', content: contactContent.map_embed_url } : null,
    ].filter(Boolean);

    if (!navItemId && !navItemIdRef.current) { setSaveError('No nav item linked — please refresh and try again'); setSaving(false); savingRef.current = false; return; }

    const payload = {
      nav_item_id: navItemId || navItemIdRef.current,
      heading: hero.heading,
      subheading: hero.subheading,
      hero_image: hero.hero_image || null,
      mobile_hero_image: hero.mobile_hero_image || null,
      form_config: {
        ...formConfig,
        mobile_hero_image: hero.mobile_hero_image || '',
        hero: { heading_line_2: hero.heading_line_2 || '' },
      },
      sections,
      is_published: true,
    };
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
    { id: 'hero-section', title: 'Hero', icon: FiHome },
    { id: 'left-side-company-details', title: 'Company Details', icon: FiBriefcase },
    { id: 'right-side-form-settings', title: 'Form', icon: FiMessageSquare },
    { id: 'style-settings', title: 'Style', icon: FiSettings },
    { id: 'map-embed', title: 'Map', icon: FiMapPin },
    { id: 'faqs', title: 'FAQs', icon: FiHelpCircle },
  ];

  return (
    <PageShell backTo="/admin"
      title=""
      maxWidth="max-w-none"
    >
      <div className="flex flex-col lg:flex-row gap-[15px] items-start">

        <div className="hidden lg:block transition-all duration-200 lg:w-[240px] lg:shrink-0">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-visible">
            <div className="bg-white rounded-xl flex flex-col overflow-visible border border-gray-300" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
              {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative w-full flex items-center gap-2.5 text-left px-4 py-3 border-b border-gray-200 last:border-b-0 focus:outline-none transition-colors ${
                      index === 0 ? 'rounded-t-xl' : ''
                    } ${
                      index === tabs.length - 1 ? 'rounded-b-xl' : ''
                    } ${
                      isActive ? 'bg-admin-600 text-white shadow-md z-10' : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                    <div className="font-semibold text-sm">
                      {tab.title}
                    </div>
                    {isActive && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-[15px] w-0 h-0 border-y-[15px] border-y-transparent border-l-[27px] border-l-admin-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        <div className="flex-1 min-w-0">
          <SectionSelect items={tabs.map(t => ({ key: t.id, label: t.title }))} value={activeTab} onChange={setActiveTab} label="Section" />
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
                <label className={labelCls}>Heading Line 2 (Optional)</label>
                <input type="text" value={hero.heading_line_2 || ''} onChange={(e) => setHero({ ...hero, heading_line_2: e.target.value })} placeholder="Second line of heading" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={4} value={hero.subheading} onChange={(e) => setHero({ ...hero, subheading: e.target.value })} placeholder="Description" className={`${inputCls} resize-y`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <ImageUploader value={hero.hero_image} onChange={(v) => setHero({ ...hero, hero_image: v })} label="Desktop Hero Image" />
              </div>
              <div>
                <ImageUploader value={hero.mobile_hero_image} onChange={(v) => setHero({ ...hero, mobile_hero_image: v })} label="Mobile Hero Image (Optional)" />
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Contact Section is always enabled */}

        {/* Left Side: Company Details */}
        {activeTab === 'left-side-company-details' && (
        <div className="space-y-6">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Heading</label>
                    <input type="text" value={contactContent.left_heading} onChange={(e) => updateContent('left_heading', e.target.value)} className={inputCls} placeholder="Get in Touch" />
                  </div>
                  <div>
                    <label className={labelCls}>Heading Line 2 (Optional)</label>
                    <input type="text" value={contactContent.left_heading_line_2 || ''} onChange={(e) => updateContent('left_heading_line_2', e.target.value)} className={inputCls} placeholder="Second line of heading" />
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
                {/* Phone Numbers */}
                <div className="space-y-3 pt-2">
                  <label className={labelCls}>Phone Numbers</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 uppercase tracking-wider">
                        <FiPhone className="w-3.5 h-3.5 text-brand-orange" />
                        Phone 1 — Competitive Exam Enquiry
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">Heading / Label</label>
                        <input
                          type="text"
                          value={contactContent.phone_competitive_heading ?? 'Competitive Exam Enquiry'}
                          onChange={(e) => updateContent('phone_competitive_heading', e.target.value)}
                          className={inputCls}
                          placeholder="Competitive Exam Enquiry"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">Phone Number</label>
                        <div className="relative">
                          <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          <input
                            type="text"
                            value={contactContent.phone_competitive || ''}
                            onChange={(e) => updateContent('phone_competitive', e.target.value)}
                            onBlur={() => updateContent('phone_competitive', formatPhoneNumber(contactContent.phone_competitive))}
                            className={`${inputCls} pl-9`}
                            placeholder="+91 63809 57390"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 font-semibold text-xs text-slate-800 uppercase tracking-wider">
                        <FiPhone className="w-3.5 h-3.5 text-brand-orange" />
                        Phone 2 — Software Enquiry
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">Heading / Label</label>
                        <input
                          type="text"
                          value={contactContent.phone_software_heading ?? 'Software Enquiry'}
                          onChange={(e) => updateContent('phone_software_heading', e.target.value)}
                          className={inputCls}
                          placeholder="Software Enquiry"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-neutral-600 mb-1">Phone Number</label>
                        <div className="relative">
                          <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          <input
                            type="text"
                            value={contactContent.phone_software || ''}
                            onChange={(e) => updateContent('phone_software', e.target.value)}
                            onBlur={() => updateContent('phone_software', formatPhoneNumber(contactContent.phone_software))}
                            className={`${inputCls} pl-9`}
                            placeholder="+91 80882 18609"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Emails */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Company Emails</label>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = Array.isArray(contactContent.emails) ? contactContent.emails : [];
                        updateContent('emails', [...cur, { heading: '', email: '' }]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-admin-600 hover:bg-admin-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      Add Email
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {(contactContent.emails || []).map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                            Heading / Label <span className="text-neutral-400 font-normal">(Optional — defaults to &quot;Email&quot;)</span>
                          </label>
                          <input
                            type="text"
                            value={item.heading || ''}
                            onChange={(e) => {
                              const updated = [...(contactContent.emails || [])];
                              updated[idx] = { ...updated[idx], heading: e.target.value };
                              updateContent('emails', updated);
                            }}
                            className={inputCls}
                            placeholder="Email (or e.g. Software Support)"
                          />
                        </div>
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-medium text-neutral-600 mb-1">Email Address</label>
                          <div className="relative">
                            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="email"
                              value={item.email || ''}
                              onChange={(e) => {
                                const updated = [...(contactContent.emails || [])];
                                updated[idx] = { ...updated[idx], email: e.target.value };
                                updateContent('emails', updated);
                              }}
                              className={`${inputCls} pl-9`}
                              placeholder="contact@marvelslice.com"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (contactContent.emails || []).filter((_, i) => i !== idx);
                            updateContent('emails', updated.length > 0 ? updated : [{ heading: '', email: '' }]);
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer self-end sm:self-auto sm:mb-0.5"
                          title="Remove Email"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Working Time */}
                <div className="pt-2">
                  <label className={labelCls}>Working Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={contactContent.working_time || contactContent.business_hours || ''}
                      onChange={(e) => {
                        updateContent('working_time', e.target.value);
                        updateContent('business_hours', e.target.value);
                      }}
                      className={`${inputCls} pl-9`}
                      placeholder="Mon-Fri: 9AM-6PM"
                    />
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
                  <div>
                    <label className={labelCls}>Heading</label>
                    <input type="text" value={contactContent.left_heading || ''} onChange={(e) => updateContent('left_heading', e.target.value)} className={inputCls} placeholder="Get in Touch" />
                  </div>
                  <div>
                    <label className={labelCls}>Heading Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={contactContent.heading_color || '#ffffff'} onChange={(e) => updateContent('heading_color', e.target.value)} className="w-10 h-10 rounded-lg border border-admin-200 cursor-pointer" />
                      <input type="text" value={contactContent.heading_color || '#ffffff'} onChange={(e) => updateContent('heading_color', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Heading Line 2 Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={contactContent.heading_line_2_color || '#ffffff'} onChange={(e) => updateContent('heading_line_2_color', e.target.value)} className="w-10 h-10 rounded-lg border border-admin-200 cursor-pointer" />
                      <input type="text" value={contactContent.heading_line_2_color || '#ffffff'} onChange={(e) => updateContent('heading_line_2_color', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Subheading Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={contactContent.subheading_color || '#ffffff'} onChange={(e) => updateContent('subheading_color', e.target.value)} className="w-10 h-10 rounded-lg border border-admin-200 cursor-pointer" />
                      <input type="text" value={contactContent.subheading_color || '#ffffff'} onChange={(e) => updateContent('subheading_color', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={contactContent.text_color || '#ffffff'} onChange={(e) => updateContent('text_color', e.target.value)} className="w-10 h-10 rounded-lg border border-admin-200 cursor-pointer" />
                      <input type="text" value={contactContent.text_color || '#ffffff'} onChange={(e) => updateContent('text_color', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div className="sm:col-start-3">
                    <label className={labelCls}>Card Shadow</label>
                    <div className="flex items-center gap-3 justify-end">
                      <button type="button" onClick={() => updateContent('show_shadow', !contactContent.show_shadow)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${contactContent.show_shadow ? 'bg-admin-600' : 'bg-admin-300'}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${contactContent.show_shadow ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
