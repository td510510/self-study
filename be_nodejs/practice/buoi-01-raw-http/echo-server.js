const net = require('net');

const PORT = 3000;

const server = net.createServer((socket) => {
  socket.on('data', (chunk) => {
    console.log('===== TRÌNH DUYỆT GỬI TỚI =====');
    console.log(chunk.toString('utf8'));
    console.log('===============================\n');

    const body = 'Xin chào từ TCP server thuần!';

    // Tự tay viết HTTP response. Đúng 4 phần đã học:
    // status line → headers → dòng trống → body
    socket.write('HTTP/1.1 200 OK\r\n');
    socket.write('Content-Type: text/plain; charset=utf-8\r\n');

    // QUAN TRỌNG: đếm BYTE, không đếm ký tự.
    // Thử đổi thành body.length để thấy trình duyệt cắt cụt nội dung tiếng Việt.
    socket.write('Content-Length: ' + Buffer.byteLength(body) + '\r\n');

    socket.write('Connection: close\r\n');
    socket.write('\r\n'); // dòng trống: hết header, bắt đầu body
    socket.write(body);
    socket.end();
  });

  socket.on('error', (err) => {
    console.error('Lỗi socket:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Mở http://localhost:${PORT} trong trình duyệt`);
  console.log('Nhấn Ctrl+C để dừng\n');
});