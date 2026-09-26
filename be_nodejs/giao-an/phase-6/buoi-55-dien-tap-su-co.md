# Buổi 55 — Diễn tập sự cố, postmortem & tổng kết

> **Phase 6** · Hero
> **Mục tiêu:** Cố tình làm hỏng hệ thống trong môi trường an toàn, dùng công cụ của buổi 54 để tìm nguyên nhân **bằng số đo** — và viết postmortem không đổ lỗi.
> **Code thực hành:** [`code/project-05-microservices/`](../../code/project-05-microservices/) — biến `KHO_DO_TRE_MS`, `THONG_BAO_TI_LE_LOI`, [`scripts/tao-tai.js`](../../code/project-05-microservices/scripts/tao-tai.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 54 |
| 15–30′ | Luật chơi diễn tập & vai trò |
| 30–60′ | **Diễn tập 1:** dịch vụ chết |
| 60–90′ | **Diễn tập 2:** dịch vụ chậm — và một kết luận sai suýt được đưa ra |
| 90–115′ | **Diễn tập 3:** bên thứ ba chập chờn |
| 115–130′ | Diễn tập 4 (nhóm tự thiết kế) |
| 130–155′ | **Postmortem không đổ lỗi** |
| 155–180′ | Tổng kết Phase 6 & con đường tiếp theo |

---

## 1. Luật chơi (15–30′)

Chia nhóm 3–4 người, luân phiên vai:

| Vai | Làm gì |
|---|---|
| **Người gây sự cố** | Bí mật chọn và kích hoạt sự cố |
| **Người trực** | Chỉ được dùng Grafana, Jaeger, RabbitMQ UI, log — **không đọc code**, không hỏi |
| **Người ghi chép** | Ghi mốc thời gian: phát hiện lúc nào, giả thuyết gì, đo gì, kết luận gì |

Mỗi diễn tập ghi bốn con số: **thời gian phát hiện**, **thời gian khoanh vùng**, **thời gian khắc phục**, **dữ liệu có mất không**.

> **📝 Ghi chú giảng viên**
> Luật quan trọng nhất: **mọi kết luận phải kèm số đo**. "Em nghĩ là do kho" không được chấp nhận. "p95 của span `kho.don-hang-da-tao process` tăng từ 15ms lên 115ms" thì được.

Trước mỗi diễn tập:

```bash
docker exec hocbe-micro-postgres psql -U hoc -d kho -c "UPDATE san_pham SET ton = 1000 WHERE id='ao-thun'"
```

> Lỗi gặp khi soạn bài: sau vài lượt `npm run tai`, áo thun **hết hàng** → gần như mọi đơn `HUY` → số liệu các lượt sau không so sánh được với nhau. Luôn **đặt lại trạng thái** trước khi đo.

---

## 2. Diễn tập 1 — Dịch vụ chết (30–60′)

Chạy từng dịch vụ trong một terminal riêng. Người gây sự cố **Ctrl+C dịch vụ thông báo**, rồi chạy `npm run tai`.

Người trực quan sát được:

| Nơi | Dấu hiệu |
|---|---|
| Grafana — "Message đang chờ" | tăng dần, không giảm |
| Grafana — Độ sâu hàng đợi | chỉ `thong-bao.don-hang-da-xac-nhan` tăng |
| Prometheus — targets | `host.docker.internal:3203` **down** |
| `GET /don-hang/:id` | vẫn `XAC_NHAN` bình thường |

Khắc phục: bật lại `npm run thong-bao` → hàng đợi rút về 0, email được gửi bù.

**Câu hỏi thảo luận:**
- Khách có bị ảnh hưởng không? → Đặt hàng **không**. Email **trễ**.
- Nếu dịch vụ **kho** chết thay vì thông báo? → Đơn nằm `CHO_XAC_NHAN` (test *"KHO CHẾT"* ở buổi 52). Khách thấy "đang xử lý" lâu bất thường.
- Nếu **RabbitMQ** chết? → Cho lớp **dự đoán** trước, rồi mới thử (diễn tập 4). Lý thuyết outbox nói: đơn vẫn tạo được (chỉ ghi DB + outbox), relay gửi bù khi broker sống lại. Nhưng code hiện tại dùng chiến lược *crash-only*: mất kết nối RabbitMQ → dịch vụ **thoát**; và lúc khởi động nó **bắt buộc** kết nối được RabbitMQ → không lên được cho tới khi broker sống lại. Tức là **đặt hàng hỏng** trong suốt thời gian RabbitMQ chết.

> Hai kịch bản đầu: **không mất dữ liệu**, khách gần như không nhận ra. Kịch bản RabbitMQ: cũng không mất dữ liệu — nhưng **không nhận được đơn mới**. Outbox chỉ phát huy hết giá trị khi dịch vụ **vẫn nhận HTTP** lúc broker chết: HTTP và relay phải độc lập, relay tự kết nối lại. Đó là bài tập tốt nghiệp số 3 (mục 8) — và là ví dụ điển hình về khoảng cách giữa "kiến trúc trên giấy" và "code đang chạy".

---

## 3. Diễn tập 2 — Dịch vụ chậm, và một kết luận sai (60–90′)

```bash
KHO_DO_TRE_MS=100 npm run kho   # (bash) — kho chậm thêm 100ms mỗi đơn
```

### Chuyện gặp thật khi soạn bài

> **📝 Ghi chú giảng viên — kể nguyên văn câu chuyện này, nó là bài học chính của buổi**
>
> Lần đo đầu tiên cho ra:
>
> ```
> Bình thường:     Gửi 300 đơn trong  997 ms
> Kho chậm 100ms:  Gửi 300 đơn trong 5044 ms     ← nhận đơn chậm 5 lần?!
> ```
>
> Kết luận hấp dẫn: *"kho chậm làm chậm cả việc nhận đơn — kiến trúc bất đồng bộ không cô lập được lỗi như lý thuyết!"*
>
> Nhưng lý thuyết nói `POST /don-hang` **không hề** gọi kho. Nên thay vì viết kết luận, ta **mở trace** của request chậm nhất:
>
> ```
> POST /don-hang                3086 ms
>   pg-pool.connect             2794 ms    ← 90% thời gian: CHỜ KẾT NỐI DB
>   pg.query:INSERT don_hang      10 ms
>   pg.query:COMMIT don_hang      30 ms
> ```
>
> Query nhanh. Thời gian mất vào **xếp hàng chờ kết nối** trong pool của chính dịch vụ đơn hàng. Để đo tiếp, ta **thêm metric** `db_pool_waiting` (buổi 54) và lấy mẫu `pg_stat_activity`, rồi **đo lại cả hai kịch bản**:
>
> ```
> Bình thường:     Gửi 300 đơn trong 792 ms    ngã ngũ sau 3025 ms    db_pool_waiting tối đa 30
> Kho chậm 100ms:  Gửi 300 đơn trong 863 ms    ngã ngũ sau 4495 ms    db_pool_waiting tối đa 31
> ```
>
> Con số 5044 ms **không tái hiện được**. Kho chậm **không** làm chậm nhận đơn (792 → 863 ms, trong mức dao động); nó chỉ làm **thời gian ngã ngũ** tăng (3,0 → 4,5 giây) — đúng như lý thuyết.
>
> Và phát hiện thật sự: pool DB bão hoà **ở cả hai kịch bản** — 30 client song song, pool 10 kết nối. Kết nối bận chủ yếu ở trạng thái `idle in transaction`: đang giữ transaction trong khi Node chờ vòng mạng tới Postgres.

### Bài học

1. **Một lần đo không phải kết luận** (nối buổi 44). Lần đo đầu có thể dính khởi động nguội, dữ liệu cũ, tiến trình khác tranh tài nguyên.
2. **Trace chỉ ra chỗ tìm, metric xác nhận quy mô.** Không có trace, ta đã "sửa" kho — thứ không có lỗi.
3. **Thiếu metric thì thêm metric.** Dashboard không trả lời được câu hỏi → dashboard thiếu, không phải câu hỏi sai.
4. **Viết lại kết luận khi số liệu nói khác.** Bài giảng này ban đầu định dạy "kho chậm làm nghẽn cả hệ thống". Số liệu nói không.

### Thảo luận: pool bão hoà thì sửa thế nào?

| Phương án | Đánh đổi |
|---|---|
| Tăng `max` của pool | Postgres có giới hạn kết nối tổng; nhiều bản sao × pool lớn = cạn (buổi 20, 42) |
| Rút ngắn transaction | Mỗi vòng mạng trong transaction = thời gian giữ kết nối. Gộp query, bỏ query thừa |
| Giới hạn đồng thời ở tầng HTTP | Trả 503 sớm thay vì để request xếp hàng 3 giây |
| Tách pool: HTTP và consumer | Consumer chậm không chiếm kết nối của HTTP |

> Không có đáp án duy nhất. Chọn một, **đo lại**, so sánh.

---

## 4. Diễn tập 3 — Bên thứ ba chập chờn (90–115′)

```bash
THONG_BAO_TI_LE_LOI=0.3 npm run thong-bao   # SMTP lỗi ngẫu nhiên 30%
```

Số đo thật với 200 đơn:

```
messages_processed_total{ket_qua="thanh_cong"} 99
messages_processed_total{ket_qua="thu_lai"}    29
messages_processed_total{ket_qua="dlq"}         4
```

Người trực phải trả lời:

1. **Có mất email không?** → 99 + 4 = 103 = đúng số đơn `XAC_NHAN`. Không mất.
2. **Có gửi trùng không?** → `SELECT count(*), count(DISTINCT don_hang_id) FROM email_da_gui` → `594 | 594`. Không trùng.
3. **4 message trong DLQ là do SMTP?** → Mở DLQ, đọc `x-loi-cuoi`: *"Email không hợp lệ"*. **Không** — đó là email hỏng mà script tạo tải cố tình sinh ra (~2%). Lỗi SMTP tạm thời đều được **thử lại thành công**.

> Câu 3 là cái bẫy: DLQ có message ngay sau khi bật lỗi SMTP → dễ kết luận "SMTP làm rơi email". Đọc header mới thấy hai chuyện **không liên quan**. *Tương quan không phải nhân quả.*

---

## 5. Diễn tập 4 — Nhóm tự thiết kế (115–130′)

Mỗi nhóm chọn một, dự đoán **trước** điều sẽ xảy ra, rồi làm và so sánh:

- `docker restart hocbe-micro-rabbitmq` giữa lúc `npm run tai` đang chạy
- `docker stop hocbe-micro-postgres` 10 giây
- Publish tay một message rác vào `kho.don-hang-da-tao` từ RabbitMQ UI
- Chạy **hai** bản sao dịch vụ kho, tắt một bản giữa chừng

> **📝 Ghi chú giảng viên**
> Với kịch bản RabbitMQ khởi động lại: các dịch vụ sẽ **thoát** (chiến lược crash-only trong `dich-vu.js`) — và không có gì khởi động lại chúng vì ta đang chạy tay. Đó là câu hỏi hay cho lớp: *"Ở production, cái gì khởi động lại chúng?"* → Docker `restart: unless-stopped`, Kubernetes, PM2 (buổi 42).

---

## 6. Postmortem không đổ lỗi (130–155′)

Mỗi nhóm viết postmortem cho **một** diễn tập, theo mẫu:

```markdown
## Tóm tắt
Một câu: chuyện gì, bao lâu, ai bị ảnh hưởng.

## Dòng thời gian (giờ:phút)
- 14:02 kích hoạt sự cố
- 14:05 ô DLQ chuyển đỏ — PHÁT HIỆN (3 phút)
- 14:09 xác định hàng đợi thong-bao — KHOANH VÙNG (4 phút)
- 14:11 khôi phục — KHẮC PHỤC (2 phút)

## Tác động
Số đơn / email bị ảnh hưởng. Dữ liệu có mất không — kèm truy vấn chứng minh.

## Nguyên nhân gốc
Hỏi "vì sao" 5 lần. Dừng ở chỗ HỆ THỐNG, không dừng ở CON NGƯỜI.

## Điều gì đã hoạt động tốt

## Hành động (có người chịu trách nhiệm, có hạn)
- [ ] ...
```

> **📝 Ghi chú giảng viên**
> "Không đổ lỗi" không có nghĩa là không ai chịu trách nhiệm. Nghĩa là: *"Anh A deploy code lỗi"* là **triệu chứng**; nguyên nhân gốc là *"vì sao hệ thống cho phép code lỗi tới production mà không bị chặn?"* — thiếu test, thiếu canary, thiếu cảnh báo. Người sau cũng sẽ mắc cùng lỗi nếu chỉ sửa người.

---

## 7. Tổng kết Phase 6 (155–180′)

### Những gì đã thêm vào bộ công cụ

| Buổi | Kỹ năng | Một câu để nhớ |
|---|---|---|
| 49 | Design pattern & SOLID | Nhận ra vấn đề trước, gọi tên pattern sau |
| 50 | OAuth2 / OIDC | Trình duyệt chỉ cầm `code`; định danh bằng `(iss, sub)` |
| 51 | Thanh toán & webhook | Webhook cho tốc độ, đối soát cho sự đúng đắn |
| 52 | RabbitMQ | Durable + persistent + confirm; ack sau cùng |
| 53 | Outbox & Saga | Không có transaction chung → ít nhất một lần + idempotent |
| 54 | Observability | Metrics báo động, trace khoanh vùng, log giải thích |
| 55 | Diễn tập sự cố | Mọi kết luận phải kèm số đo — và đo lại |

### Mạch xuyên suốt cả khoá học

Một ý tưởng xuất hiện **năm lần** dưới năm cái tên:

| Buổi | Tên | Dạng |
|---|---|---|
| 07 | Giới hạn song song | `Promise.all` có giới hạn |
| 20 | Connection pool | `max: 10` |
| 26 | Worker concurrency | `concurrency: 5` |
| 52 | Prefetch | `ch.prefetch(10)` |
| 55 | Pool bão hoà | `db_pool_waiting` |

Và một ý tưởng khác, **bốn lần**: *làm sao để làm một việc đúng một lần khi hệ thống chỉ hứa "ít nhất một lần"* — idempotency key (24), job idempotent (26), webhook dedup (51), inbox (53).

> Senior không phải người biết nhiều công cụ hơn. Là người nhận ra **cùng một vấn đề** khi nó đổi tên.

### Con đường tiếp theo

| Hướng | Học gì tiếp |
|---|---|
| Hạ tầng | Kubernetes, Terraform, một cloud (AWS/GCP) ở mức triển khai được Project 5 |
| Dữ liệu | Postgres nâng cao (EXPLAIN ANALYZE, partition, replication), Kafka, CDC (Debezium — outbox không cần relay) |
| Kiến trúc | Domain-Driven Design, event sourcing, CQRS — **chỉ khi** gặp vấn đề chúng giải quyết |
| Độ tin cậy | SLO/error budget, chaos engineering có hệ thống, on-call |
| Ngôn ngữ thứ hai | Go hoặc Java — thấy cùng khái niệm dưới hình thức khác (repo có sẵn `be_java/`) |

---

## 8. Bài tập tốt nghiệp Phase 6

Chọn **một**:

1. **Đưa Project 5 lên production thu nhỏ.** Docker hoá cả ba dịch vụ, `restart: unless-stopped`, deploy lên một VPS. Chạy lại cả bốn diễn tập **trên máy thật**. Viết postmortem cho diễn tập tệ nhất.

2. **Hợp nhất Phase 6 vào capstone.** Thêm vào capstone (buổi 47–48): đăng nhập OIDC, thanh toán có webhook + đối soát, và **ít nhất một** luồng bất đồng bộ qua RabbitMQ có outbox. Kèm dashboard và một postmortem.

3. **Tách HTTP khỏi broker.** Sửa `shared/dich-vu.js` để dịch vụ đơn hàng **khởi động và nhận đơn được khi RabbitMQ đang chết**: HTTP lên ngay, relay/consumer tự kết nối lại với backoff, `/health/ready` phản ánh đúng trạng thái. Chứng minh bằng diễn tập: tắt RabbitMQ, đặt 50 đơn, bật lại — cả 50 đơn ngã ngũ.

4. **Phản biện.** Viết lại Project 5 thành **một** dịch vụ (monolith có module rõ ràng, vẫn dùng outbox cho email). So sánh số dòng code, số test, thời gian ngã ngũ đơn hàng, và độ khó gỡ lỗi. Kết luận: với quy mô này, kiến trúc nào đúng? Bảo vệ bằng số liệu.

---

## 9. Checklist kết thúc Phase 6

- [ ] Kể lại một lần kết luận sai suýt được đưa ra ở buổi này, và điều gì ngăn nó lại
- [ ] Dịch vụ chết / chậm / bên thứ ba chập chờn — mỗi cái hiện ra ở đâu trên dashboard?
- [ ] Theo lý thuyết outbox, RabbitMQ chết thì đơn vẫn tạo được — vì sao code hiện tại lại không? Sửa thế nào?
- [ ] Bốn con số cần ghi cho mỗi sự cố
- [ ] Postmortem "không đổ lỗi" dừng "5 lần vì sao" ở đâu?
- [ ] Năm cái tên của cùng một ý tưởng "giới hạn song song"
- [ ] Bốn cách đã học để xử lý "ít nhất một lần"

---

## 🎓 Kết thúc Phase 6

**55 buổi · 6 phase · 5 project · hơn 180 test**

Từ `http.createServer` tới một hệ thống phân tán tự phục hồi sau sự cố — và biết **chứng minh** điều đó bằng số đo.

---

**Buổi trước:** [Buổi 54 — Observability](./buoi-54-observability.md)
**Quay lại:** [Mục lục giáo án](../README.md)
