const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const { User, Workspace, Invitation } = require('../models');
const crypto = require('crypto');

const invitationResolvers = {
  Query: {
    invitations: async (parent, { workspaceId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      // Check if user has access to this workspace
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new UserInputError('Workspace not found');
      }

      const member = workspace.members.find(m => m.user.toString() === user._id.toString());
      if (!member && workspace.owner.toString() !== user._id.toString()) {
        throw new ForbiddenError('You do not have access to this workspace');
      }

      return await Invitation.find({ workspace: workspaceId })
        .populate('workspace')
        .populate('invitedBy')
        .sort({ createdAt: -1 });
    }
  },

  Mutation: {
    inviteUser: async (parent, { input }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      const { email, workspaceId, role = 'member' } = input;

      // Check if workspace exists and user is owner
      const workspace = await Workspace.findById(workspaceId).populate('members.user');
      if (!workspace) {
        throw new UserInputError('Workspace not found');
      }

      if (workspace.owner.toString() !== user._id.toString()) {
        throw new ForbiddenError('Only workspace owners can invite users');
      }

      // Check workspace member limit (max 3 users total)
      const currentMemberCount = workspace.members.length;
      const pendingInvitationsCount = await Invitation.countDocuments({
        workspace: workspaceId,
        status: 'pending'
      });

      if (currentMemberCount + pendingInvitationsCount >= 3) {
        throw new UserInputError('Maximum of 3 users allowed per workspace');
      }

      // Check if email already exists in the system
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        // Check if user is already a member of this workspace
        const isMember = workspace.members.some(m => 
          m.user._id.toString() === existingUser._id.toString()
        );
        if (isMember) {
          throw new UserInputError('User is already a member of this workspace');
        }

        // Check if user is already a member of another workspace
        const userWorkspace = await Workspace.findOne({
          'members.user': existingUser._id
        });
        if (userWorkspace) {
          throw new UserInputError('User is already a member of another workspace');
        }
      }

      // Check if there's already a pending invitation for this email and workspace
      const existingInvitation = await Invitation.findOne({
        email: email.toLowerCase(),
        workspace: workspaceId,
        status: 'pending'
      });

      if (existingInvitation) {
        throw new UserInputError('There is already a pending invitation for this email');
      }

      // Generate unique token
      const token = crypto.randomBytes(32).toString('hex');

      // Create invitation
      const invitation = new Invitation({
        email: email.toLowerCase(),
        workspace: workspaceId,
        invitedBy: user._id,
        role,
        token
      });

      await invitation.save();

      // Populate the invitation for return
      await invitation.populate(['workspace', 'invitedBy']);

      // TODO: Send email notification here
      console.log(`Invitation sent to ${email} for workspace ${workspace.name}`);
      console.log(`Invitation link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${token}`);

      return invitation;
    },

    acceptInvitation: async (parent, { token }) => {
      // Find invitation
      const invitation = await Invitation.findOne({
        token,
        status: 'pending',
        expiresAt: { $gt: new Date() }
      }).populate('workspace');

      if (!invitation) {
        throw new UserInputError('Invalid or expired invitation');
      }

      // Check if user already exists
      let user = await User.findOne({ email: invitation.email });
      
      if (!user) {
        throw new UserInputError('You must register first before accepting invitations');
      }

      // Check if user is already a member of another workspace
      const existingWorkspace = await Workspace.findOne({
        'members.user': user._id
      });

      if (existingWorkspace) {
        throw new UserInputError('You are already a member of another workspace');
      }

      // Check workspace member limit again (just in case)
      const workspace = await Workspace.findById(invitation.workspace._id);
      if (workspace.members.length >= 3) {
        throw new UserInputError('Workspace is full');
      }

      // Add user to workspace
      workspace.members.push({
        user: user._id,
        role: invitation.role,
        joinedAt: new Date()
      });

      await workspace.save();

      // Update invitation status
      invitation.status = 'accepted';
      await invitation.save();

      // Update user's workspace reference
      user.workspace = workspace._id;
      await user.save();

      return workspace;
    },

    cancelInvitation: async (parent, { invitationId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      const invitation = await Invitation.findById(invitationId).populate('workspace');
      if (!invitation) {
        throw new UserInputError('Invitation not found');
      }

      // Check if user can cancel this invitation
      if (invitation.workspace.owner.toString() !== user._id.toString() && 
          invitation.invitedBy.toString() !== user._id.toString()) {
        throw new ForbiddenError('You cannot cancel this invitation');
      }

      invitation.status = 'cancelled';
      await invitation.save();

      return true;
    },

    resendInvitation: async (parent, { invitationId }, { user }) => {
      if (!user) {
        throw new AuthenticationError('You must be logged in');
      }

      const invitation = await Invitation.findById(invitationId).populate(['workspace', 'invitedBy']);
      if (!invitation) {
        throw new UserInputError('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new UserInputError('Can only resend pending invitations');
      }

      // Check if user can resend this invitation
      if (invitation.workspace.owner.toString() !== user._id.toString()) {
        throw new ForbiddenError('Only workspace owners can resend invitations');
      }

      // Generate new token and extend expiration
      invitation.token = crypto.randomBytes(32).toString('hex');
      invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await invitation.save();

      // TODO: Send email notification here
      console.log(`Invitation resent to ${invitation.email} for workspace ${invitation.workspace.name}`);
      console.log(`New invitation link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invitation?token=${invitation.token}`);

      return invitation;
    }
  }
};

module.exports = invitationResolvers; 