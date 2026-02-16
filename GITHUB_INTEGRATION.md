# GitHub Integration Documentation

Complete implementation of GitHub integration for CompanyOS following the specifications in `INTEGRATIONS.md`.

## Overview

The GitHub integration provides comprehensive version control and code review capabilities including:

- OAuth 2.0 authentication
- Repository synchronization
- Pull request monitoring and automation
- Webhook event processing
- Real-time deployment triggers
- Rate limiting and retry logic
- Health monitoring system

## Architecture

```
backend/integrations/github/
├── index.js          # Main entry point, Express route setup
├── client.js         # GitHub API client wrapper (Octokit)
├── oauth.js          # OAuth 2.0 flow implementation
├── webhooks.js       # Webhook receiver and verification
├── events.js         # Event handlers for GitHub events
├── sync.js           # Repository and data synchronization
├── health.js         # Health monitoring system
├── queries.js        # GraphQL queries for detailed data
└── crypto.js         # Encryption utilities for credentials
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

Dependencies installed:
- `@octokit/rest` - GitHub REST API client
- `@octokit/webhooks` - Webhook event handling
- `@octokit/graphql` - GraphQL API client
- `@octokit/plugin-throttling` - Automatic rate limiting
- `express` - Web framework
- `dotenv` - Environment variable management

### 2. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in:
   - Application name: `CompanyOS`
   - Homepage URL: `https://app.companyos.com`
   - Authorization callback URL: `https://app.companyos.com/api/integrations/github/callback`
4. Save and copy the Client ID and Client Secret

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Generate encryption key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Initialize Integration

```javascript
import express from 'express';
import { initializeGitHubIntegration } from './integrations/github/index.js';
import { encrypt, decrypt } from './integrations/github/crypto.js';

const app = express();

// Required dependencies
const dependencies = {
  eventBus,           // Your event bus implementation
  storeIntegration,   // Store integration in database
  getIntegration,     // Retrieve integration from database
  removeIntegration,  // Remove integration from database
  encrypt,            // Encryption function
  decrypt,            // Decryption function
  spawnAgent,         // Spawn AI agent
  upsertRepository,   // Store/update repository
  upsertPullRequest,  // Store/update pull request
  upsertIssue,        // Store/update issue
  upsertCommit,       // Store/update commit
  upsertDeployment,   // Store/update deployment
  updateDeployment,   // Update deployment status
  upsertRelease,      // Store/update release
  getAllIntegrations, // Get all integrations
  alertIntegrationIssue // Send alert
};

initializeGitHubIntegration(app, dependencies);
```

## API Endpoints

### OAuth Flow

**Connect GitHub Account**
```
GET /api/integrations/github/connect
```
Redirects to GitHub OAuth authorization page.

**OAuth Callback**
```
GET /api/integrations/github/callback?code=xxx&state=xxx
```
Handles OAuth callback, stores credentials, redirects to dashboard.

**Disconnect**
```
DELETE /api/integrations/github/disconnect
```
Removes GitHub integration for current organization.

**Get Status**
```
GET /api/integrations/github/status
```
Returns integration status and metadata (no credentials).

### Webhooks

**Receive Webhook**
```
POST /api/webhooks/github/receive
```
Receives webhook events from GitHub. Verifies signature and processes events.

Headers required:
- `x-hub-signature-256`: HMAC SHA256 signature
- `x-github-event`: Event type
- `x-github-delivery`: Delivery ID

### Sync

**Trigger Manual Sync**
```
POST /api/integrations/github/sync
```
Manually trigger synchronization of all repositories and pull requests.

Response:
```json
{
  "success": true,
  "stats": {
    "repositories": 15,
    "pullRequests": 42,
    "errors": []
  }
}
```

### Health

**Get Health Status**
```
GET /api/integrations/github/health
```
Returns detailed health status of the GitHub integration.

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-02-12T12:00:00Z",
  "details": {
    "authentication": {
      "status": "healthy",
      "user": { "login": "username" },
      "scopes": ["repo", "read:user"]
    },
    "rateLimit": {
      "status": "healthy",
      "core": {
        "remaining": 4850,
        "limit": 5000,
        "percentRemaining": "97.00"
      }
    }
  }
}
```

### Repositories

**List Repositories**
```
GET /api/integrations/github/repositories
```
Returns all repositories accessible with current GitHub token.

**Get Pull Requests**
```
GET /api/integrations/github/repositories/:owner/:repo/pulls?state=open
```
Returns pull requests for a specific repository.

**Get Pull Request Details**
```
GET /api/integrations/github/repositories/:owner/:repo/pulls/:number
```
Returns detailed PR information using GraphQL.

## Webhook Events

The integration handles the following GitHub webhook events:

### pull_request
Triggered when a pull request is opened, closed, synchronized, etc.

Actions handled:
- `opened` - Spawns CodeReviewAgent for initial analysis
- `synchronize` - Reviews new commits
- `closed` - Sends notification if merged
- `ready_for_review` - Triggers full review

### pull_request_review
Triggered when a review is submitted on a pull request.

Actions handled:
- `submitted` with `approved` - Notifies of approval
- `submitted` with `changes_requested` - Notifies author

### push
Triggered when commits are pushed to a branch.

Actions handled:
- Push to default branch - Triggers deployment
- All pushes - Analyzes commits for patterns

### issues
Triggered when an issue is opened, closed, edited, etc.

Actions handled:
- `opened` - Spawns IssueTriageAgent for classification

### issue_comment
Triggered when a comment is added to an issue or PR.

Actions handled:
- Comments mentioning bot - Processes commands
- Comments with slash commands - Executes commands

### deployment
Triggered when a deployment is created.

Actions handled:
- Spawns DeploymentMonitorAgent to track deployment

### deployment_status
Triggered when deployment status changes.

Actions handled:
- `success` - Sends success notification
- `failure` or `error` - Sends alert

### release
Triggered when a release is published.

Actions handled:
- `published` - Announces release

## GraphQL Queries

The integration includes optimized GraphQL queries for:

- **GET_PULL_REQUEST_DETAILS** - Complete PR info including commits, reviews, files
- **GET_REPOSITORY_WITH_PRS** - Repository with recent PRs
- **GET_ORG_REPOSITORIES** - All organization repositories
- **GET_COMMIT_DETAILS** - Commit with associated PRs
- **SEARCH_PULL_REQUESTS** - Search PRs by criteria
- **GET_DEPLOYMENTS** - Repository deployment history
- **GET_VIEWER_INFO** - Authenticated user information
- **GET_REPOSITORY_ISSUES** - Repository issues

Example usage:
```javascript
import { createGitHubClient } from './integrations/github/index.js';
import { GET_PULL_REQUEST_DETAILS } from './integrations/github/queries.js';

const client = await createGitHubClient(organizationId, { getIntegration, decrypt });

const prDetails = await client.query(GET_PULL_REQUEST_DETAILS, {
  owner: 'companyos',
  name: 'main-app',
  number: 42
});
```

## Rate Limiting

GitHub API limits:
- **REST API**: 5,000 requests/hour (authenticated)
- **GraphQL API**: 5,000 points/hour
- **Search API**: 30 requests/minute

The integration implements:

1. **Automatic throttling** via Octokit plugin
2. **Retry logic** - Retries up to 3 times on rate limit
3. **Rate limit monitoring** - Tracks remaining quota
4. **Health alerts** - Warns when quota below 20%

Rate limit status checked in health monitoring:
```javascript
{
  "core": {
    "limit": 5000,
    "remaining": 4850,
    "percentRemaining": "97.00",
    "reset": "2024-02-12T13:00:00Z"
  }
}
```

## Security

### Credential Storage

All GitHub access tokens are encrypted using AES-256-GCM:

```javascript
import { encrypt, decrypt } from './integrations/github/crypto.js';

// Store token
const encryptedToken = encrypt(accessToken);
await storeIntegration({
  organizationId,
  service: 'github',
  credentials: encryptedToken
});

// Retrieve token
const integration = await getIntegration(organizationId, 'github');
const accessToken = decrypt(integration.credentials);
```

### Webhook Verification

All webhooks are verified using HMAC SHA256:

```javascript
import { verifyGitHubSignature } from './integrations/github/webhooks.js';

const signature = req.headers['x-hub-signature-256'];
const isValid = verifyGitHubSignature(req.body, signature);
```

### OAuth State Protection

CSRF protection using secure random state:
- State generated with `crypto.randomBytes(32)`
- Stored in session/memory with timestamp
- Verified on callback
- Expires after 10 minutes

## Health Monitoring

The `GitHubHealthMonitor` class runs continuous health checks:

**Checks performed:**
1. **Authentication** - Validates token and scopes
2. **Rate Limit** - Monitors quota usage
3. **API Access** - Tests response time
4. **Webhooks** - Verifies webhook configuration

**Monitoring frequency:** Every 5 minutes

**Health statuses:**
- `healthy` - All checks passing
- `degraded` - Some issues (low rate limit, slow response)
- `unhealthy` - Critical issues (authentication failed, no API access)

**Alerts sent when:**
- Status changes from healthy to degraded/unhealthy
- Rate limit drops below 10%
- Integration recovers from unhealthy state

## Data Synchronization

### Initial Sync

Full sync triggered when integration is first connected:
1. Fetch all repositories
2. For each repository:
   - Store repository metadata
   - Fetch open pull requests
   - Fetch recently closed PRs (last 7 days)
   - Set up webhooks
3. Store sync statistics

### Incremental Sync

Scheduled sync (every 5 minutes) only fetches updates:
- Only processes repositories updated since last sync
- Uses webhook events for real-time updates
- Polling as fallback for missed events

### Manual Sync

Triggered via API endpoint for immediate full sync.

## Event Processing

Events are processed asynchronously via event bus:

```javascript
// Webhook receives event
await eventBus.publish('github.pull_request', payload);

// Event handler processes it
eventBus.subscribe('github.pull_request', async (data) => {
  await spawnAgent('CodeReviewAgent', { ... });
});
```

**Benefits:**
- Non-blocking webhook responses
- Decoupled event processing
- Easy to add new event handlers
- Scalable architecture

## Testing

Run tests with:
```bash
npm test
```

Test webhook locally using GitHub CLI:
```bash
gh webhook forward --repo=owner/repo \
  --url=http://localhost:3000/api/webhooks/github/receive \
  --events=pull_request,push
```

Or use ngrok for public URL:
```bash
ngrok http 3000
# Update webhook URL in GitHub to ngrok URL
```

## Troubleshooting

### Integration not connecting
- Verify GitHub OAuth credentials in `.env`
- Check redirect URI matches GitHub OAuth app settings
- Ensure ENCRYPTION_KEY is set

### Webhooks not received
- Verify webhook URL is publicly accessible
- Check webhook secret matches `.env`
- Review GitHub webhook delivery logs
- Ensure signature verification is working

### Rate limit exceeded
- Check health monitoring for rate limit status
- Reduce sync frequency if needed
- Use GraphQL for complex queries (more efficient)
- Enable webhook events to reduce polling

### Authentication errors
- Token may have expired or been revoked
- User may need to reconnect integration
- Check required scopes are granted

## Production Deployment

**Requirements:**
1. PostgreSQL or MongoDB for storing integration data
2. Redis for session management and caching
3. Event bus (Redis Pub/Sub, RabbitMQ, or Kafka)
4. HTTPS endpoint for webhooks
5. Environment variables configured

**Scaling considerations:**
- Use queue system for event processing
- Implement database connection pooling
- Cache frequently accessed data (repositories, PRs)
- Use separate workers for sync jobs
- Monitor rate limit usage across instances

## Future Enhancements

- [ ] Support for GitHub Apps (instead of OAuth)
- [ ] GitHub Actions integration
- [ ] Code scanning and security alerts
- [ ] Branch protection management
- [ ] Team and permission sync
- [ ] GitHub Projects integration
- [ ] Commit status checks
- [ ] Auto-merge capabilities
- [ ] Code review assignment automation
- [ ] Release automation

## Support

For issues or questions:
1. Check logs for detailed error messages
2. Review health endpoint for integration status
3. Verify webhook deliveries in GitHub settings
4. Check rate limit status
5. Ensure all dependencies are properly injected

## License

Part of CompanyOS - See main project LICENSE file.
