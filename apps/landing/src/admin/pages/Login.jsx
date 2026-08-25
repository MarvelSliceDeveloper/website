import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackLogin } from '../../lib/analytics';
import { 
  FiEye, FiEyeOff, FiLogIn, FiMail, FiLock, FiAlertCircle, 
  FiShield, FiBarChart2, FiFileText, FiClock, FiX, FiUsers
} from 'react-icons/fi';

/* ========================================================= */
/* MODULAR FEATURE CARD ITEM                                 */
/* ========================================================= */
function FeatureCardItem({ icon: Icon, iconBg, iconColor, title, description }) {
  return (
    <div className="bg-white/90 backdrop-blur-xs border border-slate-100/90 rounded-2xl px-4.5 py-3.5 flex items-center gap-3.5 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
      <div className={`w-10 h-10 rounded-xl ${iconBg} ${iconColor} shrink-0 flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="space-y-0.5">
        <h3 className="text-sm font-bold text-[#0B132B]">
          {title}
        </h3>
        <p className="text-xs text-[#94A3B8] font-normal">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ========================================================= */
/* MODULAR LEFT BRANDING & HERO SECTION                      */
/* ========================================================= */
function LeftBrandingSection({ logoUrl }) {
  const features = [
    {
      icon: FiBarChart2,
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0052FF]',
      title: 'Real-time analytics & course management',
      description: 'Monitor performance and engagement live',
    },
    {
      icon: FiFileText,
      iconBg: 'bg-[#FFF3EB]',
      iconColor: 'text-[#FF7A00]',
      title: 'Inquiries, brochure downloads & form submissions',
      description: 'View and manage all user inquiries in one place',
    },
    {
      icon: FiShield,
      iconBg: 'bg-[#EBF2FF]',
      iconColor: 'text-[#0052FF]',
      title: 'Enterprise-grade role-based access & security',
      description: 'Secure. Scalable. Built for performance.',
    },
  ];

  return (
    <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:px-16 lg:py-12 relative z-10 bg-white min-h-screen">
      {/* Subtle Concentric Arc Graphic */}
      <div className="absolute top-0 right-0 w-[360px] h-[360px] pointer-events-none opacity-20">
        <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-blue-300">
          <circle cx="400" cy="0" r="320" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="400" cy="0" r="240" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="400" cy="0" r="160" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Subtle Dot Matrix */}
      <div className="absolute top-12 right-28 pointer-events-none opacity-15">
        <div className="grid grid-cols-6 gap-2.5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          ))}
        </div>
      </div>

      {/* Header Branding */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 relative z-10 pt-2 pb-6"
      >
        <img src={logoUrl} alt="Marvel Slice Logo" className="h-10 sm:h-11 w-auto object-contain rounded-lg" />
        <span className="text-2xl sm:text-[26px] font-extrabold text-[#0052FF] tracking-tight">
          Marvel <span className="text-[#FF7A00]">Slice</span>
        </span>
        <span className="ml-1 px-2.5 py-0.5 rounded-md bg-[#EBF2FF] text-[#0052FF] border border-blue-200/60 text-[11px] font-extrabold uppercase tracking-wider">
          ADMIN
        </span>
      </motion.div>

      {/* Main Hero Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="my-auto max-w-[540px] space-y-6 relative z-10 py-6"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF2FF] border border-blue-200/60 text-[#0052FF] text-[11px] font-extrabold uppercase tracking-wider">
          <FiShield className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
          <span>CENTRALIZED CONTROL CENTER</span>
        </div>

        <h1 className="text-4xl sm:text-[44px] font-extrabold text-[#0B132B] leading-[1.08] tracking-tight max-w-[520px]">
          Manage & Grow Your <br />
          <span className="text-[#0052FF]">Marvel</span> <span className="text-[#FF7A00]">Slice</span> <span className="text-[#0B132B]">Platform</span>
        </h1>

        <p className="text-[#64748B] text-base leading-[1.6] font-normal max-w-[520px]">
          Welcome to the administrator portal. Control website content, monitor user submissions, update course listings, and track live analytics effortlessly.
        </p>

        <div className="space-y-3 pt-1 max-w-[520px]">
          {features.map((feat, idx) => (
            <FeatureCardItem key={idx} {...feat} />
          ))}
        </div>
      </motion.div>

      {/* Left Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="pt-4 border-t border-slate-100 text-xs text-[#94A3B8] flex items-center justify-between relative z-10"
      >
        <span className="font-normal text-[#64748B]">© 2026 Marvel Slice. All rights reserved.</span>
        <span className="flex items-center gap-2 text-[#00B074] font-bold text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00B074]" /> System Operational
        </span>
      </motion.div>
    </div>
  );
}

/* ========================================================= */
/* MODULAR LOGIN FORM CARD                                   */
/* ========================================================= */
function LoginFormCard({
  email,
  password,
  showPw,
  rememberMe,
  error,
  sessionExpiredMsg,
  loading,
  touched,
  fieldErrors,
  handleEmailChange,
  handlePasswordChange,
  handleBlur,
  handleSubmit,
  setShowPw,
  setRememberMe,
  onOpenForgot,
}) {
  return (
    <div className="w-full max-w-[440px] relative z-20 -mt-3">
      <div className="bg-white border border-slate-100 shadow-2xl shadow-blue-900/8 rounded-[28px] p-8 sm:p-9 text-center relative">
        
        {/* Top Lock Badge */}
        <div className="w-14 h-14 rounded-full bg-[#EBF2FF] text-[#0052FF] flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <FiLock className="w-6.5 h-6.5" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-[30px] font-extrabold text-[#0B132B] tracking-tight">
          Admin Sign In
        </h2>
        <p className="text-[#64748B] text-xs sm:text-sm font-normal mt-1.5 leading-relaxed max-w-[300px] mx-auto">
          Enter your administrator credentials to access your dashboard
        </p>

        {/* Session Expired Banner */}
        {sessionExpiredMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3 text-amber-800 text-xs sm:text-sm font-medium text-left"
          >
            <FiClock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{sessionExpiredMsg}</div>
          </motion.div>
        )}

        {/* Error Alert Banner (Only shown if runtime error occurs) */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-3.5 bg-[#FFF0F2] border border-[#FFD0D6] rounded-xl flex items-start gap-3 text-left"
          >
            <FiAlertCircle className="w-5 h-5 text-[#FF3B5C] shrink-0 mt-0.5" />
            <div className="text-[13px] font-semibold text-[#E02444] leading-snug">
              {error}
            </div>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left" noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                <FiMail className={`w-4 h-4 ${touched.email && fieldErrors.email ? 'text-rose-500' : ''}`} />
              </div>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                placeholder="klethin24@gmail.com"
                className={`w-full h-13 pl-10 pr-4 bg-white border rounded-xl text-sm font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-2xs ${
                  touched.email && fieldErrors.email 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' 
                    : 'border-slate-200 focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]'
                }`}
              />
            </div>
            {touched.email && fieldErrors.email && (
              <p className="text-rose-600 text-xs flex items-center gap-1.5 mt-1 font-medium">
                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1.5">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                <FiLock className={`w-4 h-4 ${touched.password && fieldErrors.password ? 'text-rose-500' : ''}`} />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={`w-full h-13 pl-10 pr-11 bg-white border rounded-xl text-sm font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-2xs ${
                  touched.password && fieldErrors.password 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' 
                    : 'border-slate-200 focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-slate-600 transition-colors"
              >
                {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="text-rose-600 text-xs flex items-center gap-1.5 mt-1 font-medium">
                <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 text-xs font-medium text-[#475569] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0052FF] focus:ring-[#0052FF]/30 cursor-pointer"
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={onOpenForgot}
              className="text-xs font-bold text-[#0052FF] hover:underline transition-all"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Action Button */}
          <div className="pt-1.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#003FD5] hover:from-[#0047DF] hover:to-[#0034B8] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-600/20 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <FiLogIn className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider with Shield */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[#94A3B8]">
              <FiShield className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Card Security Footer */}
        <div className="flex items-center justify-between text-xs text-[#64748B] font-medium">
          <span className="flex items-center gap-1.5">
            <FiShield className="w-4 h-4 text-[#00B074] shrink-0" />
            <span>Encrypted SSL Session</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#94A3B8]">
            <FiUsers className="w-4 h-4 shrink-0" />
            <span>Authorized Personnel Only</span>
          </span>
        </div>

      </div>
    </div>
  );
}

/* ========================================================= */
/* MODULAR FORGOT PASSWORD MODAL                             */
/* ========================================================= */
function ForgotPasswordModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full text-center space-y-5 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <FiX className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 rounded-full bg-[#EBF2FF] text-[#0052FF] flex items-center justify-center mx-auto">
          <FiLock className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Reset Administrator Password</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            For security reasons, password resets must be issued by the Super Administrator. Please contact support at <strong>support@marvelslice.com</strong>.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/* ========================================================= */
/* MAIN LOGIN PAGE CONTAINER                                 */
/* ========================================================= */
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [email, setEmail] = useState('klethin24@gmail.com');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  useEffect(() => {
    if (sessionStorage.getItem('admin_session_expired') === 'true') {
      setSessionExpiredMsg('Your session has expired due to inactivity. Please sign in again.');
      sessionStorage.removeItem('admin_session_expired');
    }
  }, []);

  function validateEmailStr(val) {
    if (!val.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email address.';
    return '';
  }

  function validatePasswordStr(val) {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    return '';
  }

  function handleEmailChange(e) {
    const val = e.target.value;
    setEmail(val);
    if (touched.email) {
      setFieldErrors(prev => ({ ...prev, email: validateEmailStr(val) }));
    }
  }

  function handlePasswordChange(e) {
    const val = e.target.value;
    setPassword(val);
    if (touched.password) {
      setFieldErrors(prev => ({ ...prev, password: validatePasswordStr(val) }));
    }
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setFieldErrors(prev => ({ ...prev, email: validateEmailStr(email) }));
    } else if (field === 'password') {
      setFieldErrors(prev => ({ ...prev, password: validatePasswordStr(password) }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSessionExpiredMsg('');

    setTouched({ email: true, password: true });

    const emailErr = validateEmailStr(email);
    const passErr = validatePasswordStr(password);
    setFieldErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      trackLogin('admin');
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const logoUrl = settings?.logo_url || "/apple-touch-icon.png";

  return (
    <div className="min-h-screen w-full bg-[#F8FAFF] flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-[#0052FF] selection:text-white">
      
      {/* LEFT SECTION */}
      <LeftBrandingSection logoUrl={logoUrl} />

      {/* RIGHT SECTION */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 sm:p-10 relative z-10 bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-[#FFF7F2]">
        {/* Soft Ambient Backgrounds */}
        <div className="absolute top-8 left-8 w-[400px] h-[400px] bg-[#0052FF]/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-8 right-8 w-[400px] h-[400px] bg-[#FF7A00]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Dot Grids */}
        <div className="absolute top-8 right-8 pointer-events-none opacity-15">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 right-8 pointer-events-none opacity-15">
          <div className="grid grid-cols-8 gap-3">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-orange-400" />
            ))}
          </div>
        </div>

        {/* Curved Vectors */}
        <div className="absolute bottom-0 right-0 w-[380px] h-[380px] pointer-events-none opacity-20">
          <svg viewBox="0 0 400 400" fill="none" className="w-full h-full text-orange-300">
            <path d="M0 400 C150 400, 400 150, 400 0" stroke="currentColor" strokeWidth="1.5" />
            <path d="M100 400 C200 400, 400 200, 400 100" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>

        {/* Floating Form Card Component */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[440px] relative z-20 -mt-3"
        >
          <LoginFormCard 
            email={email}
            password={password}
            showPw={showPw}
            rememberMe={rememberMe}
            error={error}
            sessionExpiredMsg={sessionExpiredMsg}
            loading={loading}
            touched={touched}
            fieldErrors={fieldErrors}
            handleEmailChange={handleEmailChange}
            handlePasswordChange={handlePasswordChange}
            handleBlur={handleBlur}
            handleSubmit={handleSubmit}
            setShowPw={setShowPw}
            setRememberMe={setRememberMe}
            onOpenForgot={() => setForgotModalOpen(true)}
          />
        </motion.div>
      </div>

      {/* Forgot Password Modal Component */}
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />

    </div>
  );
}
