/**
 * Buổi 54 — Metrics cho Prometheus.
 *
 * Log trả lời "chuyện gì đã xảy ra với request X?".
 * Metrics trả lời "hệ thống đang KHOẺ không?" — bằng con số tổng hợp, rẻ, lưu lâu.
 * Trace trả lời "request X chậm Ở ĐÂU, qua những dịch vụ nào?".
 * Ba thứ bổ sung nhau, không thay thế nhau.
 *
 * Tên metric giữ theo QUY ƯỚC TIẾNG ANH của Prometheus (http_request_duration_seconds...)
 * vì đó là hợp đồng với công cụ bên ngoài: dashboard, cảnh báo có sẵn đều giả định tên này.
 */

import client from 'prom-client';

export function taoQuanSat(tenDichVu) {
  // Registry riêng cho từng dịch vụ — test chạy cả ba dịch vụ trong MỘT tiến trình
  const registry = new client.Registry();
  registry.setDefaultLabels({ service: tenDichVu });
  client.collectDefaultMetrics({ register: registry }); // CPU, RAM, event loop lag (buổi 02!)

  // HISTOGRAM, không phải trung bình: trung bình che mất 1% request chậm 10 giây (buổi 44)
  const thoiGianHttp = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Thời gian xử lý request HTTP',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [registry],
  });

  const demSuKien = new client.Counter({
    name: 'messages_processed_total',
    help: 'Số message đã xử lý theo kết quả (thanh_cong | thu_lai | dlq)',
    labelNames: ['hang_doi', 'ket_qua'],
    registers: [registry],
  });

  const middleware = (req, res, next) => {
    const ketThuc = thoiGianHttp.startTimer({ method: req.method });
    res.on('finish', () => {
      // ⚠️ Dùng MẪU route (/don-hang/:id), KHÔNG dùng req.url (/don-hang/8f3a...).
      // Mỗi URL khác nhau là một chuỗi thời gian mới → hàng triệu chuỗi → Prometheus sập.
      // Lỗi này có tên: "bùng nổ cardinality".
      ketThuc({ route: req.route?.path ?? 'khong_khop', status: res.statusCode });
    });
    next();
  };

  const gauge = (name, help, layGiaTri) =>
    new client.Gauge({
      name,
      help,
      registers: [registry],
      async collect() {
        this.set(await layGiaTri());
      },
    });

  async function metricsHandler(req, res) {
    res.set('content-type', registry.contentType);
    res.send(await registry.metrics());
  }

  return { registry, middleware, demSuKien, gauge, metricsHandler };
}
