# Buổi 26 — Background jobs với BullMQ

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Tách các tác vụ nặng ra khỏi vòng đời request — kỹ năng bắt buộc để API luôn phản hồi nhanh.
> **Code thực hành:** [`src/lib/hang-doi.js`](../../code/project-02-ecommerce/src/lib/hang-doi.js) · [`src/demo-hang-doi.js`](../../code/project-02-ecommerce/src/demo-hang-doi.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 25 |
| 15–55′ | **Vì sao cần hàng đợi — đo bằng số** |
| 55–95′ | Worker, concurrency, quy tắc "job chỉ chứa id" |
| 95–135′ | **Retry với backoff & dead letter queue** |
| 135–160′ | **Idempotency của job** |
| 160–175′ | Job hẹn giờ & lặp lại |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Vì sao cần hàng đợi (15–55′)

### 1.1. Đo bằng số

```
  ❌ Làm ĐỒNG BỘ trong request :   992 ms
  ✅ Đẩy vào HÀNG ĐỢI          :    83 ms
  → Khách thấy phản hồi nhanh gấp 12 lần
```

> Việc **vẫn được làm** — chỉ là làm **sau**, ở tiến trình khác.

### 1.2. Ba lý do, không chỉ tốc độ

> **📝 Ghi chú giảng viên**
> Học viên thường chỉ thấy lý do tốc độ. Hai lý do còn lại quan trọng không kém.

**(a) Tốc độ** — khách không phải chờ việc không liên quan tới họ.

**(b) Cô lập lỗi:**

```
Đồng bộ:  dịch vụ email chết  →  ĐƠN HÀNG KHÔNG ĐẶT ĐƯỢC (dù database vẫn ổn)
Hàng đợi: dịch vụ email chết  →  job nằm chờ, tự thử lại. Đơn hàng vẫn đặt được.
```

> Hỏi lớp: *"Đơn hàng đã ghi vào database rồi, nhưng gửi email lỗi. Có nên rollback đơn hàng không?"*
> → **Không.** Khách đã trả tiền. Email chỉ là phụ. Nhưng nếu code đồng bộ thì exception sẽ kéo cả transaction rollback.

**(c) Không giữ kết nối database** — nối lại buổi 20:

```js
await prisma.$transaction(async (tx) => {
  await tx.donHang.create({ ... });
  await guiEmail(...);        // ❌ giữ kết nối DB suốt 2 giây
});
```

> Vài chục request như vậy là **cạn pool → toàn hệ thống đứng**. Đây là lý do kỹ thuật quan trọng nhất.

### 1.3. Kiến trúc

```
   API (tiến trình 1)                Worker (tiến trình 2)
        │                                    │
        │  themViec('gui-email', {id: 42})   │
        ▼                                    │
   ┌─────────────────┐                       │
   │  Redis (BullMQ) │ ◄─────────────────────┘  lấy job ra xử lý
   └─────────────────┘
```

> **Worker là tiến trình RIÊNG.** Nó có thể chạy trên máy khác, và scale độc lập với API. Hôm nào nhiều email thì thêm worker, không cần thêm API server.

---

## 2. Worker & ba quyết định cấu hình (55–95′)

### 2.1. Quy tắc vàng: job chỉ chứa ID

```js
❌  themViec('gui-email', { donHang: donHangDayDu })
✅  themViec('gui-email', { donHangId: 42 })
```

Ba lý do:
1. Job có thể chạy **vài phút sau** — dữ liệu đã cũ
2. Redis lưu trong **RAM**, object lớn tốn bộ nhớ
3. Dữ liệu nhạy cảm không nên nằm trong Redis (nối buổi 18)

### 2.2. Giới hạn số việc song song

```js
new Worker(TEN, xuLy, { concurrency: 5 });
```

> Nối lại buổi 07 và 20: không giới hạn thì worker kéo **hết** job về cùng lúc và làm sập database. Cùng một bài học, lần thứ ba.

### 2.3. `maxRetriesPerRequest: null`

```js
// BullMQ YÊU CẦU maxRetriesPerRequest: null —
// nếu không, worker sẽ chết khi Redis chập chờn.
```

> Đây là **khác biệt** so với cấu hình ioredis cho cache ở buổi 21 (ở đó ta đặt `2` để biết sớm khi Redis chết). Worker cần kiên nhẫn hơn vì nó sống lâu.

### 2.4. ⚠️ Nhiều worker trên cùng hàng đợi thì tranh job

> **📝 Ghi chú giảng viên — lỗi gặp thật khi soạn bài**
>
> Demo ban đầu tạo hai worker cùng lắng nghe một hàng đợi. Worker thứ nhất **không biết** xử lý loại việc của worker thứ hai → nó nhận job rồi ném lỗi *"Không có bộ xử lý"* → job thất bại oan.
>
> Kết quả sai: job đáng lẽ thành công ở lần 3 lại bị báo "lỗi hẳn".
>
> **Bài học:** worker lấy job theo **hàng đợi**, không theo **tên việc**. Ở production, mỗi nhóm việc nên có **hàng đợi riêng** — hoặc mọi worker phải biết xử lý **mọi** loại việc trong hàng đợi đó.

---

## 3. Retry & dead letter queue (95–135′)

### 3.1. Exponential backoff

```js
defaultJobOptions: {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
}
```

Kết quả đo thật:

```
  Job này lỗi 2 lần đầu, thành công ở lần 3:

     ⚠️  job lỗi, sẽ thử lại (lần thử 1)
     ⚠️  job lỗi, sẽ thử lại (lần thử 2)
     ✅ thành công ở lần thử thứ 3

  Khoảng cách giữa các lần thử:
     lần 1 → lần 2: 1034 ms
     lần 2 → lần 3: 2017 ms
```

> **Vì sao khoảng chờ phải tăng dần?** Dịch vụ đang quá tải mà ta dội liên tục thì chỉ làm nó **chết sâu hơn**. Chờ lâu dần cho nó thời gian hồi phục.
>
> Nối lại buổi 15: cùng ý tưởng với rate limit — nhưng lần này ta là **bên gọi**, tự giới hạn chính mình.

### 3.2. Dead letter queue

```
     ⚠️  job lỗi, sẽ thử lại (lần thử 1)
     🔴 job LỖI HẲN sau khi hết lượt thử
  Số job trong danh sách THẤT BẠI: 1
     tên: loi-han
     đã thử: 2 lần
     lý do: Lỗi không bao giờ hết
```

```js
removeOnComplete: { age: 3600, count: 1000 },
removeOnFail: { age: 24 * 3600 },     // ← giữ job LỖI lâu hơn để điều tra
```

> Job hết lượt thử **không biến mất**. Nó nằm lại để ta điều tra và chạy lại bằng tay.
>
> **⚠️ PHẢI CÓ CẢNH BÁO khi danh sách này dài lên.** Không ai nhìn thì hàng nghìn email không gửi được mà **không ai biết** — hàng đợi im lặng nuốt lỗi còn tệ hơn lỗi hiện ra ngay.

### 3.3. Mức log phải phân biệt "sẽ thử lại" và "lỗi hẳn"

```js
const conThu = job.attemptsMade < job.opts.attempts;
logger[conThu ? 'warn' : 'error'](...);
```

> Nối lại buổi 18: lỗi tạm thời là `warn`, lỗi hẳn là `error` — chỉ cái sau mới đáng đánh thức người trực.

---

## 4. Trọng tâm: idempotency của job (135–160′)

> **📝 Ghi chú giảng viên — phần dễ bị bỏ qua nhất**

Kịch bản:

```
1. Job "gửi email" chạy
2. Email ĐÃ gửi đi thành công
3. Mạng đứt khi nhận phản hồi từ dịch vụ email → job báo LỖI
4. BullMQ thử lại → KHÁCH NHẬN HAI EMAIL
```

> Đây **không phải** lỗi của BullMQ. Retry là tính năng, không phải bug. Vấn đề là **job không idempotent**.

```js
// ❌
await guiEmail(donHang);

// ✅
const daGui = await redis.set(`email:${donHangId}`, '1', 'EX', 86400, 'NX');
if (daGui === null) return;        // đã gửi rồi, bỏ qua
await guiEmail(donHang);
```

> Đây **chính là** cơ chế idempotency key ở buổi 24, lần này áp cho job thay vì cho request HTTP.
>
> **QUY TẮC: mọi job phải giả định nó CÓ THỂ chạy nhiều lần.**

Bảng để lớp cùng điền:

| Job | Chạy 2 lần có sao không? | Cần chống trùng? |
|---|---|---|
| Gửi email xác nhận | khách nhận 2 email | ✅ |
| Resize ảnh | ghi đè cùng file | ❌ tự idempotent |
| Trừ tiền ví | **trừ 2 lần** 🚨 | ✅ **bắt buộc** |
| Đồng bộ tồn kho (đặt giá trị tuyệt đối) | cùng kết quả | ❌ |
| Cộng điểm thưởng (`increment`) | **cộng 2 lần** 🚨 | ✅ |

> Nhận xét: job **đặt giá trị tuyệt đối** thì tự idempotent; job **tăng/giảm tương đối** thì không.

---

## 5. Job hẹn giờ & lặp lại (160–175′)

```js
await themViec('gui-email', { donHangId: 99 }, { delay: 5000 });
```

Ứng dụng thật:

| Delay | Việc |
|---|---|
| 15 phút | nhắc khách hoàn tất thanh toán |
| 3 ngày | xin đánh giá sau khi giao hàng |
| mỗi đêm | dọn dữ liệu cũ, gửi báo cáo |

> **Job lặp lại thay thế cron** — và chạy đúng **cả khi có nhiều bản sao server**, vì Redis đảm bảo chỉ **một** worker nhận mỗi job.
>
> Với `cron` của hệ điều hành trên 4 máy, việc sẽ chạy **4 lần**. Đây là lỗi rất hay gặp khi scale ngang.

---

## 6. Bài tập về nhà

1. **Tích hợp vào Project 2.** Chuyển việc "gửi email xác nhận đơn hàng" thành job. Đo lại thời gian phản hồi của `POST /don-hang` trước và sau.

2. **Làm job idempotent.** Thêm khoá chống gửi trùng cho job email. Cố tình cho job lỗi sau khi "gửi" và kiểm chứng lần thử lại **không** gửi lại.

3. **Tiến trình worker riêng.** Tách worker ra `src/worker.js` chạy bằng `npm run worker`. Chứng minh API vẫn hoạt động khi worker **chưa** chạy (job nằm chờ), và được xử lý ngay khi worker khởi động.

4. **Cảnh báo dead letter.** Viết một job lặp mỗi phút, đếm số job thất bại, và ghi log mức `error` nếu vượt 10. Vì sao ngưỡng quan trọng hơn con số tuyệt đối?

5. **Đo concurrency.** Thêm 100 job mỗi job mất 100ms. Đo tổng thời gian với `concurrency` = 1, 5, 20, 50. Vẽ đồ thị. Điểm nào không cải thiện nữa? Vì sao? (Gợi ý: nối lại buổi 20.)

6. **Nâng cao — graceful shutdown cho worker.** Khi nhận `SIGTERM`, worker phải **hoàn thành job đang chạy** rồi mới thoát, không nhận job mới. Viết và kiểm chứng bằng cách gửi tín hiệu giữa lúc job đang chạy. (Nối buổi 08.)

---

## 7. Checklist kết thúc buổi

- [ ] Ba lý do dùng hàng đợi, ngoài tốc độ?
- [ ] Vì sao gọi API bên ngoài trong transaction là nguy hiểm?
- [ ] Vì sao job chỉ nên chứa ID, không chứa cả object?
- [ ] `concurrency` giải quyết vấn đề gì?
- [ ] Vì sao khoảng chờ retry phải tăng dần?
- [ ] Job hết lượt thử đi đâu? Vì sao phải cảnh báo?
- [ ] Vì sao job phải idempotent? Cho ví dụ job **không** cần và job **bắt buộc** cần.
- [ ] Job lặp lại hơn `cron` ở điểm nào khi chạy nhiều bản sao?
- [ ] Nhiều worker cùng một hàng đợi thì chuyện gì xảy ra?

---

**Buổi trước:** [Buổi 25 — Realtime với WebSocket](./buoi-25-websocket.md)
**Buổi tiếp theo:** Buổi 27 — Docker hoá toàn bộ dự án
