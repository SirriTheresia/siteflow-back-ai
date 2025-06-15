const { AuthenticationError, UserInputError } = require('apollo-server-express');
const { Workspace, Invitation, User } = require('../models');
const crypto = require('crypto');

const workspaceResolvers = {
  Query: {
    workspaces: async (parent, args, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      return Workspace.find({
        'members.user': user._id
      }).populate('owner').populate('members.user');
    },

    invitations: async (parent, { workspaceId }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      return Invitation.find({ workspace: workspaceId })
        .populate('workspace')
        .populate('invitedBy');
    }
  },

  Mutation: {
    inviteUser: async (parent, { input }, { user }) => {
      if (!user) throw new AuthenticationError('You must be logged in');
      
      const { workspaceId, email, role } = input;
      
      // Check if user has permission to invite
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new UserInputError('Workspace not found');
      }
      
      const member = workspace.members.find(m => m.user.toString() === user._id.toString());
      if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new AuthenticationError('You do not have permission to invite users');
      }
      
      // Check if user is already a member
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const existingMember = workspace.members.find(m => m.user.toString() === existingUser._id.toString());
        if (existingMember) {
          throw new UserInputError('User is already a member of this workspace');
        }
      }
      
      // Create invitation
      const token = crypto.randomBytes(32).toString('hex');
      const invitation = new Invitation({
        workspace: workspaceId,
        email,
        role,
        invitedBy: user._id,
        token
      });
      
      await invitation.save();
      await invitation.populate(['workspace', 'invitedBy']);
      
      return invitation;
    },

    acceptInvitation: async (parent, { token }) => {
      const invitation = await Invitation.findOne({ 
        token, 
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).populate('workspace');
      
      if (!invitation) {
        throw new UserInputError('Invalid or expired invitation');
      }
      
      // Find or create user
      let user = await User.findOne({ email: invitation.email });
      if (!user) {
        throw new UserInputError('User must register first');
      }
      
      // Add user to workspace
      const workspace = await Workspace.findById(invitation.workspace._id);
      workspace.members.push({
        user: user._id,
        role: invitation.role
      });
      await workspace.save();
      
      // Update invitation
      invitation.status = 'accepted';
      await invitation.save();
      
      return workspace;
    }
  }
};

module.exports = workspaceResolvers; 