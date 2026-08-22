/**
 * BÀI TẬP 12 — STATE
 * Chạy: node src/12-state/bai-tap.js
 *
 * Đề: máy trạng thái đơn hàng — 5 trạng thái, 5 hành động.
 */

// ###########################################################################
// SƠ ĐỒ CẦN CÀI ĐẶT
//
//   [tạo đơn] → ChoThanhToan
//
//   ChoThanhToan   --thanhToan-->      DangChuanBi
//   ChoThanhToan   --huy-->            DaHuy
//   ChoThanhToan   --capNhatDiaChi-->  (giữ nguyên, đổi được địa chỉ)
//
//   DangChuanBi    --giaoHang-->       DangGiao
//   DangChuanBi    --huy-->            DaHuy   (kèm NHẢ HÀNG về kho)
//   DangChuanBi    --capNhatDiaChi-->  (giữ nguyên)
//
//   DangGiao       --xacNhanNhan-->    DaGiao
//   DangGiao       --huy-->            ❌ CẤM
//   DangGiao       --capNhatDiaChi-->  ❌ CẤM
//
//   DaGiao         → mọi hành động đều CẤM
//   DaHuy          → mọi hành động đều CẤM
//
//   HOOK khiVao():
//     DangChuanBi → ghi nhật ký "giữ hàng"
//     DangGiao    → sinh don.maVanDon + ghi nhật ký
//     DaGiao      → ghi nhật ký "cộng điểm"
//     DaHuy       → ghi nhật ký lý do hủy
// ###########################################################################

// ===========================================================================
// 📝 TODO 1 — TrangThaiCoSo
//
//   Mặc định MỌI hành động đều ném lỗi có nội dung rõ ràng, nêu được
//   tên trạng thái hiện tại. Đây là "mặc định an toàn": lớp con nào
//   không định nghĩa lại thì hành động đó tự động bị cấm.
// ===========================================================================

class TrangThaiCoSo {
  // TODO: nhan, các phương thức mặc định ném lỗi, hook khiVao()
}

// ===========================================================================
// 📝 TODO 2 — Năm lớp trạng thái
// ===========================================================================

class ChoThanhToan extends TrangThaiCoSo {
  nhan = "Chờ thanh toán";
  // TODO
}

class DangChuanBi extends TrangThaiCoSo {
  nhan = "Đang chuẩn bị hàng";
  // TODO
}

class DangGiao extends TrangThaiCoSo {
  nhan = "Đang giao";
  // TODO
}

class DaGiao extends TrangThaiCoSo {
  nhan = "Đã giao";
  // TODO
}

class DaHuy extends TrangThaiCoSo {
  nhan = "Đã hủy";
  constructor(lyDo) {
    super();
    this.lyDo = lyDo;
  }
  // TODO
}

// ===========================================================================
// 📝 TODO 3 — DonHang chỉ ỦY THÁC
//
//   ⚠️ ĐIỀU KIỆN NGHIỆM THU: class DonHang không được chứa chữ "if" nào
//      liên quan tới trạng thái. Mỗi phương thức đúng MỘT dòng.
//
//   chuyenSang(tt) phải: ghi lịch sử + gọi tt.khiVao(this)
// ===========================================================================

let _dem = 0;
const gioGia = () => `10:${String(++_dem * 5).padStart(2, "0")}:00`;

class DonHang {
  constructor(ma, diaChi) {
    this.ma = ma;
    this.diaChi = diaChi;
    this.nhatKy = [];
    this.lichSu = [];
    this.trangThai = new ChoThanhToan();
  }

  chuyenSang(trangThaiMoi) {
    // TODO
  }

  ghiNhat(s) {
    this.nhatKy.push(s);
  }

  thanhToan() {
    // TODO — một dòng
  }
  giaoHang() {
    // TODO
  }
  xacNhanNhan() {
    // TODO
  }
  huy() {
    // TODO
  }
  capNhatDiaChi(dc) {
    // TODO
  }
}

// ===========================================================================
// 📝 TODO 4 — Viết LẠI máy trạng thái đó bằng BẢNG CHUYỂN
//
//   MAY_TRANG_THAI = { "cho-thanh-toan": { thanhToan: "dang-chuan-bi", ... }, ... }
//   chuyen(trangThai, hanhDong) → trạng thái mới, hoặc ném lỗi liệt kê
//                                 các hành động hợp lệ
// ===========================================================================

const MAY_TRANG_THAI = {
  // TODO
};

function chuyen(trangThai, hanhDong) {
  // TODO
}

// ###########################################################################
// BỘ KIỂM THỬ
// ###########################################################################
let dat = 0;
let tong = 0;
const ok = (ten, dieuKien, ghiChu = "") => {
  tong++;
  if (dieuKien) dat++;
  console.log(`${dieuKien ? "✅" : "❌"} ${ten}${ghiChu ? "  (" + ghiChu + ")" : ""}`);
};
const camDuoc = (ham) => {
  try {
    ham();
    return false;
  } catch {
    return true;
  }
};

console.log("=== TEST 1: luồng bình thường ===\n");
try {
  const don = new DonHang("DH1001", "Hà Nội");
  ok("Khởi tạo ở Chờ thanh toán", don.trangThai.nhan === "Chờ thanh toán");
  don.thanhToan();
  ok("thanhToan → Đang chuẩn bị hàng", don.trangThai.nhan === "Đang chuẩn bị hàng");
  don.giaoHang();
  ok("giaoHang → Đang giao", don.trangThai.nhan === "Đang giao");
  ok("Vào Đang giao thì sinh mã vận đơn", typeof don.maVanDon === "string" && don.maVanDon.length > 2,
    String(don.maVanDon));
  don.xacNhanNhan();
  ok("xacNhanNhan → Đã giao", don.trangThai.nhan === "Đã giao");
  ok("Có ghi nhật ký các bước", don.nhatKy.length >= 3, `${don.nhatKy.length} dòng`);
  ok("Có lịch sử chuyển trạng thái", don.lichSu.length >= 3, `${don.lichSu.length} bước`);
} catch (e) {
  tong += 7;
  console.log("❌ Chưa hoàn thành TODO 1-3 — " + e.message);
}

console.log("\n=== TEST 2: các hành động bị cấm ===\n");
try {
  const d1 = new DonHang("A", "HN");
  ok("Chờ thanh toán: KHÔNG giao hàng được", camDuoc(() => d1.giaoHang()));
  ok("Chờ thanh toán: đổi địa chỉ ĐƯỢC", !camDuoc(() => d1.capNhatDiaChi("Đà Nẵng")));

  const d2 = new DonHang("B", "HN");
  d2.thanhToan();
  d2.giaoHang();
  ok("Đang giao: KHÔNG hủy được", camDuoc(() => d2.huy()));
  ok("Đang giao: KHÔNG đổi địa chỉ được", camDuoc(() => d2.capNhatDiaChi("Huế")));
  ok("Đang giao: xác nhận nhận ĐƯỢC", !camDuoc(() => d2.xacNhanNhan()));

  ok("Đã giao: mọi hành động đều cấm",
    camDuoc(() => d2.huy()) && camDuoc(() => d2.thanhToan()) && camDuoc(() => d2.giaoHang()));
} catch (e) {
  tong += 6;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 3: hủy ở các giai đoạn khác nhau ===\n");
try {
  const dA = new DonHang("A", "HN");
  dA.huy();
  ok("Hủy khi chờ thanh toán", dA.trangThai.nhan === "Đã hủy");

  const dB = new DonHang("B", "HN");
  dB.thanhToan();
  const truoc = dB.nhatKy.length;
  dB.huy();
  ok("Hủy khi đang chuẩn bị → có bước NHẢ HÀNG",
    dB.nhatKy.slice(truoc).some((n) => /nhả|nha/i.test(n)),
    dB.nhatKy.slice(truoc).join(" | "));
} catch (e) {
  tong += 2;
  console.log("❌ " + e.message);
}

console.log("\n=== TEST 4: DonHang không chứa if ===\n");
const nguon = DonHang.toString();
ok("⭐ DonHang không có chữ 'if' nào", !/\bif\b/.test(nguon));
ok("⭐ DonHang không so sánh chuỗi trạng thái", !/trangThai\s*===/.test(nguon));

console.log("\n=== TEST 5: bảng chuyển trạng thái ===\n");
try {
  ok("cho-thanh-toan + thanhToan", chuyen("cho-thanh-toan", "thanhToan") === "dang-chuan-bi");
  ok("dang-chuan-bi + giaoHang", chuyen("dang-chuan-bi", "giaoHang") === "dang-giao");
  ok("dang-giao + xacNhanNhan", chuyen("dang-giao", "xacNhanNhan") === "da-giao");
  ok("dang-giao + huy → ném lỗi", camDuoc(() => chuyen("dang-giao", "huy")));
  ok("da-giao + bất kỳ → ném lỗi", camDuoc(() => chuyen("da-giao", "huy")));
} catch (e) {
  tong += 5;
  console.log("❌ Chưa làm TODO 4 — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 📝 TODO 5 (NÂNG CAO) — sinh sơ đồ Mermaid từ bảng
//
//   sinhSoDo(MAY_TRANG_THAI) → chuỗi "stateDiagram-v2\n  A --> B: hanhDong"
//   Dán vào file .md là có hình vẽ, và tài liệu KHÔNG BAO GIỜ lỗi thời.
//
//   Bonus: viết hàm kiemTraMay() phát hiện
//     - trạng thái không ai tới được (unreachable)
//     - trạng thái không thoát ra được mà KHÔNG phải trạng thái cuối
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Object trạng thái nên có dữ liệu riêng không? DaHuy đang giữ .lyDo —
//      điều đó có mâu thuẫn với nguyên tắc "state nên stateless" không?
//      TRẢ LỜI: ...........................................................
//
//   b) Trạng thái lưu trong DB là chuỗi "dang_giao". Khi nạp đơn hàng từ DB,
//      bạn dựng lại object trạng thái thế nào? Điều gì xảy ra nếu DB có
//      giá trị mà code không biết (do phiên bản cũ/mới lệch nhau)?
//      TRẢ LỜI: ...........................................................
//
//   c) Nghiệp vụ mới: đơn "đang giao" mà khách từ chối nhận thì thành
//      "đang hoàn về". Với cách class và cách bảng, mỗi cách phải sửa gì?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
