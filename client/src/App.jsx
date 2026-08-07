import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Subjects from "./components/Subjects";
import DailyPlanner from "./components/DailyPlanner";
import PomodoroTimer from "./components/PomodoroTimer";
import ProgressTracker from "./components/ProgressTracker";
import CalendarView from "./components/CalendarView";
import Toast from "./components/Toast";
import LoginPage from "./components/LoginPage";
import { api } from "./utils/api";

const NAV_ITEMS = [
  { path: "/", icon: "/icons/dashboard.jpg", label: "Dashboard" },
  { path: "/subjects", icon: "/icons/subjects.jpg", label: "Subjects" },
  { path: "/planner", icon: "/icons/planner.jpg", label: "Daily Planner" },
  { path: "/pomodoro", icon: "/icons/pomodoro.jpg", label: "Pomodoro" },
  { path: "/progress", icon: "/icons/progress.jpg", label: "Progress" },
  { path: "/calendar", icon: "/icons/calendar.jpg", label: "Calendar" },
];

const THEMES = [
  { id: "midnight", name: "Midnight Neon", color: "#6366f1" },
  { id: "emerald", name: "Cyber Emerald", color: "#10b981" },
  { id: "sunset", name: "Sunset Crimson", color: "#f43f5e" },
  { id: "amethyst", name: "Deep Amethyst", color: "#8b5cf6" },
  { id: "light", name: "Nordic Light", color: "#f8fafc" },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("studyflow-theme") || "midnight");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studyflow-theme", theme);
  }, [theme]);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // Check auth session on load
  useEffect(() => {
    const token = localStorage.getItem("studyflow-token");
    if (token) {
      api.getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("studyflow-token");
          setUser(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Health check
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.ok && setServerOnline(true))
      .catch(() => setServerOnline(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("studyflow-token");
    setUser(null);
    addToast("Logged out successfully", "info");
  };

  if (authLoading) {
    return (
      <div className="loading-full" style={{ height: "100vh" }}>
        <div className="loading-spinner" style={{ width: 36, height: 36 }} />
        <p>Loading StudyFlow...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={(u) => { setUser(u); addToast(`Welcome back, ${u.name}!`, "success"); }} />;
  }

  return (
    <Router>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/logo.jpg" alt="StudyFlow" className="logo-icon-img" />
            <div>
              <div className="logo-text">StudyFlow</div>
              <div className="logo-sub">Smart Study Planner</div>
            </div>
          </div>

          <div className="user-badge">
            <div className="user-info">
              <div className="user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</div>
              <div>
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <button className="btn-logout" title="Sign Out" onClick={handleLogout}>
              Logout
            </button>
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
                <img src={item.icon} alt={item.label} className="nav-icon-img" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="theme-section">
            <div className="theme-title">Theme Palette</div>
            <div className="theme-options">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  data-t={t.id}
                  title={t.name}
                  className={`theme-btn${theme === t.id ? " active" : ""}`}
                  onClick={() => setTheme(t.id)}
                >
                  <span className="theme-dot" style={{ backgroundColor: t.color }} />
                </button>
              ))}
            </div>
          </div>

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
