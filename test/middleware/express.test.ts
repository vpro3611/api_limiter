import { describe, it, expect, vi } from 'vitest';
import { createExpressMiddleware } from '../../src/middleware/express';

describe('Express Middleware', () => {
  it('should call next() if allowed', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetInMs: 100 }),
      options: { capacity: 10 }
    } as any;
    
    const middleware = createExpressMiddleware(bucket);
    const req = { ip: '127.0.0.1' } as any;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 9);
  });

  it('should return 429 if blocked', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: false, remaining: 0, resetInMs: 1000 }),
      options: { capacity: 10 }
    } as any;
    
    const middleware = createExpressMiddleware(bucket);
    const req = { ip: '127.0.0.1' } as any;
    const res = { setHeader: vi.fn(), status: vi.fn().mockReturnThis(), send: vi.fn() } as any;
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', 1);
  });
});
