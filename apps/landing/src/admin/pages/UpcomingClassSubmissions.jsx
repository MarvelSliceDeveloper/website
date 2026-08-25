import { useState, useEffect } from 'react';
import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { supabase } from '../../lib/supabaseClient';

const columns = [
  { header: 'Course', accessor: 'course_name', className: 'min-w-[180px]', cell: (row) => <span className="font-semibold text-neutral-900">{row.course_name || 'General'}</span> },
  { header: 'Batch', accessor: 'batch', className: 'min-w-[110px]', cell: (row) => row.batch ? (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">{row.batch}</span>
  ) : <span className="text-neutral-400 italic">—</span> },
  { header: 'Name', accessor: 'full_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
];

const detailFields = [
  { label: 'Course', accessor: 'course_name' },
  { label: 'Batch', accessor: 'batch' },
  { label: 'Full Name', accessor: 'full_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
];

const BATCH_OPTIONS = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'];

export default function UpcomingClassSubmissions() {
  const [classFilter, setClassFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [classOptions, setClassOptions] = useState([]);

  useEffect(() => {
    supabase
      .from('upcoming_classes')
      .select('course_name')
      .order('course_name')
      .then(({ data }) => {
        const seen = new Set();
        const opts = (data || [])
          .map((c) => c.course_name)
          .filter((n) => {
            if (!n || seen.has(n)) return false;
            seen.add(n);
            return true;
          });
        setClassOptions(opts);
      });
  }, []);

  const extraFilters = [
    {
      value: classFilter,
      onChange: setClassFilter,
      options: [{ value: 'all', label: 'All Classes' }, ...classOptions.map((c) => ({ value: c, label: c }))],
      apply: (r) => r.course_name === classFilter,
    },
    {
      value: batchFilter,
      onChange: setBatchFilter,
      options: [{ value: 'all', label: 'All Batches' }, ...BATCH_OPTIONS.map((b) => ({ value: b, label: b }))],
      apply: (r) => r.batch === batchFilter,
    },
  ];

  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="upcoming_class_registrations"
        title="Upcoming Class Registrations"
        columns={columns}
        detailFields={detailFields}
        extraFilters={extraFilters}
        exportFilename="upcoming-class-registrations"
      />
    </PageShell>
  );
}
