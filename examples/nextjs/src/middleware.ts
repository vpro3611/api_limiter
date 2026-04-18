import { NextRequest, NextResponse } from 'next/server';
import { nextRateLimit } from 'api_limiter/dist/middleware/next';
import { TokenBucket, StorageProvider, RateLimitResult } from 'api_limiter';

// --- A real In-Memory Storage implementation ---
class MemoryStorage implements StorageProvider {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: capacity, lastRefill: now };
    const elapsed = now - bucket.lastRefill;
    const currentTokens = Math.min(capacity, bucket.tokens + (elapsed * fillRate));

    let allowed = false;
    let newTokens = currentTokens;
    if (currentTokens >= amount) {
      newTokens = currentTokens - amount;
      allowed = true;
    }

    this.buckets.set(key, { tokens: newTokens, lastRefill: now });
    return {
      allowed,
      remaining: Math.floor(newTokens),
      resetInMs: Math.ceil((capacity - newTokens) / fillRate),
    };
  }
}

/**
 * In Next.js dev mode, the middleware is often re-initialized.
 * We use globalThis to persist the bucket state across requests in local development.
 */
const getBucket = () => {
  const globalAny = globalThis as any;
  if (!globalAny._rateLimitBucket) {
    globalAny._rateLimitBucket = new TokenBucket({
      capacity: 3,
      refillAmount: 1,
      refillIntervalMs: 5000,
      storage: new MemoryStorage(),
    });
  }
  return globalAny._rateLimitBucket;
};

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api')) {
    const bucket = getBucket();
    const res = await nextRateLimit(req, bucket);
    
    // Log headers to help verify it's working
    console.log(`[RateLimit] ${req.nextUrl.pathname} | Remaining: ${res.headers.get('X-RateLimit-Remaining')}`);
    
    return res;
  }
}

export const config = {
  matcher: '/api/:path*',
};
