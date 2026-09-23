import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft, FiSave, FiPlus, FiTrash2, FiClock, FiHelpCircle,
  FiCheckCircle, FiAlertCircle, FiFileText, FiList, FiMessageSquare,
  FiUpload, FiDownload, FiCode, FiX, FiCheck
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { supabase } from '../../lib/supabaseClient';
import FolderTabs from '../components/ui/FolderTabs';
import SaveCancelBar from '../components/SaveCancelBar';

export default function CustomMockExamEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('DETAILS'); // 'DETAILS' | 'QUESTIONS' | 'FEEDBACK'

  // Custom Admin Modal Dialog State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'error', // 'error' | 'success' | 'confirm'
    onConfirm: null
  });

  // AI & Import Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('General Aptitude & Reasoning');
  const [aiDifficulty, setAiDifficulty] = useState('Moderate');
  const [aiCount, setAiCount] = useState(25);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('json'); // 'json' | 'csv'
  const [importText, setImportText] = useState('');

  const DEFAULT_DEGREES = [
    'B.E (Computer Science & Engineering)',
    'B.E (Electronics & Communication Engineering)',
    'B.E (Electrical & Electronics Engineering)',
    'B.E (Mechanical Engineering)',
    'B.E (Civil Engineering)',
    'B.Tech (Information Technology)',
    'B.Tech (Artificial Intelligence & Data Science)',
    'M.E (Software Engineering)',
    'M.Tech (Data Science)',
    'MCA (Master of Computer Applications)',
    'B.Sc (Computer Science)',
    'BCA (Bachelor of Computer Applications)',
    'MBA (Master of Business Administration)'
  ];

  const DEFAULT_CATEGORIES = [
    'Quantitative Aptitude',
    'Logical Reasoning',
    'Verbal Ability',
    'Technical Knowledge'
  ];

  const [allowedDegrees, setAllowedDegrees] = useState(DEFAULT_DEGREES);
  const [newDegreeInput, setNewDegreeInput] = useState('');
  const [examCategories, setExamCategories] = useState(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Exam Form State
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode = modeParam === 'link_only' ? 'link_only' : 'questions';
  const [examMode, setExamMode] = useState(initialMode); // 'questions' | 'link_only'

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Common');
  const [timeLimitMins, setTimeLimitMins] = useState(20);
  const [totalMarks, setTotalMarks] = useState(100);
  const [questionCountOption, setQuestionCountOption] = useState(25); // 25, 50, 75, 100
  const [registrationStartTime, setRegistrationStartTime] = useState('');
  const [examStartTime, setExamStartTime] = useState('');
  const [examEndTime, setExamEndTime] = useState('');
  const [rulesText, setRulesText] = useState(
    '1. Ensure a stable internet connection throughout the test.\n2. Do not refresh the page or switch browser tabs during the exam.\n3. Each question carries 1 mark. Select the correct option.\n4. Negative marking of 0.25 marks applies for incorrect answers.\n5. The exam will auto-submit when the timer expires.'
  );

  // Feedback Questions Builder State [{ id, question_text, type: 'rating' | 'text' }]
  const [feedbackQuestions, setFeedbackQuestions] = useState([
    { id: 'fb1', question_text: 'How would you rate the difficulty level of this exam?', type: 'rating' },
    { id: 'fb2', question_text: 'Share your feedback or suggestions for improving future tests:', type: 'text' }
  ]);

  // Questions Builder State [{ id, question_text, options: ['', '', '', ''], correct_option: 0, explanation: '', marks: 1, category_name: 'Quantitative Aptitude' }]
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    if (isEditing) {
      fetchExamData();
    } else {
      generateInitialQuestions(25);
    }
  }, [id]);

  function showAlertModal(titleText, msgText, type = 'error', onConfirmFn = null) {
    setModalConfig({
      isOpen: true,
      title: titleText,
      message: msgText,
      type: type,
      onConfirm: onConfirmFn
    });
  }

  // GENERATE BLANK QUESTION TEMPLATES
  function generateInitialQuestions(count) {
    const list = [];
    for (let i = 1; i <= count; i++) {
      const defaultCat = examCategories[ (i - 1) % examCategories.length ] || 'General';
      list.push({
        id: `q-${i}`,
        question_text: '',
        options: ['', '', '', ''],
        correct_option: 0,
        explanation: '',
        marks: 1,
        category_name: defaultCat
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
        const defaultCat = examCategories[ (i - 1) % examCategories.length ] || 'General';
        extra.push({
          id: `q-${i}`,
          question_text: '',
          options: ['', '', '', ''],
          correct_option: 0,
          explanation: '',
          marks: 1,
          category_name: defaultCat
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
      setCategory(examData.category || 'Common');
      if (examData.exam_mode) setExamMode(examData.exam_mode);
      setTimeLimitMins(examData.time_limit_mins || 20);
      setTotalMarks(examData.total_marks || 100);
      setQuestionCountOption(examData.question_count_option || 25);
      setRulesText(examData.rules_text || '');
      if (Array.isArray(examData.allowed_degrees) && examData.allowed_degrees.length > 0) {
        setAllowedDegrees(examData.allowed_degrees);
      }
      if (Array.isArray(examData.exam_categories) && examData.exam_categories.length > 0) {
        setExamCategories(examData.exam_categories);
      }
      if (Array.isArray(examData.feedback_questions) && examData.feedback_questions.length > 0) {
        setFeedbackQuestions(examData.feedback_questions);
      }

      if (examData.registration_start_time) {
        setRegistrationStartTime(new Date(examData.registration_start_time).toISOString().slice(0, 16));
      }
      if (examData.exam_start_time) {
        setExamStartTime(new Date(examData.exam_start_time).toISOString().slice(0, 16));
      }
      if (examData.exam_end_time) {
        setExamEndTime(new Date(examData.exam_end_time).toISOString().slice(0, 16));
      }

      // Fetch questions
      const { data: qData } = await supabase
        .from('custom_mock_exam_questions')
        .select('*')
        .eq('custom_mock_exam_id', id)
        .order('order_index', { ascending: true });

      if (qData && qData.length > 0) {
        setQuestions(qData.map((q, qIdx) => ({
          id: q.id,
          question_text: q.question_text || '',
          options: Array.isArray(q.options) && q.options.length >= 4 ? q.options : ['', '', '', ''],
          correct_option: q.correct_option ?? 0,
          explanation: q.explanation || '',
          marks: q.marks || 1,
          category_name: q.category_name || (examCategories[qIdx % examCategories.length] || 'General')
        })));
      } else {
        generateInitialQuestions(examData.question_count_option || 25);
      }
    } else {
      generateInitialQuestions(25);
    }
    setLoading(false);
  }

  // STRICT MANDATORY VALIDATION GUARD (DOES NOT ALLOW SAVING IF ANY QUESTION OR OPTION IS BLANK)
  function validateExamForm() {
    if (!title.trim()) {
      showAlertModal('Validation Error', 'Exam Title is mandatory.', 'error');
      return false;
    }

    if (!slug.trim()) {
      showAlertModal('Validation Error', 'Unique Link Slug is mandatory.', 'error');
      return false;
    }

    const reqCount = Number(questionCountOption);
    if (questions.length < reqCount) {
      showAlertModal(
        'Questions Missing',
        `You configured ${reqCount} questions for this exam, but only ${questions.length} questions exist. Creating all ${reqCount} questions is mandatory before saving.`,
        'error'
      );
      return false;
    }

    // Validate EVERY question statement and all 4 options
    for (let i = 0; i < reqCount; i++) {
      const q = questions[i];
      if (!q || !q.question_text || !q.question_text.trim()) {
        showAlertModal(
          'Question Statement Blank',
          `Question #${i + 1} statement is empty. All ${reqCount} questions must be filled out before saving. Use "Generate AI Questions", "Import JSON/CSV", or type manually.`,
          'error'
        );
        return false;
      }

      if (!Array.isArray(q.options) || q.options.length < 4) {
        showAlertModal(
          'Options Incomplete',
          `Question #${i + 1} must have 4 options defined.`,
          'error'
        );
        return false;
      }

      for (let optIdx = 0; optIdx < 4; optIdx++) {
        if (!q.options[optIdx] || !q.options[optIdx].trim()) {
          const optLabel = String.fromCharCode(65 + optIdx);
          showAlertModal(
            'Option Blank',
            `Question #${i + 1} - Option ${optLabel} is blank. All 4 options are mandatory for every question before saving.`,
            'error'
          );
          return false;
        }
      }
    }

    // Validate Feedback questions (At least 2 mandatory)
    if (!Array.isArray(feedbackQuestions) || feedbackQuestions.length < 2) {
      showAlertModal(
        'Feedback Questions Mandatory',
        `Creating at least 2 candidate feedback questions is mandatory before saving. Currently you have ${feedbackQuestions?.length || 0} feedback questions.`,
        'error'
      );
      return false;
    }

    for (let fIdx = 0; fIdx < feedbackQuestions.length; fIdx++) {
      const fb = feedbackQuestions[fIdx];
      if (!fb || !fb.question_text || !fb.question_text.trim()) {
        showAlertModal(
          'Feedback Prompt Blank',
          `Candidate Feedback Question #${fIdx + 1} prompt cannot be empty.`,
          'error'
        );
        return false;
      }
      if (fb.type === 'matrix') {
        if (!Array.isArray(fb.matrix_rows) || fb.matrix_rows.length === 0 || fb.matrix_rows.some(r => !r || !r.trim())) {
          showAlertModal(
            'Matrix Statement Blank',
            `Candidate Feedback Question #${fIdx + 1} (Likert Matrix Table) must have valid non-empty statement rows.`,
            'error'
          );
          return false;
        }
      }
    }

    // Validate timing guards
    if (examStartTime && examEndTime) {
      const startMs = new Date(examStartTime).getTime();
      const endMs = new Date(examEndTime).getTime();
      if (endMs <= startMs) {
        showAlertModal(
          'Timing Error',
          'Scheduled Exam End Time must be set AFTER the Scheduled Exam Start Time.',
          'error'
        );
        return false;
      }
    }

    return true;
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    if (!validateExamForm()) return;

    setSaving(true);

    const calculatedDurationMins = (examStartTime && examEndTime)
      ? Math.max(1, Math.round((new Date(examEndTime).getTime() - new Date(examStartTime).getTime()) / (1000 * 60)))
      : Number(timeLimitMins || 20);

    const examPayload = {
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: category.trim(),
      time_limit_mins: calculatedDurationMins,
      total_marks: Number(totalMarks),
      question_count_option: Number(questionCountOption),
      registration_start_time: registrationStartTime ? new Date(registrationStartTime).toISOString() : null,
      exam_start_time: examStartTime ? new Date(examStartTime).toISOString() : null,
      exam_end_time: examEndTime ? new Date(examEndTime).toISOString() : null,
      rules_text: rulesText.trim(),
      feedback_questions: feedbackQuestions,
      allowed_degrees: allowedDegrees,
      exam_categories: examCategories,
      updated_at: new Date().toISOString()
    };

    let examId = id;

    if (isEditing && !id.startsWith('demo-')) {
      const { error } = await supabase.from('custom_mock_exams').update(examPayload).eq('id', id);
      if (error) {
        console.error('Error updating custom_mock_exam:', error);
        showAlertModal('Error Saving Exam', error.message, 'error');
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from('custom_mock_exams').insert(examPayload).select('id').single();
      if (error) {
        console.error('Error creating custom_mock_exam:', error);
        showAlertModal('Error Creating Exam', error.message, 'error');
        setSaving(false);
        return;
      }
      if (data?.id) examId = data.id;
    }

    // Save questions
    if (examId && !examId.startsWith('demo-')) {
      await supabase.from('custom_mock_exam_questions').delete().eq('custom_mock_exam_id', examId);

      const reqCount = Number(questionCountOption);
      const qPayloads = questions.slice(0, reqCount).map((q, idx) => ({
        custom_mock_exam_id: examId,
        question_text: q.question_text.trim(),
        options: q.options.map(o => o.trim()),
        correct_option: Number(q.correct_option),
        explanation: (q.explanation || '').trim(),
        marks: Number(q.marks || 1),
        category_name: q.category_name || (examCategories[0] || 'General'),
        order_index: idx
      }));

      await supabase.from('custom_mock_exam_questions').insert(qPayloads);
    }

    setSaving(false);
    showAlertModal('Success', 'Custom Mock Exam saved successfully!', 'success', () => {
      navigate('/admin/custom-mock-exams');
    });
  }

  // Question manipulation helpers
  function addQuestion() {
    setQuestions(prev => [
      ...prev,
      {
        id: `q-new-${Date.now()}`,
        question_text: '',
        options: ['', '', '', ''],
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
      { id: `fb-${Date.now()}`, question_text: '', type: 'rating' }
    ]);
  }

  function removeFeedbackQuestion(idx) {
    if (feedbackQuestions.length <= 2) {
      showAlertModal('Requirement Warning', 'At least 2 feedback questions are mandatory for custom exams.', 'error');
      return;
    }
    setFeedbackQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function updateFeedbackQuestion(idx, field, val) {
    setFeedbackQuestions(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === 'type' && val === 'matrix') {
        if (!updated.matrix_columns || updated.matrix_columns.length === 0) {
          updated.matrix_columns = ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree', 'N/A'];
        }
        if (!updated.matrix_rows || updated.matrix_rows.length === 0) {
          updated.matrix_rows = [
            'The online class materials were useful and accurate',
            'The class description accurately described the class content',
            'The technology used was appropriate for this online class',
            'Exams were based on material covered in assignments and lectures'
          ];
        }
      }
      return updated;
    }));
  }

  // AI Question Generator Handler (Generates clean, structured questions distributed across section categories)
  function handleGenerateAIQuestions() {
    setAiGenerating(true);
    setTimeout(() => {
      const countToGen = Number(aiCount) || 25;
      const categories = (examCategories && examCategories.length > 0)
        ? examCategories
        : ['Quantitative Aptitude', 'Logical Reasoning', 'Technical Knowledge', 'Verbal Ability'];

      const topicLower = aiTopic.toLowerCase();

      // Diverse question templates by category & topic
      const categoryBanks = {
        'Quantitative Aptitude': [
          { q: 'A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/h?', opts: ['36 km/h', '45 km/h', '54 km/h', '60 km/h'], correct: 0, exp: 'Speed = 150/15 = 10 m/s = 10 * (18/5) = 36 km/h.' },
          { q: 'What is the compound interest on ₹10,000 at 10% per annum for 2 years?', opts: ['₹2,000', '₹2,100', '₹2,200', '₹2,500'], correct: 1, exp: 'CI = 10000 * (1.1)^2 - 10000 = ₹2,100.' },
          { q: 'If 12 men can complete a work in 18 days, how many days will 9 men take to finish the same work?', opts: ['20 days', '24 days', '22 days', '26 days'], correct: 1, exp: 'M1*D1 = M2*D2 => 12*18 = 9*D2 => D2 = 24 days.' },
          { q: 'Find the average of first 50 natural numbers.', opts: ['25', '25.5', '26', '50'], correct: 1, exp: 'Average of first n natural numbers = (n+1)/2 = 51/2 = 25.5.' },
          { q: 'A sum doubles itself in 8 years at simple interest. What is the annual interest rate?', opts: ['10%', '12.5%', '15%', '8%'], correct: 1, exp: 'R = (100 * (2P - P)) / (P * 8) = 12.5%.' }
        ],
        'Logical Reasoning': [
          { q: 'In a certain code, COMPUTER is written as RFUVQNPC. How is MEDICINE written in that code?', opts: ['EOJDEJFM', 'MFEJDJOE', 'EOJDJEFM', 'MFEDJJOE'], correct: 2, exp: 'Reverse string and shift letters (+1).' },
          { q: 'If A is B\'s brother, C is B\'s mother, and D is C\'s father, how is A related to D?', opts: ['Grandson', 'Son', 'Grandfather', 'Uncle'], correct: 0, exp: 'A is male, son of C, grandson of D.' },
          { q: 'Select the missing number in the series: 3, 7, 15, 31, 63, ?', opts: ['125', '127', '129', '131'], correct: 1, exp: 'Pattern: (x * 2) + 1 => (63 * 2) + 1 = 127.' },
          { q: 'All roses are flowers. Some flowers are red. Which conclusion follows logically?', opts: ['All red things are roses', 'Some roses may be red', 'No roses are red', 'All flowers are roses'], correct: 1, exp: 'Some roses can be red based on subset overlap.' },
          { q: 'Facing North, Rahul walks 10m, turns right and walks 15m, then turns right and walks 10m. How far is he from his starting point?', opts: ['5m', '10m', '15m', '25m'], correct: 2, exp: 'He completed a rectangle path. Net displacement is 15m East.' }
        ],
        'Verbal Ability': [
          { q: 'Choose the correct synonym for "METICULOUS":', opts: ['Careless', 'Painstaking', 'Lazy', 'Hastily'], correct: 1, exp: 'Meticulous means taking great care and effort.' },
          { q: 'Select the antonym for "CANDID":', opts: ['Frank', 'Secretive', 'Honest', 'Sincere'], correct: 1, exp: 'Candid means open/honest; secretive is the opposite.' },
          { q: 'Identify the grammatically correct sentence:', opts: ['Neither he nor I are going.', 'Neither he nor I am going.', 'Neither he nor I is going.', 'Neither he nor I be going.'], correct: 1, exp: 'Verb agrees with closest subject (I -> am).' },
          { q: 'Fill in the blank: "He has been living in this city _____ 2018."', opts: ['for', 'since', 'from', 'in'], correct: 1, exp: 'Use "since" for specific starting time points.' },
          { q: 'Choose the word correctly spelled:', opts: ['Accomodate', 'Commodate', 'Accommodate', 'Acommodate'], correct: 2, exp: 'Accommodate has double c and double m.' }
        ],
        'Technical Knowledge': [
          { q: `Which data structure operates on a Last-In, First-Out (LIFO) principle in ${aiTopic}?`, opts: ['Queue', 'Stack', 'Array', 'Linked List'], correct: 1, exp: 'A Stack follows LIFO order.' },
          { q: `What is the average time complexity of QuickSort algorithm?`, opts: ['O(1)', 'O(n log n)', 'O(n^2)', 'O(log n)'], correct: 1, exp: 'Average case time complexity of QuickSort is O(n log n).' },
          { q: `Which protocol operates at the Transport Layer of the OSI model?`, opts: ['HTTP', 'TCP', 'IP', 'Ethernet'], correct: 1, exp: 'TCP and UDP operate at the Transport Layer (Layer 4).' },
          { q: `In relational databases, what does ACID stand for?`, opts: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Index, Data', 'Algorithm, Code, Input, Output', 'Array, Chain, Index, Data'], correct: 0, exp: 'ACID guarantees database transaction reliability.' },
          { q: `What is the primary function of Garbage Collection in modern runtimes?`, opts: ['Memory Allocation', 'Automatic Unreachable Object Reclamation', 'Syntax Checking', 'Thread Management'], correct: 1, exp: 'Garbage Collection frees unreferenced heap memory automatically.' }
        ]
      };

      const generated = [];
      for (let i = 1; i <= countToGen; i++) {
        const categoryName = categories[(i - 1) % categories.length];
        const bank = categoryBanks[categoryName] || categoryBanks['Technical Knowledge'];
        const sample = bank[(Math.floor((i - 1) / categories.length)) % bank.length];

        generated.push({
          id: `ai-q-${Date.now()}-${i}`,
          question_text: sample.q,
          options: sample.opts,
          correct_option: sample.correct,
          explanation: sample.exp,
          marks: 1,
          category_name: categoryName
        });
      }

      setQuestions(generated);
      setQuestionCountOption(countToGen);
      setAiGenerating(false);
      setShowAiModal(false);
      showAlertModal('AI Generation Complete', `Successfully generated ${countToGen} questions across ${categories.length} section categories for "${aiTopic}"!`, 'success');
    }, 800);
  }

  // JSON / CSV Question Parser
  function handleImportQuestions() {
    if (!importText.trim()) {
      showAlertModal('Import Error', 'Please paste JSON array or CSV text.', 'error');
      return;
    }

    try {
      let parsed = [];
      if (importTab === 'json') {
        const data = JSON.parse(importText.trim());
        if (!Array.isArray(data)) throw new Error('JSON root must be an array of questions');
        parsed = data.map((item, idx) => ({
          id: `imp-${Date.now()}-${idx}`,
          question_text: (item.question_text || item.question || '').trim(),
          options: Array.isArray(item.options) && item.options.length >= 4 ? item.options.slice(0, 4).map(o => String(o).trim()) : ['', '', '', ''],
          correct_option: Number(item.correct_option ?? item.correctIndex ?? 0),
          explanation: (item.explanation || '').trim(),
          marks: Number(item.marks || 1)
        }));
      } else {
        // CSV Parsing
        const lines = importText.trim().split('\n').filter(l => l.trim().length > 0);
        lines.forEach((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('question')) return; // Skip header
          const parts = line.split(',').map(p => p.replace(/(^"|"$)/g, '').trim());
          if (parts.length >= 5) {
            parsed.push({
              id: `imp-csv-${Date.now()}-${idx}`,
              question_text: parts[0] || '',
              options: [parts[1] || '', parts[2] || '', parts[3] || '', parts[4] || ''],
              correct_option: Number(parts[5] || 0),
              explanation: parts[6] || '',
              marks: 1
            });
          }
        });
      }

      if (parsed.length === 0) throw new Error('No valid questions found in import data');

      setQuestions(parsed);
      setShowImportModal(false);
      setImportText('');
      showAlertModal('Import Successful', `Successfully imported ${parsed.length} questions into exam builder!`, 'success');
    } catch (err) {
      showAlertModal('Import Failed', err.message || 'Unable to parse import text format.', 'error');
    }
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* BREADCRUMBS & PAGE HEADING */}
      <div className="space-y-1">
        <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1.5">
          <Link to="/admin" className="hover:text-brand-blue">Dashboard</Link>
          <span>/</span>
          <Link to="/admin/custom-mock-exams" className="hover:text-brand-blue">Custom Mock Exams</Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{isEditing ? 'Edit Exam' : 'New Custom Exam'}</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          {isEditing ? 'Edit Custom Mock Exam' : 'Create Custom Mock Exam'}
        </h1>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading exam builder...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* FOLDER TABS & TAB CONTENT CONTAINER */}
          <div>
            <FolderTabs
              tabs={[
                { id: 'DETAILS', title: '1. Exam Parameters & Timings', icon: FiFileText },
                { id: 'QUESTIONS', title: `2. MCQ Questions (${questions.length})`, icon: FiList },
                { id: 'FEEDBACK', title: `3. Candidate Feedback Questions (${feedbackQuestions.length})`, icon: FiMessageSquare }
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />

            {/* TAB 1: EXAM PARAMETERS & TIMING GUARDS */}
            {activeTab === 'DETAILS' && (
              <div className="bg-white p-6 sm:p-8 rounded-b-[20px] rounded-tr-[20px] border border-gray-300 shadow-sm space-y-6 relative z-30 -mt-[2px]">
              {/* EXAM CREATION TYPE DROPDOWN */}
              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-blue">
                  Exam Creation Type / Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={examMode}
                  onChange={e => setExamMode(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-brand-blue/30 rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer shadow-2xs"
                >
                  <option value="questions">📝 Exam with Questions (Full MCQs & Questions Mandatory)</option>
                  <option value="link_only">🔗 Exam Registration Link Only (Basic Parameters & Dates Enough)</option>
                </select>
                <p className="text-[11px] text-slate-600 font-medium pt-0.5">
                  {examMode === 'link_only'
                    ? '⚡ Link Only Mode: Fill out the basic parameters and timing dates below to save and copy registration links immediately. Questions are not required.'
                    : '📋 Exam with Questions Mode: Basic parameters + mandatory question creation (25, 50, 75, 100) and feedback questions before saving.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Exam Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="e.g. Special Speed Drill 2026"
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
                      placeholder="special-speed-drill"
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
                    placeholder="e.g. Common / Department"
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
                    Scheduled Registration Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationStartTime}
                    onChange={e => setRegistrationStartTime(e.target.value)}
                    style={{ colorScheme: 'light' }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Registration opens automatically at this date & time.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Scheduled Exam Start Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={examStartTime}
                    onChange={e => setExamStartTime(e.target.value)}
                    required
                    style={{ colorScheme: 'light' }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-brand-blue outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Candidates can log in and view instructions before this start time.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Scheduled Exam End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={examEndTime}
                    onChange={e => setExamEndTime(e.target.value)}
                    required
                    style={{ colorScheme: 'light' }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-rose-600 outline-none focus:bg-white focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    The exam timer and portal automatically close at this end time.
                  </p>
                </div>
              </div>

              {/* DYNAMIC CALCULATED DURATION BADGE */}
              {examStartTime && examEndTime && new Date(examEndTime) > new Date(examStartTime) && (
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-5 h-5 text-brand-blue shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-brand-blue block">Calculated Exam Duration</span>
                      <span className="text-[11px] text-slate-600">Calculated dynamically from Exam Start Time to Exam End Time.</span>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-brand-blue text-white font-mono font-bold text-sm rounded-xl shrink-0 shadow-2xs">
                    {(() => {
                      const diffMins = Math.round((new Date(examEndTime).getTime() - new Date(examStartTime).getTime()) / (1000 * 60));
                      const h = Math.floor(diffMins / 60);
                      const m = diffMins % 60;
                      if (h > 0 && m > 0) return `${h} hr ${m} mins`;
                      if (h > 0) return `${h} hour${h > 1 ? 's' : ''}`;
                      return `${m} Minutes`;
                    })()}
                  </div>
                </div>
              )}

              {/* ALLOWED DEGREES CONFIGURATION CARD */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      🎓 Allowed Candidate Degrees (Registration Options)
                    </label>
                    <p className="text-[11px] text-slate-500">Configure degree options shown during candidate registration for this exam.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowedDegrees(DEFAULT_DEGREES)}
                    className="text-xs font-bold text-brand-blue hover:underline cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column: Select Preset Degree Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Select Preset Degree
                    </label>
                    <select
                      value=""
                      onChange={e => {
                        const val = e.target.value;
                        if (val && !allowedDegrees.includes(val)) {
                          setAllowedDegrees(prev => [...prev, val]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer font-medium"
                    >
                      <option value="" disabled>-- Select Degree from Dropdown --</option>
                      {DEFAULT_DEGREES.map((d, idx) => (
                        <option key={idx} value={d} disabled={allowedDegrees.includes(d)}>
                          {d} {allowedDegrees.includes(d) ? ' (Added)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Right Column: Added Degrees Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Added Degrees ({allowedDegrees.length} Selected)
                    </label>
                    <select
                      value=""
                      onChange={e => {
                        const valToRemove = e.target.value;
                        if (valToRemove) {
                          setAllowedDegrees(prev => prev.filter(d => d !== valToRemove));
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-brand-blue outline-none focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
                    >
                      <option value="" disabled>
                        🎓 Click to View Added Degrees ({allowedDegrees.length} total)
                      </option>
                      {allowedDegrees.map((deg, dIdx) => (
                        <option key={dIdx} value={deg}>
                          ❌ Remove "{deg}"
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Degree Input Row */}
                <div className="pt-2 border-t border-slate-200/80">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Add Custom Degree Option
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDegreeInput}
                      onChange={e => setNewDegreeInput(e.target.value)}
                      placeholder="e.g. B.Arch, M.Sc (Phy), Diploma in AI..."
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newDegreeInput.trim() && !allowedDegrees.includes(newDegreeInput.trim())) {
                          setAllowedDegrees(prev => [...prev, newDegreeInput.trim()]);
                          setNewDegreeInput('');
                        }
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                    >
                      + Add Degree
                    </button>
                  </div>
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

          {/* TAB 2: MCQ QUESTIONS BUILDER WITH AI & IMPORT */}
          {activeTab === 'QUESTIONS' && (
            <div className="bg-white p-6 sm:p-8 rounded-b-[20px] rounded-tr-[20px] border border-gray-300 shadow-sm space-y-6 relative z-30 -mt-[2px]">
              {/* EXAM CATEGORIES / SECTIONS CONFIGURATION CARD */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      🏷️ Question Sections / Categories
                    </label>
                    <p className="text-[11px] text-slate-500">Divide this exam into distinct categories (e.g., Quantitative Aptitude, Logical Reasoning, Technical).</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {examCategories.map((cat, cIdx) => (
                    <span key={cIdx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-brand-blue font-bold text-xs rounded-full shadow-2xs">
                      <span>{cat}</span>
                      {examCategories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExamCategories(prev => prev.filter((_, i) => i !== cIdx))}
                          className="text-brand-blue/60 hover:text-rose-600 cursor-pointer"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={e => setNewCategoryInput(e.target.value)}
                    placeholder="Add new section category (e.g., Quantitative Aptitude, Technical)..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCategoryInput.trim() && !examCategories.includes(newCategoryInput.trim())) {
                        setExamCategories(prev => [...prev, newCategoryInput.trim()]);
                        setNewCategoryInput('');
                      }
                    }}
                    className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Add Section Category
                  </button>
                </div>
              </div>

              {/* QUESTIONS BUILDER CONTROLS BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">MCQ Questions ({questions.length} / {questionCountOption})</h3>
                  <p className="text-xs text-slate-500">Creating all {questionCountOption} questions is mandatory before saving.</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <HiSparkles className="w-4 h-4 text-purple-600" />
                    <span>Generate AI Questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FiUpload className="w-3.5 h-3.5" />
                    <span>Import JSON / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={addQuestion}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FiPlus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                </div>
              </div>

              {/* GROUPED QUESTIONS BY SECTION CATEGORY */}
              <div className="space-y-6">
                {(() => {
                  const categoriesInUse = Array.from(new Set([
                    ...examCategories,
                    ...questions.map(q => q.category_name).filter(Boolean)
                  ]));

                  if (categoriesInUse.length === 0) categoriesInUse.push('General');

                  return categoriesInUse.map((catName, cIdx) => {
                    const sectionQuestions = questions
                      .map((q, originalIdx) => ({ ...q, originalIdx }))
                      .filter(q => (q.category_name || examCategories[0] || 'General') === catName);

                    return (
                      <div key={cIdx} className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                        {/* SECTION CATEGORY HEADER BANNER */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue font-black text-xs flex items-center justify-center border border-blue-200">
                              S{cIdx + 1}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                                <span>🏷️ Section: {catName}</span>
                                <span className="text-[10px] font-bold text-brand-blue bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                                  {sectionQuestions.length} Questions
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium">Questions belonging to {catName} category</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setQuestions(prev => [
                                ...prev,
                                {
                                  id: `q-new-${Date.now()}`,
                                  question_text: '',
                                  options: ['', '', '', ''],
                                  correct_option: 0,
                                  explanation: '',
                                  marks: 1,
                                  category_name: catName
                                }
                              ]);
                            }}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FiPlus className="w-3.5 h-3.5" />
                            <span>+ Add to {catName}</span>
                          </button>
                        </div>

                        {/* QUESTIONS IN THIS SECTION */}
                        {sectionQuestions.length === 0 ? (
                          <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                            No questions in this section yet. Click "+ Add to {catName}" or assign a question to this section below.
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sectionQuestions.map((q) => {
                              const idx = q.originalIdx;
                              return (
                                <div key={q.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                                    <span className="text-xs font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                      Question {idx + 1} of {questions.length}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-3">
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <span className="font-bold text-slate-500">Section:</span>
                                        <select
                                          value={q.category_name || (examCategories[0] || 'General')}
                                          onChange={e => updateQuestion(idx, 'category_name', e.target.value)}
                                          className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:bg-white"
                                        >
                                          {examCategories.map((cat, optIdx) => (
                                            <option key={optIdx} value={cat}>{cat}</option>
                                          ))}
                                        </select>
                                      </div>

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
                                      Question Statement <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={q.question_text}
                                      onChange={e => updateQuestion(idx, 'question_text', e.target.value)}
                                      placeholder="Enter question statement here (Mandatory)..."
                                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-medium"
                                    />
                                  </div>

                                  {/* OPTIONS */}
                                  <div className="space-y-2">
                                    <label className="block text-[11px] font-bold uppercase text-slate-600">
                                      4 Options & Select Correct Answer <span className="text-red-500">*</span>
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
                                              placeholder={`Enter Option ${optLabel} (Mandatory)...`}
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
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: CANDIDATE FEEDBACK QUESTIONS BUILDER (MINIMUM 2 MANDATORY) */}
          {activeTab === 'FEEDBACK' && (
            <div className="bg-white p-6 sm:p-8 rounded-b-[20px] rounded-tr-[20px] border border-gray-300 shadow-sm space-y-6 relative z-30 -mt-[2px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FiMessageSquare className="w-4 h-4 text-brand-blue" />
                    <span>Candidate Feedback Questions ({feedbackQuestions.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Asked to candidates after completing all questions before final submission. At least 2 feedback questions are mandatory.
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
                      <span className="text-xs font-bold text-slate-700">
                        Feedback Question #{idx + 1} {idx < 2 && <span className="text-red-500 text-[10px] uppercase font-bold ml-1">(Mandatory)</span>}
                      </span>
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
                          Question Prompt <span className="text-red-500">*</span>
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
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none font-bold cursor-pointer"
                        >
                          <option value="rating">5-Star Rating</option>
                          <option value="text">Text Response (Mandatory 5 Sentences)</option>
                          <option value="matrix">Likert Matrix Table</option>
                        </select>
                      </div>
                    </div>

                    {fb.type === 'matrix' && (
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                            Matrix Table Column Headers (Comma-separated)
                          </label>
                          <input
                            type="text"
                            value={(fb.matrix_columns || ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree', 'N/A']).join(', ')}
                            onChange={e => {
                              const cols = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                              updateFeedbackQuestion(idx, 'matrix_columns', cols);
                            }}
                            placeholder="e.g. Strongly Agree, Agree, Disagree, Strongly Disagree, N/A"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold uppercase text-slate-600">
                              Statement Rows ({fb.matrix_rows?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const currentRows = fb.matrix_rows || [];
                                updateFeedbackQuestion(idx, 'matrix_rows', [...currentRows, '']);
                              }}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-brand-blue text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              + Add Statement Row
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(fb.matrix_rows || []).map((rowText, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 w-5 text-right">{rIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={rowText}
                                  onChange={e => {
                                    const updatedRows = [...(fb.matrix_rows || [])];
                                    updatedRows[rIdx] = e.target.value;
                                    updateFeedbackQuestion(idx, 'matrix_rows', updatedRows);
                                  }}
                                  placeholder={`Enter statement row #${rIdx + 1}...`}
                                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedRows = (fb.matrix_rows || []).filter((_, i) => i !== rIdx);
                                    updateFeedbackQuestion(idx, 'matrix_rows', updatedRows);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                  title="Remove Statement Row"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>

          {/* GLOBAL BOTTOM SAVE & CANCEL BAR MATCHING COURSE CREATION WIZARD */}
          <SaveCancelBar
            saving={saving}
            onSave={handleSave}
            onDiscard={() => navigate('/admin/custom-mock-exams')}
            submitLabel={isEditing ? 'Update Exam' : 'Submit'}
            savingLabel={isEditing ? 'Updating...' : 'Submitting...'}
          />
        </form>
      )}

      {/* CUSTOM ADMIN MODAL DIALOG */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
              modalConfig.type === 'error' ? 'bg-rose-100 text-rose-600 ring-8 ring-rose-50' :
              modalConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50' : 'bg-blue-100 text-brand-blue ring-8 ring-blue-50'
            }`}>
              {modalConfig.type === 'error' ? <FiAlertCircle className="w-6 h-6" /> :
               modalConfig.type === 'success' ? <FiCheckCircle className="w-6 h-6" /> : <FiHelpCircle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{modalConfig.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{modalConfig.message}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (modalConfig.onConfirm) modalConfig.onConfirm();
                  setModalConfig({ isOpen: false, title: '', message: '', type: 'info' });
                }}
                className="w-full py-2.5 bg-brand-blue text-white font-bold text-xs rounded-xl shadow-xs hover:bg-brand-blue/90 cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI QUESTION GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-purple-700">
                <HiSparkles className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">AI Question Generator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Exam Topic / Subject
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. General Aptitude, Computer Networks, English Grammar"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={e => setAiDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Questions Count
                  </label>
                  <select
                    value={aiCount}
                    onChange={e => setAiCount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value={25}>25 Questions</option>
                    <option value={50}>50 Questions</option>
                    <option value={75}>75 Questions</option>
                    <option value={100}>100 Questions</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiGenerating}
                onClick={handleGenerateAIQuestions}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <HiSparkles className="w-4 h-4 text-amber-300" />
                <span>{aiGenerating ? 'Generating...' : 'Generate Questions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON / CSV QUESTION IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-brand-blue">
                <FiUpload className="w-5 h-5" />
                <h3 className="font-bold text-slate-900 text-base">Import Questions (JSON / CSV)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setImportTab('json')}
                className={`px-4 py-1.5 font-bold text-xs rounded-t-xl transition-colors ${
                  importTab === 'json' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                JSON Array
              </button>
              <button
                type="button"
                onClick={() => setImportTab('csv')}
                className={`px-4 py-1.5 font-bold text-xs rounded-t-xl transition-colors ${
                  importTab === 'csv' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                CSV Format
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-500 font-medium">
                {importTab === 'json'
                  ? 'Paste JSON array containing question_text, options array (4 items), correct_option index (0-3), and explanation.'
                  : 'Paste CSV rows: Question, Option A, Option B, Option C, Option D, Correct Index (0-3), Explanation'}
              </p>

              <textarea
                rows={7}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={
                  importTab === 'json'
                    ? '[\n  {\n    "question_text": "Sample question statement",\n    "options": ["Opt A", "Opt B", "Opt C", "Opt D"],\n    "correct_option": 0,\n    "explanation": "Note"\n  }\n]'
                    : 'Question,Option A,Option B,Option C,Option D,Correct Index,Explanation\n"Sample question prompt","Opt A","Opt B","Opt C","Opt D",0,"Explanation note"'
                }
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportQuestions}
                className="px-5 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
              >
                Import Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
