# Buổi 34 — Exception Filter & xử lý lỗi tập trung

> **Phase 4** · NestJS
> **Mục tiêu:** Chuẩn hoá đầu ra lỗi trên toàn hệ thống, và đối chiếu với error middleware của Express.
> **Code:** [`src/common/filters/http-exception.filter.ts`](../../code/project-04-nestjs/src/common/filters/http-exception.filter.ts)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 33 |
| 15–55′ | Exception dựng sẵn & cách ném đúng |
| 55–110′ | **Filter toàn cục: ba nhánh xử lý** |
| 110–145′ | Ánh xạ lỗi Prisma |
| 145–170′ | Phạm vi filter & thứ tự |
| 170–180′ | Bài tập |

---

## 1. Exception dựng sẵn (15–55′)

```ts
throw new NotFoundException({ loi: `Không có sản phẩm id = ${id}`, ma: 'KHONG_TIM_THAY' });
throw new ConflictException({ loi: 'Email đã được sử dụng', ma: 'TRUNG_DU_LIEU' });
throw new UnauthorizedException({ loi: 'Email hoặc mật khẩu không đúng', ma: 'SAI_THONG_TIN' });
throw new ForbiddenException({ loi: 'Cần vai trò: admin', ma: 'KHONG_DU_QUYEN' });
```

| Express (buổi 18) | Nest |
|---|---|
| `throw loi.khongTimThay(...)` | `throw new NotFoundException(...)` |
| tự định nghĩa `HttpError` | dựng sẵn cho mọi status |
| middleware 4 tham số đọc `statusCode` | filter đọc `getStatus()` |

> **Truyền OBJECT chứ không truyền chuỗi.** Chuỗi thì Nest bọc thành `{ message, statusCode }` — mất mã lỗi ổn định (buổi 18, 24).

---

## 2. Trọng tâm: filter toàn cục (55–110′)

```ts
@Catch()      // ← không tham số = bắt MỌI loại exception
export class BoLocLoiToanCuc implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) { ... }
}
```

### Ba nhánh, ba cách xử lý

**Nhánh 1 — lỗi VẬN HÀNH (ta chủ động ném):**

```ts
if (exception instanceof HttpException) {
  this.logger.warn(`${req.method} ${req.url} → ${status}: ${exception.message}`);
  return res.status(status).json({ ...noiDung, requestId: req.id });
}
```

> Mức `warn`, **không** `error` — client gửi sai là chuyện bình thường (buổi 18).

**Nhánh 2 — lỗi Prisma:**

```ts
if (ma === 'P2002') return res.status(409).json({ ma: 'TRUNG_DU_LIEU', ... });
if (ma === 'P2025') return res.status(404).json({ ma: 'KHONG_TIM_THAY', ... });
```

**Nhánh 3 — lỗi LẬP TRÌNH (bug):**

```ts
this.logger.error(`${req.method} ${req.url} → 500`, exception.stack);
res.status(500).json({ loi: 'Lỗi máy chủ nội bộ', ma: 'LOI_MAY_CHU', requestId: req.id });
```

> **Log ĐẦY ĐỦ cho mình, trả TỐI THIỂU cho client** — nguyên tắc từ buổi 05, không đổi.
>
> `requestId` là cầu nối: người dùng đọc mã đó cho ta, ta `grep` log ra toàn bộ ngữ cảnh mà không lộ gì cho kẻ tấn công.

### So với Express

| | Express (buổi 18) | Nest |
|---|---|---|
| Nhận diện | **số lượng tham số** (4) | `implements ExceptionFilter` |
| Vị trí | phải đặt **cuối cùng** | đăng ký tường minh, không phụ thuộc thứ tự |
| Quên/đặt sai | lỗi **im lặng** không xử lý | lỗi biên dịch |

> Đây là ví dụ rõ nhất về việc Nest biến **quy ước dễ sai** thành **khai báo tường minh**.

---

## 3. Ánh xạ lỗi Prisma (110–145′)

Nhắc lại buổi 13 — bẫy phiên bản:

```ts
// Prisma 7 + driver adapter: tên cột KHÔNG ở err.meta.target
const cot = err.meta?.driverAdapterError?.cause?.constraint?.fields ?? err.meta?.target;
```

| Mã | Nghĩa | HTTP |
|---|---|---|
| `P2002` | trùng unique | `409` |
| `P2025` | không tìm thấy | `404` |
| `P2003` | vi phạm khoá ngoại | `400` |

Test canh giữ:

```ts
it('slug trùng → 409 (Exception Filter ánh xạ P2002)', async () => {
  await goi().post('/san-pham')
    .set('Authorization', `Bearer ${tokenAdmin}`)
    .send({ ten: 'Khác', slug: 'cap-sac', giaVND: 1000, danhMucId })
    .expect(409);
});
```

> **📝 Ghi chú giảng viên**
> Hỏi lớp: *"Nên bắt lỗi Prisma ở filter hay ở service?"*
>
> - **Ở service**: thông điệp cụ thể hơn (*"Email đã được sử dụng"*), nhưng phải lặp ở mọi service
> - **Ở filter**: một chỗ, nhưng thông điệp chung chung (*"Giá trị đã tồn tại"*)
>
> Dự án dùng **cả hai**: service bắt trường hợp quan trọng cần thông điệp riêng; filter làm **lưới an toàn** cho phần còn lại.
>
> Đây là mẫu chung: xử lý cụ thể ở gần nơi phát sinh, lưới an toàn ở tầng ngoài.

---

## 4. Phạm vi & thứ tự (145–170′)

```ts
app.useGlobalFilters(new BoLocLoiToanCuc());   // toàn cục
@UseFilters(LoiDonHangFilter)                   // controller hoặc method
```

**Filter CỤ THỂ hơn thắng:**

```ts
@Catch(PrismaClientKnownRequestError)   // ← chỉ bắt lỗi Prisma
@Catch(HttpException)                    // ← chỉ bắt HttpException
@Catch()                                 // ← bắt tất cả (đặt làm lưới cuối)
```

> Nest chọn filter theo **độ cụ thể**, không theo thứ tự đăng ký — khác hẳn Express.

### ⚠️ Bẫy: filter toàn cục không chạy trong test

```ts
// test/api.e2e-spec.ts — phải LẶP LẠI
app.useGlobalFilters(new BoLocLoiToanCuc());
```

> Vì `main.ts` **không** chạy trong test. Nối lại buổi 30 — bài tập tách `capHinhApp(app)` dùng chung giải quyết đúng vấn đề này.

---

## 5. Bài tập về nhà

1. **Filter riêng cho Prisma.** Tách nhánh Prisma ra `PrismaExceptionFilter` với `@Catch(PrismaClientKnownRequestError)`. Kiểm chứng nó thắng filter toàn cục.

2. **Chuẩn hoá lỗi validate.** `ValidationPipe` trả `{ message: [...] }` khác định dạng lỗi của ta. Dùng `exceptionFactory` để đưa về `{ loi, ma, chiTiet }` giống Project 2.

3. **Kiểm chứng không lộ thông tin.** Tạo route ném `new Error('BÍ MẬT: postgres://user:pass@db')`. Viết test chứng minh response **không** chứa chuỗi đó nhưng log **có**.

4. **Mức log đúng.** Gọi 10 request (2xx, 4xx, 5xx), kiểm chứng chỉ 5xx ở mức `error`. Vì sao quan trọng? (Nối buổi 18 — alert fatigue.)

5. **Sửa bẫy cấu hình.** Tách `capHinhApp(app)` dùng chung cho `main.ts` và test. Viết test chứng minh cả hai dùng đúng cùng cấu hình.

6. **Nâng cao — lỗi ngoài HTTP.** Filter hiện tại gọi `host.switchToHttp()`. Nếu ứng dụng có cả WebSocket (buổi 25) hoặc microservice thì sao? Đọc về `host.getType()` và xử lý đa ngữ cảnh.

---

## 6. Checklist

- [ ] Vì sao truyền object thay vì chuỗi vào exception?
- [ ] Ba nhánh xử lý trong filter là gì?
- [ ] Lỗi `4xx` log ở mức nào? Vì sao không phải `error`?
- [ ] `requestId` dung hoà hai yêu cầu nào?
- [ ] Filter của Nest khác error middleware Express ở ba điểm nào?
- [ ] Nest chọn filter theo tiêu chí gì?
- [ ] Nên bắt lỗi Prisma ở service hay filter?
- [ ] Vì sao filter toàn cục không chạy trong test?

---

**Buổi trước:** [Buổi 33 — Custom Pipe, Guard & Decorator](./buoi-33-pipe-guard-decorator.md)
**Buổi tiếp theo:** Buổi 35 — Auth trong Nest: Passport JWT
