/**
 * LAB 02 — REST API bằng node:http thuần (không framework)
 *
 * Chạy:  node labs/lab02-http-api/server.js
 * Test:  node labs/lab02-http-api/client-test.js  (terminal khác)
 *
 * Cố tình KHÔNG dùng Express để bạn thấy rõ HTTP thực sự làm gì.
 */

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = 3002;

// ─── "Database" trong bộ nhớ ────────────────────────────────────────────────
const products = new Map();
for (let i = 1; i <= 57; i++) {
  products.set(i, {
    id: i,
    name: `Sản phẩm ${i}`,
    price: 10000 * i,
    updatedAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
  });
}
let nextId = 58;

// ─── Tiện ích ───────────────────────────────────────────────────────────────

/** Mọi response đều đi qua đây → đảm bảo format thống nhất. */
function send(res, status, body, headers = {}) {
  const payload = body === null ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Request-Id': res.requestId,
    ...headers,
  });
  res.end(payload);
}

/** Format lỗi thống nhất: code cho máy, message cho người, requestId để tra log. */
function sendError(res, status, code, message) {
  send(res, status, { error: { code, message, requestId: res.requestId } });
}

/** ETag = vân tay của nội dung. Client gửi lại If-None-Match → ta trả 304. */
function etagOf(obj) {
  return '"' + crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex').slice(0, 16) + '"';
}

/** Cursor mã hoá base64url của { lastId } — che chi tiết nội bộ khỏi client. */
const encodeCursor = (lastId) => Buffer.from(JSON.stringify({ lastId })).toString('base64url');
const decodeCursor = (c) => {
  try {
    return JSON.parse(Buffer.from(c, 'base64url').toString()).lastId ?? 0;
  } catch {
    return null; // cursor hỏng
  }
};

async function readJsonBody(req, limitBytes = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw Object.assign(new Error('too large'), { code: 'PAYLOAD_TOO_LARGE' });
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString());
}

// ─── Các handler ────────────────────────────────────────────────────────────

/** GET /v1/products?limit=20&cursor=... — phân trang bằng CURSOR, không dùng offset. */
function listProducts(req, res, url) {
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20) || 20, 100);
  const rawCursor = url.searchParams.get('cursor');

  let afterId = 0;
  if (rawCursor) {
    afterId = decodeCursor(rawCursor);
    if (afterId === null) return sendError(res, 400, 'INVALID_CURSOR', 'Cursor không hợp lệ');
  }

  const all = [...products.values()].sort((a, b) => a.id - b.id);
  const page = all.filter((p) => p.id > afterId).slice(0, limit);
  const last = page.at(-1);
  const hasMore = last ? all.some((p) => p.id > last.id) : false;

  send(res, 200, {
    data: page,
    // nextCursor = null nghĩa là hết dữ liệu — client biết khi nào dừng
    nextCursor: hasMore ? encodeCursor(last.id) : null,
  });
}

/** GET /v1/products/:id — có ETag để tiết kiệm băng thông. */
function getProduct(req, res, id) {
  const p = products.get(id);
  if (!p) return sendError(res, 404, 'PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm ${id}`);

  const etag = etagOf(p);
  // Client đã có đúng bản này rồi → 304, KHÔNG gửi lại body.
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, { ETag: etag, 'X-Request-Id': res.requestId });
    return res.end();
  }
  send(res, 200, p, { ETag: etag, 'Cache-Control': 'private, max-age=60' });
}

/** POST /v1/products — tạo mới, hỗ trợ Idempotency-Key chống tạo trùng khi client retry. */
const idempotencyStore = new Map(); // key -> response đã trả

async function createProduct(req, res) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendError(res, 400, 'INVALID_JSON', 'Body không phải JSON hợp lệ');
  }

  if (typeof body.name !== 'string' || !body.name.trim())
    return sendError(res, 400, 'VALIDATION_ERROR', 'Trường "name" là bắt buộc');
  if (typeof body.price !== 'number' || body.price < 0)
    return sendError(res, 400, 'VALIDATION_ERROR', 'Trường "price" phải là số >= 0');

  const idemKey = req.headers['idempotency-key'];
  if (idemKey && idempotencyStore.has(idemKey)) {
    // Đây chính là lý do buổi 08/09 nhắc đi nhắc lại về idempotency:
    // mạng lỗi → client retry → KHÔNG được tạo 2 sản phẩm.
    const cached = idempotencyStore.get(idemKey);
    return send(res, 200, cached, { 'X-Idempotent-Replay': 'true' });
  }

  const p = {
    id: nextId++,
    name: body.name.trim(),
    price: body.price,
    updatedAt: new Date().toISOString(),
  };
  products.set(p.id, p);
  if (idemKey) idempotencyStore.set(idemKey, p);

  send(res, 201, p, { Location: `/v1/products/${p.id}` });
}

/** PATCH /v1/products/:id — sửa một phần. */
async function patchProduct(req, res, id) {
  const p = products.get(id);
  if (!p) return sendError(res, 404, 'PRODUCT_NOT_FOUND', `Không tìm thấy sản phẩm ${id}`);

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendError(res, 400, 'INVALID_JSON', 'Body không phải JSON hợp lệ');
  }

  if (body.name !== undefined) p.name = String(body.name);
  if (body.price !== undefined) {
    if (typeof body.price !== 'number' || body.price < 0)
      return sendError(res, 400, 'VALIDATION_ERROR', '"price" phải là số >= 0');
    p.price = body.price;
  }
  p.updatedAt = new Date().toISOString();
  send(res, 200, p);
}

// TODO (bài tập về nhà): viết deleteProduct trả 204 khi xoá được, 404 khi không tồn tại.

/** GET /v1/events — Server-Sent Events: server chủ động đẩy dữ liệu về client. */
function streamEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Request-Id': res.requestId,
  });
  let n = 0;
  const timer = setInterval(() => {
    n++;
    res.write(`event: tick\ndata: ${JSON.stringify({ n, at: Date.now() })}\n\n`);
    if (n >= 5) {
      clearInterval(timer);
      res.end();
    }
  }, 500);
  req.on('close', () => clearInterval(timer));
}

// ─── Router ─────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // Mỗi request có 1 id duy nhất — xuyên suốt log, response, và cả các service khác (buổi 12).
  res.requestId = req.headers['x-request-id'] ?? 'req_' + crypto.randomUUID().slice(0, 8);
  const started = Date.now();

  res.on('finish', () => {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        requestId: res.requestId,
        method: req.method,
        path: req.url,
        status: res.statusCode,
        durationMs: Date.now() - started,
      })
    );
  });

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    if (path === '/v1/events' && req.method === 'GET') return streamEvents(req, res);

    if (path === '/v1/products') {
      if (req.method === 'GET') return listProducts(req, res, url);
      if (req.method === 'POST') return await createProduct(req, res);
      // 405 kèm Allow: nói cho client biết method nào hợp lệ.
      return sendError(res, 405, 'METHOD_NOT_ALLOWED', `${req.method} không được hỗ trợ`);
    }

    const m = path.match(/^\/v1\/products\/(\d+)$/);
    if (m) {
      const id = Number(m[1]);
      if (req.method === 'GET') return getProduct(req, res, id);
      if (req.method === 'PATCH') return await patchProduct(req, res, id);
      return sendError(res, 405, 'METHOD_NOT_ALLOWED', `${req.method} không được hỗ trợ`);
    }

    sendError(res, 404, 'ROUTE_NOT_FOUND', `Không có route ${req.method} ${path}`);
  } catch (err) {
    console.error({ requestId: res.requestId, err: err.message });
    // Không bao giờ lộ stack trace ra ngoài — chỉ trả requestId để tra log nội bộ.
    sendError(res, 500, 'INTERNAL_ERROR', 'Có lỗi phía server, vui lòng thử lại');
  }
});

server.listen(PORT, () => {
  console.log(`✅ API chạy tại http://localhost:${PORT}`);
  console.log(`   Thử: curl -i http://localhost:${PORT}/v1/products?limit=3`);
});
