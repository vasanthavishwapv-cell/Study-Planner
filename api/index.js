const mysql = require("mysql2/promise");

const DB_URL = process.env.DATABASE_URL || "mysql://5xAHfUVBzFFhDtN.root:Wp1OwifEsl6Q3tNj@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/test";

// Connection pool for serverless (reused across warm invocations)
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

const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Helper to format row for frontend (snake_case -> camelCase + _id alias)
function formatSubject(row) {
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    goalHours: row.goal_hours,
    totalStudied: row.total_studied,
    description: row.description,
    createdAt: row.created_at,
  };
}
function formatTask(row) {
  return {
    _id: row.id,
    id: row.id,
    title: row.title,
    subject: row.subject_id,
    subjectName: row.subject_name,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    completed: !!row.completed,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.created_at,
  };
}
function formatSession(row) {
  return {
    _id: row.id,
    id: row.id,
    subject: row.subject_id,
    subjectName: row.subject_name,
    duration: row.duration,
    type: row.type,
    date: row.date,
    completedAt: row.completed_at,
  };
}

// ─── SUBJECTS ─────────────────────────────────────────────────
app.get("/api/subjects", async (req, res) => {
  try {
    const db = getPool();
    const [rows] = await db.query("SELECT * FROM subjects ORDER BY created_at DESC");
    res.json(rows.map(formatSubject));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const db = getPool();
    const { name, color = "#6366f1", icon = "📚", goalHours = 10, description = "" } = req.body;
    const [result] = await db.query(
      "INSERT INTO subjects (name, color, icon, goal_hours, total_studied, description) VALUES (?, ?, ?, ?, 0, ?)",
      [name, color, icon, goalHours, description]
    );
    // TiDB doesn't return insertId for UUID PK — fetch by searching
    const [rows] = await db.query("SELECT * FROM subjects WHERE name = ? ORDER BY created_at DESC LIMIT 1", [name]);
    res.status(201).json(formatSubject(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/subjects/:id", async (req, res) => {
  try {
    const db = getPool();
    const { name, color, icon, goalHours, description } = req.body;
    await db.query(
      "UPDATE subjects SET name=?, color=?, icon=?, goal_hours=?, description=? WHERE id=?",
      [name, color, icon, goalHours, description, req.params.id]
    );
    const [rows] = await db.query("SELECT * FROM subjects WHERE id = ?", [req.params.id]);
    res.json(formatSubject(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete("/api/subjects/:id", async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM subjects WHERE id = ?", [req.params.id]);
    res.json({ message: "Subject deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── TASKS ────────────────────────────────────────────────────
app.get("/api/tasks/stats/summary", async (req, res) => {
  try {
    const db = getPool();
    const today = new Date().toISOString().split("T")[0];
    const [[{ total }]] = await db.query("SELECT COUNT(*) as total FROM tasks");
    const [[{ completed }]] = await db.query("SELECT COUNT(*) as completed FROM tasks WHERE completed = TRUE");
    const [[{ todayTotal }]] = await db.query("SELECT COUNT(*) as todayTotal FROM tasks WHERE date = ?", [today]);
    const [[{ todayCompleted }]] = await db.query("SELECT COUNT(*) as todayCompleted FROM tasks WHERE date = ? AND completed = TRUE", [today]);
    res.json({ total, completed, todayTotal, todayCompleted });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const db = getPool();
    let sql = "SELECT * FROM tasks";
    const params = [];
    const conditions = [];
    if (req.query.date) { conditions.push("date = ?"); params.push(req.query.date); }
    if (req.query.subject) { conditions.push("subject_id = ?"); params.push(req.query.subject); }
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows.map(formatTask));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const db = getPool();
    const { title, subject, subjectName, date, startTime, endTime, priority = "medium", notes = "" } = req.body;
    await db.query(
      "INSERT INTO tasks (title, subject_id, subject_name, date, start_time, end_time, completed, priority, notes) VALUES (?,?,?,?,?,?,FALSE,?,?)",
      [title, subject || null, subjectName || null, date, startTime || null, endTime || null, priority, notes]
    );
    const [rows] = await db.query("SELECT * FROM tasks WHERE title = ? AND date = ? ORDER BY created_at DESC LIMIT 1", [title, date]);
    res.status(201).json(formatTask(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const db = getPool();
    const { title, subject, subjectName, date, startTime, endTime, priority, notes } = req.body;
    await db.query(
      "UPDATE tasks SET title=?, subject_id=?, subject_name=?, date=?, start_time=?, end_time=?, priority=?, notes=? WHERE id=?",
      [title, subject || null, subjectName || null, date, startTime || null, endTime || null, priority, notes, req.params.id]
    );
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    res.json(formatTask(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch("/api/tasks/:id/toggle", async (req, res) => {
  try {
    const db = getPool();
    await db.query("UPDATE tasks SET completed = NOT completed WHERE id = ?", [req.params.id]);
    const [rows] = await db.query("SELECT * FROM tasks WHERE id = ?", [req.params.id]);
    res.json(formatTask(rows[0]));
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const db = getPool();
    await db.query("DELETE FROM tasks WHERE id = ?", [req.params.id]);
    res.json({ message: "Task deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POMODORO ──────────────────────────────────────────────────
app.get("/api/pomodoro/stats", async (req, res) => {
  try {
    const db = getPool();
    const [sessions] = await db.query("SELECT * FROM pomodoro_sessions WHERE type = 'work'");
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

app.get("/api/pomodoro", async (req, res) => {
  try {
    const db = getPool();
    let sql = "SELECT * FROM pomodoro_sessions";
    const params = [];
    if (req.query.date) { sql += " WHERE date = ?"; params.push(req.query.date); }
    sql += " ORDER BY completed_at DESC LIMIT 50";
    const [rows] = await db.query(sql, params);
    res.json(rows.map(formatSession));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/pomodoro", async (req, res) => {
  try {
    const db = getPool();
    const { subject, subjectName, duration = 25, type = "work", date } = req.body;
    await db.query(
      "INSERT INTO pomodoro_sessions (subject_id, subject_name, duration, type, date) VALUES (?,?,?,?,?)",
      [subject || null, subjectName || null, duration, type, date || new Date().toISOString().split("T")[0]]
    );
    // Auto-increment studied hours on subject
    if (type === "work") {
      const hours = duration / 60;
      if (subject) {
        await db.query("UPDATE subjects SET total_studied = total_studied + ? WHERE id = ?", [hours, subject]);
      } else if (subjectName) {
        await db.query("UPDATE subjects SET total_studied = total_studied + ? WHERE name = ?", [hours, subjectName]);
      }
    }
    const [rows] = await db.query("SELECT * FROM pomodoro_sessions ORDER BY completed_at DESC LIMIT 1");
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