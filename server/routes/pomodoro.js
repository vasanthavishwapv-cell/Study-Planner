const express = require('express');
const router = express.Router();
const PomodoroSession = require('../models/PomodoroSession');

// GET all sessions (optional date filter)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.date) query.date = req.query.date;
    const sessions = await PomodoroSession.find(query).sort({ completedAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST save session
router.post('/', async (req, res) => {
  const session = new PomodoroSession(req.body);
  try {
    const newSession = await session.save();
    res.status(201).json(newSession);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET stats
router.get('/stats', async (req, res) => {
  try {
    const sessions = await PomodoroSession.find({ type: 'work' });
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    
    // Group by date
    const byDate = {};
    sessions.forEach(s => {
      byDate[s.date] = (byDate[s.date] || 0) + s.duration;
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      last7Days.push({ date: dateStr, minutes: byDate[dateStr] || 0 });
    }

    res.json({ totalSessions, totalMinutes, last7Days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
