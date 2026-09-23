import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiCheckCircle, FiLock, FiClock, FiArrowRight, FiUser, FiCamera,
  FiUpload, FiShield, FiAlertCircle, FiCheck, FiCalendar, FiMail, FiPhone
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';
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
    const reader = new FileReader();
    reader.onload = (event) => onPhotoCaptured(event.target.result);
    reader.readAsDataURL(file);
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
    <div className="space-y-2 bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-bold text-slate-800">
          Candidate Identity Photo <span className="text-rose-500">*</span>
        </label>
        {!photoUrl && (
          <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => { setMode('upload'); stopCamera(); }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'upload' ? 'bg-white text-brand-blue shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FiUpload className="w-3.5 h-3.5" />
              <span>Upload / Drag</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('camera'); onPhotoCaptured(''); startCamera(); }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mode === 'camera' ? 'bg-white text-brand-blue shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
          <div className="w-10 h-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center">
            <FiUpload className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              Drag & drop photo here, or <span className="text-brand-blue underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Supports JPG, PNG or WEBP (Max 5MB)
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] text-rose-600 font-semibold text-center mt-1">{error}</p>}
    </div>
  );
}

export default function CustomExamRegister() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const [userDegree, setUserDegree] = useState(DEFAULT_DEGREES[0]);
  const [customDegree, setCustomDegree] = useState('');
  const [userDept, setUserDept] = useState('Computer Science & Engineering');
  const [customDept, setCustomDept] = useState('');
  const [userYear, setUserYear] = useState('3rd Year');
  const [userCgpa, setUserCgpa] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

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
    } else {
      // Demo fallback
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
      } else if (error) {
        console.error('Registration insert error:', error);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <TopBar />
      <Header />

      <main className="flex-1 py-6 sm:py-8 px-4 flex flex-col justify-center items-center">
        <div className="max-w-2xl w-full mx-auto">
          {/* REGISTRATION CARD WITH INTERNAL SCROLL */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 flex flex-col max-h-[80vh] sm:max-h-[75vh] overflow-hidden">
            <div className="bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 py-3 px-5 sm:py-3.5 sm:px-6 border-b border-slate-300 text-center shrink-0 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-2 shadow-2xs">
              <h1 className="text-lg sm:text-xl font-black text-brand-blue tracking-tight">
                Candidate Exam Registration
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium mt-0.5">
                Fill in your details to register for <span className="font-semibold text-slate-800">{exam?.title || 'Mock Exam'}</span>
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
            ) : isRegistered ? (
              /* SUCCESS CONFIRMATION */
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 py-6 my-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                  <FiCheckCircle className="w-8 h-8" />
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
                  <h2 className="text-xl font-extrabold text-slate-900">Registration Completed! 🎉</h2>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Your candidate details have been successfully recorded. You will be able to log in to the exam portal using your registered email address and Date of Birth once the exam commences.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-center space-y-1">
                  <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                    Registration Details Saved
                  </p>
                  <p className="text-xs text-emerald-700">
                    <span className="font-semibold">{userEmail}</span>
                  </p>
                </div>
              </div>
            ) : (
              /* REGISTRATION FORM WITH INDEPENDENT INTERNAL SCROLL */
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 mt-4">
                <div className="flex-1 overflow-y-auto pr-2 space-y-5">

                  {/* SECTION ABOVE PHOTO: PERSONAL DETAILS */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-brand-blue border-b border-slate-100 pb-1">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="Enter first name"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.firstName && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                          placeholder="Enter last name"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.lastName && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.lastName}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={userEmail}
                          onChange={e => setUserEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.email && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={userPhone}
                          onChange={e => setUserPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.phone && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.phone}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Date of Birth <span className="text-red-500">*</span>
                        </label>
                        <div className="relative flex items-center">
                          <FiCalendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
                          <input
                            type="date"
                            value={userDob}
                            onChange={e => setUserDob(e.target.value)}
                            onClick={e => { try { e.target.showPicker?.(); } catch (err) {} }}
                            required
                            style={{ colorScheme: 'light' }}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-2 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                          />
                        </div>
                        {formErrors.dob && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.dob}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Full Residential Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userAddress}
                          onChange={e => setUserAddress(e.target.value)}
                          placeholder="Street, City, State & Pincode"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.address && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.address}</p>}
                      </div>
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
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-brand-blue border-b border-slate-100 pb-1">
                      Educational Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* 10th School Name & Mark */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          10th School Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={user10thSchool}
                          onChange={e => setUser10thSchool(e.target.value)}
                          placeholder="e.g. Govt Higher Sec School"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.user10thSchool && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.user10thSchool}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          10th Mark (%) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={user10thMark}
                          onChange={e => setUser10thMark(e.target.value)}
                          placeholder="e.g. 88.5"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.user10thMark && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.user10thMark}</p>}
                      </div>

                      {/* 12th School Name & Mark */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          12th / Diploma School Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={user12thSchool}
                          onChange={e => setUser12thSchool(e.target.value)}
                          placeholder="e.g. St. Joseph Higher Sec School"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.user12thSchool && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.user12thSchool}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          12th / Diploma Mark (%) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={user12thMark}
                          onChange={e => setUser12thMark(e.target.value)}
                          placeholder="e.g. 92.0"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.user12thMark && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.user12thMark}</p>}
                      </div>

                      {/* College Name */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          College / Institute Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={userCollege}
                          onChange={e => setUserCollege(e.target.value)}
                          placeholder="e.g. Marvel Institute of Technology"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.college && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.college}</p>}
                      </div>

                      {/* Degree Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Degree / Qualification <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={userDegree}
                          onChange={e => setUserDegree(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:bg-white"
                        >
                          {(exam?.allowed_degrees && exam.allowed_degrees.length > 0 ? exam.allowed_degrees : DEFAULT_DEGREES).map((deg, idx) => (
                            <option key={idx} value={deg}>{deg}</option>
                          ))}
                          <option value="Other">Other Degree</option>
                        </select>
                      </div>

                      {userDegree === 'Other' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Specify Degree <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={customDegree}
                            onChange={e => setCustomDegree(e.target.value)}
                            placeholder="e.g. B.E (Robotics), B.Tech..."
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                          />
                          {formErrors.customDegree && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.customDegree}</p>}
                        </div>
                      )}

                      {/* Department */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={userDept}
                          onChange={e => setUserDept(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white"
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

                      {userDept === 'Other' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Specify Department <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={customDept}
                            onChange={e => setCustomDept(e.target.value)}
                            placeholder="Enter your department"
                            required
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                          />
                          {formErrors.customDept && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.customDept}</p>}
                        </div>
                      )}

                      {/* Year of Study */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Year of Study <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={userYear}
                          onChange={e => setUserYear(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white"
                        >
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Post Graduate">Post Graduate</option>
                        </select>
                      </div>

                      {/* Current CGPA */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Current College CGPA <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={userCgpa}
                          onChange={e => setUserCgpa(e.target.value)}
                          placeholder="e.g. 8.5"
                          required
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                        />
                        {formErrors.cgpa && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.cgpa}</p>}
                      </div>
                    </div>
                  </div>

                </div>

                {/* STICKY SUBMIT FOOTER AT BOTTOM OF CARD WITH SILVER BG */}
                <div className="py-2.5 px-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 border-t border-slate-300 flex justify-center shrink-0 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 mt-3 shadow-2xs">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

