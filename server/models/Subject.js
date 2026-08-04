const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#6366f1' },
  icon: { type: String, default: '📚' },
  goalHours: { type: Number, default: 0 },
  totalStudied: { type: Number, default: 0 },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subject', subjectSchema);
