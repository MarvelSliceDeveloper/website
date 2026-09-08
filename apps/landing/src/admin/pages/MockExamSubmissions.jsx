import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';

const columns = [
  { header: 'Candidate Name', accessor: 'user_name', className: 'min-w-[140px]' },
  { header: 'Email', accessor: 'user_email', className: 'min-w-[170px]' },
  { header: 'Phone', accessor: 'user_phone', className: 'min-w-[120px]' },
  {
    header: 'Score',
    accessor: (row) => `${row.score || 0} / ${row.total_questions || 0}`,
    className: 'min-w-[100px] font-bold text-emerald-600'
  },
  {
    header: 'Time Taken',
    accessor: (row) => {
      const sec = row.time_taken_seconds || 0;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`;
    },
    className: 'min-w-[100px]'
  },
];

const detailFields = [
  { label: 'Candidate Name', accessor: 'user_name' },
  { label: 'Email Address', accessor: 'user_email' },
  { label: 'Phone Number', accessor: 'user_phone' },
  { label: 'Score', accessor: (row) => `${row.score || 0} / ${row.total_questions || 0}` },
  { label: 'Correct Answers', accessor: 'correct_answers' },
  { label: 'Wrong Answers', accessor: 'wrong_answers' },
  {
    label: 'Time Taken',
    accessor: (row) => {
      const sec = row.time_taken_seconds || 0;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`;
    }
  },
];

export default function MockExamSubmissions() {
  return (
    <PageShell
      title="Banking Mock Exam Candidate Submissions"
      subtitle="Candidate attempts, scores, contact details, and test time metrics"
      backTo="/admin/banking/mock-exams"
    >
      <SubmissionsInbox
        table="mock_exam_submissions"
        title="Mock Exam Attempts"
        columns={columns}
        detailFields={detailFields}
        exportFilename="mock-exam-candidate-submissions"
      />
    </PageShell>
  );
}
