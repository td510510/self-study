/**
 * Buổi 30 — Mở rộng kiểu của Express.
 *
 * ĐIỂM DẠY: ở Express thuần (JS), ta gán req.nguoiDung = {...} thoải mái
 * và không ai kiểm tra. TypeScript TỪ CHỐI điều đó — Request không có
 * thuộc tính đó trong định nghĩa kiểu.
 *
 * Nghe phiền, nhưng nó bắt được cả một lớp lỗi:
 *   · gõ nhầm tên (req.nguoiDug)
 *   · đọc thuộc tính ở nơi middleware chưa chạy
 *
 * "Module augmentation" là cách khai báo THÊM thuộc tính cho kiểu có sẵn.
 */

import type { VaiTro } from '@prisma/client';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Gắn bởi pino-http — dùng để truy vết log (buổi 18) */
      id?: string;
      /** Gắn bởi JwtStrategy sau khi xác thực (buổi 34) */
      nguoiDung?: { id: number; email: string; vaiTro: VaiTro };
    }
  }
}

export {};
