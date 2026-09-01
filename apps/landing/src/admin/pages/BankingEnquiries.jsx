import { useState } from 'react';
import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';

const columns = [
  {
    header: 'Date & Time',
    accessor: 'created_at',
    className: 'min-w-[170px]',
    cell: (row) => (
      <span className="text-xs text-neutral-600 font-medium">
        {row.created_at
          ? new Date(row.created_at).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : '—'}
      </span>
    ),
  },
  {
    header: 'Enquiry Type',
    accessor: 'enquiry_type',
    className: 'min-w-[140px]',
    cell: (row) => {
      const isTopic = row.enquiry_type === 'topic';
      return (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isTopic
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}
        >
          {isTopic ? 'Topic-Specific' : 'General CTA'}
        </span>
      );
    },
  },
  {
    header: 'Banking Exam / Topic',
    accessor: 'topic_title',
    className: 'min-w-[200px]',
    cell: (row) => (
      <span className="font-bold text-neutral-900">
        {row.topic_title || 'General Banking Enrollment'}
      </span>
    ),
  },
  { header: 'Full Name', accessor: 'full_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'email', className: 'min-w-[180px]' },
  { header: 'Phone', accessor: 'phone', className: 'min-w-[120px]' },
  {
    header: 'Button Action',
    accessor: 'button_clicked',
    className: 'min-w-[170px]',
    cell: (row) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {row.button_clicked || 'Enroll Now'}
      </span>
    ),
  },
];

const detailFields = [
  { label: 'Enrollment Type', value: (row) => (row.enquiry_type === 'topic' ? 'Topic-Specific Enrollment' : 'General CTA Enrollment') },
  { label: 'Exam / Topic Title', accessor: 'topic_title' },
  { label: 'Button Clicked', accessor: 'button_clicked' },
  { label: 'Full Name', accessor: 'full_name' },
  { label: 'Email', accessor: 'email' },
  { label: 'Phone', accessor: 'phone' },
  {
    label: 'Date & Time',
    value: (row) =>
      row.created_at
        ? new Date(row.created_at).toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })
        : '—',
  },
  { label: 'Terms Accepted', value: () => 'Yes (Agreed to Terms & Privacy Policy)' },
];

export default function BankingEnquiries() {
  const [typeFilter, setTypeFilter] = useState('all');

  const extraFilters = [
    {
      value: typeFilter,
      onChange: setTypeFilter,
      options: [
        { label: 'All Enrollment Types', value: 'all' },
        { label: 'General CTA Enrollments', value: 'general' },
        { label: 'Topic-Specific Enrollments', value: 'topic' },
      ],
      apply: (row) => {
        if (typeFilter === 'all') return true;
        if (typeFilter === 'general') return row.enquiry_type === 'general' || !row.enquiry_type;
        if (typeFilter === 'topic') return row.enquiry_type === 'topic';
        return true;
      },
    },
  ];

  return (
    <PageShell backTo="/admin">
      <SubmissionsInbox
        table="banking_enquiries"
        title="Banking Enrollments"
        columns={columns}
        detailFields={detailFields}
        exportFilename="banking-enrollments"
        extraFilters={extraFilters}
      />
    </PageShell>
  );
}
