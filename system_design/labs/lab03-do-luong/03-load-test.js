/**
 * LAB 03.3 — Tự viết công cụ đo tải (mini autocannon)
 *
 * Cần bật server lab 02 trước:
 *   node labs/lab02-http-api/server.js       # terminal 1
 *   node labs/lab03-do-luong/03-load-test.js # terminal 2
 *
 * Mục tiêu: NHÌN THẤY điểm "knee" — nơi tăng tải thêm một chút khiến latency bùng nổ.
 */

const URL_DICH = process.argv[2] ?? 'http://localhost:3002/v1/products?limit=10';
const CAC_MUC_CONCURRENCY = [1, 2, 4, 8, 16, 32, 64, 128];
const THOI_GIAN_MOI_MUC_MS = 2000;

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}

/** Chạy `concurrency` "worker" song song, mỗi worker gửi request liên tục trong `durationMs`. */
async function chayMucTai(concurrency, durationMs) {
  const latencies = [];
  let loi = 0;
  const ketThuc = Date.now() + durationMs;

  async function worker() {
    while (Date.now() < ketThuc) {
      const t0 = performance.now();
      try {
        const r = await fetch(URL_DICH);
        await r.arrayBuffer(); // phải đọc hết body, nếu không đo thiếu
        if (!r.ok) loi++;
      } catch {
        loi++;
      }
      latencies.push(performance.now() - t0);
    }
  }

  const t0 = performance.now();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const tongThoiGian = (performance.now() - t0) / 1000;

  latencies.sort((a, b) => a - b);
  return {
    concurrency,
    soRequest: latencies.length,
    qps: latencies.length / tongThoiGian,
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: latencies.at(-1) ?? 0,
    loi,
  };
}

function ve(ketQua) {
  const maxQps = Math.max(...ketQua.map((r) => r.qps));
  const maxP99 = Math.max(...ketQua.map((r) => r.p99));

  console.log('\n═══ THROUGHPUT (QPS) theo concurrency ═══');
  for (const r of ketQua) {
    const o = Math.round((r.qps / maxQps) * 40);
    console.log(`  c=${String(r.concurrency).padStart(3)} ${'█'.repeat(o).padEnd(40)} ${r.qps.toFixed(0)} QPS`);
  }

  console.log('\n═══ LATENCY p99 theo concurrency ═══');
  for (const r of ketQua) {
    const o = Math.round((r.p99 / maxP99) * 40);
    console.log(`  c=${String(r.concurrency).padStart(3)} ${'▒'.repeat(o).padEnd(40)} ${r.p99.toFixed(1)} ms`);
  }
}

async function main() {
  console.log(`\n🎯 Đo tải: ${URL_DICH}`);
  console.log(`   Mỗi mức chạy ${THOI_GIAN_MOI_MUC_MS / 1000}s. Tổng ~${(CAC_MUC_CONCURRENCY.length * THOI_GIAN_MOI_MUC_MS) / 1000}s.\n`);

  // Kiểm tra server sống chưa
  try {
    await fetch(URL_DICH);
  } catch {
    console.error('💥 Không kết nối được. Hãy chạy `node labs/lab02-http-api/server.js` trước.');
    process.exit(1);
  }

  console.log('  conc │   QPS   │   p50   │   p95   │   p99   │  lỗi');
  console.log('  ─────┼─────────┼─────────┼─────────┼─────────┼──────');

  const ketQua = [];
  for (const c of CAC_MUC_CONCURRENCY) {
    const r = await chayMucTai(c, THOI_GIAN_MOI_MUC_MS);
    ketQua.push(r);
    console.log(
      `  ${String(c).padStart(4)} │${r.qps.toFixed(0).padStart(8)} │` +
        `${r.p50.toFixed(1).padStart(8)} │${r.p95.toFixed(1).padStart(8)} │` +
        `${r.p99.toFixed(1).padStart(8)} │${String(r.loi).padStart(5)}`
    );
  }

  ve(ketQua);

  // ─── Tìm điểm knee: nơi QPS bão hoà nhưng latency vẫn tăng ────────────────
  let knee = ketQua[0];
  for (const r of ketQua) if (r.qps > knee.qps * 1.05) knee = r;

  console.log(`
═══ PHÂN TÍCH ═══

  Throughput đạt đỉnh ~${knee.qps.toFixed(0)} QPS tại concurrency = ${knee.concurrency}.

  📌 Quan sát mẫu hình kinh điển:
     - Giai đoạn đầu: tăng concurrency → QPS tăng tuyến tính, latency gần như không đổi.
       (Hệ thống còn rảnh, đang dùng thêm tài nguyên nhàn rỗi.)
     - Sau điểm KNEE:  QPS ĐỨNG YÊN nhưng latency TĂNG TUYẾN TÍNH.
       (Request chỉ đang xếp hàng chờ. Thêm tải = thêm thời gian chờ, không thêm việc xong.)
     - Quá xa nữa:     QPS GIẢM, lỗi tăng. Hệ thống sụp (congestion collapse).

  📌 Kiểm chứng định luật Little tại điểm knee:
     L = λ × W  →  ${knee.concurrency} ≈ ${(knee.qps * (knee.p50 / 1000)).toFixed(1)}
     (concurrency ≈ QPS × latency tính bằng giây)

  📌 Ý nghĩa vận hành:
     - Đừng chạy hệ thống sát điểm knee. Giữ ~50-70% để còn chỗ cho peak.
     - Autoscale nên kích hoạt TRƯỚC knee, không phải sau khi latency đã bùng nổ.
     - Đây cũng là lý do cần rate limiting và load shedding (buổi 09):
       từ chối bớt request còn tốt hơn để cả hệ thống chậm cho tất cả mọi người.
`);
}

main();
