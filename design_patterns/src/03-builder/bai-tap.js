/**
 * BÀI TẬP 03 — BUILDER
 * Chạy: node src/03-builder/bai-tap.js
 *
 * Đề: Xây TruyVanSQLBuilder sinh câu lệnh SELECT một cách an toàn.
 */

// ===========================================================================
// 📝 TODO — Hoàn thiện class dưới đây
//
//   Các phương thức cần có (tất cả đều return this, trừ build):
//     .chon(...cot)              → SELECT cot1, cot2   (không gọi → SELECT *)
//     .tuBang(ten)               → FROM ten
//     .dieuKien(cot, toanTu, gt) → WHERE ... (gọi nhiều lần thì nối bằng AND)
//     .sapXep(cot, huong)        → ORDER BY cot ASC|DESC  (mặc định ASC)
//     .gioiHan(n)                → LIMIT n
//     .build()                   → { sql, thamSo }
//
//   ⚠️ QUY TẮC AN TOÀN (quan trọng nhất bài này):
//      .dieuKien() KHÔNG được nối giá trị vào chuỗi SQL.
//      Phải sinh dấu ? và đẩy giá trị vào mảng thamSo.
//      Vì sao? Xem phần kiểm thử SQL injection ở cuối file.
//
//   ⚠️ build() phải ném lỗi khi:
//      - chưa gọi tuBang()
//      - gioiHan(n) với n <= 0 hoặc không phải số nguyên
// ===========================================================================

class TruyVanSQLBuilder {
  constructor() {
    // TODO: khởi tạo các trường nội bộ
  }

  chon(...cot) {
    // TODO
    return this;
  }

  tuBang(ten) {
    // TODO
    return this;
  }

  dieuKien(cot, toanTu, giaTri) {
    // TODO — nhớ dùng placeholder ?
    return this;
  }

  sapXep(cot, huong = "ASC") {
    // TODO
    return this;
  }

  gioiHan(n) {
    // TODO
    return this;
  }

  build() {
    // TODO — kiểm tra hợp lệ, rồi trả về { sql, thamSo }
    return { sql: "", thamSo: [] };
  }
}

// ===========================================================================
// BỘ KIỂM THỬ — chạy để tự chấm bài
// ===========================================================================
let dat = 0;
let tong = 0;

function kiemTra(ten, ham, mongDoi) {
  tong++;
  let thucTe;
  try {
    thucTe = JSON.stringify(ham());
  } catch (e) {
    thucTe = "LỖI: " + e.message;
  }
  const ok = thucTe === JSON.stringify(mongDoi);
  if (ok) dat++;
  console.log(`${ok ? "✅" : "❌"} ${ten}`);
  if (!ok) {
    console.log(`     mong đợi: ${JSON.stringify(mongDoi)}`);
    console.log(`     thực tế : ${thucTe}`);
  }
}

function kiemTraLoi(ten, ham) {
  tong++;
  try {
    ham();
    console.log(`❌ ${ten} — đáng lẽ phải ném lỗi`);
  } catch (e) {
    dat++;
    console.log(`✅ ${ten} — ${e.message}`);
  }
}

console.log("=== KIỂM THỬ ===\n");

kiemTra(
  "Truy vấn tối giản",
  () => new TruyVanSQLBuilder().tuBang("nguoi_dung").build(),
  { sql: "SELECT * FROM nguoi_dung", thamSo: [] }
);

kiemTra(
  "Chọn cột cụ thể",
  () => new TruyVanSQLBuilder().chon("id", "ten").tuBang("nguoi_dung").build(),
  { sql: "SELECT id, ten FROM nguoi_dung", thamSo: [] }
);

kiemTra(
  "Một điều kiện",
  () => new TruyVanSQLBuilder().tuBang("nguoi_dung").dieuKien("tuoi", ">", 18).build(),
  { sql: "SELECT * FROM nguoi_dung WHERE tuoi > ?", thamSo: [18] }
);

kiemTra(
  "Nhiều điều kiện nối bằng AND",
  () =>
    new TruyVanSQLBuilder()
      .chon("id", "ten")
      .tuBang("nguoi_dung")
      .dieuKien("tuoi", ">", 18)
      .dieuKien("thanh_pho", "=", "Hà Nội")
      .sapXep("ten")
      .gioiHan(10)
      .build(),
  {
    sql: "SELECT id, ten FROM nguoi_dung WHERE tuoi > ? AND thanh_pho = ? ORDER BY ten ASC LIMIT 10",
    thamSo: [18, "Hà Nội"],
  }
);

kiemTra(
  "Sắp xếp giảm dần",
  () => new TruyVanSQLBuilder().tuBang("don_hang").sapXep("ngay_tao", "DESC").build(),
  { sql: "SELECT * FROM don_hang ORDER BY ngay_tao DESC", thamSo: [] }
);

kiemTraLoi("Thiếu tuBang() → lỗi", () => new TruyVanSQLBuilder().chon("id").build());
kiemTraLoi("gioiHan(0) → lỗi", () => new TruyVanSQLBuilder().tuBang("a").gioiHan(0).build());
kiemTraLoi("gioiHan(-5) → lỗi", () => new TruyVanSQLBuilder().tuBang("a").gioiHan(-5).build());

// ---------------------------------------------------------------------------
// KIỂM THỬ AN TOÀN — vì sao phải dùng placeholder ?
// ---------------------------------------------------------------------------
console.log("\n=== KIỂM THỬ CHỐNG SQL INJECTION ===\n");
tong++;
const doAc = "'; DROP TABLE nguoi_dung; --";
const kq = new TruyVanSQLBuilder().tuBang("nguoi_dung").dieuKien("ten", "=", doAc).build();
if (kq.sql.includes("DROP TABLE")) {
  console.log("❌ NGUY HIỂM! Giá trị người dùng bị nối thẳng vào SQL:");
  console.log("   " + kq.sql);
} else {
  dat++;
  console.log("✅ An toàn. Giá trị độc hại nằm trong thamSo, không nằm trong SQL:");
  console.log("   sql   :", kq.sql);
  console.log("   thamSo:", kq.thamSo);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ===========================================================================
// 📝 TODO NÂNG CAO — thêm .clone()
//
//   const nen = new TruyVanSQLBuilder().tuBang("don_hang").dieuKien("nam", "=", 2026);
//   const donHN  = nen.clone().dieuKien("tp", "=", "Hà Nội").build();
//   const donHCM = nen.clone().dieuKien("tp", "=", "TP.HCM").build();
//
//   ⚠️ Cẩn thận: clone phải sao chép MẢNG điều kiện, không dùng chung tham chiếu.
//      Hãy tự viết một test chứng minh bạn không mắc bẫy này.
// ===========================================================================

// ===========================================================================
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Vì sao build() trả về { sql, thamSo } chứ không phải chỉ một chuỗi SQL?
//      TRẢ LỜI: ...........................................................
//
//   b) Nếu dùng object tham số thay vì Builder:
//        taoTruyVan({ bang: "nguoi_dung", dieuKien: [...] })
//      Điều gì trở nên khó hơn?
//      TRẢ LỜI: ...........................................................
// ===========================================================================
