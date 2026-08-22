/**
 * LAB 05.4 — Cache invalidation: vì sao XOÁ an toàn hơn CẬP NHẬT
 *
 * Chạy:  node labs/lab05-cache/04-invalidation.js
 *
 * Lab này tái hiện một race condition rất khó debug ở production.
 */

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

class DB {
  constructor() {
    this.data = new Map([['product:1', { id: 1, gia: 100 }]]);
  }
  async doc(key) {
    await ngu(20 + Math.random() * 30); // đọc mất 20-50ms
    return structuredClone(this.data.get(key));
  }
  async ghi(key, value) {
    await ngu(10 + Math.random() * 20);
    this.data.set(key, structuredClone(value));
  }
}

/**
 * Cache là Redis — nghĩa là một CHUYẾN ĐI MẠNG RIÊNG, có độ trễ riêng, biến thiên riêng.
 * Chính điều này khiến "thứ tự ghi DB" và "thứ tự ghi cache" có thể KHÁC NHAU.
 * Nếu bạn mô phỏng cache như một Map đồng bộ, race condition sẽ không bao giờ hiện ra —
 * và đó đúng là lý do bug này không tái hiện được trên máy dev.
 */
class Cache {
  constructor() {
    this.m = new Map();
  }
  async get(k) {
    await ngu(1 + Math.random() * 3);
    return this.m.get(k);
  }
  async set(k, v) {
    await ngu(1 + Math.random() * 25); // Redis thỉnh thoảng lag
    this.m.set(k, v);
  }
  async del(k) {
    await ngu(1 + Math.random() * 25);
    this.m.delete(k);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// KỊCH BẢN A — CẬP NHẬT cache sau khi ghi DB  (SAI)
// ══════════════════════════════════════════════════════════════════════════
async function ghiKieuCapNhat(db, cache, key, giaMoi) {
  await db.ghi(key, { id: 1, gia: giaMoi });
  await cache.set(key, { id: 1, gia: giaMoi }); // ← ghi ĐÈ vào cache
}

// ══════════════════════════════════════════════════════════════════════════
// KỊCH BẢN B — XOÁ cache sau khi ghi DB  (ĐÚNG hơn)
// ══════════════════════════════════════════════════════════════════════════
async function ghiKieuXoa(db, cache, key, giaMoi) {
  await db.ghi(key, { id: 1, gia: giaMoi });
  await cache.del(key); // ← lần đọc sau sẽ tự nạp lại từ DB
}

async function docCacheAside(db, cache, key) {
  const c = await cache.get(key);
  if (c) return c;
  const v = await db.doc(key);
  await cache.set(key, v);
  return v;
}

// ─── Chạy thử: 2 lần ghi song song ─────────────────────────────────────────
async function thu(kieuGhi, soLan = 200) {
  let sai = 0;
  for (let i = 0; i < soLan; i++) {
    const db = new DB();
    const cache = new Cache();
    await docCacheAside(db, cache, 'product:1'); // nạp cache ban đầu

    // Hai admin cùng sửa giá gần như đồng thời.
    // Ghi 1 bắt đầu trước, nhưng chậm hơn (mạng lag) → hoàn thành SAU.
    const w1 = (async () => {
      await ngu(0);
      return kieuGhi(db, cache, 'product:1', 200);
    })();
    const w2 = (async () => {
      await ngu(5);
      return kieuGhi(db, cache, 'product:1', 300);
    })();
    await Promise.all([w1, w2]);

    const trongDB = (await db.doc('product:1')).gia;
    const trongCache = (await docCacheAside(db, cache, 'product:1')).gia;
    if (trongDB !== trongCache) sai++;
  }
  return sai / soLan;
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ CACHE INVALIDATION — hai lần ghi song song                               ║
║ Sau khi cả hai xong, giá trị trong CACHE có khớp với DB không?           ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

const tyLeSaiCapNhat = await thu(ghiKieuCapNhat);
const tyLeSaiXoa = await thu(ghiKieuXoa);

console.log(`  Cách ghi                          │ tỉ lệ cache SAI so với DB`);
console.log(`  ──────────────────────────────────┼──────────────────────────`);
console.log(`  A. Ghi DB rồi CẬP NHẬT cache      │ ${(tyLeSaiCapNhat * 100).toFixed(1).padStart(9)}%  ${tyLeSaiCapNhat > 0.02 ? '❌' : ''}`);
console.log(`  B. Ghi DB rồi XOÁ cache           │ ${(tyLeSaiXoa * 100).toFixed(1).padStart(9)}%  ${tyLeSaiXoa < 0.02 ? '✅' : ''}`);

console.log(`
📌 VÌ SAO CÁCH A SAI?

   Trục thời gian của một lần chạy hỏng:

     Ghi-1: ─── ghi DB (gia=200) ────────────────► set cache = 200
     Ghi-2: ──────── ghi DB (gia=300) ──► set cache = 300
                                          ↑              ↑
                             DB cuối cùng = 200 hay 300? Tuỳ thứ tự ghi DB.
                             Cache cuối cùng = cái nào set SAU CÙNG.
                             HAI THỨ TỰ NÀY KHÔNG NHẤT THIẾT GIỐNG NHAU.

   → Cache có thể giữ giá 300 trong khi DB là 200. Và vì cache không hết hạn ngay,
     SAI LỆCH NÀY TỒN TẠI VĨNH VIỄN cho tới lần ghi tiếp theo. Đây là loại bug
     "không tái hiện được trên máy em" kinh điển.

📌 VÌ SAO CÁCH B ĐÚNG HƠN?

   Xoá là thao tác GIAO HOÁN (commutative): xoá 2 lần cũng như xoá 1 lần, thứ tự
   không quan trọng. Sau khi cả hai lần ghi xong, cache chắc chắn TRỐNG
   → lần đọc tiếp theo lấy đúng giá trị từ DB.

⚠️  NHƯNG CÁCH B VẪN CHƯA HOÀN HẢO. Race còn lại:

     Đọc :  cache MISS ──► đọc DB (được 100) ─────────────► set cache = 100
     Ghi :             ──► ghi DB (=200) ──► del cache
                                              ↑
                              Xoá xảy ra TRƯỚC khi lần đọc kịp set
                              → cache đọng lại giá trị CŨ 100.

   Xác suất thấp nhưng khác 0. Ba cách xử lý triệt để hơn:
     1. TTL ngắn làm lưới an toàn — sai lệch tự khỏi sau vài giây. (Đơn giản nhất, hiệu quả nhất.)
     2. Delayed double delete: xoá cache, ghi DB, chờ 500ms rồi XOÁ LẦN NỮA.
     3. Version key: đổi khoá thành product:1:v12 mỗi lần ghi. Không bao giờ ghi đè key cũ.
        (An toàn nhất, nhưng tốn RAM hơn vì key cũ nằm lại đến khi hết hạn.)

📝 BÀI TẬP:
   a) Cài "delayed double delete" và đo lại tỉ lệ sai.
   b) Cài "version key" — thêm bảng version trong DB, key cache là product:1:v{n}.
      Tỉ lệ sai là bao nhiêu? Cái giá phải trả là gì?
   c) Vì sao thêm TTL = 2 giây lại làm giảm hậu quả của MỌI race ở trên?
`);
