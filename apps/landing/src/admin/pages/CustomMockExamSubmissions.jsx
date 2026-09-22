import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiClipboard, FiSearch, FiDownload, FiFileText, FiUser, FiCheckCircle,
  FiClock, FiMessageSquare, FiX, FiAward
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CustomMockExamSubmissions() {
  const [searchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || 'ALL';

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFeedbackModal, setActiveFeedbackModal] = useState(null); // Submissions object for feedback modal

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
      .select('*, custom_mock_exams(title, slug)')
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
          user_year: '3rd Year',
          user_college: 'Marvel Institute of Technology',
          score: 42,
          total_questions: 50,
          correct_answers: 42,
          wrong_answers: 8,
          time_taken_seconds: 945,
          feedback_answers: {
            fb1: '4/5 Stars — Moderate difficulty',
            fb2: 'Great speed test interface!'
          },
          created_at: new Date().toISOString(),
          custom_mock_exams: { title: 'Special IBPS PO Speed Drill 2026', slug: 'ibps-po-special-drill' }
        }
      ]);
    }
    setLoading(false);
  }

  const filteredSubmissions = submissions.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.user_name?.toLowerCase().includes(term) ||
      s.user_email?.toLowerCase().includes(term) ||
      s.user_phone?.toLowerCase().includes(term) ||
      s.user_college?.toLowerCase().includes(term)
    );
  });

  function formatTime(seconds) {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    return `${mins}m ${secs}s`;
  }

  function exportCSV() {
    if (filteredSubmissions.length === 0) return;
    const headers = ['Candidate Name', 'Email', 'DOB', 'Phone', 'College', 'Department', 'Year', 'Score', 'Total Questions', 'Correct', 'Wrong', 'Time Taken', 'Exam Title', 'Date'];
    const rows = filteredSubmissions.map(s => [
      `"${s.user_name || ''}"`,
      `"${s.user_email || ''}"`,
      `"${s.user_dob || ''}"`,
      `"${s.user_phone || ''}"`,
      `"${s.user_college || ''}"`,
      `"${s.user_department || ''}"`,
      `"${s.user_year || ''}"`,
      `"${s.score ?? 0}"`,
      `"${s.total_questions ?? 0}"`,
      `"${s.correct_answers ?? 0}"`,
      `"${s.wrong_answers ?? 0}"`,
      `"${formatTime(s.time_taken_seconds)}"`,
      `"${s.custom_mock_exams?.title || ''}"`,
      `"${s.created_at ? new Date(s.created_at).toLocaleString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `custom_exam_submissions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPDF() {
    if (filteredSubmissions.length === 0) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Custom Mock Exam Submissions & Results Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Attempts: ${filteredSubmissions.length}`, 14, 22);

    const tableData = filteredSubmissions.map((s, i) => [
      i + 1,
      s.user_name || '',
      s.user_email || '',
      s.user_college || '',
      `${s.score ?? 0} / ${s.total_questions ?? 0}`,
      `${s.correct_answers ?? 0} Correct`,
      formatTime(s.time_taken_seconds),
      s.custom_mock_exams?.title || ''
    ]);

    doc.autoTable({
      startY: 28,
      head: [['#', 'Name', 'Email', 'College', 'Score', 'Accuracy', 'Time Taken', 'Exam Title']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`custom_exam_submissions_${Date.now()}.pdf`);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Results & Analytics
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FiClipboard className="w-6 h-6 text-emerald-600" />
            <span>Custom Exam Submissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View completed candidate attempts, score breakdowns, time taken, and feedback answers.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={exportPDF}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 uppercase shrink-0">Filter Exam:</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none w-full sm:w-64"
          >
            <option value="ALL">All Custom Exams ({exams.length})</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search candidate name, email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading submissions...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-2">
          <FiClipboard className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Exam Submissions Recorded Yet</h3>
          <p className="text-xs text-slate-500">When candidates complete custom exams, their attempt details will be listed here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-3.5">Candidate</th>
                  <th className="p-3.5">College & Dept</th>
                  <th className="p-3.5">Score / MCQs</th>
                  <th className="p-3.5">Time Taken</th>
                  <th className="p-3.5">Feedback</th>
                  <th className="p-3.5">Exam Title</th>
                  <th className="p-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredSubmissions.map((sub) => {
                  const hasFeedback = sub.feedback_answers && Object.keys(sub.feedback_answers).length > 0;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                            {sub.candidate_photo ? (
                              <img src={sub.candidate_photo} alt={sub.user_name} className="w-full h-full object-cover" />
                            ) : (
                              <FiUser className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{sub.user_name}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{sub.user_email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{sub.user_college}</span>
                        <span className="text-[10px] text-slate-500 block">{sub.user_department}</span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-black text-emerald-600 text-sm block">
                            {sub.score ?? 0} <span className="text-xs font-normal text-slate-400">/ {sub.total_questions || 0}</span>
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {sub.correct_answers || 0} Correct · {sub.wrong_answers || 0} Wrong
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-800">
                        {formatTime(sub.time_taken_seconds)}
                      </td>

                      <td className="p-3.5">
                        {hasFeedback ? (
                          <button
                            type="button"
                            onClick={() => setActiveFeedbackModal(sub)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FiMessageSquare className="w-3 h-3" />
                            <span>View Feedback</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {sub.custom_mock_exams?.title || 'Custom Exam'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                <h3 className="font-bold text-slate-900 text-sm">Candidate Feedback</h3>
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
    </div>
  );
}
