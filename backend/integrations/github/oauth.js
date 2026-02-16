/**
 * GitHub OAuth 2.0 Flow Implementation
 * Handles connection and callback endpoints
 */

import crypto from 'crypto';

// Configuration (should be loaded from environment variables)
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'https://app.companyos.com/api/integrations/github/callback';

/**
 * OAuth state storage (in production, use Redis or database)
 */
const stateStore = new Map();

/**
 * Generate secure random state for CSRF protection
 */
export function generateSecureState() {
  const state = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  
  stateStore.set(state, {
    timestamp,
    verified: false
  });
  
  // Clean up old states (older than 10 minutes)
  for (const [key, value] of stateStore.entries()) {
    if (Date.now() - value.timestamp > 10 * 60 * 1000) {
      stateStore.delete(key);
    }
  }
  
  return state;
}

/**
 * Verify OAuth state
 */
export function verifyState(state) {
  const stateData = stateStore.get(state);
  
  if (!stateData) {
    return false;
  }
  
  // Check if state is not older than 10 minutes
  if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
    stateStore.delete(state);
    return false;
  }
  
  // Mark as verified and remove
  stateStore.delete(state);
  return true;
}

/**
 * Initiate OAuth flow - redirect to GitHub authorization
 */
export function initiateOAuthFlow(req, res) {
  const state = generateSecureState();
  
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${GITHUB_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `scope=${encodeURIComponent('repo read:user user:email read:org write:repo_hook')}&` +
    `state=${state}`;
  
  // Store state in session or cookie
  if (req.session) {
    req.session.githubOAuthState = state;
  }
  
  res.redirect(authUrl);
}

/**
 * Handle OAuth callback from GitHub
 */
export async function handleOAuthCallback(req, res, { storeIntegration, encrypt }) {
  const { code, state } = req.query;
  
  // Verify state
  if (!verifyState(state)) {
    return res.status(400).json({ 
      error: 'Invalid state',
      message: 'OAuth state verification failed. This may be a CSRF attack.'
    });
  }
  
  // Additional session check if available
  if (req.session && req.session.githubOAuthState !== state) {
    return res.status(400).json({ 
      error: 'Invalid state',
      message: 'Session state mismatch.'
    });
  }
  
  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return res.status(400).json({ 
        error: 'OAuth failed',
        message: tokenData.error_description || tokenData.error
      });
    }
    
    const { access_token, token_type, scope } = tokenData;
    
    if (!access_token) {
      return res.status(400).json({ 
        error: 'No access token',
        message: 'Failed to obtain access token from GitHub'
      });
    }
    
    // Get user info to verify token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    const userData = await userResponse.json();
    
    if (!userResponse.ok) {
      console.error('Failed to get user data:', userData);
      return res.status(400).json({ 
        error: 'Failed to verify token',
        message: 'Could not retrieve user information from GitHub'
      });
    }
    
    // Store integration (encrypt the token)
    await storeIntegration({
      organizationId: req.user?.organizationId || req.session?.organizationId,
      service: 'github',
      credentials: encrypt(access_token),
      status: 'active',
      metadata: {
        githubUserId: userData.id,
        githubUsername: userData.login,
        githubName: userData.name,
        githubEmail: userData.email,
        avatarUrl: userData.avatar_url,
        scopes: scope,
        tokenType: token_type,
        connectedAt: new Date().toISOString()
      }
    });
    
    // Clean up session
    if (req.session) {
      delete req.session.githubOAuthState;
    }
    
    // Redirect to success page
    res.redirect('/dashboard?integration=github&status=success');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Internal error',
      message: 'An error occurred during OAuth callback processing'
    });
  }
}

/**
 * Disconnect GitHub integration
 */
export async function disconnectIntegration(req, res, { removeIntegration }) {
  try {
    const organizationId = req.user?.organizationId || req.session?.organizationId;
    
    await removeIntegration(organizationId, 'github');
    
    res.json({ 
      success: true,
      message: 'GitHub integration disconnected successfully'
    });
    
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect',
      message: error.message
    });
  }
}

/**
 * Get integration status
 */
export async function getIntegrationStatus(req, res, { getIntegration, decrypt }) {
  try {
    const organizationId = req.user?.organizationId || req.session?.organizationId;
    
    const integration = await getIntegration(organizationId, 'github');
    
    if (!integration) {
      return res.json({ 
        connected: false
      });
    }
    
    // Return status without exposing credentials
    res.json({
      connected: true,
      status: integration.status,
      metadata: integration.metadata,
      lastSyncAt: integration.lastSyncAt,
      createdAt: integration.createdAt
    });
    
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      message: error.message
    });
  }
}
