const mongoose = require('mongoose');

const twoFactorRequestSchema = new mongoose.Schema({
  automationId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'received', 'expired'],
    default: 'waiting'
  },
  code: String,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TwoFactorRequest', twoFactorRequestSchema); 