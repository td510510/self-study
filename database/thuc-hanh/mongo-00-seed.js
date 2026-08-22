/* =====================================================================
   BookStore — Dữ liệu mẫu cho MongoDB
   Chạy: mongosh "mongodb://localhost:27017/BookStore" --file mongo-00-seed.js
   Docker: mongosh "mongodb://student:student123@localhost:27017/BookStore?authSource=admin" --file mongo-00-seed.js

   THIẾT KẾ — các quyết định nhúng / tham chiếu:
   ---------------------------------------------------------------------
   sach.tacGia          -> NHÚNG mảng tên (ít, luôn đọc cùng sách,
                           hiếm khi đổi). Nếu cần trang riêng cho tác giả
                           thì phải chuyển sang tham chiếu.
   sach.thongTinXB      -> NHÚNG object (thuộc tính con của chính cuốn sách)
   donhang.khachHang    -> NHÚNG BẢN CHỤP (hóa đơn phải giữ đúng thông tin
                           tại thời điểm đặt) + giữ maKH để $lookup khi cần
   donhang.chiTiet      -> NHÚNG mảng (số lượng có hạn, luôn đọc cùng đơn,
                           KHÔNG đổi sau khi chốt đơn)
   danhgia              -> COLLECTION RIÊNG (tăng vô hạn theo thời gian,
                           được đọc/ghi độc lập với sách)
   ===================================================================== */

// ---------------------------------------------------------------------
// 0. Dọn dẹp để chạy lại được nhiều lần
// ---------------------------------------------------------------------
db.sach.drop();
db.khachhang.drop();
db.donhang.drop();
db.danhgia.drop();

// ---------------------------------------------------------------------
// 1. SÁCH — chú ý document thứ 3 và 20 có trường RIÊNG (schema linh hoạt)
// ---------------------------------------------------------------------
db.sach.insertMany([
  { _id: 1,  isbn: "978-604-1-00001-1", tenSach: "Nhà giả kim", danhMuc: "Tiểu thuyết",
    giaBan: NumberDecimal("79000"), soLuongTon: 120, tacGia: ["Paulo Coelho"],
    thongTinXB: { nhaXuatBan: "NXB Hội Nhà Văn", nam: 2020, soTrang: 228 },
    tags: ["bestseller", "triết lý", "phiêu lưu"] },

  { _id: 2,  isbn: "978-604-1-00002-8", tenSach: "Đắc nhân tâm", danhMuc: "Kỹ năng sống",
    giaBan: NumberDecimal("88000"), soLuongTon: 200, tacGia: ["Dale Carnegie"],
    thongTinXB: { nhaXuatBan: "NXB Tổng Hợp", nam: 2019, soTrang: 320 },
    tags: ["bestseller", "giao tiếp"] },

  { _id: 3,  isbn: "978-604-1-00003-5", tenSach: "Sapiens: Lược sử loài người", danhMuc: "Khoa học",
    giaBan: NumberDecimal("189000"), soLuongTon: 45, tacGia: ["Yuval Noah Harari"],
    thongTinXB: { nhaXuatBan: "NXB Thế Giới", nam: 2021, soTrang: 554 },
    tags: ["lịch sử", "bestseller"],
    giaiThuong: ["Sách hay 2015", "Top 10 Amazon"] },       // <- trường riêng

  { _id: 4,  isbn: "978-604-1-00004-2", tenSach: "Homo Deus: Lược sử tương lai", danhMuc: "Khoa học",
    giaBan: NumberDecimal("199000"), soLuongTon: 30, tacGia: ["Yuval Noah Harari"],
    thongTinXB: { nhaXuatBan: "NXB Thế Giới", nam: 2022, soTrang: 500 }, tags: ["tương lai"] },

  { _id: 5,  isbn: "978-604-1-00005-9", tenSach: "Mắt biếc", danhMuc: "Tiểu thuyết",
    giaBan: NumberDecimal("95000"), soLuongTon: 85, tacGia: ["Nguyễn Nhật Ánh"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2018, soTrang: 288 }, tags: ["việt nam", "tình cảm"] },

  { _id: 6,  isbn: "978-604-1-00006-6", tenSach: "Cho tôi xin một vé đi tuổi thơ", danhMuc: "Tiểu thuyết",
    giaBan: NumberDecimal("72000"), soLuongTon: 150, tacGia: ["Nguyễn Nhật Ánh"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2017, soTrang: 208 }, tags: ["việt nam", "tuổi thơ"] },

  { _id: 7,  isbn: "978-604-1-00007-3", tenSach: "Chí Phèo", danhMuc: "Truyện ngắn",
    giaBan: NumberDecimal("45000"), soLuongTon: 60, tacGia: ["Nam Cao"],
    thongTinXB: { nhaXuatBan: "NXB Văn Học", nam: 2015, soTrang: 120 }, tags: ["kinh điển", "việt nam"] },

  { _id: 8,  isbn: "978-604-1-00008-0", tenSach: "Lão Hạc", danhMuc: "Truyện ngắn",
    giaBan: NumberDecimal("42000"), soLuongTon: 0, tacGia: ["Nam Cao"],
    thongTinXB: { nhaXuatBan: "NXB Văn Học", nam: 2015, soTrang: 96 }, tags: ["kinh điển", "việt nam"] },

  { _id: 9,  isbn: "978-604-1-00009-7", tenSach: "Cha giàu cha nghèo", danhMuc: "Kinh tế",
    giaBan: NumberDecimal("129000"), soLuongTon: 95, tacGia: ["Robert Kiyosaki"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2020, soTrang: 290 }, tags: ["tài chính", "bestseller"] },

  { _id: 10, isbn: "978-604-1-00010-3", tenSach: "Dạy con làm giàu", danhMuc: "Kinh tế",
    giaBan: NumberDecimal("145000"), soLuongTon: 40, tacGia: ["Robert Kiyosaki"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2019, soTrang: 350 }, tags: ["tài chính"] },

  { _id: 11, isbn: "978-604-1-00011-0", tenSach: "Lược sử thời gian", danhMuc: "Khoa học",
    giaBan: NumberDecimal("165000"), soLuongTon: 25, tacGia: ["Stephen Hawking"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2021, soTrang: 272 }, tags: ["vật lý", "vũ trụ"] },

  { _id: 12, isbn: "978-604-1-00012-7", tenSach: "Hoàng tử bé", danhMuc: "Thiếu nhi",
    giaBan: NumberDecimal("68000"), soLuongTon: 180, tacGia: ["Antoine de Saint-Exupéry"],
    thongTinXB: { nhaXuatBan: "NXB Kim Đồng", nam: 2020, soTrang: 112 }, tags: ["kinh điển", "thiếu nhi"] },

  { _id: 13, isbn: "978-604-1-00013-4", tenSach: "Dế Mèn phiêu lưu ký", danhMuc: "Thiếu nhi",
    giaBan: NumberDecimal("55000"), soLuongTon: 210, tacGia: ["Tô Hoài"],
    thongTinXB: { nhaXuatBan: "NXB Kim Đồng", nam: 2019, soTrang: 144 }, tags: ["việt nam", "thiếu nhi"] },

  { _id: 14, isbn: "978-604-1-00014-1", tenSach: "Refactoring", danhMuc: "Công nghệ thông tin",
    giaBan: NumberDecimal("450000"), soLuongTon: 15,
    tacGia: ["Martin Fowler", "Robert C. Martin"],            // <- 2 tác giả
    thongTinXB: { nhaXuatBan: "Addison-Wesley", nam: 2019, soTrang: 448 }, tags: ["lập trình"] },

  { _id: 15, isbn: "978-604-1-00015-8", tenSach: "Clean Code", danhMuc: "Công nghệ thông tin",
    giaBan: NumberDecimal("420000"), soLuongTon: 22, tacGia: ["Robert C. Martin"],
    thongTinXB: { nhaXuatBan: "Prentice Hall", nam: 2018, soTrang: 464 }, tags: ["lập trình", "bestseller"] },

  { _id: 16, isbn: "978-604-1-00016-5", tenSach: "Clean Architecture", danhMuc: "Công nghệ thông tin",
    giaBan: NumberDecimal("460000"), soLuongTon: 8, tacGia: ["Robert C. Martin"],
    thongTinXB: { nhaXuatBan: "Prentice Hall", nam: 2020, soTrang: 432 }, tags: ["lập trình", "kiến trúc"] },

  { _id: 17, isbn: "978-604-1-00017-2", tenSach: "Cánh đồng bất tận", danhMuc: "Truyện ngắn",
    giaBan: NumberDecimal("65000"), soLuongTon: 70, tacGia: ["Nguyễn Ngọc Tư"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2016, soTrang: 216 }, tags: ["việt nam"] },

  { _id: 18, isbn: "978-604-1-00018-9", tenSach: "Tôi thấy hoa vàng trên cỏ xanh", danhMuc: "Tiểu thuyết",
    giaBan: NumberDecimal("98000"), soLuongTon: 110, tacGia: ["Nguyễn Nhật Ánh"],
    thongTinXB: { nhaXuatBan: "NXB Trẻ", nam: 2018, soTrang: 378 }, tags: ["việt nam", "tuổi thơ"] },

  { _id: 19, isbn: "978-604-1-00019-6", tenSach: "Quẳng gánh lo đi và vui sống", danhMuc: "Kỹ năng sống",
    giaBan: NumberDecimal("92000"), soLuongTon: 65, tacGia: ["Dale Carnegie"],
    thongTinXB: { nhaXuatBan: "NXB Tổng Hợp", nam: 2020, soTrang: 300 }, tags: ["tâm lý"] },

  { _id: 20, tenSach: "Nhà giả kim (bản đặc biệt bìa cứng)", danhMuc: "Tiểu thuyết",
    giaBan: NumberDecimal("250000"), soLuongTon: 5, tacGia: ["Paulo Coelho"],
    thongTinXB: { nhaXuatBan: "NXB Hội Nhà Văn", nam: 2023, soTrang: 228 },
    tags: ["sưu tầm", "bìa cứng"],
    banDacBiet: { soLuongPhatHanh: 500, coChuKy: true } }     // <- KHÔNG có isbn, có trường riêng
]);

// ---------------------------------------------------------------------
// 2. KHÁCH HÀNG — địa chỉ NHÚNG (ít, luôn đọc cùng khách)
// ---------------------------------------------------------------------
db.khachhang.insertMany([
  { _id: 1,  hoTen: "Trần Thị Bích",   email: "bich.tran@email.vn",  sdt: "0901234567",
    diaChi: { thanhPho: "Hà Nội",    chiTiet: "12 Trần Duy Hưng" },
    ngayDangKy: ISODate("2024-01-15"), diemTichLuy: 350 },
  { _id: 2,  hoTen: "Lê Văn Cường",    email: "cuong.le@email.vn",   sdt: "0912345678",
    diaChi: { thanhPho: "Đà Nẵng",   chiTiet: "45 Nguyễn Văn Linh" },
    ngayDangKy: ISODate("2024-02-20"), diemTichLuy: 120 },
  { _id: 3,  hoTen: "Phạm Thu Hà",     email: "ha.pham@email.vn",    sdt: "0923456789",
    diaChi: { thanhPho: "Hà Nội",    chiTiet: "8 Láng Hạ" },
    ngayDangKy: ISODate("2024-03-05"), diemTichLuy: 890 },
  { _id: 4,  hoTen: "Nguyễn Minh Đức", email: "duc.nguyen@email.vn", sdt: "0934567890",
    diaChi: { thanhPho: "TP.HCM",    chiTiet: "220 Lê Văn Sỹ" },
    ngayDangKy: ISODate("2024-03-18"), diemTichLuy: 45 },
  { _id: 5,  hoTen: "Hoàng Thị Lan",   email: "lan.hoang@email.vn",  sdt: "0945678901",
    diaChi: { thanhPho: "TP.HCM",    chiTiet: "77 Điện Biên Phủ" },
    ngayDangKy: ISODate("2024-04-02"), diemTichLuy: 610 },
  { _id: 7,  hoTen: "Đỗ Thùy Linh",    email: "linh.do@email.vn",    sdt: "0967890123",
    diaChi: { thanhPho: "Hà Nội",    chiTiet: "33 Kim Mã" },
    ngayDangKy: ISODate("2024-06-25"), diemTichLuy: 275 },
  { _id: 8,  hoTen: "Bùi Quang Huy",   email: "huy.bui@email.vn",
    diaChi: { thanhPho: "Cần Thơ",   chiTiet: "5 Hòa Bình" },
    ngayDangKy: ISODate("2024-07-08"), diemTichLuy: 90 },      // <- KHÔNG có sdt
  { _id: 9,  hoTen: "Ngô Thị Mai",     email: "mai.ngo@email.vn",    sdt: "0989012345",
    diaChi: { thanhPho: "Đà Nẵng",   chiTiet: "101 Bạch Đằng" },
    ngayDangKy: ISODate("2024-08-14"), diemTichLuy: 430 },
  { _id: 10, hoTen: "Trịnh Văn Sơn",   email: "son.trinh@email.vn",  sdt: "0990123456",
    diaChi: { thanhPho: "TP.HCM",    chiTiet: "62 Cách Mạng Tháng 8" },
    ngayDangKy: ISODate("2024-09-30"), diemTichLuy: 155 },
  { _id: 12, hoTen: "Đặng Hoàng Long", email: "long.dang@email.vn",  sdt: "0902222333",
    diaChi: { thanhPho: "Huế",       chiTiet: "14 Lê Lợi" },
    ngayDangKy: ISODate("2025-02-17"), diemTichLuy: 700 },
  { _id: 14, hoTen: "Chu Văn Thắng",   email: "thang.chu@email.vn",  sdt: "0904444555",
    diaChi: { thanhPho: "Hà Nội",    chiTiet: "27 Xuân Thủy" },
    ngayDangKy: ISODate("2025-06-01"), diemTichLuy: 310 },
  { _id: 15, hoTen: "Tạ Thị Hồng",     email: "hong.ta@email.vn",
    diaChi: { thanhPho: "Nha Trang" },
    ngayDangKy: ISODate("2025-07-19"), diemTichLuy: 0 }        // <- chưa mua gì
]);

// ---------------------------------------------------------------------
// 3. ĐƠN HÀNG — khachHang và chiTiet đều NHÚNG
// ---------------------------------------------------------------------
function ct(maSach, tenSach, donGia, soLuong) {
  return { maSach, tenSach, donGia: NumberDecimal(String(donGia)), soLuong };
}

db.donhang.insertMany([
  { maDH: 1000, maKH: 1, ngayDat: ISODate("2025-01-05"), trangThai: "HoanThanh",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Trần Thị Bích", sdt: "0901234567", thanhPho: "Hà Nội" },
    chiTiet: [ ct(1, "Nhà giả kim", 79000, 2), ct(2, "Đắc nhân tâm", 88000, 1) ],
    tongTien: NumberDecimal("246000") },

  { maDH: 1001, maKH: 1, ngayDat: ISODate("2025-02-11"), trangThai: "HoanThanh",
    phuongThucTT: "ChuyenKhoan",
    khachHang: { hoTen: "Trần Thị Bích", sdt: "0901234567", thanhPho: "Hà Nội" },
    chiTiet: [ ct(3, "Sapiens: Lược sử loài người", 189000, 1) ],
    tongTien: NumberDecimal("189000") },

  { maDH: 1002, maKH: 2, ngayDat: ISODate("2025-02-18"), trangThai: "HoanThanh",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Lê Văn Cường", sdt: "0912345678", thanhPho: "Đà Nẵng" },
    chiTiet: [ ct(1, "Nhà giả kim", 79000, 1), ct(12, "Hoàng tử bé", 68000, 2) ],
    tongTien: NumberDecimal("215000") },

  { maDH: 1003, maKH: 3, ngayDat: ISODate("2025-03-02"), trangThai: "HoanThanh",
    phuongThucTT: "The",
    khachHang: { hoTen: "Phạm Thu Hà", sdt: "0923456789", thanhPho: "Hà Nội" },
    chiTiet: [ ct(9, "Cha giàu cha nghèo", 129000, 1), ct(10, "Dạy con làm giàu", 145000, 1),
               ct(2, "Đắc nhân tâm", 88000, 1) ],
    tongTien: NumberDecimal("362000") },

  { maDH: 1004, maKH: 3, ngayDat: ISODate("2025-03-20"), trangThai: "HoanThanh",
    phuongThucTT: "The",
    khachHang: { hoTen: "Phạm Thu Hà", sdt: "0923456789", thanhPho: "Hà Nội" },
    chiTiet: [ ct(14, "Refactoring", 450000, 1) ],
    tongTien: NumberDecimal("450000") },

  { maDH: 1005, maKH: 3, ngayDat: ISODate("2025-04-08"), trangThai: "HoanThanh",
    phuongThucTT: "ViDienTu",
    khachHang: { hoTen: "Phạm Thu Hà", sdt: "0923456789", thanhPho: "Hà Nội" },
    chiTiet: [ ct(15, "Clean Code", 420000, 1), ct(16, "Clean Architecture", 460000, 1) ],
    tongTien: NumberDecimal("880000") },

  { maDH: 1006, maKH: 4, ngayDat: ISODate("2025-04-15"), trangThai: "Huy",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Nguyễn Minh Đức", sdt: "0934567890", thanhPho: "TP.HCM" },
    chiTiet: [ ct(5, "Mắt biếc", 95000, 1) ],
    tongTien: NumberDecimal("95000") },

  { maDH: 1007, maKH: 5, ngayDat: ISODate("2025-04-27"), trangThai: "HoanThanh",
    phuongThucTT: "ChuyenKhoan",
    khachHang: { hoTen: "Hoàng Thị Lan", sdt: "0945678901", thanhPho: "TP.HCM" },
    chiTiet: [ ct(3, "Sapiens: Lược sử loài người", 189000, 1),
               ct(4, "Homo Deus: Lược sử tương lai", 199000, 1) ],
    tongTien: NumberDecimal("388000") },

  { maDH: 1008, maKH: 5, ngayDat: ISODate("2025-05-09"), trangThai: "HoanThanh",
    phuongThucTT: "ChuyenKhoan",
    khachHang: { hoTen: "Hoàng Thị Lan", sdt: "0945678901", thanhPho: "TP.HCM" },
    chiTiet: [ ct(11, "Lược sử thời gian", 165000, 2) ],
    tongTien: NumberDecimal("330000") },

  { maDH: 1010, maKH: 7, ngayDat: ISODate("2025-06-03"), trangThai: "HoanThanh",
    phuongThucTT: "ViDienTu",
    khachHang: { hoTen: "Đỗ Thùy Linh", sdt: "0967890123", thanhPho: "Hà Nội" },
    chiTiet: [ ct(18, "Tôi thấy hoa vàng trên cỏ xanh", 98000, 1),
               ct(6, "Cho tôi xin một vé đi tuổi thơ", 72000, 1), ct(5, "Mắt biếc", 95000, 1) ],
    tongTien: NumberDecimal("265000") },

  { maDH: 1011, maKH: 7, ngayDat: ISODate("2025-06-21"), trangThai: "HoanThanh",
    phuongThucTT: "ViDienTu",
    khachHang: { hoTen: "Đỗ Thùy Linh", sdt: "0967890123", thanhPho: "Hà Nội" },
    chiTiet: [ ct(13, "Dế Mèn phiêu lưu ký", 55000, 4) ],
    tongTien: NumberDecimal("220000") },

  { maDH: 1012, maKH: 8, ngayDat: ISODate("2025-07-02"), trangThai: "HoanThanh",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Bùi Quang Huy", thanhPho: "Cần Thơ" },
    chiTiet: [ ct(2, "Đắc nhân tâm", 88000, 2), ct(19, "Quẳng gánh lo đi và vui sống", 92000, 1) ],
    tongTien: NumberDecimal("268000") },

  { maDH: 1013, maKH: 9, ngayDat: ISODate("2025-07-14"), trangThai: "HoanThanh",
    phuongThucTT: "The",
    khachHang: { hoTen: "Ngô Thị Mai", sdt: "0989012345", thanhPho: "Đà Nẵng" },
    chiTiet: [ ct(17, "Cánh đồng bất tận", 65000, 1), ct(7, "Chí Phèo", 45000, 1),
               ct(8, "Lão Hạc", 42000, 1) ],
    tongTien: NumberDecimal("152000") },

  { maDH: 1014, maKH: 9, ngayDat: ISODate("2025-08-01"), trangThai: "HoanThanh",
    phuongThucTT: "The",
    khachHang: { hoTen: "Ngô Thị Mai", sdt: "0989012345", thanhPho: "Đà Nẵng" },
    chiTiet: [ ct(1, "Nhà giả kim", 79000, 1),
               ct(20, "Nhà giả kim (bản đặc biệt bìa cứng)", 250000, 1) ],
    tongTien: NumberDecimal("329000") },

  { maDH: 1015, maKH: 10, ngayDat: ISODate("2025-08-19"), trangThai: "HoanThanh",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Trịnh Văn Sơn", sdt: "0990123456", thanhPho: "TP.HCM" },
    chiTiet: [ ct(9, "Cha giàu cha nghèo", 129000, 2) ],
    tongTien: NumberDecimal("258000") },

  { maDH: 1016, maKH: 12, ngayDat: ISODate("2025-09-05"), trangThai: "HoanThanh",
    phuongThucTT: "ChuyenKhoan",
    khachHang: { hoTen: "Đặng Hoàng Long", sdt: "0902222333", thanhPho: "Huế" },
    chiTiet: [ ct(15, "Clean Code", 420000, 1), ct(14, "Refactoring", 450000, 1),
               ct(16, "Clean Architecture", 460000, 1) ],
    tongTien: NumberDecimal("1330000") },

  { maDH: 1017, maKH: 12, ngayDat: ISODate("2025-10-11"), trangThai: "HoanThanh",
    phuongThucTT: "ChuyenKhoan",
    khachHang: { hoTen: "Đặng Hoàng Long", sdt: "0902222333", thanhPho: "Huế" },
    chiTiet: [ ct(3, "Sapiens: Lược sử loài người", 189000, 2),
               ct(11, "Lược sử thời gian", 165000, 1) ],
    tongTien: NumberDecimal("543000") },

  { maDH: 1018, maKH: 14, ngayDat: ISODate("2025-11-08"), trangThai: "HoanThanh",
    phuongThucTT: "ViDienTu",
    khachHang: { hoTen: "Chu Văn Thắng", sdt: "0904444555", thanhPho: "Hà Nội" },
    chiTiet: [ ct(6, "Cho tôi xin một vé đi tuổi thơ", 72000, 2), ct(12, "Hoàng tử bé", 68000, 1),
               ct(13, "Dế Mèn phiêu lưu ký", 55000, 1) ],
    tongTien: NumberDecimal("267000") },

  { maDH: 1019, maKH: 1, ngayDat: ISODate("2025-12-15"), trangThai: "HoanThanh",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Trần Thị Bích", sdt: "0901234567", thanhPho: "Hà Nội" },
    chiTiet: [ ct(1, "Nhà giả kim", 79000, 1),
               ct(18, "Tôi thấy hoa vàng trên cỏ xanh", 98000, 2) ],
    tongTien: NumberDecimal("275000") },

  { maDH: 1020, maKH: 3, ngayDat: ISODate("2026-01-09"), trangThai: "DangGiao",
    phuongThucTT: "The",
    khachHang: { hoTen: "Phạm Thu Hà", sdt: "0923456789", thanhPho: "Hà Nội" },
    chiTiet: [ ct(4, "Homo Deus: Lược sử tương lai", 199000, 1),
               ct(3, "Sapiens: Lược sử loài người", 189000, 1) ],
    tongTien: NumberDecimal("388000") },

  { maDH: 1024, maKH: 14, ngayDat: ISODate("2026-03-25"), trangThai: "Moi",
    phuongThucTT: "COD",
    khachHang: { hoTen: "Chu Văn Thắng", sdt: "0904444555", thanhPho: "Hà Nội" },
    chiTiet: [ ct(12, "Hoàng tử bé", 68000, 3), ct(13, "Dế Mèn phiêu lưu ký", 55000, 2) ],
    tongTien: NumberDecimal("314000") }
]);

// ---------------------------------------------------------------------
// 4. ĐÁNH GIÁ — collection RIÊNG (tăng vô hạn -> tham chiếu)
// ---------------------------------------------------------------------
db.danhgia.insertMany([
  { maSach: 1,  maKH: 1,  soSao: 5, binhLuan: "Cuốn sách thay đổi cách tôi nhìn cuộc sống.", ngay: ISODate("2025-01-20") },
  { maSach: 2,  maKH: 1,  soSao: 4, binhLuan: "Nhiều lời khuyên hữu ích, đôi chỗ hơi dài dòng.", ngay: ISODate("2025-01-22") },
  { maSach: 3,  maKH: 1,  soSao: 5, binhLuan: "Xuất sắc, đáng đọc lại nhiều lần.", ngay: ISODate("2025-02-25") },
  { maSach: 1,  maKH: 2,  soSao: 4, binhLuan: "Hay nhưng bản dịch có vài chỗ khó hiểu.", ngay: ISODate("2025-03-01") },
  { maSach: 12, maKH: 2,  soSao: 5, binhLuan: "Mua cho con, cháu rất thích.", ngay: ISODate("2025-03-02") },
  { maSach: 9,  maKH: 3,  soSao: 5, binhLuan: "Nên đọc từ khi còn trẻ.", ngay: ISODate("2025-03-10") },
  { maSach: 10, maKH: 3,  soSao: 3, binhLuan: "Nội dung lặp lại nhiều so với cuốn trước.", ngay: ISODate("2025-03-11") },
  { maSach: 14, maKH: 3,  soSao: 5, binhLuan: "Kinh điển cho lập trình viên.", ngay: ISODate("2025-03-28") },
  { maSach: 15, maKH: 3,  soSao: 5, binhLuan: "Đọc xong code sạch hẳn lên.", ngay: ISODate("2025-04-15") },
  { maSach: 16, maKH: 3,  soSao: 4, binhLuan: "Hơi lý thuyết, cần kinh nghiệm mới thấm.", ngay: ISODate("2025-04-16") },
  { maSach: 3,  maKH: 5,  soSao: 5, binhLuan: "Góc nhìn mới mẻ về lịch sử loài người.", ngay: ISODate("2025-05-02") },
  { maSach: 4,  maKH: 5,  soSao: 4, binhLuan: "Không hay bằng Sapiens nhưng vẫn đáng đọc.", ngay: ISODate("2025-05-03") },
  { maSach: 11, maKH: 5,  soSao: 5, binhLuan: "Vật lý mà đọc như tiểu thuyết.", ngay: ISODate("2025-05-20") },
  { maSach: 18, maKH: 7,  soSao: 5, binhLuan: "Tuổi thơ ùa về.", ngay: ISODate("2025-06-10") },
  { maSach: 6,  maKH: 7,  soSao: 4, binhLuan: "Nhẹ nhàng, dễ thương.", ngay: ISODate("2025-06-11") },
  { maSach: 13, maKH: 7,  soSao: 5, binhLuan: "Kinh điển thiếu nhi Việt Nam.", ngay: ISODate("2025-06-30") },
  { maSach: 2,  maKH: 8,  soSao: 2, binhLuan: "Sách giao đến bị rách bìa, nội dung thì ổn.", ngay: ISODate("2025-07-10") },
  { maSach: 17, maKH: 9,  soSao: 5, binhLuan: "Văn Nguyễn Ngọc Tư quá đẹp và buồn.", ngay: ISODate("2025-07-20") },
  { maSach: 7,  maKH: 9,  soSao: 4, binhLuan: "Tác phẩm để đời.", ngay: ISODate("2025-07-21") },
  { maSach: 9,  maKH: 10, soSao: 4, binhLuan: "Tư duy tài chính cơ bản, dễ hiểu.", ngay: ISODate("2025-08-25") },
  { maSach: 15, maKH: 12, soSao: 5, binhLuan: "Bắt buộc phải có trên giá sách.", ngay: ISODate("2025-09-15") },
  { maSach: 3,  maKH: 12, soSao: 4, binhLuan: "Dày nhưng cuốn.", ngay: ISODate("2025-10-20") }
]);

// ---------------------------------------------------------------------
// 5. INDEX
// ---------------------------------------------------------------------
db.sach.createIndex({ danhMuc: 1, giaBan: -1 });
db.sach.createIndex({ tacGia: 1 });
db.sach.createIndex({ isbn: 1 }, { unique: true, sparse: true });  // sparse: bỏ qua doc không có isbn
db.sach.createIndex({ tenSach: "text" });
db.donhang.createIndex({ maKH: 1, ngayDat: -1 });
db.donhang.createIndex({ trangThai: 1 });
db.donhang.createIndex({ "chiTiet.maSach": 1 });
db.danhgia.createIndex({ maSach: 1, maKH: 1 }, { unique: true });

// ---------------------------------------------------------------------
// 6. KIỂM TRA
// ---------------------------------------------------------------------
print("=== Đã nạp xong dữ liệu BookStore cho MongoDB ===");
print("sach:      " + db.sach.countDocuments());       // 20
print("khachhang: " + db.khachhang.countDocuments());  // 12
print("donhang:   " + db.donhang.countDocuments());    // 21
print("danhgia:   " + db.danhgia.countDocuments());    // 22
