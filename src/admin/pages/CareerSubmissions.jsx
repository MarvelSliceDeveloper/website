import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { FiArrowLeft } from 'react-icons/fi';

const columns = [
  { header: 'Name', accessor: 'full_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
  { header: 'Position', accessor: 'position', className: 'min-w-[140px]' },
  { header: 'Category', accessor: 'category', className: 'min-w-[100px]' },
];

const detailFields = [
  { label: 'Full Name', accessor: 'full_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  { label: 'Position', accessor: 'position' },
  { label: 'Category', accessor: 'category' },
  { label: 'Description', accessor: 'description' },
  {
    label: 'Resume',
    value: (row) => row.resume_url ? <a href={row.resume_url} target="_blank" rel="noopener noreferrer" className="text-admin-600 hover:underline">View Resume</a> : 'N/A',
  },
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
