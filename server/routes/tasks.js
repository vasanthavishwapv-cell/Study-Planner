const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks (optionally filtered by date)
router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.date) query.date = req.query.date;
    if (req.query.subject) query.subject = req.query.subject;
    const tasks = await Task.find(query).populate('subject').sort({ date: -1, startTime: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create task
router.post('/', async (req, res) => {
  const task = new Task(req.body);
  try {
    const newTask = await task.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH toggle complete
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET stats
router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Task.countDocuments();
    const completed = await Task.countDocuments({ completed: true });
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = await Task.countDocuments({ date: today });
    const todayCompleted = await Task.countDocuments({ date: today, completed: true });
    res.json({ total, completed, todayTotal, todayCompleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
