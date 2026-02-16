/**
 * GitHub Integration Module
 * Main entry point for GitHub integration functionality
 */

import { GitHubClient, RateLimitError, AuthenticationError } from './client.js';
import { 
  initiateOAuthFlow, 
  handleOAuthCallback, 
  disconnectIntegration,
  getIntegrationStatus 
} from './oauth.js';
import { 
  receiveWebhook, 
  setupWebhook, 
  removeWebhook,
  verifyGitHubSignature 
} from './webhooks.js';
import { 
  initializeEventHandlers,
  processEvent 
} from './events.js';
import { 
  syncGitHubData, 
  incrementalSync, 
  scheduledSync,
  syncPullRequests,
  syncCommits 
} from './sync.js';
import { 
  checkGitHubIntegration,
  GitHubHealthMonitor,
  getHealthStatusEndpoint 
} from './health.js';
import * as queries from './queries.js';

/**
 * Initialize GitHub integration with Express app
 */
export function initializeGitHubIntegration(app, dependencies) {
  const {
    eventBus,
    storeIntegration,
    getIntegration,
    removeIntegration,
    encrypt,
    decrypt,
    spawnAgent,
    upsertRepository,
    upsertPullRequest,
    upsertIssue,
    upsertCommit,
    upsertDeployment,
    updateDeployment,
    upsertRelease,
    getAllIntegrations,
    alertIntegrationIssue
  } = dependencies;
  
  // Initialize event handlers
  initializeEventHandlers({
    eventBus,
    spawnAgent,
    upsertPullRequest,
    upsertIssue,
    upsertDeployment,
    updateDeployment,
    upsertRelease
  });
  
  // OAuth endpoints
  app.get('/api/integrations/github/connect', (req, res) => {
    initiateOAuthFlow(req, res);
  });
  
  app.get('/api/integrations/github/callback', async (req, res) => {
    await handleOAuthCallback(req, res, { storeIntegration, encrypt });
  });
  
  app.delete('/api/integrations/github/disconnect', async (req, res) => {
    await disconnectIntegration(req, res, { removeIntegration });
  });
  
  app.get('/api/integrations/github/status', async (req, res) => {
    await getIntegrationStatus(req, res, { getIntegration, decrypt });
  });
  
  // Webhook endpoint
  app.post('/api/webhooks/github/receive', async (req, res) => {
    await receiveWebhook(req, res, { eventBus });
  });
  
  // Sync endpoints
  app.post('/api/integrations/github/sync', async (req, res) => {
    const organizationId = req.user?.organizationId;
    
    try {
      const stats = await syncGitHubData(organizationId, {
        getIntegration,
        decrypt,
        upsertRepository,
        upsertPullRequest
      });
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        error: 'Sync failed',
        message: error.message
      });
    }
  });
  
  // Health check endpoint
  app.get('/api/integrations/github/health', async (req, res) => {
    await getHealthStatusEndpoint(req, res, {
      getIntegration,
      decrypt
    });
  });
  
  // Repository endpoints
  app.get('/api/integrations/github/repositories', async (req, res) => {
    const organizationId = req.user?.organizationId;
    
    try {
      const integration = await getIntegration(organizationId, 'github');
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      const client = new GitHubClient(decrypt(integration.credentials));
      const repos = await client.listRepositories();
      
      res.json({
        repositories: repos.data
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch repositories',
        message: error.message
      });
    }
  });
  
  // Pull request endpoints
  app.get('/api/integrations/github/repositories/:owner/:repo/pulls', async (req, res) => {
    const { owner, repo } = req.params;
    const { state = 'open' } = req.query;
    const organizationId = req.user?.organizationId;
    
    try {
      const integration = await getIntegration(organizationId, 'github');
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      const client = new GitHubClient(decrypt(integration.credentials));
      const pulls = await client.listPullRequests(owner, repo, state);
      
      res.json({
        pullRequests: pulls.data
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch pull requests',
        message: error.message
      });
    }
  });
  
  app.get('/api/integrations/github/repositories/:owner/:repo/pulls/:number', async (req, res) => {
    const { owner, repo, number } = req.params;
    const organizationId = req.user?.organizationId;
    
    try {
      const integration = await getIntegration(organizationId, 'github');
      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      
      const client = new GitHubClient(decrypt(integration.credentials));
      
      // Use GraphQL for detailed PR info
      const prDetails = await client.query(queries.GET_PULL_REQUEST_DETAILS, {
        owner,
        name: repo,
        number: parseInt(number)
      });
      
      res.json({
        pullRequest: prDetails.repository.pullRequest
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch pull request details',
        message: error.message
      });
    }
  });
  
  // Start health monitor
  const healthMonitor = new GitHubHealthMonitor({
    getAllIntegrations,
    decrypt,
    alertIntegrationIssue
  });
  
  healthMonitor.start();
  
  // Schedule periodic sync (every 5 minutes)
  const syncInterval = setInterval(async () => {
    await scheduledSync({
      getAllOrganizationsWithIntegration: async (service) => {
        const integrations = await getAllIntegrations(service);
        return integrations.map(i => ({ id: i.organizationId }));
      },
      getIntegration,
      decrypt,
      upsertRepository,
      upsertPullRequest,
      getLastSyncTime: async (orgId, service) => {
        const integration = await getIntegration(orgId, service);
        return integration?.lastSyncAt;
      }
    });
  }, 5 * 60 * 1000);
  
  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    healthMonitor.stop();
    clearInterval(syncInterval);
  });
  
  console.log('GitHub integration initialized');
  
  return {
    healthMonitor,
    syncInterval
  };
}

/**
 * Create a GitHub client for an organization
 */
export async function createGitHubClient(organizationId, { getIntegration, decrypt }) {
  const integration = await getIntegration(organizationId, 'github');
  
  if (!integration || integration.status !== 'active') {
    throw new Error('GitHub integration not found or inactive');
  }
  
  const accessToken = decrypt(integration.credentials);
  return new GitHubClient(accessToken);
}

/**
 * Export all components
 */
export {
  GitHubClient,
  RateLimitError,
  AuthenticationError,
  initiateOAuthFlow,
  handleOAuthCallback,
  disconnectIntegration,
  getIntegrationStatus,
  receiveWebhook,
  setupWebhook,
  removeWebhook,
  verifyGitHubSignature,
  initializeEventHandlers,
  processEvent,
  syncGitHubData,
  incrementalSync,
  scheduledSync,
  syncPullRequests,
  syncCommits,
  checkGitHubIntegration,
  GitHubHealthMonitor,
  getHealthStatusEndpoint,
  queries
};

export default {
  initialize: initializeGitHubIntegration,
  createClient: createGitHubClient
};
