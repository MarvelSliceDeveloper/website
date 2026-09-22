import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCheckCircle, FiArrowRight, FiX, FiLoader, FiClock,
  FiAward, FiHelpCircle, FiCheck, FiRefreshCw, FiList, FiAlertCircle,
  FiBookmark, FiCamera, FiUpload, FiLock, FiUser, FiShield, FiFileText
} from 'react-icons/fi';
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
    answer: "Detailed test analytics and merit lists are processed by the institution and published following administration review."
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
    question_count_option: 10,
    description: 'Timed speed drill covering Quantitative Aptitude, Reasoning, and English for IBPS PO & SBI PO Prelims.',
    rules_text: '1. Ensure a stable internet connection throughout the test.\n2. Do not refresh the page or switch tabs during the exam.\n3. Each question carries 1 mark. Select the correct option.\n4. Negative marking of 0.25 marks applies for incorrect answers.\n5. The exam will auto-submit when the timer expires.',
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
  }
];

// CANDIDATE PHOTO CAPTURE (WEBCAM & FILE UPLOAD) COMPONENT
function CandidatePhotoCapture({ photoUrl, onPhotoCaptured }) {
  const [mode, setMode] = useState('camera'); // 'camera' | 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (mode === 'camera' && !photoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, photoUrl]);

  async function startCamera() {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 400 }, height: { ideal: 400 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Unable to access webcam. Please upload a photo file instead.');
      setMode('upload');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  function takeSnapshot() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    onPhotoCaptured(dataUrl);
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onPhotoCaptured(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Candidate Identity Photo <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setMode('camera'); onPhotoCaptured(''); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              mode === 'camera' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FiCamera className="w-3.5 h-3.5" />
            <span>Webcam</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('upload'); stopCamera(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              mode === 'upload' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FiUpload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {photoUrl ? (
        <div className="relative w-36 h-36 mx-auto rounded-2xl border-2 border-brand-blue overflow-hidden shadow-md group">
          <img src={photoUrl} alt="Candidate Photo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
            <button
              type="button"
              onClick={() => { onPhotoCaptured(''); if (mode === 'camera') startCamera(); }}
              className="px-3 py-1.5 bg-white text-rose-600 rounded-lg text-xs font-bold shadow-xs hover:bg-rose-50 cursor-pointer"
            >
              Retake Photo
            </button>
          </div>
        </div>
      ) : mode === 'camera' ? (
        <div className="relative w-full max-w-xs mx-auto aspect-square rounded-2xl bg-slate-900 border-2 border-slate-300 overflow-hidden shadow-inner flex flex-col items-center justify-center">
          <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {cameraActive && (
            <button
              type="button"
              onClick={takeSnapshot}
              className="absolute bottom-3 px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs rounded-full shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <FiCamera className="w-4 h-4" />
              <span>Capture Photo</span>
            </button>
          )}
          {cameraError && (
            <div className="p-3 text-center text-xs text-rose-300 bg-slate-900/90">
              {cameraError}
            </div>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-brand-blue transition-colors bg-slate-50/50">
          <FiUpload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs text-slate-600 font-medium">Click below to upload candidate photo</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue/90 cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

// CELEBRATION CONFETTI CANVAS COMPONENT
function ConfettiCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
    const particles = [];
    const count = 140;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 350,
        y: canvas.height * 0.35 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 22,
        vy: Math.random() * -18 - 4,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 14,
        opacity: 1,
        shape: Math.random() > 0.5 ? 'rect' : 'circle'
      });
    }

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const startTime = Date.now();

    function render() {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.vx *= 0.98; // drag
        p.rotation += p.rotationSpeed;

        if (elapsed > 3200) {
          p.opacity = Math.max(0, p.opacity - 0.015);
        }

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < 7000) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
}

export default function MockExam() {
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  // Mock Exams state
  const [dbExams, setDbExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);

  // Student Flow State: 'LIST' | 'REGISTER' | 'RULES' | 'QUIZ' | 'SUBMITTED'
  const [activeStep, setActiveStep] = useState('LIST');

  // Server Time Synchronization Offset
  const [serverOffsetMs, setServerOffsetMs] = useState(0);

  // Active Exam Session State
  const [selectedExam, setSelectedExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Candidate Registration Details Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userDept, setUserDept] = useState('Computer Science & Engineering');
  const [userYear, setUserYear] = useState('3rd Year');
  const [userCollege, setUserCollege] = useState('');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [userFormErrors, setUserFormErrors] = useState({});

  // Active Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: optionIndex }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [visitedQuestions, setVisitedQuestions] = useState({}); // { [qId]: boolean }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [isSessionRestored, setIsSessionRestored] = useState(false);

  // Auto-mark active question as visited
  useEffect(() => {
    if (activeStep === 'QUIZ' && examQuestions.length > 0 && examQuestions[currentQIndex]?.id) {
      const qId = examQuestions[currentQIndex].id;
      setVisitedQuestions(prev => {
        if (prev[qId]) return prev;
        return { ...prev, [qId]: true };
      });
    }
  }, [activeStep, currentQIndex, examQuestions]);

  // Live Timer references
  const timerRef = useRef(null);
  const rulesTimerRef = useRef(null);
  const [rulesCountdownSecs, setRulesCountdownSecs] = useState(0);

  useEffect(() => {
    initExamsAndRestoreSession();
    syncServerTime();
  }, []);

  // Persist session state to localStorage across browser refreshes
  useEffect(() => {
    if (activeStep === 'LIST' || !selectedExam) {
      try {
        localStorage.removeItem('mock_exam_session_v1');
      } catch (e) {}
      return;
    }

    const sessionData = {
      activeStep,
      selectedExamId: selectedExam.id,
      userName,
      userEmail,
      userPhone,
      userDept,
      userYear,
      userCollege,
      candidatePhoto,
      currentQIndex,
      userAnswers,
      markedForReview,
      visitedQuestions,
      timeLeftSeconds,
      savedAtTimestampMs: Date.now()
    };

    try {
      localStorage.setItem('mock_exam_session_v1', JSON.stringify(sessionData));
    } catch (err) {
      console.warn('Unable to persist exam session to localStorage:', err);
    }
  }, [
    activeStep, selectedExam, userName, userEmail, userPhone, userDept,
    userYear, userCollege, candidatePhoto, currentQIndex, userAnswers,
    markedForReview, visitedQuestions, timeLeftSeconds
  ]);

  async function initExamsAndRestoreSession() {
    setLoadingExams(true);
    let loaded = [];
    const { data, error } = await supabase
      .from('mock_exams')
      .select('*, mock_exam_questions(id)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      loaded = data;
      setDbExams(data);
    } else {
      loaded = DEMO_EXAMS;
      setDbExams(DEMO_EXAMS);
    }
    setLoadingExams(false);

    restoreSessionFromCache(loaded);
  }

  async function restoreSessionFromCache(availableExams) {
    try {
      const raw = localStorage.getItem('mock_exam_session_v1');
      if (!raw) return;
      const cached = JSON.parse(raw);
      if (!cached || !cached.selectedExamId || cached.activeStep === 'LIST') {
        localStorage.removeItem('mock_exam_session_v1');
        return;
      }

      let matchingExam = availableExams.find(e => e.id === cached.selectedExamId);
      if (!matchingExam && cached.selectedExamId === DEMO_EXAMS[0].id) {
        matchingExam = DEMO_EXAMS[0];
      }
      if (!matchingExam) return;

      if (cached.userName) setUserName(cached.userName);
      if (cached.userEmail) setUserEmail(cached.userEmail);
      if (cached.userPhone) setUserPhone(cached.userPhone);
      if (cached.userDept) setUserDept(cached.userDept);
      if (cached.userYear) setUserYear(cached.userYear);
      if (cached.userCollege) setUserCollege(cached.userCollege);
      if (cached.candidatePhoto) setCandidatePhoto(cached.candidatePhoto);

      if (cached.userAnswers) setUserAnswers(cached.userAnswers);
      if (cached.markedForReview) setMarkedForReview(cached.markedForReview);
      if (cached.visitedQuestions) setVisitedQuestions(cached.visitedQuestions);
      if (cached.currentQIndex !== undefined) setCurrentQIndex(cached.currentQIndex);

      setSelectedExam(matchingExam);

      let questions = [];
      if (matchingExam.questions) {
        questions = matchingExam.questions;
      } else {
        const { data, error } = await supabase
          .from('mock_exam_questions')
          .select('*')
          .eq('mock_exam_id', matchingExam.id)
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
          questions = DEMO_EXAMS[0].questions;
        }
      }

      const countOpt = matchingExam.question_count_option || 25;
      if (questions.length > countOpt) {
        questions = questions.slice(0, countOpt);
      }
      setExamQuestions(questions);

      if (cached.activeStep === 'QUIZ') {
        const elapsedSecs = Math.floor((Date.now() - (cached.savedAtTimestampMs || Date.now())) / 1000);
        const remainingSecs = Math.max(0, (cached.timeLeftSeconds || 0) - elapsedSecs);
        setTimeLeftSeconds(remainingSecs);

        if (remainingSecs <= 0) {
          setActiveStep('SUBMITTED');
        } else {
          setActiveStep('QUIZ');
          setIsSessionRestored(true);
        }
      } else {
        setActiveStep(cached.activeStep || 'REGISTER');
      }
    } catch (err) {
      console.warn('Error restoring cached mock exam session:', err);
    }
  }

  // Server Time Sync Function (Prevents System Clock Manipulation)
  async function syncServerTime() {
    try {
      const startMs = Date.now();
      const { data, error } = await supabase.rpc('get_server_time');
      const endMs = Date.now();
      const latency = Math.round((endMs - startMs) / 2);
      if (!error && data) {
        const serverNowMs = new Date(data).getTime() + latency;
        const offset = serverNowMs - Date.now();
        setServerOffsetMs(offset);
        return serverNowMs;
      }
    } catch (err) {
      console.warn('Could not sync server time:', err);
    }
    return Date.now();
  }

  function getSyncedNow() {
    return Date.now() + serverOffsetMs;
  }

  // Active Quiz Countdown Timer Effect
  useEffect(() => {
    if (activeStep === 'QUIZ' && timeLeftSeconds > 0) {
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
  }, [activeStep, timeLeftSeconds]);

  // Rules & Guidelines Countdown Timer Effect (Until Scheduled Exam Start Time)
  useEffect(() => {
    if (activeStep === 'RULES' && selectedExam?.exam_start_time) {
      const examStartMs = new Date(selectedExam.exam_start_time).getTime();

      const checkTime = () => {
        const nowMs = getSyncedNow();
        const diffSecs = Math.max(0, Math.floor((examStartMs - nowMs) / 1000));
        setRulesCountdownSecs(diffSecs);
      };

      checkTime();
      rulesTimerRef.current = setInterval(checkTime, 1000);

      return () => {
        if (rulesTimerRef.current) clearInterval(rulesTimerRef.current);
      };
    }
  }, [activeStep, selectedExam, serverOffsetMs]);

  // Prevent background scrolling when test, registration, or submission step is active
  useEffect(() => {
    if (activeStep !== 'LIST') {
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
  }, [activeStep]);

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

  // Triggered when user selects a mock exam from cards
  async function handleSelectExam(exam) {
    setSelectedExam(exam);
    setLoadingQuestions(true);
    await syncServerTime();

    let questions = [];
    if (exam.questions) {
      questions = exam.questions;
    } else {
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
        questions = DEMO_EXAMS[0].questions;
      }
    }

    // Limit questions according to question_count_option set by Admin if applicable
    const countOption = exam.question_count_option || 25;
    if (questions.length > countOption) {
      questions = questions.slice(0, countOption);
    }

    setExamQuestions(questions);
    setLoadingQuestions(false);

    // Transition to Registration Step
    setActiveStep('REGISTER');
  }

  function handleRegistrationSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!userName.trim()) errs.name = 'Please enter your full name';
    if (!userEmail.trim()) errs.email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) errs.email = 'Please enter a valid email';
    if (!userPhone.trim()) errs.phone = 'Please enter your phone number';
    if (!userCollege.trim()) errs.college = 'Please enter your college/institute name';
    if (!candidatePhoto) errs.photo = 'Candidate identity photo is required';

    setUserFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // Check Registration Timing Guard
    if (selectedExam?.registration_start_time) {
      const regStartMs = new Date(selectedExam.registration_start_time).getTime();
      const nowMs = getSyncedNow();
      if (nowMs < regStartMs) {
        alert(`Registration for this exam opens at ${new Date(selectedExam.registration_start_time).toLocaleString()}. Please wait.`);
        return;
      }
    }

    // Proceed to Rules Step
    setActiveStep('RULES');
  }

  function startQuiz() {
    // Check Scheduled Exam Start Time Guard
    if (selectedExam?.exam_start_time) {
      const examStartMs = new Date(selectedExam.exam_start_time).getTime();
      const nowMs = getSyncedNow();
      if (nowMs < examStartMs) {
        alert('The exam start time has not arrived yet. Please wait on the Rules page.');
        return;
      }
    }

    setActiveStep('QUIZ');
    setCurrentQIndex(0);
    setUserAnswers({});
    setMarkedForReview({});
    setVisitedQuestions(examQuestions[0]?.id ? { [examQuestions[0].id]: true } : {});
    const totalSecs = (selectedExam?.time_limit_mins || 20) * 60;
    setTimeLeftSeconds(totalSecs);
    trackEnroll(selectedExam?.title || 'Mock Exam', 'mock_exam_quiz');
  }

  function handleOptionSelect(qId, optIdx) {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optIdx
    }));
  }

  function handleAutoSubmitQuiz() {
    handleSubmitQuiz(true);
  }

  async function handleSubmitQuiz(isAuto = false) {
    if (isSubmittingTest) return;
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

    // Save candidate submission to Supabase
    if (selectedExam && !selectedExam.id.startsWith('demo-')) {
      const { error } = await supabase.from('mock_exam_submissions').insert({
        mock_exam_id: selectedExam.id,
        user_name: userName.trim(),
        user_email: userEmail.trim(),
        user_phone: userPhone.trim(),
        user_department: userDept.trim(),
        user_year: userYear.trim(),
        user_college: userCollege.trim(),
        candidate_photo: candidatePhoto,
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

    // Transition to SUBMITTED confirmation page (No scores shown to student!)
    setActiveStep('SUBMITTED');
  }

  function handleResetToExams() {
    setSelectedExam(null);
    setActiveStep('LIST');
    setUserAnswers({});
    setMarkedForReview({});
    setVisitedQuestions({});
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Determine if registration is open yet
  const isRegistrationOpen = () => {
    if (!selectedExam?.registration_start_time) return true;
    const regStartMs = new Date(selectedExam.registration_start_time).getTime();
    return getSyncedNow() >= regStartMs;
  };

  // Determine if exam is open yet
  const isExamOpen = () => {
    if (!selectedExam?.exam_start_time) return true;
    const examStartMs = new Date(selectedExam.exam_start_time).getTime();
    return getSyncedNow() >= examStartMs;
  };

  // -------------------------------------------------------------
  // STEP 1: CANDIDATE REGISTRATION SCREEN
  // -------------------------------------------------------------
  if (activeStep === 'REGISTER' && selectedExam) {
    const regOpen = isRegistrationOpen();
    return (
      <div className="fixed inset-0 z-50 bg-slate-100/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[95vh] overflow-y-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Step 1 of 3 · Candidate Registration
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-snug">
                {selectedExam.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetToExams}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {!regOpen ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
              <FiLock className="w-8 h-8 text-amber-600 mx-auto animate-bounce" />
              <h3 className="font-bold text-base text-amber-900">Registration Starts Soon</h3>
              <p className="text-xs text-amber-800">
                Registration for this exam is scheduled to open at{' '}
                <span className="font-bold">{new Date(selectedExam.registration_start_time).toLocaleString()}</span>.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetToExams}
                  className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors shadow-xs"
                >
                  Back to Exams
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegistrationSubmit} className="space-y-5">
              {/* CANDIDATE PHOTO CAPTURE */}
              <CandidatePhotoCapture
                photoUrl={candidatePhoto}
                onPhotoCaptured={(url) => setCandidatePhoto(url)}
              />
              {userFormErrors.photo && (
                <p className="text-xs font-semibold text-rose-600 text-center">{userFormErrors.photo}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  />
                  {userFormErrors.name && <p className="text-[11px] font-semibold text-rose-600 mt-1">{userFormErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department / Discipline <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userDept}
                    onChange={e => setUserDept(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Commerce & Finance">Commerce & Finance</option>
                    <option value="Business Administration (MBA / BBA)">Business Administration (MBA / BBA)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Year of Study <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={userYear}
                    onChange={e => setUserYear(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Post Graduate">Post Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    College / Institute Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userCollege}
                    onChange={e => setUserCollege(e.target.value)}
                    placeholder="e.g. Marvel Institute of Technology"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  />
                  {userFormErrors.college && <p className="text-[11px] font-semibold text-rose-600 mt-1">{userFormErrors.college}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  />
                  {userFormErrors.email && <p className="text-[11px] font-semibold text-rose-600 mt-1">{userFormErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-blue/20 outline-none"
                  />
                  {userFormErrors.phone && <p className="text-[11px] font-semibold text-rose-600 mt-1">{userFormErrors.phone}</p>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleResetToExams}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>Proceed to Rules & Guidelines</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 2: RULES & GUIDELINES SCREEN
  // -------------------------------------------------------------
  if (activeStep === 'RULES' && selectedExam) {
    const examUnlocked = isExamOpen();
    return (
      <div className="fixed inset-0 z-50 bg-slate-100/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[95vh] overflow-y-auto">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Step 2 of 3 · Rules & Exam Instructions
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-2 leading-snug">
                {selectedExam.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleResetToExams}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* VERIFIED CANDIDATE DETAILS CARD */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 shadow-2xs">
              {candidatePhoto ? (
                <img src={candidatePhoto} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-7 h-7 text-slate-400 m-auto mt-3" />
              )}
            </div>
            <div className="text-xs text-slate-700 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 min-w-0 flex-1">
              <div><span className="font-bold text-slate-900">Name:</span> {userName}</div>
              <div><span className="font-bold text-slate-900">College:</span> {userCollege}</div>
              <div><span className="font-bold text-slate-900">Department:</span> {userDept}</div>
              <div><span className="font-bold text-slate-900">Year:</span> {userYear}</div>
            </div>
          </div>

          {/* EXAM PARAMETERS SUMMARY */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Duration</span>
              <span className="text-sm sm:text-base font-black text-brand-blue">{selectedExam.time_limit_mins || 20} Mins</span>
            </div>
            <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Total Questions</span>
              <span className="text-sm sm:text-base font-black text-amber-700">{examQuestions.length} Questions</span>
            </div>
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Marks</span>
              <span className="text-sm sm:text-base font-black text-emerald-700">{selectedExam.total_marks || 100} Marks</span>
            </div>
          </div>

          {/* RULES TEXT BOX */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FiShield className="w-4 h-4 text-brand-blue" />
              <span>Exam Rules & Guidelines</span>
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {selectedExam.rules_text || (
                "1. Ensure a stable internet connection throughout the test.\n2. Do not refresh the page or switch browser tabs during the exam.\n3. Each question carries 1 mark. Select the correct option in the palette.\n4. Negative marking of 0.25 marks applies for incorrect answers.\n5. The exam will auto-submit when the timer expires."
              )}
            </div>
          </div>

          {/* SCHEDULED EXAM COUNTDOWN GUARD */}
          {!examUnlocked && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FiLock className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block">Exam Start Time Scheduled</span>
                  <span>Exam unlocks automatically when start time is reached.</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-amber-600 text-white font-mono font-bold text-sm rounded-xl shrink-0 shadow-2xs">
                Starts in {formatTime(rulesCountdownSecs)}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveStep('REGISTER')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back to Registration
            </button>

            <button
              type="button"
              disabled={!examUnlocked}
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-7 py-3 bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>I Agree & Start Exam</span>
              <FiCheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 4: CONFIRMATION / SUBMITTED SCREEN (NO RESULTS TO STUDENT)
  // -------------------------------------------------------------
  if (activeStep === 'SUBMITTED' && selectedExam) {
    const totalQCount = examQuestions.length;
    const answeredCount = Object.keys(userAnswers).length;
    const markedCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
    const totalSecs = (selectedExam?.time_limit_mins || 20) * 60;
    const timeTaken = Math.max(1, totalSecs - timeLeftSeconds);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <ConfettiCanvas />
        <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-9 shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto relative z-10">
          
          {/* CONGRATULATIONS TROPHY BADGE & CELEBRATION SHIELD */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg ring-8 ring-amber-50 animate-bounce">
              <FiAward className="w-12 h-12 text-amber-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
              🎉 Congratulations!
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Exam Completed Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Well done, <span className="font-bold text-slate-900">{userName}</span>! Your exam responses and candidate photo verification have been securely saved and submitted.
            </p>
          </div>

          {/* CANDIDATE & ATTEMPT SUMMARY CARD */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 text-slate-700">
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Exam Title:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">{selectedExam.title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Candidate Name:</span>
              <span className="font-semibold text-slate-900">{userName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Department & Year:</span>
              <span className="font-semibold text-slate-900">{userDept} ({userYear})</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Questions Attempted:</span>
              <span className="font-bold text-brand-blue">{answeredCount} of {totalQCount} MCQs</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Marked for Review:</span>
              <span className="font-bold text-purple-600">{markedCount} Questions</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Time Taken:</span>
              <span className="font-semibold text-slate-900">{formatTime(timeTaken)}</span>
            </div>
            <div className="flex justify-between pt-0.5">
              <span className="font-bold text-slate-500">Submission Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <FiCheck className="w-3.5 h-3.5" /> Received by Admin
              </span>
            </div>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-brand-blue text-center leading-relaxed">
            <FiShield className="w-5 h-5 mx-auto mb-1 text-brand-blue" />
            <p className="font-medium">
              Official test results, marks breakdown, and merit rank reports will be published by the institution after administrative review.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleResetToExams}
              className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
            >
              Return to All Mock Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP 3: ACTIVE TIMED MOCK EXAM INTERFACE (EXACT DESIGN)
  // -------------------------------------------------------------
  if (activeStep === 'QUIZ' && selectedExam) {
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
                {candidatePhoto ? (
                  <img
                    src={candidatePhoto}
                    alt="Candidate Photo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-400 mt-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
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
              {isSessionRestored && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue border border-blue-200 rounded-full text-xs font-semibold shadow-2xs">
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  <span>Session Restored</span>
                </div>
              )}
              <div className={`flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-mono text-xs sm:text-base font-bold shadow-xs ${
                timeLeftSeconds < 120 ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-amber-50 text-amber-800 border border-amber-200/80'
              }`}>
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* QUIZ MAIN BODY: 80% QUESTION AREA / 20% SIDEBAR */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-slate-50">
          {/* QUESTION CONTENT AREA (80% DESKTOP) */}
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

          {/* SIDE QUESTION PALETTE (20% DESKTOP) */}
          <div className="w-full lg:w-[20%] bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200 p-4 sm:p-5 shrink-0 overflow-y-auto flex flex-col justify-between order-2 lg:order-2">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Question Palette ({examQuestions.length})
              </h3>

              <div className="w-full grid grid-cols-5 gap-1.5 sm:gap-2">
                {examQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isMarked = markedForReview[q.id];
                  const isVisited = visitedQuestions[q.id];
                  const isCurrent = currentQIndex === idx;

                  let orbType = "unvisited";
                  if (isAnswered && isMarked) {
                    orbType = "answered-marked";
                  } else if (isMarked) {
                    orbType = "marked";
                  } else if (isAnswered) {
                    orbType = "answered";
                  } else if (isVisited) {
                    orbType = "not-answered";
                  }

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
                          <radialGradient id={`orb-red-${idx}`} cx="45%" cy="30%" r="75%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="40%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#b91c1c" />
                          </radialGradient>
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

                        {/* Current Active Outer Pulsing Ring */}
                        {isCurrent && (
                          <circle cx="16" cy="16" r="14.0" fill="none" stroke="#2563eb" strokeWidth="1.8" className="animate-pulse" />
                        )}

                        {/* Base Spherical Gloss Circle */}
                        <circle
                          cx="16"
                          cy="16"
                          r="12.5"
                          fill={
                            orbType === 'answered' ? `url(#orb-green-${idx})` :
                            orbType === 'marked' ? `url(#orb-purple-${idx})` :
                            orbType === 'answered-marked' ? `url(#orb-dual-${idx})` :
                            orbType === 'not-answered' ? `url(#orb-red-${idx})` :
                            orbType === 'current' && !isVisited ? `url(#orb-blue-${idx})` :
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

                        {/* Perfectly Centered SVG Text */}
                        <text
                          x="16"
                          y="16"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontFamily="system-ui, -apple-system, sans-serif"
                          fontWeight="500"
                          fontSize="16"
                          fill={orbType === 'unvisited' ? '#1e293b' : '#ffffff'}
                          style={{
                            filter: orbType === 'unvisited'
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
                    <radialGradient id="leg-orb-red" cx="45%" cy="30%" r="75%">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="40%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </radialGradient>
                  </defs>
                  <circle cx="16" cy="16" r="13.5" fill="url(#leg-orb-red)" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
                  <path d="M 3.5,14.5 A 13,13 0 0,1 28.5,14.5 A 12.5,8 0 0,0 3.5,14.5 Z" fill="url(#leg-top-gloss-g)" />
                  <path d="M 7,20.5 A 10.5,5.5 0 0,0 25,20.5 A 10.5,7.5 0 0,1 7,20.5 Z" fill="#ffffff" fillOpacity="0.25" />
                </svg>
                <span className="font-medium">Not Answered</span>
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
                <span className="font-medium">Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT PAGE: EXAM CATALOGUE / LISTING VIEW
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Inter',sans-serif]">
      {/* HERO SECTION */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-900 to-brand-blue/90 text-white py-16 sm:py-20 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/10 text-amber-300 border border-white/20 backdrop-blur-md">
            <FiAward className="w-4 h-4 text-amber-400" />
            <span>Official Banking & Public Service Online Exam Portal</span>
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Banking & Competitive <span className="text-brand-orange">Mock Exams</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-medium">
            Take scheduled real-time speed drills with candidate identity photo verification, server-synced countdown timers, and standard IBPS/SBI test interfaces.
          </p>
        </div>
      </section>

      {/* EXAMS LISTING SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-12 flex-1 w-full space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Available Mock Tests</h2>
            <p className="text-xs text-slate-500">Select an exam to register and view rules</p>
          </div>
          <span className="text-xs font-bold text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {dbExams.length} Active Tests
          </span>
        </div>

        {loadingExams ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dbExams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
            <FiHelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">No Mock Exams Currently Scheduled</h3>
            <p className="text-xs text-slate-500">Please check back soon for upcoming banking and competitive exam speed drills.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dbExams.map((exam) => {
              const countOpt = exam.question_count_option || exam.mock_exam_questions?.length || 10;
              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group hover:-translate-y-1 duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-brand-blue border border-blue-100 uppercase tracking-wider">
                        {exam.category || 'Banking'}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <FiClock className="w-3.5 h-3.5 text-brand-orange" />
                        {exam.time_limit_mins || 20} Mins
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-brand-blue transition-colors leading-snug">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Questions</span>
                        <span className="font-bold text-slate-900 text-sm">{countOpt} MCQs</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
                        <span className="font-bold text-emerald-600 text-sm">{exam.total_marks || 100} Marks</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSelectExam(exam)}
                      className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Register & Take Test</span>
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* BANKING TESTIMONIALS SECTION */}
      <BankingTestimonialsSection />

      {/* FAQS SECTION */}
      <section className="bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Everything you need to know about taking mock exams</p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <AccordionItem
                key={index}
                title={faq.question}
                isOpen={openFaqIndex === index}
                onToggle={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              >
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </AccordionItem>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
