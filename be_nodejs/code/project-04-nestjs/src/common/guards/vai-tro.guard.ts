import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { VaiTro } from '@prisma/client';
import { KHOA_VAI_TRO } from '../decorators/vai-tro.decorator';
import type { NguoiDungHienTai } from '../decorators/nguoi-dung.decorator';

/**
 * Buổi 33 — Guard phân quyền theo vai trò (RBAC, nội dung buổi 16).
 *
 * SO VỚI EXPRESS: ở đó là middleware `yeuCauVaiTro('admin')` gắn vào từng route.
 * Ở đây Guard đọc METADATA do decorator dán lên route.
 *
 * Khác biệt thực chất: Guard biết được NGỮ CẢNH đầy đủ (class nào, method nào),
 * nên đặt được luật ở cấp controller rồi ghi đè ở cấp method.
 */
@Injectable()
export class VaiTroGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // getAllAndOverride: đọc metadata ở METHOD trước, không có thì lấy ở CLASS.
    // Nhờ vậy đặt @VaiTroCanThiet ở controller và ghi đè cho một method cụ thể.
    const canThiet = this.reflector.getAllAndOverride<VaiTro[] | undefined>(KHOA_VAI_TRO, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // Route không dán nhãn → không yêu cầu vai trò nào
    if (!canThiet || canThiet.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: NguoiDungHienTai }>();
    const nd = req.user;

    // 401 do JwtAuthGuard lo; tới đây nghĩa là ĐÃ xác thực.
    // Thiếu vai trò phù hợp → 403 (buổi 16).
    if (!nd || !canThiet.includes(nd.vaiTro)) {
      throw new ForbiddenException({
        loi: `Cần vai trò: ${canThiet.join(' hoặc ')}`,
        ma: 'KHONG_DU_QUYEN',
      });
    }
    return true;
  }
}
