import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Buổi 35 — Exception Filter.
 *
 * SO VỚI EXPRESS (buổi 18): ở đó là middleware BỐN THAM SỐ đặt cuối cùng.
 * Ở đây là một class có @Catch() — Nest tự gọi, không phụ thuộc thứ tự.
 *
 * @Catch() không tham số = bắt MỌI loại exception.
 */
@Catch()
export class BoLocLoiToanCuc implements ExceptionFilter {
  private readonly logger = new Logger('LoiToanCuc');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    // ── Lỗi VẬN HÀNH: ta chủ động ném ra (buổi 18) ──────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const noiDung = exception.getResponse();

      this.logger.warn(`${req.method} ${req.url} → ${status}: ${exception.message}`);

      return res.status(status).json(
        typeof noiDung === 'string'
          ? { loi: noiDung, ma: 'LOI', requestId: req.id }
          : { ...(noiDung as object), requestId: req.id },
      );
    }

    // ── Lỗi Prisma: ánh xạ sang HTTP (buổi 13) ──────────────────
    const ma = (exception as { code?: string })?.code;
    if (ma === 'P2002') {
      return res
        .status(HttpStatus.CONFLICT)
        .json({ loi: 'Giá trị đã tồn tại', ma: 'TRUNG_DU_LIEU', requestId: req.id });
    }
    if (ma === 'P2025') {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ loi: 'Không tìm thấy bản ghi', ma: 'KHONG_TIM_THAY', requestId: req.id });
    }

    // ── Lỗi LẬP TRÌNH: log đầy đủ, trả tối thiểu (buổi 18) ──────
    this.logger.error(
      `${req.method} ${req.url} → 500`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      loi: 'Lỗi máy chủ nội bộ',
      ma: 'LOI_MAY_CHU',
      requestId: req.id,
    });
  }
}
