const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date
  scalar JSON

  # User Types
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    isActive: Boolean!
    workspaces: [UserWorkspace!]!
    currentWorkspace: Workspace
    createdAt: Date!
    updatedAt: Date!
  }

  type UserWorkspace {
    workspace: Workspace!
    role: String!
    joinedAt: Date!
  }

  # Workspace Types
  type Workspace {
    id: ID!
    name: String!
    description: String
    owner: User!
    members: [WorkspaceMember!]!
    isActive: Boolean!
      subscriptionActive: Boolean!
    createdAt: Date!
    updatedAt: Date!
  }

  type WorkspaceMember {
    user: User!
    role: String!
    joinedAt: Date!
  }

  # Invitation Types
  type Invitation {
    id: ID!
    email: String!
    workspace: Workspace!
    invitedBy: User!
    role: String!
    status: String!
    token: String!
    expiresAt: Date!
    createdAt: Date!
    updatedAt: Date!
  }

  # Automation Types
  type Automation {
    id: ID!
    workspace: Workspace!
    name: String!
    type: String!
    email: String!
    subaccountId: String!
    status: AutomationStatus!
    progress: Int!
    customValues: JSON
    companyData: JSON
    aiContent: JSON
    serviceText: String
    startedAt: Date
    completedAt: Date
    failedAt: Date
    errorMessage: String
    twoFactorRequestId: String
    createdBy: User!
    createdAt: Date!
    updatedAt: Date!
  }

  type ExecutionLog {
    id: ID!
    automation: Automation!
    status: String!
    message: String!
    data: JSON
    createdAt: Date!
  }

  enum AutomationStatus {
    PENDING
    RUNNING
    COMPLETED
    FAILED
    WAITING_2FA
    REENTER_2FA
  }

  # Input Types
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    workspaceName: String
    invitationToken: String
    deviceId: String!
  }

  input InviteUserInput {
    workspaceId: ID!
    email: String!
    role: String!
  }

  input GHLAutomationInput {
    workspaceId: ID!
    email: String!
    password: String
    subaccountId: String!
    customValues: JSON
    companyData: JSON
    serviceText: String
  }

  input AIContentInput {
    serviceText: String!
    companyData: JSON
  }

  # Response Types
  type AuthPayload {
    token: String!
    user: User!
    workspace: Workspace
    stripeUrl: String
    needsWorkspaceSelection: Boolean
  }

  type AutomationResponse {
    success: Boolean!
    message: String!
    automation: Automation
  }

  type AIContentResponse {
    success: Boolean!
    message: String!
    data: JSON
  }

  type TwoFactorResponse {
    success: Boolean!
    message: String!
  }

  # Queries
  type Query {
    # Auth
    me: User

    # Workspaces
    workspaces: [Workspace!]!
    invitations(workspaceId: ID!): [Invitation!]!

    # Automations
    automations: [Automation!]!
    automation(id: ID!): Automation
    automationLogs(automationId: ID!): [ExecutionLog!]!
  }

  # Mutations
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
      login(email: String!, password: String!, deviceId: String!, version: String!): AuthPayload!
      selectWorkspace(workspaceId: ID!): AuthPayload!
      logout: Boolean!

    # Workspaces & Invitations
    inviteUser(input: InviteUserInput!): Invitation!
    acceptInvitation(token: String!): Workspace!
    cancelInvitation(invitationId: ID!): Boolean!
    resendInvitation(invitationId: ID!): Invitation!

    # Automations
    runGHLAutomation(input: GHLAutomationInput!): AutomationResponse!
    generateAIContent(input: AIContentInput!): AIContentResponse!
    
    # 2FA 
    submitTwoFactorCode(automationId: ID!, code: String!): TwoFactorResponse!
  }
`;

module.exports = typeDefs; 