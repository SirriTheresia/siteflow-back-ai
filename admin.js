#!/usr/bin/env node

const mongoose = require('mongoose');
const { User, Workspace } = require('./src/models');
const fs = require('fs');
const path = require('path');

// Environment variables
require('dotenv').config();
const MONGODB_URI = 'mongodb+srv://terrencechungong:1piqKAw0kiKAVTcC@cluster0.6wxee0a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Admin commands
const commands = {
  // Enable subscription for workspace
  async enableSubscription(workspaceId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      console.log('Workspace not found');
      return;
    }
    
    workspace.subscriptionActive = true;
    await workspace.save();
    console.log(`Subscription enabled for workspace: ${workspace.name}`);
  },

  // Disable subscription for workspace
  async disableSubscription(workspaceId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      console.log('Workspace not found');
      return;
    }
    
    workspace.subscriptionActive = false;
    await workspace.save();
    console.log(`Subscription disabled for workspace: ${workspace.name}`);
  },

  // Reset user device (DANGER: User will be locked out unless they're on the new device)
  async resetUserDevice(userId) {
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log(`WARNING: This will clear the device lock for ${user.email}`);
    console.log('The user will need to login from their new device to set it as their permanent device');
    console.log('Are you sure? This action cannot be undone.');
    
    user.currentDeviceId = null;
    await user.save();
    console.log(`Device lock cleared for user: ${user.email}`);
    console.log('User must now login from their desired device to lock it permanently');
  },

  // List all users and their status
  async listUsers() {
    const users = await User.find();
    console.log('\n=== USERS ===');
    for (const user of users) {
      const workspace = await Workspace.findOne({ 'members.user': user._id });
      console.log(`${user._id}: ${user.email} (${user.firstName} ${user.lastName})`);
      console.log(`  Device: ${user.currentDeviceId || 'None'}`);
      console.log(`  Workspace: ${workspace ? workspace.name : 'None'}`);
      console.log(`  Subscription: ${workspace ? workspace.subscriptionActive : 'N/A'}`);
      console.log('');
    }
  },

  // List all workspaces
  async listWorkspaces() {
    const workspaces = await Workspace.find().populate('owner');
    console.log('\n=== WORKSPACES ===');
    for (const workspace of workspaces) {
      console.log(`${workspace._id}: ${workspace.name}`);
      console.log(`  Owner: ${workspace.owner.email}`);
      console.log(`  Subscription: ${workspace.subscriptionActive}`);
      console.log(`  Members: ${workspace.members.length}`);
      console.log('');
    }
  },

  // Update allowed versions (modify middleware file)
  async updateVersions(versions) {
    const versionsArray = versions.split(',').map(v => v.trim());
    const middlewarePath = path.join(__dirname, 'src/middleware/simpleAuth.js');
    
    try {
      let content = fs.readFileSync(middlewarePath, 'utf8');
      const oldVersionsRegex = /const ALLOWED_VERSIONS = \[.*?\];/s;
      const newVersionsLine = `const ALLOWED_VERSIONS = ${JSON.stringify(versionsArray)};`;
      
      content = content.replace(oldVersionsRegex, newVersionsLine);
      fs.writeFileSync(middlewarePath, content);
      
      console.log(`Updated allowed versions to: ${versionsArray.join(', ')}`);
      console.log('Note: Server restart required for changes to take effect');
    } catch (error) {
      console.error('Error updating versions:', error.message);
    }
  },

  // Show help
  help() {
    console.log(`
Available commands:

User Management:
  node admin.js reset-device <userId>       - Reset user's device lock (DANGER!)
  node admin.js list-users                  - List all users

Workspace Management:
  node admin.js enable-sub <workspaceId>    - Enable subscription
  node admin.js disable-sub <workspaceId>   - Disable subscription  
  node admin.js list-workspaces             - List all workspaces

Version Control:
  node admin.js update-versions <v1,v2,v3>  - Update allowed versions

Other:
  node admin.js help                        - Show this help
    `);
  }
};

// Main function
async function main() {
  const [,, command, ...args] = process.argv;

  if (!command) {
    commands.help();
    process.exit(0);
  }

  await connectDB();

  try {
    switch (command) {
      case 'enable-sub':
        await commands.enableSubscription(args[0]);
        break;
      case 'disable-sub':
        await commands.disableSubscription(args[0]);
        break;
      case 'reset-device':
        await commands.resetUserDevice(args[0]);
        break;
      case 'list-users':
        await commands.listUsers();
        break;
      case 'list-workspaces':
        await commands.listWorkspaces();
        break;
      case 'update-versions':
        await commands.updateVersions(args[0]);
        break;
      case 'help':
        commands.help();
        break;
      default:
        console.log(`Unknown command: ${command}`);
        commands.help();
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main(); 