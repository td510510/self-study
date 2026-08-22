/**
 * LAB 02 — Bộ kiểm thử API. Chạy SAU khi đã bật server.js
 *
 *   node labs/lab02-http-api/server.js        # terminal 1
 *   node labs/lab02-http-api/client-test.js   # terminal 2
 */

const BASE = 'http://localhost:3002';

let pass = 0;
let fail = 0;

async function test(ten, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✅ ${ten}`);
  } catch (e) {
    fail++;
    console.log(`  ❌ ${ten}\n     → ${e.message}`);
  }
}

function assert(dieuKien, moTa) {
  if (!dieuKien) throw new Error(moTa);
}

async function main() {
  console.log('\n🧪 KIỂM THỬ API\n' + '─'.repeat(60));

  console.log('\n[Nhóm 1] Status code đúng ngữ nghĩa');

  await test('GET danh sách trả 200', async () => {
    const r = await fetch(`${BASE}/v1/products?limit=3`);
    assert(r.status === 200, `nhận ${r.status}`);
    const b = await r.json();
    assert(Array.isArray(b.data) && b.data.length === 3, 'phải trả đúng 3 phần tử');
  });

  await test('GET id không tồn tại trả 404 (không phải 200 hay 500)', async () => {
    const r = await fetch(`${BASE}/v1/products/999999`);
    assert(r.status === 404, `nhận ${r.status}`);
    const b = await r.json();
    assert(b.error?.code === 'PRODUCT_NOT_FOUND', 'thiếu error.code');
  });

  await test('POST thiếu field bắt buộc trả 400 (lỗi client, không phải 500)', async () => {
    const r = await fetch(`${BASE}/v1/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 100 }),
    });
    assert(r.status === 400, `nhận ${r.status}`);
  });

  await test('POST hợp lệ trả 201 + header Location', async () => {
    const r = await fetch(`${BASE}/v1/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bàn phím cơ', price: 1_200_000 }),
    });
    assert(r.status === 201, `nhận ${r.status}`);
    assert(r.headers.get('location')?.startsWith('/v1/products/'), 'thiếu header Location');
  });

  await test('Method sai trả 405', async () => {
    const r = await fetch(`${BASE}/v1/products`, { method: 'PUT' });
    assert(r.status === 405, `nhận ${r.status}`);
  });

  console.log('\n[Nhóm 2] Phân trang bằng cursor');

  await test('Duyệt hết 57+ sản phẩm bằng cursor, không trùng, không sót', async () => {
    const thay = new Set();
    let cursor = null;
    let vong = 0;
    do {
      const u = new URL(`${BASE}/v1/products`);
      u.searchParams.set('limit', '10');
      if (cursor) u.searchParams.set('cursor', cursor);
      const b = await (await fetch(u)).json();
      for (const p of b.data) {
        assert(!thay.has(p.id), `id ${p.id} bị trả 2 lần`);
        thay.add(p.id);
      }
      cursor = b.nextCursor;
      assert(++vong < 50, 'vòng lặp không kết thúc — nextCursor không bao giờ null?');
    } while (cursor);
    assert(thay.size >= 57, `chỉ duyệt được ${thay.size} sản phẩm`);
  });

  await test('Cursor hỏng trả 400 chứ không phải 500', async () => {
    const r = await fetch(`${BASE}/v1/products?cursor=@@@rac@@@`);
    assert(r.status === 400, `nhận ${r.status}`);
  });

  console.log('\n[Nhóm 3] Cache bằng ETag');

  await test('Gửi lại If-None-Match nhận 304 và body rỗng', async () => {
    const r1 = await fetch(`${BASE}/v1/products/5`);
    const etag = r1.headers.get('etag');
    assert(etag, 'response đầu tiên thiếu header ETag');

    const r2 = await fetch(`${BASE}/v1/products/5`, { headers: { 'If-None-Match': etag } });
    assert(r2.status === 304, `nhận ${r2.status}, mong đợi 304`);
    const text = await r2.text();
    assert(text === '', '304 không được có body');
  });

  await test('Sửa dữ liệu → ETag phải đổi', async () => {
    const etagCu = (await fetch(`${BASE}/v1/products/6`)).headers.get('etag');
    await fetch(`${BASE}/v1/products/6`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: 777 }),
    });
    const etagMoi = (await fetch(`${BASE}/v1/products/6`)).headers.get('etag');
    assert(etagCu !== etagMoi, 'ETag không đổi sau khi sửa → client sẽ thấy dữ liệu cũ mãi mãi');
  });

  console.log('\n[Nhóm 4] Idempotency — retry không tạo bản ghi trùng');

  await test('Gọi POST 3 lần cùng Idempotency-Key chỉ tạo 1 sản phẩm', async () => {
    const key = 'lab02-' + Math.random().toString(36).slice(2);
    const goi = () =>
      fetch(`${BASE}/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
        body: JSON.stringify({ name: 'Chuột không dây', price: 350_000 }),
      }).then((r) => r.json());

    const [a, b, c] = [await goi(), await goi(), await goi()];
    assert(a.id === b.id && b.id === c.id, `tạo ra 3 id khác nhau: ${a.id}, ${b.id}, ${c.id}`);
  });

  console.log('\n[Nhóm 5] Truy vết');

  await test('Mọi response đều có X-Request-Id', async () => {
    const r = await fetch(`${BASE}/v1/products/1`);
    assert(r.headers.get('x-request-id'), 'thiếu X-Request-Id → không tra được log');
  });

  console.log('\n[Nhóm 6] SSE — server đẩy dữ liệu');

  await test('Nhận được >= 3 event từ /v1/events', async () => {
    const r = await fetch(`${BASE}/v1/events`);
    const text = await r.text();
    const soEvent = (text.match(/event: tick/g) ?? []).length;
    assert(soEvent >= 3, `chỉ nhận ${soEvent} event`);
  });

  console.log('\n' + '═'.repeat(60));
  console.log(`KẾT QUẢ: ${pass} pass · ${fail} fail`);
  console.log('═'.repeat(60));
  if (fail === 0) {
    console.log('🎉 API đạt chuẩn. Giờ làm bài tập: thêm DELETE /v1/products/:id');
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('\n💥 Không kết nối được server. Bạn đã chạy `node labs/lab02-http-api/server.js` chưa?');
  console.error('  ', e.message);
  process.exit(1);
});
