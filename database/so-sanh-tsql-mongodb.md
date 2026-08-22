# Bảng tra nhanh: T-SQL ↔ MongoDB

Tài liệu một trang để học viên dán cạnh máy. Dùng từ buổi 9 trở đi.

---

## 1. Khái niệm

| SQL Server | MongoDB |
|------------|---------|
| Database | Database |
| Table (bảng) | Collection |
| Row (dòng) | Document |
| Column (cột) | Field |
| Primary Key | `_id` (tự sinh nếu không chỉ định) |
| Foreign Key | *(không có)* — tham chiếu thủ công + `$lookup` |
| JOIN | `$lookup`, hoặc nhúng dữ liệu |
| Index | Index |
| View | View / Materialized View |
| Stored Procedure | *(không có)* — logic nằm ở tầng ứng dụng |
| Schema bắt buộc | JSON Schema Validator (tùy chọn) |

---

## 2. DDL

| Việc cần làm | T-SQL | MongoDB |
|--------------|-------|---------|
| Tạo CSDL | `CREATE DATABASE BookStore;` | `use BookStore` *(tạo khi có dữ liệu đầu tiên)* |
| Tạo bảng/collection | `CREATE TABLE Sach (...)` | `db.createCollection("sach")` *(hoặc không cần)* |
| Xóa bảng | `DROP TABLE Sach;` | `db.sach.drop()` |
| Thêm cột | `ALTER TABLE Sach ADD MoTa NVARCHAR(500);` | *(không cần — chỉ việc `$set` trường mới)* |
| Ràng buộc | `CHECK`, `NOT NULL`, `UNIQUE`, `FOREIGN KEY` | `$jsonSchema` validator (không có FK) |

---

## 3. CREATE

| T-SQL | MongoDB |
|-------|---------|
| `INSERT INTO Sach (TenSach, GiaBan) VALUES (N'A', 79000);` | `db.sach.insertOne({ tenSach: "A", giaBan: 79000 })` |
| `INSERT ... VALUES (...), (...), (...);` | `db.sach.insertMany([{...}, {...}, {...}])` |
| `INSERT INTO B SELECT ... FROM A;` | `db.a.aggregate([..., { $merge: "b" }])` |

---

## 4. READ

| Câu hỏi | T-SQL | MongoDB |
|---------|-------|---------|
| Lấy tất cả | `SELECT * FROM Sach;` | `db.sach.find()` |
| Chọn cột | `SELECT TenSach, GiaBan FROM Sach;` | `db.sach.find({}, { tenSach:1, giaBan:1, _id:0 })` |
| Lọc bằng | `WHERE MaDanhMuc = 3` | `{ maDanhMuc: 3 }` |
| Lớn hơn | `WHERE GiaBan > 100000` | `{ giaBan: { $gt: 100000 } }` |
| Trong khoảng | `WHERE GiaBan BETWEEN 50000 AND 150000` | `{ giaBan: { $gte: 50000, $lte: 150000 } }` |
| AND | `WHERE a = 1 AND b = 2` | `{ a: 1, b: 2 }` |
| OR | `WHERE a = 1 OR b = 2` | `{ $or: [{a:1}, {b:2}] }` |
| IN | `WHERE MaDM IN (3, 5)` | `{ maDM: { $in: [3, 5] } }` |
| NOT IN | `WHERE MaDM NOT IN (3, 5)` | `{ maDM: { $nin: [3, 5] } }` |
| Khác | `WHERE TrangThai <> N'Huy'` | `{ trangThai: { $ne: "Huy" } }` |
| Chứa chuỗi | `WHERE TenSach LIKE N'%kim%'` | `{ tenSach: /kim/i }` |
| Bắt đầu bằng | `WHERE HoTen LIKE N'Nguyễn%'` | `{ hoTen: /^Nguyễn/ }` |
| NULL / thiếu | `WHERE ISBN IS NULL` | `{ isbn: { $exists: false } }` *hoặc* `{ isbn: null }` |
| Sắp xếp | `ORDER BY GiaBan DESC` | `.sort({ giaBan: -1 })` |
| Lấy N dòng | `SELECT TOP 5` | `.limit(5)` |
| Phân trang | `OFFSET 10 ROWS FETCH NEXT 5 ROWS ONLY` | `.skip(10).limit(5)` |
| Đếm | `SELECT COUNT(*) FROM Sach` | `db.sach.countDocuments()` |
| Giá trị duy nhất | `SELECT DISTINCT DanhMuc FROM Sach` | `db.sach.distinct("danhMuc")` |
| Trường lồng nhau | *(phải JOIN bảng khác)* | `{ "thongTinXB.nam": 2020 }` |
| Phần tử trong mảng | *(phải JOIN bảng con)* | `{ tacGia: "Nam Cao" }` |

---

## 5. UPDATE

| T-SQL | MongoDB |
|-------|---------|
| `UPDATE Sach SET GiaBan = 85000 WHERE MaSach = 1;` | `db.sach.updateOne({_id:1}, { $set: { giaBan: 85000 } })` |
| `UPDATE Sach SET GiaBan = GiaBan * 1.1 WHERE MaDM = 3;` | `db.sach.updateMany({maDM:3}, { $mul: { giaBan: 1.1 } })` |
| `SET SoLuongTon = SoLuongTon - 5` | `{ $inc: { soLuongTon: -5 } }` |
| *(thêm phần tử vào bảng con)* | `{ $push: { tags: "moi" } }` / `$addToSet` |
| *(xóa dòng bảng con)* | `{ $pull: { tags: "cu" } }` |
| `MERGE` (có thì sửa, không thì thêm) | `updateOne(..., { upsert: true })` |

> ⚠️ MongoDB **bắt buộc** dùng toán tử (`$set`, `$inc`, …). Truyền object trần
> sẽ lỗi hoặc thay thế toàn bộ document.

---

## 6. DELETE

| T-SQL | MongoDB |
|-------|---------|
| `DELETE FROM Sach WHERE MaSach = 1;` | `db.sach.deleteOne({ _id: 1 })` |
| `DELETE FROM Sach WHERE SoLuongTon = 0;` | `db.sach.deleteMany({ soLuongTon: 0 })` |
| `TRUNCATE TABLE Sach;` | `db.sach.deleteMany({})` |

---

## 7. Gom nhóm và JOIN

| T-SQL | MongoDB |
|-------|---------|
| `WHERE` | `{ $match: {...} }` |
| `GROUP BY danhMuc` | `{ $group: { _id: "$danhMuc", ... } }` |
| `COUNT(*)` | `{ $sum: 1 }` |
| `SUM(col)` | `{ $sum: "$col" }` |
| `AVG` / `MIN` / `MAX` | `$avg` / `$min` / `$max` |
| `COUNT(DISTINCT col)` | `{ $addToSet: "$col" }` rồi `{ $size: ... }` |
| `HAVING` | `{ $match: {...} }` **sau** `$group` |
| `ORDER BY` | `{ $sort: {...} }` |
| `SELECT` cột | `{ $project: {...} }` |
| `LEFT JOIN` | `{ $lookup: { from, localField, foreignField, as } }` |
| *(bung bảng con)* | `{ $unwind: "$mang" }` |
| `ROW_NUMBER() OVER (PARTITION BY ...)` | `{ $setWindowFields: { partitionBy, sortBy, output: { hang: { $rank: {} } } } }` |
| `STRING_AGG` | `{ $push: "$col" }` rồi `{ $reduce: ... }` |
| `CASE WHEN` | `{ $switch: { branches: [...], default: ... } }` |
| `ISNULL(a, b)` | `{ $ifNull: ["$a", b] }` |

### Ví dụ đối chiếu đầy đủ

```sql
-- T-SQL
SELECT dm.TenDanhMuc, COUNT(*) AS SoSach, AVG(s.GiaBan) AS GiaTB
FROM Sach s JOIN DanhMuc dm ON s.MaDanhMuc = dm.MaDanhMuc
WHERE s.NamXuatBan >= 2020
GROUP BY dm.TenDanhMuc
HAVING COUNT(*) >= 2
ORDER BY SoSach DESC;
```

```javascript
// MongoDB (danh mục đã nhúng sẵn trong sach)
db.sach.aggregate([
  { $match: { "thongTinXB.nam": { $gte: 2020 } } },
  { $group: { _id: "$danhMuc", soSach: { $sum: 1 },
              giaTB: { $avg: { $toDouble: "$giaBan" } } } },
  { $match: { soSach: { $gte: 2 } } },
  { $sort: { soSach: -1 } }
])
```

---

## 8. Index

| T-SQL | MongoDB |
|-------|---------|
| `CREATE INDEX IX_a ON T (a);` | `db.t.createIndex({ a: 1 })` |
| `CREATE INDEX IX_ab ON T (a, b);` | `db.t.createIndex({ a: 1, b: -1 })` |
| `CREATE UNIQUE INDEX ...` | `db.t.createIndex({ a: 1 }, { unique: true })` |
| `INCLUDE (c, d)` (covering) | *(thêm cột vào chính index)* |
| Filtered index `WHERE ...` | `{ partialFilterExpression: {...} }` |
| Full-text index | `db.t.createIndex({ f: "text" })` |
| *(không có)* | TTL: `{ expireAfterSeconds: 3600 }` — tự xóa document cũ |
| `SET SHOWPLAN` / Ctrl+M | `.explain("executionStats")` |
| Index Seek ✅ / Table Scan ❌ | `IXSCAN` ✅ / `COLLSCAN` ❌ |
| `sys.indexes`, `dm_db_index_usage_stats` | `db.t.getIndexes()`, `$indexStats` |

Quy tắc thứ tự cột **giống nhau ở cả hai**: Equality → Sort → Range.

---

## 9. Giao dịch

| T-SQL | MongoDB |
|-------|---------|
| `BEGIN TRANSACTION` | `session.startTransaction()` |
| `COMMIT` | `session.commitTransaction()` |
| `ROLLBACK` | `session.abortTransaction()` |
| Bật mặc định, chi phí thấp | Cần replica set, chi phí cao hơn |
| `SET TRANSACTION ISOLATION LEVEL ...` | `readConcern` / `writeConcern` |

> **Triết lý khác nhau:** SQL Server khuyến khích dùng transaction khi cần.
> MongoDB khuyến khích **thiết kế document sao cho không cần transaction** —
> một thao tác nghiệp vụ chỉ chạm vào một document thì đã tự nguyên tử.

---

## 10. Bảng ghi nhớ cuối cùng

| Bạn cần… | Chọn |
|----------|------|
| Giao dịch tiền bạc, tồn kho, đặt chỗ | **SQL Server** |
| Báo cáo tùy biến theo nhiều chiều | **SQL Server** |
| Quan hệ phức tạp giữa nhiều thực thể | **SQL Server** |
| Mỗi bản ghi một cấu trúc khác nhau | **MongoDB** |
| Ghi rất nhiều, đọc theo một chiều cố định | **MongoDB** |
| Cần scale ngang qua nhiều máy | **MongoDB** |
| Dữ liệu tự nhiên có dạng lồng nhau, luôn đọc cả cụm | **MongoDB** |
| Không chắc chắn | **SQL Server** — dễ chuyển sang NoSQL sau hơn là ngược lại |
