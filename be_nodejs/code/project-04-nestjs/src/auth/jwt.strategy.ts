import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { VaiTro } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
  vaiTro: VaiTro;
}

/**
 * Buổi 34 — Passport JWT Strategy.
 *
 * SO VỚI EXPRESS (buổi 15): ở đó ta tự viết middleware đọc header,
 * cắt "Bearer ", gọi jwt.verify, gán req.nguoiDung.
 *
 * Ở đây Passport lo hết. Ta chỉ khai:
 *   · lấy token ở đâu       (jwtFromRequest)
 *   · secret nào            (secretOrKey)
 *   · thuật toán nào        (algorithms — BẮT BUỘC, chống alg=none, buổi 15)
 *   · payload → thành gì    (validate)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: 'hocbe-auth',
      // ⚠️ Không khai algorithms thì thư viện tin thuật toán ghi trong
      // header của chính token — kẻ tấn công đổi thành "none" là qua mặt.
      algorithms: ['HS256'],
    });
  }

  /**
   * Giá trị trả về ở đây được Nest gán vào req.user.
   *
   * ⚠️ Đây là dữ liệu TỪ TOKEN, không phải từ database (buổi 15).
   * User bị hạ quyền thì token cũ vẫn mang vai trò cũ tới khi hết hạn.
   */
  validate(payload: JwtPayload) {
    return { id: Number(payload.sub), email: payload.email, vaiTro: payload.vaiTro };
  }
}
