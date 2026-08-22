import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

/**
 * Buổi 34 — Băm mật khẩu (nội dung buổi 15, đóng gói thành provider).
 *
 * Vì sao tách thành service riêng thay vì viết hàm tự do?
 *   · Test thay được bằng bản giả (cost 1) để test chạy nhanh
 *   · Đọc cost từ ConfigService thay vì process.env rải rác
 */
@Injectable()
export class MatKhauService {
  private readonly cost: number;

  constructor(config: ConfigService) {
    this.cost = Number(config.get('BCRYPT_COST') ?? 12);
  }

  bam(matKhauTho: string): Promise<string> {
    return bcrypt.hash(matKhauTho, this.cost);
  }

  /** So sánh theo thời gian không đổi — chống tấn công đo thời gian (buổi 15). */
  kiemTra(matKhauTho: string, hash: string): Promise<boolean> {
    return bcrypt.compare(matKhauTho, hash);
  }
}
