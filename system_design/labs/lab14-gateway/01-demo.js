/**
 * LAB 14 — API Gateway, Service Registry, Canary Deploy
 *
 * Chạy:  node labs/lab14-gateway/01-demo.js
 */

import crypto from 'node:crypto';

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════
// 1. SERVICE REGISTRY
// ══════════════════════════════════════════════════════════════════════════
class ServiceRegistry {
  constructor() {
    this.instances = new Map(); // tenService -> [instance]
  }

  dangKy(tenService, instance) {
    if (!this.instances.has(tenService)) this.instances.set(tenService, []);
    this.instances.get(tenService).push({ ...instance, khoe: true, dangXuLy: 0 });
  }

  /** Chỉ trả các instance KHOẺ — kết hợp bài học health check ở buổi 04. */
  tim(tenService, { phienBan } = {}) {
    const ds = (this.instances.get(tenService) ?? []).filter(
      (i) => i.khoe && (!phienBan || i.phienBan === phienBan)
    );
    if (!ds.length) return null;
    // Least connections (buổi 04)
    return ds.reduce((a, b) => (b.dangXuLy < a.dangXuLy ? b : a));
  }

  async healthCheckTatCa() {
    for (const ds of this.instances.values()) {
      for (const i of ds) i.khoe = await i.kiemTraSucKhoe();
    }
  }
}

/**
 * Một instance service.
 *
 * Độ trễ được CỘNG DỒN vào đồng hồ ảo thay vì ngủ thật: lab này minh hoạ định tuyến
 * và canary chứ không minh hoạ race condition, nên ngủ thật chỉ làm lab chạy hàng phút.
 */
const DONG_HO = { moPhongMs: 0, reset() { this.moPhongMs = 0; } };

function taoInstance({ ten, id, phienBan = 'v1', latencyMs = 10, tyLeLoi = 0, xuLy }) {
  return {
    id, ten, phienBan, latencyMs,
    kiemTraSucKhoe: async () => true,
    async goi(req) {
      this.dangXuLy++;
      try {
        DONG_HO.moPhongMs += latencyMs;
        await Promise.resolve();
        if (Math.random() < tyLeLoi) throw new Error(`${id} lỗi`);
        return xuLy(req, this);
      } finally {
        this.dangXuLy--;
      }
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════
// 2. API GATEWAY
// ══════════════════════════════════════════════════════════════════════════
class ApiGateway {
  constructor(registry) {
    this.registry = registry;
    this.routes = [];
    this.rateLimit = new Map(); // key -> { token, capNhat }
    this.canary = new Map();    // tenService -> { phienBan, tyLe }
    this.thongKe = { tong: 0, loi401: 0, loi429: 0, loi503: 0, ok: 0, theoPhienBan: new Map() };
  }

  them(mau, tenService) {
    this.routes.push({ mau, tenService });
  }

  datCanary(tenService, phienBan, tyLe) {
    this.canary.set(tenService, { phienBan, tyLe });
  }

  // ─── Các mối quan tâm CHUNG, đặt ở gateway để service không phải lo ─────
  #xacThuc(req) {
    const t = req.headers?.authorization?.replace('Bearer ', '');
    if (!t) return null;
    try {
      const p = JSON.parse(Buffer.from(t.split('.')[1], 'base64url').toString());
      return p.exp * 1000 > Date.now() ? p : null;
    } catch {
      return null;
    }
  }

  #choPhep(key, tocDo = 5, sucChua = 5) {
    const now = Date.now();
    let b = this.rateLimit.get(key);
    if (!b) (b = { token: sucChua, capNhat: now }), this.rateLimit.set(key, b);
    b.token = Math.min(sucChua, b.token + ((now - b.capNhat) / 1000) * tocDo);
    b.capNhat = now;
    if (b.token < 1) return false;
    b.token -= 1;
    return true;
  }

  #chonPhienBan(tenService) {
    const c = this.canary.get(tenService);
    if (c && Math.random() < c.tyLe) return c.phienBan;
    return undefined; // để registry tự chọn (mặc định v1)
  }

  async xuLy(req) {
    this.thongKe.tong++;
    const requestId = 'req_' + crypto.randomBytes(4).toString('hex');

    // (1) Xác thực — một chỗ duy nhất cho MỌI service phía sau
    const user = this.#xacThuc(req);
    if (!user) {
      this.thongKe.loi401++;
      return { status: 401, requestId, body: { error: 'UNAUTHENTICATED' } };
    }

    // (2) Rate limit — chặn TRƯỚC khi vào hệ thống
    if (!this.#choPhep(`u:${user.sub}`)) {
      this.thongKe.loi429++;
      return { status: 429, requestId, headers: { 'Retry-After': '1' } };
    }

    // (3) Định tuyến theo path
    const route = this.routes.find((r) => req.path.startsWith(r.mau));
    if (!route) return { status: 404, requestId };

    // (4) Chọn instance (có tính tới canary)
    const phienBan = this.#chonPhienBan(route.tenService);
    const inst = this.registry.tim(route.tenService, { phienBan });
    if (!inst) {
      this.thongKe.loi503++;
      return { status: 503, requestId, body: { error: 'NO_HEALTHY_UPSTREAM' } };
    }

    // (5) Gọi, truyền tiếp requestId (buổi 12!)
    try {
      const body = await inst.goi({ ...req, requestId, user });
      this.thongKe.ok++;
      const m = this.thongKe.theoPhienBan;
      m.set(inst.phienBan, (m.get(inst.phienBan) ?? 0) + 1);
      return { status: 200, requestId, phienBan: inst.phienBan, body };
    } catch {
      return { status: 502, requestId };
    }
  }
}

// ─── Dựng hệ thống ─────────────────────────────────────────────────────────
const reg = new ServiceRegistry();

reg.dangKy('orders', taoInstance({
  ten: 'orders', id: 'ord-1', phienBan: 'v1', latencyMs: 12,
  xuLy: (req, self) => ({ orders: [{ id: 1, total: 500_000 }], servedBy: self.id, v: self.phienBan }),
}));
reg.dangKy('orders', taoInstance({
  ten: 'orders', id: 'ord-2', phienBan: 'v1', latencyMs: 12,
  xuLy: (req, self) => ({ orders: [{ id: 1, total: 500_000 }], servedBy: self.id, v: self.phienBan }),
}));
// Instance canary chạy phiên bản MỚI
reg.dangKy('orders', taoInstance({
  ten: 'orders', id: 'ord-3', phienBan: 'v2', latencyMs: 8,
  xuLy: (req, self) => ({ orders: [{ id: 1, total: 500_000, currency: 'VND' }], servedBy: self.id, v: self.phienBan }),
}));
reg.dangKy('payments', taoInstance({
  ten: 'payments', id: 'pay-1', latencyMs: 25,
  xuLy: () => ({ status: 'paid' }),
}));

const gw = new ApiGateway(reg);
gw.them('/orders', 'orders');
gw.them('/payments', 'payments');

// Token giả
function tokenGia(sub, giay = 900) {
  const p = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + giay })).toString('base64url');
  return `x.${p}.y`;
}

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 1 — API GATEWAY xử lý các mối quan tâm CHUNG                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const cacTruongHop = [
  ['Không có token', { path: '/orders', headers: {} }],
  ['Token hết hạn', { path: '/orders', headers: { authorization: 'Bearer ' + tokenGia('u1', -100) } }],
  ['Token hợp lệ', { path: '/orders', headers: { authorization: 'Bearer ' + tokenGia('u1') } }],
  ['Route không tồn tại', { path: '/khong-co', headers: { authorization: 'Bearer ' + tokenGia('u1') } }],
];

console.log('  trường hợp             │ status │ ghi chú');
console.log('  ───────────────────────┼────────┼────────────────────────────────────');
for (const [ten, req] of cacTruongHop) {
  const r = await gw.xuLy(req);
  const gc = { 401: 'chặn ngay, service không hề biết', 200: 'chuyển tiếp tới service', 404: 'không có route' }[r.status] ?? '';
  console.log(`  ${ten.padEnd(22)} │${String(r.status).padStart(7)} │ ${gc}`);
}

// Rate limit
console.log(`\n  ▌ Rate limit (5 request/giây/user) — bắn 10 request liên tiếp:\n`);
const kqRL = [];
for (let i = 0; i < 10; i++) {
  const r = await gw.xuLy({ path: '/orders', headers: { authorization: 'Bearer ' + tokenGia('u-spam') } });
  kqRL.push(r.status);
}
console.log(`     ${kqRL.join(' ')}`);
console.log(`     → ${kqRL.filter((s) => s === 429).length}/10 bị chặn bằng 429 NGAY TẠI GATEWAY,
       không hề chạm tới Order Service. Đây là lý do rate limit nên đặt ở rìa hệ thống.`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 2 — CANARY DEPLOY: đưa v2 ra dần dần                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log('  tỉ lệ canary │ v1 phục vụ │ v2 phục vụ │ trạng thái');
console.log('  ─────────────┼────────────┼────────────┼────────────────────────────────');

for (const tyLe of [0, 0.01, 0.05, 0.25, 0.5, 1]) {
  gw.datCanary('orders', 'v2', tyLe);
  gw.thongKe.theoPhienBan = new Map();
  for (let i = 0; i < 1000; i++) {
    // User khác nhau ở mỗi mức canary, để rate limit của lượt đo trước
    // không ảnh hưởng lượt đo sau (mỗi user chỉ gửi 1 request).
    await gw.xuLy({ path: '/orders', headers: { authorization: 'Bearer ' + tokenGia(`u${tyLe}-${i}`) } });
  }
  const m = gw.thongKe.theoPhienBan;
  const v1 = m.get('v1') ?? 0, v2 = m.get('v2') ?? 0;
  const tt = tyLe === 0 ? 'trước khi deploy' : tyLe === 1 ? 'đã ra 100%' : `theo dõi metric ở mức ${tyLe * 100}%`;
  console.log(
    `  ${((tyLe * 100).toFixed(0) + '%').padStart(12)} │${String(v1).padStart(11)} │${String(v2).padStart(11)} │ ${tt}`
  );
}
gw.datCanary('orders', 'v2', 0);

console.log(`
  📌 Ở mỗi mức, bạn theo dõi 4 tín hiệu vàng (buổi 12) CỦA RIÊNG v2:
     tỉ lệ lỗi, p99, throughput, saturation. Xấu → giảm về 0% (rollback trong vài giây).

  📌 Vì sao canary tốt hơn blue-green? Vì bug chỉ ảnh hưởng 1% người dùng thay vì 100%.
     Vì sao blue-green vẫn có chỗ đứng? Vì rollback TỨC THÌ và không có giai đoạn
     hai phiên bản cùng chạy (quan trọng khi có thay đổi schema DB).

  ⚠️ Trong lúc canary, v1 và v2 CHẠY SONG SONG. Nên mọi thay đổi database phải tương thích
     NGƯỢC — đây chính là lý do phải dùng mẫu expand/contract.
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ PHẦN 3 — CÁI GIÁ THẬT CỦA MICROSERVICES: latency cộng dồn                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const RTT_MANG = 3;      // ms mỗi chặng mạng
const XU_LY = 8;         // ms xử lý nghiệp vụ thật sự
const P99_MOI_CHANG = 0.01; // 1% số lần một chặng bị chậm

function moPhongChuoi(soChang, soLan = 20_000) {
  const lat = [];
  let soLanDinhDuoi = 0;
  for (let i = 0; i < soLan; i++) {
    let t = 0;
    let dinhDuoi = false;
    for (let c = 0; c < soChang; c++) {
      t += XU_LY + (soChang > 1 ? RTT_MANG : 0);
      if (Math.random() < P99_MOI_CHANG) {
        t += 200; // chặng này rơi vào đuôi
        dinhDuoi = true;
      }
    }
    if (dinhDuoi) soLanDinhDuoi++;
    lat.push(t);
  }
  lat.sort((a, b) => a - b);
  return {
    p50: lat[Math.floor(lat.length * 0.5)],
    p99: lat[Math.floor(lat.length * 0.99)],
    // % request có ÍT NHẤT MỘT chặng rơi vào đuôi — đây mới là con số đáng sợ
    tyLeCham: (soLanDinhDuoi / soLan) * 100,
  };
}

console.log('  kiến trúc                  │  p50   │  p99   │ % request bị dính đuôi');
console.log('  ───────────────────────────┼────────┼────────┼───────────────────────');
for (const [ten, chang] of [
  ['Monolith (gọi hàm)', 1],
  ['3 microservice', 3],
  ['6 microservice', 6],
  ['12 microservice', 12],
]) {
  const r = moPhongChuoi(chang);
  console.log(
    `  ${ten.padEnd(26)} │${(r.p50 + 'ms').padStart(7)} │${(r.p99 + 'ms').padStart(7)} │` +
      `${(r.tyLeCham.toFixed(1) + '%').padStart(22)}`
  );
}

console.log(`
  📌 Mỗi chặng thêm vào: latency cố định + MỘT CƠ HỘI NỮA để rơi vào đuôi.
     Đây chính là tail amplification đã đo ở buổi 03, nay hiện ra dưới dạng chi phí kiến trúc.

  📌 Với 12 service, hơn 11% request tải trang dính ít nhất một chặng chậm —
     dù mỗi service riêng lẻ đều có p99 rất đẹp trên dashboard của nó.
     Đây là lý do "mỗi service đều xanh mà người dùng vẫn kêu chậm".

  📌 Nên nhớ: monolith gọi hàm mất 0,001ms. Microservice gọi HTTP mất 1-5ms — CHẬM HƠN
     1000 LẦN. Bạn đánh đổi hiệu năng để lấy sự độc lập của các team. Nếu team bạn
     không cần sự độc lập đó, bạn chỉ đang trả giá mà không nhận được gì.

📝 BÀI TẬP:
   a) Thêm "gộp response" (aggregation) vào gateway: 1 request /dashboard gọi SONG SONG
      3 service rồi trộn kết quả. So sánh latency với gọi tuần tự.
   b) Thêm circuit breaker (buổi 09) vào gateway cho từng service. Cho payments chết
      và chứng minh /orders vẫn hoạt động bình thường.
   c) Thêm "shadow traffic": nhân đôi request sang v2 nhưng BỎ QUA kết quả của nó.
      Kỹ thuật này dùng để làm gì và nguy hiểm ở chỗ nào? (Gợi ý: nếu v2 ghi vào DB thì...?)
`);
