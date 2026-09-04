import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as LuIcons from 'react-icons/lu';
import { supabase } from '../../lib/supabaseClient';
import AddButton from '../components/AddButton';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import { FiSave, FiAlertCircle, FiTrash2, FiUpload, FiChevronUp, FiChevronDown, FiChevronRight, FiAlignLeft, FiAlignCenter, FiAlignRight, FiEye, FiEyeOff, FiMove, FiX, FiCheck, FiImage, FiLayers } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import SectionAccordion from '../components/ui/SectionAccordion';
import FolderTabs from '../components/ui/FolderTabs';

const LUCIDE_ICON_NAMES = Object.keys(LuIcons).filter(k => k.startsWith('Lu')).map(k => k.slice(2)).sort();

const SECTION_TYPES = [
  { value: 'text', label: 'Text', desc: 'Heading + body paragraphs' },
  { value: 'text_stats', label: 'Text + Stats', desc: 'Heading, paragraphs, and stat cards combined' },
  { value: 'stats_row', label: 'Stats Row', desc: 'Number + label cards (4-column)' },
  { value: 'feature_grid', label: 'Feature Grid', desc: 'Icon + title + description cards (4-column)' },
  { value: 'cta', label: 'CTA Banner', desc: 'Call-to-action banner with button link' },
];

function createEmptySection(type) {
  const base = { section_type: type, heading: '', headingAlign: 'center', hidden: false };
  switch (type) {
    case 'text':
      return { ...base, content: '', contentAlign: 'center', image_url: '' };
    case 'text_stats':
      return { ...base, content: '', contentAlign: 'center', items: [], image_url: '' };
    case 'stats_row':
      return { ...base, items: [] };
    case 'feature_grid':
      return { ...base, subheading: '', subheadingAlign: 'center', items: [] };
    default:
      return base;
  }
}

function AlignButtons({ value, onChange }) {
  const options = [
    { value: 'left', icon: FiAlignLeft },
    { value: 'center', icon: FiAlignCenter },
    { value: 'right', icon: FiAlignRight },
  ];
  return (
    <div className="flex items-center gap-1 p-1 bg-admin-100 rounded-lg w-fit">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`p-1.5 rounded-md transition-colors cursor-pointer ${value === opt.value ? 'bg-white text-admin-700 shadow-sm' : 'text-admin-400 hover:text-admin-600'}`}
        >
          <opt.icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}

function ImageUploader({ value, onChange, label }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    const ext = file.name.split('.').pop();
    const path = `about/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('pages').upload(path, file);
    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('pages').getPublicUrl(path);
    onChange(data.publicUrl);
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
      {uploadError && <p className="text-xs text-destructive-500 mt-1">{uploadError}</p>}
      {value && <img src={value} alt="" className="mt-2 h-28 w-full object-cover rounded-lg border border-admin-200" />}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, label, required, error }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{label}{required ? ' *' : ''}</label>}
      <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-transparent transition-all" placeholder={placeholder} />
      {error && <p className="text-xs text-destructive-500 mt-1">{error}</p>}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, label, rows, required }) {
  return (
    <div>
      {label && <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">{label}{required ? ' *' : ''}</label>}
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={rows || 3}
        className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 focus:border-transparent transition-all" placeholder={placeholder} />
    </div>
  );
}

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
      <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Icon *</label>
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

function ReorderableList({ items, onChange, renderItem, getKey }) {
  function move(from, dir) {
    const to = from + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    onChange(next);
  }

  function remove(idx) {
    onChange(items.filter((_, i) => i !== idx));
  }

  return items.map((item, i) => (
    <div key={getKey ? getKey(item, i) : i} className="border border-admin-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Item {i + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
            className="p-1 text-emerald-500 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><FiChevronUp className="w-4 h-4" /></button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1}
            className="p-1 text-cyan-500 hover:text-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><FiChevronDown className="w-4 h-4" /></button>
        </div>
      </div>
      {renderItem(item, i, (updated) => {
        const next = [...items];
        next[i] = updated;
        onChange(next);
      })}
    </div>
  ));
}

function SubEditor({ section, onChange }) {
  const set = (patch) => onChange({ ...section, ...patch });

  switch (section.section_type) {
    case 'text': {
      const blocks = Array.isArray(section.content)
        ? section.content
        : (() => {
            if (typeof section.content === 'string') {
              try { const p = JSON.parse(section.content); if (Array.isArray(p)) return p; } catch {}
            }
            const paras = (section.content || '').split('\n\n').map(t => t.trim()).filter(Boolean);
            const list = [];
            if (section.heading) list.push({ type: 'heading', text: section.heading });
            paras.forEach((p) => list.push({ type: 'paragraph', text: p }));
            if (list.length === 0) list.push({ type: 'heading', text: '' });
            return list;
          })();

      function updateBlock(i, patch) {
        const next = blocks.map((b, j) => j === i ? { ...b, ...patch } : b);
        set({ content: JSON.stringify(next) });
      }
      function moveBlock(from, dir) {
        const to = from + dir;
        if (to < 0 || to >= blocks.length) return;
        const next = [...blocks];
        const [removed] = next.splice(from, 1);
        next.splice(to, 0, removed);
        set({ content: JSON.stringify(next) });
      }
      function removeBlock(i) {
        const next = blocks.filter((_, j) => j !== i);
        set({ content: JSON.stringify(next) });
      }
      function addBlock(type) {
        const next = [...blocks, { type, text: '' }];
        set({ content: JSON.stringify(next) });
      }

      return (
        <div className="space-y-6">
          <ImageUploader value={section.image_url} onChange={(v) => set({ image_url: v })} label="Side Image (optional — shows on the right)" />
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Heading + Body Paragraphs</span>
              <span className="text-xs text-neutral-400 flex items-center gap-1"><FiMove className="w-3 h-3" /> Drag to fix positions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Content Align</span>
              <AlignButtons value={section.contentAlign || 'center'} onChange={(v) => set({ contentAlign: v })} />
            </div>
          </div>

          <div className="border border-admin-200 rounded-lg overflow-hidden divide-y divide-admin-200">
            {blocks.map((b, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-white">
                <div className="mt-1 flex flex-col items-center gap-1">
                  <span className="text-neutral-300 hover:text-admin-500 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                    <FiMove className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] text-neutral-400">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${b.type === 'heading' ? 'bg-blue-50 text-blue-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      {b.type === 'heading' ? 'Heading' : 'Paragraph'}
                    </span>
                    <button type="button" onClick={() => updateBlock(i, { type: b.type === 'heading' ? 'paragraph' : 'heading' })}
                      className="text-[10px] text-admin-500 hover:underline cursor-pointer">
                      Make {b.type === 'heading' ? 'Paragraph' : 'Heading'}
                    </button>
                  </div>
                  {b.type === 'heading' ? (
                    <TextInput value={b.text} onChange={(v) => updateBlock(i, { text: v })} placeholder="Section heading" />
                  ) : (
                    <TextArea value={b.text} onChange={(v) => updateBlock(i, { text: v })} placeholder="Body paragraph..." rows={2} />
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 mt-1">
                  <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0}
                    className="p-1 text-emerald-500 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><FiChevronUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}
                    className="p-1 text-cyan-500 hover:text-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><FiChevronDown className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={() => removeBlock(i)}
                    className="p-1 text-red-500 hover:text-red-600 cursor-pointer"><FiTrash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <AddButton onClick={() => addBlock('heading')} label="Add Heading" />
            <AddButton onClick={() => addBlock('paragraph')} label="Add Paragraph" />
          </div>
        </div>
      );
    }
    case 'text_stats':
      return (
        <div className="space-y-6">
          <ImageUploader value={section.image_url} onChange={(v) => set({ image_url: v })} label="Side Image (optional — shows on the right)" />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <TextInput value={section.heading} onChange={(v) => set({ heading: v })} placeholder="Section heading (optional)" label="Heading" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Align</label>
              <AlignButtons value={section.headingAlign || 'center'} onChange={(v) => set({ headingAlign: v })} />
            </div>
          </div>
          <TextArea value={section.content} onChange={(v) => set({ content: v })} placeholder="Content..." label="Content" required />
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Content Align</span>
            <AlignButtons value={section.contentAlign || 'center'} onChange={(v) => set({ contentAlign: v })} />
          </div>
          <hr className="border-admin-200" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stat Items</span>
              <AddButton onClick={() => set({ items: [...(section.items || []), { number: '', label: '', icon: '' }] })} label="Add Stat" />
          </div>
          <ReorderableList
            items={section.items || []}
            onChange={(v) => set({ items: v })}
            renderItem={(item, i, onItemChange) => (
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <IconPicker value={item.icon} onChange={(v) => onItemChange({ ...item, icon: v })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Number</label>
                  <input type="text" value={item.number} onChange={(e) => onItemChange({ ...item, number: e.target.value })} placeholder="Number (e.g. 500+)" className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Label</label>
                  <input type="text" value={item.label} onChange={(e) => onItemChange({ ...item, label: e.target.value })} placeholder="Label (e.g. Students)" className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
                </div>
              </div>
            )}
          />
        </div>
      );
    case 'stats_row':
      return (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <TextInput value={section.heading} onChange={(v) => set({ heading: v })} placeholder="Section heading (optional)" label="Heading" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Align</label>
              <AlignButtons value={section.headingAlign || 'center'} onChange={(v) => set({ headingAlign: v })} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Stat Items</span>
            <AddButton onClick={() => set({ items: [...(section.items || []), { number: '', label: '' }] })} label="Add Stat" />
            </div>
            <ReorderableList
              items={section.items || []}
              onChange={(v) => set({ items: v })}
              renderItem={(item, i, onItemChange) => (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Number</label>
                    <input type="text" value={item.number} onChange={(e) => onItemChange({ ...item, number: e.target.value })} placeholder="Number (e.g. 500+)" className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Label</label>
                    <input type="text" value={item.label} onChange={(e) => onItemChange({ ...item, label: e.target.value })} placeholder="Label (e.g. Students)" className="w-full px-3 py-2.5 bg-white border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 transition-all" />
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      );
    case 'team_grid':
      return (
        <div className="space-y-6">
          <TextInput value={section.heading} onChange={(v) => set({ heading: v })} placeholder="Section heading" label="Heading" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Team Members</span>
              <AddButton onClick={() => set({ items: [...(section.items || []), { name: '', role: '', bio: '', image_url: '' }] })} label="Add Member" />
            </div>
            <ReorderableList
              items={section.items || []}
              onChange={(v) => set({ items: v })}
              renderItem={(item, i, onItemChange) => (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <TextInput value={item.name} onChange={(v) => onItemChange({ ...item, name: v })} placeholder="Name" label="Name" required />
                    <TextInput value={item.role} onChange={(v) => onItemChange({ ...item, role: v })} placeholder="Role" label="Role" />
                  </div>
                  <TextArea value={item.bio} onChange={(v) => onItemChange({ ...item, bio: v })} placeholder="Short bio..." label="Bio" rows={2} />
                  <ImageUploader value={item.image_url} onChange={(v) => onItemChange({ ...item, image_url: v })} label="Photo" />
                </div>
              )}
            />
          </div>
        </div>
      );
    case 'feature_grid':
      return (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <TextInput value={section.heading} onChange={(v) => set({ heading: v })} placeholder="Section heading" label="Heading" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Align</label>
                <AlignButtons value={section.headingAlign || 'center'} onChange={(v) => set({ headingAlign: v })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <TextArea value={section.subheading} onChange={(v) => set({ subheading: v })} placeholder="Subheading (optional)" label="Subheading" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">Align</label>
                <AlignButtons value={section.subheadingAlign || 'center'} onChange={(v) => set({ subheadingAlign: v })} />
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Feature Items</span>
              <AddButton onClick={() => set({ items: [...(section.items || []), { icon: '', title: '', description: '' }] })} label="Add Feature" />
            </div>
            <ReorderableList
              items={section.items || []}
              onChange={(v) => set({ items: v })}
              renderItem={(item, i, onItemChange) => (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <IconPicker value={item.icon} onChange={(v) => onItemChange({ ...item, icon: v })} />
                    <TextInput value={item.title} onChange={(v) => onItemChange({ ...item, title: v })} placeholder="Title" label="Title" required />
                  </div>
                  <TextArea value={item.description} onChange={(v) => onItemChange({ ...item, description: v })} placeholder="Description..." label="Description" rows={2} />
                </div>
              )}
            />
          </div>
        </div>
      );
    case 'cta':
      return (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <TextInput value={section.heading} onChange={(v) => set({ heading: v })} placeholder="Ready to get started?" label="Heading" />
            <TextInput value={section.cta_link} onChange={(v) => set({ cta_link: v })} placeholder="/contact" label="Button Link" />
          </div>
          <TextArea value={section.content} onChange={(v) => set({ content: v })} placeholder="Short description..." label="Description" rows={2} />
        </div>
      );
    default:
      return null;
  }
}

const SECTION_TYPE_LABELS = Object.fromEntries(SECTION_TYPES.map(t => [t.value, t.label]));

const PAGE_PATH = '/about';

export default function AboutPageEditor() {

  const [activeTab, setActiveTab] = useState('hero-image');
const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [navItem, setNavItem] = useState(null);
  const [navItemId, setNavItemId] = useState(null);
  const [pageId, setPageId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const navItemIdRef = useRef(null);
  const savingRef = useRef(false);

  const [hero, setHero] = useState({ hero_image: '' });
  const [sections, setSections] = useState([]);
  const [newType, setNewType] = useState('text');
  const [showHeroImage, setShowHeroImage] = useState(false);
  const { dirty, reset } = useDirty([hero, sections], loading);

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
        const { data: newItem } = await supabase.from('nav_items').insert({ label: 'About', path: PAGE_PATH, is_active: true, sort_order: 99 }).select('*').single();
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
          setHero({ hero_image: page.hero_image || '' });
          setShowHeroImage(!!page.hero_image);
          setSections(page.sections || []);
        }
      }
      setLoading(false);
    }
    resolve();
  }, []);

  function addSection() {
    setSections([...sections, createEmptySection(newType)]);
    setExpandedIdx(sections.length);
  }

  function removeSection(idx) {
    setSections(sections.filter((_, i) => i !== idx));
    setExpandedIdx((prev) => (prev === idx ? null : prev > idx ? prev - 1 : prev));
  }

  function moveSection(from, dir) {
    const to = from + dir;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [removed] = next.splice(from, 1);
    next.splice(to, 0, removed);
    setSections(next);
    setExpandedIdx(to);
  }

  function updateSection(idx, updated) {
    const next = [...sections];
    next[idx] = updated;
    setSections(next);
  }

  function toggleVisibility(idx) {
    const next = [...sections];
    next[idx] = { ...next[idx], hidden: !next[idx].hidden };
    setSections(next);
  }

  function handleDragStart(i) {
    setDragIdx(i);
  }

  function handleDragOver(e, i) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const next = [...sections];
    const [removed] = next.splice(dragIdx, 1);
    next.splice(i, 0, removed);
    setSections(next);
    setDragIdx(i);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  function validate() {
    const errors = [];
    sections.forEach((sec, i) => {
      if (sec.section_type === 'feature_grid' || sec.section_type === 'text_stats') {
        (sec.items || []).forEach((item, j) => {
          if (item.icon && !LUCIDE_ICON_NAMES.includes(item.icon)) {
            errors.push(`Section ${i + 1} (${SECTION_TYPE_LABELS[sec.section_type] || sec.section_type}), Item ${j + 1}: "${item.icon}" is not a valid Lucide icon name`);
          }
        });
      }
    });
    setValidationErrors(errors);
    return errors.length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (savingRef.current) return;
    if (!validate()) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError('');
    if (!navItemId && !navItemIdRef.current) { setSaveError('No nav item linked — please refresh and try again'); setSaving(false); savingRef.current = false; return; }

    const payload = {
      nav_item_id: navItemId || navItemIdRef.current,
      heading: '',
      subheading: '',
      hero_image: hero.hero_image || null,
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

  const tabs = [
    { id: 'hero-image', title: 'Hero Image', icon: FiImage },
    { id: 'sections', title: 'Sections', icon: FiLayers },
  ];

  return (
    <PageShell backTo="/admin" title="">
      <SaveBar saving={saving} saved={saved} saveError={saveError} label="Page" top />
      <div className="flex flex-col">
        <div className="flex items-end justify-between">
          <FolderTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-warning-50 border border-warning-500 rounded-lg">
            <p className="text-sm font-semibold text-warning-700 mb-1">Validation warnings</p>
            <ul className="list-disc pl-5 text-sm text-warning-700 space-y-0.5">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
        <form onSubmit={handleSave} className="bg-white border border-gray-300 rounded-b-[20px] rounded-tr-[20px] shadow-sm p-6 space-y-6 relative z-30 -mt-[2px]">

        {activeTab === 'hero-image' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <ImageUploader value={hero.hero_image} onChange={(v) => setHero({ ...hero, hero_image: v })} label="Hero Image" />
              {hero.hero_image && (
                <button type="button" onClick={() => setHero({ ...hero, hero_image: '' })} className="text-xs text-destructive-500 hover:text-destructive-700 cursor-pointer">Remove image</button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              {SECTION_TYPES.find(t => t.value === newType)?.desc ? (
                <div className="flex items-center gap-3">
                  <p className="text-xs text-neutral-400">{SECTION_TYPES.find(t => t.value === newType)?.desc}</p>
                  <span className="text-xs text-neutral-400 flex items-center gap-1"><FiMove className="w-3 h-3" /> Drag to fix positions</span>
                </div>
              ) : <div />}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select value={newType} onChange={(e) => setNewType(e.target.value)}
                    className="w-44 px-3 py-2 border border-admin-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-500/20 bg-white cursor-pointer transition-all">
                    {SECTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <AddButton onClick={addSection} label="Add Section" />
              </div>
            </div>
            {sections.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-8">No sections yet. Select a type above and click "Add".</p>
            )}
            <div className="border-2 border-admin-300 rounded-xl p-1.5 space-y-1.5">
              {sections.map((sec, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-stretch border border-admin-200 rounded-lg transition-shadow bg-white ${dragIdx === i ? 'shadow-lg ring-2 ring-admin-500' : ''} ${sec.hidden ? 'opacity-50' : ''} ${expandedIdx === i ? '' : 'overflow-hidden'}`}
                >
                  <div
                    className="flex flex-col items-center justify-center px-3 cursor-grab active:cursor-grabbing border-r border-dashed border-admin-200 bg-neutral-50 hover:bg-admin-50 group rounded-l-lg"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Drag to reorder"
                  >
                    <FiMove className="w-4 h-4 text-neutral-400 group-hover:text-admin-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white cursor-pointer" onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-neutral-400">{i + 1}</span>
                      <span className="text-xs font-medium text-neutral-700">{SECTION_TYPE_LABELS[sec.section_type] || sec.section_type}</span>
                      {sec.heading && <span className="text-xs text-neutral-400 max-w-48 truncate">— {sec.heading}</span>}
                      {sec.hidden && <span className="text-xs text-warning-500 font-medium">Hidden</span>}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleVisibility(i); }}
                        className="p-1 text-blue-500 hover:text-blue-700 cursor-pointer" title={sec.hidden ? 'Show section' : 'Hide section'}>
                        {sec.hidden ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveSection(i, -1); }} disabled={i === 0}
                        className="p-1 text-emerald-500 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><FiChevronUp className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); moveSection(i, 1); }} disabled={i === sections.length - 1}
                        className="p-1 text-cyan-500 hover:text-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"><FiChevronDown className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeSection(i); }}
                        className="p-1 text-red-500 hover:text-red-600 cursor-pointer"><FiTrash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  {expandedIdx === i && (
                    <div className="p-4 border-t border-admin-200 rounded-b-lg">
                      <SubEditor section={sec} onChange={(updated) => updateSection(i, updated)} />
                    </div>
                  )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </form>
        <SaveCancelBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} onDiscard={() => window.location.reload()} />
      </div>
    </PageShell>
  );
}
