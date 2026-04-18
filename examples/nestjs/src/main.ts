import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
  console.log(`🚀 NestJS Example listening at http://localhost:3001`);
  console.log('Try calling GET http://localhost:3001/api/data');
}
bootstrap();
