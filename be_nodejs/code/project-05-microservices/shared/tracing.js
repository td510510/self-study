/**
 * Buổi 54 — OpenTelemetry: bật tracing TRƯỚC KHI bất kỳ thư viện nào được import.
 *
 *   node --import ./shared/tracing.js services/kho/main.js
 *
 * Vì sao phải `--import` (nạp trước)? Instrumentation hoạt động bằng cách
 * "vá" (monkey-patch) module express, pg, amqplib ngay LÚC CHÚNG ĐƯỢC NẠP.
 * Nếu main.js đã `import express` trước, bản gốc đã nằm trong bộ nhớ → không vá được
 * → không có span nào, và không có lỗi nào báo cho bạn biết. Rất khó gỡ.
 *
 * Dự án dùng ESM → cần thêm hook `import-in-the-middle` (dòng register bên dưới).
 * Thiếu dòng đó, instrumentation chỉ thấy các `require()` CommonJS.
 */

import { register } from 'node:module';
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);

const { NodeSDK } = await import('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = await import('@opentelemetry/instrumentation-express');
const { PgInstrumentation } = await import('@opentelemetry/instrumentation-pg');
const { AmqplibInstrumentation } = await import('@opentelemetry/instrumentation-amqplib');
const { PinoInstrumentation } = await import('@opentelemetry/instrumentation-pino');

const path = await import('node:path');

if (process.env.OTEL_SDK_DISABLED !== 'true') {
  const sdk = new NodeSDK({
    // Tên dịch vụ = tên thư mục: services/kho/main.js → "kho".
    // (Không đặt được trong main.js: file này chạy TRƯỚC main.js.)
    serviceName: process.env.OTEL_SERVICE_NAME ?? path.basename(path.dirname(process.argv[1] ?? '')),
    traceExporter: new OTLPTraceExporter(), // mặc định gửi tới OTEL_EXPORTER_OTLP_ENDPOINT
    instrumentations: [
      new HttpInstrumentation({
        // Prometheus gọi /metrics 5 giây một lần, health check còn dày hơn.
        // Không lọc → Jaeger ngập hàng nghìn trace vô nghĩa.
        ignoreIncomingRequestHook: (req) => /^\/(metrics|health)/.test(req.url ?? ''),
      }),
      new ExpressInstrumentation(),
      // requireParentSpan: chỉ tạo span cho query nằm TRONG một trace có sẵn.
      // Vòng lặp outbox poll database 5 lần/giây — mỗi lần một trace rác nếu không có dòng này.
      new PgInstrumentation({ requireParentSpan: true }),
      // Tự chèn/đọc ngữ cảnh trace vào HEADER của message → trace đi xuyên RabbitMQ
      new AmqplibInstrumentation(),
      // Tự thêm trace_id, span_id vào MỌI dòng log pino → từ log nhảy sang trace
      new PinoInstrumentation(),
    ],
  });
  sdk.start();

  // Đẩy nốt span còn trong bộ đệm trước khi thoát (buổi 08: graceful shutdown)
  process.once('beforeExit', () => sdk.shutdown());
  globalThis.__otelSdk = sdk;
}
