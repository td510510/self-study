import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SanPhamService } from './sanpham.service';
import { TaoSanPhamDto, SuaSanPhamDto, LocSanPhamDto } from './dto/tao-san-pham.dto';
import { VaiTroCanThiet } from '../common/decorators/vai-tro.decorator';
import { VaiTroGuard } from '../common/guards/vai-tro.guard';

@ApiTags('san-pham')
@Controller('san-pham')
export class SanPhamController {
  constructor(private readonly sanPhamService: SanPhamService) {}

  // Xem sản phẩm KHÔNG cần đăng nhập — shop công khai
  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm, có lọc và phân trang' })
  danhSach(@Query() q: LocSanPhamDto) {
    return this.sanPhamService.danhSach(q);
  }

  @Get(':id')
  // ParseIntPipe — thay cho z.coerce.number() ở buổi 11.
  // Pipe chạy TRƯỚC handler, id sai định dạng → 400 tự động.
  layMot(@Param('id', ParseIntPipe) id: number) {
    return this.sanPhamService.layMot(id);
  }

  // Từ đây trở xuống: đăng nhập + đúng vai trò.
  // Hai guard chạy THEO THỨ TỰ: xác thực trước, phân quyền sau (buổi 16).
  @Post()
  @UseGuards(AuthGuard('jwt'), VaiTroGuard)
  @VaiTroCanThiet('admin')
  @ApiBearerAuth()
  tao(@Body() dto: TaoSanPhamDto) {
    return this.sanPhamService.tao(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), VaiTroGuard)
  @VaiTroCanThiet('admin', 'nhanVien')
  @ApiBearerAuth()
  sua(@Param('id', ParseIntPipe) id: number, @Body() dto: SuaSanPhamDto) {
    return this.sanPhamService.sua(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), VaiTroGuard)
  @VaiTroCanThiet('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  async ngungBan(@Param('id', ParseIntPipe) id: number) {
    await this.sanPhamService.ngungBan(id);
  }
}
