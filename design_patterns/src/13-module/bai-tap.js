/**
 * BÀI TẬP 13 — MODULE
 * Chạy: node src/13-module/bai-tap.js
 */

// ###########################################################################
// 📝 TODO 1 — taoGioHang() theo Factory Module
//
//   API công khai:
//     them(sanPham)          sanPham = { ma, ten, gia, soLuong }
//                            nếu ma đã có → cộng dồn soLuong
//     xoa(ma)                → true/false
//     doiSoLuong(ma, sl)     sl <= 0 thì xóa luôn
//     tong()                 → tổng tiền
//     soMon()                → tổng số lượng các món
//     danhSach()             → ⚠️ BẢN SAO, sửa nó không đụng dữ liệu nội bộ
//     lamRong()
//
//   ⚠️ Mảng nội bộ phải RIÊNG TƯ. Bộ test sẽ cố phá đóng gói.
// ###########################################################################

function taoGioHang() {
  // TODO
  return {};
}

// ###########################################################################
// 📝 TODO 2 — taoBoNhoDem(ttlMs) — cache có TTL
//
//   dat(khoa, giaTri)
//   lay(khoa)              → giá trị, hoặc undefined nếu hết hạn/không có
//   co(khoa)               → boolean
//   xoa(khoa)
//   thongKe()              → { soLanTrung, soLanTruot, soMuc }
//
//   ⚠️ soLanTrung / soLanTruot phải RIÊNG TƯ — chỉ đọc được qua thongKe()
// ###########################################################################

function taoBoNhoDem(ttlMs = 1000) {
  // TODO
  return {};
}

// ###########################################################################
// 📝 TODO 3 — TÌM VÀ SỬA LỖI RÒ RỈ ĐÓNG GÓI
//
//   Module dưới đây có LỖI. Tìm ra và sửa.
//   Gợi ý: chạy test và xem test nào đỏ.
// ###########################################################################

function taoSoDiaChi() {
  const diaChi = [];
  const macDinh = { thanhPho: "Hà Nội", quocGia: "Việt Nam" };

  return {
    them(dc) {
      diaChi.push({ ...macDinh, ...dc });
    },
    layTatCa() {
      return diaChi; // ← có vấn đề gì ở đây?
    },
    layMacDinh() {
      return macDinh; // ← và ở đây?
    },
    demSo() {
      return diaChi.length;
    },
  };
}

// ###########################################################################
// BỘ KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong_ = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong_++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};

console.log("=== TEST 1: giỏ hàng ===\n");
try {
  const gio = taoGioHang();
  gio.them({ ma: "AO1", ten: "Áo thun", gia: 250_000, soLuong: 2 });
  gio.them({ ma: "QU1", ten: "Quần jean", gia: 550_000, soLuong: 1 });
  ok("Tổng tiền đúng", gio.tong() === 1_050_000, `nhận: ${gio.tong()}`);
  ok("Số món đúng", gio.soMon() === 3, `nhận: ${gio.soMon()}`);

  gio.them({ ma: "AO1", ten: "Áo thun", gia: 250_000, soLuong: 1 });
  ok("Thêm trùng mã thì cộng dồn", gio.soMon() === 4, `nhận: ${gio.soMon()}`);

  gio.doiSoLuong("AO1", 0);
  ok("doiSoLuong(0) thì xóa món", gio.danhSach().length === 1);

  ok("xoa() mã không tồn tại trả false", gio.xoa("KHONG-CO") === false);

  // ⚠️ Thử phá đóng gói
  const ds = gio.danhSach();
  ds.push({ ma: "HACK", gia: 999, soLuong: 1 });
  ds[0].gia = 1;
  ok("⭐ danhSach() trả BẢN SAO — push không ảnh hưởng",
    gio.danhSach().length === 1, `nhận ${gio.danhSach().length}`);
  ok("⭐ Sửa phần tử trong bản sao không đổi giá gốc",
    gio.tong() === 550_000, `nhận: ${gio.tong()}`);

  // Hai giỏ độc lập
  const gio2 = taoGioHang();
  gio2.them({ ma: "MU1", ten: "Mũ", gia: 100_000, soLuong: 1 });
  ok("Hai giỏ hàng độc lập nhau", gio.tong() === 550_000 && gio2.tong() === 100_000,
    `gio=${gio.tong()}, gio2=${gio2.tong()}`);
} catch (e) {
  tong_ += 8;
  console.log("❌ Chưa làm TODO 1 — " + e.message);
}

console.log("\n=== TEST 2: bộ nhớ đệm ===\n");
try {
  const cache = taoBoNhoDem(100);
  cache.dat("a", 1);
  ok("lay() lấy được giá trị vừa đặt", cache.lay("a") === 1);
  ok("co() báo đúng", cache.co("a") === true && cache.co("b") === false);
  cache.lay("khong-co");
  ok("thongKe() đếm đúng trúng/trượt",
    cache.thongKe().soLanTrung === 1 && cache.thongKe().soLanTruot === 1,
    JSON.stringify(cache.thongKe()));

  await new Promise((r) => setTimeout(r, 150));
  ok("Giá trị hết hạn sau TTL", cache.lay("a") === undefined);

  // ⚠️ Biến đếm phải riêng tư
  ok("⭐ soLanTrung không lộ ra ngoài", cache.soLanTrung === undefined);
} catch (e) {
  tong_ += 5;
  console.log("❌ Chưa làm TODO 2 — " + e.message);
}

console.log("\n=== TEST 3: rò rỉ đóng gói ===\n");
try {
  const so = taoSoDiaChi();
  so.them({ duong: "12 Nguyễn Trãi" });

  so.layTatCa().push({ duong: "HACK" });
  ok("⭐ layTatCa() không cho phép chèn từ ngoài", so.demSo() === 1, `nhận: ${so.demSo()}`);

  so.layMacDinh().thanhPho = "HACKED";
  const so2 = taoSoDiaChi();
  so2.them({ duong: "34 Lê Lợi" });
  ok("⭐ layMacDinh() không cho sửa giá trị mặc định",
    so2.layTatCa()[0].thanhPho === "Hà Nội", `nhận: ${so2.layTatCa()[0].thanhPho}`);
} catch (e) {
  tong_ += 2;
  console.log("❌ " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong_}\n`);

// ###########################################################################
// 📝 TODO 4 — Viết lại taoGioHang bằng class + private field (#)
//
//   class GioHang {
//     #cacMon = [];
//     ...
//   }
//
//   Rồi trả lời câu hỏi ở phần thảo luận.
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) So sánh factory module (closure) và class (#private):
//      - cách nào tốn ít bộ nhớ hơn khi tạo 10.000 instance? Vì sao?
//      - cách nào dễ đọc hơn với người đến từ Java/C#?
//      - cách nào hợp với JSON.stringify hơn?
//      TRẢ LỜI: ...........................................................
//
//   b) Trong TODO 3, vì sao trả về macDinh nguy hiểm hơn trả về diaChi?
//      (gợi ý: nghĩ tới việc nó được dùng cho MỌI địa chỉ thêm sau đó)
//      TRẢ LỜI: ...........................................................
//
//   c) Nếu giỏ hàng cần lưu vào localStorage rồi khôi phục, cách nào
//      (closure hay class) làm việc đó dễ hơn?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
