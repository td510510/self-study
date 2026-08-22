# Buổi 32 — Prisma trong Nest & Repository pattern

> **Phase 4** · NestJS
> **Mục tiêu:** Tích hợp tầng dữ liệu đã xây ở Phase 2–3 vào kiến trúc Nest chuẩn.
> **Code:** [`src/prisma/`](../../code/project-04-nestjs/src/prisma/)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 31 |
| 15–60′ | **PrismaService: từ biến toàn cục thành provider** |
| 60–100′ | Vòng đời module & graceful shutdown |
| 100–145′ | Repository pattern — khi nào cần, khi nào thừa |
| 145–175′ | Transaction trong ngữ cảnh Nest |
| 175–180′ | Bài tập |

---

## 1. Từ biến toàn cục thành provider (15–60′)

**Express (buổi 13):**

```js
export const prisma = new PrismaClient({ adapter });
// mọi file: import { prisma } from '../lib/prisma.js';
```

**Nest:**

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.getOrThrow('DATABASE_URL') }) });
  }
  async onModuleInit()    { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

**Được ba thứ:**

| Được | Vì sao quan trọng |
|---|---|
| Test thay được bằng bản giả | `overrideProvider` — buổi 36 |
| Vòng đời do Nest quản | không quên đóng kết nối |
| Một instance, đảm bảo bởi container | nối buổi 13, 20 — không còn là kỷ luật tự giữ |

Và cấu hình đi qua `ConfigService`:

```ts
config.getOrThrow<string>('DATABASE_URL')
```

> `getOrThrow` thay vì `get` — **fail fast** (buổi 03). Thiếu biến là ứng dụng không khởi động, chứ không phải lỗi khó hiểu lúc chạy.

---

## 2. Vòng đời & graceful shutdown (60–100′)

Nest gọi tự động:

| Hook | Khi nào |
|---|---|
| `onModuleInit` | module đã dựng xong |
| `onApplicationBootstrap` | toàn bộ app sẵn sàng |
| `onModuleDestroy` | bắt đầu tắt |
| `beforeApplicationShutdown` | trước khi đóng server |
| `onApplicationShutdown` | sau khi đóng |

> **⚠️ BẮT BUỘC bật trong `main.ts`:**
>
> ```ts
> app.enableShutdownHooks();
> ```
>
> Không có dòng này, `onModuleDestroy` **không bao giờ chạy** khi nhận `SIGTERM`. Toàn bộ bài học buổi 08 mất tác dụng.
>
> Đây là ví dụ: framework lo hộ, nhưng vẫn phải **biết nó lo cái gì** và cần bật gì.

### Đối chiếu với Express

| Việc | Express (buổi 08) | Nest |
|---|---|---|
| Đóng kết nối DB | tự gọi `prisma.$disconnect()` | `onModuleDestroy` |
| Ngừng nhận request mới | tự `server.close()` | Nest lo |
| Chờ request đang chạy | tự đếm `soRequestDangChay` | Nest lo |
| Hạn chót ép thoát | tự `setTimeout` | ⚠️ **vẫn phải tự làm** |

> Vẫn còn một thứ Nest **không** lo: hạn chót. Bài tập số 4.

---

## 3. Repository pattern — khi nào cần (100–145′)

Ở Project 1 (buổi 09) ta tách repository vì **bắt buộc** — để test được không cần đĩa.

Ở Nest, `PrismaService` **đã** tiêm được và mock được. Vậy còn cần repository nữa không?

| Cần repository | Không cần |
|---|---|
| Truy vấn phức tạp lặp ở nhiều service | CRUD đơn giản |
| Có kế hoạch đổi ORM | chắc chắn dùng Prisma lâu dài |
| Muốn service **hoàn toàn** không biết Prisma | chấp nhận service dùng Prisma trực tiếp |
| Cần gom logic cache/audit quanh truy vấn | không |

> **📝 Ghi chú giảng viên**
> Đây là chỗ dễ **over-engineer**. Rất nhiều dự án Nest thêm repository chỉ để "đúng kiến trúc", kết quả là mỗi phương thức chỉ gọi lại đúng một dòng Prisma — thêm một tầng mà không thêm giá trị.
>
> Dự án này **cố tình không** dùng repository: `SanPhamService` gọi thẳng `this.prisma`. Hỏi lớp có đồng ý không, và tiêu chí nào để quyết định.
>
> Quy tắc thực dụng: **thêm tầng khi có ĐAU THẬT, không thêm để phòng xa.**

---

## 4. Transaction trong Nest (145–175′)

Logic **giống hệt** buổi 19 — chỉ đổi cách lấy client:

```ts
async datHang(userId: number, dto: DatHangDto) {
  return this.prisma.$transaction(
    async (tx) => {
      const [sp] = await tx.$queryRaw`SELECT ... FOR UPDATE`;   // khoá dòng
      const kq = await tx.sanPham.updateMany({
        where: { id, tonKho: { gte: soLuong } },                 // điều kiện trong UPDATE
        data: { tonKho: { decrement: soLuong } },
      });
      if (kq.count === 0) throw new ConflictException({ ma: 'HET_HANG' });
      ...
    },
    { timeout: 10_000, maxWait: 5_000 },
  );
}
```

> **Mọi bài học buổi 19–20 vẫn nguyên giá trị:**
> - `FOR UPDATE` + điều kiện trong `UPDATE`
> - sắp xếp theo id để tránh deadlock
> - `timeout` để không giữ kết nối vô hạn
> - **không** gọi API bên ngoài trong transaction

### ⚠️ Bẫy riêng của Nest

Truyền `tx` xuống service khác thì service đó phải **nhận `tx` làm tham số**, không được dùng `this.prisma`:

```ts
// ❌ SAI — chạy NGOÀI transaction, không rollback cùng
await this.tonKhoService.tru(id, soLuong);

// ✅ ĐÚNG
await this.tonKhoService.tru(tx, id, soLuong);
```

> Đây là lỗi **rất khó phát hiện**: mọi thứ chạy đúng cho tới khi có lỗi giữa chừng, và khi đó một phần dữ liệu đã ghi vĩnh viễn.
>
> Giải pháp nâng cao: `AsyncLocalStorage` để truyền `tx` ngầm — nhưng phức tạp, cân nhắc kỹ.

---

## 5. Bài tập về nhà

1. **Port module đơn hàng.** Chuyển `datHangAnToan` từ Project 2 sang Nest, giữ nguyên transaction + khoá dòng. Chạy lại test tranh chấp (buổi 19) và xác nhận vẫn đúng.

2. **Chứng minh shutdown hooks.** Bỏ `app.enableShutdownHooks()`, thêm log vào `onModuleDestroy`, gửi `SIGTERM`. Có log không? Rồi bật lại.

3. **Hạn chót tắt.** Nest không tự đặt hạn chót. Thêm cơ chế ép thoát sau 10 giây. Vì sao cần? (Nối buổi 08.)

4. **Có nên thêm repository?** Viết `SanPhamRepository` cho dự án này. Rồi đánh giá: nó thêm giá trị gì, tốn thêm gì? Bạn giữ hay bỏ?

5. **Bẫy transaction.** Tạo hai service, một cái gọi cái kia trong transaction nhưng dùng `this.prisma`. Cố tình gây lỗi giữa chừng. Chứng minh dữ liệu **không** rollback hết.

6. **Nâng cao — middleware Prisma.** Dùng `$extends` để log mọi truy vấn chậm hơn 100ms. So sánh với cách đếm query ở buổi 13.

---

## 6. Checklist

- [ ] Ba lợi ích khi biến Prisma thành provider?
- [ ] `getOrThrow` khác `get` thế nào? Vì sao dùng nó?
- [ ] `onModuleDestroy` cần gì mới chạy?
- [ ] Nest lo giúp gì trong graceful shutdown, và **không** lo gì?
- [ ] Khi nào nên thêm repository, khi nào là thừa?
- [ ] Bẫy khi truyền `tx` xuống service khác là gì?

---

**Buổi trước:** [Buổi 31 — DTO & Validation](./buoi-31-dto-validation.md)
**Buổi tiếp theo:** Buổi 33 — Custom Pipe, Guard & Decorator
