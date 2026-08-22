/**
 * LỜI GIẢI BÀI TẬP 03 — BUILDER
 * Chạy: node src/03-builder/loi-giai.js
 */

class TruyVanSQLBuilder {
  constructor() {
    this._cot = [];
    this._bang = null;
    this._dieuKien = []; // [{ menh: "tuoi > ?", giaTri: 18 }]
    this._sapXep = [];
    this._gioiHan = null;
  }

  chon(...cot) {
    this._cot.push(...cot);
    return this;
  }

  tuBang(ten) {
    this._bang = ten;
    return this;
  }

  dieuKien(cot, toanTu, giaTri) {
    const TOAN_TU_HOP_LE = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN"];
    if (!TOAN_TU_HOP_LE.includes(toanTu)) {
      throw new Error(`Toán tử không hợp lệ: ${toanTu}`);
    }
    // ⚠️ ĐIỂM MẤU CHỐT: chỉ đưa PLACEHOLDER vào chuỗi SQL,
    //    giá trị đi đường riêng qua mảng thamSo.
    this._dieuKien.push({ menh: `${cot} ${toanTu} ?`, giaTri });
    return this;
  }

  sapXep(cot, huong = "ASC") {
    const h = String(huong).toUpperCase();
    if (!["ASC", "DESC"].includes(h)) throw new Error(`Hướng sắp xếp không hợp lệ: ${huong}`);
    this._sapXep.push(`${cot} ${h}`);
    return this;
  }

  gioiHan(n) {
    this._gioiHan = n;
    return this;
  }

  clone() {
    const b = new TruyVanSQLBuilder();
    b._bang = this._bang;
    b._gioiHan = this._gioiHan;
    // ⚠️ Phải sao chép MẢNG, không dùng chung tham chiếu
    b._cot = [...this._cot];
    b._dieuKien = this._dieuKien.map((d) => ({ ...d }));
    b._sapXep = [...this._sapXep];
    return b;
  }

  build() {
    // ---- Kiểm tra hợp lệ: lý do tồn tại của build() ----
    if (!this._bang) throw new Error("Truy vấn phải có bảng — gọi .tuBang() trước");
    if (this._gioiHan !== null) {
      if (!Number.isInteger(this._gioiHan) || this._gioiHan <= 0) {
        throw new Error(`gioiHan phải là số nguyên dương, nhận được: ${this._gioiHan}`);
      }
    }

    // ---- Ghép câu lệnh ----
    const phan = [`SELECT ${this._cot.length ? this._cot.join(", ") : "*"}`, `FROM ${this._bang}`];

    if (this._dieuKien.length) {
      phan.push("WHERE " + this._dieuKien.map((d) => d.menh).join(" AND "));
    }
    if (this._sapXep.length) {
      phan.push("ORDER BY " + this._sapXep.join(", "));
    }
    if (this._gioiHan !== null) {
      phan.push(`LIMIT ${this._gioiHan}`);
    }

    return {
      sql: phan.join(" "),
      thamSo: this._dieuKien.map((d) => d.giaTri),
    };
  }
}

// ===========================================================================
// BỘ KIỂM THỬ
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

kiemTra("Truy vấn tối giản", () => new TruyVanSQLBuilder().tuBang("nguoi_dung").build(), {
  sql: "SELECT * FROM nguoi_dung",
  thamSo: [],
});

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
kiemTraLoi("Toán tử lạ → lỗi", () =>
  new TruyVanSQLBuilder().tuBang("a").dieuKien("x", "DROP", 1)
);

// ---------------------------------------------------------------------------
console.log("\n=== KIỂM THỬ CHỐNG SQL INJECTION ===\n");
tong++;
const doAc = "'; DROP TABLE nguoi_dung; --";
const kq = new TruyVanSQLBuilder().tuBang("nguoi_dung").dieuKien("ten", "=", doAc).build();
if (kq.sql.includes("DROP TABLE")) {
  console.log("❌ NGUY HIỂM! Giá trị bị nối thẳng vào SQL: " + kq.sql);
} else {
  dat++;
  console.log("✅ An toàn:");
  console.log("   sql   :", kq.sql);
  console.log("   thamSo:", kq.thamSo);
  console.log("\n   Driver sẽ gửi sql và thamSo TÁCH RIÊNG tới database.");
  console.log("   Database coi thamSo thuần túy là DỮ LIỆU, không bao giờ là LỆNH.");
}

// ---------------------------------------------------------------------------
console.log("\n=== NÂNG CAO: CLONE ===\n");

const nen = new TruyVanSQLBuilder().chon("id", "tong_tien").tuBang("don_hang").dieuKien("nam", "=", 2026);

const donHN = nen.clone().dieuKien("thanh_pho", "=", "Hà Nội").build();
const donHCM = nen.clone().dieuKien("thanh_pho", "=", "TP.HCM").gioiHan(5).build();

console.log("Hà Nội :", donHN.sql, "|", JSON.stringify(donHN.thamSo));
console.log("TP.HCM :", donHCM.sql, "|", JSON.stringify(donHCM.thamSo));

tong++;
const nenSauKhiClone = nen.build();
if (nenSauKhiClone.thamSo.length === 1) {
  dat++;
  console.log("\n✅ Builder nền KHÔNG bị nhiễm bẩn:", nenSauKhiClone.sql);
} else {
  console.log("\n❌ Builder nền bị nhiễm bẩn — clone dùng chung tham chiếu mảng!");
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Vì sao build() trả về { sql, thamSo } chứ không phải một chuỗi?
   → Vì đó là hai loại dữ liệu có mức tin cậy KHÁC NHAU. sql do lập trình
     viên viết (tin được), thamSo đến từ người dùng (không tin được).
     Trộn chúng vào một chuỗi là xóa bỏ ranh giới đó — và đó chính xác là
     định nghĩa của lỗ hổng SQL injection.

     Đây là một bài học vượt ra ngoài Builder: hãy giữ DỮ LIỆU và LỆNH ở
     hai đường riêng, càng lâu càng tốt.

b) Object tham số thay cho Builder thì khó hơn ở đâu?
   → 1. Tích lũy: dieuKien() gọi 5 lần rất tự nhiên; với object bạn phải tự
        dựng mảng và tự lo thứ tự.
     2. Clone/biến thể: nen.clone().them(...) gọn hơn hẳn việc deep-copy
        một object cấu hình lồng nhau.
     3. Kiểm tra hợp lệ theo từng bước: dieuKien() chặn toán tử lạ NGAY khi
        gọi, chỉ ra đúng dòng code sai. Object tham số chỉ phát hiện được
        ở cuối, khi ngữ cảnh đã mất.

     Nhưng cũng công bằng mà nói: nếu truy vấn của bạn luôn cố định, một
     hàm nhận object là đủ và ngắn hơn 60 dòng. Đừng viết Builder vì nó
     "trông chuyên nghiệp".
═══════════════════════════════════════════════════════════════`);
