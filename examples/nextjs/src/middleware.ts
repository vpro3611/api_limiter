import { NextRequest } from 'next/server';
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

const storage = new MemoryStorage();
const bucket = new TokenBucket({
  capacity: 3,
  refillAmount: 1,
  refillIntervalMs: 5000,
  storage,
});

export async function middleware(req: NextRequest) {
  // Only rate limit API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    return await nextRateLimit(req, bucket);
  }
}

export const config = {
  matcher: '/api/:path*',
};
