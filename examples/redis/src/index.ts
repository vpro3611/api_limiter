import Redis from 'ioredis';
import { TokenBucket, RedisStorage } from 'api_limiter';

/**
 * Practical Example: Using the built-in RedisStorage provider.
 * This demonstrates atomic, distributed rate limiting.
 */
async function runRedisExample() {
  // 1. Initialize Redis client
  // Assumes a Redis server is running on localhost:6379
  const redis = new Redis({
    maxRetriesPerRequest: null, // Recommended for some use cases
  });

  console.log('🔗 Connecting to Redis...');

  redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err.message);
    process.exit(1);
  });

  // 2. Initialize the pre-defined RedisStorage
  const storage = new RedisStorage(redis);

  // 3. Configure the bucket
  // 5 requests allowed, refills 1 token every 1 second
  const limiter = new TokenBucket({
    capacity: 5,
    refillAmount: 1,
    refillIntervalMs: 1000,
    storage,
    failStrategy: 'FAIL_CLOSED',
  });

  const resourceKey = 'api_resource_1';

  console.log('🚀 Starting Atomic Redis Rate Limiter Simulation');
  console.log('Config: Capacity=5, Refill=1/1s\n');

  // Simulate requests
  for (let i = 1; i <= 8; i++) {
    try {
      const result = await limiter.consume(resourceKey);
      const status = result.allowed ? '✅ ALLOWED' : '❌ BLOCKED';
      
      console.log(`[Req ${i}] ${status} | Tokens Left: ${result.remaining} | Reset: ${result.resetInMs}ms`);
    } catch (err) {
      console.error(`💥 Unexpected Error on request ${i}:`, err);
    }
    
    // Quick burst
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n⏳ Waiting 2 seconds for refill...');
  await new Promise(r => setTimeout(r, 2000));

  const finalResult = await limiter.consume(resourceKey);
  console.log(`[Req 9] ${finalResult.allowed ? '✅ ALLOWED' : '❌ BLOCKED'} | Tokens Left: ${finalResult.remaining}`);

  // Cleanup
  await redis.quit();
  console.log('\n👋 Simulation finished and Redis connection closed.');
}

runRedisExample().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
