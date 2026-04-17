import { CanActivate, ExecutionContext, Injectable, Inject, Optional, HttpException, HttpStatus } from '@nestjs/common';
import { TokenBucket } from '../TokenBucket';
import { BaseMiddlewareOptions } from './types';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject('RATE_LIMIT_BUCKET') private bucket: TokenBucket,
    @Optional() @Inject('RATE_LIMIT_OPTIONS') private options: BaseMiddlewareOptions = {}
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
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
