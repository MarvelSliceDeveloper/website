import { useState, useRef, useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import CommandPalette from "../components/ui/CommandPalette";
import { ToastContainer, toast } from "../components/Toast";
import { FiMenu, FiExternalLink, FiLogOut, FiGrid, FiSearch, FiBell, FiMessageCircle, FiClock, FiFile, FiClipboard, FiMail, FiBriefcase, FiX, FiSettings, FiInfo } from "react-icons/fi";
import { trackLogout } from "../../lib/analytics";

const submissionTypes = [
  { key: 'brochure', table: 'brochure_downloads', label: 'Brochure', link: '/admin/brochure-downloads', icon: FiFile, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'form', table: 'form_submissions', label: 'Form', link: '/admin/form-submissions', icon: FiClipboard, color: 'text-violet-600', bg: 'bg-violet-50' },
  { key: 'contact', table: 'contact_submissions', label: 'Contact', link: '/admin/contact-submissions', icon: FiMail, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'about', table: 'about_submissions', label: 'About', link: '/admin/about-submissions', icon: FiInfo, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'career', table: 'career_submissions', label: 'Career', link: '/admin/career-submissions', icon: FiBriefcase, color: 'text-rose-600', bg: 'bg-rose-50' },
  { key: 'careerContact', table: 'career_contact_submissions', label: 'Career Enquiry', link: '/admin/career-contact-submissions', icon: FiMail, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: 'newsletter', table: 'newsletter_subscribers', label: 'Newsletter', link: '/admin/newsletter-subscribers', icon: FiMail, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'chat', table: 'conversations', label: 'Chat', link: '/admin/chats?tab=live', icon: FiMessageCircle, color: 'text-cyan-600', bg: 'bg-cyan-50' },
];

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

import { useSiteSettings } from "../../hooks/useSupabase";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url || settings?.logo || "/apple-touch-icon.png";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadByType, setUnreadByType] = useState({});
  const menuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    async function fetchUnread(type) {
      const { table, key } = type;
      if (key === 'chat') {
        const { data } = await supabase
          .from(table)
          .select('id, user_name, last_message, last_message_sender, last_message_at, status')
          .eq('notified', true)
          .order('last_message_at', { ascending: false });
        return data || [];
      }
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    }

    async function fetchAll() {
      const results = await Promise.all(submissionTypes.map(t => fetchUnread(t)));
      const map = {};
      submissionTypes.forEach((t, i) => { map[t.key] = results[i]; });
      setUnreadByType(map);
    }
    fetchAll();

    const channels = submissionTypes.map(t => {
      const filterKey = t.key === 'chat' ? 'notified' : 'is_read';
      return supabase
        .channel(`admin-notif-${t.key}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: t.table }, async (payload) => {
          const newItem = payload.new;
          setUnreadByType(prev => {
            const existing = prev[t.key] || [];
            const updated = [{ ...newItem, full_name: newItem.full_name || newItem.name || newItem.user_name || 'Anonymous' }, ...existing].slice(0, 10);
            return { ...prev, [t.key]: updated };
          });
          toast({ type: 'success', message: `New ${t.label.toLowerCase()} submission`, duration: 4000 });
        })
        .subscribe();
    });

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const totalUnread = Object.values(unreadByType).reduce((sum, items) => sum + items.length, 0);

  async function dismissNotification(type, item) {
    const table = type.table;
    if (type.key === 'chat') {
      await supabase.from(table).update({ notified: false }).eq('id', item.id);
    } else {
      await supabase.from(table).update({ is_read: true }).eq('id', item.id);
    }
    setUnreadByType(prev => ({
      ...prev,
      [type.key]: (prev[type.key] || []).filter(n => n.id !== item.id),
    }));
  }

  return (
    <div className="flex h-screen bg-[#EEEEEE] overflow-hidden">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-admin-200/80 px-4 lg:px-6 flex items-center justify-between h-14 shrink-0 gap-4 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-neutral-600 hover:bg-admin-100 rounded-lg transition-all duration-200">
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex min-w-0"></div>
            <Link to="/admin" className="flex items-center gap-2 text-sm font-bold text-neutral-900 lg:hidden">
              <img src={logoUrl} alt="Marvel Slice Logo" className="w-7 h-7 object-contain rounded-md shrink-0" />
              <span>Marvel <span className="text-brand-orange">Slice</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-admin-200 text-xs text-neutral-400 hover:text-neutral-600 hover:border-admin-300 transition-all duration-200 bg-white/50 min-w-[180px]"
            >
              <FiSearch className="w-3.5 h-3.5" />
              <span className="flex-1 text-left">Search pages...</span>
              <kbd className="text-[10px] text-neutral-400 bg-white border border-admin-200 rounded px-1.5 py-0.5 font-mono shadow-sm">⌘K</kbd>
            </button>
            <button className="lg:hidden p-2 text-neutral-400 hover:text-neutral-600 hover:bg-admin-100 rounded-lg transition-all duration-200" onClick={() => setSearchOpen(true)}>
              <FiSearch className="w-4 h-4" />
            </button>

            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)} className={`relative p-2 rounded-lg transition-all duration-200 ${notifOpen ? 'bg-admin-100 text-admin-600' : 'text-neutral-400 hover:text-neutral-600 hover:bg-admin-100'}`}>
                <FiBell className="w-5 h-5" />
                {totalUnread > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[11px] font-bold text-white bg-destructive-500 rounded-full ring-2 ring-white leading-none">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-80 sm:w-80 bg-white rounded-xl shadow-2xl border border-admin-200 z-50 max-h-96 flex flex-col">
                  <div className="px-4 py-3 border-b border-admin-100">
                    <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                    <p className="text-xs text-neutral-500">{totalUnread} unread submission{totalUnread !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="overflow-y-auto admin-scrollbar flex-1">
                    {totalUnread === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-neutral-400">No new notifications</div>
                    ) : (
                      submissionTypes.filter(t => (unreadByType[t.key] || []).length > 0).map(type => {
                        const items = unreadByType[type.key] || [];
                        const Icon = type.icon;
                        return (
                          <div key={type.key}>
                            <div className="px-4 py-2 text-[11px] font-semibold text-neutral-500 uppercase tracking-wider bg-gray-50/50">{type.label}</div>
                            {items.slice(0, 3).map((item, i) => (
                              <div key={item.id || i} className="group relative flex items-start gap-3 px-4 py-2.5 hover:bg-admin-50 transition-colors border-b border-admin-100 last:border-0">
                                <Link
                                  to={type.link}
                                  onClick={() => { dismissNotification(type, item); setNotifOpen(false); }}
                                  className="flex items-start gap-3 flex-1 min-w-0"
                                >
                                  <div className={`w-8 h-8 rounded-full ${type.bg} ${type.color} flex items-center justify-center shrink-0 mt-0.5`}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-neutral-900 truncate">{item.full_name || item.user_name || 'Anonymous'}</p>
                                    <p className="text-xs text-neutral-500 truncate mt-0.5">{item.last_message || type.label}</p>
                                    <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                                      <FiClock className="w-3 h-3" />
                                      {relativeTime(item.last_message_at || item.created_at) || 'Just now'}
                                    </p>
                                  </div>
                                </Link>
                                <button
                                  onClick={(e) => { e.stopPropagation(); dismissNotification(type, item); }}
                                  className="absolute top-2.5 right-2 p-0.5 rounded text-neutral-300 hover:text-neutral-600 hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                                  title="Dismiss"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/" target="_blank" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-neutral-700 hover:bg-admin-100 transition-all duration-200">
              <FiExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">View Site</span>
            </Link>

            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} className={`flex items-center gap-2 ml-1 pl-3 pr-2 py-1.5 text-sm rounded-lg transition-all duration-200 ${menuOpen ? 'bg-admin-100 text-admin-900' : 'text-neutral-600 hover:text-neutral-900 hover:bg-admin-100'}`}>
                <span className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-admin-500 to-admin-800 text-white flex items-center justify-center text-xs font-bold shadow-sm shrink-0">
                  {user?.profile_pic ? (
                    <img src={user.profile_pic} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'A'
                  )}
                </span>
                <span className="hidden sm:inline max-w-[100px] truncate">{user?.name || user?.email}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-2xl border border-admin-200 py-1 z-50">
                  <div className="px-3 py-2 text-xs text-neutral-500 border-b border-admin-100">
                    <div className="font-medium text-neutral-900">{user?.name}</div>
                    <div className="truncate">{user?.email}</div>
                    <div className="capitalize mt-0.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white text-neutral-700">{user?.role}</span>
                    </div>
                  </div>
                  <Link to="/admin/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-admin-50 transition-all duration-200">
                    <FiSettings className="w-4 h-4" /> Profile Settings
                  </Link>
                  <button onClick={() => { trackLogout(); logout(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive-500 hover:bg-destructive-50 transition-all duration-200">
                    <FiLogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto admin-scrollbar p-4 lg:p-6 w-full max-w-full min-w-0 box-border">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
