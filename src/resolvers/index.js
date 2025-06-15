const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

// Import resolvers
const authResolvers = require('./authResolvers');
const workspaceResolvers = require('./workspaceResolvers');
const automationResolvers = require('./automationResolvers');
const invitationResolvers = require('./invitationResolvers');

// Custom scalar types
const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value) {
    return value instanceof Date ? value.toISOString() : null;
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch (error) {
        return null;
      }
    }
    if (ast.kind === Kind.OBJECT) {
      return ast.value;
    }
    return null;
  },
});

const resolvers = {
  Date: dateScalar,
  JSON: jsonScalar,

  Query: {
    ...authResolvers.Query,
    ...workspaceResolvers.Query,
    ...automationResolvers.Query,
    ...invitationResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...workspaceResolvers.Mutation,
    ...automationResolvers.Mutation,
    ...invitationResolvers.Mutation,
  }
};

module.exports = { resolvers }; 