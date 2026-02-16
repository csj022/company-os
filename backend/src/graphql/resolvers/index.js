const organizationService = require('../../services/organization.service');
const integrationService = require('../../services/integration.service');
const eventService = require('../../services/event.service');
const { GraphQLError } = require('graphql');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const resolvers = {
  Query: {
    // Organizations
    organization: async (_, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await organizationService.getById(id);
    },
    
    organizations: async (_, __, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await organizationService.getUserOrganizations(context.user.id);
    },
    
    // Integrations
    integrations: async (_, __, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await integrationService.getAll(context.user.organizationId);
    },
    
    integration: async (_, { service }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      const integration = await integrationService.get(context.user.organizationId, service);
      
      // Remove credentials before sending
      if (integration) {
        delete integration.credentials;
      }
      
      return integration;
    },
    
    // Events
    events: async (_, { filters }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await eventService.getEvents(context.user.organizationId, filters || {});
    },
    
    // Metrics
    metrics: async (_, { metricType, timeRange }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await eventService.getMetrics(
        context.user.organizationId,
        metricType,
        timeRange || '24h'
      );
    },
  },
  
  Mutation: {
    // Organizations
    createOrganization: async (_, { input }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      return await organizationService.create({
        ...input,
        userId: context.user.id,
      });
    },
    
    updateOrganization: async (_, { id, input }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      if (!['owner', 'admin'].includes(context.user.role)) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return await organizationService.update(id, input);
    },
    
    // Organization members
    addOrganizationMember: async (_, { organizationId, userId, role }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      if (!['owner', 'admin'].includes(context.user.role)) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return await organizationService.addMember(organizationId, userId, role.toLowerCase());
    },
    
    updateMemberRole: async (_, { organizationId, userId, role }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      if (!['owner', 'admin'].includes(context.user.role)) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      return await organizationService.updateMemberRole(organizationId, userId, role.toLowerCase());
    },
    
    removeMember: async (_, { organizationId, userId }, context) => {
      if (!context.user) {
        throw new GraphQLError('Unauthorized', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      
      if (!['owner', 'admin'].includes(context.user.role)) {
        throw new GraphQLError('Forbidden', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      
      await organizationService.removeMember(organizationId, userId);
      return true;
    },
  },
  
  Subscription: {
    eventCreated: {
      subscribe: (_, { organizationId }) => {
        return pubsub.asyncIterator([`EVENT_CREATED_${organizationId}`]);
      },
    },
    
    deploymentStatusChanged: {
      subscribe: (_, { projectId }) => {
        const topic = projectId 
          ? `DEPLOYMENT_${projectId}` 
          : 'DEPLOYMENT_ALL';
        return pubsub.asyncIterator([topic]);
      },
    },
    
    pullRequestUpdated: {
      subscribe: (_, { repoId }) => {
        const topic = repoId 
          ? `PR_${repoId}` 
          : 'PR_ALL';
        return pubsub.asyncIterator([topic]);
      },
    },
    
    agentTaskCreated: {
      subscribe: (_, { agentId }) => {
        const topic = agentId 
          ? `AGENT_TASK_${agentId}` 
          : 'AGENT_TASK_ALL';
        return pubsub.asyncIterator([topic]);
      },
    },
  },
  
  // Field resolvers
  Organization: {
    members: async (parent) => {
      return await organizationService.getMembers(parent.id);
    },
    
    integrations: async (parent) => {
      return await integrationService.getAll(parent.id);
    },
  },
};

module.exports = resolvers;
