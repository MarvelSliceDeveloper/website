import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';

const columns = [
  { header: 'Course', accessor: 'course_name', className: 'min-w-[180px]', cell: (row) => <span className="font-semibold text-neutral-900">{row.course_name || 'General'}</span> },
  { header: 'Name', accessor: 'full_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
];

const detailFields = [
  { label: 'Course', accessor: 'course_name' },
  { label: 'Full Name', accessor: 'full_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
];

export default function UpcomingClassSubmissions() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="upcoming_class_registrations"
        title="Upcoming Class Registrations"
        columns={columns}
        detailFields={detailFields}
        exportFilename="upcoming-class-registrations"
      />
    </PageShell>
  );
}
