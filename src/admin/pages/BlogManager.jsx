import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import { FiFileText, FiCalendar, FiSearch, FiEdit3, FiTrash2, FiChevronDown, FiArrowLeft } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import useConfirm from '../hooks/useConfirm';

export default function BlogManager() {
const [confirm, confirmDialog] = useConfirm();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('*, blog_categories(name)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setPosts(data || []);
        setLoading(false);
      });
  }, []);

  async function togglePublish(id, current) {
    const payload = current
      ? { is_published: false }
      : { is_published: true, published_at: current ? undefined : new Date().toISOString() };
    await supabase.from('blog_posts').update(payload).eq('id', id);
    setPosts(posts.map((p) => (p.id === id ? { ...p, ...payload } : p)));
  }

  async function handleDelete(id, title) {
    if (!(await confirm(`Delete "${title}"?`))) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    setPosts(posts.filter((p) => p.id !== id));
  }

  const filteredPosts = posts.filter(post => {
    // 1. Search
    if (activeSearch) {
      const query = activeSearch.toLowerCase();
      if (!post.title.toLowerCase().includes(query)) return false;
    }
    // 2. Status Filter
    if (statusFilter !== 'All') {
      const isPub = statusFilter === 'Published';
      if (post.is_published !== isPub) return false;
    }
    // 3. Date Filter
    if (dateFilter !== 'All') {
      const postDate = new Date(post.created_at);
      const today = new Date();
      if (dateFilter === 'Today') {
        if (postDate.toDateString() !== today.toDateString()) return false;
      } else if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        if (postDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'This Month') {
        if (postDate.getMonth() !== today.getMonth() || postDate.getFullYear() !== today.getFullYear()) return false;
      }
    }
    return true;
  });

  const columns = [
    { header: 'SL NO', accessor: 'slno', cell: (_, i) => <span className="text-neutral-500 font-medium">{i + 1}</span> },
    { 
      header: 'Title', 
      accessor: 'title', 
      cell: (row) => (
        <Link to={`/admin/blog/${row.id}`} className="font-semibold text-neutral-900 hover:text-neutral-700 transition-colors">
          {row.title}
        </Link>
      )
    },
    { 
      header: 'Category', 
      accessor: 'blog_categories', 
      cell: (row) => row.blog_categories ? <span className="px-2 py-0.5 bg-neutral-100 text-neutral-700 rounded-full text-xs">{row.blog_categories.name}</span> : <span className="text-neutral-400 italic">None</span>
    },
    { 
      header: 'Date', 
      accessor: 'published_at', 
      cell: (row) => <span className="text-neutral-600">{row.published_at ? new Date(row.published_at).toLocaleDateString() : '—'}</span>
    },
    {
      header: 'Status',
      accessor: 'is_published',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={row.is_published} onChange={() => togglePublish(row.id, row.is_published)} className="sr-only peer" />
            <div className="w-9 h-5 bg-admin-200 rounded-full peer-checked:bg-admin-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
          </label>
          <Badge variant={row.is_published ? 'published' : 'draft'}>{row.is_published ? 'Published' : 'Draft'}</Badge>
        </div>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/blog/${row.id}`} className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
            <FiEdit3 className="w-4 h-4" />
          </Link>
          <button onClick={() => handleDelete(row.id, row.title)} className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors" title="Delete">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-admin-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell backTo="/admin"
      title="Blog Posts"
      titleLight={`(${posts.length} Post${posts.length !== 1 ? 's' : ''})`}
    >
      {posts.length > 0 && (
        <div className="bg-white border border-admin-200 p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
            <div className="w-full">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveSearch(search)}
                  placeholder="Search posts..."
                  className="w-full pl-9 pr-3 h-9 border border-admin-200 text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all bg-white"
                />
              </div>
              <button onClick={() => setActiveSearch(search)} className="h-9 px-4 bg-admin-600 text-white text-sm font-medium rounded-lg hover:bg-admin-700 transition-colors shrink-0">
                Search
              </button>
            </div>
          </div>
          <div className="flex items-end gap-3 w-full">
          <div className="flex-1">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
              >
                <option value="All">All Status</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
          </div>
          </div>
          </div>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        posts.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No blog posts yet"
            description="Get started by creating your first blog post."
            action={{ to: '/admin/blog/new', label: 'Create your first post' }}
          />
        ) : (
          <EmptyState
            icon={FiFileText}
            title="No results found"
            description={`No posts match "${search}". Try a different search term.`}
          />
        )
      ) : (
        <DataTable columns={columns} data={filteredPosts} searchable={false} />
      )}
      {confirmDialog}
    </PageShell>
  );
}
