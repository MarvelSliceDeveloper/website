import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiSave, FiPlus, FiTrash2, FiClock, FiHelpCircle,
  FiCheckCircle, FiAlertCircle, FiFileText, FiList, FiMessageSquare
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

export default function CustomMockExamEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('DETAILS'); // 'DETAILS' | 'QUESTIONS' | 'FEEDBACK'

  // Exam Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Banking & Aptitude');
  const [timeLimitMins, setTimeLimitMins] = useState(20);
  const [totalMarks, setTotalMarks] = useState(100);
  const [questionCountOption, setQuestionCountOption] = useState(25); // 25, 50, 75, 100
  const [registrationStartTime, setRegistrationStartTime] = useState('');
  const [examStartTime, setExamStartTime] = useState('');
  const [rulesText, setRulesText] = useState(
    '1. Ensure a stable internet connection throughout the test.\n2. Do not refresh the page or switch browser tabs during the exam.\n3. Each question carries 1 mark. Select the correct option.\n4. Negative marking of 0.25 marks applies for incorrect answers.\n5. The exam will auto-submit when the timer expires.'
  );

  // Feedback Questions Builder State [{ id, question_text, type: 'rating' | 'text' }]
  const [feedbackQuestions, setFeedbackQuestions] = useState([
    { id: 'fb1', question_text: 'How would you rate the difficulty level of this exam?', type: 'rating' },
    { id: 'fb2', question_text: 'Share your feedback or suggestions for improving future mock tests:', type: 'text' }
  ]);

  // Questions Builder State [{ id, question_text, options: ['', '', '', ''], correct_option: 0, explanation: '', marks: 1 }]
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (isEditing) {
      fetchExamData();
    } else {
      // Initialize default 25 template questions
      generateInitialQuestions(25);
    }
  }, [id]);

  function generateInitialQuestions(count) {
    const list = [];
    for (let i = 1; i <= count; i++) {
      list.push({
        id: `q-${i}`,
        question_text: `Question ${i}: Sample question statement for the speed drill.`,
        options: [
          `Option A for question ${i}`,
          `Option B for question ${i}`,
          `Option C for question ${i}`,
          `Option D for question ${i}`
        ],
        correct_option: 0,
        explanation: `Explanation for question ${i}.`,
        marks: 1
      });
    }
    setQuestions(list);
  }

  // Handle Question Count Option Change
  function handleCountOptionChange(newCount) {
    const countNum = Number(newCount);
    setQuestionCountOption(countNum);

    if (questions.length < countNum) {
      const extra = [];
      for (let i = questions.length + 1; i <= countNum; i++) {
        extra.push({
          id: `q-${i}`,
          question_text: `Question ${i}: Enter question statement here.`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correct_option: 0,
          explanation: '',
          marks: 1
        });
      }
      setQuestions(prev => [...prev, ...extra]);
    }
  }

  // Auto-generate slug from title
  function handleTitleChange(val) {
    setTitle(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }

  async function fetchExamData() {
    setLoading(true);
    const { data: examData, error: examErr } = await supabase
      .from('custom_mock_exams')
      .select('*')
      .eq('id', id)
      .single();

    if (!examErr && examData) {
      setTitle(examData.title || '');
      setSlug(examData.slug || '');
      setCategory(examData.category || 'General');
      setTimeLimitMins(examData.time_limit_mins || 20);
      setTotalMarks(examData.total_marks || 100);
      setQuestionCountOption(examData.question_count_option || 25);
      setRulesText(examData.rules_text || '');
      if (Array.isArray(examData.feedback_questions)) {
        setFeedbackQuestions(examData.feedback_questions);
      }

      if (examData.registration_start_time) {
        setRegistrationStartTime(new Date(examData.registration_start_time).toISOString().slice(0, 16));
      }
      if (examData.exam_start_time) {
        setExamStartTime(new Date(examData.exam_start_time).toISOString().slice(0, 16));
      }

      // Fetch questions
      const { data: qData } = await supabase
        .from('custom_mock_exam_questions')
        .select('*')
        .eq('custom_mock_exam_id', id)
        .order('order_index', { ascending: true });

      if (qData && qData.length > 0) {
        setQuestions(qData.map(q => ({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
          correct_option: q.correct_option ?? 0,
          explanation: q.explanation || '',
          marks: q.marks || 1
        })));
      }
    }
    setLoading(false);
  }

  // Validate timing guards
  function validateTimings() {
    if (registrationStartTime && examStartTime) {
      const regMs = new Date(registrationStartTime).getTime();
      const examMs = new Date(examStartTime).getTime();
      const diffMins = (examMs - regMs) / (1000 * 60);

      if (diffMins < 10) {
        alert('Registration start time must be set at least 10 minutes BEFORE the scheduled exam start time.');
        return false;
      }
    }
    return true;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      alert('Exam Title and Slug are required.');
      return;
    }

    if (!validateTimings()) return;

    setSaving(true);

    const examPayload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: category.trim(),
      time_limit_mins: Number(timeLimitMins),
      total_marks: Number(totalMarks),
      question_count_option: Number(questionCountOption),
      registration_start_time: registrationStartTime ? new Date(registrationStartTime).toISOString() : null,
      exam_start_time: examStartTime ? new Date(examStartTime).toISOString() : null,
      rules_text: rulesText.trim(),
      feedback_questions: feedbackQuestions,
      updated_at: new Date().toISOString()
    };

    let examId = id;

    if (isEditing && !id.startsWith('demo-')) {
      const { error } = await supabase.from('custom_mock_exams').update(examPayload).eq('id', id);
      if (error) {
        console.error('Error updating custom_mock_exam:', error);
        alert(`Error updating exam: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from('custom_mock_exams').insert(examPayload).select('id').single();
      if (error) {
        console.error('Error creating custom_mock_exam:', error);
        alert(`Error creating exam: ${error.message}`);
        setSaving(false);
        return;
      }
      if (data?.id) examId = data.id;
    }

    // Save questions if not demo
    if (examId && !examId.startsWith('demo-')) {
      await supabase.from('custom_mock_exam_questions').delete().eq('custom_mock_exam_id', examId);

      const qPayloads = questions.map((q, idx) => ({
        custom_mock_exam_id: examId,
        question_text: q.question_text,
        options: q.options,
        correct_option: Number(q.correct_option),
        explanation: q.explanation,
        marks: Number(q.marks || 1),
        order_index: idx
      }));

      await supabase.from('custom_mock_exam_questions').insert(qPayloads);
    }

    setSaving(false);
    alert('Custom Mock Exam saved successfully!');
    navigate('/admin/custom-mock-exams');
  }

  // Question manipulation helpers
  function addQuestion() {
    setQuestions(prev => [
      ...prev,
      {
        id: `q-new-${Date.now()}`,
        question_text: `New Question ${prev.length + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_option: 0,
        explanation: '',
        marks: 1
      }
    ]);
  }

  function removeQuestion(index) {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  }

  function updateQuestion(index, field, value) {
    setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
  }

  function updateOption(qIdx, optIdx, val) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[optIdx] = val;
      return { ...q, options: opts };
    }));
  }

  // Feedback manipulation helpers
  function addFeedbackQuestion() {
    setFeedbackQuestions(prev => [
      ...prev,
      { id: `fb-${Date.now()}`, question_text: 'New feedback question statement', type: 'rating' }
    ]);
  }

  function removeFeedbackQuestion(idx) {
    setFeedbackQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function updateFeedbackQuestion(idx, field, val) {
    setFeedbackQuestions(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* TOP NAV BAR */}
      <div className="flex items-center justify-between bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/custom-mock-exams"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              {isEditing ? 'Edit Custom Mock Exam' : 'Create Custom Mock Exam'}
            </h1>
            <p className="text-xs text-slate-500">Configure parameters, 25/50/75/100 MCQs, timing guards & feedback</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <FiSave className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Exam'}</span>
        </button>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('DETAILS')}
          className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'DETAILS'
              ? 'bg-white text-brand-blue border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiFileText className="w-4 h-4" />
          <span>1. Exam Parameters & Timings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('QUESTIONS')}
          className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'QUESTIONS'
              ? 'bg-white text-brand-blue border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiList className="w-4 h-4" />
          <span>2. MCQ Questions ({questions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FEEDBACK')}
          className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-t-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'FEEDBACK'
              ? 'bg-white text-brand-blue border-t-2 border-x border-slate-200 -mb-px'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiMessageSquare className="w-4 h-4" />
          <span>3. Candidate Feedback Questions ({feedbackQuestions.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading exam builder...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: EXAM PARAMETERS & TIMING GUARDS */}
          {activeTab === 'DETAILS' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Exam Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="e.g. Special IBPS PO Speed Drill 2026"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Unique Link Slug <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono text-slate-500">
                      /custom-exam/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      placeholder="ibps-po-special-drill"
                      required
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-r-xl text-xs sm:text-sm font-mono text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Category / Department
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="Banking & Aptitude"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Question Count Selection <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={questionCountOption}
                    onChange={e => handleCountOptionChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-bold"
                  >
                    <option value={25}>25 Questions (Short Drill)</option>
                    <option value={50}>50 Questions (Medium Test)</option>
                    <option value={75}>75 Questions (Full Sectional)</option>
                    <option value={100}>100 Questions (Full Length Mock)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Time Limit (Minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={300}
                    value={timeLimitMins}
                    onChange={e => setTimeLimitMins(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={totalMarks}
                    onChange={e => setTotalMarks(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Scheduled Registration Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationStartTime}
                    onChange={e => setRegistrationStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Registration opens automatically at this time.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Scheduled Exam Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={examStartTime}
                    onChange={e => setExamStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-bold text-brand-blue"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Must be set at least 10 minutes after registration start.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Exam Rules & Guidelines Text
                </label>
                <textarea
                  rows={5}
                  value={rulesText}
                  onChange={e => setRulesText(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 2: MCQ QUESTIONS BUILDER */}
          {activeTab === 'QUESTIONS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">MCQ Questions ({questions.length})</h3>
                  <p className="text-xs text-slate-500">Configure questions, 4 options, and correct answers</p>
                </div>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        Question {idx + 1} of {questions.length}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-bold text-slate-500">Marks:</span>
                          <input
                            type="number"
                            min={1}
                            value={q.marks || 1}
                            onChange={e => updateQuestion(idx, 'marks', e.target.value)}
                            className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Question"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Question Statement
                      </label>
                      <textarea
                        rows={2}
                        value={q.question_text}
                        onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                        placeholder="Enter the question prompt here..."
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-medium"
                      />
                    </div>

                    {/* OPTIONS */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold uppercase text-slate-600">
                        Options & Select Correct Answer
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((optText, optIdx) => {
                          const isCorrect = Number(q.correct_option) === optIdx;
                          const optLabel = String.fromCharCode(65 + optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                                isCorrect ? 'bg-emerald-50/80 border-emerald-300' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-opt-${idx}`}
                                checked={isCorrect}
                                onChange={() => updateQuestion(idx, 'correct_option', optIdx)}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="font-bold text-xs text-slate-700 w-5">{optLabel}.</span>
                              <input
                                type="text"
                                value={optText}
                                onChange={e => updateOption(idx, optIdx, e.target.value)}
                                placeholder={`Option ${optLabel}`}
                                className="w-full bg-transparent text-xs text-slate-800 outline-none font-medium"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={q.explanation || ''}
                        onChange={e => updateQuestion(idx, 'explanation', e.target.value)}
                        placeholder="Step-by-step solution note..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CANDIDATE FEEDBACK QUESTIONS BUILDER */}
          {activeTab === 'FEEDBACK' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FiMessageSquare className="w-4 h-4 text-brand-blue" />
                    <span>Candidate Feedback Questions</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asked to candidates after completing all questions before final exam submission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addFeedbackQuestion}
                  className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  <span>Add Feedback Question</span>
                </button>
              </div>

              <div className="space-y-4">
                {feedbackQuestions.map((fb, idx) => (
                  <div key={fb.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Feedback Item #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFeedbackQuestion(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Question Prompt
                        </label>
                        <input
                          type="text"
                          value={fb.question_text}
                          onChange={e => updateFeedbackQuestion(idx, 'question_text', e.target.value)}
                          placeholder="e.g. How satisfied are you with the exam layout?"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                          Response Type
                        </label>
                        <select
                          value={fb.type || 'rating'}
                          onChange={e => updateFeedbackQuestion(idx, 'type', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none font-bold"
                        >
                          <option value="rating">5-Star Rating</option>
                          <option value="text">Text Response</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
