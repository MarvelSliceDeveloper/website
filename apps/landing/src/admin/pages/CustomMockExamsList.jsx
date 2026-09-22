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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {exams.map((exam) => {
            const countOpt = exam.question_count_option || exam.custom_mock_exam_questions?.length || 25;
            const isRegCopied = copiedId?.slug === exam.slug && copiedId?.type === 'reg';
            const isLoginCopied = copiedId?.slug === exam.slug && copiedId?.type === 'login';

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* TOP TITLE ROW */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-brand-blue border border-blue-100 uppercase tracking-wider">
                          {exam.category || 'General'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          exam.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        slug: /{exam.slug}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExamActive(exam)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        exam.is_active ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {exam.is_active ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {/* PARAMETERS GRID */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Questions</span>
                      <span className="font-bold text-slate-900">{countOpt} MCQs</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Time Limit</span>
                      <span className="font-bold text-brand-blue">{exam.time_limit_mins || 20} Mins</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                      <span className="font-bold text-emerald-600">{exam.total_marks || 100} Marks</span>
                    </div>
                  </div>

                  {/* TIMING GUARDS INFO */}
                  <div className="text-[11px] text-slate-600 space-y-1 bg-blue-50/50 p-3 rounded-xl border border-blue-100/60">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <FiCalendar className="w-3.5 h-3.5 text-brand-blue" /> Reg Start:
                      </span>
                      <span className="font-medium text-slate-800">
                        {exam.registration_start_time ? new Date(exam.registration_start_time).toLocaleString() : 'Immediate'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5 text-brand-orange" /> Exam Start:
                      </span>
                      <span className="font-medium text-slate-800">
                        {exam.exam_start_time ? new Date(exam.exam_start_time).toLocaleString() : 'Immediate'}
                      </span>
                    </div>
                  </div>

                  {/* DYNAMIC SHAREABLE LINKS SECTION */}
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Shareable Unique Links
                    </span>

                    {/* 1. Registration Link */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase">1. Candidate Registration Link:</span>
                        <span className="font-mono text-slate-600 truncate block text-[11px]">
                          {`${window.location.origin}/custom-exam/register/${exam.slug}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(exam.slug, 'reg')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            isRegCopied ? 'bg-emerald-600 text-white' : 'bg-brand-blue text-white hover:bg-brand-blue/90'
                          }`}
                        >
                          {isRegCopied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                          <span>{isRegCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`/custom-exam/register/${exam.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-brand-blue rounded-lg transition-colors"
                          title="Open Registration Link"
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* 2. Exam Login Link */}
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase">2. Exam Portal Login Link:</span>
                        <span className="font-mono text-slate-600 truncate block text-[11px]">
                          {`${window.location.origin}/custom-exam/login/${exam.slug}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(exam.slug, 'login')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            isLoginCopied ? 'bg-emerald-600 text-white' : 'bg-brand-blue text-white hover:bg-brand-blue/90'
                          }`}
                        >
                          {isLoginCopied ? <FiCheck className="w-3 h-3" /> : <FiCopy className="w-3 h-3" />}
                          <span>{isLoginCopied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <a
                          href={`/custom-exam/login/${exam.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-brand-blue rounded-lg transition-colors"
                          title="Open Exam Login Link"
                        >
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/custom-mock-exams/registrations?examId=${exam.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
                    >
                      <FiUsers className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Candidates</span>
                    </Link>
                    <Link
                      to={`/admin/custom-mock-exams/submissions?examId=${exam.id}`}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
                    >
                      <FiClipboard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Results</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/admin/custom-mock-exams/${exam.id}/edit`}
                      className="p-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Exam"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteModalId(exam.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Exam"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
