/**
 * LAB 08 — Message Queue: at-least-once, idempotency, DLQ
 *
 * Chạy:  node labs/lab08-message-queue/02-demo.js
 */

import { MessageQueue, chayWorker, ngu } from './01-queue.js';

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 1 — Đồng bộ vs Bất đồng bộ: user phải chờ bao lâu?
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — Tách việc ra chạy nền thì user chờ ít hơn bao nhiêu?          ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const CONG_VIEC = [
  { ten: 'Tạo đơn trong DB', ms: 20, batBuoc: true },
  { ten: 'Trừ tiền', ms: 80, batBuoc: true },
  { ten: 'Giữ hàng trong kho', ms: 40, batBuoc: true },
  { ten: 'Gửi email xác nhận', ms: 120, batBuoc: false },
  { ten: 'Gửi SMS', ms: 60, batBuoc: false },
  { ten: 'Ghi analytics', ms: 30, batBuoc: false },
  { ten: 'Báo kho vận', ms: 40, batBuoc: false },
];

async function dongBo() {
  const t0 = performance.now();
  for (const v of CONG_VIEC) await ngu(v.ms);
  return performance.now() - t0;
}

async function batDongBo(queue) {
  const t0 = performance.now();
  for (const v of CONG_VIEC.filter((v) => v.batBuoc)) await ngu(v.ms);
  queue.publish({ loai: 'order.created', orderId: Math.random() }); // ~0ms
  return performance.now() - t0;
}

const qDemo = new MessageQueue();
const tDongBo = await dongBo();
const tBatDongBo = await batDongBo(qDemo);

console.log(`  Đồng bộ (làm hết 7 việc)     : ${tDongBo.toFixed(0)}ms`);
console.log(`  Bất đồng bộ (3 việc + queue) : ${tBatDongBo.toFixed(0)}ms`);
console.log(`  → User chờ ít hơn ${(tDongBo / tBatDongBo).toFixed(1)} lần.`);
console.log(`
  📌 Nhưng lợi ích LỚN HƠN không nằm ở tốc độ:
     Nếu SMTP server chết, phiên bản đồng bộ KHÔNG ĐẶT ĐƯỢC HÀNG.
     Phiên bản bất đồng bộ vẫn đặt hàng bình thường, email tự gửi lại sau.
     Bạn vừa tách "việc kiếm tiền" khỏi "việc phụ trợ".
`);

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 2 — At-least-once sinh ra TRÙNG LẶP. Idempotency chữa nó.
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — Worker chậm hơn visibility timeout → message bị giao lại       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

async function thuIdempotency({ idempotent }) {
  // visibility timeout 100ms nhưng có message xử lý mất tới 250ms
  // → queue tưởng worker chết → giao message cho worker khác → XỬ LÝ HAI LẦN
  const q = new MessageQueue({ visibilityTimeoutMs: 100, maxRetry: 5 });

  const SO_DON = 50;
  for (let i = 1; i <= SO_DON; i++) q.publish({ orderId: i, email: `kh${i}@shop.vn` });

  const emailDaGui = [];
  const daXuLy = new Set(); // ← "bảng idempotency"

  const guiEmail = async (msg) => {
    // 30% message gặp "SMTP chậm" → vượt visibility timeout
    const cham = Math.random() < 0.3;

    if (idempotent) {
      // Khoá idempotency dựa trên KHOÁ NGHIỆP VỤ (orderId), không phải messageId —
      // vì cùng một đơn hàng có thể sinh nhiều message.
      const khoa = `email:${msg.body.orderId}`;

      // ⚠️ CHI TIẾT SỐNG CÒN: phải GIÀNH khoá TRƯỚC KHI làm việc, không phải sau.
      // Nếu kiểm tra trước rồi mới `add` sau khi gửi xong, thì trong lúc worker 1
      // còn đang gửi (250ms), worker 2 nhận lại message và thấy khoá CHƯA có
      // → vẫn gửi trùng. Ở database thật, đây là INSERT ... ON CONFLICT DO NOTHING
      // chạy TRƯỚC khi gọi SMTP.
      if (daXuLy.has(khoa)) return; // đã có ai đó nhận việc này → bỏ qua
      daXuLy.add(khoa);

      await ngu(cham ? 250 : 20);
      emailDaGui.push(msg.body.orderId);
    } else {
      await ngu(cham ? 250 : 20);
      emailDaGui.push(msg.body.orderId);
    }
  };

  let xong = false;
  const workers = [1, 2, 3].map((i) =>
    chayWorker(q, guiEmail, { ten: `w${i}`, dungKhi: () => xong })
  );

  // Chờ tới khi queue rỗng
  const hetGio = Date.now() + 8000;
  while (q.conLai > 0 && Date.now() < hetGio) await ngu(20);
  xong = true;
  await Promise.all(workers);

  const dem = new Map();
  for (const id of emailDaGui) dem.set(id, (dem.get(id) ?? 0) + 1);
  const trung = [...dem.values()].filter((v) => v > 1).length;

  return {
    soDon: SO_DON,
    soEmailGui: emailDaGui.length,
    donBiGuiTrung: trung,
    soLanGiaoLai: q.thongKe.giaoLai,
  };
}

const khongIdem = await thuIdempotency({ idempotent: false });
const coIdem = await thuIdempotency({ idempotent: true });

console.log('  consumer            │ số đơn │ email đã gửi │ đơn bị gửi TRÙNG │ lần giao lại');
console.log('  ────────────────────┼────────┼──────────────┼──────────────────┼─────────────');
console.log(
  `  KHÔNG idempotent    │${String(khongIdem.soDon).padStart(7)} │${String(khongIdem.soEmailGui).padStart(13)} │` +
    `${String(khongIdem.donBiGuiTrung).padStart(17)} │${String(khongIdem.soLanGiaoLai).padStart(12)}  ❌`
);
console.log(
  `  CÓ idempotent       │${String(coIdem.soDon).padStart(7)} │${String(coIdem.soEmailGui).padStart(13)} │` +
    `${String(coIdem.donBiGuiTrung).padStart(17)} │${String(coIdem.soLanGiaoLai).padStart(12)}  ✅`
);

console.log(`
  📌 Cả hai đều bị giao lại message (đó là bản chất của at-least-once, không tránh được).
     Khác biệt nằm ở chỗ consumer có CHỊU ĐỰNG được việc bị giao lại hay không.

  📌 Với email trùng, khách hàng chỉ khó chịu. Nhưng cùng cơ chế đó với
     "trừ tiền" hay "trừ kho" thì là mất tiền thật.

  📌 Lưu ý cách chọn khoá idempotency: dùng KHOÁ NGHIỆP VỤ (orderId), không dùng messageId.
     Vì retry ở tầng ứng dụng có thể tạo message MỚI cho cùng một đơn hàng —
     lúc đó messageId khác nhau nhưng vẫn phải chống trùng.
`);

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 3 — Poison message và Dead Letter Queue
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Một message hỏng vĩnh viễn. Có DLQ và không có DLQ.           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

async function thuDLQ({ coDLQ }) {
  const q = new MessageQueue({
    visibilityTimeoutMs: 200,
    maxRetry: coDLQ ? 3 : 1e9, // không DLQ = retry vô hạn
    tenDLQ: coDLQ ? 'dlq' : null,
  });

  for (let i = 1; i <= 20; i++) q.publish({ orderId: i, hong: i === 7 }); // đơn #7 hỏng vĩnh viễn

  let daXong = 0;
  let soLanThuDon7 = 0;

  const xuLy = async (msg) => {
    await ngu(10);
    if (msg.body.hong) {
      soLanThuDon7++;
      throw new Error('Dữ liệu đơn #7 sai định dạng — sửa bao nhiêu lần cũng lỗi');
    }
    daXong++;
  };

  let dung = false;
  const w = chayWorker(q, xuLy, { dungKhi: () => dung });

  await ngu(2500);
  dung = true;
  await w;

  return { daXong, soLanThuDon7, conTrongQueue: q.conLai, vaoDLQ: q.thongKe.vaoDLQ };
}

const khongDLQ = await thuDLQ({ coDLQ: false });
const coDLQ = await thuDLQ({ coDLQ: true });

console.log('  cấu hình      │ đơn xử lý xong │ số lần thử đơn hỏng │ còn kẹt trong queue │ vào DLQ');
console.log('  ──────────────┼────────────────┼─────────────────────┼─────────────────────┼─────────');
console.log(
  `  KHÔNG có DLQ  │${String(khongDLQ.daXong).padStart(15)} │${String(khongDLQ.soLanThuDon7).padStart(20)} │` +
    `${String(khongDLQ.conTrongQueue).padStart(20)} │${String(khongDLQ.vaoDLQ).padStart(8)}  ❌`
);
console.log(
  `  CÓ DLQ        │${String(coDLQ.daXong).padStart(15)} │${String(coDLQ.soLanThuDon7).padStart(20)} │` +
    `${String(coDLQ.conTrongQueue).padStart(20)} │${String(coDLQ.vaoDLQ).padStart(8)}  ✅`
);

console.log(`
  📌 Không có DLQ: worker thử đơn hỏng ${khongDLQ.soLanThuDon7} lần và sẽ thử MÃI MÃI.
     Mỗi lần thử là một lần chiếm worker, chiếm CPU, chiếm connection.
     Ở production, một message hỏng có thể làm nghẽn cả queue có hàng triệu message tốt.

  📌 Có DLQ: sau ${coDLQ.soLanThuDon7} lần, message hỏng bị chuyển sang DLQ và queue chính tiếp tục chạy.
     Người vận hành xem DLQ, sửa dữ liệu, rồi đẩy lại.

  ⚠️ QUY TẮC VẬN HÀNH: DLQ có message = PHẢI CÓ CẢNH BÁO.
     Một DLQ im lặng chứa 40.000 message nghĩa là bạn đã mất dữ liệu suốt 3 tháng mà không biết.

📝 BÀI TẬP:
   a) Sửa visibilityTimeoutMs thành 500 (dài hơn thời gian xử lý chậm nhất).
      Số lần giao lại còn bao nhiêu? Vì sao ĐẶT DÀI KHÔNG PHẢI là giải pháp?
      (Gợi ý: worker chết thật thì message bị kẹt bao lâu?)
   b) Cài "transactional outbox": ghi message vào cùng "DB" với đơn hàng, một relay
      đọc và publish. Kiểm chứng: nếu queue chết lúc publish thì message có mất không?
   c) Cài Saga cho luồng: tạo đơn → trừ tiền → giữ hàng, với hành động bù trừ khi
      bước 3 thất bại. In ra trạng thái sau mỗi bước.
`);
