# GitHub Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CompanyOS                                │
│                                                                   │
│  ┌─────────────┐      ┌──────────────┐      ┌────────────────┐ │
│  │   Web App   │◄────►│  Express API │◄────►│  Event Bus     │ │
│  └─────────────┘      └──────────────┘      └────────────────┘ │
│                              │                       │           │
│                              │                       │           │
│                              ▼                       ▼           │
│                    ┌──────────────────┐    ┌─────────────────┐ │
│                    │ GitHub           │    │ Agent System    │ │
│                    │ Integration      │    │                 │ │
│                    │ Module           │    │ - CodeReview    │ │
│                    └──────────────────┘    │ - Deployment    │ │
│                              │              │ - IssueTriage   │ │
│                              │              └─────────────────┘ │
│                              ▼                                   │
│                    ┌──────────────────┐                         │
│                    │ Database         │                         │
│                    │ (PostgreSQL)     │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ OAuth / Webhooks
                              ▼
                    ┌──────────────────┐
                    │     GitHub       │
                    │                  │
                    │ - Repositories   │
                    │ - Pull Requests  │
                    │ - Issues         │
                    │ - Deployments    │
                    └──────────────────┘
```

## Module Structure

```
backend/integrations/github/
│
├── index.js                 # Main entry point
│   ├── initializeGitHubIntegration()
│   ├── Express route setup
│   ├── Event handler registration
│   └── Health monitor initialization
│
├── client.js                # GitHub API Client
│   ├── GitHubClient class
│   ├── Octokit wrapper
│   ├── GraphQL client
│   ├── Rate limiting
│   └── Error handling
│
├── oauth.js                 # OAuth 2.0 Flow
│   ├── initiateOAuthFlow()
│   ├── handleOAuthCallback()
│   ├── State generation/verification
│   └── Token exchange
│
├── webhooks.js              # Webhook Handling
│   ├── receiveWebhook()
│   ├── verifyGitHubSignature()
│   ├── setupWebhook()
│   └── removeWebhook()
│
├── events.js                # Event Handlers
│   ├── handlePullRequestEvent()
│   ├── handlePushEvent()
│   ├── handleIssuesEvent()
│   ├── handleDeploymentEvent()
│   └── ... (8 total event types)
│
├── sync.js                  # Data Synchronization
│   ├── syncGitHubData()
│   ├── incrementalSync()
│   ├── scheduledSync()
│   └── syncPullRequests()
│
├── health.js                # Health Monitoring
│   ├── checkGitHubIntegration()
│   ├── GitHubHealthMonitor class
│   ├── Continuous monitoring
│   └── Alert system
│
├── queries.js               # GraphQL Queries
│   ├── GET_PULL_REQUEST_DETAILS
│   ├── GET_REPOSITORY_WITH_PRS
│   ├── GET_ORG_REPOSITORIES
│   └── ... (8 total queries)
│
└── crypto.js                # Encryption
    ├── encrypt()
    ├── decrypt()
    ├── hash()
    └── secureCompare()
```

## Data Flow

### 1. OAuth Connection Flow

```
User clicks "Connect GitHub"
    │
    ▼
GET /api/integrations/github/connect
    │
    ├─► Generate secure state token
    ├─► Store in session/memory
    └─► Redirect to GitHub OAuth
            │
            ▼
        User authorizes
            │
            ▼
GET /api/integrations/github/callback?code=xxx&state=xxx
    │
    ├─► Verify state (CSRF protection)
    ├─► Exchange code for access token
    ├─► Get user info from GitHub
    ├─► Encrypt access token
    ├─► Store in database
    └─► Redirect to dashboard
```

### 2. Webhook Event Flow

```
GitHub event occurs (PR opened, push, etc.)
    │
    ▼
POST /api/webhooks/github/receive
    │
    ├─► Verify HMAC SHA256 signature
    ├─► Extract event type and payload
    ├─► Publish to event bus
    └─► Return 200 OK (GitHub expects immediate response)
            │
            ▼
        Event Bus
            │
            ├─► Subscribers listen for events
            │   (github.pull_request, github.push, etc.)
            │
            └─► Event handlers process asynchronously
                    │
                    ├─► Store data in database
                    ├─► Spawn AI agents
                    └─► Trigger actions
```

### 3. Data Sync Flow

```
Manual sync triggered OR scheduled job runs
    │
    ▼
syncGitHubData(organizationId)
    │
    ├─► Get integration credentials
    ├─► Decrypt access token
    ├─► Create GitHub client
    │
    ├─► Fetch all repositories
    │   │
    │   └─► For each repository:
    │       ├─► Store repository metadata
    │       ├─► Sync pull requests
    │       │   ├─► Open PRs
    │       │   ├─► Recently closed PRs
    │       │   └─► Use GraphQL for details
    │       │
    │       └─► Setup webhooks
    │
    └─► Update last sync timestamp
```

### 4. Health Check Flow

```
Health monitor (runs every 5 minutes)
    │
    ├─► Get all GitHub integrations
    │
    └─► For each integration:
        │
        ├─► Check authentication
        │   └─► GET /user (verify token valid)
        │
        ├─► Check rate limit
        │   └─► GET /rate_limit
        │
        ├─► Check API access
        │   └─► GET /user/repos (test response time)
        │
        └─► Check webhooks
            └─► GET /repos/{owner}/{repo}/hooks
                │
                ├─► Compare with previous status
                ├─► Send alerts if degraded/unhealthy
                └─► Store current status
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Transport Security                             │
│ - HTTPS only for webhooks                               │
│ - TLS 1.2+ required                                     │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                  │
│ - OAuth 2.0 with CSRF protection                        │
│ - State token verification                              │
│ - Secure random state generation                        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Signature Verification                         │
│ - HMAC SHA256 webhook verification                      │
│ - Constant-time comparison                              │
│ - Secret key never exposed                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Encryption at Rest                             │
│ - AES-256-GCM for credentials                           │
│ - Random IV per encryption                              │
│ - Auth tags for integrity                               │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Access Control                                 │
│ - Minimal OAuth scopes                                  │
│ - Organization-level isolation                          │
│ - No credential logging                                 │
└─────────────────────────────────────────────────────────┘
```

## Event Bus Architecture

```
                    ┌──────────────────┐
                    │   Webhook        │
                    │   Receiver       │
                    └────────┬─────────┘
                             │
                             │ Publish events
                             ▼
                    ┌──────────────────┐
                    │   Event Bus      │
                    │ (Redis/RabbitMQ) │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  PR Handler │  │Push Handler │  │Issue Handler│
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                 │
           ▼                ▼                 ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │CodeReview   │  │Deployment   │  │IssueTriage  │
    │Agent        │  │Agent        │  │Agent        │
    └─────────────┘  └─────────────┘  └─────────────┘
```

## Rate Limiting Strategy

```
Request → GitHubClient.makeRequest()
              │
              ├─► Octokit (with throttling plugin)
              │       │
              │       ├─► Check rate limit before request
              │       │
              │       ├─► Make API call
              │       │
              │       └─► If rate limited:
              │           ├─► Retry (up to 3 times)
              │           ├─► Exponential backoff
              │           └─► Or throw RateLimitError
              │
              └─► Custom error handling
                      │
                      ├─► Log error
                      ├─► Notify monitoring
                      └─► Return error to caller
```

## Dependencies

```
External Dependencies:
├── @octokit/rest          - GitHub REST API client
├── @octokit/webhooks      - Webhook types and utilities
├── @octokit/graphql       - GraphQL API client
├── @octokit/plugin-throttling - Automatic rate limiting
├── express                - Web framework
└── dotenv                 - Environment configuration

Internal Dependencies (injected):
├── eventBus               - Event publish/subscribe
├── database               - Data persistence
│   ├── storeIntegration
│   ├── getIntegration
│   ├── upsertRepository
│   ├── upsertPullRequest
│   └── ... (other storage functions)
├── encryption             - Credential encryption
│   ├── encrypt
│   └── decrypt
├── agentSystem            - AI agent spawning
│   └── spawnAgent
└── alertSystem            - Monitoring alerts
    └── alertIntegrationIssue
```

## Scalability Considerations

1. **Horizontal Scaling**: Stateless design allows multiple instances
2. **Event-Driven**: Async processing prevents blocking
3. **Database Pooling**: Connection reuse for efficiency
4. **Caching**: Redis for frequently accessed data
5. **Queue System**: Background job processing
6. **Load Balancing**: Distribute webhook traffic
7. **Rate Limit Sharing**: Centralized rate limit tracking

## Monitoring Points

```
┌──────────────────────────────────────────────────────┐
│ Metrics to Track:                                    │
├──────────────────────────────────────────────────────┤
│ • API requests/minute                                │
│ • Rate limit remaining                               │
│ • Webhook events received                            │
│ • Integration health status                          │
│ • Sync duration and frequency                        │
│ • Error rates by type                                │
│ • Agent spawn success rate                           │
│ • Database query performance                         │
└──────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
Error Occurs
    │
    ├─► RateLimitError
    │   ├─► Log rate limit hit
    │   ├─► Wait for reset time
    │   └─► Notify monitoring
    │
    ├─► AuthenticationError
    │   ├─► Log auth failure
    │   ├─► Mark integration unhealthy
    │   └─► Notify user to reconnect
    │
    ├─► NetworkError
    │   ├─► Retry with backoff
    │   └─► Log if repeated failures
    │
    └─► UnknownError
        ├─► Log full stack trace
        ├─► Send to error tracking
        └─► Return generic error to user
```

## Deployment Architecture

```
Production Environment:
┌─────────────────────────────────────────────────────┐
│                   Load Balancer                      │
│                   (HTTPS/SSL)                        │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    ┌──────┐    ┌──────┐    ┌──────┐
    │Node 1│    │Node 2│    │Node 3│
    └───┬──┘    └───┬──┘    └───┬──┘
        │           │           │
        └───────────┼───────────┘
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
    ┌────────┐  ┌─────────┐  ┌──────────┐
    │Database│  │  Redis  │  │ RabbitMQ │
    │(Primary│  │ (Cache/ │  │ (Events) │
    │Replica)│  │ Session)│  │          │
    └────────┘  └─────────┘  └──────────┘
```

This architecture provides a robust, scalable, and secure GitHub integration for CompanyOS.
