import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra sức khoẻ hệ thống' })
  async kiemTra() {
    // Health check phải kiểm tra cả PHỤ THUỘC, không chỉ "tiến trình còn sống" (buổi 43)
    let db = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'loi';
    }

    return {
      trangThai: db === 'ok' ? 'ok' : 'suy-giam',
      database: db,
      thoiGianChay: Math.round(process.uptime()),
    };
  }
}
