import { SetMetadata } from '@nestjs/common';
import type { VaiTro } from '@prisma/client';

export const KHOA_VAI_TRO = 'vai-tro-can-thiet';

/**
 * Buổi 33 — Decorator gắn METADATA cho route.
 *
 * Cách dùng:  @VaiTroCanThiet('admin')
 *
 * Decorator này KHÔNG tự kiểm tra gì cả — nó chỉ DÁN NHÃN.
 * Guard (vai-tro.guard.ts) mới là bên đọc nhãn và quyết định.
 *
 * Tách "khai báo" khỏi "thực thi" là ý tưởng cốt lõi của Nest:
 * đọc dòng @VaiTroCanThiet('admin') là biết ngay luật, không cần đọc code guard.
 */
export const VaiTroCanThiet = (...vaiTro: VaiTro[]) => SetMetadata(KHOA_VAI_TRO, vaiTro);
