# Buổi 12 — PostgreSQL & Prisma: schema và migration

> **Phase 2** · Express.js
> **Mục tiêu:** Rời bỏ file JSON, làm quen database quan hệ thật và ORM hiện đại. Hiểu vì sao **migration** quan trọng hơn việc sửa database bằng tay.
> **Code thực hành:** [`code/buoi-12-prisma-postgres/`](../../code/buoi-12-prisma-postgres/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 11 |
| 15–45′ | Vì sao cần RDBMS — giới hạn của file JSON |
| 45–75′ | Dựng Postgres bằng Docker Compose |
| 75–125′ | Viết `schema.prisma` đầu tiên |
| 125–165′ | **Migration: quy trình đổi cấu trúc database** |
| 165–180′ | Bài tập & tổng kết |

---

## 1. Vì sao cần database quan hệ (15–45′)

Mở lại `todo.repository.js` của Project 1 và hỏi lớp: *"Cách lưu bằng file JSON hỏng ở đâu?"*

Để lớp tự liệt kê, rồi chốt lại:

| Vấn đề | File JSON | PostgreSQL |
|---|---|---|
| Tìm 1 bản ghi trong 1 triệu | đọc **toàn bộ** file vào RAM | index — vài mili-giây |
| Hai request cùng ghi | ghi đè nhau (ta phải tự làm hàng đợi) | khoá ở mức dòng |
| "Xoá user thì todo của họ thế nào?" | tự viết tay, dễ quên | `ON DELETE CASCADE` |
| Đảm bảo email không trùng | tự quét toàn bộ mảng | `UNIQUE` — database từ chối |
| Trừ kho + tạo đơn, lỗi giữa chừng | dữ liệu sai vĩnh viễn | transaction rollback (buổi 19) |
| Nhiều tiến trình cùng chạy | **không thể** | bình thường |

> **📝 Ghi chú giảng viên**
> Nhấn mạnh dòng cuối. Ở buổi 44 ta chạy nhiều bản sao server để chịu tải. Với file JSON thì **không thể** — hai tiến trình ghi cùng một file là hỏng dữ liệu. Database sinh ra chính để giải quyết việc đó.

### ORM là gì, và cái giá của nó

Prisma dịch code JavaScript thành SQL:

```js
prisma.todo.findMany({ where: { xong: false } })
// →  SELECT ... FROM todos WHERE xong = false
```

**Được:** an toàn kiểu dữ liệu, tự chống SQL injection, đổi database dễ hơn, autocomplete.
**Mất:** thêm một lớp trừu tượng — khi chậm, phải biết SQL để chẩn đoán.

> Vì vậy suốt khoá học ta **luôn bật log query** khi học: `PRISMA_LOG=query`. Phải luôn thấy được SQL thật mà mình đang sinh ra.

---

## 2. Dựng Postgres bằng Docker (45–75′)

[`docker-compose.yml`](../../code/buoi-12-prisma-postgres/docker-compose.yml)

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: hocbe
      POSTGRES_PASSWORD: matkhau_hoc_tap
      POSTGRES_DB: todo_db
    ports:
      - '5433:5432'          # ← 5433 ở máy thật, tránh đụng Postgres có sẵn
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U hocbe -d todo_db']
      interval: 5s
      retries: 10
```

**Bốn điểm dạy:**

**(a) Vì sao Docker thay vì cài Postgres trực tiếp?**
Cả lớp dùng **chính xác** cùng một phiên bản → không còn "máy em lỗi". Xoá sạch bằng một lệnh. Và đây chính là cách chạy ở production (buổi 27).

**(b) `'5433:5432'` — trái là máy thật, phải là trong container.** Dùng 5433 để không đụng Postgres có sẵn trên máy học viên.

**(c) `volumes` — dữ liệu sống sót qua `docker compose down`.**

```bash
docker compose down      # dừng, GIỮ dữ liệu
docker compose down -v   # dừng, XOÁ SẠCH dữ liệu
```

> Cho học viên chạy `down` rồi `up` để thấy dữ liệu còn nguyên. Rồi `down -v` để thấy mất sạch. Nhớ đời.

**(d) `healthcheck` — không có nó, app khởi động trước khi Postgres sẵn sàng và lỗi kết nối.**

```bash
docker compose up -d
docker compose ps
```

```
NAME             STATUS                    PORTS
hocbe-postgres   Up 16 seconds (healthy)   0.0.0.0:5433->5432/tcp
hocbe-adminer    Up Less than a second     0.0.0.0:8081->8080/tcp
```

> **📝 Ghi chú giảng viên — lỗi cổng đã bị chiếm**
> Khi soạn bài này, `adminer` không khởi động được:
> ```
> Bind for 0.0.0.0:8080 failed: port is already allocated
> ```
> Máy giảng viên đã có thứ khác dùng cổng 8080. Cách sửa: đổi **số bên trái** (`'8081:8080'`).
>
> Đây là lỗi **cả lớp sẽ gặp**. Dạy luôn cách đọc thông báo và cách sửa — quan trọng hơn là né tránh nó.

---

## 3. Schema đầu tiên (75–125′)

[`prisma/schema.prisma`](../../code/buoi-12-prisma-postgres/prisma/schema.prisma)

```prisma
model Todo {
  id     Int     @id @default(autoincrement())
  tieuDe String
  xong   Boolean @default(false)
  uuTien UuTien  @default(trung)

  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)

  taoLuc DateTime  @default(now())
  suaLuc DateTime? @updatedAt

  @@index([userId])
  @@index([xong])
  @@map("todos")
}

enum UuTien { thap  trung  cao }
```

### Bốn điều phải giải thích kỹ

**(a) Quan hệ 1-n có hai nửa, chỉ một nửa là cột thật**

```prisma
model User { todos Todo[] }              // ← KHÔNG tạo cột nào trong bảng users
model Todo { userId Int                  // ← CỘT THẬT (khoá ngoại)
             user User @relation(...) }  // ← chỉ là "lối đi" cho Prisma
```

Hỏi lớp: *"Bảng `users` có cột `todos` không?"* → **Không.** Quan hệ 1-n được lưu ở phía "nhiều". Kiểm chứng ngay bằng `\d users`.

**(b) `onDelete: Cascade` — quyết định nghiệp vụ, không phải kỹ thuật**

| Lựa chọn | Nghĩa |
|---|---|
| `Cascade` | xoá user → xoá luôn todo của họ |
| `Restrict` | **cấm** xoá user còn todo |
| `SetNull` | xoá user → `userId` thành null (cột phải `Int?`) |

> Đây là câu hỏi cho **người thiết kế nghiệp vụ**, không phải lập trình viên tự quyết. Với đơn hàng, `Cascade` là thảm hoạ — xoá khách hàng là mất sạch lịch sử mua hàng.

**(c) `@@index` — vì sao cần**

Không có index, tìm todo của một user phải **quét toàn bộ bảng**. Với 1 triệu dòng là thảm hoạ. Đào sâu ở buổi 19.

**(d) `@@map` — tên trong code khác tên trong database**

`model Todo` → bảng `todos`. Quy ước: code dùng số ít PascalCase, bảng dùng số nhiều snake_case.

### Prisma 7 khác các phiên bản trước

> **📝 Ghi chú giảng viên — bắt buộc nói với lớp**
> Prisma 7 **đổi chỗ chuỗi kết nối**. Hầu hết tài liệu trên mạng viết cho Prisma 5/6 và sẽ báo lỗi:
>
> ```prisma
> datasource db {
>   provider = "postgresql"
>   url      = env("DATABASE_URL")   // ❌ Prisma 7 KHÔNG còn chấp nhận
> }
> ```
> ```
> Error code: P1012
> The datasource property `url` is no longer supported in schema files.
> ```

Prisma 7 chuyển nó sang [`prisma.config.ts`](../../code/buoi-12-prisma-postgres/prisma.config.ts):

```ts
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

**Vì sao Prisma đổi?** Vì file config là JavaScript/TypeScript thật — đọc được biến môi trường, secret manager, hay logic bất kỳ. Cú pháp `schema.prisma` không làm được.

Và **generator**: Prisma 7 mặc định sinh ra **TypeScript**. Dự án JS thuần thì dùng generator cũ:

```prisma
generator client {
  provider = "prisma-client-js"   // sinh JavaScript vào node_modules/@prisma/client
}
```

---

## 4. Migration — trọng tâm buổi học (125–165′)

### 4.1. Quy tắc không được phá

> **KHÔNG BAO GIỜ sửa cấu trúc database bằng tay.**
> Luôn: sửa `schema.prisma` → chạy `prisma migrate dev` → Prisma sinh SQL.

Vì sao? Vì database ở máy bạn, máy đồng đội, staging và production phải **giống hệt nhau**. Sửa tay một chỗ là ba chỗ còn lại lệch — và không ai biết lệch từ bao giờ.

### 4.2. Migration đầu tiên

```bash
npx prisma migrate dev --name khoi_tao_user_va_todo
```

```
Applying migration `20260821155326_khoi_tao_user_va_todo`
Your database is now in sync with your schema.
```

Mở file SQL Prisma vừa sinh — **bắt buộc đọc cùng lớp**:

```sql
CREATE TYPE "UuTien" AS ENUM ('thap', 'trung', 'cao');

CREATE TABLE "todos" (
    "id" SERIAL NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "xong" BOOLEAN NOT NULL DEFAULT false,
    "uuTien" "UuTien" NOT NULL DEFAULT 'trung',
    "userId" INTEGER NOT NULL,
    ...
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "todos_userId_idx" ON "todos"("userId");

ALTER TABLE "todos" ADD CONSTRAINT "todos_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
```

> **📝 Ghi chú giảng viên**
> Đối chiếu **từng dòng** schema với SQL sinh ra. `@unique` → `CREATE UNIQUE INDEX`. `onDelete: Cascade` → `ON DELETE CASCADE`. `enum` → `CREATE TYPE`.
>
> Thông điệp: **Prisma không phải phép màu, nó là bộ sinh SQL.** Học viên phải luôn đọc được SQL nó sinh ra.

Kiểm chứng trong database thật:

```bash
docker exec hocbe-postgres psql -U hocbe -d todo_db -c "\d todos"
```

### 4.3. Migration thứ hai — quy trình đổi schema

Thêm một trường vào `schema.prisma`:

```prisma
/// Hạn chót
hanChot DateTime?
```

```bash
npx prisma migrate dev --name them_han_chot
```

SQL sinh ra chỉ **một dòng**:

```sql
ALTER TABLE "todos" ADD COLUMN "hanChot" TIMESTAMP(3);
```

**Dữ liệu cũ vẫn còn nguyên** — Prisma chỉ thêm cột, không tạo lại bảng.

Lịch sử migration được ghi trong chính database:

```sql
SELECT migration_name, finished_at IS NOT NULL AS da_xong FROM _prisma_migrations;
```

```
            migration_name            | da_xong
--------------------------------------+---------
 20260821155326_khoi_tao_user_va_todo | t
 20260821155635_them_han_chot         | t
```

> Nhờ bảng này, Prisma biết migration nào đã chạy. Đồng đội `git pull` rồi `prisma migrate dev` sẽ chỉ chạy phần còn thiếu.

### 4.4. Vì sao trường mới phải cho phép null

Hỏi lớp: *"Nếu khai `hanChot DateTime` (bắt buộc) thì sao?"*

→ Bảng đã có 150 dòng. Thêm cột `NOT NULL` mà không có giá trị mặc định → **migration thất bại**. Prisma sẽ hỏi bạn muốn xử lý thế nào.

Ba lựa chọn khi thêm trường bắt buộc vào bảng có sẵn dữ liệu:
1. Cho phép null (`DateTime?`) — đơn giản nhất
2. Đặt `@default(...)`
3. Migration ba bước: thêm nullable → điền dữ liệu → đổi thành bắt buộc

### 4.5. `migrate dev` vs `migrate deploy`

| Lệnh | Dùng ở | Hành vi |
|---|---|---|
| `prisma migrate dev` | máy lập trình viên | so sánh schema, **sinh** migration mới, có thể reset DB |
| `prisma migrate deploy` | staging / production | **chỉ chạy** migration có sẵn, không bao giờ sinh mới, không bao giờ reset |

> **⚠️ Chạy `migrate dev` trên production có thể XOÁ SẠCH database.** Ghi lên bảng, gạch chân. Ở buổi 41 (CI/CD) ta sẽ chỉ dùng `migrate deploy`.

---

## 5. Bài tập về nhà

1. **Thêm model.** Tạo `model GhiChu` với quan hệ 1-n tới `Todo` (`onDelete: Cascade`). Chạy migration, đọc SQL sinh ra, kiểm chứng bằng `\d ghi_chu`.

2. **Thử `Restrict`.** Đổi `onDelete` của `Todo` thành `Restrict`, migrate, rồi thử xoá một user còn todo. Chụp lại thông báo lỗi và giải thích.

3. **Trường bắt buộc.** Cố tình thêm `moTa String` (không có `?`, không `@default`) vào bảng đã có dữ liệu. Chụp lại điều Prisma hỏi, rồi giải quyết bằng **cả ba** cách ở mục 4.4.

4. **Đọc database bằng SQL thuần.** Không dùng Prisma, chỉ dùng `psql`, viết câu truy vấn liệt kê mỗi user kèm số todo chưa xong. Gợi ý: `LEFT JOIN` + `GROUP BY`.

5. **Adminer.** Mở `http://localhost:8081`, đăng nhập (System: PostgreSQL, Server: `postgres`, User: `hocbe`), xem bảng và dữ liệu. Vì sao Server là `postgres` chứ không phải `localhost`?

6. **Xoá và dựng lại.** Chạy `docker compose down -v`, rồi `up -d`, rồi `prisma migrate deploy`. Xác nhận cấu trúc bảng được dựng lại đầy đủ từ thư mục `migrations/`. Đây chính là điều xảy ra khi deploy lên máy chủ mới.

---

## 6. Checklist kết thúc buổi

- [ ] Kể 3 việc database làm được mà file JSON không làm được.
- [ ] `'5433:5432'` — số nào là cổng máy thật?
- [ ] `docker compose down` và `down -v` khác nhau thế nào?
- [ ] Trong quan hệ 1-n, cột khoá ngoại nằm ở bảng nào?
- [ ] `onDelete: Cascade` / `Restrict` / `SetNull` — khi nào dùng cái nào?
- [ ] Vì sao không được sửa cấu trúc database bằng tay?
- [ ] `migrate dev` và `migrate deploy` khác nhau ra sao? Cái nào dùng ở production?
- [ ] Prisma 7 khai chuỗi kết nối ở đâu?

---

**Buổi trước:** [Buổi 11 — Middleware nâng cao & validation với zod](./buoi-11-middleware-zod.md)
**Buổi tiếp theo:** [Buổi 13 — Prisma CRUD & Relations](./buoi-13-prisma-crud-relations.md)
