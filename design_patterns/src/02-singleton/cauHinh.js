/**
 * MODULE SINGLETON — cách rất JavaScript.
 *
 * Toàn bộ code trong file này chạy ĐÚNG MỘT LẦN, dù bạn import nó ở 100 nơi.
 * Đó là đặc tính của ESM module: module registry cache lại kết quả lần đầu.
 *
 * Không cần class. Không cần layInstance(). Không cần chặn `new`.
 */

console.log("   ⚙️  File cauHinh.js đang được thực thi (chỉ thấy dòng này MỘT lần)");

const duLieu = {
  tenApp: "Shop Demo",
  moiTruong: process.env.NODE_ENV ?? "development",
  soKetNoiToiDa: 20,
};

let soLanKhoiTao = 1;

export default {
  get: (khoa) => duLieu[khoa],
  soLanKhoiTao,
};
