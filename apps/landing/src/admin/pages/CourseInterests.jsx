import SubmissionsInbox from "../components/ui/SubmissionsInbox";
import PageShell from "../components/ui/PageShell";

const columns = [
  {
    header: "Date & Time",
    accessor: "created_at",
    className: "min-w-[170px]",
    cell: (row) => (
      <span className="text-xs text-neutral-600 font-medium">
        {row.created_at
          ? new Date(row.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
          : "—"}
      </span>
    ),
  },
  {
    header: "Course",
    accessor: "course_title",
    className: "min-w-[200px]",
    cell: (row) => (
      <span className="font-bold text-neutral-900">
        {row.course_title || "General"}
      </span>
    ),
  },
  {
    header: "Button Clicked",
    accessor: "button_clicked",
    className: "min-w-[160px]",
    cell: (row) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        {row.button_clicked || "Apply Now"}
      </span>
    ),
  },
  { header: "Full Name", accessor: "full_name", className: "min-w-[140px]" },
  { header: "Email", accessor: "email", className: "min-w-[180px]" },
  { header: "Phone", accessor: "phone", className: "min-w-[120px]" },
  {
    header: "T&C",
    accessor: "terms_accepted",
    className: "min-w-[100px]",
    cell: () => (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        ✓ Agreed
      </span>
    ),
  },
];

const detailFields = [
  { label: "Course Title", accessor: "course_title" },
  { label: "Button Clicked / Source", accessor: "button_clicked" },
  { label: "Full Name", accessor: "full_name" },
  { label: "Email", accessor: "email" },
  { label: "Phone", accessor: "phone" },
  {
    label: "Date & Time",
    value: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "—",
  },
  {
    label: "Terms Accepted",
    value: () => "Yes (Agreed to Terms & Privacy Policy)",
  },
];

export default function CourseInterests() {
  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="course_enquiries"
        title="Course Button Enquiries"
        columns={columns}
        detailFields={detailFields}
        exportFilename="course-enquiries"
      />
    </PageShell>
  );
}
