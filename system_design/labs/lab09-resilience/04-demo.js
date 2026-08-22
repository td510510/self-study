/**
 * LAB 09 — Độ tin cậy: retry storm, circuit breaker, rate limiting
 *
 * Chạy:  node labs/lab09-resilience/04-demo.js
 */

import { goiCoRetry, CHIEN_LUOC_CHO, nenRetryMacDinh, ngu } from './01-retry.js';
import { CircuitBreaker } from './02-circuit-breaker.js';
import { FixedWindow, SlidingLog, SlidingCounter, TokenBucket } from './03-rate-limiter.js';

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 1 — RETRY STORM: retry làm tải tăng bao nhiêu lần?
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — RETRY STORM                                                   ║
║ Downstream đang quá tải (lỗi 60%). 500 client cùng gọi và cùng retry.        ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

/** Downstream càng bị gọi nhiều thì càng lỗi nhiều — đúng như thực tế. */
class Downstream {
  constructor(sucChua = 200) {
    this.sucChua = sucChua;
    this.soLanGoi = 0;
    this.dinhDongThoi = 0;
    this.dangXuLy = 0;
  }
  async goi() {
    this.soLanGoi++;
    this.dangXuLy++;
    this.dinhDongThoi = Math.max(this.dinhDongThoi, this.dangXuLy);
    try {
      await ngu(3);
      // Tỉ lệ lỗi TĂNG theo tải hiện tại — đây là vòng phản hồi dương chết người
      const tyLeLoi = Math.min(0.95, 0.6 + this.dangXuLy / this.sucChua);
      if (Math.random() < tyLeLoi) throw Object.assign(new Error('503'), { status: 503 });
      return 'ok';
    } finally {
      this.dangXuLy--;
    }
  }
}

async function thuRetry(tenChienLuoc, tinhCho, soClient = 500) {
  const ds = new Downstream();
  const thoiDiemGoi = [];
  const goiGoc = ds.goi.bind(ds);
  ds.goi = () => {
    thoiDiemGoi.push(Date.now());
    return goiGoc();
  };

  const t0 = Date.now();
  const kq = await Promise.all(
    Array.from({ length: soClient }, () =>
      goiCoRetry(() => ds.goi(), { soLanToiDa: 4, tinhCho, nenRetry: nenRetryMacDinh })
        .then(() => true)
        .catch(() => false)
    )
  );

  return {
    tenChienLuoc,
    soClient,
    tongGoi: ds.soLanGoi,
    khuechDai: ds.soLanGoi / soClient,
    thanhCong: kq.filter(Boolean).length,
    // Áp lực THẬT lên downstream: bao nhiêu request cùng nằm trong nó tại đỉnh điểm
    dinhDongThoi: ds.dinhDongThoi,
  };
}

console.log('  chiến lược chờ         │ tổng lần gọi │ khuếch đại │ thành công │ tỉ lệ qua');
console.log('  ───────────────────────┼──────────────┼────────────┼────────────┼──────────');
for (const ten of ['ngay lập tức', 'cố định 100ms', 'backoff mũ', 'backoff + full jitter', 'decorrelated jitter']) {
  const r = await thuRetry(ten, CHIEN_LUOC_CHO[ten]);
  console.log(
    `  ${ten.padEnd(22)} │${String(r.tongGoi).padStart(13)} │${('×' + r.khuechDai.toFixed(2)).padStart(11)} │` +
      `${(r.thanhCong + '/' + r.soClient).padStart(11)} │` +
      `${((r.thanhCong / r.soClient) * 100).toFixed(0).padStart(8)}%`
  );
}

console.log(`
  📌 Cột "khuếch đại": 500 request của người dùng biến thành bao nhiêu request thật.
     Retry ngây thơ có thể nhân tải lên 3-4 lần — ĐÚNG LÚC hệ thống đang ngộp nhất.
     Đây là cách một sự cố nhỏ trở thành sự cố toàn hệ thống.

  📌 Cột "thành công" mới là kết quả quan trọng nhất, và nó nói rất rõ:
     không jitter → mọi client retry ĐỒNG PHA, cùng đập vào downstream một lúc,
     tỉ lệ lỗi lại tăng (vì lỗi tỉ lệ thuận với tải), nên rất ít ai qua được.
     Có jitter → các lần retry rải đều ra, downstream có khoảng thở giữa các đợt,
     tỉ lệ thành công tăng GẤP ĐÔI dù tổng số lần gọi gần như y hệt.

  📌 Và nhớ retry budget: giới hạn tổng số retry ở mức ~10% traffic.
     Không có budget thì dù có jitter, tải vẫn tăng khi mọi thứ cùng hỏng.
`);

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 2 — CIRCUIT BREAKER
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — Service "Gợi ý" CHẾT HẲN. Trang chủ phản ứng thế nào?         ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

/** Service chết: mọi request đều treo tới timeout rồi lỗi. */
async function serviceGoiYDaChet() {
  await ngu(300); // timeout 300ms
  throw new Error('ETIMEDOUT');
}

async function thuCircuitBreaker({ dungCB }) {
  const cb = new CircuitBreaker({
    nguongLoi: 0.5,
    soMauToiThieu: 5,
    thoiGianNghiMs: 400,
    soThuHalfOpen: 2,
  });

  const latencies = [];
  let soLanGoiThat = 0;
  let soLanCoFallback = 0;

  for (let i = 0; i < 120; i++) {
    const t0 = performance.now();
    if (dungCB) {
      const kq = await cb.goi(async () => {
        soLanGoiThat++;
        return serviceGoiYDaChet();
      }, /* fallback */ 'TOP_BAN_CHAY_TINH');
      if (kq === 'TOP_BAN_CHAY_TINH') soLanCoFallback++;
    } else {
      try {
        soLanGoiThat++;
        await serviceGoiYDaChet();
      } catch {
        soLanCoFallback++;
      }
    }
    latencies.push(performance.now() - t0);
    await ngu(5);
  }

  latencies.sort((a, b) => a - b);
  return {
    p50: latencies[Math.floor(latencies.length * 0.5)],
    p99: latencies[Math.floor(latencies.length * 0.99)],
    tong: latencies.reduce((a, b) => a + b, 0),
    soLanGoiThat,
    trangThaiCuoi: dungCB ? cb.trangThai : '—',
    chuyenTrangThai: dungCB ? cb.thongKe.chuyenTrangThai.length : 0,
  };
}

const khongCB = await thuCircuitBreaker({ dungCB: false });
const coCB = await thuCircuitBreaker({ dungCB: true });

console.log('  cấu hình             │ p50 latency │ tổng thời gian │ số lần gọi service chết │ trạng thái');
console.log('  ─────────────────────┼─────────────┼────────────────┼─────────────────────────┼───────────');
console.log(
  `  KHÔNG circuit breaker│${(khongCB.p50.toFixed(0) + 'ms').padStart(12)} │${(khongCB.tong.toFixed(0) + 'ms').padStart(15)} │` +
    `${String(khongCB.soLanGoiThat).padStart(24)} │ —  ❌`
);
console.log(
  `  CÓ circuit breaker   │${(coCB.p50.toFixed(0) + 'ms').padStart(12)} │${(coCB.tong.toFixed(0) + 'ms').padStart(15)} │` +
    `${String(coCB.soLanGoiThat).padStart(24)} │ ${coCB.trangThaiCuoi}  ✅`
);

console.log(`
  📌 Không CB: mỗi request đều chờ đủ 300ms rồi mới biết là lỗi.
     120 request × 300ms = ${(khongCB.tong / 1000).toFixed(1)}s thread bị giữ VÔ ÍCH.
     Ở production, đó là 120 thread/connection không phục vụ được ai — chính là cách
     một widget nhỏ kéo sập trang chủ.

  📌 Có CB: sau vài lần lỗi đầu, mạch MỞ và các request sau bị từ chối trong ~0ms,
     trả về ngay nội dung dự phòng ("Sản phẩm bán chạy" tĩnh).
     Chỉ ${coCB.soLanGoiThat}/120 request thực sự chạm vào service đã chết
     (những lần HALF_OPEN thăm dò xem nó sống lại chưa).

  📌 Lợi ích kép: vừa bảo vệ MÌNH (không cạn thread), vừa bảo vệ NÓ
     (service đang ngộp được nghỉ để hồi phục thay vì bị dồn tải liên tục).
`);

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 3 — RATE LIMITING: so sánh 4 thuật toán
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Lỗi ranh giới cửa sổ của Fixed Window                        ║
║ Giới hạn: 100 request / 1000ms                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const GIOI_HAN = 100, CUA_SO = 1000;

function thuRanhGioi(taoLimiter) {
  const lim = taoLimiter();
  const T = 10_000; // mốc bắt đầu cửa sổ (10000 % 1000 === 0)
  let choQua = 0;

  // 100 request ở cuối cửa sổ 1 (t = 10.900 → 10.999)
  for (let i = 0; i < 100; i++) if (lim.chophep('u1', T + 900 + i)) choQua++;
  // 100 request ở đầu cửa sổ 2 (t = 11.000 → 11.099)
  for (let i = 0; i < 100; i++) if (lim.chophep('u1', T + 1000 + i)) choQua++;

  return choQua; // trong khoảng ~200ms, lẽ ra không được vượt quá ~100
}

console.log('  thuật toán              │ số request lọt qua trong 200ms │ lý tưởng ≈ 100');
console.log('  ────────────────────────┼────────────────────────────────┼───────────────');
const bang = [
  ['Fixed Window', () => new FixedWindow(GIOI_HAN, CUA_SO)],
  ['Sliding Window Log', () => new SlidingLog(GIOI_HAN, CUA_SO)],
  ['Sliding Window Counter', () => new SlidingCounter(GIOI_HAN, CUA_SO)],
  ['Token Bucket', () => new TokenBucket(GIOI_HAN / (CUA_SO / 1000), GIOI_HAN)],
];
for (const [ten, tao] of bang) {
  const n = thuRanhGioi(tao);
  console.log(`  ${ten.padEnd(23)} │${String(n).padStart(31)} │ ${n > 150 ? '❌ phá giới hạn 2×' : '✅'}`);
}

console.log(`
  📌 Fixed Window cho lọt gấp đôi giới hạn ngay tại ranh giới cửa sổ.
     Kẻ tấn công biết điều này sẽ canh đúng thời điểm đó.

  📌 Token Bucket cũng cho phép burst — NHƯNG là burst CÓ KIỂM SOÁT (tối đa bằng
     sức chứa của xô), và sau đó tốc độ bị ép về đúng mức trung bình. Đây là hành vi
     MONG MUỐN: người dùng thật hay thao tác theo cụm.

  📌 Sliding Window Log chính xác tuyệt đối nhưng phải lưu timestamp của MỌI request.
     Với 1 triệu user × 100 request = 100 triệu timestamp trong Redis. Rất tốn.
`);

// ─── Token bucket hoạt động theo thời gian ─────────────────────────────────
console.log(`
  ▌ Token Bucket theo dòng thời gian (10 token/s, xô chứa 10):
`);
const tb = new TokenBucket(10, 10);
let t = 0;
const ve = [];
for (const [nhan, soReq, buoc] of [
  ['burst 15 request ngay lập tức', 15, 0],
  ['sau 500ms, 10 request nữa', 10, 500],
  ['sau 2s nữa, 10 request', 10, 2000],
]) {
  t += buoc;
  let ok = 0;
  for (let i = 0; i < soReq; i++) if (tb.chophep('u', t)) ok++;
  ve.push(`     ${nhan.padEnd(32)} → cho qua ${ok}/${soReq}`);
}
console.log(ve.join('\n'));

console.log(`
  📌 Burst đầu tiên: xô đầy 10 token → cho qua 10, chặn 5. Người dùng thật ít khi
     gửi 15 request trong 1ms, nên hành vi này chấp nhận được.
  📌 Sau 2 giây nghỉ, xô nạp lại đầy → lại cho phép burst. Đúng như thiết kế.

📝 BÀI TẬP:
   a) Cài "retry budget": chỉ cho retry khi tổng số retry < 10% tổng request.
      Chạy lại thí nghiệm 1 và so sánh hệ số khuếch đại.
   b) Cài Bulkhead: hai pool riêng cho /checkout và /recommendations. Chứng minh
      rằng /recommendations chậm KHÔNG còn ảnh hưởng /checkout.
   c) Thêm "hedged request": nếu sau p95 chưa có kết quả thì gửi thêm 1 request nữa
      tới replica khác và lấy cái nào về trước. Nó cải thiện p99 bao nhiêu?
      Cái giá là gì? (Gợi ý: tải tăng ~5%.)
`);
