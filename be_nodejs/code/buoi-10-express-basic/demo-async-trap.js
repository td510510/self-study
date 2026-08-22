/**
 * Buổi 10 — Cái bẫy async của Express 4, chứng minh bằng thực nghiệm.
 *
 * Chạy:  node demo-async-trap.js
 *
 * So sánh Express 4 và Express 5 với CÙNG một handler async ném lỗi.
 */

import express4 from 'express4';
import express5 from 'express';

const CHO_TOI_DA = 1500;

// Ghi lại các unhandledRejection để quan sát, thay vì để chúng giết tiến trình.
// ⚠️ Ở PRODUCTION thì KHÔNG được nuốt như vậy (bài học buổi 07):
//    trên Node 15+, unhandledRejection mặc định làm SẬP TIẾN TRÌNH.
let soUnhandled = 0;
process.on('unhandledRejection', (err) => {
  soUnhandled++;
  console.log(`      ⚠️  unhandledRejection: "${err.message}"`);
});

/** Handler async ném lỗi — giống hệt nhau ở cả hai phiên bản. */
async function handlerNemLoi(req, res) {
  throw new Error('Lỗi trong handler async');
}

/** Cách sửa cho Express 4: bọc để chuyển lỗi sang next(). */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

function dungApp(express, dungAsyncHandler) {
  const app = express();
  app.get('/loi', dungAsyncHandler ? asyncHandler(handlerNemLoi) : handlerNemLoi);
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({ loi: 'Error middleware ĐÃ nhận được lỗi' });
  });
  return app;
}

async function thu(ten, app) {
  const truoc = soUnhandled;
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const cong = server.address().port;

  const batDau = Date.now();
  let ketQua;

  try {
    const res = await fetch(`http://localhost:${cong}/loi`, {
      signal: AbortSignal.timeout(CHO_TOI_DA),
    });
    ketQua = `HTTP ${res.status} — ${JSON.stringify(await res.json())}`;
  } catch (err) {
    ketQua = `❌ KHÔNG PHẢN HỒI sau ${Date.now() - batDau}ms — REQUEST TREO VĨNH VIỄN`;
  }

  server.close();
  await new Promise((r) => setTimeout(r, 50)); // chờ unhandledRejection kịp nổ

  console.log(`  ${ten}`);
  console.log(`      → ${ketQua}`);
  if (soUnhandled > truoc) {
    console.log('      → Ở production, đây là lúc TIẾN TRÌNH SẬP.');
  }
  console.log();
}

console.log('\nCùng một handler async ném lỗi, ba tình huống:\n');

await thu('① Express 4, KHÔNG bọc asyncHandler', dungApp(express4, false));
await thu('② Express 4, CÓ bọc asyncHandler', dungApp(express4, true));
await thu('③ Express 5, KHÔNG cần bọc', dungApp(express5, false));

console.log(`KẾT LUẬN

  Express 4 không hiểu Promise. Handler async ném lỗi → Promise bị reject
  mà Express không hề biết → request KHÔNG BAO GIỜ được trả lời,
  và Promise mồ côi đó gây unhandledRejection.

  Trên Node 15+, unhandledRejection mặc định LÀM SẬP TIẾN TRÌNH.
  Một request lỗi → toàn bộ người dùng khác mất kết nối (nhớ buổi 04).

  Express 5 tự bắt lỗi từ handler async và chuyển sang error middleware.

  → Dự án mới: dùng Express 5.
  → Dự án cũ đang chạy Express 4: BẮT BUỘC bọc mọi handler async bằng
    asyncHandler, hoặc cài gói 'express-async-errors'.
`);
