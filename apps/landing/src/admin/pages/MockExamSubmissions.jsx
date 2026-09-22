import SubmissionsInbox from '../components/ui/SubmissionsInbox';
import PageShell from '../components/ui/PageShell';
import { FiUser } from 'react-icons/fi';

const columns = [
  {
    header: 'Photo',
    accessor: 'candidate_photo',
    className: 'w-12 min-w-[50px]',
    cell: (row) => (
      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
        {row.candidate_photo ? (
          <img src={row.candidate_photo} alt={row.user_name || 'Candidate'} className="w-full h-full object-cover" />
        ) : (
          <FiUser className="w-4 h-4 text-slate-400" />
        )}
      </div>
    ),
    exportValue: (row) => row.candidate_photo ? '[Photo Attached]' : 'No Photo'
  },
  { header: 'Candidate Name', accessor: 'user_name', className: 'min-w-[140px] font-semibold text-slate-900' },
  { header: 'Email', accessor: 'user_email', className: 'min-w-[170px]' },
  { header: 'Phone', accessor: 'user_phone', className: 'min-w-[120px]' },
  { header: 'Department', accessor: (row) => row.user_department || 'Computer Science', className: 'min-w-[140px]' },
  { header: 'Year', accessor: (row) => row.user_year || '3rd Year', className: 'min-w-[90px]' },
  { header: 'College', accessor: (row) => row.user_college || 'Marvel Tech', className: 'min-w-[150px]' },
  {
    header: 'Score',
    accessor: (row) => `${row.score || 0} / ${row.total_questions || 0}`,
    className: 'min-w-[90px] font-bold text-emerald-600'
  },
  {
    header: 'Percentage',
    accessor: (row) => {
      const total = row.total_questions || 1;
      const pct = Math.round(((row.score || 0) / total) * 100);
      return `${pct}%`;
    },
    className: 'min-w-[90px] font-semibold text-brand-blue'
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
  }
];

const detailFields = [
  { label: 'Candidate Name', accessor: 'user_name' },
  { label: 'Email Address', accessor: 'user_email' },
  { label: 'Phone Number', accessor: 'user_phone' },
  { label: 'Department', accessor: (row) => row.user_department || 'Computer Science & Engineering' },
  { label: 'Year', accessor: (row) => row.user_year || '3rd Year' },
  { label: 'College / Institute', accessor: (row) => row.user_college || 'Marvel Institute of Technology' },
  { label: 'Total Score', accessor: (row) => `${row.score || 0} / ${row.total_questions || 0}` },
  { label: 'Correct Answers', accessor: 'correct_answers' },
  { label: 'Wrong Answers', accessor: 'wrong_answers' },
  {
    label: 'Accuracy Percentage',
    accessor: (row) => {
      const total = row.total_questions || 1;
      const pct = Math.round(((row.score || 0) / total) * 100);
      return `${pct}%`;
    }
  },
  {
    label: 'Time Taken',
    accessor: (row) => {
      const sec = row.time_taken_seconds || 0;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s}s`;
    }
  }
];

export default function MockExamSubmissions() {
  return (
    <PageShell
      title="Banking Mock Exam Candidate Submissions"
      subtitle="Comprehensive report of candidate attempts, photo verification, scores, department info, and test time metrics"
      backTo="/admin/banking/mock-exams"
    >
      <SubmissionsInbox
        table="mock_exam_submissions"
        title="Mock Exam Candidate Results"
        columns={columns}
        detailFields={detailFields}
        exportFilename="mock-exam-candidate-submissions"
        disableReply={true}
      />
    </PageShell>
  );
}
