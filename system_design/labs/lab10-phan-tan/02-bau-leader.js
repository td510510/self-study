/**
 * LAB 10.2 — Bầu leader kiểu Raft + phân vùng mạng (split-brain)
 *
 * Chạy:  node labs/lab10-phan-tan/02-bau-leader.js
 *
 * Cài đơn giản hoá: chỉ có leader election, không có log replication.
 * Nhưng đủ để thấy VÌ SAO quorum ngăn được split-brain.
 */

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

class Cum {
  constructor(soNode) {
    this.nodes = Array.from({ length: soNode }, (_, i) => new RaftNode(`n${i}`, this));
    this.phanVung = null; // ví dụ [['n0','n1','n2'], ['n3','n4']]
    this.nhatKy = [];
  }

  /** Hai node liên lạc được với nhau không? */
  lienLacDuoc(a, b) {
    if (!this.phanVung) return true;
    return this.phanVung.some((p) => p.includes(a) && p.includes(b));
  }

  node(ten) {
    return this.nodes.find((n) => n.ten === ten);
  }

  log(s) {
    this.nhatKy.push(s);
  }

  get leaders() {
    return this.nodes.filter((n) => n.vaiTro === 'LEADER');
  }
}

class RaftNode {
  constructor(ten, cum) {
    this.ten = ten;
    this.cum = cum;
    this.vaiTro = 'FOLLOWER';
    this.term = 0;
    this.daBauCho = null;      // trong term hiện tại đã bỏ phiếu cho ai
    this.nhanHeartbeatLuc = Date.now();
    // ĐIỂM MẤU CHỐT: timeout NGẪU NHIÊN. Nếu mọi node cùng timeout thì
    // mọi node cùng ứng cử, phiếu bị chia đều, không ai đủ đa số → bầu lại vô tận.
    this.electionTimeoutMs = 150 + Math.random() * 150;
  }

  get soNodeCanDeThang() {
    return Math.floor(this.cum.nodes.length / 2) + 1; // ĐA SỐ TUYỆT ĐỐI
  }

  /** Nhận yêu cầu bỏ phiếu từ một ứng viên. */
  xuLyXinPhieu({ tuAi, term }) {
    if (!this.cum.lienLacDuoc(this.ten, tuAi)) return { chapNhan: false, term: this.term };

    if (term > this.term) {
      // Thấy term cao hơn → lùi về làm follower ngay (quy tắc quan trọng nhất của Raft)
      this.term = term;
      this.vaiTro = 'FOLLOWER';
      this.daBauCho = null;
    }
    if (term < this.term) return { chapNhan: false, term: this.term };
    if (this.daBauCho !== null && this.daBauCho !== tuAi) return { chapNhan: false, term: this.term };

    this.daBauCho = tuAi;
    this.nhanHeartbeatLuc = Date.now();
    return { chapNhan: true, term: this.term };
  }

  async ungCu() {
    this.vaiTro = 'CANDIDATE';
    this.term++;
    this.daBauCho = this.ten;
    let phieu = 1; // tự bầu cho mình

    this.cum.log(`  ${this.ten} ứng cử ở term ${this.term}`);

    for (const n of this.cum.nodes) {
      if (n === this) continue;
      const kq = n.xuLyXinPhieu({ tuAi: this.ten, term: this.term });
      if (kq.chapNhan) phieu++;
      if (kq.term > this.term) {
        this.term = kq.term;
        this.vaiTro = 'FOLLOWER';
        this.cum.log(`  ${this.ten} thấy term cao hơn → lùi về FOLLOWER`);
        return;
      }
    }

    if (phieu >= this.soNodeCanDeThang) {
      this.vaiTro = 'LEADER';
      this.cum.log(`  ✅ ${this.ten} THẮNG với ${phieu}/${this.cum.nodes.length} phiếu (cần ${this.soNodeCanDeThang}) → LEADER term ${this.term}`);
      this.guiHeartbeat();
    } else {
      this.vaiTro = 'FOLLOWER';
      this.cum.log(`  ❌ ${this.ten} chỉ được ${phieu}/${this.cum.nodes.length} phiếu (cần ${this.soNodeCanDeThang}) → KHÔNG đủ đa số`);
    }
  }

  guiHeartbeat() {
    for (const n of this.cum.nodes) {
      if (n === this) continue;
      if (!this.cum.lienLacDuoc(this.ten, n.ten)) continue;
      if (n.term <= this.term) {
        n.term = this.term;
        n.vaiTro = 'FOLLOWER';
        n.nhanHeartbeatLuc = Date.now();
      }
    }
  }
}

function inTrangThai(cum, nhan) {
  const s = cum.nodes.map((n) => `${n.ten}:${n.vaiTro[0]}${n.term}`).join('  ');
  console.log(`  ${nhan.padEnd(24)} ${s}`);
}

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — Bầu leader bình thường (cụm 5 node)                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const cum = new Cum(5);
inTrangThai(cum, 'Ban đầu:');

// Node nào có election timeout ngắn nhất sẽ ứng cử trước
const dauTien = [...cum.nodes].sort((a, b) => a.electionTimeoutMs - b.electionTimeoutMs)[0];
console.log(`\n  (${dauTien.ten} có election timeout ngắn nhất: ${dauTien.electionTimeoutMs.toFixed(0)}ms)\n`);
await dauTien.ungCu();
console.log(cum.nhatKy.join('\n'));
cum.nhatKy = [];
console.log('');
inTrangThai(cum, 'Sau bầu cử:');
console.log(`\n  → ${cum.leaders.length} leader. Đúng như mong đợi.`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — ĐỨT MẠNG chia cụm 5 node thành 3 + 2 (split-brain?)          ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const cum2 = new Cum(5);
await cum2.nodes[0].ungCu(); // n0 làm leader
cum2.nhatKy = [];
inTrangThai(cum2, 'Trước khi đứt mạng:');

// Đứt cáp: [n0, n1] một bên, [n2, n3, n4] bên kia. Leader cũ n0 nằm ở phía THIỂU SỐ.
cum2.phanVung = [['n0', 'n1'], ['n2', 'n3', 'n4']];
console.log(`\n  ✂️  ĐỨT MẠNG: phía A = [n0(leader), n1]   |   phía B = [n2, n3, n4]\n`);

// Phía B không nghe heartbeat → n2 ứng cử
await cum2.node('n2').ungCu();
// Phía A: n1 cũng có thể ứng cử vì tưởng leader chết
await cum2.node('n1').ungCu();

console.log(cum2.nhatKy.join('\n'));
console.log('');
inTrangThai(cum2, 'Sau khi đứt mạng:');

const leadersMoi = cum2.leaders.filter((n) => n.term === Math.max(...cum2.nodes.map((x) => x.term)));
console.log(`
  📌 Phía B (3 node) BẦU ĐƯỢC leader: 3 >= đa số (3/5). Phía này tiếp tục phục vụ ghi.
  📌 Phía A (2 node) KHÔNG bầu được ai: n1 ứng cử nhưng chỉ gom được 2/5 phiếu.
     Kết quả: phía A hoàn toàn KHÔNG CÓ leader → không ghi được gì.
     (Ngay cả trong trường hợp n0 vẫn tưởng mình là leader — điều hoàn toàn có thể xảy ra
     nếu không có ai ứng cử — nó cũng không commit được gì, vì mọi lệnh ghi trong Raft
     đều phải được ĐA SỐ xác nhận, mà nó chỉ liên lạc được với 1 node.)

  📌 ĐÂY CHÍNH LÀ CÁCH QUORUM NGĂN SPLIT-BRAIN:
     Hai tập con của cùng một tập hợp, mỗi tập chiếm > 50%, thì CHẮC CHẮN GIAO NHAU.
     Nên không thể tồn tại hai nhóm đa số tách rời → không thể có hai leader hợp lệ
     ở cùng một term.

  📌 Cái giá: phía thiểu số MẤT KHẢ NĂNG GHI hoàn toàn. Đây đúng là lựa chọn "CP"
     trong định lý CAP — hy sinh availability của một phía để giữ consistency.
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Vì sao cụm consensus luôn có SỐ LẺ node?                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log('  số node │ đa số cần │ chịu được mấy node chết │ nhận xét');
console.log('  ────────┼───────────┼─────────────────────────┼──────────────────────────');
for (const n of [1, 2, 3, 4, 5, 6, 7]) {
  const daSo = Math.floor(n / 2) + 1;
  const chiuDuoc = n - daSo;
  const ghiChu =
    n % 2 === 0
      ? `⚠️ như ${n - 1} node nhưng tốn hơn`
      : n === 1
        ? 'không chịu được lỗi nào'
        : '✅ nên dùng';
  console.log(
    `  ${String(n).padStart(7)} │${String(daSo).padStart(10)} │${String(chiuDuoc).padStart(24)} │ ${ghiChu}`
  );
}

console.log(`
  📌 4 node và 3 node đều chỉ chịu được 1 node chết. Node thứ 4 chỉ tốn tiền
     và làm mọi lần ghi chậm hơn (phải chờ thêm một node xác nhận).
  📌 Đó là lý do etcd/ZooKeeper/Consul luôn khuyến nghị 3, 5, hoặc 7 node.
     7 node trở lên thì latency ghi bắt đầu tệ đi rõ rệt.

📝 BÀI TẬP:
   a) Sửa electionTimeoutMs thành CỐ ĐỊNH 200ms cho mọi node, rồi cho tất cả cùng ứng cử.
      Có ai thắng không? Đây chính là lý do Raft dùng timeout ngẫu nhiên.
   b) Thêm heartbeat định kỳ và cho leader "chết". Đo xem mất bao lâu để bầu leader mới.
      Thời gian đó chính là downtime của hệ thống — nó phụ thuộc tham số nào?
   c) Phân vùng 5 node thành 2+2+1. Có phía nào bầu được leader không? Hệ thống ra sao?
`);
