import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiCheckCircle, FiLock, FiCamera, FiUser,
  FiUpload, FiAlertCircle, FiCalendar, FiMail, FiPhone,
  FiMapPin, FiAward, FiArrowUp
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';
import './custom-exam-responsive.css';
import TopBar from '../../components/layout/TopBar';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

function PhotoCapture({ photoUrl, onPhotoCaptured, error }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'camera'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (mode === 'camera' && !photoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, photoUrl]);

  async function startCamera() {
    setCameraError('');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Webcam is not supported on this browser or requires HTTPS connection.');
      }
      stopCamera();
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
        });
      } catch (e1) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      setCameraError(err.message || 'Camera permission denied or camera not found.');
    }
  }

  // Ensure stream stays bound to video ref when component re-renders
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive, mode]);

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

  function processFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    // Downscale to a max 800px JPEG so the base64 payload stays well under
    // proxy body limits (large phone photos otherwise trigger HTTP 413).
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const MAX_DIM = 800;
        const scale = Math.min(1, MAX_DIM / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || 320) * scale));
        const h = Math.max(1, Math.round((img.height || 320) * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        onPhotoCaptured(canvas.toDataURL('image/jpeg', 0.82));
      } catch (err) {
        // Fall back to the raw file if downscaling fails
        const reader = new FileReader();
        reader.onload = (event) => onPhotoCaptured(event.target.result);
        reader.readAsDataURL(file);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (event) => onPhotoCaptured(event.target.result);
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    processFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[13px] font-bold text-slate-800">
          Candidate Identity Photo <span className="text-red-500">*</span>
        </label>
        {!photoUrl && (
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => { setMode('upload'); stopCamera(); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                mode === 'upload' ? 'bg-white text-brand-blue border-brand-blue/40 shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
            >
              <FiUpload className="w-3.5 h-3.5" />
              <span>Upload / Drag</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('camera'); onPhotoCaptured(''); startCamera(); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                mode === 'camera' ? 'bg-white text-brand-blue border-brand-blue/40 shadow-xs' : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
              }`}
            >
              <FiCamera className="w-3.5 h-3.5" />
              <span>Webcam</span>
            </button>
          </div>
        )}
      </div>

      {photoUrl ? (
        /* Photo Captured / Uploaded Preview */
        <div className="bg-white p-3 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 rounded-xl border-2 border-emerald-500 overflow-hidden shrink-0 shadow-xs">
              <img src={photoUrl} alt="Candidate Preview" className="w-full h-full object-cover" />
              <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white rounded-full p-0.5">
                <FiCheckCircle className="w-3 h-3" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Photo Verified & Attached</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Your identity photo is ready for registration submission.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { onPhotoCaptured(''); setMode('camera'); }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors shrink-0 cursor-pointer"
          >
            Retake / Change Photo
          </button>
        </div>
      ) : mode === 'camera' ? (
        /* Live Webcam Capture Container */
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
          {cameraError ? (
            <div className="text-center p-4 space-y-2">
              <FiAlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-xs text-rose-700 font-semibold">{cameraError}</p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-brand-blue text-white text-xs font-bold rounded-lg shadow-xs hover:bg-brand-blue/90"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('upload'); stopCamera(); }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
                >
                  Upload File Instead
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-[220px] aspect-square rounded-xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center border-2 border-slate-300 shadow-xs">
                <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Corner Face Target Guide Overlay */}
                <div className="absolute inset-4 border border-dashed border-white/40 rounded-full pointer-events-none" />

                {cameraActive ? (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Camera</span>
                  </div>
                ) : (
                  <div className="text-center p-4 text-slate-400 text-xs">
                    Starting camera...
                  </div>
                )}
              </div>

              {cameraActive && (
                <button
                  type="button"
                  onClick={takeSnapshot}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <FiCamera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`bg-white border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-brand-blue bg-blue-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-brand-blue/60 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="w-11 h-11 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center">
            <FiArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Drag & drop photo here, or <span className="text-brand-blue underline">browse</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports JPG, PNG or WEBP (Max 5MB)
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-600 font-semibold text-center mt-1">{error}</p>}
    </div>
  );
}

// Shared field styles matching the reference registration design
const fieldInputCls =
  'w-full h-11 pl-10 pr-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all font-medium';
// Plain variants (no left icon) — used by the Educational Details section
const fieldPlainCls =
  'w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all font-medium';
const fieldPlainSelectCls =
  'w-full h-11 px-3 pr-8 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 transition-all font-medium appearance-none cursor-pointer';

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[13px] font-bold text-slate-800 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      {children}
      {error && <p className="text-[11px] text-rose-600 font-semibold mt-1">{error}</p>}
    </div>
  );
}

function FieldIcon({ children }) {
  return (
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none [&>svg]:w-[18px] [&>svg]:h-[18px]">
      {children}
    </span>
  );
}

function SectionHead({ icon, title, subtitle, tint }) {
  const tones =
    tint === 'amber'
      ? { bar: 'bg-orange-50/80', badge: 'bg-orange-100 text-orange-500', text: 'text-orange-600' }
      : { bar: 'bg-blue-50/80', badge: 'bg-blue-100 text-brand-blue', text: 'text-brand-blue' };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${tones.bar}`}>
      <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${tones.badge}`}>
        {icon}
      </span>
      <span>
        <span className={`block text-[15px] font-extrabold leading-tight ${tones.text}`}>{title}</span>
        <span className="block text-xs text-slate-500 font-medium">{subtitle}</span>
      </span>
    </div>
  );
}

export default function CustomExamRegister() {  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [examLoadFailed, setExamLoadFailed] = useState(false);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [regCountdownSecs, setRegCountdownSecs] = useState(0);

  const DEFAULT_DEGREES = [
    'B.E (Computer Science & Engineering)',
    'B.E (Electronics & Communication Engineering)',
    'B.E (Electrical & Electronics Engineering)',
    'B.E (Mechanical Engineering)',
    'B.E (Civil Engineering)',
    'B.Tech (Information Technology)',
    'B.Tech (Artificial Intelligence & Data Science)',
    'M.E (Software Engineering)',
    'M.Tech (Data Science)',
    'MCA (Master of Computer Applications)',
    'B.Sc (Computer Science)',
    'BCA (Bachelor of Computer Applications)',
    'MBA (Master of Business Administration)'
  ];

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userDob, setUserDob] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [user10thSchool, setUser10thSchool] = useState('');
  const [user10thMark, setUser10thMark] = useState('');
  const [user12thSchool, setUser12thSchool] = useState('');
  const [user12thMark, setUser12thMark] = useState('');
  const [userCollege, setUserCollege] = useState('');
  const [userRegNum, setUserRegNum] = useState('');
  const [userDegree, setUserDegree] = useState(DEFAULT_DEGREES[0]);
  const [customDegree, setCustomDegree] = useState('');
  const [userDept, setUserDept] = useState('Computer Science & Engineering');
  const [customDept, setCustomDept] = useState('');
  const [userYear, setUserYear] = useState('3rd Year');
  const [userCgpa, setUserCgpa] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [redirectSecs, setRedirectSecs] = useState(4);

  // After successful registration: show the success popup, then auto-redirect
  // to the home page after 4 seconds (or immediately on Close).
  useEffect(() => {
    if (!isRegistered) return;
    setRedirectSecs(4);
    const timer = setInterval(() => {
      setRedirectSecs((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = 'https://marvelslice.com';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRegistered]);

  function handleCloseSuccess() {
    window.location.href = 'https://marvelslice.com';
  }

  useEffect(() => {
    fetchExam();
    syncServerTime();
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

  async function fetchExam() {
    setLoading(true);
    const { data, error } = await supabase
      .from('custom_mock_exams')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!error && data) {
      setExam(data);
      setExamLoadFailed(false);
    } else {
      // Demo fallback (offline preview only — never saved to the database)
      setExamLoadFailed(true);
      setExam({
        id: 'demo-custom-1',
        slug: slug || 'ibps-po-special-drill',
        title: 'Special IBPS PO Speed Drill 2026',
        category: 'Banking & Aptitude',
        time_limit_mins: 20,
        question_count_option: 50,
        registration_start_time: null,
        exam_start_time: null
      });
    }
    setLoading(false);
  }

  // Registration Timing Guard Countdown Effect
  useEffect(() => {
    if (exam?.registration_start_time) {
      const regStartMs = new Date(exam.registration_start_time).getTime();
      const check = () => {
        const nowMs = getSyncedNow();
        const diff = Math.max(0, Math.floor((regStartMs - nowMs) / 1000));
        setRegCountdownSecs(diff);
      };
      check();
      const timer = setInterval(check, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, serverOffsetMs]);

  const isRegistrationOpen = () => {
    if (!exam?.registration_start_time) return true;
    return getSyncedNow() >= new Date(exam.registration_start_time).getTime();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    // Never fake a success when the exam failed to load (demo/offline mode skips the DB save)
    if (!exam || exam.id.startsWith('demo-') || examLoadFailed) {
      alert('Cannot reach the server right now, so registration cannot be saved. Please check your connection and reload the page.');
      return;
    }
    // Registration stays open once the window opens (as before) — it is NOT
    // closed by the login-close time. Fresh entry after close is enforced
    // on the login page instead.
    if (!isRegistrationOpen()) {
      alert('Registration is not open yet! Please wait for the scheduled start time.');
      return;
    }

    const errs = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!userEmail.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) errs.email = 'Valid email address is required';
    if (!userPhone.trim()) errs.phone = 'Phone number is required';
    const dobParts = (userDob || '').split('-').filter(Boolean);
    if (!userDob || dobParts.length < 3) errs.dob = 'Complete Date of Birth selection is required';
    if (!userAddress.trim()) errs.address = 'Full residential address is required';
    if (!candidatePhoto) errs.photo = 'Candidate identity photo is mandatory';
    if (!user10thSchool.trim()) errs.user10thSchool = '10th school name is required';
    if (!user10thMark || isNaN(Number(user10thMark))) errs.user10thMark = '10th mark (%) is required';
    if (!user12thSchool.trim()) errs.user12thSchool = '12th/Diploma school name is required';
    if (!user12thMark || isNaN(Number(user12thMark))) errs.user12thMark = '12th/Diploma mark (%) is required';
    if (!userCollege.trim()) errs.college = 'College/Institute name is required';
    if (!userRegNum.trim()) errs.regNum = 'College Register/Roll Number is required';
    if (!userCgpa || isNaN(Number(userCgpa))) errs.cgpa = 'Current CGPA is required';
    if (userDegree === 'Other' && !customDegree.trim()) errs.customDegree = 'Degree qualification is required';
    if (userDept === 'Other' && !customDept.trim()) errs.customDept = 'Department name is required';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const finalDept = userDept === 'Other' ? customDept.trim() : userDept.trim();
    const finalDegree = userDegree === 'Other' ? customDegree.trim() : userDegree.trim();

    const registrationPayload = {
      custom_mock_exam_id: exam?.id,
      user_name: fullName,
      user_email: userEmail.trim().toLowerCase(),
      user_phone: userPhone.trim(),
      user_dob: userDob,
      user_reg_num: userRegNum.trim().toUpperCase(),
      user_department: finalDept,
      user_degree: finalDegree,
      user_address: userAddress.trim(),
      user_10th_school: user10thSchool.trim(),
      user_10th_mark: user10thMark ? Number(user10thMark) : null,
      user_12th_school: user12thSchool.trim(),
      user_12th_mark: user12thMark ? Number(user12thMark) : null,
      user_cgpa: userCgpa ? Number(userCgpa) : null,
      user_year: userYear.trim(),
      user_college: userCollege.trim(),
      candidate_photo: candidatePhoto
    };

    try {
      localStorage.setItem(`custom_exam_reg_${slug}`, JSON.stringify(registrationPayload));
    } catch (e) {}

    if (exam && !exam.id.startsWith('demo-')) {
      // Create db payload omit fields if not present in schema to prevent query failure
      const dbPayload = { ...registrationPayload };
      delete dbPayload.user_10th_school;
      delete dbPayload.user_12th_school;

      const { error } = await supabase.from('custom_mock_exam_registrations').insert(dbPayload);

      if (error && error.code === '23505') {
        alert('You are already registered for this exam! Use your email and DOB to log in.');
        setSubmitting(false);
        return;
      } else if (error) {
        console.error('Registration insert error:', error);
        const rawMsg = error.message || error.code || 'server error';
        const friendly = /413|too large|</i.test(rawMsg)
          ? 'the photo or details are too large to upload. Please use a smaller photo and try again.'
          : rawMsg;
        alert(`Registration failed and was NOT saved (${friendly}). Please try again.`);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    setIsRegistered(true);
  }

  function formatCountdown(sec) {
    if (sec <= 0) return '00:00:00';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="cem-register min-h-screen bg-slate-50 flex flex-col justify-between">
      <TopBar />
      <Header />

      <main className="flex-1 py-6 sm:py-8 px-4 flex flex-col justify-center items-center">
        <div className="max-w-[690px] w-full mx-auto">
          {/* REGISTRATION CARD WITH INTERNAL SCROLL */}
          <div className="cem-card bg-white rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/80 flex flex-col max-h-[85vh] sm:max-h-[80vh] overflow-hidden">
            <div className="text-center shrink-0 -mx-5 -mt-5 sm:-mx-7 sm:-mt-7 mb-4 px-5 py-5 bg-slate-100 border-b border-slate-200">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Candidate Exam Registration
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Fill in your details to register for <span className="font-bold text-slate-800">{exam?.title || 'Mock Exam'}</span>
              </p>
            </div>

            {/* TIMING GUARD CLOSED STATE */}
            {!isRegistrationOpen() ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3 my-auto">
                <FiLock className="w-8 h-8 text-amber-600 mx-auto animate-bounce" />
                <h3 className="font-bold text-sm text-amber-900">Registration Opens Soon</h3>
                <p className="text-xs text-amber-800">
                  Registration for this exam opens at{' '}
                  <span className="font-bold">{new Date(exam.registration_start_time).toLocaleString()}</span>.
                </p>
                <div className="px-4 py-2 bg-amber-600 text-white font-mono font-bold text-sm rounded-xl inline-block shadow-xs">
                  Starts in {formatCountdown(regCountdownSecs)}
                </div>
              </div>
            ) : (
              /* REGISTRATION FORM WITH INDEPENDENT INTERNAL SCROLL */
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 mt-4">
                <div className="flex-1 overflow-y-auto pr-2 space-y-5">

                  {/* SECTION ABOVE PHOTO: PERSONAL DETAILS */}
                  <div className="space-y-4">
                    <SectionHead
                      icon={<FiUser className="w-5 h-5" />}
                      title="Personal Details"
                      subtitle="Enter your basic information to get started"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <Field label="First Name" error={formErrors.firstName}>
                        <div className="relative">
                          <FieldIcon><FiUser /></FieldIcon>
                          <input
                            type="text"
                            value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                            required
                            className={fieldInputCls}
                          />
                        </div>
                      </Field>

                      <Field label="Last Name" error={formErrors.lastName}>
                        <div className="relative">
                          <FieldIcon><FiUser /></FieldIcon>
                          <input
                            type="text"
                            value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                            required
                            className={fieldInputCls}
                          />
                        </div>
                      </Field>

                      <Field label="Email Address" error={formErrors.email}>
                        <div className="relative">
                          <FieldIcon><FiMail /></FieldIcon>
                          <input
                            type="email"
                            value={userEmail}
                            onChange={e => setUserEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            className={fieldInputCls}
                          />
                        </div>
                      </Field>

                      <Field label="Phone Number" error={formErrors.phone}>
                        <div className="relative">
                          <FieldIcon><FiPhone /></FieldIcon>
                          <input
                            type="tel"
                            value={userPhone}
                            onChange={e => setUserPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            required
                            className={fieldInputCls}
                          />
                        </div>
                      </Field>

                      <Field label="Date of Birth" error={formErrors.dob}>
                        <div className="relative flex items-center">
                          <FieldIcon><FiCalendar /></FieldIcon>
                          <input
                            type="date"
                            value={userDob}
                            onChange={e => setUserDob(e.target.value)}
                            onClick={e => { try { e.target.showPicker?.(); } catch (err) {} }}
                            required
                            style={{ colorScheme: 'light' }}
                            className={`${fieldInputCls} font-bold cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-2 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer`}
                          />
                        </div>
                      </Field>

                      <Field label="Full Residential Address" error={formErrors.address}>
                        <div className="relative">
                          <FieldIcon><FiMapPin /></FieldIcon>
                          <input
                            type="text"
                            value={userAddress}
                            onChange={e => setUserAddress(e.target.value)}
                            placeholder="Street, City, State & Pincode"
                            required
                            className={fieldInputCls}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>

                  {/* PHOTO CAPTURE SECTION */}
                  <div className="py-1">
                    <PhotoCapture
                      photoUrl={candidatePhoto}
                      onPhotoCaptured={url => {
                        setCandidatePhoto(url);
                        if (url && formErrors.photo) {
                          setFormErrors(prev => ({ ...prev, photo: undefined }));
                        }
                      }}
                      error={formErrors.photo}
                    />
                  </div>

                  {/* SECTION BELOW PHOTO: EDUCATIONAL DETAILS */}
                  <div className="space-y-4">
                    <SectionHead
                      tint="amber"
                      icon={<FiAward className="w-5 h-5" />}
                      title="Educational Details"
                      subtitle="Enter your academic information"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">

                      {/* 10th School Name & Mark */}
                      <Field label="10th School Name" error={formErrors.user10thSchool}>
                        <div className="relative">
                          <input
                            type="text"
                            value={user10thSchool}
                            onChange={e => setUser10thSchool(e.target.value)}
                            placeholder="e.g. Govt Higher Sec School"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>

                      <Field label="10th Mark (%)" error={formErrors.user10thMark}>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={user10thMark}
                            onChange={e => setUser10thMark(e.target.value)}
                            placeholder="e.g. 88.5"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>

                      {/* 12th School Name & Mark */}
                      <Field label="12th / Diploma School Name" error={formErrors.user12thSchool}>
                        <div className="relative">
                          <input
                            type="text"
                            value={user12thSchool}
                            onChange={e => setUser12thSchool(e.target.value)}
                            placeholder="e.g. St. Joseph Higher Sec School"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>

                      <Field label="12th / Diploma Mark (%)" error={formErrors.user12thMark}>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={user12thMark}
                            onChange={e => setUser12thMark(e.target.value)}
                            placeholder="e.g. 92.0"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>

                      {/* College Name & Register / Roll Number */}
                      <Field label="College / Institute Name" error={formErrors.college}>
                        <div className="relative">
                          <input
                            type="text"
                            value={userCollege}
                            onChange={e => setUserCollege(e.target.value)}
                            placeholder="e.g. Marvel Institute of Technology"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>

                      <Field label="College Register / Roll Number" error={formErrors.regNum}>
                        <div className="relative">
                          <input
                            type="text"
                            value={userRegNum}
                            onChange={e => setUserRegNum(e.target.value)}
                            placeholder="e.g. 711221104015"
                            required
                            className={`${fieldPlainCls} uppercase`}
                          />
                        </div>
                      </Field>

                      {/* Degree Selection */}
                      <Field label="Degree / Qualification" error={undefined}>
                        <div className="relative">
                          <select
                            value={userDegree}
                            onChange={e => setUserDegree(e.target.value)}
                            className={fieldPlainSelectCls}
                          >
                            {(exam?.allowed_degrees && exam.allowed_degrees.length > 0 ? exam.allowed_degrees : DEFAULT_DEGREES).map((deg, idx) => (
                              <option key={idx} value={deg}>{deg}</option>
                            ))}
                            <option value="Other">Other Degree</option>
                          </select>
                        </div>
                      </Field>

                      {userDegree === 'Other' ? (
                        <Field label="Specify Degree" error={formErrors.customDegree}>
                          <div className="relative">
                            <input
                              type="text"
                              value={customDegree}
                              onChange={e => setCustomDegree(e.target.value)}
                              placeholder="e.g. B.E (Robotics), B.Tech..."
                              required
                              className={fieldPlainCls}
                            />
                          </div>
                        </Field>
                      ) : (
                        <Field label="Department" error={undefined}>
                          <div className="relative">
                            <select
                              value={userDept}
                              onChange={e => setUserDept(e.target.value)}
                              className={fieldPlainSelectCls}
                            >
                              <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                              <option value="Information Technology">Information Technology</option>
                              <option value="Electronics & Communication">Electronics & Communication</option>
                              <option value="Electrical Engineering">Electrical Engineering</option>
                              <option value="Mechanical Engineering">Mechanical Engineering</option>
                              <option value="Commerce & Finance">Commerce & Finance</option>
                              <option value="Business Administration (MBA/BBA)">Business Administration (MBA/BBA)</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </Field>
                      )}
                    </div>

                    {/* Year / CGPA row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                      <Field label="Year of Study" error={undefined}>
                        <div className="relative">
                          <select
                            value={userYear}
                            onChange={e => setUserYear(e.target.value)}
                            className={fieldPlainSelectCls}
                          >
                            <option value="1st Year">1st Year</option>
                            <option value="2nd Year">2nd Year</option>
                            <option value="3rd Year">3rd Year</option>
                            <option value="4th Year">4th Year</option>
                            <option value="Post Graduate">Post Graduate</option>
                          </select>
                        </div>
                      </Field>

                      <Field label="Current College CGPA" error={formErrors.cgpa}>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={userCgpa}
                            onChange={e => setUserCgpa(e.target.value)}
                            placeholder="e.g. 7.5"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>
                    </div>

                    {userDegree === 'Other' && (
                      <Field label="Department" error={undefined}>
                        <div className="relative">
                          <select
                            value={userDept}
                            onChange={e => setUserDept(e.target.value)}
                            className={fieldPlainSelectCls}
                          >
                            <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Electronics & Communication">Electronics & Communication</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Commerce & Finance">Commerce & Finance</option>
                            <option value="Business Administration (MBA/BBA)">Business Administration (MBA/BBA)</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </Field>
                    )}

                    {userDept === 'Other' && (
                      <Field label="Specify Department" error={formErrors.customDept}>
                        <div className="relative">
                          <input
                            type="text"
                            value={customDept}
                            onChange={e => setCustomDept(e.target.value)}
                            placeholder="Enter your department"
                            required
                            className={fieldPlainCls}
                          />
                        </div>
                      </Field>
                    )}
                  </div>

                </div>

                {/* SUBMIT */}
                <div className="shrink-0 flex justify-center -mx-5 -mb-5 sm:-mx-7 sm:-mb-7 mt-4 px-5 py-4 bg-slate-100 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-10 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm sm:text-base rounded-2xl shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* REGISTRATION SUCCESS POPUP — Close redirects home, else auto-redirect in 4s */}
      {isRegistered && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
              <FiCheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900">Registration Successful!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your details have been recorded for <span className="font-bold text-slate-800">{userEmail}</span>.
                You can log in to the exam portal with your email and Date of Birth once the exam commences.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleCloseSuccess}
                className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-sm rounded-2xl shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                Close
              </button>
              <p className="text-[11px] text-slate-400 font-medium mt-2">
                Redirecting to home page in {redirectSecs}s…
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

