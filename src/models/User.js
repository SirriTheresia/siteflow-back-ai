const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Device tracking for one user per device enforcement
  currentDeviceId: String,
  // Multiple workspaces support (with default for legacy users)
  workspaces: {
    type: [{
      workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace'
      },
      role: {
        type: String,
        enum: ['owner', 'member'],
        default: 'member'
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: [] // Default to empty array for legacy users
  },
  // Current active workspace for this session
  currentWorkspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Legacy user migration method
userSchema.methods.ensureWorkspaceCompatibility = async function() {
  // If user already has workspaces array, they're compatible
  if (this.workspaces && this.workspaces.length > 0) {
    return this;
  }

  // Initialize workspaces array if it doesn't exist
  if (!this.workspaces) {
    this.workspaces = [];
  }

  // Check if user is a member of any workspace (legacy check)
  const Workspace = mongoose.model('Workspace');
  const existingWorkspace = await Workspace.findOne({
    'members.user': this._id
  });

  if (existingWorkspace) {
    // Add existing workspace to user's workspaces array
    const userRole = existingWorkspace.members.find(m => 
      m.user.toString() === this._id.toString()
    )?.role || 'member';

    this.workspaces.push({
      workspace: existingWorkspace._id,
      role: userRole,
      joinedAt: new Date()
    });

    // Set as current workspace if none is set
    if (!this.currentWorkspace) {
      this.currentWorkspace = existingWorkspace._id;
    }

    await this.save();
    console.log(`Migrated legacy user ${this.email} to new workspace model`);
  }

  return this;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 