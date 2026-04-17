# API Rate Limiter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a generic, pluggable token bucket rate limiter with atomic Redis support.

**Architecture:** A `TokenBucket` class that orchestrates consumption logic via a `StorageProvider` interface. The `RedisStorage` implementation uses a Lua script for atomicity and storage-side time calculation to avoid clock drift.

**Tech Stack:** TypeScript, `ioredis` (for Redis storage).

---

### Task 1: Setup Dependencies and Project Structure

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json` (if needed, but it exists)

- [ ] **Step 1: Install dependencies**
Run: `npm install ioredis`
Run: `npm install -D vitest @types/node`

- [ ] **Step 2: Update package.json scripts**
Add test script: `"test": "vitest"`

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: setup dependencies for rate limiter"
```

---

### Task 2: Define Core Types and Interfaces

**Files:**
- Create: `src/types.ts`
- Create: `src/storage/StorageProvider.ts`

- [ ] **Step 1: Define RateLimitResult and RefillOptions**
```typescript
// src/types.ts
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export interface BucketOptions {
  capacity: number;
  refillAmount: number;
  refillIntervalMs: number;
}
```

- [ ] **Step 2: Define StorageProvider interface**
```typescript
// src/storage/StorageProvider.ts
import { RateLimitResult } from '../types';

export interface StorageProvider {
  consume(
    key: string,
    amount: number,
    capacity: number,
    fillRate: number
  ): Promise<RateLimitResult>;
}
```

- [ ] **Step 3: Commit**
```bash
git add src/types.ts src/storage/StorageProvider.ts
git commit -m "feat: define core types and storage interface"
```

---

### Task 3: Implement TokenBucket Class

**Files:**
- Create: `src/TokenBucket.ts`
- Create: `test/TokenBucket.test.ts`

- [ ] **Step 1: Write failing unit test for TokenBucket**
```typescript
// test/TokenBucket.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TokenBucket } from '../src/TokenBucket';
import { StorageProvider } from '../src/storage/StorageProvider';

describe('TokenBucket', () => {
  it('should delegate consumption to storage provider', async () => {
    const mockStorage: StorageProvider = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetInMs: 100 })
    };
    const bucket = new TokenBucket({
      capacity: 10,
      refillAmount: 1,
      refillIntervalMs: 1000,
      storage: mockStorage
    });

    const result = await bucket.consume('test-key', 1);
    
    expect(result.allowed).toBe(true);
    expect(mockStorage.consume).toHaveBeenCalledWith('test-key', 1, 10, 0.001);
  });
});
```

- [ ] **Step 2: Implement TokenBucket class**
```typescript
// src/TokenBucket.ts
import { StorageProvider } from './storage/StorageProvider';
import { RateLimitResult, BucketOptions } from './types';

export interface TokenBucketOptions extends BucketOptions {
  storage: StorageProvider;
}

export class TokenBucket {
  constructor(private readonly options: TokenBucketOptions) {}

  async consume(key: string, amount: number = 1): Promise<RateLimitResult> {
    const fillRate = this.options.refillAmount / this.options.refillIntervalMs;
    return this.options.storage.consume(
      key,
      amount,
      this.options.capacity,
      fillRate
    );
  }
}
```

- [ ] **Step 3: Run tests**
Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add src/TokenBucket.ts test/TokenBucket.test.ts
git commit -m "feat: implement TokenBucket class with unit tests"
```

---

### Task 4: Implement RedisStorage with Lua Script

**Files:**
- Create: `src/storage/RedisStorage.ts`

- [ ] **Step 1: Implement RedisStorage class**
```typescript
// src/storage/RedisStorage.ts
import Redis from 'ioredis';
import { StorageProvider } from './StorageProvider';
import { RateLimitResult } from '../types';

const LUA_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local fillRate = tonumber(ARGV[2])
  local amount = tonumber(ARGV[3])
  
  -- Get Redis server time
  local time = redis.call('TIME')
  local now = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)

  local state = redis.call('HMGET', key, 'tokens', 'lastRefill')
  local lastTokens = tonumber(state[1]) or capacity
  local lastRefill = tonumber(state[2]) or now

  local elapsed = math.max(0, now - lastRefill)
  local refilled = elapsed * fillRate
  local currentTokens = math.min(capacity, lastTokens + refilled)

  local allowed = false
  if currentTokens >= amount then
    currentTokens = currentTokens - amount
    allowed = true
  end

  redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
  
  -- Key expires after it would be fully refilled (plus buffer)
  local ttl = math.ceil((capacity / fillRate) / 1000) + 60
  redis.call('EXPIRE', key, ttl)

  local resetInMs = math.ceil((capacity - currentTokens) / fillRate)
  
  return { allowed and 1 or 0, currentTokens, resetInMs }
`;

export class RedisStorage implements StorageProvider {
  constructor(private readonly redis: Redis) {
    this.redis.defineCommand('consumeTokenBucket', {
      numberOfKeys: 1,
      lua: LUA_SCRIPT,
    });
  }

  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    const [allowed, remaining, resetInMs] = await (this.redis as any).consumeTokenBucket(
      key,
      capacity,
      fillRate,
      amount
    );

    return {
      allowed: allowed === 1,
      remaining,
      resetInMs
    };
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add src/storage/RedisStorage.ts
git commit -m "feat: implement RedisStorage with atomic Lua script"
```

---

### Task 5: Integration Testing and Exports

**Files:**
- Create: `test/RedisStorage.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write integration tests for Redis (Optional if Redis available)**
```typescript
// test/RedisStorage.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Redis from 'ioredis';
import { RedisStorage } from '../src/storage/RedisStorage';

describe('RedisStorage Integration', () => {
  let redis: Redis;
  let storage: RedisStorage;

  beforeAll(() => {
    redis = new Redis(); // Assumes local redis
    storage = new RedisStorage(redis);
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('should enforce rate limits correctly across calls', async () => {
    const key = 'test-ratelimit-' + Date.now();
    
    // First call
    const res1 = await storage.consume(key, 5, 10, 0.001);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(5);

    // Second call
    const res2 = await storage.consume(key, 6, 10, 0.001);
    expect(res2.allowed).toBe(false);
    expect(res2.remaining).toBe(5);
  });
});
```

- [ ] **Step 2: Setup public exports**
```typescript
// src/index.ts
export * from './types';
export * from './TokenBucket';
export * from './storage/StorageProvider';
export * from './storage/RedisStorage';
```

- [ ] **Step 3: Final Test Run**
Run: `npm test`

- [ ] **Step 4: Commit**
```bash
git add src/index.ts test/RedisStorage.test.ts
git commit -m "feat: add integration tests and public exports"
```
