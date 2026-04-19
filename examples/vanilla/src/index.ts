import { TokenBucket, StorageProvider, RateLimitResult } from 'api_limiter';

/**
 * A simple in-memory storage implementation.
 * Demonstrates how to implement the StorageProvider interface for any database.
 */
class MemoryStorage implements StorageProvider {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  async consume(
    key: string,
    amount: number,
    capacity: number,
    fillRate: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: capacity, lastRefill: now };

    // 1. Calculate refill
    const elapsed = now - bucket.lastRefill;
    const refilled = elapsed * fillRate;
    const currentTokens = Math.min(capacity, bucket.tokens + refilled);

    // 2. Check if allowed
    let allowed = false;
    let newTokens = currentTokens;

    if (currentTokens >= amount) {
      newTokens = currentTokens - amount;
      allowed = true;
    }

    // 3. Update state
    this.buckets.set(key, { tokens: newTokens, lastRefill: now });

    // 4. Calculate reset time (ms until full)
    const resetInMs = Math.ceil((capacity - newTokens) / fillRate);

    return {
      allowed,
      remaining: Math.floor(newTokens),
      resetInMs,
    };
  }
}

// --- Practical Example ---

async function runExample() {
  const storage = new MemoryStorage();
  
  // Configure: 5 requests allowed, refills 1 token every 2 seconds
  const limiter = new TokenBucket({
    capacity: 5,
    refillAmount: 1,
    refillIntervalMs: 2000,
    storage,
  });

  const userId = 'user_123';

  console.log('🚀 Starting Rate Limiter Simulation (Vanilla Node.js)');
  console.log('Config: Capacity=5, Refill=1/2s\n');

  // Simulate a burst of 7 requests
  for (let i = 1; i <= 7; i++) {
    const result = await limiter.consume(userId);
    const status = result.allowed ? '✅ ALLOWED' : '❌ BLOCKED';
    
    console.log(`[Request ${i}] ${status} | Tokens: ${result.remaining} | Reset: ${result.resetInMs}ms`);
    
    // Wait 200ms between burst requests
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n⏳ Waiting 3 seconds for refill...');
  await new Promise(r => setTimeout(r, 3000));

  // Try again after some refill
  const finalResult = await limiter.consume(userId);
  console.log(`[Request 8] ${finalResult.allowed ? '✅ ALLOWED' : '❌ BLOCKED'} | Tokens: ${finalResult.remaining}`);
}

runExample().catch(console.error);
