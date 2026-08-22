/* =====================================================================
   BÀI TẬP BUỔI 9 (Phần 2) — Aggregation Pipeline
   Chạy trong mongosh sau khi đã nạp mongo-00-seed.js

   Nguyên tắc đọc pipeline: dữ liệu chảy qua từng stage như băng chuyền.
   Mỗi stage nhận đầu ra của stage trước.
   ===================================================================== */

use BookStore

/* ---------------------------------------------------------------------
   A. $group — tương đương GROUP BY
   --------------------------------------------------------------------- */

// SQL: SELECT danhMuc, COUNT(*) FROM Sach GROUP BY danhMuc ORDER BY 2 DESC
db.sach.aggregate([
  { $group: { _id: "$danhMuc", soSach: { $sum: 1 } } },
  { $sort:  { soSach: -1 } }
])

// SQL: SELECT danhMuc, COUNT(*), AVG(giaBan), MIN, MAX, SUM(soLuongTon) ...
db.sach.aggregate([
  { $group: {
      _id: "$danhMuc",
      soSach:    { $sum: 1 },
      giaTB:     { $avg: "$giaBan" },
      giaThapNhat: { $min: "$giaBan" },
      giaCaoNhat:  { $max: "$giaBan" },
      tongTon:   { $sum: "$soLuongTon" }
  }},
  { $project: {
      _id: 0, danhMuc: "$_id", soSach: 1, tongTon: 1,
      giaTB: { $round: [{ $toDouble: "$giaTB" }, 0] },
      giaThapNhat: 1, giaCaoNhat: 1
  }},
  { $sort: { soSach: -1 } }
])

// $match ĐẶT SỚM NHẤT CÓ THỂ — lọc trước thì các stage sau xử lý ít dữ liệu hơn
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh", ngayDat: { $gte: ISODate("2025-01-01") } } },
  { $group: { _id: "$phuongThucTT",
              soDon: { $sum: 1 },
              tongTien: { $sum: "$tongTien" } } },
  { $sort: { tongTien: -1 } }
])


/* ---------------------------------------------------------------------
   B. $unwind — bung mảng thành nhiều document
   1 đơn có 3 sách  ->  3 document
   --------------------------------------------------------------------- */

// Xem $unwind làm gì trước đã
db.donhang.aggregate([
  { $match: { maDH: 1003 } },
  { $unwind: "$chiTiet" },
  { $project: { _id: 0, maDH: 1, "chiTiet.tenSach": 1, "chiTiet.soLuong": 1 } }
])

// TOP 5 SÁCH BÁN CHẠY NHẤT
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $unwind: "$chiTiet" },
  { $group: {
      _id: "$chiTiet.maSach",
      tenSach:   { $first: "$chiTiet.tenSach" },
      soCuonBan: { $sum: "$chiTiet.soLuong" },
      doanhThu:  { $sum: { $multiply: ["$chiTiet.soLuong", { $toDouble: "$chiTiet.donGia" }] } }
  }},
  { $sort: { soCuonBan: -1 } },
  { $limit: 5 },
  { $project: { _id: 0, maSach: "$_id", tenSach: 1, soCuonBan: 1, doanhThu: 1 } }
])

// $unwind trên mảng tacGia — mỗi tác giả có bao nhiêu đầu sách
db.sach.aggregate([
  { $unwind: "$tacGia" },
  { $group: { _id: "$tacGia",
              soDauSach: { $sum: 1 },
              giaTriTon: { $sum: { $multiply: ["$soLuongTon", { $toDouble: "$giaBan" }] } },
              danhSachSach: { $push: "$tenSach" } } },
  { $sort: { soDauSach: -1 } }
])


/* ---------------------------------------------------------------------
   C. Nhóm theo thời gian
   --------------------------------------------------------------------- */

// Doanh thu theo tháng
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: {
      _id: { nam: { $year: "$ngayDat" }, thang: { $month: "$ngayDat" } },
      soDon: { $sum: 1 },
      doanhThu: { $sum: { $toDouble: "$tongTien" } }
  }},
  { $sort: { "_id.nam": 1, "_id.thang": 1 } },
  { $project: { _id: 0, nam: "$_id.nam", thang: "$_id.thang", soDon: 1, doanhThu: 1 } }
])

// Cách viết gọn hơn bằng $dateToString
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: {
      _id: { $dateToString: { format: "%Y-%m", date: "$ngayDat" } },
      soDon: { $sum: 1 },
      doanhThu: { $sum: { $toDouble: "$tongTien" } }
  }},
  { $sort: { _id: 1 } }
])


/* ---------------------------------------------------------------------
   D. $lookup — tương đương LEFT JOIN
   --------------------------------------------------------------------- */

// Nối donhang với khachhang để lấy email (trường KHÔNG được nhúng)
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $lookup: { from: "khachhang", localField: "maKH", foreignField: "_id", as: "kh" } },
  { $unwind: "$kh" },      // $lookup trả về MẢNG, phải bung ra
  { $project: { _id: 0, maDH: 1, tongTien: 1,
                tenKH: "$kh.hoTen", email: "$kh.email", diem: "$kh.diemTichLuy" } },
  { $limit: 5 }
])

// Doanh thu theo thành phố (đếm khách KHÔNG TRÙNG bằng $addToSet)
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: {
      _id: "$khachHang.thanhPho",
      soDon: { $sum: 1 },
      khachHangs: { $addToSet: "$maKH" },
      doanhThu: { $sum: { $toDouble: "$tongTien" } }
  }},
  { $project: { _id: 0, thanhPho: "$_id", soDon: 1,
                soKhach: { $size: "$khachHangs" }, doanhThu: 1 } },
  { $sort: { doanhThu: -1 } }
])

// Điểm đánh giá trung bình mỗi cuốn sách — nối sach với danhgia
db.sach.aggregate([
  { $lookup: { from: "danhgia", localField: "_id", foreignField: "maSach", as: "dg" } },
  { $project: {
      _id: 0, tenSach: 1, danhMuc: 1,
      soLuotDanhGia: { $size: "$dg" },
      diemTB: { $round: [{ $avg: "$dg.soSao" }, 2] }     // null nếu chưa ai đánh giá
  }},
  { $sort: { diemTB: -1, soLuotDanhGia: -1 } }
])

// Sách CHƯA AI ĐÁNH GIÁ (tương đương LEFT JOIN + IS NULL)
db.sach.aggregate([
  { $lookup: { from: "danhgia", localField: "_id", foreignField: "maSach", as: "dg" } },
  { $match: { dg: { $size: 0 } } },
  { $project: { _id: 0, tenSach: 1, danhMuc: 1 } }
])


/* ---------------------------------------------------------------------
   E. Stage nâng cao
   --------------------------------------------------------------------- */

// $facet — chạy NHIỀU thống kê SONG SONG trong một lần quét dữ liệu
db.sach.aggregate([
  { $facet: {
      theoDanhMuc: [
        { $group: { _id: "$danhMuc", soSach: { $sum: 1 } } },
        { $sort: { soSach: -1 } }
      ],
      sachDatNhat: [
        { $sort: { giaBan: -1 } }, { $limit: 3 },
        { $project: { _id: 0, tenSach: 1, giaBan: 1 } }
      ],
      thongKeChung: [
        { $group: { _id: null, tongSach: { $sum: 1 },
                    tongTon: { $sum: "$soLuongTon" },
                    giaTB: { $avg: { $toDouble: "$giaBan" } } } }
      ]
  }}
])

// $bucket — chia sách theo khoảng giá (như CASE WHEN trong SQL)
db.sach.aggregate([
  { $bucket: {
      groupBy: { $toDouble: "$giaBan" },
      boundaries: [0, 60000, 150000, 300000, 1000000],
      default: "Khác",
      output: { soSach: { $sum: 1 }, danhSach: { $push: "$tenSach" } }
  }}
])

// $addFields — thêm trường tính toán mà không bỏ trường cũ
db.sach.aggregate([
  { $addFields: {
      giaTriTon: { $multiply: ["$soLuongTon", { $toDouble: "$giaBan" }] },
      tinhTrang: { $switch: { branches: [
          { case: { $eq:  ["$soLuongTon", 0] },  then: "Hết hàng" },
          { case: { $lt:  ["$soLuongTon", 30] }, then: "Sắp hết" }
        ], default: "Đủ hàng" } }
  }},
  { $project: { _id: 0, tenSach: 1, soLuongTon: 1, giaTriTon: 1, tinhTrang: 1 } },
  { $sort: { giaTriTon: -1 } }
])

// $setWindowFields — window function của MongoDB (5.0+)
// Doanh thu theo tháng + lũy kế
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$ngayDat" } },
              doanhThu: { $sum: { $toDouble: "$tongTien" } } } },
  { $sort: { _id: 1 } },
  { $setWindowFields: {
      sortBy: { _id: 1 },
      output: { luyKe: { $sum: "$doanhThu",
                         window: { documents: ["unbounded", "current"] } } }
  }}
])

// Top 2 sách bán chạy TRONG MỖI DANH MỤC ($rank + $partitionBy)
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $unwind: "$chiTiet" },
  { $group: { _id: "$chiTiet.maSach",
              tenSach: { $first: "$chiTiet.tenSach" },
              soBan: { $sum: "$chiTiet.soLuong" } } },
  { $lookup: { from: "sach", localField: "_id", foreignField: "_id", as: "s" } },
  { $unwind: "$s" },
  { $setWindowFields: {
      partitionBy: "$s.danhMuc",
      sortBy: { soBan: -1 },
      output: { hang: { $rank: {} } }
  }},
  { $match: { hang: { $lte: 2 } } },
  { $project: { _id: 0, danhMuc: "$s.danhMuc", tenSach: 1, soBan: 1, hang: 1 } },
  { $sort: { danhMuc: 1, hang: 1 } }
])


/* ---------------------------------------------------------------------
   F. Xem hiệu năng pipeline
   --------------------------------------------------------------------- */
db.donhang.aggregate([
  { $match: { trangThai: "HoanThanh" } },
  { $unwind: "$chiTiet" },
  { $group: { _id: "$chiTiet.maSach", soBan: { $sum: "$chiTiet.soLuong" } } }
], { explain: true })


/* =====================================================================
   BÀI TẬP TỰ LÀM
   ===================================================================== */

// 1. Đếm số sách theo từng danh mục, sắp xếp giảm dần.

// 2. Tính giá trung bình, cao nhất, thấp nhất theo danh mục.

// 3. Top 5 sách bán chạy nhất theo SỐ CUỐN.

// 4. Top 5 sách có DOANH THU cao nhất. (khác câu 3 thế nào? vì sao?)

// 5. Doanh thu theo tháng của năm 2025.

// 6. Top 3 khách hàng chi tiêu nhiều nhất (dùng thông tin nhúng khachHang).

// 7. Với mỗi tác giả: số đầu sách và tổng giá trị tồn kho.

// 8. Dùng $lookup nối donhang với khachhang, thống kê doanh thu theo thành phố
//    kèm email của khách chi nhiều nhất mỗi thành phố.

// 9. Điểm đánh giá trung bình của mỗi cuốn sách, kèm số lượt đánh giá.
//    Sách chưa ai đánh giá vẫn phải xuất hiện.

// 10. Sách nào có điểm trung bình >= 4.5 VÀ có ít nhất 2 lượt đánh giá?

// 11. Với mỗi nhà xuất bản (thongTinXB.nhaXuatBan): số đầu sách, tổng tồn kho.

// 12. Phân bố sách theo khoảng giá dùng $bucket, kèm tỉ lệ phần trăm.

// 13. Với mỗi khách hàng: số đơn, tổng chi, ngày mua gần nhất,
//     và phân loại VIP/Thường xuyên/Mới bằng $switch.

// 14. Tìm các CẶP SÁCH thường được mua cùng nhau trong một đơn.
//     Gợi ý: $unwind hai lần trên cùng mảng chiTiet, hoặc dùng $reduce.

// 15. So sánh: viết lại 3 truy vấn SQL từ buổi 6 sang Aggregation Pipeline,
//     đặt cạnh nhau và nhận xét cái nào dễ đọc hơn.
