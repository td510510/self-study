/**
 * Buổi 42 — PM2: quản lý tiến trình Node ở production.
 *
 * PM2 lo bốn việc mà `node src/server.js` không lo:
 *   1. Tự khởi động lại khi tiến trình chết
 *   2. Chạy nhiều bản sao (cluster) để dùng hết nhân CPU
 *   3. Khởi động cùng máy chủ sau khi reboot
 *   4. Gom log và xoay vòng file log
 *
 * ⚠️ Nếu đã dùng Docker (buổi 27) thì thường KHÔNG cần PM2 —
 *    Docker/Kubernetes đã lo việc khởi động lại và scale.
 *    Dùng PM2 khi deploy thẳng lên VPS không container.
 */
module.exports = {
  apps: [
    {
      name: 'shop-api',
      script: 'src/server.js',
      cwd: '/srv/shop',

      // 'max' = số bản sao bằng số nhân CPU.
      // Nhớ buổi 02: Node đơn luồng — một tiến trình chỉ dùng được MỘT nhân.
      instances: 'max',
      exec_mode: 'cluster',

      // ⚠️ Nối buổi 20: tổng kết nối database = số bản sao × pool_size.
      // 8 bản sao × pool 20 = 160 kết nối, VƯỢT trần 100 của Postgres.
      // → phải giảm pool, hoặc dùng PgBouncer.
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // Khởi động lại nếu vượt ngưỡng RAM — lưới an toàn cho rò rỉ bộ nhớ
      max_memory_restart: '500M',

      // Chờ app báo sẵn sàng rồi mới chuyển traffic (zero-downtime reload)
      wait_ready: true,
      listen_timeout: 10000,

      // ⚠️ Cho app đủ thời gian tắt tử tế (buổi 08).
      // PM2 gửi SIGINT, chờ kill_timeout rồi mới SIGKILL.
      kill_timeout: 15000,

      // Không tự restart liên tục khi app crash ngay lúc khởi động
      min_uptime: '10s',
      max_restarts: 10,

      error_file: '/var/log/shop/error.log',
      out_file: '/var/log/shop/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
