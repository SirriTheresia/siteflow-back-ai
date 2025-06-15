const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'cancelled'],
    default: 'pending'
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
}, {
  timestamps: true
});

// Compound index to ensure one pending invitation per email per workspace
invitationSchema.index({ email: 1, workspace: 1, status: 1 }, { unique: true });

// Index for token lookup
invitationSchema.index({ token: 1 });

// Index for cleanup of expired invitations
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation; 