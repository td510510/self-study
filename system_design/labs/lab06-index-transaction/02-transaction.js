/**
 * LAB 06.2 — LOST UPDATE: bán quá kho, và 3 cách chữa
 *
 * Chạy:  node labs/lab06-index-transaction/02-transaction.js
 *
 * Kịch bản: 1 sản phẩm còn 10 cái. 100 người bấm mua CÙNG LÚC.
 * Hệ thống đúng phải bán được đúng 10 cái.
 */

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/** Database mini có hỗ trợ khoá dòng và version. */
class MiniDB {
  constructor() {
    this.rows = new Map();
    this.khoa = new Map(); // key -> Promise đang giữ khoá
    this.soDeadlockTranh = 0;
  }

  seed(key, row) {
    this.rows.set(key, { ...row, version: 0 });
  }

  async doc(key) {
    await ngu(2 + Math.random() * 8); // độ trễ mạng tới DB
    return { ...this.rows.get(key) };
  }

  async ghi(key, row) {
    await ngu(2 + Math.random() * 8);
    this.rows.set(key, { ...row });
  }

  /** UPDATE ... SET x = x - 1 WHERE x > 0 — nguyên tử vì DB tự đọc-sửa-ghi trong 1 lệnh. */
  async giamNguyenTu(key, cot, luong = 1) {
    await ngu(2 + Math.random() * 8);
    const r = this.rows.get(key);
    if (r[cot] < luong) return 0; // không đủ hàng → 0 dòng bị ảnh hưởng
    r[cot] -= luong;
    r.version++;
    return 1;
  }

  /** UPDATE ... WHERE version = ? — trả về số dòng bị ảnh hưởng. */
  async ghiCoVersion(key, row, versionMongDoi) {
    await ngu(2 + Math.random() * 8);
    const hienTai = this.rows.get(key);
    if (hienTai.version !== versionMongDoi) return 0; // đã có người khác sửa
    this.rows.set(key, { ...row, version: versionMongDoi + 1 });
    return 1;
  }

  /** SELECT ... FOR UPDATE — khoá bi quan: ai đến sau phải xếp hàng. */
  async khoaDong(key) {
    while (this.khoa.has(key)) await this.khoa.get(key);
    let moKhoa;
    this.khoa.set(key, new Promise((r) => (moKhoa = r)));
    return () => {
      this.khoa.delete(key);
      moKhoa();
    };
  }
}

const SO_NGUOI_MUA = 100;
const TON_KHO_BAN_DAU = 10;

// ══════════════════════════════════════════════════════════════════════════
// CÁCH 0 — Đọc rồi ghi (SAI)
// ══════════════════════════════════════════════════════════════════════════
async function cachSai(db) {
  const sp = await db.doc('sp:1');
  if (sp.ton_kho <= 0) return false;
  sp.ton_kho -= 1;                 // ← tính ở phía ỨNG DỤNG, dựa trên dữ liệu ĐÃ CŨ
  await db.ghi('sp:1', sp);
  return true;
}

// ══════════════════════════════════════════════════════════════════════════
// CÁCH 1 — Cập nhật nguyên tử (đơn giản & nhanh nhất)
// ══════════════════════════════════════════════════════════════════════════
async function cachNguyenTu(db) {
  const soDong = await db.giamNguyenTu('sp:1', 'ton_kho', 1);
  return soDong === 1;
}

// ══════════════════════════════════════════════════════════════════════════
// CÁCH 2 — Khoá bi quan (SELECT ... FOR UPDATE)
// ══════════════════════════════════════════════════════════════════════════
async function cachBiQuan(db) {
  const moKhoa = await db.khoaDong('sp:1'); // xếp hàng
  try {
    const sp = await db.doc('sp:1');
    if (sp.ton_kho <= 0) return false;
    sp.ton_kho -= 1;
    await db.ghi('sp:1', sp);
    return true;
  } finally {
    moKhoa();
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CÁCH 3 — Khoá lạc quan (version + retry)
// ══════════════════════════════════════════════════════════════════════════
async function cachLacQuan(db, thongKe) {
  for (let lan = 0; lan < 20; lan++) {
    const sp = await db.doc('sp:1');
    if (sp.ton_kho <= 0) return false;
    const ok = await db.ghiCoVersion('sp:1', { ...sp, ton_kho: sp.ton_kho - 1 }, sp.version);
    if (ok) return true;
    thongKe.soLanRetry++;
    await ngu(Math.random() * 5); // backoff nhẹ để giảm va chạm
  }
  thongKe.soLanBoCuoc++;
  return false;
}

// ─── Chạy thử ───────────────────────────────────────────────────────────────
async function thu(ten, muaHang) {
  const db = new MiniDB();
  db.seed('sp:1', { id: 1, ton_kho: TON_KHO_BAN_DAU });
  const thongKe = { soLanRetry: 0, soLanBoCuoc: 0 };

  const t0 = performance.now();
  const kq = await Promise.all(
    Array.from({ length: SO_NGUOI_MUA }, () => muaHang(db, thongKe))
  );
  const thoiGian = performance.now() - t0;

  const daBan = kq.filter(Boolean).length;
  const conLai = db.rows.get('sp:1').ton_kho;

  return { ten, daBan, conLai, thoiGian, ...thongKe };
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ LOST UPDATE — ${SO_NGUOI_MUA} người mua cùng lúc, kho chỉ có ${TON_KHO_BAN_DAU} sản phẩm               ║
║ Kết quả ĐÚNG: bán được ${TON_KHO_BAN_DAU}, còn lại 0                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const ketQua = [
  await thu('0. Đọc rồi ghi (SAI)', cachSai),
  await thu('1. UPDATE nguyên tử', cachNguyenTu),
  await thu('2. Khoá bi quan (FOR UPDATE)', cachBiQuan),
  await thu('3. Khoá lạc quan (version)', cachLacQuan),
];

console.log('  cách làm                       │ đã bán │ tồn kho │ bán LẬU │ thời gian │ retry');
console.log('  ───────────────────────────────┼────────┼─────────┼─────────┼───────────┼───────');
for (const r of ketQua) {
  const banLau = r.daBan - (TON_KHO_BAN_DAU - r.conLai);
  const sai = r.daBan !== TON_KHO_BAN_DAU || r.conLai !== 0;
  console.log(
    `  ${r.ten.padEnd(30)} │${String(r.daBan).padStart(7)} │${String(r.conLai).padStart(8)} │` +
      `${String(r.daBan - TON_KHO_BAN_DAU > 0 ? r.daBan - TON_KHO_BAN_DAU : 0).padStart(8)} │` +
      `${(r.thoiGian.toFixed(0) + 'ms').padStart(10)} │${String(r.soLanRetry).padStart(6)} ${sai ? '❌' : '✅'}`
  );
}

console.log(`
📌 PHÂN TÍCH

  CÁCH 0 (SAI) — bán vượt kho.
    Trục thời gian:
        A: đọc ton_kho=10 ──────────► ghi ton_kho=9
        B: đọc ton_kho=10 ──────► ghi ton_kho=9
        → Bán 2 cái nhưng kho chỉ trừ 1. Với 100 người, con số còn tệ hơn nhiều.
    Đây KHÔNG phải bug hiếm gặp. Nó xảy ra mỗi khi có 2 request đồng thời.
    Nó vẫn xảy ra NGAY CẢ KHI bạn bọc trong BEGIN/COMMIT ở mức Read Committed.

  CÁCH 1 (nguyên tử) — nhanh nhất VÀ đúng.
    "UPDATE sp SET ton_kho = ton_kho - 1 WHERE id=1 AND ton_kho > 0"
    Database tự đọc-tính-ghi trong một thao tác không thể chen ngang.
    👉 Nếu logic của bạn diễn đạt được bằng 1 câu UPDATE, HÃY LÀM THẾ. Đây luôn là lựa chọn đầu tiên.

  CÁCH 2 (bi quan) — đúng nhưng CHẬM.
    Nhìn cột thời gian: mọi người phải xếp hàng lần lượt.
    100 người × ~15ms = tuần tự hoá hoàn toàn.
    Với hàng "hot" (vé concert, flash sale), đây chính là điểm hệ thống sập:
    hàng nghìn request xếp hàng chờ 1 dòng dữ liệu, giữ connection, làm đầy pool.

  CÁCH 3 (lạc quan) — đúng, không khoá, nhưng ${ketQua[3].soLanRetry} lần retry.
    Khi xung đột NHIỀU (đúng trường hợp này), lạc quan trở nên lãng phí:
    mỗi retry là một vòng đi-về DB bị vứt đi.
    👉 Lạc quan phù hợp khi xung đột HIẾM (ví dụ sửa hồ sơ cá nhân), không phải flash sale.

📌 CHỌN CÁI NÀO?
    Diễn đạt được bằng 1 câu UPDATE?        → CÁCH 1
    Cần đọc nhiều bảng rồi mới quyết định?  → CÁCH 2 (giữ transaction thật ngắn)
    Xung đột hiếm, muốn tránh khoá?         → CÁCH 3
    Flash sale hàng chục nghìn QPS?         → Không dùng DB nữa: đếm bằng Redis/queue (buổi 08)

📝 BÀI TẬP:
   a) Tăng SO_NGUOI_MUA lên 1000. Cách 2 mất bao lâu? Cách 3 retry bao nhiêu lần?
   b) Cài "khoá bi quan có timeout 50ms" — người chờ quá lâu thì bỏ. Đây là mô hình
      thực tế hơn. Bao nhiêu % người mua thất bại?
   c) Vì sao BEGIN/COMMIT ở mức Read Committed KHÔNG cứu được cách 0?
`);
