/**
 * LAB 05.1 — Tự cài LRU và LFU, so sánh hit rate trên các mẫu truy cập khác nhau
 *
 * Chạy:  node labs/lab05-cache/01-lru.js
 */

import { pathToFileURL } from 'node:url';

// ─── LRU dùng Map của JS ────────────────────────────────────────────────────
// Mẹo: Map trong JS GIỮ THỨ TỰ CHÈN. Xoá rồi chèn lại = đẩy xuống cuối = "vừa dùng".
// Nhờ đó LRU chỉ tốn ~15 dòng, mọi thao tác O(1).
export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses++;
      return undefined;
    }
    const v = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, v); // đưa lên "mới nhất"
    this.hits++;
    return v;
  }

  set(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.capacity) {
      // Phần tử ĐẦU TIÊN của Map là phần tử lâu nhất chưa dùng
      const cuNhat = this.map.keys().next().value;
      this.map.delete(cuNhat);
      this.evictions++;
    }
    this.map.set(key, value);
  }

  get hitRate() {
    const t = this.hits + this.misses;
    return t ? this.hits / t : 0;
  }
}

// ─── LFU: bỏ cái ít được dùng nhất ─────────────────────────────────────────
export class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key -> value
    this.freq = new Map(); // key -> số lần dùng
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses++;
      return undefined;
    }
    this.freq.set(key, this.freq.get(key) + 1);
    this.hits++;
    return this.map.get(key);
  }

  set(key, value) {
    if (!this.map.has(key) && this.map.size >= this.capacity) {
      // Bản đơn giản O(n) cho dễ hiểu. Bản thật dùng bucket theo tần suất → O(1).
      let itNhat = null;
      let min = Infinity;
      for (const [k, f] of this.freq) if (f < min) (min = f), (itNhat = k);
      this.map.delete(itNhat);
      this.freq.delete(itNhat);
      this.evictions++;
    }
    this.map.set(key, value);
    this.freq.set(key, (this.freq.get(key) ?? 0) + 1);
  }

  get hitRate() {
    const t = this.hits + this.misses;
    return t ? this.hits / t : 0;
  }
}

// ─── FIFO để làm mốc so sánh ────────────────────────────────────────────────
export class FIFOCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
  get(key) {
    const has = this.map.has(key);
    has ? this.hits++ : this.misses++;
    return this.map.get(key);
  }
  set(key, value) {
    if (this.map.has(key)) return;
    if (this.map.size >= this.capacity) {
      this.map.delete(this.map.keys().next().value);
      this.evictions++;
    }
    this.map.set(key, value);
  }
  get hitRate() {
    const t = this.hits + this.misses;
    return t ? this.hits / t : 0;
  }
}

// ─── Các mẫu truy cập giống thực tế ─────────────────────────────────────────

/** Zipf: 20% nội dung chiếm 80% lượt xem. Đây là mẫu PHỔ BIẾN NHẤT trên web. */
function* zipf(n = 1000, soLan = 20_000, s = 1.1) {
  const trongSo = Array.from({ length: n }, (_, i) => 1 / Math.pow(i + 1, s));
  const tong = trongSo.reduce((a, b) => a + b);
  const tichLuy = [];
  let acc = 0;
  for (const w of trongSo) tichLuy.push((acc += w / tong));
  for (let i = 0; i < soLan; i++) {
    const r = Math.random();
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      tichLuy[mid] < r ? (lo = mid + 1) : (hi = mid);
    }
    yield `item:${lo}`;
  }
}

/** Đều: mọi key có xác suất như nhau. Trường hợp XẤU NHẤT cho cache. */
function* deu(n = 1000, soLan = 20_000) {
  for (let i = 0; i < soLan; i++) yield `item:${Math.floor(Math.random() * n)}`;
}

/** Quét tuần tự (full table scan) — kẻ thù của LRU. */
function* quet(n = 1000, soLan = 20_000) {
  for (let i = 0; i < soLan; i++) yield `item:${i % n}`;
}

/** Thực tế: chủ yếu Zipf, nhưng thỉnh thoảng có một job quét toàn bộ chen vào. */
function* zipfCoQuet(n = 1000, soLan = 20_000) {
  const z = zipf(n, soLan, 1.1);
  let i = 0;
  for (const k of z) {
    // Cứ mỗi 2000 request thì có 500 request quét tuần tự (batch job chạy)
    if (i % 2000 < 500) yield `item:${(i * 7) % n}`;
    else yield k;
    i++;
  }
}

// ─── Chạy thử ───────────────────────────────────────────────────────────────
// File này vừa là THƯ VIỆN (được 02-cache-aside.js import) vừa là DEMO chạy trực tiếp.
// Guard dưới đây đảm bảo phần demo chỉ chạy khi gọi `node 01-lru.js`.
const LA_FILE_CHINH = import.meta.url === pathToFileURL(process.argv[1]).href;

function thuNghiem(tenMau, sinhKhoa, capacity) {
  const caches = {
    LRU: new LRUCache(capacity),
    LFU: new LFUCache(capacity),
    FIFO: new FIFOCache(capacity),
  };
  const keys = [...sinhKhoa];
  for (const [, c] of Object.entries(caches)) {
    for (const k of keys) {
      if (c.get(k) === undefined) c.set(k, `data-${k}`);
    }
  }
  return { tenMau, capacity, caches };
}

const MAUS = [
  ['Zipf (80/20 — web thật)', () => zipf()],
  ['Đều (worst case)', () => deu()],
  ['Quét tuần tự', () => quet()],
  ['Zipf + batch job quét', () => zipfCoQuet()],
];

if (LA_FILE_CHINH) {
console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║ SO SÁNH THUẬT TOÁN EVICTION — 1000 key khác nhau, 20.000 lượt truy cập║
╚═══════════════════════════════════════════════════════════════════════╝
`);

for (const cap of [50, 100, 200]) {
  console.log(`\n▌ Cache chứa được ${cap} key (${((cap / 1000) * 100).toFixed(0)}% tổng dữ liệu)\n`);
  console.log('  mẫu truy cập              │   LRU   │   LFU   │  FIFO');
  console.log('  ──────────────────────────┼─────────┼─────────┼─────────');
  for (const [ten, gen] of MAUS) {
    const r = thuNghiem(ten, gen(), cap);
    const f = (c) => (c.hitRate * 100).toFixed(1).padStart(6) + '%';
    console.log(`  ${ten.padEnd(25)} │ ${f(r.caches.LRU)} │ ${f(r.caches.LFU)} │ ${f(r.caches.FIFO)}`);
  }
}

console.log(`

📌 ĐỌC KẾT QUẢ:

1. Zipf vs Đều — khác biệt khổng lồ.
   Cache chỉ hiệu quả khi truy cập KHÔNG ĐỀU. May mắn là traffic web luôn không đều
   (một vài sản phẩm/bài viết chiếm phần lớn lượt xem). Nếu đo thấy hit rate thấp bất
   thường, hãy kiểm tra: có phải key của bạn quá riêng biệt không? (ví dụ nhét timestamp
   hay requestId vào cache key → mỗi request một key → hit rate 0%).

2. Quét tuần tự phá nát LRU.
   Job chạy nền quét toàn bộ bảng sẽ đẩy hết dữ liệu nóng ra khỏi cache — người dùng
   thật bỗng dưng chậm. Đây là sự cố có thật, rất hay gặp lúc 2h sáng khi cron chạy.
   Cách chữa: cho job dùng cache riêng, hoặc dùng W-TinyLFU/ARC (chống scan).

3. LFU chống quét tốt hơn LRU, nhưng có bệnh riêng: dữ liệu từng rất hot nhưng nay đã
   nguội vẫn chiếm chỗ mãi (cache pollution). Cách chữa: LFU có suy giảm theo thời gian.

4. Tăng dung lượng cache có lợi suất giảm dần. Từ 5% → 10% dữ liệu, hit rate nhảy vọt;
   từ 20% → 40% thì cải thiện rất ít. Đừng mua RAM một cách mù quáng — hãy ĐO.

📝 BÀI TẬP:
   a) Sửa hệ số Zipf s=1.1 thành s=0.6 (phân phối phẳng hơn). Hit rate đổi thế nào?
   b) Cài thêm "LRU có bảo vệ": key được truy cập >= 2 lần mới vào vùng chính.
      Nó cứu được mẫu "Zipf + batch job" không?
`);
}
