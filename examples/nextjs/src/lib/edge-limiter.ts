import { TokenBucket, UpstashRedisStorage } from 'api_limiter';

declare global {
  var _edgeRateLimitBucket: TokenBucket | undefined;
}

if (!globalThis._edgeRateLimitBucket) {
  const storage = new UpstashRedisStorage({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://your-upstash-url.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'your-upstash-token',
  });

  globalThis._edgeRateLimitBucket = new TokenBucket({
    capacity: 10,
    refillAmount: 2,
    refillIntervalMs: 5000,
    storage,
  });
}

export const edgeLimiter = globalThis._edgeRateLimitBucket as TokenBucket;
