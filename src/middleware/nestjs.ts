import { CanActivate, ExecutionContext, Injectable, Inject, Optional, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TokenBucket } from '../TokenBucket';
import { BaseMiddlewareOptions } from './types';

export type NestMiddlewareOptions = BaseMiddlewareOptions<Request>;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject('RATE_LIMIT_BUCKET') private bucket: TokenBucket,
    @Optional() @Inject('RATE_LIMIT_OPTIONS') private options: NestMiddlewareOptions = {}
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const key = this.options.keyGenerator 
      ? await this.options.keyGenerator(request) 
      : request.ip || 'unknown';

    const result = await this.bucket.consume(key);

    response.setHeader('X-RateLimit-Limit', this.bucket.options.capacity.toString());
    response.setHeader('X-RateLimit-Remaining', result.remaining.toString());

    if (!result.allowed) {
      response.setHeader('Retry-After', Math.ceil(result.resetInMs / 1000).toString());
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
