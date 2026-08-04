import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Subjects from "./components/Subjects";
import DailyPlanner from "./components/DailyPlanner";
import PomodoroTimer from "./components/PomodoroTimer";
import ProgressTracker from "./components/ProgressTracker";
import CalendarView from "./components/CalendarView";
import Toast from "./components/Toast";

const NAV_ITEMS = [
  { path: "/", icon: "🏠", label: "Dashboard" },
  { path: "/subjects", icon: "📚", label: "Subjects" },
  { path: "/planner", icon: "📋", label: "Daily Planner" },
  { path: "/pomodoro", icon: "🍅", label: "Pomodoro" },
  { path: "/progress", icon: "📊", label: "Progress" },
  { path: "/calendar", icon: "📅", label: "Calendar" },
];

export default function App() {
  const [serverOnline, setServerOnline] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // Check server on mount
  useState(() => {
    fetch("/api/health")
      .then((r) => r.ok && setServerOnline(true))
      .catch(() => setServerOnline(false));
  });

  return (
    <Router>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">📖</div>
            <div>
              <div className="logo-text">StudyFlow</div>
              <div className="logo-sub">Smart Study Planner</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="nav-label">Navigation</div>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="server-status">
              <div className={`status-dot ${serverOnline ? "online" : "offline"}`} />
              <span>
                {serverOnline === null ? "Connecting..." : serverOnline ? "Server Connected" : "Server Offline"}
              </span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard addToast={addToast} />} />
            <Route path="/subjects" element={<Subjects addToast={addToast} />} />
            <Route path="/planner" element={<DailyPlanner addToast={addToast} />} />
            <Route path="/pomodoro" element={<PomodoroTimer addToast={addToast} />} />
            <Route path="/progress" element={<ProgressTracker addToast={addToast} />} />
            <Route path="/calendar" element={<CalendarView addToast={addToast} />} />
          </Routes>
        </main>

        <div className="toast-container">
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} />
          ))}
        </div>
      </div>
    </Router>
  );
}
