/**
 * Phase 4 — Test e2e cho NestJS.
 *
 * SO VỚI EXPRESS (buổi 17): ở đó ta gọi taoApp() rồi truyền vào supertest.
 * Ở đây dùng Test.createTestingModule — nó dựng TOÀN BỘ IoC container,
 * nên test đúng thứ chạy ở production: DI, guard, pipe, filter đều thật.
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BoLocLoiToanCuc } from '../src/common/filters/http-exception.filter';

describe('API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenKhach: string;
  let tokenAdmin: string;
  let danhMucId: number;

  async function donSach() {
    await prisma.donHangItem.deleteMany();
    await prisma.donHang.deleteMany();
    await prisma.gioHangItem.deleteMany();
    await prisma.gioHang.deleteMany();
    await prisma.sanPham.deleteMany();
    await prisma.danhMuc.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  }

  async function taoNguoiDung(email: string, vaiTro: 'khach' | 'admin'): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/dang-ky')
      .send({ email, ten: email, matKhau: 'matkhau-du-dai' })
      .expect(201);

    if (vaiTro !== 'khach') {
      await prisma.user.update({ where: { email }, data: { vaiTro } });
    }

    const r = await request(app.getHttpServer())
      .post('/auth/dang-nhap')
      .send({ email, matKhau: 'matkhau-du-dai' })
      .expect(200);

    return r.body.accessToken as string;
  }

  const goi = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    // ⚠️ Phải LẶP LẠI cấu hình của main.ts.
    // Đây là điểm yếu thật của Nest: main.ts KHÔNG chạy trong test,
    // nên cấu hình dễ lệch giữa test và production.
    // Cách khắc phục: tách phần cấu hình ra một hàm dùng chung (bài tập).
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new BoLocLoiToanCuc());

    await app.init();

    prisma = app.get(PrismaService);
    await donSach();

    const dm = await prisma.danhMuc.create({ data: { ten: 'Phụ kiện', slug: 'phu-kien' } });
    danhMucId = dm.id;
    await prisma.sanPham.createMany({
      data: [
        { ten: 'Tai nghe', slug: 'tai-nghe', giaVND: 1_290_000, tonKho: 10, danhMucId },
        { ten: 'Sạc nhanh', slug: 'sac-nhanh', giaVND: 450_000, tonKho: 0, danhMucId },
      ],
    });

    tokenKhach = await taoNguoiDung('khach@t.com', 'khach');
    tokenAdmin = await taoNguoiDung('admin@t.com', 'admin');
  });

  afterAll(async () => {
    await donSach();
    await app.close();
  });

  describe('Health', () => {
    it('kiểm tra cả phụ thuộc, không chỉ tiến trình', async () => {
      const r = await goi().get('/health').expect(200);
      expect(r.body.trangThai).toBe('ok');
      expect(r.body.database).toBe('ok');
    });

    it('mọi response có X-Request-Id', async () => {
      const r = await goi().get('/health').expect(200);
      expect(r.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('ValidationPipe', () => {
    it('gộp NHIỀU lỗi trong một response', async () => {
      const r = await goi()
        .post('/auth/dang-ky')
        .send({ email: 'khong-phai-email', ten: '', matKhau: '123' })
        .expect(400);
      expect(r.body.message.length).toBeGreaterThanOrEqual(3);
    });

    it('🚨 CHỐNG MASS ASSIGNMENT — forbidNonWhitelisted', async () => {
      const r = await goi()
        .post('/auth/dang-ky')
        .send({ email: 'x@t.com', ten: 'X', matKhau: 'matkhau-du-dai', vaiTro: 'admin' })
        .expect(400);
      expect(JSON.stringify(r.body)).toMatch(/vaiTro should not exist/);
    });

    it('tự trim và chuẩn hoá email về chữ thường', async () => {
      const r = await goi()
        .post('/auth/dang-ky')
        .send({ email: '  HOA@T.COM  ', ten: '  Tên  ', matKhau: 'matkhau-du-dai' })
        .expect(201);
      expect(r.body.email).toBe('hoa@t.com');
      expect(r.body.ten).toBe('Tên');
    });

    it('ParseIntPipe: id sai định dạng → 400', async () => {
      await goi().get('/san-pham/abc').expect(400);
    });
  });

  describe('Bảo mật', () => {
    it('KHÔNG lộ hash mật khẩu', async () => {
      const r = await goi()
        .get('/auth/toi')
        .set('Authorization', `Bearer ${tokenKhach}`)
        .expect(200);
      expect(r.body.matKhauHash).toBeUndefined();
      expect(r.text).not.toContain('$2b$');
    });

    it('chống dò tài khoản: thông điệp GIỐNG NHAU', async () => {
      const saiMatKhau = await goi()
        .post('/auth/dang-nhap')
        .send({ email: 'khach@t.com', matKhau: 'sai' })
        .expect(401);
      const khongCo = await goi()
        .post('/auth/dang-nhap')
        .send({ email: 'khong-ton-tai@t.com', matKhau: 'gi-cung-duoc' })
        .expect(401);
      expect(saiMatKhau.body.loi).toBe(khongCo.body.loi);
    });

    it('email trùng → 409', async () => {
      await goi()
        .post('/auth/dang-ky')
        .send({ email: 'khach@t.com', ten: 'X', matKhau: 'matkhau-du-dai' })
        .expect(409);
    });
  });

  describe('Guard — xác thực & phân quyền', () => {
    it('không token → 401', async () => {
      await goi().get('/auth/toi').expect(401);
    });

    it('token giả → 401', async () => {
      await goi().get('/auth/toi').set('Authorization', 'Bearer gia.mao.token').expect(401);
    });

    it('khách gọi route admin → 403 (không phải 401)', async () => {
      const r = await goi()
        .post('/san-pham')
        .set('Authorization', `Bearer ${tokenKhach}`)
        .send({ ten: 'X', slug: 'x', giaVND: 1000, danhMucId })
        .expect(403);
      expect(r.body.ma).toBe('KHONG_DU_QUYEN');
    });

    it('admin tạo được sản phẩm → 201', async () => {
      const r = await goi()
        .post('/san-pham')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ten: 'Cáp sạc', slug: 'cap-sac', giaVND: 99000, tonKho: 5, danhMucId })
        .expect(201);
      expect(r.body.giaVND).toBe(99000);
    });

    it('⚠️ Guard chạy TRƯỚC Pipe: dữ liệu sai + thiếu quyền → 403', async () => {
      // giaVND là số thực (sai) VÀ khách không đủ quyền.
      // Nest trả 403 chứ không 400 — vì Guard đứng trước Pipe
      // trong vòng đời request. Đây là hành vi ĐÚNG: không tiết lộ
      // thông tin validate cho người không có quyền truy cập.
      await goi()
        .post('/san-pham')
        .set('Authorization', `Bearer ${tokenKhach}`)
        .send({ ten: 'X', slug: 'x', giaVND: 99.5, danhMucId })
        .expect(403);
    });
  });

  describe('Sản phẩm', () => {
    it('xem danh sách KHÔNG cần đăng nhập', async () => {
      const r = await goi().get('/san-pham').expect(200);
      expect(r.body.phanTrang.tong).toBeGreaterThan(0);
    });

    it('lọc theo còn hàng', async () => {
      const r = await goi().get('/san-pham?conHang=true').expect(200);
      expect(r.body.duLieu.every((s: { tonKho: number }) => s.tonKho > 0)).toBe(true);
    });

    it('slug trùng → 409 (Exception Filter ánh xạ P2002)', async () => {
      await goi()
        .post('/san-pham')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ten: 'Khác', slug: 'cap-sac', giaVND: 1000, danhMucId })
        .expect(409);
    });

    it('xoá là XOÁ MỀM', async () => {
      const tao = await goi()
        .post('/san-pham')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({ ten: 'Tạm', slug: 'tam', giaVND: 1000, danhMucId })
        .expect(201);

      await goi()
        .delete(`/san-pham/${tao.body.id}`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(204);

      await goi().get(`/san-pham/${tao.body.id}`).expect(404);

      const conTrongDb = await prisma.sanPham.findUnique({ where: { id: tao.body.id } });
      expect(conTrongDb).not.toBeNull();
      expect(conTrongDb!.conBan).toBe(false);
    });
  });
});
