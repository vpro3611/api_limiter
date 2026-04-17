export interface MiddlewareOptions {
  /**
   * Function to generate a unique key for the request.
   * Defaults to IP address extraction.
   */
  keyGenerator?: (req: any) => string | Promise<string>;

  /**
   * Optional custom handler for when a request is rate limited.
   */
  handler?: (req: any, res: any, next?: any) => void | Promise<void>;
}
