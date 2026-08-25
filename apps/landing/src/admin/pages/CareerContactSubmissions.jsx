import SubmissionsInbox from "../components/ui/SubmissionsInbox";
import PageShell from "../components/ui/PageShell";

const columns = [
  { header: "Name", accessor: "full_name", className: "min-w-[140px]" },
  { header: "Email", accessor: "email", className: "min-w-[180px]" },
  { header: "Phone", accessor: "phone", className: "min-w-[120px]" },
];

const detailFields = [
  { label: "Full Name", accessor: "full_name" },
  { label: "Email", accessor: "email" },
  { label: "Phone", accessor: "phone" },
];

export default function CareerContactSubmissions() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="career_contact_submissions"
        title="Career Enquiry Submissions"
        columns={columns}
        detailFields={detailFields}
        exportFilename="career-contact-submissions"
      />
    </PageShell>
  );
}
