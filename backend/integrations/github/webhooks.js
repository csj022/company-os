/**
 * GitHub Webhook Handler
 * Receives and verifies webhook events from GitHub
 */

import crypto from 'crypto';

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

/**
 * Verify GitHub webhook signature
 * GitHub signs webhooks with HMAC-SHA256
 */
export function verifyGitHubSignature(payload, signature, secret = WEBHOOK_SECRET) {
  if (!signature) {
    return false;
  }
  
  // GitHub sends signature as sha256=<hash>
  const expectedSignature = signature;
  
  // Calculate HMAC
  const hmac = crypto.createHmac('sha256', secret);
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
  hmac.update(payloadString);
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(calculatedSignature)
  );
}

/**
 * Main webhook receiver endpoint
 */
export async function receiveWebhook(req, res, { eventBus }) {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];
  
  // Verify signature
  if (!verifyGitHubSignature(req.rawBody || req.body, signature)) {
    console.error('Invalid webhook signature', { deliveryId, event });
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const payload = req.body;
  
  console.log(`Received GitHub webhook: ${event} (${deliveryId})`);
  
  // Process event asynchronously via event bus
  try {
    await eventBus.publish(`github.${event}`, {
      event,
      deliveryId,
      payload,
      receivedAt: new Date().toISOString()
    });
    
    // Respond immediately to GitHub
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error publishing webhook event:', error);
    // Still respond 200 to GitHub to avoid retries
    res.status(200).json({ received: true, error: 'Processing failed' });
  }
}

/**
 * Setup webhook for a repository
 */
export async function setupWebhook(client, owner, repo, webhookUrl, secret = WEBHOOK_SECRET) {
  try {
    // Check if webhook already exists
    const existingWebhooks = await client.listWebhooks(owner, repo);
    
    for (const hook of existingWebhooks.data) {
      if (hook.config.url === webhookUrl) {
        console.log(`Webhook already exists for ${owner}/${repo}`);
        return { webhook: hook, created: false };
      }
    }
    
    // Create new webhook
    const webhook = await client.createWebhook(owner, repo, webhookUrl, secret);
    
    console.log(`Created webhook for ${owner}/${repo}`);
    return { webhook: webhook.data, created: true };
    
  } catch (error) {
    console.error(`Failed to setup webhook for ${owner}/${repo}:`, error.message);
    throw error;
  }
}

/**
 * Remove webhook from a repository
 */
export async function removeWebhook(client, owner, repo, webhookUrl) {
  try {
    const webhooks = await client.listWebhooks(owner, repo);
    
    for (const hook of webhooks.data) {
      if (hook.config.url === webhookUrl) {
        await client.deleteWebhook(owner, repo, hook.id);
        console.log(`Removed webhook ${hook.id} from ${owner}/${repo}`);
        return true;
      }
    }
    
    console.log(`No webhook found for ${owner}/${repo} with URL ${webhookUrl}`);
    return false;
    
  } catch (error) {
    console.error(`Failed to remove webhook from ${owner}/${repo}:`, error.message);
    throw error;
  }
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload(event, payload) {
  const requiredFields = {
    'pull_request': ['action', 'pull_request', 'repository'],
    'push': ['ref', 'repository', 'commits'],
    'issues': ['action', 'issue', 'repository'],
    'deployment': ['deployment', 'repository'],
    'release': ['action', 'release', 'repository']
  };
  
  const required = requiredFields[event];
  if (!required) {
    return true; // Unknown event, accept it
  }
  
  for (const field of required) {
    if (!payload[field]) {
      console.warn(`Missing required field '${field}' in ${event} webhook payload`);
      return false;
    }
  }
  
  return true;
}

/**
 * Extract repository info from webhook payload
 */
export function extractRepositoryInfo(payload) {
  const repo = payload.repository;
  
  if (!repo) {
    return null;
  }
  
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    isPrivate: repo.private,
    defaultBranch: repo.default_branch,
    url: repo.html_url
  };
}

/**
 * Extract pull request info from webhook payload
 */
export function extractPullRequestInfo(payload) {
  const pr = payload.pull_request;
  
  if (!pr) {
    return null;
  }
  
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    body: pr.body,
    state: pr.state,
    author: pr.user.login,
    baseBranch: pr.base.ref,
    headBranch: pr.head.ref,
    url: pr.html_url,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    closedAt: pr.closed_at
  };
}
