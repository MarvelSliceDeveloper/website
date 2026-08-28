import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Card from './Card';
import { LoadingState, EmptyState } from './EmptyState';
import Pagination from '../Pagination';
import {
  FiSearch, FiEye, FiX, FiChevronLeft, FiChevronRight, FiChevronDown, FiRefreshCw,
  FiDownload, FiLoader, FiFileText, FiSend, FiTrash2, FiCheck, FiMail,
} from 'react-icons/fi';
import useConfirm from '../../hooks/useConfirm';
import { CancelButton, SubmitButton } from '../FormButtons';

function ReplyModal({ row, onClose, pageTitle }) {
  const [subject, setSubject] = useState(`Re: ${pageTitle || 'Your Submission'}`);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/admin-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_email: row.email,
          to_name: row.full_name || row.name || row.email,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success && data.error) setError(data.error);
      else setSent(true);
    } catch {
      setError('Failed to send. Check your connection.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose}>
        <div className="bg-white rounded-xl border border-admin-200 shadow-2xl max-w-lg w-full p-8 text-center cursor-pointer" onClick={e => e.stopPropagation()}>
          <div className="w-12 h-12 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-4"><FiCheck className="w-6 h-6 text-success-500" /></div>
          <h3 className="text-lg font-semibold text-black mb-1">Reply sent!</h3>
          <p className="text-sm text-neutral-500 mb-6">Your email has been sent to {row.email}.</p>
          <button onClick={onClose} className="px-5 py-2 rounded-lg bg-admin-600 text-white text-sm font-medium hover:bg-admin-700 transition-all shadow-sm">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm cursor-pointer" onClick={onClose}>
      <div className="bg-white rounded-xl border border-admin-200 shadow-2xl max-w-lg w-full cursor-pointer" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-100">
          <div><h3 className="text-base font-semibold text-black">Reply to {row.full_name || row.name || row.email}</h3><p className="text-xs text-neutral-400 mt-0.5">{row.email}</p></div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"><FiX className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject"
              className="w-full h-10 px-3 rounded-lg border border-admin-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your reply..." rows={6}
              className="w-full px-3 py-2.5 rounded-lg border border-admin-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all resize-none"
            />
          </div>
          {error && <p className="text-xs text-destructive-500 bg-destructive-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-admin-100 bg-white/50">
          <CancelButton onClick={onClose} />
          <SubmitButton onClick={handleSend} saving={sending} savingLabel="Sending..." label="Send" icon={FiSend} disabled={!subject.trim() || !message.trim()} />
        </div>
      </div>
    </div>
  );
}

function ExportDialog({ type, data, columns, exportFilename, onClose }) {
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    let result = data || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === 'today') {
      result = result.filter(r => new Date(r.created_at) >= startOfToday);
    } else if (dateFilter === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(r => new Date(r.created_at) >= start);
    } else if (dateFilter === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(r => new Date(r.created_at) >= start);
    } else if (dateFilter === 'custom' && customStart) {
      const from = new Date(customStart);
      const to = customEnd ? new Date(customEnd + 'T23:59:59') : new Date(from.getFullYear(), from.getMonth(), from.getDate(), 23, 59, 59);
      result = result.filter(r => { const d = new Date(r.created_at); return d >= from && d <= to; });
    }
    return result;
  }, [data, dateFilter, customStart, customEnd]);

  async function handleExport() {
    if (filtered.length === 0) return;
    setLoading(true);
    try {
      if (type === 'csv') {
        const headers = columns.map(c => c.header).join(',');
        const rows = filtered.map(row => columns.map(c => {
          const val = c.exportValue ? c.exportValue(row) : row[c.accessor];
          return `"${String(val || '').replace(/"/g, '""')}"`;
        }).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${exportFilename || 'submissions'}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click(); URL.revokeObjectURL(url);
      } else if (type === 'pdf') {
        await new Promise(r => setTimeout(r, 50));
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
        const pdf = new jsPDF('l', 'mm', 'a4');
        const headers = columns.map(c => c.header);
        const rows = filtered.map(row => columns.map(c => {
          const val = c.exportValue ? c.exportValue(row) : row[c.accessor];
          return String(val || '');
        }));
        autoTable(pdf, {
          head: [headers],
          body: rows,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
          margin: { top: 25 },
        });
        pdf.setFontSize(14);
        pdf.text(exportFilename || 'Submissions', 14, 14);
        pdf.setFontSize(8);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}  |  ${filtered.length} entries`, 14, 20);
        pdf.save(`${exportFilename || 'submissions'}-${new Date().toISOString().slice(0, 10)}.pdf`);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-pointer" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-pointer" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-admin-200 shadow-2xl w-full max-w-md cursor-pointer" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-admin-100">
          <div><h2 className="text-base font-semibold text-black">Export {type.toUpperCase()}</h2><p className="text-xs text-neutral-400 mt-0.5">Choose date range for the report</p></div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all"><FiX className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Date Range</label>
            <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setCustomStart(''); setCustomEnd(''); }}
              className="w-full h-9 px-3 rounded-lg border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {dateFilter === 'custom' && (
            <div className="flex gap-3">
              <div className="flex-1"><label className="block text-xs font-medium text-neutral-600 mb-1">From</label>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-admin-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all" /></div>
              <div className="flex-1"><label className="block text-xs font-medium text-neutral-600 mb-1">To</label>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-admin-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all" /></div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-6 py-4 border-t border-admin-100 bg-white/50">
          <span className="text-xs text-neutral-400">{filtered.length} entries</span>
          <button onClick={handleExport} disabled={loading || filtered.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-admin-600 text-white text-sm font-medium hover:bg-admin-700 transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
            {loading ? 'Exporting...' : `Export ${type.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">{value}</p>
    </div>
  );
}

export default function SubmissionsInbox({ table, title, columns, fetchQuery, detailFields, exportFilename, extraFilters, disableReply }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selected, setSelected] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportModal, setExportModal] = useState(null);
  const [confirm, confirmDialog] = useConfirm();
  const searchRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    let query = supabase.from(table).select('*');
    if (fetchQuery) query = fetchQuery(query);
    query = query.order('created_at', { ascending: false });
    const { data: result, error } = await query;
    if (error) console.error(`SubmissionsInbox error for ${table}:`, error);
    setData(result || []);
    setLoading(false);
  }

  async function refresh() {
    setLoading(true);
    let query = supabase.from(table).select('*');
    if (fetchQuery) query = fetchQuery(query);
    query = query.order('created_at', { ascending: false });
    const { data: result, error } = await query;
    if (error) console.error(`SubmissionsInbox refresh error for ${table}:`, error);
    setData(result || []);
    setLoading(false);
  }

  async function remove(id) {
    if (!(await confirm('Delete this submission?'))) return;
    await supabase.from(table).delete().eq('id', id);
    setData(prev => prev.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  async function markRead(row, e) {
    e?.stopPropagation();
    await supabase.from(table).update({ is_read: true }).eq('id', row.id);
    setData(prev => prev.map(s => s.id === row.id ? { ...s, is_read: true } : s));
  }

  async function markUnread(row, e) {
    e?.stopPropagation();
    await supabase.from(table).update({ is_read: false }).eq('id', row.id);
    setData(prev => prev.map(s => s.id === row.id ? { ...s, is_read: false } : s));
  }

  const filtered = useMemo(() => {
    let result = data;
    if (activeSearch) {
      const q = activeSearch.trim().toLowerCase();
      result = result.filter(row =>
        columns.some(col => String(row[col.accessor] || '').toLowerCase().includes(q))
      );
    }
    if (statusFilter === 'read') result = result.filter(r => r.is_read);
    else if (statusFilter === 'unread') result = result.filter(r => !r.is_read);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === 'today') {
      result = result.filter(r => new Date(r.created_at) >= startOfToday);
    } else if (dateFilter === '7d') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(r => new Date(r.created_at) >= start);
    } else if (dateFilter === '30d') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(r => new Date(r.created_at) >= start);
    } else if (dateFilter === 'custom' && customStart) {
      const from = new Date(customStart);
      const to = customEnd ? new Date(customEnd + 'T23:59:59') : new Date(from.getFullYear(), from.getMonth(), from.getDate(), 23, 59, 59);
      result = result.filter(r => { const d = new Date(r.created_at); return d >= from && d <= to; });
    }
    if (extraFilters) {
      extraFilters.forEach(f => {
        if (f.apply && f.value !== 'all') result = result.filter(r => f.apply(r));
      });
    }
    return result;
  }, [data, activeSearch, dateFilter, customStart, customEnd, statusFilter, columns, extraFilters]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  const unreadCount = data.filter(r => !r.is_read).length;

  function clearFilters() {
    setSearch(''); setActiveSearch(''); setDateFilter('all'); setCustomStart(''); setCustomEnd('');
    setStatusFilter('all'); setPage(1);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const hasFilters = activeSearch || dateFilter !== 'all' || customStart || statusFilter !== 'all';

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-black">
            {title} <span className="text-neutral-400 font-medium text-sm">({data.length} total{unreadCount > 0 ? ` · ${unreadCount} unread` : ''})</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setExportModal('csv')} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-admin-200 text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-white transition-all disabled:opacity-40 bg-white shadow-sm"
          >
            <FiFileText className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => setExportModal('pdf')} disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-admin-200 text-xs font-medium text-neutral-600 hover:text-neutral-800 hover:bg-white transition-all disabled:opacity-40 bg-white shadow-sm"
          >
            <FiDownload className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-admin-600 text-white text-xs font-medium hover:bg-admin-700 transition-all disabled:opacity-60 shadow-sm"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>


        <div className="bg-white border border-admin-200 p-5 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-end">
          <div className="w-full">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
                <input ref={searchRef} type="text" value={search} onChange={e => { setSearch(e.target.value); }}
                  onKeyDown={(e) => e.key === 'Enter' && (setActiveSearch(search), setPage(1))}
                  placeholder={`Search ${title.toLowerCase()}...`}
                  className="w-full h-9 pl-9 pr-3 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
                />
              </div>
              <button onClick={() => { setActiveSearch(search); setPage(1); }} className="h-9 px-4 bg-admin-600 text-white text-sm font-medium rounded-lg hover:bg-admin-700 transition-colors shrink-0">
                Search
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 w-full">
          {!disableReply && <div className="flex-1">
            <div className="relative">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all w-full"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>}

          {extraFilters && extraFilters.map((f, i) => f.options && (
            <div key={i} className="flex-1 min-w-[140px]">
              <div className="relative">
                <select value={f.value} onChange={e => { f.onChange?.(e.target.value); setPage(1); }}
                  className="h-9 px-3 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all w-full"
                >
                  {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          ))}

          <div className="flex-1 min-w-[140px]">
            <div className="relative">
              <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }}
                className="h-9 px-3 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all w-full"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
          </div>

          {dateFilter === 'custom' && (
            <>
              <div className="flex-1 min-w-[120px]">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="h-9 px-3 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
                />
              </div>
              <div className="flex-1 min-w-[120px]">
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="h-9 px-3 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 focus:border-neutral-500 transition-all"
                />
              </div>
            </>
          )}

          {hasFilters && (
            <button onClick={clearFilters} className="h-9 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors">
              Clear filters
            </button>
          )}
          </div>
          </div>
        </div>

      <div className="grid xl:grid-cols-3 gap-4 items-start w-full max-w-full min-w-0">
        <div className={`w-full max-w-full min-w-0 ${selected ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          <div className="bg-white border border-admin-200 shadow-sm overflow-hidden rounded-xl w-full max-w-full min-w-0">
            {paged.length === 0 ? (
              <EmptyState title={search ? 'No results match your search' : 'No submissions yet'} description={search ? 'Try adjusting your search or filters.' : 'Submissions will appear here once received.'} />
            ) : (
              <div className="admin-table-scroll w-full max-w-full min-w-0 overflow-x-auto">
                <table className="admin-table min-w-[760px] w-full">
                  <thead>
                    <tr className="border-b border-admin-100 bg-brand-blue">
                      <th className="w-10 text-left text-xs font-bold text-white uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">#</th>
                      {columns.map((col, i) => (
                        <th key={i} className={`text-left text-xs font-bold text-white uppercase tracking-wider px-4 py-3.5 whitespace-nowrap ${col.className || ''}`}>
                          {col.header}
                        </th>
                      ))}
                      <th className="text-left text-xs font-bold text-white uppercase tracking-wider px-4 py-3.5 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((row, idx) => (
                      <tr key={row.id}
                        onClick={() => { setSelected(selected?.id === row.id ? null : row); if (!row.is_read) markRead(row); }}
                        className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'} ${selected?.id === row.id ? 'bg-indigo-50/70' : 'hover:bg-gray-50'} ${!disableReply && !row.is_read ? 'border-l-2 border-l-warning-500 bg-warning-50/30' : ''}`}
                      >
                        <td className="px-4 py-3.5 text-xs text-neutral-400 font-mono whitespace-nowrap text-left">{(page - 1) * pageSize + idx + 1}</td>
                        {columns.map((col, i) => (
                          <td key={i} className={`px-4 py-3.5 text-sm align-middle ${col.className || ''}`}>
                            <div className={!disableReply && !row.is_read ? 'font-semibold text-neutral-900' : 'text-neutral-700'}>
                              {col.cell ? col.cell(row) : row[col.accessor]}
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3.5 whitespace-nowrap text-left align-middle">
                          <div className="flex items-center gap-1">
                            {!disableReply && <button onClick={e => { e.stopPropagation(); row.is_read ? markUnread(row, e) : markRead(row, e); }}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${row.is_read ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}
                              title={row.is_read ? 'Mark as unread' : 'Mark as read'}
                            >
                              {row.is_read ? <><FiCheck className="w-3 h-3" /><span className="hidden md:inline">Read</span></> : <><FiMail className="w-3 h-3" /><span className="hidden md:inline">Unread</span></>}
                            </button>}
                            {!disableReply && <button onClick={e => { e.stopPropagation(); setReplyTo(row); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-100 transition-all border border-gray-200"
                              title="Reply"
                            >
                              <FiSend className="w-3 h-3" /><span className="hidden md:inline">Reply</span>
                            </button>}
                            <button onClick={e => { e.stopPropagation(); setSelected(selected?.id === row.id ? null : row); }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                              title="View details"
                            >
                              <FiEye className="w-3.5 h-3.5 text-blue-500" /><span className="hidden md:inline">View</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-4 py-3 border-t border-admin-100 bg-white w-full max-w-full min-w-0">
              <Pagination
                totalItems={filtered.length}
                itemsPerPage={pageSize}
                currentPage={page}
                onPageChange={setPage}
                onItemsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {selected && (
          <div className="bg-white rounded-xl border border-admin-200 shadow-lg overflow-hidden sticky top-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-admin-100">
              <h3 className="text-sm font-semibold text-black">Details</h3>
              <button onClick={() => setSelected(null)} className="p-1 text-destructive-500 hover:text-destructive-700 rounded-md hover:bg-destructive-50 transition-all">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {detailFields.map((field, i) => (
                <DetailRow key={i} label={field.label} value={field.value ? field.value(selected) : selected[field.accessor]} />
              ))}
              <DetailRow label="Submitted" value={formatDate(selected.created_at)} />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-admin-100 bg-white/50">
              <div className="flex flex-wrap items-center gap-2">
                {!disableReply && <button onClick={() => selected.is_read ? markUnread(selected) : markRead(selected)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected.is_read ? 'bg-success-50 text-success-700' : 'bg-neutral-100 text-neutral-500'}`}
                >
                  {selected.is_read ? <><FiCheck className="w-3.5 h-3.5" /> Read</> : <><FiMail className="w-3.5 h-3.5" /> Unread</>}
                </button>}
                {!disableReply && <button onClick={() => selected.is_read ? markUnread(selected) : markRead(selected)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!selected.is_read ? 'bg-success-50 text-success-700 hover:bg-success-50' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {selected.is_read ? <><FiMail className="w-3.5 h-3.5" /> Mark as Unread</> : <><FiCheck className="w-3.5 h-3.5" /> Mark as Read</>}
                </button>}
                {!disableReply && <button onClick={() => setReplyTo(selected)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-neutral-700 hover:bg-neutral-100 transition-all"
                >
                  <FiSend className="w-3.5 h-3.5" /> Reply
                </button>}
              </div>
              <button onClick={() => remove(selected.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive-500 hover:bg-destructive-50 transition-all"
              >
                <FiTrash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {replyTo && <ReplyModal row={replyTo} pageTitle={title} onClose={() => setReplyTo(null)} />}
      {exportModal && <ExportDialog type={exportModal} data={filtered} columns={columns} exportFilename={exportFilename} onClose={() => setExportModal(null)} />}
      {confirmDialog}
    </div>
  );
}
