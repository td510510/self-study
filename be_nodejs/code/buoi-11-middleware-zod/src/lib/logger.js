/**
 * Logger có cấu trúc (structured logging).
 *
 * Vì sao không dùng console.log thuần? Vì ở production, log được máy đọc
 * chứ không phải người đọc. JSON mỗi dòng cho phép công cụ (Datadog, Loki…)
 * lọc và thống kê. Ta gặp lại chủ đề này ở buổi 18 (winston/pino).
 */

const MUC = { debug: 10, info: 20, warn: 30, error: 40 };

export function taoLogger(mucToiThieu = 'info') {
  const nguong = MUC[mucToiThieu] ?? MUC.info;

  function ghi(muc, thongDiep, chiTiet = {}) {
    if (MUC[muc] < nguong) return;

    const ban = { thoiGian: new Date().toISOString(), muc, thongDiep, ...chiTiet };

    // Log lỗi ra stderr, còn lại ra stdout — để hệ thống tách được hai luồng
    const ra = muc === 'error' ? process.stderr : process.stdout;
    ra.write(JSON.stringify(ban) + '\n');
  }

  return {
    debug: (m, c) => ghi('debug', m, c),
    info: (m, c) => ghi('info', m, c),
    warn: (m, c) => ghi('warn', m, c),
    error: (m, c) => ghi('error', m, c),
  };
}
