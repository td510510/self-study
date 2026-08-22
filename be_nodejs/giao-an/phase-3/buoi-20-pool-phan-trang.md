# Buổi 20 — Connection pooling & tối ưu truy vấn

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Nhìn thấy tác động thật của cấu hình pool và cách phân trang — bằng số liệu, không phải cảm tính.
> **Code thực hành:** [`code/project-02-ecommerce/`](../../code/project-02-ecommerce/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 19 |
| 15–75′ | **Connection pool: đo bốn kịch bản** |
| 75–100′ | Khi pool cạn — và vì sao transaction dài nguy hiểm |
| 100–155′ | **Phân trang: offset vs cursor** |
| 155–175′ | Chống over-fetching |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Connection pool (15–75′)

[`src/demo-pool.js`](../../code/project-02-ecommerce/src/demo-pool.js)

```bash
node --env-file=.env src/demo-pool.js
```

### 1.1. Kích thước pool ảnh hưởng thế nào

60 truy vấn song song, mỗi truy vấn giữ kết nối 100ms:

```
  pool =  1 kết nối                    8650 ms
  pool =  5 kết nối                    1203 ms
  pool = 10 kết nối                     603 ms
  pool = 20 kết nối                     339 ms
```

> Với `pool = 1`, mọi truy vấn **xếp hàng** — 60 × 100ms ≈ 6 giây (thực tế 8.6s vì có chi phí quản lý).
> Với `pool = N`, chạy được N cái cùng lúc.

Hỏi lớp: *"Vậy cứ đặt pool thật lớn là xong?"* — dẫn sang phần 1.3.

### 1.2. Cái giá của việc mở kết nối mới

```
  ❌ Tạo client MỚI mỗi lần (20 lần) :    254 ms
  ✅ Dùng chung MỘT client (20 lần)  :     10 ms
  → chậm gấp 25 lần
```

Mỗi kết nối mới phải: **bắt tay TCP → xác thực → cấp phát bộ nhớ ở Postgres**. Pool giữ sẵn kết nối để tái sử dụng — đó là toàn bộ lý do nó tồn tại.

> **📝 Ghi chú giảng viên**
> Nối lại buổi 13: *"chỉ tạo MỘT `PrismaClient` cho cả ứng dụng"*. Hôm nay ta có **con số** cho lời khuyên đó.
>
> Lỗi thường gặp: viết `new PrismaClient()` ngay trong file route. File đó được import ở nhiều nơi → mỗi nơi một pool → hết kết nối.

### 1.3. Pool lớn hơn không phải lúc nào cũng nhanh hơn

```
  pool =  20 kết nối                    517 ms
  pool =  50 kết nối                    281 ms
  pool = 120 kết nối                   🚨 too many clients already  ← chạm trần max_connections
```

> Postgres mặc định chỉ cho tối đa **100 kết nối** (`max_connections`). Mỗi kết nối tốn RAM ở phía Postgres và **một tiến trình hệ điều hành**.
>
> Pool quá lớn thì: vượt `max_connections`, và Postgres bận chuyển đổi ngữ cảnh hơn là làm việc thật.

**Công thức tham khảo:**

```
pool_size = (số nhân CPU × 2) + số đĩa
```

Với hầu hết API: **10–20 là hợp lý**. Nhưng luôn **đo rồi mới chỉnh**.

### 1.4. Bài toán khi chạy nhiều bản sao

```
tổng kết nối = số bản sao × pool_size

4 bản sao × pool 20 = 80 kết nối     ← gần chạm trần 100 rồi
```

> Đây là lúc cần **PgBouncer** — một connection pooler đứng ngoài, gom kết nối từ nhiều bản sao ứng dụng thành ít kết nối thật tới Postgres. Chủ đề của buổi 44.

---

## 2. Khi pool cạn (75–100′)

```
  Pool có 2 kết nối, cả 2 đang bị transaction giữ 2 giây.
  Một truy vấn ĐƠN GIẢN (SELECT 1) phải chờ: 1655 ms
```

> **📝 Ghi chú giảng viên — điểm quan trọng nhất phần này**
>
> `SELECT 1` là truy vấn nhanh nhất có thể. Nó mất **1.6 giây** — không phải vì nó chậm, mà vì **không có kết nối nào rảnh**.
>
> Đây là lý do transaction dài nguy hiểm: nó không chỉ chậm cho người gọi nó, mà **làm tắc nghẽn mọi request khác**.

Nối lại buổi 19:

```js
{ timeout: 10_000, maxWait: 5_000 }
```

Và bổ sung nguyên tắc:

> **Trong transaction, KHÔNG BAO GIỜ gọi API bên ngoài.**
>
> ```js
> await prisma.$transaction(async (tx) => {
>   await tx.donHang.create({ ... });
>   await guiEmail(...);        // ❌ API bên thứ ba treo 30 giây
>   await tx.sanPham.update({ ... });
> });
> ```
>
> Nếu dịch vụ email chậm, transaction giữ khoá và giữ kết nối suốt 30 giây đó. Vài chục request như vậy là **cạn pool → toàn hệ thống đứng**.
>
> Cách đúng: đẩy việc gửi email ra **background job** (buổi 26).

---

## 3. Trọng tâm: phân trang offset vs cursor (100–155′)

[`src/demo-phan-trang.js`](../../code/project-02-ecommerce/src/demo-phan-trang.js)

```bash
node --env-file=.env src/demo-index.js        # tạo dữ liệu trước
node --env-file=.env src/demo-phan-trang.js
```

### 3.1. OFFSET — càng về sau càng chậm

```
  trang        offset  |  thời gian
  -------------------- | ----------
       1           0  |     1.54 ms
     100        1980  |     1.43 ms
    1000       19980  |     2.15 ms
    5000       99980  |     6.90 ms
   10000      199980  |    10.05 ms
```

> **Vì sao?** Database **không "nhảy thẳng"** tới dòng thứ 200.000. Nó phải **đọc và bỏ qua** lần lượt 199.980 dòng đầu tiên, chỉ để trả về 20 dòng cuối.
>
> Công sức tăng **tuyến tính** theo số trang.

Ví dụ đời thường: đếm từ trang 1 của một cuốn sách dày để tới trang 500, thay vì mở thẳng.

### 3.2. CURSOR — thời gian không đổi

```
  trang        offset  |  thời gian
  -------------------- | ----------
       1           0  |     0.99 ms
     100        1980  |     0.93 ms
    1000       19980  |     0.88 ms
    5000       99980  |     0.98 ms
   10000      199980  |     0.97 ms
```

> **Vì sao?** Cursor dịch thành:
> ```sql
> WHERE id > <cursor> ORDER BY id LIMIT 20
> ```
> Database dùng **index** để nhảy **thẳng** tới đúng vị trí. Không đọc thừa dòng nào.

```js
prisma.donHang.findMany({
  orderBy: { id: 'asc' },
  cursor: { id: cursorId },
  skip: 1,           // ← "bắt đầu SAU bản ghi này"
  take: 20,
});
```

### 3.3. Bẫy của OFFSET mà ít người biết

> Ngoài chuyện chậm, offset còn **cho kết quả SAI** khi dữ liệu thay đổi giữa các trang.

Vẽ lên bảng:

```
1. Người dùng xem trang 1 (bản ghi 1–20)
2. Có người XOÁ bản ghi số 5
3. Người dùng bấm "trang 2" → skip 20
4. Bản ghi thứ 21 (cũ) giờ đã dịch lên vị trí 20
   → NGƯỜI DÙNG KHÔNG BAO GIỜ THẤY NÓ
```

Ngược lại, nếu có bản ghi được **thêm** vào đầu danh sách, người dùng sẽ thấy **lặp lại** một bản ghi ở trang sau.

> Cursor không bị vấn đề này, vì nó neo vào một **bản ghi cụ thể**, không neo vào một **vị trí**.
>
> **📝 Ghi chú giảng viên:** hỏi lớp *"đã bao giờ cuộn Facebook và thấy cùng một bài hai lần chưa?"* — đó chính là hiện tượng này.

### 3.4. Bảng quyết định

| | OFFSET | CURSOR |
|---|---|---|
| Nhảy tới trang bất kỳ ("trang 47") | ✅ | ❌ |
| Hiển thị tổng số trang | ✅ | ❌ khó |
| Dữ liệu lớn | ❌ chậm dần | ✅ |
| Dữ liệu thay đổi liên tục | ❌ sót/lặp | ✅ |
| Cuộn vô hạn, "tải thêm" | ❌ | ✅ |
| API công khai | ❌ dễ bị quét sạch dữ liệu | ✅ |

```
OFFSET  1.54 ms → 10.05 ms   (chậm đi 6.5×)
CURSOR  0.99 ms →  0.97 ms   (không đổi)
```

> Facebook, Twitter, GitHub API đều dùng **cursor** cho feed. Trang quản trị nội bộ thì **offset** vẫn ổn — vì admin cần nhảy tới trang cụ thể, và dữ liệu ít hơn.

### 3.5. Còn `count()` thì sao?

```js
const [tong, duLieu] = await Promise.all([
  prisma.sanPham.count({ where }),
  prisma.sanPham.findMany({ where, skip, take }),
]);
```

> Nối lại buổi 07: hai truy vấn **độc lập** nên chạy **song song**, không `await` lần lượt.
>
> Nhưng chú ý: `count()` trên bảng lớn cũng phải quét. Với hàng triệu dòng, nhiều hệ thống bỏ hẳn tổng số trang, hoặc dùng số **ước lượng** từ `pg_class.reltuples`.

---

## 4. Chống over-fetching (155–175′)

Ba mức lãng phí, từ nặng tới nhẹ:

```js
// ❌ Lấy TẤT CẢ cột + TẤT CẢ quan hệ
await prisma.donHang.findMany({ include: { items: true, user: true } });

// ⚠️ Lấy tất cả cột của bảng chính
await prisma.donHang.findMany();

// ✅ Chỉ lấy đúng thứ cần
await prisma.donHang.findMany({
  select: { id: true, maDon: true, tongTienVND: true },
});
```

Và khi chỉ cần **đếm** bản ghi con — nhắc lại buổi 13:

```js
// ❌ kéo TOÀN BỘ items về rồi .length
include: { items: true }

// ✅ để database đếm
_count: { select: { items: true } }
```

> Với đơn hàng có 100 mặt hàng, cách đầu kéo về 100 dòng chỉ để lấy một con số.

**Danh sách kiểm tra khi API chậm:**

| Kiểm tra | Công cụ |
|---|---|
| Có N+1 không? | đếm query (`prisma.$on('query')`, buổi 13) |
| Có `Seq Scan` không? | `EXPLAIN ANALYZE` (buổi 19) |
| Có lấy thừa cột không? | đọc `select`/`include` |
| Pool có bị cạn không? | đo thời gian chờ kết nối |
| Có transaction dài không? | log thời gian transaction |
| Phân trang bằng offset sâu? | đo thời gian theo số trang |

---

## 5. Bài tập về nhà

1. **Tự tìm pool tối ưu.** Chạy `demo-pool.js` với `SO_TRUY_VAN = 200` và các pool `5, 10, 20, 40, 80`. Vẽ đồ thị thời gian theo kích thước pool. Điểm nào bắt đầu không cải thiện nữa?

2. **Chứng minh transaction dài gây tắc.** Viết endpoint có transaction `pg_sleep(5)`, gọi nó 3 lần đồng thời, rồi gọi `GET /health`. Đo thời gian `/health`. Giải thích.

3. **Cursor cho sản phẩm.** Thêm `?cursor=<id>` vào `GET /san-pham`, trả kèm `cursorTiepTheo` trong response. Viết test chứng minh không sót/lặp bản ghi khi có sản phẩm mới được thêm giữa hai lần gọi.

4. **Tái hiện lỗi sót bản ghi.** Dùng offset: lấy trang 1, xoá một bản ghi ở trang 1, lấy trang 2. Chứng minh có bản ghi **không bao giờ xuất hiện**. Rồi làm lại bằng cursor và chứng minh không sót.

5. **Đo over-fetching.** So sánh thời gian và **kích thước response** (bytes) giữa `include: { items: true }` và `_count` trên đơn hàng có nhiều mặt hàng.

6. **Nâng cao — PgBouncer.** Thêm PgBouncer vào `docker-compose.yml`, cho ứng dụng kết nối qua nó. Chạy `demo-pool.js` với `pool = 120` — giờ có còn lỗi `too many clients` không? Giải thích cách PgBouncer giải quyết.

---

## 6. Checklist kết thúc buổi

- [ ] Connection pool giải quyết vấn đề gì? Mở kết nối mới tốn những bước nào?
- [ ] Pool quá nhỏ gây hiện tượng gì? Quá lớn thì sao?
- [ ] `max_connections` mặc định của Postgres là bao nhiêu?
- [ ] Vì sao chạy 4 bản sao server × pool 20 là nguy hiểm?
- [ ] Vì sao transaction dài làm chậm **cả những request không liên quan**?
- [ ] Vì sao không được gọi API bên ngoài trong transaction?
- [ ] `OFFSET 199980` khiến database làm gì?
- [ ] Cursor dịch thành câu SQL như thế nào?
- [ ] Ngoài chuyện chậm, offset còn sai ở điểm nào?
- [ ] Khi nào vẫn nên dùng offset?

---

**Buổi trước:** [Buổi 19 — Transaction, tranh chấp & Index](./buoi-19-transaction-index.md)
**Buổi tiếp theo:** Buổi 21 — Redis: cache-aside & session store
