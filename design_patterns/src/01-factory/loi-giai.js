/**
 * LỜI GIẢI BÀI TẬP 01 — FACTORY
 * Chạy: node src/01-factory/loi-giai.js
 */

const duLieu = [
  { thang: "01/2026", doanhThu: 120_000_000, donHang: 340 },
  { thang: "02/2026", doanhThu: 98_500_000, donHang: 287 },
  { thang: "03/2026", doanhThu: 156_200_000, donHang: 412 },
];

// ---------------------------------------------------------------------------
// CÁC SẢN PHẨM — cùng hợp đồng: .xuat(duLieu) → string
// ---------------------------------------------------------------------------
class XuatCsv {
  xuat(duLieu) {
    const cot = Object.keys(duLieu[0]);
    const dong = duLieu.map((r) => cot.map((c) => r[c]).join(","));
    return [cot.join(","), ...dong].join("\n");
  }
}

class XuatJson {
  xuat(duLieu) {
    return JSON.stringify(duLieu, null, 2);
  }
}

class XuatMarkdown {
  xuat(duLieu) {
    const cot = Object.keys(duLieu[0]);
    // Tính độ rộng mỗi cột để bảng thẳng hàng
    const rong = cot.map((c) =>
      Math.max(c.length, ...duLieu.map((r) => String(r[c]).length))
    );
    const dongCua = (o) => "| " + o.map((v, i) => String(v).padEnd(rong[i])).join(" | ") + " |";
    return [
      dongCua(cot),
      dongCua(rong.map((w) => "-".repeat(w))),
      ...duLieu.map((r) => dongCua(cot.map((c) => r[c]))),
    ].join("\n");
  }
}

// ---------------------------------------------------------------------------
// CÁCH 1 — SIMPLE FACTORY (switch)
// ---------------------------------------------------------------------------
function taoBoXuatSwitch(dinhDang) {
  switch (dinhDang) {
    case "csv":
      return new XuatCsv();
    case "json":
      return new XuatJson();
    case "markdown":
      return new XuatMarkdown();
    default:
      throw new Error(
        `Không hỗ trợ định dạng "${dinhDang}". Có sẵn: csv, json, markdown`
      );
  }
}

// ---------------------------------------------------------------------------
// CÁCH 2 — REGISTRY (đáp án TODO 4)
// Ưu điểm: thêm định dạng mới KHÔNG cần sửa hàm taoBoXuat().
// ---------------------------------------------------------------------------
const REGISTRY = new Map();

function dangKyBoXuat(ten, factoryFn) {
  if (REGISTRY.has(ten)) throw new Error(`Định dạng "${ten}" đã được đăng ký`);
  REGISTRY.set(ten, factoryFn);
}

function taoBoXuat(dinhDang) {
  const factoryFn = REGISTRY.get(dinhDang);
  if (!factoryFn) {
    throw new Error(
      `Không hỗ trợ định dạng "${dinhDang}". Có sẵn: ${[...REGISTRY.keys()].join(", ")}`
    );
  }
  return factoryFn();
}

dangKyBoXuat("csv", () => new XuatCsv());
dangKyBoXuat("json", () => new XuatJson());
dangKyBoXuat("markdown", () => new XuatMarkdown());

// ---------------------------------------------------------------------------
// NƠI SỬ DỤNG — không còn chữ "new" nào
// ---------------------------------------------------------------------------
function xuatBaoCao(duLieu, dinhDang) {
  const boXuat = taoBoXuat(dinhDang);
  return boXuat.xuat(duLieu);
}

// ---------------------------------------------------------------------------
// CHẠY THỬ
// ---------------------------------------------------------------------------
for (const dinhDang of ["csv", "json", "markdown"]) {
  console.log(`\n----- ${dinhDang.toUpperCase()} -----`);
  console.log(xuatBaoCao(duLieu, dinhDang));
}

console.log("\n----- ĐỊNH DẠNG KHÔNG TỒN TẠI -----");
try {
  xuatBaoCao(duLieu, "pdf");
} catch (e) {
  console.log("✅ Ném lỗi đúng như mong đợi: " + e.message);
}

// ---------------------------------------------------------------------------
// ĐÂY LÀ ĐIỂM MẤU CHỐT CỦA TODO 4:
// Thêm định dạng mới ở đây — KHÔNG hề động vào taoBoXuat() phía trên.
// Trong dự án thật, đoạn này nằm ở một file plugin riêng.
// ---------------------------------------------------------------------------
class XuatHtml {
  xuat(duLieu) {
    const cot = Object.keys(duLieu[0]);
    const th = cot.map((c) => `<th>${c}</th>`).join("");
    const tr = duLieu
      .map((r) => `  <tr>${cot.map((c) => `<td>${r[c]}</td>`).join("")}</tr>`)
      .join("\n");
    return `<table>\n  <tr>${th}</tr>\n${tr}\n</table>`;
  }
}

dangKyBoXuat("html", () => new XuatHtml());

console.log("\n----- HTML (thêm vào mà không sửa factory) -----");
console.log(xuatBaoCao(duLieu, "html"));

// ---------------------------------------------------------------------------
// 💭 TRẢ LỜI CÂU HỎI THẢO LUẬN
// ---------------------------------------------------------------------------
console.log(`
═══════════════════════════════════════════════════════════════
💭 THẢO LUẬN — "pdf" bị sửa tay vào DB

a) Lỗi xảy ra lúc RUNTIME, khi người dùng bấm "Tải báo cáo".
   Không có công cụ nào bắt được lúc viết code, vì "pdf" chỉ là một string.
   Đây là cái giá của Factory dựa trên string. Nếu dùng TypeScript, ta có thể
   thu hẹp rủi ro bằng union type: type DinhDang = "csv" | "json" | "markdown".

b) NÉM LỖI hay TRẢ VỀ MẶC ĐỊNH?

   → Ném lỗi khi: đây là lỗi lập trình/dữ liệu bẩn, cần phát hiện sớm.
     Im lặng trả về CSV sẽ khiến người dùng tải file sai định dạng mà
     không ai biết, và bug sống trong hệ thống hàng tháng.

   → Trả về mặc định khi: tính năng không thiết yếu và trải nghiệm quan
     trọng hơn tính đúng đắn tuyệt đối (ví dụ: theme giao diện lạ → dùng
     theme sáng, tốt hơn là hiện màn hình trắng).

   Quy tắc thực dụng: NÉM LỖI + ghi log + ở tầng UI thì bắt lỗi và hiện
   thông báo thân thiện. Đừng nuốt lỗi ngay tại factory — factory không có
   đủ ngữ cảnh để biết cách xử lý phù hợp.
═══════════════════════════════════════════════════════════════`);
