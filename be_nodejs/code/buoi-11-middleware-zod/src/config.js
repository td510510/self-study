/**
 * Project 1 — Cấu hình tập trung, có kiểm tra ngay lúc khởi động.
 *
 * Nguyên tắc FAIL FAST (nhớ buổi 03): thà chết ngay lúc start với thông báo
 * rõ ràng, còn hơn chạy được rồi lỗi khó hiểu lúc 3 giờ sáng.
 *
 * Đây là bản viết tay của thứ mà @nestjs/config làm hộ ở buổi 38.
 */

function batBuoc(ten, macDinh) {
  const giaTri = process.env[ten] ?? macDinh;
  if (giaTri === undefined || giaTri === '') {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${ten}`);
  }
  return giaTri;
}

function soNguyenDuong(ten, macDinh) {
  const tho = batBuoc(ten, macDinh);
  const so = Number(tho);
  if (!Number.isInteger(so) || so <= 0) {
    throw new Error(`${ten} phải là số nguyên dương, nhận được: "${tho}"`);
  }
  return so;
}

export const config = {
  port: soNguyenDuong('PORT', '3000'),
  dataFile: batBuoc('DATA_FILE', './data/todos.json'),
  bodyLimit: soNguyenDuong('BODY_LIMIT', String(1024 * 1024)),
  shutdownTimeoutMs: soNguyenDuong('SHUTDOWN_TIMEOUT_MS', '10000'),
  logLevel: batBuoc('LOG_LEVEL', 'info'),
};
