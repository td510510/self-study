/**
 * BÀI TẬP 11 — COMMAND
 * Chạy: node src/11-command/bai-tap.js
 */

// ###########################################################################
// RECEIVER — không cần sửa
// ###########################################################################
class VanBan {
  constructor(noiDung = "") {
    this.noiDung = noiDung;
  }
  chen(viTri, text) {
    this.noiDung = this.noiDung.slice(0, viTri) + text + this.noiDung.slice(viTri);
  }
  cat(tu, den) {
    const bi = this.noiDung.slice(tu, den);
    this.noiDung = this.noiDung.slice(0, tu) + this.noiDung.slice(den);
    return bi;
  }
  thay(tu, den, text) {
    const cu = this.noiDung.slice(tu, den);
    this.noiDung = this.noiDung.slice(0, tu) + text + this.noiDung.slice(den);
    return cu;
  }
}

// ###########################################################################
// 📝 TODO 1 — Bốn lệnh
//
//   Mỗi lệnh cần: .ten (chuỗi mô tả), .thucThi(), .hoanTac()
//
//   LenhChen(vanBan, viTri, text)     — khả nghịch bằng TÍNH TOÁN, không cần lưu gì
//   LenhXoa(vanBan, tu, den)          — phải lưu đoạn đã cắt
//   LenhThayThe(vanBan, tu, den, moi) — phải lưu đoạn cũ
//   LenhInHoa(vanBan, tu, den)        — ⚠️ MẤT THÔNG TIN, bắt buộc lưu bản cũ
//                                        ("iPhone" → "IPHONE" → toLowerCase → "iphone" ≠ gốc)
// ###########################################################################

class LenhChen {
  constructor(vanBan, viTri, text) {
    Object.assign(this, { vanBan, viTri, text });
    this.ten = `Chèn "${text}"`;
  }
  thucThi() {
    // TODO
  }
  hoanTac() {
    // TODO
  }
}

class LenhXoa {
  constructor(vanBan, tu, den) {
    Object.assign(this, { vanBan, tu, den });
    this.ten = `Xóa [${tu}..${den}]`;
  }
  thucThi() {
    // TODO
  }
  hoanTac() {
    // TODO
  }
}

class LenhThayThe {
  constructor(vanBan, tu, den, moi) {
    Object.assign(this, { vanBan, tu, den, moi });
    this.ten = `Thay [${tu}..${den}] → "${moi}"`;
  }
  thucThi() {
    // TODO
  }
  hoanTac() {
    // TODO
  }
}

class LenhInHoa {
  constructor(vanBan, tu, den) {
    Object.assign(this, { vanBan, tu, den });
    this.ten = `IN HOA [${tu}..${den}]`;
  }
  thucThi() {
    // TODO — nhớ lưu bản cũ TRƯỚC khi đổi
  }
  hoanTac() {
    // TODO
  }
}

// ###########################################################################
// 📝 TODO 2 — LenhGop (macro)
//
//   ⚠️ hoanTac() phải chạy NGƯỢC thứ tự các lệnh con.
//      Vì sao? Thử hình dung: chèn ở vị trí 0 rồi chèn ở vị trí 10.
//      Nếu hoàn tác theo đúng thứ tự, vị trí 10 đã lệch mất rồi.
// ###########################################################################

class LenhGop {
  constructor(ten, cacLenh) {
    this.ten = ten;
    this.cacLenh = cacLenh;
  }
  thucThi() {
    // TODO
  }
  hoanTac() {
    // TODO
  }
}

// ###########################################################################
// 📝 TODO 3 — LichSuLenh (Invoker)
//
//   chay(lenh)   → thực thi + đẩy vào ngăn xếp
//   hoanTac()    → trả về lệnh đã hoàn tác, hoặc null nếu hết
//   lamLai()     → trả về lệnh đã làm lại, hoặc null nếu hết
//
//   ⚠️ BẪY 1: chay() phải XÓA SẠCH ngăn xếp redo
//   ⚠️ BẪY 2: giới hạn 50 bước — bước thứ 51 đẩy bước cũ nhất ra
// ###########################################################################

class LichSuLenh {
  constructor(gioiHan = 50) {
    this.gioiHan = gioiHan;
    // TODO
  }
  chay(lenh) {
    // TODO
    return lenh;
  }
  hoanTac() {
    // TODO
    return null;
  }
  lamLai() {
    // TODO
    return null;
  }
  get soBuocDaLam() {
    return 0; // TODO
  }
  get soBuocRedo() {
    return 0; // TODO
  }
  get nhatKy() {
    return []; // TODO
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

console.log("=== TEST 1: từng lệnh hoàn tác đúng ===\n");
const thuLenh = (tenTest, noiDungGoc, taoLenh, mongDoiSauThucThi) => {
  const vb = new VanBan(noiDungGoc);
  const lenh = taoLenh(vb);
  try {
    lenh.thucThi();
    const sauThucThi = vb.noiDung;
    lenh.hoanTac();
    ok(`${tenTest}: thực thi đúng`, sauThucThi === mongDoiSauThucThi,
      `"${sauThucThi}" vs mong đợi "${mongDoiSauThucThi}"`);
    ok(`${tenTest}: hoàn tác về đúng bản gốc`, vb.noiDung === noiDungGoc,
      `"${vb.noiDung}" vs gốc "${noiDungGoc}"`);
  } catch (e) {
    tong += 2;
    console.log(`❌ ${tenTest} — ${e.message}`);
  }
};

thuLenh("LenhChen", "abc", (vb) => new LenhChen(vb, 1, "XY"), "aXYbc");
thuLenh("LenhXoa", "abcdef", (vb) => new LenhXoa(vb, 1, 3), "adef");
thuLenh("LenhThayThe", "abcdef", (vb) => new LenhThayThe(vb, 1, 3, "ZZZ"), "aZZZdef");
// ⚠️ Chú ý bản gốc có chữ thường lẫn chữ hoa — bẫy của LenhInHoa
thuLenh("LenhInHoa", "iPhone 15 Pro", (vb) => new LenhInHoa(vb, 0, 6), "IPHONE 15 Pro");

console.log("\n=== TEST 2: undo / redo ===\n");
try {
  const vb = new VanBan("abc");
  const ls = new LichSuLenh();
  ls.chay(new LenhChen(vb, 3, "-1"));
  ls.chay(new LenhChen(vb, 5, "-2"));
  ok("Sau 2 lệnh", vb.noiDung === "abc-1-2", vb.noiDung);

  ls.hoanTac();
  ok("Sau 1 undo", vb.noiDung === "abc-1", vb.noiDung);
  ls.hoanTac();
  ok("Sau 2 undo", vb.noiDung === "abc", vb.noiDung);
  ok("hoanTac() khi hết lịch sử trả về null", ls.hoanTac() === null);

  ls.lamLai();
  ok("Sau 1 redo", vb.noiDung === "abc-1", vb.noiDung);
} catch (e) {
  tong += 5;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 3: ⚠️ BẪY 1 — lệnh mới xóa nhánh redo ===\n");
try {
  const vb = new VanBan("abc");
  const ls = new LichSuLenh();
  ls.chay(new LenhChen(vb, 3, "-1"));
  ls.chay(new LenhChen(vb, 5, "-2"));
  ls.hoanTac();
  ls.hoanTac();
  ls.chay(new LenhChen(vb, 3, "-MOI"));
  ok("Chạy lệnh mới → redo bị xóa", ls.soBuocRedo === 0, `còn ${ls.soBuocRedo}`);
  ok("Ctrl+Y không làm gì nữa", ls.lamLai() === null);
  ok("Nội dung đúng", vb.noiDung === "abc-MOI", vb.noiDung);
} catch (e) {
  tong += 3;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 4: ⚠️ BẪY 2 — giới hạn lịch sử ===\n");
try {
  const vb = new VanBan("");
  const ls = new LichSuLenh(50);
  for (let i = 0; i < 60; i++) ls.chay(new LenhChen(vb, 0, "x"));
  ok("Lịch sử không vượt quá 50", ls.soBuocDaLam === 50, `hiện có ${ls.soBuocDaLam}`);
} catch (e) {
  tong++;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 5: macro ===\n");
try {
  const vb = new VanBan("tieu de");
  const ls = new LichSuLenh();
  const goc = vb.noiDung;
  ls.chay(
    new LenhGop("Định dạng", [
      new LenhInHoa(vb, 0, 4),
      new LenhChen(vb, 0, ">> "),
      new LenhChen(vb, 10, " <<"),
    ])
  );
  ok("Macro thực thi cả 3 lệnh", vb.noiDung === ">> TIEU de <<", `"${vb.noiDung}"`);
  ls.hoanTac();
  ok("⭐ Một lần undo hoàn tác cả macro", vb.noiDung === goc, `"${vb.noiDung}" vs "${goc}"`);
} catch (e) {
  tong += 2;
  console.log("❌ " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 📝 TODO 4 (NÂNG CAO) — PHÁT LẠI (Event Sourcing thu nhỏ)
//
//   1. Viết hàm ghiNhat(lenh) → object thuần { loai, ...tham số } (serialize được)
//   2. Viết hàm dungLai(vanBan, danhSachGhiNhat) → chạy lại toàn bộ
//   3. Chứng minh: soạn 5 lệnh trên văn bản A, ghi nhật ký, rồi phát lại
//      trên văn bản rỗng → kết quả GIỐNG HỆT A
//
//   Đây chính là ý tưởng của Event Sourcing và cách Git lưu lịch sử.
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) LenhChen không lưu gì, LenhInHoa phải lưu bản cũ. Quy tắc nào giúp
//      bạn quyết định lệnh nào cần lưu trạng thái?
//      TRẢ LỜI: ...........................................................
//
//   b) Người dùng xóa đoạn văn ở vị trí 100, rồi xóa đoạn ở vị trí 50.
//      Bấm Ctrl+Z hai lần. Có vấn đề gì với các chỉ số vị trí không?
//      TRẢ LỜI: ...........................................................
//
//   c) Nếu một lệnh là "gửi email cho khách", undo nên làm gì?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
