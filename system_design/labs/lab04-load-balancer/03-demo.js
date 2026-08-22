/**
 * LAB 04.3 — So sánh các thuật toán cân bằng tải
 *
 * Chạy:  node labs/lab04-load-balancer/03-demo.js
 */

import { taoCum, ngu } from './01-backends.js';
import { LoadBalancer, THUAT_TOAN } from './02-thuat-toan.js';

const SO_REQUEST = 600;
const CONCURRENCY = 24;

function pct(sorted, p) {
  return sorted.length ? sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)] : 0;
}

/** Bắn SO_REQUEST request qua LB với mức song song cố định. */
async function chayThu({ tenThuatToan, healthCheck = true, lamOm = null }) {
  const backends = taoCum();
  const lb = new LoadBalancer({
    backends,
    chon: THUAT_TOAN[tenThuatToan](),
    healthCheck,
  });

  // Giữa chừng, làm 1 backend "ốm" để xem health check có cứu được không
  if (lamOm !== null) {
    setTimeout(() => {
      backends[lamOm].khoe = false;
    }, 300);
  }

  const latencies = [];
  let loi = 0;
  let daGui = 0;

  const t0 = performance.now();
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (daGui < SO_REQUEST) {
        const idUser = daGui++; // dùng làm khoá cho sticky hash
        const r = await lb.guiRequest(`user-${idUser % 40}`);
        latencies.push(r.latency);
        if (!r.ok) loi++;
      }
    })
  );
  const tong = (performance.now() - t0) / 1000;
  lb.dung();

  latencies.sort((a, b) => a - b);
  return {
    tenThuatToan,
    qps: latencies.length / tong,
    p50: pct(latencies, 50),
    p95: pct(latencies, 95),
    p99: pct(latencies, 99),
    loi,
    phanBo: backends.map((b) => b.thongKe()),
  };
}

function inPhanBo(phanBo) {
  const max = Math.max(...phanBo.map((p) => p.nhan));
  return phanBo
    .map((p) => `${p.ten}:${String(p.nhan).padStart(4)}${'▁▂▃▄▅▆▇█'[Math.min(7, Math.floor((p.nhan / max) * 7))]}`)
    .join('  ');
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — Cụm có 1 backend CHẬM (srv-D chậm gấp 5 lần)               ║
║ ${SO_REQUEST} request, concurrency ${CONCURRENCY}, tất cả backend đều KHOẺ                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  console.log('  thuật toán   │  QPS  │  p50  │  p95  │  p99  │ phân bố request');
  console.log('  ─────────────┼───────┼───────┼───────┼───────┼──────────────────────────────────');

  for (const ten of ['round-robin', 'random', 'least-conn', 'power-of-2', 'least-rt', 'sticky']) {
    const r = await chayThu({ tenThuatToan: ten });
    console.log(
      `  ${ten.padEnd(12)} │${r.qps.toFixed(0).padStart(6)} │` +
        `${r.p50.toFixed(0).padStart(6)} │${r.p95.toFixed(0).padStart(6)} │${r.p99.toFixed(0).padStart(6)} │ ` +
        inPhanBo(r.phanBo)
    );
    await ngu(50);
  }

  console.log(`
  📌 Đọc bảng trên:
     - round-robin chia ĐỀU SỐ LƯỢNG → srv-D (chậm 5x) vẫn nhận 25% request
       → p95/p99 xấu vì 25% người dùng phải chờ con rùa.
     - least-conn / power-of-2 tự động gửi ÍT hơn cho srv-D (vì nó luôn "bận")
       → phân bố lệch nhưng p99 TỐT HƠN. Đây là ý chính của buổi học.
     - sticky cho phân bố xấu nhất — nhưng nó tồn tại vì mục đích khác (cache locality).
     - power-of-2 gần bằng least-conn mà chỉ phải xem 2 backend thay vì tất cả.
`);

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — srv-A CHẾT giữa chừng. Health check có cứu được không?     ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  console.log('  cấu hình                        │  QPS  │  p99  │ số request LỖI');
  console.log('  ────────────────────────────────┼───────┼───────┼────────────────');

  const koHC = await chayThu({ tenThuatToan: 'round-robin', healthCheck: false, lamOm: 0 });
  console.log(
    `  round-robin, KHÔNG health check  │${koHC.qps.toFixed(0).padStart(6)} │${koHC.p99.toFixed(0).padStart(6)} │  ${koHC.loi} ❌`
  );

  const coHC = await chayThu({ tenThuatToan: 'round-robin', healthCheck: true, lamOm: 0 });
  console.log(
    `  round-robin, CÓ health check     │${coHC.qps.toFixed(0).padStart(6)} │${coHC.p99.toFixed(0).padStart(6)} │  ${coHC.loi} ✅`
  );

  console.log(`
  📌 Không health check: LB vẫn đều đặn gửi 25% request vào cái xác → 25% user thấy lỗi.
     Load balancer KHÔNG có health check thì chỉ là bộ chia đều nỗi đau.

  📌 Có health check: một số request đầu vẫn lỗi (trong khoảng thời gian giữa lúc backend
     chết và lúc LB phát hiện). Khoảng này gọi là "detection window".
     Muốn nhỏ hơn → check dày hơn → tốn tài nguyên hơn. Lại là một đánh đổi.
`);

  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Sticky session và bài toán mất cân bằng                    ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
  const st = await chayThu({ tenThuatToan: 'sticky' });
  const nhan = st.phanBo.map((p) => p.nhan);
  const lechChuan = Math.sqrt(
    nhan.reduce((s, v) => s + (v - nhan.reduce((a, b) => a + b) / nhan.length) ** 2, 0) / nhan.length
  );
  console.log(`  Phân bố: ${inPhanBo(st.phanBo)}`);
  console.log(`  Độ lệch chuẩn: ${lechChuan.toFixed(1)} request`);
  console.log(`
  📌 Với sticky, một "user nặng" (bot, crawler, khách VIP) có thể một mình làm sập
     đúng cái server được gán cho họ, trong khi các server khác nhàn rỗi.
  📌 Và khi thêm/bớt server, hash % N đổi → GẦN NHƯ TOÀN BỘ user bị gán lại server khác
     → mất hết session, cache lạnh toàn cụm. Buổi 07 sẽ chữa bằng consistent hashing.

╔═══════════════════════════════════════════════════════════════════════════╗
║ BÀI TẬP                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
  1. Sửa 01-backends.js: cho srv-D chậm gấp 20 lần thay vì 5. Chạy lại thí nghiệm 1.
     Khoảng cách p99 giữa round-robin và least-conn thay đổi ra sao?
  2. Sửa chuKyCheckMs từ 200 → 2000. Số request lỗi ở thí nghiệm 2 tăng bao nhiêu?
  3. Thêm thuật toán "weighted round robin" (srv-D nhận 1 phần, các server khác 3 phần).
     So sánh với least-conn. Nhược điểm của weighted là gì? (Gợi ý: ai gán trọng số?)
`);
}

main();
