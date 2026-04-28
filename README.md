# Atomic Rate Limiter 🚀

A generic, high-performance **Token Bucket** rate limiter for Node.js and Edge environments. Built for distributed systems where atomicity, reliability, and framework-agnosticism are critical.

## 🌟 Why choose this?

-   **Distributed Correctness**: Uses Lua scripts in Redis to ensure all operations are atomic across multiple app servers. No race conditions.
-   **Clock Drift Safe**: Does **not** trust your application server's clock. It uses the storage-side time (e.g., Redis `TIME`) as the source of truth for refills.
-   **Pluggable Backend**: Use the built-in Redis provider (TCP), the Upstash provider (HTTP/Edge), or implement your own.
-   **Fail-Safe Strategies**: Configurable `FAIL_OPEN` or `FAIL_CLOSED` behavior when your storage backend goes offline.
- **Framework Friendly**: Built-in, zero-dependency middleware for **Express**, **NestJS**, and **Next.js**.

## ⚙️ Runtime Compatibility

This library is fully compatible with both **Node.js** and **Edge Runtime** (e.g., Next.js Middleware, Cloudflare Workers).

| Environment | Context | Supported? | Recommended Storage |
| :--- | :--- | :--- | :--- |
| **Node.js** | Express / NestJS / Fastify | ✅ **Yes** | `RedisStorage` (TCP) |
| **Next.js** | Route Handlers (API) | ✅ **Yes** | `RedisStorage` (TCP) |
| **Next.js** | Edge Middleware | ✅ **Yes** | `UpstashRedisStorage` (HTTP) |

---

## 📦 Installation

```bash
npm install ioredis
npm i @vpro3611/req-shield
```

---

## 🚀 Quick Start

### For Node.js (Standard Redis via TCP)

```typescript
import Redis from 'ioredis';
import { TokenBucket, RedisStorage } from 'api_limiter';

const redis = new Redis();
const storage = new RedisStorage(redis);

const limiter = new TokenBucket({
  capacity: 10,
  refillAmount: 10,
  refillIntervalMs: 60000,
  storage,
});
```

### For Edge Runtime (Upstash Redis via HTTP)

Perfect for **Next.js Middleware** or Vercel Edge Functions where TCP is not available.

```typescript
import { TokenBucket, UpstashRedisStorage } from 'api_limiter';

const storage = new UpstashRedisStorage({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const limiter = new TokenBucket({
  capacity: 10,
  refillAmount: 10,
  refillIntervalMs: 60000,
  storage,
});
```

---

## 🛠 Framework Integrations

### Express Middleware

`keyGenerator` receives a fully-typed Express `Request`. `handler` receives `Request`, `Response`, and optionally `NextFunction`.

```typescript
import { createExpressMiddleware, ExpressMiddlewareOptions } from 'api_limiter/express';

app.use(createExpressMiddleware(bucket, {
  keyGenerator: (req) => req.ip ?? 'unknown',
  handler: (req, res) => res.status(429).json({ error: 'Too many requests' })
}));
```

### NestJS Guard

`keyGenerator` receives an Express `Request` (default Express adapter). Export type: `NestMiddlewareOptions`.

```typescript
import { RateLimitGuard, NestMiddlewareOptions } from 'api_limiter/nestjs';

// Use the built-in RateLimitGuard with Dependency Injection
@UseGuards(RateLimitGuard)
@Get('data')
getData() { ... }
```

### Next.js (Middleware & Route Handlers)

`keyGenerator` receives a `NextRequest`. Use `x-forwarded-for` for IP — `NextRequest` does not expose `.ip` as a typed property. Export type: `NextMiddlewareOptions`.

```typescript
import { nextRateLimit, NextMiddlewareOptions } from 'api_limiter/next';

export async function middleware(req: NextRequest) {
  return await nextRateLimit(req, edgeLimiter, {
    keyGenerator: (req) => req.headers.get('x-forwarded-for') ?? 'anonymous',
  });
}
```

---

## 🛡 Handling Backend Failures

Distributed systems fail. This library lets you decide how to handle it:

-   **`FAIL_CLOSED` (Default)**: If Redis is down, all calls return `allowed: false`. Protects your system from overload.
-   **`FAIL_OPEN`**: If Redis is down, all calls return `allowed: true`. Prioritizes user experience.

---

## 📜 License
MIT
