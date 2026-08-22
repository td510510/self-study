/**
 * LAB 06.3 — N+1 query và connection pool exhaustion
 *
 * Chạy:  node labs/lab06-index-transaction/03-n-plus-1.js
 */

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// Độ trễ mạng một vòng tới database.
// Đặt 10ms (DB ở AZ khác, hoặc có TLS + pooler ở giữa) để đồng hồ hệ điều hành đo chính xác.
// Cùng datacenter thì RTT ~1,5ms — chia mọi con số dưới đây cho ~7 là ra.
const RTT_MS = 10;

class DB {
  constructor(poolSize = 10) {
    this.soQuery = 0;
    this.poolSize = poolSize;
    this.dangDung = 0;
    this.dinhDangDung = 0;
    this.tongThoiChoPoolMs = 0;
    this.hangDoi = [];

    this.users = new Map();
    for (let i = 1; i <= 1000; i++) this.users.set(i, { id: i, ten: `User ${i}` });
    this.orders = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      user_id: 1 + (i % 200),
      total: 1000 * (i + 1),
    }));
  }

  /** Mượn 1 connection từ pool; nếu hết thì xếp hàng chờ. */
  async muonConn() {
    const t0 = performance.now();
    while (this.dangDung >= this.poolSize) {
      await new Promise((r) => this.hangDoi.push(r));
    }
    this.tongThoiChoPoolMs += performance.now() - t0;
    this.dangDung++;
    this.dinhDangDung = Math.max(this.dinhDangDung, this.dangDung);
    return () => {
      this.dangDung--;
      this.hangDoi.shift()?.();
    };
  }

  async query(fn) {
    const traConn = await this.muonConn();
    try {
      this.soQuery++;
      await ngu(RTT_MS); // mỗi query = 1 vòng đi-về mạng
      return fn();
    } finally {
      traConn();
    }
  }

  layOrders(limit) {
    return this.query(() => this.orders.slice(0, limit));
  }
  layUser(id) {
    return this.query(() => this.users.get(id));
  }
  layUsers(ids) {
    return this.query(() => ids.map((i) => this.users.get(i)));
  }
}

// ══════════════════════════════════════════════════════════════════════════
// PHIÊN BẢN A — N+1 (kiểu ORM lazy loading viết ra)
// ══════════════════════════════════════════════════════════════════════════
async function kieuNPlus1(db, limit) {
  const orders = await db.layOrders(limit); // 1 query
  for (const o of orders) {
    o.user = await db.layUser(o.user_id); // N query, TUẦN TỰ
  }
  return orders;
}

// ══════════════════════════════════════════════════════════════════════════
// PHIÊN BẢN B — N+1 nhưng chạy song song (đỡ chậm, vẫn hại DB)
// ══════════════════════════════════════════════════════════════════════════
async function kieuNPlus1SongSong(db, limit) {
  const orders = await db.layOrders(limit);
  await Promise.all(orders.map(async (o) => (o.user = await db.layUser(o.user_id))));
  return orders;
}

// ══════════════════════════════════════════════════════════════════════════
// PHIÊN BẢN C — Batch loading: gom lại thành 2 query
// ══════════════════════════════════════════════════════════════════════════
async function kieuBatch(db, limit) {
  const orders = await db.layOrders(limit); // 1 query
  const ids = [...new Set(orders.map((o) => o.user_id))]; // khử trùng lặp!
  const users = await db.layUsers(ids); // 1 query
  const map = new Map(users.map((u) => [u.id, u]));
  for (const o of orders) o.user = map.get(o.user_id);
  return orders;
}

async function do_(ten, fn, limit, poolSize) {
  const db = new DB(poolSize);
  const t0 = performance.now();
  await fn(db, limit);
  return {
    ten,
    thoiGian: performance.now() - t0,
    soQuery: db.soQuery,
    dinhConn: db.dinhDangDung,
    choPool: db.tongThoiChoPoolMs,
  };
}

const LIMIT = 100;

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ N+1 QUERY — hiển thị ${LIMIT} đơn hàng kèm tên người mua                         ║
║ Mỗi query tốn ${RTT_MS}ms đi-về mạng · connection pool = 10                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const kq = [
  await do_('A. N+1 tuần tự (ORM lazy)', kieuNPlus1, LIMIT, 10),
  await do_('B. N+1 song song', kieuNPlus1SongSong, LIMIT, 10),
  await do_('C. Batch (2 query)', kieuBatch, LIMIT, 10),
];

console.log('  cách viết code              │ số query │ thời gian │ đỉnh conn │ tổng chờ pool');
console.log('  ───────────────────────────┼──────────┼───────────┼───────────┼──────────────');
for (const r of kq) {
  console.log(
    `  ${r.ten.padEnd(26)} │${String(r.soQuery).padStart(9)} │` +
      `${(r.thoiGian.toFixed(0) + 'ms').padStart(10)} │${String(r.dinhConn).padStart(10)} │` +
      `${(r.choPool.toFixed(0) + 'ms').padStart(13)}`
  );
}

console.log(`
📌 PHÂN TÍCH

  A. N+1 tuần tự: ${kq[0].soQuery} query, ${kq[0].thoiGian.toFixed(0)}ms.
     Đây là loại chậm KHÔNG thể chữa bằng index hay máy mạnh hơn — nó là chi phí
     ĐI LẠI, không phải chi phí tính toán. Công thức: latency ≈ N × RTT. Cùng datacenter (RTT 1,5ms) thì đây là ~150ms
     cho MỘT trang; DB ở vùng khác (RTT 40ms) thì thành 4 GIÂY. Đổi máy chủ mạnh hơn
     không giúp gì cả — bạn đang trả tiền cho 101 lần đi lại, không phải cho phép tính.

  B. N+1 song song: nhanh hơn (${kq[1].thoiGian.toFixed(0)}ms) nhưng VẪN ${kq[1].soQuery} query
     và dùng cạn cả ${kq[1].dinhConn} connection của pool, chờ pool ${kq[1].choPool.toFixed(0)}ms.
     ⚠️ Đây là cái bẫy nguy hiểm hơn A: nó có vẻ "đã tối ưu" trên máy dev (nơi chỉ có 1 user),
     nhưng ở production 100 user đồng thời × 100 query = 10.000 query cùng lúc → DB gục.
     Nói cách khác: A làm CHẬM 1 người, B làm SẬP cả hệ thống.

  C. Batch: ${kq[2].soQuery} query, ${kq[2].thoiGian.toFixed(0)}ms, chỉ ${kq[2].dinhConn} connection.
     Nhanh hơn A ${(kq[0].thoiGian / kq[2].thoiGian).toFixed(0)} lần và nhẹ hơn DB ${(kq[0].soQuery / kq[2].soQuery).toFixed(0)} lần.
     Lưu ý mẹo khử trùng lặp: 100 đơn nhưng chỉ có ~${new Set(new DB().orders.map((o) => o.user_id)).size} user khác nhau.

📌 CÁCH PHÁT HIỆN N+1 TRONG DỰ ÁN THẬT
   1. Bật log SQL ở môi trường dev. Nếu 1 request in ra hàng chục dòng SQL giống nhau → N+1.
   2. Đếm số query mỗi request và cảnh báo khi vượt ngưỡng (ví dụ > 20).
   3. Dùng eager loading của ORM: Prisma \`include\`, Sequelize \`include\`, TypeORM \`relations\`.
   4. Với GraphQL: BẮT BUỘC dùng DataLoader — nếu không, mỗi field resolver là một N+1.
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ CONNECTION POOL EXHAUSTION — pool nhỏ đi thì sao?                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
console.log('  pool size │ N+1 song song │ batch');
console.log('  ──────────┼───────────────┼───────');
for (const pool of [2, 5, 10, 50]) {
  const b = await do_('', kieuNPlus1SongSong, LIMIT, pool);
  const c = await do_('', kieuBatch, LIMIT, pool);
  console.log(
    `  ${String(pool).padStart(9)} │${(b.thoiGian.toFixed(0) + 'ms').padStart(14)} │${(c.thoiGian.toFixed(0) + 'ms').padStart(6)}`
  );
}

console.log(`
📌 Code viết theo kiểu batch gần như KHÔNG quan tâm pool lớn hay nhỏ.
   Code N+1 thì phụ thuộc hoàn toàn vào pool — và pool là tài nguyên DÙNG CHUNG
   của toàn bộ ứng dụng. Một endpoint viết ẩu có thể làm chậm TẤT CẢ endpoint khác.

   Đây là lý do buổi 09 sẽ nói về "bulkhead": chia pool riêng cho từng nhóm chức năng
   để một chỗ hỏng không kéo cả hệ thống xuống.

📝 BÀI TẬP:
   a) Sửa RTT_MS = 40 (database ở vùng khác). Chênh lệch A và C là bao nhiêu?
   b) Thêm phiên bản D: JOIN trong 1 query duy nhất. So với C thì hơn/kém ở đâu?
      (Gợi ý: JOIN trả về dữ liệu user bị lặp lại 100 lần → tốn băng thông.)
   c) Mô phỏng 50 request đồng thời, mỗi request chạy kiểu B. Chuyện gì xảy ra với pool?
`);
