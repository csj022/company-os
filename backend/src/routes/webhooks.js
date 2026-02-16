const express = require('express');
const crypto = require('crypto');
const { webhookLimiter } = require('../middleware/rateLimiter');
const eventBus = require('../events/eventBus');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Verify GitHub webhook signature
 */
const verifyGitHubSignature = (payload, signature, secret) => {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
};

/**
 * Verify Vercel webhook signature
 */
const verifyVercelSignature = (payload, signature) => {
  // Vercel signature verification implementation
  return true; // Placeholder
};

/**
 * Verify Slack webhook signature
 */
const verifySlackSignature = (body, signature, timestamp) => {
  const time = Math.floor(Date.now() / 1000);
  if (Math.abs(time - timestamp) > 60 * 5) {
    return false; // Request is older than 5 minutes
  }
  
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', config.integrations.slack.signingSecret)
    .update(sigBasestring)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
};

/**
 * POST /api/webhooks/github/receive
 * GitHub webhook receiver
 */
router.post('/github/receive', webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    
    if (!verifyGitHubSignature(req.body, signature, config.integrations.github.webhookSecret)) {
      logger.warn('Invalid GitHub webhook signature');
      return res.status(401).send('Invalid signature');
    }
    
    // Publish event to event bus
    await eventBus.publish(`github.${event}`, req.body);
    
    logger.info(`GitHub webhook received: ${event}`);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('GitHub webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /api/webhooks/vercel/receive
 * Vercel webhook receiver
 */
router.post('/vercel/receive', webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers['x-vercel-signature'];
    
    if (!verifyVercelSignature(req.body, signature)) {
      logger.warn('Invalid Vercel webhook signature');
      return res.status(401).send('Invalid signature');
    }
    
    const { type } = req.body;
    
    // Publish event to event bus
    await eventBus.publish(`vercel.${type}`, req.body.payload);
    
    logger.info(`Vercel webhook received: ${type}`);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Vercel webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /api/webhooks/figma/receive
 * Figma webhook receiver
 */
router.post('/figma/receive', webhookLimiter, async (req, res) => {
  try {
    const { passcode, ...payload } = req.body;
    
    if (passcode !== config.integrations.figma.webhookSecret) {
      logger.warn('Invalid Figma webhook passcode');
      return res.status(401).send('Invalid passcode');
    }
    
    // Publish event to event bus
    await eventBus.publish(`figma.${payload.event_type}`, payload);
    
    logger.info(`Figma webhook received: ${payload.event_type}`);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Figma webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /api/webhooks/slack/events
 * Slack event subscription endpoint
 */
router.post('/slack/events', webhookLimiter, async (req, res) => {
  try {
    const { type, challenge, event } = req.body;
    
    // URL verification
    if (type === 'url_verification') {
      return res.json({ challenge });
    }
    
    // Verify signature
    const signature = req.headers['x-slack-signature'];
    const timestamp = req.headers['x-slack-request-timestamp'];
    
    if (!verifySlackSignature(JSON.stringify(req.body), signature, timestamp)) {
      logger.warn('Invalid Slack webhook signature');
      return res.status(401).send('Invalid signature');
    }
    
    // Publish event to event bus
    if (event) {
      await eventBus.publish(`slack.${event.type}`, event);
    }
    
    logger.info(`Slack event received: ${event?.type || type}`);
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Slack webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

/**
 * POST /api/webhooks/slack/interactions
 * Slack interactive components endpoint
 */
router.post('/slack/interactions', webhookLimiter, async (req, res) => {
  try {
    const payload = JSON.parse(req.body.payload);
    
    // Publish interaction event
    await eventBus.publish(`slack.interaction.${payload.type}`, payload);
    
    logger.info(`Slack interaction received: ${payload.type}`);
    res.status(200).json({ ok: true });
  } catch (error) {
    logger.error('Slack interaction error:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
