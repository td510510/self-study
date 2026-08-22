/**
 * LAB 05.2 — Cache-aside: đo tải database giảm bao nhiêu
 *
 * Chạy:  node labs/lab05-cache/02-cache-aside.js
 */

import { LRUCache } from './01-lru.js';

// ─── "Database" giả: mỗi query tốn 80ms và đếm số lần bị gọi ────────────────
class FakeDB {
  constructor() {
    this.soQuery = 0;
    this.tongThoiGianMs = 0;
    this.rows = new Map();
    for (let i = 0; i < 500; i++) this.rows.set(`product:${i}`, { id: i, name: `SP ${i}`, price: 1000 * i });
  }

  async query(key) {
    this.soQuery++;
    const latency = 60 + Math.random() * 40; // 60-100ms — chỉ CỘNG DỒN, không ngủ thật
    this.tongThoiGianMs += latency; // (lab này đo SỐ QUERY và TẢI, không đo thời gian thực)
    await Promise.resolve();
    return this.rows.get(key) ?? null;
  }
}

// ─── ĐỒNG HỒ ẢO ─────────────────────────────────────────────────────────────
// Lab này không ngủ thật (sẽ mất hàng phút). Thay vào đó ta dùng đồng hồ ảo:
// mỗi request "tiêu tốn" 1ms thời gian mô phỏng. Nhờ vậy TTL vẫn có ý nghĩa.
const dongHo = { now: 0, tick() { this.now += 1; } };

// ─── Cache-aside ────────────────────────────────────────────────────────────
class CacheAside {
  constructor(db, capacity, ttlMs) {
    this.db = db;
    this.cache = new LRUCache(capacity);
    this.ttlMs = ttlMs;
  }

  async get(key) {
    const entry = this.cache.get(key);
    // TTL: kể cả còn trong cache, quá hạn thì coi như miss
    if (entry && entry.hetHanLuc > dongHo.now) return entry.value;

    const value = await this.db.query(key);
    this.cache.set(key, { value, hetHanLuc: dongHo.now + this.ttlMs });
    return value;
  }

  /** Ghi: cập nhật DB rồi XOÁ cache (không cập nhật cache — xem 04-invalidation.js). */
  async invalidate(key) {
    this.cache.map.delete(key);
  }
}

// ─── Tạo luồng truy cập Zipf ────────────────────────────────────────────────
function taoTruyCap(soLan, n = 500, s = 1.1) {
  const w = Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, s));
  const tong = w.reduce((a, b) => a + b);
  const cum = [];
  let acc = 0;
  for (const x of w) cum.push((acc += x / tong));
  return Array.from({ length: soLan }, () => {
    const r = Math.random();
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      cum[m] < r ? (lo = m + 1) : (hi = m);
    }
    return `product:${lo}`;
  });
}

const SO_REQUEST = 5000;
const truyCap = taoTruyCap(SO_REQUEST);

async function chay({ dungCache, capacity = 100, ttlMs = 60_000 }) {
  const db = new FakeDB();
  const layer = dungCache ? new CacheAside(db, capacity, ttlMs) : null;
  dongHo.now = 0;
  for (const k of truyCap) {
    dongHo.tick(); // 1 request = 1ms thời gian mô phỏng trôi qua
    if (layer) await layer.get(k);
    else await db.query(k);
  }
  return {
    soQuery: db.soQuery,
    taiDBGiay: db.tongThoiGianMs / 1000,
    // Hit rate HIỆU DỤNG: tính từ số lần thực sự phải xuống DB.
    // (Không dùng cache.hitRate vì nó không tính các lần trúng-nhưng-hết-hạn.)
    hitRate: 1 - db.soQuery / truyCap.length,
  };
}

console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║ CACHE-ASIDE — ${SO_REQUEST} request, 500 sản phẩm, truy cập theo Zipf         ║
╚═══════════════════════════════════════════════════════════════════════╝
`);

const khong = await chay({ dungCache: false });
console.log(`▌ KHÔNG CACHE`);
console.log(`  Số query xuống DB ........ ${khong.soQuery.toLocaleString('vi-VN')}`);
console.log(`  Tải DB (CPU-giây) ........ ${khong.taiDBGiay.toFixed(1)}s`);

console.log(`\n▌ CÓ CACHE — thử các dung lượng khác nhau\n`);
console.log('  dung lượng │ hit rate │ query xuống DB │ giảm tải DB │ tải DB (s)');
console.log('  ───────────┼──────────┼────────────────┼─────────────┼───────────');

for (const cap of [10, 25, 50, 100, 200, 500]) {
  const r = await chay({ dungCache: true, capacity: cap });
  const giam = khong.soQuery / r.soQuery;
  console.log(
    `  ${String(cap).padStart(10)} │ ${(r.hitRate * 100).toFixed(1).padStart(7)}% │` +
      `${r.soQuery.toLocaleString('vi-VN').padStart(15)} │` +
      `${('×' + giam.toFixed(1)).padStart(12)} │` +
      `${r.taiDBGiay.toFixed(1).padStart(10)}`
  );
}

console.log(`
📌 Chú ý cột "giảm tải DB" — đây mới là giá trị THẬT của cache.
   Với cache chỉ chứa 20% dữ liệu (100/500), tải database đã giảm ~4 lần.
   Nghĩa là bạn phục vụ được 4 lần lượng traffic trên cùng một database.

📌 Nhưng để ý lợi suất giảm dần theo RAM bỏ ra: từ 10 → 100 key (gấp 10 lần RAM)
   hit rate nhảy từ ~33% lên ~73%. Từ 200 → 500 key (gấp 2,5 lần RAM, cache TOÀN BỘ
   dữ liệu) chỉ thêm được vài phần trăm. Điểm ngọt thường nằm ở 10-20% dữ liệu.
`);

// ─── Ảnh hưởng của TTL ──────────────────────────────────────────────────────
console.log(`\n▌ ẢNH HƯỞNG CỦA TTL (cache 100 key)\n`);
console.log('  TTL      │ hit rate │ query xuống DB │ độ "cũ" tối đa của dữ liệu');
console.log('  ─────────┼──────────┼────────────────┼───────────────────────────');
for (const ttl of [50, 200, 1000, 60_000]) {
  const r = await chay({ dungCache: true, capacity: 100, ttlMs: ttl });
  console.log(
    `  ${(ttl >= 1000 ? ttl / 1000 + 's' : ttl + 'ms').padStart(8)} │` +
      `${(r.hitRate * 100).toFixed(1).padStart(7)}% │${r.soQuery.toLocaleString('vi-VN').padStart(15)} │  ` +
      (ttl >= 1000 ? `${ttl / 1000} giây` : `${ttl} ms`)
  );
}

console.log(`
📌 TTL là NÚM VẶN ĐÁNH ĐỔI trực tiếp giữa "tải DB" và "dữ liệu cũ".
   Không có giá trị đúng phổ quát. Cách chọn:
     - Giá sản phẩm       → TTL ngắn (10-60s), sai giá là mất tiền/mất uy tín
     - Danh mục sản phẩm  → TTL dài (1 giờ), hiếm khi đổi
     - Số lượt xem        → TTL rất dài + write-behind, sai vài chục không ai chết
     - Số dư ví           → KHÔNG CACHE, hoặc cache có invalidate chặt chẽ

📝 BÀI TẬP:
   Sửa FakeDB thành 50.000 sản phẩm nhưng cache vẫn 100 key. Hit rate còn bao nhiêu?
   Điều này nói gì về việc cache cho hệ thống có "long tail" rất dài (như YouTube)?
`);
