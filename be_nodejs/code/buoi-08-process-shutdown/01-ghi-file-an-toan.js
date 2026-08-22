/**
 * Buổi 08 — Bước 1: ghi file an toàn.
 *
 * Ghi file "ngây thơ" có thể làm MẤT TOÀN BỘ dữ liệu nếu tiến trình
 * chết đúng lúc đang ghi. Đây là bài học nền cho Project 1.
 *
 * Chạy:  node 01-ghi-file-an-toan.js
 */

import { writeFile, rename, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const FILE = 'data/todos.json';

await mkdir('data', { recursive: true });

// ═══════════════════════════════════════════════════════════════
// ❌ CÁCH NGÂY THƠ
// ═══════════════════════════════════════════════════════════════
async function ghiNgayTho(duLieu) {
  // writeFile mở file ở chế độ 'w' → CẮT CỤT file về 0 byte NGAY LẬP TỨC,
  // rồi mới ghi nội dung mới vào.
  //
  // Nếu tiến trình chết ở khoảnh khắc giữa hai việc đó
  // (mất điện, OOM, kill -9, deploy) → file rỗng. MẤT SẠCH DỮ LIỆU.
  await writeFile(FILE, JSON.stringify(duLieu, null, 2), 'utf8');
}

// ═══════════════════════════════════════════════════════════════
// ✅ CÁCH AN TOÀN: ghi file tạm rồi đổi tên (atomic write)
// ═══════════════════════════════════════════════════════════════
async function ghiAnToan(duongDan, duLieu) {
  const fileTam = join(dirname(duongDan), `.${Date.now()}.tmp`);

  // Bước 1: ghi vào file TẠM. File thật vẫn còn nguyên vẹn.
  await writeFile(fileTam, JSON.stringify(duLieu, null, 2), 'utf8');

  // Bước 2: đổi tên đè lên file thật.
  // rename() là thao tác NGUYÊN TỬ ở mức hệ điều hành (trên cùng ổ đĩa):
  // hoặc thành công hoàn toàn, hoặc không xảy ra gì. Không có trạng thái giữa.
  await rename(fileTam, duongDan);
}

// ═══════════════════════════════════════════════════════════════
// Hàng đợi ghi — chống tranh chấp khi nhiều request cùng ghi
// ═══════════════════════════════════════════════════════════════

/**
 * Nhớ buổi 02: Node đơn luồng, nhưng I/O thì BẤT ĐỒNG BỘ.
 * Hai request cùng gọi ghi file có thể xen kẽ nhau và ghi đè kết quả của nhau.
 *
 * Giải pháp: nối các lần ghi thành một chuỗi tuần tự.
 */
function taoHangDoiGhi() {
  let hangDoi = Promise.resolve();

  return function ghi(duongDan, duLieu) {
    // Mỗi lần ghi được nối vào cuối hàng đợi.
    // .catch() để một lần ghi lỗi không làm hỏng cả hàng đợi về sau.
    hangDoi = hangDoi.then(
      () => ghiAnToan(duongDan, duLieu),
      () => ghiAnToan(duongDan, duLieu)
    );
    return hangDoi;
  };
}

const ghiCoHangDoi = taoHangDoiGhi();

// ═══════════════════════════════════════════════════════════════
// Chạy thử
// ═══════════════════════════════════════════════════════════════
console.log('═══ Ghi 5 lần cùng lúc — không hàng đợi vs có hàng đợi ═══\n');

// Bắn 5 lệnh ghi cùng lúc qua hàng đợi
await Promise.all(
  [1, 2, 3, 4, 5].map((i) =>
    ghiCoHangDoi(FILE, { lanGhi: i, thoiGian: new Date().toISOString() })
  )
);

const noiDung = JSON.parse(await readFile(FILE, 'utf8'));
console.log('Nội dung cuối cùng:', noiDung);
console.log('→ Đúng là lần ghi cuối (5), không bị trộn lẫn\n');

console.log('═══ Vì sao ghi ngây thơ nguy hiểm ═══\n');
console.log('writeFile mở file ở chế độ "w":');
console.log('  1. Cắt cụt file về 0 byte  ← nếu chết ở ĐÂY thì mất sạch');
console.log('  2. Ghi nội dung mới vào');
console.log();
console.log('ghiAnToan (ghi tạm + rename):');
console.log('  1. Ghi file .tmp           ← file thật vẫn nguyên vẹn');
console.log('  2. rename() nguyên tử      ← hoặc xong hẳn, hoặc không gì cả');
console.log();

/*
 * VÌ SAO rename() LÀ NGUYÊN TỬ?
 *
 * Ở tầng hệ thống tập tin, rename() chỉ sửa MỘT con trỏ trong thư mục:
 * "tên này giờ trỏ tới khối dữ liệu kia".
 *
 * Không có trạng thái nửa vời. Tại mọi thời điểm, đọc file ra sẽ được
 * hoặc bản CŨ hoàn chỉnh, hoặc bản MỚI hoàn chỉnh.
 *
 * ⚠️ ĐIỀU KIỆN: file tạm phải nằm CÙNG Ổ ĐĨA với file đích.
 *    Khác ổ đĩa thì rename() biến thành copy + delete → mất tính nguyên tử.
 *    Đó là lý do ta đặt file tạm trong cùng thư mục (dirname(duongDan)).
 *
 * Đây là kỹ thuật mà mọi database dùng. Ta gặp lại nó ở buổi 19 (transaction).
 */
