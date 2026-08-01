import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { FiArrowLeft } from 'react-icons/fi';

const columns = [
  { header: 'Name', accessor: 'name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
];

const detailFields = [
  { label: 'Full Name', accessor: 'name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
];

export default function BrochureDownloads() {
return (
    <PageShell backTo="/admin" title="Brochure Downloads"
    >
      <SubmissionsInbox
        table="brochure_downloads"
        title="Brochure Downloads"
        columns={columns}
        detailFields={detailFields}
        exportFilename="brochure-downloads"
      />
    </PageShell>
  );
}
