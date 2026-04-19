import { TokenBucket, UpstashRedisStorage } from 'api_limiter';

/**
 * Singleton pattern for Upstash Redis and TokenBucket.
 * Optimized for Edge Runtime (uses fetch).
 */
const globalAny = globalThis as any;

if (!globalAny._edgeRateLimitBucket) {
  const storage = new UpstashRedisStorage({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://your-upstash-url.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'your-upstash-token',
  });

  globalAny._edgeRateLimitBucket = new TokenBucket({
    capacity: 10,           // More permissive for global middleware?
    refillAmount: 2,
    refillIntervalMs: 5000,
    storage,
  });
}

export const edgeLimiter = globalAny._edgeRateLimitBucket as TokenBucket;
