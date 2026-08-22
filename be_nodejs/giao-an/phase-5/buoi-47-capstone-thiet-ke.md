# Buổi 47 — Capstone: thiết kế

> **Phase 5** · Production-ready
> **Mục tiêu:** Tổng hợp toàn bộ khoá học vào một quyết định thiết kế **thật**, tự chịu trách nhiệm với lựa chọn của mình.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Đề bài & tiêu chí chọn phạm vi |
| 20–70′ | **Chọn công nghệ — và giải thích được vì sao** |
| 70–120′ | Thiết kế schema database |
| 120–160′ | Viết API contract |
| 160–180′ | **Review thiết kế 1-1** |

---

## 1. Đề bài (0–20′)

Học viên **tự chọn** một hệ thống thật để xây từ đầu tới deploy.

### Gợi ý đề tài

| Đề tài | Điểm khó chính | Nối lại buổi |
|---|---|---|
| **Đặt lịch** (phòng khám, sân bóng, phòng họp) | tranh chấp cùng khung giờ | 19 |
| **Blog / CMS** | phân quyền tác giả–biên tập, xoá mềm | 16, 18 |
| **Chat / hỗ trợ** | realtime, lưu lịch sử | 25 |
| **Quản lý kho** | transaction, kiểm kê, lịch sử | 19 |
| **Theo dõi chi tiêu** | báo cáo tổng hợp, phân trang | 20 |
| **Đăng ký khoá học** | giới hạn sĩ số (tranh chấp) | 19 |

> **📝 Ghi chú giảng viên**
> Khuyến khích chọn đề tài **học viên hiểu nghiệp vụ**. Khó nhất của Capstone không phải kỹ thuật — mà là **quyết định đúng khi nghiệp vụ mơ hồ**.
>
> Ai chọn "clone Shopee" thì hỏi: *"Bạn định làm bao nhiêu phần trăm trong 2 tuần?"* — dẫn tới phần tiếp theo.

### Phạm vi vừa sức

**Bắt buộc có:**

| | Nối lại buổi |
|---|---|
| Auth (đăng ký, đăng nhập, refresh token) | 15 |
| Phân quyền theo vai trò **và** chủ sở hữu | 16 |
| ≥ 3 resource có quan hệ với nhau | 12–13 |
| ≥ 1 thao tác cần **transaction + khoá** | 19 |
| Validate đầu vào ở mọi endpoint | 11, 31 |
| Log có cấu trúc, che dữ liệu nhạy cảm | 18 |
| Test ≥ 30, có database test riêng | 09, 38 |
| Docker hoá, chạy bằng một lệnh | 27 |
| CI chạy tự động | 40 |

**Không bắt buộc** (thêm nếu còn thời gian): realtime, queue, cache, deploy công khai.

> **Thà làm ÍT mà XONG và ĐÚNG, còn hơn làm nhiều mà dở dang.**
>
> Tiêu chí chấm ở buổi 48 thưởng cho **chiều sâu**, không thưởng cho số lượng tính năng.

---

## 2. Chọn công nghệ (20–70′)

Học viên **tự quyết**, nhưng **phải giải thích được**. Đây là phần quan trọng nhất buổi học.

### Bảng quyết định phải nộp

| Quyết định | Chọn gì | Vì sao (nêu tiêu chí, không nói chung chung) |
|---|---|---|
| Express hay NestJS? | | quy mô team, tuổi thọ dự án, TypeScript |
| PostgreSQL hay MongoDB? | | toàn vẹn dữ liệu, quan hệ, transaction |
| Có cần Redis không? | | tỷ lệ đọc/ghi, chấp nhận dữ liệu cũ bao lâu |
| Có cần queue không? | | có việc chậm không cần trả lời ngay không |
| Có cần realtime không? | | người dùng cần biết ngay hay 30 giây sau cũng được |
| Offset hay cursor? | | quy mô dữ liệu, có cần nhảy trang không |

> **⚠️ Câu trả lời "vì nó hiện đại" hoặc "vì em muốn học" KHÔNG được chấp nhận.**
>
> Muốn học một công nghệ là lý do chính đáng để **làm bài tập**, không phải để **chọn kiến trúc**. Nếu thật sự muốn học, hãy nói rõ: *"Tôi chọn X dù Y phù hợp hơn, vì mục tiêu học tập"* — thành thật thì được điểm.

Nhắc lại các khung quyết định đã học:

| Câu hỏi | Buổi |
|---|---|
| SQL hay NoSQL? | 14 — *"nếu chưa chắc, chọn PostgreSQL"* |
| Express hay Nest? | 28, 39 — quy mô team và tuổi thọ dự án |
| Có nên cache? | 21 — *"dữ liệu này cũ bao lâu thì chấp nhận được?"* |
| Có nên thêm thành phần? | 45 — ba câu hỏi chống over-engineering |

---

## 3. Thiết kế schema (70–120′)

> **Đây là quyết định khó sửa nhất của dự án** (buổi 18). Làm kỹ **trước** khi viết dòng code đầu tiên.

### Danh sách kiểm tra schema

| Kiểm tra | Buổi |
|---|---|
| Tiền lưu bằng `Int` (đơn vị nhỏ nhất) hoặc `Decimal` — **không** `Float` | 18 |
| Dữ liệu lịch sử được **chép lại**, không tham chiếu | 18 |
| Mỗi `onDelete` là quyết định **nghiệp vụ** có chủ đích | 18 |
| Cột dùng trong `WHERE`/`ORDER BY`/`JOIN` có index | 19 |
| Ràng buộc `@unique` ở tầng **database**, không chỉ ở code | 14 |
| Id công khai không lộ quy mô kinh doanh | 18 |
| Trường có thể null được đánh dấu `?` rõ ràng | 12 |

### Bài tập tại lớp: tự phản biện

Với mỗi bảng, trả lời:

```
1. Xoá một bản ghi ở đây thì cái gì bị ảnh hưởng?
2. Trường nào KHÔNG BAO GIỜ được client sửa?     (buổi 22)
3. Truy vấn nào sẽ chạy nhiều nhất? Nó có index chưa?
4. Dữ liệu nào cần chép lại vì lịch sử?
5. Thao tác nào cần transaction?
```

---

## 4. API contract (120–160′)

Viết **trước khi** code (buổi 24, 46).

### Mẫu tối thiểu cho mỗi endpoint

```
POST /dat-lich
  Body:     { phongId: number, batDau: ISO8601, ketThuc: ISO8601 }
  Header:   Idempotency-Key (khuyến nghị)

  201 → { id, maDatLich, trangThai, ... }
  400 → ma: DU_LIEU_SAI      (thiếu trường, thời gian không hợp lệ)
  401 → ma: CHUA_DANG_NHAP
  409 → ma: TRUNG_LICH       (khung giờ đã có người đặt)
  429 → ma: QUA_NHIEU_REQUEST
```

> **Mã lỗi ổn định là phần hay bị bỏ sót nhất** (buổi 18, 46). Frontend so khớp `ma`, không so khớp chuỗi tiếng Việt.

### Tự kiểm tra contract

```
1. Mỗi endpoint đã liệt kê ĐỦ mã lỗi chưa?
2. Có endpoint nào cần idempotency không?        (buổi 24)
3. Phân trang dùng cách nào? Có trả tổng số không?  (buổi 20)
4. Thao tác nào cần realtime báo lại?             (buổi 25)
5. Đưa contract cho người khác — họ làm frontend được chưa?
```

---

## 5. Review thiết kế 1-1 (160–180′)

Mỗi học viên trình bày **5 phút**, giảng viên và lớp phản biện.

### Câu hỏi phản biện bắt buộc

```
1. Hai người cùng thao tác một lúc — chuyện gì xảy ra?      (buổi 19)
2. Người dùng A có xem được dữ liệu của B không? Chặn ở đâu?  (buổi 16)
3. Dữ liệu tăng 1000 lần — truy vấn nào gãy trước?           (buổi 19, 20)
4. Bước nào lỗi giữa chừng thì dữ liệu ra sao?               (buổi 19)
5. Bạn ĐANG over-engineer chỗ nào?                          (buổi 45)
```

> **📝 Ghi chú giảng viên**
> Câu số 5 quan trọng không kém câu số 1. Sau 46 buổi học, học viên có xu hướng **nhét mọi thứ vừa học** vào Capstone.
>
> Hỏi thẳng: *"Redis ở đây giải quyết vấn đề gì? Bạn đã ĐO chưa?"* Nếu không trả lời được → bỏ đi. **Biết bỏ bớt là dấu hiệu trưởng thành hơn biết thêm vào.**

---

## 6. Sản phẩm phải nộp cuối buổi

| # | Nội dung |
|---|---|
| 1 | **Mô tả đề tài** — hệ thống làm gì, cho ai, phạm vi |
| 2 | **Bảng quyết định công nghệ** — mỗi lựa chọn kèm lý do |
| 3 | **Sơ đồ kiến trúc** — thành phần và luồng dữ liệu (buổi 45) |
| 4 | **Schema database** — `schema.prisma` hoặc sơ đồ ERD |
| 5 | **API contract** — mọi endpoint kèm **mọi mã lỗi** |
| 6 | **Kế hoạch theo tuần** — chia nhỏ công việc |
| 7 | **Rủi ro** — 3 thứ có thể làm bạn không kịp, và cách phòng |

> Mục 7 hay bị coi nhẹ nhưng là mục **thực tế nhất**. Ai không nêu được rủi ro thường là người chưa hình dung hết công việc.

---

## 7. Bài tập (làm trong hai tuần)

1. **Xây hệ thống** theo thiết kế đã duyệt.
2. **Test ≥ 30**, có database test riêng, chạy tuần tự (buổi 19).
3. **Docker hoá**, chạy bằng một lệnh (buổi 27).
4. **CI** chạy tự động mỗi push (buổi 40).
5. **README** đủ để người lạ clone về chạy được ngay.
6. **Chuẩn bị demo 10 phút** cho buổi 48.

> **Nộp sớm phần khung** (auth + một resource) sau tuần đầu để được góp ý giữa chừng — đừng để tới phút cuối.

---

## 8. Checklist trước khi bắt tay code

- [ ] Phạm vi đã đủ nhỏ để hoàn thành chưa?
- [ ] Mỗi quyết định công nghệ đều giải thích được bằng **tiêu chí**?
- [ ] Schema đã qua đủ 7 mục kiểm tra?
- [ ] Đã xác định thao tác nào cần transaction?
- [ ] Contract đã có **đủ mã lỗi** cho mọi endpoint?
- [ ] Đã trả lời được 5 câu phản biện?
- [ ] Đã nêu 3 rủi ro và cách phòng?

---

**Buổi trước:** [Buổi 46 — Code review & API contract](./buoi-46-code-review.md)
**Buổi tiếp theo:** Buổi 48 — Capstone: bảo vệ & tổng kết khoá học
