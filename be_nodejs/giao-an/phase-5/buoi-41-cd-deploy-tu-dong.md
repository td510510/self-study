# Buổi 41 — CD: build & deploy tự động

> **Phase 5** · Production-ready
> **Mục tiêu:** Nối tiếp CI, tự động hoá bước đưa code lên môi trường chạy thật — và làm được **an toàn**.
> **Code:** [`.github/workflows/cd.yml`](../../.github/workflows/cd.yml)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 40 |
| 15–50′ | CI khác CD ở đâu — và vì sao tách |
| 50–100′ | Build & đẩy ảnh Docker, chiến lược đặt tag |
| 100–145′ | **Migration khi deploy: bài toán khó nhất** |
| 145–170′ | Rollback & quản lý bí mật |
| 170–180′ | Bài tập |

---

## 1. CI khác CD (15–50′)

| | CI | CD |
|---|---|---|
| Chạy khi | **mọi** push | ta **chủ động** phát hành |
| Trả lời | *"code có đúng không?"* | *"đưa code ra thế giới"* |
| Hỏng thì | PR bị chặn | **người dùng bị ảnh hưởng** |
| Trigger | `push`, `pull_request` | `tags: ['v*']`, `workflow_dispatch` |

```yaml
on:
  push:
    tags: ['v*']            # chỉ chạy khi đẩy tag v1.0.0
  workflow_dispatch: {}     # cho phép bấm nút chạy tay
```

> **Vì sao dùng tag chứ không phải merge vào `main`?**
>
> Merge và phát hành là **hai quyết định khác nhau**. Có thể merge 10 PR rồi mới phát hành một lần. Tag là hành động **có chủ đích** — và nó ghi lại **chính xác** code nào đang chạy ở production.

---

## 2. Build & đẩy ảnh (50–100′)

```yaml
- uses: docker/metadata-action@v5
  with:
    images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
    tags: |
      type=semver,pattern={{version}}      # v1.2.3
      type=semver,pattern={{major}}.{{minor}}   # 1.2
      type=sha,format=long                  # sha-abc123...
```

### Vì sao ba tag cho cùng một ảnh?

| Tag | Dùng để |
|---|---|
| `1.2.3` | phiên bản chính xác — dùng ở production |
| `1.2` | tự nhận bản vá mới nhất của minor đó |
| `sha-abc123` | **quay lại chính xác** bất kỳ commit nào |

> **⚠️ KHÔNG BAO GIỜ dùng tag `latest` ở production.**
>
> `latest` là một cái tên di động — không ai biết nó đang trỏ vào đâu. Khi sự cố xảy ra lúc 2 giờ sáng, câu hỏi đầu tiên là *"phiên bản nào đang chạy?"*, và `latest` không trả lời được.

### Cache tầng Docker

```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

> Nối lại buổi 27: thứ tự `COPY` trong Dockerfile quyết định cache có dùng lại được không. Ở đây ta lưu cache đó vào GitHub Actions để build lần sau nhanh hơn.

---

## 3. Trọng tâm: migration khi deploy (100–145′)

> **📝 Ghi chú giảng viên — đây là phần khó nhất và hay bị làm sai nhất**

```yaml
script: |
  docker compose pull api
  docker compose run --rm migrate       # ← migration TRƯỚC
  docker compose up -d --no-deps api    # ← rồi mới đổi code
```

Hỏi lớp: *"Chạy migration trước hay sau khi đổi code?"*

Để lớp tranh luận. Cả hai đều có vấn đề:

```
Migration TRƯỚC:  database mới  +  code CŨ   đang chạy
Migration SAU  :  database cũ   +  code MỚI  đang chạy
```

> **Trong khoảnh khắc deploy, LUÔN có lúc code và database lệch phiên bản.** Không tránh được — chỉ có thể **thiết kế để nó không gây hại**.

### Quy tắc: migration phải TƯƠNG THÍCH NGƯỢC

Code **cũ** phải chạy được với database **mới**.

| Thay đổi | An toàn? | Vì sao |
|---|---|---|
| Thêm cột **nullable** | ✅ | code cũ không biết cột đó, vẫn chạy |
| Thêm bảng mới | ✅ | code cũ không đụng tới |
| Thêm index | ✅ | |
| **Xoá** cột | ❌ | code cũ vẫn `SELECT` cột đó → lỗi |
| **Đổi tên** cột | ❌ | như xoá + thêm |
| Thêm cột `NOT NULL` không default | ❌ | code cũ `INSERT` không có cột đó → lỗi |

### Đổi tên cột an toàn: ba lần deploy

```
Deploy 1:  thêm cột mới (nullable), code ghi CẢ HAI cột, đọc cột CŨ
Deploy 2:  chép dữ liệu cũ sang mới; code đọc cột MỚI, vẫn ghi cả hai
Deploy 3:  code chỉ dùng cột mới; xoá cột cũ
```

> Nghe rườm rà, nhưng đây là **cách duy nhất** đổi tên cột mà không có downtime.
>
> Hỏi lớp: *"Nếu chấp nhận downtime 5 phút thì sao?"* → làm một lần được, đơn giản hơn nhiều. **Đây là quyết định nghiệp vụ**, không phải kỹ thuật.

### Migration không tự rollback được

> `docker compose rollback` đưa **code** về bản cũ. Nhưng **database đã đổi rồi** — Prisma không có lệnh "undo migration" ở production.
>
> Nên: migration phải được review **kỹ hơn** code thường. Code sai thì rollback; database sai thì phải **viết migration mới** để sửa.

---

## 4. Kiểm chứng sau deploy & rollback (145–160′)

```bash
for i in $(seq 1 30); do
  if curl -fs http://localhost:3000/health > /dev/null; then
    echo "Health check OK"; exit 0
  fi
  sleep 2
done

echo "Health check THẤT BẠI — quay lại bản cũ"
docker compose rollback api 2>/dev/null || docker compose up -d --no-deps api
exit 1
```

> **Deploy xong KHÔNG có nghĩa là deploy thành công.** Phải **kiểm chứng** rồi mới kết luận.
>
> Nối lại buổi 43: `/health` phải kiểm cả **phụ thuộc** (database, Redis), không chỉ *"tiến trình còn sống"*. Health check chỉ trả `200` vô điều kiện thì vô dụng ở đây.

### Ba chiến lược deploy

| Chiến lược | Cách làm | Downtime |
|---|---|---|
| **Recreate** | tắt cũ, bật mới | có |
| **Rolling** | thay từng bản sao một | không |
| **Blue-green** | dựng full bản mới, đổi traffic một phát | không, rollback tức thì |

> Với một bản sao thì chỉ có Recreate. Cần zero-downtime thì phải có **ít nhất hai** bản sao — nối lại buổi 42.

---

## 5. Quản lý bí mật (160–170′)

```yaml
password: ${{ secrets.GITHUB_TOKEN }}
key: ${{ secrets.DEPLOY_SSH_KEY }}
```

| Quy tắc | |
|---|---|
| **Không bao giờ** hardcode secret trong workflow | file YAML nằm trong repo |
| `GITHUB_TOKEN` được cấp tự động | hết hạn sau mỗi lần chạy |
| Secret production ≠ secret CI | rò rỉ CI không ảnh hưởng production |
| Xoay secret định kỳ | và **ngay lập tức** khi ai đó rời team |

### Environment với phê duyệt thủ công

```yaml
environment:
  name: production
  url: https://shop.example.com
```

> Cấu hình trong Settings để **yêu cầu người duyệt** trước khi job `deploy` chạy.
>
> Tự động hoá **không** có nghĩa là bỏ hết kiểm soát. Với production, một cú bấm xác nhận là rẻ so với sự cố.

---

## 6. Bài tập về nhà

1. **Deploy thật.** Đẩy ảnh lên GitHub Container Registry bằng tag `v0.1.0`. Kéo về máy và chạy. Kiểm chứng ảnh hoạt động.

2. **Migration tương thích ngược.** Thêm cột `ghiChu String?` vào `DonHang`. Deploy migration **trước** khi deploy code mới. Code cũ có còn chạy không? Chứng minh.

3. **Migration KHÔNG tương thích.** Thử đổi tên `tongTienVND` → `tongTien`. Chạy migration với code cũ đang chạy. Lỗi gì? Rồi làm lại theo quy trình ba lần deploy.

4. **Rollback.** Deploy `v0.2.0` cố tình lỗi (ví dụ thiếu biến môi trường). Kiểm chứng health check bắt được và rollback tự động.

5. **Đo thời gian deploy.** Ghi lại thời gian từ lúc đẩy tag tới lúc health check xanh. Bước nào chậm nhất? Rút ngắn thế nào?

6. **Nâng cao — blue-green.** Dựng hai bản `api-blue` và `api-green`, dùng Nginx đổi upstream. So sánh độ phức tạp với rolling update.

---

## 7. Checklist kết thúc buổi

- [ ] Vì sao tách CD khỏi CI?
- [ ] Vì sao trigger bằng tag chứ không phải merge vào `main`?
- [ ] Vì sao không dùng tag `latest` ở production?
- [ ] Trong khoảnh khắc deploy, code và database lệch nhau — tránh được không?
- [ ] "Tương thích ngược" nghĩa là gì với migration?
- [ ] Kể 3 thay đổi schema an toàn và 3 thay đổi không an toàn.
- [ ] Đổi tên cột không downtime cần mấy lần deploy?
- [ ] Migration có rollback được không? Vậy phải làm gì?
- [ ] Vì sao phải kiểm chứng health check sau deploy?

---

**Buổi trước:** [Buổi 40 — CI với GitHub Actions](./buoi-40-ci-github-actions.md)
**Buổi tiếp theo:** Buổi 42 — Deploy thực chiến: Nginx + PM2
