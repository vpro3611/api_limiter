# Vanilla Node.js Example

This example demonstrates the core usage of the `api_limiter` library in a pure Node.js/TypeScript environment without any web framework.

## What it demonstrates
-   **Custom Storage Implementation**: Shows how to implement the `StorageProvider` interface (using a simple In-Memory Map).
-   **Direct Class Usage**: Shows how to instantiate and interact with the `TokenBucket` class directly.
-   **Burst Simulation**: A script that simulates a burst of requests to show the "refill and consume" behavior.

## How to run

1.  **Build the core library** (if you haven't already):
    ```bash
    cd ../..
    npm run build
    cd examples/vanilla
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the script**:
    ```bash
    npm start
    ```
