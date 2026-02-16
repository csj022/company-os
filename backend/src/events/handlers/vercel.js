const eventBus = require('../eventBus');
const eventService = require('../../services/event.service');
const logger = require('../../utils/logger');

/**
 * Initialize Vercel event handlers
 */
const initializeVercelHandlers = () => {
  // Deployment created
  eventBus.subscribe('vercel.deployment.created', async (payload) => {
    logger.info(`Deployment created: ${payload.deployment.url}`);
    
    // Log event
    await eventService.logEvent({
      organizationId: payload.team?.id,
      eventType: 'deployment.created',
      eventSource: 'vercel',
      resourceType: 'deployment',
      resourceId: payload.deployment.id,
      metadata: {
        projectName: payload.deployment.name,
        url: payload.deployment.url,
        environment: payload.deployment.target,
      },
    });
  });
  
  // Deployment ready
  eventBus.subscribe('vercel.deployment.ready', async (payload) => {
    logger.info(`Deployment ready: ${payload.deployment.url}`);
    
    // Log event
    await eventService.logEvent({
      organizationId: payload.team?.id,
      eventType: 'deployment.ready',
      eventSource: 'vercel',
      resourceType: 'deployment',
      resourceId: payload.deployment.id,
      metadata: {
        projectName: payload.deployment.name,
        url: payload.deployment.url,
      },
    });
    
    // Record deployment frequency metric
    await eventService.recordMetric({
      organizationId: payload.team?.id,
      metricType: 'deployment_frequency',
      value: 1,
      unit: 'count',
      dimensions: {
        project: payload.deployment.name,
        environment: payload.deployment.target,
      },
    });
    
    // TODO: Trigger monitoring agent
    logger.info('TODO: Spawn MonitoringAgent for deployment health check');
  });
  
  // Deployment error
  eventBus.subscribe('vercel.deployment.error', async (payload) => {
    logger.error(`Deployment failed: ${payload.deployment.url}`);
    
    // Log event
    await eventService.logEvent({
      organizationId: payload.team?.id,
      eventType: 'deployment.error',
      eventSource: 'vercel',
      resourceType: 'deployment',
      resourceId: payload.deployment.id,
      metadata: {
        projectName: payload.deployment.name,
        error: payload.deployment.errorMessage,
      },
    });
    
    // TODO: Send alert
    logger.info('TODO: Send alert for deployment failure');
  });
  
  logger.info('Vercel event handlers initialized');
};

module.exports = { initializeVercelHandlers };
