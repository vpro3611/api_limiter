import { describe, it, expect, vi } from 'vitest';
import { RateLimitGuard } from '../../src/middleware/nestjs';

describe('NestJS Guard', () => {
  it('should allow access if bucket permits', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, resetInMs: 0 }),
      options: { capacity: 10 }
    } as any;
    
    const guard = new RateLimitGuard(bucket);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '1.2.3.4' }),
        getResponse: () => ({ setHeader: vi.fn() })
      })
    } as any;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw HttpException if blocked', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: false, remaining: 0, resetInMs: 1000 }),
      options: { capacity: 10 }
    } as any;
    
    const guard = new RateLimitGuard(bucket);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ ip: '1.2.3.4' }),
        getResponse: () => ({ setHeader: vi.fn() })
      })
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow('Too Many Requests');
  });
});
