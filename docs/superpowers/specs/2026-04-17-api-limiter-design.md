# Design Spec: Atomic Token Bucket Rate Limiter

## 1. Overview
A generic, high-performance rate-limiting library for Node.js using the Token Bucket algorithm. It is designed to be storage-agnostic but provides an atomic Redis implementation using Lua scripts to ensure correctness in distributed environments.

## 2. Architecture
The system is divided into three main components:
- **`TokenBucket`**: The primary user interface. It holds configuration and delegates logic to a storage provider.
- **`StorageProvider` (Interface)**: Defines the contract for atomic "refill-and-consume" operations.
- **`RedisStorage`**: A concrete implementation of `StorageProvider` using Redis and Lua.

### Components
- **`RefillStrategy`**: A helper or configuration object to define capacity and refill rate (e.g., 100 tokens per 1 minute).
- **`RateLimitResult`**: The object returned after every consumption attempt, containing `allowed`, `remaining`, and `resetInMs`.

## 3. Storage Interface
```typescript
interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

interface StorageProvider {
  consume(
    key: string,
    amount: number,
    capacity: number,
    fillRate: number
  ): Promise<RateLimitResult>;
}
```

## 4. Redis Implementation (Lua Logic)
To ensure atomicity and avoid clock drift issues across application servers, the `RedisStorage` will use a Lua script executed via `EVAL`.
- **Time Source**: Uses `redis.call('TIME')` to get a consistent timestamp.
- **State Storage**: Stores bucket state in a Redis Hash (`tokens`, `last_refill_timestamp`).
- **TTL**: Automatically expires keys after `capacity / fillRate` milliseconds of inactivity to save memory.

## 5. Error Handling
- **Storage Failures**: Configurable `failStrategy` (default: `FAIL_CLOSED`).
  - `FAIL_CLOSED`: Deny requests if the storage backend is unreachable.
  - `FAIL_OPEN`: Allow requests if the storage backend is unreachable.
- **Validation**: Strict validation of `capacity`, `refillAmount`, and `refillIntervalMs` to ensure they are positive and non-zero.

## 6. Testing Strategy
- **Unit Tests**: Mock `StorageProvider` to test the `TokenBucket` class logic.
- **Integration Tests**: Use a real Redis instance (via Docker or local) to verify the Lua script's atomicity and correctness under concurrent load.
- **Edge Cases**: Zero capacity, massive consumption amounts, and rapid-fire requests.
