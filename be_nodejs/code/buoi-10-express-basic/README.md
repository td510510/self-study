# Buổi 10 — Express cơ bản

Giáo án: [`giao-an/phase-2/buoi-10-express-co-ban.md`](../../giao-an/phase-2/buoi-10-express-co-ban.md)

Cùng một Todo API của Project 1, viết lại bằng Express 5.

```bash
npm install
npm start        # hoặc npm run dev
npm test         # 16 test, dùng supertest
node demo-async-trap.js
```

## Điểm cốt lõi: 5/9 file dùng lại NGUYÊN XI

```
✅ config.js                  giống hệt Project 1
✅ lib/logger.js              giống hệt
✅ todos/todo.validator.js    giống hệt
✅ todos/todo.repository.js   giống hệt
✅ todos/todo.service.js      giống hệt

🔄 todos/todo.routes.js       viết lại bằng Express Router
🔄 app.js                     viết lại bằng middleware chain
🔄 server.js                  gần như giữ nguyên (graceful shutdown copy y hệt)
❌ lib/router.js              KHÔNG CẦN NỮA
❌ lib/body.js                KHÔNG CẦN NỮA
❌ lib/respond.js             KHÔNG CẦN NỮA
```

Đây là phần thưởng cho kiến trúc phân tầng ở buổi 09. Nếu viết tất cả vào một file, hôm nay phải làm lại từ đầu.

## Số dòng thực (bỏ comment & dòng trống)

| | Node thuần | Express |
|---|---|---|
| `lib/router.js` | 50 | — |
| `lib/body.js` | 34 | — |
| `lib/respond.js` | 28 | — |
| `todos/todo.routes.js` | 30 | 28 |
| `app.js` | 46 | 53 |
| **TỔNG** | **188** | **81** |

**Giảm 107 dòng (56%).** Tự kiểm chứng:

```bash
grep -vE '^\s*(//|/\*|\*|$)' src/app.js | wc -l
```

> Chú ý `app.js` của Express **dài hơn** — vì logic lỗi và middleware gom về một chỗ. Đừng đánh giá framework bằng "code ngắn hơn".

## Cái bẫy async của Express 4

```bash
node demo-async-trap.js
```

```
① Express 4, KHÔNG bọc asyncHandler
      ⚠️  unhandledRejection: "Lỗi trong handler async"
      → ❌ KHÔNG PHẢN HỒI sau 1526ms — REQUEST TREO VĨNH VIỄN
      → Ở production, đây là lúc TIẾN TRÌNH SẬP.

② Express 4, CÓ bọc asyncHandler   → HTTP 500 ✅
③ Express 5, KHÔNG cần bọc         → HTTP 500 ✅
```

Cách sửa cho Express 4:

```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

## Ba điều KHÔNG đổi so với Node thuần

1. **Thứ tự route** — `/thong-ke` vẫn phải đứng trước `/:id`.
2. **Graceful shutdown** — Express không lo; toàn bộ code buổi 08 copy y nguyên.
3. **Không lộ stack trace** — vẫn phải tự viết trong error middleware.

## Một mặc định Express khác thứ ta muốn

`express.json()` gặp sai `Content-Type` thì **lặng lẽ bỏ qua** (`req.body = undefined`) → API trả `400` thay vì `415`. Phải tự thêm middleware khôi phục — xem `src/app.js`.
