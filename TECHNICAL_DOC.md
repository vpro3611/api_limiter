# Technical Documentation: Atomic Token Bucket

## Architecture Overview

The library follows a **Delegated Atomic Logic** pattern. Instead of calculating token counts on the application server (which leads to race conditions), the rate-limiting logic is executed atomically within the storage layer using Lua scripts.

### Core Components

1.  **TokenBucket (Orchestrator)**:
    - Validates configuration and calculates the `fillRate`.
    - Handles failure strategies (`FAIL_OPEN` / `FAIL_CLOSED`).
    - Acts as the primary entry point for developers.

2.  **StorageProvider (Interface)**:
    - Defines a single `consume` method that must be implemented atomically by the provider.

3.  **RedisStorage (TCP)**:
    - Implements the `StorageProvider` using the `ioredis` library.
    - Uses a custom Lua script for atomic state updates.

4.  **UpstashRedisStorage (HTTP/Edge)**:
    - Implements the `StorageProvider` using the standard `fetch` API.
    - Designed specifically for the **Edge Runtime** (e.g., Next.js Middleware) where TCP is not supported.
    - Interacts with the Upstash Redis REST API.

## The Shared Token Bucket Algorithm

Both storage providers share the same core logic via `src/storage/lua.ts`. This ensures consistent behavior regardless of the transport layer.

### Lua Script Logic
The script performs the following steps inside Redis:

1.  **Time Sync**: Calls `redis.call('TIME')` to get the microsecond-accurate time from the Redis server.
2.  **State Retrieval**: Fetches the current token count and the timestamp of the last refill from a Redis Hash.
3.  **Refill Calculation**: Computes tokens gained since the last interaction based on the elapsed time.
4.  **Consumption Check**: Decrements the count if enough tokens exist.
5.  **Persistence**: Saves the new count and timestamp back to the Hash.
6.  **Automatic Cleanup**: Sets a TTL on the key (calculated as the time to full refill + 60s buffer) to optimize Redis memory usage.

## Runtime Compatibility

### Node.js Runtime
- Uses `RedisStorage` (TCP).
- Ideal for long-running servers like Express or NestJS.
- Persistent connections are pooled for maximum throughput.

### Edge Runtime (Next.js Middleware)
- Uses `UpstashRedisStorage` (HTTP).
- Leverages the `fetch` API which is native to the Edge environment.
- Bypasses TCP limitations of serverless environments.

## Error Handling & Failure Strategies

- **Input Validation**: The constructor throws errors for non-positive values.
- **Fail-Open Strategy**: If configured as `FAIL_OPEN`, the `TokenBucket` will catch storage errors (network timeouts, Redis downtime) and allow the request to proceed, ensuring your application remains available during rate limiter outages.
- **Fail-Closed Strategy**: The default behavior which denies requests if the storage layer fails, protecting downstream resources.

## Performance Considerations

- **Atomicity**: No matter how many app instances are running, the rate limit is enforced globally without race conditions.
- **Latency**: Lua scripts are extremely fast (sub-millisecond execution). `RedisStorage` (TCP) is generally faster than `UpstashRedisStorage` (HTTP) due to persistent connections, so TCP should be preferred in Node.js environments.
