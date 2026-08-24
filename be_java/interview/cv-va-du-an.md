# CV, trình bày dự án & câu hỏi hành vi

> Kỹ năng kỹ thuật đưa bạn vào vòng phỏng vấn. Cách trình bày quyết định bạn có được nhận hay không.

---

## 1. CV cho Fresher/Junior Java Backend

### Nguyên tắc
- **Một trang.** Người tuyển dụng đọc CV đầu tiên trong ~20 giây.
- **Không ảnh, không thanh kỹ năng %.** "Java ▓▓▓▓░ 80%" là vô nghĩa — 80% của cái gì?
- **Dự án quan trọng hơn học vấn** khi bạn chưa có kinh nghiệm đi làm.
- **Nộp file PDF**, đặt tên `NguyenVanAn-JavaBackend.pdf`.

### Bố cục
```
NGUYỄN VĂN AN — Java Backend Developer
email@example.com | 09xx xxx xxx | github.com/username | Hà Nội

MỤC TIÊU (2 dòng, cụ thể — bỏ hẳn nếu không viết được gì cụ thể)
Tìm vị trí Java Backend Fresher. Đã tự học 6 tháng, xây dựng 3 dự án cá nhân
với Spring Boot, PostgreSQL, Docker; có kinh nghiệm viết test và tối ưu truy vấn.

KỸ NĂNG
Ngôn ngữ    : Java 21, SQL
Framework   : Spring Boot 3, Spring Data JPA, Spring Security
Database    : PostgreSQL, Redis
Công cụ     : Maven, Git, Docker, JUnit 5, Mockito, Testcontainers
Khác        : REST API, JWT, Kafka (cơ bản), CI/CD với GitHub Actions

DỰ ÁN
Blog REST API  ·  github.com/username/blog-api  ·  Spring Boot, PostgreSQL, JWT, Docker
- Xây dựng REST API với xác thực JWT, phân quyền 3 vai trò, refresh token thu hồi được
- Tối ưu truy vấn JPA: xử lý N+1 bằng JOIN FETCH và EntityGraph, giảm từ 101 xuống 2 query
  cho endpoint danh sách
- Viết 40+ test (unit + integration với Testcontainers), độ phủ 82% ở tầng service
- Đóng gói Docker multi-stage (image 180MB), chạy toàn bộ bằng một lệnh docker compose up

Shop Microservices  ·  github.com/username/shop-microservices  ·  4 service, Kafka, Redis
- Thiết kế 4 service với database riêng, giao tiếp qua REST + Kafka
- Cài saga cho luồng đặt hàng, có hành động bù trừ và outbox pattern đảm bảo không mất sự kiện
- Circuit breaker (Resilience4j): khi product-service ngừng hoạt động, hệ thống vẫn phản hồi
  trong 3 giây thay vì treo
- Giám sát bằng Prometheus + Grafana, log JSON có trace id xuyên suốt 4 service

HỌC VẤN
Đại học XYZ — Công nghệ thông tin — 2022–2026 — GPA 3.2/4.0

CHỨNG CHỈ / KHÁC
TOEIC 700 · Đọc hiểu tài liệu kỹ thuật tiếng Anh tốt
```

### Cách viết mô tả dự án cho đúng

❌ **Sai** (kể công nghệ, ai cũng viết được):
> "Sử dụng Spring Boot, JPA, MySQL để làm website bán hàng có chức năng đăng nhập, đăng ký, giỏ hàng."

✅ **Đúng** (nêu **vấn đề đã giải quyết** và **số liệu**):
> "Tối ưu endpoint danh sách sản phẩm: phát hiện N+1 qua log SQL, xử lý bằng EntityGraph, giảm từ 101 xuống 2 query và thời gian phản hồi từ 1,8s xuống 90ms."

Công thức: **Làm gì → Gặp vấn đề gì → Xử lý thế nào → Kết quả đo được**.

Không có số liệu thật thì đi đo — chương trình này đã dạy bạn cách đo (Module 07, 12, 14).

### Những lỗi khiến CV bị loại
- Liệt kê 30 công nghệ trong đó có 25 cái chỉ "nghe qua" → bị hỏi vào là lộ ngay.
- Link GitHub trống hoặc chỉ có bài tập nhỏ.
- Sai chính tả tên công nghệ: "Springboot", "PostgreSql", "Java Sprint".
- Nói dối kinh nghiệm — vòng kỹ thuật phát hiện trong 5 phút.

---

## 2. Repo GitHub — thứ được xem kỹ nhất

Nhà tuyển dụng mở repo và nhìn theo đúng thứ tự này:

1. **README** — 30 giây đầu quyết định họ có đọc tiếp không.
2. **Cấu trúc thư mục** — có phân tầng không, hay tất cả nhét trong một package?
3. **Có test không** — thư mục `src/test` trống là điểm trừ rất nặng.
4. **Lịch sử commit** — commit đều đặn, message rõ ràng; hay là một commit "init project" duy nhất 5000 dòng?
5. **Có secret bị commit không** — thấy mật khẩu trong `application.yml` là loại thẳng.

README tối thiểu phải có:
```markdown
# Tên dự án
Một câu mô tả nó làm gì.

## Công nghệ
Liệt kê + lý do chọn

## Chạy thử
```bash
docker compose up
```
(phải chạy được thật — người ta sẽ thử)

## Tính năng
## Kiến trúc (kèm sơ đồ)
## Những quyết định kỹ thuật đáng chú ý  ← phần ăn điểm nhất
## Những gì sẽ làm tiếp nếu có thêm thời gian
```

Ba dự án trong chương trình này đều đã có README mẫu — hãy viết lại bằng lời của bạn, đừng copy.

---

## 3. Trình bày dự án khi phỏng vấn

Bạn sẽ được hỏi: *"Kể về một dự án em tâm đắc nhất."* Đây là câu **quyết định kết quả** buổi phỏng vấn.

Cấu trúc trả lời trong 3 phút:

**(1) Bối cảnh — 20 giây**
> "Em xây dựng một REST API blog để tự học Spring Boot. Nó có xác thực JWT, phân quyền, quản lý bài viết và bình luận."

**(2) Vai trò và công nghệ — 20 giây**
> "Em làm toàn bộ: thiết kế database, viết API, viết test, đóng gói Docker. Dùng Spring Boot 3, PostgreSQL, Redis."

**(3) Một vấn đề khó và cách giải quyết — 90 giây (phần quan trọng nhất)**
> "Endpoint danh sách bài viết ban đầu mất gần 2 giây. Em bật `show-sql` và phát hiện nó chạy 101 câu query cho 50 bài — kinh điển là N+1: mỗi bài lại query thêm để lấy tác giả. Em thử `JOIN FETCH` nhưng gặp cảnh báo `HHH90003004` vì kết hợp với phân trang sẽ khiến Hibernate phân trang trong bộ nhớ. Cuối cùng em dùng `@EntityGraph` cho quan hệ ManyToOne, còn phần bình luận thì nạp riêng bằng một query theo danh sách id. Kết quả: 2 query, thời gian phản hồi còn 90ms. Sau đó em viết thêm một test đếm số query để chặn hồi quy."

**(4) Điều rút ra — 30 giây**
> "Em học được là ORM tiện nhưng phải luôn nhìn SQL nó sinh ra. Từ đó em có thói quen bật log SQL trong lúc dev cho mọi endpoint mới."

Vì sao cách này hiệu quả: nó chứng minh bạn **biết chẩn đoán**, không chỉ biết gõ theo hướng dẫn.

### Chuẩn bị sẵn 3 câu chuyện
1. Một bài toán **kỹ thuật** khó (như trên).
2. Một lần bạn **sửa lỗi khó tìm** (bug đa luồng, memory leak, dữ liệu sai lúc tải cao).
3. Một lần bạn **cân nhắc đánh đổi** và chọn phương án đơn giản hơn (ví dụ: không tách microservices).

---

## 4. Câu hỏi hành vi thường gặp

**"Giới thiệu bản thân"** — 90 giây, theo trình tự: bạn là ai → học/làm gì → vì sao chọn backend → điều bạn đang muốn làm tiếp. Đừng đọc lại CV.

**"Vì sao chọn Java mà không phải ngôn ngữ khác?"**
Trả lời thật: kiểu tĩnh giúp bắt lỗi sớm khi dự án lớn, hệ sinh thái Spring trưởng thành, thị trường việc làm ở Việt Nam rộng (ngân hàng, fintech, outsourcing).

**"Điểm yếu của em là gì?"**
Nói một điểm yếu **thật** kèm cách đang khắc phục. Ví dụ: *"Em chưa có kinh nghiệm vận hành hệ thống thật ở quy mô lớn. Em bù bằng cách tự dựng Prometheus/Grafana cho dự án cá nhân và tập chẩn đoán sự cố."* Tránh câu sáo rỗng "em quá cầu toàn".

**"Em học công nghệ mới bằng cách nào?"**
Kể quy trình thật: đọc tài liệu chính thức → làm một dự án nhỏ → viết lại những gì hiểu. Dẫn chứng bằng chính repo học tập của bạn.

**"Bất đồng với đồng nghiệp/leader thì em xử lý sao?"**
Nêu quy trình: trình bày quan điểm kèm dữ liệu → lắng nghe lý do bên kia → nếu vẫn khác nhau thì theo quyết định của người chịu trách nhiệm và làm hết mình. Điều họ muốn nghe: bạn tranh luận dựa trên **dữ liệu**, không dựa trên cái tôi.

**"Em có câu hỏi gì cho công ty không?"**
**Luôn phải có câu hỏi.** Không hỏi gì = tín hiệu bạn không thật sự quan tâm. Vài câu tốt:
- Quy trình review code và deploy của team hiện tại như thế nào?
- Team đang dùng Java phiên bản nào, có kế hoạch nâng cấp không?
- Người mới vào sẽ được onboard ra sao trong 1–3 tháng đầu?
- Phần nào của hệ thống hiện đang gây khó khăn nhất cho team?
- Anh/chị đánh giá em còn thiếu gì cho vị trí này? *(Câu này vừa cho bạn phản hồi thật, vừa thể hiện cầu thị.)*

---

## 5. Đàm phán lương (tham khảo)

Mức tham khảo cho Java Backend tại Việt Nam (2026, thay đổi theo công ty và địa điểm):

| Cấp bậc | Khoảng phổ biến |
|---|---|
| Fresher (0–1 năm) | 8–15 triệu |
| Junior (1–2 năm) | 15–25 triệu |
| Middle (2–5 năm) | 25–45 triệu |
| Senior (5+ năm) | 45–80 triệu+ |

Nguyên tắc:
- **Khảo sát trước** trên ITviec, TopDev, VietnamWorks cho đúng vị trí và địa điểm.
- Khi được hỏi mong muốn, đưa **khoảng** dựa trên khảo sát: *"Em mong muốn trong khoảng 12–15 triệu, tùy vào phạm vi công việc cụ thể."*
- Fresher: **ưu tiên môi trường học được** hơn 1–2 triệu chênh lệch. Một năm ở team có code review tử tế đáng giá hơn nhiều so với hai năm làm một mình.
- Hỏi rõ tổng thu nhập: lương cứng, thưởng, tháng 13, bảo hiểm đóng trên mức nào, chính sách OT, remote/hybrid.
- Nhận offer thì xin **văn bản** trước khi nghỉ chỗ cũ.

---

## 6. Checklist trước ngày phỏng vấn

**Một tuần trước**
- [ ] Đọc kỹ mô tả công việc, gạch chân công nghệ họ dùng và ôn đúng những cái đó
- [ ] Tìm hiểu công ty: sản phẩm gì, khách hàng ai, quy mô team
- [ ] Ôn lại `cau-hoi-java-core.md` và `cau-hoi-spring-database.md`
- [ ] Chuẩn bị 3 câu chuyện dự án (mục 3)

**Một ngày trước**
- [ ] Đọc lại **chính code dự án của mình** — bị hỏi "dòng này để làm gì" mà ấp úng là mất điểm nặng
- [ ] Kiểm tra repo GitHub chạy được, README ổn
- [ ] Chuẩn bị 3–5 câu hỏi cho nhà tuyển dụng
- [ ] Test camera, mic, đường truyền nếu phỏng vấn online

**Trong buổi phỏng vấn**
- [ ] Không biết thì nói không biết, kèm cách bạn sẽ tìm hiểu
- [ ] Trả lời bằng **ví dụ cụ thể từ dự án**, không nói lý thuyết chung chung
- [ ] Ghi chép lại các câu bạn trả lời chưa tốt

**Sau buổi phỏng vấn**
- [ ] Viết lại toàn bộ câu hỏi được hỏi vào một file — đây là tài sản cho những lần sau
- [ ] Tra cứu và học kỹ những câu bạn trả lời sai
- [ ] Bị từ chối thì hỏi xin phản hồi. Nhiều người sẵn sàng trả lời, và đó là thông tin quý nhất bạn nhận được.

---

## 7. Lời cuối

Bị từ chối vài lần là chuyện bình thường, kể cả người giỏi. Mỗi buổi phỏng vấn cho bạn một danh sách chính xác những gì cần học tiếp — thứ mà không khóa học nào cung cấp được.

Cứ tiếp tục: học → làm dự án → phỏng vấn → sửa lỗ hổng → lặp lại. Chúc bạn sớm nhận được offer đầu tiên.
