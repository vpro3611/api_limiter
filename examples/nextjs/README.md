# Next.js Edge Middleware Example (Redis)

This example demonstrates how to implement distributed rate limiting for **Next.js** API routes using Edge Middleware and the built-in **RedisStorage**.

## What it demonstrates
-   **middleware.ts Integration**: Shows how to use the `nextRateLimit` utility.
-   **Atomic Redis Storage**: Uses Redis to persist rate-limit state across Edge nodes and reloads.
-   **Edge Runtime Compatibility**: Demonstrates a pattern for managing Redis connections in a serverless/edge environment.
-   **Path Matching**: Specifically targets `/api/*` routes.

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
    cd examples/nextjs
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm run dev
    ```

4.  **Test it**:
    Refresh `http://localhost:3000/api/hello` multiple times.
    Check your terminal logs to see the `[RateLimit]` output and remaining token count.
