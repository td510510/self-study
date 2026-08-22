/**
 * Buổi 08 — Bước 2: tắt server kiểu NGÂY THƠ.
 *
 * Đây là cách 100% người mới làm: không làm gì cả.
 * Nhấn Ctrl+C → Node giết tiến trình NGAY LẬP TỨC.
 *
 * Chạy:  node 02-shutdown-ngay-tho.js
 *
 * Kịch bản demo:
 *   Terminal 1:  node 02-shutdown-ngay-tho.js
 *   Terminal 2:  curl http://localhost:3000/cham
 *   Terminal 1:  nhấn Ctrl+C NGAY khi thấy log "[bắt đầu]"
 *   → Terminal 2 nhận lỗi "Empty reply from server". Request bị cắt giữa chừng.
 */

import http from 'node:http';

let dangXuLy = 0;

const server = http.createServer(async (req, res) => {
  if (req.url === '/cham') {
    dangXuLy++;
    const id = dangXuLy;
    console.log(`[bắt đầu] request #${id} — sẽ mất 5 giây`);

    // Giả lập một việc quan trọng: ghi đơn hàng vào database
    await new Promise((r) => setTimeout(r, 5000));

    console.log(`[xong]    request #${id}`);
    res.end(`Request #${id} đã hoàn tất\n`);
    return;
  }

  res.end('ok\n');
});

server.listen(3000, () => {
  console.log('http://localhost:3000');
  console.log('Thử:  curl http://localhost:3000/cham');
  console.log('Rồi nhấn Ctrl+C ngay khi thấy "[bắt đầu]"\n');
});

/*
 * ĐIỀU GÌ XẢY RA KHI NHẤN Ctrl+C?
 *
 *   1. Terminal gửi tín hiệu SIGINT tới tiến trình
 *   2. Node KHÔNG có bộ xử lý nào cho SIGINT
 *   3. Hành vi mặc định: CHẾT NGAY LẬP TỨC
 *   4. Request đang xử lý dở → bị cắt ngang, client nhận lỗi kết nối
 *
 *
 * HẬU QUẢ THẬT Ở PRODUCTION
 *
 * Mỗi lần deploy, hệ thống gửi SIGTERM để tắt bản cũ.
 * Nếu không xử lý tín hiệu:
 *
 *   - Đơn hàng đang ghi dở → mất
 *   - Transaction database không commit cũng không rollback
 *   - File đang ghi → hỏng (nhớ bài 01: writeFile cắt cụt file trước khi ghi)
 *   - Người dùng thấy lỗi 502 Bad Gateway
 *
 * Deploy mỗi ngày × 100 người đang dùng = mỗi ngày vài chục người gặp lỗi.
 *
 * → Bài 03 sửa việc này.
 */
