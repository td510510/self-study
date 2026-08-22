/**
 * LAB 03.4 — Mô phỏng hàng đợi: vì sao "gần đầy tải" lại thảm hoạ
 *
 * Chạy:  node labs/lab03-do-luong/04-little-law.js
 *
 * Không cần server. Đây là mô phỏng rời rạc (discrete event) một hàng đợi M/M/1.
 */

/**
 * Mô phỏng: request đến ngẫu nhiên với tốc độ lambda (req/s),
 * server xử lý được mu (req/s). Utilization ρ = lambda / mu.
 */
function moPhong({ lambda, mu, soRequest = 20_000 }) {
  const muRandom = () => -Math.log(1 - Math.random()); // phân phối mũ chuẩn hoá

  let thoiDiemDen = 0;
  let serverRanhLuc = 0;
  const thoiGianTrongHeThong = [];
  const thoiGianCho = [];

  for (let i = 0; i < soRequest; i++) {
    thoiDiemDen += muRandom() / lambda;           // khoảng cách giữa 2 request
    const batDauXuLy = Math.max(thoiDiemDen, serverRanhLuc);
    const thoiGianXuLy = muRandom() / mu;
    serverRanhLuc = batDauXuLy + thoiGianXuLy;

    thoiGianCho.push(batDauXuLy - thoiDiemDen);
    thoiGianTrongHeThong.push(serverRanhLuc - thoiDiemDen);
  }

  const s = [...thoiGianTrongHeThong].sort((a, b) => a - b);
  const tb = s.reduce((a, b) => a + b, 0) / s.length;
  const p = (q) => s[Math.ceil((q / 100) * s.length) - 1];

  return {
    rho: lambda / mu,
    trungBinhMs: tb * 1000,
    p50: p(50) * 1000,
    p95: p(95) * 1000,
    p99: p(99) * 1000,
    choTrungBinhMs: (thoiGianCho.reduce((a, b) => a + b, 0) / thoiGianCho.length) * 1000,
    // Little: L = λ × W
    concurrency: lambda * tb,
  };
}

const MU = 100; // server xử lý 100 req/s, tức 10ms/request khi rảnh

console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║ MÔ PHỎNG HÀNG ĐỢI — server xử lý ${MU} req/s (10ms/request khi rảnh)   ║
╚══════════════════════════════════════════════════════════════════════╝
`);

console.log('   ρ    │  QPS  │  TB    │  p50   │  p95   │  p99   │ đang xử lý');
console.log('  ──────┼───────┼────────┼────────┼────────┼────────┼───────────');

const mucTai = [0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 0.95, 0.98, 0.99];
const ketQua = [];

for (const rho of mucTai) {
  // Càng gần bão hoà, hàng đợi càng lâu ổn định → cần nhiều mẫu hơn để số hội tụ.
  const r = moPhong({ lambda: MU * rho, mu: MU, soRequest: Math.round(20_000 / (1 - rho)) });
  ketQua.push({ rho, ...r });
  console.log(
    `  ${(rho * 100).toFixed(0).padStart(4)}% │` +
      `${(MU * rho).toFixed(0).padStart(6)} │` +
      `${(r.trungBinhMs.toFixed(0) + 'ms').padStart(7)} │` +
      `${(r.p50.toFixed(0) + 'ms').padStart(7)} │` +
      `${(r.p95.toFixed(0) + 'ms').padStart(7)} │` +
      `${(r.p99.toFixed(0) + 'ms').padStart(7)} │` +
      `${r.concurrency.toFixed(1).padStart(10)}`
  );
}

console.log('\n═══ LATENCY TRUNG BÌNH theo mức sử dụng ═══\n');
const maxTB = Math.max(...ketQua.map((r) => r.trungBinhMs));
for (const r of ketQua) {
  const o = Math.round((r.trungBinhMs / maxTB) * 46);
  console.log(`  ${(r.rho * 100).toFixed(0).padStart(3)}% ${'█'.repeat(o)} ${r.trungBinhMs.toFixed(0)}ms`);
}

console.log(`
📌 BÀI HỌC LỚN NHẤT CỦA BUỔI HỌC NÀY:

   Latency KHÔNG tăng tuyến tính theo tải. Nó tăng theo công thức 1/(1-ρ):

       ρ = 50%  →  latency ×2   so với khi rảnh
       ρ = 90%  →  latency ×10
       ρ = 95%  →  latency ×20
       ρ = 99%  →  latency ×100

   Nghĩa là:
   - Server chạy 50% CPU: ổn. Chạy 90% CPU: latency đã tệ gấp 5 lần so với 50%.
   - "CPU mới có 85%, còn dư mà!" là câu nói nguy hiểm nhất trong vận hành.
   - Đó là lý do người ta autoscale ở ngưỡng 60-70%, không phải 95%.

   Và quan trọng nhất: điều này đúng cả khi tải KHÔNG đổi. Chỉ cần request đến
   ngẫu nhiên (thực tế luôn ngẫu nhiên) là hàng đợi đã hình thành.

📌 Kiểm chứng định luật Little (L = λ × W): cột "đang xử lý" ở bảng trên chính là L.
   Ở ρ=99%, có ~${ketQua.at(-1).concurrency.toFixed(0)} request cùng nằm trong hệ thống — mỗi cái là RAM,
   là 1 connection DB, là 1 socket. Đây là cách hệ thống chết vì hết tài nguyên.
`);
