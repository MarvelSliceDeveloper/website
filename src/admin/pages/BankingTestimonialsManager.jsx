import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/EmptyState';
import { FiStar, FiEdit3, FiTrash2, FiAward, FiPlusCircle } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import useConfirm from '../hooks/useConfirm';

function Stars({ rating }) {
  const count = Math.min(5, Math.max(0, parseInt(rating, 10) || 0));
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FiStar key={i} className={`w-3.5 h-3.5 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
      ))}
    </span>
  );
}

export default function BankingTestimonialsManager() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('banking_testimonials')
      .select('*')
      .order('is_active', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error && error.code === '42P01') {
      setItems([]);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }

  async function toggleActive(row) {
    if (!row?.id) return;
    await supabase.from('banking_testimonials').update({ is_active: !row.is_active }).eq('id', row.id);
    loadData();
  }

  async function deleteItem(id) {
    if (!id) return;
    if (!(await confirm('Delete this banking testimonial? This action cannot be undone.'))) return;
    await supabase.from('banking_testimonials').delete().eq('id', id);
    loadData();
  }

  const columns = [
    { header: 'SL NO', accessor: 'slno', cell: (_, i) => <span className="text-neutral-500 font-medium">{i + 1}</span>, width: '70px' },
    {
      header: 'Candidate',
      accessor: 'name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.avatar_url ? (
            <img src={row.avatar_url} alt={row.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold text-xs">
              {(row.name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-dark-navy text-sm">{row.name}</p>
            {row.exam_name && (
              <span className="text-[11px] font-bold text-brand-orange bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 inline-block mt-0.5">
                {row.exam_name}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Role / Designation',
      accessor: 'role',
      cell: (row) => row.role || <span className="text-neutral-400 italic">—</span>
    },
    {
      header: 'Achievement Badge',
      accessor: 'badge_text',
      cell: (row) => row.badge_text ? (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-brand-blue border border-blue-200">
          {row.badge_text}
        </span>
      ) : <span className="text-neutral-400 italic">—</span>
    },
    { header: 'Rating', accessor: 'rating', cell: (row) => <Stars rating={row.rating} /> },
    { header: 'Quote / Feedback', accessor: 'quote', cell: (row) => <span className="text-neutral-600 line-clamp-2 max-w-[280px] text-xs">{row.quote}</span> },
    {
      header: 'Status',
      accessor: 'is_active',
      cell: (row) => (
        <button
          type="button"
          onClick={() => toggleActive(row)}
          title={row.is_active ? 'Click to make inactive' : 'Click to make active'}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-admin-500/30 ${row.is_active ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${row.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => navigate(`/admin/banking-testimonials/${row.id}`)}
            className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-colors cursor-pointer"
            title="Edit"
          >
            <FiEdit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteItem(row.id)}
            className="p-1.5 text-red-500 hover:text-white hover:bg-red-600 rounded transition-colors cursor-pointer"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <PageShell
      backTo="/admin"
      title="Banking Testimonials"
      description="Manage testimonials displayed on the Banking Career page testimonial section. Active testimonials appear above the FAQ section on the Banking page."
      action={
        <button
          type="button"
          onClick={() => navigate('/admin/banking-testimonials/new')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-orange text-white text-sm font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
        >
          <FiPlusCircle className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      }
    >
      <div className="bg-white shadow-sm border border-admin-200 rounded-xl overflow-hidden">
        {items.length > 0 ? (
          <DataTable data={items} columns={columns} isLoading={loading} />
        ) : (
          <EmptyState
            icon={FiAward}
            title="No banking testimonials found"
            description="Add your first banking candidate testimonial to feature success stories on the Banking page."
            actionLabel="Add Banking Testimonial"
            onAction={() => navigate('/admin/banking-testimonials/new')}
          />
        )}
      </div>
      {confirmDialog}
    </PageShell>
  );
}
