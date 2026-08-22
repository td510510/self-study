import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MatKhauService } from './mat-khau.service';
import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto } from './dto/dang-nhap.dto';
import type { User } from '@prisma/client';

/**
 * Buổi 34 — Tầng nghiệp vụ xác thực.
 *
 * SO VỚI EXPRESS (buổi 15): logic BÊN TRONG gần như giống hệt.
 * Khác biệt duy nhất là cách LẤY phụ thuộc:
 *
 *   Express:  import { prisma } from '../lib/prisma.js'    ← tự đi lấy
 *   Nest   :  constructor(private prisma: PrismaService)   ← được TIÊM vào
 *
 * Đó là toàn bộ ý nghĩa của Dependency Injection.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matKhau: MatKhauService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Chỉ trả trường AN TOÀN — không bao giờ có matKhauHash (buổi 15). */
  private loc(u: User) {
    return { id: u.id, email: u.email, ten: u.ten, vaiTro: u.vaiTro };
  }

  async dangKy(dto: DangKyDto) {
    const hash = await this.matKhau.bam(dto.matKhau);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          ten: dto.ten,
          matKhauHash: hash,
          gioHang: { create: {} },
        },
      });
      return this.loc(user);
    } catch (err) {
      if ((err as { code?: string }).code === 'P2002') {
        throw new ConflictException({ loi: 'Email đã được sử dụng', ma: 'TRUNG_DU_LIEU' });
      }
      throw err;
    }
  }

  async dangNhap(dto: DangNhapDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Thông điệp GIỐNG NHAU cho cả hai trường hợp — chống dò tài khoản (buổi 15)
    const LOI_CHUNG = { loi: 'Email hoặc mật khẩu không đúng', ma: 'SAI_THONG_TIN' };

    if (!user) {
      // Vẫn băm để thời gian phản hồi tương đương — chống dò bằng đo thời gian
      await this.matKhau.bam('chuoi_gia_de_ton_thoi_gian_tuong_duong');
      throw new UnauthorizedException(LOI_CHUNG);
    }

    if (!(await this.matKhau.kiemTra(dto.matKhau, user.matKhauHash))) {
      throw new UnauthorizedException(LOI_CHUNG);
    }

    return {
      user: this.loc(user),
      accessToken: await this.jwt.signAsync({
        sub: String(user.id),
        email: user.email,
        vaiTro: user.vaiTro,
      }),
    };
  }

  async layHoSo(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.loc(user);
  }
}
