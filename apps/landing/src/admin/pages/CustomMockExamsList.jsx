import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiClock, FiCheckSquare, FiCopy, FiCheck,
  FiShare2, FiExternalLink, FiUsers, FiClipboard, FiAlertCircle, FiLock, FiCalendar
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

export default function CustomMockExamsList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null); // { id, type: 'reg' | 'login' }
  const [deleteModalId, setDeleteModalId] = useState(null);

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
      // Fallback demo exams if table not yet created
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
          custom_mock_exam_questions: Array(50).fill({})
        }
      ]);
    }
    setLoading(false);
  }

  async function toggleExamActive(exam) {
    const newStatus = !exam.is_active;
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_active: newStatus } : e));

    if (!exam.id.startsWith('demo-')) {
      await supabase.from('custom_mock_exams').update({ is_active: newStatus }).eq('id', exam.id);
    }
  }

  async function handleDeleteExam(id) {
    setExams(prev => prev.filter(e => e.id !== id));
    setDeleteModalId(null);
    if (!id.startsWith('demo-')) {
      await supabase.from('custom_mock_exams').delete().eq('id', id);
    }
  }

  function handleCopyLink(slug, type) {
    const baseUrl = window.location.origin;
    const path = type === 'reg' ? `/custom-exam/register/${slug}` : `/custom-exam/login/${slug}`;
    const fullUrl = `${baseUrl}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId({ slug, type });
    setTimeout(() => setCopiedId(null), 2500);
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Dedicated Shareable Link Portal
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FiCheckSquare className="w-6 h-6 text-brand-blue" />
            <span>Custom Mock Exams</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create standalone timed mock exams (25, 50, 75, 100 MCQs) accessible strictly via shareable registration & login links.
          </p>
        </div>

        <Link
          to="/admin/custom-mock-exams/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create Custom Exam</span>
        </Link>
      </div>

      {/* QUICK METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold">
            <FiCheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Custom Exams</span>
            <span className="text-lg font-black text-slate-900">{exams.length}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Links</span>
            <span className="text-lg font-black text-emerald-600">{exams.filter(e => e.is_active).length} Active</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FiLock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Access Model</span>
            <span className="text-xs font-bold text-slate-800">Unique Link + Candidate Login</span>
          </div>
        </div>
      </div>

      {/* EXAMS LIST */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading custom mock exams...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <FiCheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Custom Mock Exams Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click the "Create Custom Exam" button above to configure an exam with 25, 50, 75, or 100 questions and get shareable registration links.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-brand-blue text-white uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-3.5 w-12">SL NO</th>
                  <th className="p-3.5">Exam Title & Slug</th>
                  <th className="p-3.5">MCQs / Marks</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Reg Start Time</th>
                  <th className="p-3.5">Exam Start Time</th>
                  <th className="p-3.5">Exam End Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Shareable Links</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {exams.map((exam, idx) => {
                  const countOpt = exam.question_count_option || exam.custom_mock_exam_questions?.length || 25;
                  const isRegCopied = copiedId?.slug === exam.slug && copiedId?.type === 'reg';
                  const isLoginCopied = copiedId?.slug === exam.slug && copiedId?.type === 'login';

                  // Calculate Duration
                  let durationDisplay = `${exam.time_limit_mins || 20} Mins`;
                  if (exam.exam_start_time && exam.exam_end_time) {
                    const diffMins = Math.round((new Date(exam.exam_end_time).getTime() - new Date(exam.exam_start_time).getTime()) / (1000 * 60));
                    if (diffMins > 0) {
                      const h = Math.floor(diffMins / 60);
                      const m = diffMins % 60;
                      if (h > 0 && m > 0) durationDisplay = `${h}h ${m}m`;
                      else if (h > 0) durationDisplay = `${h} hr${h > 1 ? 's' : ''}`;
                      else durationDisplay = `${m} Mins`;
                    }
                  }

                  return (
                    <tr key={exam.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-brand-blue border border-blue-100 uppercase tracking-wider">
                              {exam.category || 'Common'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              exam.exam_mode === 'link_only'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {exam.exam_mode === 'link_only' ? '🔗 Reg Link Only' : '📝 Exam with MCQs'}
                            </span>
                          </div>
                          <Link
                            to={`/admin/custom-mock-exams/${exam.id}/edit`}
                            className="font-bold text-slate-900 hover:text-brand-blue text-xs block transition-colors"
                          >
                            {exam.title}
                          </Link>
                          <span className="font-mono text-[10px] text-slate-400 block">
                            /{exam.slug}
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">{countOpt} MCQs</span>
                          <span className="text-[10px] text-slate-500 block">{exam.total_marks || 100} Marks</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-brand-blue border border-blue-100 inline-block whitespace-nowrap">
                          {durationDisplay}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        <span className="font-semibold block text-[11px] whitespace-nowrap">
                          {exam.registration_start_time ? new Date(exam.registration_start_time).toLocaleString() : 'Immediate'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        <span className="font-semibold text-brand-blue block text-[11px] whitespace-nowrap">
                          {exam.exam_start_time ? new Date(exam.exam_start_time).toLocaleString() : 'Immediate'}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-700">
                        <span className="font-semibold text-rose-600 block text-[11px] whitespace-nowrap">
                          {exam.exam_end_time ? new Date(exam.exam_end_time).toLocaleString() : 'No Limit'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => toggleExamActive(exam)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                            exam.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(exam.slug, 'reg')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                                isRegCopied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isRegCopied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                              <span>{isRegCopied ? 'Reg Link Copied' : 'Reg Link'}</span>
                            </button>
                            <a
                              href={`/custom-exam/register/${exam.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-brand-blue"
                              title="Open Reg URL"
                            >
                              <FiExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyLink(exam.slug, 'login')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                                isLoginCopied ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isLoginCopied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                              <span>{isLoginCopied ? 'Login Link Copied' : 'Login Link'}</span>
                            </button>
                            <a
                              href={`/custom-exam/login/${exam.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-brand-blue"
                              title="Open Login URL"
                            >
                              <FiExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/admin/custom-mock-exams/${exam.id}/edit`}
                            className="p-1.5 text-slate-600 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Exam"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/custom-mock-exams/registrations?examId=${exam.id}`}
                            className="p-1.5 text-slate-600 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Candidates"
                          >
                            <FiUsers className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/admin/custom-mock-exams/submissions?examId=${exam.id}`}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Results"
                          >
                            <FiClipboard className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteModalId(exam.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Exam"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <FiAlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Custom Exam?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this custom exam? All questions, candidate registrations, and test submissions associated with it will be removed.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteExam(deleteModalId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Delete Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
