/**
 * ĐÁP ÁN MẪU (dành cho giảng viên)
 *
 * Để dùng: đổi tên file này thành bai-lam.js (nhớ sao lưu bản của học viên trước).
 *
 * ⚠️ Lưu ý sư phạm: KHÔNG phát file này trước khi học viên tự làm.
 * Giá trị của lab nằm ở việc học viên tự phát hiện mình quên bước nào.
 */

export default {
  // ─── BƯỚC 1: LÀM RÕ YÊU CẦU ────────────────────────────────────────────
  functional: [
    'Người dùng dán URL dài và nhận về một link ngắn',
    'Truy cập link ngắn thì được chuyển hướng tới URL gốc',
    'Người dùng xem được số lượt click của link mình tạo',
    'Link có thể đặt hạn dùng (tự hết hiệu lực)',
  ],

  nonFunctional: [
    'Redirect phải nhanh: p99 < 100ms',
    '100 triệu link được tạo mỗi tháng',
    'Tỉ lệ đọc:ghi khoảng 100:1 — hệ đọc nhiều',
    'Uptime 99,9% cho đường redirect (chức năng cốt lõi)',
    'Mã ngắn không được đoán ra mã kế tiếp (bảo mật)',
  ],

  ngoaiPhamVi: [
    'Custom domain riêng của khách hàng',
    'Analytics real-time (chấp nhận số liệu trễ vài phút)',
    'Sửa/đổi đích đến của link đã tạo',
  ],

  // ─── BƯỚC 2: ƯỚC LƯỢNG ─────────────────────────────────────────────────
  // 100.000.000 / (30 × 86.400) ≈ 38,6
  qpsGhi: 39,
  // Mỗi link được click trung bình 100 lần → 39 × 100
  qpsDoc: 3900,
  // 100tr/tháng × 500 B × 12 tháng × 5 năm ≈ 3.000 GB
  storageGB: 3000,

  // ─── BƯỚC 3: THIẾT KẾ TỔNG THỂ ─────────────────────────────────────────
  api: [
    'POST /v1/links  { longUrl, expiresAt? } -> 201 { code, shortUrl }',
    'GET  /{code}                            -> 302 Location: <longUrl>',
    'GET  /v1/links/{code}/stats             -> 200 { clicks, createdAt }',
  ],

  dataModel: {
    links: 'code VARCHAR(7) PK, long_url TEXT, owner_id BIGINT, created_at, expires_at',
    'links (index)': 'INDEX (owner_id, created_at DESC) — phục vụ "link của tôi"',
    click_stats: 'code FK, ngay DATE, so_click BIGINT — gộp theo ngày, không đếm từng click',
  },

  thanhPhan: [
    'Client',
    'CDN / Edge',
    'Load Balancer',
    'App servers (stateless)',
    'Redis (cache code → longUrl)',
    'PostgreSQL (primary + read replica)',
    'Message Queue (sự kiện click)',
    'Worker gộp số liệu click',
  ],

  // ─── BƯỚC 4: ĐÀO SÂU ───────────────────────────────────────────────────
  bottleneck:
    'Đường redirect ở 12.000 QPS peak. Nếu không có cache, database phải chịu toàn bộ ' +
    'lượng đọc này. Nút thắt thứ hai là việc đếm click: UPDATE cùng một dòng 12.000 lần/giây ' +
    'sẽ tạo hot row và tuần tự hoá mọi thứ.',

  neuChet: {
    Redis:
      'Toàn bộ 12.000 QPS đọc dồn xuống DB. Vẫn phục vụ được nhưng latency tăng ~10 lần và ' +
      'DB có nguy cơ sập → cần circuit breaker + rate limit + warm cache trước khi mở lại traffic.',
    'DB primary':
      'Không tạo được link mới, NHƯNG redirect vẫn chạy bình thường (đọc từ cache và replica). ' +
      'Đây là degradation tốt: chức năng kiếm tiền chính vẫn sống.',
    Queue:
      'Mất số liệu click trong thời gian sự cố. Redirect không bị ảnh hưởng. ' +
      'Chấp nhận được vì analytics không phải chức năng cốt lõi.',
  },

  danhDoi:
    'Dùng 302 (tạm thời) thay vì 301 (vĩnh viễn): ĐƯỢC khả năng đếm click và đổi đích đến sau này, ' +
    'MẤT khả năng để trình duyệt cache redirect — nghĩa là mọi lần click đều phải đi qua server ' +
    'của chúng ta, tải cao hơn nhiều lần. Chấp nhận vì analytics là một yêu cầu functional.',
};
