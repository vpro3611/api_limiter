import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';
import { RedisStorage } from '../src/storage/RedisStorage';

describe('RedisStorage Integration', () => {
  let redis: Redis;
  let storage: RedisStorage;

  beforeAll(() => {
    // Note: This requires a running Redis instance on localhost:6379
    redis = new Redis();
    storage = new RedisStorage(redis);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should enforce rate limits correctly across calls', async () => {
    const key = 'test-ratelimit-' + Date.now();
    
    // First call: consume 5 tokens from a capacity of 10
    const res1 = await storage.consume(key, 5, 10, 0.001);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(5);

    // Second call: try to consume 6 tokens, should fail
    const res2 = await storage.consume(key, 6, 10, 0.001);
    expect(res2.allowed).toBe(false);
    expect(res2.remaining).toBe(5);
    
    // Third call: consume remaining 5 tokens
    const res3 = await storage.consume(key, 5, 10, 0.001);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });
});
