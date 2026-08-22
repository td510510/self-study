# Buổi 13 — Prisma CRUD & Relations

> **Phase 2** · Express.js
> **Mục tiêu:** Thao tác dữ liệu quan hệ thành thạo, và nhận diện được **vấn đề N+1** — lỗi hiệu năng phổ biến nhất khi dùng ORM.
> **Code thực hành:** [`code/buoi-12-prisma-postgres/`](../../code/buoi-12-prisma-postgres/) (dùng chung dự án với buổi 12)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 12 |
| 15–75′ | CRUD đầy đủ với Prisma Client |
| 75–100′ | Mã lỗi Prisma → HTTP status |
| 100–150′ | **Vấn đề N+1 — đo bằng số query thật** |
| 150–175′ | `_count`, `some`/`every`/`none` |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Khởi tạo client — cái bẫy đầu tiên (15–25′)

[`src/prisma.js`](../../code/buoi-12-prisma-postgres/src/prisma.js)

```js
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: process.env.PRISMA_LOG === 'query' ? ['query'] : ['warn', 'error'],
});
```

> **⚠️ CHỈ TẠO MỘT INSTANCE cho cả ứng dụng.**
> Mỗi `PrismaClient` mở một **connection pool** riêng. Tạo nhiều instance = mở quá nhiều kết nối = Postgres từ chối (mặc định tối đa 100 kết nối).
>
> Đây là lỗi phổ biến nhất của người mới dùng Prisma — thường xảy ra khi viết `new PrismaClient()` ngay trong file route, rồi file đó được import ở nhiều nơi.

Và luôn có sẵn đường tắt để **học**:

```bash
PRISMA_LOG=query node src/01-crud-co-ban.js
```

> Bật log query khi học là bắt buộc. Phải luôn thấy được SQL thật mình đang sinh ra.

---

## 2. CRUD đầy đủ (25–75′)

[`src/01-crud-co-ban.js`](../../code/buoi-12-prisma-postgres/src/01-crud-co-ban.js)

### 2.1. Create

```js
// Tạo kèm bản ghi con trong MỘT lời gọi — Prisma tự lo thứ tự insert
const huy = await prisma.user.create({
  data: {
    email: 'huy@example.com',
    ten: 'Quốc Huy',
    todos: { create: [{ tieuDe: 'Học Prisma', uuTien: 'cao' }] },
  },
  include: { todos: true },
});
```

Hỏi lớp: *"Nếu tự viết, ta phải làm mấy bước?"*
→ Insert user, lấy id, insert todo với id đó. Và nếu bước hai lỗi thì user đã tạo rồi — dữ liệu sai. Prisma bọc trong transaction sẵn.

**`createMany` vs vòng lặp `create`:**

```js
await prisma.todo.createMany({ data: [ ... ] });   // MỘT câu INSERT nhiều dòng
```

Nhanh hơn nhiều so với gọi `create()` trong vòng lặp — đây là dạng thu nhỏ của bài học N+1 ở phần sau.

### 2.2. Read

```js
await prisma.todo.findMany({
  where: { xong: false, uuTien: { in: ['cao', 'trung'] } },
  orderBy: [{ uuTien: 'asc' }, { taoLuc: 'desc' }],
  take: 10,
  skip: 0,
  select: { id: true, tieuDe: true, uuTien: true },   // ← chỉ lấy cột cần
});
```

| Hàm | Khi nào |
|---|---|
| `findUnique` | tra theo khoá chính hoặc cột `@unique` |
| `findFirst` | tra theo điều kiện bất kỳ, lấy bản đầu |
| `findMany` | danh sách |
| `findUniqueOrThrow` | tự ném lỗi P2025 nếu không thấy |

**`select` vs `include`:**

- `select` — **chỉ** lấy các trường liệt kê
- `include` — lấy **tất cả** trường, cộng thêm quan hệ

Không dùng cả hai cùng cấp. Ưu tiên `select` để không kéo về cột thừa.

### 2.3. Update

```js
const daSua = await prisma.todo.update({ where: { id }, data: { xong: true } });
console.log(daSua.suaLuc);   // ← @updatedAt tự cập nhật, ta không phải gán
```

**`updateMany` trả về số lượng, không trả bản ghi:**

```js
await prisma.todo.updateMany({ where: {...}, data: {...} });   // → { count: 1 }
```

**`upsert` — có thì sửa, không có thì tạo, chỉ một lần đi database:**

```js
await prisma.user.upsert({
  where: { email: 'moi@example.com' },
  update: { ten: 'Tên đã đổi' },
  create: { email: 'moi@example.com', ten: 'Người Mới' },
});
```

> Hỏi lớp: *"Sao không tự viết `findUnique` rồi `if` để quyết định?"*
> → Vì giữa hai lệnh đó, một request khác có thể chèn bản ghi vào → lỗi trùng unique. `upsert` là **một** thao tác nguyên tử ở tầng database. Đây là ý niệm **race condition** — thứ frontend gần như không gặp.

### 2.4. Delete và Cascade

```js
const truoc = await prisma.todo.count();
await prisma.user.delete({ where: { id: huy.id } });
const sau = await prisma.todo.count();
// → 4 → 3 : todo bị xoá theo nhờ onDelete: Cascade
```

Đây là kiểm chứng thực tế cho `onDelete: Cascade` đã khai ở buổi 12.

---

## 3. Mã lỗi Prisma → HTTP status (75–100′)

Prisma ném lỗi có `code`. Ánh xạ sang HTTP là việc của tầng API:

| Mã | Nghĩa | HTTP nên trả |
|---|---|---|
| `P2002` | vi phạm ràng buộc unique | `409 Conflict` |
| `P2025` | không tìm thấy bản ghi | `404 Not Found` |
| `P2003` | vi phạm khoá ngoại | `400 Bad Request` |
| `P2000` | giá trị quá dài cho cột | `400 Bad Request` |

### Bẫy phiên bản — phải dạy

> **📝 Ghi chú giảng viên**
> Hầu hết tài liệu trên mạng bảo lấy tên cột bị trùng ở `err.meta.target`. Với **Prisma 7 + driver adapter**, chỗ đó là `undefined`.

Kết quả chạy thật:

```
mã lỗi: P2002
err.meta.target       = undefined      ← tài liệu cũ nói ở đây
chỗ THẬT (Prisma 7)   = [ 'email' ]
```

Đường dẫn thật:

```js
err.meta?.driverAdapterError?.cause?.constraint?.fields   // → ['email']
```

> **Bài học lớn hơn cả Prisma:** khi bắt lỗi của một thư viện, đừng tin tài liệu — **in `err` ra và tự xem cấu trúc thật**. Phiên bản đổi thì cấu trúc lỗi đổi theo, và đó là loại bug chỉ nổ ở production.

---

## 4. Trọng tâm: vấn đề N+1 (100–150′)

[`src/02-relations-va-n1.js`](../../code/buoi-12-prisma-postgres/src/02-relations-va-n1.js)

### 4.1. Cách làm cho vấn đề trở nên nhìn thấy được

File này **đếm số câu truy vấn thật sự** gửi xuống database:

```js
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: [{ emit: 'event', level: 'query' }],
});

let demQuery = 0;
prisma.$on('query', () => demQuery++);
```

> Nhờ vậy N+1 không còn là lý thuyết mà là **một con số trên màn hình**.

### 4.2. Kết quả đo thật

Với 30 user × 5 todo:

```
❌ CÁCH SAI — N+1 query
  vòng lặp gọi findMany cho từng user       31 query     59ms

✅ CÁCH ĐÚNG — include
  Prisma tự gộp                              2 query     11ms

✅ TỐI ƯU HƠN — select chỉ cột cần
  ít dữ liệu qua mạng hơn                    2 query      5ms

  → N+1 tốn 31 query, include chỉ tốn 2 query. Gấp 16 lần.
     Với 1000 user thì là 1001 so với 2.
```

Code sai — trông **hoàn toàn hợp lý**:

```js
const ds = await prisma.user.findMany();          // 1 query
for (const u of ds) {
  await prisma.todo.findMany({ where: { userId: u.id } });   // +1 query MỖI user
}
```

Code đúng:

```js
await prisma.user.findMany({ include: { todos: true } });    // 2 query
```

> **📝 Ghi chú giảng viên — dựng kịch**
> Chiếu đoạn code sai lên **trước**, hỏi *"đoạn này có vấn đề gì không?"*. Đa số sẽ nói không — nó đọc rất tự nhiên.
>
> Rồi chạy và chỉ vào con số **31**.
>
> Sau đó hỏi: *"Nếu là 1000 user thì sao?"* → 1001 query. *"Còn 10.000?"* → 10.001. **Vấn đề không xuất hiện lúc dev với 10 bản ghi. Nó xuất hiện sau sáu tháng, khi dữ liệu lớn lên.**

### 4.3. Vì sao 2 query chứ không phải 1?

Prisma chạy:

```sql
SELECT * FROM users;
SELECT * FROM todos WHERE userId IN (1, 2, 3, ..., 30);
```

rồi ghép trong bộ nhớ. Không dùng `JOIN` — vì `JOIN` sẽ nhân bản dữ liệu user cho mỗi todo, tốn băng thông hơn.

> Cho học viên bật `PRISMA_LOG=query` để tự thấy hai câu SQL này.

### 4.4. Nhận diện N+1 trong công việc thật

Ba dấu hiệu:

1. **`await` trong vòng lặp** đối với thao tác database — dấu hiệu rõ nhất
2. API chậm dần theo thời gian dù code không đổi
3. Log query dài dằng dặc các câu gần giống nhau

> Nối lại buổi 07: đây chính là cái bẫy *"tuần tự thay vì gộp"*. Cùng một sai lầm tư duy, lần này trả giá bằng database.

---

## 5. Truy vấn nâng cao (150–175′)

### `_count` — đếm bản ghi con mà không tải chúng về

```js
await prisma.user.findMany({
  select: { ten: true, _count: { select: { todos: true } } },
});
```

```
┌────────────────┬────────┐
│ ten            │ soTodo │
├────────────────┼────────┤
│ 'Người dùng 0' │ 5      │
└────────────────┴────────┘
```

> Nếu dùng `include: { todos: true }` rồi `.length`, ta kéo **toàn bộ** todo về chỉ để đếm. Với user có 10.000 todo thì đó là thảm hoạ.

### `some` / `every` / `none` — lọc theo điều kiện của bản ghi con

```js
// user còn ít nhất MỘT việc ưu tiên cao chưa xong
await prisma.user.count({ where: { todos: { some: { uuTien: 'cao', xong: false } } } });

// user đã xong TẤT CẢ việc
await prisma.user.count({ where: { todos: { every: { xong: true } } } });

// user KHÔNG có việc ưu tiên cao nào
await prisma.user.count({ where: { todos: { none: { uuTien: 'cao' } } } });
```

Kết quả thật:

```
user còn việc ưu tiên CAO chưa xong : 12
user đã xong HẾT mọi việc          : 0
user KHÔNG có việc ưu tiên cao nào : 0
```

> **Bẫy `every`:** user **không có todo nào** cũng thoả `every` (mệnh đề đúng rỗng — vacuous truth). Cho học viên tạo một user không todo rồi chạy lại để tự thấy.

### `groupBy`

```js
await prisma.todo.groupBy({ by: ['uuTien'], _count: { _all: true } });
// → [{ uuTien: 'trung', _count: { _all: 2 } }, ...]
```

Việc gộp nhóm nên để **database** làm, đừng kéo hết về rồi `reduce` trong JavaScript.

---

## 6. Bài tập về nhà

1. **Tự tạo N+1 rồi sửa.** Viết đoạn code lấy mỗi todo kèm tên chủ nhân theo kiểu N+1, đếm số query, rồi sửa bằng `include`. Lập bảng so sánh.

2. **Đọc SQL.** Chạy `PRISMA_LOG=query node src/02-relations-va-n1.js`, chép lại **hai** câu SQL mà `include` sinh ra, giải thích mệnh đề `IN (...)`.

3. **Phân trang cursor.** Đọc tài liệu về `cursor` trong Prisma, viết hàm phân trang cursor-based cho `findMany`. So sánh với `skip`/`take`: vì sao cursor tốt hơn khi dữ liệu lớn? (Chuẩn bị cho buổi 20.)

4. **Bẫy `every`.** Tạo một user không có todo nào, chạy lại phép đếm `every: { xong: true }`. Giải thích kết quả.

5. **Ánh xạ lỗi.** Viết hàm `prismaErrorToHttp(err)` chuyển `P2002` → 409, `P2025` → 404, `P2003` → 400, còn lại → 500. Nhớ lấy tên cột theo **đường dẫn đúng của Prisma 7**.

6. **Nâng cao — `$transaction`.** Viết đoạn code tạo user và 3 todo trong một transaction; cố tình cho todo thứ hai lỗi và kiểm chứng user **không** được tạo. (Chuẩn bị cho buổi 19.)

---

## 7. Checklist kết thúc buổi

- [ ] Vì sao chỉ được tạo một instance `PrismaClient`?
- [ ] `select` và `include` khác nhau thế nào?
- [ ] `upsert` giải quyết vấn đề gì mà `findUnique` + `if` không giải quyết được?
- [ ] `P2002` và `P2025` nên trả HTTP status nào?
- [ ] Với Prisma 7, lấy tên cột bị trùng unique ở đâu?
- [ ] N+1 là gì? Ba dấu hiệu nhận biết?
- [ ] Vì sao `include` tốn 2 query chứ không phải 1?
- [ ] Vì sao dùng `_count` thay vì `include` rồi `.length`?

---

**Buổi trước:** [Buổi 12 — PostgreSQL & Prisma: schema và migration](./buoi-12-prisma-postgres.md)
**Buổi tiếp theo:** Buổi 14 — MongoDB & Mongoose: tư duy NoSQL
