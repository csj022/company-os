const eventBus = require('../eventBus');
const eventService = require('../../services/event.service');
const logger = require('../../utils/logger');

/**
 * Initialize GitHub event handlers
 */
const initializeGitHubHandlers = () => {
  // Pull request opened
  eventBus.subscribe('github.pull_request', async (payload) => {
    if (payload.action === 'opened') {
      logger.info(`PR opened: ${payload.pull_request.title}`);
      
      // Log event
      await eventService.logEvent({
        organizationId: payload.organization?.id,
        eventType: 'pull_request.opened',
        eventSource: 'github',
        actorType: 'user',
        actorId: payload.sender.id,
        resourceType: 'pull_request',
        resourceId: payload.pull_request.id,
        metadata: {
          prNumber: payload.pull_request.number,
          repoName: payload.repository.full_name,
          title: payload.pull_request.title,
        },
      });
      
      // TODO: Trigger code review agent
      logger.info('TODO: Spawn CodeReviewAgent for PR analysis');
    }
    
    if (payload.action === 'closed' && payload.pull_request.merged) {
      logger.info(`PR merged: ${payload.pull_request.title}`);
      
      // Log event
      await eventService.logEvent({
        organizationId: payload.organization?.id,
        eventType: 'pull_request.merged',
        eventSource: 'github',
        resourceType: 'pull_request',
        resourceId: payload.pull_request.id,
        metadata: {
          prNumber: payload.pull_request.number,
          repoName: payload.repository.full_name,
        },
      });
      
      // Record metric
      await eventService.recordMetric({
        organizationId: payload.organization?.id,
        metricType: 'pr_merge_time',
        value: calculateMergeTime(payload.pull_request),
        unit: 'hours',
      });
    }
  });
  
  // Push to main branch
  eventBus.subscribe('github.push', async (payload) => {
    const defaultBranch = payload.repository.default_branch;
    const pushedBranch = payload.ref.replace('refs/heads/', '');
    
    if (pushedBranch === defaultBranch) {
      logger.info(`Push to ${defaultBranch}: ${payload.repository.full_name}`);
      
      // Log event
      await eventService.logEvent({
        organizationId: payload.organization?.id,
        eventType: 'push.main_branch',
        eventSource: 'github',
        actorType: 'user',
        actorId: payload.sender.id,
        resourceType: 'repository',
        metadata: {
          repoName: payload.repository.full_name,
          branch: pushedBranch,
          commitSha: payload.after,
        },
      });
      
      // TODO: Trigger deployment
      logger.info('TODO: Trigger deployment pipeline');
    }
  });
  
  logger.info('GitHub event handlers initialized');
};

/**
 * Calculate PR merge time in hours
 */
const calculateMergeTime = (pr) => {
  const created = new Date(pr.created_at);
  const merged = new Date(pr.merged_at);
  return (merged - created) / (1000 * 60 * 60); // hours
};

module.exports = { initializeGitHubHandlers };
