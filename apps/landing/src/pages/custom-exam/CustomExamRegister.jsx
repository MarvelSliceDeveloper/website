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
  const [mode, setMode] = useState('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (mode === 'camera' && !photoUrl) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, photoUrl]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 320 }, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setMode('upload');
    }
  }

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

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onPhotoCaptured(event.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">
          Candidate Identity Photo <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { setMode('camera'); onPhotoCaptured(''); }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${mode === 'camera' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Webcam
          </button>
          <button
            type="button"
            onClick={() => { setMode('upload'); stopCamera(); }}
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${mode === 'upload' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            Upload
          </button>
        </div>
      </div>

      {photoUrl ? (
        <div className="relative w-28 h-28 mx-auto rounded-xl border-2 border-brand-blue overflow-hidden shadow-xs group">
          <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onPhotoCaptured('')}
            className="absolute inset-0 bg-slate-900/60 text-white font-bold text-[11px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            Retake Photo
          </button>
        </div>
      ) : mode === 'camera' ? (
        <div className="relative w-full max-w-[200px] aspect-square mx-auto rounded-xl bg-slate-900 overflow-hidden flex flex-col items-center justify-center border border-slate-300">
          <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {cameraActive && (
            <button
              type="button"
              onClick={takeSnapshot}
              className="absolute bottom-2 px-3 py-1 bg-brand-orange text-white font-bold text-[11px] rounded-full shadow-md cursor-pointer"
            >
              Capture
            </button>
          )}
        </div>
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
        />
      )}
      {error && <p className="text-[10px] text-rose-600 font-semibold text-center mt-1">{error}</p>}
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

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userDob, setUserDob] = useState('');
  const [userDept, setUserDept] = useState('Computer Science & Engineering');
  const [customDept, setCustomDept] = useState('');
  const [userYear, setUserYear] = useState('3rd Year');
  const [userCollege, setUserCollege] = useState('');
  const [candidatePhoto, setCandidatePhoto] = useState('');
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
    if (!candidatePhoto) errs.photo = 'Candidate photo is mandatory';
    if (!userEmail.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) errs.email = 'Valid email is required';
    if (!userPhone.trim()) errs.phone = 'Phone number is required';
    const dobParts = (userDob || '').split('-').filter(Boolean);
    if (!userDob || dobParts.length < 3) errs.dob = 'Complete Date of Birth selection is required';
    if (userDept === 'Other' && !customDept.trim()) errs.customDept = 'Department name is required';
    if (!userCollege.trim()) errs.college = 'College/Institute name is required';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const finalDept = userDept === 'Other' ? customDept.trim() : userDept.trim();

    if (exam && !exam.id.startsWith('demo-')) {
      const { error } = await supabase.from('custom_mock_exam_registrations').insert({
        custom_mock_exam_id: exam.id,
        user_name: fullName,
        user_email: userEmail.trim().toLowerCase(),
        user_phone: userPhone.trim(),
        user_dob: userDob,
        user_department: finalDept,
        user_year: userYear.trim(),
        user_college: userCollege.trim(),
        candidate_photo: candidatePhoto
      });

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

      <main className="flex-1 py-10 px-4 flex flex-col justify-center items-center">
        <div className="max-w-2xl w-full mx-auto space-y-6">
          {/* REGISTRATION CARD */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4 text-center">
              <h1 className="text-xl sm:text-2xl font-black text-brand-blue tracking-tight">
                Candidate Exam Registration
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Fill in your details to register for <span className="font-semibold text-slate-700">{exam?.title || 'Mock Exam'}</span>
              </p>
            </div>

            {/* TIMING GUARD CLOSED STATE */}
            {!isRegistrationOpen() ? (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
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
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 py-4">
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
              /* REGISTRATION FORM */
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      Email Address (Username) <span className="text-red-500">*</span>
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
                      Date of Birth (Password) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={userDob}
                      onChange={e => setUserDob(e.target.value)}
                      required
                      style={{ colorScheme: 'light' }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 cursor-pointer"
                    />
                    {formErrors.dob && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.dob}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Discipline <span className="text-red-500">*</span>
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
                        placeholder="Enter your department / discipline"
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                      />
                      {formErrors.customDept && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.customDept}</p>}
                    </div>
                  )}

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
                </div>

                <div>
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

                <div className="pt-3 border-t border-slate-100 flex justify-center">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all inline-flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                    <FiArrowRight className="w-4 h-4" />
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

