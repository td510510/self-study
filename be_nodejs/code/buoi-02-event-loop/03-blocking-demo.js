/**
 * Buổi 02 — Chặn Event Loop và trả giá.
 *
 * PHẦN QUAN TRỌNG NHẤT BUỔI HỌC.
 * Học viên phải tự tay cảm nhận hậu quả của việc chặn luồng duy nhất.
 *
 * Chạy:  node 03-blocking-demo.js
 *
 * Rồi mở HAI cửa sổ terminal, xem hướng dẫn ở cuối file.
 */

const http = require('http');
const crypto = require('crypto');

const PORT = 3000;

// Số vòng lặp băm — chỉnh xuống nếu máy chạy quá lâu, lên nếu quá nhanh.
// Mục tiêu: mỗi lần gọi mất khoảng 3–5 giây để cả lớp kịp quan sát.
// Tham chiếu: 2 triệu vòng ≈ 1.4s trên laptop đời 2023.
const ITERATIONS = 5_000_000;

http
  .createServer((req, res) => {
    if (req.url === '/nhanh') {
      res.end('nhanh: xong ngay\n');
      return;
    }

    if (req.url === '/chan') {
      console.log('[/chan] bắt đầu băm ĐỒNG BỘ — event loop bị giữ chặt...');
      // pbkdf2Sync là CPU-bound và ĐỒNG BỘ.
      // Nó giữ chặt luồng JavaScript duy nhất.
      // Trong lúc này Node KHÔNG thể trả lời bất kỳ ai khác.
      crypto.pbkdf2Sync('mat-khau', 'muoi', ITERATIONS, 64, 'sha512');
      console.log('[/chan] xong, event loop được giải phóng');
      res.end('chan: xong sau vai giay\n');
      return;
    }

    if (req.url === '/khong-chan') {
      console.log('[/khong-chan] đẩy việc sang thread pool, luồng JS rảnh ngay');
      // Bản BẤT ĐỒNG BỘ: libuv đẩy việc sang thread pool
      // (mặc định 4 luồng, đổi bằng biến môi trường UV_THREADPOOL_SIZE).
      // Luồng JavaScript được giải phóng NGAY LẬP TỨC.
      crypto.pbkdf2('mat-khau', 'muoi', ITERATIONS, 64, 'sha512', () => {
        console.log('[/khong-chan] xong');
        res.end('khong-chan: xong, nhung khong lam phien ai\n');
      });
      return;
    }

    res.statusCode = 404;
    res.end('not found\n');
  })
  .listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
    console.log('Endpoint: /nhanh  /chan  /khong-chan\n');
  });

/*
 * KỊCH BẢN THỰC HÀNH TẠI LỚP — mở hai cửa sổ terminal
 *
 * ── Vòng 1: phiên bản CHẶN ──────────────────────────────
 *
 *   Terminal 1:  time curl http://localhost:3000/chan
 *   Terminal 2:  time curl http://localhost:3000/nhanh    ← gọi NGAY LẬP TỨC
 *
 *   Kết quả: /nhanh phải CHỜ tới khi /chan xong mới được trả lời.
 *            Server đã "đơ" với TẤT CẢ người dùng khác.
 *
 * ── Vòng 2: phiên bản KHÔNG CHẶN ────────────────────────
 *
 *   Terminal 1:  time curl http://localhost:3000/khong-chan
 *   Terminal 2:  time curl http://localhost:3000/nhanh    ← trả lời TỨC THÌ
 *
 *
 * BÀI HỌC CỐT LÕI
 *
 *   Một request nặng làm chậm TOÀN BỘ người dùng khác.
 *   Đây là nguyên nhân gốc rễ của rất nhiều sự cố production,
 *   và cũng là lý do tồn tại của background job / queue (buổi 26).
 *
 *   Mọi hàm có hậu tố Sync trong Node đều là một quả mìn tiềm tàng:
 *     readFileSync, pbkdf2Sync, execSync, ...
 *
 *   QUY TẮC: chỉ dùng bản Sync lúc KHỞI ĐỘNG server.
 *            TUYỆT ĐỐI không dùng trong request handler.
 *
 *
 * BÀI TẬP MỞ RỘNG
 *
 *   Thread pool mặc định có 4 luồng. Thử:
 *     UV_THREADPOOL_SIZE=1 node 03-blocking-demo.js
 *   rồi gọi /khong-chan bốn lần cùng lúc. Mô tả và giải thích hiện tượng.
 */
