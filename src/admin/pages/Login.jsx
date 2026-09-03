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
/* PURE HARDWARE-ACCELERATED ANIMATED SVG DASHBOARD          */
/* ========================================================= */
function AnimatedAdminDashboardSvg() {
  return (
    <div className="w-full max-w-[340px] sm:max-w-[370px] aspect-square flex items-center justify-center relative select-none">
      <svg 
        viewBox="0 0 400 400" 
        className="w-full h-full drop-shadow-2xl" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes spinClockwise {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spinCounter {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
          @keyframes sliderMove1 {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(18px); }
          }
          @keyframes sliderMove2 {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-16px); }
          }
          @keyframes sliderMove3 {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(14px); }
          }
          @keyframes pulseBar1 {
            0%, 100% { transform: scaleY(0.7); }
            50% { transform: scaleY(1.15); }
          }
          @keyframes pulseBar2 {
            0%, 100% { transform: scaleY(1.05); }
            50% { transform: scaleY(0.65); }
          }
          @keyframes pulseBar3 {
            0%, 100% { transform: scaleY(0.6); }
            50% { transform: scaleY(1.2); }
          }
          @keyframes floatGentle {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-6px) rotate(2deg); }
          }
          @keyframes glowPulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.9; }
          }
          .gear-1 {
            animation: spinClockwise 22s linear infinite;
            transform-origin: 95px 185px;
          }
          .gear-2 {
            animation: spinCounter 18s linear infinite;
            transform-origin: 75px 245px;
          }
          .knob-1 {
            animation: sliderMove1 3.5s ease-in-out infinite;
          }
          .knob-2 {
            animation: sliderMove2 4s ease-in-out infinite 0.3s;
          }
          .knob-3 {
            animation: sliderMove3 3.8s ease-in-out infinite 0.7s;
          }
          .bar-1 {
            animation: pulseBar1 2.8s ease-in-out infinite;
            transform-origin: 138px 225px;
          }
          .bar-2 {
            animation: pulseBar2 3.2s ease-in-out infinite 0.2s;
            transform-origin: 154px 225px;
          }
          .bar-3 {
            animation: pulseBar3 2.6s ease-in-out infinite 0.5s;
            transform-origin: 170px 225px;
          }
          .monitor-unit {
            animation: floatGentle 5s ease-in-out infinite;
            transform-origin: 200px 200px;
          }
          .glow-ring {
            animation: glowPulse 2.5s ease-in-out infinite;
          }
        `}</style>

        <defs>
          <linearGradient id="monitorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
          <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* 1. Animated Rotating Mechanical Gears in Background */}
        <g className="gear-1">
          <circle cx="95" cy="185" r="32" fill="#E2E8F0" opacity="0.8" stroke="#CBD5E1" strokeWidth="4" strokeDasharray="10 8" />
          <circle cx="95" cy="185" r="14" fill="#FFFFFF" />
        </g>

        <g className="gear-2">
          <circle cx="75" cy="245" r="24" fill="#E2E8F0" opacity="0.7" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="8 6" />
          <circle cx="75" cy="245" r="10" fill="#FFFFFF" />
        </g>

        {/* 2. Floating Monitor Unit */}
        <g className="monitor-unit">
          {/* Monitor Stand & Base */}
          <ellipse cx="200" cy="335" rx="75" ry="12" fill="#CBD5E1" opacity="0.6" />
          <path d="M185 270 L175 325 C175 330 185 334 200 334 C215 334 225 330 225 325 L215 270 Z" fill="#0077B6" />
          <ellipse cx="200" cy="328" rx="42" ry="7" fill="#0096C7" />

          {/* Main Monitor Bezel */}
          <rect x="105" y="85" width="200" height="185" rx="14" fill="#0077B6" stroke="#023E8A" strokeWidth="4" filter="url(#cardShadow)" />
          <rect x="110" y="90" width="190" height="175" rx="10" fill="url(#screenGrad)" />

          {/* Window Header Bar with Action Dots */}
          <path d="M110 90 H300 V115 H110 Z" fill="#1E293B" />
          <circle cx="125" cy="102" r="3.5" fill="#EF4444" />
          <circle cx="137" cy="102" r="3.5" fill="#F59E0B" />
          <circle cx="149" cy="102" r="3.5" fill="#10B981" />

          {/* User Profile Card on Screen Left */}
          <g transform="translate(130, 125)">
            <rect x="0" y="0" width="48" height="42" rx="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#cardShadow)" />
            {/* Avatar */}
            <circle cx="24" cy="14" r="7" fill="#F43F5E" />
            <path d="M12 34 C12 27 16 25 24 25 C32 25 36 27 36 34 Z" fill="#F43F5E" />
          </g>

          {/* Sliders / Control Panel on Screen Right */}
          <g transform="translate(190, 125)">
            <rect x="0" y="0" width="95" height="62" rx="8" fill="url(#cyanGrad)" filter="url(#cardShadow)" />
            
            {/* Slider Vertical Tracks */}
            <line x1="22" y1="12" x2="22" y2="50" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />
            <line x1="48" y1="12" x2="48" y2="50" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />
            <line x1="74" y1="12" x2="74" y2="50" stroke="#E0F2FE" strokeWidth="3" strokeLinecap="round" />

            {/* Moving Slider Knobs */}
            <g className="knob-1">
              <circle cx="22" cy="20" r="5.5" fill="#FFFFFF" stroke="#0077B6" strokeWidth="2" />
            </g>
            <g className="knob-2">
              <circle cx="48" cy="40" r="5.5" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
            </g>
            <g className="knob-3">
              <circle cx="74" cy="25" r="5.5" fill="#FFFFFF" stroke="#0077B6" strokeWidth="2" />
            </g>
          </g>

          {/* Animated Metrics Bar Chart */}
          <g>
            {/* Bar 1 (Cyan) */}
            <rect className="bar-1" x="133" y="185" width="10" height="40" rx="3" fill="#06B6D4" />
            {/* Bar 2 (Orange) */}
            <rect className="bar-2" x="149" y="173" width="10" height="52" rx="3" fill="#F97316" />
            {/* Bar 3 (Blue) */}
            <rect className="bar-3" x="165" y="190" width="10" height="35" rx="3" fill="#2563EB" />
          </g>

          {/* Activity Mini Sparkline on Screen Bottom Right */}
          <g transform="translate(190, 198)">
            <rect x="0" y="0" width="95" height="28" rx="6" fill="#F1F5F9" />
            <path d="M8 18 L24 10 L42 20 L62 8 L86 14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="86" cy="14" r="3" fill="#10B981" className="glow-ring" />
          </g>
        </g>

        {/* 3. Floating Accent Code & Tech Badges */}
        <g transform="translate(290, 80)">
          <circle cx="16" cy="16" r="16" fill="url(#orangeGrad)" filter="url(#cardShadow)" />
          <path d="M11 16 L14 13 M21 13 L24 16 M14 19 L11 16 M24 16 L21 19 M17 11 L15 21" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(60, 110)">
          <circle cx="14" cy="14" r="14" fill="#3B82F6" opacity="0.9" filter="url(#cardShadow)" />
          <path d="M9 14 L12 17 L19 10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
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

      {/* 3. Top-Right Modern Dot-Matrix Grid Panel */}
      <div 
        className="absolute top-4 right-4 sm:top-8 sm:right-8 w-64 h-64 sm:w-80 sm:h-80 pointer-events-none opacity-30 hidden md:block"
        style={{
          backgroundImage: 'radial-gradient(circle, #FFFFFF 1.75px, transparent 1.75px)',
          backgroundSize: '22px 22px'
        }}
      />

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
        className="w-full max-w-[980px] min-h-[540px] bg-white rounded-3xl sm:rounded-[36px] shadow-[0_30px_90px_-15px_rgba(20,28,100,0.35),0_0_0_1px_rgba(255,255,255,0.2)] overflow-hidden grid grid-cols-1 md:grid-cols-12 relative z-20"
      >
        
        {/* ===================================================== */}
        {/* LEFT COLUMN: Logo & Animated SVG Dashboard Graphic    */}
        {/* ===================================================== */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#EEF2FF] via-[#F4F7FE] to-[#F8FAFC] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
          
          {/* Top Brand Logo */}
          <div className="flex items-center gap-2.5 z-10">
            <img
              src={logoUrl || "/apple-touch-icon.png"}
              alt="Marvel Slice"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight text-brand-blue">
              Marvel <span className="text-brand-orange">Slice</span>
            </span>
          </div>

          {/* Center Animated SVG Graphic Illustration */}
          <div className="my-auto py-4 sm:py-6 flex items-center justify-center relative w-full">
            <AnimatedAdminDashboardSvg />
          </div>

          <div />
        </div>

        {/* ===================================================== */}
        {/* RIGHT COLUMN: Modern Clean Login Form                 */}
        {/* ===================================================== */}
        <div className="md:col-span-7 bg-white p-7 sm:p-11 lg:p-12 flex flex-col justify-center">
          
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                EMAIL ADDRESS
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                PASSWORD
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
