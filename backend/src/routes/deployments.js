const express = require('express');
const { param, query, body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validator');
const { query: dbQuery } = require('../config/database');
const integrationService = require('../services/integration.service');
const { decrypt } = require('../utils/encryption');

const router = express.Router();

/**
 * GET /api/deployments
 * Get all deployments for organization
 */
router.get(
  '/',
  authenticate,
  [
    query('state').optional().isString(),
    query('environment').optional().isIn(['production', 'preview', 'development']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      let whereClause = 'organization_id = $1';
      const params = [req.user.organizationId];

      if (req.query.state) {
        const states = req.query.state.split(',');
        whereClause += ` AND state = ANY($${params.length + 1})`;
        params.push(states);
      }

      if (req.query.environment) {
        whereClause += ` AND environment = $${params.length + 1}`;
        params.push(req.query.environment);
      }

      const limit = req.query.limit || 50;

      const result = await dbQuery(
        `SELECT 
          d.id, d.vercel_deployment_id, d.project_name, d.url, d.state,
          d.environment, d.commit_sha, d.branch, d.agent_checked,
          d.health_score, d.metadata, d.created_at, d.updated_at, d.ready_at,
          u.name as creator_name, u.email as creator_email
         FROM deployments d
         LEFT JOIN users u ON d.creator_id = u.id
         WHERE ${whereClause}
         ORDER BY d.created_at DESC
         LIMIT $${params.length + 1}`,
        [...params, limit]
      );

      res.json({ deployments: result.rows });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/deployments/:deploymentId
 * Get specific deployment details
 */
router.get('/:deploymentId', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT 
        d.*,
        u.name as creator_name, u.email as creator_email
       FROM deployments d
       LEFT JOIN users u ON d.creator_id = u.id
       WHERE d.id = $1 AND d.organization_id = $2`,
      [req.params.deploymentId, req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Deployment not found',
      });
    }

    res.json({ deployment: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/deployments/deploy
 * Trigger a new deployment
 */
router.post(
  '/deploy',
  authenticate,
  authorize('owner', 'admin', 'member'),
  [
    body('projectName').isString(),
    body('environment').isIn(['production', 'preview', 'development']),
    body('branch').optional().isString(),
    body('commitSha').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      // Get Vercel integration
      const integration = await integrationService.get(req.user.organizationId, 'vercel');
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Vercel integration not found. Please connect Vercel first.',
        });
      }

      const credentials = JSON.parse(decrypt(integration.credentials_encrypted));

      // Trigger Vercel deployment
      const axios = require('axios');
      const response = await axios.post(
        `https://api.vercel.com/v13/deployments`,
        {
          name: req.body.projectName,
          gitSource: {
            type: 'github',
            ref: req.body.branch || 'main',
            sha: req.body.commitSha,
          },
          target: req.body.environment,
        },
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const vercelDeployment = response.data;

      // Store deployment in database
      const result = await dbQuery(
        `INSERT INTO deployments (
          organization_id, vercel_deployment_id, project_name, url, state,
          environment, commit_sha, branch, creator_id, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          req.user.organizationId,
          vercelDeployment.id,
          req.body.projectName,
          vercelDeployment.url || `https://${vercelDeployment.id}.vercel.app`,
          vercelDeployment.readyState || 'queued',
          req.body.environment,
          req.body.commitSha,
          req.body.branch,
          req.user.id,
          JSON.stringify({
            vercelProjectId: vercelDeployment.projectId,
            creator: req.user.email,
          }),
        ]
      );

      res.json({
        success: true,
        deployment: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/deployments/:deploymentId/rollback
 * Rollback to a previous deployment
 */
router.post(
  '/:deploymentId/rollback',
  authenticate,
  authorize('owner', 'admin'),
  async (req, res, next) => {
    try {
      // Get deployment details
      const deployment = await dbQuery(
        `SELECT * FROM deployments WHERE id = $1 AND organization_id = $2`,
        [req.params.deploymentId, req.user.organizationId]
      );

      if (deployment.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Deployment not found',
        });
      }

      const oldDeployment = deployment.rows[0];

      // Get Vercel integration
      const integration = await integrationService.get(req.user.organizationId, 'vercel');
      if (!integration) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Vercel integration not found',
        });
      }

      const credentials = JSON.parse(decrypt(integration.credentials_encrypted));

      // Promote old deployment
      const axios = require('axios');
      await axios.patch(
        `https://api.vercel.com/v9/deployments/${oldDeployment.vercel_deployment_id}/promote`,
        {},
        {
          headers: {
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        }
      );

      res.json({
        success: true,
        message: 'Deployment rolled back successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/deployments/:deploymentId/logs
 * Get deployment logs
 */
router.get('/:deploymentId/logs', authenticate, async (req, res, next) => {
  try {
    // Get deployment details
    const deployment = await dbQuery(
      `SELECT * FROM deployments WHERE id = $1 AND organization_id = $2`,
      [req.params.deploymentId, req.user.organizationId]
    );

    if (deployment.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Deployment not found',
      });
    }

    const dep = deployment.rows[0];

    // Get Vercel integration
    const integration = await integrationService.get(req.user.organizationId, 'vercel');
    if (!integration) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Vercel integration not found',
      });
    }

    const credentials = JSON.parse(decrypt(integration.credentials_encrypted));

    // Fetch logs from Vercel
    const axios = require('axios');
    const response = await axios.get(
      `https://api.vercel.com/v2/deployments/${dep.vercel_deployment_id}/events`,
      {
        headers: {
          Authorization: `Bearer ${credentials.accessToken}`,
        },
      }
    );

    const logs = response.data.map((event) => {
      return `[${new Date(event.created).toISOString()}] ${event.type}: ${event.payload?.text || ''}`;
    });

    res.json({ logs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deployments/stats
 * Get deployment statistics
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const result = await dbQuery(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'ready') as successful,
        COUNT(*) FILTER (WHERE state = 'error') as failed,
        COUNT(*) FILTER (WHERE state = 'building') as building,
        COUNT(*) FILTER (WHERE environment = 'production') as production,
        AVG(EXTRACT(EPOCH FROM (ready_at - created_at))) as avg_build_time
       FROM deployments
       WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
      [req.user.organizationId]
    );

    res.json({ stats: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
