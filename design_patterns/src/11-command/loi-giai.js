/**
 * LỜI GIẢI BÀI TẬP 11 — COMMAND
 * Chạy: node src/11-command/loi-giai.js
 */

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
// TODO 1 — Bốn lệnh
// ###########################################################################

/** Khả nghịch bằng TÍNH TOÁN: biết vị trí và độ dài là đủ, không lưu gì. */
class LenhChen {
  constructor(vanBan, viTri, text) {
    Object.assign(this, { vanBan, viTri, text });
    this.ten = `Chèn "${text}"`;
  }
  thucThi() {
    this.vanBan.chen(this.viTri, this.text);
  }
  hoanTac() {
    this.vanBan.cat(this.viTri, this.viTri + this.text.length);
  }
  ghiNhat() {
    return { loai: "chen", viTri: this.viTri, text: this.text };
  }
}

/** Phải lưu PHẦN CHÊNH LỆCH — đoạn đã cắt. Vài chục byte, không phải cả file. */
class LenhXoa {
  constructor(vanBan, tu, den) {
    Object.assign(this, { vanBan, tu, den });
    this.daCat = null;
    this.ten = `Xóa [${tu}..${den}]`;
  }
  thucThi() {
    this.daCat = this.vanBan.cat(this.tu, this.den);
  }
  hoanTac() {
    this.vanBan.chen(this.tu, this.daCat);
  }
  ghiNhat() {
    return { loai: "xoa", tu: this.tu, den: this.den };
  }
}

class LenhThayThe {
  constructor(vanBan, tu, den, moi) {
    Object.assign(this, { vanBan, tu, den, moi });
    this.cu = null;
    this.ten = `Thay [${tu}..${den}] → "${moi}"`;
  }
  thucThi() {
    this.cu = this.vanBan.thay(this.tu, this.den, this.moi);
  }
  hoanTac() {
    // Chú ý: vùng cần thay giờ có độ dài của chuỗi MỚI, không phải cũ
    this.vanBan.thay(this.tu, this.tu + this.moi.length, this.cu);
  }
  ghiNhat() {
    return { loai: "thay", tu: this.tu, den: this.den, moi: this.moi };
  }
}

/**
 * ⚠️ inHoa() LÀM MẤT THÔNG TIN:
 *      "iPhone" → "IPHONE" → toLowerCase() → "iphone"  ≠  bản gốc
 *    Nên bắt buộc phải lưu bản cũ, không thể tính ngược.
 */
class LenhInHoa {
  constructor(vanBan, tu, den) {
    Object.assign(this, { vanBan, tu, den });
    this.banCu = null;
    this.ten = `IN HOA [${tu}..${den}]`;
  }
  thucThi() {
    this.banCu = this.vanBan.noiDung.slice(this.tu, this.den); // lưu TRƯỚC khi đổi
    this.vanBan.thay(this.tu, this.den, this.banCu.toUpperCase());
  }
  hoanTac() {
    this.vanBan.thay(this.tu, this.den, this.banCu);
  }
  ghiNhat() {
    return { loai: "inhoa", tu: this.tu, den: this.den };
  }
}

// ###########################################################################
// TODO 2 — Macro
// ###########################################################################
class LenhGop {
  constructor(ten, cacLenh) {
    this.ten = ten;
    this.cacLenh = cacLenh;
  }
  thucThi() {
    for (const l of this.cacLenh) l.thucThi();
  }
  hoanTac() {
    // ⚠️ NGƯỢC thứ tự. Nếu hoàn tác xuôi, các chỉ số vị trí sẽ lệch:
    // lệnh 2 chèn ở vị trí tính theo văn bản SAU lệnh 1.
    for (const l of [...this.cacLenh].reverse()) l.hoanTac();
  }
}

// ###########################################################################
// TODO 3 — Invoker
// ###########################################################################
class LichSuLenh {
  #daLam = [];
  #daHoanTac = [];

  constructor(gioiHan = 50) {
    this.gioiHan = gioiHan;
  }

  chay(lenh) {
    lenh.thucThi();
    this.#daLam.push(lenh);
    this.#daHoanTac = []; // ⚠️ BẪY 1: nhánh redo cũ đã vô nghĩa
    while (this.#daLam.length > this.gioiHan) this.#daLam.shift(); // ⚠️ BẪY 2
    return lenh;
  }

  hoanTac() {
    const lenh = this.#daLam.pop();
    if (!lenh) return null;
    lenh.hoanTac();
    this.#daHoanTac.push(lenh);
    return lenh;
  }

  lamLai() {
    const lenh = this.#daHoanTac.pop();
    if (!lenh) return null;
    lenh.thucThi();
    this.#daLam.push(lenh);
    return lenh;
  }

  get soBuocDaLam() {
    return this.#daLam.length;
  }
  get soBuocRedo() {
    return this.#daHoanTac.length;
  }
  get nhatKy() {
    return this.#daLam.map((l) => l.ten);
  }
  /** TODO 4: xuất nhật ký ra dạng lưu trữ được */
  get nhatKyGhiNhan() {
    return this.#daLam.filter((l) => l.ghiNhat).map((l) => l.ghiNhat());
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

console.log("=== TEST 1: từng lệnh hoàn tác đúng ===\n");
const thuLenh = (tenTest, goc, taoLenh, mongDoi) => {
  const vb = new VanBan(goc);
  const lenh = taoLenh(vb);
  lenh.thucThi();
  const sau = vb.noiDung;
  lenh.hoanTac();
  ok(`${tenTest}: thực thi đúng`, sau === mongDoi, `"${sau}"`);
  ok(`${tenTest}: hoàn tác về đúng bản gốc`, vb.noiDung === goc, `"${vb.noiDung}"`);
};

thuLenh("LenhChen  ", "abc", (vb) => new LenhChen(vb, 1, "XY"), "aXYbc");
thuLenh("LenhXoa   ", "abcdef", (vb) => new LenhXoa(vb, 1, 3), "adef");
thuLenh("LenhThayThe", "abcdef", (vb) => new LenhThayThe(vb, 1, 3, "ZZZ"), "aZZZdef");
thuLenh("LenhInHoa ", "iPhone 15 Pro", (vb) => new LenhInHoa(vb, 0, 6), "IPHONE 15 Pro");

console.log("\n   ⚠️  Chú ý test cuối: bản gốc là 'iPhone' (chữ P hoa giữa chừng).");
console.log("      Nếu hoàn tác bằng .toLowerCase() sẽ ra 'iphone' — SAI.");

console.log("\n=== TEST 2: undo / redo ===\n");
const vb2 = new VanBan("abc");
const ls2 = new LichSuLenh();
ls2.chay(new LenhChen(vb2, 3, "-1"));
ls2.chay(new LenhChen(vb2, 5, "-2"));
ok("Sau 2 lệnh", vb2.noiDung === "abc-1-2", vb2.noiDung);
ls2.hoanTac();
ok("Sau 1 undo", vb2.noiDung === "abc-1", vb2.noiDung);
ls2.hoanTac();
ok("Sau 2 undo", vb2.noiDung === "abc", vb2.noiDung);
ok("hoanTac() khi hết lịch sử trả về null", ls2.hoanTac() === null);
ls2.lamLai();
ok("Sau 1 redo", vb2.noiDung === "abc-1", vb2.noiDung);

console.log("\n=== TEST 3: ⚠️ BẪY 1 — lệnh mới xóa nhánh redo ===\n");
const vb3 = new VanBan("abc");
const ls3 = new LichSuLenh();
ls3.chay(new LenhChen(vb3, 3, "-1"));
ls3.chay(new LenhChen(vb3, 5, "-2"));
ls3.hoanTac();
ls3.hoanTac();
ls3.chay(new LenhChen(vb3, 3, "-MOI"));
ok("Chạy lệnh mới → redo bị xóa", ls3.soBuocRedo === 0);
ok("Ctrl+Y không làm gì nữa", ls3.lamLai() === null);
ok("Nội dung đúng", vb3.noiDung === "abc-MOI", vb3.noiDung);

console.log("\n=== TEST 4: ⚠️ BẪY 2 — giới hạn lịch sử ===\n");
const vb4 = new VanBan("");
const ls4 = new LichSuLenh(50);
for (let i = 0; i < 60; i++) ls4.chay(new LenhChen(vb4, 0, "x"));
ok("Lịch sử không vượt quá 50", ls4.soBuocDaLam === 50, `hiện có ${ls4.soBuocDaLam}`);

console.log("\n=== TEST 5: macro ===\n");
const vb5 = new VanBan("tieu de");
const ls5 = new LichSuLenh();
const goc5 = vb5.noiDung;
ls5.chay(
  new LenhGop("Định dạng", [
    new LenhInHoa(vb5, 0, 4),
    new LenhChen(vb5, 0, ">> "),
    new LenhChen(vb5, 10, " <<"),
  ])
);
ok("Macro thực thi cả 3 lệnh", vb5.noiDung === ">> TIEU de <<", `"${vb5.noiDung}"`);
ls5.hoanTac();
ok("⭐ Một lần undo hoàn tác cả macro", vb5.noiDung === goc5, `"${vb5.noiDung}"`);

// ###########################################################################
// TODO 4 — PHÁT LẠI (Event Sourcing thu nhỏ)
// ###########################################################################
console.log("\n=== TEST 6: ⭐ PHÁT LẠI TỪ NHẬT KÝ ===\n");

const TAO_LENH = {
  chen: (vb, g) => new LenhChen(vb, g.viTri, g.text),
  xoa: (vb, g) => new LenhXoa(vb, g.tu, g.den),
  thay: (vb, g) => new LenhThayThe(vb, g.tu, g.den, g.moi),
  inhoa: (vb, g) => new LenhInHoa(vb, g.tu, g.den),
};

function dungLai(vanBan, danhSachGhiNhat) {
  for (const g of danhSachGhiNhat) {
    const tao = TAO_LENH[g.loai];
    if (!tao) throw new Error(`Không biết loại lệnh: ${g.loai}`);
    tao(vanBan, g).thucThi();
  }
  return vanBan;
}

// Phiên làm việc gốc
const banGoc = new VanBan("");
const lsGoc = new LichSuLenh();
lsGoc.chay(new LenhChen(banGoc, 0, "hop dong lao dong"));
lsGoc.chay(new LenhInHoa(banGoc, 0, 8));
lsGoc.chay(new LenhChen(banGoc, 17, " so 42"));
lsGoc.chay(new LenhXoa(banGoc, 9, 13));
lsGoc.chay(new LenhThayThe(banGoc, 0, 8, "HỢP ĐỒNG"));

const nhatKyLuuTru = lsGoc.nhatKyGhiNhan;
console.log("   Nhật ký (JSON, lưu vào DB được):");
console.log("   " + JSON.stringify(nhatKyLuuTru));

// Dựng lại từ con số 0 — như khôi phục sau sự cố, hoặc mở lại file
const dungLaiTuNhatKy = dungLai(new VanBan(""), nhatKyLuuTru);

console.log(`\n   Bản gốc     : "${banGoc.noiDung}"`);
console.log(`   Phát lại    : "${dungLaiTuNhatKy.noiDung}"`);
ok("⭐ Phát lại từ nhật ký cho kết quả GIỐNG HỆT",
  dungLaiTuNhatKy.noiDung === banGoc.noiDung);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Khi nào lệnh cần lưu trạng thái cũ?
   → Quy tắc một câu: NẾU PHÉP TOÁN LÀM MẤT THÔNG TIN, PHẢI LƯU.

     Cách kiểm tra: từ kết quả, bạn có tính ngược ra đầu vào được không?

       chen("XY")   → biết vị trí + độ dài là cắt lại được    → KHÔNG cần lưu
       cong(5)      → tru(5)                                  → KHÔNG cần lưu
       xoa(1,3)     → nội dung đã biến mất khỏi bộ nhớ        → PHẢI lưu
       inHoa()      → "iPhone"→"IPHONE", không biết chữ nào   → PHẢI lưu
                      vốn là hoa, chữ nào vốn là thường
       nhanVoi(0)   → mọi số đều thành 0                      → PHẢI lưu

     Đây là lý do trường hợp test dùng "iPhone 15 Pro" chứ không dùng
     "hello". Với "hello", hoàn tác bằng toLowerCase() vẫn đúng — và bạn
     sẽ tưởng code mình chuẩn cho tới khi gặp dữ liệu thật.

     📌 Bài học phụ về testing: dữ liệu test phải chọn để LÀM LỘ bug,
        không phải để code chạy qua.

b) Xóa ở vị trí 100 rồi xóa ở vị trí 50 — chỉ số có vấn đề gì?
   → CÓ, và đây là bug kinh điển của mọi trình soạn thảo tự viết.

     Sau khi xóa ở vị trí 50, mọi thứ phía sau dịch trái. Vị trí 100 trong
     lệnh thứ nhất giờ trỏ vào một chỗ khác. Nếu hoàn tác SAI THỨ TỰ, hoặc
     nếu lệnh lưu tọa độ tuyệt đối và văn bản bị sửa ở giữa, kết quả sẽ sai.

     Ba giải pháp:
       1. Luôn hoàn tác NGƯỢC thứ tự (lời giải này làm vậy) — đủ cho undo
          tuyến tính một người dùng.
       2. Dùng "neo" (marker) thay vì chỉ số tuyệt đối — neo tự dịch theo
          khi văn bản đổi. Đây là cách các editor thật làm.
       3. Operational Transform hoặc CRDT — cần khi có NHIỀU người sửa
          cùng lúc (Google Docs, Figma). Phức tạp hơn hẳn.

c) Undo lệnh "gửi email" thì làm gì?
   → Không thể đảo ngược. Email đã nằm trong hộp thư người nhận.

     Ba hướng xử lý thực tế:
       1. HOÃN THỰC THI: xếp email vào hàng đợi với độ trễ 10 giây. Trong
          10 giây đó, undo = hủy khỏi hàng đợi (thật sự đảo ngược được).
          Đây chính là tính năng "Hoàn tác gửi" của Gmail.
       2. HÀNH ĐỘNG BÙ TRỪ: gửi email đính chính. Không xóa được quá khứ,
          nhưng sửa được hậu quả.
       3. ĐÁNH DẤU KHÔNG THỂ HOÀN TÁC: lenh.coTheHoanTac = false, và giao
          diện làm mờ nút Undo. Thà nói thật với người dùng còn hơn để họ
          bấm Undo rồi tưởng email đã được thu hồi.

     ⚠️ Điều tệ nhất là để undo "có vẻ như" thành công trong khi thực tế
        không. Người dùng sẽ tin vào một trạng thái không tồn tại.
═══════════════════════════════════════════════════════════════`);
