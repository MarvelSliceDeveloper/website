import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';

const columns = [
  { header: 'Course', accessor: 'course_title', className: 'min-w-[200px]', cell: (row) => <span className="font-semibold text-neutral-900">{row.course_title || 'General'}</span> },
  { header: 'Name', accessor: 'full_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[200px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
  { header: 'Launch Date', accessor: 'launch_date', className: 'min-w-[140px]', cell: (row) => row.launch_date ? new Date(row.launch_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—' },
];

const detailFields = [
  { label: 'Course', accessor: 'course_title' },
  { label: 'Full Name', accessor: 'full_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  { label: 'Launch Date', value: (row) => row.launch_date ? new Date(row.launch_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
];

export default function CourseInterests() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="course_interests"
        title="Course Interests"
        columns={columns}
        detailFields={detailFields}
        exportFilename="course-interests"
      />
    </PageShell>
  );
}
