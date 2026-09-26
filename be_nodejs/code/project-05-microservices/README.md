# Project 5 — Microservices hướng sự kiện

Dùng cho **buổi 52–55** (Phase 6). Ba dịch vụ Node độc lập nói chuyện với nhau **chỉ qua RabbitMQ**,
mỗi dịch vụ một database, quan sát bằng OpenTelemetry + Prometheus + Grafana.

```
                         ┌──────────────── exchange "su-kien" (topic) ────────────────┐
  POST /don-hang         │                                                            │
 ───────────▶ ĐƠN HÀNG ──┼─ don-hang.da-tao ──▶ KHO ──┬─ kho.da-giu ───▶ ĐƠN HÀNG ──┼─ don-hang.da-xac-nhan ─▶ THÔNG BÁO
   :3201     (don_hang)  │                  (kho)     └─ kho.het-hang ─▶ ĐƠN HÀNG   │                        (thong_bao)
   202 ngay              │                                               (HUY)     │                          :3203
                         └────────────────────────────────────────────────────────────┘
```

## Chạy

```bash
docker compose up -d        # Postgres, RabbitMQ, Jaeger, Prometheus, Grafana
npm install
cp .env.example .env
npm run tat-ca              # cả ba dịch vụ trong một terminal (Ctrl+C tắt êm)
npm run tai                 # bắn 200 đơn để có số liệu
npm test                    # 12 test tích hợp — TẮT `npm run tat-ca` trước!
```

| Giao diện | URL |
|---|---|
| RabbitMQ (hoc/hoc) | http://localhost:15673 |
| Jaeger — trace | http://localhost:16686 |
| Prometheus | http://localhost:9091 |
| Grafana — dashboard "Project 5 — Tổng quan" | http://localhost:3301 |

Chạy riêng từng dịch vụ (để diễn tập "một dịch vụ chết"): `npm run don-hang`, `npm run kho`, `npm run thong-bao`.

## Bản đồ kỹ thuật

| Kỹ thuật | Ở đâu | Buổi |
|---|---|---|
| Exchange topic, hàng đợi durable, message persistent, publisher confirm | `shared/mq.js` | 52 |
| `prefetch`, ack sau cùng, retry qua hàng đợi TTL, DLQ | `shared/mq.js` → `tieuThu` | 52 |
| **Transactional Outbox** + relay `FOR UPDATE SKIP LOCKED` | `shared/outbox.js` | 53 |
| **Idempotent consumer** (inbox) | `shared/db.js` → `xuLyMotLan` | 53 |
| **Saga** (choreography) + bù trừ | `services/*/app.js` | 53 |
| Database-per-service | `ha-tang/postgres-init.sql` | 53 |
| OpenTelemetry: HTTP, Express, pg, **amqplib**, pino | `shared/tracing.js` | 54 |
| Trace xuyên outbox (lưu `traceparent` trong bảng) | `shared/outbox.js` | 54 |
| Metrics: histogram, counter, gauge pool/outbox | `shared/quan-sat.js`, `shared/dich-vu.js` | 54 |
| Liveness / readiness, graceful shutdown đúng thứ tự | `shared/dich-vu.js` | 43, 08 |
| Biến môi trường gây sự cố | `KHO_DO_TRE_MS`, `THONG_BAO_TI_LE_LOI` | 55 |

## 12 test tích hợp (Postgres + RabbitMQ thật)

```
ok 1 - còn hàng → XAC_NHAN, kho trừ tồn, email gửi đúng một lần
ok 2 - hết hàng → HUY kèm lý do (bù trừ của saga)
ok 3 - sản phẩm không tồn tại → HUY
ok 4 - dữ liệu sai → 400 ngay, không sinh sự kiện
ok 5 - 30 đơn tranh 5 món → đúng 5 XAC_NHAN, không bán âm
ok 6 - GIAO TRÙNG: cùng message tới kho 2 lần → chỉ trừ tồn một lần
ok 7 - KHO CHẾT: đơn nằm chờ trong hàng đợi; kho sống lại thì xử lý bù
ok 8 - OUTBOX: dịch vụ chết ngay sau COMMIT, trước khi publish → sống lại vẫn gửi
ok 9 - SMTP LỖI TẠM THỜI 2 lần → thử lại qua hàng đợi .thu-lai, lần 3 thành công
ok 10 - EMAIL SAI → vào DLQ ngay (không thử lại), đơn vẫn XAC_NHAN
ok 11 - MESSAGE RÁC (không phải JSON) → DLQ, consumer không chết
ok 12 - metrics phản ánh message đã xử lý
# tests 12   # pass 12   # duration_ms ~5500
```

Chạy 3 lần liên tiếp đều xanh.

## Một trace, ba dịch vụ

Một `POST /don-hang` sinh ra **một** trace 36 span đi xuyên cả ba dịch vụ (đo thật, rút gọn):

```
[don-hang] POST /don-hang
  [don-hang] pg.query:INSERT don_hang · INSERT outbox · COMMIT
  [don-hang] publish don-hang.da-tao                      ← relay outbox, nối lại bằng traceparent đã lưu
    [kho] kho.don-hang-da-tao process
      [kho] pg.query:UPDATE kho                           ← trừ tồn
      [kho] publish kho.da-giu
        [don-hang] don-hang.ket-qua-kho process
          [don-hang] publish don-hang.da-xac-nhan
            [thong-bao] thong-bao.don-hang-da-xac-nhan process
```

Mọi dòng log của ba dịch vụ cho đơn đó mang **cùng** `trace_id` — dán vào Jaeger là thấy cả hành trình.

## ⚠️ Lỗi gặp thật khi soạn

| Triệu chứng | Nguyên nhân | Bài học |
|---|---|---|
| Dịch vụ báo "sẵn sàng" nhưng `Cannot read properties of null (reading 'port')` | Express 5 truyền `err` vào callback của `listen()` khi cổng đã bị chiếm; code cũ coi đó là thành công | Đọc changelog khi lên major version |
| Chạy lần hai thì cổng bị chiếm | Tiến trình con bị mồ côi khi tiến trình cha bị giết | `process.on('exit')` giết con |
| Test OUTBOX thỉnh thoảng đỏ | Kiểm "outbox rỗng" ngay khi đơn vừa `XAC_NHAN` — lúc đó sự kiện tiếp theo **vừa** được ghi vào outbox | Hệ thống bất đồng bộ: **chờ điều kiện**, đừng kiểm ngay |
| Script tạo tải `ECONNREFUSED` | Khởi động cả ba dịch vụ (kèm OpenTelemetry) mất ~8 giây, lâu hơn `sleep 6` | Chờ `/health/ready`, đừng `sleep` đoán mò |
| Một lần đo thấy nhận đơn chậm 5× khi kho chậm | **Không tái hiện được** ở lần đo lại (792 ms vs 863 ms) | Đo lại trước khi kết luận (buổi 44) — xem giáo án buổi 55 |
