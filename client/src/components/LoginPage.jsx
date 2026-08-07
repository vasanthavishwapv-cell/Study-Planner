import { useState } from "react";
import { api } from "../utils/api";

export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: reset pass

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.register({ name, email, password });
      localStorage.setItem("studyflow-token", data.token);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || "Registration failed");
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
      setMessage(res.message);
      if (res.devCode) {
        setCode(res.devCode);
        setMessage(`Verification code: ${res.devCode}`);
      }
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
      setMessage(res.message || "Password reset successful! Please log in.");
      setMode("login");
      setForgotStep(1);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">📖</div>
          <h1 className="auth-title">StudyFlow</h1>
          <p className="auth-subtitle">Smart Study Planner & Tracking</p>
        </div>

        {mode !== "forgot" && (
          <div className="auth-tabs">
            <button
              className={`auth-tab${mode === "login" ? " active" : ""}`}
              onClick={() => { setMode("login"); setError(""); setMessage(""); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab${mode === "register" ? " active" : ""}`}
              onClick={() => { setMode("register"); setError(""); setMessage(""); }}
            >
              Create Account
            </button>
          </div>
        )}

        {error && <div className="auth-alert error">{error}</div>}
        {message && <div className="auth-alert success">{message}</div>}

        {/* LOGIN FORM */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <div className="form-label-row">
                <label>Password</label>
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => { setMode("forgot"); setError(""); setMessage(""); setForgotStep(1); }}
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : "Sign In to StudyFlow"}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                required
                placeholder="alex@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : "Create Free Account"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === "forgot" && (
          <div className="auth-form">
            <div className="forgot-header">
              <button
                className="btn-back"
                onClick={() => { setMode("login"); setError(""); setMessage(""); setForgotStep(1); }}
              >
                ← Back to Login
              </button>
              <h3>Reset Your Password</h3>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestCode}>
                <div className="form-group">
                  <label>Enter your registered email address</label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                  {loading ? <span className="loading-spinner" /> : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 849201"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                  {loading ? <span className="loading-spinner" /> : "Reset & Save Password"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
