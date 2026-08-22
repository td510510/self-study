/**
 * BÀI 02 — SINGLETON
 * Chạy: node src/02-singleton/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU: KHÔNG CÓ SINGLETON
// ###########################################################################

let soLanKetNoi = 0;

class KetNoiDBNgay {
  constructor(chuoiKetNoi) {
    soLanKetNoi++;
    this.chuoiKetNoi = chuoiKetNoi;
    this.id = soLanKetNoi;
    // Tưởng tượng dòng này tốn 200ms và chiếm 1 slot trong pool 20 kết nối
  }
}

line("1. KHÔNG CÓ SINGLETON — mỗi module tự tạo kết nối");
const dbTrongDonHang = new KetNoiDBNgay("postgres://localhost/shop");
const dbTrongNguoiDung = new KetNoiDBNgay("postgres://localhost/shop");
const dbTrongSanPham = new KetNoiDBNgay("postgres://localhost/shop");

console.log(`Đã mở ${soLanKetNoi} kết nối cho CÙNG một database.`);
console.log(`Cùng object không? ${dbTrongDonHang === dbTrongNguoiDung}`);
console.log("⚠️  Nhân với 30 module → vượt giới hạn pool → app sập.");

// ###########################################################################
// PHẦN 2 — SINGLETON KIỂU "SÁCH GIÁO KHOA"
// Dùng private static field (#) — bên ngoài không đụng vào được.
// ###########################################################################

class KetNoiDB {
  static #instance = null;
  static #dangTao = false;

  constructor(chuoiKetNoi) {
    if (!KetNoiDB.#dangTao) {
      throw new Error("Không được new KetNoiDB(). Hãy dùng KetNoiDB.layInstance()");
    }
    this.chuoiKetNoi = chuoiKetNoi;
    this.soCauTruyVan = 0;
    console.log(`   🔌 Thiết lập kết nối tới ${chuoiKetNoi} (tốn 200ms)`);
  }

  static layInstance() {
    if (!KetNoiDB.#instance) {
      KetNoiDB.#dangTao = true;
      KetNoiDB.#instance = new KetNoiDB("postgres://localhost/shop");
      KetNoiDB.#dangTao = false;
    }
    return KetNoiDB.#instance;
  }

  truyVan(sql) {
    this.soCauTruyVan++;
    return `[#${this.soCauTruyVan}] ${sql}`;
  }
}

line("2. SINGLETON — static instance");

// Giả lập 3 module khác nhau cùng cần database
function moduleDonHang() {
  return KetNoiDB.layInstance().truyVan("SELECT * FROM don_hang");
}
function moduleNguoiDung() {
  return KetNoiDB.layInstance().truyVan("SELECT * FROM nguoi_dung");
}
function moduleSanPham() {
  return KetNoiDB.layInstance().truyVan("SELECT * FROM san_pham");
}

console.log(moduleDonHang());
console.log(moduleNguoiDung());
console.log(moduleSanPham());
console.log(`\n✅ Chỉ thiết lập kết nối MỘT lần (chú ý dòng 🔌 chỉ in ra một lần).`);
console.log(`✅ Bộ đếm truy vấn dùng chung: cả 3 module cùng ghi vào một object.`);

console.log("\nThử new trực tiếp:");
try {
  new KetNoiDB("hack");
} catch (e) {
  console.log("   ⛔ " + e.message);
}

// ###########################################################################
// PHẦN 3 — CÁCH RẤT JAVASCRIPT: MODULE ESM
// (ở đây mô phỏng bằng closure trong cùng file; xem cauHinh.js cho bản thật)
// ###########################################################################

line("3. MODULE SINGLETON (cách nên dùng trong JS hiện đại)");
console.log("Xem file src/02-singleton/cauHinh.js — chỉ 5 dòng, không cần class.\n");

const { default: cauHinh } = await import("./cauHinh.js");
const { default: cauHinhLanHai } = await import("./cauHinh.js");

console.log("cauHinh.get('tenApp')       →", cauHinh.get("tenApp"));
console.log("Import 2 lần có cùng object?", cauHinh === cauHinhLanHai);
console.log("Số lần file cauHinh.js chạy:", cauHinh.soLanKhoiTao, "(luôn là 1)");

// ###########################################################################
// PHẦN 4 — VÌ SAO NÓ NGUY HIỂM: TRẠNG THÁI RÒ RỈ GIỮA CÁC TEST
// ###########################################################################

class NhatKy {
  static #instance = null;
  #lichSu = [];
  static layInstance() {
    if (!NhatKy.#instance) NhatKy.#instance = new NhatKy();
    return NhatKy.#instance;
  }
  ghi(msg) {
    this.#lichSu.push(msg);
  }
  get lichSu() {
    return [...this.#lichSu];
  }
}

class DichVuDonHang {
  tao(ten) {
    NhatKy.layInstance().ghi(`Tạo đơn: ${ten}`); // ← PHỤ THUỘC ẨN
    return { ten };
  }
}

line("4. ⚠️  TRẠNG THÁI RÒ RỈ GIỮA CÁC TEST");

function test_A() {
  new DichVuDonHang().tao("Áo thun");
  const so = NhatKy.layInstance().lichSu.length;
  console.log(`   test_A: kỳ vọng 1 dòng log, thực tế ${so} → ${so === 1 ? "PASS ✅" : "FAIL ❌"}`);
}

function test_B() {
  new DichVuDonHang().tao("Quần jean");
  const so = NhatKy.layInstance().lichSu.length;
  console.log(`   test_B: kỳ vọng 1 dòng log, thực tế ${so} → ${so === 1 ? "PASS ✅" : "FAIL ❌"}`);
}

test_A();
test_B();

console.log(`
👉 test_B fail KHÔNG PHẢI vì code sai, mà vì test_A đã để lại rác.
   Đổi thứ tự chạy test → test khác fail. Đây là loại bug tốn nhiều
   giờ nhất để truy tìm.

   Nhìn vào signature 'tao(ten)', bạn KHÔNG THỂ biết nó cần logger.
   Đó là điều Singleton che giấu — và là lý do nó bị gọi là anti-pattern.`);

// ###########################################################################
// PHẦN 5 — CÁCH LÀM ĐÚNG: MỘT INSTANCE, NHƯNG TRUYỀN VÀO
// ###########################################################################

class DichVuDonHangTot {
  constructor(nhatKy) {
    this.nhatKy = nhatKy; // ← phụ thuộc HIỆN RÕ trong signature
  }
  tao(ten) {
    this.nhatKy.ghi(`Tạo đơn: ${ten}`);
    return { ten };
  }
}

line("5. ✅ CÁCH LÀM ĐÚNG — một instance nhưng truyền vào");

function testTot(ten) {
  const nhatKyGia = { danhSach: [], ghi(m) { this.danhSach.push(m); } };
  new DichVuDonHangTot(nhatKyGia).tao(ten);
  const so = nhatKyGia.danhSach.length;
  console.log(`   test ${ten.padEnd(10)}: ${so} dòng log → ${so === 1 ? "PASS ✅" : "FAIL ❌"}`);
}

testTot("Áo thun");
testTot("Quần jean");
testTot("Giày");

console.log(`
👉 Mỗi test có logger riêng, sạch sẽ, không ảnh hưởng nhau.
   Trong app thật, main.js vẫn dùng MỘT logger dùng chung:

       import nhatKy from "./nhatKy.js";
       const dichVu = new DichVuDonHangTot(nhatKy);

   → Được cái tiện của singleton, mà không mất khả năng test.`);
