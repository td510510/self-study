# Buổi 51 — Tích hợp thanh toán & Webhook an toàn

Giáo án: [`giao-an/phase-6/buoi-51-thanh-toan-webhook.md`](../../giao-an/phase-6/buoi-51-thanh-toan-webhook.md)

Không cần Docker. Repo có sẵn một **cổng thanh toán giả lập** hành xử như Stripe/VNPay ở những điểm quan trọng.

```bash
npm install
cp .env.example .env
npm start       # cổng thanh toán :4100, shop :3100
npm test        # 18 test
```

Thử bằng tay:

```bash
curl -X POST localhost:3100/don-hang -H 'content-type: application/json' -d '{"soTien":250000}'
# → mở urlThanhToan trong trình duyệt, bấm "Trả tiền"
curl localhost:3100/don-hang/<donHangId>
```

Kết quả chạy thật:

```json
{"id":"dh_98a2308f","soTien":250000,"trangThai":"DA_THANH_TOAN",
 "lichSu":[{"tu":"CHO_THANH_TOAN","sang":"DA_THANH_TOAN","nguon":"webhook:evt_…"}]}
```

## Cổng thanh toán giả lập làm gì

- Ký webhook: `X-Chu-Ky: t=<unix>,v1=HMAC_SHA256(secret, "t.body")`
- Shop không trả 2xx → **gửi lại** theo lịch tăng dần
- Redirect khách về kèm `?trangThai=thanh-cong` — **mồi nhử**, shop không được tin
- API tra cứu `GET /v1/phien-thanh-toan/:id` để **đối soát**

## 18 test

| Nhóm | Test |
|---|---|
| Chữ ký (8) | đúng; sửa 1 ký tự; sai secret; sửa timestamp; quá 5 phút; header rác; **bẫy parse-rồi-stringify**; body đã bị `express.json()` parse |
| Luồng (2) | trả tiền → `DA_THANH_TOAN`; thẻ từ chối → `THAT_BAI` |
| Tấn công (3) | tự gõ `?trangThai=thanh-cong`; webhook giả; phát lại webhook cũ |
| Mạng không hoàn hảo (5) | gửi trùng 3 lần; sai thứ tự; lệch số tiền; shop sập 2 lần rồi sống; webhook mất hẳn → **đối soát** |

## ⚠️ Lỗi gặp thật khi soạn bài

Test "số tiền lệch" **đỏ** ở lần chạy đầu: đơn lệch tiền nằm im ở `CHO_THANH_TOAN` thay vì `CAN_KIEM_TRA`.

Máy trạng thái quên khai báo bước `CHO_THANH_TOAN → CAN_KIEM_TRA`, nên hàm chuyển trạng thái **lặng lẽ bỏ qua**.
Không có test thì đơn này nằm đó mãi — khách trả 1.000đ cho đơn 1.000.000đ và không ai được cảnh báo.
