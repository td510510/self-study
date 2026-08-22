import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Buổi 33 — Prisma trong NestJS.
 *
 * SO VỚI EXPRESS (buổi 13): ở đó ta export một biến `prisma` dùng chung
 * và mọi file tự import. Ở đây nó là một PROVIDER —
 * Nest quản lý vòng đời và TIÊM nó vào nơi cần.
 *
 * Được gì?
 *   1. Test thay được bằng bản giả (overrideProvider) — buổi 36
 *   2. Nest tự gọi onModuleInit/onModuleDestroy → không quên đóng kết nối
 *   3. Chỉ MỘT instance cho cả ứng dụng, đảm bảo bởi IoC container
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      adapter: new PrismaPg({
        connectionString: config.getOrThrow<string>('DATABASE_URL'),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Đã kết nối database');
  }

  /**
   * Nest tự gọi khi ứng dụng tắt — nhưng CHỈ KHI đã bật shutdown hooks
   * trong main.ts (app.enableShutdownHooks()).
   * Đây chính là graceful shutdown ở buổi 08, giờ do framework lo.
   */
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Đã đóng kết nối database');
  }
}
