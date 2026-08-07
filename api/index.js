const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const DB_URL = process.env.DATABASE_URL || "mysql://5xAHfUVBzFFhDtN.root:Wp1OwifEsl6Q3tNj@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test";
const JWT_SECRET = process.env.JWT_SECRET || "studyflow-jwt-secret-key-2026";

let pool;
function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      uri: DB_URL,
      ssl: { rejectUnauthorized: true },
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// ─── EMAIL SERVICE HELPER ──────────────────────────────────────
async function sendEmail({ to, subject, html, text }) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.log("ℹ️ SMTP credentials not provided in env. Simulation mode for:", to);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"StudyFlow Verification" <onboarding@resend.dev>`,
      to,
      subject,
      text,
      html,
    });
    console.log("✅ Email sent successfully to:", to);
    return true;
  } catch (err) {
    console.error("❌ Nodemailer send error:", err.message);
    return false;
  }
}

// HTML Template: Registration Email Verification OTP
function getRegisterEmailTemplate(name, code) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111118; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: 800;">📖 StudyFlow</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Account Email Verification</p>
        </div>

        <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 12px;">Verify Your Email Address</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>${name || "Student"}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Thank you for joining StudyFlow! Please use the 6-digit verification code below to complete your account setup:</p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 20px rgba(16,185,129,0.4);">${code}</span>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center;">⏱️ This verification code is valid for <strong>15 minutes</strong>.</p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
        <p style="color: #475569; font-size: 11px; text-align: center; margin: 0;">Sent securely by StudyFlow Cloud Authentication.</p>
      </div>
    </div>
  `;
}

// HTML Template: Password Reset OTP
function getResetEmailTemplate(name, code) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111118; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: 800;">📖 StudyFlow</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Password Reset Verification</p>
        </div>

        <h2 style="font-size: 20px; color: #ffffff; margin-bottom: 12px;">Password Reset Code</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>${name || "Student"}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Use the 6-digit verification code below to authorize resetting your password:</p>

        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 20px rgba(99,102,241,0.4);">${code}</span>
        </div>

        <p style="color: #94a3b8; font-size: 12px; text-align: center;">⏱️ This code will expire in <strong>15 minutes</strong>.</p>
      </div>
    </div>
  `;
}

// HTML Template: Login Security Notification
function getLoginEmailTemplate(name, email, time, userAgent) {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0f; color: #f1f5f9; padding: 40px 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #111118; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #6366f1; font-size: 28px; margin: 0; font-weight: 800;">📖 StudyFlow</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security Alert</p>
        </div>
        <h2 style="font-size: 18px; color: #10b981; margin-bottom: 12px;">✅ New Login Detected</h2>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Your StudyFlow account (<code>${email}</code>) was just signed into.</p>
        <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 13px; color: #94a3b8;">
          <div style="margin-bottom: 6px;"><strong style="color: #f1f5f9;">🕒 Timestamp:</strong> ${time}</div>
          <div><strong style="color: #f1f5f9;">💻 Browser/Device:</strong> ${userAgent || "Web Browser"}</div>
        </div>
      </div>
    </div>
  `;
}

// Formatters
function formatUser(row) {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}
function formatSubject(row) {
  return {
    _id: row.id, id: row.id, name: row.name, color: row.color, icon: row.icon,
    goalHours: row.goal_hours, totalStudied: row.total_studied, description: row.description,
    userId: row.user_id, createdAt: row.created_at
  };
}
function formatTask(row) {
  return {
    _id: row.id, id: row.id, title: row.title, subject: row.subject_id, subjectName: row.subject_name,
    date: row.date, startTime: row.start_time, endTime: row.end_time, completed: !!row.completed,
    priority: row.priority, notes: row.notes, userId: row.user_id, createdAt: row.created_at
  };
}
function formatSession(row) {
  return {
    _id: row.id, id: row.id, subject: row.subject_id, subjectName: row.subject_name,
    duration: row.duration, type: row.type, date: row.date, userId: row.user_id, completedAt: row.completed_at
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Authentication required" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = decoded;
    next();
  });
}

// ─── AUTHENTICATION & EMAIL VERIFICATION ENDPOINTS ─────────────

// STEP 1: Request Registration & Send 6-Digit Email OTP Code
app.post("/api/auth/register-request", async (req, res) => {
  try {
    const db = getPool();
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already registered in users
    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "An account with this email already exists. Please Sign In." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Clear old pending registration for this email if any
    await db.query("DELETE FROM pending_registrations WHERE email = ?", [cleanEmail]);

    // Save pending registration
    await db.query(
      "INSERT INTO pending_registrations (name, email, password_hash, otp_code, expires_at) VALUES (?, ?, ?, ?, ?)",
      [name.trim(), cleanEmail, passwordHash, otpCode, expiresAt]
    );

    // 📩 Send 6-Digit Verification Code to User's Email
    await sendEmail({
      to: cleanEmail,
      subject: "📩 Your StudyFlow Account Verification Code",
      text: `Hello ${name}, your StudyFlow verification code is: ${otpCode} (Valid for 15 minutes).`,
      html: getRegisterEmailTemplate(name.trim(), otpCode)
    });

    res.json({ message: "Verification code sent to your email address!" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// STEP 2: Verify 6-Digit Email OTP Code & Create User Account
app.post("/api/auth/register-verify", async (req, res) => {
  try {
    const db = getPool();
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and verification code are required" });
    }

    const cleanEmail = email.toLowerCase().trim();

    const [pending] = await db.query(
      "SELECT * FROM pending_registrations WHERE email = ? AND otp_code = ? AND expires_at > NOW()",
      [cleanEmail, code.trim()]
    );

    if (pending.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const reg = pending[0];

    // Insert user into users table
    await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [reg.name, reg.email, reg.password_hash]
    );

    // Delete pending registration
    await db.query("DELETE FROM pending_registrations WHERE email = ?", [cleanEmail]);

    // Fetch new user
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [cleanEmail]);
    const user = rows[0];

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({ token, user: formatUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// LOGIN USER
app.post("/api/auth/login", async (req, res) => {
  try {
    const db = getPool();
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "30d" });

    // 📩 Send Login Security Notification Email to User
    const loginTime = new Date().toLocaleString();
    const userAgent = req.headers["user-agent"] || "Web Browser";
    sendEmail({
      to: user.email,
      subject: "🔒 Security Alert: New Login to Your StudyFlow Account",
      text: `Hello ${user.name}, a new login was detected on your StudyFlow account at ${loginTime}.`,
      html: getLoginEmailTemplate(user.name, user.email, loginTime, userAgent)
    }).catch(e => console.error("Login email error:", e.message));

    res.json({ token, user: formatUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FORGOT PASSWORD REQUEST (Sends 6-digit OTP code to email)
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const db = getPool();
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const user = rows[0];
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.query(
      "UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?",
      [resetCode, expiresAt, email.toLowerCase().trim()]
    );

    // 📩 Send Password Reset Verification Code strictly via Email
    await sendEmail({
      to: user.email,
      subject: "🔑 Your StudyFlow Password Reset Code",
      text: `Hello ${user.name}, your StudyFlow password verification code is: ${resetCode} (Valid for 15 minutes).`,
      html: getResetEmailTemplate(user.name, resetCode)
    });

    res.json({ message: "Verification code sent to your email address!" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// RESET PASSWORD VERIFY
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const db = getPool();
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code, and new password are required" });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND reset_code = ? AND reset_code_expires > NOW()",
      [email.toLowerCase().trim(), code.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired verification code" });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await db.query(
      "UPDATE users SET password_hash = ?, reset_code = NULL, reset_code_expires = NULL WHERE email = ?",
      [newHash, email.toLowerCase().trim()]
    );

    res.json({ message: "Password updated successfully. You can now login with your new password." });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(formatUser(rows[0]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── SCOPED SUBJECTS ──────────────────────────────────────────
app.get("/api/subjects", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at DESC", [req.user.id]);
    res.json(rows.map(formatSubject));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/subjects", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const { name, color = "#6366f1", icon = "📚", goalHours = 10, description = "" } = req.body;
    await db.query(
      "INSERT INTO subjects (name, color, icon, goal_hours, total_studied, description, user_id) VALUES (?, ?, ?, ?, 0, ?, ?)",
      [name, color, icon, goalHours, description, req.user.id]
    );
    const [rows] = await db.query("SELECT * FROM subjects WHERE name = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1", [name, req.user.id]);
    res.status(201).json(formatSubject(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/subjects/:id", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const { name, color, icon, goalHours, description } = req.body;
    await db.query(
      "UPDATE subjects SET name=?, color=?, icon=?, goal_hours=?, description=? WHERE id=? AND user_id=?",
      [name, color, icon, goalHours, description, req.params.id, req.user.id]
    );
    const [rows] = await db.query("SELECT * FROM subjects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json(formatSubject(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete("/api/subjects/:id", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM subjects WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ message: "Subject deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── SCOPED TASKS ─────────────────────────────────────────────
app.get("/api/tasks/stats/summary", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const today = new Date().toISOString().split("T")[0];
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM tasks WHERE user_id = ?", [req.user.id]);
    const [[{ completed }]] = await db.query("SELECT COUNT(*) as completed FROM tasks WHERE user_id = ? AND completed = TRUE", [req.user.id]);
    const [[{ todayTotal }]] = await db.query("SELECT COUNT(*) as todayTotal FROM tasks WHERE user_id = ? AND date = ?", [req.user.id, today]);
    const [[{ todayCompleted }]] = await db.query("SELECT COUNT(*) as todayCompleted FROM tasks WHERE user_id = ? AND date = ? AND completed = TRUE", [req.user.id, today]);
    res.json({ total, completed, todayTotal, todayCompleted });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    let sql = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [req.user.id];
    if (req.query.date) { sql += " AND date = ?"; params.push(req.query.date); }
    if (req.query.subject) { sql += " AND subject_id = ?"; params.push(req.query.subject); }
    sql += " ORDER BY created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows.map(formatTask));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const { title, subject, subjectName, date, startTime, endTime, priority = "medium", notes = "" } = req.body;
    await db.query(
      "INSERT INTO tasks (title, subject_id, subject_name, date, start_time, end_time, completed, priority, notes, user_id) VALUES (?,?,?,?,?,?,FALSE,?,?)",
      [title, subject || null, subjectName || null, date, startTime || null, endTime || null, priority, notes, req.user.id]
    );
    const [rows] = await db.query("SELECT * FROM tasks WHERE title = ? AND date = ? AND user_id = ? ORDER BY created_at DESC LIMIT 1", [title, date, req.user.id]);
    res.status(201).json(formatTask(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const { title, subject, subjectName, date, startTime, endTime, priority, notes } = req.body;
    await db.query(
      "UPDATE tasks SET title=?, subject_id=?, subject_name=?, date=?, start_time=?, end_time=?, priority=?, notes=? WHERE id=? AND user_id=?",
      [title, subject || null, subjectName || null, date, startTime || null, endTime || null, priority, notes, req.params.id, req.user.id]
    );
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json(formatTask(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch("/api/tasks/:id/toggle", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    await db.query("UPDATE tasks SET completed = NOT completed WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json(formatTask(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM tasks WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ message: "Task deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── SCOPED POMODORO ───────────────────────────────────────────
app.get("/api/pomodoro/stats", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const [sessions] = await db.query("SELECT * FROM pomodoro_sessions WHERE user_id = ? AND type = 'work'", [req.user.id]);
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const byDate = {};
    sessions.forEach(s => { byDate[s.date] = (byDate[s.date] || 0) + s.duration; });
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      last7Days.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
    }
    res.json({ totalSessions, totalMinutes, last7Days });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/pomodoro", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    let sql = "SELECT * FROM pomodoro_sessions WHERE user_id = ?";
    const params = [req.user.id];
    if (req.query.date) { sql += " AND date = ?"; params.push(req.query.date); }
    sql += " ORDER BY completed_at DESC LIMIT 50";
    const [rows] = await db.query(sql, params);
    res.json(rows.map(formatSession));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/pomodoro", authenticateToken, async (req, res) => {
  try {
    const db = getPool();
    const { subject, subjectName, duration = 25, type = "work", date } = req.body;
    await db.query(
      "INSERT INTO pomodoro_sessions (subject_id, subject_name, duration, type, date, user_id) VALUES (?,?,?,?,?,?)",
      [subject || null, subjectName || null, duration, type, date || new Date().toISOString().split("T")[0], req.user.id]
    );
    if (type === "work") {
      const hours = duration / 60;
      if (subject) {
        await db.query("UPDATE subjects SET total_studied = total_studied + ? WHERE id = ? AND user_id = ?", [hours, subject, req.user.id]);
      } else if (subjectName) {
        await db.query("UPDATE subjects SET total_studied = total_studied + ? WHERE name = ? AND user_id = ?", [hours, subjectName, req.user.id]);
      }
    }
    const [rows] = await db.query("SELECT * FROM pomodoro_sessions WHERE user_id = ? ORDER BY completed_at DESC LIMIT 1", [req.user.id]);
    res.status(201).json(formatSession(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ─── HEALTH ────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const db = getPool();
    await db.query("SELECT 1");
    res.json({ status: "ok", db: "mysql-connected", timestamp: new Date().toISOString() });
  } catch (err) {
    res.json({ status: "ok", db: "mysql-error: " + err.message });
  }
});

module.exports = app;
