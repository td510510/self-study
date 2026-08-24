const net = require('net');

const socket = net.createConnection({ host: 'example.com', port: 80 }, () => {
  console.log('--- Đã kết nối TCP. Bắt đầu gửi request thô ---\n');

  socket.write(
    'GET / HTTP/1.1\r\n' +
      'Host: example.com\r\n' +
      'User-Agent: lop-hoc-backend/1.0\r\n' +
      'Connection: close\r\n' +
      '\r\n'
  );
});

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