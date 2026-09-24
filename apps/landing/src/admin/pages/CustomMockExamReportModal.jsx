import { useState, useEffect, useMemo } from 'react';
import { FiX, FiUsers, FiCheckCircle, FiClock, FiAward, FiDownload } from 'react-icons/fi';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../../lib/supabaseClient';
import Badge from '../components/Badge';

const PIE_COLORS = ['#16a34a', '#f59e0b', '#94a3b8'];
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

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-admin-200 rounded-xl p-4 shadow-sm">
      <h4 className="text-sm font-bold text-neutral-900">{title}</h4>
      {subtitle && <p className="text-xs text-neutral-500 mt-0.5 mb-3">{subtitle}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default function CustomMockExamReportModal({ exam, onClose }) {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    if (!exam?.id) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (exam.id.startsWith('demo-')) {
        setRegistrations([]);
        setSubmissions([]);
        setLoading(false);
        return;
      }
      const [regRes, subRes] = await Promise.all([
        supabase
          .from('custom_mock_exam_registrations')
          .select('id, user_email, created_at')
          .eq('custom_mock_exam_id', exam.id),
        supabase
          .from('custom_mock_exam_submissions')
          .select('user_email, status, score, total_questions, category_scores, created_at')
          .eq('custom_mock_exam_id', exam.id),
      ]);
      if (cancelled) return;
      setRegistrations(regRes.data || []);
      // One row per candidate email, preferring the SUBMITTED attempt
      const byEmail = {};
      (subRes.data || []).forEach((s) => {
        const key = (s.user_email || '').toLowerCase();
        if (!key) return;
        if (!byEmail[key] || s.status === 'SUBMITTED') byEmail[key] = s;
      });
      setSubmissions(Object.values(byEmail));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [exam?.id]);

  const stats = useMemo(() => {
    const registeredEmails = new Set(registrations.map((r) => (r.user_email || '').toLowerCase()));
    const submitted = submissions.filter((s) => s.status === 'SUBMITTED');
    const inProgress = submissions.filter((s) => s.status !== 'SUBMITTED');
    const submittedEmails = new Set(submitted.map((s) => (s.user_email || '').toLowerCase()));
    const notStarted = [...registeredEmails].filter((e) => !submittedEmails.has(e) && !inProgress.some((s) => (s.user_email || '').toLowerCase() === e));

    const scores = submitted
      .map((s) => ({ score: Number(s.score) || 0, total: Number(s.total_questions) || 0 }))
      .filter((s) => s.total > 0);
    const avgPct = scores.length
      ? scores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / scores.length
      : 0;
    const topScore = scores.length ? Math.max(...scores.map((s) => s.score)) : 0;

    const buckets = ['0–20%', '20–40%', '40–60%', '60–80%', '80–100%'].map((name) => ({ name, students: 0 }));
    scores.forEach((s) => {
      const pct = (s.score / s.total) * 100;
      const idx = Math.min(4, Math.floor(pct / 20));
      buckets[idx].students += 1;
    });

    const catAgg = {};
    submitted.forEach((s) => {
      Object.entries(s.category_scores || {}).forEach(([cat, st]) => {
        if (!catAgg[cat]) catAgg[cat] = { pctSum: 0, n: 0 };
        const total = Number(st.total) || 0;
        if (total > 0) {
          catAgg[cat].pctSum += ((Number(st.correct) || 0) / total) * 100;
          catAgg[cat].n += 1;
        }
      });
    });
    const catData = Object.entries(catAgg).map(([name, v], i) => ({
      name: name.length > 18 ? `${name.slice(0, 17)}…` : name,
      avgPct: v.n ? Math.round(v.pctSum / v.n) : 0,
      fill: BAR_COLORS[i % BAR_COLORS.length],
    }));

    return {
      registered: registrations.length,
      attended: submitted.length,
      inProgress: inProgress.length,
      notStarted: notStarted.length,
      attendancePct: registrations.length ? Math.round((submitted.length / registrations.length) * 100) : 0,
      avgPct: Math.round(avgPct),
      topScore,
      buckets,
      catData,
    };
  }, [registrations, submissions]);

  if (!exam) return null;

  function exportReportPDF() {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text(`Exam Report — ${exam.title || 'Custom Mock Exam'}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['Metric', 'Value']],
      body: [
        ['Registered Students', String(stats.registered)],
        ['Attended (Completed)', String(stats.attended)],
        ['In Progress (Draft)', String(stats.inProgress)],
        ['Not Started', String(stats.notStarted)],
        ['Attendance %', `${stats.attendancePct}%`],
        ['Average Score %', `${stats.avgPct}%`],
        ['Top Score (marks)', String(stats.topScore)],
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Score Range', 'Students']],
      body: stats.buckets.map((b) => [b.name, String(b.students)]),
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    if (stats.catData.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [['Section', 'Avg Accuracy %']],
        body: stats.catData.map((c) => [c.name, String(c.avgPct)]),
        theme: 'grid',
        styles: { fontSize: 9 },
      });
    }

    doc.save(`exam_report_${(exam.slug || exam.id || 'exam').replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`);
  }

  const funnelData = [
    { name: 'Registered', students: stats.registered },
    { name: 'Attended', students: stats.attended },
    { name: 'In Progress', students: stats.inProgress },
  ];
  const pieData = [
    { name: 'Attended', value: stats.attended },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Not Started', value: stats.notStarted },
  ].filter((d) => d.value > 0);

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
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-neutral-900 text-base">Exam Report</h3>
              <Badge variant="default">{exam.category || 'Common'}</Badge>
            </div>
            <p className="text-sm text-neutral-500 mt-0.5">{exam.title}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-admin-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats.registered === 0 && stats.attended === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-admin-200">
              <FiUsers className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <h4 className="font-semibold text-neutral-800 text-sm">No report data yet</h4>
              <p className="text-xs text-neutral-500 mt-1">Registrations and attempts for this exam will appear here.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={FiUsers} label="Registered" value={stats.registered} tint="bg-admin-100 text-admin-600" />
                <StatCard icon={FiCheckCircle} label="Attended" value={stats.attended} sub={`${stats.attendancePct}% attendance`} tint="bg-success-50 text-success-700" />
                <StatCard icon={FiClock} label="In Progress" value={stats.inProgress} sub={`${stats.notStarted} not started`} tint="bg-warning-50 text-warning-700" />
                <StatCard icon={FiAward} label="Avg Score" value={`${stats.avgPct}%`} sub={`Top: ${stats.topScore} marks`} tint="bg-admin-100 text-admin-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Registration vs Attendance" subtitle="Funnel from sign-up to completed attempt">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={funnelData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="students" radius={[6, 6, 0, 0]}>
                        {funnelData.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Attempt Status Split" subtitle="Share of attended, in-progress and not-started candidates">
                  {pieData.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-10">No data to display.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, value }) => `${name}: ${value}`}>
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="Score Distribution" subtitle="Attended candidates grouped by score percentage">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={stats.buckets} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="students" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Section-wise Average" subtitle="Average accuracy per question section (attended only)">
                  {stats.catData.length === 0 ? (
                    <p className="text-xs text-neutral-400 text-center py-10">No section data recorded yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.catData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                        <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Avg accuracy']} />
                        <Bar dataKey="avgPct" radius={[6, 6, 0, 0]}>
                          {stats.catData.map((c, i) => (
                            <Cell key={i} fill={c.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-admin-200 bg-white flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={exportReportPDF}
            disabled={loading || (stats.registered === 0 && stats.attended === 0)}
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
