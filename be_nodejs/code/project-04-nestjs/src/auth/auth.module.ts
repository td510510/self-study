import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MatKhauService } from './mat-khau.service';
import { JwtStrategy } from './jwt.strategy';

/**
 * Buổi 30 — Module.
 *
 * Module là ĐƠN VỊ ĐÓNG GÓI của Nest. Nó khai:
 *   imports    — cần gì từ module khác
 *   controllers— nhận request nào
 *   providers  — có những gì bên trong
 *   exports    — cho module khác dùng lại gì
 *
 * SO VỚI EXPRESS (buổi 18): ở đó ta chia thư mục theo nghiệp vụ,
 * nhưng KHÔNG có gì bắt buộc — ai cũng import được của ai.
 * Module của Nest là RÀO CHẮN THẬT: không export thì không dùng được.
 */
@Module({
  imports: [
    PassportModule,
    // registerAsync: cần đọc secret từ ConfigService,
    // mà ConfigService lại là một provider → phải chờ nó sẵn sàng.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          // ⚠️ TypeScript đòi kiểu `StringValue` của thư viện `ms` ("15m", "7d"),
          // không nhận `string` chung chung. Đây là ví dụ TS bắt được thứ
          // JS im lặng cho qua: chuỗi "mười lăm phút" sẽ lỗi lúc CHẠY,
          // còn ở đây nó lỗi lúc BIÊN DỊCH.
          expiresIn: (config.get<string>('ACCESS_TOKEN_TTL') ?? '15m') as `${number}m`,
          issuer: 'hocbe-auth',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MatKhauService, JwtStrategy],
  // Export để module khác (sanpham, donhang) dùng được AuthService nếu cần
  exports: [AuthService],
})
export class AuthModule {}
