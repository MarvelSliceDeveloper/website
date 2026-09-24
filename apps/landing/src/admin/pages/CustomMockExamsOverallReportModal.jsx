import { useState, useEffect, useMemo } from 'react';
import { FiX, FiUsers, FiCheckCircle, FiAward, FiDownload, FiClipboard } from 'react-icons/fi';
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabaseClient';

const BAR_COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899'];

function StatCard({ icon: Icon, label, value, sub, tint }) {
  return (
    <div className="bg-white border border-admin-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tint}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">{label}</span>
        <span className="text-lg font-bold text-neutral-900">{value}</span>
        {sub && <span className="text-xs text-neutral-500 block">{sub}</span>}
      </div>
    </div>
  );
}

export default function CustomMockExamsOverallReportModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [examRes, regRes, subRes] = await Promise.all([
        supabase.from('custom_mock_exams').select('id, title, slug').order('created_at', { ascending: false }),
        supabase.from('custom_mock_exam_registrations').select('custom_mock_exam_id, user_email'),
        supabase.from('custom_mock_exam_submissions').select('custom_mock_exam_id, user_email, status, score, total_questions'),
      ]);
      if (cancelled) return;
      setExams(examRes.data || []);
      setRegistrations(regRes.data || []);
      // One row per candidate email per exam, preferring the SUBMITTED attempt
      const byKey = {};
      (subRes.data || []).forEach((s) => {
        const key = `${s.custom_mock_exam_id}_${(s.user_email || '').toLowerCase()}`;
        if (!byKey[key] || s.status === 'SUBMITTED') byKey[key] = s;
      });
      setSubmissions(Object.values(byKey));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const report = useMemo(() => {
    const rows = exams.map((exam) => {
      const regs = registrations.filter((r) => r.custom_mock_exam_id === exam.id).length;
      const subs = submissions.filter((s) => s.custom_mock_exam_id === exam.id);
      const attended = subs.filter((s) => s.status === 'SUBMITTED');
      const scores = attended
        .map((s) => ({ score: Number(s.score) || 0, total: Number(s.total_questions) || 0 }))
        .filter((s) => s.total > 0);
      const avgPct = scores.length
        ? Math.round(scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length)
        : 0;
      return {
        id: exam.id,
        title: exam.title || 'Untitled Exam',
        registered: regs,
        attended: attended.length,
        attendancePct: regs ? Math.round((attended.length / regs) * 100) : 0,
        avgPct,
      };
    });
    const totalRegistered = rows.reduce((a, r) => a + r.registered, 0);
    const totalAttended = rows.reduce((a, r) => a + r.attended, 0);
    return {
      rows,
      totalRegistered,
      totalAttended,
      overallAttendance: totalRegistered ? Math.round((totalAttended / totalRegistered) * 100) : 0,
    };
  }, [exams, registrations, submissions]);

  function exportOverallPDF() {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text('Custom Mock Exams — Overall Report', 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Generated on: ${new Date().toLocaleString()} | Exams: ${report.rows.length} | Registered: ${report.totalRegistered} | Attended: ${report.totalAttended} | Attendance: ${report.overallAttendance}%`,
      14,
      22
    );
    autoTable(doc, {
      startY: 28,
      head: [['#', 'Exam Title', 'Registered', 'Attended', 'Attendance %', 'Avg Score %']],
      body: report.rows.map((r, i) => [i + 1, r.title, String(r.registered), String(r.attended), `${r.attendancePct}%`, `${r.avgPct}%`]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });
    doc.save(`custom_exams_overall_report_${Date.now()}.pdf`);
  }

  const chartData = report.rows.slice(0, 12).map((r, i) => ({
    name: r.title.length > 16 ? `${r.title.slice(0, 15)}…` : r.title,
    Registered: r.registered,
    Attended: r.attended,
    fill: BAR_COLORS[i % BAR_COLORS.length],
  }));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-neutral-50 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-admin-200 my-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute -top-3 -right-3 bg-white shadow-lg p-2 rounded-full transition-all cursor-pointer border border-slate-200 z-50 flex items-center justify-center"
        >
          <FiX className="w-5 h-5 text-red-600" />
        </button>
        <div className="p-5 border-b border-admin-200 bg-white rounded-t-2xl flex items-start justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-bold text-neutral-900 text-base">Overall Exams Report</h3>
            <p className="text-sm text-neutral-500 mt-0.5">Registration & attendance across all custom mock exams.</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : report.rows.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-admin-200">
              <FiClipboard className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h4 className="font-semibold text-neutral-800 text-sm">No exams found</h4>
              <p className="text-xs text-neutral-500 mt-1">Create a custom exam to see the overall report.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FiClipboard} label="Total Exams" value={report.rows.length} tint="bg-admin-100 text-admin-600" />
                <StatCard icon={FiUsers} label="Registered" value={report.totalRegistered} tint="bg-admin-100 text-admin-600" />
                <StatCard icon={FiCheckCircle} label="Attended" value={report.totalAttended} sub={`${report.overallAttendance}% attendance`} tint="bg-success-50 text-success-700" />
                <StatCard
                  icon={FiAward}
                  label="Best Attendance"
                  value={report.rows.length ? `${Math.max(...report.rows.map((r) => r.attendancePct))}%` : '—'}
                  sub={report.rows.length ? report.rows.reduce((a, b) => (b.attendancePct > a.attendancePct ? b : a)).title.slice(0, 28) : ''}
                  tint="bg-warning-50 text-warning-700"
                />
              </div>

              <div className="bg-white border border-admin-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-sm font-bold text-neutral-900">Registered vs Attended per Exam</h4>
                <p className="text-xs text-neutral-500 mt-0.5 mb-3">Top 12 exams by creation date</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Registered" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Attended" fill="#16a34a" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl border border-admin-200 shadow-sm overflow-hidden">
                <div className="admin-table-scroll w-full max-w-full overflow-x-auto">
                  <table className="admin-table min-w-[640px] w-full">
                    <thead>
                      <tr className="border-b border-admin-100 bg-brand-blue">
                        <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap text-white">#</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap text-white">Exam Title</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap text-white">Registered</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap text-white">Attended</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap text-white">Attendance %</th>
                        <th className="text-left text-xs font-bold uppercase tracking-wider px-4 py-3.5 whitespace-nowrap text-white">Avg Score %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.rows.map((r, i) => (
                        <tr key={r.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}>
                          <td className="px-4 py-3.5 text-sm text-neutral-700">{i + 1}</td>
                          <td className="px-4 py-3.5 text-sm font-semibold text-neutral-900">{r.title}</td>
                          <td className="px-4 py-3.5 text-sm text-neutral-700">{r.registered}</td>
                          <td className="px-4 py-3.5 text-sm text-neutral-700">{r.attended}</td>
                          <td className="px-4 py-3.5 text-sm text-neutral-700">{r.attendancePct}%</td>
                          <td className="px-4 py-3.5 text-sm text-neutral-700">{r.avgPct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-admin-200 bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={exportOverallPDF}
            disabled={loading || report.rows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-admin-200 text-neutral-700 font-semibold text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4 text-admin-600" />
            Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
