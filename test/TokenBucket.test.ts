import { describe, it, expect, vi } from 'vitest';
import { TokenBucket } from '../src/TokenBucket';
import { StorageProvider } from '../src/storage/StorageProvider';

describe('TokenBucket', () => {
  it('should delegate consumption to storage provider', async () => {
    const mockStorage: StorageProvider = {
      consume: vi.fn().mockResolvedValue({ allowed: true, remaining: 9, resetInMs: 100 })
    };
    const bucket = new TokenBucket({
      capacity: 10,
      refillAmount: 1,
      refillIntervalMs: 1000,
      storage: mockStorage
    });

    const result = await bucket.consume('test-key', 1);
    
    expect(result.allowed).toBe(true);
    expect(mockStorage.consume).toHaveBeenCalledWith('test-key', 1, 10, 0.001);
  });

  it('should throw error for invalid configuration', () => {
    expect(() => new TokenBucket({
      capacity: 0,
      refillAmount: 1,
      refillIntervalMs: 1000,
      storage: {} as any
    })).toThrow('Capacity must be positive');
  });

  it('should fail open when FAIL_OPEN strategy is used', async () => {
    const mockStorage: StorageProvider = {
      consume: vi.fn().mockRejectedValue(new Error('Storage failure'))
    };
    const bucket = new TokenBucket({
      capacity: 10,
      refillAmount: 1,
      refillIntervalMs: 1000,
      storage: mockStorage,
      failStrategy: 'FAIL_OPEN'
    });

    const result = await bucket.consume('test-key', 1);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should fail closed by default', async () => {
    const mockStorage: StorageProvider = {
      consume: vi.fn().mockRejectedValue(new Error('Storage failure'))
    };
    const bucket = new TokenBucket({
      capacity: 10,
      refillAmount: 1,
      refillIntervalMs: 1000,
      storage: mockStorage
    });

    const result = await bucket.consume('test-key', 1);
    expect(result.allowed).toBe(false);
  });
});
