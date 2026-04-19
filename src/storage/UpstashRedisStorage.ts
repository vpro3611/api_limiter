import { StorageProvider } from './StorageProvider';
import { RateLimitResult } from '../types';
import { RATE_LIMIT_LUA_SCRIPT } from './lua';

export interface UpstashConfig {
  url: string;
  token: string;
  timeoutMs?: number;
}

export class UpstashRedisStorage implements StorageProvider {
  constructor(private config: UpstashConfig) {}

  async consume(key: string, amount: number, capacity: number, fillRate: number): Promise<RateLimitResult> {
    const url = new URL('/eval', this.config.url.replace(/\/$/, '')).toString();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 1000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: RATE_LIMIT_LUA_SCRIPT,
          args: [capacity.toString(), fillRate.toString(), amount.toString()],
          keys: [key],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Upstash Redis error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data.result) || data.result.length < 3) {
        throw new Error('Malformed response from Upstash Redis API');
      }

      const [allowed, remaining, resetInMs] = data.result;

      return {
        allowed: allowed === 1,
        remaining: Math.floor(remaining),
        resetInMs: Math.ceil(resetInMs),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
