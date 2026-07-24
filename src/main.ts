import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap. Globale Validierung und das einheitliche Fehler-Format kommen
 * aus dem SharedModule (APP_PIPE / APP_FILTER). Swagger/OpenAPI wird aus dem
 * Code generiert (Typen + Decorators) und unter `/docs` bereitgestellt.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const prefix = config.get<string>('API_PREFIX', 'api');
  app.setGlobalPrefix(`${prefix}/v1`);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Backend API')
    .setDescription('DDD + Hexagonal (Ports & Adapters) NestJS backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(config.get<string>('PORT', '3000'));
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API:  http://localhost:${port}/${prefix}/v1`);
  logger.log(`Docs: http://localhost:${port}/docs`);
}

void bootstrap();
