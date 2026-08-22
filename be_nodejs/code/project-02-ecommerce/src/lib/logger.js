/**
 * Project 2 — Structured logging với pino.
 *
 * VÌ SAO KHÔNG DÙNG console.log?
 *
 *   1. Ở production, log được MÁY đọc chứ không phải người.
 *      JSON mỗi dòng cho phép Datadog/Loki/CloudWatch lọc và thống kê.
 *      console.log('user 5 mua 3 món') → máy không hiểu gì.
 *      log.info({ userId: 5, soMon: 3 }, 'mua hàng') → truy vấn được.
 *
 *   2. console.log ghi ĐỒNG BỘ ra stdout khi stdout là file hoặc pipe.
 *      Nhớ buổi 02: ghi đồng bộ CHẶN EVENT LOOP.
 *      Log nhiều = server chậm. pino ghi bất đồng bộ.
 *
 *   3. Không có mức log → không tắt bớt được khi cần.
 */

import { pino } from 'pino';

/**
 * ⚠️ DANH SÁCH TRƯỜNG PHẢI CHE.
 *
 * Đây là phần quan trọng nhất file này.
 * Log lộ mật khẩu/token là sự cố bảo mật NGHIÊM TRỌNG —
 * và log thường được gửi sang dịch vụ bên thứ ba, sao lưu nhiều nơi,
 * cho nhiều người xem hơn database rất nhiều.
 *
 * Nguyên tắc: DANH SÁCH ĐEN không bao giờ đủ.
 * Luôn nghĩ "còn chỗ nào dữ liệu nhạy cảm có thể lọt vào log?"
 */
const TRUONG_CHE = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  'matKhau',
  'matKhauHash',
  'accessToken',
  'refreshToken',
  'token',
  '*.password',
  '*.matKhau',
  '*.matKhauHash',
  '*.accessToken',
  '*.refreshToken',
  'body.matKhau',
  'body.password',
];

export function taoLogger({ level = 'info', pretty = false } = {}) {
  return pino({
    level,

    redact: {
      paths: TRUONG_CHE,
      censor: '[ĐÃ CHE]',
    },

    // Chuẩn hoá tên trường: pino mặc định dùng "msg", "time", "level" số.
    // Đổi level thành chữ để người đọc log hiểu ngay.
    formatters: {
      level: (label) => ({ level: label }),
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    // pino-pretty CHỈ dùng khi phát triển.
    // Ở production phải là JSON thuần để máy đọc.
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
    }),
  });
}

/**
 * Cấu hình pino-http: log mỗi request.
 *
 * Điểm dạy: MỨC LOG PHỤ THUỘC STATUS CODE.
 * Lỗi 4xx là chuyện bình thường (client gửi sai) → warn.
 * Lỗi 5xx là BUG của ta → error, cần cảnh báo.
 * Log mọi thứ ở mức error thì cảnh báo mất hết ý nghĩa.
 */
export function cauHinhPinoHttp(logger) {
  return {
    logger,

    genReqId: (req, res) => {
      const id = req.headers['x-request-id'] ?? crypto.randomUUID();
      res.setHeader('X-Request-Id', id);
      return id;
    },

    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      // Health check gọi liên tục — đừng làm ngập log
      if (req.url === '/health') return 'debug';
      return 'info';
    },

    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} → ${res.statusCode}`;
    },

    // Chỉ giữ những trường CẦN. Mặc định pino-http log cả headers,
    // vừa thừa vừa dễ lọt dữ liệu nhạy cảm.
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        // IP để truy vết khi bị tấn công
        ip: req.remoteAddress,
      }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  };
}
