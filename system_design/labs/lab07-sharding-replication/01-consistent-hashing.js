/**
 * LAB 07.1 — ⭐ CONSISTENT HASHING: đo % dữ liệu phải di chuyển khi thêm/bớt shard
 *
 * Chạy:  node labs/lab07-sharding-replication/01-consistent-hashing.js
 */

import crypto from 'node:crypto';

const bam = (s) => crypto.createHash('md5').update(String(s)).digest().readUInt32BE(0);

// ══════════════════════════════════════════════════════════════════════════
// CÁCH 1 — Modulo đơn giản: hash(key) % N
// ══════════════════════════════════════════════════════════════════════════
class ShardModulo {
  constructor(soShard) {
    this.n = soShard;
  }
  timShard(key) {
    return `shard-${bam(key) % this.n}`;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// CÁCH 2 — Consistent Hashing với virtual node
// ══════════════════════════════════════════════════════════════════════════
class VongHash {
  /**
   * @param soVNode số vị trí ảo mỗi shard vật lý chiếm trên vòng.
   *                Càng nhiều → phân bố càng đều, nhưng tốn RAM và tìm chậm hơn chút.
   */
  constructor(shards = [], soVNode = 150) {
    this.soVNode = soVNode;
    this.vong = []; // [{ diem, shard }] sắp xếp tăng dần theo diem
    for (const s of shards) this.themShard(s);
  }

  themShard(ten) {
    for (let i = 0; i < this.soVNode; i++) {
      this.vong.push({ diem: bam(`${ten}#${i}`), shard: ten });
    }
    this.vong.sort((a, b) => a.diem - b.diem);
  }

  boShard(ten) {
    this.vong = this.vong.filter((v) => v.shard !== ten);
  }

  /** Tìm điểm đầu tiên trên vòng >= hash(key), theo chiều kim đồng hồ. */
  timShard(key) {
    if (!this.vong.length) return null;
    const h = bam(key);
    let lo = 0, hi = this.vong.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.vong[mid].diem < h) lo = mid + 1;
      else hi = mid;
    }
    // Vượt qua điểm cuối thì quay về đầu vòng — đây chính là chỗ "vòng tròn"
    return this.vong[lo % this.vong.length].shard;
  }
}

// ─── Dữ liệu thử ────────────────────────────────────────────────────────────
const SO_KEY = 100_000;
const KEYS = Array.from({ length: SO_KEY }, (_, i) => `user:${i}`);

function phanBo(router) {
  const dem = new Map();
  const gan = new Map();
  for (const k of KEYS) {
    const s = router.timShard(k);
    gan.set(k, s);
    dem.set(s, (dem.get(s) ?? 0) + 1);
  }
  return { dem, gan };
}

function tyLeDiChuyen(ganCu, ganMoi) {
  let chuyen = 0;
  for (const [k, s] of ganCu) if (ganMoi.get(k) !== s) chuyen++;
  return chuyen / ganCu.size;
}

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — Thêm 1 shard vào cụm 4 shard. Bao nhiêu % key phải di chuyển? ║
║ ${SO_KEY.toLocaleString('vi-VN')} key                                                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// -- Modulo
const modCu = phanBo(new ShardModulo(4));
const modMoi = phanBo(new ShardModulo(5));
const tlMod = tyLeDiChuyen(modCu.gan, modMoi.gan);

console.log('  cách phân shard                 │ % key phải di chuyển │ lý tưởng');
console.log('  ────────────────────────────────┼──────────────────────┼──────────');
console.log(`  hash % N (4 → 5 shard)          │${(tlMod * 100).toFixed(1).padStart(20)}% │   20.0%  ❌`);

// -- Consistent hashing với các mức vnode khác nhau
for (const vnode of [1, 10, 50, 150, 500]) {
  const ten4 = ['s0', 's1', 's2', 's3'];
  const cu = phanBo(new VongHash(ten4, vnode));
  const moi = phanBo(new VongHash([...ten4, 's4'], vnode));
  const tl = tyLeDiChuyen(cu.gan, moi.gan);
  console.log(
    `  consistent hash (vnode=${String(vnode).padEnd(3)})     │${(tl * 100).toFixed(1).padStart(20)}% │   20.0%  ✅`
  );
}

console.log(`
  📌 hash % N buộc phải di chuyển ~${(tlMod * 100).toFixed(0)}% dữ liệu chỉ để thêm MỘT shard.
     Với 8 TB dữ liệu, đó là ${(8 * tlMod).toFixed(1)} TB phải copy qua mạng — nhiều ngày downtime.

  📌 Consistent hashing chỉ di chuyển ~1/N (đúng phần dữ liệu mà shard mới nhận).
     Đây là lý do nó là nền tảng của DynamoDB, Cassandra, Riak, và cả Memcached client.
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — Virtual node ảnh hưởng thế nào tới ĐỘ ĐỀU của phân bố?        ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log('  vnode │ shard nhẹ nhất │ shard nặng nhất │ chênh lệch │ độ lệch chuẩn');
console.log('  ──────┼────────────────┼─────────────────┼────────────┼───────────────');
for (const vnode of [1, 5, 20, 100, 150, 500]) {
  const { dem } = phanBo(new VongHash(['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'], vnode));
  const v = [...dem.values()];
  const tb = v.reduce((a, b) => a + b) / v.length;
  const sd = Math.sqrt(v.reduce((s, x) => s + (x - tb) ** 2, 0) / v.length);
  const min = Math.min(...v), max = Math.max(...v);
  console.log(
    `  ${String(vnode).padStart(5)} │${min.toLocaleString('vi-VN').padStart(15)} │` +
      `${max.toLocaleString('vi-VN').padStart(16)} │${('×' + (max / min).toFixed(2)).padStart(11)} │` +
      `${sd.toFixed(0).padStart(14)}`
  );
}

console.log(`
  📌 Các điểm ngẫu nhiên trên vòng KHÔNG chia đều. Với vnode=1, shard "xui" nhận
     gấp HÀNG TRĂM LẦN shard "may" — hoàn toàn vô dụng trong thực tế.
     vnode >= 100 → chênh lệch còn khoảng 10-20%, chấp nhận được.
     Đây là lý do mọi hệ thống thật đều dùng hàng trăm vnode cho mỗi node vật lý.

  📌 Lợi ích thứ hai của vnode (quan trọng không kém): khi một shard CHẾT, tải của nó
     được chia đều cho TẤT CẢ shard còn lại, thay vì dồn hết vào shard kế tiếp
     (điều sẽ gây sập dây chuyền).
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Một shard CHẾT. Tải của nó đi đâu?                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

for (const vnode of [1, 150]) {
  const ten = ['s0', 's1', 's2', 's3'];
  const vongDay = new VongHash(ten, vnode);
  const truoc = phanBo(vongDay);

  const vongThieu = new VongHash(ten, vnode);
  vongThieu.boShard('s2');
  const sau = phanBo(vongThieu);

  console.log(`\n  ▌ vnode = ${vnode} — shard s2 chết (đang giữ ${truoc.dem.get('s2').toLocaleString('vi-VN')} key)`);
  for (const s of ten) {
    if (s === 's2') continue;
    const t = truoc.dem.get(s), sa = sau.dem.get(s);
    const them = sa - t;
    console.log(
      `     ${s}: ${t.toLocaleString('vi-VN').padStart(6)} → ${sa.toLocaleString('vi-VN').padStart(6)}  ` +
        `(+${them.toLocaleString('vi-VN')}, tăng ${((them / t) * 100).toFixed(0)}%)`
    );
  }
}

console.log(`
  📌 Với vnode=1, gần như TOÀN BỘ tải của s2 dồn vào MỘT shard kế tiếp.
     Shard đó vốn đã chạy 70% công suất → nay nhận thêm 100% tải → nó cũng chết
     → tải lại dồn sang shard tiếp theo → SẬP DÂY CHUYỀN (cascading failure).

  📌 Với vnode=150, tải được chia đều cho các shard còn lại (mỗi cái +~33%).
     Hệ thống có cơ hội sống sót. Đây là một trong những chi tiết nhỏ có ảnh hưởng lớn nhất
     tới độ tin cậy của hệ phân tán.

📝 BÀI TẬP:
   a) Thêm "trọng số": shard mạnh gấp đôi thì nhận gấp đôi vnode. Kiểm chứng phân bố.
   b) Cài "replication factor = 3": mỗi key lưu ở 3 shard LIÊN TIẾP trên vòng
      (đúng cách Cassandra làm). Viết hàm timNShard(key, 3).
   c) Vì sao consistent hashing KHÔNG giải quyết được bài toán "hot key"?
      (Gợi ý: hot key vẫn chỉ ánh xạ tới đúng một điểm trên vòng.)
`);
