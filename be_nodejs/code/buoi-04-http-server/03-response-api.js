/**
 * Buổi 04 — Bước 3: ba cách viết response, và cái bẫy lớn nhất.
 *
 * Chạy:  node 03-response-api.js
 * Rồi thử từng endpoint bên dưới.
 */

const http = require('node:http');

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  // ── Cách 1: writeHead — gộp status + header trong một lệnh ──────
  if (pathname === '/cach-1') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Cách 1: writeHead\n');
    return;
  }

  // ── Cách 2: gán từng thuộc tính — linh hoạt hơn ─────────────────
  // Dùng khi cần set header rải rác ở nhiều nhánh code khác nhau.
  if (pathname === '/cach-2') {
    res.statusCode = 201;
    res.statusMessage = 'Created';
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('X-Powered-By', 'lop-hoc-backend');
    res.end('Cách 2: setHeader\n');
    return;
  }

  // ── Cách 3: ghi nhiều lần rồi mới kết thúc ──────────────────────
  // res là Writable stream — ghi được nhiều lần.
  if (pathname === '/cach-3') {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write('Dòng 1\n');
    res.write('Dòng 2\n');
    res.end('Dòng cuối\n'); // end() cũng ghi được dữ liệu
    return;
  }

  // ── CÁI BẪY: gửi header sau khi đã gửi body ─────────────────────
  if (pathname === '/loi-header') {
    res.write('Đã trót gửi dữ liệu rồi...\n');
    try {
      // Header đã bay đi cùng chunk đầu tiên. Không lấy lại được.
      res.setHeader('X-Qua-Muon', 'khong-the-set');
    } catch (err) {
      console.error('LỖI:', err.code); // ERR_HTTP_HEADERS_SENT
      res.end(`\nBắt được lỗi: ${err.code}\n`);
      return;
    }
    res.end();
    return;
  }

  // ── CÁI BẪY 2: gọi res.end() hai lần ────────────────────────────
  // ⚠️ GỌI ENDPOINT NÀY CUỐI CÙNG — NÓ LÀM SẬP CẢ SERVER.
  if (pathname === '/end-hai-lan') {
    res.end('Lần 1\n');
    // Lần 2 phát lỗi ERR_STREAM_WRITE_AFTER_END.
    // Lỗi này KHÔNG được bắt ở đâu cả → 'error' event không có listener
    // → Node ném uncaughtException → TOÀN BỘ TIẾN TRÌNH CHẾT.
    //
    // Hậu quả thật: mọi người dùng khác đang kết nối đều mất kết nối,
    // chỉ vì một request quên chữ `return`.
    res.end('Lần 2\n');
    return;
  }

  // ── Helper trả JSON — ta sẽ dùng lại suốt Phase 1 ───────────────
  if (pathname === '/json') {
    guiJson(res, 200, { thongDiep: 'Xin chào', thoiGian: new Date().toISOString() });
    return;
  }

  guiJson(res, 404, { loi: 'Không tìm thấy đường dẫn', duongDan: pathname });
});

/**
 * Gửi JSON đúng chuẩn: status, content-type, và encode UTF-8 chuẩn xác.
 * Đây là hàm ta sẽ tái sử dụng ở buổi 05 và Project 1.
 */
function guiJson(res, statusCode, duLieu) {
  const body = JSON.stringify(duLieu, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    // Nhớ bài học buổi 01: đếm BYTE, không đếm ký tự.
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

server.listen(3000, () => {
  console.log('http://localhost:3000\n');
  console.log('Thử lần lượt:');
  console.log('  curl -i http://localhost:3000/cach-1');
  console.log('  curl -i http://localhost:3000/cach-2');
  console.log('  curl -i http://localhost:3000/cach-3');
  console.log('  curl -i http://localhost:3000/json');
  console.log('  curl -i http://localhost:3000/loi-header');
  console.log('  curl -i http://localhost:3000/khong-co-gi');
  console.log('  curl -i http://localhost:3000/end-hai-lan   ← GỌI CUỐI, làm sập server\n');
});

/*
 * BÀI HỌC QUAN TRỌNG NHẤT BUỔI: LUÔN `return` SAU res.end()
 *
 * Sai:
 *   if (!user) { res.end('không thấy'); }     ← quên return
 *   res.end(JSON.stringify(user));            ← vẫn chạy tiếp!
 *
 * Đúng:
 *   if (!user) { res.end('không thấy'); return; }
 *
 *
 * HẬU QUẢ THẬT — đã kiểm chứng khi soạn bài:
 *
 *   Gọi /end-hai-lan → server in ra:
 *     Error [ERR_STREAM_WRITE_AFTER_END]: write after end
 *   rồi TOÀN BỘ TIẾN TRÌNH CHẾT.
 *
 *   Request tiếp theo (/khong-co-gi) không được trả lời — vì không còn
 *   server nào để trả lời nữa.
 *
 *   Một request quên chữ `return` → tất cả người dùng khác mất kết nối.
 *   Nhớ lại buổi 02: đơn luồng, một tiến trình phục vụ tất cả mọi người.
 *
 *   Ở buổi 08 ta học cách chặn kiểu sập này bằng graceful shutdown
 *   và bộ bắt lỗi cấp tiến trình.
 *
 * Ở Express (buổi 10) lỗi này VẪN CÒN NGUYÊN, chỉ khác thông báo.
 * Nó là một trong những bug phổ biến nhất của người mới học backend.
 */
