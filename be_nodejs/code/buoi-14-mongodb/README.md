# Buổi 14 — MongoDB & Mongoose

Giáo án: [`giao-an/phase-2/buoi-14-mongodb-mongoose.md`](../../giao-an/phase-2/buoi-14-mongodb-mongoose.md)

```bash
docker compose up -d          # MongoDB :27018
cp .env.example .env
npm install

node --env-file=.env src/01-nhung-vs-tham-chieu.js
node --env-file=.env src/02-cai-bay-nosql.js

docker compose down           # hoặc down -v để xoá dữ liệu
```

> ⚠️ `authSource=admin` trong chuỗi kết nối là **bắt buộc** khi dùng tài khoản root. Thiếu nó → `Authentication failed`.

## Mục tiêu: so sánh, không thay thế

Buổi này không nhằm dạy MongoDB thành thạo, mà để **cảm nhận khác biệt tư duy** và ra quyết định có cơ sở.

## Đối chiếu Mongoose ↔ Prisma

| Mongoose | Prisma |
|---|---|
| `ObjectId + ref` | `userId Int @relation` |
| `.populate()` | `include` — cùng tốn 2 lần đọc |
| `{ timestamps: true }` | `@default(now())` + `@updatedAt` |
| `index: true` | `@@index([...])` |

## Khác biệt lớn nhất: không có khoá ngoại thật

```
Tạo todo trỏ tới user KHÔNG TỒN TẠI  → ✅ THÀNH CÔNG (Postgres: lỗi P2003)
Xoá user → todo còn lại: 2            → KHÔNG tự xoá (Postgres: Cascade xoá sạch)
```

> **Với MongoDB, toàn vẹn dữ liệu là trách nhiệm của CODE, không phải database.**

## Ba cái bẫy — đo thật

**1. Nhân bản dữ liệu → sửa sót**

```
Bài 1 → mai@moi.com
Bài 2 → mai@cu.com     ← sót
Bài 3 → mai@cu.com     ← sót
```

Cùng một người, ba email khác nhau. Postgres không thể xảy ra vì email chỉ nằm ở một chỗ.

**2. Mảng nhúng phình to**

```
2500 bình luận → ~213 KB
5000 bình luận → ~428 KB
```

Giới hạn 16 MB/document → bài viral sẽ không lưu thêm được. Và mỗi lần đọc bài là kéo về toàn bộ bình luận.

**3. Schema Mongoose không nằm trong database**

```js
// Qua Mongoose → bị chặn
await SanPham.create({ ten: 'Áo', gia: -100 });   // ✅ chặn

// Ghi thẳng bằng driver → lọt
await db.collection('sanphams').insertOne({ ten: 'Quần', gia: -999, mauSac: 'xanh' });
```

## Bảng quyết định

| | PostgreSQL | MongoDB |
|---|---|---|
| Hình dạng dữ liệu | ổn định | thay đổi liên tục |
| Toàn vẹn dữ liệu | **bắt buộc** | chấp nhận sai lệch nhỏ |
| Quan hệ | nhiều, phức tạp | ít |
| Ví dụ | e-commerce, ngân hàng | log, sự kiện, CMS |

> **Nếu chưa chắc, chọn PostgreSQL.** Postgres có `JSONB` cho phần cần linh hoạt, mà vẫn giữ ràng buộc cho phần còn lại. Chuyển từ có ràng buộc sang không ràng buộc thì dễ; ngược lại rất khó vì dữ liệu đã bẩn sẵn.
