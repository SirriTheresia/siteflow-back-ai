const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { Automation, ExecutionLog, Workspace, TwoFactorRequest } = require('../models');
const GHLAutomationService = require('../services/ghlAutomationService');
const AIContentService = require('../services/aiContentService');

// Helper function to handle legacy users and ensure they have a workspace
const ensureUserHasWorkspace = async (user) => {
  // If user already has workspaces and currentWorkspace, they're good
  if (user.workspaces && user.workspaces.length > 0 && user.currentWorkspace) {
    return user.currentWorkspace;
  }

  // Legacy user migration: Find or create workspace
  let workspace = null;

  // Check if user is already a member of any workspace (legacy data)
  workspace = await Workspace.findOne({
    'members.user': user._id
  });

  if (!workspace) {
    // Create a default workspace for legacy user
    workspace = new Workspace({
      name: `${user.firstName}'s Workspace`,
      owner: user._id,
      members: [{
        user: user._id,
        role: 'owner',
        joinedAt: new Date()
      }],
      subscriptionActive: true // Give legacy users active subscription
    });
    await workspace.save();
    console.log(`Created default workspace for legacy user: ${user.email}`);
  }

  // Update user with workspace data
  const userWorkspaceExists = user.workspaces.some(uw => 
    uw.workspace.toString() === workspace._id.toString()
  );

  if (!userWorkspaceExists) {
    user.workspaces.push({
      workspace: workspace._id,
      role: 'owner',
      joinedAt: new Date()
    });
  }

  user.currentWorkspace = workspace._id;
  await user.save();

  console.log(`Migrated legacy user ${user.email} to workspace: ${workspace.name}`);
  return workspace;
};

const automationResolvers = {
  Query: {
    automations: async (parent, args, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      // Get user's workspaces (handle legacy users)
      const workspace = await ensureUserHasWorkspace(user);
      const workspaceIds = user.workspaces.map(uw => uw.workspace);
      
      return Automation.find({ 
        workspace: { $in: workspaceIds } 
      })
      .populate('createdBy')
      .populate('workspace')
      .sort({ createdAt: -1 });
    },

    automation: async (parent, { id }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      // Ensure user has workspace (handle legacy users)
      await ensureUserHasWorkspace(user);
      
      const automation = await Automation.findById(id)
        .populate('createdBy')
        .populate('workspace');
      
      if (!automation) {
        throw new UserInputError('Automation not found');
      }
      
      // Check if user has access to this automation's workspace
      const workspace = await Workspace.findOne({
        _id: automation.workspace._id,
        'members.user': user._id
      });
      
      if (!workspace) {
        throw new AuthenticationError('You do not have access to this automation');
      }
      
      return automation;
    },

    automationLogs: async (parent, { automationId }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      // Ensure user has workspace (handle legacy users)
      await ensureUserHasWorkspace(user);
      
      // Verify user has access to this automation
      const automation = await Automation.findById(automationId).populate('workspace');
      if (!automation) {
        throw new UserInputError('Automation not found');
      }
      
      const workspace = await Workspace.findOne({
        _id: automation.workspace._id,
        'members.user': user._id
      });
      
      if (!workspace) {
        throw new AuthenticationError('You do not have access to this automation');
      }
      
      return ExecutionLog.find({ automation: automationId })
        .sort({ createdAt: -1 });
    }
  },

  Mutation: {
    runGHLAutomation: async (parent, { input }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      const { workspaceId } = input;
      
      // Verify user has access to the specified workspace
      const workspace = await Workspace.findOne({
        _id: workspaceId,
        'members.user': user._id
      });
      
      if (!workspace) {
        throw new AuthenticationError('You do not have access to this workspace or it does not exist.');
      }

      // Check if workspace has active subscription
      if (!workspace.subscriptionActive) {
        throw new UserInputError('Workspace subscription is not active. Please upgrade to run automations.');
      }
      
      const automationService = new GHLAutomationService();
      
      try {
        const result = await automationService.runAutomation(input, user, workspace);
        
        return {
          success: result.success,
          message: result.message || result.error,
          automation: result.automation
        };
      } catch (error) {
        console.error('GHL Automation error:', error.message);
        throw new Error(`Automation failed: ${error.message}`);
      }
    },

    generateAIContent: async (parent, { input }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      // Get or create workspace for user (handles legacy users)
      let workspace = await ensureUserHasWorkspace(user);
      
      // Re-fetch workspace with full data
      workspace = await Workspace.findById(workspace._id || workspace.id);
      
      if (!workspace) {
        throw new UserInputError('Failed to get workspace. Please try again.');
      }

      // Check if workspace has active subscription
      if (!workspace.subscriptionActive) {
        throw new UserInputError('Workspace subscription is not active. Please upgrade to generate AI content.');
      }
      
      const { serviceText, companyData } = input;
      const aiService = new AIContentService();
      
      try {
        const result = await aiService.generateContent(serviceText, companyData || {});
        
        if (result.success) {
          return {
            success: true,
            message: 'Content generated successfully',
            data: result.data
          };
        } else {
          return {
            success: false,
            message: result.error,
            data: null
          };
        }
      } catch (error) {
        console.error('AI Content generation error:', error.message);
        throw new Error(`Content generation failed: ${error.message}`);
      }
    },

    // Submit 2FA code for automation
    submitTwoFactorCode: async (parent, { automationId, code }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      // Ensure user has workspace (handle legacy users)
      await ensureUserHasWorkspace(user);
      
      try {
        const automation = await Automation.findById(automationId);
        
        if (!automation) {
          throw new UserInputError('Automation not found');
        }
        
        // Verify user has access to this automation
        const workspace = await Workspace.findOne({
          _id: automation.workspace,
          'members.user': user._id
        });
        
        if (!workspace) {
          throw new AuthenticationError('You do not have access to this automation');
        }

        // Continue the automation with the 2FA code
        const automationService = new GHLAutomationService();
        const result = await automationService.continueAfter2FA(automationId, code);
        
        return {
          success: result.success,
          message: result.message || result.error
        };
      } catch (error) {
        console.error('Submit 2FA code error:', error.message);
        return {
          success: false,
          message: error.message
        };
      }
    }
  }
};

module.exports = automationResolvers; 