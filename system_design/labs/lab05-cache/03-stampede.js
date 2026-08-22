/**
 * LAB 05.3 — ⭐ CACHE STAMPEDE: tái hiện sự cố và ba cách chữa
 *
 * Chạy:  node labs/lab05-cache/03-stampede.js
 *
 * Đây là lab quan trọng nhất buổi 05. Nó tái hiện một sự cố production kinh điển.
 */

// ─── Database giả có GIỚI HẠN: quá 20 query đồng thời thì bắt đầu sập ──────
class FragileDB {
  constructor(gioiHanDongThoi = 20) {
    this.gioiHan = gioiHanDongThoi;
    this.dangChay = 0;
    this.dinhDongThoi = 0;
    this.soQuery = 0;
    this.soLoiQuaTai = 0;
  }

  async queryNang(key) {
    this.soQuery++;
    this.dangChay++;
    this.dinhDongThoi = Math.max(this.dinhDongThoi, this.dangChay);

    try {
      if (this.dangChay > this.gioiHan) {
        // Database thật sẽ: chờ rất lâu, hết connection pool, rồi trả lỗi.
        this.soLoiQuaTai++;
        await ngu(30);
        throw new Error('DB quá tải: hết connection');
      }
      await ngu(50); // query nặng 50ms
      return { key, value: `kết quả tính toán cho ${key}`, at: Date.now() };
    } finally {
      this.dangChay--;
    }
  }
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── PHIÊN BẢN 1: cache-aside ngây thơ (KHÔNG bảo vệ) ──────────────────────
class CacheNgayTho {
  constructor(db, ttlMs) {
    this.db = db;
    this.ttlMs = ttlMs;
    this.store = new Map();
  }
  async get(key) {
    const e = this.store.get(key);
    if (e && e.hetHan > Date.now()) return e.value;
    const value = await this.db.queryNang(key); // ← 5000 request cùng vào đây
    this.store.set(key, { value, hetHan: Date.now() + this.ttlMs });
    return value;
  }
}

// ─── PHIÊN BẢN 2: single-flight (mutex) ────────────────────────────────────
// Ý tưởng: request đầu tiên bị miss sẽ tạo một Promise và ĐĂNG KÝ nó.
// Mọi request miss sau đó THẤY Promise đang chạy và await CHÍNH NÓ, không gọi DB nữa.
class CacheSingleFlight {
  constructor(db, ttlMs) {
    this.db = db;
    this.ttlMs = ttlMs;
    this.store = new Map();
    this.dangBay = new Map(); // key -> Promise đang chạy
  }
  async get(key) {
    const e = this.store.get(key);
    if (e && e.hetHan > Date.now()) return e.value;

    if (this.dangBay.has(key)) return this.dangBay.get(key); // ← chờ ké, KHÔNG gọi DB

    const p = (async () => {
      try {
        const value = await this.db.queryNang(key);
        this.store.set(key, { value, hetHan: Date.now() + this.ttlMs });
        return value;
      } finally {
        this.dangBay.delete(key);
      }
    })();

    this.dangBay.set(key, p);
    return p;
  }
}

// ─── PHIÊN BẢN 3: single-flight + TTL jitter + làm mới sớm ─────────────────
class CacheDayDu {
  constructor(db, ttlMs, jitterTyLe = 0.2, nguongLamMoiSom = 0.8) {
    this.db = db;
    this.ttlMs = ttlMs;
    this.jitterTyLe = jitterTyLe;
    this.nguongLamMoiSom = nguongLamMoiSom;
    this.store = new Map();
    this.dangBay = new Map();
  }

  ttlCoJitter() {
    // ±20% ngẫu nhiên → các key không cùng hết hạn tại một khoảnh khắc
    const j = this.ttlMs * this.jitterTyLe;
    return this.ttlMs + (Math.random() * 2 - 1) * j;
  }

  async napLai(key) {
    if (this.dangBay.has(key)) return this.dangBay.get(key);
    const p = (async () => {
      try {
        const value = await this.db.queryNang(key);
        const ttl = this.ttlCoJitter();
        this.store.set(key, { value, tao: Date.now(), hetHan: Date.now() + ttl, ttl });
        return value;
      } finally {
        this.dangBay.delete(key);
      }
    })();
    this.dangBay.set(key, p);
    return p;
  }

  async get(key) {
    const e = this.store.get(key);
    if (e && e.hetHan > Date.now()) {
      // LÀM MỚI SỚM: khi đã dùng > 80% tuổi thọ, một số ít request chủ động nạp lại
      // ở NỀN, còn bản thân nó vẫn trả dữ liệu cũ ngay lập tức.
      // → Cache không bao giờ thực sự "trống", nên không bao giờ có stampede.
      const tuoi = (Date.now() - e.tao) / e.ttl;
      if (tuoi > this.nguongLamMoiSom && Math.random() < 0.1) {
        this.napLai(key).catch(() => {});
      }
      return e.value;
    }
    return this.napLai(key);
  }
}

// ─── Kịch bản: 1 key rất hot, TTL hết hạn giữa lúc đang có tải cao ─────────
async function moPhong(tenPhienBan, taoCache, { soRequest = 400, ttlMs = 300, thoiLuongMs = 1500 }) {
  const db = new FragileDB(20);
  const cache = taoCache(db);
  const KEY = 'trang-chu:top10';

  await cache.get(KEY); // nạp lần đầu

  const latencies = [];
  let loi = 0;
  const ketThuc = Date.now() + thoiLuongMs;
  const tacVu = [];

  // Bắn request liên tục với tốc độ cao trong suốt thời lượng
  const nhipMs = thoiLuongMs / soRequest;
  for (let i = 0; i < soRequest; i++) {
    tacVu.push(
      (async () => {
        await ngu(i * nhipMs);
        if (Date.now() > ketThuc + 500) return;
        const t0 = performance.now();
        try {
          await cache.get(KEY);
        } catch {
          loi++;
        }
        latencies.push(performance.now() - t0);
      })()
    );
  }
  await Promise.all(tacVu);

  latencies.sort((a, b) => a - b);
  const p = (q) => latencies[Math.max(0, Math.ceil((q / 100) * latencies.length) - 1)] ?? 0;

  return {
    tenPhienBan,
    soQueryDB: db.soQuery,
    dinhDongThoi: db.dinhDongThoi,
    loiQuaTai: db.soLoiQuaTai,
    loiNguoiDung: loi,
    p50: p(50),
    p99: p(99),
  };
}

// ~2000 req/s đổ vào một key duy nhất — con số hoàn toàn bình thường với trang chủ.
const CAU_HINH = { soRequest: 3000, ttlMs: 300, thoiLuongMs: 1500 };

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ CACHE STAMPEDE — ${CAU_HINH.soRequest} request đổ vào 1 key hot, TTL ${CAU_HINH.ttlMs}ms                  ║
║ Database chỉ chịu được 20 query đồng thời                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const kq = [];
kq.push(await moPhong('1. Ngây thơ (không bảo vệ)', (db) => new CacheNgayTho(db, CAU_HINH.ttlMs), CAU_HINH));
kq.push(await moPhong('2. Single-flight (mutex)', (db) => new CacheSingleFlight(db, CAU_HINH.ttlMs), CAU_HINH));
kq.push(await moPhong('3. + jitter + làm mới sớm', (db) => new CacheDayDu(db, CAU_HINH.ttlMs), CAU_HINH));

console.log('  phiên bản                    │ query DB │ đỉnh đồng thời │ lỗi DB │ p99');
console.log('  ─────────────────────────────┼──────────┼────────────────┼────────┼────────');
for (const r of kq) {
  console.log(
    `  ${r.tenPhienBan.padEnd(28)} │${String(r.soQueryDB).padStart(9)} │` +
      `${String(r.dinhDongThoi).padStart(15)} │${String(r.loiQuaTai).padStart(7)} │` +
      `${(r.p99.toFixed(0) + 'ms').padStart(8)}`
  );
}

const [a, b, c] = kq;
console.log(`
📌 PHÂN TÍCH

  Phiên bản 1 (ngây thơ):
    ${a.soQueryDB} query xuống DB, đỉnh ${a.dinhDongThoi} query đồng thời, ${a.loiQuaTai} lần DB báo quá tải.
    Đây chính là stampede: TTL hết hạn → mọi request đồng loạt miss → cùng lao xuống DB.
    Ở production, "DB quá tải" nghĩa là TOÀN BỘ hệ thống chậm, không riêng gì trang này.

  Phiên bản 2 (single-flight):
    ${b.soQueryDB} query. Giảm ${(a.soQueryDB / Math.max(b.soQueryDB, 1)).toFixed(0)} lần.
    Chỉ 1 request được xuống DB mỗi lần hết hạn; các request khác chờ ké kết quả.
    Chi phí: trong lúc chờ, tất cả đều bị delay bằng thời gian query (~50ms).
    → p99 vẫn có "gờ" tại mỗi lần hết hạn.

  Phiên bản 3 (+ jitter + làm mới sớm):
    ${c.soQueryDB} query VÀ p99 = ${c.p99.toFixed(0)}ms (mượt hơn nhiều).
    Vì cache được nạp lại ở NỀN trước khi hết hạn, không request nào phải chờ.
    Đây là cấu hình nên dùng cho các key hot ở production.

⚠️  LƯU Ý QUAN TRỌNG:
    Single-flight ở đây chỉ hoạt động TRONG MỘT TIẾN TRÌNH Node.
    Có 50 app server = 50 tiến trình = vẫn có 50 query xuống DB cùng lúc.
    Muốn chặn triệt để phải dùng khoá phân tán (Redis SETNX) — đổi lại thêm phức tạp
    và thêm một chế độ lỗi mới (khoá bị kẹt khi tiến trình giữ khoá chết).
    Đây là lý do "làm mới sớm" thường thực dụng hơn khoá phân tán.

📝 BÀI TẬP:
    a) Tăng soRequest lên 2000. Phiên bản 1 tệ đi bao nhiêu? Phiên bản 3 thì sao?
    b) Cài "stale-while-revalidate": khi hết hạn vẫn TRẢ dữ liệu cũ và nạp lại ở nền.
       So sánh p99 với phiên bản 3.
    c) Vì sao jitter một mình (không có single-flight) KHÔNG cứu được key hot?
`);
