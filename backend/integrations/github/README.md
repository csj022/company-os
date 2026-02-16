# GitHub Integration Module

Complete GitHub integration for CompanyOS with OAuth 2.0, webhooks, and comprehensive API support.

## Features

✅ **OAuth 2.0 Authentication** - Secure connection flow with CSRF protection  
✅ **Webhook Events** - Real-time processing of 8 event types  
✅ **GraphQL & REST APIs** - Optimized queries for detailed data  
✅ **Rate Limiting** - Automatic throttling and retry logic  
✅ **Health Monitoring** - Continuous status checks with alerts  
✅ **Data Synchronization** - Initial + incremental sync  
✅ **Encrypted Storage** - AES-256-GCM encryption for credentials  
✅ **Agent Integration** - Spawns AI agents for automation  

## Quick Start

```javascript
import express from 'express';
import { initializeGitHubIntegration } from './integrations/github/index.js';

const app = express();

initializeGitHubIntegration(app, {
  eventBus,
  storeIntegration,
  getIntegration,
  removeIntegration,
  encrypt,
  decrypt,
  spawnAgent,
  // ... other dependencies
});

app.listen(3000);
```

## File Structure

```
github/
├── index.js       # Main entry point & route setup
├── client.js      # Octokit wrapper with rate limiting
├── oauth.js       # OAuth 2.0 flow
├── webhooks.js    # Webhook receiver & verification
├── events.js      # Event handlers (PR, push, issues, etc.)
├── sync.js        # Data synchronization
├── health.js      # Health monitoring
├── queries.js     # GraphQL queries
└── crypto.js      # Encryption utilities
```

## Events Handled

- `pull_request` - PR opened, closed, synchronized, etc.
- `pull_request_review` - Reviews submitted
- `push` - Commits pushed to branches
- `issues` - Issue opened, closed, edited
- `issue_comment` - Comments on issues/PRs
- `deployment` - Deployment created
- `deployment_status` - Deployment status changed
- `release` - Release published

## Dependencies Required

All dependencies are injected into `initializeGitHubIntegration()`:

```javascript
{
  // Event Bus
  eventBus: {
    publish(event, data),
    subscribe(event, handler)
  },
  
  // Integration Storage
  storeIntegration(data),
  getIntegration(organizationId, service),
  removeIntegration(organizationId, service),
  getAllIntegrations(service),
  
  // Encryption
  encrypt(text),
  decrypt(encryptedText),
  
  // Agent System
  spawnAgent(agentType, config),
  
  // Data Storage
  upsertRepository(data),
  upsertPullRequest(data),
  upsertIssue(data),
  upsertCommit(data),
  upsertDeployment(data),
  updateDeployment(id, data),
  upsertRelease(data),
  
  // Alerts
  alertIntegrationIssue(organizationId, service, issue)
}
```

## Environment Variables

Required in `.env`:

```bash
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
GITHUB_REDIRECT_URI=https://app.companyos.com/api/integrations/github/callback
GITHUB_WEBHOOK_SECRET=xxx
GITHUB_WEBHOOK_URL=https://app.companyos.com/api/webhooks/github/receive
ENCRYPTION_KEY=64_character_hex_key
```

## API Endpoints

### OAuth
- `GET /api/integrations/github/connect` - Start OAuth flow
- `GET /api/integrations/github/callback` - OAuth callback
- `DELETE /api/integrations/github/disconnect` - Disconnect integration
- `GET /api/integrations/github/status` - Get status

### Webhooks
- `POST /api/webhooks/github/receive` - Receive webhook events

### Data
- `POST /api/integrations/github/sync` - Manual sync
- `GET /api/integrations/github/health` - Health status
- `GET /api/integrations/github/repositories` - List repositories
- `GET /api/integrations/github/repositories/:owner/:repo/pulls` - List PRs
- `GET /api/integrations/github/repositories/:owner/:repo/pulls/:number` - PR details

## Usage Examples

### Create Client

```javascript
import { createGitHubClient } from './integrations/github/index.js';

const client = await createGitHubClient(organizationId, {
  getIntegration,
  decrypt
});

// Use client
const repos = await client.listRepositories();
```

### Execute GraphQL Query

```javascript
import { queries } from './integrations/github/index.js';

const client = await createGitHubClient(organizationId, { getIntegration, decrypt });

const prDetails = await client.query(queries.GET_PULL_REQUEST_DETAILS, {
  owner: 'myorg',
  name: 'myrepo',
  number: 42
});
```

### Verify Webhook Signature

```javascript
import { verifyGitHubSignature } from './integrations/github/webhooks.js';

const signature = req.headers['x-hub-signature-256'];
const isValid = verifyGitHubSignature(req.body, signature, webhookSecret);
```

### Check Health

```javascript
import { checkGitHubIntegration } from './integrations/github/health.js';

const result = await checkGitHubIntegration(integration, { decrypt });

console.log(result.status); // 'healthy', 'degraded', or 'unhealthy'
console.log(result.details);
```

## Rate Limiting

The client automatically handles rate limiting:

- Uses `@octokit/plugin-throttling` for automatic retries
- Monitors rate limit in health checks
- Alerts when quota drops below 20%
- Retry up to 3 times with backoff

Current rate limit:
```javascript
const rateLimit = await client.getRateLimit();
console.log(rateLimit.core.remaining); // e.g., 4850 / 5000
```

## Security Features

1. **AES-256-GCM Encryption** - All tokens encrypted at rest
2. **HMAC SHA256 Verification** - All webhooks verified
3. **CSRF Protection** - OAuth state validation
4. **Secure Comparison** - Timing-attack resistant
5. **Token Scopes** - Minimal required permissions

## Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test webhook locally
gh webhook forward --repo=owner/repo \
  --url=http://localhost:3000/api/webhooks/github/receive \
  --events=pull_request,push
```

## Error Handling

Custom error classes:

```javascript
import { RateLimitError, AuthenticationError } from './integrations/github/client.js';

try {
  await client.listRepositories();
} catch (error) {
  if (error instanceof RateLimitError) {
    // Rate limit exceeded
  } else if (error instanceof AuthenticationError) {
    // Token invalid/expired
  }
}
```

## Health Monitoring

Health monitor runs every 5 minutes checking:

1. **Authentication** - Token validity
2. **Rate Limit** - Quota usage
3. **API Access** - Response times
4. **Webhooks** - Configuration status

Get current health:
```javascript
const status = healthMonitor.getHealthStatus(organizationId);
```

## License

Part of CompanyOS. See main project LICENSE.
