import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiEdit2, FiTrash2, FiClock, FiCopy, FiCheck,
  FiExternalLink, FiUsers, FiClipboard, FiCheckSquare, FiLock, FiBarChart2
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { formatDateTime } from '../../lib/datetime';
import PageShell from '../components/ui/PageShell';
import DataTable from '../components/ui/DataTable';
import AddButton from '../components/AddButton';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import useConfirm from '../hooks/useConfirm';
import CustomMockExamReportModal from './CustomMockExamReportModal';
import CustomMockExamsOverallReportModal from './CustomMockExamsOverallReportModal';

export default function CustomMockExamsList() {
  const navigate = useNavigate();
  const [confirm, confirmDialog] = useConfirm();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null); // { slug, type: 'reg' | 'login' }
  const [reportExam, setReportExam] = useState(null);
  const [showOverallReport, setShowOverallReport] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_mock_exams')
      .select('*, custom_mock_exam_questions(id)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExams(data);
    } else {
      console.warn('custom_mock_exams table query error or not created yet:', error);
      setExams([
        {
          id: 'demo-custom-1',
          slug: 'ibps-po-special-drill',
          title: 'Special IBPS PO Speed Drill 2026',
          category: 'Banking & Aptitude',
          time_limit_mins: 20,
          total_marks: 100,
          question_count_option: 50,
          registration_start_time: new Date(Date.now() - 3600000).toISOString(),
          exam_start_time: new Date(Date.now() + 1800000).toISOString(),
          is_active: true,
          custom_mock_exam_questions: Array(50).fill({}),
        },
      ]);
    }
    setLoading(false);
  }

  async function toggleExamActive(exam) {
    const newStatus = !exam.is_active;
    setExams((prev) => prev.map((e) => (e.id === exam.id ? { ...e, is_active: newStatus } : e)));

    if (!exam.id.startsWith('demo-')) {
      await supabase.from('custom_mock_exams').update({ is_active: newStatus }).eq('id', exam.id);
    }
  }

  async function handleDeleteExam(id, title) {
    if (!(await confirm(`Delete "${title}"? All questions, registrations and submissions for this exam will be removed.`))) return;
    setExams((prev) => prev.filter((e) => e.id !== id));
    if (!id.startsWith('demo-')) {
      await supabase.from('custom_mock_exams').delete().eq('id', id);
    }
  }

  function handleCopyLink(slug, type) {
    const baseUrl = window.location.origin;
    const path = type === 'reg' ? `/custom-exam/register/${slug}` : `/custom-exam/login/${slug}`;
    navigator.clipboard.writeText(`${baseUrl}${path}`);
    setCopiedId({ slug, type });
    setTimeout(() => setCopiedId(null), 2500);
  }

  const columns = [
    {
      header: 'Exam Title & Slug',
      cell: (exam) => (
        <div className="space-y-1 min-w-[200px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="default">{exam.category || 'Common'}</Badge>
            <Badge variant={exam.exam_mode === 'link_only' ? 'coming_soon' : 'active'}>
              {exam.exam_mode === 'link_only' ? 'Reg Link Only' : 'Exam with MCQs'}
            </Badge>
          </div>
          <Link
            to={`/admin/custom-mock-exams/${exam.id}/edit`}
            className="font-semibold text-neutral-900 hover:text-admin-600 text-sm block transition-colors"
          >
            {exam.title}
          </Link>
          <span className="font-mono text-xs text-neutral-400 block">/{exam.slug}</span>
        </div>
      ),
    },
    {
      header: 'MCQs / Marks',
      cell: (exam) => {
        const countOpt = exam.question_count_option || exam.custom_mock_exam_questions?.length || 25;
        return (
          <div>
            <span className="font-semibold text-neutral-900 block text-sm">{countOpt} MCQs</span>
            <span className="text-xs text-neutral-500 block">{exam.total_marks || 100} Marks</span>
          </div>
        );
      },
    },
    {
      header: 'Duration',
      cell: (exam) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-700 whitespace-nowrap">
          <FiClock className="w-3.5 h-3.5 text-neutral-400" />
          {exam.time_limit_mins || 20} Mins
        </span>
      ),
    },
    {
      header: 'Login Open',
      cell: (exam) => (
        <span className="text-xs text-neutral-700 whitespace-nowrap">
          {exam.registration_start_time ? formatDateTime(exam.registration_start_time) : 'Immediate'}
        </span>
      ),
    },
    {
      header: 'Exam Start',
      cell: (exam) => (
        <span className="text-xs font-medium text-admin-600 whitespace-nowrap">
          {exam.exam_start_time ? formatDateTime(exam.exam_start_time) : 'Immediate'}
        </span>
      ),
    },
    {
      header: 'Login Close',
      cell: (exam) => (
        <span className="text-xs text-neutral-700 whitespace-nowrap">
          {exam.exam_end_time ? formatDateTime(exam.exam_end_time) : 'No Limit'}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (exam) => (
        <button type="button" onClick={() => toggleExamActive(exam)} title="Toggle active">
          <Badge variant={exam.is_active ? 'active' : 'inactive'}>{exam.is_active ? 'Active' : 'Inactive'}</Badge>
        </button>
      ),
    },
    {
      header: 'Shareable Links',
      cell: (exam) => {
        const isRegCopied = copiedId?.slug === exam.slug && copiedId?.type === 'reg';
        const isLoginCopied = copiedId?.slug === exam.slug && copiedId?.type === 'login';
        const btn = 'inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer';
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCopyLink(exam.slug, 'reg')}
                className={`${btn} ${isRegCopied ? 'bg-success-50 text-success-700' : 'bg-admin-100 text-admin-600 hover:bg-admin-200'}`}
              >
                {isRegCopied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                {isRegCopied ? 'Copied' : 'Reg Link'}
              </button>
              <a href={`/custom-exam/register/${exam.slug}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-admin-600" title="Open Reg URL">
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleCopyLink(exam.slug, 'login')}
                className={`${btn} ${isLoginCopied ? 'bg-success-50 text-success-700' : 'bg-admin-100 text-admin-600 hover:bg-admin-200'}`}
              >
                {isLoginCopied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                {isLoginCopied ? 'Copied' : 'Login Link'}
              </button>
              <a href={`/custom-exam/login/${exam.slug}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-admin-600" title="Open Login URL">
                <FiExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Report',
      cell: (exam) => (
        <button
          type="button"
          onClick={() => setReportExam(exam)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-admin-100 text-admin-600 hover:bg-admin-600 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          title="View registration & attendance report with graphs"
        >
          <FiBarChart2 className="w-3.5 h-3.5" />
          Report
        </button>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (exam) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/admin/custom-mock-exams/${exam.id}/edit`)}
            className="p-1.5 text-neutral-500 hover:text-admin-600 hover:bg-admin-100 rounded-lg transition-colors cursor-pointer"
            title="Edit Exam"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <Link
            to={`/admin/custom-mock-exams/registrations?examId=${exam.id}`}
            className="p-1.5 text-neutral-500 hover:text-admin-600 hover:bg-admin-100 rounded-lg transition-colors"
            title="View Candidates"
          >
            <FiUsers className="w-4 h-4" />
          </Link>
          <Link
            to={`/admin/custom-mock-exams/submissions?examId=${exam.id}`}
            className="p-1.5 text-neutral-500 hover:text-admin-600 hover:bg-admin-100 rounded-lg transition-colors"
            title="View Results"
          >
            <FiClipboard className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => handleDeleteExam(exam.id, exam.title)}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Exam"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      title="Custom Mock Exams"
      subtitle="Standalone timed mock exams (25, 50, 75, 100 MCQs) accessible via shareable registration & login links."
      actions={
        <>
          <button
            type="button"
            onClick={() => setShowOverallReport(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-admin-200 bg-white text-neutral-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <FiBarChart2 className="w-4 h-4 text-admin-600" />
            Overall Report
          </button>
          <Link
            to="/admin/custom-mock-exams/registrations"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-admin-200 bg-white text-neutral-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <FiUsers className="w-4 h-4 text-admin-600" />
            Candidates
          </Link>
          <Link
            to="/admin/custom-mock-exams/submissions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold border border-admin-200 bg-white text-neutral-700 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <FiClipboard className="w-4 h-4 text-admin-600" />
            Submissions
          </Link>
          <AddButton to="/admin/custom-mock-exams/new" label="Create Custom Exam" size="md" />
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-admin-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-admin-100 text-admin-600 flex items-center justify-center">
            <FiCheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Total Custom Exams</span>
            <span className="text-lg font-bold text-neutral-900">{exams.length}</span>
          </div>
        </div>
        <div className="bg-white border border-admin-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-success-50 text-success-700 flex items-center justify-center">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Active Links</span>
            <span className="text-lg font-bold text-neutral-900">{exams.filter((e) => e.is_active).length} Active</span>
          </div>
        </div>
        <div className="bg-white border border-admin-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-admin-100 text-admin-600 flex items-center justify-center">
            <FiLock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">Access Model</span>
            <span className="text-xs font-semibold text-neutral-800">Unique Link + Candidate Login</span>
          </div>
        </div>
      </div>

      {exams.length === 0 && !loading ? (
        <div className="border border-admin-200 rounded-xl">
          <EmptyState
            icon={FiCheckSquare}
            title="No custom mock exams yet"
            description="Create your first standalone timed exam and share the registration link."
            action={{ to: '/admin/custom-mock-exams/new', label: 'Create Custom Exam' }}
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={exams}
          isLoading={loading}
          searchPlaceholder="Search title or slug..."
          filterFn={(row, q) =>
            (row.title || '').toLowerCase().includes(q) ||
            (row.slug || '').toLowerCase().includes(q) ||
            (row.category || '').toLowerCase().includes(q)
          }
          emptyTitle="No custom mock exams"
          emptyDescription="Create your first exam to get started."
        />
      )}
      {confirmDialog}
      {reportExam && (
        <CustomMockExamReportModal exam={reportExam} onClose={() => setReportExam(null)} />
      )}
      {showOverallReport && (
        <CustomMockExamsOverallReportModal onClose={() => setShowOverallReport(false)} />
      )}
    </PageShell>
  );
}
