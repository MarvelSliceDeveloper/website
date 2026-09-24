import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiShield, FiUser, FiCheckCircle, FiClock, FiLock, FiArrowRight, FiCheck, FiArrowLeft
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';

export default function CustomExamInstructions() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [countdownSecs, setCountdownSecs] = useState(0);

  useEffect(() => {
    navigate(`/custom-exam/test/${slug}`, { replace: true });
  }, [slug]);

  async function syncServerTime() {
    try {
      const startMs = Date.now();
      const { data } = await supabase.rpc('get_server_time');
      const endMs = Date.now();
      const latency = Math.round((endMs - startMs) / 2);
      if (data) {
        const serverNowMs = new Date(data).getTime() + latency;
        setServerOffsetMs(serverNowMs - Date.now());
      }
    } catch (e) {}
  }

  function getSyncedNow() {
    return Date.now() + serverOffsetMs;
  }

  async function checkAuthAndFetchExam() {
    setLoading(true);

    // Read candidate auth session
    const rawAuth = sessionStorage.getItem(`custom_exam_auth_${slug}`);
    if (!rawAuth) {
      navigate(`/custom-exam/login/${slug}`, { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(rawAuth);
      if (!parsed || !parsed.candidate) {
        navigate(`/custom-exam/login/${slug}`, { replace: true });
        return;
      }
      setCandidate(parsed.candidate);
    } catch (e) {
      navigate(`/custom-exam/login/${slug}`, { replace: true });
      return;
    }

    // Fetch exam
    const { data } = await supabase
      .from('custom_mock_exams')
      .select('*, custom_mock_exam_questions(id)')
      .eq('slug', slug)
      .single();

    if (data) {
      setExam(data);
    } else {
      setExam({
        id: 'demo-custom-1',
        slug: slug,
        title: 'Special IBPS PO Speed Drill 2026',
        category: 'Banking & Aptitude',
        time_limit_mins: 20,
        total_marks: 100,
        question_count_option: 50,
        rules_text: '1. Ensure a stable internet connection throughout the test.\n2. Do not refresh the page or switch browser tabs during the exam.\n3. Each question carries 1 mark. Select the correct option in the palette.\n4. The exam will auto-submit when the timer expires.'
      });
    }
    setLoading(false);
  }

  // Scheduled Start Time Guard Effect
  useEffect(() => {
    if (exam?.exam_start_time) {
      const examStartMs = new Date(exam.exam_start_time).getTime();
      const check = () => {
        const nowMs = getSyncedNow();
        const diffSecs = Math.max(0, Math.floor((examStartMs - nowMs) / 1000));
        setCountdownSecs(diffSecs);
      };
      check();
      const timer = setInterval(check, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, serverOffsetMs]);

  const isExamUnlocked = () => {
    if (!exam?.exam_start_time) return true;
    return getSyncedNow() >= new Date(exam.exam_start_time).getTime();
  };

  const isExamEnded = () => {
    if (!exam?.exam_end_time) return false;
    return getSyncedNow() >= new Date(exam.exam_end_time).getTime();
  };

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

  const unlocked = isExamUnlocked();
  const ended = isExamEnded();
  const qCount = exam?.question_count_option || exam?.custom_mock_exam_questions?.length || 25;

  let durationText = `${exam?.time_limit_mins || 20} Mins`;
  if (exam?.exam_start_time && exam?.exam_end_time) {
    const diffMins = Math.round((new Date(exam.exam_end_time).getTime() - new Date(exam.exam_start_time).getTime()) / (1000 * 60));
    if (diffMins > 0) {
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;
      if (h > 0 && m > 0) durationText = `${h} hr ${m} mins`;
      else if (h > 0) durationText = `${h} Hour${h > 1 ? 's' : ''}`;
      else durationText = `${m} Mins`;
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 py-10 px-4 flex flex-col justify-center">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        {/* LOGO HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 justify-center">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Marvel Slice Logo" className="h-9 sm:h-10 w-auto object-contain pointer-events-none" />
            ) : (
              <img src="/apple-touch-icon.png" alt="Marvel Slice Logo" className="h-8 sm:h-9 w-8 sm:w-9 object-contain pointer-events-none" onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span className="text-2xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
              Marvel <span className="text-brand-orange">Slice</span>
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Exam Instructions & Candidate Rules
          </p>
        </div>

        {/* FULL PAGE INSTRUCTIONS CONTAINER (NOT MODAL POPUP!) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Official Exam Guidelines
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                {exam?.title}
              </h1>
            </div>

            <Link
              to={`/custom-exam/login/${slug}`}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
          </div>

          {/* VERIFIED CANDIDATE PROFILE BOX */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-300 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
              {candidate?.candidate_photo ? (
                <img src={candidate.candidate_photo} alt={candidate.user_name} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <div className="text-xs text-slate-700 leading-relaxed grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 min-w-0 flex-1">
              <div><span className="font-bold text-slate-900">Candidate:</span> {candidate?.user_name}</div>
              <div><span className="font-bold text-slate-900">College:</span> {candidate?.user_college}</div>
              <div><span className="font-bold text-slate-900">Department:</span> {candidate?.user_department}</div>
              <div><span className="font-bold text-slate-900">Year:</span> {candidate?.user_year}</div>
            </div>
          </div>

          {/* EXAM PARAMETERS SUMMARY */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Duration</span>
              <span className="text-sm sm:text-base font-black text-brand-blue">{durationText}</span>
            </div>
            <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">Total MCQs</span>
              <span className="text-sm sm:text-base font-black text-amber-700">{qCount} Questions</span>
            </div>
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Total Marks</span>
              <span className="text-sm sm:text-base font-black text-emerald-700">{exam?.total_marks || 100} Marks</span>
            </div>
          </div>

          {/* RULES TEXT BOX */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FiShield className="w-4 h-4 text-brand-blue" />
              <span>Rules & Code of Conduct</span>
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
              {exam?.rules_text ? (
                exam.rules_text.replace(/(\d+)\.([^\s\d])/g, '$1. $2')
              ) : (
                "1. Stay on the official exam website with a stable internet connection throughout the test.\n2. Do not refresh, close, or leave the exam page while the test is running.\n3. Do not switch browser tabs or windows — tab switches are tracked and reported.\n4. Do not leak, share, screenshot, or distribute any exam questions or content.\n5. Each question carries 1 mark with no negative marking; the exam auto-submits when the timer expires."
              )}
            </div>
          </div>

          {/* SCHEDULED TIMING GUARDS */}
          {ended ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3">
              <FiLock className="w-5 h-5 text-rose-600 shrink-0" />
              <div className="text-xs text-rose-900">
                <span className="font-bold block">Exam Concluded</span>
                <span>The scheduled end time for this exam has passed. Exam submissions are closed.</span>
              </div>
            </div>
          ) : !unlocked ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FiLock className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block">Exam Scheduled</span>
                  <span>Exam unlocks automatically when the start time is reached.</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-amber-600 text-white font-mono font-bold text-sm rounded-xl shrink-0 shadow-2xs">
                Starts in {formatTime(countdownSecs)}
              </div>
            </div>
          ) : null}

          {/* ACTION BUTTON */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!unlocked || ended}
              onClick={() => {
                navigate(`/custom-exam/test/${slug}`);
              }}
              className="inline-flex items-center gap-2 px-7 py-3 bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>{ended ? 'Exam Concluded' : 'I Agree & Start Exam'}</span>
              <FiCheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
