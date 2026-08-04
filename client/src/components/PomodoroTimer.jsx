import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { api } from "../utils/api";

const MODES = [
  { key: "work", label: "Focus", duration: 25, color: "#6366f1" },
  { key: "short-break", label: "Short Break", duration: 5, color: "#10b981" },
  { key: "long-break", label: "Long Break", duration: 15, color: "#06b6d4" },
];

export default function PomodoroTimer({ addToast }) {
  const [modeIdx, setModeIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [history, setHistory] = useState([]);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);

  const mode = MODES[modeIdx];
  const totalSeconds = mode.duration * 60;
  const progress = (timeLeft / totalSeconds);
  const circumference = 2 * Math.PI * 112;
  const dashOffset = circumference * progress;

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => {});
    api.getSessions().then((s) => setHistory(s.slice(0, 10))).catch(() => {});
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handleComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1108, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  };

  const handleComplete = async () => {
    playChime();
    if (mode.key === "work") {
      setCompletedCount((c) => c + 1);
      const session = {
        subjectName: subjects.find((s) => s._id === selectedSubject)?.name || "General",
        subject: selectedSubject || undefined,
        duration: mode.duration,
        type: "work",
        date: format(new Date(), "yyyy-MM-dd"),
      };
      try {
        await api.saveSession(session);
        addToast("🍅 Pomodoro complete! Great work!", "success");
        const h = await api.getSessions();
        setHistory(h.slice(0, 10));
      } catch {}
    } else {
      addToast("Break over! Back to focus 💪", "info");
    }
  };

  const switchMode = (idx) => {
    setModeIdx(idx);
    setTimeLeft(MODES[idx].duration * 60);
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const reset = () => {
    setTimeLeft(mode.duration * 60);
    setRunning(false);
    clearInterval(intervalRef.current);
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  const sessionDots = Array.from({ length: 4 }, (_, i) => (
    <div key={i} className={`session-dot${i < completedCount % 4 ? " completed" : i === completedCount % 4 && running ? " active" : ""}`} />
  ));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pomodoro Timer 🍅</h1>
        <p className="page-subtitle">Stay focused with timed study sessions</p>
      </div>

      <div className="pomodoro-container">
        {/* Mode Tabs */}
        <div className="pomodoro-tabs">
          {MODES.map((m, i) => (
            <button key={m.key} className={`pomodoro-tab${modeIdx === i ? " active" : ""}`}
              onClick={() => switchMode(i)} style={modeIdx === i ? { background: `linear-gradient(135deg, ${m.color}, ${m.color}cc)` } : {}}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Session Dots */}
        <div className="pomodoro-sessions">{sessionDots}</div>

        {/* Timer Ring */}
        <div className="timer-display">
          <div className="timer-ring">
            <svg viewBox="0 0 240 240">
              <circle className="ring-bg" cx="120" cy="120" r="112" />
              <circle
                className="ring-progress"
                cx="120" cy="120" r="112"
                stroke={mode.color}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ filter: `drop-shadow(0 0 8px ${mode.color}88)` }}
              />
            </svg>
            <div className="timer-time-display">
              <div className="timer-digits" style={{ color: mode.color }}>{mins}:{secs}</div>
              <div className="timer-phase">{mode.label}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="timer-controls">
            <button className="timer-btn-secondary" onClick={reset}>↺</button>
            <button className="timer-btn-main" onClick={() => setRunning((r) => !r)}
              style={{ background: `linear-gradient(135deg, ${mode.color}, ${mode.color}aa)`, boxShadow: `0 4px 20px ${mode.color}66` }}>
              {running ? "⏸" : "▶"}
            </button>
            <button className="timer-btn-secondary" onClick={() => switchMode((modeIdx + 1) % MODES.length)}>⏭</button>
          </div>

          {/* Subject Selector */}
          <div className="pomodoro-subject-select">
            <label className="form-label" style={{ display: "block", marginBottom: 8 }}>📚 Studying Subject</label>
            <select className="form-select" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="">General / No Subject</option>
              {subjects.map((s) => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", fontSize: 20, width: 40, height: 40 }}>🍅</div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 22 }}>{completedCount}</div>
                <div className="stat-label">This Session</div>
              </div>
            </div>
            <div className="stat-card" style={{ flex: 1 }}>
              <div className="stat-icon" style={{ background: "rgba(16,185,129,0.15)", fontSize: 20, width: 40, height: 40 }}>⏱️</div>
              <div className="stat-info">
                <div className="stat-value" style={{ fontSize: 22 }}>{completedCount * 25}m</div>
                <div className="stat-label">Focus Time</div>
              </div>
            </div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="pomodoro-history">
            <div className="section-title">📜 Recent Sessions</div>
            <div className="history-list">
              {history.map((h) => (
                <div key={h._id} className="history-item">
                  <span>{h.type === "work" ? "🍅" : h.type === "short-break" ? "☕" : "🛋️"}</span>
                  <span style={{ flex: 1 }}>{h.subjectName}</span>
                  <span style={{ color: "var(--text-muted)" }}>{h.duration}m</span>
                  <span style={{ color: "var(--text-muted)", marginLeft: 12 }}>{h.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
