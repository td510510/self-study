/**
 * Buổi 04 — Bước 2: mổ xẻ object `req`.
 *
 * Xem module 'http' đã bóc tách đoạn văn bản HTTP thô thành những gì.
 *
 * Chạy:  node 02-request-anatomy.js
 * Rồi:   curl "http://localhost:3000/san-pham?trang=2&sap-xep=gia&sap-xep=ten"
 */

const http = require('node:http');

const server = http.createServer((req, res) => {
  // `req.url` CHỈ có path + query, KHÔNG có protocol và host.
  // Muốn dùng class URL (giống hệt bên browser), phải ghép thêm base.
  const url = new URL(req.url, `http://${req.headers.host}`);

  const thongTin = {
    method: req.method,
    urlThô: req.url,

    pathname: url.pathname,

    // searchParams là URLSearchParams — API giống hệt bên browser
    query: Object.fromEntries(url.searchParams),

    // Với tham số lặp lại (?sap-xep=gia&sap-xep=ten), Object.fromEntries
    // chỉ giữ giá trị CUỐI. Muốn lấy hết phải dùng getAll:
    queryLặp: url.searchParams.getAll('sap-xep'),

    // Header luôn được chuyển thành CHỮ THƯỜNG hết.
    // Vì theo chuẩn HTTP, tên header không phân biệt hoa thường.
    headers: req.headers,

    httpVersion: req.httpVersion,
    ipClient: req.socket.remoteAddress,
  };

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(thongTin, null, 2));
});

server.listen(3000, () => {
  console.log('http://localhost:3000');
  console.log('Thử:  curl "http://localhost:3000/san-pham?trang=2&sap-xep=gia&sap-xep=ten"\n');
});

/*
 * BA ĐIỂM DỄ SAI, PHẢI NHẤN MẠNH
 *
 * 1. req.url KHÔNG phải URL đầy đủ.
 *    Nó chỉ là "/san-pham?trang=2". Không có http://, không có host.
 *    Vì trong HTTP/1.1, host nằm ở header Host riêng (nhớ lại buổi 01).
 *
 * 2. req.headers luôn viết THƯỜNG.
 *    Client gửi "Content-Type" → ta đọc req.headers['content-type'].
 *    Viết req.headers['Content-Type'] sẽ ra undefined. Lỗi kinh điển.
 *
 * 3. Tham số query lặp lại cần getAll().
 *    ?tag=a&tag=b  → searchParams.get('tag') chỉ trả 'a'
 *                  → searchParams.getAll('tag') trả ['a', 'b']
 */
