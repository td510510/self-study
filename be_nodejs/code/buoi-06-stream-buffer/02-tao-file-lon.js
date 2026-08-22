/**
 * Buổi 06 — Bước 2: tạo file log lớn để thực hành.
 *
 * Đồng thời dạy luôn khái niệm BACKPRESSURE — thứ quan trọng nhất
 * khi ghi dữ liệu lớn mà không làm tràn bộ nhớ.
 *
 * Chạy:  node 02-tao-file-lon.js
 * Kết quả: data/access.log  (~31 MB, 500.000 dòng)
 */

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const SO_DONG = 500_000;
const DUONG_DAN = 'data/access.log';

const MUC = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
const DUONG_DAN_API = ['/api/todos', '/api/users', '/api/orders', '/api/products'];

await mkdir('data', { recursive: true });

const stream = createWriteStream(DUONG_DAN);

console.log(`Đang tạo ${SO_DONG.toLocaleString('vi-VN')} dòng log...`);
console.time('Thời gian tạo');

let daGhi = 0;

/**
 * Ghi dữ liệu có tôn trọng BACKPRESSURE.
 *
 * stream.write() trả về false khi bộ đệm nội bộ đã đầy
 * → nghĩa là "chậm lại, tôi ghi ra đĩa không kịp".
 *
 * Nếu ta phớt lờ và cứ write() tiếp, dữ liệu chất đống trong RAM
 * cho tới khi tiến trình hết bộ nhớ và chết.
 */
function ghiTiep() {
  while (daGhi < SO_DONG) {
    const dong = taoDongLog(daGhi);
    daGhi++;

    const conGhiDuoc = stream.write(dong);

    if (!conGhiDuoc) {
      // Bộ đệm đầy. DỪNG LẠI, chờ sự kiện 'drain' rồi mới ghi tiếp.
      stream.once('drain', ghiTiep);
      return;
    }
  }

  stream.end();
}

// Mốc thời gian CỐ ĐỊNH — không dùng Date.now().
// Lý do: file phải TẤT ĐỊNH, mọi học viên sinh ra file giống hệt nhau
// thì mới so sánh được kết quả đếm sai/đúng ở bài 03 và 04.
const MOC_THOI_GIAN = Date.UTC(2026, 0, 1);

function taoDongLog(i) {
  const thoiGian = new Date(MOC_THOI_GIAN + i * 1000).toISOString();
  const muc = MUC[i % MUC.length];
  const duongDan = DUONG_DAN_API[i % DUONG_DAN_API.length];
  // Số giả ngẫu nhiên nhưng TẤT ĐỊNH — suy ra từ i, không dùng Math.random()
  const msec = (((i * 7919) % 5000) / 10).toFixed(1);
  const ip = `192.168.${i % 255}.${(i * 7) % 255}`;

  // Cứ 1000 dòng lại chèn một dòng có tiếng Việt có dấu.
  // Đây là "quả mìn" để bài 03 phát hiện lỗi cắt chunk.
  const ghiChu = i % 1000 === 0 ? ' — yêu cầu bị từ chối vì thiếu quyền' : '';

  return `${thoiGian} ${muc} ${ip} ${duongDan} ${msec}ms${ghiChu}\n`;
}

stream.on('finish', async () => {
  console.timeEnd('Thời gian tạo');
  const { stat } = await import('node:fs/promises');
  const info = await stat(DUONG_DAN);
  console.log(`Đã tạo ${DUONG_DAN} — ${(info.size / 1024 / 1024).toFixed(1)} MB`);
});

ghiTiep();

/*
 * BACKPRESSURE — GIẢI THÍCH BẰNG VÍ DỤ ĐỜI THƯỜNG
 *
 * Bạn rót nước vào phễu. Phễu chảy xuống chai.
 * Nếu rót nhanh hơn tốc độ chảy, nước tràn ra ngoài.
 *
 * stream.write() trả false = "phễu sắp đầy, chậm lại"
 * sự kiện 'drain'          = "phễu vơi rồi, rót tiếp được"
 *
 * BỎ QUA BACKPRESSURE LÀ NGUYÊN NHÂN PHỔ BIẾN
 * CỦA LỖI "JavaScript heap out of memory".
 *
 * Ở bài 05 ta sẽ thấy pipeline() lo hộ việc này hoàn toàn.
 */
