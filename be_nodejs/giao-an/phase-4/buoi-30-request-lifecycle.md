# Buổi 30 — Request lifecycle: Middleware → Guard → Interceptor → Pipe → Filter

> **Phase 4** · NestJS
> **Mục tiêu:** Hiểu bản đồ đầy đủ một request đi qua Nest — nền tảng để biết **đặt logic nào ở đâu**.
> **Code thực hành:** [`code/project-04-nestjs/`](../../code/project-04-nestjs/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 29 |
| 15–45′ | Sơ đồ vòng đời — vẽ và thuộc |
| 45–130′ | **Năm loại thành phần: trách nhiệm riêng của từng loại** |
| 130–160′ | **Thứ tự quan trọng: bằng chứng từ test thật** |
| 160–175′ | Đặt logic ở đâu — bảng quyết định |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Sơ đồ vòng đời (15–45′)

Vẽ lên bảng và **giữ nguyên suốt Phase 4**:

```
                         REQUEST
                            │
                            ▼
                    ┌───────────────┐
                    │  MIDDLEWARE   │  Express thuần, chưa biết route
                    └───────┬───────┘
                            ▼
                    ┌───────────────┐
                    │     GUARD     │  ĐƯỢC ĐI TIẾP KHÔNG?  → 401/403
                    └───────┬───────┘
                            ▼
                    ┌───────────────┐
                    │  INTERCEPTOR  │  (trước)  bọc quanh handler
                    └───────┬───────┘
                            ▼
                    ┌───────────────┐
                    │     PIPE      │  BIẾN ĐỔI & VALIDATE tham số → 400
                    └───────┬───────┘
                            ▼
                    ┌───────────────┐
                    │    HANDLER    │  logic nghiệp vụ
                    └───────┬───────┘
                            ▼
                    ┌───────────────┐
                    │  INTERCEPTOR  │  (sau)  biến đổi response
                    └───────┬───────┘
                            ▼
                         RESPONSE

   Bất kỳ đâu ném lỗi  ──────────────►  ┌─────────────────┐
                                        │ EXCEPTION FILTER│
                                        └─────────────────┘
```

> **📝 Ghi chú giảng viên**
> Bắt học viên **vẽ lại từ trí nhớ** cuối buổi. Sơ đồ này là bản đồ để trả lời mọi câu hỏi *"tôi nên đặt code này ở đâu?"* trong suốt Phase 4.

---

## 2. Năm loại thành phần (45–130′)

### 2.1. Middleware — Express thuần

```ts
app.use(helmet());
app.use(pinoHttp({ ... }));
```

| Đặc điểm | |
|---|---|
| Chạy **đầu tiên** | trước cả routing |
| **Chưa biết** route nào sẽ xử lý | không đọc được metadata |
| Ký hiệu | `(req, res, next)` — y hệt Express |

> Dùng cho việc **không phụ thuộc route**: header bảo mật, log, CORS, parse body.
>
> Nối lại buổi 11 và 23: toàn bộ kiến thức middleware Express **dùng lại nguyên vẹn**.

### 2.2. Guard — "được đi tiếp không?"

```ts
@Injectable()
export class VaiTroGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean { ... }
}
```

| Đặc điểm | |
|---|---|
| Trả `true`/`false` | `false` → `403` tự động |
| **Biết** route nào, class nào | đọc được metadata qua `Reflector` |
| Trách nhiệm | **chỉ** quyết định cho qua hay không |

> **Điểm mạnh so với middleware Express:** Guard biết **ngữ cảnh đầy đủ**.
>
> ```ts
> const canThiet = this.reflector.getAllAndOverride<VaiTro[]>(KHOA_VAI_TRO, [
>   ctx.getHandler(),   // ← metadata ở METHOD
>   ctx.getClass(),     // ← metadata ở CLASS
> ]);
> ```
>
> Nhờ vậy đặt luật ở cấp controller rồi **ghi đè** cho một method cụ thể. Middleware Express không làm được — nó chỉ biết đường dẫn.

### 2.3. Interceptor — bọc quanh handler

Chạy **hai lần**: trước và sau handler. Dùng cho:

| Việc | Ví dụ |
|---|---|
| Đo thời gian | log `msec` cho mỗi request |
| Biến đổi response | bọc mọi response vào `{ data: ... }` |
| Cache | trả kết quả cũ, bỏ qua handler |
| Timeout | huỷ nếu handler chạy quá lâu |

> **💡 Đối chiếu Frontend:** giống hệt `axios.interceptors` — và giống **cả hai chiều** (request + response), khác với middleware chỉ một chiều.

### 2.4. Pipe — biến đổi & validate tham số

```ts
@Get(':id')
layMot(@Param('id', ParseIntPipe) id: number) { ... }
```

| Đặc điểm | |
|---|---|
| Chạy trên **từng tham số** | không phải cả request |
| Hai việc | **biến đổi** (`"5"` → `5`) và **validate** |
| Lỗi | `400 Bad Request` |

> `ValidationPipe` toàn cục thay cho middleware `validate(...)` ở buổi 11.

### 2.5. Exception Filter — điểm hội tụ lỗi

```ts
@Catch()
export class BoLocLoiToanCuc implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) { ... }
}
```

> Bắt lỗi từ **bất kỳ đâu** trong chuỗi — guard, pipe, handler, interceptor.
>
> Nối lại buổi 18: ở Express đó là middleware **bốn tham số** đặt **cuối cùng** — nếu đặt sai chỗ là không hoạt động. Ở Nest, filter được đăng ký tường minh, **không phụ thuộc thứ tự**.

---

## 3. Trọng tâm: thứ tự quan trọng thế nào (130–160′)

> **📝 Ghi chú giảng viên — dùng test thật làm bằng chứng**

Trong bộ e2e của dự án có một test **cố tình** kiểm chứng thứ tự:

```ts
it('⚠️ Guard chạy TRƯỚC Pipe: dữ liệu sai + thiếu quyền → 403', async () => {
  // giaVND là số thực (SAI) VÀ khách KHÔNG đủ quyền
  await goi()
    .post('/san-pham')
    .set('Authorization', `Bearer ${tokenKhach}`)
    .send({ ten: 'X', slug: 'x', giaVND: 99.5, danhMucId })
    .expect(403);          // ← 403, KHÔNG phải 400
});
```

Hỏi lớp trước khi chiếu kết quả: *"Dữ liệu sai VÀ không đủ quyền — server trả 400 hay 403?"*

**Đáp án: `403`.** Vì Guard đứng **trước** Pipe.

> **Và đây là hành vi ĐÚNG, không phải ngẫu nhiên.**
>
> Nếu Pipe chạy trước, server sẽ trả `400` kèm chi tiết *"giaVND phải là số nguyên"* — tức là **tiết lộ cấu trúc dữ liệu** cho người **không có quyền** truy cập endpoint đó.
>
> Kẻ tấn công có thể dò toàn bộ schema API mà không cần tài khoản hợp lệ.

Nối lại buổi 16: cùng nguyên tắc với việc trả `404` thay vì `403` cho tài nguyên riêng tư — **không tiết lộ thông tin cho người không có quyền**.

### Thứ tự trong cùng một loại

```ts
@UseGuards(AuthGuard('jwt'), VaiTroGuard)
```

> Chạy **trái sang phải**: xác thực trước, phân quyền sau. Đảo lại thì `VaiTroGuard` đọc `req.user` khi nó chưa được gán → luôn `403`, kể cả admin.
>
> Nối lại buổi 16: `401` (chưa biết bạn là ai) phải đứng trước `403` (không đủ quyền).

---

## 4. Đặt logic ở đâu — bảng quyết định (160–175′)

| Câu hỏi | Đặt ở | Ví dụ trong dự án |
|---|---|---|
| Áp cho **mọi** request, không cần biết route? | **Middleware** | helmet, CORS, log |
| Có được **đi tiếp** không? | **Guard** | `AuthGuard('jwt')`, `VaiTroGuard` |
| Cần bọc **trước và sau** handler? | **Interceptor** | đo thời gian, cache, timeout |
| Biến đổi/validate **một tham số**? | **Pipe** | `ParseIntPipe`, `ValidationPipe` |
| Lỗi trả về **như thế nào**? | **Filter** | `BoLocLoiToanCuc` |
| Quy tắc **nghiệp vụ**? | **Service** | tính tổng tiền, kiểm tồn kho |

> **⚠️ Sai lầm phổ biến nhất:** nhét logic nghiệp vụ vào Guard hoặc Interceptor vì "tiện".
>
> Ví dụ: Guard vừa kiểm quyền vừa nạp đơn hàng vào `req` để handler dùng. Nghe tiện, nhưng làm Guard không tái sử dụng được và service mất tính độc lập để test.
>
> **Quy tắc: hạ tầng ở lifecycle component, nghiệp vụ ở service.**

---

## 5. Ba phạm vi đăng ký

| Phạm vi | Cách đăng ký | Khi nào |
|---|---|---|
| Toàn cục | `app.useGlobalPipes(...)` trong `main.ts` | validate, filter |
| Controller | `@UseGuards(...)` trên class | cả nhóm route cùng luật |
| Method | `@UseGuards(...)` trên method | ngoại lệ cho một route |

> **⚠️ Bẫy thật:** thành phần toàn cục đăng ký trong `main.ts` **không chạy trong test** — vì test dùng `Test.createTestingModule`, không chạy `main.ts`.
>
> Đây là lý do file test của dự án phải **lặp lại** cấu hình:
>
> ```ts
> app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
> app.useGlobalFilters(new BoLocLoiToanCuc());
> ```
>
> **Cấu hình dễ lệch giữa test và production** — bài tập số 5 là sửa điểm yếu này.

---

## 6. Bài tập về nhà

1. **Vẽ lại sơ đồ** vòng đời từ trí nhớ, ghi rõ mã lỗi mỗi tầng sinh ra.

2. **Interceptor đo thời gian.** Viết `ThoiGianInterceptor` log `msec` cho mỗi request. So sánh với cách làm ở Express (buổi 10, dùng `res.on('finish')`) — cách nào gọn hơn, vì sao?

3. **Chứng minh thứ tự Guard.** Đảo `@UseGuards(VaiTroGuard, AuthGuard('jwt'))`. Gọi bằng token **admin**. Kết quả là gì? Giải thích.

4. **Chứng minh Guard trước Pipe.** Tạo route yêu cầu admin và có DTO chặt. Gọi bằng token khách với dữ liệu sai. Ghi lại status. Rồi bỏ Guard và gọi lại. So sánh hai response.

5. **Sửa điểm yếu cấu hình.** Tách phần cấu hình toàn cục của `main.ts` ra một hàm `capHinhApp(app)` dùng chung cho cả `main.ts` và test. Vì sao điều này quan trọng?

6. **Nâng cao — Interceptor bọc response.** Viết interceptor bọc mọi response thành `{ thanhCong: true, duLieu: ... }`. Rồi cân nhắc: có nên làm vậy không? (Gợi ý: nối buổi 24 về API contract.)

---

## 7. Checklist kết thúc buổi

- [ ] Kể đúng thứ tự năm loại thành phần.
- [ ] Middleware khác Guard ở điểm nào?
- [ ] Guard trả `false` thì client nhận mã gì?
- [ ] Interceptor chạy mấy lần cho một request?
- [ ] Pipe sinh ra mã lỗi nào?
- [ ] Vì sao Guard chạy trước Pipe là ĐÚNG về mặt bảo mật?
- [ ] `@UseGuards(A, B)` chạy theo thứ tự nào?
- [ ] Vì sao thành phần toàn cục trong `main.ts` không chạy trong test?
- [ ] Logic nghiệp vụ nên đặt ở đâu, và vì sao không đặt ở Guard?

---

**Buổi trước:** [Buổi 29 — Module, Controller, Provider](./buoi-29-module-controller-provider.md)
**Buổi tiếp theo:** Buổi 31 — DTO & Validation với class-validator
