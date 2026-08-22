import { Module } from '@nestjs/common';
import { SanPhamController } from './sanpham.controller';
import { SanPhamService } from './sanpham.service';

@Module({
  controllers: [SanPhamController],
  providers: [SanPhamService],
  exports: [SanPhamService],
})
export class SanPhamModule {}
