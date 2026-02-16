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
 * POST /api/integrations/:service/connect
 * Initiate OAuth flow for integration
 */
router.post(
  '/:service/connect',
  authenticate,
  authorize('owner', 'admin', 'member'),
  [param('service').isIn(['github', 'vercel', 'figma', 'slack', 'twitter', 'linkedin'])],
  validate,
  async (req, res, next) => {
    try {
      const { service } = req.params;
      
      // Implementation would redirect to OAuth URL
      // For now, return placeholder
      res.json({
        message: `OAuth flow for ${service} not yet implemented`,
        service,
      });
    } catch (error) {
      next(error);
    }
  }
);

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
