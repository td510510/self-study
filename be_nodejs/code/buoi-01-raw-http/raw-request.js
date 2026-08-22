/**
 * Buổi 01 — Gửi một HTTP request bằng tay, qua TCP thuần.
 *
 * Không dùng axios, không dùng fetch, không dùng cả module 'http'.
 * Chỉ mở một đường ống TCP và tự viết giao thức HTTP bằng tay.
 *
 * Chạy:  node raw-request.js
 */

const net = require('net');

const socket = net.createConnection({ host: 'example.com', port: 80 }, () => {
  console.log('--- Đã kết nối TCP. Bắt đầu gửi request thô ---\n');

  // \r\n là bắt buộc theo chuẩn HTTP, KHÔNG phải \n.
  // Dòng trống cuối cùng ('\r\n' thứ hai) báo hiệu "hết phần header".
  socket.write(
    'GET / HTTP/1.1\r\n' +
      'Host: example.com\r\n' +
      'User-Agent: lop-hoc-backend/1.0\r\n' +
      'Connection: close\r\n' +
      '\r\n'
  );
});

// Dữ liệu về theo từng mẩu (chunk), KHÔNG về một lần.
// Sự kiện này có thể chạy nhiều lần — đó chính là stream (buổi 06).
let chunkCount = 0;
socket.on('data', (chunk) => {
  chunkCount++;
  process.stdout.write(chunk.toString('utf8'));
});

socket.on('end', () => {
  console.log(`\n\n--- Server đã đóng kết nối (nhận được ${chunkCount} chunk) ---`);
});

socket.on('error', (err) => {
  console.error('Lỗi kết nối:', err.message);
  process.exit(1);
});

/*
 * BÀI TẬP TẠI LỚP
 *
 * 1. Đổi 'GET / HTTP/1.1' thành 'GET /khong-ton-tai HTTP/1.1'
 *    → quan sát status đổi thành 404.
 *    404 do SERVER quyết định, không phải hiện tượng tự nhiên.
 *
 * 2. Xoá dòng 'Host: example.com\r\n'
 *    → server trả 400 Bad Request.
 *    HTTP/1.1 bắt buộc có Host để biết bạn hỏi website nào trên cùng một IP.
 *
 * 3. Đổi 'Connection: close' thành 'Connection: keep-alive'
 *    → chương trình treo, không thoát. Vì sao?
 */
