const express = require("express");
const router = express.Router();
const PomodoroSession = require("../models/PomodoroSession");
const Subject = require("../models/Subject");

// GET all sessions (optional date filter)
router.get("/", async (req, res) => {
  try {
    const query = {};
    if (req.query.date) query.date = req.query.date;
    const sessions = await PomodoroSession.find(query).sort({ completedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST save session & update subject studied hours in MongoDB Atlas
router.post("/", async (req, res) => {
  const session = new PomodoroSession(req.body);
  try {
    const newSession = await session.save();

    // Dynamically update totalStudied hours in MongoDB Atlas for the subject
    if (req.body.type === "work" && (req.body.subject || req.body.subjectName)) {
      const hours = (req.body.duration || 25) / 60;
      if (req.body.subject) {
        await Subject.findByIdAndUpdate(req.body.subject, { $inc: { totalStudied: hours } });
      } else if (req.body.subjectName) {
        await Subject.findOneAndUpdate({ name: req.body.subjectName }, { $inc: { totalStudied: hours } });
      }
    }

    res.status(201).json(newSession);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET stats
router.get("/stats", async (req, res) => {
  try {
    const sessions = await PomodoroSession.find({ type: "work" });
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    const byDate = {};
    sessions.forEach((s) => {
      byDate[s.date] = (byDate[s.date] || 0) + s.duration;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      last7Days.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
    }

    res.json({ totalSessions, totalMinutes, last7Days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;