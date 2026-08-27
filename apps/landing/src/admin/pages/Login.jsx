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
  ipBlocked,
  ipBlockRemaining,
}) {
  return (
    <div className="w-full max-w-[400px] relative z-20">
      <div className="bg-white border border-slate-100 shadow-xl shadow-blue-900/5 rounded-2xl p-6 sm:p-7 text-center relative">
        
        {/* Top Lock Badge */}
        <div className="w-11 h-11 rounded-full bg-[#EBF2FF] text-[#0052FF] flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
          <FiLock className="w-5 h-5" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B132B] tracking-tight">
          Admin Sign In
        </h2>
        <p className="text-[#64748B] text-xs font-normal mt-1 leading-relaxed max-w-[280px] mx-auto">
          Enter your administrator credentials to access your dashboard
        </p>

        {/* IP Lockout Warning Banner */}
        {ipBlocked && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3.5 p-3 bg-rose-50 border border-rose-200 rounded-lg text-left space-y-0.5"
          >
            <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
              <FiShield className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>IP ACCESS BLOCKED (15 MIN LOCKOUT)</span>
            </div>
            <p className="text-xs text-rose-600 leading-snug">
              Access from your IP address / device has been temporarily blocked for {ipBlockRemaining || 15} minutes due to multiple failed login attempts.
            </p>
          </motion.div>
        )}

        {/* Session Expired Banner */}
        {sessionExpiredMsg && !ipBlocked && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3.5 p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-start gap-2.5 text-amber-800 text-xs font-medium text-left"
          >
            <FiClock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{sessionExpiredMsg}</div>
          </motion.div>
        )}

        {/* Error Alert Banner */}
        {error && !ipBlocked && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3.5 p-3 bg-[#FFF0F2] border border-[#FFD0D6] rounded-lg flex items-start gap-2.5 text-left"
          >
            <FiAlertCircle className="w-4 h-4 text-[#FF3B5C] shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-[#E02444] leading-snug">
              {error}
            </div>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-left" noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <FiMail className={`w-4 h-4 ${touched.email && fieldErrors.email ? 'text-rose-500' : ''}`} />
              </div>
              <input
                type="email"
                value={email}
                disabled={ipBlocked || loading}
                onChange={handleEmailChange}
                onBlur={() => handleBlur('email')}
                placeholder="admin@marvelslice.com"
                className={`w-full h-11 pl-9 pr-3 bg-white border rounded-lg text-xs font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-2xs disabled:opacity-50 disabled:bg-slate-50 ${
                  touched.email && fieldErrors.email 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' 
                    : 'border-slate-200 focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]'
                }`}
              />
            </div>
            {touched.email && fieldErrors.email && (
              <p className="text-rose-600 text-[11px] flex items-center gap-1 mt-0.5 font-medium">
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#0F172A] mb-1">
              PASSWORD
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#94A3B8]">
                <FiLock className={`w-4 h-4 ${touched.password && fieldErrors.password ? 'text-rose-500' : ''}`} />
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                disabled={ipBlocked || loading}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={`w-full h-11 pl-9 pr-10 bg-white border rounded-lg text-xs font-medium text-[#0F172A] placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-2xs disabled:opacity-50 disabled:bg-slate-50 ${
                  touched.password && fieldErrors.password 
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500' 
                    : 'border-slate-200 focus:ring-2 focus:ring-[#0052FF]/20 focus:border-[#0052FF]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-slate-600 transition-colors"
              >
                {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {touched.password && fieldErrors.password && (
              <p className="text-rose-600 text-[11px] flex items-center gap-1 mt-0.5 font-medium">
                <FiAlertCircle className="w-3 h-3 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#475569] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#0052FF] focus:ring-[#0052FF]/30 cursor-pointer"
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
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || ipBlocked}
              className="w-full h-11 rounded-lg bg-gradient-to-r from-[#0052FF] to-[#003FD5] hover:from-[#0047DF] hover:to-[#0034B8] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-blue-600/15 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : ipBlocked ? (
                <span>Access Blocked ({ipBlockRemaining || 15}m)</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <FiLogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Divider with Shield */}
        <div className="relative my-3.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-2.5 text-[#94A3B8]">
              <FiShield className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Card Security Footer */}
        <div className="flex items-center justify-between text-[11px] text-[#64748B] font-medium">
          <span className="flex items-center gap-1">
            <FiShield className="w-3.5 h-3.5 text-[#00B074] shrink-0" />
            <span>Encrypted SSL Session</span>
          </span>
          <span className="flex items-center gap-1 text-[#94A3B8]">
            <FiUsers className="w-3.5 h-3.5 shrink-0" />
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  const [ipBlocked, setIpBlocked] = useState(false);
  const [ipBlockRemaining, setIpBlockRemaining] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem('admin_session_expired') === 'true') {
      setSessionExpiredMsg('Your session has expired due to inactivity. Please sign in again.');
      sessionStorage.removeItem('admin_session_expired');
    }

    const checkLockout = () => {
      const blockedUntil = parseInt(localStorage.getItem('admin_ip_blocked_until') || '0', 10);
      if (blockedUntil && Date.now() < blockedUntil) {
        setIpBlocked(true);
        const minsLeft = Math.ceil((blockedUntil - Date.now()) / (60 * 1000));
        setIpBlockRemaining(minsLeft);
      } else {
        setIpBlocked(false);
        localStorage.removeItem('admin_ip_blocked_until');
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 10000);
    return () => clearInterval(interval);
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

    // Check if IP is currently blocked
    const blockedUntil = parseInt(localStorage.getItem('admin_ip_blocked_until') || '0', 10);
    if (blockedUntil && Date.now() < blockedUntil) {
      const minsLeft = Math.ceil((blockedUntil - Date.now()) / (60 * 1000));
      setError(`Your IP address is temporarily blocked for ${minsLeft} more minutes due to multiple failed login attempts.`);
      return;
    }

    setTouched({ email: true, password: true });

    const emailErr = validateEmailStr(email);
    const passErr = validatePasswordStr(password);
    setFieldErrors({ email: emailErr, password: passErr });

    if (emailErr || passErr) {
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      trackLogin('admin');
      localStorage.removeItem('admin_failed_attempts');
      localStorage.removeItem('admin_ip_blocked_until');
      navigate('/admin', { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Invalid email or password. Please try again.';
      
      // Track failed attempt count in localStorage for IP/device protection
      const attempts = (parseInt(localStorage.getItem('admin_failed_attempts') || '0', 10)) + 1;
      localStorage.setItem('admin_failed_attempts', String(attempts));

      if (attempts >= 5 || errMsg.toLowerCase().includes('blocked') || errMsg.toLowerCase().includes('locked')) {
        const lockoutTime = Date.now() + 15 * 60 * 1000;
        localStorage.setItem('admin_ip_blocked_until', String(lockoutTime));
        setIpBlocked(true);
        setIpBlockRemaining(15);
        setError('Your IP address has been blocked for 15 minutes due to multiple failed login attempts.');
      } else {
        setError(`${errMsg} (${5 - attempts} attempts remaining before IP lockout)`);
      }
    } finally {
      setLoading(false);
    }
  }

  const logoUrl = settings?.logo_url || "/apple-touch-icon.png";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F0F5FF] via-[#F8FAFF] to-[#FFF7F2] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans selection:bg-[#0052FF] selection:text-white">
      {/* Soft Ambient Backgrounds */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0052FF]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FF7A00]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Grids */}
      <div className="absolute top-10 left-10 pointer-events-none opacity-15 hidden sm:block">
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 right-10 pointer-events-none opacity-15 hidden sm:block">
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-orange-400" />
          ))}
        </div>
      </div>

      {/* Centered Main Wrapper */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-20 my-auto flex flex-col items-center"
      >
        {/* Centered Logo & Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src={logoUrl} alt="Marvel Slice Logo" className="h-10 sm:h-12 w-auto object-contain rounded-lg shadow-2xs" />
          <span className="text-2xl sm:text-[28px] font-extrabold text-[#0052FF] tracking-tight">
            Marvel <span className="text-[#FF7A00]">Slice</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#EBF2FF] text-[#0052FF] border border-blue-200/60 text-[11px] font-extrabold uppercase tracking-wider">
            ADMIN
          </span>
        </div>

        {/* Floating Form Card Component */}
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
          ipBlocked={ipBlocked}
          ipBlockRemaining={ipBlockRemaining}
        />
      </motion.div>

      {/* Forgot Password Modal Component */}
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
    </div>
  );
}
