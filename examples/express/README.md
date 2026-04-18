# Express Middleware Example

This example demonstrates how to integrate the `api_limiter` into a web server using the **Express** framework.

## What it demonstrates
-   **Middleware Integration**: Shows how to use the `createExpressMiddleware` factory function.
-   **Standard Headers**: Demonstrates automatic injection of `X-RateLimit-*` and `Retry-After` headers.
-   **Key Generation**: Shows how to identify users (defaulting to IP address).
-   **Custom Handlers**: Demonstrates how to send a custom JSON response when a user is rate limited.

## How to run

1.  **Build the core library**:
    ```bash
    cd ../..
    npm run build
    cd examples/express
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the server**:
    ```bash
    npm start
    ```

4.  **Test it**:
    Open `http://localhost:3000/api/data` in your browser and refresh quickly.
