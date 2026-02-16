const { redisPubClient, redisSubClient } = require('../config/redis');
const logger = require('../utils/logger');

class EventBus {
  constructor() {
    this.handlers = new Map();
    this.setupSubscriptions();
  }
  
  /**
   * Set up Redis pub/sub subscriptions
   */
  setupSubscriptions() {
    redisSubClient.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });
    
    redisSubClient.on('error', (err) => {
      logger.error('Redis subscription error:', err);
    });
  }
  
  /**
   * Publish an event
   */
  async publish(eventType, data) {
    try {
      const message = JSON.stringify({
        eventType,
        data,
        timestamp: new Date().toISOString(),
      });
      
      await redisPubClient.publish(`companyos:events:${eventType}`, message);
      
      logger.debug(`Event published: ${eventType}`);
    } catch (error) {
      logger.error(`Failed to publish event ${eventType}:`, error);
      throw error;
    }
  }
  
  /**
   * Subscribe to an event type
   */
  async subscribe(eventType, handler) {
    try {
      const channel = `companyos:events:${eventType}`;
      
      // Add handler to local map
      if (!this.handlers.has(eventType)) {
        this.handlers.set(eventType, []);
      }
      this.handlers.get(eventType).push(handler);
      
      // Subscribe to Redis channel
      await redisSubClient.subscribe(channel);
      
      logger.debug(`Subscribed to event: ${eventType}`);
    } catch (error) {
      logger.error(`Failed to subscribe to event ${eventType}:`, error);
      throw error;
    }
  }
  
  /**
   * Unsubscribe from an event type
   */
  async unsubscribe(eventType, handler) {
    try {
      const channel = `companyos:events:${eventType}`;
      
      // Remove handler from local map
      if (this.handlers.has(eventType)) {
        const handlers = this.handlers.get(eventType);
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
        
        // If no more handlers, unsubscribe from Redis
        if (handlers.length === 0) {
          this.handlers.delete(eventType);
          await redisSubClient.unsubscribe(channel);
        }
      }
      
      logger.debug(`Unsubscribed from event: ${eventType}`);
    } catch (error) {
      logger.error(`Failed to unsubscribe from event ${eventType}:`, error);
      throw error;
    }
  }
  
  /**
   * Handle incoming message from Redis
   */
  async handleMessage(channel, message) {
    try {
      const { eventType, data, timestamp } = JSON.parse(message);
      
      // Get handlers for this event type
      const handlers = this.handlers.get(eventType) || [];
      
      // Execute all handlers
      for (const handler of handlers) {
        try {
          await handler(data, { eventType, timestamp });
        } catch (error) {
          logger.error(`Error in event handler for ${eventType}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error handling message:', error);
    }
  }
  
  /**
   * Get all active subscriptions
   */
  getSubscriptions() {
    return Array.from(this.handlers.keys());
  }
}

// Export singleton instance
module.exports = new EventBus();
