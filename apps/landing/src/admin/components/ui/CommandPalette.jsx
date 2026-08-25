import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFile, FiFileText, FiBookOpen, FiServer, FiZap, FiInbox, FiSettings, FiMenu, FiHome, FiMessageCircle, FiLayers, FiGlobe, FiSearch } from 'react-icons/fi';

const routes = [
  { label: 'Dashboard', to: '/admin', icon: FiHome, category: 'Pages' },
  { label: 'Home Page', to: '/admin/home/hero', icon: FiFile, category: 'Pages' },
  { label: 'About Page', to: '/admin/about-page', icon: FiFile, category: 'Pages' },
  { label: 'Contact Page', to: '/admin/contact-page', icon: FiFile, category: 'Pages' },
  { label: 'Career Page', to: '/admin/career-page', icon: FiFile, category: 'Pages' },
  { label: 'Services Page', to: '/admin/services-page', icon: FiServer, category: 'Pages' },
  { label: 'Training Page', to: '/admin/training-page', icon: FiZap, category: 'Pages' },
  { label: 'Courses', to: '/admin/courses', icon: FiBookOpen, category: 'Content' },
  { label: 'Add Course', to: '/admin/courses/wizard', icon: FiBookOpen, category: 'Content' },
  { label: 'All Programs', to: '/admin/training', icon: FiZap, category: 'Content' },
  { label: 'Add Program', to: '/admin/training/new', icon: FiZap, category: 'Content' },
  { label: 'Blog Posts', to: '/admin/blog', icon: FiFileText, category: 'Content' },
  { label: 'New Blog Post', to: '/admin/blog/new', icon: FiFileText, category: 'Content' },
  { label: 'Career Submissions', to: '/admin/career-submissions', icon: FiInbox, category: 'Submissions' },
  { label: 'Career Enquiry Submissions', to: '/admin/career-contact-submissions', icon: FiInbox, category: 'Submissions' },
  { label: 'Internships', to: '/admin/internships', icon: FiInbox, category: 'Content' },
  { label: 'Add Intern', to: '/admin/internships/new', icon: FiInbox, category: 'Content' },
  { label: 'Contact Submissions', to: '/admin/contact-submissions', icon: FiInbox, category: 'Submissions' },
  { label: 'Brochure Downloads', to: '/admin/brochure-downloads', icon: FiInbox, category: 'Submissions' },
  { label: 'Form Submissions', to: '/admin/form-submissions', icon: FiInbox, category: 'Submissions' },
  { label: 'Chat Submissions', to: '/admin/chat-submissions', icon: FiInbox, category: 'Submissions' },
  { label: 'Menu', to: '/admin/nav-menu', icon: FiMenu, category: 'Settings' },
  { label: 'Media Library', to: '/admin/media', icon: FiLayers, category: 'Settings' },
  { label: 'Footer', to: '/admin/footer', icon: FiLayers, category: 'Settings' },
  { label: 'Site Settings', to: '/admin/site-settings?section=general', icon: FiSettings, category: 'Settings' },
  { label: 'Admin Users', to: '/admin/admin-users', icon: FiSettings, category: 'Settings' },
  { label: 'Live Chat', to: '/admin/chats?tab=live', icon: FiMessageCircle, category: 'Settings' },
  { label: 'Chat History', to: '/admin/chats?tab=history', icon: FiMessageCircle, category: 'Settings' },
  { label: 'Social Links', to: '/admin/site-settings?section=social', icon: FiGlobe, category: 'Settings' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return routes
      .map((r) => {
        const score = r.label.toLowerCase().includes(q) ? 1 : r.category.toLowerCase().includes(q) ? 0.5 : 0;
        return { ...r, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [query]);

  function handleSelect(route) {
    navigate(route.to);
    onClose();
  }

  function groupResults(results) {
    const groups = {};
    for (const r of results) {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    }
    return groups;
  }

  if (!open) return null;

  const grouped = groupResults(results);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh] cursor-pointer" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-admin-200 overflow-hidden cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-admin-100">
          <FiSearch className="w-4 h-4 text-admin-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, content, settings..."
            className="flex-1 h-12 text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent outline-none"
          />
          <kbd className="text-[10px] text-neutral-400 bg-admin-100 border border-admin-200 rounded px-1.5 py-0.5 font-mono shrink-0">ESC</kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto admin-scrollbar py-2">
          {query.trim() && results.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <p className="text-sm text-neutral-400">No results for "{query}"</p>
            </div>
          )}
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{category}</div>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.to}
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-white hover:text-neutral-900 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-admin-100 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-admin-500" />
                    </div>
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-[11px] text-neutral-400">{item.to}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
