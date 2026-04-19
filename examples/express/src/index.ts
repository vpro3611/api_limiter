import express from 'express';
import { TokenBucket, StorageProvider, RateLimitResult } from 'api_limiter';
import { createExpressMiddleware } from 'api_limiter/dist/middleware/express';

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

const app = express();
const port = 3000;

// 1. Setup the storage and bucket
const storage = new MemoryStorage();
const limiter = new TokenBucket({
  capacity: 10,           // 10 tokens max
  refillAmount: 2,        // Refill 2 tokens
  refillIntervalMs: 5000, // Every 5 seconds
  storage,
});

// 2. Create the middleware
const rateLimitMiddleware = createExpressMiddleware(limiter, {
  // Identify by IP
  keyGenerator: (req) => req.ip || 'unknown',
  // Custom response when limited
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have exhausted your rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// 3. Apply to routes
app.get('/', (req, res) => {
  res.send('Welcome to the Rate Limited API! Go to /api/data to test the limit.');
});

app.get('/api/data', rateLimitMiddleware, (req, res) => {
  res.json({
    message: 'Success! You accessed the protected data.',
    data: [1, 2, 3, 4, 5]
  });
});

app.listen(port, () => {
  console.log(`🚀 Express Example listening at http://localhost:${port}`);
  console.log('Try refreshing http://localhost:3000/api/data multiple times quickly.');
});
