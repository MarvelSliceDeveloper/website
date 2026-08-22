import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';

const columns = [
  {
    header: 'Submitted At',
    accessor: 'created_at',
    className: 'min-w-[160px]',
    cell: (row) => (
      <span className="text-xs text-neutral-600 font-medium">
        {row.created_at
          ? new Date(row.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : '—'}
      </span>
    ),
  },
  {
    header: 'Upcoming Course',
    accessor: 'course_title',
    className: 'min-w-[200px]',
    cell: (row) => <span className="font-bold text-neutral-900">{row.course_title || 'Upcoming Course'}</span>,
  },
  {
    header: 'Expected Launch Date',
    accessor: 'launch_date',
    className: 'min-w-[160px]',
    cell: (row) => (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
        {row.launch_date
          ? new Date(row.launch_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Coming Soon'}
      </span>
    ),
  },
  { header: 'Full Name', accessor: 'full_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
];

const detailFields = [
  { label: 'Upcoming Course Title', accessor: 'course_title' },
  {
    label: 'Expected Launch Date',
    value: (row) =>
      row.launch_date
        ? new Date(row.launch_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Coming Soon',
  },
  { label: 'Full Name', accessor: 'full_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  {
    label: 'Registration Date & Time',
    value: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : '—',
  },
];

export default function UpcomingCourseInterests() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="upcoming_course_interests"
        title="Upcoming Course Interests (Coming Soon Notifications)"
        columns={columns}
        detailFields={detailFields}
        exportFilename="upcoming-course-interests"
      />
    </PageShell>
  );
}
