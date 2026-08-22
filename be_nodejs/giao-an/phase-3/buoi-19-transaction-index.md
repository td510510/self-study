# Buổi 19 — Transaction, tranh chấp & Index

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Hiểu vì sao một API "chạy đúng" ở local có thể bán 10 món hàng khi kho chỉ có 5 — và vì sao API nhanh ở máy dev lại sập ở production.
> **Code thực hành:** [`code/project-02-ecommerce/`](../../code/project-02-ecommerce/)

Đây là buổi mở màn Phase 3 — phần phân biệt *"biết CRUD"* với *"dev backend thực thụ"*.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Chữa bài tập buổi 18 — thu bài đặt hàng "không transaction" |
| 20–75′ | **Tự tạo ra tồn kho âm** |
| 75–125′ | Ba phiên bản: ngây thơ → transaction → khoá dòng |
| 125–165′ | **Index: đo bằng EXPLAIN ANALYZE** |
| 165–180′ | Bài tập & tổng kết |

---

## 1. Mở đầu — thu hoạch cái bẫy đã gieo (0–20′)

Buổi 18 giao bài: *"Viết chức năng đặt hàng. **Cố tình chưa dùng transaction.**"*

Hôm nay thu bài. Hỏi cả lớp:

> *"Code của bạn có chạy đúng không?"*

Ai cũng gật — vì ai cũng test bằng cách bấm "Đặt hàng" **một lần**.

> *"Vậy nếu mười người cùng bấm trong một giây thì sao?"*

Khoảng lặng đó là chỗ để mở màn buổi học.

---

## 2. Trọng tâm: tự tạo ra tồn kho âm (20–75′)

[`src/demo-tranh-chap.js`](../../code/project-02-ecommerce/src/demo-tranh-chap.js)

```bash
node --env-file=.env src/demo-tranh-chap.js
```

Kịch bản: **10 người cùng lúc** mua sản phẩm còn **5 cái**.

### 2.1. Kết quả thật

```
  phiên bản                        | bán được | tồn kho | kết quả
  ---------------------------------|----------|---------|--------
  1. không transaction             |       10 |      -5 | 🚨 SAI
  2. transaction, không khoá       |       10 |      -5 | 🚨 SAI
  3. transaction + FOR UPDATE      |        5 |       0 | ✅
```

> **📝 Ghi chú giảng viên — dựng kịch**
> Chiếu **hàng 1 và hàng 2** trước, che hàng 3.
>
> Hàng 1 thì lớp đoán được. **Hàng 2 mới là cú sốc** — vì phản xạ đầu tiên của mọi người là *"bọc transaction vào là xong"*.
>
> Để lớp tự đề xuất cách sửa trước khi mở hàng 3.

### 2.2. Vì sao phiên bản 1 sai

```js
// BƯỚC 1: ĐỌC tồn kho và kiểm tra
for (const item of gio.items) {
  if (item.sanPham.tonKho < item.soLuong) throw loi.hetHang(...);
}

// BƯỚC 2: TRỪ kho
// ⚠️ Giữa BƯỚC 1 và BƯỚC 2, request khác có thể đã trừ mất rồi.
await prisma.sanPham.update({ data: { tonKho: { decrement: item.soLuong } } });
```

Vẽ dòng thời gian lên bảng:

```
thời gian →

Người A:  đọc tonKho=1 ──── kiểm tra OK ──── trừ 1 → tonKho=0
Người B:      đọc tonKho=1 ──── kiểm tra OK ──── trừ 1 → tonKho=-1
                  ↑
          B đọc TRƯỚC KHI A kịp trừ → cả hai đều thấy "còn 1"
```

> Đây là **race condition** — lớp bug mà frontend gần như không bao giờ gặp, vì frontend chỉ phục vụ **một** người dùng.

### 2.3. Vì sao phiên bản 2 vẫn sai

```js
return prisma.$transaction(async (tx) => {
  const sp = await tx.sanPham.findUnique({ where: { id } });   // ← ĐỌC THƯỜNG
  if (sp.tonKho < item.soLuong) throw loi.hetHang(...);
  await tx.sanPham.update({ data: { tonKho: { decrement: ... } } });
});
```

> **Transaction đảm bảo TÍNH NGUYÊN TỬ** — *"hoặc làm hết, hoặc không làm gì"*.
> Nó **KHÔNG** ngăn hai transaction cùng đọc một giá trị cũ.

Ở mức cô lập mặc định của PostgreSQL (`READ COMMITTED`), hai transaction vẫn đọc được cùng con số tồn kho. Chúng chỉ không thấy dữ liệu **chưa commit** của nhau — nhưng cả hai đều đọc trước khi bên kia commit.

**Bốn mức cô lập** — nhắc để học viên biết đường:

| Mức | Ngăn được gì |
|---|---|
| `READ UNCOMMITTED` | (Postgres không hỗ trợ thật) |
| `READ COMMITTED` | đọc dữ liệu chưa commit — **mặc định** |
| `REPEATABLE READ` | đọc lại ra kết quả khác trong cùng transaction |
| `SERIALIZABLE` | mọi bất thường — nhưng chậm và hay phải thử lại |

### 2.4. Phiên bản đúng — hai kỹ thuật, dùng cả hai

```js
// (a) KHOÁ DÒNG BI QUAN
const [sp] = await tx.$queryRaw`
  SELECT id, ten, "tonKho" FROM san_phams
  WHERE id = ${item.sanPhamId}
  FOR UPDATE          -- ← transaction khác PHẢI CHỜ
`;
if (sp.tonKho < item.soLuong) throw loi.hetHang(sp.ten, sp.tonKho);

// (b) ĐIỀU KIỆN NẰM TRONG CHÍNH CÂU UPDATE
const kq = await tx.sanPham.updateMany({
  where: { id: item.sanPhamId, tonKho: { gte: item.soLuong } },   // ← điều kiện
  data: { tonKho: { decrement: item.soLuong } },
});
if (kq.count === 0) throw loi.hetHang(item.sanPham.ten, 0);       // ← 0 dòng = không đủ
```

| Kỹ thuật | Vai trò |
|---|---|
| `FOR UPDATE` | Transaction thứ hai **chờ** tới khi cái đầu commit, rồi đọc số **đã cập nhật** |
| Điều kiện trong `WHERE` | **Lưới an toàn cuối cùng** — database làm trọng tài, không phụ thuộc code đúng |

### 2.5. Chi tiết dễ bỏ sót — thứ tự khoá

```js
// Sắp xếp theo id để MỌI transaction khoá theo CÙNG MỘT THỨ TỰ.
// Không có bước này, hai transaction khoá chéo nhau → DEADLOCK.
const items = [...gio.items].sort((a, b) => a.sanPhamId - b.sanPhamId);
```

Vẽ tình huống deadlock:

```
Transaction A: khoá sản phẩm 1 ─── chờ sản phẩm 2 ───┐
Transaction B: khoá sản phẩm 2 ─── chờ sản phẩm 1 ───┘
                                    → cả hai chờ nhau VĨNH VIỄN
```

> Postgres phát hiện deadlock và giết một transaction — nhưng người dùng đó nhận lỗi vô cớ. **Luôn khoá theo thứ tự nhất quán.**

Và `timeout`:

```js
{ timeout: 10_000, maxWait: 5_000 }
```

> Transaction đang **giữ khoá**. Một transaction treo sẽ chặn **mọi người** mua sản phẩm đó.

---

## 3. Test cho tranh chấp (75–95′)

[`test/tranh-chap.test.js`](../../code/project-02-ecommerce/test/tranh-chap.test.js)

Loại test này **ít khi được viết**, nhưng canh giữ lớp bug đắt giá nhất:

```js
/** Bắn tất cả cùng lúc — đây là chìa khoá tái hiện tranh chấp. */
const kq = await Promise.allSettled(users.map((u) => datHang(u.id, DIA_CHI)));
```

Và test **cố tình khẳng định rằng hai phiên bản kia SAI**:

```js
test('CÓ transaction nhưng KHÔNG khoá → VẪN sai', async () => {
  assert.ok(r.thanhCong > TON_KHO, 'transaction một mình không đủ');
  assert.ok(r.tonKho < 0, 'tồn kho vẫn âm');
});
```

> Test này giữ cho bài học không bị quên: nếu ai đó "sửa" phiên bản 2 cho đúng, test sẽ fail và buộc họ đọc lại vì sao nó tồn tại.

Test rollback cũng quan trọng không kém:

```js
test('rollback: đơn thất bại KHÔNG để lại rác', async () => {
  // 5 người thất bại — giỏ hàng của họ phải CÒN NGUYÊN
  assert.equal(soGioConHang, SO_NGUOI - TON_KHO);
  // Và không có DonHangItem mồ côi
  assert.equal(soItem, TON_KHO);
});
```

### ⚠️ Bẫy: test chạy song song giẫm lên nhau

> **📝 Ghi chú giảng viên — lỗi gặp thật khi soạn bài**
>
> Chạy `node --test` lần đầu:
> ```
> # tests 27
> # pass 8
> # cancelled 19
> ```
>
> Nguyên nhân: Node chạy các **file test song song**. Hai file cùng gọi `deleteMany()` trên **cùng một database** → xoá dữ liệu của nhau giữa chừng.
>
> Cách sửa:
> ```json
> "test": "node --env-file=.env.test --test --test-concurrency=1"
> ```
>
> ```
> # tests 27   # pass 27   # fail 0
> ```
>
> **Bài học:** test đụng database dùng chung thì **phải chạy tuần tự**, hoặc mỗi file một schema riêng. Đây là vấn đề mọi dự án đều gặp khi bộ test lớn dần.

---

## 4. Index — đo bằng số liệu (125–165′)

[`src/demo-index.js`](../../code/project-02-ecommerce/src/demo-index.js)

```bash
node --env-file=.env src/demo-index.js     # tạo 200.000 dòng, mất ~30–60s
```

### 4.1. `EXPLAIN ANALYZE` — đọc sự thật, không phỏng đoán

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM don_hangs WHERE "trangThai" = 'daGiao';
```

Hai từ khoá cần tìm trong kết quả:

| Xuất hiện | Nghĩa |
|---|---|
| `Index Scan` | ✅ dùng index |
| `Seq Scan` | 🐌 quét **toàn bộ** bảng |

### 4.2. Kết quả thật trên 200.000 dòng

```
═══ Cột CÓ index sẵn ═══
  WHERE "trangThai" = 'daGiao'              1.279 ms   Index Scan ✅
  WHERE "userId" = 1                        0.043 ms   Index Scan ✅
  WHERE "maDon" = ... (cột @unique)         0.034 ms   Index Scan ✅

═══ Cột KHÔNG có index ═══
  WHERE "diaChiGiao" = ... (khớp 1 dòng)    9.572 ms   Seq Scan 🐌
  ORDER BY "tongTienVND" DESC LIMIT 20     14.110 ms   Seq Scan 🐌

═══ Sau khi thêm index ═══
  WHERE "diaChiGiao" = ... (khớp 1 dòng)    0.031 ms   Index Scan ✅  → 308× nhanh hơn
  ORDER BY "tongTienVND" DESC LIMIT 20      0.074 ms   Index Scan ✅  → 190× nhanh hơn
```

> Nhân lên quy mô thật: 200.000 dòng đã chênh 300 lần. Với 20 triệu dòng thì `Seq Scan` mất **hàng giây** — API timeout.

### 4.3. Điểm dạy tinh tế: Postgres cố tình **không** dùng index

```
═══ Khi Postgres CỐ TÌNH KHÔNG dùng index ═══
  WHERE "tongTienVND" > 4000000 LIMIT 100    0.07 ms   Seq Scan 🐌
```

> Có index trên `tongTienVND`, nhưng Postgres **chọn không dùng**. Đây **không phải lỗi**.
>
> Truy vấn này khớp ~20% số dòng và có `LIMIT 100`. Quét tuần tự tìm đủ 100 dòng còn nhanh hơn đi qua index rồi **nhảy ngược lại bảng** để lấy dữ liệu.
>
> **Index chỉ có lợi khi truy vấn CHỌN LỌC CAO** (khớp ít dòng). Bộ tối ưu hoá của Postgres tính toán điều này và quyết định — nó đang làm đúng việc của nó.

### 4.4. Cái giá của index

```
Ghi 5.000 dòng KHI CÓ index thêm  : 817 ms
Ghi 5.000 dòng KHI KHÔNG có       : 652 ms      → chậm hơn ~25%
```

Mỗi lần `INSERT`/`UPDATE`/`DELETE`, database phải cập nhật **mọi** index của bảng. Và index chiếm thêm dung lượng đĩa.

> **Quy tắc:**
> - Index cột hay dùng trong `WHERE`, `ORDER BY`, `JOIN`
> - **Không index bừa** — mỗi index là cái giá phải trả ở mọi lần ghi
> - Luôn đo bằng `EXPLAIN ANALYZE`, đừng đoán
> - `Seq Scan` trên bảng lớn **thường** là dấu hiệu thiếu index — nhưng không phải luôn luôn

### 4.5. Index tổng hợp (composite)

```prisma
@@index([userId, trangThai])
```

Index này dùng được cho:
- `WHERE userId = ?`  ✅
- `WHERE userId = ? AND trangThai = ?`  ✅
- `WHERE trangThai = ?`  ❌ **không dùng được**

> Nguyên tắc **tiền tố trái**: index tổng hợp chỉ dùng được khi truy vấn bắt đầu từ cột đầu tiên. Giống như danh bạ sắp theo *(họ, tên)* — tra theo họ thì nhanh, tra theo tên thì phải lật cả quyển.

---

## 5. Bài tập về nhà

1. **Tự tái hiện.** Chạy `demo-tranh-chap.js` với `SO_NGUOI_MUA = 50`, `TON_KHO_BAN_DAU = 3`. Lập bảng kết quả ba phiên bản. Con số tồn kho âm có tệ hơn không?

2. **Gây deadlock.** Bỏ dòng `.sort((a, b) => a.sanPhamId - b.sanPhamId)`, tạo hai giỏ hàng chứa **cùng hai sản phẩm nhưng thứ tự khác nhau**, đặt hàng đồng thời. Chụp lại lỗi deadlock của Postgres.

3. **Khoá lạc quan.** Thêm cột `version Int @default(0)` vào `SanPham`, cài đặt *optimistic locking*: đọc kèm version, update với `where: { id, version }`, `count === 0` thì thử lại. So sánh với `FOR UPDATE` — cái nào tốt hơn khi tranh chấp **hiếm**? Khi tranh chấp **nhiều**?

4. **Đo index của riêng bạn.** Viết truy vấn tìm đơn hàng theo `userId` **và** `trangThai`. Chạy `EXPLAIN ANALYZE` trước/sau khi thêm `@@index([userId, trangThai])`. Kiểm chứng nguyên tắc tiền tố trái.

5. **Tìm index thừa.** Dùng truy vấn hệ thống liệt kê index chưa từng được dùng:
   ```sql
   SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes
   WHERE idx_scan = 0 ORDER BY relname;
   ```
   Index nào trong Project 2 chưa từng được dùng? Có nên xoá không?

6. **Nâng cao — `SERIALIZABLE`.** Viết lại `datHangAnToan` dùng mức cô lập `Serializable` thay vì `FOR UPDATE`. Bạn sẽ phải xử lý lỗi `40001` (serialization failure) và **thử lại**. So sánh độ phức tạp và hiệu năng.

---

## 6. Checklist kết thúc buổi

- [ ] Race condition là gì? Vì sao frontend hiếm khi gặp?
- [ ] Vì sao bọc transaction **không đủ** để chống bán quá hàng?
- [ ] `FOR UPDATE` làm gì? Transaction thứ hai xảy ra chuyện gì?
- [ ] Vì sao vẫn cần điều kiện `tonKho >= soLuong` trong câu `UPDATE`?
- [ ] Deadlock xảy ra khi nào? Cách phòng?
- [ ] Vì sao transaction phải có `timeout`?
- [ ] `Index Scan` và `Seq Scan` khác nhau thế nào?
- [ ] Khi nào Postgres **cố tình không** dùng index dù có index?
- [ ] Index làm chậm thao tác nào? Bao nhiêu?
- [ ] Index `[userId, trangThai]` có dùng được cho `WHERE trangThai = ?` không?

---

**Buổi trước:** [Buổi 18 — Logging & khởi động Project 2](../phase-2/buoi-18-logging-project2.md)
**Buổi tiếp theo:** Buổi 20 — Connection pooling & tối ưu truy vấn
