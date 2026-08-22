import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import * as Joi from 'joi';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SanPhamModule } from './sanpham/sanpham.module';
import { HealthController } from './health.controller';

/**
 * Buổi 38 — Module gốc.
 *
 * Đọc danh sách `imports` là biết TOÀN BỘ ứng dụng gồm những gì.
 * Ở Express (buổi 18) phải đọc app.js và lần theo từng app.use().
 */
@Module({
  imports: [
    // ── Cấu hình + VALIDATE biến môi trường lúc KHỞI ĐỘNG ──────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      // ⚠️ Fail fast: thiếu biến bắt buộc là ứng dụng KHÔNG khởi động.
      // Nối lại buổi 03: thà chết lúc start với thông báo rõ ràng,
      // còn hơn lỗi khó hiểu lúc 3 giờ sáng.
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        JWT_ACCESS_SECRET: Joi.string().min(16).required(),
        JWT_REFRESH_SECRET: Joi.string().min(16).required(),
        PORT: Joi.number().default(3000),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        BCRYPT_COST: Joi.number().min(4).max(15).default(12),
        LOG_LEVEL: Joi.string().default('info'),
        ACCESS_TOKEN_TTL: Joi.string().default('15m'),
      }),
      validationOptions: { abortEarly: false },
    }),

    // ── Logging có cấu trúc (buổi 18) ──────────────────────────
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string) ?? randomUUID();
          res.setHeader('X-Request-Id', id);
          return id;
        },
        // Che dữ liệu nhạy cảm — quan trọng nhất trong cấu hình log (buổi 18)
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie', 'matKhau', '*.matKhau', 'accessToken', '*.accessToken'],
          censor: '[ĐÃ CHE]',
        },
        customLogLevel: (req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        transport:
          process.env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
      },
    }),

    PrismaModule,
    AuthModule,
    SanPhamModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
