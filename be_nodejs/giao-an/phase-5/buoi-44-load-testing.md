# Buổi 44 — Performance & Load testing

> **Phase 5** · Production-ready
> **Mục tiêu:** Đo hiệu năng bằng **số liệu** thay vì cảm giác "chắc là ổn" — và biết khi nào số liệu của mình là **vô nghĩa**.
> **Code:** [`benchmark/do-tai.mjs`](../../code/project-02-ecommerce/benchmark/do-tai.mjs)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 43 |
| 15–55′ | Đọc số liệu: phân vị, không phải trung bình |
| 55–110′ | **Ba lần đo sai — và cách phát hiện** |
| 110–150′ | Kết quả thật: tác động của cache |
| 150–175′ | Khoanh vùng nút thắt & scale ngang |
| 175–180′ | Bài tập |

---

## 1. Đọc số liệu (15–55′)

```bash
BAT_RATE_LIMIT=false NODE_ENV=production node --env-file=.env src/server.js   # terminal 1
node benchmark/do-tai.mjs                                                      # terminal 2
```

| Chỉ số | Nghĩa |
|---|---|
| **RPS** | request phục vụ được mỗi giây |
| **p50** | nửa số người dùng nhanh hơn con số này |
| **p95** | 95% nhanh hơn — **con số đáng quan tâm nhất** |
| **p99** | 1% chậm nhất |
| **max** | trường hợp tệ nhất |

> **⚠️ ĐỪNG DÙNG TRUNG BÌNH.**
>
> Trung bình 100ms có thể là: mọi người 100ms, **hoặc** 90% người 20ms và 10% người 800ms.
>
> Hai hệ thống đó khác hẳn nhau về trải nghiệm, nhưng trung bình giống hệt.

> Hỏi lớp: *"p99 = 500ms. Với 1 triệu request/ngày, bao nhiêu người chờ hơn nửa giây?"*
> → **10.000 người.** Không phải "trường hợp hiếm".

---

## 2. Trọng tâm: ba lần đo sai (55–110′)

> **📝 Ghi chú giảng viên**
> Phần này kể lại **đúng** ba lần đo sai khi soạn bài. Nó dạy về **phương pháp** nhiều hơn về công cụ — và là bài học giá trị nhất buổi học.

### Lần 1 — Đo trúng rate limiter

```
  kịch bản                          |    RPS |   p50 |   p95
  /health (không DB)                |   3065 |    5ms |   10ms
  /san-pham (có cache)              |   3164 |    5ms |    9ms
  /san-pham (cache MISS mọi lần)    |   3171 |    5ms |    9ms
```

Nhìn qua thì đẹp. **Nhưng cả ba giống hệt nhau** — đó là dấu hiệu.

Kiểm tra log server:

```
WARN: Lỗi vận hành: Quá nhiều request, thử lại sau 36 giây
ma: "QUA_NHIEU_REQUEST"  status: 429
```

> Rate limit đặt **300 request/phút** (buổi 23), còn autocannon bắn **3000/giây**. Gần như **toàn bộ** response là `429`.
>
> **Ta đang đo bộ giới hạn, không phải ứng dụng.**

### Lần 2 — Đo trúng logger

Tắt rate limit, vẫn có ~27.000 response lỗi. Chạy lại với `NODE_ENV=production` → **0 lỗi**.

> Nguyên nhân: `pino-pretty` ở chế độ development chạy trong **worker thread**, không theo kịp vài nghìn request/giây (buổi 18).
>
> **Bài học: luôn benchmark ở chế độ production.** Cấu hình dev tồn tại để giúp *con người* đọc, không phải để chạy nhanh.

### Lần 3 — Đo trúng lỗi 404

Vẫn còn lỗi ở hai kịch bản. Tách từng loại:

```
errors: 0   timeouts: 0   non2xx: 17318
1xx/2xx/3xx/4xx/5xx: 0 0 0 17318 0
```

**Toàn bộ là 4xx.** Nhưng `curl` cùng URL trả `200`.

Thử hai cách gọi:

```
url + path   → 2xx:     0   4xx: 10200
url đầy đủ   → 2xx: 15087   4xx:     0
```

> autocannon **bỏ qua** tuỳ chọn `path` khi đã có `url` → nó gọi `/` → `404`.
>
> **Ta đang đo tốc độ trả về trang 404.**

### Bài học chung

> **Số liệu có lỗi là số liệu VÔ NGHĨA. Đừng bao giờ báo cáo nó.**

Ba dấu hiệu phải kiểm **trước** khi tin bất kỳ kết quả benchmark nào:

| Dấu hiệu | Nghĩa |
|---|---|
| Có response không phải 2xx | đang đo sai thứ |
| Các kịch bản khác nhau cho số liệu **giống hệt** | có gì đó chặn trước khi tới app |
| Số liệu "đẹp bất thường" | thường là đang đo đường tắt |

Vì vậy benchmark của khoá học **luôn in cột lỗi**:

```js
const tongLoi = ketQua.reduce((s, r) => s + r.loi, 0);
if (tongLoi > 0) {
  console.log(`🚨 CÓ ${tongLoi} RESPONSE KHÔNG PHẢI 2xx.  ...`);
}
```

---

## 3. Kết quả thật (110–150′)

Sau khi sửa cả ba lỗi:

```
  kịch bản                          |    RPS |   p50 |   p95 |   p99 |   max | lỗi
  ----------------------------------|--------|-------|-------|-------|-------|-----
  /health (không DB)                |   4767 |    3ms |   14ms |   18ms |   33ms |    0
  /san-pham (có cache)              |   3305 |    5ms |    9ms |   10ms |   16ms |    0
  /san-pham (cache MISS mọi lần)    |    876 |   21ms |   34ms |   39ms |   61ms |    0
```

### Cache cho 3.8× throughput

| | có cache | luôn miss | tỷ lệ |
|---|---|---|---|
| RPS | 3305 | 876 | **3.8×** |
| p95 | 9ms | 34ms | **3.8×** |

> Nối lại buổi 21: ở đó ta đo cache HIT nhanh gấp **58 lần** MISS ở mức **một truy vấn**. Ở đây, dưới tải thật, lợi ích quy ra throughput là **3.8 lần** — vì còn nhiều chi phí khác (HTTP, JSON, middleware) không được cache che.
>
> **Bài học: lợi ích ở mức vi mô không dịch thẳng thành lợi ích ở mức hệ thống.** Luôn đo ở mức hệ thống.

### ⚠️ Một cái bẫy nữa: kịch bản "cache miss" giả

Bản đầu tiên của kịch bản thứ ba xoay vòng **50 khoá**:

```js
setupRequest: (req) => ({ ...req, path: `/san-pham?moiTrang=${(dem++ % 50) + 1}` })
```

Kết quả: **3311 RPS** — gần bằng kịch bản có cache. Vì sau vài giây, cả 50 khoá **đã nằm trong cache**.

Sửa để mỗi request một khoá mới:

```js
setupRequest: (req) => ({ ...req, path: `/san-pham?trang=${++dem}&moiTrang=20` })
```

→ **876 RPS**. Giờ mới là cache miss thật.

> Hỏi lớp: *"Nếu không phát hiện, ta sẽ kết luận gì?"*
> → *"Cache không có tác dụng gì"* — và có thể **gỡ bỏ** cả tầng cache.

---

## 4. Khoanh vùng nút thắt (150–175′)

Khi p95 cao, kiểm theo thứ tự:

| Bước | Công cụ | Nối lại buổi |
|---|---|---|
| 1. Có N+1 không? | đếm query | 13 |
| 2. Có `Seq Scan` không? | `EXPLAIN ANALYZE` | 19 |
| 3. Pool có cạn không? | đo thời gian chờ kết nối | 20 |
| 4. Event Loop có bị chặn? | `monitorLag()` | 02 |
| 5. Có transaction dài? | log thời gian transaction | 19, 20 |
| 6. Offset phân trang sâu? | đo theo số trang | 20 |

> **Đừng tối ưu trước khi đo.** Trực giác về hiệu năng sai rất thường xuyên — ba lần đo sai ở trên là bằng chứng.

### Scale ngang giải quyết được gì

| Thêm bản sao **giúp** | Thêm bản sao **không giúp** |
|---|---|
| CPU của app là nút thắt | **database** là nút thắt |
| Nhiều request nhẹ đồng thời | một truy vấn chậm |
| | rate limit theo IP dùng RAM (buổi 21) |
| | WebSocket không có Redis adapter (buổi 25) |
| | job lặp bằng `cron` OS chạy N lần (buổi 26) |

> **⚠️ Và nhớ buổi 42:** thêm bản sao làm **tăng** tổng kết nối database. 8 bản sao × pool 20 = 160 > trần 100.
>
> Scale ngang mà không nghĩ tới database thường làm **mọi thứ tệ hơn**.

### Số liệu này KHÔNG phải production

> Đo trên máy dev: client và server **cùng máy**, không có độ trễ mạng, dữ liệu ít, không có người dùng thật.
>
> **Dùng để so sánh TRƯỚC/SAU khi tối ưu. KHÔNG dùng để hứa hẹn năng lực với khách hàng.**

---

## 5. Bài tập về nhà

1. **Tự tái hiện ba lỗi.** Bật lại rate limit và đo — số liệu thế nào? Rồi chạy ở `NODE_ENV=development` và đo. Rồi dùng `url + path`. Ghi lại cả ba.

2. **Đo tác động của index.** Xoá index `@@index([danhMucId])`, đo lại endpoint lọc theo danh mục. Thêm lại và đo. Chênh bao nhiêu ở p95?

3. **Đo trước/sau khi tối ưu.** Tạo một endpoint có N+1 (buổi 13), đo. Sửa bằng `include`, đo lại. Lập bảng RPS và p95.

4. **Tìm điểm gãy.** Tăng `connections` dần: 10, 50, 100, 200, 500. Vẽ đồ thị RPS và p95 theo số kết nối. Điểm nào RPS ngừng tăng mà p95 vọt lên? Đó là **năng lực thật** của hệ thống.

5. **Đo endpoint ghi.** Benchmark `POST /don-hang` (có transaction + khoá dòng, buổi 19). RPS thấp hơn endpoint đọc bao nhiêu lần? Vì sao?

6. **Nâng cao — k6.** Viết kịch bản k6 mô phỏng hành vi thật: đăng nhập → xem sản phẩm → thêm giỏ → đặt hàng, với thời gian nghỉ giữa các bước. So sánh với autocannon: cái nào phản ánh tải thật hơn?

---

## 6. Checklist kết thúc buổi

- [ ] Vì sao không dùng trung bình cho latency?
- [ ] p99 = 500ms với 1 triệu request/ngày là bao nhiêu người?
- [ ] Ba dấu hiệu cho biết số liệu benchmark đang sai?
- [ ] Vì sao phải benchmark ở `NODE_ENV=production`?
- [ ] Vì sao kịch bản "cache miss" xoay vòng 50 khoá là sai?
- [ ] Cache cho throughput cao hơn bao nhiêu lần trong phép đo này?
- [ ] Vì sao lợi ích 58× ở mức truy vấn chỉ thành 3.8× ở mức hệ thống?
- [ ] Kể 4 trường hợp scale ngang **không** giúp được gì.
- [ ] Vì sao số liệu đo ở máy dev không dùng để hứa với khách hàng?

---

**Buổi trước:** [Buổi 43 — Monitoring & health check](./buoi-43-monitoring.md)
**Buổi tiếp theo:** Buổi 45 — System Design nhập môn
