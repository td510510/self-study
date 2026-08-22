import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { VaiTro } from '@prisma/client';

export interface NguoiDungHienTai {
  id: number;
  email: string;
  vaiTro: VaiTro;
}

/**
 * Buổi 33 — Custom param decorator.
 *
 * SO VỚI EXPRESS: ở đó handler đọc req.nguoiDung.id — mỗi chỗ một lần,
 * và không có kiểu.
 *
 * Ở đây:  layMot(@NguoiDung() nd: NguoiDungHienTai)
 * → gọn hơn, CÓ KIỂU, và handler không cần biết tới object `req`.
 *
 * Handler không đụng `req` thì test dễ hơn nhiều — chỉ cần truyền object thường.
 */
export const NguoiDung = createParamDecorator(
  (data: keyof NguoiDungHienTai | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: NguoiDungHienTai }>();
    const nd = req.user;
    return data && nd ? nd[data] : nd;
  },
);
