# api_limiter Examples

This directory contains practical, real-world examples of how to use the `api_limiter` library.

Each example is a self-contained project. To run an example:

1.  **Build the core library** (from the root directory):
    ```bash
    npm run build
    ```

2.  **Navigate to the example**:
    ```bash
    cd examples/<name>
    ```

3.  **Install and run**:
    ```bash
    npm install
    npm start
    ```

## Examples

### 1. [Vanilla Node.js](./vanilla)
A pure TypeScript/Node.js example without any framework. It demonstrates:
- How to implement a custom `StorageProvider` (In-Memory).
- Direct usage of the `TokenBucket` class.
- Manual consumption and result handling.

### 2. [Express](./express)
A web server using the popular Express framework. It demonstrates:
- Using the `createExpressMiddleware` helper.
- Standard HTTP rate-limit headers.
- Custom 429 error responses.

### 3. [NestJS](./nestjs)
A professional NestJS application. It demonstrates:
- Using the `RateLimitGuard`.
- Dependency Injection (DI) for the bucket and options.
- Clean controller-level protection.

### 4. [Next.js](./nextjs)
A Next.js application using Edge Middleware. It demonstrates:
- Global API rate limiting via `middleware.ts`.
- Usage of the `nextRateLimit` utility.
- Interaction with `NextRequest` and `NextResponse`.
