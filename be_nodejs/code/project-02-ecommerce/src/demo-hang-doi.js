/**
 * Buổi 26 — Hàng đợi: đo lợi ích và xem retry hoạt động.
 *
 * Chạy:  node --env-file=.env src/demo-hang-doi.js
 */

import { layHangDoi, taoWorker, themViec } from './lib/hang-doi.js';
import { layRedis, dongRedis } from './lib/redis.js';

const gach = (t) => console.log(`\n${'═'.repeat(64)}\n  ${t}\n${'═'.repeat(64)}\n`);

const redis = layRedis();
await redis.flushdb();
const hangDoi = layHangDoi();
await hangDoi.obliterate({ force: true }).catch(() => {});

/** Giả lập gửi email mất 300ms. */
const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════
gach('1. ĐỒNG BỘ vs HÀNG ĐỢI — khách phải chờ bao lâu');
// ═══════════════════════════════════════════════════════════════

async function datHangDongBo() {
  const batDau = Date.now();
  await nghi(20);   // ghi database
  await nghi(300);  // gửi email  ← khách CHỜ
  await nghi(250);  // gửi SMS    ← khách CHỜ
  await nghi(400);  // đồng bộ kho ← khách CHỜ
  return Date.now() - batDau;
}

async function datHangCoHangDoi() {
  const batDau = Date.now();
  await nghi(20);   // ghi database
  await themViec('gui-email', { donHangId: 1 });
  await themViec('gui-sms', { donHangId: 1 });
  await themViec('dong-bo-kho', { donHangId: 1 });
  return Date.now() - batDau;
}

const msecDongBo = await datHangDongBo();
const msecHangDoi = await datHangCoHangDoi();

console.log(`  ❌ Làm ĐỒNG BỘ trong request : ${String(msecDongBo).padStart(5)} ms`);
console.log(`  ✅ Đẩy vào HÀNG ĐỢI          : ${String(msecHangDoi).padStart(5)} ms`);
console.log(`  → Khách thấy phản hồi nhanh gấp ${(msecDongBo / msecHangDoi).toFixed(0)} lần\n`);
console.log(`  Việc vẫn được làm — chỉ là làm SAU, ở tiến trình khác.`);

// ═══════════════════════════════════════════════════════════════
gach('2. WORKER XỬ LÝ VIỆC');
// ═══════════════════════════════════════════════════════════════

let daXuLy = 0;
const logGon = {
  debug: () => {},
  warn: (o, m) => console.log(`     ⚠️  ${m} (lần thử ${o.lanThu})`),
  error: (o, m) => console.log(`     🔴 ${m}`),
};

const worker = taoWorker(
  {
    'gui-email': async ({ donHangId }) => {
      await nghi(100);
      daXuLy++;
      console.log(`     ✉️  đã gửi email cho đơn ${donHangId}`);
    },
    'gui-sms': async ({ donHangId }) => {
      await nghi(80);
      daXuLy++;
      console.log(`     📱 đã gửi SMS cho đơn ${donHangId}`);
    },
    'dong-bo-kho': async ({ donHangId }) => {
      await nghi(120);
      daXuLy++;
      console.log(`     📦 đã đồng bộ kho cho đơn ${donHangId}`);
    },
  },
  { logger: logGon, soViecCungLuc: 3 }
);

console.log('  Worker bắt đầu xử lý 3 việc đã xếp hàng:\n');
while (daXuLy < 3) await nghi(50);

// ⚠️ ĐÓNG worker này TRƯỚC KHI tạo worker sau.
// Mọi worker cùng lắng nghe MỘT hàng đợi sẽ TRANH job của nhau —
// worker không biết xử lý loại việc đó sẽ làm job thất bại oan.
// Ở production, mỗi loại việc nên có hàng đợi riêng.
await worker.close();

// ═══════════════════════════════════════════════════════════════
gach('3. RETRY — job lỗi tự thử lại với khoảng chờ TĂNG DẦN');
// ═══════════════════════════════════════════════════════════════

let soLanGoi = 0;
const moc = [];

const workerRetry = taoWorker(
  {
    'hay-loi': async () => {
      soLanGoi++;
      moc.push(Date.now());
      // Thành công ở lần thứ 3 — mô phỏng dịch vụ chập chờn rồi hồi phục
      if (soLanGoi < 3) throw new Error(`Dịch vụ email đang lỗi (lần ${soLanGoi})`);
      console.log(`     ✅ thành công ở lần thử thứ ${soLanGoi}`);
    },
  },
  { logger: logGon }
);

console.log('  Job này lỗi 2 lần đầu, thành công ở lần 3:\n');
await themViec('hay-loi', { x: 1 });

while (soLanGoi < 3) await nghi(100);
await workerRetry.close();

console.log('\n  Khoảng cách giữa các lần thử:');
for (let i = 1; i < moc.length; i++) {
  console.log(`     lần ${i} → lần ${i + 1}: ${moc[i] - moc[i - 1]} ms`);
}
console.log(`
  → Khoảng chờ TĂNG DẦN (exponential backoff): 1s → 2s → 4s
    Dịch vụ đang quá tải mà ta dội liên tục thì chỉ làm nó chết sâu hơn.`);

// ═══════════════════════════════════════════════════════════════
gach('4. JOB LỖI HẲN — vào "hàng đợi người chết"');
// ═══════════════════════════════════════════════════════════════

let soLanLoiHan = 0;
const workerLoi = taoWorker(
  {
    'loi-han': async () => {
      soLanLoiHan++;
      throw new Error('Lỗi không bao giờ hết');
    },
  },
  { logger: logGon }
);

await themViec('loi-han', { x: 1 }, { attempts: 2, backoff: { type: 'fixed', delay: 200 } });
while (soLanLoiHan < 2) await nghi(100);
await nghi(500);
await workerLoi.close();

const daThatBai = await hangDoi.getFailed();
console.log(`  Số job trong danh sách THẤT BẠI: ${daThatBai.length}`);
if (daThatBai[0]) {
  console.log(`     tên: ${daThatBai[0].name}`);
  console.log(`     đã thử: ${daThatBai[0].attemptsMade} lần`);
  console.log(`     lý do: ${daThatBai[0].failedReason}`);
}
console.log(`
  → Job hết lượt thử KHÔNG biến mất. Nó nằm lại để ta điều tra và
    chạy lại bằng tay. Đây gọi là dead letter queue.

  ⚠️ PHẢI CÓ CẢNH BÁO khi danh sách này dài lên. Không ai nhìn thì
     hàng nghìn email không gửi được mà không ai biết.`);

// ═══════════════════════════════════════════════════════════════
gach('5. IDEMPOTENCY CỦA JOB — vì sao retry phải AN TOÀN');
// ═══════════════════════════════════════════════════════════════

console.log(`  Job "gửi email" thất bại ở lần 1 vì mạng đứt SAU KHI email đã gửi đi.
  BullMQ thử lại → KHÁCH NHẬN HAI EMAIL.

  Job PHẢI idempotent — chạy nhiều lần cho cùng kết quả:

    ❌  await guiEmail(donHang)

    ✅  const daGui = await redis.set(\`email:\${donHangId}\`, '1', 'EX', 86400, 'NX');
        if (daGui === null) return;        // đã gửi rồi, bỏ qua
        await guiEmail(donHang);

  Đây CHÍNH LÀ cơ chế idempotency key ở buổi 24, lần này áp cho job.

  QUY TẮC: mọi job phải giả định nó CÓ THỂ chạy nhiều lần.`);

// ═══════════════════════════════════════════════════════════════
gach('6. JOB HẸN GIỜ & LẶP LẠI');
// ═══════════════════════════════════════════════════════════════

await themViec('gui-email', { donHangId: 99 }, { delay: 5000 });
const treo = await hangDoi.getDelayed();
console.log(`  Job hẹn sau 5 giây: ${treo.length} job đang chờ`);
console.log(`
  ỨNG DỤNG THẬT:
    · delay 15 phút  → nhắc khách hoàn tất thanh toán
    · delay 3 ngày   → xin đánh giá sau khi giao hàng
    · lặp mỗi đêm    → dọn dữ liệu cũ, gửi báo cáo

  Job lặp lại thay thế cron — và chạy đúng CẢ KHI có nhiều bản sao server,
  vì Redis đảm bảo chỉ MỘT worker nhận mỗi job.`);

// ═══════════════════════════════════════════════════════════════
await hangDoi.obliterate({ force: true }).catch(() => {});
await hangDoi.close();
await dongRedis();

console.log('\n✅ Xong\n');
