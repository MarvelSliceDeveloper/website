import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../../hooks/useSupabase';
import { trackLogin } from '../../lib/analytics';
import { 
  FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, 
  FiShield, FiClock, FiX, FiKey, FiCpu, FiDatabase, FiCode, FiLayers
} from 'react-icons/fi';

/* ========================================================= */
/* MODULAR FORGOT PASSWORD MODAL                             */
/* ========================================================= */
function ForgotPasswordModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 max-w-md w-full text-center space-y-5 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto border border-blue-100 shadow-xs">
          <FiKey className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Reset Administrator Password</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            For security reasons, password resets must be issued by the Super Administrator. Please contact support at <strong className="text-slate-900">sales@marvelslice.com</strong> or call <strong className="text-slate-900">+91 63809 57390</strong>.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-brand-blue hover:bg-brand-orange text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

/* ========================================================= */
/* ANIMATED ISOMETRIC 3D SECURITY & PROFILE MODEL            */
/* ========================================================= */
function AnimatedIsometricSecurityModel() {
  return (
    <motion.div 
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full max-w-[320px] sm:max-w-[360px] mx-auto relative select-none flex items-center justify-center"
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 261 341"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-xl overflow-visible"
      >
        {/* FLOATING BACKGROUND SHAPES */}
        <path d="M13 105.5L21.5 101L30 105.5L21.5 110L13 105.5Z" fill="#DAD1FF" />
        <path d="M198 90.5L210.5 84L225 91L211 98L198 90.5Z" fill="#E1D9FF" />
        <path d="M238 148.5L246.5 144L255 148.5L246.5 153L238 148.5Z" fill="#DCD4FF" />
        <path d="M3 229L14 223L26 229L14 235L3 229Z" fill="#E8E2FF" />
        <path d="M95 276.5L109 269L123 276.5L109 284L95 276.5Z" fill="#CFC5FF" />
        <path d="M244 208L261 198V216L250 222L244 218V208Z" fill="#C9C0FF" />

        {/* ISOMETRIC FLOOR */}
        <path d="M27 176L151 116L239 164L113 226L27 176Z" fill="#F0EDFF" />
        <path d="M39 180L151 126L225 166L113 218L39 180Z" fill="#E7E3FF" />
        <path d="M71 202L151 163L195 187L114 226L71 202Z" fill="#DCD7FF" opacity="0.55" />

        {/* MAIN BLUE SCREEN */}
        <path d="M69 109L152 70V78L69 118V109Z" fill="#D7E7FF" />
        <path d="M69 109L158 72V144L69 185V109Z" fill="#4D80F5" />
        <path d="M55 116L158 72V144L55 189V116Z" fill="#4D82F4" />
        <path d="M55 159L158 114V144L55 189V159Z" fill="#4779E7" opacity="0.55" />
        <path d="M55 116L78 106V178L55 189V116Z" fill="#695DE7" />

        {/* Screen highlight */}
        <path d="M112 99L135 89" stroke="#D9E7FF" strokeWidth="3" strokeLinecap="round" />
        <path d="M114 108L129 101" stroke="#BFD8FF" strokeWidth="2" strokeLinecap="round" />

        {/* Screen text lines */}
        <path d="M101 121L128 109" stroke="#7FA7FF" strokeWidth="2" strokeLinecap="round" />
        <path d="M101 128L121 119" stroke="#769EFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M101 137L130 124" stroke="#759EFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M101 146L116 139" stroke="#759EFF" strokeWidth="2" strokeLinecap="round" />

        {/* USER PROFILE INSIDE SCREEN */}
        <circle cx="88" cy="136" r="6" fill="#AFA5F3" />
        <path d="M80 151C80 146.5 83.5 144 88 144C92.5 144 96 146.5 96 151V157H80V151Z" fill="#AFA5F3" />

        {/* CHECK CIRCLE */}
        <circle cx="66" cy="111" r="12" fill="#46C9DF" />
        <path d="M62.5 111L65 113.5L69.5 107.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* DOCUMENT CARD */}
        <path d="M75 163L104 174L88 215L75 207V163Z" fill="#D8D2F8" opacity="0.45" />
        <path d="M77 160L105 174V204L78 216L77 160Z" fill="white" />
        <path d="M96 169L105 174L96 178V169Z" fill="#E4E7F7" />
        <path d="M83 181L98 175" stroke="#FF927F" strokeWidth="2" strokeLinecap="round" />
        <path d="M83 187L97 181" stroke="#B7B9D7" strokeWidth="2" strokeLinecap="round" />
        <path d="M83 193L96 188" stroke="#B7B9D7" strokeWidth="2" strokeLinecap="round" />

        {/* SMALL RED CARD */}
        <path d="M125 170L158 157L176 167L143 181L125 170Z" fill="#FF8D91" />
        <path d="M143 181L176 167V179L143 193V181Z" fill="#E87983" />
        <path d="M125 170L143 181V193L125 182V170Z" fill="#F47E88" />
        <path d="M143 170L149 167L154 170L148 173L143 170Z" fill="white" opacity="0.9" />
        <path d="M148 174L153 172" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* LOCK */}
        <path d="M160 164L190 151L203 159L174 174L160 164Z" fill="#C7C1EA" opacity="0.4" />
        <path d="M163 128L195 116V164L163 176V128Z" fill="#31B9D1" />
        <path d="M195 116L201 120V160L195 164V116Z" fill="#27AFC9" />
        <path d="M162 130L195 117V158L162 172V130Z" fill="#39C2D8" />
        <path d="M171 128V119C171 112 175 107 181 105C187 103 192 106 192 112V121" stroke="#D9D7FA" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M171 128V119C171 113 175 109 181 107C186 106 190 109 190 114V121" stroke="#E8E6FF" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="179" cy="142" r="3" fill="#168BAA" />
        <path d="M179 144V149" stroke="#168BAA" strokeWidth="2" strokeLinecap="round" />

        {/* SOFT SHADOWS */}
        <ellipse cx="126" cy="204" rx="51" ry="12" fill="#DAD5F3" opacity="0.22" />
        <ellipse cx="179" cy="167" rx="22" ry="7" fill="#D3CDEF" opacity="0.25" />

        {/* EXTRA FLOATING ELEMENTS */}
        <path d="M52 185L65 178L76 184L63 191L52 185Z" fill="#E0DAFF" opacity="0.8" />
        <path d="M210 201L220 196L230 201L220 206L210 201Z" fill="#E4DFFF" />
      </svg>
    </motion.div>
  );
}

/* ========================================================= */
/* MAIN LOGIN PAGE CONTAINER                                 */
/* ========================================================= */
export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();
  const logoUrl = settings?.logo_url || "/apple-touch-icon.png";

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
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

    if (emailErr || passErr) return;

    setLoading(true);
    try {
      await login(email.trim(), password, false);
      trackLogin('admin');
      localStorage.removeItem('admin_failed_attempts');
      localStorage.removeItem('admin_ip_blocked_until');
      navigate('/admin', { replace: true });
    } catch (err) {
      const errMsg = err.message || 'Invalid email or password. Please try again.';
      
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

  const backgroundIcons = [
    { Icon: FiCode, x: '8%', y: '15%', duration: 7, delay: 0 },
    { Icon: FiDatabase, x: '92%', y: '20%', duration: 8.5, delay: 1 },
    { Icon: FiCpu, x: '12%', y: '82%', duration: 6.8, delay: 0.5 },
    { Icon: FiLayers, x: '88%', y: '78%', duration: 9, delay: 1.5 },
    { Icon: FiShield, x: '90%', y: '50%', duration: 7.2, delay: 0.8 },
  ];

  return (
    <div className="min-h-screen w-full bg-brand-blue flex items-center justify-center p-4 sm:p-8 lg:p-12 relative overflow-hidden font-sans selection:bg-brand-blue selection:text-white">
      
      {/* 1. Multi-Stop Mesh Gradient Base */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle 800px at 0% 0%, rgba(23, 92, 221, 0.45), transparent 70%),
            radial-gradient(circle 700px at 100% 0%, rgba(30, 86, 199, 0.4), transparent 60%),
            radial-gradient(circle 900px at 100% 100%, rgba(15, 60, 160, 0.5), transparent 70%),
            radial-gradient(circle 600px at 0% 100%, rgba(20, 80, 200, 0.45), transparent 60%),
            linear-gradient(135deg, #175cdd 0%, #1e56c7 50%, #2563eb 100%)
          `
        }}
      />

      {/* 2. Fluid Organic Curved Wave Layers */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        viewBox="0 0 1440 900" 
        fill="none" 
        preserveAspectRatio="none"
      >
        <path 
          d="M-100,-50 C200,-50 350,150 280,380 C220,550 50,600 -100,650 Z" 
          fill="rgba(255, 255, 255, 0.08)" 
        />
        <path 
          d="M-50,-50 C180,-50 280,100 220,280 C170,420 30,480 -80,500 Z" 
          fill="rgba(255, 255, 255, 0.05)" 
        />
        <path 
          d="M-100,600 C150,550 300,750 200,950 L-100,950 Z" 
          fill="rgba(35, 42, 160, 0.35)" 
        />
        <path 
          d="M1100,-100 C1000,100 1250,280 1550,220 L1550,-100 Z" 
          fill="rgba(255, 255, 255, 0.07)" 
        />
        <path 
          d="M800,950 C950,700 1200,720 1550,820 L1550,950 Z" 
          fill="rgba(35, 42, 160, 0.3)" 
        />
      </svg>



      {/* 4. Ambient Glowing Light Flares */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-white/20 blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-[#124bb3]/50 blur-3xl pointer-events-none" 
      />

      {/* 5. Subtle Floating Background Micro Icons */}
      {backgroundIcons.map(({ Icon, x, y, duration, delay }, idx) => (
        <motion.div
          key={idx}
          style={{ left: x, top: y }}
          animate={{
            y: [0, -16, 0],
            rotate: [0, 5, -5, 0],
            opacity: [0.15, 0.3, 0.15]
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay
          }}
          className="absolute hidden lg:flex w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 items-center justify-center text-white pointer-events-none"
        >
          <Icon className="w-5 h-5" />
        </motion.div>
      ))}

      {/* 6. Main 2-Column Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[960px] bg-white rounded-3xl sm:rounded-[36px] shadow-[0_30px_90px_-15px_rgba(20,28,100,0.35),0_0_0_1px_rgba(255,255,255,0.2)] overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-20"
      >
        
        {/* ===================================================== */}
        {/* LEFT COLUMN: Animated Circles & Pattern Mild Blue BG   */}
        {/* ===================================================== */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#EFF4FF] via-[#E8F0FE] to-[#F3F7FF] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-blue-100/80 min-h-[320px]">
          
          {/* Top-Left Brand Logo */}
          <div className="flex items-center z-20">
            <img
              src={logoUrl || "/apple-touch-icon.png"}
              alt="Marvel Slice"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>

          {/* Animated Circle Shapes & Subtle Blue Dot Grid BG Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
            
            {/* Subtle Blue Dot Matrix Grid */}
            <div 
              className="absolute inset-0 opacity-[0.2]"
              style={{
                backgroundImage: 'radial-gradient(#4F46E5 1.25px, transparent 1.25px)',
                backgroundSize: '18px 18px',
              }}
            />

            {/* Central Animated Concentric Blue Circle Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute w-[360px] h-[360px] rounded-full border border-solid border-brand-blue/20"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              className="absolute w-[270px] h-[270px] rounded-full border border-blue-300/50"
            />
            <motion.div 
              animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[180px] h-[180px] rounded-full border-2 border-brand-blue/35"
            />

            {/* Soft Floating Ambient Blue Orbs */}
            <motion.div 
              animate={{ 
                x: [0, 20, -15, 0],
                y: [0, -25, 15, 0],
                scale: [1, 1.15, 0.95, 1]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-36 h-36 rounded-full bg-gradient-to-tr from-brand-blue/25 to-indigo-500/15 blur-xl"
            />
            <motion.div 
              animate={{ 
                x: [0, -20, 15, 0],
                y: [0, 20, -20, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-gradient-to-br from-sky-400/20 to-blue-600/15 blur-xl"
            />

            {/* Floating Decorative Glass Blue Circles & Dots */}
            <motion.div
              animate={{ y: [0, -14, 0], opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-14 right-12 w-10 h-10 rounded-full bg-white/80 backdrop-blur-xs border border-brand-blue/30 shadow-xs flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-brand-blue/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-brand-blue" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 16, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-12 left-12 w-9 h-9 rounded-full bg-white/80 backdrop-blur-xs border border-sky-400/30 shadow-xs flex items-center justify-center"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-sky-400/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              </div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-1/2 left-8 w-3.5 h-3.5 rounded-full bg-brand-blue/50"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-1/3 right-8 w-4 h-4 rounded-full bg-sky-400/50"
            />
          </div>

          {/* Center Isometric 3D Security & Profile Illustration */}
          <div className="my-auto py-1 sm:py-2 flex items-center justify-center relative w-full z-20">
            <AnimatedIsometricSecurityModel />
          </div>

          <div />
        </div>

        {/* ===================================================== */}
        {/* RIGHT COLUMN: Modern Clean Login Form                 */}
        {/* ===================================================== */}
        <div className="md:col-span-6 bg-white p-5 sm:p-7 lg:p-8 flex flex-col justify-center">
          
          {/* Welcome Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Welcome to <span className="text-brand-blue">Marvel</span> <span className="text-brand-orange">Slice</span>!
            </h1>
          </div>

          {/* IP Lockout Warning Banner */}
          {ipBlocked && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left space-y-0.5"
            >
              <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                <FiShield className="w-4 h-4 shrink-0 text-rose-600" />
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
              className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2 text-amber-800 text-xs font-medium text-left"
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
              className="mb-4 p-3 bg-[#FFF0F2] border border-[#FFD0D6] rounded-xl flex items-start gap-2 text-left"
            >
              <FiAlertCircle className="w-4 h-4 text-[#FF3B5C] shrink-0 mt-0.5" />
              <div className="text-xs font-semibold text-[#E02444] leading-snug">
                {error}
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
            
            {/* Email Address Field with Left Mail Icon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-blue">
                  <FiMail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  disabled={ipBlocked || loading}
                  onChange={handleEmailChange}
                  onBlur={() => handleBlur('email')}
                  placeholder="Enter your email address"
                  className={`w-full h-11 pl-10 pr-4 bg-white border rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-2xs disabled:opacity-50 disabled:bg-slate-50 ${
                    touched.email && fieldErrors.email 
                      ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/15 focus:border-rose-500' 
                      : 'border-slate-200 hover:border-slate-300 focus:ring-4 focus:ring-brand-blue/15 focus:border-brand-blue'
                  }`}
                />
              </div>
              {touched.email && fieldErrors.email && (
                <p className="text-rose-600 text-xs flex items-center gap-1 mt-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password Field with Left Lock Icon & Right Eye Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-blue">
                  <FiLock className="w-4 h-4" />
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  disabled={ipBlocked || loading}
                  onChange={handlePasswordChange}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••••••"
                  className={`w-full h-11 pl-10 pr-11 bg-white border rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 shadow-2xs disabled:opacity-50 disabled:bg-slate-50 ${
                    touched.password && fieldErrors.password 
                      ? 'border-rose-500 focus:ring-4 focus:ring-rose-500/15 focus:border-rose-500' 
                      : 'border-slate-200 hover:border-slate-300 focus:ring-4 focus:ring-brand-blue/15 focus:border-brand-blue'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPw ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && fieldErrors.password && (
                <p className="text-rose-600 text-xs flex items-center gap-1 mt-1 font-medium">
                  <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.password}</span>
                </p>
              )}
            </div>

            {/* Actions: Forgot Password on Left, Login Button on Right */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs font-semibold text-brand-blue hover:text-brand-orange hover:underline transition-all cursor-pointer"
              >
                Forgot password?
              </button>

              <button
                type="submit"
                disabled={loading || ipBlocked}
                className="px-9 py-2.5 sm:py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 active:scale-95 text-white font-bold text-sm tracking-wide shadow-md shadow-brand-blue/30 hover:shadow-lg hover:shadow-brand-blue/40 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </div>
                ) : ipBlocked ? (
                  <span>Access Blocked ({ipBlockRemaining || 15}m)</span>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>

        </div>

      </motion.div>

      {/* Forgot Password Modal Component */}
      <ForgotPasswordModal open={forgotModalOpen} onClose={() => setForgotModalOpen(false)} />
    </div>
  );
}
