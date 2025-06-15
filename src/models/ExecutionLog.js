const mongoose = require('mongoose');

const executionLogSchema = new mongoose.Schema({
  automation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Automation',
    required: true
  },
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'failed', 'warning'],
    required: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: Number // in milliseconds
  },
  // Categorization
  category: {
    type: String,
    enum: ['system', 'ghl', 'ai', 'user', 'error', 'warning', 'info'],
    default: 'info'
  },
  step: {
    type: String,
    maxlength: 100
  },
  // Error details (if applicable)
  error: {
    code: String,
    message: String,
    stack: String,
    retry: {
      attempt: {
        type: Number,
        default: 0
      },
      maxAttempts: {
        type: Number,
        default: 3
      },
      nextRetryAt: Date
    }
  },
  // Performance metrics
  metrics: {
    memoryUsage: Number,
    cpuTime: Number,
    apiCalls: Number,
    dataProcessed: Number
  }
}, {
  timestamps: false // Using custom timestamp field
});

// Indexes
executionLogSchema.index({ automation: 1, timestamp: -1 });
executionLogSchema.index({ automation: 1, status: 1 });
executionLogSchema.index({ timestamp: -1 });
executionLogSchema.index({ category: 1, timestamp: -1 });

// Static method to create log entry
executionLogSchema.statics.createLog = function(automationId, data) {
  return this.create({
    automation: automationId,
    status: data.status,
    progress: data.progress || 0,
    message: data.message,
    details: data.details || {},
    category: data.category || 'info',
    step: data.step,
    duration: data.duration,
    error: data.error,
    metrics: data.metrics
  });
};

// Static method to get logs for automation
executionLogSchema.statics.getLogsForAutomation = function(automationId, options = {}) {
  const query = { automation: automationId };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0);
};

// Static method to get latest log for automation
executionLogSchema.statics.getLatestLog = function(automationId) {
  return this.findOne({ automation: automationId })
    .sort({ timestamp: -1 });
};

// Static method to clean old logs
executionLogSchema.statics.cleanOldLogs = function(daysToKeep = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  return this.deleteMany({
    timestamp: { $lt: cutoffDate },
    status: { $nin: ['failed'] } // Keep error logs longer
  });
};

// Transform output
executionLogSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('ExecutionLog', executionLogSchema); 