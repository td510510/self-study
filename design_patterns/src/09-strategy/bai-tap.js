/**
 * BÀI TẬP 09 — STRATEGY
 * Chạy: node src/09-strategy/bai-tap.js
 *
 * Đây là bài tập chữa lại chính file src/00-gioi-thieu/bai-tap.js
 */

// ###########################################################################
// PHẦN A — CHUYỂN VẬN CHUYỂN SANG STRATEGY
// ###########################################################################

/**
 * HỢP ĐỒNG ChienLuocVanChuyen:
 *   ma            : string       mã định danh
 *   ten           : string       tên hiển thị
 *   tinhPhi(don)  : number       phí ship (đồng)
 *   thoiGianGiao(): string
 *   phucVu(don)   : boolean      hãng có phục vụ khu vực này không
 */

// ===========================================================================
// 📝 TODO 1 — Chuyển 3 hãng sau thành 3 strategy object.
//    Công thức giữ nguyên như Bài 00:
//      GHTK    : 15k + 5k mỗi kg vượt quá 1kg. Phục vụ mọi nơi.
//      GHN     : miễn phí đơn >= 500k; nếu không: nội thành 20k, ngoại thành 35k.
//                KHÔNG phục vụ các tỉnh đảo (don.tinh === "Trường Sa" | "Hoàng Sa")
//      Viettel : 2% giá trị đơn, tối thiểu 12k, tối đa 60k. Phục vụ mọi nơi.
// ===========================================================================

const chienLuocGHTK = {
  // TODO
};

const chienLuocGHN = {
  // TODO
};

const chienLuocViettel = {
  // TODO
};

// ===========================================================================
// 📝 TODO 2 — Registry + Context
//
//   dangKy(chienLuoc)            → thêm vào kho
//   layChienLuoc(ma)             → lấy ra, không có thì ném lỗi liệt kê mã hợp lệ
//   layTatCaTuyChon(don)         → mảng báo giá của MỌI hãng có phục vụ,
//                                  sắp xếp theo phí tăng dần.
//                                  ⚠️ TỰ SINH từ registry, không viết tay mảng.
// ===========================================================================

const KHO = new Map();

function dangKy(chienLuoc) {
  // TODO
}

function layChienLuoc(ma) {
  // TODO
}

function layTatCaTuyChon(don) {
  // TODO — trả về [{ ma, hang, phi, thoiGian }]
  return [];
}

// TODO: đăng ký 3 chiến lược ở trên

// ###########################################################################
// PHẦN B — STRATEGY DẠNG HÀM: KHUYẾN MÃI
// ###########################################################################

// ===========================================================================
// 📝 TODO 3 — Bộ chiến lược giảm giá
//
//   Mỗi chiến lược là một hàm: (gioHang) => ({ moTa, giamTien, mienPhiShip })
//     gioHang = { cacMon: [{ten, gia, soLuong}], tongTien, phiShip }
//
//   - theoPhanTram(20)     → giảm 20% tổng tiền
//   - theoSoTien(50000)    → giảm 50k (không âm tổng)
//   - mua2Tang1()          → mỗi 3 món CÙNG loại thì 1 món miễn phí
//                            (giảm bằng giá món rẻ nhất trong bộ 3)
//   - mienPhiShip()        → phiShip về 0
// ===========================================================================

const theoPhanTram = (phanTram) => (gioHang) => {
  // TODO
};

const theoSoTien = (soTien) => (gioHang) => {
  // TODO
};

const mua2Tang1 = () => (gioHang) => {
  // TODO
};

const mienPhiShip = () => (gioHang) => {
  // TODO
};

// ===========================================================================
// 📝 TODO 4 — Áp dụng NHIỀU khuyến mãi
//
//   apDungKhuyenMai(gioHang, [danh sách chiến lược]) → { tongCuoi, chiTiet[] }
//
//   ⚠️ THỨ TỰ CÓ ẢNH HƯỞNG. Ví dụ:
//        giảm 20% rồi giảm 50k  ≠  giảm 50k rồi giảm 20%
//      Bộ test sẽ chứng minh điều này. Hãy quyết định: áp dụng lần lượt,
//      mỗi chiến lược nhìn thấy KẾT QUẢ của chiến lược trước.
// ===========================================================================

function apDungKhuyenMai(gioHang, cacChienLuoc) {
  // TODO
  return { tongCuoi: gioHang.tongTien + gioHang.phiShip, chiTiet: [] };
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

console.log("=== PHẦN A: VẬN CHUYỂN ===\n");
const don = { canNang: 2.5, giaTri: 320_000, noiThanh: true, tinh: "Hà Nội" };

try {
  ok("GHTK: 2.5kg → 15k + 2×5k = 25k", chienLuocGHTK.tinhPhi(don) === 25_000,
    `nhận: ${chienLuocGHTK.tinhPhi(don)}`);
  ok("GHN: đơn 320k nội thành → 20k", chienLuocGHN.tinhPhi(don) === 20_000);
  ok("GHN: đơn 600k → miễn phí", chienLuocGHN.tinhPhi({ ...don, giaTri: 600_000 }) === 0);
  ok("Viettel: 2% của 320k = 6.4k → tối thiểu 12k", chienLuocViettel.tinhPhi(don) === 12_000);
  ok("Viettel: 2% của 5tr = 100k → tối đa 60k",
    chienLuocViettel.tinhPhi({ ...don, giaTri: 5_000_000 }) === 60_000);
  ok("GHN KHÔNG phục vụ Trường Sa", chienLuocGHN.phucVu({ ...don, tinh: "Trường Sa" }) === false);

  const tuyChon = layTatCaTuyChon(don);
  ok("layTatCaTuyChon trả về 3 hãng", tuyChon.length === 3, `nhận: ${tuyChon.length}`);
  ok("Sắp xếp theo phí tăng dần",
    tuyChon.every((t, i) => i === 0 || tuyChon[i - 1].phi <= t.phi));

  const tuyChonDao = layTatCaTuyChon({ ...don, tinh: "Trường Sa" });
  ok("Ra đảo chỉ còn 2 hãng", tuyChonDao.length === 2, `nhận: ${tuyChonDao.length}`);

  tong++;
  try {
    layChienLuoc("khong-ton-tai");
    console.log("❌ Mã hãng lạ — đáng lẽ phải ném lỗi");
  } catch (e) {
    dat++;
    console.log("✅ Mã hãng lạ bị chặn: " + e.message);
  }
} catch (e) {
  tong += 9;
  console.log("❌ Chưa hoàn thành Phần A — " + e.message);
}

// ===========================================================================
// 📝 TODO 5 — THÊM J&T EXPRESS
//
//   ⚠️ ĐIỀU KIỆN NGHIỆM THU: chỉ được THÊM code ở dưới đây.
//      Không sửa bất kỳ dòng nào trong TODO 1-2.
//
//   J&T: nội thành 18k, ngoại thành 28k, cộng 4k mỗi kg vượt quá 2kg.
//        Giao 2-4 ngày. Không phục vụ Trường Sa / Hoàng Sa.
// ===========================================================================

// const chienLuocJT = { ... };  dangKy(chienLuocJT);

console.log("\n--- Sau khi thêm J&T ---");
tong++;
try {
  const sauKhiThem = layTatCaTuyChon(don);
  if (sauKhiThem.length === 4) {
    dat++;
    console.log("✅ Có 4 hãng — thêm mới mà không sửa code cũ");
    sauKhiThem.forEach((t) =>
      console.log(`     ${t.hang.padEnd(22)} ${String(t.phi).padStart(7)}đ  ${t.thoiGian}`)
    );
  } else {
    console.log(`❌ Chưa làm TODO 5 (đang có ${sauKhiThem.length} hãng)`);
  }
} catch (e) {
  console.log("❌ " + e.message);
}

console.log("\n=== PHẦN B: KHUYẾN MÃI ===\n");
const gioHang = {
  cacMon: [
    { ten: "Áo thun", gia: 100_000, soLuong: 3 },
    { ten: "Mũ", gia: 50_000, soLuong: 1 },
  ],
  tongTien: 350_000,
  phiShip: 30_000,
};

try {
  const a = apDungKhuyenMai(gioHang, [theoPhanTram(20)]);
  ok("Giảm 20%: 350k → 280k + 30k ship = 310k", a.tongCuoi === 310_000, `nhận: ${a.tongCuoi}`);

  const b = apDungKhuyenMai(gioHang, [mienPhiShip()]);
  ok("Miễn phí ship: 350k + 0 = 350k", b.tongCuoi === 350_000, `nhận: ${b.tongCuoi}`);

  const c = apDungKhuyenMai(gioHang, [mua2Tang1()]);
  ok("Mua 2 tặng 1: tặng 1 áo → 250k + 30k = 280k", c.tongCuoi === 280_000, `nhận: ${c.tongCuoi}`);

  // ⭐ Thứ tự có ảnh hưởng
  const d1 = apDungKhuyenMai(gioHang, [theoPhanTram(20), theoSoTien(50_000)]);
  const d2 = apDungKhuyenMai(gioHang, [theoSoTien(50_000), theoPhanTram(20)]);
  ok("⭐ Thứ tự khuyến mãi tạo kết quả KHÁC NHAU", d1.tongCuoi !== d2.tongCuoi,
    `20%-rồi-50k: ${d1.tongCuoi} | 50k-rồi-20%: ${d2.tongCuoi}`);
  ok("Có ghi chi tiết từng khuyến mãi", d1.chiTiet?.length === 2);
} catch (e) {
  tong += 5;
  console.log("❌ Chưa hoàn thành Phần B — " + e.message);
}

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 💭 PHẦN C — CÂU HỎI THIẾT KẾ (quan trọng hơn code)
//
//   a) GHN không phục vụ Trường Sa. Có 3 cách thiết kế:
//        (1) tinhPhi() trả về null
//        (2) tinhPhi() ném lỗi
//        (3) tách phương thức phucVu() riêng  ← đề bài chọn cách này
//      Vì sao cách (3) tốt hơn? Nêu tình huống mà (1) và (2) gây rắc rối.
//      TRẢ LỜI: ...........................................................
//
//   b) Nếu khuyến mãi "giảm 20%" và "miễn phí ship" KHÔNG được dùng chung,
//      luật đó nên đặt ở đâu: trong từng chiến lược, hay trong
//      apDungKhuyenMai()? Vì sao?
//      TRẢ LỜI: ...........................................................
//
//   c) Có nên thêm chiến lược "giao hỏa tốc trong 2h" vào cùng registry
//      vận chuyển không, khi nó chỉ áp dụng cho vài quận nội thành?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
