/**
 * LAB 11 — Tự cài search engine mini: inverted index + TF-IDF + BM25
 *
 * Chạy:  node labs/lab11-search/01-inverted-index.js
 */

// ══════════════════════════════════════════════════════════════════════════
// 1. TOKENIZER — tách và chuẩn hoá từ (bước quyết định chất lượng tìm kiếm)
// ══════════════════════════════════════════════════════════════════════════

/** Bỏ dấu tiếng Việt: "điện thoại" → "dien thoai" → tìm được cả khi gõ không dấu. */
export function boDau(s) {
  return s
    .normalize('NFD')                    // tách chữ và dấu thành 2 ký tự
    .replace(/[̀-ͯ]/g, '')     // xoá các dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

const STOP_WORDS = new Set([
  'va', 'cua', 'la', 'co', 'cho', 'voi', 'the', 'nhung', 'cac', 'mot',
  'nay', 'do', 'khi', 'de', 'tu', 'den', 'trong', 'tren', 'duoc',
]);

export function tokenize(text, { boStopWords = true } = {}) {
  const tu = boDau(text.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return boStopWords ? tu.filter((t) => !STOP_WORDS.has(t)) : tu;
}

// ══════════════════════════════════════════════════════════════════════════
// 2. INVERTED INDEX
// ══════════════════════════════════════════════════════════════════════════
export class InvertedIndex {
  constructor() {
    this.index = new Map();     // tu -> Map(docId -> [vị trí...])
    this.docs = new Map();      // docId -> { text, doDai }
    this.tongDoDai = 0;
  }

  them(docId, text) {
    const tokens = tokenize(text);
    this.docs.set(docId, { text, doDai: tokens.length });
    this.tongDoDai += tokens.length;

    tokens.forEach((tu, viTri) => {
      if (!this.index.has(tu)) this.index.set(tu, new Map());
      const posting = this.index.get(tu);
      if (!posting.has(docId)) posting.set(docId, []);
      // Lưu VỊ TRÍ để hỗ trợ tìm cụm từ ("màn hình" phải liền nhau)
      posting.get(docId).push(viTri);
    });
  }

  get doDaiTrungBinh() {
    return this.tongDoDai / this.docs.size;
  }

  /** IDF: từ càng HIẾM thì càng có sức phân biệt. */
  idf(tu) {
    const df = this.index.get(tu)?.size ?? 0;
    if (df === 0) return 0;
    return Math.log(1 + (this.docs.size - df + 0.5) / (df + 0.5));
  }

  // ─── Tìm kiếm bằng TF-IDF ───────────────────────────────────────────────
  timTFIDF(truyVan, topN = 5) {
    const tuKhoa = tokenize(truyVan);
    const diem = new Map();

    for (const tu of tuKhoa) {
      const posting = this.index.get(tu);
      if (!posting) continue;
      const idf = this.idf(tu);
      for (const [docId, viTri] of posting) {
        const tf = viTri.length / this.docs.get(docId).doDai;
        diem.set(docId, (diem.get(docId) ?? 0) + tf * idf);
      }
    }
    return this.#xepHang(diem, topN);
  }

  // ─── Tìm kiếm bằng BM25 (chuẩn công nghiệp) ─────────────────────────────
  /**
   * k1 điều khiển "bão hoà TF": xuất hiện 100 lần KHÔNG tốt gấp 10 lần xuất hiện 10 lần.
   * b  điều khiển chuẩn hoá độ dài: tài liệu dài tự nhiên chứa nhiều từ hơn, phải phạt.
   */
  timBM25(truyVan, topN = 5, k1 = 1.5, b = 0.75) {
    const tuKhoa = tokenize(truyVan);
    const diem = new Map();
    const avgdl = this.doDaiTrungBinh;

    for (const tu of tuKhoa) {
      const posting = this.index.get(tu);
      if (!posting) continue;
      const idf = this.idf(tu);
      for (const [docId, viTri] of posting) {
        const f = viTri.length;
        const dl = this.docs.get(docId).doDai;
        const s = (idf * (f * (k1 + 1))) / (f + k1 * (1 - b + b * (dl / avgdl)));
        diem.set(docId, (diem.get(docId) ?? 0) + s);
      }
    }
    return this.#xepHang(diem, topN);
  }

  // ─── Tìm CỤM TỪ: các từ phải xuất hiện LIỀN NHAU ────────────────────────
  timCumTu(cumTu, topN = 5) {
    const tuKhoa = tokenize(cumTu);
    if (!tuKhoa.length) return [];

    const dauTien = this.index.get(tuKhoa[0]);
    if (!dauTien) return [];

    const kq = [];
    for (const [docId, viTriDau] of dauTien) {
      // Với mỗi vị trí của từ đầu, kiểm tra các từ sau có nối tiếp không
      const khop = viTriDau.filter((v0) =>
        tuKhoa.every((tu, i) => i === 0 || this.index.get(tu)?.get(docId)?.includes(v0 + i))
      );
      if (khop.length) kq.push({ docId, soLanKhop: khop.length, text: this.docs.get(docId).text });
    }
    return kq.sort((a, b) => b.soLanKhop - a.soLanKhop).slice(0, topN);
  }

  #xepHang(diem, topN) {
    return [...diem.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([docId, d]) => ({ docId, diem: d, text: this.docs.get(docId).text }));
  }

  get kichThuoc() {
    let posting = 0;
    for (const m of this.index.values()) posting += m.size;
    return { soTu: this.index.size, soPosting: posting, soDoc: this.docs.size };
  }
}

// ══════════════════════════════════════════════════════════════════════════
// DEMO
// ══════════════════════════════════════════════════════════════════════════
const SAN_PHAM = [
  'Điện thoại Samsung Galaxy S24 màn hình đẹp camera sắc nét',
  'Điện thoại iPhone 15 Pro Max camera đẹp chụp đêm tốt',
  'Laptop Dell XPS màn hình 4K viền mỏng',
  'Ốp lưng điện thoại iPhone silicon chống sốc',
  'Tai nghe Bluetooth Samsung chống ồn pin trâu',
  'Màn hình máy tính LG 27 inch 4K cho dân đồ hoạ',
  'Sạc nhanh điện thoại Samsung 45W chính hãng',
  'Điện thoại Xiaomi giá rẻ pin trâu màn hình lớn',
  'Cáp sạc iPhone Lightning chính hãng dài 2 mét',
  'Laptop gaming Asus ROG màn hình 144Hz card rời',
];

const idx = new InvertedIndex();
SAN_PHAM.forEach((t, i) => idx.them(`sp${i + 1}`, t));

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ INVERTED INDEX — ${SAN_PHAM.length} sản phẩm                                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log('  ▌ Một phần của index (từ → tài liệu chứa nó):\n');
for (const tu of ['dien', 'thoai', 'man', 'hinh', 'samsung', 'iphone']) {
  const p = idx.index.get(tu);
  console.log(`     ${tu.padEnd(10)} → [${[...(p?.keys() ?? [])].join(', ')}]   (IDF = ${idx.idf(tu).toFixed(2)})`);
}

console.log(`
  📌 Chú ý IDF: "dien"/"thoai" xuất hiện ở nhiều sản phẩm → IDF THẤP → ít giá trị phân biệt.
     "samsung"/"iphone" hiếm hơn → IDF CAO → trọng số lớn khi xếp hạng.
     Đây là toàn bộ trực giác của TF-IDF.
`);

// ─── So sánh TF-IDF và BM25 ────────────────────────────────────────────────
for (const q of ['điện thoại samsung', 'màn hình 4K', 'dien thoai camera dep']) {
  console.log(`\n  ▌ Truy vấn: "${q}"\n`);
  console.log('     hạng │ TF-IDF                                        │ BM25');
  console.log('     ─────┼───────────────────────────────────────────────┼──────────────────────────');
  const a = idx.timTFIDF(q, 3);
  const b = idx.timBM25(q, 3);
  for (let i = 0; i < 3; i++) {
    const l = a[i] ? `${a[i].docId} (${a[i].diem.toFixed(2)}) ${a[i].text.slice(0, 30)}` : '—';
    const r = b[i] ? `${b[i].docId} (${b[i].diem.toFixed(2)}) ${b[i].text.slice(0, 26)}` : '—';
    console.log(`     ${String(i + 1).padStart(4)} │ ${l.padEnd(45)} │ ${r}`);
  }
}

console.log(`
  📌 Truy vấn thứ 3 gõ KHÔNG DẤU vẫn ra kết quả — nhờ bước chuẩn hoá bỏ dấu ở tokenizer.
     Người Việt gõ không dấu rất nhiều, đây là chi tiết bắt buộc phải có.
`);

// ─── Tìm cụm từ ────────────────────────────────────────────────────────────
console.log(`
  ▌ Tìm CỤM TỪ "màn hình" (các từ phải liền nhau):
`);
for (const r of idx.timCumTu('màn hình')) {
  console.log(`     ${r.docId}: ${r.text}`);
}
console.log(`
  📌 Tìm cụm từ cần lưu VỊ TRÍ của từ trong tài liệu (positional index).
     Nó làm index to hơn nhiều — đó là cái giá của tính năng này.
`);

// ══════════════════════════════════════════════════════════════════════════
// SO SÁNH TỐC ĐỘ: Inverted Index vs LIKE '%...%'
// ══════════════════════════════════════════════════════════════════════════
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║ SO SÁNH TỐC ĐỘ với LIKE '%...%'                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Từ vựng thật của một kho sản phẩm: vài từ cực phổ biến, RẤT NHIỀU từ hiếm.
// (Phân phối Zipf — giống hệt ngôn ngữ tự nhiên.)
const TU_VUNG = Array.from({ length: 5000 }, (_, i) => `tu${i}`);
function tuNgauNhien() {
  // Zipf: chỉ số nhỏ (từ phổ biến) được chọn nhiều hơn hẳn
  const r = Math.random();
  return TU_VUNG[Math.floor(TU_VUNG.length * r ** 3)];
}

function taoTaiLieu(n) {
  const docs = Array.from({ length: n }, () => {
    const soTu = 15 + Math.floor(Math.random() * 25);
    return Array.from({ length: soTu }, tuNgauNhien).join(' ');
  });
  // Nhét từ khoá HIẾM vào ~0,2% tài liệu — đúng kiểu "tìm mã sản phẩm cụ thể"
  for (let i = 0; i < Math.max(1, n * 0.002); i++) {
    const j = Math.floor(Math.random() * n);
    docs[j] += ' tuhiemA tuhiemB';
  }
  return docs;
}

console.log('  số tài liệu │ dựng index │ tìm bằng LIKE │ tìm bằng index │ nhanh hơn');
console.log('  ────────────┼────────────┼───────────────┼────────────────┼───────────');

for (const n of [1000, 10_000, 100_000]) {
  const docs = taoTaiLieu(n);

  const t0 = performance.now();
  const ix = new InvertedIndex();
  docs.forEach((d, i) => ix.them(`d${i}`, d));
  const tDung = performance.now() - t0;

  // LIKE '%...%' = quét TOÀN BỘ bảng, kiểm tra chuỗi con từng dòng
  const t1 = performance.now();
  for (let lap = 0; lap < 20; lap++) {
    let dem = 0;
    for (const d of docs) if (d.includes('tuhiemA') && d.includes('tuhiemB')) dem++;
  }
  const tLike = (performance.now() - t1) / 20;

  const t2 = performance.now();
  for (let lap = 0; lap < 20; lap++) ix.timBM25('tuhiemA tuhiemB', 10);
  const tIdx = (performance.now() - t2) / 20;

  console.log(
    `  ${n.toLocaleString('vi-VN').padStart(11)} │${(tDung.toFixed(0) + 'ms').padStart(11)} │` +
      `${(tLike.toFixed(2) + 'ms').padStart(14)} │${(tIdx.toFixed(3) + 'ms').padStart(15)} │` +
      `${('×' + (tLike / tIdx).toFixed(0)).padStart(10)}`
  );
}

console.log(`
  📌 LIKE có độ phức tạp O(n) — gấp 10 lần dữ liệu thì chậm gấp 10 lần, mãi mãi.
     Inverted index chỉ chạm vào những tài liệu THỰC SỰ chứa từ khoá,
     nên thời gian gần như KHÔNG ĐỔI khi kho dữ liệu lớn lên.

  ⚠️ NHƯNG: hãy tự chạy thử với từ khoá PHỔ BIẾN (ví dụ 'tu0 tu1' — có trong phần lớn
     tài liệu). Bạn sẽ thấy inverted index KHÔNG còn nhanh hơn bao nhiêu, thậm chí chậm hơn,
     vì nó phải chấm điểm gần như mọi tài liệu.
     👉 Bài học: index nhanh nhờ ĐỘ CHỌN LỌC, y hệt index của database ở buổi 06.
     Đây cũng là lý do search engine thật phải có thêm: cắt tỉa posting list (WAND),
     ngưỡng điểm, và phân tầng index.

  📌 Đừng bỏ qua cột "dựng index": search engine trả giá TRƯỚC (lúc ghi) để nhanh SAU
     (lúc đọc). Đây là đánh đổi kinh điển của hệ đọc nhiều — và cũng là lý do
     index luôn TRỄ hơn database vài trăm ms tới vài giây.

  📌 Cuối cùng, LIKE còn không xếp hạng, không xử lý gõ sai, không đồng nghĩa.
     Tốc độ chỉ là MỘT trong nhiều lý do người ta dùng search engine.

📝 BÀI TẬP:
   a) Thêm gợi ý "ý bạn là...": tính khoảng cách Levenshtein giữa từ khoá không tìm thấy
      và các từ trong index, gợi ý từ gần nhất.
   b) Thêm bộ đồng nghĩa: "dt" → "dien thoai", "laptop" → "may tinh xach tay".
   c) Đo kích thước index (idx.kichThuoc) so với dữ liệu gốc. Positional index tốn thêm
      bao nhiêu? Đó là cái giá của tính năng tìm cụm từ.
   d) Cài phân trang cho kết quả tìm kiếm. Vì sao "trang 500" lại là bài toán khó?
`);
