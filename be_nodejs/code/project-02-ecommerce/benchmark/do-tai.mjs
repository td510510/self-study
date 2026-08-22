/**
 * Buổi 44 — Đo tải bằng autocannon.
 *
 * Chạy:  node --env-file=.env src/server.js      (terminal 1)
 *        node benchmark/do-tai.mjs               (terminal 2)
 *
 * Đo BA kịch bản để thấy tác động của cache và độ nặng truy vấn.
 */

import autocannon from 'autocannon';

const CO_SO = 'http://localhost:3000';

async function do_(nhan, opts) {
  // ⚠️ Truyền URL ĐẦY ĐỦ vào `url`.
  // Dùng { url: CO_SO, path: '/health' } thì autocannon BỎ QUA `path`
  // và gọi '/' → toàn bộ response là 404, số đo hoàn toàn vô nghĩa.
  // (Đã đo thật: url+path → 0 request 2xx, 10200 request 4xx.)
  const kq = await autocannon({
    connections: 20,      // 20 kết nối đồng thời
    duration: 8,          // trong 8 giây
    ...opts,
  });

  return {
    nhan,
    rps: Math.round(kq.requests.average),
    p50: kq.latency.p50,
    p95: kq.latency.p97_5,   // autocannon dùng p97.5 thay p95
    p99: kq.latency.p99,
    max: kq.latency.max,
    loi: kq.errors + kq.non2xx,
  };
}

console.log('Đang đo... (mỗi kịch bản 8 giây)\n');

const ketQua = [];

// 1. Endpoint nhẹ nhất — không đụng database
ketQua.push(await do_('/health (không DB)', { url: `${CO_SO}/health` }));

// 2. Có truy vấn database + cache Redis (buổi 21)
ketQua.push(await do_('/san-pham (có cache)', { url: `${CO_SO}/san-pham?trang=1&moiTrang=20` }));

// 3. Cùng endpoint nhưng mỗi request một bộ lọc khác → CACHE MISS mọi lần
let dem = 0;
ketQua.push(
  await do_('/san-pham (cache MISS mọi lần)', {
    url: CO_SO,
    requests: [
      {
        method: 'GET',
        // MỖI request một khoá cache KHÁC NHAU → luôn MISS.
        // Nếu chỉ xoay vòng vài chục khoá thì sau vài giây tất cả
        // đã nằm trong cache, và ta lại đo cache HIT — số liệu sai.
        setupRequest: (req) => ({ ...req, path: `/san-pham?trang=${++dem}&moiTrang=20` }),
      },
    ],
  })
);

// ═══════════════════════════════════════════════════════════════
console.log('  kịch bản                          |    RPS |   p50 |   p95 |   p99 |   max | lỗi');
console.log('  ----------------------------------|--------|-------|-------|-------|-------|-----');
for (const r of ketQua) {
  console.log(
    `  ${r.nhan.padEnd(34)}| ${String(r.rps).padStart(6)} | ${String(r.p50).padStart(4)}ms | ` +
      `${String(r.p95).padStart(4)}ms | ${String(r.p99).padStart(4)}ms | ${String(r.max).padStart(4)}ms | ` +
      `${String(r.loi).padStart(4)}`
  );
}

const tongLoi = ketQua.reduce((s, r) => s + r.loi, 0);
if (tongLoi > 0) {
  console.log(`
  🚨 CÓ ${tongLoi} RESPONSE KHÔNG PHẢI 2xx.

     HAI nguyên nhân phổ biến nhất:

     1. RATE LIMIT đang bật → ta đo BỘ GIỚI HẠN, không phải ứng dụng.
        Chạy lại: BAT_RATE_LIMIT=false NODE_ENV=production node --env-file=.env src/server.js

     2. Gọi SAI ĐƯỜNG DẪN → toàn bộ là 404.
        Kiểm tra bằng curl trước khi tin vào số liệu.

     ⚠️ Số liệu có lỗi là số liệu VÔ NGHĨA. Đừng bao giờ báo cáo nó.`);
}

console.log(`

ĐỌC SỐ LIỆU THẾ NÀO

  RPS  — số request phục vụ được mỗi giây. Càng cao càng tốt.
  p50  — nửa số người dùng nhanh hơn con số này.
  p95  — 95% nhanh hơn. ĐÂY LÀ CON SỐ ĐÁNG QUAN TÂM NHẤT.
  p99  — 1% chậm nhất. Với 1 triệu request/ngày, đó là 10.000 người.
  max  — trường hợp tệ nhất.

⚠️ ĐỪNG DÙNG TRUNG BÌNH.
   Trung bình 100ms có thể là: mọi người 100ms,
   hoặc 90% người 20ms và 10% người 800ms.
   Hai hệ thống đó KHÁC HẲN nhau, nhưng trung bình giống nhau.

⚠️ SỐ LIỆU NÀY KHÔNG PHẢI PRODUCTION.
   Đo trên máy dev, client và server cùng máy, không có độ trễ mạng,
   dữ liệu ít. Dùng để SO SÁNH TRƯỚC/SAU khi tối ưu, KHÔNG dùng để
   hứa hẹn năng lực với khách hàng.
`);
