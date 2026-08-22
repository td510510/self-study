/**
 * LỜI GIẢI BÀI TẬP 06 — DECORATOR
 * Chạy: node src/06-decorator/loi-giai.js
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ###########################################################################
// HÀM GỐC (giữ nguyên đề bài)
// ###########################################################################
const thongKe = { soLanGoiThat: 0, soLanLoi: 0 };
const LICH_LOI = { 1: [], 2: [1, 2], 3: [1, 2, 3, 4, 5] };
const demTheoId = new Map();

async function layNguoiDungGoc(id) {
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

function datLai() {
  thongKe.soLanGoiThat = 0;
  thongKe.soLanLoi = 0;
  demTheoId.clear();
}

// ###########################################################################
// TODO 1 — themCache
// ###########################################################################
const themCache = (fn) => {
  const bo = new Map();

  const boc = async (...args) => {
    const khoa = JSON.stringify(args);
    if (bo.has(khoa)) {
      boc.soLanTrung++;
      return bo.get(khoa);
    }
    // ⚠️ ĐIỂM MẤU CHỐT: await ném lỗi thì hàm dừng NGAY tại đây.
    // Dòng bo.set() bên dưới không bao giờ chạy → lỗi không vào cache.
    const kq = await fn(...args);
    bo.set(khoa, kq);
    return kq;
  };

  boc.soLanTrung = 0;
  boc.xoaCache = () => bo.clear();
  boc.kichThuoc = () => bo.size;
  return boc;
};

// ###########################################################################
// TODO 2 — themRetry
// ###########################################################################
const themRetry = (fn, soLan = 3) => {
  const boc = async (...args) => {
    let loiCuoi;
    for (let i = 1; i <= soLan; i++) {
      try {
        return await fn(...args);
      } catch (e) {
        loiCuoi = e;
        boc.soLanThuLai++;
        if (i < soLan) await nghi(10 * i); // backoff tăng dần: 10ms, 20ms...
      }
    }
    throw loiCuoi; // hết lượt → ném lỗi CUỐI CÙNG
  };
  boc.soLanThuLai = 0;
  return boc;
};

// ###########################################################################
// TODO 3 — themDoThoiGian
// ###########################################################################
const themDoThoiGian = (fn, ten) => {
  const boc = async (...args) => {
    const batDau = Date.now();
    let coLoi = false;
    try {
      return await fn(...args);
    } catch (e) {
      coLoi = true;
      throw e;
    } finally {
      // finally chạy CẢ khi thành công lẫn khi lỗi — nếu không, các lời gọi
      // lỗi (thường là chậm nhất) sẽ biến mất khỏi thống kê.
      boc.lichSu.push({ ten, ms: Date.now() - batDau, loi: coLoi });
    }
  };
  boc.lichSu = [];
  boc.trungBinh = () =>
    boc.lichSu.length ? Math.round(boc.lichSu.reduce((s, x) => s + x.ms, 0) / boc.lichSu.length) : 0;
  return boc;
};

// ###########################################################################
// TODO 4 — themGioiHan
// ###########################################################################
const themGioiHan = (fn, max) => {
  let dangChay = 0;
  const boc = async (...args) => {
    if (dangChay >= max) {
      boc.soLanTuChoi++;
      throw new Error(`Quá tải: đang có ${dangChay}/${max} lời gọi chạy`);
    }
    dangChay++;
    try {
      return await fn(...args);
    } finally {
      dangChay--; // ⚠️ phải giảm CẢ khi lỗi, nếu không bộ đếm rò rỉ
    }             //    và sau vài lỗi hệ thống tự khóa vĩnh viễn
  };
  boc.soLanTuChoi = 0;
  boc.dangChay = () => dangChay;
  return boc;
};

// ###########################################################################
// TODO 5 — Xếp chồng: ngoài → trong
//   đo thời gian → giới hạn → retry → cache → API thật
// ###########################################################################
const tangCache = themCache(layNguoiDungGoc);
const tangRetry = themRetry(tangCache, 3);
const tangGioiHan = themGioiHan(tangRetry, 3);
const layNguoiDung = themDoThoiGian(tangGioiHan, "layNguoiDung");

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

console.log("=== KIỂM THỬ DECORATOR ===\n");

datLai();
await layNguoiDung(1);
await layNguoiDung(1);
await layNguoiDung(1);
ok("Gọi id=1 ba lần → API thật chỉ 1 lần", thongKe.soLanGoiThat === 1,
  `API thật: ${thongKe.soLanGoiThat}, cache trúng: ${tangCache.soLanTrung}`);

datLai();
let ketQua2 = null;
try {
  ketQua2 = await layNguoiDung(2);
} catch {}
ok("id=2 lỗi 2 lần đầu → retry vẫn lấy được kết quả", ketQua2?.id === 2);
ok("id=2 gọi API thật đúng 3 lần", thongKe.soLanGoiThat === 3, `thực tế: ${thongKe.soLanGoiThat}`);

datLai();
tangCache.xoaCache();
try {
  await layNguoiDung(3);
} catch {}
const soLanSauLanMot = thongKe.soLanGoiThat;
try {
  await layNguoiDung(3);
} catch {}
ok("Lỗi KHÔNG bị cache (lần 2 vẫn gọi API thật)", thongKe.soLanGoiThat > soLanSauLanMot,
  `lần 1: ${soLanSauLanMot}, tổng: ${thongKe.soLanGoiThat}`);

ok("Có ghi lịch sử thời gian", Array.isArray(layNguoiDung.lichSu),
  `${layNguoiDung.lichSu.length} bản ghi, trung bình ${layNguoiDung.trungBinh()}ms`);

datLai();
tangCache.xoaCache();
const ketQuaSong = await Promise.allSettled([
  layNguoiDung(10), layNguoiDung(11), layNguoiDung(12),
  layNguoiDung(13), layNguoiDung(14), layNguoiDung(15),
]);
const soBiTuChoi = ketQuaSong.filter(
  (r) => r.status === "rejected" && /quá tải/i.test(r.reason?.message ?? "")
).length;
ok("Giới hạn đồng thời chặn bớt lời gọi", soBiTuChoi > 0, `bị từ chối: ${soBiTuChoi}/6`);
ok("Bộ đếm đồng thời trở về 0 sau khi xong", tangGioiHan.dangChay() === 0,
  `đang chạy: ${tangGioiHan.dangChay()}`);

console.log(`\n───────────────\nKẾT QUẢ: ${dat}/${tong}\n`);

// ###########################################################################
// TODO 6 — Cache có TTL và giới hạn LRU
// ###########################################################################
const themCacheTTL = (fn, ttlMs, soLuongToiDa = 100) => {
  const bo = new Map(); // Map giữ nguyên thứ tự chèn → dùng làm LRU rất tiện

  return async (...args) => {
    const khoa = JSON.stringify(args);
    const muc = bo.get(khoa);

    if (muc && Date.now() - muc.luc < ttlMs) {
      // Chạm vào → đưa lên cuối hàng (đánh dấu "vừa dùng")
      bo.delete(khoa);
      bo.set(khoa, muc);
      return muc.giaTri;
    }
    if (muc) bo.delete(khoa); // hết hạn → bỏ

    const giaTri = await fn(...args);
    bo.set(khoa, { giaTri, luc: Date.now() });

    if (bo.size > soLuongToiDa) {
      bo.delete(bo.keys().next().value); // xóa mục ÍT DÙNG NHẤT (đầu hàng)
    }
    return giaTri;
  };
};

console.log("=== NÂNG CAO: CACHE CÓ TTL + LRU ===\n");

let demGoiTTL = 0;
const apiDon = async (id) => {
  demGoiTTL++;
  await nghi(5);
  return { id };
};

const cacheTTL = themCacheTTL(apiDon, 100, 2); // TTL 100ms, tối đa 2 mục

await cacheTTL(1);
await cacheTTL(1);
console.log(`✅ Trong TTL: gọi 2 lần → API thật ${demGoiTTL} lần`);

await nghi(120);
await cacheTTL(1);
console.log(`✅ Sau khi hết hạn 100ms: API thật ${demGoiTTL} lần (tăng lên 2)`);

demGoiTTL = 0;
await cacheTTL(10);
await cacheTTL(20);
await cacheTTL(30); // vượt giới hạn 2 → mục id=10 bị đẩy ra
await cacheTTL(30); // còn trong cache
await cacheTTL(10); // đã bị đẩy ra → phải gọi lại API
console.log(`✅ LRU: 5 lời gọi, API thật ${demGoiTTL} lần (mong đợi 4 — id=10 bị đẩy ra)`);

console.log(`
═══════════════════════════════════════════════════════════════
💭 TRẢ LỜI CÂU HỎI THẢO LUẬN

a) Đổi thành cache Ở NGOÀI retry (cache → retry → API):
   • Khi cache TRÚNG: trả về ngay, không đi qua tầng retry → nhanh hơn
     một chút, và tầng retry không bị "làm phiền" bởi lời gọi đã có sẵn.
   • Khi cache TRƯỢT: hành vi giống hệt.
   • Khác biệt thật sự nằm ở TRẠNG THÁI của decorator: nếu retry có bộ đếm
     hoặc circuit breaker, đặt cache ở ngoài sẽ khiến các lời gọi cache-hit
     KHÔNG được tính vào thống kê. Điều đó có thể đúng ý bạn (đo tải thật
     lên API) hoặc sai ý bạn (đo lưu lượng người dùng).

   👉 Bài học: thứ tự bọc không chỉ đổi hiệu năng, nó đổi cả Ý NGHĨA của
      các con số bạn đo được.

b) JSON.stringify(args) làm khóa — hai trường hợp sinh bug:

   1. THỨ TỰ KHÓA TRONG OBJECT:
        f({a: 1, b: 2})  → '[{"a":1,"b":2}]'
        f({b: 2, a: 1})  → '[{"b":2,"a":1}]'
      Hai lời gọi TƯƠNG ĐƯƠNG nhưng khóa khác nhau → cache trượt vô ích.
      (Sửa: sắp xếp khóa trước khi stringify.)

   2. GIÁ TRỊ KHÔNG SERIALIZE ĐƯỢC:
        f(new Date())      → chuỗi ISO, còn dùng được
        f(() => {})        → undefined → MỌI hàm callback có cùng khóa ""!
        f(new Map([...]))  → "{}"      → MỌI Map có cùng khóa!
      Trường hợp 2 là nguy hiểm nhất: cache trả nhầm kết quả của lời gọi khác.

   👉 Trong dự án thật: chỉ cache các hàm có tham số nguyên thủy, hoặc
      truyền vào một hàm tạo khóa tường minh: themCache(fn, (id) => id).

c) Cache trong app đa người dùng:
   ❌ NGUY HIỂM: cache theo khóa chỉ gồm tham số nghiệp vụ, trong khi hàm
      trả dữ liệu phụ thuộc người đang đăng nhập.
        layDonHangCuaToi()  →  khóa "[]"  →  người B thấy đơn của người A.
      Đây là lỗ hổng bảo mật THẬT, đã xảy ra ở nhiều hệ thống lớn.

   ✅ AN TOÀN:
      • Đưa danh tính vào khóa:  cache.set(userId + ":" + khoa, ...)
      • Hoặc chỉ cache dữ liệu DÙNG CHUNG cho mọi người (danh mục sản phẩm,
        tỉ giá, cấu hình) — thứ không phụ thuộc ai đang xem.
      • Hoặc đặt cache theo từng request, hủy khi request kết thúc.

   👉 Quy tắc: trước khi thêm cache, hãy hỏi "kết quả này phụ thuộc AI?"
      Mọi thứ nó phụ thuộc đều PHẢI nằm trong khóa cache.
═══════════════════════════════════════════════════════════════`);
