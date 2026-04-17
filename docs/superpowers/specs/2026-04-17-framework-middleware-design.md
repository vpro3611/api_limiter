# Design Spec: Framework Middleware Integrations

## 1. Overview
This extension to the `api_limiter` library provides "baked-in" support for popular Node.js web frameworks: Express, NestJS, and Next.js. The goal is to provide easy-to-use middleware/guards while keeping the core library lightweight and free of mandatory external dependencies.

## 2. Architecture
Each framework integration will live in its own file under `src/middleware/`. To avoid runtime dependencies, framework-specific types will be imported as `type` only, and the implementation will rely on the standard `TokenBucket` class.

### Integrations
- **Express**: A factory function returning a standard `(req, res, next)` middleware.
- **NestJS**: A `RateLimitGuard` implementation for the `CanActivate` interface.
- **Next.js**: A utility function compatible with Next.js Edge Middleware and API routes.

## 3. Interfaces & Configuration
A common configuration interface will be used across all integrations:

```typescript
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

## 4. Implementation Details

### Express (`src/middleware/express.ts`)
- extracts IP from `req.ip`.
- Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After` (on 429).
- Calls `next()` if allowed, returns `429` if blocked.

### NestJS (`src/middleware/nestjs.ts`)
- Implements `CanActivate`.
- Throws `HttpException` (429) when limited.
- Expects `TokenBucket` to be provided via dependency injection (e.g., using a custom token like `RATE_LIMIT_BUCKET`).

### Next.js (`src/middleware/next.ts`)
- Compatible with `NextRequest` and `NextResponse`.
- Returns `NextResponse.next()` with headers if allowed.
- Returns `new NextResponse(..., { status: 429 })` if blocked.

## 5. Testing Strategy
- **Isolation**: Tests will mock the framework's Request/Response objects to avoid requiring a running server.
- **Header Verification**: Tests must verify that all standard rate-limit headers are set correctly.
- **Behavioral Verification**: Verify that `next()` is called on success and the correct status code is sent on failure.

## 6. Dependency Management
- Framework types (e.g., `@types/express`) will be added as **devDependencies**.
- Frameworks themselves will be listed as **peerDependencies** if necessary, or simply documented as supported.
