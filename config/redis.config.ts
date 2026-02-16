/**
 * Redis Configuration for CompanyOS
 * 
 * Supports:
 * - Caching (session, API responses, agent results, analytics)
 * - Pub/Sub (event bus for real-time updates)
 * - Rate limiting
 * - Job queues (with BullMQ)
 */

import Redis, { RedisOptions } from 'ioredis';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REDIS_CONFIG: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  
  // Connection settings
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Reconnection strategy
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  // Connection timeout
  connectTimeout: 10000,
  
  // Keep-alive
  keepAlive: 30000,
  
  // TLS for production
  ...(process.env.REDIS_TLS === 'true' && {
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  }),
};

// ============================================================================
// CACHE LAYERS
// ============================================================================

/**
 * Cache TTL configuration (in seconds)
 */
export const CACHE_TTL = {
  // L1: User session data
  SESSION: 24 * 60 * 60, // 24 hours
  
  // L2: API responses
  API_RESPONSE: 5 * 60, // 5 minutes
  API_RESPONSE_SHORT: 60, // 1 minute
  API_RESPONSE_LONG: 15 * 60, // 15 minutes
  
  // L3: Agent task results
  AGENT_TASK: 60 * 60, // 1 hour
  AGENT_STATUS: 30, // 30 seconds
  
  // L4: Analytics aggregations
  ANALYTICS: 15 * 60, // 15 minutes
  ANALYTICS_REALTIME: 30, // 30 seconds
  
  // Integration data
  GITHUB_DATA: 5 * 60, // 5 minutes
  VERCEL_DATA: 2 * 60, // 2 minutes
  FIGMA_DATA: 10 * 60, // 10 minutes
  SOCIAL_DATA: 5 * 60, // 5 minutes
  
  // Rate limiting
  RATE_LIMIT: 60, // 1 minute
} as const;

/**
 * Cache key prefixes for organized namespacing
 */
export const CACHE_PREFIX = {
  SESSION: 'session',
  API: 'api',
  AGENT: 'agent',
  ANALYTICS: 'analytics',
  GITHUB: 'github',
  VERCEL: 'vercel',
  FIGMA: 'figma',
  SOCIAL: 'social',
  RATE_LIMIT: 'ratelimit',
  LOCK: 'lock',
  QUEUE: 'queue',
} as const;

// ============================================================================
// REDIS CLIENTS
// ============================================================================

/**
 * Main Redis client for caching
 */
export const redisClient = new Redis(REDIS_CONFIG);

/**
 * Separate client for Pub/Sub (subscriber)
 */
export const redisPubSubClient = new Redis(REDIS_CONFIG);

/**
 * Separate client for Pub/Sub (publisher)
 */
export const redisPublisher = new Redis(REDIS_CONFIG);

// ============================================================================
// CONNECTION EVENTS
// ============================================================================

redisClient.on('connect', () => {
  console.log('✅ Redis cache client connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis cache client error:', err);
});

redisPubSubClient.on('connect', () => {
  console.log('✅ Redis Pub/Sub subscriber connected');
});

redisPubSubClient.on('error', (err) => {
  console.error('❌ Redis Pub/Sub subscriber error:', err);
});

redisPublisher.on('connect', () => {
  console.log('✅ Redis Pub/Sub publisher connected');
});

redisPublisher.on('error', (err) => {
  console.error('❌ Redis Pub/Sub publisher error:', err);
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a cache key with prefix
 */
export function cacheKey(prefix: keyof typeof CACHE_PREFIX, ...parts: string[]): string {
  return `${CACHE_PREFIX[prefix]}:${parts.join(':')}`;
}

/**
 * Get cached value (with JSON parsing)
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached value (with JSON stringification)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<boolean> {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Error deleting cache for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      return await redisClient.del(...keys);
    }
    return 0;
  } catch (error) {
    console.error(`Error deleting cache pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Increment a counter with optional TTL
 */
export async function incrementCounter(
  key: string,
  ttl?: number
): Promise<number> {
  try {
    const value = await redisClient.incr(key);
    if (ttl && value === 1) {
      // Only set TTL on first increment
      await redisClient.expire(key, ttl);
    }
    return value;
  } catch (error) {
    console.error(`Error incrementing counter ${key}:`, error);
    return 0;
  }
}

/**
 * Distributed lock implementation
 */
export async function acquireLock(
  resource: string,
  ttl: number = 30
): Promise<boolean> {
  const lockKey = cacheKey('LOCK', resource);
  try {
    const result = await redisClient.set(lockKey, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  } catch (error) {
    console.error(`Error acquiring lock for ${resource}:`, error);
    return false;
  }
}

/**
 * Release distributed lock
 */
export async function releaseLock(resource: string): Promise<boolean> {
  const lockKey = cacheKey('LOCK', resource);
  try {
    await redisClient.del(lockKey);
    return true;
  } catch (error) {
    console.error(`Error releasing lock for ${resource}:`, error);
    return false;
  }
}

// ============================================================================
// PUB/SUB CHANNELS
// ============================================================================

/**
 * Event channels for Pub/Sub
 */
export const PUBSUB_CHANNELS = {
  // Deployment events
  DEPLOYMENT_CREATED: 'deployment:created',
  DEPLOYMENT_READY: 'deployment:ready',
  DEPLOYMENT_ERROR: 'deployment:error',
  
  // Pull request events
  PR_OPENED: 'pr:opened',
  PR_UPDATED: 'pr:updated',
  PR_MERGED: 'pr:merged',
  PR_REVIEWED: 'pr:reviewed',
  
  // Agent events
  AGENT_TASK_STARTED: 'agent:task:started',
  AGENT_TASK_COMPLETED: 'agent:task:completed',
  AGENT_TASK_FAILED: 'agent:task:failed',
  AGENT_TASK_NEEDS_APPROVAL: 'agent:task:needs_approval',
  
  // Social events
  SOCIAL_POST_PUBLISHED: 'social:post:published',
  SOCIAL_POST_SCHEDULED: 'social:post:scheduled',
  
  // System events
  EVENT_CREATED: 'event:created',
  WEBHOOK_RECEIVED: 'webhook:received',
} as const;

/**
 * Publish an event to a channel
 */
export async function publishEvent<T>(
  channel: string,
  data: T
): Promise<boolean> {
  try {
    await redisPublisher.publish(channel, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error publishing to channel ${channel}:`, error);
    return false;
  }
}

/**
 * Subscribe to a channel
 */
export async function subscribeChannel(
  channel: string,
  handler: (data: any) => void
): Promise<void> {
  await redisPubSubClient.subscribe(channel);
  
  redisPubSubClient.on('message', (receivedChannel, message) => {
    if (receivedChannel === channel) {
      try {
        const data = JSON.parse(message);
        handler(data);
      } catch (error) {
        console.error(`Error handling message from ${channel}:`, error);
      }
    }
  });
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribeChannel(channel: string): Promise<void> {
  await redisPubSubClient.unsubscribe(channel);
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

export async function disconnectRedis(): Promise<void> {
  console.log('🔌 Disconnecting Redis clients...');
  await Promise.all([
    redisClient.quit(),
    redisPubSubClient.quit(),
    redisPublisher.quit(),
  ]);
  console.log('✅ Redis clients disconnected');
}

// Handle process termination
process.on('SIGTERM', disconnectRedis);
process.on('SIGINT', disconnectRedis);

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  client: redisClient,
  pubsub: redisPubSubClient,
  publisher: redisPublisher,
  config: REDIS_CONFIG,
  ttl: CACHE_TTL,
  prefix: CACHE_PREFIX,
  channels: PUBSUB_CHANNELS,
};
