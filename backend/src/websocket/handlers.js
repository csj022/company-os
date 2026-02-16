const eventBus = require('../events/eventBus');
const { emitToChannel } = require('./server');
const logger = require('../utils/logger');

/**
 * Initialize WebSocket event handlers
 * Bridges event bus to WebSocket clients
 */
const initializeWebSocketHandlers = (io) => {
  // Deployment events
  eventBus.subscribe('vercel.deployment.created', (data) => {
    emitToChannel(io, data.team?.id, 'deployments', 'deployment.created', data.deployment);
  });
  
  eventBus.subscribe('vercel.deployment.ready', (data) => {
    emitToChannel(io, data.team?.id, 'deployments', 'deployment.ready', data.deployment);
  });
  
  eventBus.subscribe('vercel.deployment.error', (data) => {
    emitToChannel(io, data.team?.id, 'deployments', 'deployment.error', data.deployment);
  });
  
  // Pull request events
  eventBus.subscribe('github.pull_request', (data) => {
    const orgId = data.organization?.id;
    const repoId = data.repository?.id;
    
    emitToChannel(io, orgId, 'pull_requests', 'pull_request.updated', data.pull_request);
    
    if (repoId) {
      emitToChannel(io, orgId, `pull_requests:${repoId}`, 'pull_request.updated', data.pull_request);
    }
  });
  
  // Agent task events
  eventBus.subscribe('agent.task.started', (data) => {
    emitToChannel(io, data.organizationId, 'agent_tasks', 'agent_task.started', data.task);
  });
  
  eventBus.subscribe('agent.task.completed', (data) => {
    emitToChannel(io, data.organizationId, 'agent_tasks', 'agent_task.completed', data.task);
  });
  
  eventBus.subscribe('agent.task.needs_approval', (data) => {
    emitToChannel(io, data.organizationId, 'agent_tasks', 'agent_task.needs_approval', data.task);
  });
  
  // Generic events
  eventBus.subscribe('event.created', (data) => {
    emitToChannel(io, data.organizationId, 'events', 'event.created', data);
  });
  
  logger.info('WebSocket event handlers initialized');
};

module.exports = { initializeWebSocketHandlers };
