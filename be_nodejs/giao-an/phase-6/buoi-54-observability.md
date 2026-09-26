# Buổi 54 — Observability: OpenTelemetry, Prometheus, Grafana

> **Phase 6** · Hero
> **Mục tiêu:** Trả lời được *"request này chậm/lỗi ở đâu?"* trong hệ thống ba dịch vụ mà không đặt được breakpoint — bằng trace phân tán, metrics và log nối với nhau qua `trace_id`.
> **Code thực hành:** [`code/project-05-microservices/`](../../code/project-05-microservices/) — [`shared/tracing.js`](../../code/project-05-microservices/shared/tracing.js), [`shared/quan-sat.js`](../../code/project-05-microservices/shared/quan-sat.js), [`ha-tang/`](../../code/project-05-microservices/ha-tang/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 53 |
| 15–35′ | Từ `requestId` (buổi 43) tới trace phân tán |
| 35–75′ | **OpenTelemetry: bật tracing đúng cách** — và ba cái bẫy |
| 75–105′ | Trace đi xuyên RabbitMQ **và** xuyên outbox |
| 105–140′ | Metrics với Prometheus: histogram, cardinality, bão hoà |
| 140–165′ | Grafana: dashboard bốn tín hiệu vàng + hàng đợi |
| 165–180′ | Log ↔ trace ↔ metrics: một quy trình gỡ lỗi |

---

## 1. Từ `requestId` tới trace (15–35′)

Buổi 43 dừng ở: *"`requestId` phải được chuyển tiếp — đây là nền của distributed tracing"*. Hôm nay đi nốt.

| | `requestId` | Trace (OpenTelemetry) |
|---|---|---|
| Trả lời | "Những dòng log nào thuộc request này?" | "Request này đi **qua đâu**, **mỗi bước mất bao lâu**?" |
| Cấu trúc | Một chuỗi | **Cây span**: mỗi span có cha, thời điểm bắt đầu, thời lượng |
| Qua message queue | Tự nhét vào payload | Chuẩn **W3C `traceparent`** trong header |
| Công cụ | grep log | Jaeger, Tempo, Datadog… |

Ba trụ cột — không thay thế nhau:

| | Câu hỏi | Đặc điểm |
|---|---|---|
| **Metrics** | "Hệ thống có khoẻ không?" | Số tổng hợp, rẻ, lưu lâu, **đặt cảnh báo** |
| **Trace** | "Request này chậm ở đâu?" | Chi tiết từng request, thường chỉ giữ một phần (sampling) |
| **Log** | "Chính xác chuyện gì đã xảy ra?" | Chi tiết nhất, đắt nhất |

> Quy trình điển hình: **metrics** báo động (p95 tăng) → **trace** khoanh vùng (span nào dài) → **log** giải thích (lỗi gì). Mục 7 làm đúng quy trình này.

---

## 2. Bật OpenTelemetry đúng cách (35–75′)

```json
"kho": "node --env-file=.env --import ./shared/tracing.js services/kho/main.js"
```

`tracing.js` **phải nạp trước** mọi thứ. Instrumentation hoạt động bằng cách *vá* (monkey-patch) `express`, `pg`, `amqplib` **ngay lúc chúng được nạp**.

### Ba cái bẫy — cả ba đều **im lặng**

> **📝 Ghi chú giảng viên**
> Điểm chung của ba bẫy: sai thì **không có lỗi nào**, chỉ là không có span. Học viên sẽ mất cả buổi chiều nếu không biết trước.

**Bẫy 1 — nạp muộn.** `import './tracing.js'` ở dòng đầu `main.js` là **không đủ** với ESM: mọi `import` được nạp *trước* khi dòng đầu tiên chạy. Phải dùng `--import`.

**Bẫy 2 — ESM.** Dự án `"type": "module"` cần thêm hook:

```js
import { register } from 'node:module';
register('@opentelemetry/instrumentation/hook.mjs', import.meta.url);
```

Thiếu dòng này → chỉ các `require()` CommonJS được vá.

**Bẫy 3 — tên dịch vụ.** `OTEL_SERVICE_NAME` đặt trong `main.js` là **quá muộn** — SDK đã khởi động xong. Project lấy tên từ đường dẫn: `services/kho/main.js` → `"kho"`.

### Lọc rác

```js
new HttpInstrumentation({
  ignoreIncomingRequestHook: (req) => /^\/(metrics|health)/.test(req.url ?? ''),
}),
new PgInstrumentation({ requireParentSpan: true }),
```

| Không lọc | Hậu quả |
|---|---|
| `/metrics`, `/health` | Prometheus gọi 5 giây/lần/dịch vụ → Jaeger ngập hàng nghìn trace vô nghĩa |
| `requireParentSpan` | Relay outbox poll DB 5 lần/giây → mỗi lần một trace rác |

---

## 3. Trace xuyên RabbitMQ và xuyên outbox (75–105′)

Chạy `npm run tat-ca`, đặt một đơn, mở http://localhost:16686 → Service `don-hang` → *Find Traces*.

Một `POST /don-hang` cho ra **một** trace, **36 span**, qua **ba** dịch vụ (đo thật, rút gọn):

```
[don-hang] POST /don-hang                                    219 ms
  [don-hang] pg.query:INSERT · INSERT · COMMIT
  [don-hang] publish don-hang.da-tao                           4 ms
    [kho] kho.don-hang-da-tao process                         15 ms
      [kho] pg.query:UPDATE kho                                2 ms   ← trừ tồn
      [kho] publish kho.da-giu
        [don-hang] don-hang.ket-qua-kho process               10 ms
          [don-hang] publish don-hang.da-xac-nhan
            [thong-bao] thong-bao.don-hang-da-xac-nhan process 12 ms
```

### Xuyên RabbitMQ: miễn phí

`AmqplibInstrumentation` tự chèn `traceparent` vào **header** message khi publish, và đọc ra khi consume.

### Xuyên outbox: **phải tự làm**

> **📝 Ghi chú giảng viên — điểm hay nhất buổi học**
> Hỏi lớp: *"Relay chạy trong một vòng lặp riêng, không nằm trong request HTTP nào. Span `publish` của nó sẽ có cha là ai?"*
>
> → **Không ai.** Trace đứt làm đôi: một trace cho HTTP, một trace khác bắt đầu từ relay. Và chỗ đứt nằm **đúng** ở ranh giới khó gỡ lỗi nhất.

Lời giải: lưu ngữ cảnh trace **vào chính dòng outbox**:

```js
// Lúc ghi — đang ở trong request HTTP
const nguCanh = {};
propagation.inject(context.active(), nguCanh);        // → { traceparent: '00-c1eb20c8…-…-01' }
await client.query('INSERT INTO outbox (loai, du_lieu, ngu_canh) VALUES ($1,$2,$3)', [...]);

// Lúc relay — ở vòng lặp khác, vài trăm ms sau
const cha = propagation.extract(context.active(), r.ngu_canh);
await tracer.startActiveSpan(`publish ${r.loai}`, {}, cha, async (span) => { ... });
```

> Bài học tổng quát: **mọi chỗ công việc "nhảy" sang một ngữ cảnh khác** (hàng đợi, bảng tạm, job hẹn giờ, cache) đều có thể làm đứt trace. Ngữ cảnh phải đi **cùng** dữ liệu.

### Log có `trace_id`

`PinoInstrumentation` tự thêm vào **mọi** dòng log:

```json
{"service":"kho","trace_id":"c1eb20c8305aa792ceec127ee4c4a634","span_id":"2db66d07…","msg":"xử lý đơn mới"}
```

Log của ba dịch vụ, gom về một chỗ (Loki, ELK…), lọc theo một `trace_id` → toàn bộ câu chuyện. Dán `trace_id` vào Jaeger → thấy cây span.

---

## 4. Metrics với Prometheus (105–140′)

```
Prometheus ──(mỗi 5s) GET /metrics──▶ don-hang, kho, thong-bao, rabbitmq:15692
```

Mô hình **kéo** (pull): dịch vụ chỉ phơi số liệu, Prometheus tự đến lấy. Dịch vụ chết → lần kéo thất bại → **bản thân việc đó là một tín hiệu** (`up == 0`).

### Ba loại metric trong project

| Loại | Metric | Dùng khi |
|---|---|---|
| **Counter** — chỉ tăng | `messages_processed_total{hang_doi, ket_qua}` | Đếm sự kiện; xem **tốc độ** bằng `rate()` |
| **Histogram** — phân bố | `http_request_duration_seconds` | Độ trễ → tính **phân vị** p95, p99 |
| **Gauge** — lên xuống | `outbox_pending`, `db_pool_waiting` | Giá trị tức thời |

### Histogram, không phải trung bình

Nối buổi 44: trung bình che mất 1% request chậm 10 giây. Histogram đếm theo **xô** (`le="0.05"`, `le="0.1"`…); Prometheus tính phân vị từ đó:

```promql
histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[1m])))
```

### Bùng nổ cardinality

```js
// ❌ ketThuc({ route: req.url })          → /don-hang/4ec7259d-…, /don-hang/8f3a…, …
// ✅ ketThuc({ route: req.route?.path })  → /don-hang/:id
```

Mỗi tổ hợp nhãn khác nhau = một chuỗi thời gian riêng trong RAM của Prometheus. Nhãn chứa id đơn → hàng triệu chuỗi → **Prometheus sập**. Quy tắc: nhãn chỉ chứa giá trị thuộc một tập **nhỏ, cố định** (method, route mẫu, status, tên hàng đợi).

### Bão hoà: thứ hay bị quên

```js
qs.gauge('db_pool_waiting', 'Số yêu cầu đang chờ lấy kết nối DB', () => pool.waitingCount);
```

> Metric này được thêm **trong lúc soạn buổi 55**, sau khi trace cho thấy một request mất 2,8 giây chỉ để chờ kết nối DB. Không có nó, dashboard chỉ nói "chậm" mà không nói "vì sao".

---

## 5. Grafana (140–165′)

Mở http://localhost:3301 → *Dashboards* → *Project 5 — Tổng quan microservices*. Datasource và dashboard được **provision** từ file (`ha-tang/grafana/`) — không click tay, commit được vào git.

Chạy `npm run tai` để có số liệu:

```
Gửi 150 đơn trong 442 ms (tất cả 202 — chưa ai biết kết quả)
Sau 1818 ms: { XAC_NHAN: 72, HUY: 78 }
```

Bố cục dashboard:

| Hàng | Nội dung | Vì sao đặt ở đây |
|---|---|---|
| Trên cùng — ô màu | DLQ · Outbox chưa gửi · Message đang chờ · Tỉ lệ 5xx | Nhìn **một giây** biết có chuyện không |
| Giữa | ① Lưu lượng · ② Độ trễ p95/p99 · ③ Lỗi · ④ Bão hoà | Bốn tín hiệu vàng (buổi 43) |
| Dưới | Message theo kết quả · Độ sâu từng hàng đợi | Riêng cho hệ thống hướng sự kiện |

> **📝 Ghi chú giảng viên**
> Hỏi: *"Với kiến trúc hướng sự kiện, độ trễ HTTP p95 của don-hang có nói lên trải nghiệm của khách không?"*
> → **Không đủ.** `POST /don-hang` luôn nhanh (chỉ ghi DB). Khách chờ **cho tới khi đơn XAC_NHAN** — thời gian đó nằm ở độ sâu hàng đợi và thời gian xử lý message. Hệ thống bất đồng bộ cần đo **độ trễ đầu-cuối** (bài tập 3), không chỉ độ trễ HTTP.

---

## 6. Một quy trình gỡ lỗi (165–180′)

Làm cùng lớp, trên hệ thống đang chạy:

```
1. METRICS  — Grafana: ô "Message trong DLQ" chuyển đỏ (1)
2. HÀNG ĐỢI — RabbitMQ UI → thong-bao.don-hang-da-xac-nhan.dlq → Get message
              header x-loi-cuoi: "Email không hợp lệ: \"email-hong\""
              header x-so-lan-thu: 1        ← lỗi vĩnh viễn, không thử lại (đúng)
3. LOG      — lọc level=error, service=thong-bao → có trace_id
4. TRACE    — dán trace_id vào Jaeger → thấy đơn đi từ POST /don-hang, qua kho, tới thong-bao
5. KẾT LUẬN — validate email ở POST /don-hang (400 ngay) thay vì để lọt tới cuối saga
```

> Bước 5 là điều đáng giá nhất: observability không chỉ để **chữa cháy** — nó chỉ ra chỗ thiết kế nên sửa.

---

## 7. Bài tập về nhà

1. **Span tự tạo.** Thêm span `kiem-tra-ton-kho` bao quanh câu `UPDATE san_pham` trong dịch vụ kho, gắn thuộc tính `san_pham.id`, `so_luong`, `ket_qua`. Tìm nó trong Jaeger. Vì sao **không** gắn email khách làm thuộc tính span?

2. **Cảnh báo.** Viết `ha-tang/alerts.yml` cho Prometheus với ba luật: DLQ > 0 trong 5 phút; `outbox_pending` > 100 trong 2 phút; p95 `don-hang` > 500ms trong 5 phút. Cố tình kích hoạt từng cái.

3. **Độ trễ đầu-cuối.** Thêm histogram `order_confirmation_seconds` — từ lúc tạo đơn tới lúc `XAC_NHAN`/`HUY` (tính từ `tao_luc`). Thêm vào dashboard. So với p95 của `POST /don-hang`.

4. **Sampling.** Production không giữ 100% trace. Cấu hình `OTEL_TRACES_SAMPLER=parentbased_traceidratio` với tỉ lệ 0.1. Vì sao phải là *parentbased* — chuyện gì xảy ra nếu mỗi dịch vụ tự quyết định giữ hay bỏ?

5. **Nâng cao.** Thêm Loki + Promtail vào `docker-compose.yml`, gom log ba dịch vụ. Cấu hình Grafana để từ một dòng log bấm thẳng sang trace trong Jaeger (*derived fields*).

---

## 8. Checklist kết thúc buổi

- [ ] Metrics, trace, log — mỗi thứ trả lời câu hỏi gì?
- [ ] Vì sao `tracing.js` phải nạp bằng `--import`? Ba cái bẫy im lặng
- [ ] Vì sao lọc `/metrics`, `/health` và đặt `requireParentSpan`?
- [ ] Trace đi xuyên RabbitMQ bằng gì? Vì sao outbox làm đứt trace và sửa thế nào?
- [ ] Counter, histogram, gauge — dùng khi nào?
- [ ] Bùng nổ cardinality là gì? Cho một nhãn **không** được dùng
- [ ] Vì sao độ trễ HTTP không đủ với hệ thống bất đồng bộ?
- [ ] Quy trình metrics → trace → log để tìm một lỗi

---

**Buổi trước:** [Buổi 53 — Microservices: Outbox & Saga](./buoi-53-microservices-outbox-saga.md)
**Buổi tiếp theo:** [Buổi 55 — Diễn tập sự cố & tổng kết](./buoi-55-dien-tap-su-co.md)
