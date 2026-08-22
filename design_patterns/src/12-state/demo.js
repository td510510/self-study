/**
 * BÀI 12 — STATE
 * Chạy: node src/12-state/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU
// ###########################################################################

line("1. CÁI ĐAU — 4 phương thức × 5 trạng thái = 20 nhánh if");
console.log(`
   huy() {
     if (tt === "cho-thanh-toan")      { ... }
     else if (tt === "dang-chuan-bi")  { ... }
     else if (tt === "dang-giao")      { throw ... }
     else if (tt === "da-giao")        { throw ... }
     else if (tt === "da-huy")         { throw ... }
   }
   giaoHang()       { lại 5 nhánh }
   hoanTien()       { lại 5 nhánh }
   capNhatDiaChi()  { lại 5 nhánh }

   ⚠️  Vấn đề LỚN NHẤT không phải là dài, mà là:
       SƠ ĐỒ CHUYỂN TRẠNG THÁI BỊ ẨN trong 20 nhánh if.
       Không ai nhìn code mà vẽ lại được nó.
       Thêm trạng thái "đang khiếu nại" → sửa cả 4 phương thức, quên 1 là bug.`);

// ###########################################################################
// PHẦN 2 — MỖI TRẠNG THÁI LÀ MỘT CLASS
// ###########################################################################

/** Lớp cơ sở: mặc định MỌI hành động đều bị cấm, kèm thông báo rõ nghĩa. */
class TrangThaiCoSo {
  get ten() {
    return this.constructor.name;
  }
  #cam(hanhDong) {
    throw new Error(`Không thể "${hanhDong}" khi đơn đang ở trạng thái "${this.nhan}"`);
  }
  thanhToan(don) {
    this.#cam("thanh toán");
  }
  giaoHang(don) {
    this.#cam("giao hàng");
  }
  xacNhanNhan(don) {
    this.#cam("xác nhận nhận hàng");
  }
  huy(don) {
    this.#cam("hủy");
  }
  capNhatDiaChi(don, diaChi) {
    this.#cam("cập nhật địa chỉ");
  }
  khiVao(don) {} // hook: chạy khi BƯỚC VÀO trạng thái này
}

class ChoThanhToan extends TrangThaiCoSo {
  nhan = "Chờ thanh toán";
  thanhToan(don) {
    don.chuyenSang(new DangChuanBi());
  }
  huy(don) {
    don.chuyenSang(new DaHuy("khách hủy trước khi thanh toán"));
  }
  capNhatDiaChi(don, diaChi) {
    don.diaChi = diaChi; // giai đoạn này còn sửa được
  }
}

class DangChuanBi extends TrangThaiCoSo {
  nhan = "Đang chuẩn bị hàng";
  khiVao(don) {
    don.ghiNhat("📦 Giữ hàng trong kho");
  }
  giaoHang(don) {
    don.chuyenSang(new DangGiao());
  }
  huy(don) {
    don.ghiNhat("↩️  Nhả hàng đã giữ về kho");
    don.chuyenSang(new DaHuy("khách hủy khi đang chuẩn bị"));
  }
  capNhatDiaChi(don, diaChi) {
    don.diaChi = diaChi;
  }
}

class DangGiao extends TrangThaiCoSo {
  nhan = "Đang giao";
  khiVao(don) {
    don.maVanDon = "VD" + Math.random().toString(36).slice(2, 8).toUpperCase();
    don.ghiNhat(`🚚 Tạo vận đơn ${don.maVanDon}`);
  }
  xacNhanNhan(don) {
    don.chuyenSang(new DaGiao());
  }
  // huy() và capNhatDiaChi() KHÔNG được định nghĩa
  // → lớp cơ sở tự động ném lỗi rõ nghĩa. Không thể quên xử lý.
}

class DaGiao extends TrangThaiCoSo {
  nhan = "Đã giao";
  khiVao(don) {
    don.ghiNhat("⭐ Cộng điểm thành viên");
  }
}

class DaHuy extends TrangThaiCoSo {
  nhan = "Đã hủy";
  constructor(lyDo) {
    super();
    this.lyDo = lyDo;
  }
  khiVao(don) {
    don.ghiNhat(`❌ Hủy đơn: ${this.lyDo}`);
  }
}

// ###########################################################################
// PHẦN 3 — CONTEXT: chỉ ỦY THÁC, không có một chữ if nào
// ###########################################################################

class DonHang {
  constructor(ma, diaChi) {
    this.ma = ma;
    this.diaChi = diaChi;
    this.lichSu = [];
    this.nhatKy = [];
    this.trangThai = new ChoThanhToan();
    this.lichSu.push({ trangThai: this.trangThai.nhan, luc: "10:00:00" });
  }

  chuyenSang(trangThaiMoi) {
    const cu = this.trangThai.nhan;
    this.trangThai = trangThaiMoi;
    this.lichSu.push({ tu: cu, den: trangThaiMoi.nhan, luc: gioGia() });
    trangThaiMoi.khiVao(this); // hook khi bước vào
  }

  ghiNhat(s) {
    this.nhatKy.push(s);
  }

  // ---- Toàn bộ API công khai: mỗi cái đúng MỘT dòng ----
  thanhToan() {
    return this.trangThai.thanhToan(this);
  }
  giaoHang() {
    return this.trangThai.giaoHang(this);
  }
  xacNhanNhan() {
    return this.trangThai.xacNhanNhan(this);
  }
  huy() {
    return this.trangThai.huy(this);
  }
  capNhatDiaChi(dc) {
    return this.trangThai.capNhatDiaChi(this, dc);
  }
}

let _gio = 0;
const gioGia = () => `10:${String(++_gio * 5).padStart(2, "0")}:00`;

// ###########################################################################
line("2. LUỒNG BÌNH THƯỜNG");

const don = new DonHang("DH1001", "12 Nguyễn Trãi, Hà Nội");
const trangThai = () => console.log(`      → ${don.trangThai.nhan}`);

console.log("   Tạo đơn:");
trangThai();
console.log("   thanhToan():");
don.thanhToan();
trangThai();
console.log("   giaoHang():");
don.giaoHang();
trangThai();
console.log("   xacNhanNhan():");
don.xacNhanNhan();
trangThai();

console.log("\n   Nhật ký hệ thống:");
don.nhatKy.forEach((n) => console.log("      " + n));

// ###########################################################################
line("3. CÁC HÀNH ĐỘNG BỊ CẤM — thông báo rõ nghĩa, tự động");

const cacThu = [
  ["Hủy đơn đã giao", () => don.huy()],
  ["Thanh toán lại đơn đã giao", () => don.thanhToan()],
  ["Đổi địa chỉ đơn đã giao", () => don.capNhatDiaChi(this, "địa chỉ mới")],
];
for (const [ten, ham] of cacThu) {
  try {
    ham();
    console.log(`   ❌ ${ten.padEnd(30)} → lọt qua (sai!)`);
  } catch (e) {
    console.log(`   ✅ ${ten.padEnd(30)} → ${e.message}`);
  }
}

console.log(`
   👉 Chú ý: class DangGiao KHÔNG định nghĩa huy() và capNhatDiaChi().
      Lớp cơ sở tự lo, và thông báo lỗi tự động đúng ngữ cảnh.

      Với cách viết if/else, bạn phải NHỚ viết else cho từng tổ hợp.
      Với State, quên = tự động bị cấm. "Mặc định an toàn".`);

// ###########################################################################
line("4. HỦY ĐƠN Ở CÁC GIAI ĐOẠN KHÁC NHAU — hành vi khác nhau");

const donA = new DonHang("DH2001", "Hà Nội");
donA.huy();
console.log(`   Hủy khi CHỜ THANH TOÁN  → ${donA.trangThai.nhan}`);
console.log(`      ${donA.nhatKy.join(" | ")}`);

const donB = new DonHang("DH2002", "Hà Nội");
donB.thanhToan();
donB.huy();
console.log(`\n   Hủy khi ĐANG CHUẨN BỊ   → ${donB.trangThai.nhan}`);
console.log(`      ${donB.nhatKy.join(" | ")}   ← có thêm bước NHẢ HÀNG ✅`);

const donC = new DonHang("DH2003", "Hà Nội");
donC.thanhToan();
donC.giaoHang();
try {
  donC.huy();
} catch (e) {
  console.log(`\n   Hủy khi ĐANG GIAO       → ⛔ ${e.message}`);
}

// ###########################################################################
line("5. LỊCH SỬ CHUYỂN TRẠNG THÁI — vàng cho bộ phận CSKH");

console.log(`   Đơn ${don.ma}:`);
don.lichSu.forEach((b) =>
  console.log(`      ${b.luc}  ${b.tu ? `${b.tu} → ${b.den}` : `[tạo đơn] ${b.trangThai}`}`)
);
console.log(`
   👉 Khi khách gọi hỏi "sao đơn tôi bị hủy?", nhân viên có ngay câu trả lời
      kèm mốc thời gian. Với cách if/else, thông tin này thường không tồn tại.`);

// ###########################################################################
// PHẦN 6 — CÁCH 2: BẢNG CHUYỂN TRẠNG THÁI
// ###########################################################################

line("6. CÁCH RẤT JAVASCRIPT — bảng chuyển trạng thái");

const MAY_TRANG_THAI = {
  "cho-thanh-toan": { thanhToan: "dang-chuan-bi", huy: "da-huy", capNhatDiaChi: "cho-thanh-toan" },
  "dang-chuan-bi": { giaoHang: "dang-giao", huy: "da-huy", capNhatDiaChi: "dang-chuan-bi" },
  "dang-giao": { xacNhanNhan: "da-giao" },
  "da-giao": {},
  "da-huy": {},
};

function chuyen(trangThai, hanhDong) {
  const moi = MAY_TRANG_THAI[trangThai]?.[hanhDong];
  if (!moi) {
    const choPhep = Object.keys(MAY_TRANG_THAI[trangThai] ?? {});
    throw new Error(
      `Không thể "${hanhDong}" khi đang "${trangThai}". ` +
        `Hành động hợp lệ: ${choPhep.length ? choPhep.join(", ") : "(không có)"}`
    );
  }
  return moi;
}

console.log("   Toàn bộ sơ đồ nằm gọn trong 7 dòng, nhìn một cái là hiểu:\n");
for (const [tt, cacHd] of Object.entries(MAY_TRANG_THAI)) {
  const mo = Object.entries(cacHd)
    .filter(([hd, den]) => den !== tt)
    .map(([hd, den]) => `${hd} → ${den}`);
  console.log(`      ${tt.padEnd(16)} ${mo.length ? mo.join(" | ") : "(trạng thái cuối)"}`);
}

console.log("\n   Thử vài chuyển đổi:");
console.log(`      cho-thanh-toan + thanhToan → ${chuyen("cho-thanh-toan", "thanhToan")}`);
try {
  chuyen("dang-giao", "huy");
} catch (e) {
  console.log(`      ⛔ ${e.message}`);
}

// ###########################################################################
// PHẦN 7 — SINH SƠ ĐỒ TỰ ĐỘNG TỪ BẢNG
// ###########################################################################

line("7. ⭐ SINH SƠ ĐỒ MERMAID TỰ ĐỘNG TỪ BẢNG");

function sinhSoDo(may) {
  const dong = ["stateDiagram-v2"];
  for (const [tt, cacHd] of Object.entries(may)) {
    for (const [hd, den] of Object.entries(cacHd)) {
      if (den !== tt) dong.push(`    ${tt} --> ${den}: ${hd}`);
    }
    if (Object.keys(cacHd).length === 0) dong.push(`    ${tt} --> [*]`);
  }
  return dong.join("\n");
}

console.log(sinhSoDo(MAY_TRANG_THAI));
console.log(`
   👉 Dán đoạn trên vào file .md là có sơ đồ hình vẽ. Tài liệu KHÔNG BAO GIỜ
      lỗi thời, vì nó sinh ra từ chính code đang chạy.

      Đây là lợi thế lớn nhất của bảng chuyển so với class:
      SƠ ĐỒ TRỞ THÀNH DỮ LIỆU, mà dữ liệu thì xử lý được bằng chương trình.`);

// ###########################################################################
line("8. CLASS hay BẢNG?");
console.log(`
   CLASS cho mỗi trạng thái:
     ✅ Gắn được hành vi phức tạp vào từng bước (nhả hàng, tạo vận đơn)
     ✅ Có hook khiVao/khiRoi
     ✅ Mỗi trạng thái test riêng được
     ❌ Nhiều file, khó thấy toàn cảnh

   BẢNG chuyển trạng thái:
     ✅ Toàn cảnh trong 7 dòng
     ✅ Sinh được sơ đồ, kiểm chứng được (có trạng thái nào không tới được?)
     ✅ Lưu vào DB / file cấu hình được
     ❌ Khó gắn hành vi phức tạp

   👉 THỰC TẾ: dùng CẢ HAI.
      Bảng mô tả "CHUYỂN ĐI ĐÂU", hàm/hook mô tả "LÀM GÌ KHI CHUYỂN".

      Với máy trạng thái phức tạp (lồng nhau, song song, timeout):
      dùng XState, đừng tự viết lại.`);
