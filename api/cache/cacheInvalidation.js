const registryCache = require('./registryCache');

// Cache invalidation patterns
const INVALIDATION_PATTERNS = {
  // When roles are updated, invalidate role-related caches
  'roles': ['roles:', 'dashboards:', 'experience:'],
  
  // When dashboards are updated, invalidate dashboard-related caches
  'dashboards': ['dashboards:', 'dashboard-config:'],
  
  // When approval policies are updated, invalidate approval-related caches
  'approval_policies': ['approval_policies:', 'approvals:'],
  
  // When fund requests are updated, invalidate fund request-related caches
  'fund_requests': ['fundRequest:', 'fund_requests:'],
  
  // Global invalidation for major updates
  'all': ['']
};

/**
 * Invalidate cache entries based on entity type
 * @param {string} entityType - Type of entity that was updated
 */
function invalidateCache(entityType) {
  const patterns = INVALIDATION_PATTERNS[entityType] || [];
  
  // If we have specific patterns, invalidate matching keys
  if (patterns.length > 0) {
    for (const pattern of patterns) {
      // For global invalidation, clear all
      if (pattern === '') {
        registryCache.clearAll();
        return;
      }
      
      // Get all cache keys
      const stats = registryCache.getStats();
      
      // Clear keys matching the pattern
      for (const key of stats.keys) {
        if (key.startsWith(pattern)) {
          registryCache.clear(key);
        }
      }
    }
  }
}

/**
 * Invalidate specific cache key
 * @param {string} key - Specific cache key to invalidate
 */
function invalidateCacheKey(key) {
  registryCache.clear(key);
}

/**
 * Invalidate all cache entries
 */
function invalidateAllCache() {
  registryCache.clearAll();
}

module.exports = {
  invalidateCache,
  invalidateCacheKey,
  invalidateAllCache
};