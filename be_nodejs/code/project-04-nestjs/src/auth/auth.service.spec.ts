/**
 * Buổi 36 — Unit test với MOCK DEPENDENCY INJECTION.
 *
 * ĐÂY LÀ LỢI ÍCH LỚN NHẤT CỦA DI, và là lý do đáng học NestJS.
 *
 * SO VỚI EXPRESS (buổi 09): ở đó ta phải TỰ THIẾT KẾ service nhận
 * repository qua tham số, rồi tự viết repository giả.
 * Ở đây Nest cho sẵn `overrideProvider` — thay bất kỳ phụ thuộc nào
 * mà KHÔNG sửa một dòng code sản phẩm.
 *
 * Test này KHÔNG cần: database, mạng, server, Docker.
 * Nó chạy trong vài mili-giây.
 */

import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { MatKhauService } from './mat-khau.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService (unit)', () => {
  let service: AuthService;
  let prismaGia: { user: { create: jest.Mock; findUnique: jest.Mock; findUniqueOrThrow: jest.Mock } };
  let matKhauGia: { bam: jest.Mock; kiemTra: jest.Mock };

  const USER_MAU = {
    id: 1,
    email: 'a@shop.com',
    ten: 'A',
    matKhauHash: '$2b$04$hash-gia',
    vaiTro: 'khach' as const,
    taoLuc: new Date(),
  };

  beforeEach(async () => {
    prismaGia = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    matKhauGia = {
      bam: jest.fn().mockResolvedValue('$2b$04$hash-gia'),
      kiemTra: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        // ⭐ Thay THẬT bằng GIẢ — không sửa AuthService một dòng nào
        { provide: PrismaService, useValue: prismaGia },
        { provide: MatKhauService, useValue: matKhauGia },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token-gia') } },
        { provide: ConfigService, useValue: { get: jest.fn(), getOrThrow: jest.fn() } },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('dangKy', () => {
    it('băm mật khẩu trước khi lưu — KHÔNG lưu mật khẩu thô', async () => {
      prismaGia.user.create.mockResolvedValue(USER_MAU);

      await service.dangKy({ email: 'a@shop.com', ten: 'A', matKhau: 'matkhau-du-dai' });

      expect(matKhauGia.bam).toHaveBeenCalledWith('matkhau-du-dai');

      // Kiểm chứng thứ THỰC SỰ được gửi xuống database
      const duLieuGui = prismaGia.user.create.mock.calls[0][0].data;
      expect(duLieuGui.matKhauHash).toBe('$2b$04$hash-gia');
      expect(duLieuGui.matKhau).toBeUndefined();
    });

    it('tạo sẵn giỏ hàng rỗng cho người dùng mới', async () => {
      prismaGia.user.create.mockResolvedValue(USER_MAU);
      await service.dangKy({ email: 'a@shop.com', ten: 'A', matKhau: 'matkhau-du-dai' });

      // Nhờ vậy không bao giờ có user không có giỏ → bớt một nhánh if ở mọi nơi
      expect(prismaGia.user.create.mock.calls[0][0].data.gioHang).toEqual({ create: {} });
    });

    it('KHÔNG trả về matKhauHash', async () => {
      prismaGia.user.create.mockResolvedValue(USER_MAU);
      const kq = await service.dangKy({ email: 'a@shop.com', ten: 'A', matKhau: 'matkhau-du-dai' });

      expect(kq).not.toHaveProperty('matKhauHash');
      expect(Object.keys(kq).sort()).toEqual(['email', 'id', 'ten', 'vaiTro']);
    });

    it('email trùng (P2002) → ConflictException', async () => {
      prismaGia.user.create.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.dangKy({ email: 'a@shop.com', ten: 'A', matKhau: 'matkhau-du-dai' }),
      ).rejects.toThrow(ConflictException);
    });

    it('lỗi LẠ thì để nó nổi lên, KHÔNG nuốt', async () => {
      // Nhắc lại buổi 03: hoặc xử lý được lỗi, hoặc để nó nổi lên.
      const loiLa = new Error('database bốc cháy');
      prismaGia.user.create.mockRejectedValue(loiLa);

      await expect(
        service.dangKy({ email: 'a@shop.com', ten: 'A', matKhau: 'matkhau-du-dai' }),
      ).rejects.toThrow('database bốc cháy');
    });
  });

  describe('dangNhap', () => {
    it('đúng thông tin → trả user + token', async () => {
      prismaGia.user.findUnique.mockResolvedValue(USER_MAU);
      matKhauGia.kiemTra.mockResolvedValue(true);

      const kq = await service.dangNhap({ email: 'a@shop.com', matKhau: 'matkhau-du-dai' });

      expect(kq.accessToken).toBe('token-gia');
      expect(kq.user).not.toHaveProperty('matKhauHash');
    });

    it('sai mật khẩu → UnauthorizedException', async () => {
      prismaGia.user.findUnique.mockResolvedValue(USER_MAU);
      matKhauGia.kiemTra.mockResolvedValue(false);

      await expect(
        service.dangNhap({ email: 'a@shop.com', matKhau: 'sai' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('🔒 email KHÔNG tồn tại → VẪN băm một lần (chống dò bằng đo thời gian)', async () => {
      prismaGia.user.findUnique.mockResolvedValue(null);

      await expect(
        service.dangNhap({ email: 'khong-co@shop.com', matKhau: 'gi-cung-duoc' }),
      ).rejects.toThrow(UnauthorizedException);

      // ĐÂY là điều test tích hợp KHÓ kiểm chứng, còn unit test thì dễ:
      // ta xác nhận được hàm băm ĐÃ được gọi dù user không tồn tại.
      expect(matKhauGia.bam).toHaveBeenCalled();
    });

    it('🔒 hai trường hợp sai cho CÙNG một thông điệp', async () => {
      prismaGia.user.findUnique.mockResolvedValue(null);
      const loiKhongCoUser = await service
        .dangNhap({ email: 'x@shop.com', matKhau: 'y' })
        .catch((e: UnauthorizedException) => e.getResponse());

      prismaGia.user.findUnique.mockResolvedValue(USER_MAU);
      matKhauGia.kiemTra.mockResolvedValue(false);
      const loiSaiMatKhau = await service
        .dangNhap({ email: 'a@shop.com', matKhau: 'sai' })
        .catch((e: UnauthorizedException) => e.getResponse());

      expect(loiKhongCoUser).toEqual(loiSaiMatKhau);
    });
  });
});
