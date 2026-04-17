import { StorageProvider } from './storage/StorageProvider';
import { RateLimitResult, BucketOptions } from './types';

export interface TokenBucketOptions extends BucketOptions {
  storage: StorageProvider;
}

export class TokenBucket {
  constructor(private readonly options: TokenBucketOptions) {}

  async consume(key: string, amount: number = 1): Promise<RateLimitResult> {
    const fillRate = this.options.refillAmount / this.options.refillIntervalMs;
    return this.options.storage.consume(
      key,
      amount,
      this.options.capacity,
      fillRate
    );
  }
}
