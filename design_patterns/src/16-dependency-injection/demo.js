/**
 * BÀI 16 — DEPENDENCY INJECTION
 * Chạy: node src/16-dependency-injection/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — KHÔNG CÓ DI
// ###########################################################################

class KetNoiDB {
  static #instance = null;
  static layInstance() {
    if (!KetNoiDB.#instance) {
      console.log("      🔌 Mở kết nối database THẬT (tốn 200ms)");
      KetNoiDB.#instance = new KetNoiDB();
    }
    return KetNoiDB.#instance;
  }
  luu(bang, dl) {
    return { ...dl, id: 1 };
  }
}

class DichVuDonHangTe {
  async tao(donHang) {
    const db = KetNoiDB.layInstance(); // ← tự đi tìm — phụ thuộc BỊ GIẤU
    const ma = "DH" + Math.floor(Math.random() * 10000); // ← không tất định
    const luc = new Date(); // ← không tất định
    return db.luu("don_hang", { ...donHang, ma, luc });
  }
}

line("1. KHÔNG CÓ DI — nhìn signature không biết class cần gì");
console.log(`
   class DichVuDonHangTe {
     async tao(donHang) {
       const db = KetNoiDB.layInstance();     ← tự đi tìm
       const ma = "DH" + Math.random()...     ← không tất định
       const luc = new Date();                ← không tất định
     }
   }

   Bốn hậu quả:
     1. KHÔNG TEST ĐƯỢC — phải có database thật
     2. KHÔNG BIẾT PHỤ THUỘC — phải đọc hết thân hàm
     3. KHÔNG THAY ĐƯỢC — dev muốn dùng mailer giả? không có chỗ can thiệp
     4. THỨ TỰ KHỞI TẠO NGẦM — phải chạy sau khi DB kết nối, nhưng không ai ghi ra
`);
console.log("   Thử chạy:");
const teKq1 = await new DichVuDonHangTe().tao({ khach: "An" });
const teKq2 = await new DichVuDonHangTe().tao({ khach: "An" });
console.log(`      Lần 1: mã ${teKq1.ma}`);
console.log(`      Lần 2: mã ${teKq2.ma}  ← khác nhau mỗi lần chạy`);
console.log(`   👉 Làm sao viết test khẳng định "mã đơn phải là X"? KHÔNG THỂ.`);

// ###########################################################################
// PHẦN 2 — CÓ DI
// ###########################################################################

class DichVuDatHang {
  /**
   * Constructor là BẢN KHAI BÁO TRUNG THỰC: "tôi cần 5 thứ này để làm việc".
   * Người đọc code không cần mở thân hàm ra mới biết.
   */
  constructor({ db, mailer, logger, dongHo, sinhMa }) {
    this.db = db;
    this.mailer = mailer;
    this.logger = logger;
    this.dongHo = dongHo; // ← thay cho new Date()
    this.sinhMa = sinhMa; // ← thay cho Math.random()
  }

  async tao(donHang) {
    const ma = this.sinhMa();
    const luc = this.dongHo.bayGio();

    this.logger.ghi(`Tạo đơn ${ma}`);
    const daLuu = await this.db.luu("don_hang", { ...donHang, ma, luc });
    await this.mailer.gui(donHang.email, `Đơn ${ma} đã được tạo`);

    return daLuu;
  }
}

line("2. CÓ DI — phụ thuộc HIỆN RÕ trong constructor");

// ---- Các bản giả cho test ----
const taoDbGia = () => ({
  daLuu: [],
  async luu(bang, dl) {
    this.daLuu.push({ bang, dl });
    return { ...dl, id: this.daLuu.length };
  },
});
const taoMailerGia = () => ({
  daGui: [],
  async gui(den, noiDung) {
    this.daGui.push({ den, noiDung });
  },
});
const taoLoggerGia = () => ({ dong: [], ghi(s) { this.dong.push(s); } });

// ⭐ Điểm mấu chốt: đồng hồ và bộ sinh mã CỐ ĐỊNH → test tất định
const dongHoGia = { bayGio: () => new Date("2026-03-15T10:00:00Z") };
const sinhMaGia = () => "DH-TEST-001";

const db = taoDbGia();
const mailer = taoMailerGia();
const logger = taoLoggerGia();

const dichVu = new DichVuDatHang({ db, mailer, logger, dongHo: dongHoGia, sinhMa: sinhMaGia });

const kq = await dichVu.tao({ khach: "An", email: "an@example.com", tongTien: 350_000 });

console.log("\n   Kết quả (LẶP LẠI ĐƯỢC 100%):");
console.log("      ", kq);
console.log("\n   Kiểm chứng KHÔNG chạm hệ thống thật:");
console.log(`      DB nhận:     ${db.daLuu.length} bản ghi vào bảng "${db.daLuu[0].bang}"`);
console.log(`      Email gửi:   ${mailer.daGui.length} tới ${mailer.daGui[0].den}`);
console.log(`      Log ghi:     "${logger.dong[0]}"`);
console.log(`      Thời gian:   ${kq.luc.toISOString()}  ← cố định, test khẳng định được`);

console.log(`
   👉 Chạy 1000 lần đều ra CÙNG kết quả. Không mở database. Không gửi email.
      Test chạy trong 2ms thay vì 2 giây.`);

// ###########################################################################
// PHẦN 3 — TIÊM ĐỒNG HỒ: thứ đáng tiêm nhất mà ít người nghĩ tới
// ###########################################################################

line("3. ⭐ TIÊM ĐỒNG HỒ — thứ đáng tiêm nhất mà ít người nghĩ tới");

class DichVuKhuyenMai {
  constructor({ dongHo }) {
    this.dongHo = dongHo;
  }
  conHieuLuc(khuyenMai) {
    const now = this.dongHo.bayGio();
    return now >= khuyenMai.batDau && now <= khuyenMai.ketThuc;
  }
}

const km = { ten: "Sale Tết", batDau: new Date("2026-02-10"), ketThuc: new Date("2026-02-20") };

for (const ngay of ["2026-02-05", "2026-02-15", "2026-02-25"]) {
  const dv = new DichVuKhuyenMai({ dongHo: { bayGio: () => new Date(ngay) } });
  console.log(`   Ngày ${ngay}: khuyến mãi ${dv.conHieuLuc(km) ? "CÒN hiệu lực ✅" : "hết hiệu lực ⛔"}`);
}

console.log(`
   👉 Không tiêm đồng hồ thì test này chỉ chạy đúng trong 10 ngày của
      tháng 2/2026, rồi đỏ mãi mãi. Hoặc tệ hơn: nó XANH cho tới đúng
      ngày bạn không muốn nhất.

      Ba thứ đáng tiêm nhất mà người mới hay bỏ qua:
        ⏰ đồng hồ (new Date, Date.now)
        🎲 ngẫu nhiên (Math.random, uuid)
        🌐 mọi thứ ra ngoài (HTTP, file, DB, email)`);

// ###########################################################################
// PHẦN 4 — COMPOSITION ROOT
// ###########################################################################

line("4. COMPOSITION ROOT — nơi DUY NHẤT được lắp ráp");

function lapRapApp(moiTruong) {
  console.log(`\n   ── Môi trường: ${moiTruong} ──`);

  const db =
    moiTruong === "production"
      ? { async luu(b, d) { console.log(`      💾 Ghi vào PostgreSQL thật`); return d; } }
      : taoDbGia();

  const mailer =
    moiTruong === "production"
      ? { async gui(d, n) { console.log(`      📧 Gửi email THẬT qua SMTP`); } }
      : { async gui(d, n) { console.log(`      📭 [giả lập] email tới ${d}`); } };

  const logger =
    moiTruong === "production"
      ? { ghi: (s) => console.log(`      📒 [JSON log] ${JSON.stringify({ msg: s })}`) }
      : { ghi: (s) => console.log(`      📝 ${s}`) };

  const dongHo = { bayGio: () => new Date() };
  const sinhMa = () => "DH" + Math.floor(Math.random() * 10000);

  // ⭐ Class DichVuDatHang KHÔNG hề thay đổi giữa hai môi trường
  return new DichVuDatHang({ db, mailer, logger, dongHo, sinhMa });
}

await lapRapApp("development").tao({ khach: "An", email: "an@example.com" });
await lapRapApp("production").tao({ khach: "Bình", email: "binh@example.com" });

console.log(`
   👉 CÙNG MỘT class DichVuDatHang, hai hành vi hoàn toàn khác nhau —
      mà không có một dòng if (moiTruong === ...) nào bên trong nó.

   📌 QUY TẮC COMPOSITION ROOT:
      Chỉ ĐÚNG MỘT nơi trong toàn app được phép "đi lấy" và "lắp ráp".
      Mọi class khác chỉ NHẬN, không bao giờ ĐI TÌM.

      Đây chính là câu trả lời cho câu hỏi ở Bài 02:
      "làm sao vừa dùng chung một instance, vừa test được?"`);

// ###########################################################################
// PHẦN 5 — BẪY: SERVICE LOCATOR ĐỘI LỐT DI
// ###########################################################################

line("5. ⚠️  BẪY LỚN NHẤT — SERVICE LOCATOR ĐỘI LỐT DI");

console.log(`
   ❌ TRÔNG NHƯ DI, NHƯNG KHÔNG PHẢI:

       class DichVuDatHang {
         constructor(container) {          ← chỉ nhận MỘT thứ, trông rất gọn
           this.container = container;
         }
         async tao(don) {
           const db = this.container.get("db");        ← vẫn ĐI TÌM
           const mailer = this.container.get("mailer");
         }
       }

   Vì sao đây là bước lùi?
     • Nhìn constructor VẪN không biết class cần gì → mất lợi ích lớn nhất
     • Muốn test phải dựng cả container, đăng ký đúng tên → phiền hơn cả trước
     • Gõ sai "mailer" → lỗi lúc CHẠY, không phải lúc dựng object
     • Class giờ phụ thuộc vào chính cái container — một phụ thuộc mới, vô hình

   ✅ DI THẬT SỰ:
       constructor({ db, mailer, logger })    ← khai báo đầy đủ và trung thực

   📌 Phép thử: đọc constructor có biết class cần gì không?
      Không → đó là Service Locator, không phải Dependency Injection.`);
