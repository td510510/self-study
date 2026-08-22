# Buổi 09 — Project 1: Todo REST API bằng Node thuần

> **Phase 1** · Node.js Core — **buổi tổng kết**
> **Mục tiêu:** Ráp toàn bộ 8 buổi trước thành một sản phẩm hoàn chỉnh, có kiến trúc phân tầng, và tự tay viết mọi lớp mà framework sẽ đảm nhiệm ở Phase 2.
> **Code:** [`code/project-01-todo-api/`](../../code/project-01-todo-api/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Giới thiệu đề bài & thiết kế kiến trúc phân tầng |
| 20–60′ | Dựng tầng lưu trữ (repository) |
| 60–100′ | Dựng tầng nghiệp vụ (service) + validator |
| 100–130′ | Dựng tầng HTTP (routes) + ráp app |
| 130–160′ | Viết test ba tầng |
| 160–180′ | **Retrospective: liệt kê những gì Express sẽ làm hộ** |

> **📝 Ghi chú giảng viên**
> Buổi này **học viên gõ code là chính**, giảng viên chỉ dẫn dắt và gỡ rối. Toàn bộ kỹ thuật đã dạy ở 8 buổi trước — hôm nay là ráp lại.
> Nếu lớp chậm, cho làm tới hết tầng service tại lớp, phần còn lại giao về nhà.

---

## 1. Thiết kế kiến trúc (0–20′)

Vẽ lên bảng **trước khi** viết dòng code nào:

```
HTTP  →  routes  →  service  →  repository  →  đĩa
                       ↑
                   validator (hàm thuần)
```

Quy tắc sắt: **mỗi tầng chỉ biết tầng ngay dưới nó.**

| Tầng | Biết gì | KHÔNG biết gì |
|---|---|---|
| `routes` | `req`, `res`, status code | logic nghiệp vụ, đĩa |
| `service` | quy tắc nghiệp vụ | HTTP, đĩa |
| `repository` | cách lưu trữ | HTTP, quy tắc nghiệp vụ |
| `validator` | hình dạng dữ liệu hợp lệ | mọi thứ khác (hàm thuần) |

Hỏi lớp: *"Vì sao phải tách? Sao không viết hết vào một file cho nhanh?"*

Ba câu trả lời — viết lên bảng và giữ tới hết khoá:

1. **Thay được.** Phase 2 ta đổi từ file JSON sang PostgreSQL. Chỉ cần thay `repository`, **không sửa một dòng nào** ở `service`.
2. **Test được.** `service` không chạm đĩa → test bằng repository giả, chạy trong mili-giây, không cần dựng server.
3. **Đọc được.** Muốn sửa quy tắc nghiệp vụ, biết ngay phải mở file nào.

> Đây chính là kiến trúc mà NestJS **bắt buộc** ở Phase 4 (Controller → Service → Repository). Học viên tự dựng hôm nay để khi gặp NestJS thấy quen chứ không thấy rườm rà.

---

## 2. Tầng lưu trữ (20–60′)

[`src/todos/todo.repository.js`](../../code/project-01-todo-api/src/todos/todo.repository.js)

Ba kỹ thuật từ buổi 08 được áp dụng nguyên vẹn.

**(a) Ghi nguyên tử** — ghi file tạm rồi `rename`:

```js
async function ghiAnToan() {
  const fileTam = join(dirname(duongDan), `.${process.pid}.${Date.now()}.tmp`);
  await writeFile(fileTam, JSON.stringify(duLieu, null, 2), 'utf8');
  await rename(fileTam, duongDan);
}
```

Chú ý `process.pid` trong tên file tạm — để hai tiến trình chạy song song không giẫm chân nhau.

**(b) Hàng đợi ghi** — tuần tự hoá:

```js
function ghi() {
  hangDoiGhi = hangDoiGhi.then(ghiAnToan, ghiAnToan);
  return hangDoiGhi;
}
```

**(c) Trả bản sao** — không để tầng trên sửa trực tiếp state bên trong:

```js
layTatCa() {
  return duLieu.todos.map((t) => ({ ...t }));   // ← bản sao
}
```

Hỏi lớp: *"Nếu trả thẳng `duLieu.todos` thì sao?"*
→ Tầng service có thể vô tình sửa mảng gốc mà không qua `capNhat()`, và thay đổi đó **không bao giờ được ghi xuống đĩa**. Bug cực khó tìm.

---

## 3. Tầng nghiệp vụ & validator (60–100′)

### 3.1. Validator — chống mass assignment

[`src/todos/todo.validator.js`](../../code/project-01-todo-api/src/todos/todo.validator.js)

Điểm dạy quan trọng nhất: validator **chỉ giữ các trường được cho phép**.

```js
const sach = {};
// ... chỉ gán sach.tieuDe, sach.xong, sach.uuTien
return sach;
```

Nếu client gửi kèm `{ id: 999 }` hay `{ vaiTro: 'admin' }`, chúng **bị loại bỏ**.

> **⚠️ Vì sao quan trọng?** Cách viết ngây thơ:
> ```js
> Object.assign(todo, req.body);      // ❌ client sửa được MỌI trường
> ```
> Đây là lỗ hổng **mass assignment** — một trong những lỗi bảo mật phổ biến nhất. Kẻ tấn công gửi `{"vaiTro":"admin"}` và tự nâng quyền.
> Ta gặp lại nó trong OWASP Top 10 ở buổi 22.

Test chứng minh:

```js
test('CHỐNG MASS ASSIGNMENT: loại bỏ trường lạ', () => {
  const kq = kiemTraTodo({ tieuDe: 'a', id: 999, vaiTro: 'admin' }, true);
  assert.equal(kq.id, undefined);
  assert.equal(kq.vaiTro, undefined);
});
```

### 3.2. PUT vs PATCH — một hàm, hai hành vi

```js
kiemTraTodo(body, true)    // PUT/POST — thay thế toàn bộ, bắt buộc đủ trường
kiemTraTodo(body, false)   // PATCH    — sửa một phần, không bắt buộc
```

Nối lại buổi 01 (ngữ nghĩa method) và buổi 05 (đã làm thủ công).

---

## 4. Tầng HTTP & ráp app (100–130′)

### 4.1. Thứ tự route — nhắc lại bài học buổi 05

```js
router.get('/todos/thong-ke', ...);   // ⚠️ CỤ THỂ đăng ký TRƯỚC
router.get('/todos/:id', ...);        //    CÓ THAM SỐ đăng ký SAU
```

Và có hẳn một test canh giữ điều đó:

```js
test('GET /todos/thong-ke — route cụ thể thắng route :id', async () => {
  const r = await goi('GET', '/todos/thong-ke');
  assert.equal(r.status, 200, 'KHÔNG được rơi vào /todos/:id');
});
```

> **📝 Ghi chú giảng viên**
> Chỉ vào test này và nói: *"Test không chỉ để bắt bug hôm nay. Nó là lời nhắc cho người sửa code sáu tháng sau — kể cả khi người đó là chính bạn."*

### 4.2. Tách `app.js` khỏi `server.js`

Quyết định thiết kế then chốt:

- `app.js` — chỉ có logic xử lý request, **không mở cổng**
- `server.js` — mở cổng, graceful shutdown, lưới an toàn

Nhờ vậy `api.test.js` dựng được server trên **cổng ngẫu nhiên** với **thư mục tạm**, chạy test mà không đụng dữ liệu thật và không xung đột cổng:

```js
server = http.createServer(app.xuLy);
await new Promise((r) => server.listen(0, r));   // cổng 0 = OS tự chọn cổng rảnh
```

> Đây chính là lý do Express tách `app` khỏi `server`, và NestJS có `Test.createTestingModule` (buổi 36).

### 4.3. Endpoint `/health`

```js
router.get('/health', (req, res) => {
  json(res, dangTat() ? 503 : 200, { trangThai: dangTat() ? 'dang-tat' : 'ok' });
});
```

Trả `503` khi đang tắt → load balancer biết ngừng gửi request tới server này. Chuẩn bị cho buổi 43 (monitoring).

---

## 5. Test ba tầng (130–160′)

| File | Loại | Không cần | Số test |
|---|---|---|---|
| `validator.test.js` | hàm thuần | I/O, server | 11 |
| `service.test.js` | nghiệp vụ + repository giả | đĩa, server | 18 |
| `api.test.js` | end-to-end qua HTTP thật | thư viện ngoài | 17 |

```
# tests 46
# pass 46
# fail 0
```

### Điểm dạy: repository giả (mock)

```js
function taoRepoGia(banDau = []) {
  let todos = banDau.map((t) => ({ ...t }));
  return {
    layTatCa: () => todos.map((t) => ({ ...t })),
    them: async (banGhi) => { /* chỉ thao tác RAM */ },
    // ...
  };
}
```

Service không biết mình đang nói chuyện với file hay với RAM — nó chỉ biết **hình dạng** của repository. Đó là toàn bộ ý nghĩa của việc tách tầng.

> Ở buổi 36, NestJS làm đúng việc này bằng `overrideProvider`. Học viên đã hiểu nguyên lý thì chỉ còn phải học cú pháp.

### Điểm dạy: test bảo mật

Test này ép ra lỗi 500 thật để kiểm chứng server **không lộ bí mật**:

```js
const serviceHong = {
  thongKe() { throw new Error('BÍ MẬT: chuỗi kết nối postgres://user:matkhau@db'); },
};
// ...
assert.equal(JSON.parse(r.tho).loi, 'Lỗi máy chủ nội bộ');
assert.equal(r.tho.includes('BÍ MẬT'), false);
assert.equal(r.tho.includes('postgres://'), false);
assert.equal(r.tho.includes('at '), false);
```

> **📝 Ghi chú giảng viên — test hỏng không có nghĩa là code hỏng**
> Lần đầu soạn bài, test này được viết đơn giản hơn: kiểm tra response của một request `400` không chứa dấu backslash. Test **thất bại** — nhưng không phải vì code sai, mà vì `JSON.stringify` escape dấu ngoặc kép thành `\"`, tạo ra một backslash hoàn toàn hợp lệ.
>
> Bài học cho lớp: **luôn đọc kỹ nguyên nhân test thất bại trước khi sửa code.** Ở đây thứ cần sửa là test — viết lại để kiểm chứng đúng nhánh lỗi 500 thật.

---

## 6. Retrospective: Express sẽ làm hộ những gì? (160–180′)

**Phần quan trọng nhất buổi học.** Mở lại bảng đã lập ở buổi 04 và điền cột thứ ba:

| Việc | Ta tự viết ở | Express làm hộ (buổi 10–11) |
|---|---|---|
| Routing, route param | `lib/router.js` — 80 dòng | `app.get('/todos/:id', ...)` |
| Parse JSON body | `lib/body.js` — 50 dòng | `express.json()` |
| Giới hạn kích thước body | `lib/body.js` | `express.json({ limit: '1mb' })` |
| Xử lý lỗi tập trung | `app.js` | error-handling middleware (4 tham số) |
| 404 mặc định | `app.js` | middleware cuối chuỗi |
| **405 + header `Allow`** | `lib/router.js` | ⚠️ **vẫn phải tự làm** |
| Chuẩn hoá response | `lib/respond.js` | `res.status(201).json(...)` |
| Log mỗi request | `app.js` | `morgan` |
| Validate | `todo.validator.js` | `zod` (buổi 11) |
| Lưu trữ | `todo.repository.js` | Prisma (buổi 12–13) |
| **Graceful shutdown** | `server.js` | ⚠️ **vẫn phải tự làm** |

Hai dòng **"vẫn phải tự làm"** là thông điệp lớn nhất:

> **Framework không làm hộ tất cả. Nó làm hộ phần lặp đi lặp lại.**
> Phần còn lại vẫn cần bạn hiểu bản chất — và giờ thì bạn hiểu rồi.

Câu chốt buổi học:

> *"Tuần sau ta viết lại đúng API này bằng Express, trong khoảng một phần ba số dòng. Nhưng các bạn sẽ biết chính xác Express đang làm gì bên dưới — vì các bạn vừa tự viết nó."*

---

## 7. Tiêu chí chấm Project 1

| Tiêu chí | Điểm |
|---|---|
| Đủ 8 endpoint, status code đúng ngữ nghĩa | 25 |
| Kiến trúc phân tầng rõ ràng, không rò rỉ trách nhiệm giữa các tầng | 20 |
| Validate đầu vào, chống mass assignment | 15 |
| Lưu trữ bền vững (ghi nguyên tử + hàng đợi) | 15 |
| Graceful shutdown hoạt động, kiểm chứng được | 10 |
| Test ≥ 30 test, có đủ cả 3 tầng | 10 |
| README đủ để người lạ clone về chạy được | 5 |

**Điểm trừ:**

| Lỗi | Trừ |
|---|---|
| Trả stack trace cho client | −15 |
| Dùng `forEach` với `async` | −10 |
| Thiếu `return` sau `res.end()` | −10 |
| Hardcode cổng/đường dẫn thay vì dùng biến môi trường | −5 |

---

## 8. Bài tập về nhà

1. **Tìm kiếm.** Thêm `?tuKhoa=...` tìm trong `tieuDe`, không phân biệt hoa thường và bỏ dấu tiếng Việt.
2. **Sắp xếp.** Thêm `?sapXep=taoLuc|tieuDe|uuTien` và `?huong=asc|desc`.
3. **Xoá mềm.** Thay xoá thật bằng `daXoa: true`; `GET /todos` mặc định không trả về chúng.
4. **Rate limit.** Giới hạn 10 request/phút mỗi IP, trả `429` kèm header `Retry-After`.
5. **Sub-resource.** Thêm `/todos/:id/ghi-chu` (quan hệ 1-n) — chuẩn bị cho quan hệ database ở buổi 13.
6. **Coverage.** Chạy `node --test --experimental-test-coverage`, đưa coverage lên trên 90%.

---

## 🎓 Kết thúc Phase 1

Học viên giờ đã **tự tay viết**:

- HTTP server không framework, hiểu `req`/`res` là stream
- Router với route param, thứ tự route, `405` + `Allow`
- Parse body có giới hạn kích thước, xử lý đúng UTF-8
- Xử lý lỗi tập trung, không lộ thông tin nhạy cảm
- Lưu trữ bền vững với ghi nguyên tử và hàng đợi
- Graceful shutdown 4 bước
- 46 test chia ba tầng

**Phase 2 bắt đầu:** viết lại chính API này bằng Express — và đối chiếu từng dòng với những gì vừa tự làm.

---

**Buổi trước:** [Buổi 08 — fs/promises, process & graceful shutdown](./buoi-08-process-shutdown.md)
**Buổi tiếp theo:** Buổi 10 — Express cơ bản *(Phase 2)*
