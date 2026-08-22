# Buổi 14 — MongoDB & Mongoose: tư duy NoSQL

> **Phase 2** · Express.js
> **Mục tiêu:** So sánh trực diện tư duy document với tư duy quan hệ vừa học, để biết **khi nào chọn loại nào** — chứ không phải để thay thế Postgres.
> **Code thực hành:** [`code/buoi-14-mongodb/`](../../code/buoi-14-mongodb/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 13 |
| 15–40′ | Dựng MongoDB, Mongoose cơ bản |
| 40–90′ | **Nhúng vs Tham chiếu — quyết định thiết kế cốt lõi** |
| 90–145′ | **Ba cái bẫy khi dùng NoSQL sai chỗ** |
| 145–170′ | Bảng quyết định: khi nào SQL, khi nào NoSQL |
| 170–180′ | Bài tập & tổng kết |

---

## 1. Mở đầu — đặt lại câu hỏi cho đúng (15–25′)

Câu hỏi sai mà học viên hay mang tới lớp: *"MongoDB hay Postgres tốt hơn?"*

Câu hỏi đúng: **"Dữ liệu của tôi có hình dạng gì, và nó được đọc/ghi theo kiểu nào?"**

> **📝 Ghi chú giảng viên**
> Buổi này **không** nhằm dạy MongoDB cho thành thạo. Mục tiêu là để học viên **cảm nhận được khác biệt tư duy**, và ra được quyết định có cơ sở. Ta chỉ có một buổi — đủ để biết đường, không đủ để thành chuyên gia.
>
> Cảnh báo trước với lớp: rất nhiều dự án chọn MongoDB vì *"nghe hiện đại"* rồi trả giá suốt vòng đời. Buổi này chính là để tránh điều đó.

### Cài đặt

[`docker-compose.yml`](../../code/buoi-14-mongodb/docker-compose.yml) — cổng `27018` để không đụng MongoDB có sẵn.

```
MONGO_URL="mongodb://hocbe:matkhau_hoc_tap@localhost:27018/todo_db?authSource=admin"
```

> **⚠️ `authSource=admin` là bắt buộc** khi dùng tài khoản root. Thiếu nó → `Authentication failed`. Đây là lỗi số một của người mới dùng MongoDB.

---

## 2. Nhúng vs Tham chiếu (40–90′)

[`src/01-nhung-vs-tham-chieu.js`](../../code/buoi-14-mongodb/src/01-nhung-vs-tham-chieu.js)

Đây là **quyết định thiết kế quan trọng nhất** khi dùng MongoDB. Ở Postgres bạn không có lựa chọn này — mọi thứ đều phải tách bảng.

### 2.1. Nhúng (embed)

```js
const userNhungSchema = new mongoose.Schema({
  email: String,
  ten: String,
  todos: [                      // ← mảng con NẰM TRONG document user
    { tieuDe: String, xong: Boolean, uuTien: String },
  ],
});
```

Kết quả — **một** document chứa tất cả:

```json
{
  "email": "mai@example.com",
  "ten": "Mai Anh",
  "todos": [
    { "tieuDe": "Học MongoDB", "uuTien": "cao", "xong": false },
    { "tieuDe": "So sánh với Postgres", "uuTien": "trung", "xong": false }
  ]
}
```

> Lấy user kèm todo tốn **1 lần đọc**, không cần join. Đây là ưu điểm thật và lớn của MongoDB.
>
> Ở Postgres, việc này bất khả thi — phải hai bảng và một `JOIN`.

### 2.2. Tham chiếu (reference)

```js
const todoSchema = new mongoose.Schema({
  tieuDe: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });
```

```js
await Todo.find({ user: huy._id }).populate('user', 'ten email');
```

Bảng đối chiếu với Prisma:

| Mongoose | Prisma | Ghi chú |
|---|---|---|
| `ObjectId + ref` | `userId Int @relation` | khoá ngoại |
| `.populate()` | `include` | cũng tốn **2 lần đọc** như nhau |
| `{ timestamps: true }` | `@default(now())` + `@updatedAt` | |
| `index: true` | `@@index([...])` | |

> Hỏi lớp: *"`populate()` có bị N+1 không?"*
> → **Có.** Gọi `populate()` trong vòng lặp thì y hệt bài học buổi 13. Vấn đề N+1 không thuộc về Prisma hay Mongoose — nó thuộc về **cách bạn viết code**.

### 2.3. Khác biệt lớn nhất: không có khoá ngoại thật

> **📝 Ghi chú giảng viên — phần gây sốc nhất buổi học**

Chạy phần cuối của file demo:

```
=== ⚠️ KHÔNG CÓ RÀNG BUỘC KHOÁ NGOẠI ===
Tạo todo trỏ tới user không tồn tại → ObjectId('6a88...') ✅ THÀNH CÔNG
   Postgres sẽ TỪ CHỐI việc này (lỗi P2003 khoá ngoại).
   populate user không tồn tại → null ← null, không báo lỗi

Xoá user Quốc Huy → todo còn lại: 2 (KHÔNG tự xoá theo)
```

Hai điều xảy ra mà Postgres **không cho phép**:

1. Tạo được bản ghi trỏ tới một `user` **không tồn tại** — không lỗi gì cả
2. Xoá user, todo của họ **vẫn còn** — không có `Cascade`

> **Kết luận phải viết lên bảng:**
> **Với MongoDB, toàn vẹn dữ liệu là trách nhiệm của CODE, không phải của database.**
>
> Nghĩa là: mỗi lần xoá, bạn phải nhớ xoá các bản ghi liên quan. Quên một chỗ là có dữ liệu mồ côi — và nó sẽ tích tụ âm thầm hàng tháng trời.
>
> Postgres nhắc bạn bằng cách **từ chối**. MongoDB im lặng làm theo.

---

## 3. Ba cái bẫy khi dùng NoSQL sai chỗ (90–145′)

[`src/02-cai-bay-nosql.js`](../../code/buoi-14-mongodb/src/02-cai-bay-nosql.js)

### Bẫy 1 — Nhân bản dữ liệu → bất thường khi cập nhật

Thiết kế "tiện": nhúng thông tin tác giả vào từng bài viết.

```js
{ tieuDe: 'Bài 1', tacGia: { ten: 'Mai Anh', email: 'mai@cu.com' } }
{ tieuDe: 'Bài 2', tacGia: { ten: 'Mai Anh', email: 'mai@cu.com' } }
{ tieuDe: 'Bài 3', tacGia: { ten: 'Mai Anh', email: 'mai@cu.com' } }
```

Mai Anh đổi email. Lập trình viên chỉ nhớ sửa một bài:

```
┌─────────┬───────────────┐
│ bai     │ email         │
├─────────┼───────────────┤
│ 'Bài 1' │ 'mai@moi.com' │
│ 'Bài 2' │ 'mai@cu.com'  │   ← sót
│ 'Bài 3' │ 'mai@cu.com'  │   ← sót
└─────────┴───────────────┘
```

> **Cùng một người, ba email khác nhau trong database.**
>
> Ở Postgres điều này **không thể xảy ra** — email chỉ nằm ở **một** chỗ (bảng `users`), mọi bài viết đều trỏ tới. Đây chính là ý nghĩa của **chuẩn hoá (normalization)**.
>
> Hỏi lớp: *"Làm sao phát hiện lỗi này?"* → Thường là **không phát hiện được**, cho tới khi khách hàng phàn nàn email không nhận được.

### Bẫy 2 — Mảng nhúng phình to không giới hạn

Bài viết có mảng `binhLuan` nhúng. Đo thật:

```
sau 2500 bình luận → document nặng ~213 KB
sau 5000 bình luận → ~428 KB
```

Ngoại suy: 100.000 bình luận ≈ **8.5 MB**. Giới hạn MongoDB là **16 MB một document** — bài viral sẽ **không lưu thêm được nữa**.

Và tệ hơn: **mỗi lần đọc bài viết là kéo về toàn bộ mảng bình luận**, kể cả khi chỉ cần hiển thị tiêu đề trong danh sách.

> **Quy tắc:** dữ liệu tăng **không giới hạn** thì phải **tách ra collection riêng**. Chỉ nhúng thứ có số lượng **bị chặn trên** (địa chỉ giao hàng, ảnh sản phẩm, cấu hình).

### Bẫy 3 — Schema của Mongoose không nằm trong database

```js
const sanPhamSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  gia: { type: Number, required: true, min: 0 },
});
```

Qua Mongoose thì bị chặn đúng:

```
Qua Mongoose, giá âm → bị chặn: Path `gia` (-100) is less than minimum allowed value (0).
```

Nhưng ghi thẳng bằng driver:

```js
await mongoose.connection.db.collection('sanphams').insertOne({
  ten: 'Quần', gia: -999, mauSac: 'xanh',
});
```

```
Ghi thẳng bằng driver → dữ liệu bẩn ĐÃ VÀO DATABASE:
   {"ten":"Quần","gia":-999,"mauSac":"xanh"}
```

> **Mongoose validate ở tầng ỨNG DỤNG.** Bất kỳ ai — script migration, đồng đội, công cụ quản trị — ghi thẳng vào database đều bỏ qua được.
>
> Postgres thì `NOT NULL` / `CHECK` / `FOREIGN KEY` nằm **trong** database. Không ai lách được, kể cả DBA gõ SQL tay.
>
> MongoDB 5+ **có** JSON Schema validation ở tầng database, nhưng phải **chủ động bật**; mặc định là không.

> **📝 Ghi chú giảng viên**
> Nối lại buổi 11: ta đã học *"validate ở biên"*. Bài này bổ sung một tầng nữa: **database cũng là một biên**. Validate ở ứng dụng là cần, nhưng ràng buộc ở database mới là thứ **không ai lách được**.

---

## 4. Bảng quyết định (145–170′)

| Tiêu chí | Chọn **PostgreSQL** | Chọn **MongoDB** |
|---|---|---|
| Hình dạng dữ liệu | ổn định, biết trước | thay đổi liên tục, mỗi bản ghi mỗi khác |
| Quan hệ | nhiều, phức tạp | ít, chủ yếu đọc theo cụm |
| Toàn vẹn dữ liệu | **bắt buộc** (tiền, đơn hàng, kho) | chấp nhận được sai lệch nhỏ |
| Transaction nhiều bảng | thường xuyên | hiếm |
| Truy vấn | join, gộp nhóm, báo cáo phức tạp | đọc theo khoá, ghi nhiều |
| Ví dụ hợp | e-commerce, ngân hàng, ERP, đặt chỗ | log, sự kiện, catalog thuộc tính động, CMS |

### Nguyên tắc thực dụng

> **Nếu chưa chắc, chọn PostgreSQL.**

Ba lý do:

1. Postgres có kiểu `JSONB` — làm được phần lớn việc "schema-less" khi cần, mà vẫn giữ được ràng buộc cho phần còn lại.
2. Chuyển từ dữ liệu có ràng buộc sang không ràng buộc thì **dễ**. Ngược lại thì **rất khó** — vì dữ liệu đã bẩn sẵn rồi.
3. Sai lầm phổ biến của người mới không phải "chọn nhầm database", mà là **dùng MongoDB như một Postgres tồi**: tạo nhiều collection, tham chiếu chằng chịt, rồi tự viết join bằng tay.

Câu hỏi chốt cho lớp:

> *"Dự án của bạn — nếu hai bản ghi mâu thuẫn nhau, hậu quả là gì?"*
>
> - Hiển thị sai một dòng log → MongoDB chấp nhận được
> - Trừ tiền hai lần / giao thiếu hàng → **bắt buộc** Postgres

---

## 5. Bài tập về nhà

1. **Thiết kế hai cách.** Với hệ thống blog (bài viết, tác giả, bình luận, thẻ), vẽ **cả hai** thiết kế: một cho Postgres, một cho MongoDB. Chỉ ra chỗ nào nhúng, chỗ nào tham chiếu, và giải thích từng lựa chọn.

2. **Tự tái hiện bẫy 1.** Viết đoạn code tạo dữ liệu nhân bản, cập nhật sót, rồi viết câu truy vấn **phát hiện** dữ liệu không nhất quán (tìm các bản ghi cùng tên tác giả nhưng khác email).

3. **Đo giới hạn 16MB.** Sửa bẫy 2 để chạy tới khi MongoDB thật sự từ chối. Chụp lại thông báo lỗi. (Gợi ý: bình luận dài hơn, hoặc dùng `$push` nhiều phần tử một lần.)

4. **Bật validation ở tầng database.** Tìm hiểu `db.createCollection` với `validator: { $jsonSchema: ... }`, áp dụng cho `sanphams`, rồi thử lại phép ghi thẳng của bẫy 3. Nó có bị chặn không?

5. **Xoá theo tầng bằng tay.** Viết hàm `xoaUser(id)` xoá user **và** mọi todo của họ, dùng transaction của MongoDB (`session.withTransaction`). So sánh với một dòng `onDelete: Cascade` của Postgres.

6. **Suy nghĩ.** Viết 200 chữ trả lời: *"Vì sao 'schema-less' vừa là ưu điểm vừa là nhược điểm?"* — có ví dụ cụ thể từ ba bẫy đã học.

---

## 6. Checklist kết thúc buổi

- [ ] Nhúng và tham chiếu khác nhau thế nào? Khi nào dùng cái nào?
- [ ] `populate()` tương đương gì bên Prisma? Có bị N+1 không?
- [ ] Điều gì xảy ra khi tạo todo trỏ tới user không tồn tại — ở MongoDB và ở Postgres?
- [ ] Xoá user ở MongoDB thì todo của họ ra sao?
- [ ] Vì sao dữ liệu nhân bản gây nguy hiểm?
- [ ] Giới hạn kích thước một document MongoDB là bao nhiêu?
- [ ] Schema của Mongoose nằm ở tầng nào? Ai lách được nó?
- [ ] Nếu chưa chắc chọn database nào thì nên chọn gì? Ba lý do?

---

**Buổi trước:** [Buổi 13 — Prisma CRUD & Relations](./buoi-13-prisma-crud-relations.md)
**Buổi tiếp theo:** Buổi 15 — Authentication: JWT & bcrypt
