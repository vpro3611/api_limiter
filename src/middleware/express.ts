import type { Request, Response, NextFunction } from 'express';
import { TokenBucket } from '../TokenBucket';
import { BaseMiddlewareOptions } from './types';

export interface ExpressMiddlewareOptions extends BaseMiddlewareOptions<Request> {
  handler?: (req: Request, res: Response, next?: NextFunction) => void | Promise<void>;
}

export function createExpressMiddleware(bucket: TokenBucket, options: ExpressMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = options.keyGenerator 
        ? await options.keyGenerator(req) 
        : req.ip || 'unknown';
      
      const result = await bucket.consume(key);

      res.setHeader('X-RateLimit-Limit', bucket.options.capacity);
      res.setHeader('X-RateLimit-Remaining', result.remaining);

      if (!result.allowed) {
        res.setHeader('Retry-After', Math.ceil(result.resetInMs / 1000));
        
        if (options.handler) {
          await options.handler(req, res, next);
          return;
        }
        return res.status(429).send('Too Many Requests');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
