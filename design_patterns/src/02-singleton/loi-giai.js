/**
 * LỜI GIẢI BÀI TẬP 02 — SINGLETON
 * Chạy: node src/02-singleton/loi-giai.js
 */

// ===========================================================================
// TODO 1 — Singleton đúng chuẩn
// ===========================================================================
class NhatKy {
  static #instance = null;
  static #dangTao = false;

  #lichSu = [];

  constructor() {
    if (!NhatKy.#dangTao) {
      throw new Error("Không được new NhatKy(). Hãy dùng NhatKy.layInstance()");
    }
  }

  static layInstance() {
    if (!NhatKy.#instance) {
      NhatKy.#dangTao = true;
      NhatKy.#instance = new NhatKy();
      NhatKy.#dangTao = false;
    }
    return NhatKy.#instance;
  }

  ghi(mucDo, thongDiep) {
    const dong = `[${mucDo.toUpperCase()}] ${thongDiep}`;
    this.#lichSu.push(dong);
    return dong;
  }

  get lichSu() {
    return [...this.#lichSu]; // trả về BẢN SAO — bên ngoài không sửa được mảng gốc
  }

  reset() {
    this.#lichSu = [];
  }
}

// ---------------------------------------------------------------------------
// KIỂM CHỨNG
// ---------------------------------------------------------------------------
console.log("--- KIỂM CHỨNG 1: cùng một instance? ---");
console.log("Kết quả:", NhatKy.layInstance() === NhatKy.layInstance(), "(mong đợi: true)");

console.log("\n--- KIỂM CHỨNG 2: new bị chặn? ---");
try {
  new NhatKy();
  console.log("❌ Vẫn new được");
} catch (e) {
  console.log("✅ " + e.message);
}

console.log("\n--- KIỂM CHỨNG 3: dữ liệu dùng chung ---");
NhatKy.layInstance().ghi("info", "Thanh toán thành công #1001");
NhatKy.layInstance().ghi("warn", "Chưa gán shipper cho #1001");
console.log(NhatKy.layInstance().lichSu);

console.log("\n--- KIỂM CHỨNG 4: lichSu là bản sao, không sửa được từ ngoài ---");
const banSao = NhatKy.layInstance().lichSu;
banSao.push("HACK");
console.log("Sau khi push vào bản sao, độ dài gốc:", NhatKy.layInstance().lichSu.length, "(vẫn là 2)");

// ===========================================================================
// CÁCH 1 — Dùng reset() trước mỗi test
// ===========================================================================
class DichVuDonHang {
  tao(ten) {
    NhatKy.layInstance().ghi("info", `Tạo đơn: ${ten}`);
    return { ten };
  }
}

const chayTest = (ten, ham) =>
  console.log(`   ${ten.padEnd(28)} ${ham() ? "PASS ✅" : "FAIL ❌"}`);

console.log("\n═══ CÁCH 1: gọi reset() trước mỗi test ═══");
chayTest("test_taoDonGhiMotDongLog", () => {
  NhatKy.layInstance().reset(); // ← phải NHỚ gọi
  new DichVuDonHang().tao("Áo thun");
  return NhatKy.layInstance().lichSu.length === 1;
});
chayTest("test_taoDonKhacGhiMotDong", () => {
  NhatKy.layInstance().reset(); // ← và nhớ ở MỌI test
  new DichVuDonHang().tao("Quần jean");
  return NhatKy.layInstance().lichSu.length === 1;
});
console.log("   ⚠️  Với 500 test, chỉ cần MỘT người quên → bug lúc nửa đêm.");

// ===========================================================================
// CÁCH 2 — Bỏ singleton, truyền phụ thuộc vào (Dependency Injection)
// ===========================================================================
class DichVuDonHangV2 {
  constructor(nhatKy) {
    this.nhatKy = nhatKy; // phụ thuộc HIỆN RÕ ngay ở signature
  }
  tao(ten) {
    this.nhatKy.ghi("info", `Tạo đơn: ${ten}`);
    return { ten };
  }
}

// Logger giả cho test — không cần singleton, không cần reset
const taoNhatKyGia = () => ({
  danhSach: [],
  ghi(mucDo, td) {
    this.danhSach.push(`[${mucDo.toUpperCase()}] ${td}`);
  },
  get lichSu() {
    return this.danhSach;
  },
});

console.log("\n═══ CÁCH 2: truyền logger vào constructor ═══");
chayTest("test_V2_taoDonGhiMotDong", () => {
  const nhatKyGia = taoNhatKyGia(); // mỗi test một logger sạch, tự nhiên
  new DichVuDonHangV2(nhatKyGia).tao("Áo thun");
  return nhatKyGia.lichSu.length === 1;
});
chayTest("test_V2_taoDonKhacGhiMotDong", () => {
  const nhatKyGia = taoNhatKyGia();
  new DichVuDonHangV2(nhatKyGia).tao("Quần jean");
  return nhatKyGia.lichSu.length === 1;
});
chayTest("test_V2_kiemTraNoiDungLog", () => {
  const nhatKyGia = taoNhatKyGia();
  new DichVuDonHangV2(nhatKyGia).tao("Giày");
  // Bonus: giờ ta còn KIỂM TRA ĐƯỢC nội dung log — điều rất khó làm với singleton
  return nhatKyGia.lichSu[0] === "[INFO] Tạo đơn: Giày";
});

// ===========================================================================
// TRONG APP THẬT — vẫn dùng chung một logger, mà không mất khả năng test
// ===========================================================================
console.log("\n═══ APP THẬT: module singleton + truyền từ trên xuống ═══");

// Ở dự án thật, đây là nội dung file nhatKy.js:
//     const lichSu = [];
//     export default { ghi: (m, t) => lichSu.push(...) };
// Import ở đâu cũng là CÙNG một object — miễn phí, không cần class.

const nhatKyToanCuc = taoNhatKyGia(); // đóng vai instance từ module

// main.js — nơi DUY NHẤT trong toàn bộ app "đi lấy" singleton
const dichVuDonHang = new DichVuDonHangV2(nhatKyToanCuc);
const dichVuGiaoHang = new DichVuDonHangV2(nhatKyToanCuc);

dichVuDonHang.tao("Áo khoác");
dichVuGiaoHang.tao("Mũ lưỡi trai");
console.log("   Log dùng chung:", nhatKyToanCuc.lichSu);

console.log(`
═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI CHỐT

a) Cách nào tốt hơn?
   → CÁCH 2 (truyền vào). reset() chỉ là băng dán lên vết thương: nó bắt
     MỌI test phải nhớ một nghi thức, và ngôn ngữ không có cách nào ép ai
     phải nhớ. Cách 2 làm cho việc "quên" trở nên bất khả thi — mỗi test
     bắt buộc phải tự cung cấp logger.

   Ngoại lệ: nếu bạn đang tiếp quản codebase cũ có 200 chỗ dùng singleton,
   reset() là bước trung gian hợp lý trước khi refactor dần.

b) Người mới vào dự án có biết DichVuDonHang ghi log không?
   → V1: KHÔNG. Phải đọc hết thân hàm mới biết. Phụ thuộc bị GIẤU.
   → V2: CÓ, ngay từ dòng "constructor(nhatKy)". Constructor trở thành
     bản khai báo trung thực: "tôi cần những thứ này để làm việc".

     Đây là lợi ích lớn nhất mà người mới hay bỏ qua: DI không chỉ để test,
     nó còn là TÀI LIỆU tự động về phụ thuộc của một class.

c) Vừa dùng chung vừa test được?
   → Dùng module ESM để có một instance duy nhất (miễn phí, không cần class),
     NHƯNG chỉ "đi lấy" nó ở đúng một nơi: điểm khởi động (main.js), rồi
     TRUYỀN xuống các tầng dưới. Mẫu này gọi là Composition Root.

     Sai:  mọi class tự gọi NhatKy.layInstance()
     Đúng: main.js import nhatKy → new DichVu(nhatKy) → new Repo(nhatKy)
═══════════════════════════════════════════════════════════════`);
