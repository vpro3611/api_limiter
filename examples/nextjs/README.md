# Next.js Edge Middleware Example

This example demonstrates how to implement global rate limiting for **Next.js** API routes using Edge Middleware.

## What it demonstrates
-   **middleware.ts Integration**: Shows how to use the `nextRateLimit` utility.
-   **Edge Runtime Compatibility**: Demonstrates the library's ability to run in the restricted Edge environment.
-   **Path Matching**: Shows how to apply rate limiting only to specific paths (e.g., `/api/*`).
-   **NextResponse Manipulation**: Handling headers and status codes in the Next.js way.

## ⚠️ Important Note: Edge Runtime Statelessness

Next.js Middleware runs in the **Edge Runtime**, which is designed to be lightweight and stateless. In development (`next dev`), the middleware environment may be re-initialized frequently, causing an in-memory `Map` to reset.

### For Real-World Usage:
It is **strongly recommended** to use the built-in `RedisStorage` for Next.js Middleware. Since the Edge Runtime is distributed, an in-memory storage will only rate-limit requests hitting the specific edge node or process, which is not accurate.

To use Redis in Next.js:
1.  Install `ioredis`.
2.  Initialize `RedisStorage` with a connection to a distributed Redis (like Upstash).
3.  Pass the storage to your `TokenBucket`.

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
