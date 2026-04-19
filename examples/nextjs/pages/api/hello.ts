import type { NextApiRequest, NextApiResponse } from 'next';
import { limiter } from '../../src/lib/limiter';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Get client IP
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous';
  const key = Array.isArray(ip) ? ip[0] : ip;

  // 2. Consume token
  const result = await limiter.consume(key);

  // 3. Set standard headers
  res.setHeader('X-RateLimit-Limit', limiter.options.capacity);
  res.setHeader('X-RateLimit-Remaining', result.remaining);

  if (!result.allowed) {
    res.setHeader('Retry-After', Math.ceil(result.resetInMs / 1000));
    return res.status(429).json({ 
      error: 'Too Many Requests',
      message: `Please try again in ${Math.ceil(result.resetInMs / 1000)} seconds.`
    });
  }

  // 4. Handle successful request
  res.status(200).json({ 
    message: 'Success! You accessed the protected Route Handler.',
    remaining: result.remaining
  });
}
