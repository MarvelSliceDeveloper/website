import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabaseClient";
import PageShell from "../components/ui/PageShell";
import {
  FiLoader,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiActivity,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#2551d9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const chartOptions = [
  { key: "bar", icon: FiBarChart2, label: "Bar" },
  { key: "line", icon: FiTrendingUp, label: "Line" },
  { key: "pie", icon: FiPieChart, label: "Pie" },
  { key: "area", icon: FiActivity, label: "Area" },
  { key: "radar", icon: FiBarChart2, label: "Radar" },
];

const tables = [
  { key: "brochure_downloads", label: "Brochure" },
  { key: "form_submissions", label: "Form" },
  { key: "contact_submissions", label: "Contact" },
  { key: "career_submissions", label: "Career" },
  { key: "conversations", label: "Chat" },
];

const rangeOptions = [
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "total", label: "Total" },
];

export default function CourseReports() {
  const [loading, setLoading] = useState(true);
  const [dataByRange, setDataByRange] = useState({
    today: {},
    week: {},
    month: {},
    total: {},
  });
  const [selectedRange, setSelectedRange] = useState("total");
  const [chartType, setChartType] = useState("bar");

  useEffect(() => {
    async function load() {
      const tableNames = tables.map((t) => t.key);
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      ).toISOString();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1),
      ).toISOString();
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();

      const rangeCounts = { today: {}, week: {}, month: {}, total: {} };
      for (const table of tableNames) {
        const [{ count }] = await Promise.all([
          supabase.from(table).select("*", { count: "exact", head: true }),
        ]);
        rangeCounts.total[table] = count || 0;

        const { data } = await supabase
          .from(table)
          .select("created_at")
          .order("created_at", { ascending: true });
        let todayC = 0,
          weekC = 0,
          monthC = 0;
        if (data) {
          data.forEach((r) => {
            const ts = r.created_at;
            if (ts >= startOfToday) todayC++;
            if (ts >= startOfWeek) weekC++;
            if (ts >= startOfMonth) monthC++;
          });
        }
        rangeCounts.today[table] = todayC;
        rangeCounts.week[table] = weekC;
        rangeCounts.month[table] = monthC;
      }
      setDataByRange(rangeCounts);
      setLoading(false);
    }
    load();
  }, []);

  const rangeData = useMemo(() => {
    const counts = dataByRange[selectedRange] || {};
    return {
      byType: tables.map((t) => ({ name: t.label, value: counts[t.key] || 0 })),
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  }, [dataByRange, selectedRange]);

  const chartData = rangeData.byType;

  function renderChart(data) {
    const tickAngle = data.length > 6 ? -35 : 0;

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={130}
              dataKey="value"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "radar") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
            <PolarRadiusAxis />
            <Radar
              dataKey="value"
              stroke="#2551d9"
              fill="#2551d9"
              fillOpacity={0.3}
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ bottom: tickAngle ? 60 : 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                angle: tickAngle,
                textAnchor: tickAngle ? "end" : "middle",
              }}
              height={tickAngle ? 60 : 30}
              interval={0}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2551d9"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ bottom: tickAngle ? 60 : 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                angle: tickAngle,
                textAnchor: tickAngle ? "end" : "middle",
              }}
              height={tickAngle ? 60 : 30}
              interval={0}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2551d9"
              fill="#2551d9"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ bottom: tickAngle ? 60 : 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{
              fontSize: 11,
              angle: tickAngle,
              textAnchor: tickAngle ? "end" : "middle",
            }}
            height={tickAngle ? 60 : 30}
            interval={0}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#2551d9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  const availableChartOptions = useMemo(() => {
    return chartOptions.filter((o) => {
      if (chartData.length > 8 && (o.key === "pie" || o.key === "radar"))
        return false;
      return true;
    });
  }, [chartData.length]);

  useEffect(() => {
    const isAvailable = availableChartOptions.some((o) => o.key === chartType);
    if (!isAvailable && availableChartOptions.length > 0) {
      setChartType(availableChartOptions[0].key);
    }
  }, [availableChartOptions, chartType]);

  const rangeLabel =
    rangeOptions.find((r) => r.key === selectedRange)?.label || "";

  if (loading)
    return (
      <PageShell
        backTo="/admin"
        title="Reports"
        subtitle="Submission statistics and analytics"
      >
        <div className="flex items-center justify-center py-20">
          <FiLoader className="w-8 h-8 animate-spin text-admin-400" />
        </div>
      </PageShell>
    );

  return (
    <PageShell
      backTo="/admin"
      title="Reports"
      subtitle="Submission statistics and analytics"
    >
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Time Range
          </label>
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="h-8 px-2.5 text-sm border border-gray-200 rounded-lg bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            {rangeOptions.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {rangeLabel} Total
            </p>
            <p className="text-2xl font-bold mt-1 text-blue-600">
              {rangeData.total}
            </p>
          </div>
          {rangeData.byType.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {t.name}
              </p>
              <p className="text-2xl font-bold mt-1 text-neutral-700">
                {t.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-sm font-semibold text-black">
              {rangeLabel} Submissions
            </h2>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-1">
              {availableChartOptions.map((o) => (
                <button
                  key={o.key}
                  onClick={() => setChartType(o.key)}
                  className={`p-2 rounded-md transition-colors cursor-pointer ${chartType === o.key ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                  title={o.label}
                >
                  <o.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-6">
            {chartData.length > 0 ? (
              renderChart(chartData)
            ) : (
              <p className="text-sm text-neutral-400 text-center py-10">
                No data available
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-black">
              Submissions Overview
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 font-semibold text-neutral-600">
                    Type
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-neutral-600">
                    Count
                  </th>
                  <th className="text-right px-5 py-3 font-semibold text-neutral-600">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody>
                {rangeData.byType.map((s, i) => {
                  const total = rangeData.total;
                  return (
                    <tr
                      key={s.name}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[i] }}
                        />
                        <span className="font-medium text-black">{s.name}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {s.value}
                      </td>
                      <td className="px-5 py-3 text-right text-neutral-500">
                        {total > 0
                          ? `${((s.value / total) * 100).toFixed(1)}%`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td className="px-5 py-3 font-semibold text-black">Total</td>
                  <td className="px-5 py-3 text-right font-semibold text-black">
                    {rangeData.total}
                  </td>
                  <td className="px-5 py-3 text-right text-neutral-500">
                    100%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
