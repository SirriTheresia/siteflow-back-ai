const bcrypt = require('bcryptjs');
const { AuthenticationError, UserInputError } = require('apollo-server-express');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Invitation = require('../models/Invitation');
const { generateToken } = require('../middleware/auth');
const StripeService = require('../services/stripeService');
const jwt = require('jsonwebtoken');
const { ALLOWED_VERSIONS } = require('../middleware/simpleAuth');

const authResolvers = {
  Query: {
    me: async (parent, args, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }
      
      try {
        console.log('ME query for user:', user._id);
        
        // Get basic user data first
        let userData = await User.findById(user._id);
        if (!userData) {
          throw new AuthenticationError('User not found');
        }

        console.log('Found user:', userData.email);

        // Handle legacy user migration
        if (!userData.workspaces || userData.workspaces.length === 0) {
          console.log('Migrating legacy user:', userData.email);
          await userData.ensureWorkspaceCompatibility();
          // Refresh user data after migration
          userData = await User.findById(user._id);
        }

        // Now populate the workspace data
        const populatedUser = await User.findById(user._id)
          .populate({
            path: 'workspaces.workspace',
            populate: {
              path: 'members.user',
              select: 'id email firstName lastName'
            }
          })
          .populate({
            path: 'currentWorkspace',
            populate: {
              path: 'members.user',
              select: 'id email firstName lastName'
            }
          });

        console.log('Populated user workspaces:', populatedUser.workspaces?.length);
        console.log('Current workspace:', populatedUser.currentWorkspace?.name);

        return populatedUser;
      } catch (error) {
        console.error('ME query error:', error);
        throw new AuthenticationError('Failed to fetch user data: ' + error.message);
      }
    }
  },

  Mutation: {
    register: async (parent, { input }) => {
      const { email, password, firstName, lastName, workspaceName, invitationToken, deviceId } = input;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !deviceId) {
        throw new UserInputError('All required fields must be provided');
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new UserInputError('User with this email already exists');
      }

      // Use the frontend-provided device ID for consistent device locking
      console.log('Using frontend-provided device ID for registration:', deviceId);

      // Create user with locked device
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        currentDeviceId: deviceId,
        workspaces: []
      });
      await user.save();

      let workspace = null;
      let stripeUrl = null;

      // Check if user was invited to a workspace (explicit token or check by email)
      let invitation = null;
      if (invitationToken) {
        invitation = await Invitation.findOne({
          token: invitationToken,
          status: 'pending',
          expiresAt: { $gt: new Date() }
        }).populate('workspace');
      } else {
        // Check for pending invitations by email
        invitation = await Invitation.findOne({
          email: email.toLowerCase(),
          status: 'pending',
          expiresAt: { $gt: new Date() }
        }).populate('workspace');
      }

      if (invitation && invitation.email.toLowerCase() === email.toLowerCase()) {
        // Join invited workspace
        workspace = await Workspace.findById(invitation.workspace._id);
        
        // Add user to workspace
        workspace.members.push({
          user: user._id,
          role: invitation.role,
          joinedAt: new Date()
        });
        await workspace.save();

        // Add workspace to user
        user.workspaces.push({
          workspace: workspace._id,
          role: invitation.role,
          joinedAt: new Date()
        });
        user.currentWorkspace = workspace._id;
        await user.save();

        // Mark invitation as accepted
        invitation.status = 'accepted';
        await invitation.save();
      }

      // If no invitation or user chooses to create new workspace
      if (!workspace && workspaceName) {
        // Create new workspace
        workspace = new Workspace({
          name: workspaceName,
        owner: user._id,
        members: [{
          user: user._id,
          role: 'owner'
        }]
      });
      await workspace.save();

        // Add workspace to user
        user.workspaces.push({
          workspace: workspace._id,
          role: 'owner',
          joinedAt: new Date()
        });
        user.currentWorkspace = workspace._id;
        await user.save();

        // Get Stripe checkout URL for new workspace
        try {
          stripeUrl = await StripeService.getCheckoutUrl(user, workspace);
        } catch (error) {
          console.error('Stripe error during registration:', error);
          // Continue without Stripe for now
        }
      }

      const token = generateToken(user._id);

      return {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          workspaces: [], // Empty to avoid GraphQL resolution issues
          currentWorkspace: null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        workspace: null,
        stripeUrl
      };
    },

    login: async (parent, { email, password, deviceId, version }) => {
      try {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Received deviceId:', deviceId);
        console.log('Received version:', version);
        
        // Check version
        if (!ALLOWED_VERSIONS.includes(version)) {
          throw new AuthenticationError(`App version ${version} is not supported. Please update your app.`);
        }
console.log(password)
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || !user.isActive) {
          console.log('User not found or inactive');
          throw new AuthenticationError('Invalid credentials');
        }

        console.log('Found user:', user.email);
        console.log('Stored currentDeviceId in DB:', user.currentDeviceId);

        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
          console.log('Invalid password');
          throw new AuthenticationError('Invalid credentials');
        }

        console.log('Password valid');

        // Device check - permanent device locking
        if (user.currentDeviceId) {
          console.log('=== DEVICE CHECK ===');
          console.log('User has existing device ID:', user.currentDeviceId);
          console.log('Incoming device ID:', deviceId);
          console.log('Device IDs match:', user.currentDeviceId === deviceId);
          
          if (user.currentDeviceId !== deviceId) {
            console.log('DEVICE MISMATCH - BLOCKING LOGIN');
            throw new AuthenticationError('This account is permanently linked to another device. Contact support for assistance.');
          } else {
            console.log('Device IDs match - allowing login');
          }
        } else {
          // First login - lock to this device permanently
          console.log('=== FIRST LOGIN - SETTING DEVICE ===');
          console.log('Setting device ID to:', deviceId);
          user.currentDeviceId = deviceId;
          await user.save();
          console.log('Device locked for user:', email);
        }

        // Handle legacy user migration
        if (!user.workspaces || user.workspaces.length === 0) {
          console.log('Migrating legacy user during login:', email);
          await user.ensureWorkspaceCompatibility();
        }

        // Check for pending invitations and auto-accept
        const pendingInvitation = await Invitation.findOne({
          email: email.toLowerCase(),
          status: 'pending'
        }).populate('workspace');

        if (pendingInvitation) {
          console.log('Auto-accepting invitation for:', email);
          
          // Check workspace member limit (max 3 total)
          const workspace = await Workspace.findById(pendingInvitation.workspace._id);
          if (workspace.members.length >= 3) {
            throw new AuthenticationError('This workspace has reached the maximum number of members (3).');
          }

          // Add user to workspace
          workspace.members.push({
            user: user._id,
            role: 'member'
          });
          await workspace.save();

          // Add workspace to user's workspaces
          user.workspaces.push({
            workspace: pendingInvitation.workspace._id,
            role: 'member'
          });

          // Set as current workspace if user doesn't have one
          if (!user.currentWorkspace) {
            user.currentWorkspace = pendingInvitation.workspace._id;
          }

          await user.save();

          // Mark invitation as accepted
          pendingInvitation.status = 'accepted';
          pendingInvitation.acceptedAt = new Date();
          await pendingInvitation.save();

          console.log('Invitation auto-accepted for:', email);
        }

        // Generate JWT token
        const token = jwt.sign(
          { userId: user._id, email: user.email },
          process.env.JWT_SECRET || 'fallback-jwt-secret-for-development-only-change-in-production',
          { expiresIn: '30d' }
        );

        console.log('=== LOGIN SUCCESS ===');
        console.log('Generated token for user:', email);

        // Get populated user data after any workspace changes
        const populatedUser = await User.findById(user._id)
          .populate({
            path: 'workspaces.workspace',
            select: 'id name description isActive subscriptionActive owner members createdAt updatedAt'
          })
          .populate({
            path: 'currentWorkspace',
            select: 'id name description isActive subscriptionActive owner members createdAt updatedAt'
          });

        console.log('Login - populated workspaces:', populatedUser.workspaces?.length);

        // Return populated user data
        return {
          token,
          user: {
            id: populatedUser._id.toString(),
            email: populatedUser.email,
            firstName: populatedUser.firstName,
            lastName: populatedUser.lastName,
            isActive: populatedUser.isActive,
            workspaces: (populatedUser.workspaces || []).map(uw => ({
              workspace: {
                id: uw.workspace._id.toString(),
                name: uw.workspace.name,
                description: uw.workspace.description || null,
                isActive: uw.workspace.isActive,
                subscriptionActive: uw.workspace.subscriptionActive,
                owner: uw.workspace.owner ? uw.workspace.owner.toString() : null,
                members: [], // Simplified - remove complex member data for login
                createdAt: uw.workspace.createdAt,
                updatedAt: uw.workspace.updatedAt
              },
              role: uw.role,
              joinedAt: uw.joinedAt
            })).filter(uw => uw.workspace && uw.workspace.id), // Filter out invalid workspaces
            currentWorkspace: populatedUser.currentWorkspace ? {
              id: populatedUser.currentWorkspace._id.toString(),
              name: populatedUser.currentWorkspace.name,
              description: populatedUser.currentWorkspace.description || null,
              isActive: populatedUser.currentWorkspace.isActive,
              subscriptionActive: populatedUser.currentWorkspace.subscriptionActive,
              owner: populatedUser.currentWorkspace.owner ? populatedUser.currentWorkspace.owner.toString() : null,
              members: [], // Simplified - remove complex member data for login
              createdAt: populatedUser.currentWorkspace.createdAt,
              updatedAt: populatedUser.currentWorkspace.updatedAt
            } : null,
            createdAt: populatedUser.createdAt,
            updatedAt: populatedUser.updatedAt
          }
        };

      } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        throw new AuthenticationError(error.message || 'Login failed');
      }
    },

    selectWorkspace: async (parent, { workspaceId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      // Check if user has access to this workspace
      const userWorkspace = user.workspaces.find(w => 
        w.workspace._id.toString() === workspaceId
      );

      if (!userWorkspace) {
        throw new AuthenticationError('You do not have access to this workspace');
      }

      // Set current workspace
      user.currentWorkspace = workspaceId;
      await user.save();

      // Populate and return
      await user.populate('currentWorkspace');

      const token = generateToken(user._id);

      return {
        token,
        user,
        workspace: user.currentWorkspace,
        needsWorkspaceSelection: false
      };
    },

    logout: async (parent, args, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      // Device stays locked - user can only ever use their registered device
      // No need to clear device ID since it's permanent
      return true;
    }
  }
};

module.exports = authResolvers; 