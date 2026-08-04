const mongoose = require('mongoose');

const pomodoroSchema = new mongoose.Schema({
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: false },
  subjectName: { type: String, default: 'General' },
  duration: { type: Number, default: 25 },
  type: { type: String, enum: ['work', 'short-break', 'long-break'], default: 'work' },
  completedAt: { type: Date, default: Date.now },
  date: { type: String, required: true }
});

module.exports = mongoose.model('PomodoroSession', pomodoroSchema);
