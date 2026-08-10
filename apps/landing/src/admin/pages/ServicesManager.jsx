import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Card from '../components/ui/Card';
import DataTable from '../components/ui/DataTable';
import {
  FiTrash2, FiSearch, FiChevronDown, FiPackage, FiEdit3,
} from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import useConfirm from '../hooks/useConfirm';

const statusColors = {
  published: 'published',
  draft: 'draft',
  archived: 'inactive',
};

export default function ServicesManager() {
const [confirm, confirmDialog] = useConfirm();
  const queryClient = useQueryClient();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [servicesRes, categoriesRes] = await Promise.all([
      supabase.from('services').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
      supabase.from('services').select('category'),
    ]);
    if (!servicesRes.error) setServices(servicesRes.data || []);
    if (!categoriesRes.error) {
      const unique = [...new Set((categoriesRes.data || []).map((s) => s.category).filter(Boolean))].sort();
      setCategories(unique);
    }
    setLoading(false);
  }

  async function togglePublish(id, currentStatus) {
    const next = currentStatus === 'published' ? 'draft' : 'published';
    await supabase.from('services').update({ status: next }).eq('id', id);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: next } : s)));
    queryClient.invalidateQueries({ queryKey: ['services'] });
  }

  async function toggleFeatured(id, current) {
    await supabase.from('services').update({ is_featured: !current }).eq('id', id);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_featured: !current } : s)));
    queryClient.invalidateQueries({ queryKey: ['services'] });
  }

  async function handleDelete(id, title) {
    if (!(await confirm(`Delete "${title}"? This cannot be undone.`))) return;
    await supabase.from('services').delete().eq('id', id);
    setServices((prev) => prev.filter((s) => s.id !== id));
    queryClient.invalidateQueries({ queryKey: ['services'] });
  }

  async function handleDuplicate(service) {
    const { id: _id, created_at: _created_at, updated_at: _updated_at, ...rest } = service;
    const copy = { ...rest, title: `${service.title} (Copy)` };
    const { error } = await supabase.from('services').insert(copy);
    if (!error) {
      loadData();
      queryClient.invalidateQueries({ queryKey: ['services'] });
    }
  }

  const filtered = services.filter((s) => {
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      if (!(s.title || '').toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'All' && s.status !== statusFilter) return false;
    if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
    return true;
  });

  const columns = [
    {
      header: 'Title',
      cell: (row) => (
        <Link to={`/admin/services/${row.id}`} className="text-sm font-medium text-admin-900 hover:text-admin-600 transition-colors">
          {row.title || 'Untitled'}
        </Link>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      className: 'hidden md:table-cell',
      cell: (row) => <span className="text-sm text-neutral-500">{row.category || '-'}</span>,
    },
    {
      header: 'Badge',
      className: 'hidden lg:table-cell',
      cell: (row) => row.badge ? <Badge variant="default">{row.badge}</Badge> : <span className="text-sm text-neutral-400">-</span>,
    },
    {
      header: 'Status',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={row.status === 'published'} onChange={() => togglePublish(row.id, row.status)} className="sr-only peer" disabled={row.status === 'archived'} />
            <div className="w-9 h-5 bg-admin-200 rounded-full peer peer-checked:bg-success-500 peer-focus-visible:ring-2 peer-focus-visible:ring-admin-500 peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
          <Badge variant={statusColors[row.status] || 'default'}>
            {row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Draft'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Featured',
      className: 'hidden sm:table-cell',
      cell: (row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={!!row.is_featured} onChange={() => toggleFeatured(row.id, row.is_featured)} className="sr-only peer" />
          <div className="w-9 h-5 bg-admin-200 rounded-full peer peer-checked:bg-admin-600 peer-focus-visible:ring-2 peer-focus-visible:ring-admin-500 peer-focus-visible:ring-offset-2 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
        </label>
      ),
    },
    {
      header: 'Sort',
      accessor: 'sort_order',
      className: 'hidden lg:table-cell',
    },
    {
      header: 'Created',
      className: 'hidden xl:table-cell',
      cell: (row) => (
        <span className="text-sm text-neutral-400 whitespace-nowrap">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'w-32 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/admin/services/${row.id}`} className="p-1.5 text-blue-500 hover:text-white hover:bg-blue-600 rounded transition-colors" title="Edit">
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
        <div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell backTo="/admin"
      title="Services"
      subtitle={`${services.length} service${services.length !== 1 ? 's' : ''} total`}
    >
      {services.length > 0 && (
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
                  placeholder="Search by title..."
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
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="flex-1">
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
              >
                <option value="All">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              </div>
            </div>
          )}
          </div>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={FiPackage}
            title="No services yet"
            description="Get started by adding your first service."
            action={{ to: '/admin/services/new', label: 'Add your first service' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-admin-200 rounded-lg">
          <EmptyState
            icon={FiSearch}
            title="No services match your filters"
            description="Try adjusting your search or filter criteria."
          />
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} searchable={false} />
      )}
      {confirmDialog}
    </PageShell>
  );
}
