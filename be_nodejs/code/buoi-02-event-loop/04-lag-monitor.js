/**
 * Buổi 02 — Đo mức độ nghẽn của Event Loop.
 *
 * Kỹ thuật này dùng THẬT ở production để phát hiện code chặn luồng.
 * Các thư viện APM (New Relic, Datadog) đo bằng đúng nguyên lý này.
 *
 * Chạy:  node 04-lag-monitor.js
 */

/**
 * Ý tưởng: hẹn giờ đều đặn mỗi `intervalMs`, rồi đo xem thực tế bị trễ bao nhiêu.
 * Độ trễ đó chính là thời gian Event Loop bị chiếm dụng bởi việc khác.
 */
function monitorLag(intervalMs = 500) {
  let last = process.hrtime.bigint();

  const timer = setInterval(() => {
    const now = process.hrtime.bigint();
    // hrtime.bigint() trả về nanosecond → chia 1e6 ra millisecond
    const lagMs = Number(now - last) / 1e6 - intervalMs;
    last = now;

    const canhBao = lagMs > 100 ? '   ⚠️  EVENT LOOP ĐANG BỊ CHẶN' : '';
    console.log(`lag: ${lagMs.toFixed(1).padStart(7)}ms${canhBao}`);
  }, intervalMs);

  // unref(): không giữ tiến trình sống chỉ vì cái timer này.
  // Nếu không có, chương trình sẽ không bao giờ tự thoát.
  timer.unref();

  return timer;
}

monitorLag();

// Cứ 3 giây lại cố tình chặn luồng 1.5 giây để thấy lag nhảy vọt
setInterval(() => {
  console.log('  → bắt đầu chặn luồng 1.5s...');
  const end = Date.now() + 1500;
  while (Date.now() < end) {
    /* bận rộn vô ích — đây chính là CPU-bound blocking */
  }
}, 3000);

console.log('Quan sát: lag ~0ms khi rảnh, vọt lên ~1500ms khi bị chặn.');
console.log('Nhấn Ctrl+C để dừng.\n');

/*
 * BÀI TẬP
 *
 * 1. Đưa monitorLag() vào 03-blocking-demo.js.
 *    Gọi /chan và chụp lại số liệu lag.
 *    So sánh với khi gọi /khong-chan.
 *
 * 2. Ở production, ngưỡng lag bao nhiêu thì đáng báo động?
 *    Gợi ý: nghĩ theo góc độ "người dùng chờ thêm bao lâu".
 */
