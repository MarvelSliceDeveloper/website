import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { FiArrowLeft } from 'react-icons/fi';

const columns = [
  { header: 'Name', accessor: 'user_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'user_email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'user_phone', className: 'min-w-[120px]' },
  { header: 'Reason', accessor: 'reason', className: 'min-w-[140px]' },
  { header: 'Status', accessor: 'status', className: 'min-w-[100px]' },
  { header: 'Date', accessor: 'created_at', className: 'min-w-[140px]' },
];

const detailFields = [
  { label: 'Name', accessor: 'user_name' },
  { label: 'Email', accessor: 'user_email' },
  { label: 'Phone', accessor: 'user_phone' },
  { label: 'Reason', accessor: 'reason' },
  { label: 'Status', accessor: 'status' },
  { label: 'Date', accessor: 'created_at' },
  { label: 'Closed', accessor: 'closed_at' },
];

export default function ChatSubmissions() {
return (
    <PageShell backTo="/admin"
    >
      <SubmissionsInbox
        table="conversations"
        title="Chat Submissions"
        columns={columns}
        detailFields={detailFields}
        exportFilename="chat-submissions"
        disableReply
      />
    </PageShell>
  );
}
