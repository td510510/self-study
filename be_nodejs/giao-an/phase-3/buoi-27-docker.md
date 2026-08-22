# Buổi 27 — Docker hoá toàn bộ dự án

> **Phase 3** · Backend chuyên sâu — **buổi tổng kết**
> **Mục tiêu:** Đóng gói hệ thống nhiều thành phần thành một môi trường chạy nhất quán, tái lập được — người khác clone về chạy được ngay chỉ với Docker.
> **Code thực hành:** [`Dockerfile`](../../code/project-02-ecommerce/Dockerfile) · [`docker-compose.full.yml`](../../code/project-02-ecommerce/docker-compose.full.yml)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 26 |
| 15–75′ | **Dockerfile: từng dòng một quyết định** |
| 75–110′ | **Đo kích thước ảnh — và bài học "tối ưu" sai** |
| 110–150′ | Compose: mạng nội bộ, thứ tự khởi động |
| 150–170′ | Kiểm chứng graceful shutdown trong container |
| 170–180′ | Tổng kết Phase 3 |

---

## 1. Vì sao Docker (15–25′)

Nhắc lại lời hứa từ buổi 12: *"người khác clone về chạy được ngay, không cần cài gì ngoài Docker"*.

Hôm nay ta thực hiện lời hứa đó cho **toàn bộ** hệ thống: API + Postgres + Redis + migration.

| Không có Docker | Có Docker |
|---|---|
| "Máy em Node 18, anh Node 22" | cùng một ảnh, cùng một phiên bản |
| "Postgres của em là 14" | cùng `postgres:17-alpine` |
| Cài đặt mất nửa ngày | `docker compose up -d` |
| Dev khác production | **cùng một ảnh** chạy ở cả hai nơi |

> Dòng cuối là giá trị lớn nhất. Nó xoá bỏ cả một lớp sự cố *"chạy được ở staging mà hỏng ở production"*.

---

## 2. Dockerfile — từng dòng một quyết định (25–75′)

### 2.1. Thứ tự COPY quyết định tốc độ build

```dockerfile
COPY package*.json ./
RUN npm ci
COPY src ./src        # ← mã nguồn copy SAU
```

> Docker cache **theo từng lệnh**. Nếu `package.json` không đổi, lệnh `npm ci` dùng lại cache — tiết kiệm **hàng phút** mỗi lần build.
>
> Copy cả thư mục trước thì **mọi thay đổi mã nguồn** đều làm mất cache và phải cài lại dependency.

Cho học viên thử: sửa một dòng trong `src/`, build lại, xem `CACHED` xuất hiện ở đâu.

### 2.2. `npm ci` chứ không `npm install`

| | `npm install` | `npm ci` |
|---|---|---|
| Phiên bản | có thể nâng theo `^` | **đúng** lock file |
| Sửa lock file | có | **không** |
| Lock file không khớp | tự sửa | **thất bại** ✅ |
| Tốc độ | chậm hơn | nhanh hơn |

> Nối lại buổi 03: `package-lock.json` là lời giải cho *"nhưng nó chạy được trên máy tôi"*. `npm ci` là cách **bắt buộc** dùng nó.

### 2.3. `dumb-init` — thứ khiến buổi 08 có tác dụng

```dockerfile
RUN apk add --no-cache dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
```

> **📝 Ghi chú giảng viên — điểm dạy quan trọng nhất phần này**
>
> Trong Linux, tiến trình **PID 1** có luật đặc biệt: nó **không** nhận tín hiệu mặc định. Nếu Node chạy trực tiếp ở PID 1, `SIGTERM` từ `docker stop` **không tới được** handler của ta.
>
> → Toàn bộ graceful shutdown viết ở buổi 08 **không bao giờ chạy**. Container bị `SIGKILL` sau 10 giây chờ.
>
> `dumb-init` đứng ở PID 1 và **chuyển tín hiệu** xuống Node.

Kiểm chứng thật:

```
$ docker compose stop api

api-1  | {"level":"info","tinHieu":"SIGTERM","msg":"Bắt đầu tắt tử tế"}
api-1  | {"level":"info","msg":"Đã thoát sạch sẽ"}
```

> Hai dòng log này là bằng chứng: tín hiệu tới nơi, và code buổi 08 đã chạy.

### 2.4. Không chạy bằng root

```dockerfile
COPY --from=build --chown=node:node /app/node_modules ./node_modules
USER node
```

> Mặc định container chạy bằng **root**. Ứng dụng bị chiếm quyền (ví dụ qua lỗ hổng ở buổi 22) thì kẻ tấn công có quyền root **trong container** — và từ đó dễ thoát ra ngoài hơn nhiều.
>
> Ảnh `node` chính thức đã có sẵn user `node`. Chỉ cần dùng.

### 2.5. `.dockerignore` — quan trọng hơn vẻ ngoài

```
node_modules      # build ở máy khác kiến trúc là hỏng
.env              # ⚠️ chứa BÍ MẬT — tuyệt đối không đưa vào ảnh
.git
test
```

> **⚠️ `.env` lọt vào ảnh là sự cố bảo mật.** Ảnh Docker thường được đẩy lên registry, và **bất kỳ ai kéo được ảnh đều đọc được** mọi file trong đó — kể cả file đã bị xoá ở tầng sau, vì các tầng cũ vẫn còn.

---

## 3. Trọng tâm: đo kích thước ảnh (75–110′)

> **📝 Ghi chú giảng viên — bài học về việc ĐO thay vì ĐOÁN**
>
> Phần này kể lại đúng những gì xảy ra khi soạn bài. Nó dạy về **phương pháp** nhiều hơn là về Docker.

### Bước 1 — Bản đầu tiên: 737MB

Ảnh chạy được, nhưng lớn. Ý tưởng tối ưu nghe rất hợp lý: *"thêm một tầng chỉ cài dependency production"*.

```dockerfile
FROM node:22-alpine AS deps-prod
RUN npm ci --omit=dev
...
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
```

### Bước 2 — Bản "tối ưu": **964MB** 🚨

> **Ảnh PHÌNH TO thêm 227MB.**
>
> Dừng lại hỏi lớp: *"Vì sao?"* Để họ đoán trước khi xem số liệu.

### Bước 3 — Đo bằng `docker history`

```
=== shop-api:toi-uu ===
382MB   COPY /app/node_modules ./node_modules
178MB   COPY /app/node_modules/@prisma ./node_modules/@prisma   ← 🚨
160MB   (ảnh nền node:22-alpine)

=== shop-api:demo ===
390MB   COPY /app/node_modules ./node_modules
160MB   (ảnh nền)
```

**Nguyên nhân:** engine của Prisma bị tính **hai lần** — một lần trong `node_modules` của tầng prod, một lần nữa khi copy `@prisma` từ tầng build.

> Mỗi lệnh `COPY` tạo một **tầng mới**. Tầng chỉ **cộng thêm**, không bao giờ trừ đi. Copy đè lên file cũ thì file cũ **vẫn nằm trong tầng trước**.

### Bước 4 — Sửa đúng: gộp một tầng, `npm prune`

```dockerfile
FROM node:22-alpine AS build
RUN npm ci
RUN npx prisma generate
RUN npm prune --omit=dev      # ← tỉa NGAY TRONG tầng này, sau khi generate
```

Kết quả:

| Ảnh | Kích thước |
|---|---|
| bản đầu (737MB) | 737 MB |
| bản "tối ưu" sai | **964 MB** 🚨 |
| bản sửa đúng | **727 MB** ✅ |

> **Ba bài học:**
> 1. Multi-stage giảm kích thước **chỉ khi** mỗi tệp được copy **đúng một lần**
> 2. Tầng Docker chỉ **cộng thêm**, không trừ đi
> 3. **Luôn đo bằng `docker history`, đừng đoán** — trực giác về kích thước ảnh rất hay sai

### Vì sao vẫn 727MB?

`node_modules` sau khi prune vẫn **391MB** — phần lớn là **engine của Prisma** (~170MB). Đây là đặc điểm của Prisma, không phải lỗi cấu hình.

> Nói thẳng với lớp: có những thứ **không tối ưu được** bằng Dockerfile. Nếu cần ảnh nhỏ hơn nữa thì phải đổi công cụ (ví dụ dùng driver `pg` thuần thay Prisma) — một đánh đổi khác hẳn, không phải chuyện Docker.

---

## 4. Compose: mạng nội bộ & thứ tự khởi động (110–150′)

### 4.1. Host là TÊN SERVICE, không phải `localhost`

```yaml
environment:
  DATABASE_URL: postgresql://shop:...@postgres:5432/shop_db
  REDIS_URL: redis://redis:6379
```

> **⚠️ Lỗi số một của người mới.**
>
> `localhost` **bên trong container** là chính container đó, không phải máy thật. Docker tạo một mạng nội bộ và phân giải **tên service** thành IP của container tương ứng.
>
> Trong compose: `postgres`, `redis` — không phải `localhost`.

### 4.2. Ba mức `depends_on`

```yaml
depends_on:
  postgres:
    condition: service_healthy                  # chờ HEALTHCHECK xanh
  migrate:
    condition: service_completed_successfully   # chờ job CHẠY XONG
```

| Điều kiện | Nghĩa | Đủ chưa? |
|---|---|---|
| *(mặc định)* | chờ container **khởi động** | ❌ Postgres chưa sẵn sàng nhận kết nối |
| `service_healthy` | chờ healthcheck xanh | ✅ |
| `service_completed_successfully` | chờ job chạy **xong và thành công** | ✅ cho migration |

> Không có `service_healthy`, API khởi động **trước khi** Postgres nhận kết nối → crash. Đây chính là lý do ta viết `healthcheck` từ buổi 12.

### 4.3. Migration là JOB, không phải service

```yaml
migrate:
  build: .
  command: npx prisma migrate deploy
  restart: 'no'
```

> Nó chạy **một lần rồi thoát**. `restart: 'no'` để Docker không khởi động lại mãi.
>
> Và dùng `migrate deploy`, **không** phải `migrate dev` — nhắc lại cảnh báo buổi 12: `migrate dev` có thể **xoá sạch database**.

### 4.4. Không mở cổng database ra ngoài ở production

```yaml
postgres:
  ports:
    - '5436:5432'   # ⚠️ chỉ để học viên xem được bằng công cụ bên ngoài
```

> Ở production, **bỏ hẳn** khối `ports` của Postgres và Redis. Chỉ các service trong cùng network mới truy cập được — đó đã là đủ, và giảm hẳn bề mặt tấn công.

### 4.5. Chạy thử

```bash
docker compose -f docker-compose.full.yml up -d --build
docker compose -f docker-compose.full.yml ps
```

```
SERVICE    STATUS
api        Up 10 seconds (healthy)
postgres   Up 6 minutes (healthy)
redis      Up 6 minutes (healthy)
```

```bash
curl http://localhost:3000/health
# {"trangThai":"ok","thoiGianChay":11}
```

---

## 5. Bài tập về nhà

1. **Đo cache.** Build lại sau khi sửa một dòng trong `src/`. Ghi lại thời gian và các bước `CACHED`. Rồi sửa `package.json` và build lại. So sánh.

2. **Chứng minh `dumb-init` cần thiết.** Xoá `ENTRYPOINT ["dumb-init", "--"]`, build lại, chạy `docker compose stop api`, xem log. Có dòng *"Bắt đầu tắt tử tế"* không? Mất bao lâu container mới dừng?

3. **Chứng minh `.env` lọt vào ảnh.** Tạm xoá `.env` khỏi `.dockerignore`, build, rồi `docker run --rm shop-api:test cat .env`. Kiểm chứng bí mật bị lộ. Rồi khôi phục.

4. **Thêm worker.** Thêm service `worker` vào compose chạy `node src/worker.js` (bài tập buổi 26), dùng **cùng ảnh** với API. Vì sao dùng chung ảnh được?

5. **Tối ưu tiếp.** Thử `node:22-alpine` vs `node:22-slim` vs `gcr.io/distroless/nodejs22`. Lập bảng kích thước và ghi chú cái nào chạy được, cái nào không. Vì sao distroless khó dùng với Prisma?

6. **Nâng cao — nhiều bản sao.** Chạy `docker compose up -d --scale api=3`. Thêm Nginx làm load balancer phía trước. Rồi kiểm chứng: WebSocket (buổi 25) có còn hoạt động đúng không? Vì sao?

---

## 6. Checklist kết thúc buổi

- [ ] Vì sao copy `package*.json` trước mã nguồn?
- [ ] `npm ci` khác `npm install` ở ba điểm nào?
- [ ] Vì sao cần `dumb-init`? Không có nó thì buổi 08 còn tác dụng không?
- [ ] Vì sao không chạy container bằng root?
- [ ] `.env` lọt vào ảnh gây hậu quả gì? Xoá ở tầng sau có cứu được không?
- [ ] Vì sao ảnh "tối ưu" lại to hơn ảnh gốc?
- [ ] Tầng Docker có trừ bớt dung lượng được không?
- [ ] Trong compose, host của database là gì?
- [ ] `service_healthy` và `service_completed_successfully` khác nhau ra sao?
- [ ] Vì sao migration dùng `migrate deploy` chứ không `migrate dev`?

---

## 🎓 Kết thúc Phase 3

Học viên giờ đã hiểu và làm được:

| Chủ đề | Bằng chứng đo được |
|---|---|
| Transaction & tranh chấp | tồn kho `-5` → `0`; transaction **một mình không đủ** |
| Index | truy vấn chọn lọc nhanh **308×**; cái giá: ghi chậm 25% |
| Connection pool | `SELECT 1` chờ **1655ms** khi pool cạn |
| Phân trang cursor | offset chậm **6.5×** ở trang 10.000; cursor không đổi |
| Redis cache | HIT nhanh **58×**; và cái giá là dữ liệu cũ |
| OWASP | tự dump email bằng SQL injection; ReDoS **16 giây** từ 29 ký tự |
| CORS & Helmet | 6 header bảo mật, rate limit dùng chung nhiều tiến trình |
| Idempotency | bấm hai lần → **một** đơn hàng |
| WebSocket | xác thực lúc bắt tay, room theo token |
| BullMQ | phản hồi nhanh **12×**; backoff 1s → 2s → 4s |
| Docker | toàn hệ thống một lệnh; graceful shutdown chạy đúng trong container |

**Project 2 hiện có 58 test, tất cả pass.**

**Phase 4 bắt đầu:** viết lại toàn bộ bằng **NestJS** — và học viên sẽ nhận ra Nest chỉ đang **hệ thống hoá** những gì họ đã tự làm.

---

**Buổi trước:** [Buổi 26 — Background jobs với BullMQ](./buoi-26-bullmq.md)
**Buổi tiếp theo:** Buổi 28 — Vì sao NestJS & Dependency Injection *(Phase 4)*
