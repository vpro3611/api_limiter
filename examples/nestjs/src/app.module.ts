import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
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

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: 'RATE_LIMIT_BUCKET',
      useValue: new TokenBucket({
        capacity: 5,
        refillAmount: 1,
        refillIntervalMs: 2000,
        storage: new MemoryStorage(),
      }),
    },
    {
      provide: 'RATE_LIMIT_OPTIONS',
      useValue: {
        keyGenerator: (req: any) => req.ip || 'unknown',
      },
    },
  ],
})
export class AppModule {}
