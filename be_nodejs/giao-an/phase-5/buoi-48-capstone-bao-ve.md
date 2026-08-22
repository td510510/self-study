# Buổi 48 — Capstone: bảo vệ & tổng kết khoá học

> **Phase 5** · Production-ready — **buổi cuối cùng**
> **Mục tiêu:** Khép lại hành trình zero → hero bằng một sản phẩm hoàn chỉnh, và trả lời được mọi câu hỏi phản biện về nó.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–10′ | Sắp xếp thứ tự trình bày |
| 10–120′ | **Bảo vệ Capstone** (10 phút/người + 5 phút phản biện) |
| 120–150′ | Tổng kết: nhìn lại 48 buổi |
| 150–175′ | **Định hướng học tiếp** |
| 175–180′ | Kết thúc |

---

## 1. Cấu trúc bài bảo vệ (10 phút)

| Phút | Nội dung |
|---|---|
| 0–1 | Hệ thống làm gì, cho ai |
| 1–3 | **Demo trực tiếp** — luồng nghiệp vụ chính |
| 3–5 | Kiến trúc & quyết định công nghệ (nêu **tiêu chí**) |
| 5–7 | Phần khó nhất và cách giải quyết |
| 7–8 | Test & CI chạy được |
| 8–10 | Điều sẽ làm khác nếu làm lại |

> **📝 Ghi chú giảng viên**
> Yêu cầu **demo thật, không slide**. Slide che giấu được thứ chưa chạy được.
>
> Và mục cuối — *"điều sẽ làm khác"* — thường tiết lộ nhiều về trình độ hơn cả phần demo. Người hiểu sâu luôn biết chỗ mình làm chưa tốt.

---

## 2. Phản biện kỹ thuật (5 phút/người)

Mô phỏng một buổi phỏng vấn thật. **Chọn 3–4 câu** phù hợp với đề tài:

### Nhóm tranh chấp & dữ liệu

```
· Hai người cùng thao tác một lúc thì sao? Cho tôi xem code chỗ đó.   (buổi 19)
· Bước này lỗi giữa chừng — dữ liệu ra sao?                            (buổi 19)
· Vì sao trường tiền/số lượng này dùng kiểu đó?                        (buổi 18)
· Xoá bản ghi này thì cái gì bị ảnh hưởng? Vì sao chọn onDelete đó?     (buổi 18)
```

### Nhóm bảo mật

```
· Người dùng A đổi id trên URL thành id của B — chuyện gì xảy ra?      (buổi 16)
· Cho tôi xem chỗ bạn chặn client tự gửi vaiTro/giá/trạng thái.        (buổi 22)
· Log của bạn có lộ mật khẩu hay token không? Chứng minh.              (buổi 18)
· Response lỗi 500 trả về gì cho client?                              (buổi 05, 18)
```

### Nhóm hiệu năng

```
· Endpoint nào chậm nhất? Bạn ĐÃ ĐO chưa?                             (buổi 44)
· Có chỗ nào await trong vòng lặp database không?                      (buổi 13)
· Dữ liệu tăng 1000 lần — truy vấn nào gãy trước?                      (buổi 19, 20)
· Chạy 4 bản sao server thì cái gì hỏng?                               (buổi 21, 25, 42) 
```

### Nhóm thiết kế

```
· Vì sao chọn Express/Nest? Tiêu chí gì?                               (buổi 28, 39)
· Vì sao chọn Postgres/Mongo?                                          (buổi 14)
· Bạn ĐANG over-engineer chỗ nào?                                      (buổi 45)
· Thành phần X giải quyết vấn đề gì? Bỏ đi thì mất gì?                 (buổi 45)
```

> **Câu hỏi hay nhất để kết thúc:** *"Nếu tôi giao hệ thống này cho bạn vận hành và nó sập lúc 3 giờ sáng, bạn làm gì đầu tiên?"*
>
> Câu trả lời tốt sẽ nhắc tới: `/health`, log có `requestId`, bốn tín hiệu vàng, rollback (buổi 41, 43).

---

## 3. Tiêu chí chấm Capstone

| Tiêu chí | Điểm |
|---|---|
| Chạy được, demo trực tiếp thành công | 15 |
| Thiết kế schema đúng (tiền, lịch sử, `onDelete`, index) | 15 |
| Auth + phân quyền theo vai trò **và** chủ sở hữu | 15 |
| Có ít nhất một thao tác dùng transaction + khoá đúng cách | 10 |
| Validate đầu vào, mã lỗi ổn định | 10 |
| Test ≥ 30, database test riêng, chạy được | 10 |
| Docker hoá + CI chạy tự động | 10 |
| **Trả lời được phản biện** | 10 |
| README + API contract | 5 |

**Điểm trừ:**

| Lỗi | Trừ |
|---|---|
| Lỗ hổng IDOR | −20 |
| Lộ mật khẩu/token ở response hoặc log | −20 |
| `Float` cho tiền | −15 |
| Không có transaction ở chỗ cần | −15 |
| Test chạy trên database phát triển | −10 |
| Không giải thích được một quyết định công nghệ | −10 |

---

## 4. Tổng kết: nhìn lại 48 buổi (120–150′)

> **📝 Ghi chú giảng viên**
> Chiếu bảng này lên. Với học viên, đây là lúc họ nhận ra mình đã đi được bao xa.

### Hành trình

| Phase | Bắt đầu từ | Kết thúc ở |
|---|---|---|
| **0** | *"ai trả lời cái `fetch` đó?"* | CLI tool đọc/ghi file, có exit code |
| **1** | `http.createServer` thuần | **REST API không framework**, 46 test |
| **2** | Express đầu tiên | API có Postgres, JWT, RBAC, upload, logging |
| **3** | *"hai người cùng mua thì sao?"* | transaction, cache, OWASP, WebSocket, queue, Docker — **58 test** |
| **4** | *"vì sao cần DI?"* | NestJS đầy đủ, unit test nhanh gấp 10 lần |
| **5** | *"deploy thế nào?"* | CI/CD, monitoring, load test, **Capstone** |

### Những con số đã đo được

| Bài học | Số liệu |
|---|---|
| Chặn Event Loop | request khác chờ **7468ms** vs **4ms** |
| Ký tự UTF-8 bị cắt | đếm sai **496** thay vì 500 |
| Tuần tự vs song song | **1505ms** vs **302ms** |
| Tranh chấp không transaction | tồn kho **−5** |
| Index | truy vấn nhanh gấp **308 lần** |
| Pool cạn | `SELECT 1` chờ **1655ms** |
| Phân trang offset | chậm **6.5×** ở trang 10.000 |
| Cache Redis | HIT nhanh gấp **58 lần**; throughput **3.8×** |
| bcrypt vs SHA-256 | **131.000 lần** chậm hơn — có chủ đích |
| ReDoS | **16 giây** từ chuỗi 29 ký tự |
| Hàng đợi | phản hồi nhanh gấp **12 lần** |
| Unit test vs e2e | **1.1s** vs **10.0s** |

> **Không có con số nào ở trên là lý thuyết.** Tất cả đều được đo trong chính khoá học này.

### Ba thông điệp xuyên suốt

**1. Học nguyên lý trước, framework sau.**

> Vì thế Node thuần đứng trước Express, và Express đứng trước NestJS. Đến buổi 39, học viên thấy rõ: **Nest đổi vỏ, không đổi ruột**.

**2. Đo, đừng đoán.**

> Ba lần đo sai ở buổi 44 là bài học lớn hơn cả kết quả đo. Trực giác về hiệu năng sai rất thường xuyên.

**3. Bảo mật không phải một buổi học.**

> Bảng OWASP ở buổi 22 cho thấy ta chạm tới **9/10 mục** mà không cần gọi tên chúng — vì mỗi mục là hệ quả tự nhiên của việc viết code cẩn thận.

### Điều học viên nên tự hào

- Tự viết router, parse body, xử lý lỗi **trước khi** được framework làm hộ
- Tự tay tạo ra tồn kho âm, rồi tự vá
- Tự khai thác SQL injection, IDOR, mass assignment trên hệ thống của chính mình
- Đo được lợi ích của mọi tối ưu bằng số liệu
- Và **biết khi nào KHÔNG nên thêm gì**

---

## 5. Định hướng học tiếp (150–175′)

> Đừng đưa một danh sách 20 công nghệ. Đưa **lộ trình theo mục tiêu**.

### Nếu muốn đi sâu backend

| Chủ đề | Vì sao tiếp theo |
|---|---|
| PostgreSQL nâng cao | `EXPLAIN` sâu, partial index, window function, partitioning |
| Message broker (Kafka/RabbitMQ) | khi BullMQ không đủ — nhiều consumer, sự kiện bền vững |
| OpenTelemetry | truy vết xuyên service, nối tiếp `requestId` (buổi 43) |
| Kubernetes | khi Docker Compose không đủ để vận hành |
| Kiến trúc: DDD, CQRS, Event Sourcing | khi nghiệp vụ phức tạp hơn CRUD |

### Nếu muốn thành fullstack mạnh

| Chủ đề | |
|---|---|
| GraphQL đầy đủ | DataLoader, giới hạn độ phức tạp (buổi 24) |
| tRPC | kiểu dữ liệu xuyên suốt FE–BE |
| Next.js server actions | ranh giới FE–BE mờ đi |

### Nếu muốn làm được ngay hôm nay

```
1. Đọc lại code Capstone của mình sau 1 tháng — bạn sẽ thấy chỗ sửa
2. Đóng góp cho một dự án mã nguồn mở nhỏ
3. Tự dựng lại Project 2 từ đầu KHÔNG nhìn code cũ
4. Dạy lại một buổi cho người khác — cách kiểm tra hiểu tốt nhất
```

> **📝 Ghi chú giảng viên — câu kết**
>
> *"Các bạn bắt đầu khoá học với câu hỏi 'ai trả lời cái fetch đó?'. Giờ các bạn CHÍNH LÀ người trả lời.*
>
> *Nhưng thứ đáng giá nhất các bạn mang đi không phải Express hay NestJS — hai thứ đó rồi sẽ đổi. Đáng giá nhất là ba thói quen: **đo trước khi tối ưu**, **hỏi 'nếu hai người cùng làm thì sao'**, và **biết khi nào KHÔNG thêm gì**.*
>
> *Ba thói quen đó dùng được cả đời."*

---

## 6. Checklist tốt nghiệp

Học viên tự đánh giá — mỗi mục phải **giải thích được**, không chỉ *"biết"*:

**Nền tảng**
- [ ] HTTP là văn bản; stateless dẫn tới những gì
- [ ] Event Loop; vì sao không được chặn nó
- [ ] Stream, Buffer, và vì sao ký tự UTF-8 bị vỡ

**Dữ liệu**
- [ ] Thiết kế schema: tiền, lịch sử, `onDelete`, index
- [ ] Transaction + khoá dòng chống tranh chấp
- [ ] N+1, connection pool, phân trang cursor

**Bảo mật**
- [ ] bcrypt, JWT, refresh token rotation
- [ ] RBAC + chủ sở hữu, chống IDOR
- [ ] SQL injection, mass assignment, XSS, ReDoS
- [ ] CORS bảo vệ ai, rate limit đặt ở đâu

**Kiến trúc**
- [ ] Tách tầng; vì sao service không được biết HTTP
- [ ] DI và vì sao nó làm test dễ hơn
- [ ] Vòng đời request của Nest

**Vận hành**
- [ ] Graceful shutdown và `dumb-init`
- [ ] Log có cấu trúc, che dữ liệu nhạy cảm, `requestId`
- [ ] Health check: liveness vs readiness
- [ ] CI/CD, migration tương thích ngược
- [ ] Đo tải bằng phân vị; biết khi nào số liệu vô nghĩa

**Tư duy**
- [ ] Khi nào KHÔNG dùng cache/queue/microservices
- [ ] Đánh đổi nhất quán, đồng bộ, ghép nối
- [ ] Review code người khác có hệ thống

---

## 🎓 Kết thúc khoá học

**48 buổi · 5 phase · 4 project · hơn 130 test**

Từ `http.createServer` tới một hệ thống có auth, transaction, cache, queue, realtime, Docker, CI/CD và giám sát.

---

**Buổi trước:** [Buổi 47 — Capstone: thiết kế](./buoi-47-capstone-thiet-ke.md)
**Quay lại:** [Mục lục giáo án](../README.md)
