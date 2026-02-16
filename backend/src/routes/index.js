const express = require('express');
const authRoutes = require('./auth');
const organizationRoutes = require('./organizations');
const integrationRoutes = require('./integrations');
const webhookRoutes = require('./webhooks');
const githubRoutes = require('./github');
const deploymentRoutes = require('./deployments');
const aiAssistantRoutes = require('./ai-assistant');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/integrations', integrationRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/github', githubRoutes);
router.use('/deployments', deploymentRoutes);
router.use('/ai/assistant', aiAssistantRoutes);

module.exports = router;
