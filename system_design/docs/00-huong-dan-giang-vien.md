# Hướng dẫn cho giảng viên

## Cấu trúc mỗi buổi 2 giờ

| Thời lượng | Hoạt động | Ghi chú |
|---|---|---|
| 10' | **Hỏi lại buổi trước** | Gọi 2–3 học viên trả lời câu hỏi cuối bài trước. Không giảng lại. |
| 15' | **Câu chuyện mở đầu** | Kể một sự cố thật (hoặc hư cấu nhưng cụ thể). Học viên phải *cảm* được cái đau trước khi nghe giải pháp. |
| 35' | **Lý thuyết + vẽ bảng** | Vừa nói vừa vẽ. Đừng chiếu slide có sẵn sơ đồ hoàn chỉnh — vẽ dần từng mũi tên. |
| 10' | Nghỉ | |
| 40' | **Lab** | Học viên tự chạy code, sửa tham số, quan sát số. Giảng viên đi vòng quanh. |
| 10' | **Cái giá phải trả + tổng kết** | Luôn kết thúc bằng "kỹ thuật này làm hỏng cái gì". |

## Ba nguyên tắc dạy quan trọng nhất

**1. Không bao giờ đưa giải pháp trước vấn đề.**
Sai: "Hôm nay học Redis cache." → Đúng: "Trang chủ mất 4 giây để load, database CPU 95%. Làm sao?"
Học viên nhớ giải pháp gắn với nỗi đau, không nhớ giải pháp gắn với tên công nghệ.

**2. Mọi con số phải chạy ra được.**
Khi nói "cache giúp giảm tải database", đừng dừng ở đó. Bắt học viên chạy `lab05` và đọc dòng
`hit rate: 87%, DB queries: 1300 → 169`. Con số tự nói.

**3. Luôn hỏi "nếu cái này chết thì sao?"**
Đây là câu hỏi đắt giá nhất trong System Design. Lặp lại nó ở mọi buổi cho đến khi học viên tự hỏi.

## Bẫy thường gặp khi dạy người mới

| Bẫy | Biểu hiện | Cách xử lý |
|---|---|---|
| **Cargo cult** | Học viên vẽ ngay Kafka + Redis + Elasticsearch cho app 100 user | Hỏi: "1000 user/ngày thì một con server $5 có chạy nổi không?" Bắt tính. |
| **Sợ con số** | Không dám ước lượng vì "em không biết chính xác" | Dạy rằng sai 2 lần là chấp nhận được, sai 100 lần thì không. Buổi 03 chữa bệnh này. |
| **Nhầm scale với performance** | "Thêm server để code chạy nhanh hơn" | Phân biệt latency (1 request nhanh) vs throughput (nhiều request). Buổi 03. |
| **Học thuộc CAP** | Đọc vẹt "chọn 2 trong 3" | Buổi 10 phá bỏ cách hiểu này bằng PACELC. |
| **Bỏ qua lỗi** | Chỉ vẽ happy path | Buổi 09. Bắt mỗi mũi tên trong sơ đồ phải trả lời "timeout thì sao?" |

## Đánh giá học viên

- **40%** — 15 bài tập về nhà (mỗi buổi 1 bài, nộp code hoặc sơ đồ)
- **30%** — Mock interview cuối khoá (buổi 15, 45 phút/người)
- **30%** — Dự án nhóm: thiết kế + code prototype 1 hệ thống tự chọn

Rubric cho mock interview có ở [98-cheatsheet.md](98-cheatsheet.md#rubric-cham-mock-interview).

## Chuẩn bị trước buổi đầu

Gửi học viên trước 3 ngày:

1. Cài Node.js >= 18, clone repo, chạy `npm run check` thành công.
2. Đọc `README.md`.
3. Chuẩn bị trả lời: "Kể một lần app/web bạn dùng bị chậm hoặc lỗi. Bạn đoán chuyện gì đã xảy ra?"

Câu 3 chính là chất liệu mở đầu buổi 01.
