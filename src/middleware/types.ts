export interface BaseMiddlewareOptions {
  /**
   * Function to generate a unique key for the request.
   * Defaults to IP address extraction.
   */
  keyGenerator?: (req: any) => string | Promise<string>;
}

export interface ExpressMiddlewareOptions extends BaseMiddlewareOptions {
  /**
   * Optional custom handler for when a request is rate limited.
   */
  handler?: (req: any, res: any, next?: any) => void | Promise<void>;
}
