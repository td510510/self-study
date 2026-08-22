/**
 * BÀI 01 — FACTORY
 * Chạy: node src/01-factory/demo.js
 *
 * Demo trình bày 3 biến thể theo thứ tự tăng dần độ phức tạp.
 */

const line = (t) => console.log("\n" + "=".repeat(60) + "\n" + t + "\n" + "=".repeat(60));

// ###########################################################################
// PHẦN 0 — CÁC "SẢN PHẨM"
// Điểm mấu chốt: tất cả cùng một HỢP ĐỒNG — đều có phương thức gui(diaChi, noiDung)
// ###########################################################################

class EmailSender {
  constructor(smtpHost) {
    this.smtpHost = smtpHost; // khởi tạo phức tạp: cần host, port, credentials...
  }
  gui(diaChi, noiDung) {
    return `📧 [SMTP ${this.smtpHost}] gửi tới ${diaChi}: "${noiDung}"`;
  }
}

class SmsSender {
  constructor(brandname) {
    this.brandname = brandname;
  }
  gui(diaChi, noiDung) {
    return `📱 [SMS ${this.brandname}] gửi tới ${diaChi}: "${noiDung}"`;
  }
}

class ZaloSender {
  constructor(oaId) {
    this.oaId = oaId;
  }
  gui(diaChi, noiDung) {
    return `💬 [Zalo OA ${this.oaId}] gửi tới ${diaChi}: "${noiDung}"`;
  }
}

// ###########################################################################
// PHẦN 1 — SIMPLE FACTORY
// Một chỗ duy nhất trong hệ thống biết cách "new" từng loại.
// ###########################################################################

function taoSender(loai) {
  switch (loai) {
    case "email":
      return new EmailSender("smtp.gmail.com");
    case "sms":
      return new SmsSender("MYSHOP");
    case "zalo":
      return new ZaloSender("oa_998877");
    default:
      throw new Error(`Không hỗ trợ kênh: ${loai}`);
  }
}

// Nơi sử dụng: KHÔNG hề biết tên class nào cả.
function guiThongBao(loai, diaChi, noiDung) {
  const sender = taoSender(loai);
  return sender.gui(diaChi, noiDung);
}

line("1. SIMPLE FACTORY");
console.log(guiThongBao("email", "an@example.com", "Đơn hàng đã xác nhận"));
console.log(guiThongBao("sms", "0901234567", "Mã OTP: 123456"));
console.log(guiThongBao("zalo", "user_42", "Shipper đang tới"));

console.log("\n👉 Chú ý: hàm guiThongBao() không chứa chữ 'new' nào.");
console.log("   Thêm kênh mới chỉ cần sửa DUY NHẤT hàm taoSender().");

// ###########################################################################
// PHẦN 2 — FACTORY METHOD
// Lớp cha giữ QUY TRÌNH, lớp con quyết định TẠO GÌ.
// ###########################################################################

class KenhThongBao {
  // ---- Factory Method: lớp con bắt buộc phải cài đặt ----
  taoSender() {
    throw new Error("Lớp con phải cài đặt taoSender()");
  }

  // ---- Quy trình chung: viết MỘT lần, không bao giờ sửa lại ----
  guiCho(nguoiDung, noiDung) {
    if (!nguoiDung.dongYNhanTin) {
      return `⛔ ${nguoiDung.ten} đã tắt nhận thông báo — bỏ qua`;
    }
    const sender = this.taoSender(); // ← chỗ duy nhất khác nhau giữa các lớp con
    const ketQua = sender.gui(this.layDiaChi(nguoiDung), noiDung);
    return ketQua + `  ✔ đã ghi log lúc ${new Date().toISOString().slice(11, 19)}`;
  }

  layDiaChi(nguoiDung) {
    throw new Error("Lớp con phải cài đặt layDiaChi()");
  }
}

class KenhEmail extends KenhThongBao {
  taoSender() {
    return new EmailSender("smtp.sendgrid.net");
  }
  layDiaChi(nguoiDung) {
    return nguoiDung.email;
  }
}

class KenhSms extends KenhThongBao {
  taoSender() {
    return new SmsSender("VNSHOP");
  }
  layDiaChi(nguoiDung) {
    return nguoiDung.soDienThoai;
  }
}

line("2. FACTORY METHOD");

const nguoiDung = {
  ten: "Ngọc",
  email: "ngoc@example.com",
  soDienThoai: "0912345678",
  dongYNhanTin: true,
};
const nguoiDungTatTB = { ...nguoiDung, ten: "Bình", dongYNhanTin: false };

for (const kenh of [new KenhEmail(), new KenhSms()]) {
  console.log(kenh.guiCho(nguoiDung, "Khuyến mãi cuối tuần"));
}
console.log(new KenhEmail().guiCho(nguoiDungTatTB, "Khuyến mãi cuối tuần"));

console.log("\n👉 Logic 'kiểm tra đồng ý' và 'ghi log' nằm ở lớp cha, viết một lần.");
console.log("   Thêm KenhZalo chỉ cần viết 2 phương thức ngắn, không đụng lớp cha.");

// ###########################################################################
// PHẦN 3 — ABSTRACT FACTORY
// Tạo cả một BỘ object phải khớp nhau.
// ###########################################################################

class GiaoDienFactory {
  taoNut() {
    throw new Error("chưa cài đặt");
  }
  taoONhap() {
    throw new Error("chưa cài đặt");
  }
}

class GiaoDienSang extends GiaoDienFactory {
  taoNut() {
    return { ve: () => "[ Gửi ]  (nền trắng, chữ đen)" };
  }
  taoONhap() {
    return { ve: () => "┌──────────────┐  (viền xám nhạt)" };
  }
}

class GiaoDienToi extends GiaoDienFactory {
  taoNut() {
    return { ve: () => "[ Gửi ]  (nền đen, chữ trắng)" };
  }
  taoONhap() {
    return { ve: () => "┌──────────────┐  (viền xám đậm)" };
  }
}

// Code dựng form KHÔNG biết đang ở theme nào.
function dungForm(factory) {
  const oNhap = factory.taoONhap();
  const nut = factory.taoNut();
  return [oNhap.ve(), nut.ve()].join("\n  ");
}

line("3. ABSTRACT FACTORY");
const theme = process.env.THEME === "dark" ? new GiaoDienToi() : new GiaoDienSang();
console.log("Theme sáng:\n  " + dungForm(new GiaoDienSang()));
console.log("\nTheme tối:\n  " + dungForm(new GiaoDienToi()));
console.log("\nTheme theo biến môi trường THEME:\n  " + dungForm(theme));

console.log("\n👉 Không có cách nào để vô tình ghép nút-tối với ô-nhập-sáng.");
console.log("   Factory đảm bảo cả BỘ luôn đồng nhất.");

// ###########################################################################
// PHẦN 4 — CÁCH "RẤT JAVASCRIPT": REGISTRY
// Đạt Open/Closed thật sự: thêm loại mới KHÔNG cần sửa file factory.
// ###########################################################################

const REGISTRY = new Map();
const dangKy = (loai, factoryFn) => REGISTRY.set(loai, factoryFn);
const tao = (loai) => {
  const fn = REGISTRY.get(loai);
  if (!fn) throw new Error(`Chưa đăng ký kênh: ${loai}. Có sẵn: ${[...REGISTRY.keys()]}`);
  return fn();
};

dangKy("email", () => new EmailSender("smtp.gmail.com"));
dangKy("sms", () => new SmsSender("MYSHOP"));
// Dòng dưới đây hoàn toàn có thể nằm ở một file plugin khác:
dangKy("telegram", () => ({
  gui: (id, nd) => `🚀 [Telegram] gửi tới chat ${id}: "${nd}"`,
}));

line("4. REGISTRY (cách rất JavaScript)");
for (const loai of REGISTRY.keys()) {
  console.log(tao(loai).gui("someone", "Xin chào"));
}

try {
  tao("fax");
} catch (e) {
  console.log("\n⚠️  " + e.message);
}

console.log("\n👉 Đây chính là cơ chế plugin của webpack, ESLint, Vite...");
