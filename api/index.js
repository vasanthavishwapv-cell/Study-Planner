require("dotenv").config();
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Inline Models so they work regardless of file structure on Vercel
const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#6366f1" },
  icon: { type: String, default: "📚" },
  goalHours: { type: Number, default: 10 },
  totalStudied: { type: Number, default: 0 },
  description: { type: String, default: "" }
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  subjectName: String,
  date: { type: String, required: true },
  startTime: String,
  endTime: String,
  completed: { type: Boolean, default: false },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  notes: String
}, { timestamps: true });

const pomodoroSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
  subjectName: String,
  duration: { type: Number, default: 25 },
  type: { type: String, enum: ["work", "short_break", "long_break"], default: "work" },
  date: String,
  completedAt: { type: Date, default: Date.now }
});

// Prevent model re-registration in serverless hot-reloads
const Subject = mongoose.models.Subject || mongoose.model("Subject", subjectSchema);
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
const PomodoroSession = mongoose.models.PomodoroSession || mongoose.model("PomodoroSession", pomodoroSchema);

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Connection cache for serverless
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://vasanthavishwapv_db_user:Vichu*1234@cluster0.nsqdrj7.mongodb.net/study-planner?retryWrites=true&w=majority";
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  isConnected = true;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    return res.status(500).json({ message: "Database connection failed: " + err.message });
  }
  next();
});

// ─── SUBJECTS ───────────────────────────────────────────────
app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const subject = new Subject(req.body);
    const saved = await subject.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/subjects/:id", async (req, res) => {
  try {
    const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete("/api/subjects/:id", async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: "Subject deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── TASKS ──────────────────────────────────────────────────
app.get("/api/tasks/stats/summary", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [total, completed, todayTotal, todayCompleted] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ completed: true }),
      Task.countDocuments({ date: today }),
      Task.countDocuments({ date: today, completed: true })
    ]);
    res.json({ total, completed, todayTotal, todayCompleted });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const query = {};
    if (req.query.date) query.date = req.query.date;
    if (req.query.subject) query.subject = req.query.subject;
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const task = new Task(req.body);
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.patch("/api/tasks/:id/toggle", async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── POMODORO ────────────────────────────────────────────────
app.get("/api/pomodoro/stats", async (req, res) => {
  try {
    const sessions = await PomodoroSession.find({ type: "work" });
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const byDate = {};
    sessions.forEach(s => { byDate[s.date] = (byDate[s.date] || 0) + s.duration; });
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      last7Days.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
    }
    res.json({ totalSessions, totalMinutes, last7Days });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/pomodoro", async (req, res) => {
  try {
    const query = {};
    if (req.query.date) query.date = req.query.date;
    const sessions = await PomodoroSession.find(query).sort({ completedAt: -1 }).limit(50);
    res.json(sessions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/pomodoro", async (req, res) => {
  try {
    const session = new PomodoroSession(req.body);
    const saved = await session.save();
    // Auto-update subject studied hours
    if (req.body.type === "work") {
      const hours = (req.body.duration || 25) / 60;
      if (req.body.subject) {
        await Subject.findByIdAndUpdate(req.body.subject, { $inc: { totalStudied: hours } });
      } else if (req.body.subjectName) {
        await Subject.findOneAndUpdate({ name: req.body.subjectName }, { $inc: { totalStudied: hours } });
      }
    }
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ─── HEALTH ─────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

module.exports = app;