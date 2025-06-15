const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'GHL_AUTOMATION'
  },
  email: {
    type: String,
    required: true
  },
  subaccountId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'WAITING_2FA', 'REENTER_2FA'],
    default: 'PENDING'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Custom values JSON object
  customValues: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Company data for AI
  companyData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // AI generated content
  aiContent: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Service text input
  serviceText: String,
  // Execution details
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  errorMessage: String,
  // 2FA handling
  twoFactorRequestId: String,
  twoFactorCode: String,
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Update progress method
automationSchema.methods.updateProgress = function(progress, message) {
  this.progress = Math.max(0, Math.min(100, progress));
  
  if (progress === 100 && this.status === 'RUNNING') {
    this.status = 'COMPLETED';
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Start automation method
automationSchema.methods.start = function() {
  this.status = 'RUNNING';
  this.progress = 0;
  this.startedAt = new Date();
  return this.save();
};

// Fail automation method
automationSchema.methods.fail = function(errorMessage) {
  this.status = 'FAILED';
  this.failedAt = new Date();
  this.errorMessage = errorMessage;
  return this.save();
};

module.exports = mongoose.model('Automation', automationSchema); 