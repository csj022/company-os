/**
 * GitHub Integration Health Check System
 * Monitors integration status and reports issues
 */

import { GitHubClient } from './client.js';

/**
 * Health check results structure
 */
class HealthCheckResult {
  constructor(status, details = {}) {
    this.status = status; // 'healthy', 'degraded', 'unhealthy'
    this.timestamp = new Date().toISOString();
    this.details = details;
  }
  
  isHealthy() {
    return this.status === 'healthy';
  }
  
  isDegraded() {
    return this.status === 'degraded';
  }
  
  isUnhealthy() {
    return this.status === 'unhealthy';
  }
}

/**
 * Check GitHub integration health
 */
export async function checkGitHubIntegration(integration, { decrypt }) {
  const checks = {
    authentication: null,
    rateLimit: null,
    apiAccess: null,
    webhooks: null
  };
  
  try {
    const accessToken = decrypt(integration.credentials);
    const client = new GitHubClient(accessToken);
    
    // 1. Authentication check
    checks.authentication = await checkAuthentication(client);
    
    // 2. Rate limit check
    checks.rateLimit = await checkRateLimit(client);
    
    // 3. API access check
    checks.apiAccess = await checkApiAccess(client);
    
    // 4. Webhook status check (if configured)
    if (integration.metadata?.webhooksEnabled) {
      checks.webhooks = await checkWebhooks(client, integration.metadata.repositories || []);
    }
    
    // Determine overall status
    const overallStatus = determineOverallStatus(checks);
    
    return new HealthCheckResult(overallStatus, checks);
    
  } catch (error) {
    console.error('Health check failed:', error);
    return new HealthCheckResult('unhealthy', {
      error: error.message,
      checks
    });
  }
}

/**
 * Check if authentication is valid
 */
async function checkAuthentication(client) {
  try {
    const user = await client.getAuthenticatedUser();
    
    return {
      status: 'healthy',
      user: {
        login: user.data.login,
        name: user.data.name,
        email: user.data.email
      },
      scopes: user.headers['x-oauth-scopes']?.split(', ') || []
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      code: error.status
    };
  }
}

/**
 * Check rate limit status
 */
async function checkRateLimit(client) {
  try {
    const rateLimit = await client.getRateLimit();
    
    const corePercent = (rateLimit.core.remaining / rateLimit.core.limit) * 100;
    const graphqlPercent = (rateLimit.graphql.remaining / rateLimit.graphql.limit) * 100;
    
    let status = 'healthy';
    if (corePercent < 20 || graphqlPercent < 20) {
      status = 'degraded';
    }
    if (corePercent < 5 || graphqlPercent < 5) {
      status = 'unhealthy';
    }
    
    return {
      status,
      core: {
        limit: rateLimit.core.limit,
        remaining: rateLimit.core.remaining,
        percentRemaining: corePercent.toFixed(2),
        reset: rateLimit.core.reset
      },
      graphql: {
        limit: rateLimit.graphql.limit,
        remaining: rateLimit.graphql.remaining,
        percentRemaining: graphqlPercent.toFixed(2),
        reset: rateLimit.graphql.reset
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check API access by making a test request
 */
async function checkApiAccess(client) {
  try {
    const startTime = Date.now();
    await client.listRepositories({ per_page: 1 });
    const responseTime = Date.now() - startTime;
    
    let status = 'healthy';
    if (responseTime > 2000) {
      status = 'degraded';
    }
    if (responseTime > 5000) {
      status = 'unhealthy';
    }
    
    return {
      status,
      responseTime,
      message: `API response in ${responseTime}ms`
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      code: error.status
    };
  }
}

/**
 * Check webhook status for repositories
 */
async function checkWebhooks(client, repositories) {
  const webhookUrl = process.env.GITHUB_WEBHOOK_URL || 'https://app.companyos.com/api/webhooks/github/receive';
  
  const results = {
    total: repositories.length,
    configured: 0,
    missing: 0,
    errors: []
  };
  
  for (const repo of repositories) {
    try {
      const [owner, name] = repo.split('/');
      const webhooks = await client.listWebhooks(owner, name);
      
      const hasWebhook = webhooks.data.some(hook => hook.config.url === webhookUrl);
      
      if (hasWebhook) {
        results.configured++;
      } else {
        results.missing++;
      }
    } catch (error) {
      results.errors.push({
        repository: repo,
        error: error.message
      });
    }
  }
  
  let status = 'healthy';
  if (results.missing > 0) {
    status = 'degraded';
  }
  if (results.errors.length > 0 || results.configured === 0) {
    status = 'unhealthy';
  }
  
  return {
    status,
    ...results
  };
}

/**
 * Determine overall health status from individual checks
 */
function determineOverallStatus(checks) {
  const statuses = Object.values(checks)
    .filter(check => check !== null)
    .map(check => check.status);
  
  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }
  
  if (statuses.some(s => s === 'degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Health monitor class for continuous monitoring
 */
export class GitHubHealthMonitor {
  constructor(dependencies) {
    this.dependencies = dependencies;
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
    this.intervalId = null;
    this.lastResults = new Map();
  }
  
  /**
   * Start continuous health monitoring
   */
  start() {
    console.log('Starting GitHub health monitor');
    
    // Run initial check
    this.runHealthChecks();
    
    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.runHealthChecks();
    }, this.checkInterval);
  }
  
  /**
   * Stop health monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped GitHub health monitor');
    }
  }
  
  /**
   * Run health checks for all organizations
   */
  async runHealthChecks() {
    const { getAllIntegrations } = this.dependencies;
    
    try {
      const integrations = await getAllIntegrations('github');
      
      console.log(`Running health checks for ${integrations.length} GitHub integrations`);
      
      for (const integration of integrations) {
        try {
          const result = await checkGitHubIntegration(integration, this.dependencies);
          
          this.lastResults.set(integration.organizationId, result);
          
          // Alert if status changed to unhealthy or degraded
          await this.handleStatusChange(integration, result);
          
        } catch (error) {
          console.error(`Health check failed for org ${integration.organizationId}:`, error);
        }
      }
      
    } catch (error) {
      console.error('Failed to run health checks:', error);
    }
  }
  
  /**
   * Handle status changes and send alerts
   */
  async handleStatusChange(integration, currentResult) {
    const { alertIntegrationIssue } = this.dependencies;
    
    const previousResult = this.lastResults.get(integration.organizationId);
    
    // Alert on status degradation
    if (previousResult && previousResult.status !== currentResult.status) {
      if (currentResult.isUnhealthy()) {
        await alertIntegrationIssue(integration.organizationId, 'github', {
          severity: 'critical',
          message: 'GitHub integration is unhealthy',
          details: currentResult.details
        });
      } else if (currentResult.isDegraded()) {
        await alertIntegrationIssue(integration.organizationId, 'github', {
          severity: 'warning',
          message: 'GitHub integration is degraded',
          details: currentResult.details
        });
      } else if (previousResult.isUnhealthy() && currentResult.isHealthy()) {
        await alertIntegrationIssue(integration.organizationId, 'github', {
          severity: 'info',
          message: 'GitHub integration recovered',
          details: currentResult.details
        });
      }
    }
    
    // Alert on low rate limit
    if (currentResult.details.rateLimit) {
      const corePercent = parseFloat(currentResult.details.rateLimit.core.percentRemaining);
      if (corePercent < 10) {
        await alertIntegrationIssue(integration.organizationId, 'github', {
          severity: 'warning',
          message: `GitHub API rate limit low: ${corePercent.toFixed(2)}% remaining`,
          details: currentResult.details.rateLimit
        });
      }
    }
  }
  
  /**
   * Get health status for a specific organization
   */
  getHealthStatus(organizationId) {
    return this.lastResults.get(organizationId);
  }
  
  /**
   * Get all health statuses
   */
  getAllHealthStatuses() {
    return Object.fromEntries(this.lastResults);
  }
}

/**
 * Express endpoint to get health status
 */
export async function getHealthStatusEndpoint(req, res, dependencies) {
  const organizationId = req.user?.organizationId || req.params.organizationId;
  
  try {
    const integration = await dependencies.getIntegration(organizationId, 'github');
    
    if (!integration) {
      return res.status(404).json({
        error: 'GitHub integration not found'
      });
    }
    
    const result = await checkGitHubIntegration(integration, dependencies);
    
    res.json({
      organizationId,
      service: 'github',
      ...result
    });
    
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({
      error: 'Failed to get health status',
      message: error.message
    });
  }
}
