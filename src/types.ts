export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export type FailStrategy = 'FAIL_CLOSED' | 'FAIL_OPEN';

export interface BucketOptions {
  capacity: number;
  refillAmount: number;
  refillIntervalMs: number;
  failStrategy?: FailStrategy;
}
