# Next.js Edge Middleware Example

This example demonstrates how to implement global rate limiting for **Next.js** API routes using Edge Middleware.

## What it demonstrates
-   **middleware.ts Integration**: Shows how to use the `nextRateLimit` utility.
-   **Edge Runtime Compatibility**: Demonstrates the library's ability to run in the restricted Edge environment.
-   **Path Matching**: Shows how to apply rate limiting only to specific paths (e.g., `/api/*`).
-   **NextResponse Manipulation**: Handling headers and status codes in the Next.js way.

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
