# Buổi 42 — Deploy thực chiến: Nginx + PM2

> **Phase 5** · Production-ready
> **Mục tiêu:** Đưa hệ thống lên môi trường truy cập công khai, và hiểu vì sao không bao giờ để Node đứng trực tiếp trước Internet.
> **Code:** [`deploy/nginx.conf`](../../code/project-02-ecommerce/deploy/nginx.conf) · [`deploy/ecosystem.config.cjs`](../../code/project-02-ecommerce/deploy/ecosystem.config.cjs)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 41 |
| 15–60′ | **Vì sao cần reverse proxy** |
| 60–110′ | Cấu hình Nginx: bốn chi tiết dễ sai |
| 110–150′ | PM2: cluster mode và bài toán connection pool |
| 150–170′ | HTTPS với Let's Encrypt |
| 170–180′ | Bài tập |

---

## 1. Vì sao cần reverse proxy (15–60′)

Hỏi lớp: *"`app.listen(80)` là xong rồi, cần Nginx làm gì?"*

| Việc | Node làm được? | Nginx |
|---|---|---|
| Phục vụ file tĩnh | được, nhưng chậm hơn nhiều | rất nhanh |
| TLS/HTTPS | được, nhưng cấu hình phức tạp | chuẩn ngành |
| Giữ 10.000 kết nối rảnh | tốn RAM | tốn rất ít |
| Nén gzip | tốn CPU của app | tốn CPU riêng |
| Load balancer cho nhiều bản sao | ❌ | ✅ |
| Rate limit lớp ngoài | app phải xử lý mới chặn được | chặn **trước** khi tới app |

> **Điểm mấu chốt:** rate limit ở Nginx chặn request **trước khi** nó tốn CPU của Node.
>
> Nối lại buổi 23: rate limit trong app đã tốt, nhưng request vẫn phải đi qua toàn bộ chuỗi middleware. Ở Nginx nó bị chặn ngay ở cửa.

```nginx
limit_req_zone $binary_remote_addr zone=chung:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=dangnhap:10m rate=1r/s;
```

> Endpoint đăng nhập siết **30 lần** chặt hơn — vì `bcrypt` tốn CPU thật (buổi 15).

---

## 2. Bốn chi tiết Nginx dễ sai (60–110′)

### 2.1. Quên `X-Forwarded-For` → rate limit chặn nhầm tất cả

```nginx
proxy_set_header X-Real-IP        $remote_addr;
proxy_set_header X-Forwarded-For  $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host             $host;
```

> **⚠️ Không có mấy dòng này, mọi request trông như đến từ Nginx.**
>
> Hậu quả: `req.ip` trong app luôn là `127.0.0.1` → rate limit theo IP (buổi 23) đếm **toàn bộ người dùng vào chung một bộ đếm** → một người gọi nhiều là **cả thế giới bị chặn**.
>
> Và log ghi sai IP → không truy vết được ai tấn công.

Phía app cũng phải bật:

```js
app.set('trust proxy', 1);
```

> Không có dòng này, Express **không tin** header đó và vẫn dùng IP của Nginx.
>
> **⚠️ Chỉ bật khi THẬT SỰ có proxy phía trước.** Bật khi không có proxy = ai cũng giả được IP bằng cách tự gửi header `X-Forwarded-For`.

### 2.2. WebSocket cần cấu hình riêng

```nginx
location /socket.io/ {
    proxy_pass http://shop_api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout  3600s;
}
```

> **📝 Ghi chú giảng viên**
> Thiếu hai header `Upgrade`/`Connection` thì kết nối WebSocket bị từ chối, và Socket.IO **lặng lẽ lùi về long-polling** — chậm hơn nhiều mà **không có lỗi nào báo**.
>
> Đây là loại bug tệ nhất: mọi thứ "vẫn chạy", chỉ là chậm, và không ai biết vì sao.
>
> Và `proxy_read_timeout` mặc định là 60 giây — WebSocket sống lâu hơn thế sẽ bị cắt.

### 2.3. `keepalive` tới upstream

```nginx
upstream shop_api {
    least_conn;
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

> Giữ sẵn kết nối tới Node — tránh bắt tay TCP mỗi request. Nối lại buổi 20: mở kết nối mới tốn **25 lần** so với tái sử dụng.

### 2.4. Giới hạn body ở lớp ngoài

```nginx
client_max_body_size 2m;
```

> Chặn ở đây thì Node **không phải đọc gì cả** (buổi 17). Nhưng vẫn giữ giới hạn trong app — **phòng thủ theo tầng**, phòng khi ai đó gọi thẳng vào Node.

---

## 3. PM2 & bài toán connection pool (110–150′)

```js
instances: 'max',
exec_mode: 'cluster',
```

> Nhớ buổi 02: Node **đơn luồng** — một tiến trình chỉ dùng được **một nhân CPU**. Máy 8 nhân mà chạy một tiến trình là phí 7 nhân.

### ⚠️ Bẫy lớn nhất: tổng kết nối database

> **📝 Ghi chú giảng viên — bắt lớp tự tính**
>
> Máy 8 nhân → `instances: 'max'` → 8 bản sao.
> Mỗi bản sao có pool 20 kết nối (buổi 20).
>
> **8 × 20 = 160 kết nối.**
>
> Trần mặc định của Postgres: **100**.
>
> → Ứng dụng sẽ báo `too many clients already` — đúng lỗi ta đã gặp ở buổi 20.

Ba cách giải:

| Cách | Đánh đổi |
|---|---|
| Giảm pool xuống 10 | 8 × 10 = 80, vừa đủ nhưng sát trần |
| Giảm số bản sao | không dùng hết CPU |
| **PgBouncer** | thêm một thành phần, nhưng giải quyết triệt để |

> PgBouncer gom kết nối từ nhiều bản sao thành **ít** kết nối thật tới Postgres. Đây là lời giải chuẩn khi scale ngang.

### Ba tuỳ chọn PM2 liên quan tới bài học cũ

```js
kill_timeout: 15000,      // cho app đủ thời gian tắt tử tế (buổi 08)
max_memory_restart: '500M',
min_uptime: '10s',
max_restarts: 10,
```

| Tuỳ chọn | Nối lại buổi |
|---|---|
| `kill_timeout` | 08 — PM2 gửi `SIGINT`, chờ, rồi mới `SIGKILL` |
| `max_memory_restart` | 02 — lưới an toàn cho rò rỉ bộ nhớ |
| `min_uptime` + `max_restarts` | tránh vòng lặp crash-restart vô tận |

### `reload` không rơi request — nhưng chỉ khi app hợp tác

```js
wait_ready: true,
listen_timeout: 10000,
```

```
restart:  giết hết tiến trình  →  khởi động lại        →  có khoảng CHẾT
reload:   bật tiến trình mới → chuyển traffic → tắt cũ  →  không rơi request
```

`reload` cần **hai** điều kiện, thiếu một là hỏng:

| Điều kiện | Thiếu thì sao |
|---|---|
| App tự gửi tín hiệu `ready` khi đã `listen` | PM2 chờ hết `listen_timeout` rồi mới chuyển traffic — deploy nào cũng chậm thêm vài giây vô ích |
| App xử lý `SIGINT` để tắt tử tế (buổi 08) | tiến trình cũ bị `SIGKILL` giữa chừng — **vẫn rơi request**, dù đã gọi `reload` |

Trong `src/server.js` của Project 2:

```js
const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Server đã sẵn sàng');
  process.send?.('ready');   // ← PM2 chờ đúng dòng này
});
```

> **📝 Ghi chú giảng viên**
> `?.` là cần thiết: khi chạy `node src/server.js` bình thường (không qua PM2),
> `process.send` **không tồn tại**. Gọi thẳng sẽ crash ngay khi khởi động —
> một lỗi chỉ lộ ra ở môi trường dev, sau khi đã "chạy tốt trên production".
>
> Đây cũng là lần thứ hai trong khoá học `process.send` xuất hiện: lần đầu ở
> buổi 08, dùng làm kênh IPC để **kiểm thử graceful shutdown trên Windows**.

> **⚠️ Nếu đã dùng Docker (buổi 27) thì thường KHÔNG cần PM2** — Docker/Kubernetes đã lo khởi động lại và scale. PM2 dùng khi deploy thẳng lên VPS không container.
>
> Dùng cả hai = hai lớp quản lý tiến trình chồng nhau, và tín hiệu bị chuyển qua hai lớp — dễ sai.

---

## 4. HTTPS với Let's Encrypt (150–170′)

```bash
sudo certbot --nginx -d shop.example.com
```

> Certbot tự sửa `nginx.conf`, xin chứng chỉ, và cài cron gia hạn. Chứng chỉ Let's Encrypt sống **90 ngày** — quên gia hạn là site không vào được.

```nginx
ssl_protocols TLSv1.2 TLSv1.3;
server_tokens off;
```

| | |
|---|---|
| `TLSv1.2` trở lên | TLS 1.0/1.1 đã lỗi thời và không an toàn |
| `server_tokens off` | không khoe phiên bản Nginx (nối buổi 23) |

> Và nhắc lại **HSTS** (buổi 23): chỉ bật khi **đã chắc chắn** có HTTPS. Đây là header khó hoàn tác nhất.

---

## 5. VPS hay PaaS?

| | VPS tự quản | PaaS (Railway, Fly.io, Render) |
|---|---|---|
| Chi phí | rẻ hơn | đắt hơn |
| Kiểm soát | toàn bộ | hạn chế |
| Việc phải tự làm | OS, bảo mật, backup, monitoring | gần như không |
| Thời gian setup | ngày | phút |
| Phù hợp | có người biết vận hành | team nhỏ, tập trung vào sản phẩm |

> **📝 Ghi chú giảng viên**
> Nói thẳng: với dự án nhỏ và team không có người chuyên vận hành, **PaaS gần như luôn là lựa chọn đúng**. Tiền trả thêm rẻ hơn nhiều so với thời gian và rủi ro.
>
> Học VPS để **hiểu** cái gì đang chạy bên dưới — không phải để luôn tự làm.

---

## 6. Bài tập về nhà

1. **Deploy thật.** Thuê VPS rẻ nhất, deploy Project 2 với Nginx + Docker. Truy cập được qua IP công khai.

2. **HTTPS.** Trỏ domain (hoặc dùng dịch vụ domain miễn phí), chạy certbot. Kiểm chứng `https://` hoạt động và `http://` tự chuyển hướng.

3. **Chứng minh lỗi `X-Forwarded-For`.** Bỏ các dòng `proxy_set_header`, gọi API nhiều lần từ hai máy khác nhau. Rate limit có chặn nhầm không? Log ghi IP gì?

4. **Chứng minh WebSocket cần cấu hình riêng.** Bỏ hai header `Upgrade`/`Connection`, mở client Socket.IO. Nó có kết nối được không? Bằng transport nào? Có lỗi nào báo không?

5. **Tính connection pool.** VPS của bạn có mấy nhân? `instances: 'max'` là bao nhiêu bản sao? Nhân với pool size — có vượt 100 không? Điều chỉnh và giải thích.

6. **Nâng cao — PgBouncer.** Thêm PgBouncer vào compose, cho app kết nối qua nó. Chạy `demo-pool.js` (buổi 20) với pool 120 — còn lỗi `too many clients` không?

---

## 7. Checklist kết thúc buổi

- [ ] Kể 4 việc Nginx làm tốt hơn Node.
- [ ] Rate limit ở Nginx hơn rate limit trong app ở điểm nào?
- [ ] Quên `X-Forwarded-For` gây hậu quả gì?
- [ ] `trust proxy` khi nào **không** được bật?
- [ ] Thiếu header `Upgrade` thì WebSocket ra sao? Có báo lỗi không?
- [ ] 8 bản sao × pool 20 = bao nhiêu kết nối? Trần Postgres là bao nhiêu?
- [ ] `kill_timeout` của PM2 liên quan tới bài học buổi nào?
- [ ] Khi nào **không** cần PM2?
- [ ] Chứng chỉ Let's Encrypt sống bao lâu?

---

**Buổi trước:** [Buổi 41 — CD: build & deploy tự động](./buoi-41-cd-deploy-tu-dong.md)
**Buổi tiếp theo:** Buổi 43 — Monitoring & health check
