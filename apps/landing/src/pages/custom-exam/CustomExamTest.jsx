import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiClock, FiCheckCircle, FiX, FiCheck, FiAward, FiShield, FiUser,
  FiRefreshCw, FiStar, FiMessageSquare, FiArrowRight, FiAlertCircle, FiBookmark,
  FiLock, FiPlayCircle
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';
import './custom-exam-responsive.css';

// FIREWORKS & FIRECRACKER CELEBRATION ANIMATION ENGINE
function FireworksCrackerCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      '#ff0055', '#ff5000', '#ffcc00', '#22c55e', '#00d2ff',
      '#9d00ff', '#ff00d0', '#ffffff', '#38ef7d', '#11998e'
    ];

    const rockets = [];
    const particles = [];
    let lastLaunchTime = 0;

    function launchRocket() {
      const startX = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const targetY = Math.random() * (canvas.height * 0.45) + canvas.height * 0.1;
      const speed = Math.random() * 4 + 11;

      rockets.push({
        x: startX,
        y: canvas.height + 10,
        targetY: targetY,
        vy: -speed,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function createExplosion(x, y, color) {
      const count = Math.floor(Math.random() * 35) + 45;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.2 - 0.1);
        const speed = Math.random() * 8 + 2;
        particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          size: Math.random() * 3.5 + 2,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.012,
          gravity: 0.12
        });
      }
    }

    // Launch initial batch of rockets immediately
    for (let i = 0; i < 4; i++) {
      setTimeout(() => launchRocket(), i * 250);
    }

    function render(timestamp) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)'; // Smooth background clear
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (timestamp - lastLaunchTime > 550) {
        launchRocket();
        if (Math.random() > 0.4) launchRocket();
        lastLaunchTime = timestamp;
      }

      // Update & render rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;

        ctx.beginPath();
        ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        // Rocket spark tail
        ctx.beginPath();
        ctx.arc(r.x + (Math.random() - 0.5) * 2, r.y + 6, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= 0) {
          createExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update & render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 w-full h-full" />;
}

export default function CustomExamTest() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Flow Step: 'GATE_BLOCKED' | 'WAITING_LOBBY' | 'INSTRUCTIONS' | 'QUIZ' | 'REVIEW_MARKED' | 'FEEDBACK' | 'SUBMITTED'
  const [activeStep, setActiveStep] = useState('INSTRUCTIONS');
  const [gateReason, setGateReason] = useState(''); // 'NOT_OPEN' | 'EXAM_ENDED'
  const [lobbyTimeLeftSecs, setLobbyTimeLeftSecs] = useState(0);
  const [showExamStartedPopup, setShowExamStartedPopup] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [agreeInstructions, setAgreeInstructions] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: optionIdx }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [visitedQuestions, setVisitedQuestions] = useState({}); // { [qId]: boolean }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [examStartedAtMs, setExamStartedAtMs] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab Switch Tracking State (Silent Background Logger)
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabSwitchLogs, setTabSwitchLogs] = useState([]);

  // Feedback State { [fbId]: ratingOrText }
  const [feedbackAnswers, setFeedbackAnswers] = useState({});
  const [feedbackError, setFeedbackError] = useState('');

  const timerRef = useRef(null);
  const lobbyTimerRef = useRef(null);
  const hasRestoredSessionRef = useRef(false);

  const currentQIndexRef = useRef(currentQIndex);
  const timeLeftRef = useRef(timeLeftSeconds);
  const examQuestionsRef = useRef(examQuestions);
  const tabSwitchLogsRef = useRef(tabSwitchLogs);
  const userAnswersRef = useRef(userAnswers);
  const visitedQuestionsRef = useRef(visitedQuestions);
  const tabSwitchCountRef = useRef(tabSwitchCount);
  const lastSwitchTimeRef = useRef(0);

  useEffect(() => { currentQIndexRef.current = currentQIndex; }, [currentQIndex]);
  useEffect(() => { timeLeftRef.current = timeLeftSeconds; }, [timeLeftSeconds]);
  useEffect(() => { examQuestionsRef.current = examQuestions; }, [examQuestions]);
  useEffect(() => { tabSwitchLogsRef.current = tabSwitchLogs; }, [tabSwitchLogs]);
  useEffect(() => { userAnswersRef.current = userAnswers; }, [userAnswers]);
  useEffect(() => { visitedQuestionsRef.current = visitedQuestions; }, [visitedQuestions]);
  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);

  // Email of the logged-in candidate, read from the auth session on every call
  // so cached test sessions can always be matched to their owner.
  function getSessionEmail() {
    try {
      const auth = JSON.parse(sessionStorage.getItem(`custom_exam_auth_${slug}`) || 'null');
      return (auth?.candidate?.user_email || '').toLowerCase();
    } catch (e) {
      return '';
    }
  }

  useEffect(() => {
    initExam();
  }, [slug]);

  async function initExam() {
    setLoading(true);

    // Read Auth
    const rawAuth = sessionStorage.getItem(`custom_exam_auth_${slug}`);
    if (!rawAuth) {
      navigate(`/custom-exam/login/${slug}`, { replace: true });
      return;
    }

    let authCand = null;
    try {
      const parsed = JSON.parse(rawAuth);
      if (!parsed?.candidate) {
        navigate(`/custom-exam/login/${slug}`, { replace: true });
        return;
      }
      authCand = parsed.candidate;
      setCandidate(authCand);
    } catch (e) {
      navigate(`/custom-exam/login/${slug}`, { replace: true });
      return;
    }

    // Fetch Custom Exam
    const { data: examData } = await supabase
      .from('custom_mock_exams')
      .select('*')
      .eq('slug', slug)
      .single();

    let currentExam = examData;
    if (!currentExam) {
      currentExam = {
        id: 'demo-custom-1',
        slug: slug,
        title: 'Special IBPS PO Speed Drill 2026',
        category: 'Banking & Aptitude',
        time_limit_mins: 20,
        total_marks: 100,
        question_count_option: 50,
        feedback_questions: [
          { id: 'fb1', question_text: 'How would you rate the difficulty level of this exam?', type: 'rating' },
          { id: 'fb2', question_text: 'Share your feedback or suggestions:', type: 'text' }
        ]
      };
    }
    setExam(currentExam);

    // Fetch Questions
    let questions = [];
    if (currentExam.id && !currentExam.id.startsWith('demo-')) {
      const { data: qData } = await supabase
        .from('custom_mock_exam_questions')
        .select('*')
        .eq('custom_mock_exam_id', currentExam.id)
        .order('order_index', { ascending: true });

      if (qData && qData.length > 0) {
        questions = qData.map((q, qIdx) => ({
          id: q.id,
          question_text: q.question_text,
          options: Array.isArray(q.options) ? q.options : [],
          correct_option: q.correct_option ?? 0,
          explanation: q.explanation || '',
          marks: q.marks || 1,
          category_name: q.category_name || (currentExam.exam_categories?.[qIdx % (currentExam.exam_categories?.length || 1)] || 'General')
        }));
      }
    }

    if (questions.length === 0) {
      // Fallback demo questions generator
      const count = currentExam.question_count_option || 25;
      const configuredCats = (Array.isArray(currentExam.exam_categories) && currentExam.exam_categories.length > 0)
        ? currentExam.exam_categories
        : ['Quantitative Aptitude', 'Logical Reasoning', 'Technical Knowledge'];

      for (let i = 1; i <= count; i++) {
        questions.push({
          id: `q-${i}`,
          question_text: `Question ${i}: A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?`,
          options: ['10%', '12.5%', '15%', '8%'],
          correct_option: 1,
          explanation: 'Simple Interest SI = P. P = (P * R * 8)/100 => R = 12.5%.',
          marks: 1,
          category_name: configuredCats[(i - 1) % configuredCats.length]
        });
      }
    }

    const countOpt = currentExam.question_count_option || 25;
    if (questions.length > countOpt) questions = questions.slice(0, countOpt);

    setExamQuestions(questions);

    // Check existing DB submission status
    let dbDraftAnswers = null;
    let dbDraftVisited = null;

    if (currentExam.id && !currentExam.id.startsWith('demo-') && authCand?.user_email) {
      const { data: existingRows } = await supabase
        .from('custom_mock_exam_submissions')
        .select('*')
        .eq('custom_mock_exam_id', currentExam.id)
        .eq('user_email', authCand.user_email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1);

      const existingSub = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (authCand?.alreadySubmitted || (existingSub && existingSub.status === 'SUBMITTED')) {
        if (existingSub) {
          setUserAnswers(existingSub.answers || {});
          setFeedbackAnswers(existingSub.feedback_answers || {});
          setScore(existingSub.score || 0);
          setTabSwitchCount(existingSub.tab_switch_count || 0);
        }
        setActiveStep('SUBMITTED');
        try { localStorage.removeItem(`custom_exam_test_session_${slug}`); } catch (e) {}
        hasRestoredSessionRef.current = true;
        setLoading(false);
        return;
      } else if (existingSub && existingSub.status === 'DRAFT') {
        dbDraftAnswers = existingSub.answers || null;
        dbDraftVisited = existingSub.visited_questions || null;
      }
    }

    // Evaluate Candidate Entrance Gate & Timings
    const now = Date.now();
    const loginStartMs = currentExam.registration_start_time ? new Date(currentExam.registration_start_time).getTime() : null;
    const examStartMs = currentExam.exam_start_time ? new Date(currentExam.exam_start_time).getTime() : null;
    const loginEndMs = currentExam.exam_end_time ? new Date(currentExam.exam_end_time).getTime() : null;

    if (loginStartMs && now < loginStartMs) {
      setActiveStep('GATE_BLOCKED');
      setGateReason('NOT_OPEN');
      setLoading(false);
      return;
    }

    // Check if candidate already has an active local or DB session.
    // The cached session must belong to THIS candidate (email match) so one
    // candidate can never inherit another candidate's answers on a shared machine.
    const rawSession = localStorage.getItem(`custom_exam_test_session_${slug}`);
    let cachedSession = null;
    try { cachedSession = rawSession ? JSON.parse(rawSession) : null; } catch (e) {}
    const ownEmail = (authCand?.user_email || '').toLowerCase();
    const cachedEmail = (cachedSession?.candidateEmail || '').toLowerCase();
    if (cachedSession && cachedEmail && ownEmail && cachedEmail !== ownEmail) {
      cachedSession = null;
    }

    const isAlreadyLoggedIn = Boolean(cachedSession || dbDraftAnswers);

    // Gate 2: Login Window Closed - ONLY BLOCK NEW / NEVER-JOINED CANDIDATES
    if (!isAlreadyLoggedIn && loginEndMs && now > loginEndMs) {
      setActiveStep('GATE_BLOCKED');
      setGateReason('EXAM_ENDED');
      setLoading(false);
      return;
    }

    if (cachedSession || dbDraftAnswers) {
      restoreSessionFromCache(currentExam, questions, dbDraftAnswers, dbDraftVisited);
      hasRestoredSessionRef.current = true;
      setLoading(false);
      return;
    }

    // If before exam start time, candidate enters WAITING_LOBBY
    if (examStartMs && now < examStartMs) {
      setActiveStep('WAITING_LOBBY');
      setLobbyTimeLeftSecs(Math.max(0, Math.floor((examStartMs - now) / 1000)));
      hasRestoredSessionRef.current = true;
      setLoading(false);
      return;
    }

    // Restore cached exam session if page was refreshed during active exam
    restoreSessionFromCache(currentExam, questions, dbDraftAnswers, dbDraftVisited);
    hasRestoredSessionRef.current = true;
    setLoading(false);
  }

  // WAITING LOBBY COUNTDOWN TIMER EFFECT
  useEffect(() => {
    if (activeStep === 'WAITING_LOBBY' && lobbyTimeLeftSecs > 0) {
      lobbyTimerRef.current = setInterval(() => {
        setLobbyTimeLeftSecs((prev) => {
          if (prev <= 1) {
            clearInterval(lobbyTimerRef.current);
            setShowExamStartedPopup(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (lobbyTimerRef.current) clearInterval(lobbyTimerRef.current);
    };
  }, [activeStep, lobbyTimeLeftSecs]);

  function handleStartExam() {
    if (!agreeInstructions || !agreeTerms) return;
    const nowMs = Date.now();
    const initialVisited = examQuestions[0]?.id ? { [examQuestions[0].id]: true } : {};
    setVisitedQuestions(initialVisited);
    setExamStartedAtMs(nowMs);
    setActiveStep('QUIZ');
    hasRestoredSessionRef.current = true;

    // Immediately persist QUIZ activeStep & draft to DB / localStorage
    const fullExamSecs = (exam?.time_limit_mins || 20) * 60;
    const sessionData = {
      activeStep: 'QUIZ',
      currentQIndex: 0,
      candidateEmail: getSessionEmail(),
      userAnswers: {},
      markedForReview: {},
      visitedQuestions: initialVisited,
      feedbackAnswers: {},
      timeLeftSeconds: fullExamSecs,
      examStartedAtMs: nowMs,
      savedAtTimestampMs: nowMs
    };
    try {
      localStorage.setItem(`custom_exam_test_session_${slug}`, JSON.stringify(sessionData));
    } catch (e) {}

    autoSaveDraftToSupabase({}, initialVisited, fullExamSecs);
  }

  function restoreSessionFromCache(currentExam, questions, dbDraftAnswers, dbDraftVisited) {
    let fullExamSecs = (currentExam.time_limit_mins || 20) * 60;

    // Email of the currently logged-in candidate (state may not have flushed yet,
    // so read the same sessionStorage auth that initExam used).
    let ownEmail = '';
    try {
      const auth = JSON.parse(sessionStorage.getItem(`custom_exam_auth_${slug}`) || 'null');
      ownEmail = (auth?.candidate?.user_email || '').toLowerCase();
    } catch (e) {}

    try {
      const raw = localStorage.getItem(`custom_exam_test_session_${slug}`);
      let cached = raw ? JSON.parse(raw) : null;
      // Never restore another candidate's cached answers on a shared machine.
      const cachedEmail = (cached?.candidateEmail || '').toLowerCase();
      if (cached && cachedEmail && ownEmail && cachedEmail !== ownEmail) {
        cached = null;
      }

      // Merge DB draft and localStorage draft so filled options are never lost
      const mergedAnswers = {
        ...(dbDraftAnswers || {}),
        ...(cached?.userAnswers || {})
      };

      const mergedVisited = {
        ...(dbDraftVisited || {}),
        ...(cached?.visitedQuestions || {})
      };

      setUserAnswers(mergedAnswers);
      setVisitedQuestions(mergedVisited);

      if (!cached && !dbDraftAnswers) {
        setTimeLeftSeconds(fullExamSecs);
        setActiveStep('INSTRUCTIONS');
        return;
      }

      if (cached && cached.activeStep === 'SUBMITTED') {
        setActiveStep('SUBMITTED');
        return;
      }

      // Calculate exact remaining time based on exam start timestamp
      let remainingSecs = fullExamSecs;
      if (cached?.examStartedAtMs) {
        const elapsedSecs = Math.floor((Date.now() - cached.examStartedAtMs) / 1000);
        remainingSecs = Math.max(0, fullExamSecs - elapsedSecs);
      } else if (cached?.timeLeftSeconds !== undefined && cached?.savedAtTimestampMs) {
        const elapsedSecs = Math.floor((Date.now() - cached.savedAtTimestampMs) / 1000);
        remainingSecs = Math.max(0, cached.timeLeftSeconds - elapsedSecs);
      }

      if (cached?.examStartedAtMs) setExamStartedAtMs(cached.examStartedAtMs);
      if (cached?.markedForReview) setMarkedForReview(cached.markedForReview);
      if (cached?.feedbackAnswers) setFeedbackAnswers(cached.feedbackAnswers);
      if (cached?.currentQIndex !== undefined) setCurrentQIndex(cached.currentQIndex);
      if (cached?.tabSwitchCount !== undefined) setTabSwitchCount(cached.tabSwitchCount);
      if (cached?.tabSwitchLogs) setTabSwitchLogs(cached.tabSwitchLogs);

      if (remainingSecs > 0) {
        setTimeLeftSeconds(remainingSecs);
        // CRITICAL: Always return candidate to QUIZ screen on refresh when time remains
        setActiveStep('QUIZ');
        setIsSessionRestored(true);
      } else {
        setTimeLeftSeconds(0);
        setActiveStep('FEEDBACK');
        setIsSessionRestored(true);
      }
    } catch (e) {
      setTimeLeftSeconds(fullExamSecs);
      setActiveStep('INSTRUCTIONS');
    }
  }

  // Persist session to localStorage across page reloads
  useEffect(() => {
    if (!hasRestoredSessionRef.current || !exam) return;

    if (activeStep === 'SUBMITTED') {
      try { localStorage.removeItem(`custom_exam_test_session_${slug}`); } catch (e) {}
      return;
    }

    if (activeStep === 'INSTRUCTIONS' || activeStep === 'GATE_BLOCKED' || activeStep === 'WAITING_LOBBY') return;

    const sessionData = {
      activeStep: 'QUIZ',
      currentQIndex,
      candidateEmail: getSessionEmail(),
      userAnswers,
      markedForReview,
      visitedQuestions,
      feedbackAnswers,
      timeLeftSeconds,
      examStartedAtMs: examStartedAtMs || Date.now(),
      tabSwitchCount,
      tabSwitchLogs,
      savedAtTimestampMs: Date.now()
    };

    try {
      localStorage.setItem(`custom_exam_test_session_${slug}`, JSON.stringify(sessionData));
    } catch (e) {}
  }, [activeStep, currentQIndex, userAnswers, markedForReview, visitedQuestions, feedbackAnswers, timeLeftSeconds, examStartedAtMs, tabSwitchCount, tabSwitchLogs, exam]);

  // Auto-mark active question as visited & save draft
  useEffect(() => {
    if (activeStep === 'QUIZ' && examQuestions.length > 0 && examQuestions[currentQIndex]?.id) {
      const qId = examQuestions[currentQIndex].id;
      setVisitedQuestions(prev => {
        if (prev[qId]) return prev;
        const updated = { ...prev, [qId]: true };
        autoSaveDraftToSupabase(userAnswers, updated, timeLeftSeconds);
        return updated;
      });
    }
  }, [activeStep, currentQIndex, examQuestions]);

  // Background Auto-Save Draft to Supabase
  async function autoSaveDraftToSupabase(answersToSave, visitedToSave, timeRemaining, switchCountToSave, switchLogsToSave) {
    if (!exam || exam.id.startsWith('demo-') || !candidate?.user_email) return;

    try {
      const totalSecs = (exam?.time_limit_mins || 20) * 60;
      const timeTaken = examStartedAtMs
        ? Math.max(1, Math.floor((Date.now() - examStartedAtMs) / 1000))
        : Math.max(1, totalSecs - (timeRemaining || 0));

      const draftPayload = {
        custom_mock_exam_id: exam.id,
        registration_id: candidate?.id || null,
        user_name: candidate?.user_name || '',
        user_email: candidate?.user_email.toLowerCase(),
        user_phone: candidate?.user_phone || '',
        user_dob: candidate?.user_dob || null,
        user_department: candidate?.user_department || '',
        user_degree: candidate?.user_degree || '',
        user_address: candidate?.user_address || '',
        user_10th_mark: candidate?.user_10th_mark || null,
        user_12th_mark: candidate?.user_12th_mark || null,
        user_cgpa: candidate?.user_cgpa || null,
        user_year: candidate?.user_year || '',
        user_college: candidate?.user_college || '',
        candidate_photo: candidate?.candidate_photo || null,
        status: 'DRAFT',
        answers: answersToSave || userAnswers,
        visited_questions: visitedToSave || visitedQuestions,
        time_taken_seconds: timeTaken,
        tab_switch_count: switchCountToSave ?? tabSwitchCount,
        tab_switch_logs: switchLogsToSave ?? tabSwitchLogs,
        updated_at: new Date().toISOString()
      };

      // Check existing draft safely
      const { data: existingRows } = await supabase
        .from('custom_mock_exam_submissions')
        .select('id, status')
        .eq('custom_mock_exam_id', exam.id)
        .eq('user_email', candidate.user_email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1);

      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existing) {
        if (existing.status !== 'SUBMITTED') {
          await supabase
            .from('custom_mock_exam_submissions')
            .update(draftPayload)
            .eq('id', existing.id);
        }
      } else {
        await supabase
          .from('custom_mock_exam_submissions')
          .insert([draftPayload]);
      }
    } catch (e) {
      console.warn('Silent draft auto-save error:', e);
    }
  }

  // Countdown timer effect
  useEffect(() => {
    if (activeStep === 'QUIZ' && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setActiveStep('FEEDBACK');
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

  // Periodic DB draft backup (every 30s while answering) so an idle or
  // crashed candidate still has a fresh server-side draft to rejoin from.
  useEffect(() => {
    if (activeStep !== 'QUIZ') return;
    const backupId = setInterval(() => {
      autoSaveDraftToSupabase(
        userAnswersRef.current,
        visitedQuestionsRef.current,
        timeLeftRef.current,
        tabSwitchCountRef.current,
        tabSwitchLogsRef.current
      );
    }, 30000);
    return () => clearInterval(backupId);
  }, [activeStep]);

  function saveImmediateSession(answers, visited, index, switchCount, switchLogs) {
    const fullExamSecs = (exam?.time_limit_mins || 20) * 60;
    const sessionData = {
      activeStep: 'QUIZ',
      currentQIndex: index !== undefined ? index : currentQIndex,
      candidateEmail: getSessionEmail(),
      userAnswers: answers || userAnswers,
      markedForReview,
      visitedQuestions: visited || visitedQuestions,
      feedbackAnswers,
      timeLeftSeconds,
      examStartedAtMs: examStartedAtMs || Date.now(),
      tabSwitchCount: switchCount !== undefined ? switchCount : tabSwitchCount,
      tabSwitchLogs: switchLogs !== undefined ? switchLogs : tabSwitchLogs,
      savedAtTimestampMs: Date.now()
    };
    try {
      localStorage.setItem(`custom_exam_test_session_${slug}`, JSON.stringify(sessionData));
    } catch (e) {}
  }

  function handleOptionSelect(qId, optIdx) {
    if (timeLeftSeconds <= 0) return; // Prevent answer modification after timer ends
    setUserAnswers(prev => {
      let updated;
      if (prev[qId] === optIdx) {
        updated = { ...prev };
        delete updated[qId];
      } else {
        updated = { ...prev, [qId]: optIdx };
      }
      const updatedVisited = { ...visitedQuestions, [qId]: true };
      setVisitedQuestions(updatedVisited);
      saveImmediateSession(updated, updatedVisited, currentQIndex);
      autoSaveDraftToSupabase(updated, updatedVisited, timeLeftSeconds);
      return updated;
    });
  }

  function handleSaveAndNext() {
    const qId = examQuestions[currentQIndex]?.id;
    const nextIdx = Math.min(currentQIndex + 1, examQuestions.length - 1);
    const updatedVisited = qId ? { ...visitedQuestions, [qId]: true } : visitedQuestions;
    if (qId && !visitedQuestions[qId]) {
      setVisitedQuestions(updatedVisited);
    }
    saveImmediateSession(userAnswers, updatedVisited, nextIdx);
    autoSaveDraftToSupabase(userAnswers, updatedVisited, timeLeftSeconds);
    setCurrentQIndex(nextIdx);
  }

  // SILENT TAB SWITCH DETECTION & TRACKING ENGINE (NO USER ALERTS)
  useEffect(() => {
    if (activeStep !== 'QUIZ') return;

    function recordTabSwitch(eventType) {
      const now = Date.now();
      if (now - lastSwitchTimeRef.current < 800) return; // Debounce rapid focus/blur events
      lastSwitchTimeRef.current = now;

      const qIndex = currentQIndexRef.current || 0;
      const secs = timeLeftRef.current || 0;
      const currentQ = examQuestionsRef.current?.[qIndex];

      const mins = Math.floor(secs / 60);
      const remainingSecs = secs % 60;
      const formattedTime = `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;

      const logEntry = {
        switch_number: (tabSwitchLogsRef.current?.length || 0) + 1,
        timestamp: new Date().toISOString(),
        event_type: eventType, // 'tab_hidden' or 'window_blur'
        question_number: qIndex + 1,
        question_id: currentQ?.id || `q-${qIndex + 1}`,
        question_category: currentQ?.category_name || 'General',
        time_left_formatted: formattedTime,
        time_left_seconds: secs,
        document_hidden: document.hidden,
        window_title: document.title,
        referrer: document.referrer || 'Direct'
      };

      const updatedLogs = [...(tabSwitchLogsRef.current || []), logEntry];
      const updatedCount = updatedLogs.length;

      setTabSwitchCount(updatedCount);
      setTabSwitchLogs(updatedLogs);

      saveImmediateSession(userAnswers, visitedQuestions, currentQIndexRef.current, updatedCount, updatedLogs);
      autoSaveDraftToSupabase(userAnswers, visitedQuestions, timeLeftRef.current, updatedCount, updatedLogs);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        recordTabSwitch('tab_hidden');
      }
    }

    function handleWindowBlur() {
      recordTabSwitch('window_blur');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [activeStep]);

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);


  function triggerFeedbackOrSubmit() {
    if (timeLeftSeconds <= 0) {
      setActiveStep('FEEDBACK');
      return;
    }
    const markedQList = examQuestions.filter(q => markedForReview[q.id] === true);
    if (markedQList.length > 0) {
      setActiveStep('REVIEW_MARKED');
    } else {
      setActiveStep('FEEDBACK');
    }
  }

  function handleFinalSubmissionWithValidation() {
    setFeedbackError('');
    const feedbackList = (exam?.feedback_questions && Array.isArray(exam.feedback_questions) && exam.feedback_questions.length > 0)
      ? exam.feedback_questions
      : [
          {
            id: 'fb-matrix-1',
            type: 'matrix',
            question_text: 'Please choose the best answer for each of the following:',
            matrix_columns: ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree', 'N/A'],
            matrix_rows: [
              'The online class materials were useful and accurate',
              'The class description accurately described the class content',
              'The technology used was appropriate for this online class',
              'Exams were based on material covered in assignments and lectures',
              'I was technically prepared for this class',
              'I was academically prepared for this class',
              'The instructor was qualified to teach this class',
              'The class size was appropriate'
            ]
          },
          { id: 'fb-rating-overall', type: 'rating', question_text: 'Overall Satisfaction' },
          { id: 'fb-overall-exp', type: 'text', question_text: 'Suggestions or Comments:' }
        ];

    for (const fb of feedbackList) {
      const val = feedbackAnswers[fb.id];

      if (fb.type === 'matrix') {
        const rows = fb.matrix_rows || [
          'The online class materials were useful and accurate',
          'The class description accurately described the class content',
          'The technology used was appropriate for this online class',
          'Exams were based on material covered in assignments and lectures',
          'I was technically prepared for this class',
          'I was academically prepared for this class',
          'The instructor was qualified to teach this class',
          'The class size was appropriate'
        ];
        const valObj = (val && typeof val === 'object') ? val : {};
        const unansweredRow = rows.find(r => !valObj[r]);
        if (unansweredRow) {
          setFeedbackError(`Please select an option for statement: "${unansweredRow}"`);
          return;
        }
      } else if (fb.type === 'radio' || fb.type === 'rating' || fb.type === 'choice') {
        if (val === undefined || val === null || val === '') {
          setFeedbackError(`Please select an option for: "${fb.question_text || 'Feedback Question'}"`);
          return;
        }
      } else {
        if (!val || typeof val !== 'string' || val.trim() === '') {
          setFeedbackError(`Please provide your response for: "${fb.question_text || 'Feedback Question'}"`);
          return;
        }
      }
    }

    executeFinalSubmission();
  }

  async function executeFinalSubmission() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    const categoryScores = {};
    examQuestions.forEach((q) => {
      const catName = q.category_name || 'General';
      if (!categoryScores[catName]) {
        categoryScores[catName] = { correct: 0, wrong: 0, unanswered: 0, total: 0, score: 0 };
      }
      categoryScores[catName].total += 1;
      const userAns = userAnswers[q.id];
      if (userAns !== undefined && userAns !== null) {
        if (Number(userAns) === Number(q.correct_option)) {
          score += (q.marks || 1);
          correctCount++;
          categoryScores[catName].correct += 1;
          categoryScores[catName].score += (q.marks || 1);
        } else {
          wrongCount++;
          categoryScores[catName].wrong += 1;
        }
      } else {
        categoryScores[catName].unanswered += 1;
      }
    });

    const totalSecs = (exam?.time_limit_mins || 20) * 60;
    const timeTaken = examStartedAtMs
      ? Math.max(1, Math.floor((Date.now() - examStartedAtMs) / 1000))
      : Math.max(1, totalSecs - timeLeftSeconds);

    // Record submission to Supabase
    if (exam && !exam.id.startsWith('demo-')) {
      const submissionData = {
        custom_mock_exam_id: exam.id,
        registration_id: candidate?.id || null,
        user_name: candidate?.user_name || '',
        user_email: candidate?.user_email || '',
        user_phone: candidate?.user_phone || '',
        user_dob: candidate?.user_dob || null,
        user_department: candidate?.user_department || '',
        user_degree: candidate?.user_degree || '',
        user_address: candidate?.user_address || '',
        user_10th_mark: candidate?.user_10th_mark || null,
        user_12th_mark: candidate?.user_12th_mark || null,
        user_cgpa: candidate?.user_cgpa || null,
        user_year: candidate?.user_year || '',
        user_college: candidate?.user_college || '',
        user_reg_num: candidate?.user_reg_num || '',
        candidate_photo: candidate?.candidate_photo || null,
        status: 'SUBMITTED',
        score: score,
        total_questions: examQuestions.length,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        answers: userAnswers,
        visited_questions: visitedQuestions,
        category_scores: categoryScores,
        feedback_answers: feedbackAnswers,
        time_taken_seconds: Math.max(timeTaken, 1),
        tab_switch_count: tabSwitchCount,
        tab_switch_logs: tabSwitchLogs,
        updated_at: new Date().toISOString()
      };

      // Check existing submission record to update or insert safely
      const { data: existingRows } = await supabase
        .from('custom_mock_exam_submissions')
        .select('id')
        .eq('custom_mock_exam_id', exam.id)
        .eq('user_email', candidate.user_email.toLowerCase())
        .order('created_at', { ascending: false });

      let subResp = null;
      if (existingRows && existingRows.length > 0) {
        const primaryId = existingRows[0].id;
        const { data: updatedSub, error: updateErr } = await supabase
          .from('custom_mock_exam_submissions')
          .update(submissionData)
          .eq('id', primaryId)
          .select();

        if (updateErr) {
          console.error('Error updating custom_mock_exam_submissions:', updateErr);
        } else if (updatedSub && updatedSub.length > 0) {
          subResp = updatedSub[0];
        }

        // Clean up any extra duplicate draft rows if present
        if (existingRows.length > 1) {
          const extraIds = existingRows.slice(1).map(r => r.id);
          await supabase
            .from('custom_mock_exam_submissions')
            .delete()
            .in('id', extraIds);
        }
      } else {
        const { data: insertedSub, error: insertErr } = await supabase
          .from('custom_mock_exam_submissions')
          .insert([submissionData])
          .select();

        if (insertErr) {
          console.error('Error inserting custom_mock_exam_submissions:', insertErr);
        } else if (insertedSub && insertedSub.length > 0) {
          subResp = insertedSub[0];
        }
      }

      // Record into dedicated custom_mock_exam_tab_switches table
      try {
        await supabase.from('custom_mock_exam_tab_switches').insert({
          submission_id: subResp?.id || null,
          custom_mock_exam_id: exam.id,
          user_name: candidate?.user_name || '',
          user_email: candidate?.user_email || '',
          tab_switch_count: tabSwitchCount,
          switch_logs: tabSwitchLogs
        });
      } catch (e) {}
    }

    try {
      localStorage.removeItem(`custom_exam_test_session_${slug}`);
      if (candidate?.user_email) {
        localStorage.setItem(`custom_exam_submitted_${slug}_${candidate.user_email.toLowerCase()}`, 'true');
      }
    } catch (e) {}

    setIsSubmitting(false);
    setActiveStep('SUBMITTED');
  }

  function handleClosePortal() {
    try {
      sessionStorage.removeItem(`custom_exam_auth_${slug}`);
      localStorage.removeItem(`custom_exam_test_session_${slug}`);
    } catch (e) {}
    window.location.href = 'https://marvelslice.com';
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: GATE BLOCKED VIEW (BEFORE LOGIN OPEN OR AFTER LOGIN CLOSE)
  // -------------------------------------------------------------
  if (activeStep === 'GATE_BLOCKED') {
    const isNotOpen = gateReason === 'NOT_OPEN';

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
          
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            {isNotOpen ? <FiClock className="w-8 h-8" /> : <FiLock className="w-8 h-8 text-rose-600" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isNotOpen ? 'Candidate Login Not Open Yet' : 'Candidate Login Window Closed'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              {isNotOpen
                ? `Logins for "${exam?.title}" will open at ${new Date(exam?.registration_start_time).toLocaleString()}. Please check back once candidate login opens.`
                : `Logins for "${exam?.title}" closed at ${new Date(exam?.exam_end_time).toLocaleString()}. New logins are no longer permitted.`}
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-1.5 text-slate-700">
            <div className="font-bold text-slate-900">{exam?.title}</div>
            {isNotOpen && exam?.registration_start_time && (
              <div><span className="font-semibold text-slate-500">Login Open Time:</span> {new Date(exam.registration_start_time).toLocaleString()}</div>
            )}
            {exam?.exam_start_time && (
              <div><span className="font-semibold text-slate-500">Scheduled Exam Start Time:</span> {new Date(exam.exam_start_time).toLocaleString()}</div>
            )}
            {exam?.exam_end_time && (
              <div><span className="font-semibold text-slate-500">Login Close Time:</span> {new Date(exam.exam_end_time).toLocaleString()}</div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => initExam()}
              className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>

            <button
              type="button"
              onClick={handleClosePortal}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: WAITING LOBBY (COUNTDOWN TO EXAM START TIME)
  // -------------------------------------------------------------
  if (activeStep === 'WAITING_LOBBY') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 my-auto relative overflow-hidden">
          
          {/* CANDIDATE INFO HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {candidate?.candidate_photo ? (
                  <img src={candidate.candidate_photo} alt={candidate.user_name} className="w-full h-full object-cover" />
                ) : (
                  <FiUser className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{candidate?.user_name}</h3>
                <p className="text-xs text-slate-500 font-medium">{candidate?.user_department} • {candidate?.user_year}</p>
                <p className="text-[11px] text-brand-blue font-semibold">{candidate?.user_college}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Waiting Lobby
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-brand-blue">Candidate Waiting Room</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {exam?.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              You are logged in and ready! Please wait on this screen until the scheduled exam start time.
            </p>
          </div>

          {/* COUNTDOWN TIMER BADGE */}
          <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-2 shadow-xl border border-slate-800">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400 block">Exam Starts In</span>
            <div className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-tight flex items-center justify-center gap-2">
              <FiClock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-pulse shrink-0" />
              <span>{formatTime(lobbyTimeLeftSecs)}</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Scheduled Start: <span className="text-white font-semibold">{new Date(exam?.exam_start_time).toLocaleTimeString()}</span>
            </p>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-brand-blue text-left space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <FiShield className="w-4 h-4 text-brand-blue shrink-0" />
              <span>Exam Guidelines Reminder:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5 pl-1">
              <li>Do not refresh or close this tab while waiting.</li>
              <li>When countdown reaches 00:00, you will be prompted to start the exam.</li>
              <li>Duration: <span className="font-bold">{exam?.time_limit_mins || 20} Minutes</span> ({examQuestions.length} MCQs).</li>
            </ul>
          </div>
        </div>

        {/* POPUP MODAL WHEN COUNTDOWN REACHES 0 */}
        {showExamStartedPopup && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <FiPlayCircle className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Exam Started! 🎉</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  The scheduled exam time has arrived. Click below to view exam instructions and begin your test.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExamStartedPopup(false);
                  setActiveStep('INSTRUCTIONS');
                }}
                className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Continue to Exam Instructions</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: REVIEW MARKED QUESTIONS (BEFORE FEEDBACK)
  // -------------------------------------------------------------
  if (activeStep === 'REVIEW_MARKED') {
    const markedQList = examQuestions.filter(q => markedForReview[q.id] === true);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[90vh] flex flex-col">
          <div className="border-b border-slate-100 pb-4 text-center shrink-0">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-600 border border-purple-100 inline-flex items-center gap-1">
              <FiBookmark className="w-3 h-3 text-purple-600" />
              Review Marked Questions ({markedQList.length})
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Review Questions Marked for Review
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              You marked {markedQList.length} question(s) for review. You can change options, keep current answers, or unmark questions before submitting.
            </p>
          </div>

          <div className="overflow-y-auto flex-1 space-y-6 pr-1">
            {markedQList.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <FiCheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No questions marked for review!</p>
                <p className="text-xs text-slate-500">All marked questions have been reviewed or unmarked.</p>
              </div>
            ) : (
              markedQList.map((q) => {
                const originalIndex = examQuestions.findIndex(item => item.id === q.id);
                const currentAns = userAnswers[q.id];

                return (
                  <div key={q.id} className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-brand-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {originalIndex + 1}
                        </span>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-500 block">Question #{originalIndex + 1}</span>
                          {q.category_name && (
                            <span className="text-[10px] font-medium text-slate-400">{q.category_name}</span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMarkedForReview(prev => ({ ...prev, [q.id]: false }))}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <FiBookmark className="w-3 h-3 fill-rose-600" />
                        <span>Unmark</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                      {q.question_text}
                    </p>

                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = currentAns === optIdx;
                        const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
                        const label = optionLabels[optIdx] || String(optIdx + 1);

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleOptionSelect(q.id, optIdx)}
                            className={`p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-brand-blue text-brand-blue font-bold shadow-sm'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {label}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isSelected && (
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-brand-blue/10 text-brand-blue">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                      <span className="text-slate-500 font-medium">
                        {currentAns !== undefined ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <FiCheck className="w-3.5 h-3.5" /> Answered (Option {['A','B','C','D','E','F'][currentAns]})
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Not Answered Yet</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMarkedForReview(prev => ({ ...prev, [q.id]: false }))}
                        className="text-xs font-bold text-slate-600 hover:text-brand-blue transition-colors cursor-pointer"
                      >
                        Keep Current Answer & Confirm
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveStep('QUIZ')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
            >
              Back to Questions
            </button>

            <button
              type="button"
              onClick={() => setActiveStep('FEEDBACK')}
              className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Proceed to Feedback</span>
              <FiArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: FEEDBACK STEP (BEFORE FINAL SUBMISSION)
  // -------------------------------------------------------------
  if (activeStep === 'FEEDBACK') {
    const feedbackList = (exam?.feedback_questions && Array.isArray(exam.feedback_questions) && exam.feedback_questions.length > 0)
      ? exam.feedback_questions
      : [
          {
            id: 'fb-matrix-1',
            type: 'matrix',
            question_text: 'Please choose the best answer for each of the following:',
            matrix_columns: ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree', 'N/A'],
            matrix_rows: [
              'The online class materials were useful and accurate',
              'The class description accurately described the class content',
              'The technology used was appropriate for this online class',
              'Exams were based on material covered in assignments and lectures',
              'I was technically prepared for this class',
              'I was academically prepared for this class',
              'The instructor was qualified to teach this class',
              'The class size was appropriate'
            ]
          },
          { id: 'fb-rating-overall', type: 'rating', question_text: 'Overall Satisfaction' },
          { id: 'fb-overall-exp', type: 'text', question_text: 'Suggestions or Comments:' }
        ];

    const hasMatrixQuestion = feedbackList.some(f => f.type === 'matrix');

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className={`bg-white rounded-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto ${
          hasMatrixQuestion ? 'max-w-4xl max-h-[90vh] flex flex-col' : 'max-w-lg'
        }`}>
          <div className="border-b border-slate-100 pb-4 text-center shrink-0">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-100">
              Exam Experience Feedback
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Share Your Feedback
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Please complete all required feedback questions below before submitting your exam. <span className="text-rose-500 font-semibold">(All fields are mandatory *)</span>
            </p>
          </div>

          <div className="space-y-5 overflow-y-auto flex-1 pr-1">
            {feedbackList.map((fb, idx) => {
              const currentText = typeof feedbackAnswers[fb.id] === 'string' ? feedbackAnswers[fb.id] : '';

              return (
                <div key={fb.id || idx} className="space-y-3 p-4 bg-slate-50/90 border border-slate-200 rounded-2xl">
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    {idx + 1}. {fb.question_text.replace(/\s*\([^)]*5 sentences[^)]*\)/gi, '')} <span className="text-rose-500">*</span>
                  </label>

                  {fb.type === 'matrix' ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-200/80 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                            <th className="p-3 bg-slate-200/80 font-extrabold">Statements</th>
                            {(fb.matrix_columns || ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree', 'N/A']).map((col, cIdx) => (
                              <th key={cIdx} className="p-3 text-center font-extrabold min-w-[95px]">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {(fb.matrix_rows || [
                            'The online class materials were useful and accurate',
                            'The class description accurately described the class content',
                            'The technology used was appropriate for this online class',
                            'Exams were based on material covered in assignments and lectures',
                            'I was technically prepared for this class',
                            'I was academically prepared for this class',
                            'The instructor was qualified to teach this class',
                            'The class size was appropriate'
                          ]).map((rowStatement, rIdx) => {
                            const matrixAnsObj = feedbackAnswers[fb.id] || {};
                            const selectedCol = matrixAnsObj[rowStatement];

                            return (
                              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 text-xs font-semibold text-slate-800 leading-snug">
                                  {rowStatement}
                                </td>
                                {(fb.matrix_columns || ['Strongly Agree', 'Agree', 'Disagree', 'Strongly Disagree', 'N/A']).map((col, cIdx) => {
                                  const isChecked = selectedCol === col;
                                  return (
                                    <td key={cIdx} className="p-3 text-center align-middle">
                                      <label className="inline-flex items-center justify-center p-1 cursor-pointer">
                                        <input
                                          type="radio"
                                          name={`matrix-${fb.id}-${rIdx}`}
                                          checked={isChecked}
                                          onChange={() => {
                                            setFeedbackAnswers(prev => ({
                                              ...prev,
                                              [fb.id]: {
                                                ...(prev[fb.id] || {}),
                                                [rowStatement]: col
                                              }
                                            }));
                                          }}
                                          className="w-4 h-4 text-brand-blue border-slate-300 focus:ring-brand-blue cursor-pointer"
                                        />
                                      </label>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : fb.type === 'rating' ? (
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const currentVal = typeof feedbackAnswers[fb.id] === 'number' ? feedbackAnswers[fb.id] : 0;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setFeedbackAnswers(prev => ({ ...prev, [fb.id]: starVal }))}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              currentVal >= starVal ? 'bg-amber-100 border-amber-300 text-amber-500 scale-105' : 'bg-white border-slate-200 text-slate-300'
                            }`}
                          >
                            <FiStar className="w-5 h-5 fill-current" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <textarea
                        rows={4}
                        value={currentText}
                        onChange={e => {
                          setFeedbackError('');
                          setFeedbackAnswers(prev => ({ ...prev, [fb.id]: e.target.value }));
                        }}
                        placeholder="Write your feedback here..."
                        className="w-full p-3 bg-white border border-slate-300 focus:ring-2 focus:ring-brand-blue/20 rounded-xl text-xs text-slate-800 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {feedbackError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 shrink-0">
              <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{feedbackError}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleFinalSubmissionWithValidation}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
              <FiCheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: SUBMITTED CONFIRMATION & CELEBRATION
  // -------------------------------------------------------------
  if (activeStep === 'SUBMITTED') {
    const totalQCount = examQuestions.length;
    const answeredCount = Object.keys(userAnswers).filter(id => userAnswers[id] !== undefined).length;
    const totalSecs = (exam?.time_limit_mins || 20) * 60;
    const timeTaken = examStartedAtMs
      ? Math.max(1, Math.floor((Date.now() - examStartedAtMs) / 1000))
      : Math.max(1, totalSecs - timeLeftSeconds);

    const categoriesList = (exam?.exam_categories && Array.isArray(exam.exam_categories) && exam.exam_categories.length > 0)
      ? exam.exam_categories
      : Array.from(new Set(examQuestions.map(q => q.category_name).filter(Boolean)));

    const categoryStats = categoriesList.map(cat => {
      const catQs = examQuestions.filter(q => (q.category_name || categoriesList[0]) === cat);
      const catAnswered = catQs.filter(q => userAnswers[q.id] !== undefined).length;
      return { catName: cat, total: catQs.length, answered: catAnswered };
    });

    function formatTimeTaken(seconds) {
      if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00 (0 secs)';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      const formattedMins = mins.toString().padStart(2, '0');
      const formattedSecs = secs.toString().padStart(2, '0');
      if (mins > 0 && secs > 0) return `${formattedMins}:${formattedSecs} (${mins} min${mins > 1 ? 's' : ''} ${secs} sec${secs > 1 ? 's' : ''})`;
      if (mins > 0) return `${formattedMins}:${formattedSecs} (${mins} min${mins > 1 ? 's' : ''})`;
      return `${formattedMins}:${formattedSecs} (${secs} sec${secs > 1 ? 's' : ''})`;
    }

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <FireworksCrackerCanvas />
        <div className="bg-white rounded-3xl max-w-xl sm:max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-center space-y-4 my-auto relative z-20 animate-in fade-in zoom-in-95 duration-200">
          
          {/* MARVEL SLICE BRAND & LOGO (FIRST TOP) */}
          <div className="flex items-center justify-center gap-2.5">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Marvel Slice Logo" className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs" />
            ) : (
              <img src="/apple-touch-icon.png" alt="Marvel Slice Logo" className="h-10 sm:h-12 w-10 sm:w-12 object-contain drop-shadow-xs" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
              Marvel <span className="text-brand-orange">Slice</span>
            </span>
          </div>

          {/* EXAM SUBMITTED SUCCESSFULLY! WITH ORIGINAL GREEN CHECK CIRCLE */}
          <div className="flex items-center justify-center gap-2 sm:gap-2.5">
            <FiCheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500 shrink-0" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
              Exam Submitted Successfully! 🎉
            </h2>
          </div>

          {/* SUMMARY DETAILS CARD - WIDER & COMPACT WITH CATEGORY STATS */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2.5 text-slate-700 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-b border-slate-200/80 pb-2">
              <div>
                <span className="font-bold text-slate-500 block text-[11px]">Exam Title:</span>
                <span className="font-semibold text-slate-900 truncate block">{exam?.title}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 block text-[11px]">Candidate Name:</span>
                <span className="font-semibold text-slate-900 block">{candidate?.user_name}</span>
              </div>
            </div>

            {/* STATS BY CATEGORY */}
            {categoryStats.length > 0 && (
              <div className="border-b border-slate-200/80 pb-2.5">
                <span className="font-bold text-slate-500 block text-[11px] mb-1.5">Category Stats:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {categoryStats.map((cs, cIdx) => (
                    <div key={cIdx} className="flex justify-between items-center bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[150px]">{cs.catName}</span>
                      <span className="font-bold text-brand-blue">{cs.answered} / {cs.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OVERALL ATTENDED & TIME TAKEN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-500 text-[11px]">Total Attempted Overall:</span>
                <span className="font-bold text-brand-blue text-xs">{answeredCount} of {totalQCount} MCQs</span>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-500 text-[11px]">Time Taken:</span>
                <span className="font-bold text-emerald-700 text-xs">{formatTimeTaken(timeTaken)}</span>
              </div>
            </div>
          </div>

          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={handleClosePortal}
              className="px-8 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center justify-center"
            >
              Exit & Close Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STEP: ACTIVE TIMED MOCK EXAM INTERFACE (ALL CIRCLES)
  // -------------------------------------------------------------
  const totalQCount = examQuestions.length;
  const answeredCount = Object.keys(userAnswers).filter(id => userAnswers[id] !== undefined).length;
  const markedCount = Object.keys(markedForReview).filter(id => markedForReview[id] === true).length;
  const visitedCount = Object.keys(visitedQuestions).filter(id => visitedQuestions[id] === true).length;
  const unansweredCount = Math.max(0, totalQCount - answeredCount);

  const totalMins = exam?.time_limit_mins || 20;
  const totalSeconds = totalMins * 60;
  const halfTimeSeconds = totalSeconds / 2;
  const sevenMinsSeconds = 420;

  let timerColorClass = "text-emerald-600";
  if (timeLeftSeconds <= sevenMinsSeconds) {
    timerColorClass = "text-rose-600 animate-pulse";
  } else if (timeLeftSeconds <= halfTimeSeconds) {
    timerColorClass = "text-amber-500";
  } else {
    timerColorClass = "text-emerald-600";
  }

  return (
    <div className="cem-test fixed inset-0 z-50 bg-[#e3e3e3] flex flex-col text-slate-800 overflow-hidden">
      {/* TOP HEADER WITH EXAM TITLE (COMPACT SPACING) */}
      <header className="bg-white border-b border-slate-200 px-4 py-1 shrink-0 shadow-2xs z-20 flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2 select-none cursor-default justify-center">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Marvel Slice Logo" className="h-6 sm:h-7 w-auto object-contain pointer-events-none" />
          ) : (
            <img src="/apple-touch-icon.png" alt="Marvel Slice Logo" className="h-5 sm:h-6 w-5 sm:w-6 object-contain pointer-events-none" onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <span className="text-base sm:text-lg font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
            Marvel <span className="text-brand-orange">Slice</span>
          </span>
        </div>
        {exam?.title && (
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight mt-0.5">
            {exam.title}
          </h2>
        )}
      </header>

      {/* CANDIDATE INFO & LIVE TIMER BAR (WHITE BG) */}
      <div className={activeStep === 'INSTRUCTIONS' ? "bg-white border-b border-slate-200 px-4 sm:px-6 py-1.5 sm:py-2 shrink-0 z-10 shadow-2xs" : "cem-timerbar bg-white border-b border-slate-200 px-8 sm:px-16 lg:px-28 py-1.5 sm:py-2 shrink-0 z-10 shadow-2xs"}>
        <div className={activeStep === 'INSTRUCTIONS' ? "max-w-[1000px] w-full mx-auto flex items-center justify-between gap-3 sm:gap-6" : "w-full flex items-center justify-between gap-3 sm:gap-6"}>
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="cem-candidate-photo w-[72px] h-[72px] sm:w-[84px] sm:h-[84px] rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
              {candidate?.candidate_photo ? (
                <img src={candidate.candidate_photo} alt={candidate.user_name} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-9 h-9 text-slate-400" />
              )}
            </div>
            <div className="cem-candidate-meta text-[13px] leading-snug text-slate-800 font-semibold space-y-0.5 min-w-0">
              <div className="truncate"><span className="font-semibold text-slate-500">Name:</span> {candidate?.user_name}</div>
              {candidate?.user_reg_num && (
                <div className="truncate"><span className="font-semibold text-slate-500">Reg No:</span> <span className="font-mono font-bold text-brand-blue">{candidate.user_reg_num}</span></div>
              )}
              <div className="cem-hide-xs truncate"><span className="font-semibold text-slate-500">Dept:</span> {candidate?.user_department}</div>
              <div className="cem-hide-xs truncate"><span className="font-semibold text-slate-500">Year:</span> {candidate?.user_year}</div>
              {candidate?.user_college && (
                <div className="cem-hide-xs truncate"><span className="font-semibold text-slate-500">College:</span> {candidate?.user_college}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0 ml-auto justify-end">
            {activeStep === 'INSTRUCTIONS' ? (
              <div className="font-mono text-[13px] sm:text-sm font-bold text-slate-700">
                <span className="text-slate-600 font-semibold">Duration:</span> <span>{exam?.time_limit_mins || 20} Mins</span>
              </div>
            ) : (
              <div className="font-mono text-base sm:text-lg font-black tracking-tight text-slate-700 flex items-center gap-1.5">
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 shrink-0" />
                <span className={timerColorClass}>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUIZ MAIN BODY: INSTRUCTIONS OR (QUESTION AREA + SIDEBAR) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[#e3e3e3]">
        {activeStep === 'INSTRUCTIONS' ? (
          <div className="flex-1 min-h-0 px-3 sm:px-6 py-2 sm:py-3 bg-[#e3e3e3] flex flex-col items-center overflow-y-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-200 flex flex-col max-w-[1000px] w-full mx-auto max-h-full space-y-3">
              
              <div className="shrink-0 text-center">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Exam Instructions & Guidelines
                </h1>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                  (<span className="text-red-600">Please read all instructions carefully before starting the exam.</span>)
                </p>
              </div>

              <div className="overflow-y-auto pr-2 space-y-3 text-slate-700 min-h-0">
                {exam?.rules_text ? (
                  <div className="text-[17px] text-slate-700 leading-[2.2] whitespace-pre-line font-medium">
                    {exam.rules_text.replace(/(\d+)\.([^\s\d])/g, '$1. $2')}
                  </div>
                ) : (
                  <ol className="list-decimal list-inside text-[17px] text-slate-700 font-medium leading-[2.2]">
                    <li>Stay on the official exam website with a stable internet connection throughout the test.</li>
                    <li>Do not refresh, close, or leave the exam page while the test is running.</li>
                    <li>Do not switch browser tabs or windows — tab switches are tracked and reported.</li>
                    <li>Do not leak, share, screenshot, or distribute any exam questions or content.</li>
                    <li>Each question carries 1 mark with no negative marking; the exam auto-submits when the timer expires.</li>
                  </ol>
                )}

                <div className="space-y-2 pt-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeInstructions}
                      onChange={e => setAgreeInstructions(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-brand-blue rounded border-slate-300 focus:ring-brand-blue cursor-pointer shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug">
                      I have read, understood, and agree to abide by all the examination instructions, candidate rules, and guidelines stated above. <span className="text-rose-500">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-brand-blue rounded border-slate-300 focus:ring-brand-blue cursor-pointer shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-slate-800 font-semibold leading-snug">
                      I agree to the <Link to="/terms" target="_blank" className="text-brand-blue underline hover:text-blue-700">Terms & Conditions</Link> and <Link to="/privacy" target="_blank" className="text-brand-blue underline hover:text-blue-700">Privacy Policy</Link>. <span className="text-rose-500">*</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="shrink-0 pt-3 border-t border-slate-100 flex justify-center bg-white">
                <button
                  type="button"
                  disabled={!agreeInstructions || !agreeTerms}
                  onClick={handleStartExam}
                  className="px-8 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Start Exam</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* QUESTION AREA */}
            <div className="flex-1 lg:w-[76%] min-h-0 flex flex-col bg-white order-1 lg:order-1">
          {examQuestions.length > 0 && (
            <div className="cem-qarea flex-1 min-h-0 flex flex-col w-full px-8 sm:px-16 lg:px-28 py-2.5 sm:py-3.5 bg-white">
              {(() => {
                const categoriesList = (exam?.exam_categories && Array.isArray(exam.exam_categories) && exam.exam_categories.length > 0)
                  ? exam.exam_categories
                  : Array.from(new Set(examQuestions.map(q => q.category_name).filter(Boolean)));

                if (categoriesList.length <= 1) return null;

                const currentCat = examQuestions[currentQIndex]?.category_name || categoriesList[0];

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 border-b border-slate-200 no-scrollbar shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">Sections:</span>
                    {categoriesList.map((cat, cIdx) => {
                      const catQCount = examQuestions.filter(q => (q.category_name || categoriesList[0]) === cat).length;
                      const isActive = currentCat === cat;
                      return (
                        <button
                          key={cIdx}
                          type="button"
                          onClick={() => {
                            const firstQIndex = examQuestions.findIndex(q => (q.category_name || categoriesList[0]) === cat);
                            if (firstQIndex !== -1) setCurrentQIndex(firstQIndex);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                            isActive
                              ? 'bg-brand-blue text-white border-brand-blue shadow-xs ring-2 ring-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat} ({catQCount})
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2.5 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                    Question {currentQIndex + 1} of {examQuestions.length}
                  </span>
                  {examQuestions[currentQIndex]?.category_name && (
                    <span className="text-[10px] font-bold text-brand-blue bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase">
                      {examQuestions[currentQIndex].category_name}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  +{examQuestions[currentQIndex]?.marks || 1} Mark
                </span>
              </div>

              <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-0.5 space-y-3 sm:space-y-4 min-h-0 bg-white">
                <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-900 whitespace-pre-line">
                  {examQuestions[currentQIndex]?.question_text}
                </p>

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
                            : 'bg-slate-50/60 border-2 border-slate-200/90 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-brand-blue text-white' : 'bg-white text-slate-800 border border-slate-300'
                        }`}>
                          {optLabel}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                          {optText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS BAR */}
              <div className="pt-3 sm:pt-4 mt-3 border-t border-slate-200 shrink-0 bg-white">
                <div className="cem-actionbar flex items-center justify-between gap-3 sm:gap-6 lg:gap-8 overflow-x-auto py-2 no-scrollbar w-full">
                  <button
                    type="button"
                    disabled={timeLeftSeconds <= 0}
                    onClick={() => {
                      if (timeLeftSeconds <= 0) return; // Locked after time expires: submit only
                      const qId = examQuestions[currentQIndex]?.id;
                      if (qId) setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
                    }}
                    className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-xs text-white transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 disabled:opacity-40 ${
                      markedForReview[examQuestions[currentQIndex]?.id] ? 'bg-brand-orange ring-2 ring-amber-400' : 'bg-brand-orange'
                    }`}
                  >
                    {markedForReview[examQuestions[currentQIndex]?.id] ? 'Marked for Review' : 'Mark for review'}
                  </button>

                  <div className="inline-flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={currentQIndex === 0}
                      onClick={() => setCurrentQIndex(prev => Math.max(prev - 1, 0))}
                      className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-l-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-[11px] sm:text-xs disabled:opacity-40 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentQIndex === examQuestions.length - 1}
                      onClick={handleSaveAndNext}
                      className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-r-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-[11px] sm:text-xs disabled:opacity-40 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Save & Next
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSubmitConfirmModal(true)}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-brand-green hover:bg-brand-green/90 text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR PALETTE */}
        <div className="w-full lg:w-[24%] bg-slate-100 border-t lg:border-t-0 lg:border-l border-slate-200 pt-2 px-3 sm:px-4 pb-3 sm:pb-4 shrink-0 flex flex-col min-h-0 justify-between order-2 lg:order-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 shrink-0 mb-1 mt-0">
            Question Palette ({examQuestions.length})
          </h3>

          <div className="w-full sm:aspect-square overflow-y-auto pr-1 max-h-60 sm:max-h-none no-scrollbar sm:custom-scrollbar">
            <div className="cem-palette-grid w-full grid grid-cols-5 gap-1.5 sm:gap-1.5">
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
                      <svg viewBox="0 0 32 32" className="w-full h-full overflow-visible scale-[0.97] transform origin-center">
                        <defs>
                          <linearGradient id={`sq-bg-green-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#93d21b" />
                            <stop offset="45%" stopColor="#74a916" />
                            <stop offset="100%" stopColor="#4d7c0f" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-purple-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="45%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7e22ce" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-dual-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#74a916" />
                            <stop offset="49.9%" stopColor="#74a916" />
                            <stop offset="50.1%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-red-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ff4d4d" />
                            <stop offset="45%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="#991b1b" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-blue-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="45%" stopColor="#2563eb" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-gray-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="45%" stopColor="#f8fafc" />
                            <stop offset="100%" stopColor="#e2e8f0" />
                          </linearGradient>

                          <linearGradient id={`sq-diag-gloss-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>

                          <linearGradient id={`sq-top-glow-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {isCurrent && (
                          <rect x="0.8" y="0.8" width="30.4" height="30.4" rx="7" ry="7" fill="none" stroke="#2563eb" strokeWidth="2.0" className="animate-pulse" />
                        )}

                        <rect
                          x="3"
                          y="3"
                          width="26"
                          height="26"
                          rx="6"
                          ry="6"
                          fill={
                            orbType === 'answered' ? `url(#sq-bg-green-${idx})` :
                            orbType === 'marked' ? `url(#sq-bg-purple-${idx})` :
                            orbType === 'answered-marked' ? `url(#sq-bg-dual-${idx})` :
                            orbType === 'not-answered' ? `url(#sq-bg-red-${idx})` :
                            orbType === 'current' && !isVisited ? `url(#sq-bg-blue-${idx})` :
                            `url(#sq-bg-gray-${idx})`
                          }
                          stroke={orbType === 'unvisited' ? '#cbd5e1' : 'rgba(0,0,0,0.18)'}
                          strokeWidth="1.0"
                        />

                        <rect
                          x="4"
                          y="4"
                          width="24"
                          height="11"
                          rx="4"
                          ry="4"
                          fill={`url(#sq-top-glow-${idx})`}
                          opacity="0.5"
                        />

                        <path
                          d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z"
                          fill={`url(#sq-diag-gloss-${idx})`}
                          opacity="0.8"
                        />

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

          <div className="p-3.5 sm:p-4 border-t border-slate-200 text-xs sm:text-sm text-slate-800 space-y-2.5 mt-3 shrink-0 bg-slate-100/90 rounded-2xl">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#74a916" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
              </svg>
              <span className="font-semibold text-slate-800">Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#dc2626" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
              </svg>
              <span className="font-semibold text-slate-800">Not Answered</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#a855f7" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
              </svg>
              <span className="font-semibold text-slate-800">Marked for Review</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                <defs>
                  <linearGradient id="legend-sq-bg-dual" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#74a916" />
                    <stop offset="49.9%" stopColor="#74a916" />
                    <stop offset="50.1%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="url(#legend-sq-bg-dual)" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
              </svg>
              <span className="font-semibold text-slate-800">Answered & Marked for Review</span>
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 32 32" className="w-6 h-6 shrink-0">
                <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.5" />
              </svg>
              <span className="font-semibold text-slate-800">Not Visited</span>
            </div>
          </div>
        </div>
      </>
    )}
  </div>

  {/* SUBMIT CONFIRMATION POPUP MODAL */}
  {showSubmitConfirmModal && (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-brand-blue flex items-center justify-center mx-auto shadow-xs">
          <FiAlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Confirm Test Submission</h3>
          <p className="text-xs text-slate-600 font-medium leading-relaxed">
            {unansweredCount > 0
              ? `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''} out of ${totalQCount}. Are you sure you want to submit?`
              : `All ${totalQCount} questions have been answered! Are you sure you want to submit?`}
          </p>
        </div>

        {/* SUMMARY STATS GRID */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
          <div className="bg-white p-2 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Answered</span>
            <span className="text-base font-black text-emerald-600">{answeredCount}</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Unanswered</span>
            <span className="text-base font-black text-rose-600">{unansweredCount}</span>
          </div>
          <div className="bg-white p-2 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Marked</span>
            <span className="text-base font-black text-purple-600">{markedCount}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowSubmitConfirmModal(false)}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            Cancel / Return
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSubmitConfirmModal(false);
              triggerFeedbackOrSubmit();
            }}
            className="flex-1 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <span>Confirm & Submit</span>
            <FiCheck className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )}
</div>
);
}
