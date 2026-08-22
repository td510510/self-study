/**
 * Buổi 04 — Bước 1: server đơn giản nhất có thể.
 *
 * So sánh với echo-server.js ở buổi 01: module 'http' đã lo hộ ta
 * việc parse request line, parse header, và ghép response đúng chuẩn.
 *
 * Chạy:  node 01-hello-server.js
 */

const http = require('node:http');

const server = http.createServer((req, res) => {
  // req: IncomingMessage — là một Readable stream
  // res: ServerResponse  — là một Writable stream
  // Ở buổi 06 ta sẽ khai thác đúng bản chất stream này.

  console.log(`${req.method} ${req.url}`);

  res.end('Xin chào từ module http!\n');
});

server.listen(3000, () => {
  console.log('http://localhost:3000');
});

/*
 * CÂU HỎI HỎI LỚP
 *
 * So với echo-server.js buổi 01, module 'http' đã làm hộ ta những gì?
 *
 *   ✔ Parse request line  → cho ta req.method, req.url, req.httpVersion
 *   ✔ Parse toàn bộ header → cho ta req.headers (object thường)
 *   ✔ Tự thêm Content-Length hoặc Transfer-Encoding
 *   ✔ Tự thêm Date, Connection
 *   ✔ Quản lý keep-alive
 *
 * NHƯNG nó KHÔNG làm hộ:
 *   ✘ Routing            → buổi 05 ta tự viết
 *   ✘ Parse body         → buổi 05 ta tự viết
 *   ✘ Parse query string → hôm nay ta tự viết
 *   ✘ Xử lý lỗi tập trung → buổi 07
 *
 * Giữ danh sách này lại. Ở buổi 10 ta sẽ đối chiếu xem Express lo nốt cái nào.
 */
