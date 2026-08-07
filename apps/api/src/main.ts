import 'reflect-metadata';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';

function loadRepositoryEnvFile(): void {
  const cwd = process.cwd();
  for (let depth = 0; depth < 8; depth++) {
    const base = depth === 0 ? cwd : resolve(cwd, ...Array(depth).fill('..'));
    const envPath = resolve(base, '.env');
    if (existsSync(envPath)) {
      loadDotenv({ path: envPath, override: true });
      return;
    }
  }
}

loadRepositoryEnvFile();

import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnv } from './config/validation.schema';
import { getHelmetConfig } from './security/helmet.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('Validating environment variables...');
  const envConfig = validateEnv(process.env);
  logger.log(`Environment validated (NODE_ENV: ${envConfig.NODE_ENV})`);

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(getHelmetConfig(configService));

  const stripOriginSlash = (o: string) => o.replace(/\/+$/, '');
  const allowedOrigins = [
    envConfig.FRONTEND_URL,
    ...envConfig.ALLOWED_ORIGINS.split(',').map((url) => url.trim()).filter(Boolean),
  ]
    .filter(Boolean)
    .map(stripOriginSlash);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = stripOriginSlash(origin);
      if (allowedOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from: "${origin}"`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const formatted = errors.map((e) => ({
          field: e.property,
          errors: Object.values(e.constraints || {}),
        }));
        return new BadRequestException({ message: 'Validation failed', errors: formatted });
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('LuxEscortia API')
    .setDescription('Auth + user API documentation for LuxEscortia')
    .setVersion('0.1.0')
    .addBearerAuth({
      description: 'JWT token obtained from /auth/login',
      name: 'Authorization',
      bearerFormat: 'Bearer',
      scheme: 'Bearer',
      type: 'http',
      in: 'Header',
    })
    .addTag('auth', 'Authentication endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get('PORT', '3000');
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);

  logger.log(`API running on: http://${host}:${port}`);
  logger.log(`Swagger docs: http://${host}:${port}/api/docs`);
}

bootstrap().catch((err) => {
  Logger.error('Failed to start application', err);
  process.exit(1);
});
