import { useState, useEffect, useRef } from 'react';
import { RepeatableItemList } from '../components/ui/RepeatableItemList';
import { RepeatableItemCard } from '../components/ui/RepeatableItemCard';

import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import AdminButton from '../components/AdminButton';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import PageShell from '../components/ui/PageShell';
import SectionAccordion from '../components/ui/SectionAccordion';
import {
  FiPlus, FiTrash2, FiSave, FiUpload, FiArrowLeft,
  FiHome, FiStar, FiAward, FiHelpCircle,
  FiLayout, FiMail, FiMessageSquare, FiBell, FiUsers,
  FiClock, FiVideo, FiCode, FiCalendar, FiRefreshCw,
  FiBarChart2, FiBookOpen, FiBriefcase, FiGlobe, FiCpu,
  FiDatabase, FiLayers, FiZap, FiShield, FiTrendingUp, FiChevronUp, FiChevronLeft, FiChevronRight,
FiChevronDown} from 'react-icons/fi';

const ICON_LIST = [
  { key: "briefcase", label: "Briefcase", Icon: FiBriefcase },
  { key: "code", label: "Code", Icon: FiCode },
  { key: "star", label: "Star", Icon: FiStar },
  { key: "award", label: "Award", Icon: FiAward },
  { key: "users", label: "Users", Icon: FiUsers },
  { key: "clock", label: "Clock", Icon: FiClock },
  { key: "target", label: "Target", Icon: FiBarChart2 },
  { key: "book", label: "Book", Icon: FiBookOpen },
  { key: "video", label: "Video", Icon: FiVideo },
  { key: "calendar", label: "Calendar", Icon: FiCalendar },
  { key: "refresh", label: "Refresh", Icon: FiRefreshCw },
  { key: "message", label: "Message", Icon: FiMessageSquare },
  { key: "globe", label: "Globe", Icon: FiGlobe },
  { key: "cpu", label: "CPU", Icon: FiCpu },
  { key: "database", label: "Database", Icon: FiDatabase },
  { key: "layers", label: "Layers", Icon: FiLayers },
  { key: "zap", label: "Zap", Icon: FiZap },
  { key: "shield", label: "Shield", Icon: FiShield },
  { key: "trending", label: "Trending", Icon: FiTrendingUp },
  { key: "mail", label: "Mail", Icon: FiMail },
  { key: "bell", label: "Bell", Icon: FiBell },
  { key: "help", label: "Help", Icon: FiHelpCircle },
];

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);
  const selected = ICON_LIST.find((o) => o.key === value);
  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Icon</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 bg-white text-left"
      >
        {selected ? (
          <>
            <selected.Icon className="w-4 h-4 text-admin-600 shrink-0" />
            <span>{selected.label}</span>
          </>
        ) : (
          <span className="text-admin-400">Select icon</span>
        )}
        <FiChevronDown className={`w-4 h-4 ml-auto text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-admin-200 rounded-lg shadow-lg max-h-60 overflow-y-auto admin-scrollbar">
          {ICON_LIST.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                value === opt.key
                  ? "bg-white text-admin-600"
                  : "hover:bg-white text-admin-700"
              }`}
            >
              <opt.Icon className="w-4 h-4 shrink-0" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const sectionDefs = [
  {
    key: 'hero', label: 'Hero', icon: FiHome, color: 'from-admin-500 to-admin-500/80',
    isHero: true,
  },
  {
    key: 'intro_form', label: 'Intro', icon: FiMail, color: 'from-emerald-400 to-emerald-600',
    fields: [
      { name: 'intro_text', label: 'Intro Paragraph', type: 'textarea' },
      { name: 'pill_buttons', label: 'Pill Buttons (one per line)', type: 'multiline' },
      { name: 'form_title', label: 'Form Title', type: 'text' },
    ],
    hasList: true, listLabel: 'Stats', listItemFields: [
      { name: 'value', label: 'Value', type: 'text' },
      { name: 'label', label: 'Label', type: 'text' },
    ],
  },
  {
    key: 'empowering', label: 'Empowering', icon: FiStar, color: 'from-blue-500 to-blue-600',
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  {
    key: 'featured_courses', label: 'Feature Cards', icon: FiLayout, color: 'from-green-500 to-green-600',
    isFeatureCards: true,
  },
  {
    key: 'services', label: 'Featured Services', icon: FiAward, color: 'from-purple-500 to-purple-600',
    isServices: true,
  },
  {
    key: 'cta_banner', label: 'CTA', icon: FiMessageSquare, color: 'from-teal-500 to-teal-600',
    contentOnly: true,
    fields: [
      { name: 'heading', label: 'Heading', type: 'text' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'cta_text', label: 'CTA Button Text', type: 'text' },
      { name: 'cta_link', label: 'Phone Number (tel:)', type: 'text' },
      { name: 'background_image', label: 'Background Image', type: 'image' },
    ],
  },
  {
    key: 'faqs', label: 'FAQs', icon: FiHelpCircle, color: 'from-admin-500/80 to-admin-500',
    isList: true,
    itemFields: [
      { name: 'question', label: 'Question', type: 'text' },
      { name: 'answer', label: 'Answer', type: 'textarea' },
    ],
  },
];

function ImageUploader({ value, onChange, label, hideInput }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `home/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      const { data } = supabase.storage.from('pages').getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
  }

  if (hideInput) {
    return (
      <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all bg-white shrink-0">
        {uploading ? (
          <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <FiUpload className="w-4 h-4" />
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </label>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3.5 py-2.5 border border-indigo-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
          placeholder="Paste image URL or upload..." />
        <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all bg-white shrink-0">
          {uploading ? (
            <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <FiUpload className="w-4 h-4" />
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {value && (
        <div className="mt-3 relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img src={value} alt="" className="h-36 w-full object-cover" />
          <button type="button" onClick={() => onChange('')}
            className="absolute top-2.5 right-2.5 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-white hover:text-red-600 transition-all border border-gray-200">
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ListEditor({ def, data, onChange }) {
  const items = data?.content?.[def.listKey || 'stats'] || [];
  function addItem() {
    const newItem = {};
    def.listItemFields.forEach((f) => { newItem[f.name] = ''; });
    onChange({ ...data, content: { ...(data?.content || {}), [def.listKey || 'stats']: [...items, newItem] } });
  }
  function updateItem(idx, field, value) {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange({ ...data, content: { ...(data?.content || {}), [def.listKey || 'stats']: updated } });
  }
  function removeItem(idx) {
    onChange({ ...data, content: { ...(data?.content || {}), [def.listKey || 'stats']: items.filter((_, i) => i !== idx) } });
  }
  return (
    <div>
      <RepeatableItemList
        title={def.listLabel || 'List Items'}
        items={items}
        onAdd={addItem}
        addLabel={`Add ${def.listLabel || 'Item'}`}
        renderItem={(item, i) => (
          <RepeatableItemCard key={i} index={i} label={def.listLabel || 'Item'} onRemove={() => removeItem(i)}>
            <div className="space-y-4">
              {def.listItemFields.map((f) => (
                <div key={f.name}>
                  {f.type === 'image' ? (
                    <ImageUploader value={item[f.name] || ''} onChange={(v) => updateItem(i, f.name, v)} label={f.label} />
                  ) : f.type === 'textarea' ? (
                    <>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{f.label}</label>
                      <textarea value={item[f.name] || ''} onChange={(e) => updateItem(i, f.name, e.target.value)} rows={3}
                        className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{f.label}</label>
                      <input type="text" value={item[f.name] || ''} onChange={(e) => updateItem(i, f.name, e.target.value)}
                        className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </RepeatableItemCard>
        )}
      />
    </div>
  );
}

function FeatureCardsEditor({ data, onChange }) {
  const content = data?.content || {};
  const cards = content.cards || [];
  function addCard() {
    onChange({ ...data, content: { ...content, cards: [...cards, { heading: '', description: '', image_url: '', bullets: [''], button_text: 'View More', button_link: '#' }] } });
  }
  function updateCard(idx, field, value) {
    const updated = cards.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    onChange({ ...data, content: { ...content, cards: updated } });
  }
  function removeCard(idx) {
    onChange({ ...data, content: { ...content, cards: cards.filter((_, i) => i !== idx) } });
  }
  function addBullet(cardIdx) {
    const c = cards[cardIdx];
    updateCard(cardIdx, 'bullets', [...(c.bullets || []), '']);
  }
  function updateBullet(cardIdx, bIdx, value) {
    const c = cards[cardIdx];
    const b = [...(c.bullets || [])];
    b[bIdx] = value;
    updateCard(cardIdx, 'bullets', b);
  }
  function removeBullet(cardIdx, bIdx) {
    const c = cards[cardIdx];
    updateCard(cardIdx, 'bullets', (c.bullets || []).filter((_, i) => i !== bIdx));
  }
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
          <input type="text" value={data?.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" placeholder="Section heading" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
          <input type="text" value={data?.subheading || ''} onChange={(e) => onChange({ ...data, subheading: e.target.value })}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" placeholder="Section subheading" />
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-black">Cards</h4>
          <AdminButton type="button" onClick={addCard} variant="primary" size="sm"><FiPlus className="w-4 h-4" /> Add Card</AdminButton>
        </div>
        {cards.length === 0 && <p className="text-sm text-neutral-400 italic">No cards yet.</p>}
        <div className="space-y-3">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-lg border border-admin-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-black uppercase tracking-wider">Card {i + 1}</span>
                <button type="button" onClick={() => removeCard(i)}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-destructive-50 rounded-lg transition-colors"><FiTrash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                    <input type="text" value={card.heading || ''} onChange={(e) => updateCard(i, 'heading', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Button Text</label>
                    <input type="text" value={card.button_text || 'View More'} onChange={(e) => updateCard(i, 'button_text', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea value={card.description || ''} onChange={(e) => updateCard(i, 'description', e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                </div>
                <ImageUploader value={card.image_url} onChange={(v) => updateCard(i, 'image_url', v)} label="Image" />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Bullet Points</label>
                    <button type="button" onClick={() => addBullet(i)}
                      className="text-xs text-admin-600 hover:text-admin-700 font-medium flex items-center gap-0.5">
                      <FiPlus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {(card.bullets || []).map((b, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <span className="text-neutral-400">•</span>
                        <input type="text" value={b} onChange={(e) => updateBullet(i, j, e.target.value)}
                          className="flex-1 px-2.5 py-1.5 border border-admin-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500"
                          placeholder="Bullet point" />
                        <button type="button" onClick={() => removeBullet(i, j)}
                          className="p-1 text-red-500 hover:text-red-600"><FiTrash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Button Link</label>
                    <input type="text" value={card.button_link || '#'} onChange={(e) => updateCard(i, 'button_link', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesEditor({ data, onChange }) {
  const content = data?.content || {};
  function updateContent(name, value) {
    onChange({ ...data, content: { ...content, [name]: value } });
  }
  const services = content.services_list || [];
  const cards = content.service_cards || [];
  function addService() { updateContent('services_list', [...services, { icon_name: 'briefcase', title: '', description: '' }]); }
  function updateService(idx, field, value) {
    const u = services.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    updateContent('services_list', u);
  }
  function removeService(idx) { updateContent('services_list', services.filter((_, i) => i !== idx)); }
  function addCard() { updateContent('service_cards', [...cards, { image_url: '', title: '', description: '', link_url: '', is_clickable: false }]); }
  function updateCard(idx, field, value) {
    const u = cards.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    updateContent('service_cards', u);
  }
  function removeCard(idx) { updateContent('service_cards', cards.filter((_, i) => i !== idx)); }
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
          <input type="text" value={data?.heading || ''} onChange={(e) => onChange({ ...data, heading: e.target.value })}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
          <input type="text" value={data?.subheading || ''} onChange={(e) => onChange({ ...data, subheading: e.target.value })}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Intro Paragraph</label>
        <textarea value={content.intro || ''} onChange={(e) => updateContent('intro', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Left Column Heading</label>
          <input type="text" value={content.left_heading || ''} onChange={(e) => updateContent('left_heading', e.target.value)}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">CTA Button Text</label>
          <input type="text" value={content.cta_text || ''} onChange={(e) => updateContent('cta_text', e.target.value)}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Left Column Description</label>
        <textarea value={content.left_description || ''} onChange={(e) => updateContent('left_description', e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <ImageUploader value={content.left_image_url} onChange={(v) => updateContent('left_image_url', v)} label="Left Column Image" />
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">CTA Link</label>
          <input type="text" value={content.cta_link || '#'} onChange={(e) => updateContent('cta_link', e.target.value)}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
        </div>
      </div>
      <div className="pt-4">
        <RepeatableItemList
          title="Services"
          items={services}
          onAdd={addService}
          addLabel="Add Service"
          renderItem={(s, i) => (
            <RepeatableItemCard key={i} index={i} label="Service" onRemove={() => removeService(i)}>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <IconPicker value={s.icon} onChange={(v) => updateService(i, 'icon', v)} />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={!!s.is_clickable} onChange={(e) => updateService(i, 'is_clickable', e.target.checked)}
                        className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20" />
                      <span className="text-xs font-medium text-black">Clickable</span>
                    </label>
                    {s.is_clickable && (
                      <input type="text" value={s.link_url || ''} onChange={(e) => updateService(i, 'link_url', e.target.value)}
                        placeholder="/services/web"
                        className="w-48 px-3 py-1.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                    )}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Title</label>
                    <input type="text" value={s.title || ''} onChange={(e) => updateService(i, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                    <input type="text" value={s.description || ''} onChange={(e) => updateService(i, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                </div>
              </div>
            </RepeatableItemCard>
          )}
        />
      </div>
      <div className="pt-4">
        <RepeatableItemList
          title="Service Cards"
          items={cards}
          onAdd={addCard}
          addLabel="Add Card"
          renderItem={(c, i) => (
            <RepeatableItemCard key={i} index={i} label="Card" onRemove={() => removeCard(i)}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Title</label>
                    <input type="text" value={c.title || ''} onChange={(e) => updateCard(i, 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                    <input type="text" value={c.description || ''} onChange={(e) => updateCard(i, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                  </div>
                </div>
                <ImageUploader value={c.image_url} onChange={(v) => updateCard(i, 'image_url', v)} label="Image" />
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!c.is_clickable} onChange={(e) => updateCard(i, 'is_clickable', e.target.checked)}
                      className="w-4 h-4 rounded border-admin-200 text-admin-600 focus:ring-admin-500/20" />
                    <span className="text-xs font-medium text-black">Clickable</span>
                  </label>
                  {c.is_clickable && (
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Link URL</label>
                      <input type="text" value={c.link_url || ''} onChange={(e) => updateCard(i, 'link_url', e.target.value)}
                        placeholder="/courses or https://..."
                        className="w-full px-3 py-1.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
                    </div>
                  )}
                </div>
              </div>
            </RepeatableItemCard>
          )}
        />
      </div>
    </div>
  );
}

function HeroEditor({ data, onChange }) {
  const content = data?.content || {};
  const mode = content.hero_mode || 'normal';
  const carouselType = content.carousel_type || 'image';
  const slides = Array.isArray(content.slides) ? content.slides : [];
  const [openSection, setOpenSection] = useState(!content.banner_image ? 'two-column' : null);

  function updateContent(name, value) {
    onChange({ ...data, content: { ...content, [name]: value } });
  }

  function addSlide() {
    const empty = carouselType === 'image'
      ? { image: '', heading: '', description: '' }
      : { heading: '', description: '' };
    updateContent('slides', [...slides, empty]);
  }

  function updateSlide(idx, field, value) {
    const u = slides.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    updateContent('slides', u);
  }

  function removeSlide(idx) {
    updateContent('slides', slides.filter((_, i) => i !== idx));
  }

  const inputClass = 'w-full px-3 py-2 border border-indigo-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white';

  return (
    <div className="space-y-6">
      {/* Display Mode - Segmented Control */}
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Display Mode</label>
        <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
          <button type="button" onClick={() => updateContent('hero_mode', 'normal')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'normal'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            Normal (Single Banner)
          </button>
          <button type="button" onClick={() => updateContent('hero_mode', 'carousel')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === 'carousel'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            Carousel
          </button>
        </div>
      </div>

      {mode === 'normal' ? (
        <div className="space-y-6">
          {/* Media Preview Section */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Banner Image</label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={content.banner_image || ''} onChange={(e) => updateContent('banner_image', e.target.value)}
                className="flex-1 px-3.5 py-2.5 border border-indigo-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                placeholder="Paste image URL or upload..." />
              <ImageUploader value={content.banner_image || ''} onChange={(v) => updateContent('banner_image', v)} label="" hideInput />
            </div>
            {content.banner_image ? (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-md">
                <img src={content.banner_image} alt="Banner preview" className="w-full h-48 object-cover" />
                <button type="button" onClick={() => updateContent('banner_image', '')}
                  className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-white hover:text-red-600 transition-all border border-gray-200">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 h-48 flex items-center justify-center">
                <div className="text-center">
                  <FiUpload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No banner image selected</p>
                </div>
              </div>
            )}
          </div>

          {/* Text Fields - 2 Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Banner Heading</label>
              <input type="text" value={content.banner_heading || ''} onChange={(e) => updateContent('banner_heading', e.target.value)}
                className={inputClass} placeholder="e.g. Transform Your Career" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Banner Description</label>
              <input type="text" value={content.banner_description || ''} onChange={(e) => updateContent('banner_description', e.target.value)}
                className={inputClass} placeholder="e.g. Empowering students with industry-ready skills" />
            </div>
          </div>

          {/* Heading Below Banner */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading Below Banner</label>
            <input type="text" value={content.headline || ''} onChange={(e) => updateContent('headline', e.target.value)}
              className={inputClass} placeholder="e.g. Featured Programs" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Carousel Type - Segmented Control */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Carousel Type</label>
            <div className="inline-flex bg-gray-100 rounded-lg p-0.5">
              <button type="button" onClick={() => updateContent('carousel_type', 'text')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  carouselType === 'text'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                Text Slides
              </button>
              <button type="button" onClick={() => updateContent('carousel_type', 'image')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  carouselType === 'image'
                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                Image Slides
              </button>
            </div>
          </div>

          {/* Slides */}
          <div>
            <RepeatableItemList
              title={`Slides (${slides.length})`}
              items={slides}
              onAdd={addSlide}
              addLabel="Add Slide"
              renderItem={(slide, i) => (
                <RepeatableItemCard key={i} index={i} label="Slide" onRemove={() => removeSlide(i)}>
                  <div className="space-y-4">
                    {carouselType === 'image' && (
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Slide Image</label>
                        <div className="flex gap-2">
                          <input type="text" value={slide.image || ''} onChange={(e) => updateSlide(i, 'image', e.target.value)}
                            className="flex-1 px-3.5 py-2 border border-indigo-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                            placeholder="Image URL" />
                          <ImageUploader value={slide.image || ''} onChange={(v) => updateSlide(i, 'image', v)} label="" hideInput />
                        </div>
                        {slide.image && (
                          <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200">
                            <img src={slide.image} alt="" className="h-32 w-full object-cover" />
                            <button type="button" onClick={() => updateSlide(i, 'image', '')}
                              className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-white transition-all border border-gray-200">
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
                        <input type="text" value={slide.heading || ''} onChange={(e) => updateSlide(i, 'heading', e.target.value)}
                          className={inputClass} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
                        <input type="text" value={slide.description || ''} onChange={(e) => updateSlide(i, 'description', e.target.value)}
                          className={inputClass} />
                      </div>
                    </div>
                  </div>
                </RepeatableItemCard>
              )}
            />
          </div>
        </div>
      )}

      {/* Two-Column Layout Settings */}
      <SectionAccordion title="Two-Column Layout Settings" expanded={openSection === 'two-column'} onToggle={() => setOpenSection(openSection === 'two-column' ? null : 'two-column')}>
        <p className="text-xs text-gray-400">These fields apply when no banner image is set (gradient background layout).</p>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Description</label>
          <textarea value={content.description || ''} onChange={(e) => updateContent('description', e.target.value)} rows={3}
            className={inputClass} placeholder="Hero section description for two-column layout" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Badge Text</label>
            <input type="text" value={content.badge_text || ''} onChange={(e) => updateContent('badge_text', e.target.value)}
              className={inputClass} placeholder="e.g. New batch starting soon" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Student Image</label>
            <ImageUploader value={content.student_image_url || ''} onChange={(v) => updateContent('student_image_url', v)} label="" hideInput />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Feature Bullets (one per line)</label>
          <textarea value={content.feature_bullets || ''} onChange={(e) => updateContent('feature_bullets', e.target.value)} rows={4}
            className={`${inputClass} font-mono text-xs`} placeholder="Industry-recognized certification&#10;Expert-led live sessions&#10;Flexible learning schedule" />
        </div>
        {content.student_image_url && (
          <div className="relative rounded-lg overflow-hidden border border-gray-200">
            <img src={content.student_image_url} alt="" className="h-32 w-full object-cover" />
            <button type="button" onClick={() => updateContent('student_image_url', '')}
              className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-full shadow-sm hover:bg-white transition-all border border-gray-200">
              <FiTrash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </SectionAccordion>

      {/* Stats Section */}
      <SectionAccordion title="Stats" expanded={openSection === 'stats'} onToggle={() => setOpenSection(openSection === 'stats' ? null : 'stats')}>
        <div className="flex justify-end mb-4">
          <button type="button" onClick={() => {
            const s = Array.isArray(content.stats) ? content.stats : [];
            if (s.length >= 3) return;
            updateContent('stats', [...s, { value: '', label: '' }]);
          }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${(content.stats || []).length >= 3 ? 'text-gray-300 bg-gray-50 cursor-not-allowed' : 'text-admin-600 bg-white border border-admin-200 hover:bg-admin-50 hover:border-admin-300'}`}>
            <FiPlus className="w-3.5 h-3.5" /> Add Stat
          </button>
        </div>
        {(!Array.isArray(content.stats) || content.stats.length === 0) ? (
          <div className="text-center">
            <p className="text-sm text-gray-400">No stats yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {content.stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-400 w-16 shrink-0">STAT {i + 1}</span>
                <input type="text" value={s.value || ''} onChange={(e) => {
                  const arr = [...content.stats];
                  arr[i] = { ...arr[i], value: e.target.value };
                  updateContent('stats', arr);
                }}
                  className="w-28 px-3 py-2 border border-admin-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white"
                  placeholder="Value" />
                <input type="text" value={s.label || ''} onChange={(e) => {
                  const arr = [...content.stats];
                  arr[i] = { ...arr[i], label: e.target.value };
                  updateContent('stats', arr);
                }}
                  className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all bg-white"
                  placeholder="Label" />
                <button type="button" onClick={() => {
                  const arr = [...content.stats];
                  arr.splice(i, 1);
                  updateContent('stats', arr);
                }}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionAccordion>

      {/* Buttons Section */}
      <SectionAccordion title="Call-to-Action Buttons" expanded={openSection === 'buttons'} onToggle={() => setOpenSection(openSection === 'buttons' ? null : 'buttons')}>
        <div className="flex justify-end mb-4">
          <AdminButton type="button" onClick={() => {
            const b = Array.isArray(content.buttons) ? content.buttons : [];
            updateContent('buttons', [...b, { label: '', link: '', color: '' }]);
          }} variant="primary" size="sm">
            <FiPlus className="w-4 h-4" /> Add Button
          </AdminButton>
        </div>
        <div>
          {(!Array.isArray(content.buttons) || content.buttons.length === 0) ? (
            <p className="text-sm text-gray-400">No buttons yet.</p>
          ) : (
            content.buttons.map((btn, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                <input type="text" value={btn.label || ''} onChange={(e) => {
                  const arr = [...content.buttons];
                  arr[i] = { ...arr[i], label: e.target.value };
                  updateContent('buttons', arr);
                }}
                  className="w-40 px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  placeholder="Label" />
                <input type="text" value={btn.link || ''} onChange={(e) => {
                  const arr = [...content.buttons];
                  arr[i] = { ...arr[i], link: e.target.value };
                  updateContent('buttons', arr);
                }}
                  className="flex-1 px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white"
                  placeholder="/courses" />
                <input type="text" value={btn.color || ''} onChange={(e) => {
                  const arr = [...content.buttons];
                  arr[i] = { ...arr[i], color: e.target.value };
                  updateContent('buttons', arr);
                }}
                  className="w-28 px-3 py-2.5 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all bg-white font-mono"
                  placeholder="#F7941D" />
                <button type="button" onClick={() => {
                  const arr = [...content.buttons];
                  arr.splice(i, 1);
                  updateContent('buttons', arr);
                }}
                  className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </SectionAccordion>
    </div>
  );
}

function SectionEditor({ def, data, onChange }) {
  if (def.isHero) return <HeroEditor data={data} onChange={onChange} />;
  if (def.isFeatureCards) return <FeatureCardsEditor data={data} onChange={onChange} />;
  if (def.isServices) return <ServicesEditor data={data} onChange={onChange} />;
  if (def.isList) return <SimpleListEditor def={def} data={data} onChange={onChange} />;
  return <FieldEditor def={def} data={data} onChange={onChange} />;
}

function FieldEditor({ def, data, onChange }) {
  const heading = data?.heading || '';
  const subheading = data?.subheading || '';
  const content = data?.content || {};
  function updateContent(name, value) {
    onChange({ ...data, content: { ...content, [name]: value } });
  }
  return (
    <div className="space-y-4">
      {!def.contentOnly && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
            <input type="text" value={heading} onChange={(e) => onChange({ ...data, heading: e.target.value })}
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" placeholder="Section heading" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
            <input type="text" value={subheading} onChange={(e) => onChange({ ...data, subheading: e.target.value })}
              className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" placeholder="Section subheading" />
          </div>
        </div>
      )}
      {def.fields.map((f) => (
        <RenderField key={f.name} field={f} value={def.contentOnly ? content[f.name] : (content[f.name] ?? '')} onChange={(v) => updateContent(f.name, v)} />
      ))}
      {def.hasList && !Array.isArray(def.hasList) && (
        <div className="pt-4">
          <ListEditor def={{ ...def, listKey: def.listKey || 'stats' }} data={data} onChange={onChange} />
        </div>
      )}
      {Array.isArray(def.hasList) && def.hasList.map((lc, li) => (
        <div key={li} className="pt-4">
          <ListEditor def={{ ...def, listKey: lc.listKey || `list_${li}`, listItemFields: lc.listItemFields, listLabel: lc.listLabel }} data={data} onChange={onChange} />
        </div>
      ))}
    </div>
  );
}

function SimpleListEditor({ def, data, onChange }) {
  const items = data?.content?.items || [];
  const heading = data?.heading || '';
  const subheading = data?.subheading || '';
  function addItem() {
    const newItem = {};
    def.itemFields.forEach((f) => { newItem[f.name] = ''; });
    onChange({ ...data, content: { ...(data?.content || {}), items: [...items, newItem] } });
  }
  function updateItem(idx, field, value) {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange({ ...data, content: { ...(data?.content || {}), items: updated } });
  }
  function removeItem(idx) {
    onChange({ ...data, content: { ...(data?.content || {}), items: items.filter((_, i) => i !== idx) } });
  }
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Heading</label>
          <input type="text" value={heading} onChange={(e) => onChange({ ...data, heading: e.target.value })}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Subheading</label>
          <input type="text" value={subheading} onChange={(e) => onChange({ ...data, subheading: e.target.value })}
            className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500" />
          </div>
      </div>
      <div className="pt-4">
        <RepeatableItemList
          title={def.listLabel || 'Items'}
          items={items}
          onAdd={addItem}
          addLabel={`Add ${def.label ? def.label.slice(0, -1) : 'Item'}`}
          renderItem={(item, i) => (
            <RepeatableItemCard key={i} index={i} label={(def.label || 'Item').slice(0, -1)} onRemove={() => removeItem(i)}>
              <div className="space-y-4">
                {def.itemFields.map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea value={item[f.name] || ''} onChange={(e) => updateItem(i, f.name, e.target.value)} rows={3}
                        className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                    ) : (
                      <input type="text" value={item[f.name] || ''} onChange={(e) => updateItem(i, f.name, e.target.value)}
                        className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
                    )}
                  </div>
                ))}
              </div>
            </RepeatableItemCard>
          )}
        />
      </div>
    </div>
  );
}

function RenderField({ field, value, onChange }) {
  if (field.type === 'image') return <ImageUploader value={value} onChange={onChange} label={field.label} />;
  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{field.label}</label>
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
      </div>
    );
  }
  if (field.type === 'multiline') {
    return (
      <div>
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{field.label}</label>
        <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={4}
          className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all font-mono text-xs" placeholder="Enter one per line" />
      </div>
    );
  }
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{field.label}</label>
        <button type="button" onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-admin-600' : 'bg-admin-300'}`}>
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{field.label}</label>
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500 transition-all" />
    </div>
  );
}

function AlumniEditor({ data, onChange }) {
  const companies = data?.companies || [];
  const [name, setName] = useState('');
  function addCompany() {
    if (!name.trim()) return;
    onChange({ ...data, companies: [...companies, { name: name.trim() }] });
    setName('');
  }
  function removeCompany(idx) {
    onChange({ ...data, companies: companies.filter((_, i) => i !== idx) });
  }
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Company name" className="flex-1 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-admin-500"
          onKeyDown={(e) => e.key === 'Enter' && addCompany()} />
        <AdminButton onClick={addCompany} variant="primary" size="md"><FiPlus className="w-4 h-4" /> Add</AdminButton>
      </div>
      {companies.length === 0 && <p className="text-sm text-neutral-400 italic">No companies added yet.</p>}
      <div className="flex flex-wrap gap-2">
        {companies.map((c, i) => (
          <div key={i} className="flex items-center gap-2 bg-white border border-admin-200 px-3 py-2 rounded-lg">
            <span className="text-sm font-medium">{c.name}</span>
            <button onClick={() => removeCompany(i)} className="text-red-500 hover:text-red-600"><FiTrash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePageEditor() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [alumniData, setAlumniData] = useState({ companies: [] });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loading, setLoading] = useState(true);
  const savingRef = useRef(false);
  const { dirty, reset } = useDirty([sections, alumniData], loading);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading) {
      const validKeys = ['hero', 'intro_form', 'empowering', 'featured_courses', 'services', 'cta_banner', 'faqs'];
      if (!section) navigate('/admin/home/hero', { replace: true });
      else if (!validKeys.includes(section)) navigate('/admin/home/hero', { replace: true });
    }
  }, [section, loading, navigate]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [homeRes, alumniRes] = await Promise.all([
        supabase.from('home_sections').select('*'),
        supabase.from('alumni_companies').select('*').order('sort_order'),
      ]);
      const dbMap = {};
      (homeRes.data || []).forEach((s) => { dbMap[s.section_key] = s; });
      const merged = sectionDefs.map((def) => {
        const existing = dbMap[def.key];
        return {
          id: existing?.id,
          section_key: def.key,
          heading: existing?.heading || '',
          subheading: existing?.subheading || '',
          content: existing?.content || {},
          is_active: existing?.is_active !== false,
        };
      });
      setSections(merged);
      if (alumniRes.data) {
        setAlumniData({ companies: alumniRes.data.map(c => ({ name: c.name })) });
      }
      setLoading(false);
    }
    load();
  }, []);

  function updateSection(key, data) {
    setSections((prev) => prev.map((s) => (s.section_key === key ? { ...s, ...data } : s)));
  }

  async function handleSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaved(false);
    for (const section of sections) {
      const payload = {
        section_key: section.section_key,
        heading: section.heading,
        subheading: section.subheading,
        content: section.content,
        is_active: section.is_active,
        sort_order: sectionDefs.findIndex((d) => d.key === section.section_key),
      };
      if (section.id) {
        await supabase.from('home_sections').update(payload).eq('id', section.id);
      } else {
        await supabase.from('home_sections').insert(payload);
      }
    }
    const { data: existingAlumni } = await supabase.from('alumni_companies').select('id');
    const existingAlumniIds = existingAlumni?.map(c => c.id) || [];
    if (existingAlumniIds.length > 0) {
      await supabase.from('alumni_companies').delete().in('id', existingAlumniIds);
    }
    const newCompanies = alumniData.companies.map((c, i) => ({ name: c.name, sort_order: i }));
    if (newCompanies.length > 0) {
      await supabase.from('alumni_companies').insert(newCompanies);
    }
    savingRef.current = false;
    setSaving(false);
    setSaved(true);
    reset();
    queryClient.invalidateQueries({ queryKey: ['homeSections'] });
    queryClient.invalidateQueries({ queryKey: ['alumniCompanies'] });
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const allNavItems = sectionDefs.map(d => ({ ...d, type: 'home_section' }));
  const selectedNav = allNavItems.find(n => n.key === section) || allNavItems[0];
  const def = sectionDefs.find(d => d.key === section);
  const sec = sections.find(s => s.section_key === section);

  return (
    <PageShell backTo="/admin" title="" maxWidth="max-w-none">
      <div className="flex gap-6 items-start">

        {/* Redesigned Sidebar Matching the Image */}
        <div className="transition-all duration-200 w-[240px] shrink-0">
          <nav className="sticky top-6 self-start max-h-[calc(100vh-80px)] overflow-visible">
            <div className="bg-white rounded-md flex flex-col overflow-visible ring-1 ring-gray-300" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
              {allNavItems.map((item, index) => {
                const isActive = selectedNav.key === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(`/admin/home/${item.key}`)}
                    className={`relative w-full flex flex-col text-left px-4 py-3 border-b border-gray-100 last:border-b-0 focus:outline-none ${
                      index === 0 ? 'rounded-t-md' : ''
                    } ${
                      index === allNavItems.length - 1 ? 'rounded-b-md' : ''
                    } ${
                      isActive ? 'bg-admin-600 text-white shadow-md z-10' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {item.label}
                    </div>

                    {isActive && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -right-[15px] w-0 h-0 border-y-[15px] border-y-transparent border-l-[30px] border-l-admin-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Main Content Editor Area */}
        <div className="flex-1 min-w-0">
          <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} label="Page" top />
          <div className="bg-white border border-gray-300 rounded-xl p-6" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
            {def && sec ? (
              <SectionEditor def={def} data={sec} onChange={(data) => updateSection(section, data)} />
            ) : (
              <p className="text-sm text-gray-400">Section not found.</p>
            )}
          </div>
          <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
        </div>
      </div>
    </PageShell>
  );
}
