export interface BaseMiddlewareOptions<TReq = unknown> {
  /**
   * Function to generate a unique key for the request.
   * Defaults to IP address extraction.
   */
  keyGenerator?: (req: TReq) => string | Promise<string>;
}
