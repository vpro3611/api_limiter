import { RateLimitResult } from '../types';

export interface StorageProvider {
  /**
   * Atomically refills and consumes tokens.
   * @param key The unique identifier
   * @param amount Tokens to consume
   * @param capacity Max tokens the bucket can hold
   * @param fillRate How many tokens are added per millisecond
   */
  consume(
    key: string,
    amount: number,
    capacity: number,
    fillRate: number
  ): Promise<RateLimitResult>;
}
