import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpstashRedisStorage } from '../../src/storage/UpstashRedisStorage';

describe('UpstashRedisStorage', () => {
  const config = {
    url: 'https://test.upstash.io',
    token: 'test-token',
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should consume tokens successfully', async () => {
    const storage = new UpstashRedisStorage(config);
    const mockResponse = {
      ok: true,
      json: async () => ({ result: [1, 4, 1000] }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await storage.consume('test-key', 1, 5, 1);

    expect(result).toEqual({
      allowed: true,
      remaining: 4,
      resetInMs: 1000,
    });
    expect(fetch).toHaveBeenCalledWith(
      'https://test.upstash.io/eval',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle rate limit exceeded', async () => {
    const storage = new UpstashRedisStorage(config);
    const mockResponse = {
      ok: true,
      json: async () => ({ result: [0, 0, 5000] }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    const result = await storage.consume('test-key', 1, 5, 1);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should handle API errors', async () => {
    const storage = new UpstashRedisStorage(config);
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    };
    (fetch as any).mockResolvedValue(mockResponse);

    await expect(storage.consume('test-key', 1, 5, 1)).rejects.toThrow('Upstash Redis error: 500');
  });

  it('should handle malformed responses', async () => {
    const storage = new UpstashRedisStorage(config);
    const mockResponse = {
      ok: true,
      json: async () => ({ result: 'not-an-array' }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    await expect(storage.consume('test-key', 1, 5, 1)).rejects.toThrow('Malformed response');
  });

  it('should handle trailing slashes in URL', async () => {
    const storage = new UpstashRedisStorage({ ...config, url: 'https://test.upstash.io/' });
    const mockResponse = {
      ok: true,
      json: async () => ({ result: [1, 4, 1000] }),
    };
    (fetch as any).mockResolvedValue(mockResponse);

    await storage.consume('test-key', 1, 5, 1);
    expect(fetch).toHaveBeenCalledWith('https://test.upstash.io/eval', expect.anything());
  });
});
