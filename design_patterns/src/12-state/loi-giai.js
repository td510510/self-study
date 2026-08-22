/**
 * LỜI GIẢI BÀI TẬP 12 — STATE
 * Chạy: node src/12-state/loi-giai.js
 */

// ###########################################################################
// TODO 1 — Lớp cơ sở: MẶC ĐỊNH AN TOÀN (mọi hành động đều cấm)
// ###########################################################################
class TrangThaiCoSo {
  nhan = "(chưa đặt tên)";

  #cam(hanhDong) {
    throw new Error(`Không thể "${hanhDong}" khi đơn đang ở trạng thái "${this.nhan}"`);
  }

  thanhToan() {
    this.#cam("thanh toán");
  }
  giaoHang() {
    this.#cam("giao hàng");
  }
  xacNhanNhan() {
    this.#cam("xác nhận nhận hàng");
  }
  huy() {
    this.#cam("hủy");
  }
  capNhatDiaChi() {
    this.#cam("cập nhật địa chỉ");
  }

  khiVao(don) {} // hook mặc định: không làm gì
}

// ###########################################################################
// TODO 2 — Năm lớp trạng thái
// ###########################################################################

class ChoThanhToan extends TrangThaiCoSo {
  nhan = "Chờ thanh toán";
  thanhToan(don) {
    don.chuyenSang(new DangChuanBi());
  }
  huy(don) {
    don.chuyenSang(new DaHuy("khách hủy trước khi thanh toán"));
  }
  capNhatDiaChi(don, diaChi) {
    don.diaChi = diaChi;
    return don.diaChi;
  }
}

class DangChuanBi extends TrangThaiCoSo {
  nhan = "Đang chuẩn bị hàng";
  khiVao(don) {
    don.ghiNhat("📦 Giữ hàng trong kho");
  }
  giaoHang(don) {
    don.chuyenSang(new DangGiao());
  }
  huy(don) {
    // Hành vi hủy Ở ĐÂY khác với hủy ở ChoThanhToan — đó chính là điểm
    // mà chuỗi if/else làm rối, còn State làm rõ.
    don.ghiNhat("↩️ Nhả hàng đã giữ về kho");
    don.chuyenSang(new DaHuy("khách hủy khi đang chuẩn bị"));
  }
  capNhatDiaChi(don, diaChi) {
    don.diaChi = diaChi;
    return don.diaChi;
  }
}

class DangGiao extends TrangThaiCoSo {
  nhan = "Đang giao";
  khiVao(don) {
    don.maVanDon = "VD" + Math.random().toString(36).slice(2, 8).toUpperCase();
    don.ghiNhat(`🚚 Tạo vận đơn ${don.maVanDon}`);
  }
  xacNhanNhan(don) {
    don.chuyenSang(new DaGiao());
  }
  // Cố ý KHÔNG định nghĩa huy() và capNhatDiaChi().
  // Lớp cơ sở tự ném lỗi → không thể "quên" xử lý tổ hợp nào.
}

class DaGiao extends TrangThaiCoSo {
  nhan = "Đã giao";
  khiVao(don) {
    don.ghiNhat("⭐ Cộng điểm thành viên");
  }
}

class DaHuy extends TrangThaiCoSo {
  nhan = "Đã hủy";
  constructor(lyDo) {
    super();
    this.lyDo = lyDo;
  }
  khiVao(don) {
    don.ghiNhat(`❌ Hủy đơn: ${this.lyDo}`);
  }
}

// ###########################################################################
// TODO 3 — Context chỉ ủy thác. Không một chữ "if".
// ###########################################################################
let _dem = 0;
const gioGia = () => `10:${String(++_dem * 5).padStart(2, "0")}:00`;

class DonHang {
  constructor(ma, diaChi) {
    this.ma = ma;
    this.diaChi = diaChi;
    this.nhatKy = [];
    this.lichSu = [];
    this.trangThai = new ChoThanhToan();
    this.lichSu.push({ den: this.trangThai.nhan, luc: "10:00:00" });
  }

  chuyenSang(trangThaiMoi) {
    const cu = this.trangThai.nhan;
    this.trangThai = trangThaiMoi;
    this.lichSu.push({ tu: cu, den: trangThaiMoi.nhan, luc: gioGia() });
    trangThaiMoi.khiVao(this);
  }

  ghiNhat(s) {
    this.nhatKy.push(s);
  }

  thanhToan() {
    return this.trangThai.thanhToan(this);
  }
  giaoHang() {
    return this.trangThai.giaoHang(this);
  }
  xacNhanNhan() {
    return this.trangThai.xacNhanNhan(this);
  }
  huy() {
    return this.trangThai.huy(this);
  }
  capNhatDiaChi(dc) {
    return this.trangThai.capNhatDiaChi(this, dc);
  }
}

// ###########################################################################
// TODO 4 — Cùng máy trạng thái đó, viết bằng BẢNG
// ###########################################################################
const MAY_TRANG_THAI = {
  "cho-thanh-toan": {
    thanhToan: "dang-chuan-bi",
    huy: "da-huy",
    capNhatDiaChi: "cho-thanh-toan",
  },
  "dang-chuan-bi": {
    giaoHang: "dang-giao",
    huy: "da-huy",
    capNhatDiaChi: "dang-chuan-bi",
  },
  "dang-giao": { xacNhanNhan: "da-giao" },
  "da-giao": {},
  "da-huy": {},
};

function chuyen(trangThai, hanhDong) {
  const bang = MAY_TRANG_THAI[trangThai];
  if (!bang) throw new Error(`Trạng thái không tồn tại: "${trangThai}"`);
  const moi = bang[hanhDong];
  if (!moi) {
    const choPhep = Object.keys(bang);
    throw new Error(
      `Không thể "${hanhDong}" khi đang "${trangThai}". ` +
        `Hành động hợp lệ: ${choPhep.length ? choPhep.join(", ") : "(trạng thái cuối)"}`
    );
  }
  return moi;
}

// ###########################################################################
// KIỂM THỬ
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
const don = new DonHang("DH1001", "Hà Nội");
ok("Khởi tạo ở Chờ thanh toán", don.trangThai.nhan === "Chờ thanh toán");
don.thanhToan();
ok("thanhToan → Đang chuẩn bị hàng", don.trangThai.nhan === "Đang chuẩn bị hàng");
don.giaoHang();
ok("giaoHang → Đang giao", don.trangThai.nhan === "Đang giao");
ok("Vào Đang giao thì sinh mã vận đơn", typeof don.maVanDon === "string", don.maVanDon);
don.xacNhanNhan();
ok("xacNhanNhan → Đã giao", don.trangThai.nhan === "Đã giao");
ok("Có ghi nhật ký các bước", don.nhatKy.length >= 3, `${don.nhatKy.length} dòng`);
ok("Có lịch sử chuyển trạng thái", don.lichSu.length >= 3, `${don.lichSu.length} bước`);

console.log("\n=== TEST 2: các hành động bị cấm ===\n");
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

console.log("\n=== TEST 3: hủy ở các giai đoạn khác nhau ===\n");
const dA = new DonHang("A", "HN");
dA.huy();
ok("Hủy khi chờ thanh toán", dA.trangThai.nhan === "Đã hủy");

const dB = new DonHang("B", "HN");
dB.thanhToan();
const truoc = dB.nhatKy.length;
dB.huy();
ok("Hủy khi đang chuẩn bị → có bước NHẢ HÀNG",
  dB.nhatKy.slice(truoc).some((n) => /nhả/i.test(n)),
  dB.nhatKy.slice(truoc).join(" | "));

console.log("\n=== TEST 4: DonHang không chứa if ===\n");
const nguon = DonHang.toString();
ok("⭐ DonHang không có chữ 'if' nào", !/\bif\b/.test(nguon));
ok("⭐ DonHang không so sánh chuỗi trạng thái", !/trangThai\s*===/.test(nguon));

console.log("\n=== TEST 5: bảng chuyển trạng thái ===\n");
ok("cho-thanh-toan + thanhToan", chuyen("cho-thanh-toan", "thanhToan") === "dang-chuan-bi");
ok("dang-chuan-bi + giaoHang", chuyen("dang-chuan-bi", "giaoHang") === "dang-giao");
ok("dang-giao + xacNhanNhan", chuyen("dang-giao", "xacNhanNhan") === "da-giao");
ok("dang-giao + huy → ném lỗi", camDuoc(() => chuyen("dang-giao", "huy")));
ok("da-giao + bất kỳ → ném lỗi", camDuoc(() => chuyen("da-giao", "huy")));

// ###########################################################################
// TODO 5 — Sinh sơ đồ + kiểm tra máy trạng thái
// ###########################################################################
function sinhSoDo(may) {
  const dong = ["stateDiagram-v2", "    [*] --> cho-thanh-toan"];
  for (const [tt, cacHd] of Object.entries(may)) {
    for (const [hd, den] of Object.entries(cacHd)) {
      if (den !== tt) dong.push(`    ${tt} --> ${den}: ${hd}`);
    }
    if (Object.keys(cacHd).length === 0) dong.push(`    ${tt} --> [*]`);
  }
  return dong.join("\n");
}

function kiemTraMay(may, batDau) {
  const canhBao = [];
  const toiDuoc = new Set([batDau]);
  let doiThay = true;
  while (doiThay) {
    doiThay = false;
    for (const tt of [...toiDuoc]) {
      for (const den of Object.values(may[tt] ?? {})) {
        if (!toiDuoc.has(den)) {
          toiDuoc.add(den);
          doiThay = true;
        }
      }
    }
  }
  for (const tt of Object.keys(may)) {
    if (!toiDuoc.has(tt)) canhBao.push(`Trạng thái "${tt}" KHÔNG BAO GIỜ tới được`);
    const ra = Object.entries(may[tt]).filter(([, den]) => den !== tt);
    if (ra.length === 0 && !["da-giao", "da-huy"].includes(tt)) {
      canhBao.push(`Trạng thái "${tt}" không thoát ra được (bị kẹt)`);
    }
  }
  return canhBao;
}

console.log("\n=== TEST 6: sinh sơ đồ tự động ===\n");
console.log(sinhSoDo(MAY_TRANG_THAI));

const canhBao = kiemTraMay(MAY_TRANG_THAI, "cho-thanh-toan");
console.log("\n   Kiểm tra máy trạng thái:",
  canhBao.length ? "\n     ⚠️ " + canhBao.join("\n     ⚠️ ") : "✅ không có vấn đề");

// Chứng minh bộ kiểm tra hoạt động: thêm một trạng thái không ai tới được
const mayLoi = { ...MAY_TRANG_THAI, "dang-khieu-nai": { dongY: "da-giao" } };
console.log("   Thử với máy có lỗi:  ⚠️ " + kiemTraMay(mayLoi, "cho-thanh-toan").join(" | "));
ok("kiemTraMay() phát hiện trạng thái không tới được",
  kiemTraMay(mayLoi, "cho-thanh-toan").length > 0);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) DaHuy giữ .lyDo — có mâu thuẫn với "state nên stateless" không?
   → Có một chút, và đây là đánh đổi có ý thức.

     Nguyên tắc "stateless" nhằm mục đích: một instance trạng thái dùng
     chung được cho MỌI đơn hàng (tiết kiệm bộ nhớ, tránh rò rỉ dữ liệu
     giữa các đơn).

     DaHuy giữ lyDo nên mỗi lần hủy phải tạo một instance mới. Với đơn
     hàng thì không sao — số lượng nhỏ, và lyDo gắn chặt với lần chuyển
     trạng thái đó nên đặt ở đây là tự nhiên.

     ⚠️ Nhưng nếu bạn có 100.000 đơn trong bộ nhớ, hoặc trạng thái giữ
     dữ liệu NẶNG, hãy chuyển sang:
       • trạng thái stateless dùng chung: don.chuyenSang(TRANG_THAI.daHuy, {lyDo})
       • lyDo lưu ở don hoặc ở bản ghi lịch sử

     📌 Ranh giới: dữ liệu thuộc về LẦN CHUYỂN thì để ở lịch sử;
        dữ liệu thuộc về ĐƠN HÀNG thì để ở đơn hàng;
        object trạng thái lý tưởng chỉ chứa HÀNH VI.

b) Nạp trạng thái từ DB — làm sao và rủi ro gì?
   → Cần một bảng ánh xạ Ở ĐÚNG MỘT CHỖ:

       const TU_DB = {
         cho_thanh_toan: () => new ChoThanhToan(),
         dang_chuan_bi:  () => new DangChuanBi(),
         dang_giao:      () => new DangGiao(),
         da_giao:        () => new DaGiao(),
         da_huy:         (dl) => new DaHuy(dl.lyDo),
       };

       function napTuDB(hang) {
         const tao = TU_DB[hang.trang_thai];
         if (!tao) throw new Error("Trạng thái lạ trong DB: " + hang.trang_thai);
         ...
       }

     ⚠️ Rủi ro lớn nhất: LỆCH PHIÊN BẢN khi triển khai.
        Phiên bản mới thêm trạng thái "dang_hoan_ve". Trong lúc triển khai
        cuốn chiếu, máy chủ CŨ nạp đơn có trạng thái MỚI → ném lỗi.

        Ba cách phòng:
          1. Triển khai hai pha: đưa code ĐỌC được trạng thái mới ra trước,
             rồi mới đưa code GHI trạng thái mới ra sau.
          2. Trạng thái lạ thì chuyển vào chế độ "chỉ đọc" thay vì sập.
          3. Ghi rõ trong lỗi cả giá trị DB lẫn danh sách hợp lệ — để người
             trực đêm biết ngay chuyện gì xảy ra.

     ⚠️ Rủi ro thứ hai: khiVao() KHÔNG được gọi khi nạp từ DB. Nếu bạn gọi,
        nó sẽ tạo lại vận đơn, cộng điểm lần hai. Hãy tách rõ "chuyển trạng
        thái" (có hook) và "khôi phục trạng thái" (không hook).

c) Thêm trạng thái "đang hoàn về" — mỗi cách phải sửa gì?

   Cách CLASS:
     • thêm file DangHoanVe.js               (thêm mới)
     • thêm phương thức tuChoiNhan(don) vào class DangGiao   (SỬA 1 file)
     → tổng: 1 file mới + 1 dòng sửa. Các trạng thái khác không đụng tới.

   Cách BẢNG:
     • thêm "dang-hoan-ve": { xacNhanHoan: "da-huy" }
     • thêm tuChoiNhan: "dang-hoan-ve" vào "dang-giao"
     → tổng: 2 dòng, và nhìn được toàn cảnh ngay lập tức.

   👉 Cả hai đều tốt hơn hẳn if/else (phải tìm và sửa 4-5 phương thức, và
      không có gì đảm bảo bạn tìm hết).

   👉 Chọn cách nào?
      • Sơ đồ đơn giản, cần nhìn toàn cảnh, cần sinh tài liệu → BẢNG
      • Mỗi trạng thái có nhiều hành vi phức tạp → CLASS
      • Thực tế tốt nhất: BẢNG mô tả "đi đâu" + hàm mô tả "làm gì khi đi"
      • Máy trạng thái có lồng nhau/song song/timeout → dùng XState
═══════════════════════════════════════════════════════════════`);
