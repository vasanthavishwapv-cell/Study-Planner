import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Subjects from "./components/Subjects";
import DailyPlanner from "./components/DailyPlanner";
import PomodoroTimer from "./components/PomodoroTimer";
import ProgressTracker from "./components/ProgressTracker";
import CalendarView from "./components/CalendarView";
import PracticeQuiz from "./components/PracticeQuiz";
import SmartNotes from "./components/SmartNotes";
import Toast from "./components/Toast";
import LoginPage from "./components/LoginPage";
import { api } from "./utils/api";

const NAV_ITEMS = [
  { path: "/", icon: "/icons/dashboard.jpg", label: "Dashboard" },
  { path: "/subjects", icon: "/icons/subjects.jpg", label: "Subjects" },
  { path: "/planner", icon: "/icons/planner.jpg", label: "Daily Planner" },
  { path: "/pomodoro", icon: "/icons/pomodoro.jpg", label: "Pomodoro" },
  { path: "/quiz", icon: "/icons/quiz.jpg", label: "Practice Quiz" },
  { path: "/notes", icon: "/icons/notes.jpg", label: "Smart Notes" },
  { path: "/progress", icon: "/icons/progress.jpg", label: "Progress" },
  { path: "/calendar", icon: "/icons/calendar.jpg", label: "Calendar" },
];

function HeaderAndThemeController({ theme, toggleTheme }) {
  const location = useLocation();
  const [isShrunk, setIsShrunk] = useState(false);

  // Get active path title
  const activeItem = NAV_ITEMS.find(item => item.end ? location.pathname === item.path : location.pathname.startsWith(item.path));
  const activeTitle = activeItem ? activeItem.label : "StudyFlow";

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop;
      const mainContent = document.querySelector(".main-content");
      const mainScrollPos = mainContent ? mainContent.scrollTop : 0;
      
      if (scrollPos > 40 || mainScrollPos > 40) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (mainContent) {
        mainContent.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <header className={`glass-header ${isShrunk ? "shrunk" : ""}`}>
      <div className="header-brand">
        <h2 className="header-title">{activeTitle}</h2>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="text-xs text-[var(--text-secondary)] font-semibold select-none">
          {theme === "light" ? "Light Mode" : "Dark Mode"}
        </span>
        <div 
          className="theme-toggle-slider" 
          onClick={toggleTheme}
          title="Toggle system theme"
        >
          <div className="theme-toggle-thumb">
            {theme === "light" ? "☀️" : "🌙"}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(null);
  const [toasts, setToasts] = useState([]);
  
  // Strict binary light/dark theme initialization
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("studyflow-theme");
    if (saved && (saved === "light" || saved === "dark")) return saved;
    // respect prefers-color-scheme
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return systemPrefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("studyflow-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

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
          <HeaderAndThemeController theme={theme} toggleTheme={toggleTheme} />
          
          <Routes>
            <Route path="/" element={<Dashboard addToast={addToast} />} />
            <Route path="/subjects" element={<Subjects addToast={addToast} />} />
            <Route path="/planner" element={<DailyPlanner addToast={addToast} />} />
            <Route path="/pomodoro" element={<PomodoroTimer addToast={addToast} />} />
            <Route path="/quiz" element={<PracticeQuiz addToast={addToast} />} />
            <Route path="/notes" element={<SmartNotes addToast={addToast} />} />
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