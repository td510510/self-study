/**
 * LAB 03.2 — Vì sao p99 quan trọng hơn trung bình
 *
 * Chạy:  node labs/lab03-do-luong/02-percentile.js
 */

// ─── Sinh dữ liệu latency giống thực tế: đa số nhanh, một đuôi dài ─────────
function sinhLatency(n = 10_000) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    if (r < 0.95) out.push(8 + Math.random() * 12);            // 95%: 8-20ms  (cache hit)
    else if (r < 0.995) out.push(60 + Math.random() * 140);    // 4.5%: 60-200ms (đi xuống DB)
    else out.push(1200 + Math.random() * 3800);                // 0.5%: 1.2-5s (GC pause, retry, lock)
  }
  return out;
}

function percentile(sortedArr, p) {
  const idx = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(idx, sortedArr.length - 1))];
}

function thongKe(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const tong = s.reduce((a, b) => a + b, 0);
  return {
    n: s.length,
    trungBinh: tong / s.length,
    p50: percentile(s, 50),
    p90: percentile(s, 90),
    p95: percentile(s, 95),
    p99: percentile(s, 99),
    p999: percentile(s, 99.9),
    max: s.at(-1),
  };
}

/** Biểu đồ cột ASCII */
function bieuDo(nhanGiaTri, rong = 46) {
  const max = Math.max(...nhanGiaTri.map(([, v]) => v));
  for (const [nhan, v] of nhanGiaTri) {
    const soO = Math.max(1, Math.round((v / max) * rong));
    console.log(`  ${nhan.padEnd(12)} ${'█'.repeat(soO)} ${v.toFixed(1)}ms`);
  }
}

const data = sinhLatency();
const t = thongKe(data);

console.log('\n═══ PHÂN PHỐI LATENCY CỦA 10.000 REQUEST ═══\n');
bieuDo([
  ['trung bình', t.trungBinh],
  ['p50', t.p50],
  ['p90', t.p90],
  ['p95', t.p95],
  ['p99', t.p99],
  ['p99.9', t.p999],
  ['max', t.max],
]);

console.log(`
📌 Nhận xét:
   - Trung bình (${t.trungBinh.toFixed(0)}ms) và p50 (${t.p50.toFixed(0)}ms) trông rất đẹp.
   - Nhưng p99 = ${t.p99.toFixed(0)}ms: cứ 100 request thì 1 request chậm như vậy.
   - Với 1 triệu request/ngày, đó là 10.000 lượt trải nghiệm tồi MỖI NGÀY.
   - Trung bình che giấu đuôi. Dashboard chỉ có "avg latency" là dashboard nói dối.
`);

// ─── Khuếch đại đuôi: fan-out ───────────────────────────────────────────────
console.log('═══ HIỆU ỨNG KHUẾCH ĐẠI ĐUÔI (TAIL AMPLIFICATION) ═══\n');
console.log('  Một trang gọi song song N service. Trang xong khi service CHẬM NHẤT xong.\n');
console.log('  Mỗi service có p99 = 1s (1% số lần chậm)\n');
console.log('  Số service │ % request tải trang bị chậm');
console.log('  ───────────┼────────────────────────────────────────────');

for (const n of [1, 2, 5, 10, 20, 50, 100]) {
  const pNhanh = Math.pow(0.99, n);
  const pCham = (1 - pNhanh) * 100;
  const thanh = '▓'.repeat(Math.round(pCham / 2));
  console.log(`  ${String(n).padStart(9)}  │ ${pCham.toFixed(1).padStart(5)}%  ${thanh}`);
}

console.log(`
📌 Nhận xét:
   - Chia nhỏ thành 20 microservice: p99 của mỗi service biến thành ~p82 của TRANG.
   - Càng nhiều service, càng phải ép p99 của từng service xuống thấp hơn nữa.
   - Đây là cái giá ẩn của microservices mà ít ai nói (buổi 14).
   - Cách chữa: timeout chặt + giá trị mặc định + hedged request (buổi 09).
`);

// ─── Mô phỏng: đo trước/sau khi thêm cache ─────────────────────────────────
console.log('═══ THÊM CACHE THÌ PERCENTILE ĐỔI THẾ NÀO? ═══\n');

function moPhongCache(hitRate) {
  const out = [];
  for (let i = 0; i < 10_000; i++) {
    if (Math.random() < hitRate) out.push(1 + Math.random() * 2);   // cache hit: 1-3ms
    else out.push(30 + Math.random() * 170);                        // miss: 30-200ms
  }
  return thongKe(out);
}

console.log('  hit rate │   p50   │   p95   │   p99   │ trung bình');
console.log('  ─────────┼─────────┼─────────┼─────────┼───────────');
for (const hr of [0, 0.5, 0.8, 0.9, 0.95, 0.99]) {
  const s = moPhongCache(hr);
  console.log(
    `  ${String(Math.round(hr * 100) + '%').padStart(8)} │` +
      `${(s.p50.toFixed(1) + 'ms').padStart(8)} │` +
      `${(s.p95.toFixed(1) + 'ms').padStart(8)} │` +
      `${(s.p99.toFixed(1) + 'ms').padStart(8)} │` +
      `${(s.trungBinh.toFixed(1) + 'ms').padStart(10)}`
  );
}

console.log(`
📌 Nhận xét cực quan trọng:
   - Tăng hit rate 0% → 90%: TRUNG BÌNH giảm mạnh, nhưng p99 gần như KHÔNG ĐỔI.
   - Lý do: p99 chính là các request bị miss. Cache không giúp gì cho chúng.
   - Muốn cải thiện p99 phải làm cho đường CHẬM nhanh lên (tối ưu query, index),
     chứ không phải làm cho đường nhanh nhanh thêm.
   - Chỉ khi hit rate > 99% thì p99 mới thực sự rơi xuống.
`);
