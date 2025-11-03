import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { config } from 'dotenv';
import { resolve } from 'path';

async function bootstrap() {
  // Explicitly load .env file before anything else
  const isProduction = process.env.NODE_ENV === 'production';
  const envFile = isProduction ? '.env' : '.env.local';
  const envPath = resolve(__dirname, '../../', envFile);

  config({ path: envPath });

  // Log environment status
  const logger = new Logger('Bootstrap');
  logger.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📁 Loading env from: ${envPath}`);
  logger.log(`✅ RESEND_API_KEY loaded: ${!!process.env.RESEND_API_KEY}`);
  logger.log(`✅ DATABASE_URL loaded: ${!!process.env.DATABASE_URL}`);

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Security & Performance middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    compression({
      level: 6,
      threshold: 100 * 1000,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // cors
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  logger.log(
    `🚀 Application is running on: http://0.0.0.0:${process.env.PORT ?? 3000}`,
  );
}

bootstrap().catch((error) => {
  Logger.error('❌ Error starting server', error, 'Bootstrap');
  process.exit(1);
});
