# Next.js Route Handler Example (Redis)

This example demonstrates how to implement distributed rate limiting for **Next.js** using **API Routes (Route Handlers)** and the built-in **RedisStorage**.

## Why Route Handlers instead of Middleware?
While Middleware is great for global checks, it runs in the **Edge Runtime**, which has limited support for TCP connections (like standard Redis). 

By using **Route Handlers** (Pages or App Router):
-   You use the full **Node.js runtime**.
-   `ioredis` works out of the box.
-   Singletons are stable and connections are pooled efficiently.

## What it demonstrates
-   **Shared Utility Pattern**: A `lib/limiter.ts` file that manages the singleton instance.
-   **Atomic Redis Storage**: Using the built-in provider to persist state.
-   **Manual API Integration**: Demonstrates how to use the core `TokenBucket` API directly inside a handler.

## Prerequisites
-   A **Redis server** must be running on `localhost:6379`.

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
    You will see the `X-RateLimit-*` headers in the response and a `429` error when the limit is reached.
