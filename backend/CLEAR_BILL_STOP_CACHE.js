/**
 * Clear Bill Stop Analysis Cache
 * Run this after updating the bill stop analysis queries
 */

const cacheService = require('./src/services/cache.service');

console.log('Clearing bill stop analysis cache...');

// Clear specific cache key
const cacheKey = 'bill_stop_analysis';
const deleted = cacheService.delete(cacheKey);

if (deleted) {
  console.log('✅ Bill stop analysis cache cleared successfully');
} else {
  console.log('ℹ️  No cache found for bill stop analysis (this is normal if cache was already expired)');
}

console.log('\nCache stats:');
const stats = cacheService.getStats();
console.log('- Total cache keys:', stats.size);
console.log('- Cache keys:', stats.keys.join(', ') || 'none');
console.log('\nYou can now run the bill stop analysis again to use the updated queries.');

process.exit(0);
