/**
 * LAB 15 — URL SHORTENER hoàn chỉnh
 *
 * Chạy:  node labs/lab15-case-study/01-url-shortener.js
 *
 * Gộp mọi kỹ thuật của khoá học:
 *   buổi 02 status code · buổi 05 cache-aside · buổi 06 index & idempotency
 *   buổi 07 sharding · buổi 08 queue · buổi 09 rate limit & degradation
 *   buổi 12 structured log & metric
 */

import crypto from 'node:crypto';

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════
// 1. SINH MÃ NGẮN
// ══════════════════════════════════════════════════════════════════════════
const BANG_CHU = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Đổi số nguyên (Number, < 2^53) sang base62. */
export function base62(n) {
  if (n === 0) return '0';
  let s = '';
  while (n > 0) {
    s = BANG_CHU[n % 62] + s;
    n = Math.floor(n / 62);
  }
  return s;
}

/**
 * Counter tăng dần cho ta mã NGẮN NHẤT và KHÔNG BAO GIỜ VA CHẠM.
 * Nhưng mã liên tiếp thì ĐOÁN ĐƯỢC — ai cũng duyệt được toàn bộ link của hệ thống.
 * Cách chữa: trộn (permute) counter bằng một phép song ánh trước khi mã hoá base62.
 * Song ánh ⇒ vẫn không va chạm; trộn ⇒ không đoán được.
 */
const SO_NGUYEN_TO = 2_654_435_761; // dùng trong băm Knuth
const MODULO = 2 ** 31;
const NGHICH_DAO = (() => {
  // Nghịch đảo modular để phép trộn là SONG ÁNH (đảo ngược được)
  let [t, newT, r, newR] = [0, 1, MODULO, SO_NGUYEN_TO % MODULO];
  while (newR !== 0) {
    const q = Math.floor(r / newR);
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  return ((t % MODULO) + MODULO) % MODULO;
})();

const tron = (n) => Number((BigInt(n) * BigInt(SO_NGUYEN_TO)) % BigInt(MODULO));
const gioTron = (n) => Number((BigInt(n) * BigInt(NGHICH_DAO)) % BigInt(MODULO));

/** Snowflake ID: 41 bit thời gian | 10 bit id máy | 12 bit số thứ tự */
export class SnowflakeId {
  constructor(machineId = 1) {
    this.machineId = machineId & 0x3ff;
    this.seq = 0;
    this.lastMs = 0;
  }
  next() {
    let ms = Date.now();
    if (ms === this.lastMs) {
      this.seq = (this.seq + 1) & 0xfff;
      if (this.seq === 0) while (Date.now() <= ms) { /* chờ sang ms tiếp */ }
    } else this.seq = 0;
    this.lastMs = ms;
    return (BigInt(ms - 1_700_000_000_000) << 22n) | (BigInt(this.machineId) << 12n) | BigInt(this.seq);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 2. HẠ TẦNG GIẢ LẬP
// ══════════════════════════════════════════════════════════════════════════
/**
 * ĐỒNG HỒ MÔ PHỎNG: lab này KHÔNG ngủ thật (5.000 × 16ms = 80 giây, quá lâu để dạy).
 * Thay vào đó mỗi thao tác CỘNG DỒN độ trễ của nó vào đồng hồ ảo.
 * Nhờ vậy con số latency phản ánh đúng hệ thống thật mà lab chạy trong 1 giây.
 */
const DONG_HO = { moPhongMs: 0, reset() { this.moPhongMs = 0; } };

const REDIS_MS = 1;   // cùng datacenter
const PG_MS = 12;     // query có index + đi mạng

class Redis {
  constructor() { this.m = new Map(); this.song = true; this.hits = 0; this.misses = 0; }
  async get(k) {
    if (!this.song) throw new Error('Redis chết');
    DONG_HO.moPhongMs += REDIS_MS;
    const e = this.m.get(k);
    if (e && e.exp > Date.now()) { this.hits++; return e.v; }
    this.misses++;
    return null;
  }
  async set(k, v, ttlS = 3600) {
    if (!this.song) throw new Error('Redis chết');
    DONG_HO.moPhongMs += REDIS_MS;
    this.m.set(k, { v, exp: Date.now() + ttlS * 1000 });
  }
  get hitRate() { const t = this.hits + this.misses; return t ? this.hits / t : 0; }
}

class Postgres {
  constructor() {
    this.links = new Map();       // code -> row
    this.idemKeys = new Map();    // idempotencyKey -> code
    this.clicks = new Map();      // code -> số click
    this.soQuery = 0;
  }
  async getLink(code) { this.soQuery++; DONG_HO.moPhongMs += PG_MS; return this.links.get(code) ?? null; }
  async insertLink(row) { this.soQuery++; DONG_HO.moPhongMs += PG_MS; this.links.set(row.code, row); }
  async tangClickTheoLo(lo) {
    // MỘT lệnh cho hàng nghìn click — thay vì 1 UPDATE mỗi click (buổi 06: hot row)
    this.soQuery++;
    DONG_HO.moPhongMs += 15;
    for (const [code, n] of lo) this.clicks.set(code, (this.clicks.get(code) ?? 0) + n);
  }
}

class Queue {
  constructor() { this.msgs = []; }
  publish(m) { this.msgs.push(m); }
  nhanTatCa() { const m = this.msgs; this.msgs = []; return m; }
}

// ══════════════════════════════════════════════════════════════════════════
// 3. SERVICE
// ══════════════════════════════════════════════════════════════════════════
class UrlShortener {
  constructor() {
    this.redis = new Redis();
    this.db = new Postgres();
    this.queue = new Queue();
    this.counter = 1_000_000; // trong thực tế: ID service cấp theo LÔ để tránh SPOF
    this.snowflake = new SnowflakeId(1);
    this.rateLimit = new Map();
    this.metric = { redirect: 0, taoLink: 0, loi404: 0, loi429: 0, docTuCache: 0, docTuDB: 0 };
    this.logs = [];
  }

  log(d) { this.logs.push({ ts: new Date().toISOString(), ...d }); }

  #choPhep(key, tocDo = 20, sucChua = 20) {
    const now = Date.now();
    let b = this.rateLimit.get(key);
    if (!b) (b = { token: sucChua, t: now }), this.rateLimit.set(key, b);
    b.token = Math.min(sucChua, b.token + ((now - b.t) / 1000) * tocDo);
    b.t = now;
    if (b.token < 1) return false;
    b.token -= 1;
    return true;
  }

  #hopLe(url) {
    let u;
    try { u = new URL(url); } catch { return 'URL không hợp lệ'; }
    if (!['http:', 'https:'].includes(u.protocol)) return 'Chỉ chấp nhận http/https';
    // Chống SSRF: không cho trỏ vào mạng nội bộ
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|\[::1\])/.test(u.hostname)) {
      return 'Không cho phép địa chỉ nội bộ';
    }
    return null;
  }

  // ─── POST /v1/links ─────────────────────────────────────────────────────
  async taoLink({ longUrl, ownerId, idempotencyKey, ip }) {
    if (!this.#choPhep(`ip:${ip}`, 5, 5)) {
      this.metric.loi429++;
      return { status: 429, body: { error: { code: 'RATE_LIMITED' } }, headers: { 'Retry-After': '1' } };
    }

    const loi = this.#hopLe(longUrl);
    if (loi) return { status: 400, body: { error: { code: 'INVALID_URL', message: loi } } };

    // Idempotency (buổi 02 & 08): client retry KHÔNG được tạo 2 link
    if (idempotencyKey && this.db.idemKeys.has(idempotencyKey)) {
      const code = this.db.idemKeys.get(idempotencyKey);
      return { status: 200, body: { code, shortUrl: `https://sh.vn/${code}` }, replay: true };
    }

    const code = base62(tron(this.counter++)).padStart(6, '0');
    const row = {
      code, longUrl, ownerId,
      createdAt: Date.now(),
      snowflakeId: this.snowflake.next().toString(),
    };
    await this.db.insertLink(row);
    if (idempotencyKey) this.db.idemKeys.set(idempotencyKey, code);

    this.metric.taoLink++;
    this.log({ event: 'link_created', code, ownerId, level: 'INFO' });
    return { status: 201, body: { code, shortUrl: `https://sh.vn/${code}` } };
  }

  // ─── GET /{code} — ĐƯỜNG NÓNG NHẤT ─────────────────────────────────────
  async redirect(code, { ip, ua } = {}) {
    this.metric.redirect++;

    // (1) Cache trước (buổi 05)
    let longUrl = null;
    let tuCache = false;
    try {
      longUrl = await this.redis.get(`l:${code}`);
      if (longUrl) { tuCache = true; this.metric.docTuCache++; }
    } catch {
      // GRACEFUL DEGRADATION (buổi 09): Redis chết thì vẫn phục vụ được, chỉ chậm hơn.
      this.log({ event: 'cache_unavailable', code, level: 'WARN' });
    }

    // (2) Miss → đọc DB (trong thực tế: đọc từ REPLICA, buổi 07)
    if (!longUrl) {
      const row = await this.db.getLink(code);
      this.metric.docTuDB++;
      if (!row) {
        this.metric.loi404++;
        return { status: 404, body: { error: { code: 'LINK_NOT_FOUND' } } };
      }
      longUrl = row.longUrl;
      try {
        // TTL dài vì link gần như bất biến
        await this.redis.set(`l:${code}`, longUrl, 86400);
      } catch { /* cache chết cũng không sao */ }
    }

    // (3) Đếm click BẤT ĐỒNG BỘ (buổi 08) — không bao giờ chặn redirect
    this.queue.publish({ code, ts: Date.now(), ip, ua });

    // 302 chứ không 301: cần đếm được click và cần đổi được đích đến sau này
    return { status: 302, headers: { Location: longUrl }, tuCache };
  }

  /** Worker: gộp click theo lô rồi ghi MỘT lần (buổi 06: tránh hot row) */
  async workerGopClick() {
    const msgs = this.queue.nhanTatCa();
    if (!msgs.length) return 0;
    const lo = new Map();
    for (const m of msgs) lo.set(m.code, (lo.get(m.code) ?? 0) + 1);
    await this.db.tangClickTheoLo(lo);
    return msgs.length;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// DEMO
// ══════════════════════════════════════════════════════════════════════════
const svc = new UrlShortener();

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 1 — SINH MÃ NGẮN: vì sao phải TRỘN counter                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log('  counter │ base62 thô │ base62 sau khi TRỘN │ giải trộn về đúng?');
console.log('  ────────┼────────────┼─────────────────────┼────────────────────');
for (const n of [1000000, 1000001, 1000002, 1000003, 1000004]) {
  const tho = base62(n);
  const daTron = base62(tron(n));
  const ok = gioTron(tron(n)) === n;
  console.log(
    `  ${String(n).padStart(7)} │ ${tho.padEnd(10)} │ ${daTron.padEnd(19)} │ ${ok ? '✅ đúng' : '❌'}`
  );
}
console.log(`
  📌 Cột "base62 thô": các mã LIÊN TIẾP nhau → ai cũng đoán được mã kế tiếp
     → duyệt được toàn bộ link riêng tư của mọi người dùng. Đây là lỗ hổng thật.

  📌 Cột "sau khi trộn": trông ngẫu nhiên, nhưng phép trộn là SONG ÁNH
     (nhân với số nguyên tố theo modulo) nên VẪN KHÔNG BAO GIỜ VA CHẠM
     — được cả hai điều mà băm MD5 không cho được.

  📌 62^7 ≈ 3,5 nghìn tỉ tổ hợp → 7 ký tự đủ cho 6 tỉ link trong 5 năm.
`);

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 2 — API: tạo link, idempotency, validate, rate limit                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const th = [
  ['URL hợp lệ', { longUrl: 'https://vnexpress.net/bai-viet-rat-dai', ownerId: 'u1', ip: '1.1.1.1' }],
  ['URL sai định dạng', { longUrl: 'khong-phai-url', ownerId: 'u1', ip: '1.1.1.1' }],
  ['Trỏ vào mạng nội bộ (SSRF)', { longUrl: 'http://localhost:8080/admin', ownerId: 'u1', ip: '1.1.1.1' }],
];
console.log('  trường hợp                   │ status │ kết quả');
console.log('  ─────────────────────────────┼────────┼──────────────────────────────');
for (const [ten, req] of th) {
  const r = await svc.taoLink(req);
  console.log(`  ${ten.padEnd(28)} │${String(r.status).padStart(7)} │ ${r.body.code ?? r.body.error.message ?? r.body.error.code}`);
}

// Idempotency
const key = 'idem-' + crypto.randomUUID().slice(0, 8);
const a = await svc.taoLink({ longUrl: 'https://example.com/a', ownerId: 'u2', ip: '2.2.2.2', idempotencyKey: key });
const b = await svc.taoLink({ longUrl: 'https://example.com/a', ownerId: 'u2', ip: '2.2.2.2', idempotencyKey: key });
console.log(`\n  ▌ Idempotency: gọi 2 lần cùng key → code "${a.body.code}" và "${b.body.code}" ` +
  `${a.body.code === b.body.code ? '✅ giống nhau' : '❌ KHÁC NHAU'}`);

// Rate limit
let bi429 = 0;
for (let i = 0; i < 15; i++) {
  const r = await svc.taoLink({ longUrl: `https://x.com/${i}`, ownerId: 'spam', ip: '9.9.9.9' });
  if (r.status === 429) bi429++;
}
console.log(`  ▌ Rate limit: 15 request từ 1 IP → ${bi429} bị chặn bằng 429`);

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 3 — ĐƯỜNG NÓNG: 5.000 lượt redirect                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Tạo 200 link, rồi truy cập theo phân phối Zipf (buổi 05: traffic web luôn lệch)
const codes = [];
for (let i = 0; i < 200; i++) {
  const r = await svc.taoLink({ longUrl: `https://site.vn/bai-viet-${i}`, ownerId: 'u1', ip: '3.3.3.' + (i % 250) });
  if (r.body.code) codes.push(r.body.code);
}

svc.metric.docTuCache = 0;
svc.metric.docTuDB = 0;
svc.db.soQuery = 0;

DONG_HO.reset();
for (let i = 0; i < 5000; i++) {
  const idx = Math.floor(codes.length * Math.random() ** 3); // Zipf: vài link rất nóng
  await svc.redirect(codes[idx], { ip: '4.4.4.4', ua: 'Mozilla' });
}
const tong = DONG_HO.moPhongMs;
const tbCoCache = tong / 5000;

console.log(`  Tổng thời gian (mô phỏng)  ${tong.toFixed(0)}ms cho 5.000 redirect`);
console.log(`  Trung bình ............... ${tbCoCache.toFixed(2)}ms/redirect`);
console.log(`  Cache hit rate ........... ${(svc.redis.hitRate * 100).toFixed(1)}%`);
console.log(`  Đọc từ cache ............. ${svc.metric.docTuCache.toLocaleString('vi-VN')}`);
console.log(`  Đọc từ database .......... ${svc.metric.docTuDB.toLocaleString('vi-VN')}`);
console.log(`  Query DB tiết kiệm được .. ${(5000 - svc.metric.docTuDB).toLocaleString('vi-VN')} (giảm ×${(5000 / Math.max(svc.metric.docTuDB, 1)).toFixed(0)})`);

// Worker gộp click
const soClick = await svc.workerGopClick();
console.log(`\n  ▌ Worker gộp click: ${soClick.toLocaleString('vi-VN')} click → 1 lệnh UPDATE duy nhất`);
console.log(`     (Nếu UPDATE từng click: ${soClick.toLocaleString('vi-VN')} lệnh ghi vào cùng vài dòng "nóng"`);
console.log(`      → khoá, xếp hàng, tuần tự hoá — đúng bài toán ở buổi 06.)`);

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 4 — REDIS CHẾT. Hệ thống có sập không?                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

svc.redis.song = false;
svc.metric.docTuDB = 0;
DONG_HO.reset();
let ok = 0;
for (let i = 0; i < 200; i++) {
  const r = await svc.redirect(codes[Math.floor(Math.random() * codes.length)], { ip: '5.5.5.5' });
  if (r.status === 302) ok++;
}
const tbKhongCache = DONG_HO.moPhongMs / 200;

console.log(`  Redirect thành công ...... ${ok}/200  ✅ hệ thống VẪN CHẠY`);
console.log(`  Latency trung bình ....... ${tbKhongCache.toFixed(1)}ms (so với ${tbCoCache.toFixed(2)}ms khi có cache → chậm hơn ×${(tbKhongCache / tbCoCache).toFixed(0)})`);
console.log(`  Query xuống DB ........... ${svc.metric.docTuDB}/200 = 100%`);
console.log(`
  📌 Đây là GRACEFUL DEGRADATION (buổi 09): mất cache thì CHẬM HƠN, không PHẢI SẬP.
     Code không ném lỗi khi Redis chết — nó ghi WARN và đi tiếp xuống DB.

  ⚠️ NHƯNG ở quy mô thật, 12.000 QPS dồn thẳng xuống DB sẽ GIẾT database.
     Nên trong thực tế còn phải có:
       - circuit breaker + rate limit ở tầng DB (buổi 09)
       - cache cục bộ trong tiến trình làm lớp đệm thứ hai
       - warm cache TRƯỚC khi mở traffic trở lại sau sự cố

  📌 Thứ tự ưu tiên khi mọi thứ cháy: giữ REDIRECT sống (chức năng cốt lõi),
     hy sinh analytics và tạo link mới. Biết cái gì được phép hy sinh
     chính là bản chất của việc thiết kế hệ thống.
`);

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 5 — Structured log & metric (buổi 12)                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
console.log('  Metric:');
for (const [k, v] of Object.entries(svc.metric)) {
  console.log(`     ${k.padEnd(14)} ${v.toLocaleString('vi-VN')}`);
}
console.log('\n  Vài dòng log gần nhất:');
for (const l of svc.logs.slice(-3)) console.log('     ' + JSON.stringify(l));

console.log(`
📝 BÀI TẬP CUỐI KHOÁ:
   a) Thêm hạn dùng (expiresAt): link hết hạn trả 410 Gone. Cache phải xử lý thế nào?
   b) Thêm sharding bằng consistent hashing (buổi 07) theo code. Vì sao code là
      shard key HOÀN HẢO cho hệ thống này?
   c) Thay counter cục bộ bằng "ID service cấp theo LÔ 1.000": mỗi app server xin
      một lô rồi tự dùng. Điều này giải quyết vấn đề gì? (Gợi ý: SPOF và latency.)
   d) Thêm single-flight (buổi 05) cho đường đọc. Với link cực nóng, nó giúp gì?
   e) Đo lại toàn bộ với 50.000 redirect và vẽ biểu đồ hit rate theo thời gian.
`);
