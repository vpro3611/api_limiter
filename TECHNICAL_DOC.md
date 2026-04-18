# Technical Documentation: Atomic Token Bucket

## Architecture Overview

The library follows a **Delegated Atomic Logic** pattern. Instead of the application server calculating token counts (which leads to race conditions in distributed systems), the logic is moved as close to the data as possible.

### Core Components

1.  **TokenBucket (Orchestrator)**:
    - Validates configuration on initialization.
    - Calculates the `fillRate` (tokens per millisecond).
    - Handles failure strategies (`FAIL_OPEN` / `FAIL_CLOSED`).
    - Acts as the primary entry point for the consumer.

2.  **StorageProvider (Interface)**:
    - Decouples the algorithm from the database.
    - Defines a single `consume` method that must be implemented atomically by the provider.

3.  **RedisStorage (Implementation)**:
    - Implements the `StorageProvider` using Redis.
    - Uses a custom Lua script to perform all calculations in a single atomic step.

## The Token Bucket Algorithm

We use a "Leaky Bucket as a Meter" variant (Token Bucket).
- **Tokens** are added at a constant rate.
- **Capacity** limits the maximum "burst" size.
- **Consumption** happens immediately if enough tokens exist.

### Formula
`Current Tokens = min(Capacity, Last Tokens + (Current Time - Last Refill Time) * Fill Rate)`

## Redis Lua Script Logic

The Lua script is the engine of the `RedisStorage` provider. It performs the following steps inside Redis:

1.  **Time Sync**: Calls `redis.call('TIME')` to get the microsecond-accurate time from the Redis server. This ensures that even if application servers have different system clocks, the rate limit remains consistent.
2.  **State Retrieval**: Fetches the current token count and the timestamp of the last refill from a Redis Hash.
3.  **Refill Calculation**: Computes the tokens gained since the last interaction.
4.  **Consumption Check**: If the resulting token count is greater than or equal to the requested `amount`, it decrements the count.
5.  **Persistence**: Saves the new token count and the current timestamp back to the Hash.
6.  **Automatic Cleanup**: Sets a TTL (Time To Live) on the key. The TTL is calculated as the time it would take to fully refill the bucket plus a safety buffer (60s), ensuring Redis memory is cleaned up for inactive keys.

## Error Handling & Failure Strategies

- **Input Validation**: The constructor throws errors for non-positive values to prevent division by zero or infinite refill loops in the storage layer.
- **Fail Strategy**:
    - `FAIL_CLOSED`: On storage error (e.g., Redis down), `consume()` returns `allowed: false`. This protects your downstream services from being overwhelmed during a cache outage.
    - `FAIL_OPEN`: On storage error, `consume()` returns `allowed: true`. This prioritizes user experience, allowing traffic to pass even if the rate limiter is unavailable.

## Framework Middleware Integrations

The library provides optional integrations for Express, NestJS, and Next.js. These are designed with three core principles:

1.  **Zero Runtime Dependency Overhead**: Framework-specific code is isolated in separate files. If a user only needs the core library, their project remains dependency-free of other frameworks.
2.  **Standard Headers**: All integrations automatically handle standard rate-limiting headers:
    - `X-RateLimit-Limit`: Maximum tokens.
    - `X-RateLimit-Remaining`: Current tokens after consumption.
    - `Retry-After`: Seconds until the request can be retried (on 429).
3.  **Extensibility**: Users can provide a `keyGenerator` to identify requests (e.g., via API keys, User IDs, or custom headers) instead of the default IP address.

### Express
- Implemented as a standard middleware factory.
- Correctly handles `async` custom handlers by awaiting their execution to prevent unhandled promise rejections.

### NestJS
- Implemented as a `CanActivate` Guard.
- Designed for Dependency Injection; expects a `TokenBucket` to be provided with the token `'RATE_LIMIT_BUCKET'`.
- Uses `@Optional()` and `@Inject('RATE_LIMIT_OPTIONS')` to allow flexible configuration of middleware options.

### Next.js
- Compatible with Edge Middleware and API routes.
- Returns `NextResponse` with correct status codes and headers.
- Handles IP extraction safely even in complex Edge environments.

## Runtime Compatibility

| Environment | Context | Supported? | Reason |
| :--- | :--- | :--- | :--- |
| **Node.js** | Express / NestJS / Fastify | ✅ **Yes** | Full TCP support |
| **Next.js** | Route Handlers (API) | ✅ **Yes** | Full Node.js Runtime |
| **Next.js** | Edge Middleware | ❌ **Planned** | Edge Runtime requires HTTP-based storage |

### Note on Edge Runtime (Next.js Middleware)
Standard Redis clients like `ioredis` rely on TCP sockets, which are not supported in the restricted Next.js Edge Runtime. To support `middleware.ts` in the future, a `UniversalRedisStorage` using HTTP-based Redis (like Upstash) is planned.

## Performance Considerations
...

- **Single Round Trip**: By using Lua, we avoid multiple network calls (GET -> Calculate -> SET). One call to `consume()` results in one network round trip.
- **Memory Efficiency**: Use of Redis Hashes and TTLs keeps the memory footprint low even with millions of unique keys.
- **Complexity**: O(1) time complexity for consumption checks.
