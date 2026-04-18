import Redis from 'ioredis';
import { TokenBucket, RedisStorage } from 'api_limiter';

/**
 * Singleton pattern for Redis and TokenBucket.
 * This ensures we don't create multiple connections in the Node.js runtime.
 */
const globalAny = globalThis as any;

if (!globalAny._rateLimitBucket) {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const storage = new RedisStorage(redis);
  globalAny._rateLimitBucket = new TokenBucket({
    capacity: 5,           // Allow 5 requests
    refillAmount: 1,       // Refill 1 token
    refillIntervalMs: 2000, // Every 2 seconds
    storage,
  });
}

export const limiter = globalAny._rateLimitBucket as TokenBucket;
