const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redisClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

// Standard rate limiter
const standardLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Known issue with types
    sendCommand: (command, ...args) => redisClient.call(command, ...args),
    prefix: 'rl:standard:',
  }),
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.',
    });
  },
});

// Strict rate limiter for sensitive endpoints (auth)
const strictLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Known issue with types
    sendCommand: (command, ...args) => redisClient.call(command, ...args),
    prefix: 'rl:strict:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook rate limiter (more lenient)
const webhookLimiter = rateLimit({
  store: new RedisStore({
    // @ts-expect-error - Known issue with types
    sendCommand: (command, ...args) => redisClient.call(command, ...args),
    prefix: 'rl:webhook:',
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too Many Requests',
    message: 'Webhook rate limit exceeded.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for verified webhooks (implement verification)
    return req.webhookVerified === true;
  },
});

module.exports = {
  standardLimiter,
  strictLimiter,
  webhookLimiter,
};
