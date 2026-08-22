/**
 * BÀI TẬP KHỞI ĐỘNG — chưa dùng pattern nào cả.
 *
 * Chạy:  node src/00-gioi-thieu/bai-tap.js
 *
 * Đây là code "đời thực" mà bạn sẽ gặp trong mọi dự án. Nó CHẠY ĐÚNG.
 * Nhiệm vụ của bạn không phải là sửa nó, mà là NHÌN RA vì sao nó sẽ trở thành gánh nặng.
 */

// ---------------------------------------------------------------------------
// Tính phí vận chuyển cho một đơn hàng
// ---------------------------------------------------------------------------
function tinhPhiShip(hang, donHang) {
  if (hang === "ghtk") {
    // GHTK: 15k cơ bản, cộng 5k mỗi kg vượt quá 1kg
    let phi = 15000;
    if (donHang.canNang > 1) {
      phi += (donHang.canNang - 1) * 5000;
    }
    return phi;
  } else if (hang === "ghn") {
    // GHN: tính theo vùng, miễn phí đơn trên 500k
    if (donHang.giaTri >= 500000) return 0;
    return donHang.noiThanh ? 20000 : 35000;
  } else if (hang === "viettel-post") {
    // Viettel Post: 2% giá trị đơn, tối thiểu 12k, tối đa 60k
    const phi = donHang.giaTri * 0.02;
    return Math.min(Math.max(phi, 12000), 60000);
  } else {
    throw new Error("Không hỗ trợ hãng vận chuyển: " + hang);
  }
}

// Ngoài ra, chỗ khác trong hệ thống còn cần biết thời gian giao dự kiến...
function thoiGianGiao(hang) {
  if (hang === "ghtk") return "1-2 ngày";
  else if (hang === "ghn") return "2-3 ngày";
  else if (hang === "viettel-post") return "3-5 ngày";
  else throw new Error("Không hỗ trợ hãng vận chuyển: " + hang);
}

// ...và màn hình checkout cần danh sách hãng để hiển thị
function danhSachHangVanChuyen() {
  return ["ghtk", "ghn", "viettel-post"];
}

// ---------------------------------------------------------------------------
// Chạy thử
// ---------------------------------------------------------------------------
const donHang = { canNang: 2.5, giaTri: 320000, noiThanh: true };

console.log("Đơn hàng:", donHang);
console.log("");
for (const hang of danhSachHangVanChuyen()) {
  const phi = tinhPhiShip(hang, donHang).toLocaleString("vi-VN");
  console.log(`  ${hang.padEnd(14)} → ${phi.padStart(7)} đ  (${thoiGianGiao(hang)})`);
}

// ===========================================================================
// 📝 NHIỆM VỤ CỦA BẠN
// ===========================================================================
//
// Sếp vừa báo: tuần sau tích hợp thêm "J&T Express" và "SPX (Shopee Express)".
//
// Câu hỏi 1: Để thêm MỘT hãng mới, bạn phải sửa bao nhiêu chỗ trong file này?
//            Liệt kê tên từng hàm.
//
//   TRẢ LỜI: ...........................................................
//
// Câu hỏi 2: Nếu quên sửa một trong những chỗ đó, chuyện gì xảy ra?
//            Lỗi sẽ xuất hiện lúc nào — lúc viết code, hay lúc khách bấm đặt hàng?
//
//   TRẢ LỜI: ...........................................................
//
// Câu hỏi 3: Đội của bạn có 3 người, mỗi người tích hợp 1 hãng cùng lúc.
//            Điều gì sẽ xảy ra khi cả 3 cùng merge?
//
//   TRẢ LỜI: ...........................................................
//
// ⚠️ CHƯA SỬA GÌ CẢ. Ta sẽ quay lại chính file này ở Bài 09 — Strategy.
// ===========================================================================
