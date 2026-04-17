import { StorageProvider } from './storage/StorageProvider';
import { RateLimitResult, BucketOptions } from './types';

export interface TokenBucketOptions extends BucketOptions {
  storage: StorageProvider;
}

export class TokenBucket {
  constructor(public readonly options: TokenBucketOptions) {
    if (options.capacity <= 0) throw new Error('Capacity must be positive');
    if (options.refillAmount <= 0) throw new Error('Refill amount must be positive');
    if (options.refillIntervalMs <= 0) throw new Error('Refill interval must be positive');
  }

  async consume(key: string, amount: number = 1): Promise<RateLimitResult> {
    const fillRate = this.options.refillAmount / this.options.refillIntervalMs;
    try {
      return await this.options.storage.consume(
        key,
        amount,
        this.options.capacity,
        fillRate
      );
    } catch (error) {
      if (this.options.failStrategy === 'FAIL_OPEN') {
        console.warn('Rate limiter storage failed, failing open:', error);
        return { allowed: true, remaining: 1, resetInMs: 0 };
      }
      return { allowed: false, remaining: 0, resetInMs: 0 };
    }
  }
}
