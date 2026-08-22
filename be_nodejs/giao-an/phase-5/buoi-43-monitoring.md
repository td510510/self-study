# Buổi 43 — Monitoring & health check

> **Phase 5** · Production-ready
> **Mục tiêu:** Biết hệ thống đang khoẻ hay không **mà không cần SSH vào server đọc log tay**.
> **Code:** [`src/health.controller.ts`](../../code/project-04-nestjs/src/health.controller.ts) · [`src/lib/logger.js`](../../code/project-02-ecommerce/src/lib/logger.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 42 |
| 15–65′ | **Health check: liveness vs readiness** |
| 65–110′ | Bốn tín hiệu vàng — đo cái gì |
| 110–150′ | Log tập trung & truy vết bằng `requestId` |
| 150–175′ | **Cảnh báo: ngưỡng nào, và alert fatigue** |
| 175–180′ | Bài tập |

---

## 1. Trọng tâm: health check (15–65′)

### Health check tồi

```js
app.get('/health', (req, res) => res.json({ status: 'ok' }));
```

Hỏi lớp: *"Endpoint này trả `200` khi nào?"*

> **Khi tiến trình Node còn sống.** Chỉ vậy thôi.
>
> Database chết? Vẫn `200`. Redis chết? Vẫn `200`. Hết kết nối pool? Vẫn `200`.
>
> Load balancer thấy `200` nên **tiếp tục gửi traffic** vào một server không phục vụ được gì.

### Health check đúng

```ts
@Get()
async kiemTra() {
  let db = 'ok';
  try {
    await this.prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'loi';
  }

  return {
    trangThai: db === 'ok' ? 'ok' : 'suy-giam',
    database: db,
    thoiGianChay: Math.round(process.uptime()),
  };
}
```

> Kiểm cả **phụ thuộc**, không chỉ *"tiến trình còn sống"*.

### Ba loại probe

| Loại | Trả lời | Hỏng thì |
|---|---|---|
| **Liveness** | *"tiến trình còn sống không?"* | **khởi động lại** container |
| **Readiness** | *"sẵn sàng nhận traffic chưa?"* | **rút** khỏi load balancer, không restart |
| **Startup** | *"khởi động xong chưa?"* | chờ thêm, chưa vội kết luận |

> **📝 Ghi chú giảng viên — phân biệt này quan trọng**
>
> Nhầm liveness với readiness gây **thảm hoạ**: database chết → liveness fail → Kubernetes restart **toàn bộ** pod → chúng khởi động lại, vẫn không có database, lại fail → **vòng lặp restart vô tận** trong khi vấn đề thật nằm ở database.
>
> Đúng ra: database chết là **readiness** fail (rút khỏi LB), còn liveness vẫn xanh (tiến trình khoẻ, chỉ là không phục vụ được).

Và nhớ buổi 08 — khi đang tắt tử tế:

```js
res.status(dangTat() ? 503 : 200)
```

> Trả `503` khi đang tắt → load balancer **ngừng gửi request mới** trước khi ta đóng cổng. Nếu không, có một khoảng ngắn request bị rơi.

### Health check không được nặng

> Health check bị gọi **mỗi 5–10 giây**, từ **mỗi** bản sao, bởi **mỗi** hệ thống giám sát.
>
> Đừng truy vấn nặng trong đó. `SELECT 1` là đủ. Và **cache** kết quả vài giây nếu cần kiểm nhiều thứ.
>
> Nối lại buổi 18: log health check ở mức `debug`, không phải `info` — nếu không nó làm ngập log.

---

## 2. Bốn tín hiệu vàng (65–110′)

Đo cái gì? Không phải mọi thứ — bốn thứ này trả lời được hầu hết câu hỏi:

| Tín hiệu | Nghĩa | Đo ở đâu |
|---|---|---|
| **Latency** | request mất bao lâu | log `msec` (buổi 18) |
| **Traffic** | bao nhiêu request/giây | đếm log |
| **Errors** | tỷ lệ 5xx | log `level: error` |
| **Saturation** | tài nguyên còn bao nhiêu | RAM, CPU, **pool database** |

### Latency phải đo bằng phân vị, không phải trung bình

> Nhắc lại buổi 44 (đo tải):
>
> Trung bình 100ms có thể là: mọi người 100ms, **hoặc** 90% người 20ms và 10% người 800ms.
>
> Hai hệ thống đó **khác hẳn** nhau, nhưng trung bình giống nhau.

Số liệu thật từ Project 2:

```
  kịch bản                          |    RPS |   p50 |   p95 |   p99
  /health (không DB)                |   4767 |    3ms |   14ms |   18ms
  /san-pham (có cache)              |   3305 |    5ms |    9ms |   10ms
  /san-pham (cache MISS mọi lần)    |    876 |   21ms |   34ms |   39ms
```

> `p99` là **1% chậm nhất**. Với 1 triệu request/ngày, đó là **10.000 người**. Không phải "trường hợp hiếm".

### Saturation — chỉ số hay bị bỏ quên

| Đo gì | Vì sao |
|---|---|
| Kết nối pool đang dùng / tổng | buổi 20 — pool cạn là mọi thứ đứng |
| Độ trễ Event Loop | buổi 02 — có ai chặn luồng không |
| RAM heap | buổi 06 — rò rỉ hay nạp file quá lớn |
| Số job trong hàng đợi | buổi 26 — worker có theo kịp không |

> Saturation là chỉ số **báo trước**. Latency tăng nghĩa là **đã** có vấn đề; pool sắp cạn nghĩa là **sắp** có vấn đề.

---

## 3. Log tập trung & truy vết (110–150′)

Nhắc lại buổi 18 — log là JSON có cấu trúc:

```json
{"level":"warn","time":"2026-08-21T16:59:08.472Z","req":{"method":"GET","url":"/san-pham?trang=0","ip":"::1"},"ma":"DU_LIEU_SAI","status":400,"msg":"Lỗi vận hành: Dữ liệu không hợp lệ"}
```

> Nhờ JSON, công cụ (Loki, Datadog, CloudWatch) **lọc và thống kê** được:
>
> ```
> level="error" AND status=500      → đếm lỗi server
> msec > 1000                        → tìm request chậm
> ma="HET_HANG"                      → thống kê sản phẩm hết hàng
> ```

### `requestId` — sợi chỉ xuyên suốt

```
Người dùng báo lỗi
  → đọc requestId trong response
  → grep log
  → thấy TOÀN BỘ ngữ cảnh: ai gọi, gọi gì, lỗi ở đâu
```

> Nối lại buổi 11, 18, 23: `X-Request-Id` được sinh ở middleware đầu tiên, trả về qua header, kèm trong **mọi** response lỗi, và có mặt trong **mọi** dòng log của request đó.
>
> Và nhớ `exposedHeaders` ở buổi 23 — thiếu nó thì frontend **không đọc được** header này.

### Truy vết xuyên nhiều service

> Khi có nhiều service, `requestId` phải được **chuyển tiếp**:
>
> ```js
> req.id = req.headers['x-request-id'] ?? randomUUID();
> ```
>
> Tôn trọng id do bên gọi gửi xuống → một request đi qua 5 service vẫn cùng một id. Đây là nền của **distributed tracing** (OpenTelemetry).

---

## 4. Trọng tâm: cảnh báo (150–175′)

> **📝 Ghi chú giảng viên — phần quyết định monitoring có dùng được hay không**

### Alert fatigue

Nhắc lại buổi 18:

```js
if (err || res.statusCode >= 500) return 'error';
if (res.statusCode >= 400) return 'warn';    // ← 4xx KHÔNG phải error
```

> Nếu cảnh báo kêu **500 lần/ngày** vì lỗi `400` bình thường, thì đến lúc có bug thật **không ai còn để ý**.
>
> **Một cảnh báo bị bỏ qua tệ hơn không có cảnh báo** — vì nó tạo ảo giác an toàn.

### Ba nguyên tắc đặt cảnh báo

| Nguyên tắc | Ví dụ |
|---|---|
| **Cảnh báo theo TRIỆU CHỨNG, không theo nguyên nhân** | "p95 > 2s" thay vì "CPU > 80%" |
| **Mỗi cảnh báo phải HÀNH ĐỘNG ĐƯỢC** | nếu nhận rồi không làm gì thì đừng cảnh báo |
| **Dùng NGƯỠNG + THỜI GIAN** | "tỷ lệ 5xx > 1% trong 5 phút liên tục" |

> Vì sao cần "trong 5 phút"? Vì một spike 3 giây lúc deploy là **bình thường**. Cảnh báo tức thì sẽ kêu mỗi lần deploy.

### Bảng cảnh báo khởi điểm

| Cảnh báo | Ngưỡng | Mức |
|---|---|---|
| Tỷ lệ 5xx | > 1% trong 5 phút | 🔴 gọi điện |
| p95 latency | > 2s trong 10 phút | 🟡 báo Slack |
| Health check đỏ | 3 lần liên tiếp | 🔴 gọi điện |
| Pool database | > 90% trong 5 phút | 🟡 báo Slack |
| Job thất bại (buổi 26) | > 10 job | 🟡 báo Slack |
| Đĩa còn trống | < 15% | 🟡 báo Slack |
| Chứng chỉ TLS hết hạn | còn < 14 ngày | 🟡 báo Slack |

> Hai dòng cuối là những thứ **hay quên nhất** — và gây sự cố kiểu *"tự nhiên sáng thứ Hai site chết"*.

---

## 5. Bài tập về nhà

1. **Health check đầy đủ.** Nâng cấp `/health` của Project 2 kiểm cả database, Redis, và hàng đợi. Trả `503` nếu bất kỳ cái nào chết.

2. **Tách liveness/readiness.** Thêm `/health/live` (chỉ kiểm tiến trình) và `/health/ready` (kiểm phụ thuộc). Giải thích cấu hình Kubernetes nên dùng cái nào cho probe nào.

3. **Đo Event Loop lag.** Đưa `monitorLag()` từ buổi 02 vào Project 2, đưa số liệu vào `/health`. Gọi endpoint chặn luồng và quan sát.

4. **Đo pool.** Thêm chỉ số "kết nối đang dùng / tổng" vào `/health`. Chạy `demo-pool.js` (buổi 20) song song và theo dõi.

5. **Truy vết bằng requestId.** Gây một lỗi 500, lấy `requestId` từ response, rồi `grep` log tìm **mọi** dòng của request đó. Viết lại quy trình như một hướng dẫn cho người trực.

6. **Nâng cao — Prometheus + Grafana.** Thêm `prom-client`, expose `/metrics`, dựng Grafana bằng Docker. Vẽ đồ thị bốn tín hiệu vàng.

---

## 6. Checklist kết thúc buổi

- [ ] Health check trả `200` vô điều kiện thì vô dụng ở chỗ nào?
- [ ] Liveness và readiness khác nhau thế nào? Nhầm thì hậu quả gì?
- [ ] Vì sao health check phải nhẹ và log ở mức `debug`?
- [ ] Kể bốn tín hiệu vàng.
- [ ] Vì sao không dùng trung bình cho latency?
- [ ] `p99` với 1 triệu request/ngày là bao nhiêu người?
- [ ] Saturation khác Latency ở chỗ nào về mặt "báo trước"?
- [ ] `requestId` giải quyết vấn đề gì?
- [ ] Alert fatigue là gì? Ba nguyên tắc đặt cảnh báo?

---

**Buổi trước:** [Buổi 42 — Deploy thực chiến: Nginx + PM2](./buoi-42-nginx-pm2.md)
**Buổi tiếp theo:** Buổi 44 — Performance & Load testing
