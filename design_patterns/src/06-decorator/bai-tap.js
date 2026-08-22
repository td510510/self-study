/**
 * BÀI TẬP 06 — DECORATOR
 * Chạy: node src/06-decorator/bai-tap.js
 *
 * Viết các decorator dạng higher-order function và xếp chồng chúng.
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// HÀM GỐC — không được sửa
// API chậm 60ms và thất bại theo một lịch CỐ ĐỊNH (để test lặp lại được)
// ###########################################################################

export const thongKe = { soLanGoiThat: 0, soLanLoi: 0 };

// Lịch lỗi: gọi lần thứ mấy (tính riêng cho mỗi id) thì lỗi
const LICH_LOI = {
  1: [], // id 1: không bao giờ lỗi
  2: [1, 2], // id 2: lỗi 2 lần đầu, lần 3 thành công → retry cứu được
  3: [1, 2, 3, 4, 5], // id 3: luôn lỗi → retry cũng thua
};
const demTheoId = new Map();

export async function layNguoiDungGoc(id) {
  thongKe.soLanGoiThat++;
  const lan = (demTheoId.get(id) ?? 0) + 1;
  demTheoId.set(id, lan);

  await nghi(60);

  if ((LICH_LOI[id] ?? []).includes(lan)) {
    thongKe.soLanLoi++;
    throw new Error(`Lỗi mạng tạm thời (id=${id}, lần ${lan})`);
  }
  return { id, ten: `Người dùng ${id}` };
}

export function datLai() {
  thongKe.soLanGoiThat = 0;
  thongKe.soLanLoi = 0;
  demTheoId.clear();
}

// ###########################################################################
// 📝 TODO 1 — themCache(fn)
//
//   - Nhớ kết quả theo tham số (gợi ý: JSON.stringify(args) làm khóa)
//   - ⚠️ CHỈ cache khi THÀNH CÔNG. Lỗi tuyệt đối không được vào cache.
//   - Bonus: thêm thuộc tính .soLanTrung để test đếm được
// ###########################################################################

const themCache = (fn) => {
  // TODO
  return fn;
};

// ###########################################################################
// 📝 TODO 2 — themRetry(fn, soLan = 3)
//
//   - Thử lại tối đa soLan lần
//   - Backoff tăng dần giữa các lần (nghi(10), nghi(20), ...)
//   - Hết lượt thì ném lỗi CUỐI CÙNG ra ngoài
// ###########################################################################

const themRetry = (fn, soLan = 3) => {
  // TODO
  return fn;
};

// ###########################################################################
// 📝 TODO 3 — themDoThoiGian(fn, ten)
//
//   - Đo thời gian mỗi lời gọi, đẩy vào mảng .lichSu = [{ ten, ms, loi }]
//   - Phải đo được CẢ khi có lỗi (dùng try/finally)
// ###########################################################################

const themDoThoiGian = (fn, ten) => {
  // TODO
  return fn;
};

// ###########################################################################
// 📝 TODO 4 — themGioiHan(fn, max)
//
//   - Đếm số lời gọi ĐANG CHẠY (chưa xong)
//   - Vượt quá max → ném Error("Quá tải") ngay, không gọi fn
//   - ⚠️ Bẫy: phải giảm bộ đếm cả khi fn ném lỗi (dùng finally)
// ###########################################################################

const themGioiHan = (fn, max) => {
  // TODO
  return fn;
};

// ###########################################################################
// 📝 TODO 5 — Xếp chồng theo đúng thứ tự
//
//   Thứ tự khuyến nghị (ngoài → trong):
//      đo thời gian → giới hạn → retry → cache → API thật
// ###########################################################################

const layNguoiDung = layNguoiDungGoc; // TODO: thay bằng chuỗi decorator

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

console.log("=== KIỂM THỬ DECORATOR ===\n");

// --- Test 1: cache hoạt động ---
datLai();
await layNguoiDung(1);
await layNguoiDung(1);
await layNguoiDung(1);
ok("Gọi id=1 ba lần → API thật chỉ 1 lần", thongKe.soLanGoiThat === 1,
  `thực tế: ${thongKe.soLanGoiThat}`);

// --- Test 2: retry cứu được lỗi tạm thời ---
datLai();
let ketQua2 = null;
try {
  ketQua2 = await layNguoiDung(2);
} catch (e) {
  /* bỏ qua */
}
ok("id=2 lỗi 2 lần đầu → retry vẫn lấy được kết quả", ketQua2?.id === 2);
ok("id=2 gọi API thật đúng 3 lần", thongKe.soLanGoiThat === 3, `thực tế: ${thongKe.soLanGoiThat}`);

// --- Test 3: lỗi KHÔNG được cache ---
datLai();
try {
  await layNguoiDung(3);
} catch (e) {
  /* mong đợi lỗi */
}
const soLanSauLanMot = thongKe.soLanGoiThat;
try {
  await layNguoiDung(3);
} catch (e) {
  /* mong đợi lỗi */
}
ok("Lỗi KHÔNG bị cache (lần 2 vẫn gọi API thật)", thongKe.soLanGoiThat > soLanSauLanMot,
  `lần 1: ${soLanSauLanMot} lời gọi, tổng: ${thongKe.soLanGoiThat}`);

// --- Test 4: đo thời gian ---
tong++;
if (Array.isArray(layNguoiDung.lichSu)) {
  dat++;
  console.log(`✅ Có ghi lịch sử thời gian (${layNguoiDung.lichSu.length} bản ghi)`);
} else {
  console.log("❌ Chưa gắn .lichSu cho decorator đo thời gian");
}

// --- Test 5: giới hạn đồng thời ---
datLai();
const ketQuaSong = await Promise.allSettled([
  layNguoiDung(10), layNguoiDung(11), layNguoiDung(12),
  layNguoiDung(13), layNguoiDung(14), layNguoiDung(15),
]);
const soBiTuChoi = ketQuaSong.filter(
  (r) => r.status === "rejected" && /quá tải/i.test(r.reason?.message ?? "")
).length;
ok("Giới hạn đồng thời chặn bớt lời gọi", soBiTuChoi > 0, `bị từ chối: ${soBiTuChoi}/6`);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// 📝 TODO 6 (NÂNG CAO) — themCacheTTL(fn, ttlMs, soLuongToiDa)
//
//   - Mục cache hết hạn sau ttlMs
//   - Quá soLuongToiDa phần tử → xóa mục CŨ NHẤT (LRU)
//   - Tự viết test chứng minh cả hai cơ chế hoạt động
// ###########################################################################

// ###########################################################################
// 💭 CÂU HỎI THẢO LUẬN
//
//   a) Nếu đổi thứ tự thành: cache → retry (cache ở NGOÀI retry),
//      hành vi khác đi ở điểm nào? Có trường hợp nào thứ tự đó tốt hơn không?
//      TRẢ LỜI: ...........................................................
//
//   b) themCache dùng JSON.stringify(args) làm khóa. Nêu HAI trường hợp
//      cách này sinh ra bug. (gợi ý: thứ tự khóa trong object? Date? hàm?)
//      TRẢ LỜI: ...........................................................
//
//   c) Trong app đa người dùng, cache này đặt ở đâu thì AN TOÀN, đặt ở đâu
//      thì thành lỗ hổng bảo mật?
//      TRẢ LỜI: ...........................................................
// ###########################################################################
