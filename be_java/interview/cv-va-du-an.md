# CV, trình bày dự án & câu hỏi hành vi

## Phần 1 — CV

### Nguyên tắc
- **1 trang** cho Fresher/Junior. Nhà tuyển dụng đọc CV trong 15–30 giây.
- Không ảnh, không thanh đánh giá kỹ năng kiểu "Java ▮▮▮▮▯ 80%" (vô nghĩa và dễ bị hỏi vặn).
- Nộp file **PDF**, đặt tên `NguyenVanAn-JavaBackend.pdf`.
- Mỗi câu bắt đầu bằng **động từ**, có **con số** nếu được.
- Không liệt kê thứ mình không dám bị hỏi. Ghi "Kafka" thì phải trả lời được câu hỏi về Kafka.

### Bố cục

```
NGUYỄN VĂN AN
Java Backend Developer
📧 email · 📱 SĐT · 🔗 github.com/username · 📍 Hà Nội

MỤC TIÊU (2 dòng, tùy chọn — bỏ được thì bỏ)
Tìm vị trí Java Backend Fresher để áp dụng nền tảng Java/Spring Boot
và kinh nghiệm xây dựng REST API qua các dự án cá nhân.

KỸ NĂNG
Ngôn ngữ:    Java 21, SQL
Framework:   Spring Boot, Spring Data JPA, Spring Security
Database:    PostgreSQL, Redis
Công cụ:     Maven, Git, Docker, JUnit 5, Mockito, Postman
Khác:        REST API, JWT, Flyway, GitHub Actions

DỰ ÁN                                    ← PHẦN QUAN TRỌNG NHẤT VỚI FRESHER

Blog REST API  |  github.com/username/blog-api  ·  Spring Boot 3, PostgreSQL, JWT, Docker
• Xây REST API 20+ endpoint: xác thực JWT có refresh token, CRUD bài viết, bình luận lồng nhau
• Thiết kế xử lý lỗi thống nhất bằng @RestControllerAdvice với mã lỗi và traceId để tra log
• Xử lý vấn đề N+1: giảm từ 51 xuống 2 câu SQL cho endpoint danh sách bằng @EntityGraph
• Viết 40+ test (JUnit 5, Mockito, Testcontainers), độ phủ 82%
• Đóng gói Docker multi-stage (image 210MB), chạy toàn bộ bằng docker compose up

Shop Microservices  |  github.com/username/shop  ·  4 service, Kafka, Redis, Gateway
• Tách 4 service với DB riêng, giao tiếp đồng bộ (REST) và bất đồng bộ (Kafka)
• Cài outbox pattern đảm bảo không mất sự kiện khi service dừng giữa chừng
• Thêm circuit breaker: khi product-service ngừng chạy, order-service vẫn phản hồi < 200ms
• Kiểm chứng không bán vượt tồn kho với 200 request đồng thời

Library Management  |  github.com/username/library  ·  Java thuần, JUnit
• Ứng dụng console phân tầng, tách interface repository nên đổi cách lưu trữ không sửa service
• 24 test bao phủ quy tắc nghiệp vụ và các ca biên

HỌC VẤN
Đại học X — Công nghệ thông tin — 2021–2025 — GPA 3.2/4.0

CHỨNG CHỈ / KHÁC (nếu có)
TOEIC 750 · Oracle Certified Associate Java SE
```

### So sánh cách viết

| ❌ Yếu | ✅ Mạnh |
|---|---|
| "Có kiến thức về Spring Boot" | "Xây REST API 20+ endpoint với Spring Boot 3, có JWT và phân trang" |
| "Làm việc nhóm tốt" | "Phối hợp 3 thành viên qua Git flow, review code lẫn nhau" |
| "Sử dụng database" | "Thiết kế schema 8 bảng, tối ưu query từ 2.1s xuống 80ms bằng index tổ hợp" |
| "Biết Docker" | "Đóng gói multi-stage build, giảm image từ 780MB xuống 210MB" |

### GitHub — nhà tuyển dụng **sẽ** mở ra xem
- README mỗi dự án phải có: mô tả, công nghệ, **ảnh chụp màn hình hoặc sơ đồ**, cách chạy, danh sách API.
- Code phải **chạy được** khi clone về. Không commit file `target/`, `.env`, mật khẩu.
- Commit message có nghĩa (`feat: thêm API hủy đơn`), không phải `update`, `fix bug`, `asdasd`.
- Ghim (pin) 3 dự án tốt nhất lên đầu trang cá nhân.

## Phần 2 — Trình bày dự án (bị hỏi ở mọi buổi phỏng vấn)

Dùng cấu trúc **4 phần, 2 phút**:

```
1. BÀI TOÁN   — dự án làm gì, cho ai (20 giây)
2. GIẢI PHÁP  — kiến trúc, công nghệ và VÌ SAO chọn (40 giây)
3. KHÓ KHĂN   — một vấn đề cụ thể và cách bạn giải quyết (40 giây)  ← quan trọng nhất
4. KẾT QUẢ    — con số, bài học rút ra (20 giây)
```

Ví dụ mẫu:

> "Em xây một REST API cho blog: người dùng đăng ký, viết bài, bình luận.
> Em dùng Spring Boot 3 với PostgreSQL, xác thực bằng JWT — chọn JWT vì API stateless
> nên scale nhiều instance không cần session dùng chung.
>
> Khó khăn lớn nhất là hiệu năng: endpoint danh sách bài viết ban đầu mất 1.8 giây.
> Em bật `show-sql` và phát hiện nó sinh 51 câu SQL cho 50 bài — đúng vấn đề N+1,
> vì mỗi bài lại truy vấn thêm tác giả. Em thử `JOIN FETCH` nhưng gặp cảnh báo Hibernate
> phân trang trong bộ nhớ, nên chuyển sang `@EntityGraph`, còn 2 query, thời gian xuống 80ms.
>
> Ngoài ra em viết 40 test, phần tích hợp dùng Testcontainers với PostgreSQL thật vì H2
> hành xử khác Postgres. Bài học lớn nhất là phải **đo trước khi tối ưu** — ban đầu em
> tưởng cần thêm cache, hóa ra chỉ cần sửa cách nạp dữ liệu."

Vì sao câu trả lời này tốt: có con số cụ thể, kể được **quá trình chẩn đoán** (không phải chỉ kết quả), nêu được cả phương án đã thử mà không dùng, và kết bằng bài học.

### Những câu hỏi đào sâu chắc chắn sẽ tới
- "Vì sao chọn JWT mà không dùng session?" → nói cả nhược điểm của JWT.
- "Nếu bây giờ có 1 triệu người dùng thì hệ thống hỏng ở đâu trước?" → thành thật: có thể là DB, cần đọc từ replica, cache, phân trang keyset.
- "Em test những gì?" → không nói "test hết", hãy nói test **logic nghiệp vụ và ca biên**.
- "Nếu làm lại em sẽ làm khác gì?" → chuẩn bị sẵn 2 điều, ví dụ: tách DTO sớm hơn, viết test trước.

## Phần 3 — Câu hỏi hành vi

Dùng cấu trúc **STAR**: Situation → Task → Action → Result.

**1. Điểm mạnh / điểm yếu của bạn?**
Điểm yếu phải **thật** và kèm cách bạn đang khắc phục: "Em hay sa đà tối ưu quá sớm. Sau khi học về đo hiệu năng, giờ em bắt buộc mình phải đo trước rồi mới sửa."

**2. Bạn xử lý thế nào khi bí một vấn đề?**
"Em dành 30 phút tự tìm: đọc lỗi, thu nhỏ phạm vi bằng cách tách đoạn code nghi ngờ, đọc tài liệu chính thức. Quá 30 phút mà không tiến triển thì em hỏi, nhưng hỏi kèm những gì đã thử để người khác không mất công lặp lại."

**3. Bạn học công nghệ mới như thế nào?**
Kể một ví dụ thật từ chương trình học này: "Em học Kafka bằng cách dựng docker-compose, viết producer/consumer đơn giản, rồi cố tình gửi lặp sự kiện để hiểu vì sao cần idempotency."

**4. Bạn từng mắc lỗi nào lớn chưa?**
Có, kể một lỗi thật và bài học. Trả lời "em chưa mắc lỗi bao giờ" là mất điểm nặng.

**5. Vì sao chọn Java backend?**
Trả lời cụ thể, tránh sáo rỗng: "Em thích phần logic và dữ liệu hơn giao diện. Java có kiểu tĩnh nên lỗi bị bắt sớm, và hệ sinh thái Spring rất trưởng thành cho hệ thống lớn."

**6. Bạn mong đợi gì ở công việc đầu tiên?**
"Được review code kỹ và học từ người có kinh nghiệm. Em muốn hiểu vì sao code được viết như vậy, chứ không chỉ hoàn thành task."

**7. Bạn có câu hỏi gì cho chúng tôi không?** (Luôn phải có)
- Quy trình làm việc của team thế nào? Có code review không?
- Hệ thống hiện tại đang gặp thách thức kỹ thuật gì lớn nhất?
- Người mới vào được onboard ra sao trong 1–2 tháng đầu?
- Team có viết test tự động và CI/CD chưa?

## Phần 4 — Lương và thương lượng

**Khi được hỏi "Em mong muốn mức lương bao nhiêu?"**

Đừng nói "tùy công ty" — nó cho thấy bạn chưa tìm hiểu. Hãy đưa **một khoảng**:
> "Em tìm hiểu thì vị trí Fresher Java Backend ở Hà Nội thường trong khoảng X–Y triệu.
> Em mong muốn trong khoảng đó, nhưng em ưu tiên môi trường được học và được review code kỹ."

Cách chuẩn bị:
1. Tra khảo sát lương (ITviec, TopDev, VietnamWorks) theo đúng vị trí, cấp bậc, thành phố.
2. Hỏi bạn bè cùng ngành để có số thực tế.
3. Đưa khoảng, không đưa một con số cứng.
4. Hỏi rõ: lương **gross hay net**, thưởng tháng 13, đánh giá tăng lương bao lâu một lần.

**Với Fresher, thứ đáng đàm phán hơn tiền**: được mentor, được review code, có cơ hội chạm vào production. Chênh lệch 2 triệu ở công việc đầu tiên không quan trọng bằng việc bạn tiến bộ nhanh gấp đôi.

## Phần 5 — Sau buổi phỏng vấn

- Gửi email cảm ơn trong 24 giờ (ngắn 3–4 dòng, nhắc một điểm cụ thể đã trao đổi).
- **Ghi lại ngay** những câu bạn trả lời chưa tốt, về nhà tìm hiểu kỹ. Câu đó sẽ xuất hiện lại ở buổi phỏng vấn sau.
- Bị từ chối thì lịch sự hỏi lý do để cải thiện. Nhiều nơi sẽ trả lời thật.
- **Trượt vài lần là bình thường.** Mỗi lần phỏng vấn là một buổi học miễn phí về đúng thứ thị trường đang cần.
