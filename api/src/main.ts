import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.enableCors({
    origin: process.env.WEBAPP_URL || 'http://localhost:3000',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 4000);

  await app.listen(port);
  console.log(`🚀 API running on port ${port}`);
}

bootstrap();
