import { describe, it, expect, vi } from 'vitest';
import { nextRateLimit } from '../../src/middleware/next';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => ({ headers: new Map(), status: 200 })),
    json: vi.fn((data, init) => ({ headers: new Map(), status: init.status, data }))
  }
}));

describe('Next.js Integration', () => {
  it('should return next response if allowed', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 5, resetInMs: 0 }),
      options: { capacity: 10 }
    } as any;
    
    const req = { ip: '1.2.3.4' } as any;
    const res = await nextRateLimit(req, bucket);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  it('should return 429 response if blocked', async () => {
    const bucket = {
      consume: vi.fn().mockResolvedValue({ allowed: false, remaining: 0, resetInMs: 1000 }),
      options: { capacity: 10 }
    } as any;
    
    const req = { ip: '1.2.3.4' } as any;
    const res = await nextRateLimit(req, bucket);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('1');
  });
});
