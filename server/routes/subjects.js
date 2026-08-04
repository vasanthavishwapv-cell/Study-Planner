const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');

// GET all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ createdAt: -1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create subject
router.post('/', async (req, res) => {
  const subject = new Subject({
    name: req.body.name,
    color: req.body.color,
    icon: req.body.icon,
    goalHours: req.body.goalHours,
    description: req.body.description
  });
  try {
    const newSubject = await subject.save();
    res.status(201).json(newSubject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update subject
router.put('/:id', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE subject
router.delete('/:id', async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH update studied hours
router.patch('/:id/addHours', async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      { $inc: { totalStudied: req.body.hours } },
      { new: true }
    );
    res.json(subject);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
