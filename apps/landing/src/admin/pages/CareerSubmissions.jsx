import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { FiArrowLeft, FiFileText, FiExternalLink } from 'react-icons/fi';

const columns = [
  { header: 'Name', accessor: (row) => row.full_name || row.name || 'N/A', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
  { header: 'Position', accessor: (row) => row.position || row.department || 'N/A', className: 'min-w-[140px]' },
  { header: 'Category', accessor: (row) => row.category || 'N/A', className: 'min-w-[100px]' },
  {
    header: 'Document',
    accessor: (row) => {
      const docUrl = row.file_url || row.resume_url || row.document_url || row.resume || row.file_path;
      if (!docUrl) return <span className="text-slate-400 text-xs italic">No document</span>;
      return (
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-admin-600 hover:text-admin-800 font-semibold text-xs hover:underline"
        >
          <FiFileText className="w-3.5 h-3.5" />
          <span>View Doc</span>
          <FiExternalLink className="w-3 h-3" />
        </a>
      );
    },
    exportValue: (row) => row.file_url || row.resume_url || row.document_url || row.resume || '',
    className: 'min-w-[110px]'
  }
];

const detailFields = [
  { label: 'Full Name', accessor: (row) => row.full_name || row.name || 'N/A' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  { label: 'Position / Department', accessor: (row) => row.position || row.department || 'N/A' },
  { label: 'Category', accessor: (row) => row.category || 'N/A' },
  {
    label: 'Document / Resume',
    value: (row) => {
      const docUrl = row.file_url || row.resume_url || row.document_url || row.resume || row.file_path;
      if (!docUrl) return <span className="text-slate-400 italic text-xs">No document attached</span>;
      return (
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-admin-50 hover:bg-admin-100 text-admin-600 font-semibold text-xs border border-admin-200/80 transition-all hover:shadow-2xs cursor-pointer mt-0.5"
        >
          <FiFileText className="w-4 h-4 text-admin-600 shrink-0" />
          <span>View Document</span>
          <FiExternalLink className="w-3.5 h-3.5 text-admin-500 shrink-0" />
        </a>
      );
    },
  },
  { label: 'Cover Letter / Description', accessor: 'description' },
];

export default function CareerSubmissions() {
const [positionOptions, setPositionOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [positionFilter, setPositionFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      supabase.from('career_submissions').select('position'),
      supabase.from('career_submissions').select('category'),
    ]).then(([posRes, catRes]) => {
      if (!posRes.error) {
        const uniq = [...new Set((posRes.data || []).map(r => r.position).filter(Boolean))].sort();
        setPositionOptions(uniq);
      }
      if (!catRes.error) {
        const uniq = [...new Set((catRes.data || []).map(r => r.category).filter(Boolean))].sort();
        setCategoryOptions(uniq);
      }
    });
  }, []);

  const extraFilters = useMemo(() => [
    {
      label: 'Position',
      value: positionFilter,
      onChange: setPositionFilter,
      options: [{ value: 'all', label: 'All Positions' }, ...positionOptions.map(p => ({ value: p, label: p }))],
      apply: (row) => row.position === positionFilter,
    },
    {
      label: 'Category',
      value: categoryFilter,
      onChange: setCategoryFilter,
      options: [{ value: 'all', label: 'All Categories' }, ...categoryOptions.map(c => ({ value: c, label: c }))],
      apply: (row) => row.category === categoryFilter,
    },
  ], [positionFilter, positionOptions, categoryFilter, categoryOptions]);

  const fetchQuery = useMemo(() => (query) => {
    if (positionFilter !== 'all') query = query.eq('position', positionFilter);
    if (categoryFilter !== 'all') query = query.eq('category', categoryFilter);
    return query;
  }, [positionFilter, categoryFilter]);

  return (
<PageShell backTo="/admin">
    <SubmissionsInbox
        table="career_submissions"
        title="Career Submissions"
        columns={columns}
        detailFields={detailFields}
        exportFilename="career-submissions"
        extraFilters={extraFilters}
        fetchQuery={fetchQuery}
      />
    </PageShell>
  );
}
