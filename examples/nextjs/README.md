# Next.js Rate Limiting Example

This example demonstrates two ways to implement rate limiting in a Next.js application, depending on the environment and runtime.

## 1. Route Handlers (Node.js Runtime) - Recommended for TCP Redis
This is the standard approach using the **Node.js runtime**. It works with traditional Redis clients like `ioredis`.

-   **File**: `src/pages/api/hello.ts` (or `app/api/hello/route.ts`)
-   **Storage**: `RedisStorage` (uses TCP)
-   **Implementation**: Manual integration in the handler using `limiter.consume()`.

## 2. Middleware (Edge Runtime) - Recommended for Global Protection
Next.js Middleware runs in the **Edge Runtime**, which doesn't support TCP. For this, we use the `UpstashRedisStorage` which communicates via HTTP.

-   **File**: `middleware.ts`
-   **Storage**: `UpstashRedisStorage` (uses `fetch`)
-   **Implementation**: Using the `nextRateLimit` helper.

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

3.  **Setup Environment Variables**:
    For the Node.js/TCP example:
    ```bash
    REDIS_URL=redis://localhost:6379
    ```
    For the Edge/Middleware example (requires an [Upstash](https://upstash.com) account):
    ```bash
    UPSTASH_REDIS_REST_URL=https://...
    UPSTASH_REDIS_REST_TOKEN=...
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

5.  **Test it**:
    -   **Route Handler**: Refresh `http://localhost:3000/api/hello`
    -   **Middleware**: Refresh `http://localhost:3000/` (limits root access)
