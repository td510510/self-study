# Buổi 51 — Tích hợp thanh toán & Webhook an toàn

> **Phase 6** · Hero
> **Mục tiêu:** Tích hợp một cổng thanh toán mà **không mất tiền** — khi webhook bị giả, bị gửi trùng, đến sai thứ tự, hoặc không bao giờ đến.
> **Code thực hành:** [`code/buoi-51-webhook-thanh-toan/`](../../code/buoi-51-webhook-thanh-toan/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 50 |
| 15–45′ | **Nguồn sự thật** — vì sao trang "cảm ơn" không được ghi gì |
| 45–85′ | Ký & xác minh webhook: HMAC, timestamp, so sánh an toàn |
| 85–100′ | **Bẫy số 1: body gốc** |
| 100–140′ | Mạng không hoàn hảo: trùng, sai thứ tự, lệch tiền, shop sập |
| 140–165′ | **Đối soát** — lưới an toàn cuối cùng |
| 165–180′ | Bài tập |

---

## 1. Nguồn sự thật (15–45′)

```
  Khách ──(1) POST /don-hang──▶ Shop ──(2) tạo phiên──▶ Cổng thanh toán
  Khách ◀──(3) urlThanhToan────  Shop
  Khách ──(4) trả tiền trên trang cổng──────────────────▶ Cổng
  Khách ◀──(5) redirect về shop ?trangThai=thanh-cong──── Cổng
                                Shop ◀──(6) WEBHOOK (có chữ ký)── Cổng
```

(5) và (6) **chạy đua nhau**. Hỏi lớp: *"Shop nên chuyển đơn sang ĐÃ THANH TOÁN ở bước nào?"*

Đa số sẽ nói (5). Thử ngay:

```bash
cd code/buoi-51-webhook-thanh-toan && npm install && cp .env.example .env && npm start
curl -X POST localhost:3100/don-hang -H 'content-type: application/json' -d '{"soTien":250000}'
# → { "donHangId": "dh_…", "urlThanhToan": "…" }
curl "localhost:3100/thanh-toan/ket-qua?donHangId=dh_…&trangThai=thanh-cong"
# → { "trangThai": "CHO_THANH_TOAN", "thongDiep": "Đang xác nhận thanh toán…" }
```

> Nếu shop tin `?trangThai=` thì **ai cũng tự gõ URL đó** và nhận hàng miễn phí.

**Nguyên tắc số 1:** chỉ hai kênh được phép chuyển đơn sang `DA_THANH_TOAN`:

1. Webhook **có chữ ký hợp lệ**
2. **Đối soát** — server shop tự hỏi API cổng thanh toán

Trang cảm ơn chỉ **đọc**. Webhook có thể tới *sau* khách → frontend poll vài giây (hoặc nhận qua WebSocket — buổi 25).

### Số tiền đến từ đâu?

```js
// ❌ body: { soTien: req.body.soTien }  ← trình duyệt quyết định giá
// ✅ tính từ giỏ hàng trong DB, ở server
```

> **📝 Ghi chú giảng viên**
> Code demo nhận `soTien` từ body cho gọn — **chỉ ra chỗ đó** và nói rõ vì sao production không được làm vậy. Nối buổi 22 (mass assignment): mọi số liệu tiền đến từ client đều là dữ liệu tấn công.

---

## 2. Ký & xác minh webhook (45–85′)

URL webhook là **công khai**. Không kiểm chữ ký:

```bash
curl -X POST https://shop.vn/webhook/thanh-toan \
  -d '{"loai":"thanh-toan.thanh-cong","duLieu":{"donHangId":"dh_cua_toi"}}'
```

→ ai cũng tự "thanh toán" đơn của mình.

### Định dạng chữ ký (giống Stripe)

```
X-Chu-Ky: t=1790000000,v1=<hex>
v1 = HMAC_SHA256(webhookSecret, `${t}.${rawBody}`)
```

| Thành phần | Chặn |
|---|---|
| HMAC với secret chỉ cổng và shop biết | Webhook giả |
| Ký trên **toàn bộ body** | Sửa số tiền, sửa id đơn |
| Timestamp **nằm trong phần được ký** | Phát lại webhook cũ (không sửa `t` được — test *"sửa timestamp để làm mới chữ ký cũ"*) |
| Từ chối `t` lệch quá 5 phút | Phát lại |

### `timingSafeEqual` thay vì `===`

```js
// ❌ if (nhanDuoc === mongDoi)
// ✅ timingSafeEqual(Buffer.from(nhanDuoc, 'hex'), mongDoi)
```

`===` dừng ở byte **sai đầu tiên**. Đo thời gian phản hồi hàng nghìn lần → đoán ra chữ ký **từng byte một**. `timingSafeEqual` luôn so hết.

> ⚠️ `timingSafeEqual` **ném lỗi** nếu hai buffer khác độ dài → phải kiểm độ dài trước. Test *"v1 khác độ dài không làm crash"*.

---

## 3. Bẫy số 1: body gốc (85–100′)

> **📝 Ghi chú giảng viên — dành đủ 15 phút, đây là lỗi mọi người đều mắc một lần**

```js
app.use(express.json());                        // ← chạy TRƯỚC
app.post('/webhook', (req, res) => {
  const body = JSON.stringify(req.body);        // "dựng lại" body
  xacMinhChuKy({ rawBody: body, ... });         // ❌ KHÔNG BAO GIỜ KHỚP
});
```

Chạy test *"BẪY: parse rồi stringify lại"*:

```js
const goc   = '{"id": "evt_2", "ten": "\\u00c1o thun"}';
const taoLai = JSON.stringify(JSON.parse(goc));
// taoLai = '{"id":"evt_2","ten":"Áo thun"}'   ← khác khoảng trắng, khác cách escape
```

JSON tương đương về **nghĩa** nhưng khác về **byte**. HMAC ký trên byte.

Cách đúng — route webhook đăng ký **trước** `express.json()` và dùng `express.raw()`:

```js
app.post('/webhook/thanh-toan', express.raw({ type: 'application/json' }), handler);
app.use(express.json());   // các route khác
```

Thư viện của ta còn báo lỗi rõ ràng nếu nhận nhầm object: *"body không phải dữ liệu thô — express.json() đã parse mất rồi?"*. Một thông báo lỗi tốt tiết kiệm cả buổi chiều gỡ lỗi.

---

## 4. Mạng không hoàn hảo (100–140′)

Cổng thanh toán cam kết **"ít nhất một lần"** (at-least-once), không phải "đúng một lần". Hệ quả:

### 4.1. Gửi trùng → idempotency theo id sự kiện

Shop trả 200, nhưng gói tin trả lời bị mất → cổng tưởng chưa tới → gửi lại.

```js
if (suKienDaXuLy.has(suKien.id)) return res.json({ nhan: true, trungLap: true });
```

> Trùng thì **vẫn trả 200**. Trả 4xx/5xx thì cổng lại tưởng chưa tới và gửi tiếp mãi.
>
> Production: bảng có `UNIQUE(su_kien_id)`, INSERT **cùng transaction** với cập nhật đơn. Tách rời = khe hở để chết ở giữa → xử lý hai lần. (Buổi 53 đặt tên cho mẫu này: *inbox*.)

Test: *"GỬI TRÙNG: cùng sự kiện tới 3 lần → xử lý đúng một lần"* — email xác nhận chỉ gửi một lần.

### 4.2. Sai thứ tự → máy trạng thái

Khách thử thẻ A (thất bại), thẻ B (thành công). Webhook "thất bại" của thẻ A bị chậm, tới **sau**.

```js
const CHUYEN_HOP_LE = {
  CHO_THANH_TOAN: ['DA_THANH_TOAN', 'THAT_BAI', 'CAN_KIEM_TRA'],
  THAT_BAI:       ['DA_THANH_TOAN', 'CAN_KIEM_TRA'],
  DA_THANH_TOAN:  [],   // không webhook nào kéo lùi được; hoàn tiền là luồng RIÊNG
};
```

Bước chuyển không hợp lệ → **ghi vào lịch sử**, không áp dụng:

```json
{ "bo_qua": "DA_THANH_TOAN → THAT_BAI", "nguon": "webhook:evt_a0" }
```

### 4.3. Lệch số tiền

Webhook báo trả 1.000đ cho đơn 1.000.000đ (lỗi tích hợp, hoặc có người sửa giá lúc tạo phiên). → `CAN_KIEM_TRA`, log mức `error`, **không giao hàng**.

> **📝 Ghi chú giảng viên — lỗi gặp thật khi soạn bài**
>
> Test này **đỏ** ở lần chạy đầu: đơn nằm im ở `CHO_THANH_TOAN`. Máy trạng thái quên khai báo bước `→ CAN_KIEM_TRA`, hàm chuyển trạng thái **lặng lẽ bỏ qua**.
>
> Không có test, đơn này nằm đó mãi, không ai được cảnh báo. Bài học kép: (1) máy trạng thái phải có test cho **từng** bước chuyển; (2) "bỏ qua im lặng" là hành vi nguy hiểm — ít nhất phải ghi log.

### 4.4. Shop sập → cổng gửi lại

```js
lichThuLai: [0, 1000, 5000, 30_000]   // cổng thật: phút → giờ → ngày
```

Test *"SHOP SẬP TẠM THỜI"*: shop trả 503 hai lần, lần ba 200. Nhật ký của cổng: `[503, 503, 200]`.

### 4.5. Trả 2xx NHANH

Cổng thật chỉ chờ vài giây. Quá hạn = thất bại = gửi lại = **trùng**. Việc nặng (email, xuất hoá đơn, gọi API vận chuyển) phải đẩy ra hàng đợi (buổi 26) — webhook handler chỉ **ghi nhận và trả lời**.

---

## 5. Đối soát (140–165′)

Kịch bản xấu nhất: webhook **không bao giờ đến** (cổng lỗi, cấu hình URL sai sau khi đổi domain, firewall chặn).

```
Khách đã bị trừ tiền. Đơn nằm ở CHO_THANH_TOAN. Không ai biết.
```

Test *"WEBHOOK MẤT HẲN"* dựng đúng cảnh này, rồi gọi `doiSoat()`:

```js
for (const don of donHang.values()) {
  if (don.trangThai !== 'CHO_THANH_TOAN') continue;
  const p = await goiCong(`/v1/phien-thanh-toan/${don.phienId}`);
  if (p.trangThai !== 'cho') apDung({ loai: `thanh-toan.${p.trangThai}`, ... }, 'doi-soat');
}
```

Chạy định kỳ bằng job lặp (buổi 26). Lịch sử đơn ghi `nguon: 'doi-soat'` — biết được webhook đã hỏng để đi sửa.

> **Webhook cho tốc độ. Đối soát cho sự đúng đắn.** Hệ thống thanh toán nghiêm túc luôn có cả hai.
>
> Ngoài đối soát từng đơn, cuối ngày còn đối soát **tổng**: tổng tiền cổng báo đã thu vs tổng đơn `DA_THANH_TOAN`. Lệch một đồng cũng phải có người giải thích.

---

## 6. Bài tập về nhà

1. **Hoàn tiền.** Thêm sự kiện `thanh-toan.hoan-tien` và trạng thái `DA_HOAN_TIEN`. Bước chuyển nào hợp lệ? Viết test cho từng bước — kể cả bước **không** hợp lệ.

2. **Hết hạn phiên.** Khách mở trang thanh toán rồi bỏ đi. Sau 15 phút, đơn phải chuyển `HET_HAN` và **trả hàng về kho**. Nhưng nếu webhook "thành công" tới ở phút thứ 16 thì sao? (Gợi ý: đó là tiền thật của khách.)

3. **Lưu bền.** Thay `Map`/`Set` trong bộ nhớ bằng Postgres (Prisma). Bảng `su_kien_thanh_toan` có `UNIQUE(id)`. Chứng minh: gửi trùng song song 10 request cùng lúc vẫn chỉ xử lý một lần.

4. **Xoay secret.** Cổng cho phép có **hai** secret cùng hiệu lực trong 24 giờ khi xoay khoá. Sửa `xacMinhChuKy` để chấp nhận chữ ký khớp **một trong hai**. Vì sao không thể xoay "tức thì"?

5. **Cổng thật.** Đọc tài liệu webhook của VNPay hoặc MoMo (sandbox). So sánh cách họ ký với cách ở đây: thuật toán gì, ký trên chuỗi nào, có timestamp không? Cái nào chống phát lại, cái nào không?

---

## 7. Checklist kết thúc buổi

- [ ] Hai kênh duy nhất được phép chuyển đơn sang "đã thanh toán"
- [ ] Vì sao số tiền không được đến từ trình duyệt?
- [ ] HMAC ký trên gì? Vì sao timestamp phải nằm trong phần được ký?
- [ ] `timingSafeEqual` chống tấn công gì? Bẫy độ dài của nó?
- [ ] Vì sao `express.json()` chạy trước làm chữ ký không bao giờ khớp?
- [ ] Gửi trùng thì trả mã gì? Vì sao?
- [ ] Máy trạng thái giải quyết vấn đề sai thứ tự thế nào?
- [ ] Vì sao webhook handler phải trả lời trong vài giây?
- [ ] Đối soát bắt được lỗi gì mà webhook không bắt được?

---

**Buổi trước:** [Buổi 50 — OAuth2 / OpenID Connect](./buoi-50-oauth2-oidc.md)
**Buổi tiếp theo:** [Buổi 52 — Message broker: RabbitMQ](./buoi-52-rabbitmq.md)
