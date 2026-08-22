/**
 * LAB 12 — Observability: structured log, metrics, tracing, SLO
 *
 * Chạy:  node labs/lab12-observability/01-demo.js
 */

import crypto from 'node:crypto';

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════
// 1. STRUCTURED LOGGER có redact
// ══════════════════════════════════════════════════════════════════════════
const TRUONG_NHAY_CAM = /^(password|pass|token|authorization|apiKey|secret|cvv|cardNumber)$/i;

function redact(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const ra = {};
  for (const [k, v] of Object.entries(obj)) {
    if (TRUONG_NHAY_CAM.test(k)) ra[k] = '***REDACTED***';
    else if (k === 'email' && typeof v === 'string') {
      // Che một phần: đủ để debug, không đủ để lộ danh tính
      const [ten, mien] = v.split('@');
      ra[k] = `${ten.slice(0, 2)}***@${mien}`;
    } else ra[k] = redact(v);
  }
  return ra;
}

class Logger {
  constructor(ctx = {}) {
    this.ctx = ctx;
    this.buffer = [];
  }
  /** Tạo logger con mang theo context — mọi log con tự động có requestId/traceId. */
  child(them) {
    const l = new Logger({ ...this.ctx, ...them });
    l.buffer = this.buffer;
    return l;
  }
  #ghi(level, data) {
    const dong = { ts: new Date().toISOString(), level, ...this.ctx, ...redact(data) };
    this.buffer.push(dong);
    return dong;
  }
  info(d) { return this.#ghi('INFO', d); }
  warn(d) { return this.#ghi('WARN', d); }
  error(d) { return this.#ghi('ERROR', d); }
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 1 — STRUCTURED LOGGING                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const log = new Logger({ service: 'order-api', version: '2.4.1' });
const logReq = log.child({ requestId: 'req_abc123', traceId: 'trace_xyz789', userId: 4242 });

console.log('  ❌ Cách cũ:');
console.log(`     console.log("User 4242 failed to pay: card declined")`);
console.log(`     → Không lọc được, không đếm được, không cảnh báo được, không nối với trace được.\n`);

console.log('  ✅ Structured log (tự động che dữ liệu nhạy cảm):');
const dong = logReq.error({
  event: 'payment_failed',
  orderId: 'ord_998',
  amount: 500_000,
  gateway: 'vnpay',
  errorCode: 'CARD_DECLINED',
  durationMs: 1234,
  email: 'nguyenvana@gmail.com',
  password: 'sieu-bi-mat-123',    // ← sẽ bị che
  cardNumber: '4111111111111111', // ← sẽ bị che
});
console.log('     ' + JSON.stringify(dong, null, 2).split('\n').join('\n     '));

console.log(`
  📌 Truy vấn được ngay: count(event="payment_failed") group by gateway trong 1 giờ.
  📌 requestId/traceId nối dòng log này với trace ở phần 3.
  📌 password và cardNumber bị che TỰ ĐỘNG — đừng bao giờ tin vào việc "nhớ đừng log".
     Hãy để hàm redact() làm việc đó, và VIẾT TEST cho nó.
`);

// ══════════════════════════════════════════════════════════════════════════
// 2. METRICS
// ══════════════════════════════════════════════════════════════════════════
class Histogram {
  /** Bucket kiểu Prometheus: đếm số quan sát <= mỗi ngưỡng. */
  constructor(buckets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10_000]) {
    this.buckets = buckets;
    this.dem = new Map(buckets.map((b) => [b, 0]));
    this.inf = 0;
    this.tong = 0;
    this.soMau = 0;
  }
  ghiNhan(v) {
    this.soMau++;
    this.tong += v;
    let vao = false;
    for (const b of this.buckets) if (v <= b) { this.dem.set(b, this.dem.get(b) + 1); vao = true; break; }
    if (!vao) this.inf++;
  }
  /** Gộp hai histogram — ĐÂY là cách tính percentile toàn cục cho đúng. */
  static gop(cacHist) {
    const h = new Histogram(cacHist[0].buckets);
    for (const x of cacHist) {
      for (const b of h.buckets) h.dem.set(b, h.dem.get(b) + x.dem.get(b));
      h.inf += x.inf;
      h.tong += x.tong;
      h.soMau += x.soMau;
    }
    return h;
  }
  percentile(p) {
    const muc = (p / 100) * this.soMau;
    let luyKe = 0;
    for (const b of this.buckets) {
      luyKe += this.dem.get(b);
      if (luyKe >= muc) return b;
    }
    return Infinity;
  }
  get trungBinh() { return this.tong / this.soMau; }
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 2 — VÌ SAO KHÔNG ĐƯỢC LẤY TRUNG BÌNH CỦA PERCENTILE                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// 3 server: 2 khoẻ, 1 ốm. Nhưng server ốm chỉ nhận ÍT traffic.
const cauHinhServer = [
  { ten: 'srv-A (khoẻ)', soReq: 10_000, base: 15, duoi: 60 },
  { ten: 'srv-B (khoẻ)', soReq: 10_000, base: 15, duoi: 60 },
  { ten: 'srv-C (ỐM)  ', soReq: 1_000, base: 400, duoi: 3000 },
];

const hists = cauHinhServer.map((c) => {
  const h = new Histogram();
  for (let i = 0; i < c.soReq; i++) {
    h.ghiNhan(Math.random() < 0.95 ? c.base + Math.random() * c.base : c.duoi + Math.random() * c.duoi);
  }
  return h;
});

console.log('  server        │ số request │   p50   │   p99');
console.log('  ──────────────┼────────────┼─────────┼─────────');
cauHinhServer.forEach((c, i) => {
  console.log(
    `  ${c.ten} │${c.soReq.toLocaleString('vi-VN').padStart(11)} │` +
      `${(hists[i].percentile(50) + 'ms').padStart(8)} │${(hists[i].percentile(99) + 'ms').padStart(8)}`
  );
});

const trungBinhCuaP99 = hists.reduce((s, h) => s + h.percentile(99), 0) / hists.length;
const p99Gop = Histogram.gop(hists).percentile(99);

console.log(`
  ❌ Trung bình của các p99 : ${trungBinhCuaP99.toFixed(0)}ms
  ✅ p99 gộp (đúng)         : ${p99Gop}ms

  📌 Hai con số khác nhau HOÀN TOÀN, và con số ❌ không mô tả bất kỳ request thật nào.
     Percentile KHÔNG cộng trừ được. Muốn có p99 toàn cục thì phải gộp HISTOGRAM
     rồi mới tính percentile — đó chính xác là lý do Prometheus lưu bucket
     thay vì lưu sẵn percentile.

  📌 Ở ví dụ này, srv-C ốm nặng nhưng chỉ chiếm 4,8% traffic. Lấy trung bình p99
     THỔI PHỒNG mức độ ảnh hưởng lên nhiều lần — và bạn sẽ đi chữa nhầm vấn đề.
`);

// ══════════════════════════════════════════════════════════════════════════
// 3. DISTRIBUTED TRACING
// ══════════════════════════════════════════════════════════════════════════
class Tracer {
  constructor() { this.spans = []; }
  async span(ten, cha, fn) {
    const s = {
      spanId: crypto.randomBytes(4).toString('hex'),
      parentId: cha?.spanId ?? null,
      ten,
      batDau: performance.now(),
      capDo: cha ? cha.capDo + 1 : 0,
    };
    this.spans.push(s);
    try {
      return await fn(s);
    } finally {
      s.thoiGian = performance.now() - s.batDau;
    }
  }
  ve() {
    const tong = Math.max(...this.spans.map((s) => s.thoiGian));
    const RONG = 34;
    return this.spans
      .map((s) => {
        const o = Math.max(1, Math.round((s.thoiGian / tong) * RONG));
        const lech = Math.round(((s.batDau - this.spans[0].batDau) / tong) * RONG);
        const nhan = '  '.repeat(s.capDo) + s.ten;
        return `     ${nhan.padEnd(26)}${(s.thoiGian.toFixed(0) + 'ms').padStart(7)}  ${' '.repeat(lech)}${'█'.repeat(o)}`;
      })
      .join('\n');
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 3 — DISTRIBUTED TRACING: thời gian đi đâu mất?                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const tracer = new Tracer();
await tracer.span('API Gateway', null, async (gw) => {
  await tracer.span('Auth Service', gw, () => ngu(30));
  await tracer.span('Order Service', gw, async (os) => {
    await tracer.span('DB: SELECT orders', os, () => ngu(15));
    await tracer.span('Cache: GET user', os, () => ngu(2));
    await tracer.span('Payment Service', os, async (ps) => {
      await tracer.span('Bank API (bên thứ ba)', ps, () => ngu(400));
    });
  });
  await tracer.span('Notification', gw, () => ngu(20));
});

console.log(tracer.ve());
console.log(`
  📌 Nhìn một cái là biết ngay: phần lớn thời gian nằm ở "Bank API" của bên thứ ba.
     Không có trace, bạn sẽ đi tối ưu query DB (15ms) — hoàn toàn vô ích.

  📌 Mọi span đều mang cùng traceId với dòng log ở phần 1 → nhảy qua lại được
     giữa "chậm ở đâu" và "chi tiết lỗi là gì".

  📌 Sampling: giữ 100% trace của request LỖI hoặc CHẬM, chỉ sample 1-10% request bình thường.
     (tail-based sampling — quyết định giữ hay bỏ SAU khi request kết thúc.)
`);

// ══════════════════════════════════════════════════════════════════════════
// 4. SLO & ERROR BUDGET
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 4 — SLO & ERROR BUDGET                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const PHUT_MOI_THANG = 30 * 24 * 60;

console.log('  SLO      │ downtime cho phép/tháng │ downtime/năm │ ghi chú');
console.log('  ─────────┼─────────────────────────┼──────────────┼──────────────────────────');
for (const [slo, note] of [
  [99, 'đủ cho công cụ nội bộ'],
  [99.5, 'nhiều SaaS nhỏ dừng ở đây'],
  [99.9, 'mức phổ biến — "three nines"'],
  [99.95, 'cần multi-AZ'],
  [99.99, 'cần multi-region, rất đắt'],
  [99.999, 'gần như chỉ hạ tầng viễn thông'],
]) {
  const phut = PHUT_MOI_THANG * (1 - slo / 100);
  const gioNam = (365 * 24) * (1 - slo / 100);
  const dinhDang = phut >= 60 ? `${(phut / 60).toFixed(1)} giờ` : `${phut.toFixed(1)} phút`;
  console.log(
    `  ${(slo + '%').padStart(8)} │${dinhDang.padStart(24)} │${(gioNam.toFixed(1) + ' giờ').padStart(13)} │ ${note}`
  );
}

// ─── Mô phỏng đốt error budget ─────────────────────────────────────────────
const SLO = 99.9;
const NGAN_SACH_PHUT = PHUT_MOI_THANG * (1 - SLO / 100);

console.log(`\n  ▌ Mô phỏng 30 ngày với SLO ${SLO}% (ngân sách ${NGAN_SACH_PHUT.toFixed(0)} phút)\n`);

const SU_CO = [
  { ngay: 3, phut: 5, ten: 'deploy lỗi, rollback nhanh' },
  { ngay: 9, phut: 12, ten: 'DB failover' },
  { ngay: 14, phut: 2, ten: 'nghẽn mạng thoáng qua' },
  { ngay: 18, phut: 20, ten: 'nhà cung cấp thanh toán chết' },
  { ngay: 25, phut: 8, ten: 'cache stampede (buổi 05!)' },
];

let daDot = 0;
console.log('  ngày │ sự cố                          │ phút │ đã đốt │ còn lại │ trạng thái');
console.log('  ─────┼────────────────────────────────┼──────┼────────┼─────────┼────────────');
for (const s of SU_CO) {
  daDot += s.phut;
  const conLai = NGAN_SACH_PHUT - daDot;
  const pct = (daDot / NGAN_SACH_PHUT) * 100;
  const tt = pct > 100 ? '🔴 VƯỢT' : pct > 75 ? '🟡 cảnh giác' : '🟢 ổn';
  console.log(
    `  ${String(s.ngay).padStart(4)} │ ${s.ten.padEnd(30)} │${String(s.phut).padStart(5)} │` +
      `${(pct.toFixed(0) + '%').padStart(7)} │${(conLai.toFixed(0) + 'p').padStart(8)} │ ${tt}`
  );
}

console.log(`
  📌 Error budget biến câu hỏi cảm tính "có nên deploy tính năng mới không?"
     thành một CON SỐ mà cả product lẫn engineering đều đồng ý được:

       Còn > 50% ngân sách  →  deploy thoải mái, thử nghiệm mạnh dạn
       Còn 25-50%           →  cẩn thận hơn, tăng canary, review kỹ
       Còn < 25%            →  chỉ deploy bản sửa lỗi
       Hết ngân sách        →  ĐÓNG BĂNG tính năng, cả team làm độ ổn định

  📌 Nó cũng chống lại thái cực ngược lại: nếu tháng nào cũng còn 90% ngân sách,
     nghĩa là bạn đang đầu tư QUÁ NHIỀU vào độ tin cậy và đi quá chậm.

📝 BÀI TẬP:
   a) Thêm "burn rate alert": cảnh báo khi đốt hết 5% ngân sách trong 1 giờ.
      Vì sao cảnh báo này tốt hơn "tỉ lệ lỗi > 1%"?
   b) Tách latency của request THÀNH CÔNG và request LỖI thành 2 histogram.
      Chứng minh: một loạt lỗi "fail fast" làm p99 gộp trông ĐẸP HƠN dù hệ thống đang hỏng.
   c) Cài metric có nhãn userId cho 100.000 user và đếm số chuỗi thời gian sinh ra.
      Đây là bài toán cardinality — con số đó nói lên điều gì về hoá đơn của bạn?
`);
