/**
 * BÀI 09 — STRATEGY
 * Chạy: node src/09-strategy/demo.js
 *
 * Đây là lời giải cho cái đau đã nêu ở Bài 00.
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — NHẮC LẠI CÁI ĐAU (code từ Bài 00)
// ###########################################################################

line("1. CÁI ĐAU TỪ BÀI 00");
console.log(`
   function tinhPhiShip(hang, donHang) {
     if (hang === "ghtk") { ... }
     else if (hang === "ghn") { ... }
     else if (hang === "viettel-post") { ... }
   }

   function thoiGianGiao(hang) {
     if (hang === "ghtk") ...          ← CÙNG chuỗi if, hàm khác
   }

   function danhSachHangVanChuyen() {
     return ["ghtk", "ghn", "viettel-post"];   ← và lần thứ ba
   }

   ⚠️  DẤU HIỆU VÀNG CỦA STRATEGY:
       cùng một chuỗi if/switch trên CÙNG một biến,
       xuất hiện ở NHIỀU hàm khác nhau.`);

// ###########################################################################
// PHẦN 2 — MỖI HÃNG THÀNH MỘT STRATEGY
// ###########################################################################

/**
 * HỢP ĐỒNG ChienLuocVanChuyen:
 *   ma            : string
 *   ten           : string
 *   tinhPhi(don)  : number
 *   thoiGianGiao(): string
 *   phucVu(don)   : boolean
 */

const chienLuocGHTK = {
  ma: "ghtk",
  ten: "Giao Hàng Tiết Kiệm",
  tinhPhi(don) {
    let phi = 15_000;
    if (don.canNang > 1) phi += Math.ceil(don.canNang - 1) * 5_000;
    return phi;
  },
  thoiGianGiao: () => "1-2 ngày",
  phucVu: (don) => true,
};

const chienLuocGHN = {
  ma: "ghn",
  ten: "Giao Hàng Nhanh",
  tinhPhi(don) {
    if (don.giaTri >= 500_000) return 0; // miễn phí đơn lớn
    return don.noiThanh ? 20_000 : 35_000;
  },
  thoiGianGiao: () => "2-3 ngày",
  phucVu: (don) => true,
};

const chienLuocViettel = {
  ma: "viettel-post",
  ten: "Viettel Post",
  tinhPhi(don) {
    return Math.min(Math.max(don.giaTri * 0.02, 12_000), 60_000);
  },
  thoiGianGiao: () => "3-5 ngày",
  phucVu: (don) => true,
};

// ###########################################################################
// PHẦN 3 — REGISTRY + CONTEXT
// ###########################################################################

const KHO_CHIEN_LUOC = new Map();
const dangKy = (cl) => KHO_CHIEN_LUOC.set(cl.ma, cl);
const layChienLuoc = (ma) => {
  const cl = KHO_CHIEN_LUOC.get(ma);
  if (!cl) throw new Error(`Không hỗ trợ hãng "${ma}". Có: ${[...KHO_CHIEN_LUOC.keys()]}`);
  return cl;
};

dangKy(chienLuocGHTK);
dangKy(chienLuocGHN);
dangKy(chienLuocViettel);

class DichVuVanChuyen {
  constructor(chienLuoc) {
    this.chienLuoc = chienLuoc; // Context KHÔNG chọn strategy, nó được ĐƯA vào
  }

  baoGia(don) {
    if (!this.chienLuoc.phucVu(don)) {
      return { phucVu: false, lyDo: `${this.chienLuoc.ten} không phục vụ khu vực này` };
    }
    return {
      phucVu: true,
      hang: this.chienLuoc.ten,
      phi: this.chienLuoc.tinhPhi(don),
      thoiGian: this.chienLuoc.thoiGianGiao(),
    };
  }
}

// Danh sách TỰ SINH từ registry — không còn mảng viết tay
const layTatCaTuyChon = (don) =>
  [...KHO_CHIEN_LUOC.values()]
    .map((cl) => new DichVuVanChuyen(cl).baoGia(don))
    .filter((bg) => bg.phucVu)
    .sort((a, b) => a.phi - b.phi);

line("2. STRATEGY — mỗi hãng một object trọn vẹn");

const don = { canNang: 2.5, giaTri: 320_000, noiThanh: true, tinh: "Hà Nội" };
console.log("Đơn hàng:", don, "\n");
for (const bg of layTatCaTuyChon(don)) {
  console.log(`   ${bg.hang.padEnd(22)} ${bg.phi.toLocaleString("vi-VN").padStart(7)}đ  (${bg.thoiGian})`);
}

// ###########################################################################
// PHẦN 4 — THÊM HÃNG MỚI: KHÔNG SỬA MỘT DÒNG NÀO Ở TRÊN
// ###########################################################################

line("3. ⭐ THÊM HÃNG MỚI — không đụng vào bất kỳ dòng code nào ở trên");

// Trong dự án thật, đoạn này nằm ở file riêng: chien-luoc/jt-express.js
const chienLuocJT = {
  ma: "jt",
  ten: "J&T Express",
  tinhPhi(don) {
    const co_ban = don.noiThanh ? 18_000 : 28_000;
    return co_ban + (don.canNang > 2 ? (don.canNang - 2) * 4_000 : 0);
  },
  thoiGianGiao: () => "2-4 ngày",
  phucVu: (don) => don.tinh !== "Trường Sa", // hãng này có giới hạn khu vực
};
dangKy(chienLuocJT);

console.log("Sau khi thêm J&T (chỉ thêm 1 object + 1 dòng dangKy):\n");
for (const bg of layTatCaTuyChon(don)) {
  console.log(`   ${bg.hang.padEnd(22)} ${bg.phi.toLocaleString("vi-VN").padStart(7)}đ  (${bg.thoiGian})`);
}

console.log("\nĐơn đi Trường Sa (J&T không phục vụ):\n");
for (const bg of layTatCaTuyChon({ ...don, tinh: "Trường Sa" })) {
  console.log(`   ${bg.hang.padEnd(22)} ${bg.phi.toLocaleString("vi-VN").padStart(7)}đ`);
}

console.log(`
   👉 So với Bài 00:
      TRƯỚC: sửa 3 hàm, 3 người conflict, quên 1 chỗ là bug ngầm
      SAU  : thêm 1 object, 0 dòng bị sửa, 3 người làm 3 file khác nhau

      Và tính năng "danh sách hãng" giờ TỰ ĐỘNG đúng — không thể quên
      cập nhật, vì nó sinh ra từ registry.`);

// ###########################################################################
// PHẦN 5 — STRATEGY DẠNG HÀM (rất JavaScript)
// ###########################################################################

line("4. STRATEGY DẠNG HÀM — bạn đã dùng mà không biết");

const sanPham = [
  { ten: "Áo thun", gia: 250_000, ngay: 3 },
  { ten: "Quần jean", gia: 550_000, ngay: 1 },
  { ten: "Mũ lưỡi trai", gia: 120_000, ngay: 2 },
];

const CACH_SAP_XEP = {
  "gia-tang": (a, b) => a.gia - b.gia,
  "gia-giam": (a, b) => b.gia - a.gia,
  "ten-az": (a, b) => a.ten.localeCompare(b.ten, "vi"),
  "moi-nhat": (a, b) => a.ngay - b.ngay,
};

for (const [ten, cach] of Object.entries(CACH_SAP_XEP)) {
  console.log(`   ${ten.padEnd(10)} → ${[...sanPham].sort(cach).map((s) => s.ten).join(", ")}`);
}

console.log(`
   👉 [].sort(hamSoSanh) CHÍNH LÀ Strategy. Bạn truyền thuật toán vào
      như một tham số. JS làm pattern này gọn tới mức không ai gọi tên nó.

      Khi nào cần OBJECT thay vì hàm đơn?
        • khi mỗi chiến lược cần NHIỀU hành vi (phí + thời gian + tên)
        • khi chiến lược cần TRẠNG THÁI riêng (API key, cấu hình)`);

// ###########################################################################
// PHẦN 6 — STRATEGY vs STATE
// ###########################################################################

line("5. STRATEGY vs STATE — cặp dễ nhầm nhất");
console.log(`
                    STRATEGY                  STATE
   Ai chọn?         BÊN NGOÀI                 BẢN THÂN object tự chuyển
                    (người dùng, config)

   Biết nhau?       Không. GHTK không         Có. "Đang giao" biết state
                    biết GHN tồn tại          kế tiếp là "Đã giao"

   Đổi khi nào?     Thường 1 lần, lúc dựng    Liên tục suốt vòng đời

   Ví dụ            Chọn hãng ship            Đơn: chờ → đang giao → xong

   ❓ Câu hỏi phân biệt duy nhất bạn cần nhớ:
      "AI QUYẾT ĐỊNH ĐỔI?"   Bên ngoài → Strategy.   Bên trong → State.`);

// ###########################################################################
line("6. KHI NÀO ĐỪNG DÙNG STRATEGY");
console.log(`
   ❌ Chỉ có 2 nhánh và chỉ dùng ở MỘT hàm:

        const phi = laVip ? 0 : 30000;      ← giữ nguyên, đừng bày vẽ

   ✅ Từ 3 nhánh trở lên, HOẶC if lặp lại ở nhiều hàm → chuyển Strategy.

   Nhớ Rule of Three ở Bài 00: pattern là PHẢN ỨNG với thay đổi đã xảy ra,
   không phải DỰ ĐOÁN thay đổi có thể xảy ra.`);
