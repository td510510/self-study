# Buổi 39 — Swagger & tổng kết Project 4

> **Phase 4** · NestJS — **buổi tổng kết**
> **Mục tiêu:** Sinh tài liệu API tự động từ chính code, và nhìn lại toàn bộ hành trình Express → NestJS.
> **Code:** [`src/main.ts`](../../code/project-04-nestjs/src/main.ts)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 38 |
| 15–65′ | **Swagger sinh từ DTO — tài liệu không bao giờ lệch code** |
| 65–100′ | Giới hạn của Swagger tự động |
| 100–150′ | **Tổng kết: Express vs NestJS, bảng đối chiếu đầy đủ** |
| 150–175′ | Tiêu chí đánh giá Project 4 |
| 175–180′ | Chuẩn bị Phase 5 |

---

## 1. Swagger sinh từ code (15–65′)

```ts
const config = new DocumentBuilder()
  .setTitle('Shop API')
  .setDescription('Project 4 — E-commerce API viết bằng NestJS')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
```

Mở `http://localhost:3000/docs` — có ngay giao diện thử API.

### Nguồn thông tin: chính DTO

```ts
export class DangKyDto {
  @ApiProperty({ example: 'khach@shop.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'matkhau-du-dai', minLength: 8 })
  @MinLength(8)
  matKhau!: string;
}
```

> **📝 Ghi chú giảng viên — điểm mạnh thật sự**
>
> So với buổi 24 (viết `openapi.yaml` bằng tay):
>
> | | Viết tay | Sinh tự động |
> |---|---|---|
> | Công sức ban đầu | cao | thấp |
> | Sau khi sửa code | **phải nhớ cập nhật** | **tự khớp** |
> | Rủi ro | tài liệu lệch code | không lệch |
>
> **Tài liệu viết tay luôn lệch code.** Không phải vì người viết lười, mà vì sửa code và sửa tài liệu là hai hành động tách rời — và một trong hai sẽ bị quên.
>
> Đây là lợi ích quan trọng hơn cả chuyện đỡ gõ phím.

### Ba decorator chính

| Decorator | Việc |
|---|---|
| `@ApiTags('auth')` | nhóm endpoint |
| `@ApiOperation({ summary })` | mô tả ngắn |
| `@ApiResponse({ status, description })` | các mã trả về |
| `@ApiBearerAuth()` | route cần token |
| `@ApiProperty()` | trường trong DTO |

```ts
@Post('dang-ky')
@ApiOperation({ summary: 'Đăng ký tài khoản mới' })
@ApiResponse({ status: 201, description: 'Tạo thành công' })
@ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
dangKy(@Body() dto: DangKyDto) { ... }
```

---

## 2. Giới hạn của Swagger tự động (65–100′)

> Đừng để lớp nghĩ nó là phép màu. Ba giới hạn thật:

**(a) Không tự biết kiểu trả về**

```ts
dangKy(@Body() dto: DangKyDto) {
  return this.authService.dangKy(dto);   // ← Swagger KHÔNG biết hình dạng kết quả
}
```

> Phải khai thêm `@ApiOkResponse({ type: NguoiDungResponseDto })` — nghĩa là **phải viết DTO cho cả đầu ra**, không chỉ đầu vào.
>
> Bài tập số 2.

**(b) Không biết nghiệp vụ**

`@ApiOperation({ summary: 'Đăng ký tài khoản mới' })` là **người viết**. Swagger chỉ sinh **cấu trúc**, không sinh **ý nghĩa**.

**(c) `/docs` phải được bảo vệ ở production**

```ts
if (process.env.NODE_ENV !== 'production') {
  SwaggerModule.setup('docs', app, document);
}
```

> Tài liệu API công khai cho kẻ tấn công **bản đồ đầy đủ** hệ thống: mọi endpoint, mọi trường, mọi ràng buộc.
>
> Với API nội bộ: tắt hẳn hoặc đặt sau xác thực. Với API công khai: giữ, nhưng biết rõ mình đang công khai cái gì.

---

## 3. Tổng kết: Express vs NestJS (100–150′)

> **📝 Ghi chú giảng viên**
> Đây là phần quan trọng nhất buổi học. Mục tiêu **không** phải kết luận cái nào hơn, mà là để học viên **ra quyết định có cơ sở**.

### Bảng đối chiếu đầy đủ

| Việc | Express (Project 2) | NestJS (Project 4) |
|---|---|---|
| Định tuyến | `router.post(path, ...)` | `@Post(path)` |
| Validate | middleware zod tự viết | `ValidationPipe` + DTO |
| Xác thực | middleware tự viết đọc header | `AuthGuard('jwt')` + Strategy |
| Phân quyền | middleware `yeuCauVaiTro()` | Guard + metadata |
| Xử lý lỗi | middleware **4 tham số**, đặt cuối | Exception Filter, đăng ký tường minh |
| Lấy phụ thuộc | `import { prisma }` | tiêm qua constructor |
| Đóng gói | thư mục (quy ước) | Module (**rào chắn thật**) |
| Tài liệu API | viết tay | sinh từ DTO |
| Unit test | tự thiết kế để mock được | `overrideProvider` có sẵn |
| Graceful shutdown | tự viết 40 dòng | `enableShutdownHooks()` + hook |
| Cấu hình | tự đọc + tự validate | `ConfigModule` + Joi |

### Cái gì KHÔNG đổi

> Nhấn mạnh phần này — nó là thông điệp của cả khoá học.

| Bài học | Buổi | Vẫn đúng ở Nest? |
|---|---|---|
| Tiền là `Int`, không `Float` | 18 | ✅ |
| Transaction + khoá dòng | 19 | ✅ |
| Index & N+1 | 13, 19 | ✅ |
| Chống dò tài khoản | 15 | ✅ **ta phải tự viết** |
| `alg: none` | 15 | ✅ **ta phải tự khai** |
| Kiểm quyền theo chủ sở hữu | 16 | ✅ |
| Log che dữ liệu nhạy cảm | 18 | ✅ |
| Cache có TTL, khoá chứa userId | 21 | ✅ |
| Idempotency | 24 | ✅ |
| `dumb-init` cho tín hiệu | 27 | ✅ |

> **Nest đổi VỎ, không đổi RUỘT.**
>
> Học viên nào nghĩ *"học Nest là học lại từ đầu"* thì bảng này là câu trả lời. Và ngược lại: ai nghĩ *"dùng Nest là tự động an toàn"* cũng sai — bốn lỗ hổng ở buổi 35 đều do **ta** chặn.

### Khi nào chọn cái nào

| Chọn Nest | Chọn Express |
|---|---|
| team ≥ 3 người | một người làm |
| dự án sống nhiều năm | prototype, script, cron |
| nhiều module nghiệp vụ | vài endpoint |
| cần test kỹ | không cần test nhiều |
| team biết TypeScript | team chỉ biết JS |
| cần tài liệu API tự động | không cần |

> Nest có **chi phí học thật**: decorator, DI, module, lifecycle. Với API 5 endpoint, Express nhanh hơn và dễ hơn.

---

## 4. Tiêu chí đánh giá Project 4 (150–175′)

| Tiêu chí | Điểm |
|---|---|
| Module hoá đúng: mỗi nghiệp vụ một module, `exports` tối thiểu | 15 |
| DI đúng: không `new` thủ công, không import biến toàn cục | 15 |
| DTO đầy đủ, `whitelist` + `forbidNonWhitelisted` bật | 15 |
| Guard: xác thực + phân quyền, `401`/`403` đúng ngữ nghĩa | 15 |
| Exception Filter: mã lỗi ổn định, không lộ stack trace | 10 |
| Test: ≥ 15 unit + ≥ 15 e2e, có database test riêng | 15 |
| Config validate lúc khởi động, `.env` không commit | 5 |
| Swagger đầy đủ, có `@ApiOperation` cho mọi endpoint | 5 |
| README chạy được ngay | 5 |

**Điểm trừ:**

| Lỗi | Trừ |
|---|---|
| Lộ `matKhauHash` hoặc token ở response/log | −20 |
| Thiếu kiểm quyền theo chủ sở hữu (IDOR) | −15 |
| Dùng `Float` cho tiền | −15 |
| Bỏ `algorithms` trong JwtStrategy | −15 |
| Test chạy trên database phát triển | −10 |
| `@Req()` trong controller mà không có lý do | −5 |
| Thiếu `enableShutdownHooks()` | −5 |

---

## 5. Bài tập về nhà

1. **Hoàn thiện Project 4.** Port nốt module giỏ hàng và đơn hàng từ Project 2, giữ nguyên transaction + khoá dòng. Chạy lại test tranh chấp buổi 19.

2. **DTO cho đầu ra.** Viết `NguoiDungResponseDto` và `SanPhamResponseDto`, khai bằng `@ApiOkResponse({ type })`. Swagger giờ hiển thị gì thêm?

3. **Bảo vệ `/docs`.** Tắt Swagger ở production, hoặc đặt sau `AuthGuard`. Giải thích rủi ro nếu để công khai.

4. **So sánh số dòng.** Đếm số dòng thực của Project 2 và Project 4 cho **cùng** chức năng (auth + sản phẩm). Cái nào ngắn hơn? Kết luận có như bạn dự đoán không?

5. **Sinh client tự động.** Xuất `openapi.json`, dùng `openapi-typescript-codegen` sinh client TypeScript. Đây là lợi ích lớn nhất của tài liệu tự động với team frontend — vì sao?

6. **Nâng cao — quyết định kiến trúc.** Viết 500 chữ cho dự án thật của bạn: chọn Express hay Nest, dựa trên tiêu chí nào, và bạn sẽ mất bao lâu để chuyển đổi nếu chọn sai.

---

## 6. Checklist

- [ ] Swagger lấy thông tin từ đâu?
- [ ] Vì sao tài liệu sinh tự động ít lệch hơn viết tay?
- [ ] Ba giới hạn của Swagger tự động?
- [ ] Vì sao phải bảo vệ `/docs` ở production?
- [ ] Kể 5 việc Nest làm hộ mà Express phải tự viết.
- [ ] Kể 5 bài học từ Phase 1–3 **vẫn đúng** ở Nest.
- [ ] Nest có tự động làm ứng dụng an toàn hơn không?
- [ ] Khi nào KHÔNG nên dùng Nest?

---

## 🎓 Kết thúc Phase 4

Học viên giờ đã:

- Hiểu **vấn đề** mà DI giải quyết, không chỉ cú pháp
- Thuộc vòng đời request và biết đặt logic ở đâu
- Viết được DTO, Guard, Pipe, Filter, Decorator tuỳ chỉnh
- Test được logic nghiệp vụ **không cần database** (nhanh gấp ~10 lần)
- Sinh tài liệu API tự động, luôn khớp code
- **Và quan trọng nhất:** thấy rõ Nest đổi **vỏ**, không đổi **ruột**

**Số liệu Project 4:**

```
Unit test :  9 passed —  1.075 s
E2E test  : 18 passed —  9.956 s
```

**Phase 5 bắt đầu:** đưa hệ thống ra thế giới thật — CI/CD, deploy, giám sát, đo tải, và thiết kế hệ thống.

---

**Buổi trước:** [Buổi 38 — E2E test & Config module](./buoi-38-e2e-config.md)
**Buổi tiếp theo:** Buổi 40 — CI với GitHub Actions *(Phase 5)*
