/**
 * BÀI TẬP 17 — REACTIVE / SIGNAL
 * Chạy: node src/17-signal/bai-tap.js
 *
 * Tự viết lại lõi của Vue / Solid / Svelte 5.
 */

// ###########################################################################
// 📝 TODO 1 — signal(giaTri)
//
//   const s = signal(5);
//   s()          → đọc giá trị (và TỰ ĐỘNG đăng ký nếu đang trong effect)
//   s.set(10)    → ghi giá trị và báo cho mọi người phụ thuộc
//   s.soNguoiPhuThuoc()  → số effect đang theo dõi (để test kiểm tra)
//
//   ⚠️ set() với giá trị KHÔNG ĐỔI (Object.is) thì KHÔNG được thông báo.
// ###########################################################################

let dangChay = null;
let hangDoi = null;

function signal(giaTriBanDau) {
  // TODO
}

// ###########################################################################
// 📝 TODO 2 — effect(fn)
//
//   - Chạy fn ngay lập tức một lần
//   - Tự động chạy lại khi bất kỳ signal nào nó ĐỌC bị thay đổi
//   - Trả về hàm dừng() để hủy theo dõi
//
//   ⚠️ QUAN TRỌNG: mỗi lần chạy lại phải DỌN SẠCH phụ thuộc cũ trước.
//      Nếu không, nhánh code không còn dùng vẫn đánh thức effect này.
//
//   Tùy chọn { laNoiBo: true } dùng cho effect bên trong computed —
//   cần cho batch() ở TODO 4.
// ###########################################################################

function effect(fn, tuyChon = {}) {
  // TODO
  return () => {};
}

// ###########################################################################
// 📝 TODO 3 — computed(fn)
//
//   const tong = computed(() => a() + b());
//   tong()  → giá trị hiện tại (có NHỚ, không tính lại nếu chưa đổi)
//   Phải lồng nhiều tầng được: computed dựa trên computed khác.
//   tong.soLanTinh()  → để test đếm số lần tính (kiểm tra memo)
// ###########################################################################

function computed(fn) {
  // TODO
}

// ###########################################################################
// 📝 TODO 4 — batch(fn)
//
//   batch(() => { a.set(1); b.set(2); })
//   → effect của người dùng chỉ chạy ĐÚNG MỘT LẦN ở cuối, với dữ liệu
//     đã nhất quán hoàn toàn.
//
//   ⚠️ BẪY: nếu gom mọi thứ vào MỘT hàng đợi, effect người dùng sẽ chạy
//      khi các computed còn chưa ổn định → vẫn glitch.
//      Gợi ý: tách hàng đợi "nội bộ" (computed) và "người dùng",
//      chạy nội bộ tới khi ổn định TRƯỚC, rồi mới chạy người dùng.
// ###########################################################################

function batch(fn) {
  // TODO
  return fn();
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

console.log("=== TEST 1: signal cơ bản ===\n");
try {
  const s = signal(5);
  ok("Đọc được giá trị ban đầu", s() === 5);
  s.set(10);
  ok("Ghi rồi đọc lại được", s() === 10);
} catch (e) {
  tong_ += 2;
  console.log("❌ Chưa làm TODO 1 — " + e.message);
}

console.log("\n=== TEST 2: effect tự động chạy lại ===\n");
try {
  const s = signal(1);
  const thay = [];
  effect(() => thay.push(s()));

  ok("Effect chạy ngay lần đầu", thay.length === 1 && thay[0] === 1, JSON.stringify(thay));
  s.set(2);
  s.set(3);
  ok("Effect chạy lại khi signal đổi", thay.join(",") === "1,2,3", thay.join(","));

  s.set(3);
  ok("⭐ KHÔNG chạy lại khi giá trị không đổi", thay.length === 3, `${thay.length} lần`);

  const s2 = signal(0);
  const thay2 = [];
  const dung = effect(() => thay2.push(s2()));
  dung();
  s2.set(99);
  ok("Hàm dừng() hoạt động", thay2.length === 1, `${thay2.length} lần`);
} catch (e) {
  tong_ += 4;
  console.log("❌ Chưa làm TODO 2 — " + e.message);
}

console.log("\n=== TEST 3: computed ===\n");
try {
  const a = signal(2);
  const b = signal(3);
  const tong = computed(() => a() + b());
  ok("computed tính đúng", tong() === 5, String(tong()));

  a.set(10);
  ok("computed cập nhật khi nguồn đổi", tong() === 13, String(tong()));

  // Nhiều tầng: computed dựa trên một computed khác
  const nhanDoi = computed(() => tong() * 2);
  ok("computed lồng computed", nhanDoi() === 26, String(nhanDoi()));
  b.set(0);
  ok("Lan truyền qua nhiều tầng", nhanDoi() === 20, String(nhanDoi()));

  // Có nhớ
  const c = signal(1);
  const dat_ = computed(() => c() * 2);
  dat_();
  dat_();
  dat_();
  ok("⭐ computed có NHỚ (đọc 3 lần không tính lại 3 lần)",
    dat_.soLanTinh() === 1, `tính ${dat_.soLanTinh()} lần`);
} catch (e) {
  tong_ += 5;
  console.log("❌ Chưa làm TODO 3 — " + e.message);
}

console.log("\n=== TEST 4: ⭐ dọn phụ thuộc cũ ===\n");
try {
  const hien = signal(true);
  const chiTiet = signal("A");
  let soLanChay = 0;

  effect(() => {
    soLanChay++;
    if (hien()) chiTiet();
  });

  ok("Ban đầu chiTiet có người theo dõi", chiTiet.soNguoiPhuThuoc() === 1,
    `${chiTiet.soNguoiPhuThuoc()}`);

  hien.set(false);
  ok("⭐ Sau khi nhánh không còn dùng, chiTiet KHÔNG còn người theo dõi",
    chiTiet.soNguoiPhuThuoc() === 0, `${chiTiet.soNguoiPhuThuoc()}`);

  soLanChay = 0;
  chiTiet.set("B");
  ok("⭐ Đổi chiTiet không đánh thức effect nữa", soLanChay === 0, `${soLanChay} lần`);
} catch (e) {
  tong_ += 3;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 5: ⭐ batch ===\n");
try {
  const a = signal(1);
  const b = signal(2);
  const tong = computed(() => a() + b());
  let soLanVe = 0;
  effect(() => {
    tong();
    soLanVe++;
  });

  soLanVe = 0;
  a.set(10);
  b.set(20);
  const khongBatch = soLanVe;

  soLanVe = 0;
  batch(() => {
    a.set(100);
    b.set(200);
  });
  ok("⭐ batch gom thành ĐÚNG MỘT lần chạy", soLanVe === 1,
    `không batch: ${khongBatch} lần, có batch: ${soLanVe} lần`);
  ok("Giá trị cuối cùng đúng", tong() === 300, String(tong()));
} catch (e) {
  tong_ += 2;
  console.log("❌ Chưa làm TODO 4 — " + e.message);
}

console.log("\n=== TEST 6: giỏ hàng thực tế ===\n");
try {
  const soLuong = signal(2);
  const donGia = signal(250_000);
  const tamTinh = computed(() => soLuong() * donGia());
  const phiShip = computed(() => (tamTinh() >= 500_000 ? 0 : 30_000));
  const tongCong = computed(() => tamTinh() + phiShip());

  ok("2 × 250k = 500k → freeship → tổng 500k", tongCong() === 500_000, String(tongCong()));
  soLuong.set(1);
  ok("1 × 250k = 250k → ship 30k → tổng 280k", tongCong() === 280_000, String(tongCong()));
  donGia.set(600_000);
  ok("1 × 600k → freeship → tổng 600k", tongCong() === 600_000, String(tongCong()));
} catch (e) {
  tong_ += 3;
  console.log("❌ " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong_}\n`);

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Phụ thuộc được phát hiện TỰ ĐỘNG lúc chạy. So với React (bắt bạn
//      viết mảng dependency bằng tay), cách nào tốt hơn? Nêu ưu/nhược
//      của cả hai, đừng chỉ khen một bên.
//      TRẢ LỜI: ...........................................................
//
//   b) Nếu signal chứa OBJECT thay vì số, điều gì thay đổi? Vì sao
//      s.set({a:1}) hai lần liên tiếp lại thông báo 2 lần?
//      TRẢ LỜI: ...........................................................
//
//   c) effect() có thể gọi s.set() không? Chuyện gì xảy ra nếu nó ghi vào
//      chính signal mà nó đọc?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
