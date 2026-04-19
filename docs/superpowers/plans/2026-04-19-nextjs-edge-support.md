# Next.js Edge Runtime Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable rate limiting in Next.js Middleware (Edge Runtime) by adding a `fetch`-based storage provider and a specialized middleware helper.

**Architecture:** We will implement an `UpstashRedisStorage` that uses the `fetch` API to interact with the Upstash Redis REST API. This is necessary because standard Redis (TCP) is not supported in the Edge Runtime. We will also ensure that the Next.js middleware helper is cleanly separated to avoid pulling in Node.js-only dependencies.

**Tech Stack:** TypeScript, Next.js (Edge Runtime compatible), Fetch API.

---

### Task 1: Create Edge-Compatible Storage Provider

**Files:**
- Create: `src/storage/UpstashRedisStorage.ts`
- Test: `test/storage/UpstashRedisStorage.test.ts`

- [ ] **Step 1: Write the storage provider implementation**
```typescript
import { StorageProvider } from './StorageProvider';
import { RateLimitResult } from '../types';

export interface UpstashConfig {
  url: string;
  token: string;
}

export class UpstashRedisStorage implements StorageProvider {
  constructor(private config: UpstashConfig) {}

  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    const LUA_SCRIPT = `
      local key = KEYS[1]
      local capacity = tonumber(ARGV[1])
      local fillRate = tonumber(ARGV[2])
      local amount = tonumber(ARGV[3])
      
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
      local ttl = math.ceil((capacity / fillRate) / 1000) + 60
      redis.call('EXPIRE', key, ttl)

      local resetInMs = math.ceil((capacity - currentTokens) / fillRate)
      return { allowed and 1 or 0, currentTokens, resetInMs }
    `;

    const response = await fetch(\`\${this.config.url}/eval\`, {
      method: 'POST',
      headers: {
        Authorization: \`Bearer \${this.config.token}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: LUA_SCRIPT,
        args: [capacity.toString(), fillRate.toString(), amount.toString()],
        keys: [key],
      }),
    });

    if (!response.ok) {
      throw new Error(\`Upstash Redis error: \${response.statusText}\`);
    }

    const { result } = await response.json();
    const [allowed, remaining, resetInMs] = result;

    return {
      allowed: allowed === 1,
      remaining: Math.floor(remaining),
      resetInMs: Math.ceil(resetInMs),
    };
  }
}
```

- [ ] **Step 2: Export from main index**
Modify `src/index.ts` to export `UpstashRedisStorage`.

- [ ] **Step 3: Commit**
```bash
git add src/storage/UpstashRedisStorage.ts src/index.ts
git commit -m "feat: add UpstashRedisStorage for Edge Runtime support"
```

---

### Task 2: Refactor Next.js Middleware for Purity

**Files:**
- Modify: `src/middleware/next.ts`

- [ ] **Step 1: Ensure Next.js middleware doesn't import Node dependencies**
Verify that `src/middleware/next.ts` only imports from `next/server` and internal runtime-agnostic files.

- [ ] **Step 2: Update middleware logic if needed**
The current logic in `src/middleware/next.ts` looks okay, but we should make sure it's exported in a way that works well with Next.js bundling.

---

### Task 3: Update Next.js Example to Demonstrate Edge Usage

**Files:**
- Modify: `examples/nextjs/src/lib/limiter.ts` (or equivalent)
- Create: `examples/nextjs/middleware.ts`

- [ ] **Step 1: Create a middleware example**
Show how to use `UpstashRedisStorage` in `middleware.ts`.

- [ ] **Step 2: Add instructions to README**
Explain the difference between Node.js (Route Handlers) and Edge (Middleware) environments.
