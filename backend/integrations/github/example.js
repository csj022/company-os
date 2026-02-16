/**
 * Example usage of GitHub integration
 * Demonstrates how to set up the integration with a minimal Express app
 */

import express from 'express';
import dotenv from 'dotenv';
import { initializeGitHubIntegration, createGitHubClient } from './index.js';
import { encrypt, decrypt, generateEncryptionKey } from './crypto.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

// Simple in-memory storage for demonstration
// In production, use a real database (PostgreSQL, MongoDB, etc.)
const integrations = new Map();
const repositories = new Map();
const pullRequests = new Map();

// Simple event bus implementation
const eventBus = {
  handlers: new Map(),
  
  async publish(event, data) {
    const handlers = this.handlers.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }
  },
  
  subscribe(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }
};

// Dependency implementations
const dependencies = {
  // Event bus
  eventBus,
  
  // Integration storage
  async storeIntegration(data) {
    const id = `${data.organizationId}:${data.service}`;
    integrations.set(id, {
      ...data,
      id,
      createdAt: new Date(),
      lastSyncAt: null
    });
    console.log(`Stored integration: ${id}`);
  },
  
  async getIntegration(organizationId, service) {
    const id = `${organizationId}:${service}`;
    return integrations.get(id);
  },
  
  async removeIntegration(organizationId, service) {
    const id = `${organizationId}:${service}`;
    integrations.delete(id);
    console.log(`Removed integration: ${id}`);
  },
  
  async getAllIntegrations(service) {
    return Array.from(integrations.values()).filter(i => i.service === service);
  },
  
  // Encryption
  encrypt,
  decrypt,
  
  // Agent system (mock implementation)
  async spawnAgent(agentType, config) {
    console.log(`[AGENT] Spawning ${agentType} with config:`, config);
    // In production, this would spawn an actual agent
    return {
      id: Math.random().toString(36),
      type: agentType,
      config
    };
  },
  
  // Data storage
  async upsertRepository(data) {
    const id = `${data.organizationId}:${data.fullName}`;
    repositories.set(id, { ...data, id });
    console.log(`Stored repository: ${data.fullName}`);
  },
  
  async upsertPullRequest(data) {
    const id = `${data.organizationId}:${data.repositoryFullName}:${data.number}`;
    pullRequests.set(id, { ...data, id });
    console.log(`Stored PR: ${data.repositoryFullName}#${data.number}`);
  },
  
  async upsertIssue(data) {
    console.log(`Stored issue: ${data.repositoryFullName}#${data.number}`);
  },
  
  async upsertCommit(data) {
    console.log(`Stored commit: ${data.sha.substring(0, 7)}`);
  },
  
  async upsertDeployment(data) {
    console.log(`Stored deployment: ${data.environment}`);
  },
  
  async updateDeployment(id, data) {
    console.log(`Updated deployment ${id}:`, data);
  },
  
  async upsertRelease(data) {
    console.log(`Stored release: ${data.tagName}`);
  },
  
  // Alerts
  async alertIntegrationIssue(organizationId, service, issue) {
    console.log(`[ALERT] ${organizationId}/${service}:`, issue);
  }
};

// Add session middleware (simplified - use express-session in production)
app.use((req, res, next) => {
  // Mock user session
  req.user = {
    organizationId: 'demo-org-123'
  };
  req.session = {};
  next();
});

// Add raw body parser for webhook signature verification
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/github/receive') {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      req.rawBody = data;
      req.body = JSON.parse(data || '{}');
      next();
    });
  } else {
    next();
  }
});

// Initialize GitHub integration
console.log('Initializing GitHub integration...');
initializeGitHubIntegration(app, dependencies);

// Additional example endpoints

// Home page
app.get('/', (req, res) => {
  res.send(`
    <h1>CompanyOS GitHub Integration Example</h1>
    <ul>
      <li><a href="/api/integrations/github/connect">Connect GitHub</a></li>
      <li><a href="/api/integrations/github/status">View Status</a></li>
      <li><a href="/api/integrations/github/health">Check Health</a></li>
      <li><a href="/stats">View Stats</a></li>
    </ul>
  `);
});

// Stats page
app.get('/stats', (req, res) => {
  res.json({
    integrations: integrations.size,
    repositories: repositories.size,
    pullRequests: pullRequests.size,
    integrationsList: Array.from(integrations.values()).map(i => ({
      organizationId: i.organizationId,
      service: i.service,
      status: i.status,
      createdAt: i.createdAt,
      lastSyncAt: i.lastSyncAt
    }))
  });
});

// Example: Get PR details using GraphQL
app.get('/api/example/pr/:owner/:repo/:number', async (req, res) => {
  try {
    const { owner, repo, number } = req.params;
    const organizationId = req.user.organizationId;
    
    const client = await createGitHubClient(organizationId, {
      getIntegration: dependencies.getIntegration,
      decrypt: dependencies.decrypt
    });
    
    const { queries } = await import('./queries.js');
    const prDetails = await client.query(queries.GET_PULL_REQUEST_DETAILS, {
      owner,
      name: repo,
      number: parseInt(number)
    });
    
    res.json(prDetails);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 GitHub Integration Example Server Running

Server:    http://localhost:${PORT}
Connect:   http://localhost:${PORT}/api/integrations/github/connect
Status:    http://localhost:${PORT}/api/integrations/github/status
Health:    http://localhost:${PORT}/api/integrations/github/health
Stats:     http://localhost:${PORT}/stats

Webhook:   http://localhost:${PORT}/api/webhooks/github/receive
           (Use ngrok or similar to expose for GitHub webhooks)

Environment:
- GITHUB_CLIENT_ID: ${process.env.GITHUB_CLIENT_ID ? '✓' : '✗'}
- GITHUB_CLIENT_SECRET: ${process.env.GITHUB_CLIENT_SECRET ? '✓' : '✗'}
- GITHUB_WEBHOOK_SECRET: ${process.env.GITHUB_WEBHOOK_SECRET ? '✓' : '✗'}
- ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? '✓' : '✗'}

To generate encryption key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  `);
  
  if (!process.env.ENCRYPTION_KEY) {
    console.log('\n⚠️  WARNING: ENCRYPTION_KEY not set!');
    console.log('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
});

export default app;
