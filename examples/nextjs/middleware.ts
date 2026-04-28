import { NextRequest } from 'next/server';
import { nextRateLimit } from 'api_limiter/dist/middleware/next';
import { edgeLimiter } from '@/lib/edge-limiter';

/**
 * Next.js Middleware runs in the Edge Runtime.
 * It uses the 'edgeLimiter' which is backed by Upstash (HTTP).
 */
export async function middleware(req: NextRequest) {
  // Only apply rate limiting to the home page or specific routes
  if (req.nextUrl.pathname === '/') {
    return await nextRateLimit(req, edgeLimiter, {
      keyGenerator: (req) => req.headers.get('x-forwarded-for') ?? 'anonymous-middleware',
    });
  }
}

// Optional: Match only specific paths
export const config = {
  matcher: ['/'],
};
