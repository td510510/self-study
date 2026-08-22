import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { NguoiDung, type NguoiDungHienTai } from '../common/decorators/nguoi-dung.decorator';

/**
 * Buổi 30 — Controller.
 *
 * SO VỚI EXPRESS ROUTER (buổi 15):
 *   Express: router.post('/dang-ky', validate(schema), async (req, res) => {...})
 *   Nest   : @Post('dang-ky') dangKy(@Body() dto: DangKyDto) {...}
 *
 * Ba thứ biến mất khỏi tầm mắt:
 *   1. validate(...)  → ValidationPipe toàn cục lo, dựa trên kiểu của dto
 *   2. req, res       → decorator lấy đúng thứ cần
 *   3. try/catch      → Exception Filter lo
 *
 * Handler chỉ còn LOGIC. Đó là toàn bộ điểm mạnh của Nest.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dang-ky')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  dangKy(@Body() dto: DangKyDto) {
    return this.authService.dangKy(dto);
  }

  @Post('dang-nhap')
  // Mặc định @Post trả 201. Đăng nhập KHÔNG tạo tài nguyên nên phải là 200.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng nhập, nhận access token' })
  dangNhap(@Body() dto: DangNhapDto) {
    return this.authService.dangNhap(dto);
  }

  @Get('toi')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thông tin tài khoản đang đăng nhập' })
  layHoSo(@NguoiDung() nd: NguoiDungHienTai) {
    return this.authService.layHoSo(nd.id);
  }
}
