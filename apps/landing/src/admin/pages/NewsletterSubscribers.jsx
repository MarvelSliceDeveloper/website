import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';

const columns = [
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
];

const detailFields = [
  { label: 'Email', accessor: 'email' },
];

export default function NewsletterSubscribers() {
return (
    <PageShell backTo="/admin"
    >
      <SubmissionsInbox
        table="newsletter_subscribers"
        title="Newsletter Subscribers"
        columns={columns}
        detailFields={detailFields}
        exportFilename="newsletter-subscribers"
      />
    </PageShell>
  );
}
