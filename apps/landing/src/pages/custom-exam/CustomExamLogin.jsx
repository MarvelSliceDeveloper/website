import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiLock, FiMail, FiCalendar, FiArrowRight, FiShield, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';

export default function CustomExamLogin() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    fetchExam();
  }, [slug]);

  async function fetchExam() {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_mock_exams')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      setExam(data);
    } else {
      // Demo fallback
      setExam({
        id: 'demo-custom-1',
        slug: slug || 'ibps-po-special-drill',
        title: 'Special IBPS PO Speed Drill 2026',
        category: 'Banking & Aptitude',
        time_limit_mins: 20
      });
    }
    setLoading(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    if (!email.trim() || !dob) {
      setLoginError('Please enter both your registered Email and Date of Birth.');
      return;
    }

    setLoggingIn(true);
    const cleanEmail = email.trim().toLowerCase();

    let candidate = null;

    if (exam && !exam.id.startsWith('demo-')) {
      const { data, error } = await supabase
        .from('custom_mock_exam_registrations')
        .select('*')
        .eq('custom_mock_exam_id', exam.id)
        .eq('user_email', cleanEmail)
        .eq('user_dob', dob)
        .single();

      if (!error && data) {
        candidate = data;
      }
    } else {
      // Demo mock login validation
      candidate = {
        id: 'reg-demo-1',
        user_name: 'Lethin Kumar',
        user_email: cleanEmail,
        user_dob: dob,
        user_phone: '+91 98765 43210',
        user_department: 'Computer Science & Engineering',
        user_year: '3rd Year',
        user_college: 'Marvel Institute of Technology'
      };
    }

    setLoggingIn(false);

    if (!candidate) {
      setLoginError('Access Denied: You are not registered for this specific exam. Only registered members are permitted to attend.');
      return;
    }

    // Save candidate authentication session
    const authSession = {
      examId: exam.id,
      examSlug: exam.slug,
      candidate: candidate,
      loginTimestampMs: Date.now()
    };

    try {
      sessionStorage.setItem(`custom_exam_auth_${slug}`, JSON.stringify(authSession));
    } catch (err) {
      console.warn('Could not save auth session:', err);
    }

    // Navigate to Instructions Page (NOT popup modal!)
    navigate(`/custom-exam/instructions/${slug}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* LOGO HEADER */}
        <div className="text-center space-y-2">
          <span className="text-2xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
            Marvel <span className="text-brand-orange">Slice</span>
          </span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Exam Portal Candidate Login
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4 text-center space-y-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-100">
              Exam Access Guard
            </span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {exam?.title}
            </h1>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <FiAlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{loginError}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Username (Registered Email) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password (Date of Birth) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiCalendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none z-10" />
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  required
                  style={{ colorScheme: 'light' }}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-brand-blue flex items-center gap-2">
              <FiShield className="w-4 h-4 shrink-0" />
              <span>Only candidates registered for this exam are allowed access.</span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span>{loggingIn ? 'Authenticating...' : 'Login & View Exam Instructions'}</span>
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
