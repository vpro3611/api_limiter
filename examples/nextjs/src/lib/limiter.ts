import Redis from 'ioredis';
import { TokenBucket, RedisStorage } from 'api_limiter';

declare global {
  var _rateLimitBucket: TokenBucket | undefined;
}

if (!globalThis._rateLimitBucket) {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  });

  const storage = new RedisStorage(redis);
  globalThis._rateLimitBucket = new TokenBucket({
    capacity: 5,
    refillAmount: 1,
    refillIntervalMs: 2000,
    storage,
  });
}

export const limiter = globalThis._rateLimitBucket as TokenBucket;
