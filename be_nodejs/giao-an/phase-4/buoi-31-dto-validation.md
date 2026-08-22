# Buổi 31 — DTO & Validation với class-validator

> **Phase 4** · NestJS
> **Mục tiêu:** Chuẩn hoá validate input theo phong cách TypeScript-first của Nest, và đối chiếu thẳng với zod đã học ở buổi 11.
> **Code thực hành:** [`src/auth/dto/`](../../code/project-04-nestjs/src/auth/dto/) · [`src/sanpham/dto/`](../../code/project-04-nestjs/src/sanpham/dto/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 30 |
| 15–55′ | DTO là gì, vì sao tách khỏi Entity |
| 55–105′ | **class-validator vs zod — đối chiếu thẳng** |
| 105–145′ | **Ba tuỳ chọn của ValidationPipe quyết định mức an toàn** |
| 145–170′ | `class-transformer`: ép kiểu & làm sạch |
| 170–180′ | Bài tập & tổng kết |

---

## 1. DTO là gì (15–55′)

**DTO = Data Transfer Object** — mô tả **hình dạng dữ liệu đi vào/ra qua API**.

### Vì sao tách khỏi Entity?

| | Entity (Prisma model) | DTO |
|---|---|---|
| Mô tả | bảng trong database | dữ liệu qua API |
| Chứa | `matKhauHash`, `taoLuc`, `id` | chỉ trường client được gửi |
| Ai định nghĩa | schema database | hợp đồng API |

> **Nếu dùng Entity làm DTO:**
> - Client gửi được `matKhauHash` → **mass assignment** (buổi 22)
> - Đổi tên cột database → **vỡ API** của mọi client
> - Không khai được luật validate riêng cho từng thao tác

Trong dự án:

```ts
// Entity có: id, email, ten, matKhauHash, vaiTro, taoLuc
// DTO chỉ có:
export class DangKyDto {
  email!: string;
  ten!: string;
  matKhau!: string;    // ← mật khẩu THÔ, không phải hash
}
```

> **📝 Ghi chú giảng viên**
> Chỉ ra: DTO **cố tình không có** `vaiTro`. Đó là lý do test này pass:
> ```ts
> it('🚨 CHỐNG MASS ASSIGNMENT', async () => {
>   await goi().post('/auth/dang-ky')
>     .send({ ..., vaiTro: 'admin' })
>     .expect(400);      // "property vaiTro should not exist"
> });
> ```

---

## 2. class-validator vs zod (55–105′)

### 2.1. Khác biệt cơ bản về triết lý

```ts
// zod (buổi 11) — schema là GIÁ TRỊ
const taoTodoSchema = z.object({
  tieuDe: z.string().trim().min(1).max(200),
}).strict();
type Todo = z.infer<typeof taoTodoSchema>;    // ← phải suy ra kiểu

// class-validator — schema là LỚP + decorator
export class DangKyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  ten!: string;                                 // ← ĐÃ là kiểu rồi
}
```

| | zod | class-validator |
|---|---|---|
| Schema là | giá trị (object) | lớp + decorator |
| Kiểu TypeScript | phải `z.infer<>` | **chính là class** |
| Sinh tài liệu API | phải viết riêng | `@ApiProperty` → Swagger (buổi 39) |
| Chạy ở browser | ✅ dùng chung FE/BE | ❌ cần decorator + metadata |
| Suy luận kiểu | rất mạnh | trung bình |
| Cấu hình build | không cần gì | cần `emitDecoratorMetadata` |

> **📝 Ghi chú giảng viên**
> Đừng nói cái nào "tốt hơn". Nói rõ **đánh đổi**:
>
> - Dự án Nest → dùng `class-validator` vì nó tích hợp sẵn với Pipe và Swagger
> - Dự án dùng chung schema FE/BE → zod thắng rõ ràng
> - Có thể dùng zod **trong** Nest (có `nestjs-zod`) nếu muốn

### 2.2. Một điều class-validator làm tốt hơn

Nhắc lại **bẫy `.partial()` + `.default()`** ở buổi 11:

```js
// zod
taoTodoSchema.partial().parse({})   // → { xong: false }  ⚠️ KHÔNG rỗng
```

Ở Nest:

```ts
export class SuaSanPhamDto extends PartialType(TaoSanPhamDto) {}
```

> `PartialType` **không** có bẫy đó — vì giá trị mặc định được gán trong **service**, không nằm trong schema.
>
> **Bài học rộng hơn:** kiến trúc khác nhau → **bẫy khác nhau**. Đổi công cụ không phải là hết bẫy, mà là đổi sang tập bẫy khác. Phải học tập bẫy mới.

---

## 3. Trọng tâm: ba tuỳ chọn của ValidationPipe (105–145′)

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### `whitelist: true` — loại bỏ trường lạ

> Trường **không khai** trong DTO bị **xoá** khỏi object trước khi tới handler.
>
> Tương đương việc xây object `sach` bằng tay ở buổi 09.

### `forbidNonWhitelisted: true` — TỪ CHỐI thay vì im lặng xoá

> Đây là khác biệt quan trọng. Không có nó, trường lạ bị **im lặng bỏ qua** — client tưởng đã gửi thành công.
>
> Có nó → `400` kèm thông điệp rõ ràng. **Tương đương `.strict()` của zod.**

Test canh giữ:

```ts
const r = await goi().post('/auth/dang-ky')
  .send({ ..., vaiTro: 'admin' })
  .expect(400);
expect(JSON.stringify(r.body)).toMatch(/vaiTro should not exist/);
```

### `transform: true` — ép kiểu theo khai báo TypeScript

```ts
export class LocSanPhamDto {
  @Type(() => Number)     // ← query string LUÔN là chuỗi
  @IsInt()
  @Min(1)
  trang: number = 1;
}
```

> Thay cho `z.coerce.number()` ở buổi 11. Không có `transform`, `trang` là chuỗi `"1"` và mọi phép tính đều sai.

### ⚠️ `enableImplicitConversion` — cân nhắc kỹ

```ts
transformOptions: { enableImplicitConversion: false },
```

> Bật lên thì Nest tự ép kiểu **mọi** trường theo khai báo TypeScript, không cần `@Type`. Tiện, nhưng ép **quá tay**: chuỗi `"abc"` với kiểu `number` thành `NaN` mà không báo lỗi.
>
> **Khuyến nghị: tắt.** Khai `@Type()` tường minh cho trường cần ép. Tường minh thắng tiện lợi khi nói về validate.

### Kết quả gộp lỗi

```ts
it('gộp NHIỀU lỗi trong một response', async () => {
  const r = await goi().post('/auth/dang-ky')
    .send({ email: 'khong-phai-email', ten: '', matKhau: '123' })
    .expect(400);
  expect(r.body.message.length).toBeGreaterThanOrEqual(3);
});
```

```json
{
  "message": ["Email không hợp lệ", "Không được rỗng", "Tối thiểu 8 ký tự"],
  "error": "Bad Request",
  "statusCode": 400,
  "requestId": "92b63241-..."
}
```

> Ba lỗi trong **một** response — người dùng sửa hết một lần, không phải thử từng cái.

---

## 4. class-transformer: làm sạch dữ liệu (145–170′)

```ts
@IsEmail({}, { message: 'Email không hợp lệ' })
@Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
email!: string;
```

Test chứng minh:

```ts
it('tự trim và chuẩn hoá email về chữ thường', async () => {
  const r = await goi().post('/auth/dang-ky')
    .send({ email: '  HOA@T.COM  ', ten: '  Tên  ', matKhau: 'matkhau-du-dai' })
    .expect(201);
  expect(r.body.email).toBe('hoa@t.com');
  expect(r.body.ten).toBe('Tên');
});
```

> **Vì sao chuẩn hoá email quan trọng?**
>
> Không chuẩn hoá thì `A@shop.com` và `a@shop.com` là **hai tài khoản khác nhau** — dù ràng buộc `@unique` vẫn "đúng". Người dùng đăng ký hai lần mà không hiểu vì sao, và hỗ trợ khách hàng không tìm ra tài khoản.
>
> **Chuẩn hoá ở BIÊN, một lần.** Bên trong hệ thống chỉ có một dạng duy nhất.

### Thứ tự: `@Transform` chạy trước hay sau validate?

> `class-transformer` chạy **trước**, rồi `class-validator` kiểm tra giá trị **đã biến đổi**.
>
> Nhờ vậy `"  a@b.com  "` được trim rồi mới kiểm `@IsEmail` — nếu ngược lại thì nó fail vì có khoảng trắng.

---

## 5. Thông điệp lỗi bằng tiếng Việt

```ts
@MinLength(8, { message: 'Tối thiểu 8 ký tự' })
```

> **⚠️ Nhắc lại buổi 18:** thông điệp là **giao diện**, mã lỗi là **hợp đồng**.
>
> Frontend **không** được so khớp chuỗi tiếng Việt. Nhưng ở đây `ValidationPipe` mặc định chỉ trả `message` dạng mảng chuỗi, không có mã.
>
> Bài tập số 5 là sửa điểm này bằng `exceptionFactory`.

---

## 6. Bài tập về nhà

1. **DTO cho giỏ hàng.** Viết `ThemVaoGioDto` với `sanPhamId` (số nguyên ≥ 1) và `soLuong` (1–99, mặc định 1). Test cả trường hợp thiếu, sai kiểu, và vượt giới hạn.

2. **Chứng minh `forbidNonWhitelisted`.** Đổi thành `false`, gửi `{ ..., vaiTro: 'admin' }`. Response là gì? Trường đó có vào database không? Vì sao cách này nguy hiểm hơn?

3. **Bẫy `enableImplicitConversion`.** Bật nó lên, gửi `?trang=abc`. Kết quả là gì? Rồi tắt đi và gửi lại. So sánh.

4. **Validate tuỳ chỉnh.** Viết decorator `@LaSlug()` gộp `@IsString()` + `@Matches(/^[a-z0-9-]+$/)` thành một. Gợi ý: `applyDecorators`.

5. **Mã lỗi ổn định.** Dùng `exceptionFactory` của `ValidationPipe` để đổi định dạng lỗi thành `{ loi, ma: 'DU_LIEU_SAI', chiTiet: { <tên trường>: <thông điệp> } }` — giống hệt Project 2 (buổi 18). Vì sao đáng làm?

6. **Nâng cao — so sánh trực tiếp.** Cài `nestjs-zod`, viết lại `DangKyDto` bằng zod. Lập bảng: số dòng, độ rõ ràng, chất lượng suy luận kiểu, tài liệu Swagger sinh ra. Bạn chọn cái nào cho dự án của mình?

---

## 7. Checklist kết thúc buổi

- [ ] DTO khác Entity ở ba điểm nào?
- [ ] Nếu dùng Entity làm DTO thì gặp vấn đề gì?
- [ ] class-validator và zod khác nhau ở triết lý nào?
- [ ] `whitelist` và `forbidNonWhitelisted` khác nhau ra sao? Cái nào an toàn hơn?
- [ ] `transform: true` thay cho gì bên zod?
- [ ] Vì sao nên tắt `enableImplicitConversion`?
- [ ] `@Transform` chạy trước hay sau `@IsEmail`? Vì sao thứ tự đó đúng?
- [ ] Vì sao phải chuẩn hoá email về chữ thường?
- [ ] Frontend nên so khớp gì trong response lỗi?

---

**Buổi trước:** [Buổi 30 — Request lifecycle](./buoi-30-request-lifecycle.md)
**Buổi tiếp theo:** Buổi 32 — Prisma trong Nest & Repository pattern
