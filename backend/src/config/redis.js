const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_URL?.replace('redis://', '') || 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
};

// Main Redis client for caching
const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

// Separate Redis client for pub/sub
const redisPubClient = new Redis(redisConfig);
const redisSubClient = new Redis(redisConfig);

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
