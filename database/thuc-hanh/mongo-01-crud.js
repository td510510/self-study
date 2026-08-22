/* =====================================================================
   BÀI TẬP BUỔI 9 (Phần 1) — CRUD trong MongoDB
   Chạy trong mongosh sau khi đã nạp mongo-00-seed.js

   CÁCH DÙNG FILE NÀY: đừng chạy cả file. Hãy copy từng khối vào mongosh,
   chạy, xem kết quả, rồi mới sang khối tiếp theo.
   ===================================================================== */

use BookStore

// ---------------------------------------------------------------------
// A. LÀM QUEN
// ---------------------------------------------------------------------
show collections
db.sach.countDocuments()
db.sach.findOne()
db.donhang.findOne()

// So sánh trực quan: một đơn hàng trong MongoDB là MỘT document,
// trong SQL Server phải JOIN 4 bảng mới ra được từng đó thông tin.
db.donhang.findOne({ maDH: 1003 })


// ---------------------------------------------------------------------
// B. READ — đối chiếu với SQL
// ---------------------------------------------------------------------

// SQL: SELECT * FROM Sach
db.sach.find()

// SQL: SELECT tenSach, giaBan FROM Sach
db.sach.find({}, { tenSach: 1, giaBan: 1, _id: 0 })

// SQL: WHERE giaBan > 100000
db.sach.find({ giaBan: { $gt: NumberDecimal("100000") } }, { tenSach: 1, giaBan: 1, _id: 0 })

// SQL: WHERE danhMuc = 'Khoa học' AND soLuongTon < 50   (AND ngầm định)
db.sach.find({ danhMuc: "Khoa học", soLuongTon: { $lt: 50 } })

// SQL: WHERE danhMuc = 'Khoa học' OR danhMuc = 'Kinh tế'
db.sach.find({ $or: [{ danhMuc: "Khoa học" }, { danhMuc: "Kinh tế" }] })

// SQL: WHERE danhMuc IN (...)
db.sach.find({ danhMuc: { $in: ["Tiểu thuyết", "Truyện ngắn"] } })

// SQL: WHERE tenSach LIKE '%kim%'   (không phân biệt hoa thường)
db.sach.find({ tenSach: /kim/i }, { tenSach: 1, _id: 0 })

// SQL: WHERE isbn IS NULL
db.sach.find({ isbn: { $exists: false } }, { tenSach: 1, _id: 0 })

// SQL: ORDER BY giaBan DESC + TOP 5
db.sach.find({}, { tenSach: 1, giaBan: 1, _id: 0 }).sort({ giaBan: -1 }).limit(5)

// SQL: OFFSET 5 FETCH NEXT 5  (trang 2)
db.sach.find({}, { tenSach: 1, _id: 0 }).sort({ tenSach: 1 }).skip(5).limit(5)

// SQL: SELECT DISTINCT danhMuc
db.sach.distinct("danhMuc")

// Truy vấn TRƯỜNG LỒNG NHAU — dùng dấu chấm
db.sach.find({ "thongTinXB.nam": { $gte: 2020 } }, { tenSach: 1, "thongTinXB.nam": 1, _id: 0 })
db.khachhang.find({ "diaChi.thanhPho": "Hà Nội" }, { hoTen: 1, _id: 0 })

// Truy vấn TRONG MẢNG — tự động khớp bất kỳ phần tử nào
db.sach.find({ tacGia: "Nguyễn Nhật Ánh" }, { tenSach: 1, _id: 0 })
db.sach.find({ tags: { $all: ["bestseller", "triết lý"] } })   // phải có ĐỦ CẢ HAI
db.sach.find({ tacGia: { $size: 2 } })                          // đúng 2 tác giả
db.sach.find({ "chiTiet.maSach": 1 })                           // trong donhang

// $elemMatch — khi cần NHIỀU điều kiện trên CÙNG MỘT phần tử mảng
db.donhang.find({ chiTiet: { $elemMatch: { maSach: 1, soLuong: { $gte: 2 } } } },
                { maDH: 1, _id: 0 })


// ---------------------------------------------------------------------
// C. CREATE
// ---------------------------------------------------------------------
db.sach.insertOne({
  _id: 21,
  isbn: "978-604-1-00021-9",
  tenSach: "Vũ trụ trong vỏ hạt dẻ",
  danhMuc: "Khoa học",
  giaBan: NumberDecimal("175000"),
  soLuongTon: 40,
  tacGia: ["Stephen Hawking"],
  thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2022, soTrang: 224 },
  tags: ["vật lý", "vũ trụ"]
})

db.sach.findOne({ _id: 21 })


// ---------------------------------------------------------------------
// D. UPDATE — ⚠️ LUÔN dùng toán tử $set / $inc / $push ...
// ---------------------------------------------------------------------

// $set + $inc + $currentDate
db.sach.updateOne(
  { _id: 1 },
  { $set:  { giaBan: NumberDecimal("85000") },
    $inc:  { soLuongTon: -5 },
    $currentDate: { ngayCapNhat: true } }
)
db.sach.findOne({ _id: 1 })

// updateMany + $mul — tăng giá 10% cho mọi sách Khoa học
db.sach.updateMany({ danhMuc: "Khoa học" }, { $mul: { giaBan: 1.1 } })

// Thao tác MẢNG
db.sach.updateOne({ _id: 3 }, { $push:     { tags: "lịch sử" } })
db.sach.updateOne({ _id: 3 }, { $addToSet: { tags: "lịch sử" } })  // không thêm trùng
db.sach.updateOne({ _id: 3 }, { $pull:     { tags: "bestseller" } })
db.sach.findOne({ _id: 3 }, { tenSach: 1, tags: 1 })

// Thêm tag khuyến mãi cho mọi sách tồn > 100
db.sach.updateMany({ soLuongTon: { $gt: 100 } }, { $addToSet: { tags: "khuyen-mai" } })

// upsert: có thì sửa, không có thì tạo
db.sach.updateOne(
  { isbn: "978-604-1-99999-9" },
  { $set: { tenSach: "Sách thử nghiệm", danhMuc: "Khác",
            giaBan: NumberDecimal("100000"), soLuongTon: 1 } },
  { upsert: true }
)

// ⚠️ THÍ NGHIỆM LỖI KINH ĐIỂN — chạy để thấy lỗi:
// db.sach.updateOne({ _id: 1 }, { giaBan: NumberDecimal("999") })
// -> MongoServerError: Update document requires atomic operators


// ---------------------------------------------------------------------
// E. DELETE
// ---------------------------------------------------------------------
db.sach.deleteOne({ isbn: "978-604-1-99999-9" })
db.sach.deleteOne({ _id: 21 })
db.sach.countDocuments()   // về lại 20

// db.sach.deleteMany({ soLuongTon: 0 })   // ⚠️ cân nhắc trước khi chạy


// ---------------------------------------------------------------------
// F. INDEX và EXPLAIN
// ---------------------------------------------------------------------
db.sach.getIndexes()

// COLLSCAN = quét toàn bộ (xấu) | IXSCAN = dùng index (tốt)
db.sach.find({ danhMuc: "Khoa học" }).explain("executionStats").executionStats
db.sach.find({ "thongTinXB.soTrang": 448 }).explain("executionStats").executionStats  // COLLSCAN

// Tìm kiếm toàn văn (cần text index — đã tạo trong file seed)
db.sach.find({ $text: { $search: "lược sử" } }, { tenSach: 1, _id: 0 })


// ---------------------------------------------------------------------
// G. SCHEMA VALIDATOR — cách MongoDB "có ràng buộc"
// ---------------------------------------------------------------------
db.sach_chuan.drop()
db.createCollection("sach_chuan", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenSach", "giaBan", "tacGia"],
      properties: {
        tenSach: { bsonType: "string", description: "bắt buộc, kiểu chuỗi" },
        giaBan:  { bsonType: "decimal", description: "bắt buộc, kiểu decimal" },
        tacGia:  { bsonType: "array", minItems: 1, items: { bsonType: "string" },
                   description: "mảng không rỗng" },
        namXuatBan: { bsonType: "int", minimum: 1400, maximum: 2100 }
      }
    }
  },
  validationAction: "error"
})

// ✅ Hợp lệ
db.sach_chuan.insertOne({ tenSach: "Sách hợp lệ", giaBan: NumberDecimal("50000"),
                          tacGia: ["Ai đó"], namXuatBan: 2024 })

// ❌ Thiếu trường bắt buộc
db.sach_chuan.insertOne({ tenSach: "Thiếu giá" })

// ❌ Mảng tacGia rỗng
db.sach_chuan.insertOne({ tenSach: "X", giaBan: NumberDecimal("1"), tacGia: [] })

// ❌ Năm ngoài khoảng
db.sach_chuan.insertOne({ tenSach: "Y", giaBan: NumberDecimal("1"),
                          tacGia: ["Z"], namXuatBan: 3000 })


/* =====================================================================
   BÀI TẬP TỰ LÀM
   ===================================================================== */

// 1. Tìm mọi sách giá trên 100.000, chỉ hiện tên và giá.

// 2. Tìm sách của tác giả "Nguyễn Nhật Ánh".

// 3. Tìm sách có tên chứa "sử" (không phân biệt hoa thường).

// 4. Tìm sách xuất bản từ 2020 trở lại đây VÀ còn tồn dưới 50 cuốn.

// 5. Tìm sách có nhiều hơn 1 tác giả.  (gợi ý: $expr với $size, hoặc "tacGia.1": {$exists:true})

// 6. Tìm sách KHÔNG có trường isbn.

// 7. Sắp xếp sách theo giá giảm dần, lấy 3 cuốn của TRANG THỨ 2.

// 8. Tìm khách hàng ở Hà Nội có điểm tích lũy trên 200.

// 9. Tìm khách hàng KHÔNG có số điện thoại.

// 10. Tìm các đơn hàng có chứa sách mã 3 với số lượng >= 2. (gợi ý: $elemMatch)

// 11. Thêm một cuốn sách mới đầy đủ trường lồng nhau và mảng tags.

// 12. Tăng giá 5% cho mọi sách danh mục "Công nghệ thông tin".

// 13. Thêm tag "sap-het" cho mọi sách tồn dưới 20 cuốn.

// 14. Với sách mã 20, thêm trường mới soLuongDaBan = 1 (chỉ document này có).

// 15. Xóa cuốn sách bạn đã thêm ở câu 11.
