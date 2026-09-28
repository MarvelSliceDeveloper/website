import { useState } from 'react';
import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { FiLink, FiCopy, FiCheck, FiExternalLink } from 'react-icons/fi';

const columns = [
  {
    header: 'Name',
    accessor: 'first_name',
    className: 'min-w-[140px]',
    cell: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim(),
  },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
  { header: 'Reg No', accessor: 'reg_no', className: 'min-w-[100px]' },
  { header: 'College', accessor: 'college_name', className: 'min-w-[160px]' },
  { header: 'Course', accessor: 'course_title', className: 'min-w-[160px]' },
];

const detailFields = [
  { label: 'First Name', accessor: 'first_name' },
  { label: 'Last Name', accessor: 'last_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  { label: 'College Name', accessor: 'college_name' },
  { label: 'College Degree', accessor: 'degree' },
  { label: 'Department', accessor: 'department' },
  { label: 'Roll Number', accessor: 'reg_no' },
  { label: 'Selected Course', accessor: 'course_title' },
  { label: 'Address', accessor: 'address' },
];

const FORM_PATH = '/course-register';

export default function CourseRegister() {
  const [copied, setCopied] = useState(false);
  const formUrl = `${window.location.origin}${FORM_PATH}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(formUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = formUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <PageShell backTo="/admin">
      {/* Public form link banner */}
      <div className="bg-white border border-admin-200 rounded-xl p-4 sm:p-5 mb-5 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue border border-blue-100 flex items-center justify-center shrink-0">
            <FiLink className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-neutral-900">Public registration form link</p>
            <p className="text-xs text-brand-blue truncate font-medium">{formUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={FORM_PATH}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 border border-admin-200 rounded-lg bg-white text-xs font-semibold text-neutral-700 hover:bg-slate-50 transition-all"
          >
            <FiExternalLink className="w-3.5 h-3.5" /> Open Form
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 h-9 px-4 bg-admin-600 hover:bg-admin-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <FiCheck className="w-3.5 h-3.5" /> Copied!
              </>
            ) : (
              <>
                <FiCopy className="w-3.5 h-3.5" /> Copy Link
              </>
            )}
          </button>
        </div>
      </div>

      <SubmissionsInbox
        table="custom_register"
        title="Custom Registrations"
        columns={columns}
        detailFields={detailFields}
        exportFilename="custom-registrations"
      />
    </PageShell>
  );
}
