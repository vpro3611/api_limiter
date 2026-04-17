# Atomic Rate Limiter

A generic, high-performance Token Bucket rate limiter for Node.js. Designed for distributed systems where atomicity and reliability are critical.

## Features
- **Atomic Operations**: Prevents "double-spending" tokens in distributed environments.
- **Storage Agnostic**: Pluggable backends (Redis provided, custom providers easy to add).
- **Clock Drift Safe**: Uses storage-side time (Redis `TIME`) to ensure consistency across multiple app servers.
- **Fail-Safe Options**: Choose between `FAIL_CLOSED` (security-first) or `FAIL_OPEN` (availability-first) during storage outages.
- **TypeScript Native**: Full type safety and IDE support.

## Installation

```bash
npm install ioredis
```

## Quick Start (Redis)

```typescript
import Redis from 'ioredis';
import { TokenBucket, RedisStorage } from './src';

const redis = new Redis();
const storage = new RedisStorage(redis);

// Create a bucket: 10 tokens capacity, refills 1 token every 1 second
const limiter = new TokenBucket({
  capacity: 10,
  refillAmount: 1,
  refillIntervalMs: 1000,
  storage,
  failStrategy: 'FAIL_CLOSED'
});

async function handleRequest(userId: string) {
  const result = await limiter.consume(userId);

  if (result.allowed) {
    console.log(`Proceed! Tokens remaining: ${result.remaining}`);
  } else {
    console.log(`Rate limited! Try again in ${result.resetInMs}ms`);
  }
}
```

## Framework Integrations

The library provides built-in support for major Node.js frameworks. These are decoupled from the core to maintain a small footprint.

### Express

```typescript
import { createExpressMiddleware } from './src/middleware/express';

const limiter = new TokenBucket({ capacity: 100, refillAmount: 1, refillIntervalMs: 1000, storage });

app.use(createExpressMiddleware(limiter, {
  // Optional: identify users by API key instead of IP
  keyGenerator: (req) => req.headers['x-api-key']
}));
```

### NestJS

```typescript
// In your module providers
{
  provide: 'RATE_LIMIT_BUCKET',
  useValue: new TokenBucket({ ... })
}

// In your controller or globally
@UseGuards(RateLimitGuard)
export class AppController { ... }
```

### Next.js (Edge Middleware)

```typescript
// middleware.ts
import { nextRateLimit } from './src/middleware/next';

export async function middleware(req: NextRequest) {
  return await nextRateLimit(req, bucket);
}
```

## Configuration Options

| Option | Type | Description |
| :--- | :--- | :--- |
| `capacity` | `number` | The maximum number of tokens the bucket can hold. |
| `refillAmount` | `number` | How many tokens are added per interval. |
| `refillIntervalMs` | `number` | The interval in milliseconds for the refill. |
| `storage` | `StorageProvider` | The backend implementation (e.g., `RedisStorage`). |
| `failStrategy` | `FailStrategy` | `'FAIL_CLOSED'` (deny on error) or `'FAIL_OPEN'` (allow on error). |

## Custom Storage Provider

You can implement your own storage (e.g., PostgreSQL, MongoDB) by implementing the `StorageProvider` interface:

```typescript
import { StorageProvider, RateLimitResult } from './src';

class MyCustomStorage implements StorageProvider {
  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    // Implement atomic consumption logic here
  }
}
```
