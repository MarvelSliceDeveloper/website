import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiTrash2, FiSave, FiCheckCircle, FiLoader, FiHelpCircle, FiClock, FiAward, FiCpu, FiZap, FiX } from 'react-icons/fi';
import PageShell from '../components/ui/PageShell';
import { supabase } from '../../lib/supabaseClient';
import { generateMockExamQuestionsAI } from '../../lib/mockExamAIService';

export default function MockExamEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  // Exam Settings
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Banking');
  const [timeLimitMins, setTimeLimitMins] = useState(20);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passMarks, setPassMarks] = useState(40);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Questions State
  const [questions, setQuestions] = useState([
    {
      id: 'temp-1',
      question_text: '',
      options: ['', '', '', ''],
      correct_option: 0,
      explanation: '',
      marks: 1
    }
  ]);

  useEffect(() => {
    if (isEditing) {
      fetchExamAndQuestions();
    }
  }, [id]);

  async function fetchExamAndQuestions() {
    setLoading(true);
    const { data: exam, error: examErr } = await supabase
      .from('mock_exams')
      .select('*')
      .eq('id', id)
      .single();

    if (examErr || !exam) {
      console.error('Error fetching exam:', examErr);
      setErrorMsg('Exam not found');
      setLoading(false);
      return;
    }

    setTitle(exam.title || '');
    setCategory(exam.category || 'Banking');
    setTimeLimitMins(exam.time_limit_mins || 20);
    setTotalMarks(exam.total_marks || 100);
    setPassMarks(exam.pass_marks || 40);
    setDescription(exam.description || '');
    setIsActive(exam.is_active ?? true);

    const { data: qData, error: qErr } = await supabase
      .from('mock_exam_questions')
      .select('*')
      .eq('mock_exam_id', id)
      .order('order_index', { ascending: true });

    if (!qErr && qData && qData.length > 0) {
      setQuestions(qData.map(q => ({
        id: q.id,
        question_text: q.question_text || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['', '', '', ''],
        correct_option: q.correct_option ?? 0,
        explanation: q.explanation || '',
        marks: q.marks || 1
      })));
    }

    setLoading(false);
  }

  function handleAddQuestion() {
    setQuestions(prev => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        question_text: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
        marks: 1
      }
    ]);
  }

  async function handleGenerateAI() {
    setGeneratingAi(true);
    setAiNotice(null);

    const topicToUse = aiTopic.trim() || title.trim() || 'Banking & Quantitative Aptitude';
    const res = await generateMockExamQuestionsAI({
      topic: topicToUse,
      count: aiCount,
      difficulty: aiDifficulty
    });

    if (res.questions && res.questions.length > 0) {
      const formatted = res.questions.map((q, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        question_text: q.question,
        options: q.options,
        correct_option: q.answer_index,
        explanation: q.explanation,
        marks: 1
      }));

      setQuestions(prev => {
        if (prev.length === 1 && !prev[0].question_text.trim()) {
          return formatted;
        }
        return [...prev, ...formatted];
      });

      setAiNotice(res.isFallback
        ? 'Generated questions using offline banking question bank.'
        : `Successfully generated ${formatted.length} questions using ${res.provider} (${res.model})!`);
    } else {
      setAiNotice('Could not generate questions. Please try again.');
    }

    setGeneratingAi(false);
    setShowAiModal(false);
  }

  function handleRemoveQuestion(index) {
    if (questions.length === 1) {
      alert('Mock exam must have at least one question.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  }

  function handleQuestionChange(index, field, value) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  }

  function handleOptionChange(qIndex, optIndex, value) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIndex) return q;
      const nextOpts = [...q.options];
      nextOpts[optIndex] = value;
      return { ...q, options: nextOpts };
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter exam title');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        alert(`Question #${i + 1} text cannot be empty`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j] || !q.options[j].trim()) {
          alert(`Option ${String.fromCharCode(65 + j)} for Question #${i + 1} cannot be empty`);
          return;
        }
      }
    }

    setSaving(true);
    setErrorMsg(null);

    let examId = id;

    // 1. Save or Update Mock Exam
    if (isEditing) {
      const { error: updateErr } = await supabase
        .from('mock_exams')
        .update({
          title: title.trim(),
          category,
          time_limit_mins: Number(timeLimitMins) || 20,
          total_marks: Number(totalMarks) || 100,
          pass_marks: Number(passMarks) || 40,
          description: description.trim(),
          is_active: isActive
        })
        .eq('id', id);

      if (updateErr) {
        console.error('Error updating mock_exam:', updateErr);
        setErrorMsg(updateErr.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: newExam, error: insertErr } = await supabase
        .from('mock_exams')
        .insert({
          title: title.trim(),
          category,
          time_limit_mins: Number(timeLimitMins) || 20,
          total_marks: Number(totalMarks) || 100,
          pass_marks: Number(passMarks) || 40,
          description: description.trim(),
          is_active: isActive
        })
        .select()
        .single();

      if (insertErr || !newExam) {
        console.error('Error inserting mock_exam:', insertErr);
        setErrorMsg(insertErr?.message || 'Failed to create exam');
        setSaving(false);
        return;
      }
      examId = newExam.id;
    }

    // 2. Clear old questions if editing and re-insert
    if (isEditing) {
      await supabase
        .from('mock_exam_questions')
        .delete()
        .eq('mock_exam_id', examId);
    }

    const questionPayloads = questions.map((q, idx) => ({
      mock_exam_id: examId,
      question_text: q.question_text.trim(),
      options: q.options.map(o => o.trim()),
      correct_option: Number(q.correct_option),
      explanation: q.explanation ? q.explanation.trim() : null,
      marks: Number(q.marks) || 1,
      order_index: idx
    }));

    const { error: qInsertErr } = await supabase
      .from('mock_exam_questions')
      .insert(questionPayloads);

    if (qInsertErr) {
      console.error('Error inserting questions:', qInsertErr);
      setErrorMsg('Exam saved but failed to save questions: ' + qInsertErr.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    navigate('/admin/banking/mock-exams');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      title={isEditing ? 'Edit Banking Mock Exam' : 'Create Banking Mock Exam'}
      subtitle="Configure test time limit, category, and MCQ questions"
      actions={
        <Link
          to="/admin/banking/mock-exams"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back to Mock Exams</span>
        </Link>
      }
    >
      <form onSubmit={handleSave} className="space-y-8">
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* EXAM GENERAL SETTINGS */}
        <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-dark-navy flex items-center gap-2">
            <FiAward className="w-5 h-5 text-brand-orange" />
            <span>Mock Exam Settings</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. IBPS PO Prelims Speed Drill Mock Test #1"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
              >
                <option value="Banking">Banking & Insurance</option>
                <option value="Competitive Exam">Competitive Exam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Time Limit (in Minutes) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={timeLimitMins}
                  onChange={e => setTimeLimitMins(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                />
                <FiClock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Total Marks
              </label>
              <input
                type="number"
                min="1"
                value={totalMarks}
                onChange={e => setTotalMarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Passing Marks
              </label>
              <input
                type="number"
                min="1"
                value={passMarks}
                onChange={e => setPassMarks(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Description / Exam Instructions
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Overview or instructions displayed before starting test..."
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 text-brand-blue rounded border-slate-300 accent-brand-blue cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs sm:text-sm font-semibold text-slate-700 cursor-pointer">
                Publish Test (Make active and visible on Banking Mock Exam page)
              </label>
            </div>
          </div>
        </div>

        {/* MCQ QUESTION BUILDER */}
        <div className="space-y-4">
          {aiNotice && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiZap className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{aiNotice}</span>
              </div>
              <button type="button" onClick={() => setAiNotice(null)} className="text-indigo-500 hover:text-indigo-700">
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-dark-navy">
                Questions Builder ({questions.length})
              </h2>
              <p className="text-xs text-slate-500">
                Add multiple choice questions manually or generate automatically with AI.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!aiTopic) setAiTopic(title || 'Banking & Quantitative Aptitude');
                  setShowAiModal(true);
                }}
                disabled={generatingAi}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {generatingAi ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCpu className="w-4 h-4 text-amber-300" />}
                <span>{generatingAi ? 'Generating...' : 'AI Auto-Generate'}</span>
              </button>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-blue text-white font-bold text-xs rounded-xl hover:bg-brand-blue/90 transition-all cursor-pointer shadow-xs"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div
                key={q.id || qIndex}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Question #{qIndex + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Delete Question</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={q.question_text}
                    onChange={e => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                    placeholder="Enter question statement..."
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none"
                  />
                </div>

                {/* OPTIONS LIST */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Options (Select the radio button next to the correct answer) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['A', 'B', 'C', 'D'].map((label, optIndex) => {
                      const isCorrect = q.correct_option === optIndex;
                      return (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                            isCorrect ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct_opt_${qIndex}`}
                            checked={isCorrect}
                            onChange={() => handleQuestionChange(qIndex, 'correct_option', optIndex)}
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-700 w-5">{label}.</span>
                          <input
                            type="text"
                            value={q.options[optIndex]}
                            onChange={e => handleOptionChange(qIndex, optIndex, e.target.value)}
                            placeholder={`Option ${label}`}
                            required
                            className="flex-1 bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:ring-2 focus:ring-brand-blue/20"
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                              Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* EXPLANATION */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Explanation / Solution Notes (Shown in test review)
                  </label>
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={e => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                    placeholder="Short solution or formula explanation..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3 border-2 border-dashed border-slate-300 hover:border-brand-blue text-slate-600 hover:text-brand-blue font-bold text-xs rounded-2xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Another Question</span>
            </button>
          </div>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border">
          <Link
            to="/admin/banking/mock-exams"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm transition-all disabled:opacity-60 cursor-pointer shadow-md"
          >
            {saving ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
            <span>{saving ? 'Saving Exam...' : 'Save Mock Exam'}</span>
          </button>
        </div>
      </form>

      {/* AI QUESTION GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                  <FiCpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">AI MCQ Question Generator</h3>
                  <p className="text-xs text-slate-500">Auto-generate banking & aptitude exam questions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Exam Topic / Subject Focus
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. Data Interpretation, Profit & Loss, RBI Policies, Syllogism"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={aiCount}
                    onChange={e => setAiCount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={e => setAiDifficulty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  >
                    <option value="Easy">Easy (Speed Drill)</option>
                    <option value="Medium">Medium (PO / Clerk)</option>
                    <option value="Hard">Hard (Advanced / Mains)</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-800 flex items-start gap-2">
                <FiZap className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <p>Generates 4 options, selects the correct answer, and writes a detailed step-by-step solution note for each question.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generatingAi}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {generatingAi ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCpu className="w-4 h-4 text-amber-300" />}
                <span>{generatingAi ? 'Generating...' : 'Generate Questions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
