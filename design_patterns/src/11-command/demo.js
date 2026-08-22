/**
 * BÀI 11 — COMMAND
 * Chạy: node src/11-command/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU
// ###########################################################################

line("1. CÁI ĐAU — không có gì để hoàn tác");
console.log(`
   btnXoa.onclick = () => vanBan.xoa(tu, den);

   Người dùng bấm Ctrl+Z. Bạn có gì trong tay?
     • không biết vừa làm gì
     • không biết trước đó văn bản trông thế nào
     • không biết cách đảo ngược

   Cách chữa cháy SAI: chụp ảnh toàn bộ văn bản sau mỗi phím gõ.
     → File 10MB × 100 bước undo = 1GB RAM. Không dùng được.`);

// ###########################################################################
// PHẦN 2 — RECEIVER
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
// PHẦN 3 — CÁC LỆNH
// ###########################################################################

class LenhChen {
  constructor(vanBan, viTri, text) {
    Object.assign(this, { vanBan, viTri, text });
    this.ten = `Chèn "${text}"`;
  }
  thucThi() {
    this.vanBan.chen(this.viTri, this.text);
  }
  hoanTac() {
    // Khả nghịch bằng TÍNH TOÁN: chỉ cần biết vị trí và độ dài
    this.vanBan.cat(this.viTri, this.viTri + this.text.length);
  }
}

class LenhXoa {
  constructor(vanBan, tu, den) {
    Object.assign(this, { vanBan, tu, den });
    this.daCat = null; // ← lưu PHẦN CHÊNH LỆCH, không lưu cả văn bản
    this.ten = `Xóa [${tu}..${den}]`;
  }
  thucThi() {
    this.daCat = this.vanBan.cat(this.tu, this.den);
  }
  hoanTac() {
    this.vanBan.chen(this.tu, this.daCat);
  }
}

class LenhInHoa {
  constructor(vanBan, tu, den) {
    Object.assign(this, { vanBan, tu, den });
    this.banCu = null; // ⚠️ BẮT BUỘC lưu — inHoa MẤT THÔNG TIN
    this.ten = `IN HOA [${tu}..${den}]`;
  }
  thucThi() {
    this.banCu = this.vanBan.noiDung.slice(this.tu, this.den);
    this.vanBan.thay(this.tu, this.den, this.banCu.toUpperCase());
  }
  hoanTac() {
    this.vanBan.thay(this.tu, this.den, this.banCu);
  }
}

// ###########################################################################
// PHẦN 4 — INVOKER
// ###########################################################################

class LichSuLenh {
  #daLam = [];
  #daHoanTac = [];
  #gioiHan;

  constructor(gioiHan = 50) {
    this.#gioiHan = gioiHan;
  }

  chay(lenh) {
    lenh.thucThi();
    this.#daLam.push(lenh);

    // ⚠️ BẪY 1: hành động mới làm nhánh redo cũ trở nên vô nghĩa
    this.#daHoanTac = [];

    // ⚠️ BẪY 2: giới hạn kích thước, nếu không lịch sử phình vô hạn
    if (this.#daLam.length > this.#gioiHan) this.#daLam.shift();

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

  get trangThai() {
    return `[đã làm: ${this.#daLam.length} | có thể redo: ${this.#daHoanTac.length}]`;
  }
  get nhatKy() {
    return this.#daLam.map((l) => l.ten);
  }
}

// ###########################################################################
line("2. UNDO / REDO");

const vb = new VanBan("Xin chao the gioi");
const ls = new LichSuLenh();
const hien = (nhan) => console.log(`   ${nhan.padEnd(26)} "${vb.noiDung}"  ${ls.trangThai}`);

hien("Ban đầu:");
ls.chay(new LenhChen(vb, 17, "!"));
hien('Chèn "!":');
ls.chay(new LenhXoa(vb, 0, 4));
hien("Xóa 4 ký tự đầu:");
ls.chay(new LenhInHoa(vb, 0, 4));
hien("IN HOA 4 ký tự đầu:");

console.log();
ls.hoanTac();
hien("Ctrl+Z:");
ls.hoanTac();
hien("Ctrl+Z:");
ls.lamLai();
hien("Ctrl+Y:");

// ###########################################################################
line("3. ⚠️  BẪY 1 — hành động mới phải XÓA nhánh redo");

const vb2 = new VanBan("abc");
const ls2 = new LichSuLenh();
ls2.chay(new LenhChen(vb2, 3, "-1"));
ls2.chay(new LenhChen(vb2, 5, "-2"));
console.log(`   Sau 2 lệnh:        "${vb2.noiDung}"  ${ls2.trangThai}`);
ls2.hoanTac();
ls2.hoanTac();
console.log(`   Sau 2 lần undo:    "${vb2.noiDung}"  ${ls2.trangThai}`);
ls2.chay(new LenhChen(vb2, 3, "-MOI"));
console.log(`   Chạy lệnh mới:     "${vb2.noiDung}"  ${ls2.trangThai}  ← redo bị xóa ✅`);
console.log(`   Bấm Ctrl+Y:        ${ls2.lamLai() === null ? "không có gì để redo ✅" : "❌ SAI"}`);
console.log(`
   👉 Nếu KHÔNG xóa nhánh redo, Ctrl+Y sẽ dán nội dung từ một
      "dòng thời gian" khác — người dùng thấy văn bản biến dạng
      không giải thích nổi. Đây là bug rất hay gặp trong editor tự viết.`);

// ###########################################################################
line("4. MACRO — gộp nhiều lệnh thành một");

class LenhGop {
  constructor(ten, cacLenh) {
    this.ten = ten;
    this.cacLenh = cacLenh;
  }
  thucThi() {
    for (const l of this.cacLenh) l.thucThi();
  }
  hoanTac() {
    // ⚠️ NGƯỢC thứ tự — giống như hoàn tác trong Facade (Bài 07)
    for (const l of [...this.cacLenh].reverse()) l.hoanTac();
  }
}

const vb3 = new VanBan("tieu de bai viet");
const ls3 = new LichSuLenh();
console.log(`   Ban đầu:              "${vb3.noiDung}"`);

ls3.chay(
  new LenhGop("Định dạng tiêu đề", [
    new LenhInHoa(vb3, 0, 7),
    new LenhChen(vb3, 0, ">> "),
    new LenhChen(vb3, vb3.noiDung.length + 3, " <<"),
  ])
);
console.log(`   Sau macro:            "${vb3.noiDung}"`);
ls3.hoanTac();
console.log(`   Một lần Ctrl+Z:       "${vb3.noiDung}"  ← hoàn tác cả 3 lệnh ✅`);

// ###########################################################################
line("5. LỆNH LÀ DỮ LIỆU → mở ra 4 tính năng miễn phí");

console.log("\n   5.1 NHẬT KÝ KIỂM TOÁN — 'ai làm gì lúc nào'");
const vb4 = new VanBan("hop dong");
const ls4 = new LichSuLenh();
ls4.chay(new LenhInHoa(vb4, 0, 3));
ls4.chay(new LenhChen(vb4, 8, " so 42"));
ls4.chay(new LenhXoa(vb4, 0, 4));
ls4.nhatKy.forEach((t, i) => console.log(`        ${i + 1}. ${t}`));

console.log("\n   5.2 PHÁT LẠI (Event Sourcing) — dựng lại trạng thái từ danh sách lệnh");
const lichSuLenh = [
  { loai: "chen", viTri: 0, text: "Hello" },
  { loai: "chen", viTri: 5, text: " world" },
  { loai: "inhoa", tu: 0, den: 5 },
];
const dungLai = new VanBan("");
for (const ghi of lichSuLenh) {
  const lenh =
    ghi.loai === "chen"
      ? new LenhChen(dungLai, ghi.viTri, ghi.text)
      : new LenhInHoa(dungLai, ghi.tu, ghi.den);
  lenh.thucThi();
}
console.log(`        Từ văn bản rỗng, phát lại 3 lệnh → "${dungLai.noiDung}"`);

console.log(`
   5.3 HÀNG ĐỢI — lệnh lưu được thì gửi được sang máy khác, chạy sau
   5.4 GỘP MACRO — như phần 4 ở trên

   👉 Đây chính là ý tưởng đằng sau Event Sourcing, CQRS, và cách Git
      lưu lịch sử (mỗi commit là một tập thay đổi, không phải bản chụp
      toàn bộ dự án).`);

// ###########################################################################
line("6. ⚠️  LƯU GÌ ĐỂ HOÀN TÁC?");
console.log(`
   Cách 1 — CHỤP TOÀN BỘ TRẠNG THÁI
     Đơn giản nhất, nhưng 10MB × 100 bước = 1GB. Không dùng được.

   Cách 2 — LƯU PHẦN CHÊNH LỆCH        ← cách đúng cho hầu hết trường hợp
     LenhXoa chỉ lưu đoạn văn bản đã cắt. Vài chục byte.

   Cách 3 — TÍNH NGƯỢC TỪ THAM SỐ      ← nhỏ nhất, nhưng có điều kiện
     LenhChen chỉ cần viTri + độ dài, không lưu gì thêm.

   ⚠️  Cách 3 CHỈ đúng khi phép toán KHẢ NGHỊCH:
         cong(5)     ⇄ tru(5)          ✅ khả nghịch
         nhanVoi(0)  ⇄ ???             ❌ mất thông tin
         inHoa()     ⇄ inThuong()      ❌ mất thông tin! "iPhone" → "IPHONE" → "iphone"

   👉 Câu hỏi phải tự đặt trước khi chọn cách 3:
      "PHÉP TOÁN NÀY CÓ LÀM MẤT THÔNG TIN KHÔNG?"
      Nếu có → bắt buộc lưu trạng thái cũ (như LenhInHoa trong demo này).`);

// ###########################################################################
line("7. UNDO NHỮNG THỨ KHÔNG THỂ ĐẢO NGƯỢC");
console.log(`
   Đã gửi email → không thể "thu hồi" khỏi hộp thư người nhận.
   Đã trừ tiền  → không thể "chưa từng trừ".

   Với các hành động RA BÊN NGOÀI, undo KHÔNG phải phép đảo ngược,
   mà là HÀNH ĐỘNG BÙ TRỪ:

     gửi email       → undo = gửi email đính chính
     trừ tiền        → undo = hoàn tiền (một giao dịch MỚI)
     xuất kho        → undo = nhập kho lại

   Khác biệt quan trọng: hành động bù trừ CÓ THỂ THẤT BẠI, và nó để lại
   DẤU VẾT trong lịch sử. Đừng thiết kế như thể undo luôn thành công và
   xóa sạch quá khứ.`);
