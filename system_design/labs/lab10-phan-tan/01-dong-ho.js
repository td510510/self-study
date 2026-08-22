/**
 * LAB 10.1 — Đồng hồ trong hệ phân tán: vì sao Last-Write-Wins làm MẤT dữ liệu
 *
 * Chạy:  node labs/lab10-phan-tan/01-dong-ho.js
 */

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 1 — CLOCK SKEW: đồng hồ các máy không giống nhau
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — LAST WRITE WINS với đồng hồ lệch                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

class Node {
  /** @param lechMs đồng hồ của node này lệch bao nhiêu so với thời gian thật */
  constructor(ten, lechMs) {
    this.ten = ten;
    this.lechMs = lechMs;
    this.store = new Map();
  }
  /** Đây là Date.now() mà CODE TRÊN NODE NÀY nhìn thấy — không phải thời gian thật. */
  now(thoiGianThat) {
    return thoiGianThat + this.lechMs;
  }
  ghiLWW(key, value, ts) {
    const cu = this.store.get(key);
    // Last Write Wins: timestamp lớn hơn thì thắng
    if (!cu || ts >= cu.ts) this.store.set(key, { value, ts });
  }
}

// NTP giữ được sai số vài chục ms là tốt; VM bị treo/migrate có thể lệch hàng giây.
const nodeA = new Node('A (nhanh 250ms)', 250);
const nodeB = new Node('B (chậm 100ms)', -100);

console.log('  Kịch bản: hai người sửa CÙNG một hồ sơ, B sửa SAU A 50ms (thời gian THẬT).\n');

const thoiGianThatA = 1000;
const thoiGianThatB = 1050; // B sửa SAU

const tsA = nodeA.now(thoiGianThatA); // = 1250
const tsB = nodeB.now(thoiGianThatB); // =  950

console.log(`  A ghi "số điện thoại = 0901..." lúc THẬT ${thoiGianThatA}ms, gắn timestamp ${tsA}`);
console.log(`  B ghi "số điện thoại = 0988..." lúc THẬT ${thoiGianThatB}ms, gắn timestamp ${tsB}`);

for (const n of [nodeA, nodeB]) {
  n.ghiLWW('phone', '0901...', tsA);
  n.ghiLWW('phone', '0988...', tsB);
}

console.log(`\n  Kết quả cuối cùng ở cả hai node: "${nodeA.store.get('phone').value}"`);
console.log(`
  ❌ SAI. B ghi SAU nên đáng lẽ "0988..." phải thắng.
     Nhưng đồng hồ A chạy nhanh hơn 350ms so với B → timestamp của A lớn hơn → A thắng.
     Cập nhật của B BIẾN MẤT KHÔNG DẤU VẾT. Không lỗi, không log, không cảnh báo.

  📌 Đây không phải tình huống hiếm. Clock skew vài trăm ms là chuyện thường ngày:
     - NTP chỉ đồng bộ định kỳ, giữa các lần thì đồng hồ trôi
     - VM bị đóng băng khi migrate hoặc snapshot
     - Container chạy trên host quá tải
     - Và tệ nhất: NTP có thể KÉO LÙI đồng hồ → Date.now() chạy giật lùi
       (Dùng performance.now()/CLOCK_MONOTONIC nếu chỉ cần đo KHOẢNG thời gian.)
`);

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 2 — LAMPORT vs VECTOR CLOCK
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — Đồng hồ logic: phát hiện xung đột THẬT                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

/** Lamport: một bộ đếm duy nhất. */
class LamportNode {
  constructor(ten) {
    this.ten = ten;
    this.c = 0;
  }
  suKienNoiBo() {
    return ++this.c;
  }
  gui() {
    return ++this.c;
  }
  nhan(tsGui) {
    this.c = Math.max(this.c, tsGui) + 1;
    return this.c;
  }
}

/** Vector clock: mỗi node giữ bộ đếm của TẤT CẢ các node. */
class VectorNode {
  constructor(ten, tatCa) {
    this.ten = ten;
    this.v = Object.fromEntries(tatCa.map((t) => [t, 0]));
  }
  suKienNoiBo() {
    this.v[this.ten]++;
    return { ...this.v };
  }
  nhan(vGui) {
    for (const k of Object.keys(this.v)) this.v[k] = Math.max(this.v[k], vGui[k] ?? 0);
    this.v[this.ten]++;
    return { ...this.v };
  }
}

/** So sánh 2 vector: 'truoc' | 'sau' | 'dongThoi' (= XUNG ĐỘT) */
function soSanhVector(a, b) {
  let aNhoHon = false, aLonHon = false;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    if (x < y) aNhoHon = true;
    if (x > y) aLonHon = true;
  }
  if (aNhoHon && aLonHon) return 'dongThoi'; // không so sánh được → xung đột thật
  if (aNhoHon) return 'truoc';
  if (aLonHon) return 'sau';
  return 'bang';
}

console.log(`  Kịch bản A — CÓ quan hệ nhân quả (B trả lời tin nhắn của A):

     A: gửi "Mấy giờ họp?"  ──────────►  B: nhận, rồi trả lời "9h"
`);
{
  const A = new VectorNode('A', ['A', 'B']);
  const B = new VectorNode('B', ['A', 'B']);
  const vA = A.suKienNoiBo();          // A hỏi
  const vB = B.nhan(vA);               // B nhận rồi trả lời
  console.log(`     vector của A: ${JSON.stringify(vA)}`);
  console.log(`     vector của B: ${JSON.stringify(vB)}`);
  console.log(`     So sánh: A ${soSanhVector(vA, vB)} B  →  ✅ biết chắc câu hỏi TRƯỚC câu trả lời`);
}

console.log(`
  Kịch bản B — KHÔNG có nhân quả (hai người sửa cùng lúc, chưa thấy nhau):

     A: đổi phone = 0901...     (chưa biết gì về B)
     B: đổi phone = 0988...     (chưa biết gì về A)
`);
{
  const A = new VectorNode('A', ['A', 'B']);
  const B = new VectorNode('B', ['A', 'B']);
  const vA = A.suKienNoiBo();
  const vB = B.suKienNoiBo();
  const kq = soSanhVector(vA, vB);
  console.log(`     vector của A: ${JSON.stringify(vA)}`);
  console.log(`     vector của B: ${JSON.stringify(vB)}`);
  console.log(`     So sánh: ${kq}  →  ⚠️  XUNG ĐỘT THẬT, hệ thống PHẢI hỏi ứng dụng cách hoà giải`);
}

console.log(`
  📌 Đây là điều LWW không làm được: LWW luôn chọn được "người thắng", kể cả khi
     KHÔNG CÓ người thắng đúng nghĩa. Nó biến xung đột thành mất dữ liệu âm thầm.

  📌 Vector clock nói: "hai cái này đồng thời, tôi không biết cái nào đúng, bạn quyết đi."
     Ứng dụng có thể: hiện cả hai cho user chọn, hoặc HỢP NHẤT (như giỏ hàng Amazon).
`);

// ══════════════════════════════════════════════════════════════════════════
// THÍ NGHIỆM 3 — LWW mất bao nhiêu % cập nhật?
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Đo tỉ lệ mất dữ liệu: LWW vs Vector clock vs CRDT             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

const SO_LAN = 5000;
const LECH_TOI_DA = 300; // ms

let lwwSai = 0;
let vectorPhatHien = 0;

for (let i = 0; i < SO_LAN; i++) {
  const lechA = (Math.random() * 2 - 1) * LECH_TOI_DA;
  const lechB = (Math.random() * 2 - 1) * LECH_TOI_DA;
  const thatA = 1000;
  const thatB = 1000 + Math.random() * 200; // B luôn ghi SAU A

  const tsA = thatA + lechA;
  const tsB = thatB + lechB;

  if (tsA > tsB) lwwSai++; // LWW chọn nhầm người thắng

  // Vector clock: vì A và B không thấy nhau, LUÔN phát hiện là đồng thời
  vectorPhatHien++;
}

console.log('  cơ chế hoà giải     │ kết quả');
console.log('  ────────────────────┼─────────────────────────────────────────────────');
console.log(`  Last Write Wins     │ chọn SAI người thắng ${((lwwSai / SO_LAN) * 100).toFixed(1)}% số lần → mất dữ liệu âm thầm`);
console.log(`  Vector clock        │ phát hiện 100% xung đột → app tự quyết`);
console.log(`  CRDT (G-Counter/Set)│ 0% mất dữ liệu → hội tụ tự động, không cần hỏi ai`);

// ─── Minh hoạ CRDT: G-Counter (bộ đếm chỉ tăng) ────────────────────────────
console.log(`
  ▌ Minh hoạ CRDT — G-Counter: đếm lượt xem trên 3 node, mạng đứt rồi nối lại
`);

class GCounter {
  constructor(ten, tatCa) {
    this.ten = ten;
    this.p = Object.fromEntries(tatCa.map((t) => [t, 0]));
  }
  tang(n = 1) {
    this.p[this.ten] += n; // CHỈ sửa ô của chính mình → không bao giờ xung đột
  }
  /** Hợp nhất = lấy max từng ô. Phép này giao hoán, kết hợp, luỹ đẳng → luôn hội tụ. */
  hopNhat(khac) {
    for (const k of Object.keys(this.p)) this.p[k] = Math.max(this.p[k], khac.p[k] ?? 0);
  }
  get giaTri() {
    return Object.values(this.p).reduce((a, b) => a + b, 0);
  }
}

const ten = ['n1', 'n2', 'n3'];
const [c1, c2, c3] = ten.map((t) => new GCounter(t, ten));
c1.tang(5);
c2.tang(3);
c3.tang(7); // mạng đang đứt, 3 node đếm riêng

console.log(`     Trước khi nối lại: n1=${c1.giaTri}, n2=${c2.giaTri}, n3=${c3.giaTri}`);

// Nối lại mạng, hợp nhất theo thứ tự BẤT KỲ, thậm chí lặp lại
for (const [a, b] of [[c1, c2], [c2, c3], [c3, c1], [c1, c2], [c2, c1], [c3, c2], [c1, c3], [c2, c3]]) {
  a.hopNhat(b);
}

console.log(`     Sau khi hợp nhất : n1=${c1.giaTri}, n2=${c2.giaTri}, n3=${c3.giaTri}  (đúng = 15)`);
console.log(`
  📌 Cả 3 node đều hội tụ về 15 — KHÔNG mất một lượt đếm nào, không cần leader,
     không cần đồng hồ, không cần biết thứ tự hợp nhất.
     Đây là lý do CRDT được dùng cho: bộ đếm, giỏ hàng, presence, văn bản cộng tác.

  📌 Giới hạn của CRDT: chỉ áp dụng được cho những thao tác GIAO HOÁN.
     "Cộng thêm 1" thì được. "Đặt giá trị = X" thì không. "Trừ kho có kiểm tra tồn" thì không.
     Và metadata (bảng p) phình theo số node.

📝 BÀI TẬP:
   a) Cài PN-Counter (tăng VÀ giảm được). Gợi ý: hai G-Counter, một cho tăng một cho giảm.
   b) Cài LWW-Element-Set và chỉ ra một tình huống nó vẫn mất dữ liệu.
   c) Giỏ hàng Amazon dùng "hợp nhất bằng union". Nêu một hệ quả KHÓ CHỊU của cách này.
      (Gợi ý: xoá một món hàng khi mạng đứt thì món đó sẽ...?)
`);
