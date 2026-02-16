/**
 * Rate Limiter Utility
 * Simple in-memory rate limiter for API requests
 */

class RateLimiter {
  constructor(config = {}) {
    this.maxRequests = config.maxRequests || 100;
    this.windowMs = config.windowMs || 60000; // 1 minute default
    this.requests = new Map(); // key -> [timestamps]
  }

  /**
   * Check if request is within rate limit
   * @param {string} key - Unique identifier for rate limit bucket
   * @throws {Error} if rate limit exceeded
   */
  async checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this key
    let keyRequests = this.requests.get(key) || [];

    // Remove requests outside the current window
    keyRequests = keyRequests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (keyRequests.length >= this.maxRequests) {
      const oldestRequest = keyRequests[0];
      const resetTime = oldestRequest + this.windowMs;
      const waitTime = Math.ceil((resetTime - now) / 1000);
      
      throw new Error(
        `Rate limit exceeded. Max ${this.maxRequests} requests per ${this.windowMs / 1000}s. Try again in ${waitTime}s.`
      );
    }

    // Add current request
    keyRequests.push(now);
    this.requests.set(key, keyRequests);

    return {
      allowed: true,
      remaining: this.maxRequests - keyRequests.length,
      resetAt: new Date(now + this.windowMs)
    };
  }

  /**
   * Get current usage for a key
   */
  getUsage(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const keyRequests = (this.requests.get(key) || [])
      .filter(timestamp => timestamp > windowStart);

    return {
      used: keyRequests.length,
      remaining: this.maxRequests - keyRequests.length,
      limit: this.maxRequests,
      resetAt: new Date(now + this.windowMs)
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clearAll() {
    this.requests.clear();
  }

  /**
   * Cleanup old entries (garbage collection)
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(t => t > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

module.exports = { RateLimiter };
