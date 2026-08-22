/**
 * BÀI TẬP 02 — SINGLETON
 * Chạy: node src/02-singleton/bai-tap.js
 */

// ===========================================================================
// 📝 TODO 1 — Biến NhatKy thành Singleton
//
//   Yêu cầu:
//   a) new NhatKy() phải ném Error với thông báo hướng dẫn dùng layInstance()
//   b) NhatKy.layInstance() gọi bao nhiêu lần cũng trả về CÙNG một object
//   c) Giữ mảng lịch sử, có getter .lichSu trả về BẢN SAO (không cho sửa ngoài)
//
//   Gợi ý: static #instance, static #dangTao (xem demo.js phần 2)
// ===========================================================================

class NhatKy {
  constructor() {
    this.lichSuNoiBo = [];
  }

  static layInstance() {
    // TODO
    return new NhatKy();
  }

  ghi(mucDo, thongDiep) {
    const dong = `[${mucDo.toUpperCase()}] ${thongDiep}`;
    this.lichSuNoiBo.push(dong);
    return dong;
  }

  get lichSu() {
    return [...this.lichSuNoiBo];
  }

  // TODO 4a — thêm phương thức reset() xóa sạch lịch sử
}

// ---------------------------------------------------------------------------
// KIỂM CHỨNG 1 — hai module khác nhau lấy về cùng một object
// ---------------------------------------------------------------------------
function moduleThanhToan() {
  return NhatKy.layInstance();
}
function moduleGiaoHang() {
  return NhatKy.layInstance();
}

console.log("--- KIỂM CHỨNG 1: cùng một instance? ---");
console.log("Kết quả:", moduleThanhToan() === moduleGiaoHang(), "(phải là true)");

console.log("\n--- KIỂM CHỨNG 2: new bị chặn? ---");
try {
  new NhatKy();
  console.log("❌ Vẫn new được — chưa đạt yêu cầu");
} catch (e) {
  console.log("✅ " + e.message);
}

console.log("\n--- KIỂM CHỨNG 3: dữ liệu dùng chung? ---");
moduleThanhToan().ghi("info", "Thanh toán thành công #1001");
moduleGiaoHang().ghi("warn", "Chưa gán shipper cho #1001");
console.log(NhatKy.layInstance().lichSu);
console.log("(phải thấy CẢ HAI dòng)");

// ===========================================================================
// 📝 TODO 2 — PHẦN QUAN TRỌNG NHẤT CỦA BÀI
//
//   Dưới đây là 2 unit test. Chúng đang FAIL vì trạng thái rò rỉ.
//   Chạy thử để thấy test thứ hai fail.
// ===========================================================================

class DichVuDonHang {
  tao(ten) {
    NhatKy.layInstance().ghi("info", `Tạo đơn: ${ten}`); // phụ thuộc ẩn!
    return { ten };
  }
}

function chayTest(tenTest, ham) {
  const ok = ham();
  console.log(`   ${tenTest.padEnd(24)} ${ok ? "PASS ✅" : "FAIL ❌"}`);
}

console.log("\n--- CÁC UNIT TEST (đang lỗi) ---");
chayTest("test_taoDonGhiMotDongLog", () => {
  new DichVuDonHang().tao("Áo thun");
  return NhatKy.layInstance().lichSu.length === 1;
});
chayTest("test_taoDonKhacGhiMotDong", () => {
  new DichVuDonHang().tao("Quần jean");
  return NhatKy.layInstance().lichSu.length === 1;
});

// ===========================================================================
// 📝 TODO 3 — Sửa cho cả 2 test PASS bằng CÁCH 1: thêm reset()
//
//   Thêm NhatKy.layInstance().reset() vào đầu mỗi test.
//   Câu hỏi: nếu dự án có 500 test, ai đảm bảo không ai quên gọi reset()?
// ===========================================================================

// ===========================================================================
// 📝 TODO 4 — Sửa bằng CÁCH 2: bỏ singleton, truyền logger vào constructor
//
//   Viết class DichVuDonHangV2 nhận nhatKy qua constructor.
//   Viết lại 2 test dùng logger giả riêng cho từng test.
// ===========================================================================

// class DichVuDonHangV2 { ... }

// ===========================================================================
// 💭 CÂU HỎI CHỐT
//
//   a) Cách nào bạn thấy tốt hơn? Vì sao?
//      TRẢ LỜI: ..........................................................
//
//   b) Nhìn vào dòng `new DichVuDonHang().tao("Áo thun")`, một người mới vào
//      dự án có biết được class này ghi log không? Còn với V2 thì sao?
//      TRẢ LỜI: ..........................................................
//
//   c) Trong app THẬT (không phải test), bạn vẫn muốn cả hệ thống dùng chung
//      một logger. Làm sao vừa đạt điều đó vừa giữ được khả năng test?
//      TRẢ LỜI: ..........................................................
// ===========================================================================
