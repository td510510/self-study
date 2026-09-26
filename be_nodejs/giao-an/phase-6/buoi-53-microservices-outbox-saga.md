# Buổi 53 — Microservices: tách dịch vụ, Outbox & Saga

> **Phase 6** · Hero
> **Mục tiêu:** Giữ dữ liệu nhất quán khi mỗi dịch vụ có database riêng và **không còn transaction chung** — bằng Outbox, consumer idempotent và Saga.
> **Code thực hành:** [`code/project-05-microservices/`](../../code/project-05-microservices/) — [`shared/outbox.js`](../../code/project-05-microservices/shared/outbox.js), [`shared/db.js`](../../code/project-05-microservices/shared/db.js), [`services/`](../../code/project-05-microservices/services/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 52 |
| 15–45′ | **Nhắc lại buổi 45:** microservices có giá — và cắt ranh giới ở đâu |
| 45–60′ | Database-per-service: mất gì? |
| 60–100′ | **Bài toán ghi kép & Transactional Outbox** |
| 100–125′ | Consumer idempotent (inbox) |
| 125–160′ | **Saga:** giao dịch dài qua nhiều dịch vụ |
| 160–175′ | Tranh chấp: 30 đơn, 5 món |
| 175–180′ | Bài tập |

---

## 1. Microservices có giá (15–45′)

> **📝 Ghi chú giảng viên**
> Mở lại bảng ở buổi 45. Học viên vừa thấy Project 5 chạy mượt và dễ kết luận "microservices tốt hơn". Phải cân bằng lại **trước** khi dạy kỹ thuật.

Những gì Project 2 (một khối) có sẵn miễn phí, Project 5 phải **tự xây**:

| Project 2 — monolith | Project 5 — microservices | Buổi |
|---|---|---|
| `prisma.$transaction` giữ đơn + tồn kho nhất quán | Outbox + inbox + saga | 53 |
| Lỗi → stack trace một tiến trình | Trace phân tán qua 3 tiến trình | 54 |
| Gọi hàm: nhanh, không bao giờ "mất" | Message: trễ, trùng, sai thứ tự | 52 |
| `JOIN` đơn hàng với sản phẩm | Không JOIN được — hai database | 53 |
| Deploy một thứ | Deploy ba thứ, tương thích phiên bản sự kiện | — |

**Chỉ tách khi** có ít nhất một lý do thật:
- Các team **khác nhau** cần deploy **độc lập** (lý do số 1 — là vấn đề tổ chức, không phải kỹ thuật)
- Một phần cần scale **rất khác** phần còn lại
- Một phần cần **cô lập lỗi** (email chết không được kéo theo đặt hàng)

### Cắt ranh giới ở đâu?

Theo **năng lực nghiệp vụ** — "ai sở hữu dữ liệu này?" — không theo tầng kỹ thuật.

```
✅ don-hang (sở hữu đơn)  ·  kho (sở hữu tồn kho)  ·  thong-bao (sở hữu lịch sử gửi)
❌ api-service  ·  db-service  ·  validation-service       ← "microservices phân tán tầng"
```

> Dấu hiệu cắt sai: sửa một tính năng phải deploy **đồng thời** ba dịch vụ. Đó là monolith phân tán — có mọi nhược điểm của cả hai.

---

## 2. Database-per-service (45–60′)

```sql
-- ha-tang/postgres-init.sql
CREATE DATABASE don_hang;
CREATE DATABASE kho;
CREATE DATABASE thong_bao;
```

Quy tắc: **không dịch vụ nào đọc bảng của dịch vụ khác.** Kho sở hữu `san_pham`; dịch vụ đơn hàng muốn biết tồn kho thì **hỏi** (API) hoặc **nghe** (sự kiện).

Hỏi lớp: *"Chung một Postgres cho tiện thì sao? Đơn hàng JOIN thẳng `kho.san_pham` là xong."*

→ Ngay khi làm vậy, team kho không thể đổi tên cột, tách bảng hay chuyển sang database khác mà không **phá** dịch vụ đơn hàng. Hai dịch vụ lại dính vào nhau — qua schema thay vì qua code.

> Project dùng chung **máy chủ** Postgres (tiết kiệm tài nguyên khi học) nhưng **database riêng**. Ranh giới là logic; production thường tách cả máy chủ.

---

## 3. Bài toán ghi kép & Outbox (60–100′)

### Bài toán

```js
await db.query('INSERT INTO don_hang ...');
await mq.publish('don-hang.da-tao', ...);      // ← tiến trình bị kill ở đây?
```

Cho lớp phân tích **cả hai thứ tự**:

| Thứ tự | Chết ở giữa | Hậu quả |
|---|---|---|
| Ghi DB → publish | sau ghi, trước publish | Đơn tồn tại, **kho không bao giờ biết**. Đơn treo mãi ở `CHO_XAC_NHAN` |
| Publish → ghi DB | sau publish, trước ghi | Kho giữ hàng cho đơn **không tồn tại** |

> DB và RabbitMQ là **hai hệ thống**, không có transaction chung. Không có thứ tự nào đúng.
>
> "Dùng two-phase commit (2PC)?" — RabbitMQ không hỗ trợ, và 2PC khoá tài nguyên qua mạng: một bên chậm là tất cả đứng. Gần như không ai dùng trong microservices.

### Lời giải: ghi sự kiện vào **chính database đó**

```js
await trongTransaction(pool, async (c) => {
  const { rows } = await c.query('INSERT INTO don_hang (...) RETURNING id', [...]);
  await ghiOutbox(c, 'don-hang.da-tao', { donHangId: rows[0].id, sanPhamId, soLuong });
});   // ← hoặc CẢ HAI cùng có, hoặc CẢ HAI cùng không. Postgres đảm bảo.
```

Một vòng lặp riêng (**relay**) đọc bảng `outbox` và publish:

```sql
SELECT id, loai, du_lieu, ngu_canh FROM outbox
WHERE da_gui_luc IS NULL
ORDER BY tao_luc LIMIT 100
FOR UPDATE SKIP LOCKED
```

| Chi tiết | Vì sao |
|---|---|
| `FOR UPDATE SKIP LOCKED` | Hai bản sao dịch vụ chạy hai relay → mỗi relay lấy lô **khác nhau**, không chờ khoá nhau (nối buổi 19) |
| Index một phần `WHERE da_gui_luc IS NULL` | Index chỉ chứa dòng chưa gửi → luôn nhỏ dù bảng lớn dần |
| Publish **có confirm** rồi mới `UPDATE da_gui_luc` | Publish lỗi → ROLLBACK → lần sau thử lại |
| Có việc thì làm tiếp ngay, hết việc mới nghỉ 200ms | Độ trễ thấp khi bận, không đốt CPU khi rảnh |

### Kiểm chứng: chết đúng khoảnh khắc nguy hiểm

Test *"OUTBOX: dịch vụ chết ngay sau COMMIT, trước khi publish → sống lại vẫn gửi"*:

```
1. Tắt dịch vụ đơn hàng
2. INSERT đơn + INSERT outbox trực tiếp vào DB     ← đúng trạng thái "đã commit, chưa publish"
3. Bật lại dịch vụ đơn hàng
4. → relay thấy dòng outbox, publish → kho giữ hàng → đơn XAC_NHAN
```

### Cái giá: trùng

Relay publish thành công rồi **chết trước `UPDATE da_gui_luc`** → lần sau publish **lại**.

> Outbox cho **"ít nhất một lần"**, không phải "đúng một lần". → Bên nhận phải khử trùng.

> **📝 Ghi chú giảng viên — lỗi gặp thật khi soạn**
> Test outbox ban đầu kiểm "outbox rỗng" **ngay** khi đơn vừa `XAC_NHAN` — và thỉnh thoảng đỏ. Vì lúc đơn chuyển `XAC_NHAN`, dịch vụ đơn hàng **vừa ghi thêm** sự kiện `don-hang.da-xac-nhan` vào outbox, relay chưa kịp gửi. Test đúng phải **chờ điều kiện**, không kiểm tại một thời điểm. Trong hệ thống bất đồng bộ, "ngay sau" không có nghĩa.

---

## 4. Consumer idempotent — inbox (100–125′)

```js
export async function xuLyMotLan(pool, messageId, fn) {
  return trongTransaction(pool, async (client) => {
    const r = await client.query(
      'INSERT INTO su_kien_da_xu_ly (id) VALUES ($1) ON CONFLICT DO NOTHING', [messageId]);
    if (r.rowCount === 0) return false;   // đã xử lý rồi
    await fn(client);                     // việc thật — CÙNG transaction
    return true;
  });
}
```

| Tình huống | Kết quả |
|---|---|
| Lần đầu | INSERT được → làm việc → COMMIT cả hai |
| Lần sau (trùng) | INSERT đụng khoá chính → bỏ qua |
| Việc thật lỗi giữa chừng | ROLLBACK **cả hai** → lần giao lại làm từ đầu, sạch sẽ |

> ⚠️ Tách "ghi id" và "làm việc" ra **hai** transaction = luôn có khe hở để chết ở giữa → hoặc xử lý hai lần, hoặc **không bao giờ** xử lý. Nối buổi 51: cùng nguyên tắc với webhook.

`messageId` = id dòng outbox (`gen_random_uuid()`) — ổn định qua mọi lần gửi lại. **Đừng** dùng id do RabbitMQ sinh.

### Còn một khe không lấp được

Dịch vụ thông báo: *INSERT inbox → gửi email → COMMIT*. Gửi xong mà COMMIT lỗi → lần sau gửi lần hai. Email là hệ thống **ngoài**, không nằm trong transaction được.

> Chấp nhận "hiếm khi trùng" với email. Với **tiền**: truyền idempotency key sang bên kia (buổi 24, 51) để **họ** khử trùng.

---

## 5. Saga (125–160′)

Monolith: một transaction ôm cả "tạo đơn + trừ kho". Microservices: mỗi bước là một transaction **cục bộ** ở một dịch vụ, nối nhau bằng sự kiện.

```
  don-hang: tạo đơn CHO_XAC_NHAN ──▶ don-hang.da-tao
                                          │
  kho:      trừ tồn nếu đủ ───────────────┤
              ├─ đủ     ──▶ kho.da-giu   ──▶ don-hang: XAC_NHAN ──▶ don-hang.da-xac-nhan ──▶ thong-bao: email
              └─ không  ──▶ kho.het-hang ──▶ don-hang: HUY           (BÙ TRỪ)
```

**Không có ROLLBACK xuyên dịch vụ.** Bước sau thất bại → bước trước chạy **hành động bù trừ** (compensation) để "hoàn tác về mặt nghiệp vụ":

| Bước đã làm | Bù trừ |
|---|---|
| Tạo đơn | Huỷ đơn (`HUY`) — không xoá, để còn lịch sử |
| Giữ hàng | Trả hàng về kho |
| Trừ tiền | **Hoàn tiền** — không phải "xoá giao dịch" |

> Trong Project 5, bù trừ duy nhất là `HUY` (vì bước thất bại — kho — chưa làm gì). Bài tập 1 thêm bước thanh toán: thanh toán lỗi → kho phải **trả hàng** — đó là bù trừ thật sự.

### Choreography vs Orchestration

| | Choreography (Project 5) | Orchestration |
|---|---|---|
| Ai điều phối | Không ai — mỗi dịch vụ nghe và phản ứng | Một "nhạc trưởng" gửi lệnh từng bước |
| Ưu | Không điểm tập trung, dịch vụ độc lập | Nhìn một chỗ thấy cả luồng; dễ thêm bước |
| Nhược | Luồng **rải rác** khắp nơi — khó trả lời "đơn này đang kẹt ở đâu?" | Nhạc trưởng biết quá nhiều |
| Hợp khi | 2–4 bước | Nhiều bước, nhiều nhánh bù trừ |

> Câu hỏi *"đơn này kẹt ở đâu?"* với choreography — buổi 54 trả lời bằng **trace**.

### Nhất quán **cuối cùng**

Giữa `202` và `XAC_NHAN` có một khoảng (đo được: vài chục ms lúc rảnh, vài giây lúc tải cao) mà đơn "chưa biết số phận". Đó là **eventual consistency**.

Hệ quả cho sản phẩm:
- Frontend hiện "Đang xử lý…" và poll / nghe WebSocket
- Trạng thái phải được thiết kế cho khoảng giữa — `CHO_XAC_NHAN` là trạng thái **thật**, không phải lỗi
- Chỉ chuyển trạng thái **từ đúng trạng thái trước**: `WHERE trang_thai = 'CHO_XAC_NHAN'` — sự kiện trễ không kéo đơn đã `HUY` sống lại (nối buổi 51)

---

## 6. Tranh chấp: 30 đơn, 5 món (160–175′)

```js
const { rowCount } = await c.query(
  'UPDATE san_pham SET ton = ton - $2 WHERE id = $1 AND ton >= $2', [sanPhamId, soLuong]);
```

Nối buổi 19: trừ tồn **nguyên tử** bằng một câu `UPDATE` có điều kiện — không `SELECT` rồi mới `UPDATE`. Cộng thêm `CHECK (ton >= 0)` làm lưới an toàn cuối cùng.

Test *"30 đơn tranh 5 món"*:

```
XAC_NHAN: 5   HUY: 25   tồn kho: 0
```

Kho xử lý song song tới 10 message (prefetch), mỗi message một transaction — không đơn nào bán âm.

---

## 7. Bài tập về nhà

1. **Dịch vụ thanh toán + bù trừ thật.** Thêm dịch vụ `thanh-toan` nghe `kho.da-giu`, thành công/thất bại ngẫu nhiên. Thất bại → phát `thanh-toan.that-bai` → **kho trả hàng** + đơn `HUY`. Viết test: 20 đơn, tồn kho cuối cùng phải khớp đúng số đơn thành công.

2. **Timeout của saga.** Kho chết cả ngày → đơn nằm `CHO_XAC_NHAN` cả ngày. Viết job: đơn chờ quá 10 phút → `HUY` với lý do "quá thời gian". Nhưng nếu `kho.da-giu` tới **sau** khi đã huỷ vì timeout thì sao? Kho đã trừ hàng rồi!

3. **Dọn outbox & inbox.** Hai bảng này lớn mãi. Viết job xoá dòng `outbox` đã gửi quá 7 ngày. Với `su_kien_da_xu_ly` thì giữ bao lâu là đủ? (Gợi ý: sự kiện trùng có thể tới muộn nhất bao lâu?)

4. **LISTEN/NOTIFY.** Relay poll 5 lần/giây kể cả khi rảnh. Dùng `pg_notify` trong transaction ghi outbox để đánh thức relay ngay. Đo độ trễ trước/sau. Vì sao **vẫn** phải giữ poll làm lưới an toàn?

5. **Nâng cao — orchestration.** Viết lại saga theo kiểu nhạc trưởng: dịch vụ đơn hàng gửi **lệnh** `kho.giu-hang` và chờ **trả lời**. So sánh: thêm bước thanh toán ở mỗi kiểu phải sửa những dịch vụ nào?

---

## 8. Checklist kết thúc buổi

- [ ] Ba lý do **thật** để tách microservices; một dấu hiệu cắt sai ranh giới
- [ ] Vì sao không dịch vụ nào được đọc bảng của dịch vụ khác?
- [ ] Bài toán ghi kép: phân tích cả hai thứ tự
- [ ] Outbox đảm bảo gì, và **không** đảm bảo gì?
- [ ] `FOR UPDATE SKIP LOCKED` giải quyết vấn đề gì khi có nhiều bản sao?
- [ ] Vì sao inbox phải cùng transaction với việc xử lý?
- [ ] Saga khác transaction ở đâu? Bù trừ khác rollback ở đâu?
- [ ] Choreography vs orchestration — chọn khi nào?
- [ ] Eventual consistency ảnh hưởng thế nào tới thiết kế API và giao diện?

---

**Buổi trước:** [Buổi 52 — RabbitMQ](./buoi-52-rabbitmq.md)
**Buổi tiếp theo:** [Buổi 54 — Observability: OpenTelemetry, Prometheus, Grafana](./buoi-54-observability.md)
