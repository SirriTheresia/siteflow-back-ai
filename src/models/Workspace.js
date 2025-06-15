const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Simple subscription management
  subscriptionActive: {
    type: Boolean,
    default: false
  },
  // Automation queue - first one is running, rest are pending
  automationQueue: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Automation'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add automation to end of queue
workspaceSchema.methods.addToQueue = function(automationId) {
  // this.automationQueue = []
  this.automationQueue.push(automationId);
  return this.save();
};

// Remove automation from front of queue
workspaceSchema.methods.removeFromFront = function() {
  this.automationQueue.shift();
  return this.save();
};

// Check if queue is currently processing (first automation is running)
workspaceSchema.methods.isProcessing = function() {
  return this.automationQueue.length > 0;
};

module.exports = mongoose.model('Workspace', workspaceSchema); 