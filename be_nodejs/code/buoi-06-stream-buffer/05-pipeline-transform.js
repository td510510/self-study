/**
 * Buổi 06 — Bước 5: pipeline() và Transform stream.
 *
 * Bài toán thật: lọc các dòng ERROR từ file log 31 MB,
 * đổi định dạng, ghi ra file mới — mà không nạp hết vào RAM.
 *
 * Chạy:  node 05-pipeline-transform.js
 */

import { createReadStream, createWriteStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { createInterface } from 'node:readline';

const NGUON = 'data/access.log';
const DICH = 'data/errors.log';

function boNhoMB() {
  return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
}

// ═══════════════════════════════════════════════════════════════
// PHẦN 1: So sánh bộ nhớ — readFile vs stream
// ═══════════════════════════════════════════════════════════════
console.log('═══ PHẦN 1: readFile vs stream ═══\n');

const info = await stat(NGUON);
console.log(`File nguồn: ${(info.size / 1024 / 1024).toFixed(1)} MB\n`);

if (!global.gc) {
  console.log('⚠️  Chạy bằng `node --expose-gc 05-pipeline-transform.js`');
  console.log('    thì số đo bộ nhớ mới chính xác (cần chủ động dọn rác giữa 2 phép đo).\n');
}

console.log(`Bộ nhớ ban đầu       : ${boNhoMB()} MB`);

// ❌ Cách nạp hết vào RAM.
// Đặt trong HÀM để sau khi hàm kết thúc, biến `toanBo` không còn tham chiếu
// → bộ dọn rác thu hồi được. Nếu để ở top-level, nó sống tới hết chương trình
// và làm phép đo phần 2 sai lệch hoàn toàn.
async function doReadFile() {
  console.time('readFile (nạp hết vào RAM)');
  const toanBo = await readFile(NGUON, 'utf8');
  console.timeEnd('readFile (nạp hết vào RAM)');
  console.log(`Bộ nhớ sau readFile  : ${boNhoMB()} MB  ← toàn bộ file nằm trong RAM`);
  return toanBo.length;
}

const soKyTu = await doReadFile();
console.log(`Số ký tự đọc được    : ${soKyTu.toLocaleString('vi-VN')}`);

// Chủ động dọn rác để hai phép đo công bằng với nhau
global.gc?.();
console.log(`Bộ nhớ sau khi dọn   : ${boNhoMB()} MB  ← đã thu hồi\n`);

// ═══════════════════════════════════════════════════════════════
// PHẦN 2: Transform stream — lọc và đổi định dạng
// ═══════════════════════════════════════════════════════════════
console.log('═══ PHẦN 2: Transform stream ═══\n');

/**
 * Transform stream = vừa đọc vào, vừa biến đổi, vừa ghi ra.
 * Giống Array.prototype.map, nhưng chạy trên dòng dữ liệu đang chảy.
 */
class LocDongLoi extends Transform {
  constructor() {
    // objectMode: cho phép đẩy object/string thay vì chỉ Buffer
    super({ objectMode: true });
    this.soDongDoc = 0;
    this.soDongGiu = 0;
  }

  // Được gọi cho MỖI dòng đi qua
  _transform(dong, _encoding, callback) {
    this.soDongDoc++;

    if (dong.includes(' ERROR ')) {
      this.soDongGiu++;
      // Đổi định dạng: chỉ giữ thời gian và đường dẫn
      const [thoiGian, , , duongDan] = dong.split(' ');
      this.push(`${thoiGian}\t${duongDan}\n`);
    }

    // Gọi callback báo "xử lý xong dòng này".
    // QUÊN gọi callback = stream đứng im mãi mãi. Bug rất khó tìm.
    callback();
  }

  // Được gọi MỘT LẦN khi hết dữ liệu
  _flush(callback) {
    this.push(`\n# Tổng: đọc ${this.soDongDoc} dòng, giữ ${this.soDongGiu} dòng\n`);
    callback();
  }
}

const boLoc = new LocDongLoi();

console.time('pipeline (stream)');

// pipeline() nối các stream lại và lo hộ TOÀN BỘ:
//   - backpressure (nhớ bài 02)
//   - lan truyền lỗi
//   - dọn dẹp tài nguyên khi có sự cố
await pipeline(
  createInterface({ input: createReadStream(NGUON), crlfDelay: Infinity }),
  boLoc,
  createWriteStream(DICH)
);

console.timeEnd('pipeline (stream)');
console.log(`Bộ nhớ sau pipeline  : ${boNhoMB()} MB  ← không bao giờ nạp hết file`);
console.log(`Đã đọc ${boLoc.soDongDoc.toLocaleString('vi-VN')} dòng, giữ lại ${boLoc.soDongGiu.toLocaleString('vi-VN')} dòng`);

const infoDich = await stat(DICH);
console.log(`Đã ghi ${DICH} — ${(infoDich.size / 1024).toFixed(0)} KB\n`);

/*
 * VÌ SAO LUÔN DÙNG pipeline() THAY VÌ .pipe()?
 *
 * Cách cũ:
 *   a.pipe(b).pipe(c);
 *
 *   → Nếu b lỗi, a và c KHÔNG được dọn dẹp → RÒ RỈ FILE DESCRIPTOR.
 *     Server chạy vài ngày là hết file descriptor và không nhận
 *     thêm kết nối nào được nữa. Rất khó chẩn đoán.
 *
 * Cách đúng:
 *   await pipeline(a, b, c);
 *
 *   → Lỗi ở bất kỳ khâu nào cũng được ném ra để ta bắt,
 *     và MỌI stream đều được đóng sạch sẽ.
 *
 * QUY TẮC: dùng pipeline() từ 'node:stream/promises'. Luôn luôn.
 *
 *
 * BỐN LOẠI STREAM — TỔNG KẾT
 *
 *   Readable   đọc ra       fs.createReadStream, req, process.stdin
 *   Writable   ghi vào      fs.createWriteStream, res, process.stdout
 *   Duplex     cả hai       net.Socket
 *   Transform  Duplex + biến đổi   zlib.createGzip, lớp LocDongLoi ở trên
 */
