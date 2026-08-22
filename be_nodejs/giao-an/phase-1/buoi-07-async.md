# Buổi 07 — Async patterns & xử lý lỗi bất đồng bộ

> **Phase 1** · Node.js Core
> **Mục tiêu:** Chuẩn hoá cách xử lý bất đồng bộ và lỗi — nguồn gốc của phần lớn bug backend khó debug nhất.
> **Code thực hành:** [`code/buoi-07-async/`](../../code/buoi-07-async/)

Học viên đã biết `async/await` từ frontend. Buổi này **không dạy lại cú pháp** — mà dạy những cái bẫy chỉ lộ ra khi code chạy trên server, phục vụ nhiều người, suốt nhiều tháng.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 06 |
| 15–45′ | Tuần tự vs song song — đo bằng số liệu |
| 45–75′ | **Bẫy `forEach` + async** ← bug kinh điển |
| 75–110′ | Bốn combinator: `all` / `allSettled` / `race` / `any` |
| 110–150′ | **Ba bẫy xử lý lỗi** ← trọng tâm buổi |
| 150–175′ | Giới hạn đồng thời + lưới an toàn cấp tiến trình |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Tuần tự vs song song (15–45′)

[`01-tuan-tu-vs-song-song.js`](../../code/buoi-07-async/01-tuan-tu-vs-song-song.js)

Cùng 5 lời gọi, mỗi lời gọi 300ms. Kết quả thật:

```
❌ Tuần tự  : 1.505s
✅ Song song:  302ms
```

**Gấp 5 lần.** Chỉ khác nhau ở chỗ đặt `await`:

```js
// ❌ await TRONG vòng lặp → chờ xong cái này mới gọi cái kia
for (const ten of DANH_SACH) {
  ketQua.push(await goiApi(ten));
}

// ✅ .map KHÔNG await → tất cả promise được tạo NGAY LẬP TỨC
const cacPromise = DANH_SACH.map((ten) => goiApi(ten));
return Promise.all(cacPromise);
```

**Khi nào dùng cái nào:**

| Dùng | Khi |
|---|---|
| **Song song** | Các việc **độc lập**: lấy user + đơn hàng + giỏ hàng |
| **Tuần tự** | Việc sau **cần kết quả** việc trước: `const user = await timUser(id); const dh = await timDonHang(user.id);` |

> **⚠️ Song song không phải lúc nào cũng tốt.**
> `Promise.all` với 10.000 phần tử = 10.000 kết nối database cùng lúc → sập database. Phần 5 sẽ giải quyết bằng giới hạn đồng thời.

---

## 2. Bẫy `forEach` + async (45–75′)

[`02-bay-foreach.js`](../../code/buoi-07-async/02-bay-foreach.js)

> **📝 Ghi chú giảng viên — dựng kịch**
> Chiếu code lên, hỏi: *"Đoạn này có gì sai không?"* Đa số học viên frontend sẽ nói không.

```js
ITEMS.forEach(async (item) => {
  await luuVaoDb(item);
});
console.log('forEach xong');
```

Output thật:

```
❌ Bắt đầu forEach
❌ forEach "xong" — NHƯNG CHƯA LƯU XONG CÁI NÀO!

   [db] đã lưu A          ← xuất hiện SAU khi đã báo "xong"
   [db] đã lưu B
   [db] đã lưu C
```

**Vì sao?** Nhìn vào cách `forEach` được cài đặt (đơn giản hoá):

```js
Array.prototype.forEach = function (cb) {
  for (let i = 0; i < this.length; i++) {
    cb(this[i], i, this);     // ← gọi callback, VỨT BỎ giá trị trả về
  }
};
```

Callback `async` trả về một Promise. `forEach` **vứt nó đi**. Không ai `await` → không ai chờ.

### Hậu quả thật ở production

```js
app.post('/import', async (req, res) => {
  danhSach.forEach(async (item) => { await luuVaoDb(item); });
  res.json({ ok: true });        // ← trả về khi CHƯA lưu xong gì cả
});
```

Client nhận `{ ok: true }`, dữ liệu chưa vào database. Server restart ngay lúc đó → **mất sạch, không một dòng log lỗi nào.**

> **⚠️ QUY TẮC: trong code async, KHÔNG dùng `forEach`. Bao giờ.**
> - Cần tuần tự → `for...of` + `await`
> - Cần song song → `map` + `Promise.all`

---

## 3. Bốn combinator (75–110′)

[`03-promise-combinators.js`](../../code/buoi-07-async/03-promise-combinators.js)

| Combinator | Ngữ nghĩa | Dùng khi |
|---|---|---|
| `Promise.all` | Cần **tất cả** thành công. Một cái lỗi → hỏng hết | Lấy user + giỏ hàng để render trang |
| `Promise.allSettled` | Chờ **hết**, báo cáo từng cái | Gửi thông báo cho 100 người, ai lỗi thì ghi log |
| `Promise.race` | Ai xong trước thì thắng — **kể cả lỗi** | Đặt timeout |
| `Promise.any` | Ai **thành công** trước thì thắng | Gọi 3 máy chủ dự phòng |

> **⚠️ Lỗi hay gặp:** dùng `Promise.all` để gửi email hàng loạt. Một email lỗi → toàn bộ dừng, những người còn lại không nhận được gì. Đúng ra phải dùng `allSettled`.

### Ứng dụng thật: timeout

Pattern gặp hằng ngày ở backend:

```js
function voiTimeout(promise, msec) {
  const hetGio = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Quá hạn ${msec}ms`)), msec)
  );
  return Promise.race([promise, hetGio]);
}

await voiTimeout(goiApiBenThuBa(), 500);
// → "Quá hạn 500ms"
```

Không có nó, một service bên thứ ba treo sẽ kéo theo toàn bộ request của bạn treo theo — và người dùng chờ vô tận.

---

## 4. Trọng tâm buổi: ba bẫy xử lý lỗi (110–150′)

[`04-bay-xu-ly-loi.js`](../../code/buoi-07-async/04-bay-xu-ly-loi.js)

### Bẫy 1 — `try/catch` không bắt được lỗi trong callback

```js
try {
  setTimeout(() => {
    throw new Error('Lỗi ném trong setTimeout');
  }, 10);
} catch (err) {
  console.log('KHÔNG BAO GIỜ chạy tới đây');
}
```

**Giải thích bằng Event Loop (buổi 02):**

1. Chạy tới `setTimeout` → **đăng ký** callback → **thoát khỏi khối `try`**
2. … Event Loop quay tiếp …
3. 10ms sau, pha `timers` chạy callback → callback ném lỗi
4. Lúc này **ngăn xếp lời gọi hoàn toàn khác**. Khối `try/catch` ở bước 1 đã không còn tồn tại.

> `async/await` sinh ra chính là để giải quyết vấn đề này: `await` **giữ được ngữ cảnh `try/catch` qua các lượt của Event Loop.**

### Bẫy 2 — Quên `await`

```js
try {
  coTheLoi();          // ❌ quên await → try/catch vô dụng
} catch (err) { }

try {
  await coTheLoi();    // ✅ bắt được
} catch (err) { }
```

Không có `await`, lỗi thành `unhandledRejection` — và ở Node 22, mặc định điều đó **giết tiến trình**.

> **Quy tắc: luôn `await` trước hàm async, kể cả khi không cần kết quả.**

### Bẫy 3 — `Promise.all` nuốt lặng lẽ các lỗi sau lỗi đầu

```js
try {
  await Promise.all([loi('lỗi 1', 10), loi('lỗi 2', 30)]);
} catch (err) {
  console.log(err.message);   // → "lỗi 1"
}
```

Output thật:

```
Bắt được lỗi ĐẦU TIÊN: "lỗi 1"
⚠️  "lỗi 2" đâu rồi? KHÔNG có log nào cả.
```

> **📝 Ghi chú giảng viên — chi tiết dễ dạy sai**
> Nhiều tài liệu nói *"lỗi 2 trở thành `unhandledRejection`"*. **Không đúng.**
>
> `Promise.all` gắn handler vào **mọi** promise trong danh sách, nên `lỗi 2` **có** người xử lý — chỉ là `Promise.all` **vứt nó đi**. Không có cảnh báo nào cả.
>
> Điều này **còn tệ hơn** mồ côi: nếu là `unhandledRejection` thì ít nhất còn có log. Ở đây bạn **không bao giờ biết nó tồn tại**.
>
> Muốn thấy hết lỗi → `allSettled`:
> ```
> [0] rejected: lỗi A
> [1] rejected: lỗi B
> ```

---

## 5. Giới hạn đồng thời & lưới an toàn (150–175′)

[`05-promisify-va-luoi-an-toan.js`](../../code/buoi-07-async/05-promisify-va-luoi-an-toan.js)

### 5.1. Ba thế hệ code bất đồng bộ

| Thế hệ | Cách viết | Dùng khi |
|---|---|---|
| 1 | error-first callback | code cũ |
| 2 | tự bọc `new Promise` | thư viện chưa hỗ trợ Promise |
| 2b | `promisify(fn)` | bọc nhanh thư viện cũ |
| 3 | `node:fs/promises` | **luôn ưu tiên** |

Nhắc lại quy ước **error-first callback** — thứ định hình cả hệ sinh thái Node:

```js
fs.readFile('x', (err, data) => {
  if (err) return callback(err);   // ⚠️ nhớ `return`
  // ...
});
```

### 5.2. Giới hạn số việc chạy đồng thời

Kết quả thật với 20 việc, giới hạn 5:

```
20 việc, giới hạn 5 đồng thời: 404ms
Đỉnh cao đồng thời: 5 (đúng bằng giới hạn)
→ 20 × 100ms ÷ 5 luồng ≈ 400ms
```

So sánh ba cách làm 20 việc, mỗi việc 100ms:

| Cách | Thời gian | Rủi ro |
|---|---|---|
| Tuần tự | 2000ms | chậm |
| `Promise.all` | 100ms | **sập database nếu N lớn** |
| Giới hạn 5 | 400ms | ✅ cân bằng |

> Ở dự án thật, dùng thư viện `p-limit` thay vì tự viết. Nhưng phải hiểu nguyên lý — buổi 26 (BullMQ) dựa hoàn toàn vào ý tưởng này.

### 5.3. Lưới an toàn cấp tiến trình — dùng sao cho đúng

```js
process.on('uncaughtException', (err) => {
  console.error('[NGHIÊM TRỌNG]', err);
  process.exit(1);        // ⚠️ PHẢI thoát
});

process.on('unhandledRejection', (err) => {
  console.error('[NGHIÊM TRỌNG]', err);
  process.exit(1);
});
```

> **⚠️ Lưới an toàn KHÔNG PHẢI để "chạy tiếp như không có gì".**
>
> Ví dụ thật vì sao:
> 1. Bắt đầu transaction: trừ tiền tài khoản A
> 2. 💥 Lỗi không bắt được xảy ra
> 3. `uncaughtException` bắt được, ghi log, **chạy tiếp**
> 4. Transaction không bao giờ commit, cũng không rollback
> 5. **Tiền đã trừ, hàng không giao. Không ai biết.**
>
> Trạng thái sau `uncaughtException` là **không xác định**. Cách duy nhất an toàn: ghi log đầy đủ → đóng kết nối → thoát → để PM2/Docker/Kubernetes khởi động lại một bản sạch.
>
> Đó chính là **graceful shutdown** — chủ đề buổi 08.

---

## 6. Bài tập về nhà

1. **Đo trên API thật.** Gọi 5 endpoint của `https://jsonplaceholder.typicode.com` theo cả hai cách (tuần tự và song song), đo và lập bảng so sánh.

2. **Sửa bug `forEach`.** Cho đoạn code sau, chỉ ra lỗi và sửa theo **cả hai** cách (tuần tự và song song):
   ```js
   async function xuLyDon(danhSach) {
     danhSach.forEach(async (don) => {
       await capNhatTonKho(don);
       await guiEmail(don);
     });
     return 'xong';
   }
   ```

3. **Retry có backoff.** Viết hàm `thuLai(fn, soLan, doTre)` tự gọi lại khi thất bại, mỗi lần chờ lâu gấp đôi (100ms → 200ms → 400ms). Đây là pattern bắt buộc khi gọi API bên thứ ba.

4. **Chọn đúng combinator.** Với mỗi tình huống, chọn `all`/`allSettled`/`race`/`any` và giải thích:
   - Gửi SMS xác nhận cho 500 khách hàng
   - Lấy thông tin user + quyền + cấu hình để dựng trang admin
   - Tải ảnh đại diện từ CDN chính, nếu chậm quá 2s thì dùng ảnh mặc định
   - Truy vấn 3 máy chủ đồng bộ dữ liệu, lấy cái nào trả lời được

5. **Nâng cao.** Cải tiến `chayCoGioiHan` để nó dùng `allSettled` bên trong — không dừng toàn bộ khi một việc lỗi, mà trả về danh sách kết quả kèm trạng thái.

---

## 7. Checklist kết thúc buổi

- [ ] Khi nào dùng tuần tự, khi nào song song?
- [ ] Vì sao `forEach` không chờ callback `async`?
- [ ] Khác nhau giữa `Promise.all` và `Promise.allSettled`?
- [ ] Vì sao `try/catch` không bắt được lỗi ném trong `setTimeout`?
- [ ] Chuyện gì xảy ra với lỗi thứ hai trong `Promise.all`?
- [ ] Vì sao `Promise.all` với 10.000 phần tử là nguy hiểm?
- [ ] Sau `uncaughtException`, vì sao phải thoát tiến trình chứ không chạy tiếp?

---

**Buổi trước:** [Buổi 06 — Stream & Buffer](./buoi-06-stream-buffer.md)
**Buổi tiếp theo:** Buổi 08 — fs/promises, process & graceful shutdown
