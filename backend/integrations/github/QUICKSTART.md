# GitHub Integration - Quick Start Guide

Get the GitHub integration running in 5 minutes.

## Prerequisites

- Node.js v18+ installed
- GitHub account
- Access to GitHub repository settings

## 1. Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `@octokit/rest` - GitHub API client
- `@octokit/webhooks` - Webhook handling
- `@octokit/graphql` - GraphQL support
- `@octokit/plugin-throttling` - Rate limiting
- `express` - Web framework
- `dotenv` - Environment variables

## 2. Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name**: `CompanyOS` (or your app name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/integrations/github/callback`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret" and copy it

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:

```bash
# GitHub OAuth (from step 2)
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:3000/api/integrations/github/callback

# Generate this encryption key:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=your_64_character_hex_key

# Generate webhook secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here
GITHUB_WEBHOOK_URL=http://localhost:3000/api/webhooks/github/receive

# App config
NODE_ENV=development
PORT=3000
```

**Generate encryption key**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Run Example Server

```bash
node integrations/github/example.js
```

You should see:
```
🚀 GitHub Integration Example Server Running

Server:    http://localhost:3000
Connect:   http://localhost:3000/api/integrations/github/connect
...
```

## 5. Connect GitHub Account

1. Open http://localhost:3000 in your browser
2. Click "Connect GitHub"
3. Authorize the application
4. You'll be redirected back with success message

## 6. Test the Integration

### Check Status
```bash
curl http://localhost:3000/api/integrations/github/status
```

### Check Health
```bash
curl http://localhost:3000/api/integrations/github/health
```

### List Repositories
```bash
curl http://localhost:3000/api/integrations/github/repositories
```

### Trigger Sync
```bash
curl -X POST http://localhost:3000/api/integrations/github/sync
```

## 7. Set Up Webhooks (Optional)

For local development, use ngrok to expose your local server:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

Update `.env`:
```bash
GITHUB_WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/github/receive
```

Then in your GitHub repository:
1. Go to Settings → Webhooks → Add webhook
2. Payload URL: `https://abc123.ngrok.io/api/webhooks/github/receive`
3. Content type: `application/json`
4. Secret: (use your `GITHUB_WEBHOOK_SECRET` from .env)
5. Events: Select individual events:
   - Pull requests
   - Pushes
   - Issues
   - Issue comments
   - Deployments
   - Deployment statuses
   - Releases
6. Click "Add webhook"

Now when you open a PR or push code, you'll see webhook events in your console!

## Testing Webhook Events

### Manual Test
```bash
curl -X POST http://localhost:3000/api/webhooks/github/receive \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: test-123" \
  -H "X-Hub-Signature-256: sha256=$(echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac 'your_webhook_secret' | cut -d' ' -f2)" \
  -d '{"test":"data"}'
```

### Using GitHub CLI
```bash
# Install: https://cli.github.com/
gh webhook forward --repo=owner/repo \
  --url=http://localhost:3000/api/webhooks/github/receive \
  --events=pull_request,push
```

## Production Deployment

### 1. Update Environment Variables

Change URLs to production:
```bash
GITHUB_REDIRECT_URI=https://app.companyos.com/api/integrations/github/callback
GITHUB_WEBHOOK_URL=https://app.companyos.com/api/webhooks/github/receive
NODE_ENV=production
```

### 2. Update GitHub OAuth App

In GitHub OAuth settings, add production callback URL:
- https://app.companyos.com/api/integrations/github/callback

### 3. Implement Required Dependencies

The example server uses in-memory storage. For production, implement:

```javascript
// Database storage
async function storeIntegration(data) {
  return await db.integrations.create(data);
}

async function getIntegration(organizationId, service) {
  return await db.integrations.findOne({ organizationId, service });
}

// Event bus (Redis, RabbitMQ, etc.)
const eventBus = {
  async publish(event, data) {
    await redis.publish(event, JSON.stringify(data));
  },
  subscribe(event, handler) {
    redis.subscribe(event);
    redis.on('message', (channel, message) => {
      if (channel === event) handler(JSON.parse(message));
    });
  }
};

// Agent spawning
async function spawnAgent(agentType, config) {
  return await agentSystem.spawn(agentType, config);
}
```

### 4. Deploy

```bash
npm run start
```

Or use PM2 for process management:
```bash
pm2 start index.js --name companyos-backend
```

## Troubleshooting

### "Invalid state" error
- Clear browser cookies
- Try connecting again
- Check that `GITHUB_CLIENT_ID` is correct

### "Rate limit exceeded"
- Check health endpoint for rate limit status
- Wait for rate limit to reset (shown in health check)
- Use GraphQL for complex queries (more efficient)

### Webhooks not received
- Verify webhook URL is publicly accessible
- Check webhook secret matches .env
- Review webhook delivery log in GitHub repository settings
- Ensure signature verification is working

### "Integration not found"
- Make sure you connected GitHub first
- Check that organizationId is set correctly
- Verify integration is stored in database

## Next Steps

1. **Explore the code**: Check out the module files in `integrations/github/`
2. **Read documentation**: See `GITHUB_INTEGRATION.md` for full details
3. **Implement agents**: Create AI agents for code review, deployment, etc.
4. **Add database**: Replace in-memory storage with PostgreSQL/MongoDB
5. **Scale**: Deploy to production with load balancing

## Support

- Documentation: `GITHUB_INTEGRATION.md`
- Module README: `integrations/github/README.md`
- Example code: `integrations/github/example.js`
- Tests: `integrations/github/test-crypto.js`

## Common Commands

```bash
# Install dependencies
npm install

# Run example server
node integrations/github/example.js

# Run crypto tests
node integrations/github/test-crypto.js

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Check integration status
curl http://localhost:3000/api/integrations/github/status

# Manual sync
curl -X POST http://localhost:3000/api/integrations/github/sync
```

Happy integrating! 🚀
