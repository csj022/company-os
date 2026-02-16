const Redis = require('ioredis');
const logger = require('../utils/logger');

// Use REDIS_URL if provided (Railway/production), otherwise localhost
const redisClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    })
  : new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

// Separate Redis client for pub/sub
const redisPubClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL)
  : new Redis({ host: 'localhost', port: 6379 });

const redisSubClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL)
  : new Redis({ host: 'localhost', port: 6379 });

redisPubClient.on('connect', () => {
  logger.info('Redis pub client connected');
});

redisSubClient.on('connect', () => {
  logger.info('Redis sub client connected');
});

module.exports = {
  redisClient,
  redisPubClient,
  redisSubClient,
};
