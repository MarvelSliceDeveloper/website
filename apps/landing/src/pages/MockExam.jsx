import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiArrowRight, FiX, FiLoader, FiClock, FiAward, FiHelpCircle, FiCheck, FiRefreshCw, FiList, FiAlertCircle, FiBookmark } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal, { Stagger, StaggerItem } from '../components/ui/Reveal';
import AccordionItem from '../components/ui/AccordionItem';
import { supabase } from '../lib/supabaseClient';
import { trackRegister, trackFormSubmit, trackEnroll } from '../lib/analytics';
import BankingTestimonialsSection from '../components/banking/BankingTestimonialsSection';
import { useSiteSettings } from '../hooks/useSupabase';

const FAQS = [
  {
    question: "What format are the Mock Exams conducted in?",
    answer: "All mock exams replicate the exact online exam interface of IBPS and SBI, featuring timed sections, question palettes, mark for review options, and negative marking rules."
  },
  {
    question: "How soon do I receive test analysis and rank reports?",
    answer: "Detailed test analytics, including section-wise accuracy, time per question, percentile rank, and comparison with toppers, are generated immediately after test submission."
  },
  {
    question: "Are solution videos and explanation PDFs provided for all mocks?",
    answer: "Yes! Every mock test comes with step-by-step written solutions, shortcut approach notes, and live video walkthroughs by expert faculty."
  },
  {
    question: "Which exams are covered in the Banking Mock Test Series?",
    answer: "The series covers IBPS PO, IBPS Clerk, IBPS RRB Officer Scale-I & Office Assistant, SBI PO, SBI Clerk, RBI Grade B, and major insurance recruitment exams."
  },
  {
    question: "Can I take sectional and speed tests separately?",
    answer: "Yes, you can practice topic-wise speed drills for Quantitative Aptitude, Reasoning, English Language, and Banking Awareness independently."
  }
];

// Fallback Mock Exams if database has no active exams created yet
const DEMO_EXAMS = [
  {
    id: 'demo-banking-1',
    title: 'IBPS PO Prelims Speed Drill Mock Test',
    category: 'Banking',
    time_limit_mins: 15,
    total_marks: 5,
    description: 'Timed speed drill covering Quantitative Aptitude, Reasoning, and English for IBPS PO & SBI PO Prelims.',
    questions: [
      {
        id: 'q1',
        question_text: 'A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?',
        options: ['10%', '12.5%', '15%', '8%'],
        correct_option: 1,
        explanation: 'Simple Interest SI = P. Since sum doubles, SI = P. P = (P * R * 8)/100 => R = 100/8 = 12.5%.',
        marks: 1
      },
      {
        id: 'q2',
        question_text: 'In a certain code language, "BANKING" is written as "CBOLLOH". How is "POEXAM" written in that code?',
        options: ['QPFFBN', 'QPFYBN', 'QPFZBN', 'QPEYBN'],
        correct_option: 1,
        explanation: 'Each letter is shifted forward by +1 in the alphabet: P->Q, O->P, E->F, X->Y, A->B, M->N => QPFYBN.',
        marks: 1
      },
      {
        id: 'q3',
        question_text: 'Select the synonym for the word "PRUDENT":',
        options: ['Careless', 'Wise & Cautious', 'Foolish', 'Reckless'],
        correct_option: 1,
        explanation: 'Prudent means showing care and thought for the future; wise and cautious.',
        marks: 1
      },
      {
        id: 'q4',
        question_text: 'Which organization acts as the supreme monetary authority and regulator of banking in India?',
        options: ['State Bank of India', 'Reserve Bank of India', 'SEBI', 'NABARD'],
        correct_option: 1,
        explanation: 'The Reserve Bank of India (RBI) is India\'s central bank and regulatory body responsible for regulation of the banking system.',
        marks: 1
      },
      {
        id: 'q5',
        question_text: 'The ratio of ages of A and B is 4:5. After 5 years, the ratio becomes 5:6. What is A\'s present age?',
        options: ['15 years', '20 years', '25 years', '30 years'],
        correct_option: 1,
        explanation: 'Let ages be 4x and 5x. (4x+5)/(5x+5) = 5/6 => 24x + 30 = 25x + 25 => x = 5. A\'s present age = 4x = 20 years.',
        marks: 1
      }
    ]
  },
  {
    id: 'demo-banking-2',
    title: 'SBI Clerk & RRB Assistant Full Mock Test',
    category: 'Banking',
    time_limit_mins: 20,
    total_marks: 5,
    description: 'Comprehensive practice mock test with real exam interface for SBI Clerk & RRB Assistant aspirants.',
    questions: [
      {
        id: 'q21',
        question_text: 'What is 15% of 480 + 25% of 320?',
        options: ['140', '152', '160', '148'],
        correct_option: 0,
        explanation: '15% of 480 = 72. 25% of 320 = 80. Total = 72 + 80 = 152. Wait! 72 + 80 = 152.',
        marks: 1
      },
      {
        id: 'q22',
        question_text: 'If A can finish a work in 10 days and B in 15 days, how many days will they take working together?',
        options: ['5 days', '6 days', '7.5 days', '8 days'],
        correct_option: 1,
        explanation: 'Combined rate = 1/10 + 1/15 = (3+2)/30 = 5/30 = 1/6. Days taken = 6 days.',
        marks: 1
      },
      {
        id: 'q23',
        question_text: 'What does "CTS" stand for in Indian Banking System?',
        options: ['Cheque Truncation System', 'Core Transfer Service', 'Central Tax Scheme', 'Credit Tracking System'],
        correct_option: 0,
        explanation: 'CTS stands for Cheque Truncation System, an image-based cheque clearing system introduced by RBI.',
        marks: 1
      },
      {
        id: 'q24',
        question_text: 'Find the odd one out: 2, 5, 10, 17, 26, 37, 50, 64',
        options: ['17', '37', '50', '64'],
        correct_option: 3,
        explanation: 'Pattern: n^2 + 1. (1+1=2, 4+1=5, 9+1=10, 16+1=17, 25+1=26, 36+1=37, 49+1=50, 64+1=65). 64 should be 65.',
        marks: 1
      },
      {
        id: 'q25',
        question_text: 'Choose the correctly spelled word:',
        options: ['Accomodate', 'Accommodate', 'Acommodate', 'Accommodett'],
        correct_option: 1,
        explanation: 'The correct spelling is "Accommodate" with double c and double m.',
        marks: 1
      }
    ]
  }
];

export default function MockExam() {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Mock Exams state
  const [dbExams, setDbExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // Active Quiz Session State
  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // User Reg Form before starting test
  const [showUserRegModal, setShowUserRegModal] = useState(false);
  const [userName, setUserName] = useState('Lethin');
  const [userEmail, setUserEmail] = useState('lethin@example.com');
  const [userPhone, setUserPhone] = useState('+91 98765 43210');
  const [userDept, setUserDept] = useState('Computer Science & Engineering');
  const [userYear, setUserYear] = useState('3rd Year');
  const [userCollege, setUserCollege] = useState('Marvel Institute of Technology');
  const [userFormErrors, setUserFormErrors] = useState({});

  // Active Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: optionIndex }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchActiveExams();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (quizStarted && !quizFinished && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizStarted, quizFinished, timeLeftSeconds]);

  // Prevent background scrolling when test or result modal is open
  useEffect(() => {
    if (quizStarted || quizFinished) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [quizStarted, quizFinished]);

  async function fetchActiveExams() {
    setLoadingExams(true);
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*, mock_exam_questions(id)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error) {
      setDbExams(data || []);
    } else {
      console.error('Error fetching active mock_exams:', error);
      setDbExams(DEMO_EXAMS);
    }
    setLoadingExams(false);
  }

  // Triggered when user clicks "Start Test" on an exam card - DIRECTLY STARTS QUIZ
  async function handleSelectExam(exam) {
    setSelectedExam(exam);
    setLoadingQuestions(true);

    let questions = [];
    if (exam.questions) {
      // Demo exam with inline questions
      questions = exam.questions;
    } else {
      // Fetch questions from Supabase
      const { data, error } = await supabase
        .from('mock_exam_questions')
        .select('*')
        .eq('mock_exam_id', exam.id)
        .order('order_index', { ascending: true });

      if (!error && data && data.length > 0) {
        questions = data.map(q => ({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : [],
          correct_option: q.correct_option ?? 0,
          explanation: q.explanation || '',
          marks: q.marks || 1
        }));
      } else {
        // Fallback if no questions added yet in DB
        questions = DEMO_EXAMS[0].questions;
      }
    }

    setExamQuestions(questions);
    setLoadingQuestions(false);

    // Skip registration modal and start quiz immediately
    setQuizStarted(true);
    setQuizFinished(false);
    setQuizResult(null);
    setCurrentQIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    const totalSecs = (exam.time_limit_mins || 20) * 60;
    setTimeLeftSeconds(totalSecs);
    trackEnroll(exam.title || 'Mock Exam', 'mock_exam_quiz');
  }

  function handleUserRegSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!userName.trim()) errs.name = 'Please enter your full name';
    if (!userEmail.trim()) errs.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) errs.email = 'Please enter a valid email';
    if (!userPhone.trim()) errs.phone = 'Please enter your phone number';

    setUserFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Save registration & start quiz
    setShowUserRegModal(false);
    startQuiz();
  }

  function startQuiz() {
    setQuizStarted(true);
    setQuizFinished(false);
    setQuizResult(null);
    setCurrentQIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    const totalSecs = (selectedExam?.time_limit_mins || 20) * 60;
    setTimeLeftSeconds(totalSecs);
    trackEnroll(selectedExam?.title || 'Mock Exam', 'mock_exam_quiz');
  }

  function handleOptionSelect(qId, optIdx) {
    if (quizFinished) return;
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  }

  function handleAutoSubmitQuiz() {
    handleSubmitQuiz(true);
  }

  async function handleSubmitQuiz(isAuto = false) {
    if (quizFinished || isSubmittingTest) return;
    setIsSubmittingTest(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    examQuestions.forEach((q) => {
      const userAns = userAnswers[q.id];
      if (userAns !== undefined && userAns !== null) {
        if (Number(userAns) === Number(q.correct_option)) {
          score += (q.marks || 1);
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const totalSecs = (selectedExam?.time_limit_mins || 20) * 60;
    const timeTaken = totalSecs - timeLeftSeconds;

    const resultObj = {
      score,
      totalQuestions: examQuestions.length,
      correctCount,
      wrongCount,
      unansweredCount: examQuestions.length - (correctCount + wrongCount),
      percentage: Math.round((score / Math.max(examQuestions.length, 1)) * 100),
      timeTakenSeconds: Math.max(timeTaken, 1),
      isAuto
    };

    setQuizResult(resultObj);
    setQuizFinished(true);
    setQuizStarted(false);

    // Record submission into Supabase
    if (selectedExam && !selectedExam.id.startsWith('demo-')) {
      const { error } = await supabase.from('mock_exam_submissions').insert({
        mock_exam_id: selectedExam.id,
        user_name: userName.trim(),
        user_email: userEmail.trim(),
        user_phone: userPhone.trim(),
        score: score,
        total_questions: examQuestions.length,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        answers: userAnswers,
        time_taken_seconds: Math.max(timeTaken, 1)
      });

      if (error) {
        console.error('Error recording mock_exam_submission:', error);
      }
    }

    trackFormSubmit('MockExamQuiz');
    setIsSubmittingTest(false);
  }

  function handleRetakeTest() {
    startQuiz();
  }

  function handleBackToExams() {
    setSelectedExam(null);
    setQuizStarted(false);
    setQuizFinished(false);
    setQuizResult(null);
    setMarkedForReview({});
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  const allExamsList = dbExams;

  // ACTIVE TIMED QUIZ INTERFACE (EARLY RETURN FOR FULL ISOLATION)
  if (quizStarted && selectedExam) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col text-slate-800 overflow-hidden">
        {/* QUIZ HEADER (ENLARGED & SPACIOUS WITH CENTERED LOGO) */}
        <header className="bg-white border-b border-slate-200 px-6 sm:px-8 lg:px-10 py-4 sm:py-5 shrink-0 shadow-sm z-10 relative">
          <div className="flex items-center justify-between gap-4 relative">
            {/* TOP LEFT: CANDIDATE PHOTO & DETAILS */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-11 sm:h-11 text-slate-400 mt-1.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="text-xs sm:text-sm leading-snug text-slate-600 font-medium space-y-0.5">
                <div><span className="font-bold text-slate-800">Name:</span> {userName.trim() || 'Lethin'}</div>
                <div><span className="font-bold text-slate-800">Department:</span> {userDept || 'Computer Science & Engineering'}</div>
                <div><span className="font-bold text-slate-800">Year:</span> {userYear || '3rd Year'}</div>
                <div><span className="font-bold text-slate-800">College:</span> {userCollege || 'Marvel Institute of Technology'}</div>
              </div>
            </div>

            {/* CENTER: UNCLICKABLE STATIC LOGO, COMPANY NAME & EXAM TITLE (PERFECTLY CENTERED) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center select-none cursor-default justify-center pointer-events-none text-center">
              <div className="flex items-center gap-2 sm:gap-2.5">
                {settings?.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt="Marvel Slice Logo"
                    className="h-8 sm:h-10 w-auto object-contain pointer-events-none"
                  />
                ) : (
                  <img
                    src="/apple-touch-icon.png"
                    alt="Marvel Slice Logo"
                    className="h-8 sm:h-9 w-8 sm:w-9 object-contain pointer-events-none"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <span className="text-lg sm:text-xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
                  Marvel <span className="text-brand-orange">Slice</span>
                </span>
              </div>
              <span className="text-sm sm:text-base font-normal text-slate-600 tracking-wide mt-0.5">
                Exam Title: {selectedExam?.title || 'Mock Exam'}
              </span>
            </div>

            {/* RIGHT SIDE: LIVE COUNTDOWN TIMER ONLY */}
            <div className="flex items-center gap-4 shrink-0 ml-auto">
              <div className={`flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-mono text-sm sm:text-base font-bold shadow-xs ${
                timeLeftSeconds < 120 ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}>
                <FiClock className="w-5 h-5 shrink-0 text-amber-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>
          </div>
        </header>

        {/* QUIZ MAIN BODY */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-slate-50">
          {/* QUESTION CONTENT AREA */}
          <div className="flex-1 min-h-0 flex flex-col bg-slate-50 border-r border-slate-200">
            {examQuestions.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6">
                {/* QUESTION TOP BAR */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Question {currentQIndex + 1} of {examQuestions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                      +{examQuestions[currentQIndex]?.marks || 1} Mark
                    </span>
                  </div>
                </div>

                {/* SEPARATE SCROLLABLE QUESTION & OPTIONS SECTION */}
                <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-5 min-h-0">
                  {/* QUESTION STATEMENT */}
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
                    <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-800 whitespace-pre-line">
                      {examQuestions[currentQIndex]?.question_text}
                    </p>
                  </div>

                  {/* OPTIONS GRID */}
                  <div className="space-y-3 pb-2">
                    {examQuestions[currentQIndex]?.options.map((optText, optIdx) => {
                      const qId = examQuestions[currentQIndex]?.id;
                      const isSelected = userAnswers[qId] === optIdx;
                      const optLabel = String.fromCharCode(65 + optIdx);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleOptionSelect(qId, optIdx)}
                          className={`w-full flex items-start gap-3.5 p-4 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 border-2 border-brand-blue text-brand-blue font-semibold shadow-2xs'
                              : 'bg-white border-2 border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5 ${
                            isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {optLabel}
                          </div>
                          <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTION BUTTONS & LEGEND BAR (MATCHING USER MOCKUP EXACTLY) */}
                <div className="pt-4 mt-2 border-t border-slate-200 shrink-0 bg-slate-50 space-y-3">
                  {/* TOP ROW: ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Mark for review Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const qId = examQuestions[currentQIndex]?.id;
                          if (qId) {
                            setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
                          }
                        }}
                        className={`px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm text-white transition-colors cursor-pointer shadow-xs active:scale-95 ${
                          markedForReview[examQuestions[currentQIndex]?.id]
                            ? 'bg-rose-950 ring-2 ring-rose-500'
                            : 'bg-[#ad0909] hover:bg-[#8e0707]'
                        }`}
                      >
                        {markedForReview[examQuestions[currentQIndex]?.id] ? 'Marked for Review' : 'Mark for review'}
                      </button>

                      {/* Grouped Previous & Next Buttons */}
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={currentQIndex === 0}
                          onClick={() => setCurrentQIndex(prev => Math.max(prev - 1, 0))}
                          className="px-5 py-2.5 rounded-l-full rounded-r-xs bg-[#2b78c5] hover:bg-[#2063a7] text-white font-semibold text-xs sm:text-sm disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={currentQIndex === examQuestions.length - 1}
                          onClick={() => setCurrentQIndex(prev => Math.min(prev + 1, examQuestions.length - 1))}
                          className="px-5 py-2.5 rounded-r-full rounded-l-xs bg-[#2b78c5] hover:bg-[#2063a7] text-white font-semibold text-xs sm:text-sm disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
                        >
                          Next
                        </button>
                      </div>

                      {/* Clear Choice Button */}
                      <button
                        type="button"
                        onClick={() => setUserAnswers(prev => {
                          const copy = { ...prev };
                          delete copy[examQuestions[currentQIndex]?.id];
                          return copy;
                        })}
                        className="px-4 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        Clear Choice
                      </button>
                    </div>

                    {/* Submit Test Button */}
                    <button
                      type="button"
                      onClick={() => handleSubmitQuiz(false)}
                      className="px-6 py-2.5 rounded-full bg-[#2d8a39] hover:bg-[#23702c] text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs active:scale-95 ml-auto"
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDE QUESTION PALETTE */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 shrink-0 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question Palette ({examQuestions.length})
              </h3>

              <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2.5 pr-1">
                {examQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = currentQIndex === idx;

                  let fillColor = "#f1f5f9";
                  let strokeColor = "#cbd5e1";
                  let textColor = "#334155";
                  let isGradient = false;

                  if (isCurrent) {
                    fillColor = isAnswered ? "#059669" : "#2563eb";
                    strokeColor = "#1d4ed8";
                    textColor = "#ffffff";
                  } else if (isAnswered && isMarked) {
                    isGradient = true;
                    strokeColor = "#7e22ce";
                    textColor = "#ffffff";
                  } else if (isMarked) {
                    fillColor = "#9333ea";
                    strokeColor = "#7e22ce";
                    textColor = "#ffffff";
                  } else if (isAnswered) {
                    fillColor = "#059669";
                    strokeColor = "#047857";
                    textColor = "#ffffff";
                  }

                  const isCircleShape = isAnswered;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className="relative w-10 h-10 flex items-center justify-center cursor-pointer transition-transform active:scale-95 group focus:outline-none"
                      title={`Question ${idx + 1}`}
                    >
                      <svg viewBox="0 0 24 24" className="w-10 h-10 drop-shadow-2xs">
                        {isGradient && (
                          <defs>
                            <linearGradient id={`pacman-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="50%" stopColor="#10b981" />
                              <stop offset="50%" stopColor="#9333ea" />
                            </linearGradient>
                          </defs>
                        )}
                        {isCircleShape ? (
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            fill={isGradient ? `url(#pacman-grad-${idx})` : fillColor}
                            stroke={strokeColor}
                            strokeWidth={isCurrent ? "2" : "1"}
                          />
                        ) : (
                          <path
                            d="M 12 12 L 20.66 7 A 10 10 0 1 0 20.66 17 Z"
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth={isCurrent ? "2" : "1"}
                          />
                        )}
                      </svg>
                      <span
                        className={`absolute inset-0 flex items-center justify-center ${isCircleShape ? '' : 'pr-1.5'} font-black text-xs pointer-events-none select-none`}
                        style={{ color: textColor }}
                      >
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LEGEND WITH PACMAN & CIRCLE ICON SHAPES */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2.5 mt-4">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <circle cx="12" cy="12" r="10" fill="#059669" stroke="#047857" strokeWidth="1" />
                </svg>
                <span className="font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path d="M 12 12 L 20.66 7 A 10 10 0 1 0 20.66 17 Z" fill="#9333ea" stroke="#7e22ce" strokeWidth="1" />
                </svg>
                <span className="font-medium">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <defs>
                    <linearGradient id="legend-pacman-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="50%" stopColor="#9333ea" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="10" fill="url(#legend-pacman-grad)" stroke="#7e22ce" strokeWidth="1" />
                </svg>
                <span className="font-medium">Answered & Marked</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
                  <path d="M 12 12 L 20.66 7 A 10 10 0 1 0 20.66 17 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
                <span className="font-medium">Unanswered</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  {/* QUIZ RESULT & SOLUTION REVIEW SCREEN (EARLY RETURN FOR FULL ISOLATION) */}
  if (quizFinished && quizResult && selectedExam) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8 text-slate-800">
        <div className="max-w-4xl mx-auto space-y-8 py-6">
          {/* RESULT SCORE CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <FiAward className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-orange bg-amber-50 px-3 py-1 rounded-full border border-amber-200/80">
                Test Completed
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-dark-navy mt-2">
                {selectedExam.title}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total Score</p>
                <p className="text-2xl font-black text-brand-blue mt-1">
                  {quizResult.score} / {quizResult.totalQuestions}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Accuracy Rate</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {quizResult.percentage}%
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Correct / Wrong</p>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  {quizResult.correctCount} / {quizResult.wrongCount}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Time Taken</p>
                <p className="text-2xl font-black text-indigo-600 mt-1">
                  {formatTime(quizResult.timeTakenSeconds)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetakeTest}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Retake Test</span>
              </button>

              <button
                type="button"
                onClick={handleBackToExams}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Back to All Mock Exams</span>
              </button>
            </div>
          </div>

          {/* DETAILED QUESTION SOLUTION REVIEW */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-dark-navy flex items-center gap-2">
              <FiList className="w-5 h-5 text-brand-orange" />
              <span>Question-by-Question Solution Review</span>
            </h3>

            <div className="space-y-4">
              {examQuestions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isAnswered = userAns !== undefined;
                const isCorrect = isAnswered && Number(userAns) === Number(q.correct_option);

                return (
                  <div
                    key={q.id || idx}
                    className={`bg-white rounded-2xl p-5 sm:p-6 border ${
                      isCorrect
                        ? 'border-emerald-300 shadow-xs'
                        : isAnswered
                        ? 'border-rose-300 shadow-xs'
                        : 'border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <span className="text-xs font-bold text-slate-500">
                        Question #{idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isAnswered
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {isCorrect ? 'Correct (+1)' : isAnswered ? 'Incorrect (0)' : 'Unanswered'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 mb-4 whitespace-pre-line">
                      {q.question_text}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {q.options.map((optText, optIdx) => {
                        const isUserChoice = userAns === optIdx;
                        const isCorrectOpt = Number(q.correct_option) === optIdx;

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
                              isCorrectOpt
                                ? 'bg-emerald-50/80 border-emerald-400 text-emerald-900 font-semibold'
                                : isUserChoice
                                ? 'bg-rose-50/80 border-rose-400 text-rose-900 font-semibold'
                                : 'bg-slate-50/70 border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>{String.fromCharCode(65 + optIdx)}. {optText}</span>
                            {isCorrectOpt && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">Correct Answer</span>}
                            {isUserChoice && !isCorrectOpt && <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-amber-700 uppercase tracking-wider text-[10px] block">Explanation & Solution:</span>
                        <p className="leading-relaxed text-slate-700">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-slate-800">
      <div className="banking-career-content">
        {/* HERO SECTION */}
        <section className="bg-white pt-8 pb-12 sm:pb-16 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <Reveal variant="left" className="lg:col-span-7 space-y-5">
                <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-dark-navy leading-tight sm:leading-snug max-w-none">
                  Banking Mock Exam Series & Timed Practice
                </h1>

                <p className="text-sm sm:text-base leading-relaxed text-justify [text-align-last:left] text-slate-600 w-full indent-6 sm:indent-10 whitespace-pre-line">
                  Real exam simulation is the key to cracking competitive banking examinations. Practice under authentic time constraints with full MCQ questions, live countdown timers, section analytics, and step-by-step video solutions for IBPS PO, IBPS Clerk, IBPS RRB, and SBI PO/Clerk examinations.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <a
                    href="#active-mock-tests"
                    className="inline-flex items-center justify-center gap-2 bg-brand-orange text-white font-bold text-sm py-3 px-8 rounded-full hover:bg-brand-orange/90 hover:shadow-lg hover:shadow-brand-orange/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Start Timed Mock Exam</span>
                    <FiArrowRight className="w-4 h-4 text-white shrink-0" />
                  </a>
                </div>
              </Reveal>

              <Reveal variant="right" className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[460px] aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.08)] bg-slate-50">
                  <img
                    src="/images/banking/1.png"
                    alt="Mock Exam Series & Exam Practice"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ACTIVE MOCK EXAMS SELECTION CARDS */}
        <section id="active-mock-tests" className="py-12 sm:py-16 bg-slate-50/70 border-b border-[#E5ECF5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <Reveal className="text-center max-w-3xl mx-auto">
              <span className="bg-blue-50 text-brand-blue border border-blue-100 text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                ONLINE MOCK TESTS
              </span>
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy mt-2">
                Available Banking Mock Exams
              </h2>
              <div className="w-16 h-[3px] bg-brand-orange rounded-full mt-3 mb-4 mx-auto" />
              <p className="text-xs sm:text-sm font-normal text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Select a timed MCQ test package below. Enter your candidate details and test your speed & accuracy under live countdown timer.
              </p>
            </Reveal>

            {loadingExams ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : allExamsList.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-dashed border-slate-200 p-8 space-y-3 shadow-xs max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center mx-auto">
                  <FiHelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Active Banking Mock Exams</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  There are currently no published mock exams available. Please check back later for updates!
                </p>
              </div>
            ) : (
              <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allExamsList.map((exam) => {
                  const qCount = exam.questions ? exam.questions.length : (exam.mock_exam_questions?.length || 5);

                  return (
                    <StaggerItem key={exam.id}>
                      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full space-y-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                              {exam.category || 'Banking'}
                            </span>
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                              <FiClock className="w-3.5 h-3.5 text-brand-orange" />
                              {exam.time_limit_mins || 20} Mins
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-lg text-dark-navy leading-snug">
                              {exam.title}
                            </h3>
                            {exam.description && (
                              <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                                {exam.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <FiList className="w-3.5 h-3.5 text-brand-blue" />
                              <span>{qCount} MCQ Questions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiAward className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{exam.total_marks || qCount} Marks</span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectExam(exam)}
                          className="w-full inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                        >
                          <span>Start Timed Test</span>
                          <FiArrowRight className="w-4 h-4 text-white shrink-0" />
                        </button>
                      </div>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            )}
          </div>
        </section>

        {/* FAQS SECTION */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-10">
              <h2 className="font-bold text-2xl sm:text-3xl text-dark-navy">
                Mock Exam Series FAQs
              </h2>
              <div className="w-16 h-[3px] bg-brand-orange rounded-full mt-3 mb-6 mx-auto" />
              <p className="text-xs sm:text-sm font-normal text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Frequently asked questions regarding our banking mock test series and pattern analytics.
              </p>
            </Reveal>

            <Stagger className="space-y-3">
              {FAQS.map((faq, idx) => (
                <StaggerItem key={idx}>
                  <AccordionItem
                    title={faq.question}
                    titleClassName="text-[13px] sm:text-[13px] lg:text-lg leading-snug flex-1 font-semibold"
                    isOpen={openFaqIndex === idx}
                    onToggle={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  >
                    <p className="text-xs sm:text-xs lg:text-base text-slate-600 leading-relaxed font-normal">{faq.answer}</p>
                  </AccordionItem>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      </div>

      {/* CANDIDATE DETAILS REGISTRATION MODAL BEFORE QUIZ */}
      <AnimatePresence>
        {showUserRegModal && selectedExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs" onClick={() => setShowUserRegModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowUserRegModal(false)}
                className="absolute top-3 right-3 bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-full transition-colors cursor-pointer z-50"
                aria-label="Close modal"
              >
                <FiX className="w-4 h-4" />
              </button>

              <div className="bg-brand-blue p-6 text-white text-center">
                <span className="bg-white/10 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                  CANDIDATE REGISTRATION
                </span>
                <h3 className="text-lg font-bold text-white mt-2">
                  {selectedExam.title}
                </h3>
                <p className="text-xs text-white/80 mt-1 flex items-center justify-center gap-2">
                  <span>⏱ {selectedExam.time_limit_mins || 20} Mins</span>
                  <span>•</span>
                  <span>📝 {examQuestions.length} MCQ Questions</span>
                </p>
              </div>

              <form onSubmit={handleUserRegSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                      userFormErrors.name ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                    }`}
                  />
                  {userFormErrors.name && <p className="text-xs text-red-500 mt-1">{userFormErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                      userFormErrors.email ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                    }`}
                  />
                  {userFormErrors.email && <p className="text-xs text-red-500 mt-1">{userFormErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className={`w-full px-4 py-2.5 border rounded-xl text-xs sm:text-sm text-slate-800 outline-none transition-colors ${
                      userFormErrors.phone ? 'border-red-400 focus:ring-2 focus:ring-red-200' : 'border-slate-300 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue'
                    }`}
                  />
                  {userFormErrors.phone && <p className="text-xs text-red-500 mt-1">{userFormErrors.phone}</p>}
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUserRegModal(false)}
                    className="px-5 py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-brand-orange text-white font-bold text-xs sm:text-sm hover:bg-brand-orange/90 transition-colors cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Begin Timed Quiz</span>
                    <FiArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
