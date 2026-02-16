# CompanyOS Integration Specifications
## Third-Party Service Integration Details v1.0

---

## Integration Overview

CompanyOS integrates with **6 core external services**:

1. **GitHub** - Version control, code review, repository management
2. **Vercel** - Deployment platform, hosting, analytics
3. **Figma** - Design tool, component libraries, design systems
4. **Slack** - Team communication, notifications, bot interactions
5. **Twitter (X)** - Social media, content distribution, engagement
6. **LinkedIn** - Professional networking, company page, content sharing

Each integration follows a **standardized pattern**:
- OAuth 2.0 authentication
- Webhook subscription for real-time events
- Polling fallback for services without webhooks
- Rate limiting and retry logic
- Error handling and alerting
- Health monitoring

---

## 1. GitHub Integration

### Overview
GitHub integration enables comprehensive development workflow management, including repository monitoring, pull request automation, code review, and deployment triggers.

### Authentication

**OAuth Flow:**
```
Client ID: <from GitHub OAuth App>
Scope: repo, read:user, user:email, read:org, write:repo_hook
Redirect URI: https://app.companyos.com/api/integrations/github/callback
```

**Implementation:**
```javascript
// OAuth initiation
app.get('/api/integrations/github/connect', (req, res) => {
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=repo read:user user:email read:org write:repo_hook&` +
    `state=${generateSecureState()}`
  
  res.redirect(authUrl)
})

// OAuth callback
app.get('/api/integrations/github/callback', async (req, res) => {
  const { code, state } = req.query
  
  // Verify state
  if (!verifyState(state)) {
    return res.status(400).json({ error: 'Invalid state' })
  }
  
  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    })
  })
  
  const { access_token } = await tokenResponse.json()
  
  // Store encrypted token
  await storeIntegration({
    organizationId: req.user.organizationId,
    service: 'github',
    credentials: encrypt(access_token),
    status: 'active'
  })
  
  res.redirect('/dashboard?integration=github&status=success')
})
```

### API Endpoints Used

**Octokit (GitHub REST API v3):**

1. **List Repositories:**
   ```javascript
   GET /user/repos?affiliation=owner,organization_member
   GET /orgs/{org}/repos
   ```

2. **Pull Requests:**
   ```javascript
   GET /repos/{owner}/{repo}/pulls
   GET /repos/{owner}/{repo}/pulls/{pull_number}
   GET /repos/{owner}/{repo}/pulls/{pull_number}/files
   GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews
   POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews
   ```

3. **Issues:**
   ```javascript
   GET /repos/{owner}/{repo}/issues
   POST /repos/{owner}/{repo}/issues
   PATCH /repos/{owner}/{repo}/issues/{issue_number}
   ```

4. **Commits:**
   ```javascript
   GET /repos/{owner}/{repo}/commits
   GET /repos/{owner}/{repo}/commits/{ref}
   ```

5. **Webhooks:**
   ```javascript
   POST /repos/{owner}/{repo}/hooks
   GET /repos/{owner}/{repo}/hooks
   DELETE /repos/{owner}/{repo}/hooks/{hook_id}
   ```

**GraphQL API:**
```graphql
query GetPullRequestDetails($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      id
      title
      body
      state
      author {
        login
        avatarUrl
      }
      commits(last: 10) {
        nodes {
          commit {
            message
            additions
            deletions
          }
        }
      }
      reviews(last: 10) {
        nodes {
          author {
            login
          }
          state
          body
        }
      }
      files(first: 100) {
        nodes {
          path
          additions
          deletions
        }
      }
    }
  }
}
```

### Webhook Events

**Webhook Configuration:**
```javascript
POST /repos/{owner}/{repo}/hooks
{
  "name": "web",
  "active": true,
  "events": [
    "pull_request",
    "pull_request_review",
    "push",
    "issues",
    "issue_comment",
    "deployment",
    "deployment_status",
    "release"
  ],
  "config": {
    "url": "https://app.companyos.com/api/webhooks/github/receive",
    "content_type": "json",
    "secret": "<webhook_secret>"
  }
}
```

**Event Handling:**
```javascript
app.post('/api/webhooks/github/receive', async (req, res) => {
  // Verify signature
  const signature = req.headers['x-hub-signature-256']
  if (!verifyGitHubSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature')
  }
  
  const event = req.headers['x-github-event']
  const payload = req.body
  
  // Process event asynchronously
  await eventBus.publish(`github.${event}`, payload)
  
  res.status(200).send('OK')
})

// Event handlers
eventBus.subscribe('github.pull_request', async (payload) => {
  if (payload.action === 'opened') {
    await spawnAgent('CodeReviewAgent', {
      task: 'analyze_pr',
      data: {
        prId: payload.pull_request.id,
        prNumber: payload.pull_request.number,
        repoFullName: payload.repository.full_name
      }
    })
  }
})

eventBus.subscribe('github.push', async (payload) => {
  if (payload.ref === `refs/heads/${payload.repository.default_branch}`) {
    await eventBus.publish('deployment.trigger', {
      repo: payload.repository.full_name,
      branch: payload.repository.default_branch,
      commitSha: payload.after
    })
  }
})
```

### Rate Limiting

**GitHub API Limits:**
- **Authenticated**: 5,000 requests/hour
- **GraphQL**: 5,000 points/hour (queries cost different amounts)
- **Search API**: 30 requests/minute

**Implementation:**
```javascript
class GitHubClient {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(`Rate limit hit for ${options.method} ${options.url}`)
          if (options.request.retryCount < 3) {
            console.log(`Retrying after ${retryAfter} seconds`)
            return true
          }
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          console.warn(`Secondary rate limit hit`)
        }
      }
    })
  }
  
  async makeRequest(fn) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 403 && error.message.includes('rate limit')) {
        await this.notifyRateLimitExceeded()
        throw new RateLimitError('GitHub API rate limit exceeded')
      }
      throw error
    }
  }
}
```

### Data Sync Strategy

**Initial Sync:**
1. Fetch all repositories
2. For each repository:
   - Fetch open pull requests
   - Fetch recent commits (last 100)
   - Subscribe to webhooks

**Incremental Sync:**
- Real-time via webhooks (primary)
- Polling every 5 minutes (backup)

**Sync Implementation:**
```javascript
async function syncGitHubData(organizationId) {
  const integration = await getIntegration(organizationId, 'github')
  const client = new GitHubClient(decrypt(integration.credentials))
  
  // Sync repositories
  const repos = await client.octokit.repos.listForAuthenticatedUser({
    affiliation: 'owner,organization_member',
    per_page: 100
  })
  
  for (const repo of repos.data) {
    await upsertRepository({
      organizationId,
      githubId: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      defaultBranch: repo.default_branch,
      visibility: repo.private ? 'private' : 'public',
      metadata: {
        language: repo.language,
        stars: repo.stargazers_count,
        forksCount: repo.forks_count
      }
    })
    
    // Sync pull requests
    await syncPullRequests(client, repo.owner.login, repo.name)
  }
  
  await updateIntegration(integration.id, { lastSyncAt: new Date() })
}
```

---

## 2. Vercel Integration

### Overview
Vercel integration provides deployment management, build monitoring, preview environments, and analytics tracking.

### Authentication

**OAuth Flow:**
```
Authorization URL: https://vercel.com/oauth/authorize
Token URL: https://api.vercel.com/v2/oauth/access_token
Scope: (Vercel doesn't use scopes, all access granted)
Redirect URI: https://app.companyos.com/api/integrations/vercel/callback
```

**Access Token:**
Alternatively, users can provide a Vercel API token directly:
```
Settings → Tokens → Create Token
Scope: Full Account Access
```

**Implementation:**
```javascript
app.get('/api/integrations/vercel/connect', (req, res) => {
  const authUrl = `https://vercel.com/oauth/authorize?` +
    `client_id=${VERCEL_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `state=${generateSecureState()}`
  
  res.redirect(authUrl)
})

app.get('/api/integrations/vercel/callback', async (req, res) => {
  const { code, state } = req.query
  
  if (!verifyState(state)) {
    return res.status(400).json({ error: 'Invalid state' })
  }
  
  // Exchange code for token
  const tokenResponse = await fetch('https://api.vercel.com/v2/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: VERCEL_CLIENT_ID,
      client_secret: VERCEL_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    })
  })
  
  const { access_token, team_id } = await tokenResponse.json()
  
  await storeIntegration({
    organizationId: req.user.organizationId,
    service: 'vercel',
    credentials: encrypt(access_token),
    metadata: { teamId: team_id },
    status: 'active'
  })
  
  res.redirect('/dashboard?integration=vercel&status=success')
})
```

### API Endpoints Used

**Base URL:** `https://api.vercel.com`

1. **Projects:**
   ```javascript
   GET /v9/projects
   GET /v9/projects/{projectId}
   ```

2. **Deployments:**
   ```javascript
   GET /v6/deployments
   GET /v13/deployments/{deploymentId}
   POST /v13/deployments (trigger deployment)
   DELETE /v13/deployments/{deploymentId} (rollback)
   ```

3. **Builds:**
   ```javascript
   GET /v6/deployments/{deploymentId}/builds
   ```

4. **Environment Variables:**
   ```javascript
   GET /v9/projects/{projectId}/env
   POST /v10/projects/{projectId}/env
   PATCH /v9/projects/{projectId}/env/{envId}
   ```

5. **Logs:**
   ```javascript
   GET /v2/deployments/{deploymentId}/events
   ```

**Example:**
```javascript
class VercelClient {
  constructor(token) {
    this.token = token
    this.baseUrl = 'https://api.vercel.com'
  }
  
  async getDeployments(projectId) {
    const response = await fetch(
      `${this.baseUrl}/v6/deployments?projectId=${projectId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    )
    return response.json()
  }
  
  async getDeploymentDetails(deploymentId) {
    const response = await fetch(
      `${this.baseUrl}/v13/deployments/${deploymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    )
    return response.json()
  }
  
  async rollbackDeployment(deploymentId) {
    // Vercel doesn't have direct rollback, so we redeploy previous
    const deployment = await this.getDeploymentDetails(deploymentId)
    const previousDeployment = await this.getPreviousDeployment(deployment.projectId)
    
    // Trigger new deployment from previous commit
    return await this.createDeployment({
      name: deployment.name,
      gitSource: {
        ref: previousDeployment.meta.githubCommitSha,
        repoId: previousDeployment.meta.githubRepoId
      }
    })
  }
}
```

### Webhook Events

**Webhook Configuration:**
Vercel webhooks are configured per project in Vercel dashboard or via API:

```javascript
POST /v1/integrations/webhooks
{
  "url": "https://app.companyos.com/api/webhooks/vercel/receive",
  "events": [
    "deployment.created",
    "deployment.ready",
    "deployment.error",
    "deployment.canceled"
  ],
  "projectIds": ["prj_..."]
}
```

**Event Handling:**
```javascript
app.post('/api/webhooks/vercel/receive', async (req, res) => {
  // Verify signature (Vercel uses x-vercel-signature)
  const signature = req.headers['x-vercel-signature']
  if (!verifyVercelSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature')
  }
  
  const event = req.body
  
  await eventBus.publish(`vercel.${event.type}`, event.payload)
  
  res.status(200).send('OK')
})

// Event handlers
eventBus.subscribe('vercel.deployment.ready', async (payload) => {
  await spawnAgent('DeploymentAgent', {
    task: 'monitor_deployment',
    data: {
      deploymentId: payload.deployment.id,
      url: payload.deployment.url,
      projectId: payload.deployment.projectId
    }
  })
})

eventBus.subscribe('vercel.deployment.error', async (payload) => {
  await spawnAgent('NotificationAgent', {
    task: 'alert_deployment_failure',
    data: {
      deploymentId: payload.deployment.id,
      project: payload.deployment.name,
      error: payload.deployment.errorMessage
    }
  })
})
```

### Rate Limiting

**Vercel API Limits:**
- **Rate Limit**: 20 requests per second per IP
- **Deployment Limits**: Varies by plan (Hobby: 100/day, Pro: 6000/day)

### Data Sync Strategy

**Real-Time:**
- Webhooks for deployment events (primary)

**Polling:**
- Poll every 2 minutes for deployment status updates
- Poll every 10 minutes for project list changes

**Implementation:**
```javascript
async function syncVercelDeployments(organizationId) {
  const integration = await getIntegration(organizationId, 'vercel')
  const client = new VercelClient(decrypt(integration.credentials))
  
  const projects = await client.getProjects()
  
  for (const project of projects.projects) {
    const deployments = await client.getDeployments(project.id)
    
    for (const deployment of deployments.deployments) {
      await upsertDeployment({
        organizationId,
        vercelDeploymentId: deployment.uid,
        projectName: project.name,
        url: deployment.url,
        state: deployment.readyState,
        environment: deployment.target,
        commitSha: deployment.meta.githubCommitSha,
        branch: deployment.meta.githubCommitRef,
        createdAt: new Date(deployment.createdAt)
      })
    }
  }
  
  await updateIntegration(integration.id, { lastSyncAt: new Date() })
}

// Polling job
setInterval(async () => {
  const orgs = await getOrganizationsWithIntegration('vercel')
  for (const org of orgs) {
    await syncVercelDeployments(org.id)
  }
}, 2 * 60 * 1000) // Every 2 minutes
```

---

## 3. Figma Integration

### Overview
Figma integration enables design system management, component tracking, and design-to-code workflows.

### Authentication

**Personal Access Token:**
Figma uses personal access tokens (no OAuth).

```
User → Figma → Settings → Personal Access Tokens → Generate new token
Scope: File read access
```

**Storage:**
```javascript
app.post('/api/integrations/figma/connect', async (req, res) => {
  const { accessToken } = req.body
  
  // Verify token by fetching user info
  const userResponse = await fetch('https://api.figma.com/v1/me', {
    headers: { 'X-Figma-Token': accessToken }
  })
  
  if (!userResponse.ok) {
    return res.status(401).json({ error: 'Invalid Figma token' })
  }
  
  const user = await userResponse.json()
  
  await storeIntegration({
    organizationId: req.user.organizationId,
    service: 'figma',
    credentials: encrypt(accessToken),
    metadata: {
      userId: user.id,
      email: user.email
    },
    status: 'active'
  })
  
  res.json({ success: true })
})
```

### API Endpoints Used

**Base URL:** `https://api.figma.com/v1`

1. **Files:**
   ```javascript
   GET /files/{fileKey}
   GET /files/{fileKey}/nodes?ids={nodeIds}
   GET /files/{fileKey}/comments
   POST /files/{fileKey}/comments
   ```

2. **File Versions:**
   ```javascript
   GET /files/{fileKey}/versions
   ```

3. **Images:**
   ```javascript
   GET /images/{fileKey}?ids={nodeIds}&format=png&scale=2
   ```

4. **Components:**
   ```javascript
   GET /files/{fileKey}/components
   GET /teams/{teamId}/components
   ```

5. **Projects:**
   ```javascript
   GET /teams/{teamId}/projects
   GET /projects/{projectId}/files
   ```

**Example:**
```javascript
class FigmaClient {
  constructor(token) {
    this.token = token
    this.baseUrl = 'https://api.figma.com/v1'
  }
  
  async getFile(fileKey) {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
      headers: { 'X-Figma-Token': this.token }
    })
    return response.json()
  }
  
  async getComponents(fileKey) {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}/components`, {
      headers: { 'X-Figma-Token': this.token }
    })
    return response.json()
  }
  
  async exportComponent(fileKey, nodeId) {
    const response = await fetch(
      `${this.baseUrl}/images/${fileKey}?ids=${nodeId}&format=png&scale=2`,
      {
        headers: { 'X-Figma-Token': this.token }
      }
    )
    return response.json()
  }
  
  async getFileVersions(fileKey) {
    const response = await fetch(`${this.baseUrl}/files/${fileKey}/versions`, {
      headers: { 'X-Figma-Token': this.token }
    })
    return response.json()
  }
}
```

### Webhook Events

**Figma Webhooks:**
Figma supports webhooks for file changes (requires Figma Enterprise plan).

```javascript
POST https://api.figma.com/v2/webhooks
{
  "event_type": "FILE_UPDATE",
  "team_id": "team_...",
  "endpoint": "https://app.companyos.com/api/webhooks/figma/receive",
  "passcode": "<secret>"
}
```

**Event Types:**
- `FILE_UPDATE`: File content changed
- `FILE_VERSION_UPDATE`: New version created
- `FILE_COMMENT`: New comment added
- `LIBRARY_PUBLISH`: Component library published

**Event Handling:**
```javascript
app.post('/api/webhooks/figma/receive', async (req, res) => {
  const { passcode, ...payload } = req.body
  
  // Verify passcode
  if (passcode !== FIGMA_WEBHOOK_SECRET) {
    return res.status(401).send('Invalid passcode')
  }
  
  await eventBus.publish(`figma.${payload.event_type}`, payload)
  
  res.status(200).send('OK')
})

eventBus.subscribe('figma.FILE_UPDATE', async (payload) => {
  await spawnAgent('DesignQAAgent', {
    task: 'check_design_system_compliance',
    data: {
      fileKey: payload.file_key,
      fileName: payload.file_name
    }
  })
})

eventBus.subscribe('figma.LIBRARY_PUBLISH', async (payload) => {
  await spawnAgent('ComponentGeneratorAgent', {
    task: 'generate_components_from_library',
    data: {
      fileKey: payload.file_key,
      publishedComponents: payload.affected_components
    }
  })
})
```

### Rate Limiting

**Figma API Limits:**
- **Rate Limit**: 1000 requests per minute per access token
- **File requests**: Limited to avoid abuse

### Data Sync Strategy

**Polling-Based** (no webhooks for most users):
- Poll every 15 minutes for file updates
- Poll every 5 minutes for component library changes

**Implementation:**
```javascript
async function syncFigmaFiles(organizationId) {
  const integration = await getIntegration(organizationId, 'figma')
  const client = new FigmaClient(decrypt(integration.credentials))
  
  // Get configured file keys from metadata
  const fileKeys = integration.metadata.fileKeys || []
  
  for (const fileKey of fileKeys) {
    const file = await client.getFile(fileKey)
    
    await upsertFigmaFile({
      organizationId,
      figmaFileKey: fileKey,
      name: file.name,
      fileType: file.document.type,
      thumbnailUrl: file.thumbnailUrl,
      lastModifiedAt: new Date(file.lastModified),
      metadata: {
        version: file.version,
        role: file.role
      }
    })
    
    // Sync components
    const components = await client.getComponents(fileKey)
    for (const [componentId, component] of Object.entries(components.meta.components)) {
      await upsertDesignComponent({
        figmaFileId: file.id,
        figmaComponentId: componentId,
        name: component.name,
        description: component.description,
        componentType: inferComponentType(component.name),
        metadata: component
      })
    }
  }
  
  await updateIntegration(integration.id, { lastSyncAt: new Date() })
}
```

---

## 4. Slack Integration

### Overview
Slack integration enables team communication monitoring, bot interactions, and automated notifications.

### Authentication

**OAuth Flow (Bot Token):**
```
Authorization URL: https://slack.com/oauth/v2/authorize
Token URL: https://slack.com/api/oauth.v2.access
Scopes:
  - channels:read
  - channels:history
  - chat:write
  - users:read
  - team:read
  - im:write
  - reactions:read
Redirect URI: https://app.companyos.com/api/integrations/slack/callback
```

**Implementation:**
```javascript
app.get('/api/integrations/slack/connect', (req, res) => {
  const authUrl = `https://slack.com/oauth/v2/authorize?` +
    `client_id=${SLACK_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=channels:read,channels:history,chat:write,users:read,team:read,im:write,reactions:read&` +
    `state=${generateSecureState()}`
  
  res.redirect(authUrl)
})

app.get('/api/integrations/slack/callback', async (req, res) => {
  const { code, state } = req.query
  
  if (!verifyState(state)) {
    return res.status(400).json({ error: 'Invalid state' })
  }
  
  // Exchange code for token
  const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI
    })
  })
  
  const data = await tokenResponse.json()
  
  await storeIntegration({
    organizationId: req.user.organizationId,
    service: 'slack',
    credentials: encrypt(JSON.stringify({
      botToken: data.access_token,
      appId: data.app_id
    })),
    metadata: {
      teamId: data.team.id,
      teamName: data.team.name,
      botUserId: data.bot_user_id
    },
    status: 'active'
  })
  
  res.redirect('/dashboard?integration=slack&status=success')
})
```

### API Endpoints Used

**Base URL:** `https://slack.com/api`

1. **Messaging:**
   ```javascript
   POST /chat.postMessage
   POST /chat.update
   DELETE /chat.delete
   POST /chat.postEphemeral (only visible to one user)
   ```

2. **Channels:**
   ```javascript
   GET /conversations.list
   GET /conversations.info?channel={channelId}
   GET /conversations.history?channel={channelId}
   POST /conversations.join
   ```

3. **Users:**
   ```javascript
   GET /users.list
   GET /users.info?user={userId}
   GET /users.profile.get?user={userId}
   ```

4. **Reactions:**
   ```javascript
   POST /reactions.add
   GET /reactions.get
   ```

5. **Files:**
   ```javascript
   GET /files.list
   POST /files.upload
   ```

**Example:**
```javascript
const { WebClient } = require('@slack/web-api')

class SlackClient {
  constructor(token) {
    this.client = new WebClient(token)
  }
  
  async sendMessage(channel, text, blocks = null) {
    return await this.client.chat.postMessage({
      channel,
      text,
      blocks
    })
  }
  
  async sendRichMessage(channel, message) {
    return await this.client.chat.postMessage({
      channel,
      text: message.text,
      blocks: message.blocks,
      attachments: message.attachments
    })
  }
  
  async getChannelHistory(channel, limit = 100) {
    return await this.client.conversations.history({
      channel,
      limit
    })
  }
  
  async getUserInfo(userId) {
    return await this.client.users.info({ user: userId })
  }
}
```

### Webhook Events (Event Subscriptions)

**Event Subscription Configuration:**
```
URL: https://app.companyos.com/api/webhooks/slack/events
Request URL Verification: Required
Events:
  - message.channels (messages in public channels)
  - message.im (direct messages to bot)
  - app_mention (bot mentioned)
  - reaction_added
  - member_joined_channel
```

**Event Handling:**
```javascript
app.post('/api/webhooks/slack/events', async (req, res) => {
  const { type, challenge, event } = req.body
  
  // URL verification
  if (type === 'url_verification') {
    return res.json({ challenge })
  }
  
  // Verify signature
  const signature = req.headers['x-slack-signature']
  const timestamp = req.headers['x-slack-request-timestamp']
  if (!verifySlackSignature(req.rawBody, signature, timestamp)) {
    return res.status(401).send('Invalid signature')
  }
  
  // Process event asynchronously
  await eventBus.publish(`slack.${event.type}`, event)
  
  res.status(200).send('OK')
})

// Event handlers
eventBus.subscribe('slack.app_mention', async (event) => {
  await spawnAgent('CommunicationAgent', {
    task: 'respond_to_mention',
    data: {
      channel: event.channel,
      user: event.user,
      text: event.text,
      ts: event.ts
    }
  })
})

eventBus.subscribe('slack.message.channels', async (event) => {
  // Check if message contains keywords
  if (event.text.includes('deployment') || event.text.includes('broken')) {
    await spawnAgent('AlertAnalyzerAgent', {
      task: 'analyze_potential_issue',
      data: {
        channel: event.channel,
        message: event.text,
        user: event.user
      }
    })
  }
})
```

### Rate Limiting

**Slack API Limits:**
- **Tier 1**: 1+ per minute (chat.postMessage, etc.)
- **Tier 2**: 20+ per minute
- **Tier 3**: 50+ per minute
- **Tier 4**: 100+ per minute

### Interactive Components (Slash Commands, Buttons)

**Slash Command:**
```
Command: /companyos
Request URL: https://app.companyos.com/api/slack/commands
```

**Implementation:**
```javascript
app.post('/api/slack/commands', async (req, res) => {
  const { command, text, user_id, channel_id } = req.body
  
  if (command === '/companyos') {
    // Respond immediately
    res.json({
      response_type: 'ephemeral',
      text: 'Processing your request...'
    })
    
    // Process command asynchronously
    await processSlackCommand(text, user_id, channel_id)
  }
})

async function processSlackCommand(text, userId, channelId) {
  const args = text.split(' ')
  const action = args[0]
  
  if (action === 'deploy') {
    const project = args[1]
    await spawnAgent('DeploymentAgent', {
      task: 'trigger_deployment',
      data: { project, requestedBy: userId, channel: channelId }
    })
  } else if (action === 'status') {
    const status = await getSystemStatus()
    await slackClient.sendMessage(channelId, formatStatus(status))
  }
}
```

**Interactive Buttons:**
```javascript
// When sending a message with buttons
await slackClient.sendMessage(channel, {
  text: 'Agent needs approval for deployment',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Deployment Ready*\nProject: my-app\nBranch: main'
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Approve' },
          style: 'primary',
          value: 'approve_deploy_123',
          action_id: 'approve_deployment'
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Reject' },
          style: 'danger',
          value: 'reject_deploy_123',
          action_id: 'reject_deployment'
        }
      ]
    }
  ]
})

// Handle button clicks
app.post('/api/slack/interactions', async (req, res) => {
  const payload = JSON.parse(req.body.payload)
  
  if (payload.type === 'block_actions') {
    const action = payload.actions[0]
    
    if (action.action_id === 'approve_deployment') {
      const deploymentId = action.value.split('_')[2]
      await approveDeployment(deploymentId, payload.user.id)
      
      // Update message
      res.json({
        replace_original: true,
        text: `✅ Deployment approved by <@${payload.user.id}>`
      })
    }
  }
})
```

---

## 5. Twitter (X) Integration

### Overview
Twitter integration enables content publishing, engagement monitoring, and analytics tracking.

### Authentication

**OAuth 2.0 with PKCE:**
```
Authorization URL: https://twitter.com/i/oauth2/authorize
Token URL: https://api.twitter.com/2/oauth2/token
Scope: tweet.read tweet.write users.read offline.access
Redirect URI: https://app.companyos.com/api/integrations/twitter/callback
```

**Implementation:**
```javascript
app.get('/api/integrations/twitter/connect', (req, res) => {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)
  
  // Store code verifier in session
  req.session.codeVerifier = codeVerifier
  
  const authUrl = `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${TWITTER_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=tweet.read tweet.write users.read offline.access&` +
    `state=${generateSecureState()}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256`
  
  res.redirect(authUrl)
})

app.get('/api/integrations/twitter/callback', async (req, res) => {
  const { code, state } = req.query
  const codeVerifier = req.session.codeVerifier
  
  if (!verifyState(state)) {
    return res.status(400).json({ error: 'Invalid state' })
  }
  
  // Exchange code for tokens
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier
    })
  })
  
  const data = await tokenResponse.json()
  
  // Get user info
  const userResponse = await fetch('https://api.twitter.com/2/users/me', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  })
  const user = await userResponse.json()
  
  await storeSocialAccount({
    organizationId: req.user.organizationId,
    platform: 'twitter',
    accountId: user.data.id,
    handle: user.data.username,
    displayName: user.data.name,
    avatarUrl: user.data.profile_image_url,
    credentialsEncrypted: encrypt(JSON.stringify({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    }))
  })
  
  res.redirect('/dashboard?integration=twitter&status=success')
})
```

### API Endpoints Used

**Base URL:** `https://api.twitter.com/2`

1. **Tweets:**
   ```javascript
   POST /tweets
   GET /tweets/{id}
   DELETE /tweets/{id}
   GET /users/{id}/tweets
   ```

2. **Users:**
   ```javascript
   GET /users/me
   GET /users/{id}
   GET /users/{id}/followers
   GET /users/{id}/following
   ```

3. **Engagement:**
   ```javascript
   POST /tweets/{id}/liking_users
   POST /tweets/{id}/retweeting_users
   GET /tweets/{id}/quote_tweets
   GET /tweets/{id}/retweeted_by
   GET /tweets/{id}/liking_users
   ```

4. **Search:**
   ```javascript
   GET /tweets/search/recent
   GET /tweets/search/all (full-archive search, requires Academic or Enterprise access)
   ```

**Example:**
```javascript
const { TwitterApi } = require('twitter-api-v2')

class TwitterClient {
  constructor(credentials) {
    this.client = new TwitterApi({
      clientId: TWITTER_CLIENT_ID,
      clientSecret: TWITTER_CLIENT_SECRET
    })
    this.accessToken = credentials.accessToken
    this.refreshToken = credentials.refreshToken
  }
  
  async tweet(text) {
    return await this.client.v2.tweet(text)
  }
  
  async getTweet(tweetId) {
    return await this.client.v2.singleTweet(tweetId, {
      expansions: ['author_id'],
      'tweet.fields': ['created_at', 'public_metrics']
    })
  }
  
  async getUserTweets(userId, maxResults = 10) {
    return await this.client.v2.userTimeline(userId, {
      max_results: maxResults,
      'tweet.fields': ['created_at', 'public_metrics']
    })
  }
  
  async searchMentions(handle) {
    return await this.client.v2.search(`@${handle}`, {
      max_results: 100,
      'tweet.fields': ['created_at', 'author_id']
    })
  }
}
```

### Webhook Events (Premium/Enterprise Only)

Twitter webhooks require Account Activity API (premium/enterprise).

**Alternative: Polling**
```javascript
async function pollTwitterMentions(accountId) {
  const account = await getSocialAccount(accountId)
  const client = new TwitterClient(decrypt(account.credentialsEncrypted))
  
  const mentions = await client.searchMentions(account.handle)
  
  for (const mention of mentions.data) {
    // Check if we've already processed this mention
    const existing = await findTweetByExternalId(mention.id)
    if (existing) continue
    
    // New mention - process it
    await spawnAgent('EngagementAgent', {
      task: 'respond_to_mention',
      data: {
        tweetId: mention.id,
        author: mention.author_id,
        text: mention.text
      }
    })
  }
}

// Poll every 5 minutes
setInterval(async () => {
  const accounts = await getSocialAccountsByPlatform('twitter')
  for (const account of accounts) {
    await pollTwitterMentions(account.id)
  }
}, 5 * 60 * 1000)
```

### Rate Limiting

**Twitter API v2 Limits:**
- **Essential (Free)**: 
  - 500,000 tweets/month read
  - 1,667 tweets/month write (50/day)
  - 10,000 requests/month
- **Elevated**:
  - 2M tweets/month read
  - 50,000 tweets/month write
  - 100,000 requests/month
- **Academic/Enterprise**: Higher limits

### Token Refresh

```javascript
async function refreshTwitterToken(accountId) {
  const account = await getSocialAccount(accountId)
  const credentials = JSON.parse(decrypt(account.credentialsEncrypted))
  
  if (Date.now() < credentials.expiresAt) {
    return // Token still valid
  }
  
  const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refreshToken
    })
  })
  
  const data = await tokenResponse.json()
  
  await updateSocialAccount(accountId, {
    credentialsEncrypted: encrypt(JSON.stringify({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000
    }))
  })
}
```

---

## 6. LinkedIn Integration

### Overview
LinkedIn integration enables professional content publishing, company page management, and engagement tracking.

### Authentication

**OAuth 2.0:**
```
Authorization URL: https://www.linkedin.com/oauth/v2/authorization
Token URL: https://www.linkedin.com/oauth/v2/accessToken
Scope: r_liteprofile r_emailaddress w_member_social r_organization_social w_organization_social
Redirect URI: https://app.companyos.com/api/integrations/linkedin/callback
```

**Implementation:**
```javascript
app.get('/api/integrations/linkedin/connect', (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${LINKEDIN_CLIENT_ID}&` +
    `redirect_uri=${REDIRECT_URI}&` +
    `scope=r_liteprofile r_emailaddress w_member_social r_organization_social w_organization_social&` +
    `state=${generateSecureState()}`
  
  res.redirect(authUrl)
})

app.get('/api/integrations/linkedin/callback', async (req, res) => {
  const { code, state } = req.query
  
  if (!verifyState(state)) {
    return res.status(400).json({ error: 'Invalid state' })
  }
  
  // Exchange code for token
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    })
  })
  
  const data = await tokenResponse.json()
  
  // Get user profile
  const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  })
  const profile = await profileResponse.json()
  
  await storeSocialAccount({
    organizationId: req.user.organizationId,
    platform: 'linkedin',
    accountId: profile.id,
    handle: `${profile.localizedFirstName} ${profile.localizedLastName}`,
    displayName: `${profile.localizedFirstName} ${profile.localizedLastName}`,
    credentialsEncrypted: encrypt(JSON.stringify({
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000
    }))
  })
  
  res.redirect('/dashboard?integration=linkedin&status=success')
})
```

### API Endpoints Used

**Base URL:** `https://api.linkedin.com/v2`

1. **Profile:**
   ```javascript
   GET /me
   GET /organizations/{id}
   ```

2. **Shares (Posts):**
   ```javascript
   POST /ugcPosts
   GET /ugcPosts/{id}
   GET /ugcPosts?q=authors&authors=List({personUrn})
   ```

3. **Analytics:**
   ```javascript
   GET /organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity={orgUrn}
   ```

**Example:**
```javascript
class LinkedInClient {
  constructor(accessToken) {
    this.token = accessToken
    this.baseUrl = 'https://api.linkedin.com/v2'
  }
  
  async createPost(personUrn, text) {
    const response = await fetch(`${this.baseUrl}/ugcPosts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    })
    return response.json()
  }
  
  async getPostAnalytics(postId) {
    const response = await fetch(
      `${this.baseUrl}/socialActions/${postId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    )
    return response.json()
  }
}
```

### Rate Limiting

**LinkedIn API Limits:**
- **Default**: 100 API calls per user per day
- **Throttle**: 100 calls per user per day for each application

### Data Sync Strategy

**Polling-Based** (LinkedIn doesn't provide webhooks):
- Poll every 1 hour for post engagement metrics

---

## Integration Health Monitoring

### Health Check System

```javascript
class IntegrationHealthMonitor {
  async checkAllIntegrations(organizationId) {
    const integrations = await getIntegrations(organizationId)
    const results = {}
    
    for (const integration of integrations) {
      results[integration.service] = await this.checkIntegration(integration)
    }
    
    return results
  }
  
  async checkIntegration(integration) {
    try {
      switch (integration.service) {
        case 'github':
          return await this.checkGitHub(integration)
        case 'vercel':
          return await this.checkVercel(integration)
        case 'figma':
          return await this.checkFigma(integration)
        case 'slack':
          return await this.checkSlack(integration)
        case 'twitter':
          return await this.checkTwitter(integration)
        case 'linkedin':
          return await this.checkLinkedIn(integration)
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastChecked: new Date()
      }
    }
  }
  
  async checkGitHub(integration) {
    const client = new GitHubClient(decrypt(integration.credentials))
    await client.octokit.users.getAuthenticated()
    return { status: 'healthy', lastChecked: new Date() }
  }
  
  // ... similar methods for other services
}

// Run health checks every 5 minutes
setInterval(async () => {
  const orgs = await getAllOrganizations()
  for (const org of orgs) {
    const health = await healthMonitor.checkAllIntegrations(org.id)
    
    // Alert if any integration is down
    for (const [service, status] of Object.entries(health)) {
      if (status.status === 'error') {
        await alertIntegrationDown(org.id, service, status.error)
      }
    }
  }
}, 5 * 60 * 1000)
```

---

## Summary

All integrations follow consistent patterns:
- **OAuth 2.0** for authentication (except Figma using tokens)
- **Webhooks** for real-time events where available
- **Polling** as fallback or primary method
- **Rate limiting** handling with retries
- **Health monitoring** for each integration
- **Encrypted storage** of credentials
- **Agent-driven** event processing

This architecture ensures reliable, scalable integration with all third-party services while maintaining security and performance.

---

*See `SPEC.md` for product requirements.*
*See `ARCHITECTURE.md` for system design.*
*See `AGENTS.md` for agent system details.*
*See `ROADMAP.md` for implementation phases.*
