import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiClock, FiCheckCircle, FiX, FiCheck, FiAward, FiShield, FiUser,
  FiRefreshCw, FiStar, FiMessageSquare, FiArrowRight
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';

// CONFETTI CANVAS CELEBRATION ENGINE
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
        p.vy += 0.28;
        p.vx *= 0.98;
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

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
}

export default function CustomExamTest() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Flow Step: 'INSTRUCTIONS' | 'QUIZ' | 'FEEDBACK' | 'SUBMITTED'
  const [activeStep, setActiveStep] = useState('INSTRUCTIONS');
  const [isSessionRestored, setIsSessionRestored] = useState(false);
  const [agreeInstructions, setAgreeInstructions] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Quiz State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { [qId]: optionIdx }
  const [markedForReview, setMarkedForReview] = useState({}); // { [qId]: boolean }
  const [visitedQuestions, setVisitedQuestions] = useState({}); // { [qId]: boolean }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback State { [fbId]: ratingOrText }
  const [feedbackAnswers, setFeedbackAnswers] = useState({});

  const timerRef = useRef(null);

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

    // Check if candidate already submitted this exam previously in DB with actual answered questions
    if (currentExam.id && !currentExam.id.startsWith('demo-') && authCand?.user_email) {
      const { data: existingSub } = await supabase
        .from('custom_mock_exam_submissions')
        .select('*')
        .eq('custom_mock_exam_id', currentExam.id)
        .eq('user_email', authCand.user_email.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const hasValidAnswers = existingSub?.answers && typeof existingSub.answers === 'object' && Object.keys(existingSub.answers).length > 0;

      if (existingSub && hasValidAnswers) {
        setUserAnswers(existingSub.answers || {});
        setFeedbackAnswers(existingSub.feedback_answers || {});
        setActiveStep('SUBMITTED');
        setLoading(false);
        return;
      }
    }

    setLoading(false);

    // Restore cached exam session if page was refreshed
    restoreSessionFromCache(currentExam, questions);
  }

  function handleStartExam() {
    if (!agreeInstructions || !agreeTerms) return;
    const initialVisited = examQuestions[0]?.id ? { [examQuestions[0].id]: true } : {};
    setVisitedQuestions(initialVisited);
    setActiveStep('QUIZ');

    // Immediately persist QUIZ activeStep so browser refresh never shows instructions
    const fullExamSecs = (exam?.time_limit_mins || 20) * 60;
    const sessionData = {
      activeStep: 'QUIZ',
      currentQIndex: 0,
      userAnswers: {},
      markedForReview: {},
      visitedQuestions: initialVisited,
      feedbackAnswers: {},
      timeLeftSeconds: timeLeftSeconds || fullExamSecs,
      savedAtTimestampMs: Date.now()
    };
    try {
      localStorage.setItem(`custom_exam_test_session_${slug}`, JSON.stringify(sessionData));
    } catch (e) {}
  }

  function restoreSessionFromCache(currentExam, questions) {
    let fullExamSecs = (currentExam.time_limit_mins || 20) * 60;
    if (currentExam.exam_end_time) {
      const endMs = new Date(currentExam.exam_end_time).getTime();
      fullExamSecs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
    }

    try {
      const raw = localStorage.getItem(`custom_exam_test_session_${slug}`);
      if (!raw) {
        setTimeLeftSeconds(fullExamSecs);
        setActiveStep('INSTRUCTIONS');
        return;
      }

      const cached = JSON.parse(raw);
      if (!cached || !cached.activeStep || cached.activeStep === 'INSTRUCTIONS') {
        setTimeLeftSeconds(fullExamSecs);
        setActiveStep('INSTRUCTIONS');
        return;
      }

      // If already submitted, clear session and reset to instructions
      if (cached.activeStep === 'SUBMITTED') {
        try { localStorage.removeItem(`custom_exam_test_session_${slug}`); } catch (e) {}
        setTimeLeftSeconds(fullExamSecs);
        setActiveStep('INSTRUCTIONS');
        return;
      }

      const elapsedSecs = Math.floor((Date.now() - (cached.savedAtTimestampMs || Date.now())) / 1000);
      const remainingSecs = Math.max(0, (cached.timeLeftSeconds || fullExamSecs) - elapsedSecs);

      // Restore active session state
      if (cached.userAnswers) setUserAnswers(cached.userAnswers);
      if (cached.markedForReview) setMarkedForReview(cached.markedForReview);
      if (cached.visitedQuestions) setVisitedQuestions(cached.visitedQuestions);
      if (cached.feedbackAnswers) setFeedbackAnswers(cached.feedbackAnswers);
      if (cached.currentQIndex !== undefined) setCurrentQIndex(cached.currentQIndex);

      if (remainingSecs > 0) {
        setTimeLeftSeconds(remainingSecs);
        setActiveStep(cached.activeStep || 'QUIZ');
        setIsSessionRestored(true);
      } else {
        // Time expired during refresh -> trigger submit
        setTimeLeftSeconds(0);
        setActiveStep('QUIZ');
        setIsSessionRestored(true);
        setTimeout(() => {
          triggerFeedbackOrSubmit();
        }, 500);
      }
    } catch (e) {
      setTimeLeftSeconds(fullExamSecs);
      setActiveStep('INSTRUCTIONS');
    }
  }

  // Persist session to localStorage across page reloads
  useEffect(() => {
    if (!exam || activeStep === 'SUBMITTED') {
      try { localStorage.removeItem(`custom_exam_test_session_${slug}`); } catch (e) {}
      return;
    }

    const sessionData = {
      activeStep,
      currentQIndex,
      userAnswers,
      markedForReview,
      visitedQuestions,
      feedbackAnswers,
      timeLeftSeconds,
      savedAtTimestampMs: Date.now()
    };

    try {
      localStorage.setItem(`custom_exam_test_session_${slug}`, JSON.stringify(sessionData));
    } catch (e) {}
  }, [activeStep, currentQIndex, userAnswers, markedForReview, visitedQuestions, feedbackAnswers, timeLeftSeconds, exam]);

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

  // Countdown timer effect
  useEffect(() => {
    if (activeStep === 'QUIZ' && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            triggerFeedbackOrSubmit();
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

  // Prevent scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  function handleOptionSelect(qId, optIdx) {
    setUserAnswers(prev => ({ ...prev, [qId]: optIdx }));
  }

  function triggerFeedbackOrSubmit() {
    if (exam?.feedback_questions && Array.isArray(exam.feedback_questions) && exam.feedback_questions.length > 0) {
      setActiveStep('FEEDBACK');
    } else {
      executeFinalSubmission();
    }
  }

  async function executeFinalSubmission() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
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
          categoryScores[catName].score -= 0.25;
        }
      } else {
        categoryScores[catName].unanswered += 1;
      }
    });

    const totalSecs = (exam?.time_limit_mins || 20) * 60;
    const timeTaken = totalSecs - timeLeftSeconds;

    // Record submission to Supabase
    if (exam && !exam.id.startsWith('demo-')) {
      const { error } = await supabase.from('custom_mock_exam_submissions').insert({
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
        candidate_photo: candidate?.candidate_photo || null,
        score: score,
        total_questions: examQuestions.length,
        correct_answers: correctCount,
        wrong_answers: wrongCount,
        answers: userAnswers,
        category_scores: categoryScores,
        feedback_answers: feedbackAnswers,
        time_taken_seconds: Math.max(timeTaken, 1)
      });

      if (error) {
        console.error('Error inserting custom_mock_exam_submission:', error);
      }
    }

    setIsSubmitting(false);
    setActiveStep('SUBMITTED');
  }

  function handleClosePortal() {
    try {
      sessionStorage.removeItem(`custom_exam_auth_${slug}`);
      localStorage.removeItem(`custom_exam_test_session_${slug}`);
    } catch (e) {}
    navigate(`/custom-exam/login/${slug}`);
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
  // STEP: FEEDBACK STEP (BEFORE FINAL SUBMISSION)
  // -------------------------------------------------------------
  if (activeStep === 'FEEDBACK') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto">
          <div className="border-b border-slate-100 pb-4 text-center">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-100">
              Exam Experience Feedback
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-2">
              Share Your Feedback
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Please answer the questions below before finalizing your test submission.</p>
          </div>

          <div className="space-y-5">
            {exam?.feedback_questions?.map((fb, idx) => (
              <div key={fb.id || idx} className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <label className="block text-xs font-bold text-slate-800 leading-snug">
                  {idx + 1}. {fb.question_text}
                </label>

                {fb.type === 'rating' ? (
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const currentVal = feedbackAnswers[fb.id] || 0;
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
                  <textarea
                    rows={3}
                    value={feedbackAnswers[fb.id] || ''}
                    onChange={e => setFeedbackAnswers(prev => ({ ...prev, [fb.id]: e.target.value }))}
                    placeholder="Type your response here..."
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-brand-blue/20"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={executeFinalSubmission}
              disabled={isSubmitting}
              className="w-full py-3 bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Complete & Submit Exam'}</span>
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
    const answeredCount = Object.keys(userAnswers).length;
    const markedCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
    const totalSecs = (exam?.time_limit_mins || 20) * 60;
    const timeTaken = Math.max(1, totalSecs - timeLeftSeconds);

    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <ConfettiCanvas />
        <div className="bg-white rounded-3xl max-w-lg w-full p-7 sm:p-9 shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200 my-auto relative z-10">
          
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-lg ring-8 ring-amber-50 animate-bounce">
              <FiAward className="w-12 h-12 text-amber-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
              <FiCheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Marvel Slice Logo" className="h-6 sm:h-7 w-auto object-contain" />
              ) : (
                <img src="/apple-touch-icon.png" alt="Marvel Slice Logo" className="h-6 w-6 object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <span className="text-sm font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
                Marvel <span className="text-brand-orange">Slice</span>
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
              🎉 Congratulations!
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Exam Submitted Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Great job, <span className="font-bold text-slate-900">{candidate?.user_name}</span>! Your exam attempt and feedback have been securely recorded.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left text-xs space-y-2 text-slate-700">
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Exam Title:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">{exam?.title}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
              <span className="font-bold text-slate-500">Candidate Name:</span>
              <span className="font-semibold text-slate-900">{candidate?.user_name}</span>
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

          <div className="pt-2">
            <button
              type="button"
              onClick={handleClosePortal}
              className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer"
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
  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col text-slate-800 overflow-hidden">
      {/* TOP HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 shadow-2xs z-20 flex items-center justify-center text-center">
        <div className="flex items-center gap-3 select-none cursor-default justify-center">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Marvel Slice Logo" className="h-9 sm:h-11 w-auto object-contain pointer-events-none" />
          ) : (
            <img src="/apple-touch-icon.png" alt="Marvel Slice Logo" className="h-8 sm:h-10 w-8 sm:w-10 object-contain pointer-events-none" onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <span className="text-2xl sm:text-3xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
            Marvel <span className="text-brand-orange">Slice</span>
          </span>
        </div>
      </header>

      {/* CANDIDATE INFO & LIVE TIMER BAR */}
      <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-8 py-3.5 sm:py-4 shrink-0 z-10 shadow-2xs space-y-2.5">
        <div className="text-center pb-2 border-b border-slate-200/80">
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            {exam?.title}
          </h2>
        </div>

        <div className="flex items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-slate-200 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
              {candidate?.candidate_photo ? (
                <img src={candidate.candidate_photo} alt={candidate.user_name} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="text-xs sm:text-sm leading-relaxed text-slate-700 font-semibold space-y-0.5 min-w-0">
              <div className="truncate"><span className="font-semibold text-slate-500">Name:</span> {candidate?.user_name}</div>
              <div className="truncate"><span className="font-semibold text-slate-500">Dept:</span> {candidate?.user_department}</div>
              <div className="truncate"><span className="font-semibold text-slate-500">Year:</span> {candidate?.user_year}</div>
              {candidate?.user_college && (
                <div className="truncate"><span className="font-semibold text-slate-500">College:</span> {candidate?.user_college}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 ml-auto">
            {isSessionRestored && activeStep === 'QUIZ' && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue border border-blue-200/80 rounded-full text-xs font-semibold shadow-2xs">
                <FiRefreshCw className="w-3.5 h-3.5" />
                <span>Session Restored</span>
              </div>
            )}
            {activeStep === 'INSTRUCTIONS' ? (
              <div className="flex items-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-5 sm:py-2 rounded-full bg-slate-100 border border-slate-300 font-mono text-xs sm:text-base font-bold text-slate-700 shadow-2xs">
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-slate-500" />
                <span>{exam?.time_limit_mins || 20} Mins</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-mono text-xs sm:text-base font-bold shadow-2xs ${
                timeLeftSeconds < 120 ? 'bg-rose-50 text-rose-600 border border-rose-200 animate-pulse' : 'bg-amber-50/80 text-amber-900 border border-amber-200/80'
              }`}>
                <FiClock className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-600" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUIZ MAIN BODY: INSTRUCTIONS OR (QUESTION AREA + SIDEBAR) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-white">
        {activeStep === 'INSTRUCTIONS' ? (
          /* INTEGRATED INSTRUCTIONS VIEW (CLEAN CONTINUOUS WHITE BG, NO SEPARATE CONTAINERS) */
          <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-10 bg-white">
            <div className="max-w-3xl mx-auto space-y-8 bg-white">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Exam Instructions & Guidelines
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Please read all instructions carefully before starting the exam.
                </p>
              </div>

              {/* RULES CONTENT FROM ADMIN */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-brand-blue" />
                  Candidate Rules & Regulations
                </h3>
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-1">
                  {exam?.rules_text ? (
                    exam.rules_text
                  ) : (
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                      <li>Ensure a stable internet connection throughout the duration of the test.</li>
                      <li>Do not refresh the page or switch browser tabs during the examination.</li>
                      <li>Each question carries 1 mark. Select your answer using the option choices.</li>
                      <li>Negative marking of 0.25 marks applies for each incorrect attempt.</li>
                      <li>You can navigate between questions using the Question Palette on the right.</li>
                      <li>The exam will automatically submit when the timer expires.</li>
                    </ul>
                  )}
                </div>
              </div>

              {/* AGREEMENT CHECKBOXES */}
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer select-none">
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

                <label className="flex items-start gap-3 cursor-pointer select-none">
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

              {/* CENTERED START EXAM BUTTON */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  disabled={!agreeInstructions || !agreeTerms}
                  onClick={handleStartExam}
                  className="px-8 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Start Exam</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 80% QUESTION AREA */}
            <div className="flex-1 lg:w-[80%] min-h-0 flex flex-col bg-white order-1 lg:order-1">
          {examQuestions.length > 0 && (
            <div className="flex-1 min-h-0 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 bg-white">
              {/* DYNAMIC CATEGORY / SECTION NAVIGATION TABS */}
              {(() => {
                const categoriesList = (exam?.exam_categories && Array.isArray(exam.exam_categories) && exam.exam_categories.length > 0)
                  ? exam.exam_categories
                  : Array.from(new Set(examQuestions.map(q => q.category_name).filter(Boolean)));

                if (categoriesList.length <= 1) return null;

                const currentCat = examQuestions[currentQIndex]?.category_name || categoriesList[0];

                return (
                  <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-slate-200 no-scrollbar shrink-0">
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

              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5 mb-4 sm:mb-6 shrink-0">
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

              <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-1 space-y-4 sm:space-y-5 min-h-0 bg-white">
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
                <div className="flex items-center justify-between gap-1.5 sm:gap-3 overflow-x-auto py-1 no-scrollbar w-full">
                  <button
                    type="button"
                    onClick={() => {
                      const qId = examQuestions[currentQIndex]?.id;
                      if (qId) setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
                    }}
                    className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full font-bold text-[11px] sm:text-xs text-white transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
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
                      onClick={() => setCurrentQIndex(prev => Math.min(prev + 1, examQuestions.length - 1))}
                      className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-r-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-[11px] sm:text-xs disabled:opacity-40 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      Next
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUserAnswers(prev => {
                      const copy = { ...prev };
                      delete copy[examQuestions[currentQIndex]?.id];
                      return copy;
                    })}
                    className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white border-2 border-brand-blue/30 text-brand-blue font-bold text-[11px] sm:text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Clear Choice
                  </button>

                  <button
                    type="button"
                    onClick={triggerFeedbackOrSubmit}
                    className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-brand-green hover:bg-brand-green/90 text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer shadow-xs active:scale-95 whitespace-nowrap shrink-0"
                  >
                    Submit Test
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 20% SIDEBAR PALETTE (ALL CIRCLES) */}
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
                          <linearGradient id={`sq-bg-green-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#4ade80" />
                            <stop offset="45%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#15803d" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-purple-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#c084fc" />
                            <stop offset="45%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7e22ce" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-dual-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#22c55e" />
                            <stop offset="48%" stopColor="#15803d" />
                            <stop offset="52%" stopColor="#a855f7" />
                            <stop offset="100%" stopColor="#7e22ce" />
                          </linearGradient>
                          <linearGradient id={`sq-bg-red-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="45%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#b91c1c" />
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

                          {/* Top-Right Diagonal Glass Gloss Sheen */}
                          <linearGradient id={`sq-diag-gloss-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>

                          {/* Top Inner Gloss Highlight */}
                          <linearGradient id={`sq-top-glow-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Active Question Outer Pulsing Ring */}
                        {isCurrent && (
                          <rect x="0.8" y="0.8" width="30.4" height="30.4" rx="7" ry="7" fill="none" stroke="#2563eb" strokeWidth="2.0" className="animate-pulse" />
                        )}

                        {/* Main 3D Glossy Rounded Square Base */}
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

                        {/* Top Inner Glass Glow Highlight */}
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

                        {/* Top-Right Diagonal Glass Gloss Sheen */}
                        <path
                          d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z"
                          fill={`url(#sq-diag-gloss-${idx})`}
                          opacity="0.8"
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

            {/* LEGEND WITH 3D GLOSSY ROUNDED SQUARES */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2 mt-4">
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0">
                  <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#22c55e" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                  <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
                </svg>
                <span className="font-medium">Answered</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0">
                  <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#ef4444" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                  <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
                </svg>
                <span className="font-medium">Not Answered</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0">
                  <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#a855f7" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
                  <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.3" />
                </svg>
                <span className="font-medium">Marked for Review</span>
              </div>
              <div className="flex items-center gap-2.5">
                <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0">
                  <rect x="3" y="3" width="26" height="26" rx="6" ry="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <path d="M 12,3 L 23,3 C 26.3,3 29,5.7 29,9 L 29,19 Z" fill="#ffffff" opacity="0.5" />
                </svg>
                <span className="font-medium">Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </div>
</div>
);
}
