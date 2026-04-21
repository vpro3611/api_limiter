import { NextRequest, NextResponse } from 'next/server';
import { TokenBucket } from '../TokenBucket';
import { BaseMiddlewareOptions } from './types';

export { BaseMiddlewareOptions };

export async function nextRateLimit(
  req: NextRequest, 
  bucket: TokenBucket, 
  options: BaseMiddlewareOptions = {}
) {
  const reqAny = req as any;
  const key = options.keyGenerator 
    ? await options.keyGenerator(req) 
    : (reqAny.ip || req.headers.get('x-forwarded-for') || 'anonymous');
    
  const result = await bucket.consume(key);

  // Set standard headers on the response
  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', bucket.options.capacity.toString());
  res.headers.set('X-RateLimit-Remaining', result.remaining.toString());

  if (!result.allowed) {
    const limitedRes = NextResponse.json(
      { error: 'Too Many Requests' }, 
      { status: 429 }
    );
    limitedRes.headers.set('X-RateLimit-Limit', bucket.options.capacity.toString());
    limitedRes.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    limitedRes.headers.set('Retry-After', Math.ceil(result.resetInMs / 1000).toString());
    return limitedRes;
  }

  return res;
}
