# Buổi 29 — Module, Controller, Provider

> **Phase 4** · NestJS
> **Mục tiêu:** Nắm vững ba khối xây dựng cốt lõi, và thực hành chuyển một module từ Express sang Nest.
> **Code thực hành:** [`src/auth/`](../../code/project-04-nestjs/src/auth/) · [`src/sanpham/`](../../code/project-04-nestjs/src/sanpham/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 28 |
| 15–55′ | **Controller — handler chỉ còn logic** |
| 55–95′ | Provider & các cách khai báo |
| 95–150′ | **Module — rào chắn thật, không phải quy ước** |
| 150–175′ | Thực hành: chuyển module sản phẩm sang Nest |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Controller (15–55′)

### 1.1. So sánh trực tiếp

**Express (buổi 15):**

```js
router.post('/dang-ky', validate('body', dangKySchema), async (req, res, next) => {
  try {
    res.status(201).json(await service.dangKy(req.body));
  } catch (err) {
    next(err);
  }
});
```

**Nest:**

```ts
@Post('dang-ky')
dangKy(@Body() dto: DangKyDto) {
  return this.authService.dangKy(dto);
}
```

> **Ba thứ biến mất khỏi tầm mắt:**
>
> | Biến mất | Ai lo thay |
> |---|---|
> | `validate(...)` | `ValidationPipe` toàn cục, dựa vào **kiểu** của `dto` |
> | `req`, `res` | decorator lấy đúng thứ cần |
> | `try/catch` | Exception Filter (buổi 34) |
>
> Handler chỉ còn **logic**. Đó là toàn bộ điểm mạnh của Nest.

### 1.2. Decorator tham số

| Decorator | Lấy gì | Tương đương Express |
|---|---|---|
| `@Body()` | body đã validate | `req.body` |
| `@Param('id')` | route param | `req.params.id` |
| `@Query()` | query string | `req.query` |
| `@Headers('x')` | header | `req.headers.x` |
| `@Req()` | cả object request | `req` |

> **⚠️ Dùng `@Req()` là dấu hiệu xấu.** Nó kéo cả Express vào controller, làm handler khó test và khó đổi sang Fastify. Nếu phải dùng, hãy tự hỏi: *"cái tôi cần có decorator riêng không?"*

### 1.3. Trả về giá trị, không gọi `res.json`

```ts
dangKy(@Body() dto: DangKyDto) {
  return this.authService.dangKy(dto);     // ← Nest tự serialize
}
```

> Handler **trả về** dữ liệu, Nest lo phần còn lại. Nhờ vậy handler là **hàm thuần** — test được bằng cách gọi trực tiếp, không cần giả lập `res`.
>
> Nối lại buổi 04: ở đó ta phải nhớ `return` sau `res.end()` kẻo sập server. Vấn đề đó **biến mất** ở đây.

### 1.4. Status code — hai chỗ dễ sai

```ts
@Post('dang-nhap')
@HttpCode(HttpStatus.OK)      // ← BẮT BUỘC
dangNhap(@Body() dto: DangNhapDto) { ... }
```

> Mặc định `@Post` trả **201 Created**. Nhưng đăng nhập **không tạo tài nguyên** — phải là `200`. Nối lại buổi 24 về ngữ nghĩa status code.

```ts
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
async ngungBan(@Param('id', ParseIntPipe) id: number) {
  await this.sanPhamService.ngungBan(id);   // ← KHÔNG return
}
```

> `204` nghĩa là *"không có nội dung"*. Nếu handler `return` gì đó, Nest vẫn gửi `204` nhưng body bị bỏ — gây nhầm lẫn cho người đọc code.

### 1.5. `ParseIntPipe` — pipe dựng sẵn

```ts
@Get(':id')
layMot(@Param('id', ParseIntPipe) id: number) { ... }
```

> Thay cho `z.coerce.number()` ở buổi 11. Pipe chạy **trước** handler; `id` sai định dạng → `400` tự động, handler không bao giờ nhận giá trị xấu.

Test canh giữ:

```ts
it('ParseIntPipe: id sai định dạng → 400', async () => {
  await goi().get('/san-pham/abc').expect(400);
});
```

---

## 2. Provider (55–95′)

**Provider** là bất cứ thứ gì container có thể tiêm: service, repository, factory, giá trị.

### 2.1. Bốn cách khai báo

```ts
providers: [
  // 1. useClass (viết tắt) — thường dùng nhất
  AuthService,

  // 2. useValue — tiêm một giá trị có sẵn. Dùng nhiều trong TEST.
  { provide: PrismaService, useValue: prismaGia },

  // 3. useFactory — cần tính toán hoặc phụ thuộc thứ khác
  {
    provide: 'CAU_HINH_SHOP',
    inject: [ConfigService],
    useFactory: (c: ConfigService) => ({ tenShop: c.get('TEN_SHOP') }),
  },

  // 4. useExisting — đặt bí danh cho provider có sẵn
  { provide: 'LOGGER_CU', useExisting: Logger },
]
```

> `useValue` chính là thứ làm nên `overrideProvider` trong test ở buổi 37.

### 2.2. Provider không nhất thiết là service

```ts
{
  provide: 'CAU_HINH_SHOP',
  useFactory: (c: ConfigService) => ({ tenShop: c.get('TEN_SHOP') }),
}
```

> Khi provide là **chuỗi** (không phải class), phải tiêm bằng `@Inject('CAU_HINH_SHOP')` vì TypeScript không suy ra được kiểu.

### 2.3. Scope — hầu như luôn để mặc định

| Scope | Số instance | Khi nào |
|---|---|---|
| `DEFAULT` | một cho cả app | **99% trường hợp** |
| `REQUEST` | mỗi request một cái | cần dữ liệu riêng của request |
| `TRANSIENT` | mỗi lần tiêm một cái | hiếm |

> **⚠️ `REQUEST` scope lan truyền.** Một provider request-scoped khiến **mọi thứ phụ thuộc nó** cũng thành request-scoped → tạo lại toàn bộ chuỗi cho **mỗi** request → chậm đáng kể.
>
> Cần dữ liệu riêng của request? Thường có cách khác tốt hơn: truyền tham số, hoặc dùng `AsyncLocalStorage`.

---

## 3. Module — rào chắn thật (95–150′)

### 3.1. Bốn khoá khai báo

```ts
@Module({
  imports: [PassportModule, JwtModule.registerAsync({...})],  // cần gì từ bên ngoài
  controllers: [AuthController],                               // nhận request nào
  providers: [AuthService, MatKhauService, JwtStrategy],       // có gì bên trong
  exports: [AuthService],                                      // cho ai dùng lại gì
})
export class AuthModule {}
```

### 3.2. Điểm khác biệt cốt lõi so với Express

> **📝 Ghi chú giảng viên — nhấn mạnh điểm này**
>
> Ở Project 2 (buổi 18) ta cũng chia thư mục theo nghiệp vụ: `modules/auth/`, `modules/sanpham/`. Nhưng đó chỉ là **quy ước** — không có gì ngăn `sanpham.service.js` import thẳng một hàm nội bộ của `auth`.
>
> Module của Nest là **rào chắn thật**: không có trong `exports` thì module khác **không dùng được**, và lỗi hiện ra lúc khởi động chứ không phải lúc chạy.

Cho học viên thử: xoá `AuthService` khỏi `exports`, rồi tiêm nó vào `SanPhamService`. Đọc thông báo lỗi của Nest.

### 3.3. `registerAsync` — khi cấu hình cần chờ

```ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    signOptions: { expiresIn: '15m', issuer: 'hocbe-auth' },
  }),
})
```

> Vì sao không dùng `JwtModule.register({ secret: process.env.X })`?
>
> Vì `process.env` lúc đó **có thể chưa được nạp**, và ta muốn đi qua `ConfigService` để được **validate** (buổi 38). `registerAsync` bảo Nest: *"chờ `ConfigService` sẵn sàng rồi mới dựng module này."*

### 3.4. `@Global()` — dùng rất tiết kiệm

```ts
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

> Provider của module global dùng được ở **mọi** module mà không cần import lại.
>
> **⚠️ Cái giá: mất tính tường minh.** Đọc một module không còn biết nó phụ thuộc vào đâu.
>
> Chỉ dùng cho **hạ tầng thật sự dùng khắp nơi**: database, config, logger. Ba cái đó thôi.

### 3.5. Module gốc là bản đồ ứng dụng

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ ... }),
    LoggerModule.forRoot({ ... }),
    PrismaModule,
    AuthModule,
    SanPhamModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

> Đọc danh sách `imports` là biết **toàn bộ** ứng dụng gồm những gì.
>
> Ở Express (buổi 18) phải đọc `app.js` và lần theo từng `app.use()` — và thứ tự lại quan trọng, nên còn phải nhớ cả thứ tự.

---

## 4. Thực hành: chuyển module sản phẩm (150–175′)

Đối chiếu từng file với Project 2:

| Project 2 (Express) | Project 4 (Nest) | Thay đổi |
|---|---|---|
| `sanpham.routes.js` | `sanpham.controller.ts` | viết lại bằng decorator |
| `sanpham.service.js` | `sanpham.service.ts` | **logic gần như giữ nguyên**, chỉ đổi cách lấy `prisma` |
| `sanpham.schema.js` (zod) | `dto/*.dto.ts` | class + decorator (buổi 31) |
| *(không có)* | `sanpham.module.ts` | mới — đóng gói |

Logic nghiệp vụ **không đổi**:

```ts
// Hai truy vấn độc lập → chạy SONG SONG (buổi 07, 20)
const [tong, duLieu] = await Promise.all([
  this.prisma.sanPham.count({ where }),
  this.prisma.sanPham.findMany({ ... }),
]);
```

> **📝 Ghi chú giảng viên**
> Chỉ ra dòng comment này: mọi bài học từ Phase 1–3 **vẫn nguyên giá trị**. Nest không thay thế chúng — nó chỉ đổi **vỏ**.
>
> Học viên nào nghĩ *"học Nest là học lại từ đầu"* thì đây là bằng chứng ngược lại.

---

## 5. Bài tập về nhà

1. **Chuyển module giỏ hàng.** Port `giohang` từ Project 2 sang Nest: DTO, service, controller, module. So sánh số dòng.

2. **Phá rào chắn module.** Bỏ `AuthService` khỏi `exports` rồi tiêm vào `SanPhamService`. Chụp thông báo lỗi. Nó xuất hiện lúc **biên dịch**, lúc **khởi động**, hay lúc **chạy**?

3. **Provider kiểu factory.** Tạo provider `'CAU_HINH_SHOP'` đọc `TEN_SHOP` và `EMAIL_HO_TRO` từ `ConfigService`. Tiêm vào `HealthController` và trả về trong response.

4. **Thử `REQUEST` scope.** Đổi `SanPhamService` sang `Scope.REQUEST`, thêm `console.log` vào constructor, gọi API 5 lần. Đếm số lần khởi tạo. Rồi đo thời gian phản hồi trước/sau.

5. **`@Global()` có đáng không?** Bỏ `@Global()` khỏi `PrismaModule`. Phải sửa bao nhiêu file? Bạn thấy cách nào tốt hơn cho dự án này?

6. **Nâng cao — Dynamic Module.** Viết `ShopModule.forRoot({ tenShop })` theo mẫu `ConfigModule.forRoot()`. Đọc mã nguồn `@nestjs/config` để tham khảo.

---

## 6. Checklist kết thúc buổi

- [ ] Ba thứ biến mất khỏi controller so với Express?
- [ ] Vì sao dùng `@Req()` là dấu hiệu xấu?
- [ ] Vì sao `@Post('dang-nhap')` cần `@HttpCode(200)`?
- [ ] Kể bốn cách khai báo provider. Cái nào dùng trong test?
- [ ] `REQUEST` scope gây vấn đề gì?
- [ ] Module của Nest khác thư mục của Express ở điểm nào?
- [ ] `registerAsync` giải quyết vấn đề gì?
- [ ] Khi nào dùng `@Global()`? Cái giá là gì?

---

**Buổi trước:** [Buổi 28 — Vì sao NestJS & DI](./buoi-28-vi-sao-nestjs.md)
**Buổi tiếp theo:** Buổi 30 — Request lifecycle
