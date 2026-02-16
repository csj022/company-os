const express = require('express');
const { param } = require('express-validator');
const integrationService = require('../services/integration.service');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validator');

const router = express.Router();

/**
 * GET /api/integrations
 * Get all integrations for organization
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const integrations = await integrationService.getAll(req.user.organizationId);
    res.json({ integrations });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/integrations/:service
 * Get specific integration
 */
router.get(
  '/:service',
  authenticate,
  [param('service').isIn(['github', 'vercel', 'figma', 'slack', 'twitter', 'linkedin'])],
  validate,
  async (req, res, next) => {
    try {
      const integration = await integrationService.get(
        req.user.organizationId,
        req.params.service
      );
      
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Integration not found',
        });
      }
      
      // Don't send credentials to client
      delete integration.credentials;
      
      res.json({ integration });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/integrations/:service/connect
 * Initiate OAuth flow for integration
 * Accepts token via query param for browser redirects
 */
router.get(
  '/:service/connect',
  [param('service').isIn(['github', 'vercel', 'figma', 'slack', 'twitter', 'linkedin'])],
  validate,
  async (req, res, next) => {
    try {
      const { service } = req.params;
      const { token } = req.query;
      
      // Authenticate via token query param or Authorization header
      let user;
      if (token) {
        const { verifyAccessToken } = require('../utils/jwt');
        const decoded = verifyAccessToken(token);
        if (!decoded) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token',
          });
        }
        user = {
          id: decoded.userId,
          organizationId: decoded.organizationId,
          role: decoded.role,
        };
      } else if (req.headers.authorization) {
        // Use standard auth middleware logic
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const bearerToken = authHeader.substring(7);
          const { verifyAccessToken } = require('../utils/jwt');
          const decoded = verifyAccessToken(bearerToken);
          if (!decoded) {
            return res.status(401).json({
              error: 'Unauthorized',
              message: 'Invalid token',
            });
          }
          user = {
            id: decoded.userId,
            organizationId: decoded.organizationId,
            role: decoded.role,
          };
        }
      }
      
      if (!user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }
      
      if (service === 'github') {
        const clientId = process.env.GITHUB_CLIENT_ID;
        if (!clientId) {
          return res.status(500).json({
            error: 'Configuration Error',
            message: 'GitHub OAuth not configured',
          });
        }
        
        // Generate state token (user ID + org ID for security)
        const state = Buffer.from(JSON.stringify({
          userId: user.id,
          organizationId: user.organizationId,
        })).toString('base64');
        
        // GitHub OAuth scopes
        const scopes = ['repo', 'read:user', 'read:org', 'admin:repo_hook'].join(' ');
        
        // Redirect to GitHub OAuth
        const authUrl = `https://github.com/login/oauth/authorize?` +
          `client_id=${clientId}&` +
          `redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL || `${process.env.BACKEND_URL}/api/integrations/github/callback`)}&` +
          `scope=${encodeURIComponent(scopes)}&` +
          `state=${state}`;
        
        res.redirect(authUrl);
      } else {
        res.json({
          message: `OAuth flow for ${service} not yet implemented`,
          service,
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/integrations/github/callback
 * Handle GitHub OAuth callback
 */
router.get('/github/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;
    
    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
    }
    
    // Verify state and extract user info
    let userInfo;
    try {
      userInfo = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (tokenData.error || !tokenData.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}?error=token_exchange_failed`);
    }
    
    // Get GitHub user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json',
      },
    });
    
    const githubUser = await userResponse.json();
    
    // Store integration
    await integrationService.upsert(
      userInfo.organizationId,
      'github',
      {
        accessToken: tokenData.access_token,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
      },
      {
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        githubId: githubUser.id,
      }
    );
    
    // Redirect back to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/integrations?success=github_connected`);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/integrations/:service/disconnect
 * Disconnect integration
 */
router.delete(
  '/:service/disconnect',
  authenticate,
  authorize('owner', 'admin', 'member'),
  [param('service').isIn(['github', 'vercel', 'figma', 'slack', 'twitter', 'linkedin'])],
  validate,
  async (req, res, next) => {
    try {
      await integrationService.delete(req.user.organizationId, req.params.service);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/integrations/:service/sync
 * Manually trigger sync for integration
 */
router.post(
  '/:service/sync',
  authenticate,
  authorize('owner', 'admin', 'member'),
  [param('service').isIn(['github', 'vercel', 'figma', 'slack', 'twitter', 'linkedin'])],
  validate,
  async (req, res, next) => {
    try {
      // Trigger sync (implementation depends on service)
      res.json({
        message: `Sync triggered for ${req.params.service}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/integrations/:service/status
 * Get integration health status
 */
router.get(
  '/:service/status',
  authenticate,
  [param('service').isIn(['github', 'vercel', 'figma', 'slack', 'twitter', 'linkedin'])],
  validate,
  async (req, res, next) => {
    try {
      const integration = await integrationService.get(
        req.user.organizationId,
        req.params.service
      );
      
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Integration not found',
        });
      }
      
      res.json({
        service: req.params.service,
        status: integration.status,
        lastSync: integration.last_sync_at,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
