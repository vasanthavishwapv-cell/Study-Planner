import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { api } from "../utils/api";

const COLORS = ["#6366f1", "#10b981", "#06b6d4", "#f59e0b", "#ec4899", "#a855f7"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>{p.value}{p.unit || ""}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressTracker({ addToast }) {
  const [pomStats, setPomStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ps, ts, subs] = await Promise.all([
          api.getPomodoroStats(),
          api.getTaskStats(),
          api.getSubjects(),
        ]);
        setPomStats(ps);
        setTaskStats(ts);
        setSubjects(subs);
      } catch {
        addToast("Failed to load progress data", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading-full"><div className="loading-spinner" /><span>Loading progress...</span></div>;

  const pomChartData = pomStats?.last7Days?.map((d) => ({
    date: d.date.slice(5),
    minutes: d.minutes,
    hours: Math.round((d.minutes / 60) * 10) / 10,
  })) || [];

  const subjectPieData = subjects
    .filter((s) => s.totalStudied > 0)
    .map((s) => ({ name: s.name, value: Math.round(s.totalStudied * 10) / 10, icon: s.icon }));

  const subjectBarData = subjects.map((s) => ({
    name: s.name,
    studied: Math.round(s.totalStudied * 10) / 10,
    goal: s.goalHours,
    pct: s.goalHours > 0 ? Math.min(100, Math.round((s.totalStudied / s.goalHours) * 100)) : 0,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Progress Tracker</h1>
        <p className="page-subtitle">Visualize your study habits and achievements</p>
      </div>

      {/* Top Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)" }}>🍅</div>
          <div className="stat-info">
            <div className="stat-value">{pomStats?.totalSessions || 0}</div>
            <div className="stat-label">Total Pomodoros</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6,182,212,0.15)" }}>⏱️</div>
          <div className="stat-info">
            <div className="stat-value">{Math.round((pomStats?.totalMinutes || 0) / 60 * 10) / 10}h</div>
            <div className="stat-label">Total Study Time</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)" }}>✅</div>
          <div className="stat-info">
            <div className="stat-value">{taskStats?.completed || 0}</div>
            <div className="stat-label">Tasks Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)" }}>📚</div>
          <div className="stat-info">
            <div className="stat-value">{subjects.length}</div>
            <div className="stat-label">Subjects</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ gap: 20, marginBottom: 20 }}>
        {/* Focus Minutes Chart */}
        <div className="card">
          <div className="section-title">📈 Focus Minutes – Last 7 Days</div>
          {pomChartData.every((d) => d.minutes === 0) ? (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🍅</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No pomodoro data yet</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pomChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="minutes" fill="#6366f1" radius={[6, 6, 0, 0]} unit="m" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subject Distribution Pie */}
        <div className="card">
          <div className="section-title">🥧 Subject Distribution</div>
          {subjectPieData.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No study data yet</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={subjectPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {subjectPieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}h`, "Studied"]} contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
                <Legend formatter={(value) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Subject Progress Bars */}
      {subjects.length > 0 && (
        <div className="card">
          <div className="section-title">🎯 Subject Goals Progress</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {subjectBarData.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{subjects[i]?.icon} {s.name}</span>
                  <span style={{ color: "var(--text-secondary)" }}>{s.studied}h / {s.goal}h ({s.pct}%)</span>
                </div>
                <div className="progress-bar-container" style={{ height: 8 }}>
                  <div className="progress-bar-fill" style={{
                    width: `${s.pct}%`,
                    background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Time Bar Chart by Subject */}
      {subjectBarData.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-title">📊 Hours Studied by Subject</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjectBarData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="studied" name="Studied" radius={[6, 6, 0, 0]} unit="h">
                {subjectBarData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="goal" name="Goal" fill="rgba(255,255,255,0.06)" radius={[6, 6, 0, 0]} unit="h" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
