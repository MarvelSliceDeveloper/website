import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiHelpCircle, FiCheckCircle, FiXCircle, FiAward, FiUsers, FiList, FiFileText } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import { supabase } from '../../lib/supabaseClient';

export default function MockExamsList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
    setLoading(true);
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*, mock_exam_questions(id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching mock_exams:', error);
    } else {
      setExams(data || []);
    }
    setLoading(false);
  }

  async function toggleStatus(exam) {
    const nextStatus = !exam.is_active;
    const { error } = await supabase
      .from('mock_exams')
      .update({ is_active: nextStatus })
      .eq('id', exam.id);

    if (!error) {
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, is_active: nextStatus } : e));
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Are you sure you want to delete "${title}"? All associated questions and student submissions will be deleted.`)) {
      return;
    }

    try {
      // 1. Delete associated student submissions
      const { error: subErr } = await supabase
        .from('mock_exam_submissions')
        .delete()
        .eq('mock_exam_id', id);

      if (subErr) console.warn('Error deleting submissions:', subErr);

      // 2. Delete associated questions
      const { error: qErr } = await supabase
        .from('mock_exam_questions')
        .delete()
        .eq('mock_exam_id', id);

      if (qErr) console.warn('Error deleting questions:', qErr);

      // 3. Delete mock exam
      const { error } = await supabase
        .from('mock_exams')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting mock_exam:', error);
        alert(`Failed to delete mock exam: ${error.message}`);
      } else {
        setExams(prev => prev.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error('Exception deleting mock_exam:', err);
      alert('Failed to delete mock exam due to a system error.');
    }
  }

  return (
    <PageShell
      title="Banking Mock Exams"
      subtitle="Create and manage timed MCQ quizzes, questions, and view candidate results"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/banking/mock-exam-submissions"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
          >
            <FiUsers className="w-4 h-4 text-slate-500" />
            <span>View Submissions</span>
          </Link>
          <Link
            to="/admin/banking/mock-exams/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <FiPlus className="w-4 h-4" />
            <span>Create New Mock Exam</span>
          </Link>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center mx-auto">
            <FiHelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Banking Mock Exams Created Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create your first timed MCQ mock test with custom time limits, questions, and options.
          </p>
          <div className="pt-2">
            <Link
              to="/admin/banking/mock-exams/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-brand-blue/90 transition-all cursor-pointer shadow-xs"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create First Mock Exam</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const questionCount = exam.mock_exam_questions?.length || 0;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-brand-blue border border-blue-100">
                      <FiAward className="w-3 h-3" />
                      {exam.category || 'Banking'}
                    </span>

                    <button
                      onClick={() => toggleStatus(exam)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                        exam.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {exam.is_active ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                      <span>{exam.is_active ? 'Active' : 'Draft'}</span>
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-dark-navy leading-snug line-clamp-2">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {exam.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-500">
                      <FiClock className="w-3.5 h-3.5 text-brand-orange" />
                      <span>{exam.time_limit_mins} Mins</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <FiList className="w-3.5 h-3.5 text-brand-blue" />
                      <span>{questionCount} Questions</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <FiFileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{exam.total_marks || 100} Marks</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/admin/banking/mock-exams/${exam.id}/edit`)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer border border-slate-200"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                    <span>Edit Exam & Questions</span>
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id, exam.title)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete Exam"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
