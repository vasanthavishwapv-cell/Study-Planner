import { useState, useEffect } from "react";
import { api } from "../utils/api";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
];

export default function Dashboard({ addToast }) {
  const [stats, setStats] = useState({ total: 0, completed: 0, todayTotal: 0, todayCompleted: 0 });
  const [subjects, setSubjects] = useState([]);
  const [pomodoroStats, setPomodoroStats] = useState({ totalSessions: 0, totalMinutes: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  useEffect(() => {
    async function load() {
      try {
        const [taskStats, subs, pomStats, tasks] = await Promise.all([
          api.getTaskStats(),
          api.getSubjects(),
          api.getPomodoroStats(),
          api.getTasks(),
        ]);
        setStats(taskStats);
        setSubjects(subs.slice(0, 4));
        setPomodoroStats(pomStats);
        const today = new Date().toISOString().split("T")[0];
        setRecentTasks(tasks.filter((t) => t.date === today).slice(0, 5));
      } catch (e) {
        addToast("Could not load dashboard data. Is the server running?", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const todayRate = stats.todayTotal > 0 ? Math.round((stats.todayCompleted / stats.todayTotal) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Good {getGreeting()} 👋</h1>
        <p className="page-subtitle">Here&apos;s your study overview for today</p>
      </div>

      {/* Quote */}
      <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07))", borderColor: "rgba(99,102,241,0.2)" }}>
        <div style={{ fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic" }}>
          &quot;{quote.text}&quot;
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>— {quote.author}</div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)" }}>📋</div>
          <div className="stat-info">
            <div className="stat-value">{stats.todayTotal}</div>
            <div className="stat-label">Today&apos;s Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)" }}>✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.todayCompleted}</div>
            <div className="stat-label">Completed Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)" }}>🍅</div>
          <div className="stat-info">
            <div className="stat-value">{pomodoroStats.totalSessions}</div>
            <div className="stat-label">Pomodoro Sessions</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(6,182,212,0.15)" }}>⏱️</div>
          <div className="stat-info">
            <div className="stat-value">{Math.round(pomodoroStats.totalMinutes / 60 * 10) / 10}h</div>
            <div className="stat-label">Total Study Time</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Today Progress */}
        <div className="card">
          <div className="section-title">📊 Today&apos;s Progress</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "var(--text-secondary)" }}>
              <span>Tasks Completed</span>
              <span style={{ fontWeight: 700 }}>{stats.todayCompleted}/{stats.todayTotal}</span>
            </div>
            <div className="progress-bar-container" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${todayRate}%`, background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))" }} />
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{todayRate}%</div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 14, color: "var(--text-secondary)" }}>
              <span>Overall Completion</span>
              <span style={{ fontWeight: 700 }}>{stats.completed}/{stats.total}</span>
            </div>
            <div className="progress-bar-container" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${completionRate}%`, background: "linear-gradient(90deg, var(--accent-emerald), var(--accent-cyan))" }} />
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{completionRate}%</div>
          </div>
        </div>

        {/* Today's Tasks */}
        <div className="card">
          <div className="section-title">📅 Today&apos;s Tasks</div>
          {recentTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 14, color: "var(--text-muted)" }}>No tasks scheduled for today</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTasks.map((task) => (
                <div key={task._id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 16 }}>{task.completed ? "✅" : "⭕"}</div>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: task.completed ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.completed ? "line-through" : "none" }}>
                    {task.title}
                  </div>
                  <div className={`priority-dot priority-${task.priority}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Subjects */}
      {subjects.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="section-title">📚 Your Subjects</div>
          <div className="subjects-grid">
            {subjects.map((sub) => (
              <div key={sub._id} className="subject-card" style={{ "--subject-color": sub.color }}>
                <div className="subject-card-header">
                  <div className="subject-icon" style={{ background: `${sub.color}20` }}>{sub.icon}</div>
                </div>
                <div className="subject-name">{sub.name}</div>
                <div className="subject-progress-label">
                  <span>Progress</span>
                  <span>{Math.round(sub.totalStudied)}h / {sub.goalHours}h</span>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, sub.goalHours > 0 ? (sub.totalStudied / sub.goalHours) * 100 : 0)}%`, background: sub.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}
