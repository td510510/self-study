# Đọc trước Module 11 — Web hoạt động thế nào?

> Mục tiêu: hiểu chuyện gì xảy ra từ lúc gõ địa chỉ tới lúc nhận được JSON, để khi API lỗi bạn biết **lỗi nằm ở tầng nào**.
> Thời lượng: 1–2 buổi. Mọi lệnh bên dưới chạy được trong Git Bash (Windows), Terminal (macOS/Linux).

---

## 1. Hành trình của một request

Khi app di động gọi `GET https://api.shop.vn/api/v1/products/42`:

```
 ① DNS        "api.shop.vn là IP nào?"            -> 203.0.113.10
 ② TCP        bắt tay 3 bước tới 203.0.113.10:443  (SYN, SYN-ACK, ACK)
 ③ TLS        trao đổi chứng chỉ, thống nhất khóa mã hóa (vì là https)
 ④ HTTP       gửi request dạng văn bản qua kết nối đã mã hóa
 ⑤ Server     Load balancer -> Nginx -> Tomcat -> Spring DispatcherServlet -> Controller
 ⑥ HTTP       nhận response: status + headers + body JSON
 ⑦ Kết nối    giữ lại (keep-alive) để request sau khỏi bắt tay lại
```

Mỗi bước có kiểu lỗi riêng — nhận ra được là tiết kiệm hàng giờ debug:

| Thông báo lỗi | Tầng | Nghĩa là |
|---|---|---|
| `UnknownHostException` | DNS | tên miền sai / không phân giải được |
| `Connection refused` | TCP | đúng máy nhưng **không có ai nghe** ở cổng đó (app chưa chạy, sai port) |
| `Connection timed out` | TCP | không tới được máy (firewall chặn, sai IP, mạng nội bộ) |
| `SSLHandshakeException`, `PKIX path building failed` | TLS | chứng chỉ không tin cậy / hết hạn |
| `Read timed out` | HTTP | đã kết nối, server nhận request nhưng **trả lời quá chậm** |
| Status `4xx` | HTTP | server trả lời, **bạn gửi sai** |
| Status `5xx` | HTTP | server trả lời, **server lỗi** |
| `502 Bad Gateway` / `504 Gateway Timeout` | Proxy | Nginx/gateway sống, nhưng app phía sau chết hoặc quá chậm |

---

## 2. DNS — danh bạ của Internet

Máy tính chỉ nói chuyện bằng địa chỉ IP. DNS đổi tên miền thành IP.

```bash
nslookup google.com          # Windows/macOS/Linux
```

- `localhost` luôn là `127.0.0.1` — chính máy bạn.
- File `hosts` (`C:\Windows\System32\drivers\etc\hosts`, `/etc/hosts`) được ưu tiên hơn DNS — dev hay sửa file này để trỏ tên miền thử về máy mình.
- Trong Docker Compose, **tên service chính là tên miền**: container `order-service` gọi được `http://product-service:8082` vì Docker có DNS nội bộ (Module 15). Đó là lý do trong container không dùng `localhost` để gọi container khác được.

## 3. IP, cổng (port) và TCP

- **IP** xác định **máy**. **Port** xác định **chương trình** trên máy đó (0–65535).
- Một port chỉ một chương trình được nghe. Chạy Spring Boot lần hai → `Port 8080 was already in use`.
- Port quen thuộc: 80 (HTTP), 443 (HTTPS), 22 (SSH), 5432 (PostgreSQL), 3306 (MySQL), 6379 (Redis), 9092 (Kafka), 8080 (Spring Boot mặc định).

```bash
# Ai đang chiếm cổng 8080?
netstat -ano | findstr :8080        # Windows -> cột cuối là PID
lsof -i :8080                       # macOS/Linux
```

**TCP** đảm bảo dữ liệu tới **đủ và đúng thứ tự** (gửi lại gói bị mất). Mở một kết nối TCP tốn 1 lượt đi-về, thêm TLS tốn thêm 1–2 lượt — vì thế HTTP client và connection pool DB đều **giữ kết nối để tái sử dụng**.

## 4. HTTP — giao thức văn bản

HTTP/1.1 chỉ là **văn bản** gửi qua TCP. Xem tận mắt bằng `curl -v`:

```bash
curl -v https://httpbin.org/get?page=1
```

```
> GET /get?page=1 HTTP/1.1          <- dòng request: METHOD  ĐƯỜNG-DẪN  PHIÊN-BẢN
> Host: httpbin.org                 <- header: một dòng một cặp "Tên: giá trị"
> User-Agent: curl/8.4.0
> Accept: */*
>                                   <- dòng trống: hết header (GET không có body)
< HTTP/1.1 200 OK                   <- dòng status
< Content-Type: application/json
< Content-Length: 256
<
{ "args": { "page": "1" }, ... }    <- body
```

### Cấu trúc URL
```
https://api.shop.vn:443/api/v1/products?category=laptop&page=0#reviews
└─┬─┘   └────┬────┘└┬┘└──────┬───────┘└─────────┬─────────┘└──┬──┘
scheme     host   port     path              query string   fragment (không gửi lên server)
```
Ký tự đặc biệt trong query phải **mã hóa URL**: dấu cách → `%20`, `&` → `%26`, tiếng Việt `á` → `%C3%A1`. Spring tự giải mã khi bind vào `@RequestParam`.

### Header hay gặp

| Header | Chiều | Ý nghĩa |
|---|---|---|
| `Content-Type: application/json` | cả hai | body là gì. Gửi JSON mà quên header này → Spring trả `415 Unsupported Media Type` |
| `Accept: application/json` | request | tôi muốn nhận kiểu gì |
| `Authorization: Bearer eyJ...` | request | token xác thực (Module 13) |
| `Cookie` / `Set-Cookie` | req / res | trình duyệt tự gửi kèm cookie |
| `Location: /api/v1/books/7` | response | địa chỉ tài nguyên vừa tạo (đi kèm `201`) |
| `Cache-Control`, `ETag` | response | cho phép cache bao lâu, phiên bản của dữ liệu |
| `X-Request-Id` | cả hai | mã lần vết request (tự đặt, xem mục Logging của Module 11) |
| `Origin` | request | trình duyệt cho biết trang nào đang gọi → dùng cho CORS |

### Các phiên bản HTTP
- **HTTP/1.1**: mỗi kết nối xử lý tuần tự từng request.
- **HTTP/2**: nhiều request song song trên **một** kết nối, header được nén. Trình duyệt và gateway hiện đại dùng mặc định.
- **HTTP/3**: chạy trên UDP (QUIC), nhanh hơn trên mạng di động chập chờn.

Với backend Java bạn hiếm khi phải quan tâm: Tomcat và RestClient lo phần này. Nhưng **ngữ nghĩa** (method, status, header) thì y hệt ở mọi phiên bản.

## 5. HTTPS và TLS

HTTPS = HTTP chạy bên trong một đường hầm TLS. TLS đảm bảo 3 điều:
1. **Bí mật**: người ở giữa (Wi-Fi quán cà phê) không đọc được mật khẩu, token.
2. **Toàn vẹn**: không ai sửa được nội dung trên đường đi.
3. **Xác thực server**: chứng chỉ do tổ chức tin cậy (CA) ký chứng minh bạn đang nói chuyện với đúng `api.shop.vn`.

Thực tế triển khai: TLS thường được "cởi" ở **load balancer/Nginx**, phía sau (mạng nội bộ) Spring Boot chạy HTTP thường ở cổng 8080. Vì thế bạn hiếm khi cấu hình chứng chỉ trong Spring Boot.

> Không bao giờ gửi mật khẩu/token qua HTTP thường ở môi trường thật. Và **không bao giờ** "sửa" lỗi `PKIX` bằng cách tắt kiểm tra chứng chỉ — đó là mở cửa cho tấn công man-in-the-middle.

## 6. Stateless, cookie, session và token

HTTP **không nhớ gì** giữa hai request. Muốn "đăng nhập" thì mỗi request phải tự mang theo bằng chứng. Hai cách phổ biến:

| | Session + cookie | Token (JWT) |
|---|---|---|
| Server lưu gì | bảng session (RAM/Redis): `sessionId -> user` | không lưu gì, token tự chứa thông tin + chữ ký |
| Client gửi gì | `Cookie: JSESSIONID=abc` (trình duyệt tự gửi) | `Authorization: Bearer eyJ...` (client tự gắn) |
| Nhiều server | phải dùng chung kho session (Redis) | server nào cũng tự kiểm chữ ký được |
| Thu hồi ngay | dễ: xóa session | khó: phải chờ hết hạn hoặc lưu danh sách đen |
| Hợp với | web render phía server, trình duyệt | API cho mobile/SPA, microservices |

Chi tiết ở Module 13. Điều cần nhớ bây giờ: **stateless** là lý do REST API chạy nhiều instance sau load balancer được — request nào tới instance nào cũng xử lý được.

## 7. CORS — vì sao trình duyệt chặn API của chính bạn?

Frontend ở `http://localhost:3000` gọi API ở `http://localhost:8080` → trình duyệt báo lỗi CORS, dù gọi bằng Postman/curl vẫn chạy bình thường. Vì sao?

- Trình duyệt áp dụng **Same-Origin Policy**: JavaScript của trang A không được đọc response từ origin B (origin = scheme + host + port). Đây là cơ chế bảo vệ **người dùng**: trang độc hại không đọc được dữ liệu ngân hàng của bạn dù trình duyệt đang giữ cookie đăng nhập.
- **CORS** là cách server B nói "tôi cho phép origin A đọc": trả về header `Access-Control-Allow-Origin: http://localhost:3000`.
- Với request "không đơn giản" (có `Authorization`, `Content-Type: application/json`, method PUT/DELETE...), trình duyệt gửi trước một request `OPTIONS` (**preflight**) để hỏi. Server trả lời sai → request thật không bao giờ được gửi.
- curl/Postman/server-to-server **không có** Same-Origin Policy → không bao giờ gặp lỗi CORS.

Kết luận: CORS **không phải cơ chế bảo mật cho API** (kẻ tấn công dùng curl là vượt qua); nó bảo vệ người dùng trình duyệt. API vẫn phải xác thực đầy đủ. Cấu hình CORS trong Spring ở Module 11 mục 9.

## 8. Công cụ — luyện tay ngay

```bash
# GET đơn giản, -i để xem cả status + header
curl -i https://httpbin.org/get

# POST JSON
curl -X POST https://httpbin.org/post \
  -H "Content-Type: application/json" \
  -d '{"name":"An","age":20}'

# Chỉ xem header, đo thời gian
curl -I https://github.com
curl -o /dev/null -s -w "DNS %{time_namelookup}s | TCP %{time_connect}s | TLS %{time_appconnect}s | Tổng %{time_total}s\n" https://github.com

# Xem status code cụ thể
curl -i https://httpbin.org/status/404
curl -i https://httpbin.org/status/503

# Thử timeout: server chờ 5 giây mới trả lời, client chỉ chờ 2 giây
curl --max-time 2 https://httpbin.org/delay/5
```

Công cụ khác: **tab Network trong DevTools của trình duyệt** (F12) — xem mọi request trang web gửi đi, header, thời gian; **Postman** hoặc file `.http` của IntelliJ để lưu bộ request.

---

## Bài tập

**W1.** Chạy lệnh `curl -w` ở mục 8 với 3 trang web khác nhau. Bước nào chiếm nhiều thời gian nhất? Chạy lại lần 2 có nhanh hơn không (gợi ý: DNS cache)?

**W2.** Dùng `curl -v` gửi một request POST JSON tới `https://httpbin.org/post`. Chép lại toàn bộ request và response, chú thích từng dòng.

**W3.** Mở DevTools → Network, tải trang một website tin tức. Trả lời: bao nhiêu request? Request nào chậm nhất? Tìm một response có `Cache-Control` và giải thích giá trị của nó.

**W4.** Cho các lỗi sau, đoán tầng lỗi và cách kiểm tra:
1. `java.net.ConnectException: Connection refused` khi app gọi `localhost:5432`.
2. Từ container `order-service`, gọi `http://localhost:8082` bị `Connection refused` dù product-service đang chạy.
3. Frontend báo `has been blocked by CORS policy`, nhưng Postman gọi được.
4. Gọi API đối tác bị `Read timed out` sau đúng 30 giây.
5. Nginx trả `502 Bad Gateway`.

**W5.** Mở file `hosts`, thêm dòng `127.0.0.1 shop.local`. Chạy spring-playground rồi mở `http://shop.local:8080/`. Giải thích vì sao chạy được. (Nhớ xóa dòng đó sau khi thử.)

## Câu hỏi phỏng vấn
1. Chuyện gì xảy ra khi bạn gõ một URL vào trình duyệt và nhấn Enter? *(câu kinh điển — trả lời theo 7 bước ở mục 1)*
2. HTTP và HTTPS khác nhau thế nào?
3. HTTP là stateless — vậy làm sao "đăng nhập" được?
4. Cookie, session và token khác nhau thế nào?
5. CORS là gì? Vì sao Postman không bị lỗi CORS?
6. `Connection refused` khác `Connection timed out` thế nào?
7. 502 khác 504 thế nào?

👉 Quay lại [Module 11](README.md).
