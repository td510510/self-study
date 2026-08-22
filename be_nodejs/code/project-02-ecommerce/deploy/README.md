# Cấu hình triển khai — buổi 42

Hai file trong thư mục này dùng cho **buổi 42 (Nginx + PM2)** và được nhắc lại ở
**buổi 43 (health check)**, **buổi 44 (đo tải)**.

| File | Vai trò |
|---|---|
| `nginx.conf` | Reverse proxy: TLS, gzip, rate limit tầng biên, chuyển tiếp `X-Forwarded-*` |
| `ecosystem.config.cjs` | PM2 cluster mode: chạy nhiều tiến trình Node trên một máy |

---

## Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/shop
sudo ln -s /etc/nginx/sites-available/shop /etc/nginx/sites-enabled/
sudo nginx -t          # LUÔN kiểm tra cú pháp trước khi reload
sudo systemctl reload nginx
```

> `nginx -t` trước `reload` là thói quen bắt buộc. Reload với cấu hình sai
> làm Nginx từ chối nạp — và nếu đang restart thì site chết.

**Vì sao cần Nginx khi Node đã tự phục vụ HTTP được?**

| Việc | Vì sao không để Node làm |
|---|---|
| TLS | Nginx làm nhanh hơn, và không phải nạp lại app khi gia hạn chứng chỉ |
| File tĩnh | Node phải qua Event Loop; Nginx dùng `sendfile` của kernel |
| Rate limit tầng biên | chặn **trước khi** tốn tài nguyên Node (bổ sung cho buổi 23, không thay thế) |
| Cân bằng tải | phân phối cho nhiều tiến trình/máy |

⚠️ Khi có proxy đứng trước, app **phải** bật `app.set('trust proxy', 1)` — nếu không,
mọi rate limit theo IP sẽ thấy chung một IP là Nginx (buổi 23).

---

## PM2

```bash
pm2 start deploy/ecosystem.config.cjs --env production
pm2 reload shop-api     # reload = không rơi request; restart = có rơi
pm2 logs shop-api
pm2 monit
```

**`reload` khác `restart` thế nào?**

```
restart:  giết hết tiến trình  →  khởi động lại   →  có khoảng CHẾT
reload:   khởi động tiến trình mới → chuyển traffic → tắt tiến trình cũ tử tế
```

`reload` cần **hai** điều kiện, thiếu một là hỏng:

1. App gửi `process.send?.('ready')` sau khi `listen` — vì config đặt
   `wait_ready: true`. Không gửi thì PM2 chờ hết `listen_timeout` (10s).
2. App có **graceful shutdown** (buổi 08): PM2 gửi `SIGINT`, app tự đóng
   `server`, database, redis rồi mới thoát. Không xử lý tín hiệu thì
   `reload` **vẫn rơi request**.

Cả hai đã có sẵn trong `src/server.js`.

---

## Cluster mode và cái bẫy kết nối database

`instances: 'max'` chạy **một tiến trình mỗi CPU core**. Nhưng mỗi tiến trình
mở **pool riêng**:

```
8 tiến trình × pool 20  =  160 kết nối
Postgres mặc định       =  100 kết nối   ← VƯỢT TRẦN
```

Đây là lỗi thật hay gặp khi scale ngang (buổi 20, 42, 44). Hai cách xử lý:

1. Giảm `connection_limit` trong `DATABASE_URL` theo số tiến trình
2. Đặt **PgBouncer** trước Postgres để gộp kết nối

## Trạng thái phải đẩy ra ngoài tiến trình

Cluster mode làm lộ ra mọi chỗ còn giữ trạng thái trong RAM:

| Trạng thái trong RAM | Hỏng thế nào | Cách sửa | Buổi |
|---|---|---|---|
| Rate limit bằng `Map` | mỗi tiến trình đếm riêng → hạn mức × N | Redis | 21 |
| Phòng Socket.IO | client ở tiến trình A không nhận tin từ B | Redis adapter | 25 |
| File upload lưu đĩa cục bộ | request sau rơi vào tiến trình/máy khác → 404 | S3 hoặc volume chung | 17 |
| Job lặp bằng `cron` của OS | chạy N lần | BullMQ repeatable job | 26 |

> Cùng một bài học lặp lại bốn lần: **thứ cần nhân bản thì không được giữ trạng thái.**

---

## Đo tải sau khi deploy

```bash
node benchmark/do-tai.mjs
```

⚠️ Đọc **buổi 44** trước khi tin bất kỳ con số nào — ba lần đo sai được ghi lại
ở đó đều trông rất thuyết phục cho tới khi kiểm cột lỗi.
