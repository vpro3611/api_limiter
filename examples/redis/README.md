# Atomic Redis Storage Example

This example demonstrates the core functionality of the library using the built-in **RedisStorage** provider for atomic, distributed rate limiting.

## What it demonstrates
-   **RedisStorage**: Shows how to use the pre-defined atomic Redis backend with `ioredis`.
-   **Distributed Correctness**: Demonstrates how the Lua script ensures that multiple instances would share the same bucket state accurately.
-   **Automatic Cleanup**: Shows how the library manages Redis memory via TTLs.
-   **Failure Strategies**: Demonstrates the configuration of `FAIL_CLOSED` behavior.

## Prerequisites
-   A **Redis server** must be running on `localhost:6379`.
-   You can start one easily with Docker:
    ```bash
    docker run --name redis -p 6379:6379 -d redis
    ```

## How to run

1.  **Build the core library**:
    ```bash
    cd ../..
    npm run build
    cd examples/redis
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the simulation**:
    ```bash
    npm start
    ```
