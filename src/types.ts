export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export interface BucketOptions {
  capacity: number;
  refillAmount: number;
  refillIntervalMs: number;
}
