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

## Performance Considerations

- **Single Round Trip**: By using Lua, we avoid multiple network calls (GET -> Calculate -> SET). One call to `consume()` results in one network round trip.
- **Memory Efficiency**: Use of Redis Hashes and TTLs keeps the memory footprint low even with millions of unique keys.
- **Complexity**: O(1) time complexity for consumption checks.
