import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { nextRateLimit } from 'api_limiter/dist/middleware/next';
import { TokenBucket, RedisStorage } from 'api_limiter';

/**
 * Singleton pattern for Redis and TokenBucket to ensure consistency
 * and efficient connection pooling in the Next.js Edge Runtime.
 */
const getRateLimiter = () => {
  const globalAny = globalThis as any;

  if (!globalAny._rateLimitBucket) {
    // 1. Initialize Redis client
    // In production, you would use an environment variable: process.env.REDIS_URL
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });

    // 2. Initialize storage and bucket
    const storage = new RedisStorage(redis);
    globalAny._rateLimitBucket = new TokenBucket({
      capacity: 5,           // Allow 5 requests
      refillAmount: 1,       // Refill 1 token
      refillIntervalMs: 2000, // Every 2 seconds
      storage,
    });
  }

  return globalAny._rateLimitBucket;
};

export async function middleware(req: NextRequest) {
  // Only apply rate limiting to /api routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const bucket = getRateLimiter();
    const res = await nextRateLimit(req, bucket);
    
    // Log for debugging visibility
    const remaining = res.headers.get('X-RateLimit-Remaining');
    console.log(`[RateLimit] ${req.nextUrl.pathname} | Remaining: ${remaining}`);
    
    return res;
  }
}

export const config = {
  matcher: '/api/:path*',
};
