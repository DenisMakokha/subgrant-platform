// Simple in-memory cache for registry data with hot-reload support

class RegistryCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.ttls = new Map();
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found/expired
   */
  get(key) {
    const ttl = this.ttls.get(key);
    if (ttl === undefined) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    if (Date.now() - timestamp > ttl) {
      // Expired
      this.cache.delete(key);
      this.timestamps.delete(key);
      this.ttls.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = 300000) { // Default 5 minutes
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
    this.ttls.set(key, ttl);
  }

  /**
   * Clear cached value
   * @param {string} key - Cache key
   */
  clear(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.ttls.delete(key);
  }

  /**
   * Clear all cached values
   */
  clearAll() {
    this.cache.clear();
    this.timestamps.clear();
    this.ttls.clear();
  }

  /**
   * Get cache stats
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const registryCache = new RegistryCache();

module.exports = registryCache;