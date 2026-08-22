/**
 * BÀI 13 — MODULE
 * Chạy: node src/13-module/demo.js
 */

const line = (t) => console.log("\n" + "=".repeat(62) + "\n" + t + "\n" + "=".repeat(62));

// ###########################################################################
// PHẦN 1 — CÁI ĐAU (thời trước ES6)
// ###########################################################################

line("1. CÁI ĐAU — mọi thứ đều toàn cục");
console.log(`
   // analytics.js
   var soLuotXem = 0;

   // gio-hang.js  ← người khác viết, không biết file trên tồn tại
   var soLuotXem = 0;      💥 ghi đè, không cảnh báo gì

   Và bất kỳ ai cũng gõ được vào console trình duyệt:
       soLuotXem = 999999;   ← số liệu phân tích hỏng

   Trước ES6, JavaScript KHÔNG có private, KHÔNG có namespace,
   KHÔNG có import. Module Pattern ra đời để chữa việc này.`);

// ###########################################################################
// PHẦN 2 — MODULE PATTERN CỔ ĐIỂN (IIFE + closure)
// ###########################################################################

const Analytics = (function () {
  // ---------- RIÊNG TƯ: không đường nào chạm từ bên ngoài ----------
  let soLuotXem = 0;
  let soLuotClick = 0;
  const KHOA_API = "secret-key-123";
  const lichSu = [];

  function ghiLichSu(loai) {
    lichSu.push({ loai, luc: lichSu.length + 1 });
    if (lichSu.length > 100) lichSu.shift();
  }

  // ---------- CÔNG KHAI: chỉ những gì được return ----------
  return {
    xemTrang(duongDan) {
      soLuotXem++;
      ghiLichSu("xem:" + duongDan);
      return soLuotXem;
    },
    click(nut) {
      soLuotClick++;
      ghiLichSu("click:" + nut);
      return soLuotClick;
    },
    thongKe() {
      return { soLuotXem, soLuotClick, soSuKien: lichSu.length };
    },
    // Trả BẢN SAO, không trả tham chiếu tới mảng nội bộ
    layLichSu() {
      return lichSu.map((x) => ({ ...x }));
    },
  };
})();

line("2. MODULE PATTERN — IIFE + closure");

Analytics.xemTrang("/trang-chu");
Analytics.xemTrang("/san-pham");
Analytics.click("mua-ngay");
console.log("   Thống kê:", Analytics.thongKe());

console.log("\n   Thử chạm vào dữ liệu riêng tư:");
console.log("      Analytics.soLuotXem   →", Analytics.soLuotXem, " ← không thấy ✅");
console.log("      Analytics.KHOA_API    →", Analytics.KHOA_API, " ← không thấy ✅");
console.log("      Analytics.lichSu      →", Analytics.lichSu, " ← không thấy ✅");

console.log("\n   Thử phá hoại từ bên ngoài:");
Analytics.soLuotXem = 999999; // chỉ thêm một thuộc tính mới, vô hại
console.log("      Sau khi gán 999999, thongKe() vẫn báo:", Analytics.thongKe().soLuotXem, "✅");

console.log("\n   Thử sửa mảng lịch sử qua bản sao:");
const ban = Analytics.layLichSu();
ban.push({ loai: "HACK" });
console.log("      Số sự kiện thật:", Analytics.thongKe().soSuKien, " ← không đổi ✅");

console.log(`
   ┌──────────── Phạm vi closure ────────────┐
   │  soLuotXem, soLuotClick   ← riêng tư     │
   │  KHOA_API, lichSu         ← riêng tư     │
   │  ghiLichSu()              ← riêng tư     │
   │                                          │
   │  return { xemTrang, click, thongKe } ──┐ │
   └────────────────────────────────────────┼─┘
                                            ▼
                                  Bên ngoài chỉ thấy 3-4 hàm này`);

// ###########################################################################
// PHẦN 3 — FACTORY MODULE: nhiều instance, mỗi cái dữ liệu riêng
// ###########################################################################

function taoBoDem(ten, khoiDau = 0) {
  // Mỗi lần gọi taoBoDem tạo ra một phạm vi closure MỚI
  let giaTri = khoiDau;
  const lichSu = [];

  return {
    ten,
    tang(buoc = 1) {
      giaTri += buoc;
      lichSu.push(`+${buoc}`);
      return giaTri;
    },
    giam(buoc = 1) {
      giaTri -= buoc;
      lichSu.push(`-${buoc}`);
      return giaTri;
    },
    doc: () => giaTri,
    datLai() {
      giaTri = khoiDau;
      lichSu.length = 0;
    },
    xemLichSu: () => [...lichSu],
  };
}

line("3. FACTORY MODULE — nhiều instance độc lập");

const demXem = taoBoDem("lượt xem");
const demBan = taoBoDem("đơn hàng", 100);

demXem.tang();
demXem.tang();
demXem.tang(5);
demBan.tang();

console.log(`   ${demXem.ten}: ${demXem.doc()}   lịch sử: ${demXem.xemLichSu()}`);
console.log(`   ${demBan.ten}: ${demBan.doc()}   lịch sử: ${demBan.xemLichSu()}`);
console.log(`
   👉 Hai bộ đếm hoàn toàn độc lập, dù dùng chung một hàm tạo.
      Mỗi lần gọi taoBoDem() sinh ra một phạm vi closure riêng.

      Đây là điểm khác biệt cốt lõi so với Module Pattern cổ điển
      (IIFE chỉ tạo được MỘT instance duy nhất).`);

// ###########################################################################
// PHẦN 4 — ⚠️ RÒ RỈ ĐÓNG GÓI
// ###########################################################################

line("4. ⚠️  BẪY — RÒ RỈ ĐÓNG GÓI");

function taoDanhSachRoRi() {
  const items = [];
  return {
    them: (x) => items.push(x),
    layTatCa: () => items, // ❌ trả TRAM CHIẾU tới mảng nội bộ
  };
}

function taoDanhSachTot() {
  const items = [];
  return {
    them: (x) => items.push(x),
    layTatCa: () => [...items], // ✅ trả BẢN SAO
  };
}

const roRi = taoDanhSachRoRi();
roRi.them("a");
roRi.layTatCa().push("HACK"); // sửa thẳng vào ruột module
roRi.layTatCa().length = 0; // xóa sạch dữ liệu nội bộ!
console.log(`   Module rò rỉ:  sau khi bên ngoài can thiệp → ${roRi.layTatCa().length} phần tử ❌`);

const tot = taoDanhSachTot();
tot.them("a");
tot.layTatCa().push("HACK");
tot.layTatCa().length = 0;
console.log(`   Module tốt  :  sau khi bên ngoài can thiệp → ${tot.layTatCa().length} phần tử ✅`);

console.log(`
   👉 Đóng gói bị phá KHÔNG phải bởi biến, mà bởi THAM CHIẾU bạn trả ra.
      Mảng, object, Map, Set — trả nguyên ra là mở toang cửa sau.

      Cách phòng: trả bản sao ([...x], {...x}), hoặc Object.freeze(),
      hoặc trả một view chỉ-đọc.`);

// ###########################################################################
// PHẦN 5 — JS HIỆN ĐẠI
// ###########################################################################

line("5. TRONG JAVASCRIPT HIỆN ĐẠI");

console.log(`
   5.1 ESM — không export nghĩa là riêng tư, không cần IIFE

       // analytics.js
       let soLuotXem = 0;                     ← riêng tư, tự động
       export function ghiNhan() { soLuotXem++; }

       File này chỉ chạy MỘT lần dù import ở 100 nơi (xem Bài 02).

   5.2 Private field của class — riêng tư THẬT ở mức ngôn ngữ`);

class TaiKhoan {
  #soDu = 0;
  #lichSu = [];

  napTien(x) {
    if (x <= 0) throw new Error("Số tiền phải dương");
    this.#soDu += x;
    this.#lichSu.push({ loai: "nạp", x });
    return this.#soDu;
  }
  get soDu() {
    return this.#soDu; // chỉ đọc
  }
}

const tk = new TaiKhoan();
tk.napTien(500_000);
console.log(`\n       tk.soDu       → ${tk.soDu.toLocaleString("vi-VN")}đ`);
console.log(`       tk.#soDu      → SyntaxError (không compile được)`);
console.log(`       Object.keys() → ${JSON.stringify(Object.keys(tk))}  ← không lộ gì ✅`);
console.log(`       JSON.stringify→ ${JSON.stringify(tk)}  ← private field không bị serialize`);

console.log(`
   5.3 Vậy Module Pattern còn dùng không? CÓ, ở 3 chỗ:

       1. Factory module — cần nhiều instance có trạng thái riêng
          mà không muốn dùng class (JS thuần túy hàm)
       2. Khởi tạo một lần khi module được nạp
       3. ĐỌC CODE CŨ — jQuery, Lodash, Bootstrap đều viết kiểu này.
          Bạn sẽ gặp, và cần hiểu.`);

// ###########################################################################
line("6. ⚠️  RIÊNG TƯ ≠ BẢO MẬT");
console.log(`
   Closure ngăn LỖI VÔ Ý. Nó KHÔNG ngăn kẻ tấn công.

   Nếu bạn viết:
       const KHOA_API = "sk_live_abc123";     ← trong file JS phía trình duyệt

   thì dù nó nằm trong closure, người dùng vẫn:
       • mở DevTools → tab Sources → đọc thẳng file
       • hoặc xem file .js tải về trong tab Network

   👉 Bí mật thật sự phải nằm Ở MÁY CHỦ. Không có ngoại lệ.
      Đóng gói là công cụ THIẾT KẾ, không phải công cụ BẢO MẬT.`);
