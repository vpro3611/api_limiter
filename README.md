# Atomic Rate Limiter 🚀

A generic, high-performance **Token Bucket** rate limiter for Node.js. Built for distributed systems where atomicity, reliability, and framework-agnosticism are critical.

## 🌟 Why choose this?

-   **Distributed Correctness**: Uses Lua scripts in Redis to ensure all operations are atomic across multiple app servers. No race conditions.
-   **Clock Drift Safe**: Does **not** trust your application server's clock. It uses the storage-side time (e.g., Redis `TIME`) as the source of truth for refills.
-   **Pluggable Backend**: Use the built-in Redis provider or implement your own (PostgreSQL, MongoDB, etc.) with a single interface.
-   **Fail-Safe Strategies**: Configurable `FAIL_OPEN` or `FAIL_CLOSED` behavior when your storage backend goes offline.
-   **Framework Friendly**: Built-in, zero-dependency middleware for **Express**, **NestJS**, and **Next.js**.

---

## 📦 Installation

```bash
npm install ioredis
```

---

## 🚀 Quick Start (Redis)

Set up a rate limiter that allows **10 requests per minute** with burst support.

```typescript
import Redis from 'ioredis';
import { TokenBucket, RedisStorage } from './api_limiter';

// 1. Initialize storage
const redis = new Redis();
const storage = new RedisStorage(redis);

// 2. Configure the bucket
const limiter = new TokenBucket({
  capacity: 10,           // Max burst size
  refillAmount: 10,       // How many tokens are added
  refillIntervalMs: 60000, // Every 1 minute
  storage,
  failStrategy: 'FAIL_CLOSED' // Deny requests if Redis is down
});

// 3. Consume tokens
async function apiAction(userId: string) {
  const result = await limiter.consume(userId);

  if (result.allowed) {
    console.log(`Success! Remaining: ${result.remaining}`);
  } else {
    console.log(`Rate limited! Retry after ${result.resetInMs}ms`);
  }
}
```

---

## 🛠 Framework Integrations

The library provides optional, lightweight integrations for major frameworks.

### Express Middleware
```typescript
import { createExpressMiddleware } from 'api_limiter/express';

const bucket = new TokenBucket({ ... });

app.use(createExpressMiddleware(bucket, {
  // Use API key instead of IP for identification
  keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
  // Custom action on rate limit
  handler: (req, res) => res.status(429).json({ error: 'Chill out!' })
}));
```

### NestJS Guard
```typescript
// app.module.ts
@Module({
  providers: [
    { provide: 'RATE_LIMIT_BUCKET', useValue: new TokenBucket({ ... }) },
    RateLimitGuard
  ]
})

// controller.ts
@UseGuards(RateLimitGuard)
@Get('secure-data')
getData() { ... }
```

### Next.js (Edge Middleware)
```typescript
// middleware.ts
import { nextRateLimit } from 'api_limiter/next';

export async function middleware(req: NextRequest) {
  return await nextRateLimit(req, bucket);
}
```

---

## 📖 API Reference

### `TokenBucket`

#### `new TokenBucket(options)`
- `capacity`: Maximum tokens in the bucket.
- `refillAmount`: Number of tokens added per interval.
- `refillIntervalMs`: Interval duration in ms.
- `storage`: A class implementing `StorageProvider`.
- `failStrategy`: `'FAIL_OPEN'` (allow on error) or `'FAIL_CLOSED'` (deny on error).

#### `consume(key: string, amount: number = 1): Promise<RateLimitResult>`
Consumes the specified amount of tokens for the given key.

**Returns `RateLimitResult`:**
- `allowed: boolean`: Whether the request should proceed.
- `remaining: number`: How many tokens are left in the bucket.
- `resetInMs: number`: How long until the bucket is full again.

---

## 🛡 Handling Backend Failures

Distributed systems fail. This library lets you decide how to handle it:

-   **`FAIL_CLOSED` (Default)**: If Redis is down, all `consume()` calls return `allowed: false`. Best for protecting your database from massive spikes during a cache failure.
-   **`FAIL_OPEN`**: If Redis is down, all calls return `allowed: true`. Best for prioritizing user experience when rate limiting is a "nice-to-have".

```typescript
const limiter = new TokenBucket({
  // ...
  failStrategy: 'FAIL_OPEN' 
});
```

---

## 🔌 Custom Storage Provider

Building a custom provider (e.g., for PostgreSQL) is simple. Just implement the `StorageProvider` interface:

```typescript
import { StorageProvider, RateLimitResult } from 'api_limiter';

class PostgresStorage implements StorageProvider {
  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    // 1. Run an atomic SQL transaction
    // 2. Refill based on DB time
    // 3. Check if tokens >= amount
    // 4. Update and return results
  }
}
```

---

## 📈 Performance Tip: Choosing Capacity & Refill

The **Token Bucket** algorithm is great because it handles **bursts**.

-   **Low Burst**: `capacity: 5`, `refillAmount: 5`, `refillIntervalMs: 60000` (Strict 5 reqs/min).
-   **High Burst**: `capacity: 50`, `refillAmount: 5`, `refillIntervalMs: 60000` (Allows 50 reqs at once, then refills slowly).

---

## 📜 License
MIT
