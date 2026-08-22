# Buổi 37 — Unit test với mock Dependency Injection

> **Phase 4** · NestJS
> **Mục tiêu:** Tận dụng đúng lợi thế lớn nhất của DI — test logic nghiệp vụ mà không cần database, mạng, hay server.
> **Code:** [`src/auth/auth.service.spec.ts`](../../code/project-04-nestjs/src/auth/auth.service.spec.ts)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 36 |
| 15–60′ | `Test.createTestingModule` & `overrideProvider` |
| 60–110′ | **Test bắt được thứ e2e không bắt được** |
| 110–150′ | Mock đúng cách: `mock.calls` |
| 150–175′ | Kim tự tháp test — đo bằng số liệu thật |
| 175–180′ | Bài tập |

---

## 1. Dựng testing module (15–60′)

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    AuthService,
    // ⭐ Thay THẬT bằng GIẢ — KHÔNG sửa AuthService một dòng nào
    { provide: PrismaService, useValue: prismaGia },
    { provide: MatKhauService, useValue: matKhauGia },
    { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token-gia') } },
    { provide: ConfigService, useValue: { get: jest.fn(), getOrThrow: jest.fn() } },
  ],
}).compile();

service = moduleRef.get(AuthService);
```

> **Đây là lợi ích lớn nhất của DI**, và là lý do đáng học NestJS.

### So với Project 1 (buổi 09)

| | Express | Nest |
|---|---|---|
| Để test được | **tự thiết kế** service nhận repository qua tham số | có sẵn |
| Bản giả | tự viết `taoRepoGia()` | `useValue` |
| Sửa code sản phẩm | phải sửa mọi chỗ gọi | **không sửa gì** |

> Ở buổi 09 ta đã **tự nghĩ ra** kỹ thuật này. Nest chỉ biến nó thành **mặc định của framework**.
>
> Học viên nào đã làm Project 1 sẽ thấy đây là chuyện quen — đó chính là ý đồ của cả khoá học.

### Chỉ khai provider CẦN THIẾT

```ts
providers: [AuthService, /* 4 phụ thuộc giả */]
```

> **Không** import `AppModule`. Nếu import, ta kéo cả database, logger, config thật vào — test lại thành e2e.
>
> Unit test chỉ dựng **đúng** thứ đang test và các phụ thuộc trực tiếp của nó.

---

## 2. Trọng tâm: test bắt được thứ e2e không bắt được (60–110′)

> **📝 Ghi chú giảng viên — phần thuyết phục nhất buổi học**

Nhắc lại buổi 15: để chống dò tài khoản bằng **đo thời gian**, ta viết:

```ts
if (!user) {
  await this.matKhau.bam('chuoi_gia_de_ton_thoi_gian_tuong_duong');
  throw new UnauthorizedException(LOI_CHUNG);
}
```

Hỏi lớp: *"Làm sao đảm bảo dòng này còn ở đó sau khi ai đó refactor sáu tháng nữa?"*

| Cách | Vấn đề |
|---|---|
| Đo thời gian bằng e2e | bấp bênh, hay sai ngẫu nhiên, chậm |
| Đọc code review | phụ thuộc con người |
| **Unit test + mock** | ✅ hỏi thẳng: hàm có được gọi không? |

```ts
it('🔒 email KHÔNG tồn tại → VẪN băm một lần (chống dò bằng đo thời gian)', async () => {
  prismaGia.user.findUnique.mockResolvedValue(null);

  await expect(service.dangNhap({ email: 'khong-co@shop.com', matKhau: 'x' }))
    .rejects.toThrow(UnauthorizedException);

  expect(matKhauGia.bam).toHaveBeenCalled();
});
```

> Test này **chạy trong vài mili-giây** và **không bao giờ sai ngẫu nhiên**. Đó là loại kiểm chứng mà DI mở khoá.

Tương tự với thông điệp lỗi:

```ts
it('🔒 hai trường hợp sai cho CÙNG một thông điệp', async () => {
  // ... lấy lỗi khi user không tồn tại
  // ... lấy lỗi khi sai mật khẩu
  expect(loiKhongCoUser).toEqual(loiSaiMatKhau);
});
```

---

## 3. Mock đúng cách: kiểm tra `mock.calls` (110–150′)

Đừng chỉ kiểm **kết quả trả về** — hãy kiểm **thứ được gửi xuống phụ thuộc**:

```ts
it('băm mật khẩu trước khi lưu — KHÔNG lưu mật khẩu thô', async () => {
  prismaGia.user.create.mockResolvedValue(USER_MAU);

  await service.dangKy({ email: 'a@shop.com', ten: 'A', matKhau: 'matkhau-du-dai' });

  expect(matKhauGia.bam).toHaveBeenCalledWith('matkhau-du-dai');

  // Kiểm chứng thứ THỰC SỰ được gửi xuống database
  const duLieuGui = prismaGia.user.create.mock.calls[0][0].data;
  expect(duLieuGui.matKhauHash).toBe('$2b$04$hash-gia');
  expect(duLieuGui.matKhau).toBeUndefined();
});
```

> Test này bắt được lỗi mà test kết quả **không** bắt được: nếu ai đó vô tình gửi cả `matKhau` thô xuống database, kết quả trả về vẫn đúng nhưng **database có mật khẩu thô**.

Và test hình dạng đầu ra:

```ts
it('KHÔNG trả về matKhauHash', async () => {
  const kq = await service.dangKy({ ... });
  expect(kq).not.toHaveProperty('matKhauHash');
  expect(Object.keys(kq).sort()).toEqual(['email', 'id', 'ten', 'vaiTro']);
});
```

> Dòng thứ hai chặt hơn: nó bắt cả trường hợp thêm **bất kỳ** trường mới nào — kể cả trường nhạy cảm chưa nghĩ tới.

### Test nhánh lỗi

```ts
it('email trùng (P2002) → ConflictException', async () => {
  prismaGia.user.create.mockRejectedValue({ code: 'P2002' });
  await expect(service.dangKy({ ... })).rejects.toThrow(ConflictException);
});

it('lỗi LẠ thì để nó nổi lên, KHÔNG nuốt', async () => {
  prismaGia.user.create.mockRejectedValue(new Error('database bốc cháy'));
  await expect(service.dangKy({ ... })).rejects.toThrow('database bốc cháy');
});
```

> Test thứ hai canh giữ nguyên tắc buổi 03: **hoặc xử lý được lỗi, hoặc để nó nổi lên**. Không có lựa chọn thứ ba.
>
> Với e2e, gây ra "lỗi database lạ" rất khó. Với mock thì một dòng.

---

## 4. Kim tự tháp test — số liệu thật (150–175′)

Đo trong chính dự án này:

```
Unit test (mock DI) :  9 test —  1.075 s
E2E test (thật)     : 18 test —  9.956 s
```

| | Unit | E2E |
|---|---|---|
| Tốc độ | ~120ms/test | ~550ms/test |
| Cần Docker | ❌ | ✅ |
| Cần database | ❌ | ✅ |
| Bắt lỗi phối hợp | ❌ | ✅ |
| Bắt trường hợp biên | ✅ | khó |
| Chạy được ở CI đơn giản | ✅ | cần dựng service |

> **Nguyên tắc: nhiều unit test, ít e2e test.**
>
> Nhưng cả hai đều cần. E2E bắt được thứ unit không thấy: guard sai thứ tự, pipe không đăng ký, filter không hoạt động, DI khai sai.

### Điều mock KHÔNG bắt được

> **📝 Ghi chú giảng viên — phải nói thẳng để lớp không ngộ nhận**
>
> Mock `prismaGia.user.create` **không** kiểm chứng câu Prisma đó có hợp lệ không. Gõ sai tên cột, sai kiểu quan hệ — mock vẫn "thành công".
>
> Đó là lý do **phải có e2e test**. Unit test kiểm **logic**; e2e kiểm **rằng logic đó nói chuyện đúng với thế giới thật**.
>
> Ai chỉ có unit test sẽ có bộ test xanh và một API hỏng.

---

## 5. Bài tập về nhà

1. **Unit test cho `SanPhamService`.** Mock `PrismaService`, test `danhSach` với các bộ lọc. Kiểm chứng `where` gửi xuống Prisma **đúng hình dạng** bằng `mock.calls`.

2. **Test logic tính tiền.** Port `datHangAnToan` sang Nest, viết unit test kiểm tổng tiền được tính đúng — mock `$transaction` để không cần database.

3. **Đo tốc độ.** Chạy `npm test` và `npm run test:e2e`, ghi lại thời gian. Tính tỷ lệ. Nếu có 500 test thì chênh lệch là bao nhiêu phút mỗi lần chạy CI?

4. **Chứng minh giới hạn của mock.** Cố tình gõ sai tên cột trong `SanPhamService` (ví dụ `tenSanPham` thay vì `ten`). Unit test có fail không? E2E có fail không? Rút ra kết luận.

5. **Coverage.** Chạy `npm run test:cov`. Cột `branch` của `auth.service.ts` là bao nhiêu? Viết thêm test cho nhánh chưa phủ. Nhắc lại buổi 17: coverage cao ≠ code đúng.

6. **Nâng cao — `createMock`.** Tìm hiểu `@golevelup/ts-jest` để sinh mock tự động từ kiểu TypeScript. So sánh với viết tay: cái nào rõ ràng hơn, cái nào ít lặp hơn?

---

## 6. Checklist

- [ ] `overrideProvider`/`useValue` cho phép làm gì mà không sửa code sản phẩm?
- [ ] Vì sao unit test **không** import `AppModule`?
- [ ] Test nào bắt được "vẫn băm khi user không tồn tại"? E2E làm được không?
- [ ] Vì sao kiểm `mock.calls` quan trọng hơn kiểm kết quả trả về?
- [ ] Test "lỗi lạ nổi lên" canh giữ nguyên tắc nào?
- [ ] Unit test nhanh hơn e2e bao nhiêu lần trong dự án này?
- [ ] Mock **không** bắt được loại lỗi nào?

---

**Buổi trước:** [Buổi 36 — RBAC bằng Guard + metadata](./buoi-36-rbac-guard.md)
**Buổi tiếp theo:** Buổi 38 — E2E test & Config module
