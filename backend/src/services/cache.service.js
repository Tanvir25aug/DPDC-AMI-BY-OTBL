const logger = require('../config/logger');

/**
 * Simple in-memory cache service for high-traffic endpoints
 * Prevents database overload when 200+ users access the same data
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`[Cache] HIT: ${key}`);
    return item.value;
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiry = Date.now() + ttl;

    this.cache.set(key, {
      value,
      expiry,
      createdAt: new Date()
    });

    logger.debug(`[Cache] SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`[Cache] DELETE: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`[Cache] CLEARED: ${size} items removed`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`[Cache] CLEANUP: ${cleaned} expired items removed`);
    }

    return cleaned;
  }

  /**
   * Start automatic cleanup interval
   */
  startCleanupInterval(intervalMs = 60000) { // Default 1 minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);

    logger.info(`[Cache] Cleanup interval started: every ${intervalMs}ms`);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('[Cache] Cleanup interval stopped');
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Start cleanup on module load
cacheService.startCleanupInterval();

module.exports = cacheService;
