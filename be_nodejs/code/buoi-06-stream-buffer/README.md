# Buổi 06 — Stream & Buffer

Giáo án: [`giao-an/phase-1/buoi-06-stream-buffer.md`](../../giao-an/phase-1/buoi-06-stream-buffer.md)

Không cần `npm install`.

## Thứ tự chạy

```bash
node 01-buffer-co-ban.js            # Buffer & ký tự bị cắt đôi
node 02-tao-file-lon.js             # tạo data/access.log (31.2 MB) + backpressure
node 03-dem-dong-sai.js             # ❌ đếm ra 496
node 04-dem-dong-dung.js            # ✅ đếm ra 500
node --expose-gc 05-pipeline-transform.js
```

## Trọng tâm: bug âm thầm

Đề bài: đếm số dòng chứa `"từ chối"`. Đáp án đúng — kiểm chứng độc lập:

```bash
grep -c "từ chối" data/access.log   # → 500
```

| File | Kết quả | |
|---|---|---|
| `03-dem-dong-sai.js` | **496** | ❌ thiếu 4, **không báo lỗi** |
| `04` cách 1 (tự giữ phần dư) | 500 | ✅ 531ms |
| `04` cách 2 (readline) | 500 | ✅ 185ms |

> File log được sinh **tất định** (không dùng `Math.random`/`Date.now`), nên mọi máy đều ra đúng con số `496`. Kiểm chứng: `md5sum data/access.log` hai lần cho kết quả giống nhau.

Hai lỗi trong `03`:

```js
const text = chunk.toString('utf8');       // ❌ decode từng chunk riêng lẻ
for (const dong of text.split('\n')) {}    // ❌ xử lý chunk độc lập
```

→ ký tự UTF-8 bị cắt đôi ở ranh giới chunk, và từ khoá vắt qua ranh giới không tìm thấy.

## So sánh bộ nhớ (file 31.2 MB)

```
readFile (nạp hết)  : 66.7 MB
pipeline (stream)   : 16.0 MB
```

Chạy bằng `--expose-gc` thì số đo mới chính xác — cần dọn rác giữa hai phép đo, nếu không kết quả bị cộng dồn và cho ra kết luận ngược.

## Quy tắc rút ra

1. **Gom `Buffer` trước, `toString('utf8')` một lần ở cuối.**
2. **Dùng `pipeline()` từ `node:stream/promises`, không dùng `.pipe()`** — `.pipe()` rò rỉ file descriptor khi có lỗi.
3. **Luôn gọi `callback()` trong `_transform`** — quên là stream treo im lặng.
