/* =====================================================================
   ĐÁP ÁN BUỔI 9 — MongoDB
   ⚠️ Dành cho giảng viên
   ===================================================================== */

use BookStore

/* ==================== CRUD (mongo-01-crud.js) ==================== */

// 1. Sách giá trên 100.000
db.sach.find({ giaBan: { $gt: NumberDecimal("100000") } },
             { tenSach: 1, giaBan: 1, _id: 0 })

// 2. Sách của Nguyễn Nhật Ánh
db.sach.find({ tacGia: "Nguyễn Nhật Ánh" }, { tenSach: 1, _id: 0 })

// 3. Tên chứa "sử", không phân biệt hoa thường
db.sach.find({ tenSach: /sử/i }, { tenSach: 1, _id: 0 })

// 4. Xuất bản từ 2020 VÀ tồn dưới 50
db.sach.find({ "thongTinXB.nam": { $gte: 2020 }, soLuongTon: { $lt: 50 } },
             { tenSach: 1, "thongTinXB.nam": 1, soLuongTon: 1, _id: 0 })

// 5. Nhiều hơn 1 tác giả — hai cách
db.sach.find({ "tacGia.1": { $exists: true } }, { tenSach: 1, tacGia: 1, _id: 0 })
db.sach.find({ $expr: { $gt: [{ $size: "$tacGia" }, 1] } }, { tenSach: 1, tacGia: 1, _id: 0 })
// Cách 1 nhanh hơn (dùng được index), cách 2 dễ đọc hơn.

// 6. Không có trường isbn
db.sach.find({ isbn: { $exists: false } }, { tenSach: 1, _id: 0 })

// 7. Trang 2, 3 cuốn/trang, giá giảm dần
db.sach.find({}, { tenSach: 1, giaBan: 1, _id: 0 }).sort({ giaBan: -1 }).skip(3).limit(3)

// 8. Khách Hà Nội, điểm > 200
db.khachhang.find({ "diaChi.thanhPho": "Hà Nội", diemTichLuy: { $gt: 200 } },
                  { hoTen: 1, diemTichLuy: 1, _id: 0 })

// 9. Khách không có sdt
db.khachhang.find({ sdt: { $exists: false } }, { hoTen: 1, email: 1, _id: 0 })

// 10. Đơn chứa sách 3 với số lượng >= 2  ($elemMatch — cả 2 điều kiện trên CÙNG phần tử)
db.donhang.find({ chiTiet: { $elemMatch: { maSach: 3, soLuong: { $gte: 2 } } } },
                { maDH: 1, "khachHang.hoTen": 1, _id: 0 })
// ⚠️ So sánh với cách SAI (2 điều kiện có thể khớp 2 phần tử KHÁC NHAU):
// db.donhang.find({ "chiTiet.maSach": 3, "chiTiet.soLuong": { $gte: 2 } })

// 11. Thêm sách mới
db.sach.insertOne({
  _id: 22, isbn: "978-604-1-00022-6", tenSach: "Rừng Na Uy", danhMuc: "Tiểu thuyết",
  giaBan: NumberDecimal("135000"), soLuongTon: 60, tacGia: ["Haruki Murakami"],
  thongTinXB: { nhaXuatBan: "NXB Hội Nhà Văn", nam: 2021, soTrang: 520 },
  tags: ["nhật bản", "kinh điển"]
})

// 12. Tăng giá 5% sách CNTT
db.sach.updateMany({ danhMuc: "Công nghệ thông tin" }, { $mul: { giaBan: 1.05 } })

// 13. Thêm tag "sap-het" cho sách tồn < 20
db.sach.updateMany({ soLuongTon: { $lt: 20 } }, { $addToSet: { tags: "sap-het" } })

// 14. Thêm trường riêng cho sách 20
db.sach.updateOne({ _id: 20 }, { $set: { soLuongDaBan: 1 } })

// 15. Xóa sách đã thêm
db.sach.deleteOne({ _id: 22 })


/* ============== AGGREGATION (mongo-02-aggregation.js) ============== */

// 1. Số sách theo danh mục
db.sach.aggregate([
  { $group: { _id: "$danhMuc", soSach: { $sum: 1 } } },
  { $sort: { soSach: -1 } }
])

// 2. Giá TB / cao nhất / thấp nhất theo danh mục
db.sach.aggregate([
  { $group: { _id: "$danhMuc",
              giaTB:       { $avg: { $toDouble: "$giaBan" } },
              giaCaoNhat:  { $max: { $toDouble: "$giaBan" } },
              giaThapNhat: { $min: { $toDouble: "$giaBan" } },
              soSach:      { $sum: 1 } } },
  { $project: { _id: 0, danhMuc: "$_id", soSach: 1,
                giaTB: { $round: ["$giaTB", 0] }, giaCaoNhat: 1, giaThapNhat: 1 } },
  { $sort: { giaTB: -1 } }
])

// 3. Top 5 theo SỐ CUỐN
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $unwind: "$chiTiet" },
  { $group: { _id: "$chiTiet.maSach", tenSach: { $first: "$chiTiet.tenSach" },
              soBan: { $sum: "$chiTiet.soLuong" } } },
  { $sort: { soBan: -1 } }, { $limit: 5 },
  { $project: { _id: 0, tenSach: 1, soBan: 1 } }
])

// 4. Top 5 theo DOANH THU
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $unwind: "$chiTiet" },
  { $group: { _id: "$chiTiet.maSach", tenSach: { $first: "$chiTiet.tenSach" },
              doanhThu: { $sum: { $multiply: ["$chiTiet.soLuong",
                                             { $toDouble: "$chiTiet.donGia" }] } } } },
  { $sort: { doanhThu: -1 } }, { $limit: 5 },
  { $project: { _id: 0, tenSach: 1, doanhThu: 1 } }
])
/* KHÁC NHAU THẾ NÀO? Sách rẻ bán nhiều cuốn (Dế Mèn 55k) đứng đầu theo SỐ CUỐN,
   nhưng sách đắt bán ít (Clean Architecture 460k) lại đứng đầu theo DOANH THU.
   Bài học: "bán chạy" là câu hỏi mơ hồ — phải hỏi lại khách hàng là chạy theo
   nghĩa nào. Đây là kỹ năng phân tích yêu cầu, không phải kỹ năng kỹ thuật. */

// 5. Doanh thu theo tháng năm 2025
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh",
              ngayDat: { $gte: ISODate("2025-01-01"), $lt: ISODate("2026-01-01") } } },
  { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$ngayDat" } },
              soDon: { $sum: 1 },
              doanhThu: { $sum: { $toDouble: "$tongTien" } } } },
  { $sort: { _id: 1 } }
])

// 6. Top 3 khách chi tiêu nhiều nhất
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: { _id: "$maKH", hoTen: { $first: "$khachHang.hoTen" },
              soDon: { $sum: 1 },
              tongChi: { $sum: { $toDouble: "$tongTien" } } } },
  { $sort: { tongChi: -1 } }, { $limit: 3 },
  { $project: { _id: 0, maKH: "$_id", hoTen: 1, soDon: 1, tongChi: 1 } }
])

// 7. Mỗi tác giả: số đầu sách + giá trị tồn
db.sach.aggregate([
  { $unwind: "$tacGia" },
  { $group: { _id: "$tacGia", soDauSach: { $sum: 1 },
              giaTriTon: { $sum: { $multiply: ["$soLuongTon", { $toDouble: "$giaBan" }] } } } },
  { $sort: { giaTriTon: -1 } }
])

// 8. Doanh thu theo thành phố + khách chi nhiều nhất mỗi thành phố
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: { _id: { tp: "$khachHang.thanhPho", kh: "$maKH" },
              hoTen: { $first: "$khachHang.hoTen" },
              chiTieu: { $sum: { $toDouble: "$tongTien" } } } },
  { $sort: { chiTieu: -1 } },
  { $group: { _id: "$_id.tp",
              doanhThu: { $sum: "$chiTieu" },
              soKhach:  { $sum: 1 },
              khachTop: { $first: { hoTen: "$hoTen", chiTieu: "$chiTieu" } } } },
  { $lookup: { from: "khachhang", localField: "khachTop.hoTen",
               foreignField: "hoTen", as: "kh" } },
  { $project: { _id: 0, thanhPho: "$_id", doanhThu: 1, soKhach: 1,
                khachTop: 1, email: { $first: "$kh.email" } } },
  { $sort: { doanhThu: -1 } }
])

// 9. Điểm đánh giá TB mỗi sách (sách chưa ai đánh giá vẫn hiện)
db.sach.aggregate([
  { $lookup: { from: "danhgia", localField: "_id", foreignField: "maSach", as: "dg" } },
  { $project: { _id: 0, tenSach: 1, danhMuc: 1,
                soLuot: { $size: "$dg" },
                diemTB: { $round: [{ $avg: "$dg.soSao" }, 2] } } },
  { $sort: { diemTB: -1, soLuot: -1 } }
])

// 10. Điểm TB >= 4.5 và >= 2 lượt
db.danhgia.aggregate([
  { $group: { _id: "$maSach", soLuot: { $sum: 1 }, diemTB: { $avg: "$soSao" } } },
  { $match: { soLuot: { $gte: 2 }, diemTB: { $gte: 4.5 } } },
  { $lookup: { from: "sach", localField: "_id", foreignField: "_id", as: "s" } },
  { $project: { _id: 0, tenSach: { $first: "$s.tenSach" },
                soLuot: 1, diemTB: { $round: ["$diemTB", 2] } } },
  { $sort: { diemTB: -1 } }
])

// 11. Theo nhà xuất bản
db.sach.aggregate([
  { $group: { _id: "$thongTinXB.nhaXuatBan",
              soDauSach: { $sum: 1 }, tongTon: { $sum: "$soLuongTon" },
              giaTriTon: { $sum: { $multiply: ["$soLuongTon", { $toDouble: "$giaBan" }] } } } },
  { $sort: { giaTriTon: -1 } }
])

// 12. Phân bố theo khoảng giá + tỉ lệ %
db.sach.aggregate([
  { $bucket: {
      groupBy: { $toDouble: "$giaBan" },
      boundaries: [0, 60000, 150000, 300000, 1000000],
      default: "Khác",
      output: { soSach: { $sum: 1 }, danhSach: { $push: "$tenSach" } } } },
  { $group: { _id: null, buckets: { $push: "$$ROOT" }, tong: { $sum: "$soSach" } } },
  { $unwind: "$buckets" },
  { $project: { _id: 0, khoangGia: "$buckets._id", soSach: "$buckets.soSach",
                phanTram: { $round: [{ $multiply: [100, { $divide: ["$buckets.soSach", "$tong"] }] }, 1] } } }
])

// 13. Phân loại khách hàng bằng $switch
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: { _id: "$maKH", hoTen: { $first: "$khachHang.hoTen" },
              soDon: { $sum: 1 },
              tongChi: { $sum: { $toDouble: "$tongTien" } },
              muaGanNhat: { $max: "$ngayDat" } } },
  { $addFields: { phanLoai: { $switch: { branches: [
        { case: { $gt: ["$tongChi", 1000000] }, then: "VIP" },
        { case: { $gt: ["$tongChi",  300000] }, then: "Thường xuyên" }
      ], default: "Mới" } } } },
  { $project: { _id: 0, maKH: "$_id", hoTen: 1, soDon: 1, tongChi: 1,
                muaGanNhat: { $dateToString: { format: "%d/%m/%Y", date: "$muaGanNhat" } },
                phanLoai: 1 } },
  { $sort: { tongChi: -1 } }
])

// 14. Cặp sách mua cùng nhau — $unwind hai lần
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $project: { chiTiet: 1, chiTiet2: "$chiTiet" } },
  { $unwind: "$chiTiet" },
  { $unwind: "$chiTiet2" },
  { $match: { $expr: { $lt: ["$chiTiet.maSach", "$chiTiet2.maSach"] } } },  // tránh trùng cặp
  { $group: { _id: { a: "$chiTiet.maSach", b: "$chiTiet2.maSach" },
              sachA: { $first: "$chiTiet.tenSach" },
              sachB: { $first: "$chiTiet2.tenSach" },
              soLan: { $sum: 1 } } },
  { $sort: { soLan: -1 } }, { $limit: 10 },
  { $project: { _id: 0, sachA: 1, sachB: 1, soLan: 1 } }
])


/* ==================== BÀI TẬP VỀ NHÀ ==================== */

/* Bài 3. Thiết kế collection cho IoT

   YÊU CẦU: mỗi cảm biến gửi 1 bản ghi / 10 giây, lưu 1 năm.
   Số bản ghi mỗi cảm biến: 6 × 60 × 24 × 365 ≈ 3,15 TRIỆU / năm.

   ❌ THIẾT KẾ NGÂY THƠ — mỗi lần đo một document:
      { maCamBien: "CB01", thoiGian: ISODate(...), nhietDo: 25.3, doAm: 60 }
      -> 3,15 triệu document/cảm biến. Mỗi document tốn overhead _id + BSON.
      -> Index khổng lồ, truy vấn theo giờ phải quét hàng trăm nghìn document.

   ✅ THIẾT KẾ BUCKET PATTERN — gom theo giờ:
*/
db.dulieu_cambien.insertOne({
  maCamBien: "CB01",
  gio: ISODate("2026-03-15T10:00:00Z"),      // mốc giờ
  soLuongMau: 360,                            // 6 mẫu/phút × 60 phút
  // thống kê tính sẵn -> truy vấn "trung bình theo giờ" chỉ cần ĐỌC, không tính
  nhietDo: { min: 24.1, max: 26.8, tong: 9050.4, tb: 25.14 },
  doAm:    { min: 58,   max: 65,   tong: 22140, tb: 61.5 },
  mau: [                                      // dữ liệu thô nếu cần xem chi tiết
    { t: 0,  nd: 25.1, da: 60 },
    { t: 10, nd: 25.2, da: 61 }
    // ...
  ]
})
db.dulieu_cambien.createIndex({ maCamBien: 1, gio: -1 })
// TTL: tự xóa sau 1 năm, không cần job dọn dẹp
db.dulieu_cambien.createIndex({ gio: 1 }, { expireAfterSeconds: 31536000 })

/* SO SÁNH SỐ LIỆU:
   - Ngây thơ: 3.150.000 document/cảm biến/năm
   - Bucket:       8.760 document/cảm biến/năm  (giảm ~360 lần)

   Truy vấn "nhiệt độ TB theo giờ của CB01 trong tháng qua":
   - Ngây thơ: quét ~260.000 document rồi $group
   - Bucket:   đọc 720 document, trường tb đã tính sẵn
*/
db.dulieu_cambien.find(
  { maCamBien: "CB01", gio: { $gte: ISODate("2026-02-15") } },
  { gio: 1, "nhietDo.tb": 1, _id: 0 }
).sort({ gio: 1 })

/* VÌ SAO MONGODB PHÙ HỢP HƠN SQL SERVER Ở ĐÂY:
   1. Ghi rất nhiều, không cần giao dịch đa bảng -> không tận dụng thế mạnh ACID của SQL
   2. Dữ liệu tự nhiên có dạng lồng nhau (mảng mẫu đo) -> nhúng là tự nhiên
   3. Cần scale OUT khi số cảm biến tăng -> sharding theo maCamBien rất dễ
   4. Không có quan hệ phức tạp, không cần JOIN
   5. TTL index tự dọn dữ liệu cũ — SQL Server phải viết job riêng

   ⚠️ NHƯNG: nếu bài toán thật sự chuyên về time-series, công cụ ĐÚNG NHẤT là
   InfluxDB / TimescaleDB, hoặc MongoDB Time Series Collection (5.0+):
*/
db.createCollection("dulieu_ts", {
  timeseries: { timeField: "thoiGian", metaField: "maCamBien", granularity: "seconds" },
  expireAfterSeconds: 31536000
})


/* Bài 4. Schema validator cho collection sach */
db.sach_validated.drop()
db.createCollection("sach_validated", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tenSach", "giaBan", "tacGia"],
      properties: {
        tenSach: { bsonType: "string", minLength: 1,
                   description: "bắt buộc, chuỗi không rỗng" },
        giaBan:  { bsonType: "decimal",
                   description: "bắt buộc, kiểu decimal" },
        tacGia:  { bsonType: "array", minItems: 1, items: { bsonType: "string" },
                   description: "mảng chuỗi, tối thiểu 1 phần tử" },
        namXuatBan: { bsonType: "int", minimum: 1400, maximum: 2100 },
        soLuongTon: { bsonType: "int", minimum: 0 }
      }
    }
  },
  validationAction: "error",
  validationLevel: "strict"
})

// ✅ Hợp lệ
db.sach_validated.insertOne({ tenSach: "Sách OK", giaBan: NumberDecimal("50000"),
                              tacGia: ["Tác giả A"], namXuatBan: 2024, soLuongTon: 10 })

// ❌ Test 1: thiếu trường bắt buộc giaBan
db.sach_validated.insertOne({ tenSach: "Thiếu giá", tacGia: ["A"] })

// ❌ Test 2: mảng tacGia rỗng
db.sach_validated.insertOne({ tenSach: "X", giaBan: NumberDecimal("1"), tacGia: [] })

// ❌ Test 3: năm ngoài khoảng cho phép
db.sach_validated.insertOne({ tenSach: "Y", giaBan: NumberDecimal("1"),
                              tacGia: ["Z"], namXuatBan: 3000 })

/* ⚠️ LƯU Ý QUAN TRỌNG cho học viên:
   validator KHÔNG THAY THẾ được khóa ngoại. MongoDB không có cách nào kiểm tra
   "maKH này có tồn tại trong collection khachhang không". Đó vẫn là trách nhiệm
   của code ứng dụng. Đây là khác biệt căn bản so với SQL Server. */


/* Bài 5. Bảng đối chiếu T-SQL vs MongoDB — xem file so-sanh-tsql-mongodb.md */
