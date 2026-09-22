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
    category: 'Banking & Quantitative Aptitude',
    time_limit_mins: 15,
    total_marks: 10,
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
      },
      {
        id: 'q6',
        question_text: 'Two trains running in opposite directions cross a man standing on the platform in 27 seconds and 17 seconds respectively and they cross each other in 23 seconds. The ratio of their speeds is:',
        options: ['1 : 3', '3 : 2', '3 : 4', '2 : 3'],
        correct_option: 1,
        explanation: 'Let speeds be x and y. Distance = 27x and 17y. Relative speed = x+y. Time = (27x+17y)/(x+y) = 23 => 27x + 17y = 23x + 23y => 4x = 6y => x/y = 3/2.',
        marks: 1
      },
      {
        id: 'q7',
        question_text: 'Find the odd one out in the series: 3, 5, 11, 14, 17, 21',
        options: ['14', '17', '21', '11'],
        correct_option: 0,
        explanation: 'All numbers in the sequence except 14 are prime numbers.',
        marks: 1
      },
      {
        id: 'q8',
        question_text: 'What is the full form of NEFT in banking terms?',
        options: ['National Electronic Fund Transfer', 'National Efficient Fund Transaction', 'Net Electronic Financial Transfer', 'National Exchange Financial Technology'],
        correct_option: 0,
        explanation: 'NEFT stands for National Electronic Funds Transfer, a nation-wide payment system facilitating one-to-one funds transfer.',
        marks: 1
      },
      {
        id: 'q9',
        question_text: 'A dealer marks his goods 20% above cost price and allows a discount of 10%. Find his profit percentage.',
        options: ['8%', '10%', '12%', '15%'],
        correct_option: 0,
        explanation: 'Let CP = 100. MP = 120. SP = 120 * 0.9 = 108. Profit = 8%.',
        marks: 1
      },
      {
        id: 'q10',
        question_text: 'If 12 men or 18 women can do a piece of work in 14 days, then 8 men and 16 women can do the same work in how many days?',
        options: ['9 days', '8 days', '7 days', '10 days'],
        correct_option: 0,
        explanation: '12M = 18W => 2M = 3W. 8M + 16W = 12W + 16W = 28W. Time = (18 * 14) / 28 = 9 days.',
        marks: 1
      }
    ]
  },
  {
    id: 'demo-banking-2',
    title: 'SBI Clerk & RRB Assistant Full Mock Test',
    category: 'Banking & Quantitative Aptitude',
    time_limit_mins: 20,
    total_marks: 10,
    description: 'Comprehensive practice mock test with real exam interface for SBI Clerk & RRB Assistant aspirants.',
    questions: [
      {
        id: 'q21',
        question_text: 'What is 15% of 480 + 25% of 320?',
        options: ['140', '152', '160', '148'],
        correct_option: 0,
        explanation: '15% of 480 = 72. 25% of 320 = 80. Total = 72 + 80 = 152.',
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
      },
      {
        id: 'q26',
        question_text: 'In how many different ways can the letters of the word "LEADING" be arranged such that the vowels always come together?',
        options: ['360', '480', '720', '5040'],
        correct_option: 2,
        explanation: 'Vowels: E, A, I (3 vowels). Consonants: L, D, N, G (4 consonants). Treating 3 vowels as 1 unit gives 5 items (5! = 120). 3 vowels can be arranged in 3! = 6 ways. Total = 120 * 6 = 720.',
        marks: 1
      },
      {
        id: 'q27',
        question_text: 'A boat can travel at a speed of 13 km/hr in still water. If the speed of the stream is 4 km/hr, find the time taken by the boat to go 68 km downstream.',
        options: ['4 hours', '5 hours', '6 hours', '3.5 hours'],
        correct_option: 0,
        explanation: 'Downstream speed = 13 + 4 = 17 km/hr. Time = 68 / 17 = 4 hours.',
        marks: 1
      },
      {
        id: 'q28',
        question_text: 'Which benchmark interest rate was introduced by RBI to replace Marginal Cost of Funds based Lending Rate (MCLR) for retail loans?',
        options: ['EBLR / Repo Linked Rate', 'PLR', 'LIBOR', 'SOFR'],
        correct_option: 0,
        explanation: 'External Benchmark Lending Rate (EBLR) linked to Repo Rate was mandated by RBI for all retail floating rate loans.',
        marks: 1
      },
      {
        id: 'q29',
        question_text: 'A pipe can fill a tank in 6 hours and another pipe can empty it in 12 hours. If both pipes are opened together, the tank will be filled in:',
        options: ['8 hours', '10 hours', '12 hours', '15 hours'],
        correct_option: 2,
        explanation: 'Net rate = 1/6 - 1/12 = 1/12 per hour. Time required = 12 hours.',
        marks: 1
      },
      {
        id: 'q30',
        question_text: 'The average of 5 consecutive numbers is 27. What is the largest number?',
        options: ['29', '30', '28', '31'],
        correct_option: 0,
        explanation: 'The average of 5 consecutive numbers is the middle number (3rd number = 27). The 5 numbers are 25, 26, 27, 28, 29. Largest = 29.',
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
        {/* TOP HEADER WITH LOGO */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-2xs z-20 flex items-center justify-center text-center">
          <div className="flex items-center gap-2.5 select-none cursor-default justify-center">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Marvel Slice Logo"
                className="h-9 sm:h-10 w-auto object-contain pointer-events-none"
              />
            ) : (
              <img
                src="/apple-touch-icon.png"
                alt="Marvel Slice Logo"
                className="h-8 sm:h-9 w-8 sm:w-9 object-contain pointer-events-none"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <span className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
              Marvel <span className="text-brand-orange">Slice</span>
            </span>
          </div>
        </header>

        {/* BELOW SECTION: TOP EXAM HEADING & CANDIDATE DETAILS BELOW IT */}
        <div className="bg-slate-50 border-b border-slate-200 px-3 sm:px-8 py-2.5 sm:py-4 shrink-0 z-10 shadow-2xs space-y-2 sm:space-y-3">
          {/* TOP HEADING OF BELOW SECTION */}
          <div className="text-center pb-1 border-b border-slate-200/60">
            <h2 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 tracking-wide">
              {selectedExam?.title || 'Banking & Quantitative Aptitude'}
            </h2>
          </div>

          {/* BELOW HEADING: CANDIDATE INFO & LIVE TIMER */}
          <div className="flex items-center justify-between gap-2 sm:gap-6">
            {/* LEFT: CANDIDATE PHOTO & DETAILS */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border-2 border-slate-300 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250"
                  alt="Candidate Photo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-slate-100">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mt-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              </div>
              <div className="text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-slate-700 font-medium space-y-0.5 min-w-0">
                <div className="truncate"><span className="font-bold text-slate-900">Name:</span> <span className="font-semibold text-slate-800">{userName.trim() || 'Lethin'}</span></div>
                <div className="truncate"><span className="font-bold text-slate-900">Department:</span> <span className="font-semibold text-slate-800">{userDept || 'Computer Science & Engineering'}</span></div>
                <div className="truncate"><span className="font-bold text-slate-900">Year:</span> <span className="font-semibold text-slate-800">{userYear || '3rd Year'}</span></div>
                <div className="truncate"><span className="font-bold text-slate-900">College:</span> <span className="font-semibold text-slate-800">{userCollege || 'Marvel Institute of Technology'}</span></div>
              </div>
            </div>

            {/* RIGHT SIDE: LIVE COUNTDOWN TIMER */}
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <div className={`flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-mono text-xs sm:text-base font-bold shadow-xs ${
                timeLeftSeconds < 120 ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}>
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QUIZ MAIN BODY */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-slate-50">
          {/* QUESTION CONTENT AREA */}
          <div className="flex-1 lg:w-[80%] min-h-0 flex flex-col bg-slate-50 order-1 lg:order-1">
            {examQuestions.length > 0 && (
              <div className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
                {/* QUESTION TOP BAR */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5 mb-4 sm:mb-6 shrink-0">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1f1212]">
                    Question {currentQIndex + 1} of {examQuestions.length}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                      +{examQuestions[currentQIndex]?.marks || 1} Mark
                    </span>
                  </div>
                </div>

                {/* SEPARATE SCROLLABLE QUESTION & OPTIONS SECTION */}
                <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-1 space-y-4 sm:space-y-5 min-h-0">
                  {/* QUESTION STATEMENT */}
                  <div className="py-1 px-1">
                    <p className="text-sm sm:text-base font-semibold leading-relaxed text-[#1f1212] whitespace-pre-line">
                      {examQuestions[currentQIndex]?.question_text}
                    </p>
                  </div>

                  {/* OPTIONS GRID */}
                  <div className="space-y-2.5 sm:space-y-3 pb-3">
                    {examQuestions[currentQIndex]?.options.map((optText, optIdx) => {
                      const qId = examQuestions[currentQIndex]?.id;
                      const isSelected = userAnswers[qId] === optIdx;
                      const optLabel = String.fromCharCode(65 + optIdx);

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleOptionSelect(qId, optIdx)}
                          className={`w-full flex items-center gap-3 p-3 sm:p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/90 border-2 border-brand-blue text-brand-blue font-semibold shadow-xs'
                              : 'bg-white border-2 border-slate-200/90 text-[#1f1212] hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-[#1f1212] border border-slate-300'
                          }`}>
                            {optLabel}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-[#1f1212] leading-snug">
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ACTION BUTTONS BAR - ALL IN A SINGLE STRAIGHT HORIZONTAL LINE */}
                <div className="pt-3 sm:pt-4 mt-3 border-t border-slate-200 shrink-0 bg-slate-50">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-3 overflow-x-auto py-1 no-scrollbar w-full">
                    {/* 1. Mark for review Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const qId = examQuestions[currentQIndex]?.id;
                        if (qId) {
                          setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
                        }
                      }}
                      className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-xs md:text-sm text-white transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0 ${
                        markedForReview[examQuestions[currentQIndex]?.id]
                          ? 'bg-brand-orange ring-2 ring-amber-400'
                          : 'bg-brand-orange hover:bg-brand-orange/90'
                      }`}
                    >
                      {markedForReview[examQuestions[currentQIndex]?.id] ? 'Marked for Review' : 'Mark for review'}
                    </button>

                    {/* 2 & 3. Grouped Previous & Next Buttons */}
                    <div className="inline-flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={currentQIndex === 0}
                        onClick={() => setCurrentQIndex(prev => Math.max(prev - 1, 0))}
                        className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-l-full rounded-r-xs bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-[11px] sm:text-xs md:text-sm disabled:opacity-40 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={currentQIndex === examQuestions.length - 1}
                        onClick={() => setCurrentQIndex(prev => Math.min(prev + 1, examQuestions.length - 1))}
                        className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-r-full rounded-l-xs bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-[11px] sm:text-xs md:text-sm disabled:opacity-40 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                      >
                        Next
                      </button>
                    </div>

                    {/* 4. Clear Choice Button */}
                    <button
                      type="button"
                      onClick={() => setUserAnswers(prev => {
                        const copy = { ...prev };
                        delete copy[examQuestions[currentQIndex]?.id];
                        return copy;
                      })}
                      className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white border-2 border-brand-blue/30 hover:border-brand-blue text-brand-blue font-bold text-[11px] sm:text-xs md:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Clear Choice
                    </button>

                    {/* 5. Submit Test Button */}
                    <button
                      type="button"
                      onClick={() => handleSubmitQuiz(false)}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-brand-green hover:bg-brand-green/90 text-white font-bold text-[11px] sm:text-xs md:text-sm transition-colors cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SIDE QUESTION PALETTE */}
          <div className="w-full lg:w-[20%] bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 sm:p-5 shrink-0 overflow-y-auto flex flex-col justify-between order-2 lg:order-2">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question Palette ({examQuestions.length})
              </h3>

              <div className="w-full grid grid-cols-5 gap-1.5 sm:gap-2">
                {examQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isCurrent = currentQIndex === idx;

                  let orbType = "unanswered";
                  if (isAnswered && isMarked) {
                    orbType = "answered-marked";
                  } else if (isMarked) {
                    orbType = "marked";
                  } else if (isAnswered) {
                    orbType = "answered";
                  } else if (isCurrent) {
                    orbType = "current";
                  }

                  let textColor = (orbType === 'unanswered') ? "#334155" : "#ffffff";

                  let glowColor = (
                    orbType === 'answered' ? '#16a34a' :
                    orbType === 'marked' ? '#9333ea' :
                    orbType === 'answered-marked' ? '#16a34a' :
                    orbType === 'current' ? '#2563eb' :
                    '#64748b'
                  );

                  const isSquare = idx >= 5;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      className="relative w-full aspect-square flex items-center justify-center cursor-pointer transition-transform active:scale-95 group focus:outline-none"
                      title={`Question ${idx + 1}`}
                    >
                      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible">
                        <defs>
                          <radialGradient id={`orb-green-${idx}`} cx="45%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#4ade80" />
                            <stop offset="40%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#15803d" />
                          </radialGradient>
                          <radialGradient id={`orb-purple-${idx}`} cx="45%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="40%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7e22ce" />
                          </radialGradient>
                          <linearGradient id={`orb-dual-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="48%" stopColor="#15803d" />
                            <stop offset="52%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7e22ce" />
                          </linearGradient>
                          <radialGradient id={`orb-blue-${idx}`} cx="45%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="40%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </radialGradient>
                          <radialGradient id={`orb-gray-${idx}`} cx="45%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="40%" stopColor="#f1f5f9" />
                            <stop offset="100%" stopColor="#cbd5e1" />
                          </radialGradient>
                          <linearGradient id={`orb-top-gloss-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {isSquare ? (
                          <>
                            <defs>
                              <linearGradient id={`sq-diagonal-gloss-${idx}`} x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                              </linearGradient>
                              {orbType === 'answered' && (
                                <linearGradient id={`sq-bg-${idx}`} x1="100%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#4ade80" />
                                  <stop offset="50%" stopColor="#22c55e" />
                                  <stop offset="100%" stopColor="#15803d" />
                                </linearGradient>
                              )}
                              {orbType === 'marked' && (
                                <linearGradient id={`sq-bg-${idx}`} x1="100%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#c084fc" />
                                  <stop offset="50%" stopColor="#a855f7" />
                                  <stop offset="100%" stopColor="#7e22ce" />
                                </linearGradient>
                              )}
                              {orbType === 'answered-marked' && (
                                <linearGradient id={`sq-bg-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#22c55e" />
                                  <stop offset="50%" stopColor="#15803d" />
                                  <stop offset="50%" stopColor="#a855f7" />
                                  <stop offset="100%" stopColor="#7e22ce" />
                                </linearGradient>
                              )}
                              {orbType === 'current' && (
                                <linearGradient id={`sq-bg-${idx}`} x1="100%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#38bdf8" />
                                  <stop offset="50%" stopColor="#0284c7" />
                                  <stop offset="100%" stopColor="#0369a1" />
                                </linearGradient>
                              )}
                              {orbType === 'unanswered' && (
                                <linearGradient id={`sq-bg-${idx}`} x1="100%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" stopColor="#ffffff" />
                                  <stop offset="50%" stopColor="#f1f5f9" />
                                  <stop offset="100%" stopColor="#cbd5e1" />
                                </linearGradient>
                              )}
                            </defs>

                            {/* Current Active Outer Ring */}
                            {isCurrent && (
                              <rect
                                x="1.5"
                                y="1.5"
                                width="29"
                                height="29"
                                rx="7"
                                ry="7"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="1.8"
                                className="animate-pulse"
                              />
                            )}

                            {/* Base Rounded Square with Bright Outer Rim */}
                            <rect
                              x="3"
                              y="3"
                              width="26"
                              height="26"
                              rx="6"
                              ry="6"
                              fill={`url(#sq-bg-${idx})`}
                              stroke={
                                orbType === 'answered' ? '#86efac' :
                                orbType === 'marked' ? '#e9d5ff' :
                                orbType === 'current' ? '#7dd3fc' :
                                '#cbd5e1'
                              }
                              strokeWidth="1.2"
                            />

                            {/* Top-Right Diagonal Glass Sheen */}
                            <path
                              d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,20 L 12,3 Z"
                              fill={`url(#sq-diagonal-gloss-${idx})`}
                            />

                            {/* Inner Rim Top Highlight */}
                            <rect
                              x="4.5"
                              y="4.5"
                              width="23"
                              height="23"
                              rx="4.5"
                              ry="4.5"
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth="0.6"
                              strokeOpacity="0.4"
                            />
                          </>
                        ) : (
                          <>
                            {/* Current Active Outer Ring */}
                            {isCurrent && (
                              <circle cx="16" cy="16" r="14.0" fill="none" stroke="#2563eb" strokeWidth="1.8" className="animate-pulse" />
                            )}

                            {/* Base Spherical Circle */}
                            <circle
                              cx="16"
                              cy="16"
                              r="12.5"
                              fill={
                                orbType === 'answered' ? `url(#orb-green-${idx})` :
                                orbType === 'marked' ? `url(#orb-purple-${idx})` :
                                orbType === 'answered-marked' ? `url(#orb-dual-${idx})` :
                                orbType === 'current' ? `url(#orb-blue-${idx})` :
                                `url(#orb-gray-${idx})`
                              }
                              stroke="rgba(0,0,0,0.25)"
                              strokeWidth="0.75"
                            />

                            {/* Crescent Glass Gloss Cap */}
                            <path
                              d="M 4.2,14.5 A 12,12 0 0,1 27.8,14.5 A 11.5,7.5 0 0,0 4.2,14.5 Z"
                              fill={`url(#orb-top-gloss-${idx})`}
                            />

                            {/* Bottom Rim Glow Highlight */}
                            <path
                              d="M 7.5,20 A 9.5,5 0 0,0 24.5,20 A 9.5,7 0 0,1 7.5,20 Z"
                              fill="#ffffff"
                              fillOpacity="0.25"
                            />
                          </>
                        )}

                        {/* Perfectly Centered SVG Text */}
                        <text
                          x="16"
                          y="16"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontWeight="500"
                          fontSize="16"
                          fill={orbType === 'unanswered' ? '#1e293b' : '#ffffff'}
                          style={{
                            filter: orbType === 'unanswered'
                              ? 'drop-shadow(0px 1px 0px rgba(255,255,255,0.9))'
                              : 'drop-shadow(0px 1px 1px rgba(0,0,0,0.6))'
                          }}
                        >
                          {idx + 1}
                        </text>
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LEGEND WITH OPTIMIZED 3D GLOSSY GLASS ORBS */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2.5 mt-4">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                  <defs>
                    <radialGradient id="leg-orb-green" cx="45%" cy="30%" r="75%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="40%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#15803d" />
                    </radialGradient>
                    <linearGradient id="leg-top-gloss-g" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                      <stop offset="50%" stopColor="#ffffff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <circle cx="16" cy="16" r="13.5" fill="url(#leg-orb-green)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
                  <path d="M 3.5,14.5 A 13,13 0 0,1 28.5,14.5 A 12.5,8 0 0,0 3.5,14.5 Z" fill="url(#leg-top-gloss-g)" />
                  <path d="M 7,20.5 A 10.5,5.5 0 0,0 25,20.5 A 10.5,7.5 0 0,1 7,20.5 Z" fill="#ffffff" fillOpacity="0.25" />
                </svg>
                <span className="font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                  <defs>
                    <radialGradient id="leg-orb-purple" cx="45%" cy="30%" r="75%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="40%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </radialGradient>
                  </defs>
                  <circle cx="16" cy="16" r="13.5" fill="url(#leg-orb-purple)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
                  <path d="M 3.5,14.5 A 13,13 0 0,1 28.5,14.5 A 12.5,8 0 0,0 3.5,14.5 Z" fill="url(#leg-top-gloss-g)" />
                  <path d="M 7,20.5 A 10.5,5.5 0 0,0 25,20.5 A 10.5,7.5 0 0,1 7,20.5 Z" fill="#ffffff" fillOpacity="0.25" />
                </svg>
                <span className="font-medium">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                  <defs>
                    <linearGradient id="leg-orb-dual" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="48%" stopColor="#15803d" />
                      <stop offset="52%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#7e22ce" />
                    </linearGradient>
                  </defs>
                  <circle cx="16" cy="16" r="13.5" fill="url(#leg-orb-dual)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
                  <path d="M 3.5,14.5 A 13,13 0 0,1 28.5,14.5 A 12.5,8 0 0,0 3.5,14.5 Z" fill="url(#leg-top-gloss-g)" />
                  <path d="M 7,20.5 A 10.5,5.5 0 0,0 25,20.5 A 10.5,7.5 0 0,1 7,20.5 Z" fill="#ffffff" fillOpacity="0.25" />
                </svg>
                <span className="font-medium">Answered & Marked</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                  <defs>
                    <radialGradient id="leg-orb-gray" cx="45%" cy="30%" r="75%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="40%" stopColor="#f1f5f9" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </radialGradient>
                  </defs>
                  <circle cx="16" cy="16" r="13.5" fill="url(#leg-orb-gray)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
                  <path d="M 3.5,14.5 A 13,13 0 0,1 28.5,14.5 A 12.5,8 0 0,0 3.5,14.5 Z" fill="url(#leg-top-gloss-g)" />
                  <path d="M 7,20.5 A 10.5,5.5 0 0,0 25,20.5 A 10.5,7.5 0 0,1 7,20.5 Z" fill="#ffffff" fillOpacity="0.25" />
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
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Retake Test</span>
              </button>

              <button
                type="button"
                onClick={handleBackToExams}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-blue-50 text-brand-blue font-bold text-xs sm:text-sm rounded-xl border-2 border-brand-blue transition-all cursor-pointer"
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

                    <p className="text-sm font-bold text-black mb-4 whitespace-pre-line">
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
                  Banking & Quantitative Aptitude Mock Exam Series & Timed Practice
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
                Available Banking & Quantitative Aptitude Mock Exams
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
                <h3 className="text-base font-bold text-slate-800">No Active Banking & Quantitative Aptitude Mock Exams</h3>
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
                              {exam.category || 'Banking & Quantitative Aptitude'}
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
