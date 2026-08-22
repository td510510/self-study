import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * @Global() — provider của module này dùng được ở MỌI module khác
 * mà không cần import lại từng chỗ.
 *
 * ⚠️ Dùng RẤT TIẾT KIỆM. Global làm mất tính tường minh:
 * đọc một module không còn biết nó phụ thuộc vào đâu.
 * Chỉ dùng cho hạ tầng thật sự dùng khắp nơi: database, config, logger.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
