import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from 'api_limiter/dist/middleware/nestjs';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Welcome to NestJS Rate Limited API! Go to /api/data to test the guard.';
  }

  @Get('api/data')
  @UseGuards(RateLimitGuard)
  getData() {
    return {
      message: 'Success! You accessed the protected data through a NestJS Guard.',
      data: [1, 2, 3]
    };
  }
}
