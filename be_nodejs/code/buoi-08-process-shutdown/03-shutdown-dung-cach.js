/**
 * Buổi 08 — Bước 3: graceful shutdown ĐÚNG CÁCH.
 *
 * Chạy:  node 03-shutdown-dung-cach.js
 *
 * Kịch bản demo:
 *   Terminal 1:  node 03-shutdown-dung-cach.js
 *   Terminal 2:  curl http://localhost:3000/cham
 *   Terminal 1:  nhấn Ctrl+C NGAY khi thấy log "[bắt đầu]"
 *   → Server từ chối request MỚI, nhưng CHỜ request đang chạy xong rồi mới thoát.
 *   → Terminal 2 vẫn nhận được kết quả đầy đủ.
 */

import http from 'node:http';

const PORT = process.env.PORT || 3000;
const HAN_CHOT_MS = 10_000; // chờ tối đa 10 giây rồi ép thoát

let dangTat = false;
let soRequestDangChay = 0;
let demRequest = 0;

const server = http.createServer(async (req, res) => {
  // ── Khi đang tắt, từ chối request tới một cách tử tế ──────────
  // ⚠️ Nhánh này CHỈ chạy cho request đi trên kết nối keep-alive ĐÃ MỞ SẴN.
  //    Kết nối TCP MỚI sẽ bị từ chối ngay ở tầng hệ điều hành (ECONNREFUSED)
  //    vì server.close() đã đóng cổng lắng nghe — đã kiểm chứng bằng test.
  if (dangTat) {
    // 503 = "tạm thời không phục vụ được"
    // Connection: close để client không giữ kết nối lại
    res.writeHead(503, {
      'Content-Type': 'application/json; charset=utf-8',
      Connection: 'close',
    });
    res.end(JSON.stringify({ loi: 'Server đang tắt, thử lại sau' }));
    return;
  }

  soRequestDangChay++;

  try {
    if (req.url === '/cham') {
      const id = ++demRequest;
      console.log(`[bắt đầu] request #${id} — sẽ mất 5 giây`);
      await new Promise((r) => setTimeout(r, 5000));
      console.log(`[xong]    request #${id}`);
      res.end(`Request #${id} đã hoàn tất\n`);
      return;
    }

    res.end('ok\n');
  } finally {
    soRequestDangChay--;
  }
});

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════
async function tatTuTe(tinHieu) {
  // Nhấn Ctrl+C lần hai → thoát ngay, không chờ nữa.
  // Người vận hành phải luôn có "đường thoát hiểm".
  if (dangTat) {
    console.log('\n⚡ Nhận tín hiệu lần hai — thoát ngay lập tức');
    process.exit(1);
  }

  dangTat = true;
  console.log(`\n📥 Nhận ${tinHieu} — bắt đầu tắt tử tế`);
  console.log(`   Đang có ${soRequestDangChay} request chạy dở`);

  // Hẹn giờ ép thoát: không để việc tắt kéo dài vô tận.
  // Kubernetes/Docker cũng có hạn chót riêng (mặc định 30s) rồi SIGKILL.
  const hanChot = setTimeout(() => {
    console.error('⏰ Quá hạn chờ — ép thoát, có thể mất dữ liệu');
    process.exit(1);
  }, HAN_CHOT_MS);
  hanChot.unref(); // đừng vì cái timer này mà giữ tiến trình sống

  // BƯỚC 1: ngừng nhận kết nối MỚI.
  // ⚠️ server.close() KHÔNG cắt các request đang chạy — nó chỉ đóng cổng lắng nghe
  //    và chờ mọi kết nối hiện tại kết thúc.
  server.close(() => {
    console.log('✅ Server đã đóng, mọi request đã xong');
  });

  // BƯỚC 2: đóng các kết nối keep-alive đang RẢNH.
  // Không có bước này, server.close() sẽ chờ tới khi client tự ngắt —
  // với keep-alive có thể là hàng chục giây. Đây là lý do phổ biến nhất
  // khiến "graceful shutdown treo mãi không thoát".
  server.closeIdleConnections();

  // BƯỚC 3: chờ các request đang chạy hoàn tất
  while (soRequestDangChay > 0) {
    console.log(`   Chờ ${soRequestDangChay} request...`);
    await new Promise((r) => setTimeout(r, 500));
  }

  // BƯỚC 4: dọn dẹp tài nguyên khác.
  // Ở dự án thật: await db.disconnect(), await redis.quit(), await queue.close()
  console.log('🧹 Đã đóng kết nối database / redis / queue (giả lập)');

  clearTimeout(hanChot);
  console.log('👋 Thoát sạch sẽ\n');

  // process.exitCode thay vì process.exit():
  // để Node tự thoát khi hết việc, không cắt ngang I/O đang dở (ví dụ ghi log).
  process.exitCode = 0;
}

// SIGTERM: tín hiệu chuẩn khi deploy (Docker, Kubernetes, PM2 gửi cái này)
process.on('SIGTERM', () => tatTuTe('SIGTERM'));

// SIGINT: khi nhấn Ctrl+C trong terminal
process.on('SIGINT', () => tatTuTe('SIGINT'));

// ⚠️ CHỈ ĐỂ KIỂM THỬ TỰ ĐỘNG TRÊN WINDOWS
// Windows KHÔNG hỗ trợ gửi SIGINT/SIGTERM từ một tiến trình khác
// (child.kill() trên Windows giết tiến trình ngay, không qua handler).
// Khi chạy dưới dạng tiến trình con có kênh IPC, cho phép tiến trình cha
// yêu cầu tắt tử tế — nhờ vậy viết được test tự động.
// Trên Linux/macOS thì dùng SIGTERM như bình thường.
if (process.send) {
  process.on('message', (msg) => {
    // Phải disconnect sau khi tắt xong: kênh IPC là một handle đang mở,
    // nó GIỮ TIẾN TRÌNH SỐNG dù mọi việc khác đã xong.
    if (msg === 'shutdown') tatTuTe('IPC (kiểm thử)').then(() => process.disconnect());
  });
}

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
  console.log('Thử:  curl http://localhost:3000/cham');
  console.log('Rồi nhấn Ctrl+C ngay khi thấy "[bắt đầu]"\n');
});

/*
 * BỐN BƯỚC CỦA GRACEFUL SHUTDOWN
 *
 *   1. Đặt cờ "đang tắt" → request MỚI nhận 503
 *   2. server.close()                → ngừng nhận kết nối mới
 *      server.closeIdleConnections() → đóng keep-alive đang rảnh
 *   3. Chờ request đang chạy xong
 *   4. Đóng database / redis / queue, rồi thoát
 *
 * Kèm theo: hạn chót ép thoát, và cho phép nhấn Ctrl+C lần hai để thoát ngay.
 *
 *
 * AI NHẬN 503, AI NHẬN ECONNREFUSED?  (đã kiểm chứng bằng test)
 *
 *   Kết nối keep-alive ĐÃ MỞ SẴN  → nhận 503 + Connection: close
 *   Kết nối TCP MỚI                → ECONNREFUSED ngay ở tầng hệ điều hành,
 *                                    vì server.close() đã đóng cổng lắng nghe
 *
 * Vì sao vẫn cần nhánh 503? Vì trình duyệt và load balancer thường giữ sẵn
 * kết nối keep-alive. Với chúng, 503 + Connection: close là lời báo tử tế
 * "tôi sắp nghỉ, đừng gửi nữa" — thay vì cắt ngang giữa chừng.
 *
 * Ở production, load balancer nên được rút server ra khỏi danh sách TRƯỚC
 * khi gửi SIGTERM. Đó là lý do Kubernetes có preStop hook (buổi 42).
 *
 *
 * VÌ SAO process.exitCode THAY VÌ process.exit()?
 *
 *   process.exit(0)      → thoát NGAY, cắt ngang mọi I/O đang dở.
 *                          Dòng log cuối cùng có thể không kịp ghi ra đĩa.
 *   process.exitCode = 0 → đặt mã thoát, để Node tự thoát khi hết việc.
 *
 * Nhớ lại buổi 03: mã thoát là thứ CI/Docker/Kubernetes đọc để biết
 * chương trình kết thúc bình thường hay lỗi.
 */
