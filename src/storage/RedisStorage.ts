import Redis from 'ioredis';
import { StorageProvider } from './StorageProvider';
import { RateLimitResult } from '../types';
import { RATE_LIMIT_LUA_SCRIPT } from './lua';

declare module 'ioredis' {
  interface Redis {
    consumeTokenBucket(
      key: string,
      capacity: number,
      fillRate: number,
      amount: number
    ): Promise<[number, number, number]>;
  }
}

export class RedisStorage implements StorageProvider {
  constructor(private readonly redis: Redis) {
    this.redis.defineCommand('consumeTokenBucket', {
      numberOfKeys: 1,
      lua: RATE_LIMIT_LUA_SCRIPT,
    });
  }
  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    const [allowed, remaining, resetInMs] = await this.redis.consumeTokenBucket(
      key,
      capacity,
      fillRate,
      amount
    );

    return {
      allowed: allowed === 1,
      remaining,
      resetInMs
    };
  }
}
