import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiClipboard, FiDownload, FiFileText, FiUser, FiCheckCircle,
  FiMessageSquare, FiX, FiEye,
  FiRotateCcw, FiMonitor
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import PageShell from '../components/ui/PageShell';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

export default function CustomMockExamSubmissions() {
  const [searchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || 'ALL';

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeFeedbackModal, setActiveFeedbackModal] = useState(null);
  const [activeReviewModal, setActiveReviewModal] = useState(null); // Submissions object for review
  const [activeTabSwitchModal, setActiveTabSwitchModal] = useState(null); // Submission object for tab switch audit
  const [resettingSubId, setResettingSubId] = useState(null);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [loadingReviewQuestions, setLoadingReviewQuestions] = useState(false);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'excel'
  const [exportLevel, setExportLevel] = useState('summary'); // 'summary' | 'detailed'

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedExamId]);

  async function fetchExams() {
    const { data } = await supabase
      .from('custom_mock_exams')
      .select('id, title, slug')
      .order('created_at', { ascending: false });

    if (data) setExams(data);
  }

  async function fetchSubmissions() {
    setLoading(true);
    let query = supabase
      .from('custom_mock_exam_submissions')
      .select('*, custom_mock_exams(id, title, slug)')
      .order('created_at', { ascending: false });

    if (selectedExamId !== 'ALL') {
      query = query.eq('custom_mock_exam_id', selectedExamId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setSubmissions(data);
    } else {
      console.warn('custom_mock_exam_submissions query error:', error);
      // Demo submissions
      setSubmissions([
        {
          id: 'sub-demo-1',
          user_name: 'Lethin Kumar',
          user_email: 'lethin@example.com',
          user_phone: '+91 98765 43210',
          user_dob: '2003-08-15',
          user_department: 'Computer Science & Engineering',
          user_degree: 'B.E (Computer Science & Engineering)',
          user_address: '123 Tech Park Avenue, Chennai, Tamil Nadu',
          user_10th_mark: 89.5,
          user_12th_mark: 92.0,
          user_cgpa: 8.75,
          user_year: '3rd Year',
          user_college: 'Marvel Institute of Technology',
          score: 42,
          total_questions: 50,
          correct_answers: 42,
          wrong_answers: 8,
          time_taken_seconds: 945,
          category_scores: {
            'Quantitative Aptitude': { correct: 18, wrong: 2, total: 20, score: 17.5 },
            'Logical Reasoning': { correct: 14, wrong: 1, total: 15, score: 13.75 },
            'Technical Knowledge': { correct: 10, wrong: 5, total: 15, score: 8.75 }
          },
          answers: { 'q-1': 0, 'q-2': 1, 'q-3': 2 },
          feedback_answers: {
            fb1: '4/5 Stars — Moderate difficulty',
            fb2: 'Great speed test interface!'
          },
          created_at: new Date().toISOString(),
          custom_mock_exams: { id: 'demo-1', title: 'Special IBPS PO Speed Drill 2026', slug: 'ibps-po-special-drill' }
        }
      ]);
    }
    setLoading(false);
  }

  async function openReviewModal(sub) {
    setActiveReviewModal(sub);
    setLoadingReviewQuestions(true);
    setReviewQuestions([]);

    if (sub.custom_mock_exam_id && !sub.custom_mock_exam_id.startsWith('demo-')) {
      const { data } = await supabase
        .from('custom_mock_exam_questions')
        .select('*')
        .eq('custom_mock_exam_id', sub.custom_mock_exam_id)
        .order('order_index', { ascending: true });

      if (data && data.length > 0) {
        setReviewQuestions(data);
      }
    } else {
      // Demo questions fallback
      setReviewQuestions([
        {
          id: 'q-1',
          question_text: 'If A can complete a work in 10 days and B in 15 days, in how many days can both complete it together?',
          options: ['6 days', '8 days', '12 days', '5 days'],
          correct_option: 0,
          explanation: '1/10 + 1/15 = 5/30 = 1/6 work per day. Total = 6 days.',
          category_name: 'Quantitative Aptitude'
        },
        {
          id: 'q-2',
          question_text: 'Which data structure follows First-In-First-Out (FIFO) principle?',
          options: ['Stack', 'Queue', 'Tree', 'Graph'],
          correct_option: 1,
          explanation: 'Queue follows FIFO principles.',
          category_name: 'Technical Knowledge'
        }
      ]);
    }
    setLoadingReviewQuestions(false);
  }

  async function handleResetSubmission(sub) {
    if (!window.confirm(`Are you sure you want to RESET the exam submission for "${sub.user_name}" (${sub.user_email})?\n\nThis will completely delete their attempt data from the database and allow them to log in and RETAKE the exam from scratch.`)) {
      return;
    }

    setResettingSubId(sub.id);

    try {
      if (sub.id && !sub.id.startsWith('sub-demo-')) {
        // Delete submission from custom_mock_exam_submissions
        const { error } = await supabase
          .from('custom_mock_exam_submissions')
          .delete()
          .eq('id', sub.id);

        if (error) {
          console.error('Error resetting submission in DB:', error);
        }

        // Delete tab switch logs from custom_mock_exam_tab_switches
        try {
          await supabase
            .from('custom_mock_exam_tab_switches')
            .delete()
            .eq('submission_id', sub.id);
        } catch (e) {}
      }

      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
      alert(`Submission for "${sub.user_name}" has been reset successfully! The candidate can now log in and retake the test.`);
    } catch (err) {
      console.error('Reset error:', err);
      alert('Failed to reset submission. Please try again.');
    } finally {
      setResettingSubId(null);
    }
  }

  const examFilteredSubmissions = selectedExamId === 'ALL'
    ? submissions
    : submissions.filter((s) => s.custom_mock_exam_id === selectedExamId);

  const columns = [
    {
      header: 'Candidate & Contact',
      cell: (sub) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="w-10 h-10 rounded-full bg-admin-100 border border-admin-200 overflow-hidden shrink-0 flex items-center justify-center">
            {sub.candidate_photo ? (
              <img src={sub.candidate_photo} alt={sub.user_name} className="w-full h-full object-cover" />
            ) : (
              <FiUser className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <div>
            <span className="font-semibold text-neutral-900 block text-sm">{sub.user_name}</span>
            <span className="text-xs text-neutral-500 block font-mono">{sub.user_email}</span>
            <span className="text-xs text-neutral-400 block">{sub.user_phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (sub) => (
        sub.status === 'SUBMITTED'
          ? <Badge variant="active">Completed</Badge>
          : <Badge variant="coming_soon">In Progress</Badge>
      ),
    },
    {
      header: 'Degree & College',
      cell: (sub) => (
        <div className="min-w-[150px]">
          <span className="font-semibold text-neutral-900 block text-sm">{sub.user_degree || sub.user_department}</span>
          <span className="text-xs text-neutral-500 block">{sub.user_college}</span>
          <span className="text-xs text-neutral-400 block">{sub.user_year}</span>
        </div>
      ),
    },
    {
      header: 'Score',
      cell: (sub) => (
        <div className="whitespace-nowrap">
          <span className="font-bold text-green-700 text-sm block">
            {sub.score ?? 0} <span className="text-xs font-normal text-neutral-400">/ {sub.total_questions || 0}</span>
          </span>
          <span className="text-xs text-neutral-500 block">
            {sub.correct_answers || 0} Correct · {sub.wrong_answers || 0} Wrong
          </span>
        </div>
      ),
    },
    {
      header: 'Section Breakdown',
      cell: (sub) => {
        const catScores = sub.category_scores || {};
        if (Object.keys(catScores).length === 0) {
          return <span className="text-xs text-neutral-400 italic">Common Section</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {Object.entries(catScores).map(([cat, st], cIdx) => (
              <Badge key={cIdx} variant="default">{cat}: {st.correct || 0}/{st.total || 0}</Badge>
            ))}
          </div>
        );
      },
    },
    {
      header: 'Tab Switches',
      cell: (sub) => {
        const switchCount = sub.tab_switch_count || sub.tab_switch_logs?.length || 0;
        if (switchCount === 0) return <Badge variant="active">0 Switches</Badge>;
        return (
          <div className="space-y-1">
            <Badge variant="coming_soon">{switchCount} Switches</Badge>
            <button
              type="button"
              onClick={() => setActiveTabSwitchModal(sub)}
              className="text-xs text-admin-600 font-semibold hover:underline block cursor-pointer"
            >
              View Logs
            </button>
          </div>
        );
      },
    },
    {
      header: 'Time Taken',
      cell: (sub) => <span className="font-mono text-xs text-neutral-700 whitespace-nowrap">{formatTime(sub.time_taken_seconds)}</span>,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (sub) => {
        const hasFeedback = sub.feedback_answers && Object.keys(sub.feedback_answers).length > 0;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => openReviewModal(sub)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-admin-600 hover:bg-admin-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm"
            >
              <FiEye className="w-3.5 h-3.5" />
              Review
            </button>
            {hasFeedback && (
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(sub)}
                className="p-1.5 bg-admin-100 hover:bg-admin-200 text-admin-600 rounded-lg transition-colors cursor-pointer"
                title="View Feedback"
              >
                <FiMessageSquare className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleResetSubmission(sub)}
              disabled={resettingSubId === sub.id}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200 cursor-pointer disabled:opacity-50"
              title="Reset submission and permit candidate to retake exam"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  function formatTime(seconds) {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    return `${mins}m ${secs}s`;
  }

  // EXPORT EXCEL / CSV FUNCTION
  function performCSVExport(isDetailed = false) {
    if (examFilteredSubmissions.length === 0) return;

    let headers = [
      'Candidate Name', 'Email', 'Phone', 'DOB', 'Degree', 'Department', 'Year',
      'College', 'Register / Roll No', 'Address', '10th Mark (%)', '12th Mark (%)', 'CGPA', 'Score',
      'Total Questions', 'Correct', 'Wrong', 'Time Taken', 'Exam Title', 'Date'
    ];

    if (isDetailed) {
      headers.push('Category Breakdown', 'Feedback Responses');
    }

    const rows = examFilteredSubmissions.map(s => {
      const catText = s.category_scores
        ? Object.entries(s.category_scores)
            .map(([cat, st]) => `${cat}: ${st.correct || 0}/${st.total || 0} (${st.score || 0}pts)`)
            .join(' | ')
        : 'N/A';

      const fbText = s.feedback_answers
        ? Object.entries(s.feedback_answers)
            .map(([k, v]) => `${k}: ${v}`)
            .join(' | ')
        : 'N/A';

      const baseRow = [
        `"${s.user_name || ''}"`,
        `"${s.user_email || ''}"`,
        `"${s.user_phone || ''}"`,
        `"${s.user_dob || ''}"`,
        `"${s.user_degree || ''}"`,
        `"${s.user_department || ''}"`,
        `"${s.user_year || ''}"`,
        `"${s.user_college || ''}"`,
        `"${s.user_reg_num || ''}"`,
        `"${(s.user_address || '').replace(/"/g, '""')}"`,
        `"${s.user_10th_mark ?? 'N/A'}"`,
        `"${s.user_12th_mark ?? 'N/A'}"`,
        `"${s.user_cgpa ?? 'N/A'}"`,
        `"${s.score ?? 0}"`,
        `"${s.total_questions ?? 0}"`,
        `"${s.correct_answers ?? 0}"`,
        `"${s.wrong_answers ?? 0}"`,
        `"${formatTime(s.time_taken_seconds)}"`,
        `"${s.custom_mock_exams?.title || ''}"`,
        `"${s.created_at ? new Date(s.created_at).toLocaleString() : ''}"`
      ];

      if (isDetailed) {
        baseRow.push(`"${catText}"`, `"${fbText}"`);
      }

      return baseRow;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `custom_exam_submissions_${isDetailed ? 'detailed' : 'summary'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // EXPORT PDF FUNCTION (SUMMARY VS DETAILED REPORT)
  function performPDFExport(isDetailed = false) {
    if (examFilteredSubmissions.length === 0) return;

    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Custom Mock Exam ${isDetailed ? 'Detailed Full' : 'Summary'} Submissions Report`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Attempts: ${examFilteredSubmissions.length}`, 14, 22);

    if (!isDetailed) {
      // SUMMARY REPORT TABLE
      const tableData = examFilteredSubmissions.map((s, i) => [
        i + 1,
        s.user_name || '',
        s.user_degree || s.user_department || '',
        `${s.user_college || ''}${s.user_reg_num ? '\nReg: ' + s.user_reg_num : ''}`,
        s.user_cgpa ? `${s.user_cgpa} CGPA` : 'N/A',
        `${s.score ?? 0} / ${s.total_questions ?? 0}`,
        `${s.correct_answers ?? 0} Correct`,
        formatTime(s.time_taken_seconds),
        s.custom_mock_exams?.title || ''
      ]);

      doc.autoTable({
        startY: 28,
        head: [['#', 'Name', 'Degree / Dept', 'College & Reg No', 'CGPA', 'Score', 'Accuracy', 'Time Taken', 'Exam Title']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
    } else {
      // DETAILED MULTI-SECTION REPORT WITH CANDIDATE ACADEMICS & CATEGORY SCORES
      const tableData = examFilteredSubmissions.map((s, i) => {
        const catText = s.category_scores
          ? Object.entries(s.category_scores)
              .map(([cat, st]) => `${cat}: ${st.correct || 0}/${st.total || 0}`)
              .join('\n')
          : 'N/A';

        return [
          i + 1,
          `${s.user_name || ''}\n${s.user_email || ''}\nPh: ${s.user_phone || ''}`,
          `${s.user_degree || s.user_department || ''}\n${s.user_college || ''}${s.user_reg_num ? '\nReg: ' + s.user_reg_num : ''}`,
          `10th: ${s.user_10th_mark ? s.user_10th_mark + '%' : 'N/A'}\n12th: ${s.user_12th_mark ? s.user_12th_mark + '%' : 'N/A'}\nCGPA: ${s.user_cgpa || 'N/A'}`,
          s.user_address || 'N/A',
          `${s.score ?? 0} / ${s.total_questions ?? 0}`,
          catText,
          formatTime(s.time_taken_seconds),
          s.custom_mock_exams?.title || ''
        ];
      });

      doc.autoTable({
        startY: 28,
        head: [['#', 'Candidate Profile', 'Degree, College & Reg No', 'Academics', 'Residential Address', 'Total Score', 'Category Scores', 'Time Taken', 'Exam Title']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 7.5, cellPadding: 2 }
      });
    }

    doc.save(`custom_exam_submissions_${isDetailed ? 'detailed' : 'summary'}_${Date.now()}.pdf`);
  }

  function handleTriggerExport() {
    if (exportFormat === 'csv') {
      performCSVExport(exportLevel === 'detailed');
    } else {
      performPDFExport(exportLevel === 'detailed');
    }
    setShowExportModal(false);
  }

  return (
    <PageShell
      title="Custom Exam Submissions"
      subtitle="Candidate scores, academic marks (10th, 12th, CGPA), section category breakdowns, attempt review and reports."
      actions={
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-admin-600 text-white hover:bg-admin-700 transition-all cursor-pointer shadow-sm"
        >
          <FiDownload className="w-4 h-4" />
          Export Reports (PDF / Excel)
        </button>
      }
    >
      <div className="bg-white border border-admin-200 rounded-xl p-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-semibold text-neutral-600 uppercase shrink-0">Filter Exam:</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="h-9 px-3 pr-8 border border-admin-200 bg-white text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-500/20 rounded-lg w-full sm:w-64 cursor-pointer"
          >
            <option value="ALL">All Custom Exams ({exams.length})</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      {examFilteredSubmissions.length === 0 && !loading ? (
        <div className="border border-admin-200 rounded-xl">
          <EmptyState
            icon={FiClipboard}
            title="No exam submissions recorded yet"
            description="When candidates complete custom exams, their attempt details will be listed here."
          />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={examFilteredSubmissions}
          isLoading={loading}
          searchPlaceholder="Search name, email, degree, college..."
          filterFn={(s, q) =>
            (s.user_name || '').toLowerCase().includes(q) ||
            (s.user_email || '').toLowerCase().includes(q) ||
            (s.user_phone || '').toLowerCase().includes(q) ||
            (s.user_college || '').toLowerCase().includes(q) ||
            (s.user_degree || '').toLowerCase().includes(q) ||
            (s.user_reg_num || '').toLowerCase().includes(q)
          }
          emptyTitle="No submissions"
          emptyDescription="Completed attempts will appear here."
        />
      )}

      {/* INDIVIDUAL CANDIDATE ATTEMPT & QUESTION REVIEW MODAL */}
      {activeReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-brand-blue/30 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                  {activeReviewModal.candidate_photo ? (
                    <img src={activeReviewModal.candidate_photo} alt={activeReviewModal.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{activeReviewModal.user_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeReviewModal.user_degree || activeReviewModal.user_department} · {activeReviewModal.user_college}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewModal(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* CANDIDATE ACADEMIC & CONTACT SUMMARY */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email & Phone</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">{activeReviewModal.user_email}</span>
                  <span className="text-[11px] text-slate-600 font-mono block">{activeReviewModal.user_phone}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Academic Marks</span>
                  <span className="text-xs font-bold text-slate-800 block">10th: {activeReviewModal.user_10th_mark ? `${activeReviewModal.user_10th_mark}%` : 'N/A'}</span>
                  <span className="text-xs font-bold text-slate-800 block">12th: {activeReviewModal.user_12th_mark ? `${activeReviewModal.user_12th_mark}%` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CGPA & Year</span>
                  <span className="text-xs font-bold text-emerald-700 block">CGPA: {activeReviewModal.user_cgpa ?? 'N/A'}</span>
                  <span className="text-xs font-semibold text-slate-600 block">{activeReviewModal.user_year}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Score</span>
                  <span className="text-sm font-black text-emerald-600 block">{activeReviewModal.score ?? 0} Marks</span>
                  <span className="text-[11px] font-mono text-slate-500 block">Time: {formatTime(activeReviewModal.time_taken_seconds)}</span>
                </div>
                {activeReviewModal.user_address && (
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-blue-100/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Residential Address:</span>
                    <span className="text-xs text-slate-700 font-medium">{activeReviewModal.user_address}</span>
                  </div>
                )}
              </div>

              {/* SECTION CATEGORY BREAKDOWN CARDS */}
              {activeReviewModal.category_scores && Object.keys(activeReviewModal.category_scores).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Category Performance Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {Object.entries(activeReviewModal.category_scores).map(([catName, stat], idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                        <span className="font-bold text-brand-blue block text-xs">{catName}</span>
                        <div className="flex items-center justify-between text-slate-700 pt-1">
                          <span>Correct: <strong className="text-emerald-600">{stat.correct || 0}</strong></span>
                          <span>Wrong: <strong className="text-rose-600">{stat.wrong || 0}</strong></span>
                          <span>Unanswered: <strong className="text-slate-400">{stat.unanswered || 0}</strong></span>
                        </div>
                        <div className="pt-1 border-t border-slate-200/80 font-bold text-slate-900 flex justify-between">
                          <span>Section Score:</span>
                          <span className="text-emerald-700">{stat.score || 0} Marks ({stat.total || 0} Qs)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION BY QUESTION ITEMIZATION REVIEW */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Itemized Question Response Review</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {reviewQuestions.length} Total Questions
                  </span>
                </h4>

                {loadingReviewQuestions ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Loading attempt questions...</p>
                  </div>
                ) : reviewQuestions.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                    Question details not stored for demo record.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewQuestions.map((q, idx) => {
                      const userAnsIdx = activeReviewModal.answers?.[q.id];
                      const isUnanswered = userAnsIdx === undefined || userAnsIdx === null;
                      const isCorrect = !isUnanswered && Number(userAnsIdx) === Number(q.correct_option);

                      return (
                        <div
                          key={q.id || idx}
                          className={`p-4 rounded-2xl border transition-all text-xs space-y-3 ${
                            isCorrect
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : isUnanswered
                              ? 'bg-slate-50 border-slate-200'
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">Q{idx + 1}.</span>
                              {q.category_name && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-brand-blue border border-blue-200 uppercase">
                                  {q.category_name}
                                </span>
                              )}
                            </div>
                            <div>
                              {isCorrect ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  ✓ Correct (+{q.marks || 1} Mark)
                                </span>
                              ) : isUnanswered ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                  Unanswered (0 Marks)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                  ✗ Incorrect (0 Marks)
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="font-bold text-slate-900 leading-relaxed text-xs">
                            {q.question_text}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options?.map((optText, optIdx) => {
                              const isSelectedByCandidate = Number(userAnsIdx) === optIdx;
                              const isCorrectOpt = Number(q.correct_option) === optIdx;
                              const optLabel = String.fromCharCode(65 + optIdx);

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border flex items-center gap-2 font-medium ${
                                    isCorrectOpt
                                      ? 'bg-emerald-100/80 border-emerald-400 text-emerald-900 font-bold'
                                      : isSelectedByCandidate
                                      ? 'bg-rose-100/80 border-rose-400 text-rose-900 font-bold'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className="w-5 font-bold text-slate-800 text-[11px]">{optLabel}.</span>
                                  <span className="flex-1">{optText}</span>
                                  {isCorrectOpt && <span className="text-[10px] text-emerald-800 font-bold">✓ Correct</span>}
                                  {isSelectedByCandidate && !isCorrectOpt && <span className="text-[10px] text-rose-800 font-bold">Candidate Answer</span>}
                                </div>
                              );
                            })}
                          </div>

                          {q.explanation && (
                            <div className="p-2.5 bg-white/80 border border-slate-200 rounded-xl text-[11px] text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">Explanation: </span>{q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveReviewModal(null)}
                className="px-6 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 cursor-pointer shadow-xs"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK ANSWERS MODAL */}
      {activeFeedbackModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5 text-brand-blue" />
                <h3 className="font-bold text-slate-900 text-sm">Candidate Feedback Response</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div><span className="font-bold text-slate-900">Candidate:</span> {activeFeedbackModal.user_name}</div>
              <div><span className="font-bold text-slate-900">Email:</span> {activeFeedbackModal.user_email}</div>
              <div><span className="font-bold text-slate-900">Exam:</span> {activeFeedbackModal.custom_mock_exams?.title}</div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pt-1">
              {Object.entries(activeFeedbackModal.feedback_answers || {}).map(([key, val], i) => (
                <div key={key} className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-brand-blue block text-[11px]">Feedback Item #{i + 1}:</span>
                  <p className="text-slate-800 font-medium leading-relaxed">{String(val)}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveFeedbackModal(null)}
                className="px-5 py-2 bg-brand-blue text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-blue/90 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT OPTIONS MODAL (SUMMARY VS DETAILED REPORT) */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FiDownload className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Export Submissions Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* EXPORT FORMAT CHOICE */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Select Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      exportFormat === 'pdf'
                        ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FiFileText className="w-4 h-4 text-rose-600" />
                    <span>PDF Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      exportFormat === 'csv'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FiDownload className="w-4 h-4 text-emerald-600" />
                    <span>Excel / CSV</span>
                  </button>
                </div>
              </div>

              {/* EXPORT DETAIL LEVEL CHOICE */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Select Report Scope & Detail Level
                </label>
                <div className="space-y-2">
                  <label
                    onClick={() => setExportLevel('summary')}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      exportLevel === 'summary' ? 'bg-blue-50/70 border-brand-blue' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportLevel"
                      checked={exportLevel === 'summary'}
                      onChange={() => setExportLevel('summary')}
                      className="mt-0.5 text-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">📋 Summary Report</span>
                      <span className="text-[11px] text-slate-500 font-medium">Export candidate name, email, college, total score, and time taken.</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setExportLevel('detailed')}
                    className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                      exportLevel === 'detailed' ? 'bg-blue-50/70 border-brand-blue' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportLevel"
                      checked={exportLevel === 'detailed'}
                      onChange={() => setExportLevel('detailed')}
                      className="mt-0.5 text-brand-blue"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-xs block">📑 Detailed Full-Questions Report</span>
                      <span className="text-[11px] text-slate-500 font-medium">Export complete academic profiles (10th, 12th, CGPA, Address), category score breakdowns, and question response items.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTriggerExport}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FiDownload className="w-4 h-4" />
                <span>Generate & Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB SWITCH AUDIT LOG MODAL */}
      {activeTabSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                  <FiMonitor className="w-3 h-3 text-amber-700" />
                  Tab Switch Audit Logs ({activeTabSwitchModal.tab_switch_count || activeTabSwitchModal.tab_switch_logs?.length || 0})
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeTabSwitchModal.user_name} ({activeTabSwitchModal.user_email})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed log of tab & window switches captured silently during the exam.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTabSwitchModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-3 pr-1">
              {(!activeTabSwitchModal.tab_switch_logs || activeTabSwitchModal.tab_switch_logs.length === 0) ? (
                <div className="text-center py-8 space-y-2">
                  <FiCheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Tab Switch Logs Captured</p>
                  <p className="text-[11px] text-slate-500">Candidate remained on the exam tab throughout the test duration.</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 text-[11px]">
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Event Type</th>
                        <th className="p-2.5">Time & Date</th>
                        <th className="p-2.5">Exam Time Left</th>
                        <th className="p-2.5">Question At Moment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {activeTabSwitchModal.tab_switch_logs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{log.switch_number || idx + 1}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.event_type === 'tab_hidden' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {log.event_type === 'tab_hidden' ? 'Tab Hidden / Switched' : 'Window Focus Lost'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">
                            {new Date(log.timestamp).toLocaleTimeString()} ({new Date(log.timestamp).toLocaleDateString()})
                          </td>
                          <td className="p-2.5 font-mono text-slate-900 font-bold">
                            {log.time_left_formatted || `${log.time_left_seconds}s`}
                          </td>
                          <td className="p-2.5">
                            <span className="font-semibold text-slate-800">Q#{log.question_number}</span>
                            <span className="text-[10px] text-slate-400 block">{log.question_category}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveTabSwitchModal(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
