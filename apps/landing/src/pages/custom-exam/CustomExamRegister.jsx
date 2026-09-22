import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiCheckCircle, FiLock, FiClock, FiArrowRight, FiUser, FiCamera,
  FiUpload, FiShield, FiAlertCircle, FiCheck, FiCalendar, FiMail, FiPhone
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useSiteSettings } from '../../hooks/useSupabase';

function PhotoCapture({ photoUrl, onPhotoCaptured }) {
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
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
          Candidate Identity Photo <span className="text-slate-400 font-normal">(Optional)</span>
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
    </div>
  );
}

export default function CustomExamRegister() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: settings } = useSiteSettings();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverTimeMs, setServerTimeMs] = useState(Date.now());
  const [regCountdownSecs, setRegCountdownSecs] = useState(0);

  // Form State
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userDob, setUserDob] = useState('');
  const [userDept, setUserDept] = useState('Computer Science & Engineering');
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
      const { data } = await supabase.rpc('get_server_time');
      if (data) setServerTimeMs(new Date(data).getTime());
    } catch (e) {}
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
      const timer = setInterval(() => {
        const nowMs = Date.now();
        const diff = Math.max(0, Math.floor((regStartMs - nowMs) / 1000));
        setRegCountdownSecs(diff);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [exam]);

  const isRegistrationOpen = () => {
    if (!exam?.registration_start_time) return true;
    return Date.now() >= new Date(exam.registration_start_time).getTime();
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!userName.trim()) errs.name = 'Full name is required';
    if (!userEmail.trim()) errs.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) errs.email = 'Valid email is required';
    if (!userPhone.trim()) errs.phone = 'Phone number is required';
    if (!userDob) errs.dob = 'Date of birth calendar selection is required';
    if (!userCollege.trim()) errs.college = 'College/Institute name is required';

    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);

    if (exam && !exam.id.startsWith('demo-')) {
      const { error } = await supabase.from('custom_mock_exam_registrations').insert({
        custom_mock_exam_id: exam.id,
        user_name: userName.trim(),
        user_email: userEmail.trim().toLowerCase(),
        user_phone: userPhone.trim(),
        user_dob: userDob,
        user_department: userDept.trim(),
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
    const m = Math.floor(sec / 60);
    const s = sec % 60;
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-10 px-4">
      <div className="max-w-xl w-full mx-auto space-y-6">
        {/* LOGO HEADER */}
        <div className="text-center space-y-2">
          <span className="text-2xl font-black text-brand-blue tracking-tight font-['Roboto',sans-serif]">
            Marvel <span className="text-brand-orange">Slice</span>
          </span>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Official Candidate Registration Portal
          </p>
        </div>

        {/* REGISTRATION CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-4 text-center">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-brand-blue border border-blue-100">
              Exam Registration
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
              {exam?.title}
            </h1>
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
            /* SUCCESS CONFIRMATION & CREDENTIALS BOX */
            <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <FiCheckCircle className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900">Registration Successful! 🎉</h2>
                <p className="text-xs text-slate-600">
                  Your candidate record has been saved. Please use the credentials below to log in to the exam portal.
                </p>
              </div>

              {/* CREDENTIALS BOX */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 font-mono text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans border-b border-slate-200 pb-1">
                  Your Generated Exam Credentials
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Username (Email):</span>
                  <span className="font-bold text-slate-900">{userEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-500">Password (DOB):</span>
                  <span className="font-bold text-brand-blue">{userDob}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate(`/custom-exam/login/${exam.slug}`)}
                  className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Proceed to Exam Portal Login</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              <PhotoCapture
                photoUrl={candidatePhoto}
                onPhotoCaptured={url => setCandidatePhoto(url)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Enter full name"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                  />
                  {formErrors.name && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
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
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
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
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Date of Birth (Password) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={userDob}
                    onChange={e => setUserDob(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
                  />
                  {formErrors.dob && <p className="text-[10px] text-rose-600 font-semibold mt-0.5">{formErrors.dob}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
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

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
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
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
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

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <span>{submitting ? 'Registering...' : 'Register & Get Login Credentials'}</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
