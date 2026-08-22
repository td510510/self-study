/**
 * BÀI TẬP 16 — DEPENDENCY INJECTION
 * Chạy: node src/16-dependency-injection/bai-tap.js
 */

// ###########################################################################
// HỆ THỐNG "THẬT" — không được dùng trong test
// ###########################################################################
export const daChamHeThongThat = { db: 0, email: 0 };

class KetNoiDBThat {
  static #instance = null;
  static layInstance() {
    if (!KetNoiDBThat.#instance) KetNoiDBThat.#instance = new KetNoiDBThat();
    return KetNoiDBThat.#instance;
  }
  async luu(bang, dl) {
    daChamHeThongThat.db++; // ← test chạm vào đây là TRƯỢT
    return { ...dl, id: 999 };
  }
}

class MailerThat {
  async gui(den, nd) {
    daChamHeThongThat.email++; // ← test chạm vào đây là TRƯỢT
  }
}

// ###########################################################################
// 📝 TODO 1 — REFACTOR class dưới đây sang Constructor Injection
//
//   Hiện tại nó "tự đi tìm" mọi thứ → không test được.
//   Cần tiêm: db, mailer, logger, dongHo, sinhMa, tinhPhiShip
//
//   ⚠️ Giữ nguyên LOGIC NGHIỆP VỤ, chỉ đổi cách lấy phụ thuộc.
// ###########################################################################

class DichVuDatHang {
  constructor() {
    // TODO: nhận phụ thuộc qua constructor
  }

  async dat(donHang) {
    // ❌ Những dòng dưới đây cần được thay bằng phụ thuộc đã tiêm
    const db = KetNoiDBThat.layInstance();
    const mailer = new MailerThat();
    const ma = "DH" + Math.floor(Math.random() * 100000);
    const luc = new Date();
    const phiShip = donHang.tongTien >= 500_000 ? 0 : 30_000;

    // ✅ Logic nghiệp vụ — GIỮ NGUYÊN
    if (!donHang.email) throw new Error("Đơn hàng phải có email");
    if (donHang.tongTien <= 0) throw new Error("Tổng tiền phải dương");

    const tongCong = donHang.tongTien + phiShip;
    console.log(`[log] Tạo đơn ${ma}, tổng ${tongCong}`);

    const daLuu = await db.luu("don_hang", { ...donHang, ma, luc, phiShip, tongCong });
    await mailer.gui(donHang.email, `Đơn ${ma}: ${tongCong}đ`);

    return daLuu;
  }
}

// ###########################################################################
// 📝 TODO 2 — Viết các bản GIẢ cho test
//
//   taoDbGia()      → { daLuu: [], async luu(bang, dl) }
//   taoMailerGia()  → { daGui: [], async gui(den, nd) }
//   taoLoggerGia()  → { dong: [], ghi(s) }
//   dongHoGia       → { bayGio: () => new Date("2026-03-15T10:00:00Z") }
//   sinhMaGia       → () => "DH-TEST-001"
// ###########################################################################

// ###########################################################################
// 📝 TODO 3 — Container DI đơn giản (NÂNG CAO)
//
//   c.dangKy("db", () => new Db())              — tạo mới mỗi lần lay()
//   c.dangKyDungChung("db", () => new Db())     — singleton
//   c.lay("db")
//   c.dangKy("a", (c) => new A(c.lay("b")))     — phụ thuộc lồng nhau
//
//   ⚠️ BẮT BUỘC: phát hiện PHỤ THUỘC VÒNG (a cần b, b cần a)
//      và ném lỗi nêu rõ đường đi của vòng: "a → b → a"
// ###########################################################################

class Container {
  constructor() {
    // TODO
  }
  dangKy(ten, factory) {
    // TODO
  }
  dangKyDungChung(ten, factory) {
    // TODO
  }
  lay(ten) {
    // TODO
  }
}

// ###########################################################################
// BỘ KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};

console.log("=== TEST 1: đặt hàng với phụ thuộc giả ===\n");
daChamHeThongThat.db = 0;
daChamHeThongThat.email = 0;

try {
  const db = { daLuu: [], async luu(bang, dl) { this.daLuu.push({ bang, dl }); return { ...dl, id: 1 }; } };
  const mailer = { daGui: [], async gui(den, nd) { this.daGui.push({ den, nd }); } };
  const logger = { dong: [], ghi(s) { this.dong.push(s); } };
  const dongHo = { bayGio: () => new Date("2026-03-15T10:00:00Z") };
  const sinhMa = () => "DH-TEST-001";
  const tinhPhiShip = (don) => (don.tongTien >= 500_000 ? 0 : 30_000);

  const dv = new DichVuDatHang({ db, mailer, logger, dongHo, sinhMa, tinhPhiShip });
  const kq = await dv.dat({ khach: "An", email: "an@example.com", tongTien: 350_000 });

  ok("⭐ KHÔNG chạm database thật", daChamHeThongThat.db === 0, `chạm ${daChamHeThongThat.db} lần`);
  ok("⭐ KHÔNG gửi email thật", daChamHeThongThat.email === 0, `gửi ${daChamHeThongThat.email} lần`);
  ok("Mã đơn TẤT ĐỊNH", kq.ma === "DH-TEST-001", String(kq.ma));
  ok("Thời gian TẤT ĐỊNH", kq.luc?.toISOString() === "2026-03-15T10:00:00.000Z", String(kq.luc));
  ok("Tính phí ship đúng (đơn 350k)", kq.phiShip === 30_000, String(kq.phiShip));
  ok("Tổng cộng đúng", kq.tongCong === 380_000, String(kq.tongCong));
  ok("Có gửi email tới đúng người", mailer.daGui[0]?.den === "an@example.com");
  ok("Có ghi log", logger.dong.length === 1, logger.dong.join(""));

  // Logic nghiệp vụ phải giữ nguyên
  const nemLoi = async (f) => { try { await f(); return false; } catch { return true; } };
  ok("Vẫn chặn đơn thiếu email",
    await nemLoi(() => dv.dat({ khach: "X", tongTien: 100 })));
  ok("Vẫn chặn tổng tiền <= 0",
    await nemLoi(() => dv.dat({ khach: "X", email: "a@b.c", tongTien: 0 })));

  // Thay chiến lược phí ship mà KHÔNG sửa class (nối lại Bài 09 — Strategy)
  const dvFreeship = new DichVuDatHang({
    db, mailer, logger, dongHo, sinhMa, tinhPhiShip: () => 0,
  });
  const kq2 = await dvFreeship.dat({ khach: "B", email: "b@x.com", tongTien: 100_000 });
  ok("⭐ Thay chiến lược phí ship mà không sửa class", kq2.tongCong === 100_000, String(kq2.tongCong));
} catch (e) {
  tong += 11;
  console.log("❌ Chưa làm TODO 1 — " + e.message);
}

console.log("\n=== TEST 2: container DI ===\n");
try {
  const c = new Container();
  c.dangKy("logger", () => ({ id: Math.random() }));
  ok("dangKy tạo MỚI mỗi lần lay()", c.lay("logger") !== c.lay("logger"));

  c.dangKyDungChung("db", () => ({ id: Math.random() }));
  ok("dangKyDungChung trả về CÙNG một instance", c.lay("db") === c.lay("db"));

  c.dangKyDungChung("repo", (c) => ({ db: c.lay("db") }));
  ok("Giải được phụ thuộc lồng nhau", c.lay("repo").db === c.lay("db"));

  tong++;
  try {
    c.lay("khong-ton-tai");
    console.log("❌ Tên không tồn tại — đáng lẽ phải ném lỗi");
  } catch (e) {
    dat++;
    console.log("✅ Tên không tồn tại bị chặn: " + e.message);
  }

  // ⭐ Phụ thuộc vòng
  tong++;
  const c2 = new Container();
  c2.dangKy("a", (c) => ({ b: c.lay("b") }));
  c2.dangKy("b", (c) => ({ a: c.lay("a") }));
  try {
    c2.lay("a");
    console.log("❌ Phụ thuộc vòng — đáng lẽ phải ném lỗi (hoặc đã tràn ngăn xếp)");
  } catch (e) {
    dat++;
    console.log("✅ ⭐ Phát hiện phụ thuộc vòng: " + e.message);
  }
} catch (e) {
  tong += 3;
  console.log("❌ Chưa làm TODO 3 — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Sau khi có Container, vì sao KHÔNG nên viết:
//         constructor(container) { this.container = container; }
//      Nêu ít nhất 3 lý do.
//      TRẢ LỜI: ...........................................................
//
//   b) Constructor của DichVuDatHang giờ nhận 6 phụ thuộc. Đó có phải là
//      dấu hiệu xấu không? Nếu có, sửa thế nào?
//      TRẢ LỜI: ...........................................................
//
//   c) Trong TEST 1 bạn tiêm cả tinhPhiShip. So sánh với Bài 09 — Strategy:
//      DI và Strategy có phải là hai tên gọi của cùng một thứ không?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
