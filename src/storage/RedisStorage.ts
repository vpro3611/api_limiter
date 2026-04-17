import Redis from 'ioredis';
import { StorageProvider } from './StorageProvider';
import { RateLimitResult } from '../types';

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

const LUA_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local fillRate = tonumber(ARGV[2])
  local amount = tonumber(ARGV[3])
  
  -- Get Redis server time
  local time = redis.call('TIME')
  local now = (tonumber(time[1]) * 1000) + math.floor(tonumber(time[2]) / 1000)

  local state = redis.call('HMGET', key, 'tokens', 'lastRefill')
  local lastTokens = tonumber(state[1]) or capacity
  local lastRefill = tonumber(state[2]) or now

  local elapsed = math.max(0, now - lastRefill)
  local refilled = elapsed * fillRate
  local currentTokens = math.min(capacity, lastTokens + refilled)

  local allowed = false
  if currentTokens >= amount then
    currentTokens = currentTokens - amount
    allowed = true
  end

  redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
  
  -- Key expires after it would be fully refilled (plus buffer)
  local ttl = math.ceil((capacity / fillRate) / 1000) + 60
  redis.call('EXPIRE', key, ttl)

  local resetInMs = math.ceil((capacity - currentTokens) / fillRate)
  
  return { allowed and 1 or 0, currentTokens, resetInMs }
`;

export class RedisStorage implements StorageProvider {
  constructor(private readonly redis: Redis) {
    this.redis.defineCommand('consumeTokenBucket', {
      numberOfKeys: 1,
      lua: LUA_SCRIPT,
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
