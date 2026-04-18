# NestJS Guard Example

This example demonstrates a professional integration of `api_limiter` into a **NestJS** application using class-based Guards and Dependency Injection.

## What it demonstrates
-   **RateLimitGuard**: Usage of the built-in NestJS Guard.
-   **Dependency Injection**: How to provide the `TokenBucket` and options through the NestJS module system.
-   **Decorator Support**: Protecting specific routes using the `@UseGuards()` decorator.
-   **HTTP Exceptions**: Automatic conversion of rate-limiting results into NestJS `HttpException`.

## How to run

1.  **Build the core library**:
    ```bash
    cd ../..
    npm run build
    cd examples/nestjs
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the application**:
    ```bash
    npm start
    ```

4.  **Test it**:
    Call `GET http://localhost:3001/api/data` multiple times using `curl` or your browser.
    ```bash
    curl -i http://localhost:3001/api/data
    ```
