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
/* ANIMATED OPENED LAPTOP WITH LIVE CODING ANIMATION          */
/* ========================================================= */
function AnimatedLaptopCodingModel() {
  const codeLines = [
    { num: 1, content: <><span className="text-pink-400 font-bold">const</span> <span className="text-cyan-300 font-semibold">hero</span> <span className="text-white">=</span> <span className="text-amber-300 font-medium">'Marvel'</span>;</> },
    { num: 2, content: <><span className="text-purple-400 font-bold">function</span> <span className="text-yellow-300 font-semibold">codeMagic</span><span className="text-cyan-300">()</span> <span className="text-cyan-300">&#123;</span></> },
    { num: 3, content: <><span className="pl-3 text-emerald-400 font-semibold">console</span>.<span className="text-yellow-300">log</span><span className="text-cyan-300">(</span><span className="text-emerald-300">'🚀 100% Smooth!'</span><span className="text-cyan-300">)</span>;</> },
    { num: 4, content: <><span className="text-cyan-300">&#125;</span></> },
    { num: 5, content: <><span className="text-purple-400 font-bold">export default</span> <span className="text-yellow-300 font-semibold">codeMagic</span>;</> },
  ];

  return (
    <motion.div 
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-full max-w-[340px] sm:max-w-[380px] mx-auto relative select-none"
    >
      <svg
        viewBox="0 0 400 320"
        className="w-full h-auto drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          @keyframes codeScrollAnim {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-24px); }
          }
          .animate-code-scroll {
            animation: codeScrollAnim 7s ease-in-out infinite;
          }
        `}</style>
        <defs>
          <linearGradient id="screenBezelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="laptopBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="baseSideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <filter id="cartoonShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0284C7" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Floating Cartoon Sparkles */}
        <g className="animate-pulse">
          <circle cx="40" cy="50" r="4" fill="#38BDF8" opacity="0.8" />
          <circle cx="360" cy="70" r="6" fill="#F472B6" opacity="0.8" />
          <circle cx="370" cy="200" r="5" fill="#FBBF24" opacity="0.8" />
          <path d="M30 180 L36 186 L30 192 L24 186 Z" fill="#60A5FA" opacity="0.7" />
        </g>

        {/* Drop Shadow Base */}
        <ellipse cx="200" cy="295" rx="150" ry="18" fill="#0369A1" opacity="0.25" filter="blur(6px)" />

        {/* CARTOON LAPTOP BASE (KEYBOARD DECK IN 2.5D PERSPECTIVE) */}
        {/* Base Side Thickness Edge */}
        <path
          d="M 50 240 L 70 270 L 330 270 L 350 240 Z"
          fill="url(#baseSideGrad)"
        />
        {/* Base Front Lip */}
        <path
          d="M 70 270 L 70 276 C 70 282, 330 282, 330 276 L 330 270 Z"
          fill="#1E293B"
        />

        {/* Base Top Keyboard Surface */}
        <path
          d="M 80 195 L 50 240 C 45 248, 355 248, 350 240 L 320 195 Z"
          fill="url(#laptopBodyGrad)"
          stroke="#CBD5E1"
          strokeWidth="3"
        />

        {/* Cartoon Keyboard Tray Recess */}
        <path
          d="M 92 202 L 72 232 L 328 232 L 308 202 Z"
          fill="#1E293B"
        />

        {/* Cartoon Keyboard Keys (Grid Lines / Key Caps) */}
        {/* Row 1 Keys */}
        <path d="M 97 205 L 303 205" stroke="#475569" strokeWidth="3" strokeDasharray="12 4" strokeLinecap="round" />
        {/* Row 2 Keys */}
        <path d="M 92 211 L 308 211" stroke="#475569" strokeWidth="3.5" strokeDasharray="14 4" strokeLinecap="round" />
        {/* Row 3 Keys */}
        <path d="M 87 218 L 313 218" stroke="#334155" strokeWidth="3.5" strokeDasharray="16 4" strokeLinecap="round" />
        {/* Row 4 Spacebar Row */}
        <path d="M 82 225 L 140 225" stroke="#475569" strokeWidth="3.5" strokeDasharray="12 3" strokeLinecap="round" />
        <path d="M 150 225 L 250 225" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" /> {/* Cartoon Spacebar */}
        <path d="M 260 225 L 318 225" stroke="#475569" strokeWidth="3.5" strokeDasharray="12 3" strokeLinecap="round" />

        {/* Cartoon Trackpad */}
        <rect x="175" y="235" width="50" height="9" rx="3" fill="#94A3B8" stroke="#64748B" strokeWidth="1.5" />

        {/* Hinge Connection */}
        <rect x="160" y="190" width="80" height="8" rx="3" fill="#334155" />

        {/* CARTOON LAPTOP LID / SCREEN FRAME */}
        {/* Outer Frame Back */}
        <rect x="60" y="30" width="280" height="168" rx="20" fill="url(#screenBezelGrad)" stroke="#CBD5E1" strokeWidth="4" filter="url(#cartoonShadow)" />
        
        {/* Webcam Lens Dot */}
        <circle cx="200" cy="41" r="3" fill="#0F172A" />
        <circle cx="200" cy="41" r="1" fill="#38BDF8" />

        {/* SCREEN INNER DISPLAY (IDE CODING ANIMATION) */}
        <rect x="74" y="50" width="252" height="136" rx="12" fill="#0B1120" stroke="#1E293B" strokeWidth="2" />

        {/* IDE Window Bar */}
        <rect x="74" y="50" width="252" height="20" rx="10" fill="#070B14" />
        <rect x="74" y="60" width="252" height="10" fill="#070B14" />
        {/* Window Buttons */}
        <circle cx="88" cy="60" r="3" fill="#EF4444" />
        <circle cx="98" cy="60" r="3" fill="#F59E0B" />
        <circle cx="108" cy="60" r="3" fill="#10B981" />
        <text x="125" y="63" fill="#38BDF8" fontSize="9" fontFamily="sans-serif" fontWeight="bold">App.tsx</text>

        {/* Live Code Animation embedded in Screen */}
        <foreignObject x="76" y="72" width="248" height="112">
          <div xmlns="http://www.w3.org/1999/xhtml" className="w-full h-full p-2 text-[10px] font-mono text-left bg-transparent overflow-hidden">
            <div className="space-y-1 animate-code-scroll">
              {codeLines.map((line) => (
                <div key={line.num} className="flex items-center gap-2 whitespace-nowrap leading-tight">
                  <span className="text-slate-600 select-none w-3 text-right text-[9px] font-bold shrink-0">{line.num}</span>
                  <div className="flex-1">{line.content}</div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-slate-600 select-none w-3 text-right text-[9px] font-bold shrink-0">6</span>
                <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse rounded-xs shadow-[0_0_6px_#38BDF8]" />
              </div>
            </div>
          </div>
        </foreignObject>

        {/* Screen Gloss Sheen */}
        <path d="M 74 50 L 220 50 L 74 175 Z" fill="#FFFFFF" opacity="0.04" />

        {/* Floating Cartoon Code Badge Accents */}
        <g className="animate-bounce" style={{ animationDuration: '3s' }}>
          <rect x="25" y="100" width="34" height="24" rx="8" fill="#38BDF8" />
          <text x="32" y="116" fill="#FFFFFF" fontSize="11" fontWeight="extrabold" fontFamily="sans-serif">&lt;/&gt;</text>
        </g>

        <g className="animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <rect x="340" y="110" width="32" height="24" rx="8" fill="#F472B6" />
          <text x="348" y="126" fill="#FFFFFF" fontSize="12" fontWeight="extrabold" fontFamily="sans-serif">&#123;&nbsp;&#125;</text>
        </g>
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
        {/* LEFT COLUMN: Animated Circles & Pattern Mild Blue BG   */}
        {/* ===================================================== */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#EFF4FF] via-[#E8F0FE] to-[#F3F7FF] p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-blue-100/80 min-h-[380px] md:min-h-[500px]">
          
          {/* Top-Left Brand Logo */}
          <div className="flex items-center gap-2.5 z-20">
            <img
              src={logoUrl || "/apple-touch-icon.png"}
              alt="Marvel Slice"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight text-brand-blue">
              Marvel <span className="text-brand-orange">Slice</span>
            </span>
          </div>

          {/* Animated Pattern & Circle Shapes Mild Blue BG Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
            
            {/* Mild Blue Dot Matrix Pattern Layer (...) */}
            <div 
              className="absolute inset-0 opacity-[0.25]"
              style={{
                backgroundImage: 'radial-gradient(#0055FE 1.35px, transparent 1.35px)',
                backgroundSize: '22px 22px',
              }}
            />

            {/* Central Animated Concentric Blue Circle Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              className="absolute w-[360px] h-[360px] rounded-full border border-dashed border-brand-blue/30"
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
              className="absolute top-20 right-16 w-12 h-12 rounded-full bg-white/80 backdrop-blur-xs border border-brand-blue/30 shadow-xs flex items-center justify-center"
            >
              <div className="w-5 h-5 rounded-full bg-brand-blue/20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-brand-blue" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 16, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute bottom-20 left-16 w-10 h-10 rounded-full bg-white/80 backdrop-blur-xs border border-sky-400/30 shadow-xs flex items-center justify-center"
            >
              <div className="w-4 h-4 rounded-full bg-sky-400/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
              </div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-1/2 left-10 w-4 h-4 rounded-full bg-brand-blue/50"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-1/3 right-12 w-5 h-5 rounded-full bg-sky-400/50"
            />
          </div>

          {/* Center Opened Laptop Model with Live Coding Animation */}
          <div className="my-auto py-3 sm:py-5 flex items-center justify-center relative w-full z-20">
            <AnimatedLaptopCodingModel />
          </div>

          <div />
        </div>

        {/* ===================================================== */}
        {/* RIGHT COLUMN: Modern Clean Login Form                 */}
        {/* ===================================================== */}
        <div className="md:col-span-6 bg-white p-7 sm:p-9 lg:p-10 flex flex-col justify-center">
          
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
