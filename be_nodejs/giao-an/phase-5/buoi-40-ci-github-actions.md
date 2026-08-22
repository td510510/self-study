# Buổi 40 — CI với GitHub Actions

> **Phase 5** · Production-ready
> **Mục tiêu:** Tự động hoá kiểm tra chất lượng code — không còn phụ thuộc việc ai đó **nhớ** chạy test trước khi push.
> **Code:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Vì sao CI — vấn đề thật của làm việc nhóm |
| 20–70′ | Cấu trúc workflow: trigger, job, step |
| 70–125′ | **Dịch vụ phụ trợ: database & Redis trong CI** |
| 125–155′ | Cache, chạy song song, và tốc độ |
| 155–175′ | Branch protection: biến CI thành rào chắn thật |
| 175–180′ | Bài tập |

---

## 1. Vì sao CI (0–20′)

> **📝 Ghi chú giảng viên — mở đầu bằng tình huống**
>
> *"Bạn sửa một dòng, chạy test, xanh, push. Đồng nghiệp pull về, test đỏ. Vì sao?"*

Các nguyên nhân thật:
- Bạn quên chạy **toàn bộ** test, chỉ chạy file mình sửa
- Máy bạn có Postgres 17, máy họ có 14
- Bạn có `.env` với biến mà `.env.example` thiếu
- Bạn quên commit một file

> **CI giải quyết bằng cách: chạy test trên một máy SẠCH, MỖI LẦN push, KHÔNG phụ thuộc trí nhớ ai cả.**

Và nó bắt được một lớp lỗi mà máy dev không bắt được:

| CI bắt được | Vì sao máy dev không bắt |
|---|---|
| Quên commit file | file vẫn nằm trên đĩa của bạn |
| `package-lock.json` lệch | `node_modules` đã có sẵn |
| Phụ thuộc vào biến môi trường cục bộ | `.env` của bạn có, người khác không |
| Test phụ thuộc thứ tự chạy | bạn luôn chạy cùng một thứ tự |

---

## 2. Cấu trúc workflow (20–70′)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

### `concurrency` — chi tiết nhỏ, tiết kiệm lớn

> Huỷ lần chạy cũ khi có push mới trên **cùng nhánh**. Không có nó, push 5 lần liên tiếp là 5 lần chạy song song — tốn tài nguyên và cho kết quả chậm hơn.

### Trigger nào cho việc gì

| Trigger | Dùng cho |
|---|---|
| `push` lên nhánh chính | kiểm tra sau khi merge |
| `pull_request` | **quan trọng nhất** — kiểm tra TRƯỚC khi merge |
| `schedule` | quét bảo mật định kỳ |
| `workflow_dispatch` | bấm nút chạy tay |

---

## 3. Trọng tâm: dịch vụ phụ trợ (70–125′)

```yaml
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: matkhau_ci
      POSTGRES_DB: shop_test
    ports: ['5432:5432']
    options: >-
      --health-cmd pg_isready
      --health-interval 5s
      --health-retries 10
```

> GitHub tự dựng container và dọn sau khi xong. **Đây là lý do ta Docker hoá ở buổi 27** — môi trường CI giống hệt môi trường dev.

### ⚠️ Health check là bắt buộc

> Không có `--health-cmd`, bước migrate chạy khi Postgres **chưa sẵn sàng** → test fail **ngẫu nhiên**.
>
> Loại lỗi này tệ nhất: nó fail 1 trong 5 lần, và team dần quen với việc *"chạy lại là được"* — rồi bỏ qua cả lỗi thật.
>
> Nối lại buổi 12 và 27: cùng bài học về `depends_on: service_healthy`.

### Biến môi trường cho CI

```yaml
env:
  DATABASE_URL: postgresql://shop:matkhau_ci@localhost:5432/shop_test?schema=public
  JWT_ACCESS_SECRET: chuoi_bi_mat_chi_dung_cho_ci_khong_phai_that
  BCRYPT_COST: '4'
  LOG_LEVEL: silent
  NODE_ENV: test
```

Ba quyết định:

| | Vì sao |
|---|---|
| `BCRYPT_COST: 4` | test nhanh gấp 256 lần ở khâu băm (buổi 15) |
| `LOG_LEVEL: silent` | log làm rối output CI, và chậm |
| Secret giả, không phải thật | secret CI **không bao giờ** là secret production |

> **⚠️ Secret ở đây hardcode được vì nó là giả.** Secret thật dùng `${{ secrets.X }}` — xem buổi 41.

### Ba lệnh quan trọng và lý do

```yaml
- run: npm ci                      # KHÔNG phải npm install
- run: npx prisma generate
- run: npx prisma migrate deploy   # KHÔNG phải migrate dev
```

| Lệnh | Vì sao đúng |
|---|---|
| `npm ci` | cài đúng lock file, **thất bại** nếu lock lệch (buổi 27) |
| `migrate deploy` | `migrate dev` có thể **reset database** (buổi 12) |
| `npm audit` | A06 OWASP — thư viện lỗi thời (buổi 22) |

---

## 4. Tốc độ CI (125–155′)

### Cache dependency

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
    cache-dependency-path: code/project-02-ecommerce/package-lock.json
```

> Cache theo `package-lock.json` — **cùng nguyên lý** với thứ tự `COPY` trong Dockerfile (buổi 27): lock không đổi thì dùng lại cache.

### Chạy song song

Workflow của khoá học có **hai job độc lập** chạy song song:

```yaml
jobs:
  kiem-tra:        # Project 2 (Express)
  kiem-tra-nest:   # Project 4 (NestJS)
```

> Tổng thời gian = job **chậm nhất**, không phải tổng cả hai.

### Vì sao tốc độ CI quan trọng hơn ta tưởng

| Thời gian CI | Hành vi của team |
|---|---|
| < 5 phút | chờ kết quả rồi mới làm tiếp |
| 5–15 phút | chuyển sang việc khác, mất ngữ cảnh |
| > 20 phút | **bắt đầu bỏ qua CI**, merge trước kiểm sau |

> **📝 Ghi chú giảng viên**
> CI chậm không chỉ tốn thời gian — nó **huỷ hoại thói quen** của team. Đầu tư vào tốc độ CI là đầu tư vào kỷ luật.

---

## 5. Branch protection — biến CI thành rào chắn (155–175′)

> CI **báo lỗi** nhưng vẫn merge được thì nó chỉ là trang trí.

Cấu hình trong **Settings → Branches → Add rule**:

| Bật | Tác dụng |
|---|---|
| Require status checks to pass | ❌ CI đỏ → **không merge được** |
| Require branches to be up to date | buộc rebase trước khi merge |
| Require pull request reviews | ít nhất một người duyệt (buổi 46) |
| Do not allow bypassing | kể cả admin cũng phải theo luật |

> Hỏi lớp: *"Nên cho admin bypass không?"*
>
> → **Không**, trừ sự cố khẩn cấp. Ngoại lệ trở thành thói quen rất nhanh, và ai cũng sẽ có "lý do chính đáng".

---

## 6. Bài tập về nhà

1. **Chạy CI thật.** Đẩy repo lên GitHub, tạo PR sửa một dòng. Chụp lại giao diện CI chạy. Cố tình làm test fail và xem PR bị chặn.

2. **Đo tốc độ.** Ghi thời gian lần chạy đầu (chưa cache) và lần thứ hai. Cache tiết kiệm bao nhiêu phần trăm?

3. **Bỏ health check.** Xoá `--health-cmd` khỏi service Postgres, chạy CI 5 lần. Có lần nào fail không? Đây là loại lỗi gì?

4. **Thêm bước coverage.** Chạy `--experimental-test-coverage`, đẩy báo cáo lên artifact. Rồi thêm ngưỡng: coverage dưới 60% thì fail. Ngưỡng bao nhiêu là hợp lý cho dự án của bạn?

5. **Ma trận phiên bản.** Dùng `strategy.matrix` chạy test trên Node 20 và 22. Có sự khác biệt nào không? Khi nào việc này đáng làm?

6. **Nâng cao — chỉ chạy khi cần.** Dùng `paths` filter để job Project 2 chỉ chạy khi có thay đổi trong `code/project-02-ecommerce/`. Tiết kiệm bao nhiêu? Rủi ro là gì?

---

## 7. Checklist kết thúc buổi

- [ ] Kể 4 lớp lỗi CI bắt được mà máy dev không bắt.
- [ ] `concurrency` + `cancel-in-progress` giải quyết gì?
- [ ] Vì sao service trong CI **bắt buộc** có health check?
- [ ] Vì sao `BCRYPT_COST=4` trong CI?
- [ ] Vì sao `npm ci` chứ không `npm install`?
- [ ] Vì sao `migrate deploy` chứ không `migrate dev`?
- [ ] CI chậm ảnh hưởng tới hành vi team thế nào?
- [ ] Không có branch protection thì CI còn tác dụng gì?

---

**Buổi trước:** [Buổi 39 — Swagger & tổng kết Project 4](../phase-4/buoi-39-swagger-tong-ket.md)
**Buổi tiếp theo:** Buổi 41 — CD: build & deploy tự động
