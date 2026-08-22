/**
 * LAB 07.2 — REPLICATION LAG: tái hiện lỗi "bình luận của tôi biến mất"
 *
 * Chạy:  node labs/lab07-sharding-replication/02-replication-lag.js
 */

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════
class Primary {
  constructor() {
    this.data = new Map();
    this.lsn = 0; // Log Sequence Number — vị trí trong WAL/binlog
    this.replicas = [];
  }

  async ghi(key, value) {
    await ngu(5);
    this.lsn++;
    this.data.set(key, { value, lsn: this.lsn });
    // Bất đồng bộ: KHÔNG chờ replica. Primary trả về ngay.
    for (const r of this.replicas) r.nhanBanGhi(key, value, this.lsn);
    return this.lsn;
  }

  async doc(key) {
    await ngu(5);
    return this.data.get(key)?.value ?? null;
  }
}

class Replica {
  constructor(ten, lagMs) {
    this.ten = ten;
    this.lagMs = lagMs;
    this.data = new Map();
    this.lsn = 0;
  }

  /** Bản ghi tới nơi SAU lagMs — đây chính là replication lag. */
  nhanBanGhi(key, value, lsn) {
    setTimeout(() => {
      this.data.set(key, { value, lsn });
      this.lsn = Math.max(this.lsn, lsn);
    }, this.lagMs);
  }

  async doc(key) {
    await ngu(5);
    return this.data.get(key)?.value ?? null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// Các chiến lược định tuyến ĐỌC
// ══════════════════════════════════════════════════════════════════════════

/** A. Luôn đọc từ replica (nhanh, rẻ, nhưng SAI). */
function chienLuocLuonReplica(primary, replicas) {
  let i = 0;
  return {
    ten: 'A. Luôn đọc replica',
    ghi: (uid, k, v) => primary.ghi(k, v),
    doc: (uid, k) => replicas[i++ % replicas.length].doc(k),
  };
}

/** B. Luôn đọc từ primary (đúng, nhưng mất hết lợi ích của replica). */
function chienLuocLuonPrimary(primary) {
  return {
    ten: 'B. Luôn đọc primary',
    ghi: (uid, k, v) => primary.ghi(k, v),
    doc: (uid, k) => primary.doc(k),
  };
}

/**
 * C. Sticky sau khi ghi: trong CUA_SO_MS giây sau khi user X ghi,
 * MỌI lần đọc CỦA CHÍNH user X đi vào primary. Các user khác vẫn đọc replica.
 * → Đây là giải pháp thực dụng nhất và được dùng nhiều nhất.
 */
function chienLuocStickySauGhi(primary, replicas, CUA_SO_MS = 500) {
  const vuaGhi = new Map(); // userId -> thời điểm ghi gần nhất
  let i = 0;
  return {
    ten: `C. Sticky primary ${CUA_SO_MS}ms sau ghi`,
    ghi: async (uid, k, v) => {
      const lsn = await primary.ghi(k, v);
      vuaGhi.set(uid, Date.now());
      return lsn;
    },
    doc: (uid, k) => {
      const t = vuaGhi.get(uid);
      if (t && Date.now() - t < CUA_SO_MS) return primary.doc(k);
      return replicas[i++ % replicas.length].doc(k);
    },
  };
}

/**
 * D. Đọc theo LSN: client nhớ LSN của lần ghi cuối, chỉ chấp nhận replica
 * đã bắt kịp LSN đó; nếu chưa thì rơi về primary.
 * → Chính xác nhất, nhưng client phải mang theo LSN (thường nhét vào cookie).
 */
function chienLuocTheoLSN(primary, replicas) {
  const lsnCuaUser = new Map();
  let i = 0;
  return {
    ten: 'D. Đọc theo LSN',
    ghi: async (uid, k, v) => {
      const lsn = await primary.ghi(k, v);
      lsnCuaUser.set(uid, lsn);
      return lsn;
    },
    doc: (uid, k) => {
      const can = lsnCuaUser.get(uid) ?? 0;
      const r = replicas[i++ % replicas.length];
      if (r.lsn >= can) return r.doc(k);
      return primary.doc(k); // replica chưa bắt kịp
    },
  };
}

// ─── Kịch bản thực tế: ít người GHI, rất nhiều người chỉ ĐỌC ───────────────
// (Tỉ lệ đọc:ghi = 10:1 — vẫn còn khiêm tốn so với hệ thống thật.)
async function thu(taoChienLuoc, soUser = 300, soNguoiChiDoc = 2700) {
  const primary = new Primary();
  const replicas = [new Replica('r1', 120), new Replica('r2', 250), new Replica('r3', 80)];
  primary.replicas = replicas;

  const cl = taoChienLuoc(primary, replicas);

  let matBinhLuan = 0;
  let docTuPrimary = 0;
  const primaryDocGoc = primary.doc.bind(primary);
  primary.doc = (k) => {
    docTuPrimary++;
    return primaryDocGoc(k);
  };

  const nguoiGhi = Array.from({ length: soUser }, async (_, i) => {
    const uid = `u${i}`;
    const key = `comment:${i}`;
    await cl.ghi(uid, key, `Bình luận của ${uid}`);
    await ngu(Math.random() * 100); // user bấm F5 sau 0-100ms
    const doc = await cl.doc(uid, key);
    if (doc === null) matBinhLuan++;
  });

  // Người chỉ đọc: họ không ghi gì cả, nên hoàn toàn có thể phục vụ bằng replica.
  const nguoiDoc = Array.from({ length: soNguoiChiDoc }, async (_, i) => {
    await ngu(Math.random() * 300);
    await cl.doc(`khach${i}`, `comment:${i % soUser}`);
  });

  await Promise.all([...nguoiGhi, ...nguoiDoc]);

  return {
    ten: cl.ten,
    tyLeMat: matBinhLuan / soUser,
    tyLeDocPrimary: docTuPrimary / (soUser + soNguoiChiDoc),
  };
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ REPLICATION LAG — 300 người ĐĂNG bình luận rồi F5 ngay + 2700 người CHỈ ĐỌC  ║
║ Replica lag: r1=120ms · r2=250ms · r3=80ms                                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const kq = [
  await thu(chienLuocLuonReplica),
  await thu(chienLuocLuonPrimary),
  await thu((p, r) => chienLuocStickySauGhi(p, r, 500)),
  await thu(chienLuocTheoLSN),
];

console.log('  chiến lược đọc                  │ % user MẤT bình luận │ % đọc phải vào primary');
console.log('  ────────────────────────────────┼──────────────────────┼───────────────────────');
for (const r of kq) {
  const bieuTuong = r.tyLeMat > 0.01 ? '❌' : '✅';
  console.log(
    `  ${r.ten.padEnd(31)} │${(r.tyLeMat * 100).toFixed(1).padStart(20)}% │` +
      `${(r.tyLeDocPrimary * 100).toFixed(0).padStart(21)}%  ${bieuTuong}`
  );
}

console.log(`
📌 PHÂN TÍCH

  A. Luôn đọc replica — ${(kq[0].tyLeMat * 100).toFixed(0)}% user không thấy bình luận vừa đăng.
     Đây KHÔNG phải bug hiếm. Nó xảy ra với mọi user bấm F5 nhanh hơn lag.
     Người dùng sẽ đăng lại → bạn có bình luận trùng lặp. Hoặc họ bỏ đi và nghĩ app hỏng.

  B. Luôn đọc primary — đúng 100%, nhưng ${(kq[1].tyLeDocPrimary * 100).toFixed(0)}% đọc vào primary.
     Nghĩa là bạn trả tiền cho 3 replica mà không dùng chúng. Vô nghĩa.

  C. Sticky sau ghi — đúng, và chỉ ${(kq[2].tyLeDocPrimary * 100).toFixed(0)}% đọc vào primary.
     Chỉ những người VỪA GHI mới phải vào primary; 2700 người chỉ đọc vẫn dùng replica.
     Ở hệ thống thật (đọc:ghi = 100:1 thay vì 10:1), tỉ lệ này còn thấp hơn nữa.
     👉 Đây là lựa chọn mặc định nên dùng.

  D. Đọc theo LSN — đúng, và tối ưu nhất về mặt lý thuyết: chỉ vào primary khi
     replica THỰC SỰ chưa bắt kịp, thay vì "cứ 500ms thì vào cho chắc".
     Cái giá: client/session phải mang theo LSN, và mọi tầng ở giữa phải truyền nó.

📌 ĐỪNG QUÊN: read-your-own-writes chỉ là MỘT trong nhiều đảm bảo bị vi phạm.
   Các loại khác cũng phải nghĩ tới:
     - Monotonic reads: đọc lần 2 thấy dữ liệu CŨ HƠN lần 1 (vì rơi vào replica lag khác).
       → Chữa bằng cách gắn mỗi user vào một replica cố định.
     - Consistent prefix: thấy câu trả lời trước khi thấy câu hỏi.
       → Hay gặp khi shard theo nhiều nơi. Buổi 10 sẽ nói tiếp.

📝 BÀI TẬP:
   a) Tăng lag của r2 lên 3000ms. Chiến lược C với cửa sổ 500ms có còn đúng không? Vì sao?
   b) Cài "monotonic reads": mỗi user luôn đọc từ CÙNG một replica (hash theo userId).
      Đo xem nó có làm giảm tỉ lệ mất bình luận không. (Gợi ý: không — vì sao?)
   c) Chuyện gì xảy ra nếu primary CHẾT ngay sau khi trả OK cho user, trước khi replica
      kịp nhận? Đây là lý do người ta dùng semi-synchronous replication.
`);
