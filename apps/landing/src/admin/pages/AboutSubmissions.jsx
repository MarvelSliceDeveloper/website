import SubmissionsInbox from "../components/ui/SubmissionsInbox";
import PageShell from "../components/ui/PageShell";

const columns = [
  { header: "Name", accessor: "full_name", className: "min-w-[140px]" },
  { header: "Email", accessor: "email", className: "min-w-[180px]" },
  { header: "Subject", accessor: "subject", className: "min-w-[160px]" },
  { header: "Phone", accessor: "phone", className: "min-w-[120px]" },
];

const detailFields = [
  { label: "Full Name", accessor: "full_name" },
  { label: "Email", accessor: "email" },
  { label: "Phone", accessor: "phone" },
  { label: "Subject", accessor: "subject" },
  { label: "Message", accessor: "message" },
];

export default function AboutSubmissions() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="about_submissions"
        title="About Submissions"
        columns={columns}
        detailFields={detailFields}
        exportFilename="about-submissions"
      />
    </PageShell>
  );
}
