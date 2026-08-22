# Project 1 — Todo REST API viết bằng Node thuần

Sản phẩm tổng kết **Phase 1**. Một REST API hoàn chỉnh, có kiến trúc phân tầng, lưu trữ bền vững, xử lý lỗi tập trung, graceful shutdown và bộ test đầy đủ.

**Không một dòng framework nào. Không một package npm nào.**

---

## Chạy

```bash
cp .env.example .env
npm start          # hoặc: npm run dev  (tự khởi động lại khi sửa code)
npm test           # 46 test
```

---

## Kiến trúc phân tầng

```
src/
├── server.js                    ← khởi động, graceful shutdown, lưới an toàn
├── app.js                       ← ráp router + xử lý lỗi tập trung + log
├── config.js                    ← đọc & KIỂM TRA biến môi trường lúc khởi động
├── lib/
│   ├── router.js                ← pathToRegex + createRouter        (buổi 05)
│   ├── body.js                  ← đọc & parse JSON, giới hạn 1MB    (buổi 05, 06)
│   ├── errors.js                ← HttpError mang status code        (buổi 05)
│   ├── respond.js               ← chuẩn hoá response & lỗi          (buổi 05)
│   └── logger.js                ← structured logging JSON
└── todos/
    ├── todo.routes.js           ← tầng HTTP — chỗ DUY NHẤT biết req/res
    ├── todo.service.js          ← tầng nghiệp vụ — KHÔNG biết HTTP, KHÔNG biết đĩa
    ├── todo.repository.js       ← tầng lưu trữ — chỗ DUY NHẤT chạm đĩa
    └── todo.validator.js        ← kiểm tra đầu vào — hàm thuần
```

**Vì sao tách như vậy?** Mỗi tầng chỉ biết tầng ngay dưới nó:

```
HTTP  →  routes  →  service  →  repository  →  đĩa
                       ↑
                   validator (hàm thuần)
```

Ở **Phase 2**, chỉ cần thay `todo.repository.js` bằng Prisma/Postgres — **không sửa một dòng nào** ở service. Ở **Phase 4**, service này trở thành `@Injectable()` của NestJS với cấu trúc y hệt.

---

## API

| Method | Đường dẫn | Mô tả | Status |
|---|---|---|---|
| `GET` | `/health` | Kiểm tra sức khoẻ | `200` / `503` khi đang tắt |
| `GET` | `/todos` | Danh sách, có lọc & phân trang | `200` |
| `GET` | `/todos/thong-ke` | Thống kê | `200` |
| `GET` | `/todos/:id` | Chi tiết | `200` / `404` |
| `POST` | `/todos` | Tạo mới | `201` + `Location` |
| `PUT` | `/todos/:id` | Thay thế toàn bộ | `200` / `400` |
| `PATCH` | `/todos/:id` | Sửa một phần | `200` |
| `DELETE` | `/todos/:id` | Xoá | `204` |

Tham số lọc cho `GET /todos`: `?xong=true|false`, `?uuTien=thap|trung|cao`, `?trang=1`, `?moiTrang=20` (tối đa 100).

### Ví dụ

```bash
B=http://localhost:3000

curl -s $B/health
curl -i -X POST $B/todos -H "Content-Type: application/json" \
     -d '{"tieuDe":"Hoc Node thuan","uuTien":"cao"}'
curl -s "$B/todos?xong=false&uuTien=cao"
curl -s $B/todos/thong-ke
curl -s -X PATCH $B/todos/1 -H "Content-Type: application/json" -d '{"xong":true}'
curl -i -X DELETE $B/todos/1
```

> **⚠️ Lưu ý cho Windows:** terminal Windows gửi chữ tiếng Việt theo codepage của console chứ không phải UTF-8, nên dữ liệu có dấu gửi trực tiếp trong `-d '...'` sẽ bị hỏng. Server xử lý UTF-8 hoàn toàn đúng — để kiểm chứng, ghi JSON ra file rồi gửi bằng `--data-binary`:
>
> ```bash
> printf '{"tieuDe":"Ôn lại stream"}' > tmp.json
> curl -X POST $B/todos -H "Content-Type: application/json" --data-binary @tmp.json
> ```

---

## Mã lỗi trả về

| Status | Khi nào |
|---|---|
| `400` | Dữ liệu sai (kèm `chiTiet` từng trường), `id` không phải số, tham số phân trang sai |
| `404` | Không có todo / không có đường dẫn |
| `405` | Sai method (kèm header `Allow`) |
| `413` | Body vượt quá `BODY_LIMIT` |
| `415` | `Content-Type` không phải `application/json` |
| `500` | Bug ngoài dự kiến — **chỉ trả thông điệp chung chung** |
| `503` | Server đang tắt |

---

## Những gì dự án này chứng minh

| Kỹ thuật | Học ở buổi | Áp dụng ở đâu |
|---|---|---|
| `Buffer.byteLength` cho `Content-Length` | 01 | `lib/respond.js` |
| Không chặn Event Loop | 02 | mọi thao tác đĩa đều `async` |
| Fail fast khi thiếu config | 03 | `config.js` |
| Luôn `return` sau `res.end()` | 04 | mọi handler |
| Router tự viết, thứ tự route | 05 | `lib/router.js`, `todo.routes.js` |
| `req.pause()` thay vì `req.destroy()` cho 413 | 05 | `lib/body.js` |
| Gom `Buffer` rồi decode một lần | 06 | `lib/body.js` |
| Hàng đợi tuần tự hoá ghi file | 07, 08 | `todo.repository.js` |
| Lưới an toàn `process.exit(1)` | 07 | `server.js` |
| Ghi file nguyên tử (tmp + rename) | 08 | `todo.repository.js` |
| Graceful shutdown 4 bước | 08 | `server.js` |
| Chống mass assignment | — | `todo.validator.js` |
| Không lộ stack trace ra client | 05 | `lib/respond.js` |

---

## Test

```
# tests 46
# pass 46
# fail 0
```

Ba tầng test, mỗi tầng một mục đích:

| File | Loại | Không cần |
|---|---|---|
| `validator.test.js` | hàm thuần | I/O, server |
| `service.test.js` | nghiệp vụ + **repository giả** | đĩa, server |
| `api.test.js` | end-to-end qua HTTP thật | thư viện ngoài |

Điểm đáng chú ý trong `service.test.js`: repository được **mock** hoàn toàn trong RAM. Đây là lợi ích trực tiếp của việc tách tầng — và cũng chính là điều `overrideProvider` của NestJS làm ở buổi 36.

`api.test.js` dùng cổng `0` (hệ điều hành tự chọn cổng rảnh) và thư mục tạm, nên chạy test **không đụng tới** `data/` thật và không xung đột cổng.

---

## Kiểm chứng dữ liệu bền vững

```
=== LẦN CHẠY 1 ===
Số todo trước khi tắt: 4
Tắt tử tế → mã thoát: 0
Trên đĩa: 4 todo; bản mới nhất = "Đặt hàng đợi ghi file"

=== LẦN CHẠY 2 ===
soTodoDaNap: 4
Bản mới nhất đọc qua API: "Đặt hàng đợi ghi file"
KHỚP: ĐÚNG ✅
```

---

## Bài tập mở rộng

1. **Tìm kiếm.** Thêm `?tuKhoa=...` tìm trong `tieuDe`, không phân biệt hoa thường và bỏ dấu.
2. **Sắp xếp.** Thêm `?sapXep=taoLuc|tieuDe|uuTien` và `?huong=asc|desc`.
3. **Xoá mềm.** Thay xoá thật bằng `daXoa: true`, và `GET /todos` mặc định không trả về chúng.
4. **Rate limit.** Giới hạn 10 request/phút mỗi IP, trả `429` kèm header `Retry-After`.
5. **Sub-resource.** Thêm `/todos/:id/ghi-chu` (quan hệ 1-n) — chuẩn bị cho quan hệ database ở buổi 13.
6. **Tăng coverage.** Chạy `node --test --experimental-test-coverage` và đưa coverage lên trên 90%.
