import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { createCsrfMiddleware } from './common/security/csrf.middleware';
import { initSentry } from './observability/sentry.config';

function configureSecurity(
  app: INestApplication,
  configService: ConfigService,
  logger: Logger,
): void {
  app.use(helmet());
  app.use(cookieParser());

  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS', '');
  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins.split(',') : true,
    credentials: true,
  });

  const csrfEnabled = configService.get<boolean>('CSRF_ENABLED', false);
  if (!csrfEnabled) {
    return;
  }

  app.use(createCsrfMiddleware());
  logger.log('CSRF protection enabled');
}

function configureSwagger(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kaleem Store API')
    .setDescription('Kaleem Store backend APIs')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, document);
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  initSentry(app, configService);

  configureSecurity(app, configService, logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  configureSwagger(app);

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  logger.log(`API listening on http://localhost:${port}`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(error instanceof Error ? error.message : 'Failed to bootstrap app');
  process.exit(1);
});
