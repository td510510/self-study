import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { BoLocLoiToanCuc } from './common/filters/http-exception.filter';

/**
 * Buổi 39 — Điểm khởi động.
 *
 * SO VỚI EXPRESS (buổi 18): file server.js ở đó dài ~90 dòng —
 * dựng logger, dựng repository, dựng service, ráp app, graceful shutdown,
 * lưới an toàn. Ở đây Nest lo phần lớn.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Dùng pino thay logger mặc định của Nest
  app.useLogger(app.get(Logger));

  // Header bảo mật (buổi 23)
  app.use(helmet());

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(','),
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  /**
   * ValidationPipe TOÀN CỤC — thay cho middleware validate(...) ở buổi 11.
   *
   * Ba tuỳ chọn quyết định mức an toàn:
   */
  app.useGlobalPipes(
    new ValidationPipe({
      // Loại bỏ trường KHÔNG khai trong DTO
      whitelist: true,
      // TỪ CHỐI (400) nếu có trường lạ — chống mass assignment (buổi 22).
      // Tương đương .strict() của zod.
      forbidNonWhitelisted: true,
      // Ép kiểu theo khai báo TypeScript của DTO (query string → number)
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Exception Filter toàn cục (buổi 35)
  app.useGlobalFilters(new BoLocLoiToanCuc());

  // ⚠️ BẮT BUỘC để onModuleDestroy được gọi khi nhận SIGTERM.
  // Không có dòng này, PrismaService.onModuleDestroy KHÔNG BAO GIỜ chạy
  // → graceful shutdown của buổi 08 mất tác dụng.
  app.enableShutdownHooks();

  // ── Swagger: sinh tài liệu TỪ CHÍNH DTO (buổi 39) ────────────
  const config = new DocumentBuilder()
    .setTitle('Shop API')
    .setDescription('Project 4 — E-commerce API viết bằng NestJS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
