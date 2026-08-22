/**
 * LỜI GIẢI BÀI TẬP 09 — STRATEGY
 * Chạy: node src/09-strategy/loi-giai.js
 */

const TINH_DAO = ["Trường Sa", "Hoàng Sa"];

// ###########################################################################
// PHẦN A — TODO 1: ba chiến lược vận chuyển
// ###########################################################################

const chienLuocGHTK = {
  ma: "ghtk",
  ten: "Giao Hàng Tiết Kiệm",
  tinhPhi: (don) => 15_000 + (don.canNang > 1 ? Math.ceil(don.canNang - 1) * 5_000 : 0),
  thoiGianGiao: () => "1-2 ngày",
  phucVu: () => true,
};

const chienLuocGHN = {
  ma: "ghn",
  ten: "Giao Hàng Nhanh",
  tinhPhi: (don) => (don.giaTri >= 500_000 ? 0 : don.noiThanh ? 20_000 : 35_000),
  thoiGianGiao: () => "2-3 ngày",
  phucVu: (don) => !TINH_DAO.includes(don.tinh),
};

const chienLuocViettel = {
  ma: "viettel-post",
  ten: "Viettel Post",
  tinhPhi: (don) => Math.min(Math.max(don.giaTri * 0.02, 12_000), 60_000),
  thoiGianGiao: () => "3-5 ngày",
  phucVu: () => true,
};

// ###########################################################################
// TODO 2 — Registry + Context
// ###########################################################################

const KHO = new Map();

function dangKy(chienLuoc) {
  for (const khoa of ["ma", "ten", "tinhPhi", "thoiGianGiao", "phucVu"]) {
    if (chienLuoc[khoa] === undefined) {
      throw new Error(`Chiến lược thiếu "${khoa}" — không đúng hợp đồng`);
    }
  }
  KHO.set(chienLuoc.ma, chienLuoc);
  return chienLuoc;
}

function layChienLuoc(ma) {
  const cl = KHO.get(ma);
  if (!cl) {
    throw new Error(`Không hỗ trợ hãng "${ma}". Hãng hợp lệ: ${[...KHO.keys()].join(", ")}`);
  }
  return cl;
}

/** Context: dùng chiến lược, không biết đó là hãng nào. */
function baoGia(chienLuoc, don) {
  return {
    ma: chienLuoc.ma,
    hang: chienLuoc.ten,
    phi: Math.round(chienLuoc.tinhPhi(don)),
    thoiGian: chienLuoc.thoiGianGiao(),
  };
}

/** TỰ SINH từ registry — không thể quên cập nhật khi thêm hãng mới. */
function layTatCaTuyChon(don) {
  return [...KHO.values()]
    .filter((cl) => cl.phucVu(don))
    .map((cl) => baoGia(cl, don))
    .sort((a, b) => a.phi - b.phi);
}

dangKy(chienLuocGHTK);
dangKy(chienLuocGHN);
dangKy(chienLuocViettel);

// ###########################################################################
// PHẦN B — TODO 3: khuyến mãi dạng hàm
// ###########################################################################

const theoPhanTram = (phanTram) => (gio) => ({
  moTa: `Giảm ${phanTram}%`,
  giamTien: Math.round((gio.tongTien * phanTram) / 100),
  mienPhiShip: false,
});

const theoSoTien = (soTien) => (gio) => ({
  moTa: `Giảm ${soTien.toLocaleString("vi-VN")}đ`,
  giamTien: Math.min(soTien, gio.tongTien), // không cho tổng âm
  mienPhiShip: false,
});

const mua2Tang1 = () => (gio) => {
  let giam = 0;
  const tang = [];
  for (const mon of gio.cacMon) {
    const soBo = Math.floor(mon.soLuong / 3);
    if (soBo > 0) {
      giam += soBo * mon.gia;
      tang.push(`${soBo} ${mon.ten}`);
    }
  }
  return {
    moTa: tang.length ? `Mua 2 tặng 1: tặng ${tang.join(", ")}` : "Mua 2 tặng 1 (chưa đủ điều kiện)",
    giamTien: giam,
    mienPhiShip: false,
  };
};

const mienPhiShip = () => () => ({
  moTa: "Miễn phí vận chuyển",
  giamTien: 0,
  mienPhiShip: true,
});

// ###########################################################################
// TODO 4 — Áp dụng nhiều khuyến mãi, tuần tự
// ###########################################################################

function apDungKhuyenMai(gioHang, cacChienLuoc = []) {
  // Làm việc trên BẢN SAO — không sửa giỏ hàng gốc
  let hienTai = { ...gioHang, cacMon: [...gioHang.cacMon] };
  const chiTiet = [];

  for (const chienLuoc of cacChienLuoc) {
    // Mỗi chiến lược nhìn thấy KẾT QUẢ của chiến lược trước → thứ tự có ảnh hưởng
    const kq = chienLuoc(hienTai);
    const giam = Math.min(kq.giamTien, hienTai.tongTien);

    hienTai = {
      ...hienTai,
      tongTien: hienTai.tongTien - giam,
      phiShip: kq.mienPhiShip ? 0 : hienTai.phiShip,
    };
    chiTiet.push({ moTa: kq.moTa, giamTien: giam, mienPhiShip: kq.mienPhiShip });
  }

  return {
    tongGoc: gioHang.tongTien + gioHang.phiShip,
    tongCuoi: hienTai.tongTien + hienTai.phiShip,
    tietKiem: gioHang.tongTien + gioHang.phiShip - (hienTai.tongTien + hienTai.phiShip),
    chiTiet,
  };
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

console.log("=== PHẦN A: VẬN CHUYỂN ===\n");
const don = { canNang: 2.5, giaTri: 320_000, noiThanh: true, tinh: "Hà Nội" };

ok("GHTK: 2.5kg → 15k + 2×5k = 25k", chienLuocGHTK.tinhPhi(don) === 25_000);
ok("GHN: đơn 320k nội thành → 20k", chienLuocGHN.tinhPhi(don) === 20_000);
ok("GHN: đơn 600k → miễn phí", chienLuocGHN.tinhPhi({ ...don, giaTri: 600_000 }) === 0);
ok("Viettel: 2% của 320k → tối thiểu 12k", chienLuocViettel.tinhPhi(don) === 12_000);
ok("Viettel: 2% của 5tr → tối đa 60k",
  chienLuocViettel.tinhPhi({ ...don, giaTri: 5_000_000 }) === 60_000);
ok("GHN KHÔNG phục vụ Trường Sa", chienLuocGHN.phucVu({ ...don, tinh: "Trường Sa" }) === false);

const tuyChon = layTatCaTuyChon(don);
ok("layTatCaTuyChon trả về 3 hãng", tuyChon.length === 3);
ok("Sắp xếp theo phí tăng dần", tuyChon.every((t, i) => i === 0 || tuyChon[i - 1].phi <= t.phi));
ok("Ra đảo chỉ còn 2 hãng", layTatCaTuyChon({ ...don, tinh: "Trường Sa" }).length === 2);

tong++;
try {
  layChienLuoc("khong-ton-tai");
  console.log("❌ Đáng lẽ phải ném lỗi");
} catch (e) {
  dat++;
  console.log("✅ " + e.message);
}

// ###########################################################################
// TODO 5 — THÊM J&T: chỉ thêm code, không sửa gì ở trên
// Trong dự án thật, đoạn này nằm ở file riêng chien-luoc/jt.js
// ###########################################################################
const chienLuocJT = dangKy({
  ma: "jt",
  ten: "J&T Express",
  tinhPhi: (don) =>
    (don.noiThanh ? 18_000 : 28_000) + (don.canNang > 2 ? Math.ceil(don.canNang - 2) * 4_000 : 0),
  thoiGianGiao: () => "2-4 ngày",
  phucVu: (don) => !TINH_DAO.includes(don.tinh),
});

console.log("\n--- Sau khi thêm J&T (0 dòng code cũ bị sửa) ---");
const sauKhiThem = layTatCaTuyChon(don);
ok("Có 4 hãng", sauKhiThem.length === 4);
sauKhiThem.forEach((t) =>
  console.log(`     ${t.hang.padEnd(22)} ${t.phi.toLocaleString("vi-VN").padStart(7)}đ  ${t.thoiGian}`)
);

console.log("\n=== PHẦN B: KHUYẾN MÃI ===\n");
const gioHang = {
  cacMon: [
    { ten: "Áo thun", gia: 100_000, soLuong: 3 },
    { ten: "Mũ", gia: 50_000, soLuong: 1 },
  ],
  tongTien: 350_000,
  phiShip: 30_000,
};

const a = apDungKhuyenMai(gioHang, [theoPhanTram(20)]);
ok("Giảm 20%: 350k → 280k + 30k ship = 310k", a.tongCuoi === 310_000, `nhận: ${a.tongCuoi}`);

const b = apDungKhuyenMai(gioHang, [mienPhiShip()]);
ok("Miễn phí ship → 350k", b.tongCuoi === 350_000, `nhận: ${b.tongCuoi}`);

const c = apDungKhuyenMai(gioHang, [mua2Tang1()]);
ok("Mua 2 tặng 1 → 280k", c.tongCuoi === 280_000, `nhận: ${c.tongCuoi}`);

const d1 = apDungKhuyenMai(gioHang, [theoPhanTram(20), theoSoTien(50_000)]);
const d2 = apDungKhuyenMai(gioHang, [theoSoTien(50_000), theoPhanTram(20)]);
ok("⭐ Thứ tự tạo kết quả KHÁC NHAU", d1.tongCuoi !== d2.tongCuoi,
  `20%→50k: ${d1.tongCuoi}đ | 50k→20%: ${d2.tongCuoi}đ`);
ok("Có ghi chi tiết từng khuyến mãi", d1.chiTiet.length === 2);

console.log("\n   Chi tiết khi áp dụng [20%, rồi 50k]:");
d1.chiTiet.forEach((x) => console.log(`     • ${x.moTa}: -${x.giamTien.toLocaleString("vi-VN")}đ`));
console.log(`     Tổng: ${d1.tongGoc.toLocaleString("vi-VN")}đ → ${d1.tongCuoi.toLocaleString("vi-VN")}đ`);

console.log("\n   Chi tiết khi áp dụng [50k, rồi 20%]:");
d2.chiTiet.forEach((x) => console.log(`     • ${x.moTa}: -${x.giamTien.toLocaleString("vi-VN")}đ`));
console.log(`     Tổng: ${d2.tongGoc.toLocaleString("vi-VN")}đ → ${d2.tongCuoi.toLocaleString("vi-VN")}đ`);

// Kết hợp nhiều khuyến mãi
const e = apDungKhuyenMai(gioHang, [mua2Tang1(), theoPhanTram(10), mienPhiShip()]);
console.log("\n   Combo [mua2tặng1 + 10% + freeship]:");
e.chiTiet.forEach((x) => console.log(`     • ${x.moTa}`));
console.log(`     Tiết kiệm ${e.tietKiem.toLocaleString("vi-VN")}đ`);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

console.log(`═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI PHẦN C — CÂU HỎI THIẾT KẾ

a) Vì sao tách phucVu() riêng, thay vì tinhPhi() trả null hoặc ném lỗi?

   Vấn đề của (1) TRẢ NULL:
     Kiểu trả về trở thành "number hoặc null", nên MỌI nơi gọi đều phải
     nhớ kiểm tra. Ai quên thì nhận NaN — và NaN lan âm thầm qua mọi phép
     tính, để rồi hiện ra ở màn hình thanh toán dưới dạng "Tổng: NaN đ".
     Nguyên nhân và triệu chứng cách nhau rất xa.

   Vấn đề của (2) NÉM LỖI:
     "Không phục vụ khu vực này" KHÔNG PHẢI là lỗi — đó là một câu trả lời
     hợp lệ cho một câu hỏi hợp lệ. Dùng exception cho luồng bình thường
     buộc bạn phải viết try/catch chỉ để hiển thị danh sách hãng:

         for (const cl of KHO.values()) {
           try { ds.push(baoGia(cl, don)); } catch { /* bỏ qua */ }
         }

     Đọc đoạn đó không ai hiểu ý định là gì.

   Vì sao (3) TÁCH phucVu() tốt hơn:
     • Lọc trước khi tính: layTatCaTuyChon() chỉ cần .filter(cl => cl.phucVu(don))
     • tinhPhi() giữ kiểu trả về ĐƠN GIẢN: luôn là number
     • Câu hỏi "có phục vụ không" trả lời được mà KHÔNG cần tính phí — hữu ích
       cho màn hình chọn địa chỉ, khi chưa biết cân nặng
     • Test được riêng từng khía cạnh

   📌 Nguyên tắc chung: tách "CÓ LÀM ĐƯỢC KHÔNG" khỏi "LÀM THÌ RA GÌ".

b) Luật "20% và freeship không dùng chung" nên đặt ở đâu?
   → Trong apDungKhuyenMai(), KHÔNG đặt trong từng chiến lược.

     Lý do: đây là luật về QUAN HỆ GIỮA các chiến lược. Nếu đặt trong
     theoPhanTram(), thì nó phải biết mienPhiShip() tồn tại — hai chiến lược
     bắt đầu phụ thuộc nhau, và ta mất đúng thứ Strategy đem lại.

     Thêm nữa: mỗi lần có luật xung khắc mới, bạn phải sửa nhiều chiến lược
     cùng lúc, và dễ đặt luật ở chỗ này mà quên chỗ kia (A biết kỵ B, nhưng
     B không biết kỵ A).

     Cách làm thực tế: gắn nhãn cho chiến lược và để tầng điều phối xử lý:
         theoPhanTram.nhom = "giam-gia-tri";
         mienPhiShip.nhom  = "giam-ship";
     rồi apDungKhuyenMai chỉ giữ lại khuyến mãi TỐT NHẤT trong mỗi nhóm.

c) "Giao hỏa tốc 2h" có nên vào cùng registry không?
   → CÓ, và đó chính là phép thử cho thấy thiết kế đúng.

     Nó đã khớp sẵn hợp đồng: phucVu(don) trả false cho hầu hết khu vực,
     tinhPhi() cao hơn, thoiGianGiao() trả "trong 2 giờ". Không cần sửa gì.

     Đây là điều đáng nói với học viên: một thiết kế Strategy TỐT sẽ tiếp
     nhận được cả những trường hợp mà lúc thiết kế bạn chưa nghĩ tới. Nếu
     việc thêm hỏa tốc buộc bạn phải sửa hợp đồng, thì hợp đồng đang mô tả
     "các hãng hiện có" chứ chưa mô tả "khái niệm vận chuyển".

     ⚠️ Chỉ tách riêng khi nó KHÔNG còn khớp hợp đồng — ví dụ hỏa tốc cần
        thêm tham số "khung giờ nhận hàng" mà các hãng khác không có. Lúc
        đó hãy cân nhắc, đừng nhét thêm tham số vào hợp đồng chung chỉ vì
        một trường hợp cá biệt.
═══════════════════════════════════════════════════════════════`);
