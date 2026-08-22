/**
 * Buổi 06 — Bước 3: cách đếm SAI (nhưng trông rất hợp lý).
 *
 * Đây là code mà 90% người mới sẽ viết. Nó chạy, không báo lỗi,
 * và cho ra KẾT QUẢ SAI một cách âm thầm — loại bug nguy hiểm nhất.
 *
 * Chạy:  node 03-dem-dong-sai.js
 */

import { createReadStream } from 'node:fs';

const TU_KHOA = 'từ chối'; // có dấu → nhiều byte → dễ bị cắt đôi

let soDong = 0;
let soLanTuKhoa = 0;
let soChunk = 0;

// Chunk 1KB — nhỏ hơn mặc định (64KB) để lỗi lộ ra rõ ràng.
// Ở production chunk lớn hơn nên lỗi hiếm hơn, NHƯNG VẪN CÓ.
// Bug hiếm gặp còn nguy hiểm hơn bug hay gặp: nó lọt qua mọi vòng test.
const stream = createReadStream('data/access.log', { highWaterMark: 1024 });

console.log('Đang đọc (cách SAI)...\n');
console.time('Thời gian');

stream.on('data', (chunk) => {
  soChunk++;

  // ❌ SAI: chuyển từng chunk thành chuỗi ngay lập tức.
  // Chunk cắt theo BYTE, không quan tâm ranh giới ký tự hay ranh giới dòng.
  const text = chunk.toString('utf8');

  // ❌ SAI: đếm từ khoá trong từng chunk riêng lẻ.
  // Từ khoá nằm vắt qua hai chunk sẽ không bao giờ được tìm thấy.
  for (const dong of text.split('\n')) {
    if (dong.includes(TU_KHOA)) soLanTuKhoa++;
  }

  soDong += (text.match(/\n/g) || []).length;
});

stream.on('end', () => {
  console.timeEnd('Thời gian');
  console.log(`\nSố chunk đọc được : ${soChunk}`);
  console.log(`Số dòng           : ${soDong.toLocaleString('vi-VN')}`);
  console.log(`Số dòng có "${TU_KHOA}" : ${soLanTuKhoa}`);
  console.log(`\nĐáp án đúng phải là: 500 dòng`);
  console.log('So sánh với 04-dem-dong-dung.js\n');
});

/*
 * HAI LỖI TRONG FILE NÀY
 *
 * 1. chunk.toString('utf8') trên từng chunk riêng lẻ
 *    → ký tự UTF-8 bị cắt đôi ở ranh giới chunk thành �
 *    (nhớ lại demo 01-buffer-co-ban.js)
 *
 * 2. Xử lý từng chunk độc lập
 *    → một DÒNG bị cắt làm đôi giữa hai chunk sẽ được đếm thành 2 dòng,
 *      và TỪ KHOÁ nằm vắt qua ranh giới sẽ không tìm thấy.
 *
 * Điều đáng sợ: chương trình KHÔNG BÁO LỖI. Nó chạy nhanh, ra một con số,
 * và con số đó sai. Nếu đây là báo cáo doanh thu, bạn đã ra quyết định sai.
 *
 * → Bài 04 sửa cả hai lỗi.
 */
