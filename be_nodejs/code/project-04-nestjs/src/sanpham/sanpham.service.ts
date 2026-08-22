import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaoSanPhamDto, SuaSanPhamDto, LocSanPhamDto } from './dto/tao-san-pham.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class SanPhamService {
  constructor(private readonly prisma: PrismaService) {}

  async danhSach(q: LocSanPhamDto) {
    const where: Prisma.SanPhamWhereInput = {
      conBan: true,
      ...(q.danhMuc && { danhMuc: { slug: q.danhMuc } }),
      ...(q.conHang === true && { tonKho: { gt: 0 } }),
      ...(q.tuKhoa && { ten: { contains: q.tuKhoa, mode: 'insensitive' } }),
    };

    // Hai truy vấn độc lập → chạy SONG SONG (buổi 07, 20)
    const [tong, duLieu] = await Promise.all([
      this.prisma.sanPham.count({ where }),
      this.prisma.sanPham.findMany({
        where,
        orderBy: { taoLuc: 'desc' },
        skip: (q.trang - 1) * q.moiTrang,
        take: q.moiTrang,
        select: {
          id: true,
          ten: true,
          slug: true,
          giaVND: true,
          tonKho: true,
          danhMuc: { select: { ten: true, slug: true } },
        },
      }),
    ]);

    return {
      duLieu,
      phanTrang: {
        tong,
        trang: q.trang,
        moiTrang: q.moiTrang,
        tongSoTrang: Math.max(1, Math.ceil(tong / q.moiTrang)),
      },
    };
  }

  async layMot(id: number) {
    const sp = await this.prisma.sanPham.findUnique({
      where: { id },
      include: { danhMuc: { select: { ten: true, slug: true } } },
    });
    if (!sp || !sp.conBan) {
      throw new NotFoundException({ loi: `Không có sản phẩm id = ${id}`, ma: 'KHONG_TIM_THAY' });
    }
    return sp;
  }

  tao(dto: TaoSanPhamDto) {
    return this.prisma.sanPham.create({ data: dto });
  }

  async sua(id: number, dto: SuaSanPhamDto) {
    await this.layMot(id);
    return this.prisma.sanPham.update({ where: { id }, data: dto });
  }

  /** XOÁ MỀM — sản phẩm còn trong đơn hàng cũ (buổi 18). */
  async ngungBan(id: number) {
    await this.layMot(id);
    return this.prisma.sanPham.update({ where: { id }, data: { conBan: false } });
  }
}
