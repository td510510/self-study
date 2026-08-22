/**
 * LAB 06.1 — Tự cài "database mini" và ĐO tác dụng của index
 *
 * Chạy:  node labs/lab06-index-transaction/01-index.js
 *
 * Chúng ta đếm SỐ DÒNG PHẢI ĐỌC (rows examined) — đúng thứ mà EXPLAIN hiển thị.
 */

// ─── Bảng: mảng các dòng, thứ tự chèn (giống heap của Postgres) ─────────────
class Bang {
  constructor(ten) {
    this.ten = ten;
    this.rows = [];
    this.indexes = new Map(); // tenIndex -> BTreeIndex
    this.soDongDaDoc = 0;     // bộ đếm để so sánh
  }

  insert(row) {
    this.rows.push(row);
    for (const idx of this.indexes.values()) idx.them(row);
  }

  /** Full table scan — đọc từng dòng. */
  seqScan(dieuKien) {
    const kq = [];
    for (const r of this.rows) {
      this.soDongDaDoc++;
      if (dieuKien(r)) kq.push(r);
    }
    return kq;
  }

  taoIndex(ten, cacCot) {
    const idx = new BTreeIndex(cacCot);
    for (const r of this.rows) idx.them(r);
    this.indexes.set(ten, idx);
    return idx;
  }
}

// ─── Index: mảng đã SẮP XẾP + tìm nhị phân (mô hình hoá B-Tree) ────────────
class BTreeIndex {
  constructor(cacCot) {
    this.cacCot = cacCot;      // ví dụ ['user_id', 'created_at']
    this.entries = [];          // [{ khoa: [42, 1700000], row }]
    this.daSapXep = true;
    this.soDongDaDoc = 0;
  }

  khoaCua(row) {
    return this.cacCot.map((c) => row[c]);
  }

  them(row) {
    this.entries.push({ khoa: this.khoaCua(row), row });
    this.daSapXep = false;
  }

  sapXep() {
    if (this.daSapXep) return;
    this.entries.sort((a, b) => soSanh(a.khoa, b.khoa));
    this.daSapXep = true;
  }

  /**
   * Tìm mọi entry có tiền tố khoá bằng `tienTo`.
   * Đây chính là quy tắc LEFTMOST PREFIX: chỉ khớp được từ cột đầu tiên trở đi.
   */
  timTheoTienTo(tienTo) {
    this.sapXep();
    const n = this.entries.length;

    // Tìm nhị phân vị trí đầu tiên >= tienTo
    let lo = 0, hi = n;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      this.soDongDaDoc++; // mỗi bước nhị phân = 1 lần "chạm" node
      if (soSanh(this.entries[mid].khoa.slice(0, tienTo.length), tienTo) < 0) lo = mid + 1;
      else hi = mid;
    }

    // Quét tiếp các entry còn khớp tiền tố (B-Tree: các lá liền kề nhau)
    const kq = [];
    for (let i = lo; i < n; i++) {
      this.soDongDaDoc++;
      if (soSanh(this.entries[i].khoa.slice(0, tienTo.length), tienTo) !== 0) break;
      kq.push(this.entries[i].row);
    }
    return kq;
  }

  /** Range scan: khoá đầu = giaTri, khoá thứ hai trong khoảng [tu, den] */
  timKhoang(giaTriDau, tu, den) {
    this.sapXep();
    const tatCa = this.timTheoTienTo([giaTriDau]);
    return tatCa.filter((r) => r[this.cacCot[1]] >= tu && r[this.cacCot[1]] <= den);
  }
}

function soSanh(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

// ─── Dựng dữ liệu ───────────────────────────────────────────────────────────
const SO_DONG = 200_000;
const SO_USER = 5_000;

const orders = new Bang('orders');
console.log(`⏳ Đang tạo ${SO_DONG.toLocaleString('vi-VN')} đơn hàng cho ${SO_USER.toLocaleString('vi-VN')} user...`);
for (let i = 1; i <= SO_DONG; i++) {
  orders.insert({
    id: i,
    user_id: 1 + Math.floor(Math.random() * SO_USER),
    status: ['pending', 'paid', 'shipped'][Math.floor(Math.random() * 3)],
    created_at: 1_700_000_000 + Math.floor(Math.random() * 31_536_000),
    total: Math.floor(Math.random() * 10_000_000),
  });
}

const USER_CAN_TIM = 42;

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 1 — WHERE user_id = ${USER_CAN_TIM}                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

orders.soDongDaDoc = 0;
let t0 = performance.now();
const kqScan = orders.seqScan((r) => r.user_id === USER_CAN_TIM);
const tScan = performance.now() - t0;
const docScan = orders.soDongDaDoc;

const idxUser = orders.taoIndex('idx_user', ['user_id']);
idxUser.sapXep();
idxUser.soDongDaDoc = 0;
t0 = performance.now();
const kqIdx = idxUser.timTheoTienTo([USER_CAN_TIM]);
const tIdx = performance.now() - t0;

console.log('  cách thực thi   │ số dòng đọc │ thời gian │ kết quả');
console.log('  ────────────────┼─────────────┼───────────┼─────────');
console.log(`  Seq Scan        │${docScan.toLocaleString('vi-VN').padStart(12)} │${(tScan.toFixed(2) + 'ms').padStart(10)} │ ${kqScan.length} dòng`);
console.log(`  Index Scan      │${idxUser.soDongDaDoc.toLocaleString('vi-VN').padStart(12)} │${(tIdx.toFixed(3) + 'ms').padStart(10)} │ ${kqIdx.length} dòng`);
console.log(`
  → Index đọc ít hơn ${Math.round(docScan / idxUser.soDongDaDoc).toLocaleString('vi-VN')} lần, nhanh hơn ~${Math.round(tScan / Math.max(tIdx, 0.001))} lần.
  → Và điều quan trọng nhất: khi bảng lớn gấp 10, Seq Scan chậm gấp 10,
    còn Index Scan chỉ chậm thêm ~3 bước nhị phân (log₂). Đó là khác biệt về ĐỘ PHỨC TẠP.
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 2 — Quy tắc LEFTMOST PREFIX                                   ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

const idxTohop = orders.taoIndex('idx_user_time', ['user_id', 'created_at']);
idxTohop.sapXep();

const MOC_THOI_GIAN = 1_715_000_000;

// (a) WHERE user_id = 42  → dùng được (cột đầu)
idxTohop.soDongDaDoc = 0;
const a = idxTohop.timTheoTienTo([USER_CAN_TIM]);
const docA = idxTohop.soDongDaDoc;

// (b) WHERE user_id = 42 AND created_at BETWEEN ...  → dùng được cả hai cột
idxTohop.soDongDaDoc = 0;
const b = idxTohop.timKhoang(USER_CAN_TIM, MOC_THOI_GIAN, MOC_THOI_GIAN + 5_000_000);
const docB = idxTohop.soDongDaDoc;

// (c) WHERE created_at > ...  → KHÔNG dùng được, phải Seq Scan
orders.soDongDaDoc = 0;
const c = orders.seqScan((r) => r.created_at > MOC_THOI_GIAN);
const docC = orders.soDongDaDoc;

console.log('  query                                    │ index dùng được? │ số dòng đọc');
console.log('  ─────────────────────────────────────────┼──────────────────┼─────────────');
console.log(`  WHERE user_id=42                         │ ✅ (cột đầu)     │${docA.toLocaleString('vi-VN').padStart(12)}`);
console.log(`  WHERE user_id=42 AND created_at BETWEEN  │ ✅ (cả 2 cột)    │${docB.toLocaleString('vi-VN').padStart(12)}`);
console.log(`  WHERE created_at > X                     │ ❌ Seq Scan      │${docC.toLocaleString('vi-VN').padStart(12)}`);

console.log(`
  → Index (user_id, created_at) VÔ DỤNG với query chỉ lọc created_at.
    Muốn phục vụ query (c) phải tạo THÊM index (created_at) — và đó là thêm thuế lên INSERT.
  → Bài học: index phải thiết kế THEO QUERY, không phải theo trực giác "cột này hay lọc".
`);

// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║ THÍ NGHIỆM 3 — Khi nào index VÔ ÍCH? (độ chọn lọc thấp)                  ║
╚══════════════════════════════════════════════════════════════════════════╝
`);

const idxStatus = orders.taoIndex('idx_status', ['status']);
idxStatus.sapXep();
idxStatus.soDongDaDoc = 0;
const kqStatus = idxStatus.timTheoTienTo(['paid']);
const docStatus = idxStatus.soDongDaDoc;

const doChonLocUser = ((kqIdx.length / SO_DONG) * 100).toFixed(3);
const doChonLocStatus = ((kqStatus.length / SO_DONG) * 100).toFixed(1);

console.log('  cột      │ số giá trị khác nhau │ % dòng khớp │ index có ích?');
console.log('  ─────────┼──────────────────────┼─────────────┼──────────────────────────');
console.log(`  user_id  │${String(SO_USER).padStart(21)} │${(doChonLocUser + '%').padStart(12)} │ ✅ RẤT có ích`);
console.log(`  status   │                    3 │${(doChonLocStatus + '%').padStart(12)} │ ❌ gần như vô ích`);

console.log(`
  → Index trên "status" trả về ~33% số dòng. Đọc index rồi lại phải nhảy về bảng
    lấy 1/3 số dòng — TỐN HƠN là đọc thẳng cả bảng theo thứ tự tuần tự.
    Vì thế query planner sẽ TỰ BỎ QUA index này. Bạn trả phí ghi mà không được gì.

  → Quy tắc kinh nghiệm: index hữu ích khi query lọc còn dưới ~5-10% số dòng.

  → Ngoại lệ: index tổ hợp (status, created_at) VẪN có ích cho
    "WHERE status='pending' ORDER BY created_at" vì nó phục vụ luôn việc SẮP XẾP.

📝 BÀI TẬP:
   a) Tăng SO_DONG lên 1.000.000. Số dòng đọc của Seq Scan tăng bao nhiêu lần?
      Của Index Scan thì sao? (Đây là toàn bộ ý nghĩa của O(n) vs O(log n).)
   b) Cài "covering index": thêm cột total vào index để không phải đọc bảng gốc.
   c) Cài phép ĐẾM chi phí INSERT: mỗi index làm insert tốn thêm bao nhiêu thao tác?
`);
