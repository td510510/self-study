/**
 * Bắn N đơn hàng song song rồi chờ tất cả ngã ngũ — để có số liệu cho Grafana/Jaeger.
 *   npm run tai            (mặc định 200 đơn, 20 song song)
 *   npm run tai -- 1000 50
 */
const [tong = 200, songSong = 20] = process.argv.slice(2).map(Number);
const url = `http://localhost:${process.env.CONG_DON_HANG ?? 3201}`;
const SAN_PHAM = ['ao-thun', 'ao-thun', 'ao-thun', 'mu', 'tui', 'khong-co'];

// Chờ dịch vụ SẴN SÀNG (readiness — buổi 43) thay vì sleep đoán mò
for (let lan = 0; ; lan++) {
  const ok = await fetch(`${url}/health/ready`).then((r) => r.ok, () => false);
  if (ok) break;
  if (lan > 60) throw new Error(`${url} không sẵn sàng sau 30 giây`);
  await new Promise((r) => setTimeout(r, 500));
}

const ids = [];
let i = 0;
const batDau = Date.now();
await Promise.all(Array.from({ length: songSong }, async () => {
  while (i < tong) {
    i++;
    const r = await fetch(`${url}/don-hang`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sanPhamId: SAN_PHAM[Math.floor(Math.random() * SAN_PHAM.length)],
        soLuong: 1 + Math.floor(Math.random() * 3),
        // ~2% email hỏng → thấy message rơi vào DLQ
        email: Math.random() < 0.02 ? 'email-hong' : `khach${i}@vd.vn`,
      }),
    });
    if (r.status === 202) ids.push((await r.json()).donHangId);
  }
}));
console.log(`Gửi ${ids.length} đơn trong ${Date.now() - batDau} ms (tất cả 202 — chưa ai biết kết quả)`);

const dem = {};
for (let lan = 0; lan < 60; lan++) {
  for (const k in dem) delete dem[k];
  for (const id of ids) {
    const d = await (await fetch(`${url}/don-hang/${id}`)).json();
    dem[d.trangThai] = (dem[d.trangThai] ?? 0) + 1;
  }
  if (!dem.CHO_XAC_NHAN) break;
  await new Promise((r) => setTimeout(r, 500));
}
console.log(`Sau ${Date.now() - batDau} ms:`, dem);
