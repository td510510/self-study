# Buổi 10 — Express cơ bản: app, Router, middleware chain

> **Phase 2** · Express.js
> **Mục tiêu:** Thấy tận mắt Express giải quyết gọn những gì Phase 1 phải viết tay — và hiểu middleware chain hoạt động thế nào bên dưới.
> **Code thực hành:** [`code/buoi-10-express-basic/`](../../code/buoi-10-express-basic/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Mở lại bảng retrospective buổi 09 |
| 20–55′ | Lý thuyết: middleware chain là gì |
| 55–110′ | **Thực hành: port Todo API sang Express** |
| 110–135′ | Đo và so sánh số dòng code |
| 135–165′ | **Cái bẫy async của Express 4** |
| 165–180′ | Bài tập & tổng kết |

---

## 1. Mở đầu — trả lời câu hỏi tuần trước (0–20′)

Mở lại bảng retrospective cuối buổi 09. Tuần trước ta kết thúc bằng lời hứa:

> *"Tuần sau ta viết lại đúng API này bằng Express, trong khoảng một phần ba số dòng."*

Hôm nay ta kiểm chứng lời hứa đó — bằng số liệu thật, không phải cảm tính.

Nhưng trước hết, một câu hỏi khó:

> *"Ta sẽ phải vứt bỏ bao nhiêu phần trăm code của Project 1?"*

Cho lớp đoán. Đáp án sẽ khiến nhiều người bất ngờ: **năm trên chín file được dùng lại nguyên xi, không sửa một ký tự.**

```
✅ config.js                giống hệt
✅ lib/logger.js            giống hệt
✅ todos/todo.validator.js  giống hệt
✅ todos/todo.repository.js giống hệt
✅ todos/todo.service.js    giống hệt
```

> **📝 Ghi chú giảng viên**
> Đây là **phần thưởng cho kiến trúc phân tầng** ở buổi 09. Nếu tuần trước ta viết tất cả vào một file, hôm nay phải viết lại từ đầu.
>
> Nói thẳng với lớp: *"Công sức tách tầng tuần trước, hôm nay các bạn được trả lại."* Đây là bài học kiến trúc quan trọng hơn cả bản thân Express.

---

## 2. Lý thuyết: middleware chain (20–55′)

### 2.1. Express là gì, ở mức bản chất

Express **không phải** một thứ huyền bí. Nó là:

1. Một mảng các hàm `(req, res, next)`
2. Một vòng lặp gọi lần lượt các hàm đó
3. Cộng thêm routing để chọn hàm nào được gọi

Học viên đã tự viết ý 2 và 3 ở buổi 05. Hôm nay chỉ học tên gọi và cú pháp chuẩn.

### 2.2. Middleware và `next()`

```js
app.use((req, res, next) => {
  console.log('trước');
  next();              // ← chuyển quyền cho middleware kế tiếp
  console.log('sau');  // ← chạy khi chuỗi phía sau đã xong
});
```

**Ba luật của middleware — viết lên bảng:**

| Luật | Hậu quả nếu vi phạm |
|---|---|
| Gọi `next()` để đi tiếp | Quên → **request treo mãi mãi**, không lỗi, không phản hồi |
| Hoặc kết thúc bằng `res.json()` / `res.send()` | Làm cả hai → `ERR_HTTP_HEADERS_SENT` (nhớ buổi 04) |
| Thứ tự khai báo = thứ tự thực thi | Đặt sai chỗ → middleware không bao giờ chạy |

> **📝 Ghi chú giảng viên**
> Cho học viên cố tình **xoá `next()`** trong middleware log, gọi API, và quan sát trình duyệt quay vòng vô tận. Đây là lỗi số một của người mới học Express, và chỉ nhớ khi tự gây ra một lần.

### 2.3. Đối chiếu với Frontend

> **💡 Đối chiếu Frontend**
> Middleware chain giống hệt **interceptor của axios** mà học viên đã dùng:
> ```js
> axios.interceptors.request.use((config) => { config.headers.Authorization = ...; return config; });
> ```
> Cùng một ý tưởng: một chuỗi hàm, mỗi hàm được xem và sửa đối tượng đi qua, rồi chuyển tiếp.
> Khác biệt: axios chuyển tiếp bằng `return`, Express chuyển tiếp bằng `next()`.

---

## 3. Thực hành: port Todo API sang Express (55–110′)

### 3.1. Cài đặt

```bash
mkdir buoi-10-express-basic && cd buoi-10-express-basic
npm init -y
npm pkg set type="module"
npm install express@5
```

Rồi **copy nguyên xi** 5 file từ Project 1: `config.js`, `lib/logger.js`, `todos/todo.{validator,repository,service}.js`.

### 3.2. Tầng HTTP — chỗ duy nhất phải viết lại

[`src/todos/todo.routes.js`](../../code/buoi-10-express-basic/src/todos/todo.routes.js)

```js
import { Router } from 'express';

export function taoTodoRouter(service) {
  const router = Router();

  // ⚠️ Thứ tự route VẪN QUAN TRỌNG y hệt Node thuần
  router.get('/thong-ke', (req, res) => res.json(service.thongKe()));
  router.get('/', (req, res) => res.json(service.danhSach(req.query)));
  router.get('/:id', (req, res) => res.json(service.layMot(req.params.id)));

  router.post('/', async (req, res) => {
    const todoMoi = await service.tao(req.body ?? null);
    res.status(201).location(`/todos/${todoMoi.id}`).json(todoMoi);
  });

  router.delete('/:id', async (req, res) => {
    await service.xoa(req.params.id);
    res.sendStatus(204);
  });

  return router;
}
```

**Ba thứ Express làm hộ trong file này:**

| Được | Thay cho |
|---|---|
| `req.params` | `lib/router.js` — `pathToRegex`, 50 dòng |
| `req.query` | tự parse `URLSearchParams` |
| `req.body` | `lib/body.js` — gom chunk, `Buffer.concat`, `JSON.parse`, 34 dòng |

> **⚠️ Điều KHÔNG đổi:** thứ tự route. `/thong-ke` vẫn phải đứng **trước** `/:id`. Express duyệt từ trên xuống y hệt router ta tự viết. Bài học buổi 05 vẫn nguyên giá trị.

### 3.3. Ráp app và chuỗi middleware

[`src/app.js`](../../code/buoi-10-express-basic/src/app.js)

```js
const app = express();

app.use(express.json({ limit: bodyLimit }));   // 1. parse body
app.use(kiemTraContentType);                    // 2. khôi phục 415
app.use(logMoiRequest);                         // 3. đo thời gian
app.get('/health', ...);                        // 4. route
app.use('/todos', taoTodoRouter(service));      // 5. router con
app.use(traVe404);                              // 6. không route nào khớp
app.use(xuLyLoi);                               // 7. error middleware (4 tham số)
```

**Hai điểm dạy quan trọng nhất:**

**(a) Error middleware nhận diện bằng SỐ THAM SỐ**

```js
app.use((err, req, res, next) => { ... });   // ✅ 4 tham số → error middleware
app.use((req, res, next) => { ... });        // ❌ 3 tham số → middleware thường
```

Viết thiếu `next` ở cuối → Express coi đây là middleware thường → **lỗi không bao giờ được xử lý**. Bẫy rất hay gặp, và ESLint sẽ báo `next` không dùng — đừng xoá nó.

**(b) Đo thời gian phải dùng `res.on('finish')`**

```js
app.use((req, res, next) => {
  const batDau = process.hrtime.bigint();
  res.on('finish', () => {           // ← 'finish' phát ra khi response đã gửi xong
    logger.info('request', { msec: ... });
  });
  next();                            // ← next() trả về NGAY, chưa xử lý xong
});
```

Hỏi lớp: *"Sao không đo ngay sau `next()`?"*
→ Vì `next()` trả về ngay lập tức khi chuỗi phía sau còn đang `await`. Đo ở đó sẽ ra ~0ms. Phải chờ sự kiện `finish`.

> So sánh với Project 1: ở đó ta đo trong khối `finally` của handler chính — được, vì ta kiểm soát toàn bộ vòng đời. Với Express, vòng đời do framework quản, nên phải bám vào sự kiện.

### 3.4. Một mặc định của Express khác với thứ ta muốn

> **📝 Ghi chú giảng viên — điểm dạy đắt giá**

`express.json()` gặp request sai `Content-Type` thì **lặng lẽ bỏ qua**, để `req.body` là `undefined`. Kết quả: API trả `400` thay vì `415` như Project 1.

Đây là bằng chứng cụ thể cho thông điệp buổi 09: **framework không làm hộ tất cả, và mặc định của nó không phải lúc nào cũng là thứ bạn muốn.**

Ta khôi phục bằng một middleware nhỏ:

```js
app.use((req, res, next) => {
  const coBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
  const contentType = req.headers['content-type'] ?? '';

  if (coBody && !contentType.startsWith('application/json')) {
    return next(new HttpError(415, `Content-Type phải là application/json...`));
  }
  next();
});
```

Ngược lại, Express **có** lo hộ hai lỗi mà Project 1 phải tự viết — nhận diện qua `err.type`:

```js
if (err.type === 'entity.parse.failed') return res.status(400).json({ loi: 'JSON không hợp lệ' });
if (err.type === 'entity.too.large')   return res.status(413).json({ loi: 'Body quá lớn' });
```

---

## 4. Đo đạc: Express tiết kiệm được bao nhiêu? (110–135′)

Đếm số dòng thực (bỏ comment và dòng trống):

| | Node thuần (Project 1) | Express |
|---|---|---|
| `lib/router.js` | 50 | — |
| `lib/body.js` | 34 | — |
| `lib/respond.js` | 28 | — |
| `todos/todo.routes.js` | 30 | 28 |
| `app.js` | 46 | 53 |
| **TỔNG** | **188** | **81** |

**Giảm 107 dòng — 56%.**

Lệnh đếm để học viên tự kiểm chứng:

```bash
grep -vE '^\s*(//|/\*|\*|$)' src/app.js | wc -l
```

> **📝 Ghi chú giảng viên**
> Chú ý `app.js` của Express **dài hơn** (53 so với 46). Hỏi lớp vì sao.
> → Vì logic xử lý lỗi và middleware **được gom về một chỗ**, thay vì rải rác trong `lib/`. Tổng thì ít đi rất nhiều, nhưng không phải file nào cũng ngắn lại.
>
> Bài học: **đừng đánh giá framework bằng "code ngắn hơn"**. Giá trị thật là ba thứ: (1) không phải viết lại thứ đã có, (2) người mới vào dự án đọc hiểu ngay vì đó là quy ước chung, (3) hệ sinh thái middleware có sẵn.

### Kiểm chứng hành vi giống hệt

Bộ test e2e được port sang `supertest`, **16/16 pass** với cùng các kỳ vọng như Project 1:

```
# tests 16
# pass 16
# fail 0
```

```js
test('415 sai Content-Type', async () => {
  await request(app).post('/todos').set('Content-Type', 'text/plain').send('abc').expect(415);
});
```

> **💡 So sánh với Project 1:** ở đó ta tự viết hàm `goi()` 20 dòng bằng `http.request`, tự mở server trên cổng `0`, tự parse JSON. `supertest` lo hết — và **không cần mở cổng thật**, nó tự dựng server tạm cho mỗi request.
>
> Điều này chỉ làm được vì ta **tách `app.js` khỏi `server.js`** từ buổi 09.

---

## 5. Cái bẫy async của Express 4 (135–165′)

> **📝 Ghi chú giảng viên**
> Phần này bắt buộc dạy, dù ta dùng Express 5. Lý do: **phần lớn dự án ngoài thực tế vẫn đang chạy Express 4**, và học viên sẽ gặp bug này ngay trong công việc đầu tiên.

Chạy [`demo-async-trap.js`](../../code/buoi-10-express-basic/demo-async-trap.js) — so sánh cùng một handler async ném lỗi trên ba cấu hình:

```
① Express 4, KHÔNG bọc asyncHandler
      ⚠️  unhandledRejection: "Lỗi trong handler async"
      → ❌ KHÔNG PHẢN HỒI sau 1526ms — REQUEST TREO VĨNH VIỄN
      → Ở production, đây là lúc TIẾN TRÌNH SẬP.

② Express 4, CÓ bọc asyncHandler
      → HTTP 500 — {"loi":"Error middleware ĐÃ nhận được lỗi"}

③ Express 5, KHÔNG cần bọc
      → HTTP 500 — {"loi":"Error middleware ĐÃ nhận được lỗi"}
```

**Vì sao?** Express 4 ra đời trước `async/await`. Nó gọi handler và **bỏ qua giá trị trả về** — y hệt cái bẫy `forEach` ở buổi 07:

```js
// Express 4, đơn giản hoá
layer.handle(req, res, next);    // ← handler async trả Promise, Express vứt đi
```

Promise bị reject mà không ai bắt → Express không biết → request không bao giờ được trả lời. Và trên **Node 15+**, `unhandledRejection` mặc định **làm sập tiến trình** — một request lỗi kéo theo toàn bộ người dùng khác mất kết nối (nhớ buổi 04).

**Cách sửa cho Express 4:**

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/todos/:id', asyncHandler(async (req, res) => { ... }));
```

Hoặc cài gói `express-async-errors` — nó vá vào Express 4 để tự động làm việc này.

| Tình huống | Cần làm gì |
|---|---|
| Dự án mới | Dùng **Express 5** — hết bẫy |
| Dự án cũ Express 4 | **Bắt buộc** bọc `asyncHandler`, hoặc `express-async-errors` |

---

## 6. Bài tập về nhà

1. **Tự gây bẫy.** Xoá `next()` trong middleware log, gọi API, mô tả hiện tượng. Rồi thêm lại. Viết 3 câu giải thích.

2. **Middleware xác thực giả.** Viết middleware yêu cầu header `X-API-Key`; thiếu hoặc sai thì trả `401`. Áp dụng **chỉ cho** `/todos`, không áp cho `/health`. (Chuẩn bị cho buổi 15–16.)

3. **Đảo thứ tự route.** Đăng ký `/:id` **trước** `/thong-ke`, gọi `/todos/thong-ke`, chụp kết quả sai, giải thích. Chứng minh Express hành xử y hệt router tự viết ở buổi 05.

4. **Đo lại số dòng.** Tự chạy lệnh `grep -vE ... | wc -l` trên cả hai dự án, lập bảng của riêng bạn. Có khớp với con số 188 → 81 không?

5. **Port `asyncHandler`.** Cài `express4` (bằng alias như trong demo), viết lại `todo.routes.js` cho Express 4 có bọc `asyncHandler`, chạy lại bộ test và xác nhận **16/16 vẫn pass**.

6. **Nâng cao.** Đọc mã nguồn `express/lib/router/index.js`, tìm vòng lặp gọi middleware. So sánh với hàm `handle()` mà bạn tự viết ở buổi 05 — chỉ ra hai điểm giống và hai điểm khác.

---

## 7. Checklist kết thúc buổi

- [ ] Middleware là gì? Kể ba luật của middleware.
- [ ] Chuyện gì xảy ra nếu quên `next()`?
- [ ] Express nhận diện error middleware bằng cách nào?
- [ ] Vì sao phải dùng `res.on('finish')` để đo thời gian, không đo sau `next()`?
- [ ] Thứ tự route trong Express có quan trọng không? Vì sao?
- [ ] `express.json()` gặp `Content-Type: text/plain` thì làm gì?
- [ ] Handler async ném lỗi trong Express 4 gây hậu quả gì? Sửa thế nào?
- [ ] Năm file nào của Project 1 được dùng lại nguyên xi? Vì sao được?

---

**Buổi trước:** [Buổi 09 — Project 1: Todo REST API Node thuần](../phase-1/buoi-09-project-1.md)
**Buổi tiếp theo:** Buổi 11 — Middleware nâng cao & validation với zod
