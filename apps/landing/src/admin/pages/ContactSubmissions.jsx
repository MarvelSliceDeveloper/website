import SubmissionsInbox from "../components/ui/SubmissionsInbox";
import PageShell from "../components/ui/PageShell";
import { FiArrowLeft } from "react-icons/fi";

const columns = [
  { header: "Name", accessor: "full_name", className: "min-w-[140px]" },
  { header: "Email", accessor: "email", className: "min-w-[180px]" },
  { header: "Phone", accessor: "phone", className: "min-w-[120px]" },
];

const detailFields = [
  { label: "Full Name", accessor: "full_name" },
  { label: "Email", accessor: "email" },
  { label: "Phone", accessor: "phone" },
  { label: "Message", accessor: "message" },
];

export default function ContactSubmissions() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="contact_submissions"
        title="Contact Submissions"
        columns={columns}
        detailFields={detailFields}
        exportFilename="contact-submissions"
      />
    </PageShell>
  );
}
