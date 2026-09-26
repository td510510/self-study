import { pino } from 'pino';

/**
 * Log JSON có tên dịch vụ. Khi chạy với tracing, PinoInstrumentation tự thêm
 * trace_id/span_id vào mỗi dòng → dán trace_id vào Jaeger là thấy cả hành trình.
 */
export function taoLogger(tenDichVu, level = process.env.LOG_LEVEL ?? 'info') {
  return pino({
    level,
    base: { service: tenDichVu },
    formatters: { level: (label) => ({ level: label }) },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}
