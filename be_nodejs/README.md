# Backend Zero → Hero — Node.js · Express.js · NestJS

Giáo trình đào tạo backend 48 buổi, dành cho **lập trình viên frontend đã vững JavaScript**.

Repo này chứa hai thứ song song:

- **`giao-an/`** — giáo án chi tiết từng buổi cho người dạy: dòng thời gian 180 phút, lý thuyết giảng giải, kịch bản thực hành, bài tập về nhà, ghi chú sư phạm.
- **`code/`** — toàn bộ code thực hành, **chạy được thật**, chia theo từng buổi. Học viên clone về là gõ lệnh chạy được ngay.

---

## Triết lý giảng dạy

Học viên đã biết JavaScript, nên khoá học **không dạy lại cú pháp**. Thứ cần dạy là **tư duy backend** — những khái niệm frontend không có:

| Frontend đã quen | Backend phải học mới |
|---|---|
| State sống trong bộ nhớ suốt phiên | HTTP stateless — mỗi request là tờ giấy trắng |
| Reload trang là hết lỗi | Tiến trình chạy hàng tháng, rò rỉ bộ nhớ tích tụ |
| Một người dùng | Hàng nghìn người dùng đồng thời, tranh chấp dữ liệu |
| `localStorage` | Database, transaction, index, migration |
| Lỗi thì user thấy màn hình trắng | Lỗi thì cả hệ thống sập, có log để truy vết |

**Nguyên tắc xuyên suốt: dạy nguyên lý trước, framework sau.** Đó là lý do Node thuần đứng trước Express, và Express đứng trước NestJS. Học viên phải tự tay viết router, tự parse body, tự xử lý lỗi — rồi mới được framework làm hộ. Khi đó họ hiểu framework đang che giấu điều gì.

---

## Lộ trình

| Phase | Buổi | Nội dung | Sản phẩm |
|---|---|---|---|
| **0** | 01–03 | Cầu nối tư duy FE → BE, Event Loop, module/npm | Project 0: CLI phân tích đơn hàng |
| **1** | 04–09 | Node.js core: http, router, stream, async, process | Project 1: Todo REST API **không framework** |
| **2** | 10–18 | Express, middleware, Prisma/Postgres, JWT, RBAC, test | Project 2: E-commerce mini API |
| **3** | 19–27 | Index/N+1/transaction, Redis, OWASP, WebSocket, queue, Docker | Project 3: nâng cấp Project 2 lên production-grade |
| **4** | 28–39 | NestJS: DI, lifecycle, DTO, guard, test, Swagger | Project 4: rebuild E-commerce bằng NestJS |
| **5** | 40–48 | CI/CD, deploy, monitoring, load test, system design | Capstone tự chọn đề tài |

Chi tiết từng buổi: xem **[giao-an/](./giao-an/)**.

---

## Cấu trúc repo

```
be_nodejs/
├── README.md
├── .github/workflows/
│   ├── ci.yml                    ← buổi 40
│   └── cd.yml                    ← buổi 41
├── giao-an/
│   ├── phase-0/  buoi-01 … buoi-03
│   ├── phase-1/  buoi-04 … buoi-09
│   ├── phase-2/  buoi-10 … buoi-18
│   ├── phase-3/  buoi-19 … buoi-27
│   ├── phase-4/  buoi-28 … buoi-39
│   └── phase-5/  buoi-40 … buoi-48
└── code/
    ├── buoi-01-raw-http/  …  buoi-17-upload-testing/
    ├── project-01-todo-api/      ← Project 1  (Node thuần)
    ├── project-02-ecommerce/     ← Project 2 & 3  (Express)
    │   ├── deploy/               ← nginx.conf, ecosystem.config.cjs (buổi 42)
    │   └── benchmark/do-tai.mjs  ← đo tải (buổi 44)
    └── project-04-nestjs/        ← Project 4  (NestJS)
```

Mỗi thư mục trong `code/` là một dự án Node độc lập, có `README.md` riêng ghi rõ cách chạy.

---

## Yêu cầu môi trường

| Công cụ | Phiên bản | Ghi chú |
|---|---|---|
| Node.js | **≥ 20.6** | Cần cho `--env-file` gốc, không phải cài `dotenv` |
| npm | ≥ 10 | Đi kèm Node |
| VS Code | mới nhất | Kèm extension REST Client hoặc dùng Postman |
| Docker Desktop | mới nhất | Bắt đầu cần từ Phase 2 (Postgres, Redis) |
| Git | ≥ 2.40 | |

Kiểm tra nhanh:

```bash
node -v    # phải >= v20.6.0
npm -v
docker -v  # cần từ Phase 2
```

---

## Cách dùng repo khi dạy

**Người dạy:** mở file giáo án của buổi tương ứng trong `giao-an/`. Mỗi buổi có sẵn dòng thời gian 180 phút chia theo mốc, các câu hỏi gợi mở để hỏi lớp, và mục *Ghi chú giảng viên* chỉ ra chỗ học viên hay hiểu sai.

**Học viên:** gõ lại code theo giáo án, **không copy-paste**. Thư mục `code/` là bản tham chiếu để đối chiếu khi bí hoặc khi cần xem lại sau buổi học.

Mỗi buổi kết thúc bằng bài tập về nhà bắt buộc. Bài tập buổi trước được chữa trong 15 phút đầu buổi sau.

---

## Tiến độ biên soạn

- [x] **Phase 0 — buổi 01–03** ✅ giáo án + code đã kiểm chứng chạy
- [x] **Phase 1 — buổi 04–09** ✅ giáo án + code + **Project 1 (46/46 test pass)**
- [x] **Phase 2 — buổi 10–18** ✅ giáo án + code + **Project 2 khởi động (19/19 test pass)**
- [x] **Phase 3 — buổi 19–27** ✅ giáo án + code + **Project 2 (58/58 test pass)**
- [x] **Phase 4 — buổi 28–39** ✅ giáo án + code + **Project 4 (9 unit + 18 e2e pass)**
- [x] **Phase 5 — buổi 40–48** ✅ giáo án + CI/CD workflow + cấu hình deploy + benchmark đã đo thật

**🎓 Hoàn tất 48/48 buổi.**

> Mọi code trong `code/` đều đã được **chạy thật và kiểm chứng output**, không phải code viết ra rồi để đó. Các số liệu trong giáo án (thời gian, bộ nhớ, kết quả sai/đúng) là số đo thực tế.
