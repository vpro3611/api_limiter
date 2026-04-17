# Framework Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement baked-in, type-safe middleware integrations for Express, NestJS, and Next.js.

**Architecture:** Framework-specific factory functions or classes that wrap the `TokenBucket` logic, handling request key extraction and response header management.

**Tech Stack:** TypeScript, `vitest`.

---

### Task 1: Setup Dev Dependencies

- [x] **Step 1: Install framework types**
Run: `npm install -D @types/express @nestjs/common next`

- [x] **Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add dev dependencies for framework integrations"
```

---

### Task 3: Define Common Middleware Types

**Files:**
- Create: `src/middleware/types.ts`

- [x] **Step 1: Implement common types**
```typescript
// src/middleware/types.ts
export interface MiddlewareOptions {
  /**
   * Function to generate a unique key for the request.
   * Defaults to IP address extraction.
   */
  keyGenerator?: (req: any) => string | Promise<string>;

  /**
   * Optional custom handler for when a request is rate limited.
   */
  handler?: (req: any, res: any, next?: any) => void | Promise<void>;
}
```

- [x] **Step 2: Commit**
```bash
git add src/middleware/types.ts
git commit -m "feat: define common middleware types"
```

---

### Task 4: Implement Express Middleware

**Files:**
- Create: `src/middleware/express.ts`
- Create: `test/middleware/express.test.ts`

- [x] **Step 1: Write tests for Express middleware**
```typescript
// test/middleware/express.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createExpressMiddleware } from '../../src/middleware/express';
import { TokenBucket } from '../../src/TokenBucket';

describe('Express Middleware', () => {
  it('should call next() if allowed', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetInMs: 100 }),
      options: { capacity: 10 }
    } as any;
    
    const middleware = createExpressMiddleware(bucket);
    const req = { ip: '127.0.0.1' } as any;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
  });

  it('should return 429 if blocked', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: false, remaining: 0, resetInMs: 1000 }),
      options: { capacity: 10 }
    } as any;
    
    const middleware = createExpressMiddleware(bucket);
    const req = { ip: '127.0.0.1' } as any;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 1);
  });
});
```

- [x] **Step 2: Implement Express middleware**
```typescript
// src/middleware/express.ts
import type { Request, Response, NextFunction } from 'express';
import { TokenBucket } from '../TokenBucket';
import { MiddlewareOptions } from './types';

export function createExpressMiddleware(bucket: TokenBucket, options: MiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = options.keyGenerator 
        ? await options.keyGenerator(req) 
        : req.ip || 'unknown';
      
      const result = await bucket.consume(key);

      res.setHeader('X-RateLimit-Limit', bucket.options.capacity);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil(result.resetInMs / 1000));
        
        if (options.handler) {
          return options.handler(req, res, next);
        }
        return res.status(429).send('Too Many Requests');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
```

- [x] **Step 3: Run tests**
Run: `npm test test/middleware/express.test.ts`

- [x] **Step 4: Commit**
```bash
git add src/middleware/express.ts test/middleware/express.test.ts
git commit -m "feat: implement express middleware integration"
```

---

### Task 5: Implement NestJS Guard

**Files:**
- Create: `src/middleware/nestjs.ts`
- Create: `test/middleware/nestjs.test.ts`

- [x] **Step 1: Write tests for NestJS Guard**
```typescript
// test/middleware/nestjs.test.ts
import { describe, it, expect, vi } from 'vitest';
import { RateLimitGuard } from '../../src/middleware/nestjs';

describe('NestJS Guard', () => {
  it('should allow access if bucket permits', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, resetInMs: 0 }),
      options: { capacity: 10 }
    } as any;
    
    const guard = new RateLimitGuard(bucket);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '1.2.3.4' }),
        getResponse: () => ({ setHeader: vi.fn() })
      })
    } as any;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw HttpException if blocked', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: false, remaining: 0, resetInMs: 1000 }),
      options: { capacity: 10 }
    } as any;
    
    const guard = new RateLimitGuard(bucket);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '1.2.3.4' }),
        getResponse: () => ({ setHeader: vi.fn() })
      })
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow('Too Many Requests');
  });
});
```

- [x] **Step 2: Implement NestJS Guard**
```typescript
// src/middleware/nestjs.ts
import { CanActivate, ExecutionContext, Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { TokenBucket } from '../TokenBucket';
import { MiddlewareOptions } from './types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject('RATE_LIMIT_BUCKET') private bucket: TokenBucket,
    private options: MiddlewareOptions = {}
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    const key = this.options.keyGenerator 
      ? await this.options.keyGenerator(request) 
      : request.ip || 'unknown';

    const result = await this.bucket.consume(key);

    response.setHeader('X-RateLimit-Limit', this.bucket.options.capacity.toString());
    response.setHeader('X-RateLimit-Remaining', result.remaining.toString());

    if (!result.allowed) {
      response.setHeader('Retry-After', Math.ceil(result.resetInMs / 1000).toString());
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
```

- [x] **Step 3: Run tests**
Run: `npm test test/middleware/nestjs.test.ts`

- [x] **Step 4: Commit**
```bash
git add src/middleware/nestjs.ts test/middleware/nestjs.test.ts
git commit -m "feat: implement nestjs guard integration"
```

---

### Task 6: Implement Next.js Integration

**Files:**
- Create: `src/middleware/next.ts`
- Create: `test/middleware/next.test.ts`

- [x] **Step 1: Write tests for Next.js utility**
```typescript
// test/middleware/next.test.ts
import { describe, it, expect, vi } from 'vitest';
import { nextRateLimit } from '../../src/middleware/next';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ headers: new Map(), status: 200 })),
    json: vi.fn((data, init) => ({ headers: new Map(), status: init.status, data }))
  }
}));

describe('Next.js Integration', () => {
  it('should return next response if allowed', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, resetInMs: 0 }),
      options: { capacity: 10 }
    } as any;
    
    const req = { ip: '1.2.3.4' } as any;
    const res = await nextRateLimit(req, bucket);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  it('should return 429 response if blocked', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: false, remaining: 0, resetInMs: 1000 }),
      options: { capacity: 10 }
    } as any;
    
    const req = { ip: '1.2.3.4' } as any;
    const res = await nextRateLimit(req, bucket);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('1');
  });
});
```

- [x] **Step 2: Implement Next.js utility**
```typescript
// src/middleware/next.ts
import { NextRequest, NextResponse } from 'next/server';
import { TokenBucket } from '../TokenBucket';
import { MiddlewareOptions } from './types';

export async function nextRateLimit(
  req: NextRequest, 
  bucket: TokenBucket, 
  options: MiddlewareOptions = {}
) {
  const key = options.keyGenerator 
    ? await options.keyGenerator(req) 
    : (req.ip || 'anonymous');
    
  const result = await bucket.consume(key);

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', bucket.options.capacity.toString());
  res.headers.set('X-RateLimit-Remaining', result.remaining.toString());

  if (!result.allowed) {
    const limitedRes = NextResponse.json(
      { error: 'Too Many Requests' }, 
      { status: 429 }
    );
    limitedRes.headers.set('X-RateLimit-Limit', bucket.options.capacity.toString());
    limitedRes.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    limitedRes.headers.set('Retry-After', Math.ceil(result.resetInMs / 1000).toString());
    return limitedRes;
  }

  return res;
}
```

- [x] **Step 3: Run tests**
Run: `npm test test/middleware/next.test.ts`

- [x] **Step 4: Commit**
```bash
git add src/middleware/next.ts test/middleware/next.test.ts
git commit -m "feat: implement next.js integration"
```

---

### Task 7: Update Exports and Verification

**Files:**
- Modify: `src/index.ts`

- [x] **Step 1: Update public exports**
```typescript
// src/index.ts
export * from './types';
export * from './TokenBucket';
export * from './storage/StorageProvider';
export * from './storage/RedisStorage';
export * from './middleware/types';
export * from './middleware/express';
export * from './middleware/nestjs';
export * from './middleware/next';
```

- [x] **Step 2: Final test run**
Run: `npm test`

- [x] **Step 3: Commit**
```bash
git add src/index.ts
git commit -m "feat: export framework middlewares"
```
