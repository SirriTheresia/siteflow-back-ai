const mongoose = require('mongoose');
const { User, Workspace } = require('./src/models');

// Use the same MongoDB URI as the server
const MONGODB_URI = 'mongodb+srv://terrencechungong:1piqKAw0kiKAVTcC@cluster0.6wxee0a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createUserAndAddToWorkspace = async () => {
  try {
    await connectDB();

    const userData = {
      firstName: "Sirri",
      lastName: "Anye", 
      email: "anyesirri00@gmail.com",
      password: "Sirri1234"
    };
    
    const workspaceId = "6844c067abac4605f974872e";

    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log('❌ User already exists with this email');
      process.exit(1);
    }

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      console.log('❌ Workspace not found with ID:', workspaceId);
      process.exit(1);
    }

    console.log('📋 Found workspace:', workspace.name);

    // Create user
    const user = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      currentDeviceId: null, // Will be set when they first login
      workspaces: []
    });

    await user.save();
    console.log('✅ User created successfully:', user.email);

    // Add user to workspace as member
    workspace.members.push({
      user: user._id,
      role: 'member',
      joinedAt: new Date()
    });
    await workspace.save();

    // Add workspace to user's workspaces
    user.workspaces.push({
      workspace: workspace._id,
      role: 'member',
      joinedAt: new Date()
    });
    user.currentWorkspace = workspace._id;
    await user.save();

    console.log('✅ User added to workspace successfully');
    console.log('👤 User Details:');
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user._id}`);
    console.log('🏢 Workspace Details:');
    console.log(`   Name: ${workspace.name}`);
    console.log(`   ID: ${workspace._id}`);
    console.log(`   Members: ${workspace.members.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected');
    process.exit(0);
  }
};

// Run the script
createUserAndAddToWorkspace(); 