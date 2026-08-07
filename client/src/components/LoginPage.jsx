import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [registerStep, setRegisterStep] = useState(1); // 1: form, 2: verify OTP
  const [forgotStep, setForgotStep] = useState(1);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [registerCode, setRegisterCode] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [greeting, setGreeting] = useState("");
  const [activeFeature, setActiveFeature] = useState(0);

  const FEATURES = [
    {
      icon: "🎯",
      title: "Smart Goal Tracking",
      desc: "Set study hours per subject and track your daily & weekly progression with interactive charts.",
      badge: "Analytics 2.0"
    },
    {
      icon: "⏱️",
      title: "Pomodoro Focus Timer",
      desc: "Boost your productivity with custom study sprints, break intervals, and automatic time logging.",
      badge: "Deep Work"
    },
    {
      icon: "☁️",
      title: "100% Cloud MySQL Persistence",
      desc: "Your tasks, subjects, and study metrics are instantly saved & synced across all your devices.",
      badge: "TiDB Cloud"
    }
  ];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning ☀️");
    else if (hour < 18) setGreeting("Good Afternoon 🌤️");
    else setGreeting("Good Evening 🌙");

    const timer = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % FEATURES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "#475569" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, label: "Weak", color: "#f43f5e" };
    if (score <= 4) return { score: 66, label: "Medium", color: "#f59e0b" };
    return { score: 100, label: "Strong & Secure 🔒", color: "#10b981" };
  };

  const strength = getPasswordStrength(password);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("studyflow-token", data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterRequest = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.registerRequest({ name, email, password });
      setMessage("📩 Verification code sent! Check your email inbox.");
      setRegisterStep(2);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.registerVerify({ email, code: registerCode });
      localStorage.setItem("studyflow-token", data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setMessage("📩 Password reset verification code sent! Check your email inbox.");
      setForgotStep(2);
    } catch (err) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.resetPassword({ email, code, newPassword });
      setMessage(res.message || "Password reset successful! Please sign in.");
      setMode("login");
      setForgotStep(1);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("demo@studyflow.app");
    setPassword("DemoUser123!");
  };

  return (
    <div className="innovative-auth-container">
      <div className="auth-ambient-glow glow-1" />
      <div className="auth-ambient-glow glow-2" />

      <div className="auth-split-wrapper">
        {/* LEFT PANEL: Showcase Hero */}
        <div className="auth-hero-panel">
          <div className="hero-top">
            <div className="hero-brand">
              <span className="brand-logo">📖</span>
              <span className="brand-name">StudyFlow</span>
            </div>
            <span className="hero-badge">AI Powered & MySQL Synced</span>
          </div>

          <div className="hero-center">
            <h2 className="hero-title">
              Level Up Your <br />
              <span className="gradient-text">Study Productivity</span>
            </h2>
            <p className="hero-description">
              Manage your subjects, set weekly target hours, run Pomodoro deep-work sprints, and track your performance metrics in real time.
            </p>

            <div className="feature-carousel-card">
              <div className="carousel-badge">{FEATURES[activeFeature].badge}</div>
              <div className="carousel-icon">{FEATURES[activeFeature].icon}</div>
              <h4 className="carousel-title">{FEATURES[activeFeature].title}</h4>
              <p className="carousel-desc">{FEATURES[activeFeature].desc}</p>
              <div className="carousel-dots">
                {FEATURES.map((_, idx) => (
                  <button
                    key={idx}
                    className={`dot${activeFeature === idx ? " active" : ""}`}
                    onClick={() => setActiveFeature(idx)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="hero-footer-stats">
            <div className="stat-pill">
              <span className="stat-num">99.9%</span>
              <span className="stat-label">Cloud Uptime</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">🔒 Email Verified</span>
              <span className="stat-label">Secure Auth</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">⚡ Instant</span>
              <span className="stat-label">TiDB Sync</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Auth Card */}
        <div className="auth-card-panel">
          <div className="innovative-card">
            <div className="card-header">
              <div className="greeting-tag">{greeting}</div>
              <h3 className="card-title">
                {mode === "login" && "Welcome Back!"}
                {mode === "register" && (registerStep === 1 ? "Create Your Account" : "Verify Your Email")}
                {mode === "forgot" && "Recover Your Access"}
              </h3>
              <p className="card-sub">
                {mode === "login" && "Sign in to access your study planner & progress dashboard"}
                {mode === "register" && (registerStep === 1 ? "Join thousands of students mastering their academic goals" : "We sent a 6-digit verification code to " + email)}
                {mode === "forgot" && "Enter your email to receive a password verification code"}
              </p>
            </div>

            {mode !== "forgot" && (
              <div className="innovative-tabs">
                <button
                  className={`tab-btn${mode === "login" ? " active" : ""}`}
                  onClick={() => { setMode("login"); setError(""); setMessage(""); setRegisterStep(1); }}
                >
                  Sign In
                </button>
                <button
                  className={`tab-btn${mode === "register" ? " active" : ""}`}
                  onClick={() => { setMode("register"); setError(""); setMessage(""); setRegisterStep(1); }}
                >
                  Register
                </button>
                <div className={`tab-slider mode-${mode}`} />
              </div>
            )}

            {error && <div className="innovative-alert error">⚠️ {error}</div>}
            {message && <div className="innovative-alert success">✨ {message}</div>}

            {/* LOGIN FORM */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="innovative-form">
                <div className="field-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input
                      type="email"
                      required
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field-group">
                  <div className="field-label-row">
                    <label>Password</label>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => { setMode("forgot"); setError(""); setMessage(""); setForgotStep(1); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "👁️" : "🙈"}
                    </button>
                  </div>
                </div>

                <button type="submit" className="innovative-submit-btn" disabled={loading}>
                  {loading ? <span className="loading-spinner" /> : "Sign In to Dashboard 🚀"}
                </button>

                <div className="demo-helper">
                  <span>Need a quick test?</span>
                  <button type="button" className="demo-link" onClick={fillDemoCredentials}>
                    Fill Demo Credentials
                  </button>
                </div>
              </form>
            )}

            {/* REGISTER FORM WITH 2-STEP EMAIL VERIFICATION */}
            {mode === "register" && (
              registerStep === 1 ? (
                <form onSubmit={handleRegisterRequest} className="innovative-form">
                  <div className="field-group">
                    <label>Full Name</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        required
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✉️</span>
                      <input
                        type="email"
                        required
                        placeholder="alex@university.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔑</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="eye-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "👁️" : "🙈"}
                      </button>
                    </div>

                    {password && (
                      <div className="strength-meter">
                        <div className="strength-bar-bg">
                          <div
                            className="strength-bar-fill"
                            style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                          />
                        </div>
                        <span className="strength-text" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="innovative-submit-btn" disabled={loading}>
                    {loading ? <span className="loading-spinner" /> : "Send Email Verification Code 📩"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterVerify} className="innovative-form">
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => setRegisterStep(1)}
                  >
                    ← Edit Account Details
                  </button>

                  <div className="field-group">
                    <label>6-Digit Email Verification Code</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔢</span>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g. 948201"
                        value={registerCode}
                        onChange={(e) => setRegisterCode(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="innovative-submit-btn" disabled={loading}>
                    {loading ? <span className="loading-spinner" /> : "Verify Code & Create Account ✨"}
                  </button>
                </form>
              )
            )}

            {/* FORGOT PASSWORD FORM */}
            {mode === "forgot" && (
              <div className="innovative-form">
                <button
                  type="button"
                  className="back-btn"
                  onClick={() => { setMode("login"); setError(""); setMessage(""); setForgotStep(1); }}
                >
                  ← Return to Sign In
                </button>

                {forgotStep === 1 ? (
                  <form onSubmit={handleRequestCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="field-group">
                      <label>Registered Email Address</label>
                      <div className="input-wrapper">
                        <span className="input-icon">✉️</span>
                        <input
                          type="email"
                          required
                          placeholder="student@university.edu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="innovative-submit-btn" disabled={loading}>
                      {loading ? <span className="loading-spinner" /> : "Send Password Reset Code 📩"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="field-group">
                      <label>6-Digit Verification Code</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🔢</span>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 849201"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="field-group">
                      <label>New Password</label>
                      <div className="input-wrapper">
                        <span className="input-icon">🔒</span>
                        <input
                          type="password"
                          required
                          minLength={6}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>

                    <button type="submit" className="innovative-submit-btn" disabled={loading}>
                      {loading ? <span className="loading-spinner" /> : "Reset & Update Password 🔑"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
