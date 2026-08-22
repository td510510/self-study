# Project 4 — E-commerce API viết bằng NestJS

Sản phẩm của **Phase 4**. Viết lại Project 2 bằng NestJS để đối chiếu trực tiếp hai cách tiếp cận.

Giáo án: [buổi 28–39](../../giao-an/phase-4/)

---

## Chạy

```bash
docker compose up -d          # Postgres :5437
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma generate

npm run start:dev             # log màu
npm run build && npm run start:prod

npm test                      #  9 unit test —  1.1 s
npm run test:e2e              # 18 e2e test  — 10.0 s
```

Swagger: http://localhost:3000/docs

### Database test riêng

```bash
docker exec nest-postgres psql -U shop -d shop_nest -c "CREATE DATABASE shop_nest_test;"
DATABASE_URL="postgresql://shop:matkhau_hoc_tap@localhost:5437/shop_nest_test?schema=public" npx prisma migrate deploy
```

---

## Cấu trúc

```
src/
├── main.ts                       ← khởi động, pipe/filter toàn cục, Swagger
├── app.module.ts                 ← module gốc: đọc là biết toàn bộ ứng dụng
├── health.controller.ts
├── types/express.d.ts            ← mở rộng kiểu Request
├── prisma/
│   ├── prisma.service.ts         ← PrismaClient thành PROVIDER
│   └── prisma.module.ts          ← @Global()
├── common/
│   ├── filters/                  ← Exception Filter toàn cục
│   ├── guards/                   ← VaiTroGuard (RBAC)
│   └── decorators/               ← @NguoiDung(), @VaiTroCanThiet()
├── auth/
│   ├── auth.controller.ts · auth.service.ts · auth.service.spec.ts
│   ├── auth.module.ts · jwt.strategy.ts · mat-khau.service.ts
│   └── dto/
└── sanpham/
```

---

## Ba lỗi TypeScript bắt được (mà JS im lặng cho qua)

**1. `req.id` không tồn tại trong kiểu `Request`**

```
error TS2339: Property 'id' does not exist on type 'Request'
```

→ Phải khai `declare global { namespace Express { interface Request { ... } } }`.
Ở Express (JS) ta gán `req.nguoiDung = {...}` thoải mái, gõ nhầm tên cũng không ai báo.

**2. `expiresIn` không nhận `string` chung chung**

```
Type 'string' is not assignable to type 'number | StringValue | undefined'
```

→ Thư viện `ms` đòi `"15m"`, `"7d"`. Chuỗi sai lỗi lúc **biên dịch** thay vì lúc **chạy**.

**3. `prisma.config.ts` ở gốc làm lệch `rootDir`**

Output thành `dist/src/main.js` thay vì `dist/main.js` → `npm run start:prod` không tìm thấy file.
Sửa bằng cách loại nó khỏi `tsconfig.build.json`.

---

## Điểm dạy: Guard chạy TRƯỚC Pipe

```ts
it('⚠️ dữ liệu sai + thiếu quyền → 403, KHÔNG phải 400', async () => {
  await goi().post('/san-pham')
    .set('Authorization', `Bearer ${tokenKhach}`)
    .send({ giaVND: 99.5, ... })      // ← dữ liệu SAI
    .expect(403);                      // ← nhưng trả 403
});
```

Đây là hành vi **đúng về bảo mật**: không tiết lộ cấu trúc dữ liệu cho người không có quyền. Kẻ tấn công không dò được schema API bằng tài khoản thường.

---

## Kim tự tháp test — số liệu thật

```
Unit test (mock DI) :  9 test —  1.075 s   không cần Docker/database
E2E test (thật)     : 18 test —  9.956 s   dựng toàn bộ IoC container
```

Unit test bắt được thứ e2e **không** bắt được:

```ts
it('🔒 email KHÔNG tồn tại → VẪN băm một lần (chống dò bằng đo thời gian)', async () => {
  prismaGia.user.findUnique.mockResolvedValue(null);
  await expect(service.dangNhap({ ... })).rejects.toThrow(UnauthorizedException);
  expect(matKhauGia.bam).toHaveBeenCalled();
});
```

E2E chỉ đo được **thời gian** — bấp bênh và hay sai. Unit test **hỏi thẳng**.

Nhưng mock **không** bắt được câu Prisma sai tên cột — đó là việc của e2e.

---

## ⚠️ Điểm yếu thật của Nest: `main.ts` không chạy trong test

```ts
// test/api.e2e-spec.ts — phải LẶP LẠI cấu hình
app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
app.useGlobalFilters(new BoLocLoiToanCuc());
```

Cấu hình dễ **lệch** giữa test và production. Cách sửa: tách hàm `capHinhApp(app)` dùng chung, hoặc đăng ký qua `APP_PIPE` / `APP_FILTER` trong module.

---

## Nest đổi VỎ, không đổi RUỘT

| Bài học | Buổi | Vẫn đúng ở Nest |
|---|---|---|
| Tiền là `Int` | 18 | ✅ |
| Transaction + khoá dòng | 19 | ✅ |
| Chống dò tài khoản | 15 | ✅ **ta tự viết** |
| `alg: none` | 15 | ✅ **ta tự khai** |
| Kiểm quyền chủ sở hữu | 16 | ✅ |
| Log che dữ liệu nhạy cảm | 18 | ✅ |
| `dumb-init` cho tín hiệu | 27 | ✅ |

**Nest không dạy ta bảo mật. Ta mang bảo mật vào Nest.**
