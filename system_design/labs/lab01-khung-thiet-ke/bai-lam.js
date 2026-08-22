/**
 * BÀI LÀM CỦA BẠN — điền vào đây rồi chạy `node labs/lab01-khung-thiet-ke/01-checklist.js`
 *
 * Bản mẫu dưới đây đã điền SẴN MỘT PHẦN để bạn thấy định dạng.
 * Nhiệm vụ: điền nốt các chỗ đang để trống / null.
 */

export default {
  // ─── BƯỚC 1: LÀM RÕ YÊU CẦU ────────────────────────────────────────────
  functional: [
    'Người dùng dán URL dài và nhận về một link ngắn',
    // TODO: thêm ít nhất 2 yêu cầu nữa
  ],

  nonFunctional: [
    'Redirect phải nhanh: p99 < 100ms',
    // TODO: thêm ít nhất 2 yêu cầu nữa (nghĩ về QPS, uptime, tỉ lệ đọc/ghi)
  ],

  ngoaiPhamVi: [
    // TODO: viết ra thứ bạn CỐ TÌNH không làm trong phiên bản đầu
  ],

  // ─── BƯỚC 2: ƯỚC LƯỢNG ─────────────────────────────────────────────────
  // Giả định: 100 triệu link được tạo mỗi tháng.
  qpsGhi: null, // TODO: 100_000_000 / (30 * 24 * 3600) ≈ ?
  qpsDoc: null, // TODO: giả sử mỗi link được click trung bình 100 lần
  storageGB: null, // TODO: 500 bytes/bản ghi, lưu 5 năm → bao nhiêu GB?

  // ─── BƯỚC 3: THIẾT KẾ TỔNG THỂ ─────────────────────────────────────────
  api: [
    'POST /links  { longUrl } -> { shortUrl }',
    // TODO: endpoint redirect
  ],

  dataModel: {
    // TODO: ví dụ  links: 'code (PK), longUrl, ownerId, createdAt, expiresAt'
  },

  thanhPhan: [
    'Client',
    // TODO: thêm các thành phần còn lại
  ],

  // ─── BƯỚC 4: ĐÀO SÂU ───────────────────────────────────────────────────
  bottleneck: null, // TODO: thành phần nào vỡ trước khi traffic tăng 10x?

  neuChet: {
    // TODO: ví dụ  Cache: 'toàn bộ đọc dồn xuống DB, latency tăng ~20x'
  },

  danhDoi: null, // TODO: một đánh đổi bạn chấp nhận, kèm LÝ DO
};
