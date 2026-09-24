import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FiUsers, FiSearch, FiDownload, FiFileText, FiRefreshCw, FiUser, FiCalendar, FiPhone, FiMail,
  FiX, FiCheck, FiSend, FiCopy, FiExternalLink, FiMapPin, FiAward, FiBookOpen, FiShield, FiEye
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CustomMockExamRegistrations() {
  const [searchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId') || 'ALL';

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState(null); // Detail Popup Modal
  const [emailModalCandidate, setEmailModalCandidate] = useState(null); // Email Compose Modal
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [selectedExamId]);

  async function fetchExams() {
    const { data } = await supabase
      .from('custom_mock_exams')
      .select('id, title, slug')
      .order('created_at', { ascending: false });

    if (data) setExams(data);
  }

  async function fetchRegistrations() {
    setLoading(true);
    let query = supabase
      .from('custom_mock_exam_registrations')
      .select('*, custom_mock_exams(title, slug)')
      .order('created_at', { ascending: false });

    if (selectedExamId !== 'ALL') {
      query = query.eq('custom_mock_exam_id', selectedExamId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setRegistrations(data);
    } else {
      console.warn('custom_mock_exam_registrations query error:', error);
      // Demo registrations if table empty
      setRegistrations([
        {
          id: 'reg-demo-1',
          user_name: 'Lethin Kumar',
          user_email: 'lethin@example.com',
          user_phone: '+91 98765 43210',
          user_dob: '2003-08-15',
          user_department: 'Computer Science & Engineering',
          user_degree: 'B.E (Computer Science & Engineering)',
          user_year: '3rd Year',
          user_college: 'Marvel Institute of Technology',
          user_address: '123 Tech Park Avenue, Chennai, Tamil Nadu',
          user_10th_mark: 92.5,
          user_12th_mark: 94.0,
          user_cgpa: 8.85,
          created_at: new Date().toISOString(),
          custom_mock_exams: { title: 'Special IBPS PO Speed Drill 2026', slug: 'ibps-po-special-drill' }
        }
      ]);
    }
    setLoading(false);
  }

  const filteredRegistrations = registrations.filter(r => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.user_name?.toLowerCase().includes(term) ||
      r.user_email?.toLowerCase().includes(term) ||
      r.user_phone?.toLowerCase().includes(term) ||
      r.user_college?.toLowerCase().includes(term) ||
      r.user_department?.toLowerCase().includes(term) ||
      r.user_reg_num?.toLowerCase().includes(term)
    );
  });

  // Export All CSV
  function exportCSV() {
    if (filteredRegistrations.length === 0) return;
    const headers = ['Candidate Name', 'Email (Username)', 'DOB (Password)', 'Phone', 'College', 'Register / Roll No', 'Department', 'Degree', 'Year', '10th Mark', '12th Mark', 'CGPA', 'Address', 'Exam Title', 'Registration Date'];
    const rows = filteredRegistrations.map(r => [
      `"${r.user_name || ''}"`,
      `"${r.user_email || ''}"`,
      `"${r.user_dob || ''}"`,
      `"${r.user_phone || ''}"`,
      `"${r.user_college || ''}"`,
      `"${r.user_reg_num || ''}"`,
      `"${r.user_department || ''}"`,
      `"${r.user_degree || ''}"`,
      `"${r.user_year || ''}"`,
      `"${r.user_10th_mark || ''}"`,
      `"${r.user_12th_mark || ''}"`,
      `"${r.user_cgpa || ''}"`,
      `"${r.user_address || ''}"`,
      `"${r.custom_mock_exams?.title || ''}"`,
      `"${r.created_at ? new Date(r.created_at).toLocaleString() : ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `custom_exam_candidates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export All PDF
  function exportPDF() {
    if (filteredRegistrations.length === 0) return;
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Custom Mock Exam Registered Candidates Report', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredRegistrations.length}`, 14, 22);

    const tableData = filteredRegistrations.map((r, i) => [
      i + 1,
      r.user_name || '',
      r.user_email || '',
      r.user_dob || '',
      r.user_phone || '',
      r.user_college || '',
      r.user_reg_num || 'N/A',
      r.user_department || '',
      r.user_year || '',
      r.custom_mock_exams?.title || ''
    ]);

    doc.autoTable({
      startY: 28,
      head: [['#', 'Name', 'Email (Username)', 'DOB (Password)', 'Phone', 'College', 'Reg No', 'Department', 'Year', 'Exam']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 }
    });

    doc.save(`custom_exam_candidates_${Date.now()}.pdf`);
  }

  // Export Single Candidate PDF
  function exportSingleCandidatePDF(candidate) {
    if (!candidate) return;
    const doc = new jsPDF();

    // Header Banner
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('MARVEL SLICE LMS — CANDIDATE PROFILE DOSSIER', 14, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text(candidate.user_name || 'Candidate Profile', 14, 38);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Exam Title: ${candidate.custom_mock_exams?.title || 'Custom Mock Exam'}`, 14, 45);
    doc.text(`Registration Date: ${candidate.created_at ? new Date(candidate.created_at).toLocaleString() : 'N/A'}`, 14, 51);

    // Credentials Card Box
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 56, 182, 22, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(14, 56, 182, 22, 'S');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`LOGIN USERNAME (EMAIL): ${candidate.user_email || 'N/A'}`, 18, 65);
    doc.text(`LOGIN PASSWORD (DOB): ${candidate.user_dob || 'N/A'}`, 18, 73);

    // Details Grid Table
    const profileDetails = [
      ['Candidate Name', candidate.user_name || 'N/A', 'Phone Number', candidate.user_phone || 'N/A'],
      ['Email Address', candidate.user_email || 'N/A', 'Date of Birth', candidate.user_dob || 'N/A'],
      ['College Name', candidate.user_college || 'N/A', 'Register / Roll No', candidate.user_reg_num || 'N/A'],
      ['Department', candidate.user_department || 'N/A', 'Degree / Branch', candidate.user_degree || 'N/A'],
      ['Year of Study', candidate.user_year || 'N/A', '10th Mark / %', candidate.user_10th_mark ? `${candidate.user_10th_mark}%` : 'N/A'],
      ['12th / Diploma %', candidate.user_12th_mark ? `${candidate.user_12th_mark}%` : 'N/A', 'College CGPA', candidate.user_cgpa ? `${candidate.user_cgpa}` : 'N/A'],
      ['Residential Address', candidate.user_address || 'N/A', '', '']
    ];

    doc.autoTable({
      startY: 84,
      head: [['Field', 'Detail', 'Field', 'Detail']],
      body: profileDetails,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save(`${(candidate.user_name || 'candidate').replace(/[^a-z0-9]/gi, '_')}_profile.pdf`);
  }

  // Export Single Candidate CSV
  function exportSingleCandidateCSV(candidate) {
    if (!candidate) return;
    const headers = ['Field', 'Value'];
    const rows = [
      ['Candidate Name', `"${candidate.user_name || ''}"`],
      ['Email (Username)', `"${candidate.user_email || ''}"`],
      ['DOB (Password)', `"${candidate.user_dob || ''}"`],
      ['Phone', `"${candidate.user_phone || ''}"`],
      ['College', `"${candidate.user_college || ''}"`],
      ['Register / Roll No', `"${candidate.user_reg_num || ''}"`],
      ['Department', `"${candidate.user_department || ''}"`],
      ['Degree', `"${candidate.user_degree || ''}"`],
      ['Year', `"${candidate.user_year || ''}"`],
      ['10th Mark', `"${candidate.user_10th_mark || ''}"`],
      ['12th Mark', `"${candidate.user_12th_mark || ''}"`],
      ['CGPA', `"${candidate.user_cgpa || ''}"`],
      ['Address', `"${candidate.user_address || ''}"`],
      ['Registered Exam', `"${candidate.custom_mock_exams?.title || ''}"`],
      ['Registration Date', `"${candidate.created_at ? new Date(candidate.created_at).toLocaleString() : ''}"`]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(candidate.user_name || 'candidate').replace(/[^a-z0-9]/gi, '_')}_details.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Email Composer Opener
  function openEmailComposer(candidate) {
    const examTitle = candidate.custom_mock_exams?.title || 'Custom Mock Exam';
    const examSlug = candidate.custom_mock_exams?.slug || '';
    const portalUrl = `${window.location.origin}/custom-exam/login/${examSlug}`;

    const subject = `Registration Confirmation & Login Credentials for ${examTitle}`;
    const body = `Dear ${candidate.user_name || 'Candidate'},

Thank you for registering for ${examTitle}. Here are your login details to access the exam portal:

📌 Exam Portal URL: ${portalUrl}
📧 Username (Email): ${candidate.user_email}
🔑 Password (DOB): ${candidate.user_dob || 'Your Date of Birth'}

Please ensure you log in during your scheduled exam window.

Best regards,
Marvel Slice LMS Team`;

    setEmailSubject(subject);
    setEmailBody(body);
    setEmailModalCandidate(candidate);
  }

  function sendMailtoEmail() {
    if (!emailModalCandidate) return;
    const mailtoUrl = `mailto:${emailModalCandidate.user_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  }

  function handleCopyText(text, fieldName) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            Registered Candidates
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-brand-blue" />
            <span>Custom Exam Registered Candidates</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any candidate row to view full profile dossier, download individual PDF/CSV reports, or send credentials via email.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FiDownload className="w-3.5 h-3.5" />
            <span>Export All CSV</span>
          </button>
          <button
            type="button"
            onClick={exportPDF}
            className="px-4 py-2 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>Export All PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 uppercase shrink-0">Filter Exam:</label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none w-full sm:w-64 cursor-pointer"
          >
            <option value="ALL">All Custom Exams ({exams.length})</option>
            {exams.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <FiSearch className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      {/* CANDIDATES TABLE */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading registered candidates...</p>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-2">
          <FiUsers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">No Candidate Registrations Found</h3>
          <p className="text-xs text-slate-500">Candidates who register using the custom registration link will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                  <th className="p-3.5">Candidate</th>
                  <th className="p-3.5">Login Credentials</th>
                  <th className="p-3.5">College & Dept</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Registered Exam</th>
                  <th className="p-3.5">Reg Date</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    onClick={() => setSelectedCandidate(reg)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center group-hover:border-brand-blue transition-colors">
                          {reg.candidate_photo ? (
                            <img src={reg.candidate_photo} alt={reg.user_name} className="w-full h-full object-cover" />
                          ) : (
                            <FiUser className="w-4 h-4 text-slate-400 group-hover:text-brand-blue transition-colors" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs group-hover:text-brand-blue transition-colors">
                            {reg.user_name}
                          </span>
                          <span className="text-[10px] text-slate-400 block">{reg.user_year || 'Candidate'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-mono text-slate-900 block text-[11px]">
                          <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">User:</span>
                          {reg.user_email}
                        </span>
                        <span className="font-mono text-brand-blue font-bold block text-[11px]">
                          <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">Pass (DOB):</span>
                          {reg.user_dob || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-900 block">{reg.user_college || 'N/A'}</span>
                      <span className="text-[10px] text-slate-500 block">{reg.user_department || 'N/A'}</span>
                      {reg.user_reg_num && (
                        <span className="text-[10px] font-mono text-brand-blue font-bold block">Reg: {reg.user_reg_num}</span>
                      )}
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-800">
                      {reg.user_phone || 'N/A'}
                    </td>

                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-brand-blue border border-blue-100">
                        {reg.custom_mock_exams?.title || 'Custom Exam'}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(reg)}
                          title="View Full Profile Dossier"
                          className="p-1.5 bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <FiEye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEmailComposer(reg)}
                          title="Send Email / Reply"
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-colors cursor-pointer"
                        >
                          <FiMail className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CANDIDATE FULL PROFILE DOSSIER POPUP MODAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                  {selectedCandidate.candidate_photo ? (
                    <img src={selectedCandidate.candidate_photo} alt={selectedCandidate.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{selectedCandidate.user_name}</h2>
                  <p className="text-xs text-slate-500 font-medium">{selectedCandidate.user_degree || selectedCandidate.user_department || 'Candidate'} • {selectedCandidate.user_year || 'Registered'}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 text-brand-blue border border-blue-200 rounded-full text-[10px] font-bold uppercase">
                    {selectedCandidate.custom_mock_exams?.title || 'Custom Exam'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* ACTION TOOLBAR: EXPORT PDF, EXPORT EXCEL, SEND EMAIL */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider pl-1">Extract & Reply Actions:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportSingleCandidatePDF(selectedCandidate)}
                  className="px-3.5 py-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FiFileText className="w-3.5 h-3.5" />
                  <span>PDF Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportSingleCandidateCSV(selectedCandidate)}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FiDownload className="w-3.5 h-3.5" />
                  <span>CSV / Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const cand = selectedCandidate;
                    setSelectedCandidate(null);
                    openEmailComposer(cand);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FiMail className="w-3.5 h-3.5" />
                  <span>Reply / Send Email</span>
                </button>
              </div>
            </div>

            {/* MODAL CONTENT BODY (SCROLLABLE) */}
            <div className="overflow-y-auto flex-1 space-y-5 pr-1 text-xs">
              
              {/* LOGIN CREDENTIALS BOX */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue flex items-center gap-1.5">
                    <FiShield className="w-4 h-4 text-brand-blue" />
                    Portal Login Credentials
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Authentication Keys</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Username (Email):</span>
                      <span className="font-mono text-xs font-bold text-slate-900 truncate block max-w-[200px]">{selectedCandidate.user_email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedCandidate.user_email, 'email')}
                      className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Copy Email"
                    >
                      {copiedField === 'email' ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Password (DOB):</span>
                      <span className="font-mono text-xs font-bold text-brand-blue block">{selectedCandidate.user_dob || 'N/A'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedCandidate.user_dob, 'dob')}
                      className="p-1.5 bg-slate-100 hover:bg-blue-100 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Copy DOB Password"
                    >
                      {copiedField === 'dob' ? <FiCheck className="w-3.5 h-3.5 text-emerald-600" /> : <FiCopy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ACADEMIC & INSTITUTION INFORMATION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FiBookOpen className="w-4 h-4 text-slate-600" />
                  Academic & Institution Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">College / Institution:</span>
                    <span className="font-bold text-slate-900 block">{selectedCandidate.user_college || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Register / Roll Number:</span>
                    <span className="font-bold font-mono text-brand-blue block">{selectedCandidate.user_reg_num || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Department / Major:</span>
                    <span className="font-bold text-slate-900 block">{selectedCandidate.user_department || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Degree / Branch:</span>
                    <span className="font-bold text-slate-900 block">{selectedCandidate.user_degree || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Year of Study:</span>
                    <span className="font-bold text-slate-900 block">{selectedCandidate.user_year || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* ACADEMIC MARKS & PERCENTAGES */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FiAward className="w-4 h-4 text-emerald-600" />
                  Academic Marks & CGPA
                </span>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">10th Mark / %</span>
                    <span className="text-sm font-black text-slate-900">{selectedCandidate.user_10th_mark ? `${selectedCandidate.user_10th_mark}%` : 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">12th / Diploma %</span>
                    <span className="text-sm font-black text-slate-900">{selectedCandidate.user_12th_mark ? `${selectedCandidate.user_12th_mark}%` : 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">College CGPA</span>
                    <span className="text-sm font-black text-brand-blue">{selectedCandidate.user_cgpa ? `${selectedCandidate.user_cgpa}` : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* CONTACT & PERSONAL DETAILS */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FiUser className="w-4 h-4 text-slate-600" />
                  Contact & Personal Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Phone Number:</span>
                    <span className="font-bold text-slate-900 block font-mono">{selectedCandidate.user_phone || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block">Registration Timestamp:</span>
                    <span className="font-bold text-slate-900 block">{selectedCandidate.created_at ? new Date(selectedCandidate.created_at).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 sm:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 block">Residential Address:</span>
                    <span className="font-semibold text-slate-900 block">{selectedCandidate.user_address || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* MODAL FOOTER */}
            <div className="pt-2 border-t border-slate-100 shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL COMPOSE MODAL */}
      {emailModalCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FiMail className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Reply / Send Email to Candidate</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalCandidate(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">To (Candidate Email):</label>
                <input
                  type="text"
                  value={emailModalCandidate.user_email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Subject:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email Body Content:</label>
                <textarea
                  rows={8}
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-brand-blue/20 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleCopyText(`${emailSubject}\n\n${emailBody}`, 'full_email')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copiedField === 'full_email' ? <FiCheck className="w-4 h-4 text-emerald-600" /> : <FiCopy className="w-4 h-4" />}
                <span>{copiedField === 'full_email' ? 'Copied Body' : 'Copy Message'}</span>
              </button>

              <button
                type="button"
                onClick={sendMailtoEmail}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <FiSend className="w-4 h-4" />
                <span>Send Email (mailto)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
