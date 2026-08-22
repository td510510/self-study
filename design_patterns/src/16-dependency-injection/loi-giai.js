/**
 * LỜI GIẢI BÀI TẬP 16 — DEPENDENCY INJECTION
 * Chạy: node src/16-dependency-injection/loi-giai.js
 */

const daChamHeThongThat = { db: 0, email: 0 };

// ###########################################################################
// TODO 1 — Constructor Injection
// ###########################################################################
class DichVuDatHang {
  /**
   * Constructor = bản khai báo trung thực về mọi thứ class này cần.
   * Đọc 6 dòng này là biết class chạm vào những gì, không cần mở thân hàm.
   */
  constructor({ db, mailer, logger, dongHo, sinhMa, tinhPhiShip }) {
    // Kiểm tra ngay lúc DỰNG, chứ không phải lúc 3 giờ sáng khi có người bấm nút
    for (const [ten, gt] of Object.entries({ db, mailer, logger, dongHo, sinhMa, tinhPhiShip })) {
      if (!gt) throw new Error(`DichVuDatHang thiếu phụ thuộc bắt buộc: "${ten}"`);
    }
    Object.assign(this, { db, mailer, logger, dongHo, sinhMa, tinhPhiShip });
  }

  async dat(donHang) {
    // Logic nghiệp vụ giữ nguyên hoàn toàn — chỉ đổi CÁCH LẤY phụ thuộc
    if (!donHang.email) throw new Error("Đơn hàng phải có email");
    if (donHang.tongTien <= 0) throw new Error("Tổng tiền phải dương");

    const ma = this.sinhMa();
    const luc = this.dongHo.bayGio();
    const phiShip = this.tinhPhiShip(donHang);
    const tongCong = donHang.tongTien + phiShip;

    this.logger.ghi(`Tạo đơn ${ma}, tổng ${tongCong}`);
    const daLuu = await this.db.luu("don_hang", { ...donHang, ma, luc, phiShip, tongCong });
    await this.mailer.gui(donHang.email, `Đơn ${ma}: ${tongCong}đ`);

    return daLuu;
  }
}

// ###########################################################################
// TODO 2 — Các bản giả
// ###########################################################################
const taoDbGia = () => ({
  daLuu: [],
  async luu(bang, dl) {
    this.daLuu.push({ bang, dl });
    return { ...dl, id: this.daLuu.length };
  },
});
const taoMailerGia = () => ({
  daGui: [],
  async gui(den, nd) {
    this.daGui.push({ den, nd });
  },
});
const taoLoggerGia = () => ({ dong: [], ghi(s) { this.dong.push(s); } });
const dongHoGia = { bayGio: () => new Date("2026-03-15T10:00:00Z") };
const sinhMaGia = () => "DH-TEST-001";
const phiShipMacDinh = (don) => (don.tongTien >= 500_000 ? 0 : 30_000);

// ###########################################################################
// TODO 3 — Container DI có phát hiện phụ thuộc vòng
// ###########################################################################
class Container {
  #dangKy = new Map(); // ten -> { factory, dungChung }
  #instance = new Map(); // ten -> instance (chỉ cho dungChung)
  #dangGiaiQuyet = []; // ngăn xếp để phát hiện vòng

  dangKy(ten, factory) {
    this.#dangKy.set(ten, { factory, dungChung: false });
    return this;
  }

  dangKyDungChung(ten, factory) {
    this.#dangKy.set(ten, { factory, dungChung: true });
    return this;
  }

  lay(ten) {
    const muc = this.#dangKy.get(ten);
    if (!muc) {
      throw new Error(`Chưa đăng ký "${ten}". Đã có: ${[...this.#dangKy.keys()].join(", ") || "(trống)"}`);
    }

    if (muc.dungChung && this.#instance.has(ten)) return this.#instance.get(ten);

    // ⭐ Phát hiện phụ thuộc vòng: nếu "ten" đã nằm trong ngăn xếp đang giải
    // quyết, nghĩa là ta đang đi vòng lại chính nó.
    if (this.#dangGiaiQuyet.includes(ten)) {
      throw new Error(`Phụ thuộc vòng: ${[...this.#dangGiaiQuyet, ten].join(" → ")}`);
    }

    this.#dangGiaiQuyet.push(ten);
    try {
      const obj = muc.factory(this);
      if (muc.dungChung) this.#instance.set(ten, obj);
      return obj;
    } finally {
      this.#dangGiaiQuyet.pop(); // dọn cả khi ném lỗi
    }
  }
}

// ###########################################################################
// KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};
const nemLoi = async (f) => {
  try {
    await f();
    return false;
  } catch {
    return true;
  }
};

console.log("=== TEST 1: đặt hàng với phụ thuộc giả ===\n");
const db = taoDbGia();
const mailer = taoMailerGia();
const logger = taoLoggerGia();

const dv = new DichVuDatHang({
  db, mailer, logger,
  dongHo: dongHoGia,
  sinhMa: sinhMaGia,
  tinhPhiShip: phiShipMacDinh,
});
const kq = await dv.dat({ khach: "An", email: "an@example.com", tongTien: 350_000 });

ok("⭐ KHÔNG chạm database thật", daChamHeThongThat.db === 0);
ok("⭐ KHÔNG gửi email thật", daChamHeThongThat.email === 0);
ok("Mã đơn TẤT ĐỊNH", kq.ma === "DH-TEST-001", kq.ma);
ok("Thời gian TẤT ĐỊNH", kq.luc.toISOString() === "2026-03-15T10:00:00.000Z");
ok("Tính phí ship đúng (đơn 350k)", kq.phiShip === 30_000);
ok("Tổng cộng đúng", kq.tongCong === 380_000);
ok("Có gửi email tới đúng người", mailer.daGui[0].den === "an@example.com");
ok("Có ghi log", logger.dong.length === 1, logger.dong[0]);

ok("Vẫn chặn đơn thiếu email", await nemLoi(() => dv.dat({ khach: "X", tongTien: 100 })));
ok("Vẫn chặn tổng tiền <= 0", await nemLoi(() => dv.dat({ khach: "X", email: "a@b.c", tongTien: 0 })));

const dvFreeship = new DichVuDatHang({
  db, mailer, logger, dongHo: dongHoGia, sinhMa: sinhMaGia, tinhPhiShip: () => 0,
});
const kq2 = await dvFreeship.dat({ khach: "B", email: "b@x.com", tongTien: 100_000 });
ok("⭐ Thay chiến lược phí ship mà không sửa class", kq2.tongCong === 100_000);

tong++;
try {
  new DichVuDatHang({ db, mailer, logger });
  console.log("❌ Thiếu phụ thuộc — đáng lẽ phải ném lỗi ngay lúc dựng");
} catch (e) {
  dat++;
  console.log("✅ Thiếu phụ thuộc bị chặn NGAY LÚC DỰNG: " + e.message);
}

console.log("\n=== TEST 2: container DI ===\n");
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
  console.log("❌ Đáng lẽ phải ném lỗi");
} catch (e) {
  dat++;
  console.log("✅ " + e.message);
}

tong++;
const c2 = new Container();
c2.dangKy("a", (c) => ({ b: c.lay("b") }));
c2.dangKy("b", (c) => ({ a: c.lay("a") }));
try {
  c2.lay("a");
  console.log("❌ Đáng lẽ phải phát hiện vòng");
} catch (e) {
  dat++;
  console.log("✅ ⭐ " + e.message);
}

// Composition Root dùng container
console.log("\n=== TEST 3: Composition Root với container ===\n");
const app = new Container();
app.dangKyDungChung("db", () => taoDbGia());
app.dangKyDungChung("mailer", () => taoMailerGia());
app.dangKyDungChung("logger", () => taoLoggerGia());
app.dangKyDungChung("dongHo", () => dongHoGia);
app.dangKyDungChung("sinhMa", () => sinhMaGia);
app.dangKyDungChung("tinhPhiShip", () => phiShipMacDinh);
app.dangKy("dichVuDatHang", (c) => new DichVuDatHang({
  db: c.lay("db"),
  mailer: c.lay("mailer"),
  logger: c.lay("logger"),
  dongHo: c.lay("dongHo"),
  sinhMa: c.lay("sinhMa"),
  tinhPhiShip: c.lay("tinhPhiShip"),
}));

const dvTuContainer = app.lay("dichVuDatHang");
const kq3 = await dvTuContainer.dat({ khach: "C", email: "c@x.com", tongTien: 600_000 });
ok("Container lắp ráp được cả cây phụ thuộc", kq3.tongCong === 600_000, `phí ship: ${kq3.phiShip}`);
ok("⭐ Class DichVuDatHang KHÔNG hề biết container tồn tại",
  !DichVuDatHang.toString().includes("container"));

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Vì sao KHÔNG viết constructor(container)?

   1. MẤT LỢI ÍCH LỚN NHẤT CỦA DI.
      constructor({db, mailer, logger, dongHo, sinhMa, tinhPhiShip}) là
      TÀI LIỆU tự động. constructor(container) không nói gì cả — bạn lại
      phải đọc hết thân hàm để biết class cần gì. Chúng ta quay về đúng
      xuất phát điểm, chỉ khác là có thêm một tầng gián tiếp.

   2. TEST PHIỀN HƠN CẢ KHI KHÔNG CÓ DI.
      Trước: new DichVu({db: dbGia})
      Sau:   dựng container → đăng ký đúng 6 tên → truyền container vào
      Và nếu class gọi container.lay("mailer") mà bạn chỉ đăng ký "db",
      test sẽ đỏ với thông báo chẳng liên quan gì tới điều bạn đang test.

   3. LỖI CHUYỂN TỪ LÚC DỰNG SANG LÚC CHẠY.
      Gõ sai "mailer" thành "mailler" → không ai phát hiện cho tới khi
      dòng code đó thực sự chạy, có thể là trong môi trường thật.
      Với constructor injection, thiếu phụ thuộc lộ ra ngay lúc lắp ráp
      (xem test "Thiếu phụ thuộc bị chặn NGAY LÚC DỰNG" ở trên).

   4. (bonus) Class giờ phụ thuộc vào chính container — bạn không thể dùng
      lại class đó trong một dự án dùng container khác.

   📌 Mẫu này có tên riêng: SERVICE LOCATOR. Nó không phải DI, và trong
      hầu hết trường hợp nó là bước lùi.

      Phép thử một câu: ĐỌC CONSTRUCTOR CÓ BIẾT CLASS CẦN GÌ KHÔNG?

b) Constructor 6 phụ thuộc — có phải dấu hiệu xấu?
   → Là dấu hiệu ĐÁNG CHÚ Ý, nhưng chưa chắc là xấu, và quan trọng nhất:
     KHÔNG PHẢI LỖI CỦA DI. Class này vốn đã chạm vào 6 thứ; DI chỉ làm
     điều đó HIỆN RA. Trước khi refactor, nó vẫn chạm 6 thứ — chỉ là giấu.

     Khi nào thật sự cần tách:
       • Nếu các phụ thuộc chia thành nhóm rõ rệt mà không dùng chung nhau
         (db+logger cho việc lưu, mailer cho việc thông báo) → tách class.
       • Nếu quá 3-4 phụ thuộc là HẠ TẦNG (db, cache, queue, mailer, sms,
         push...) → gom vào một facade (Bài 07): new DichVu({ kho, thongBao }).

     Khi nào chấp nhận được:
       • dongHo và sinhMa không phải "phụ thuộc nghiệp vụ" — chúng chỉ là
         cách làm cho code TẤT ĐỊNH. Đếm chúng vào số phụ thuộc là hơi khắt khe.
       • tinhPhiShip là một Strategy, không phải một dịch vụ.

     📌 Đếm số phụ thuộc NGHIỆP VỤ thật sự: db, mailer, logger → 3. Ổn.

c) DI và Strategy có phải cùng một thứ không?
   → KHÔNG, dù về mặt code chúng trông giống hệt nhau. Khác ở MỤC ĐÍCH:

     STRATEGY (Bài 09) trả lời: "thuật toán nào?"
       → Nhiều lựa chọn cùng tồn tại và ĐỀU HỢP LỆ trong môi trường thật.
         Người dùng chọn GHTK hay GHN — cả hai đều là code chạy thật.
         Việc thay đổi là MỘT TÍNH NĂNG của sản phẩm.

     DI trả lời: "lấy phụ thuộc ở đâu?"
       → Trong môi trường thật thường chỉ có MỘT lựa chọn (một database,
         một mailer). Các lựa chọn khác tồn tại để TEST hoặc để đổi hạ tầng.
         Việc thay đổi là MỘT TÍNH CHẤT của kiến trúc.

     Trong bài tập này, tinhPhiShip đúng là Strategy được ĐƯA VÀO bằng DI.
     Hai khái niệm chồng lên nhau ở đây, và điều đó hoàn toàn bình thường:

     📌 DI là CƠ CHẾ (đưa phụ thuộc từ ngoài vào).
        Strategy là Ý ĐỒ (cho phép thay thuật toán).
        Bạn thường dùng DI để hiện thực hóa Strategy — nhưng DI còn dùng
        cho nhiều thứ khác, và Strategy có thể cài đặt không cần DI.
═══════════════════════════════════════════════════════════════`);
