import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import Card from '../components/ui/Card';
import { LoadingState } from '../components/ui/EmptyState';
import {
  FiBookOpen, FiUsers, FiFileText, FiMenu, FiTag, FiMessageCircle,
  FiPlusCircle, FiInbox, FiImage,
  FiSettings, FiBarChart2,
} from 'react-icons/fi';

const toneClasses = {
  slate: 'bg-neutral-700 text-white',
  rose: 'bg-rose-600 text-white',
  amber: 'bg-amber-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  violet: 'bg-violet-600 text-white',
  cyan: 'bg-cyan-600 text-white',
  orange: 'bg-orange-600 text-white',
  blue: 'bg-blue-600 text-white',
  indigo: 'bg-indigo-600 text-white',
  pink: 'bg-pink-600 text-white',
  teal: 'bg-teal-600 text-white',
  purple: 'bg-purple-600 text-white',
  fuchsia: 'bg-fuchsia-600 text-white',
  sky: 'bg-sky-600 text-white',
  lime: 'bg-lime-600 text-white',
  red: 'bg-red-600 text-white',
};

function StatCard({ icon: Icon, label, value, link, iconTone = 'slate' }) {
  const Wrapper = link ? Link : 'div';
  return (
    <Wrapper to={link} className="block bg-white rounded-xl border border-admin-200 p-5 hover:shadow-elevated hover:border-admin-300 transition-all group" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${toneClasses[iconTone] || toneClasses.slate}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[1.375rem] font-semibold tabular-nums text-black leading-none">{value}</span>
      </div>
      <p className="text-[0.95rem] font-medium text-neutral-500">{label}</p>
    </Wrapper>
  );
}

function ActionTile({ to, icon: Icon, label, tone = 'slate' }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-1.5 p-4 bg-white rounded-xl border border-admin-200 hover:border-admin-300 hover:shadow-elevated transition-all text-center group" style={{ boxShadow: 'rgba(100, 100, 111, 0.2) 0px 7px 29px 0px' }}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${toneClasses[tone] || toneClasses.slate} group-hover:scale-105`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-neutral-500">{label}</span>
    </Link>
  );
}

const quickLinks = [
  { to: '/admin/courses/wizard', label: 'New Course', icon: FiPlusCircle, tone: 'emerald' },
  { to: '/admin/blog', label: 'Blog Post', icon: FiFileText, tone: 'fuchsia' },
  { to: '/admin/media', label: 'Upload Media', icon: FiImage, tone: 'sky' },
  { to: '/admin/site-settings?section=general', label: 'Settings', icon: FiSettings, tone: 'slate' },
  { to: '/admin/courses/reports', label: 'Reports', icon: FiBarChart2, tone: 'red' },
  { to: '/admin/chats?tab=live', label: 'Chat', icon: FiMessageCircle, tone: 'lime' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState({ career: 0, contact: 0, brochure: 0, form: 0, chat: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    async function fetchData() {
      const results = await Promise.allSettled([
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('nav_items').select('*', { count: 'exact', head: true }),
        supabase.from('alumni_companies').select('*', { count: 'exact', head: true }),
        supabase.from('tags').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('blog_posts').select('id, title, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('career_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('contact_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('brochure_downloads').select('*', { count: 'exact', head: true }),
        supabase.from('form_submissions').select('*', { count: 'exact', head: true }),
        supabase.from('conversations').select('*', { count: 'exact', head: true }),
      ]);
      const getCount = (r) => (r.status === 'fulfilled' ? r.value.count ?? 0 : 0);
      setStats({
        courses: getCount(results[0]), navItems: getCount(results[1]),
        companies: getCount(results[2]), tags: getCount(results[3]), blogPosts: getCount(results[4]),
      });
      setPending({
        career: getCount(results[7]), contact: getCount(results[8]), brochure: getCount(results[9]), form: getCount(results[10]), chat: getCount(results[11]),
      });

      const courses = results[5].status === 'fulfilled' ? (results[5].value.data ?? []) : [];
      const blogs = results[6].status === 'fulfilled' ? (results[6].value.data ?? []) : [];
      const recent = [...courses.map(c => ({ ...c, _type: 'course' })), ...blogs.map(b => ({ ...b, _type: 'blog' }))]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 6);
      setRecentItems(recent);
      setLoading(false);
    }
    fetchData();
  }, [location.pathname]);

  if (loading) return <LoadingState />;

  const mainCards = [
    { label: 'Courses', value: stats.courses, icon: FiBookOpen, link: '/admin/courses', subtitle: 'Course library', iconTone: 'violet' },
    { label: 'Blog Posts', value: stats.blogPosts, icon: FiFileText, link: '/admin/blog', subtitle: 'Articles & updates', iconTone: 'amber' },
    { label: 'Nav Items', value: stats.navItems, icon: FiMenu, link: '/admin/nav-menu', subtitle: 'Menus & links', iconTone: 'cyan' },
    { label: 'Alumni', value: stats.companies, icon: FiUsers, link: '/admin/alumni', subtitle: 'Partner companies', iconTone: 'rose' },
    { label: 'Tags', value: stats.tags, icon: FiTag, link: '/admin/tags', subtitle: 'Course categories', iconTone: 'orange' },
  ];

  const submissionCards = [
    { label: 'Career Submissions', value: pending.career, icon: FiInbox, link: '/admin/career-submissions', subtitle: 'Submissions', iconTone: 'blue' },
    { label: 'Brochure Downloads', value: pending.brochure, icon: FiInbox, link: '/admin/brochure-downloads', subtitle: 'Downloads', iconTone: 'teal' },
    { label: 'Form Submissions', value: pending.form, icon: FiInbox, link: '/admin/form-submissions', subtitle: 'Submissions', iconTone: 'purple' },
    { label: 'Contact Submissions', value: pending.contact, icon: FiInbox, link: '/admin/contact-submissions', subtitle: 'Submissions', iconTone: 'pink' },
    { label: 'Chat Submissions', value: pending.chat, icon: FiMessageCircle, link: '/admin/chat-submissions', subtitle: 'Submissions', iconTone: 'indigo' },
  ];

  return (
    <PageShell hideBorder>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {mainCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      <h2 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Form Responses</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {submissionCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h2 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((action, i) => <ActionTile key={i} {...action} />)}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-3">Recent Activity</h2>
          <Card>
            {recentItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-400">No recent activity.</div>
            ) : (
              <div className="-mx-5 -mb-5">
                {recentItems.map((item) => {
                  const isCourse = item._type === 'course';
                  return (
                    <div key={`${item._type}-${item.id}`} className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-200">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCourse ? 'bg-emerald-600' : 'bg-orange-600'}`}>
                          {isCourse ? <FiBookOpen className="w-3.5 h-3.5 text-white" /> : <FiFileText className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="flex-1 text-[0.95rem] text-neutral-500 truncate">{item.title}</span>
                      <span className="text-xs text-neutral-400 shrink-0">{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
