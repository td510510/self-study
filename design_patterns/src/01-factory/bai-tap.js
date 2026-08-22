/**
 * BÀI TẬP 01 — FACTORY
 * Chạy: node src/01-factory/bai-tap.js
 *
 * Bối cảnh: hệ thống xuất báo cáo doanh thu. Hiện chỉ hỗ trợ CSV.
 * Sếp muốn thêm JSON và Markdown. Tuần sau chắc thêm HTML.
 */

// ---------------------------------------------------------------------------
// DỮ LIỆU MẪU (không cần sửa)
// ---------------------------------------------------------------------------
const duLieu = [
  { thang: "01/2026", doanhThu: 120_000_000, donHang: 340 },
  { thang: "02/2026", doanhThu: 98_500_000, donHang: 287 },
  { thang: "03/2026", doanhThu: 156_200_000, donHang: 412 },
];

// ---------------------------------------------------------------------------
// SẢN PHẨM CÓ SẴN — dùng làm mẫu cho "hợp đồng"
// Hợp đồng: mọi bộ xuất đều có .xuat(duLieu) trả về string
// ---------------------------------------------------------------------------
class XuatCsv {
  xuat(duLieu) {
    const cot = Object.keys(duLieu[0]);
    const dong = duLieu.map((r) => cot.map((c) => r[c]).join(","));
    return [cot.join(","), ...dong].join("\n");
  }
}

// ===========================================================================
// 📝 TODO 1 — Viết class XuatJson
//    Gợi ý: JSON.stringify(duLieu, null, 2)
// ===========================================================================

// class XuatJson { ... }

// ===========================================================================
// 📝 TODO 2 — Viết class XuatMarkdown
//    Kết quả mong muốn:
//      | thang   | doanhThu  | donHang |
//      | ---     | ---       | ---     |
//      | 01/2026 | 120000000 | 340     |
// ===========================================================================

// class XuatMarkdown { ... }

// ===========================================================================
// 📝 TODO 3 — Viết Simple Factory
//    taoBoXuat("csv" | "json" | "markdown") → trả về object có .xuat()
//    Định dạng không hỗ trợ → ném Error với thông báo rõ ràng,
//    có liệt kê các định dạng đang có.
// ===========================================================================

function taoBoXuat(dinhDang) {
  // TODO: thay thế phần thân hàm này
  return new XuatCsv();
}

// ---------------------------------------------------------------------------
// NƠI SỬ DỤNG
// ⚠️ ĐIỀU KIỆN NGHIỆM THU: hàm dưới đây KHÔNG được chứa chữ "new"
// ---------------------------------------------------------------------------
function xuatBaoCao(duLieu, dinhDang) {
  const boXuat = taoBoXuat(dinhDang);
  return boXuat.xuat(duLieu);
}

// ---------------------------------------------------------------------------
// CHẠY THỬ — cả 3 dòng dưới đây phải chạy được sau khi bạn làm xong
// ---------------------------------------------------------------------------
for (const dinhDang of ["csv", "json", "markdown"]) {
  console.log(`\n----- ${dinhDang.toUpperCase()} -----`);
  try {
    console.log(xuatBaoCao(duLieu, dinhDang));
  } catch (e) {
    console.log("❌ " + e.message);
  }
}

console.log("\n----- ĐỊNH DẠNG KHÔNG TỒN TẠI -----");
try {
  xuatBaoCao(duLieu, "pdf");
  console.log("❌ Đáng lẽ phải ném lỗi!");
} catch (e) {
  console.log("✅ " + e.message);
}

// ===========================================================================
// 📝 TODO 4 (NÂNG CAO) — Chuyển sang Registry
//
//   Thay switch bằng một Map. Viết hàm dangKyBoXuat(ten, factoryFn).
//   Sau đó thêm XuatHtml Ở CUỐI FILE NÀY mà KHÔNG sửa hàm taoBoXuat().
//   Đó chính là ý nghĩa của Open/Closed.
// ===========================================================================

// ===========================================================================
// 💭 CÂU HỎI THẢO LUẬN
//
//   Định dạng báo cáo do người dùng chọn trên UI và được lưu vào DB.
//   Một hôm có người sửa tay giá trị trong DB thành "pdf".
//
//   a) Lỗi xảy ra ở đâu? Người dùng nhìn thấy gì?
//   b) Factory của bạn nên ném lỗi, hay nên trả về một bộ xuất mặc định?
//      Lập luận cho cả hai phía.
//
//   TRẢ LỜI: ..............................................................
// ===========================================================================
