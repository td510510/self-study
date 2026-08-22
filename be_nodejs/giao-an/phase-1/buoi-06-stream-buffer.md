# Buổi 06 — Stream & Buffer

> **Phase 1** · Node.js Core
> **Mục tiêu:** Hiểu vì sao Node xử lý file/mạng lớn hiệu quả, và tự tay gặp phải lớp bug âm thầm nhất của backend — dữ liệu bị cắt sai ở ranh giới chunk.
> **Code thực hành:** [`code/buoi-06-stream-buffer/`](../../code/buoi-06-stream-buffer/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 05 |
| 15–45′ | Lý thuyết + thực hành: Buffer và ký tự bị cắt đôi |
| 45–70′ | Thực hành: tạo file log 31 MB + backpressure |
| 70–110′ | **Thực hành: đếm SAI rồi đếm ĐÚNG** ← trọng tâm buổi |
| 110–160′ | Thực hành: `pipeline()` + Transform stream |
| 160–180′ | Bài tập & tổng kết |

---

## 1. Buffer — vì sao cần một kiểu dữ liệu riêng (15–45′)

### 1.1. Chuỗi không đủ dùng

JavaScript có `String`, vậy tại sao Node cần `Buffer`?

Vì `String` trong JS là **chuỗi ký tự**, còn mạng và đĩa làm việc với **chuỗi byte**. Hai thứ này **không tương ứng 1-1**.

Chạy [`01-buffer-co-ban.js`](../../code/buoi-06-stream-buffer/01-buffer-co-ban.js):

```
Chuỗi          : Xin chào
Số ký tự       : 8
Số byte (UTF-8): 9          ← lệch!
Buffer         : <Buffer 58 69 6e 20 63 68 c3 a0 6f>
```

Từng ký tự:

```
'X' → 1 byte → 58
'i' → 1 byte → 69
...
'à' → 2 byte → c3a0        ← thủ phạm
'o' → 1 byte → 6f
```

> Nối lại buổi 01: đây chính là lý do `Content-Length` phải dùng `Buffer.byteLength()` chứ không phải `.length`.

### 1.2. Khoảnh khắc quyết định của buổi học

Buffer `Xin chào` có 9 byte, `à` chiếm byte thứ 6 và 7. **Cắt ở giữa nó — tại vị trí 7:**

```js
const nua1 = buf.subarray(0, 7);   // 'Xin ch' + nửa đầu của 'à'
const nua2 = buf.subarray(7);      //           nửa sau của 'à' + 'o'
```

Kết quả thật:

```
Nửa 1 → chuỗi  : "Xin ch�"
Nửa 2 → chuỗi  : "�o"
Ghép chuỗi lại : "Xin ch��o"      ❌ HỎNG
Ghép BUFFER lại: "Xin chào"        ✅ ĐÚNG
```

> **⚠️ Quy tắc rút ra — dùng suốt đời làm backend**
> **Gom `Buffer` trước, `toString('utf8')` MỘT LẦN ở cuối.**
>
> Đây chính là lý do ở buổi 05 ta viết:
> ```js
> req.on('end', () => resolve(Buffer.concat(chunks)));   // ✅
> ```
> chứ không viết:
> ```js
> let s = '';
> req.on('data', c => s += c.toString());                // ❌
> ```
> Stream cắt dữ liệu theo **byte**, không quan tâm ranh giới ký tự.

> **📝 Ghi chú giảng viên**
> Học viên frontend hầu như chưa bao giờ nghĩ về byte — trình duyệt che hết. Hãy dành đủ thời gian ở đây. Nếu lớp chưa "thấm" đoạn `Xin ch��o`, đừng đi tiếp.

---

## 2. Tạo dữ liệu thực hành & backpressure (45–70′)

[`02-tao-file-lon.js`](../../code/buoi-06-stream-buffer/02-tao-file-lon.js)

```bash
node 02-tao-file-lon.js
# → data/access.log — 31.2 MB, 500.000 dòng, mất ~1.8s
```

### Backpressure — khái niệm cốt lõi khi ghi dữ liệu lớn

```js
const conGhiDuoc = stream.write(dong);

if (!conGhiDuoc) {
  // Bộ đệm đầy. DỪNG LẠI, chờ 'drain' rồi mới ghi tiếp.
  stream.once('drain', ghiTiep);
  return;
}
```

**Giải thích bằng ví dụ đời thường:** bạn rót nước vào phễu, phễu chảy xuống chai. Rót nhanh hơn tốc độ chảy → nước tràn.

- `stream.write()` trả `false` = *"phễu sắp đầy, chậm lại"*
- sự kiện `'drain'` = *"phễu vơi rồi, rót tiếp được"*

> **Bỏ qua backpressure là nguyên nhân phổ biến của lỗi `JavaScript heap out of memory`.**
> Ở phần 5 ta sẽ thấy `pipeline()` lo hộ việc này hoàn toàn.

> **📝 Ghi chú giảng viên — vì sao file phải tất định**
> File được sinh bằng công thức từ chỉ số `i`, **không dùng `Math.random()` hay `Date.now()`**. Nhờ vậy mọi học viên sinh ra file giống hệt nhau (cùng mã MD5), và ai cũng sẽ thấy **đúng con số sai** ở phần sau. Nếu dùng số ngẫu nhiên, mỗi máy ra một kết quả khác — không dạy được.

---

## 3. Trọng tâm buổi học: đếm SAI rồi đếm ĐÚNG (70–110′)

### 3.1. Đề bài

> Đếm số dòng trong log chứa cụm từ **`"từ chối"`** (có dấu — cố ý).

Đáp án đúng, kiểm chứng độc lập bằng `grep`:

```bash
grep -c "từ chối" data/access.log     # → 500
wc -l < data/access.log               # → 500000
```

### 3.2. Cách viết mà 90% người mới sẽ chọn

[`03-dem-dong-sai.js`](../../code/buoi-06-stream-buffer/03-dem-dong-sai.js)

```js
stream.on('data', (chunk) => {
  const text = chunk.toString('utf8');          // ❌ decode từng chunk riêng lẻ
  for (const dong of text.split('\n')) {        // ❌ xử lý chunk độc lập
    if (dong.includes(TU_KHOA)) soLanTuKhoa++;
  }
});
```

Kết quả thật:

```
Số chunk đọc được : 31968
Số dòng           : 500.000     ← đúng
Số dòng có "từ chối" : 496      ← SAI, thiếu 4
```

> **📝 Ghi chú giảng viên — dựng kịch cho khoảnh khắc này**
> **Đừng nói trước là code sai.** Chiếu code lên, hỏi lớp *"code này có vấn đề gì không?"* — đa số sẽ nói không. Chạy, ra `496`. Rồi chạy `grep -c` ra `500`.
>
> Khoảng lặng lúc đó là thứ đáng giá nhất buổi học.
>
> Nhấn mạnh: **chương trình không hề báo lỗi.** Nó chạy nhanh hơn bản đúng, không crash, và trả về một con số trông hoàn toàn hợp lý. Chỉ khi đối chiếu độc lập mới biết sai.
>
> Hỏi lớp: *"Nếu đây là báo cáo doanh thu gửi giám đốc thì sao?"*

**Hai lỗi trong đoạn code trên:**

| Lỗi | Hậu quả |
|---|---|
| `chunk.toString()` trên từng chunk riêng lẻ | Ký tự UTF-8 bị cắt đôi ở ranh giới chunk thành `�` |
| Xử lý từng chunk độc lập | Từ khoá nằm vắt qua ranh giới chunk không bao giờ được tìm thấy |

Vì sao chọn `highWaterMark: 1024`? Để lỗi lộ ra rõ ràng. Ở production chunk mặc định 64 KB nên lỗi **hiếm** hơn — nhưng **vẫn có**.

> **Bug hiếm gặp còn nguy hiểm hơn bug hay gặp: nó lọt qua mọi vòng test và chỉ nổ ở production.**

### 3.3. Hai cách sửa

[`04-dem-dong-dung.js`](../../code/buoi-06-stream-buffer/04-dem-dong-dung.js)

**Cách 1 — tự giữ phần dư giữa các chunk:**

```js
let phanDu = '';   // ⭐ phần dòng chưa hoàn chỉnh của chunk trước

for await (const chunk of stream) {
  const text = phanDu + chunk;        // nối phần dư vào đầu
  const cacDong = text.split('\n');
  phanDu = cacDong.pop();             // phần tử cuối có thể chưa hoàn chỉnh

  for (const dong of cacDong) { /* xử lý dòng hoàn chỉnh */ }
}

if (phanDu.length > 0) { /* đừng quên dòng cuối nếu file không kết thúc bằng \n */ }
```

Lưu ý `{ encoding: 'utf8' }` khi tạo stream — khi đó Node tự lo ranh giới ký tự UTF-8, chỉ còn ranh giới **dòng** là việc của ta.

**Cách 2 — dùng `readline`, Node lo hết:**

```js
const rl = createInterface({
  input: createReadStream(FILE),
  crlfDelay: Infinity,     // xử lý đúng cả file Windows (\r\n)
});

for await (const dong of rl) { /* mỗi lần lặp = MỘT DÒNG HOÀN CHỈNH */ }
```

Kết quả thật:

```
Cách 1 — tự giữ phần dư: 531ms   → 500 dòng ✅
Cách 2 — readline      : 185ms   → 500 dòng ✅

Bộ nhớ đỉnh: 9.0 MB   (file 31 MB — không bao giờ nạp hết vào RAM)
```

> **Dùng cách nào?**
> - `readline` → khi dữ liệu chia theo **dòng** (log, CSV, JSONL). Gọn, khó sai, và nhanh hơn.
> - Tự giữ phần dư → khi cần tự kiểm soát (parse binary, giao thức riêng).
>
> Trong công việc thật: **mặc định dùng `readline`**. Nhưng phải **hiểu** cách 1, vì đó chính là thứ `readline` làm bên trong.

---

## 4. `pipeline()` và Transform stream (110–160′)

[`05-pipeline-transform.js`](../../code/buoi-06-stream-buffer/05-pipeline-transform.js)

```bash
node --expose-gc 05-pipeline-transform.js
```

### 4.1. So sánh bộ nhớ — con số biết nói

```
File nguồn: 31.2 MB

Bộ nhớ ban đầu       : 4.5 MB
readFile (nạp hết)   : 66.7 MB   ← toàn bộ file nằm trong RAM
Bộ nhớ sau khi dọn   : 4.1 MB

pipeline (stream)    : 16.0 MB   ← không bao giờ nạp hết file
```

> **📝 Ghi chú giảng viên — vì sao cần `--expose-gc`**
> Đây là một bài học phụ về **cách đo đúng**. Khi soạn bài, phép đo đầu tiên cho kết quả *ngược*: pipeline "tốn" 84 MB, nhiều hơn readFile.
>
> Nguyên nhân: biến chứa nội dung file vẫn còn tham chiếu ở top-level nên chưa được thu hồi — số đo phần 2 bị cộng dồn phần 1.
>
> Cách sửa: đặt phép đo readFile **trong một hàm** (hết hàm là mất tham chiếu) rồi chủ động gọi `global.gc()` giữa hai phép đo.
>
> **Bài học cho học viên: đo sai còn tệ hơn không đo.** Luôn hỏi *"phép đo này có gì làm nhiễu không?"*

Nhân con số này lên quy mô thật: file 2 GB thì `readFile` **chết ngay** (vượt giới hạn bộ nhớ của V8), còn stream vẫn chạy bình thường.

### 4.2. Transform stream

`Transform` = vừa đọc vào, vừa biến đổi, vừa ghi ra. Giống `Array.prototype.map`, nhưng chạy trên **dòng dữ liệu đang chảy**.

```js
class LocDongLoi extends Transform {
  constructor() { super({ objectMode: true }); }

  _transform(dong, _encoding, callback) {      // gọi cho MỖI dòng
    if (dong.includes(' ERROR ')) {
      const [thoiGian, , , duongDan] = dong.split(' ');
      this.push(`${thoiGian}\t${duongDan}\n`);
    }
    callback();      // ⚠️ QUÊN gọi = stream đứng im mãi mãi
  }

  _flush(callback) {                            // gọi MỘT LẦN khi hết dữ liệu
    this.push(`\n# Tổng: đọc ${this.soDongDoc} dòng, giữ ${this.soDongGiu} dòng\n`);
    callback();
  }
}
```

> **⚠️ Bẫy:** quên gọi `callback()` trong `_transform` → stream treo im lặng, không lỗi, không kết thúc. Bug rất khó tìm vì không có thông báo nào cả. Cho học viên xoá thử `callback()` để thấy chương trình treo.

### 4.3. Vì sao luôn dùng `pipeline()` thay vì `.pipe()`

```js
// ❌ Cách cũ
a.pipe(b).pipe(c);
// Nếu b lỗi → a và c KHÔNG được dọn dẹp → rò rỉ file descriptor.
// Server chạy vài ngày là hết file descriptor, không nhận thêm kết nối nào.

// ✅ Cách đúng
await pipeline(a, b, c);
// Lỗi ở bất kỳ khâu nào cũng được ném ra để bắt, MỌI stream đóng sạch sẽ.
```

> **Quy tắc: dùng `pipeline()` từ `node:stream/promises`. Luôn luôn.**

### 4.4. Bốn loại stream — bảng tổng kết

| Loại | Vai trò | Ví dụ trong Node |
|---|---|---|
| **Readable** | đọc ra | `fs.createReadStream`, `req`, `process.stdin` |
| **Writable** | ghi vào | `fs.createWriteStream`, `res`, `process.stdout` |
| **Duplex** | cả hai chiều | `net.Socket` |
| **Transform** | Duplex + biến đổi | `zlib.createGzip`, lớp `LocDongLoi` ở trên |

> Nhắc lại buổi 04: `req` là **Readable**, `res` là **Writable**. Giờ học viên đã hiểu trọn vẹn ý nghĩa của câu đó.

---

## 5. Bài tập về nhà

1. **Thống kê log.** Dùng `readline` đọc `access.log`, đếm số request theo từng mức (`INFO`/`WARN`/`ERROR`/`DEBUG`) và theo từng đường dẫn API. In bảng kết quả.

2. **Nén file.** Dùng `pipeline()` + `zlib.createGzip()` nén `access.log` thành `access.log.gz`. So sánh kích thước trước/sau và thời gian chạy.

3. **Transform riêng.** Viết một Transform stream che giấu địa chỉ IP (`192.168.1.5` → `192.168.*.*`) rồi ghi ra file mới. Đây là bài toán thật khi cần chia sẻ log ra ngoài.

4. **Tự tái hiện bug.** Sửa `highWaterMark` trong `03-dem-dong-sai.js` lần lượt thành `512`, `4096`, `65536`. Lập bảng kết quả và giải thích vì sao chunk càng lớn thì càng ít sai — nhưng **không bao giờ hết sai**.

5. **Nâng cao — streaming HTTP.** Viết endpoint `GET /log` dùng `pipeline(createReadStream(...), res)` để gửi file 31 MB về client mà không nạp vào RAM. Quan sát bộ nhớ server khi 5 client cùng tải.

---

## 6. Checklist kết thúc buổi

- [ ] Vì sao `'Xin chào'.length` là 8 nhưng `Buffer.byteLength` là 9?
- [ ] Điều gì xảy ra khi cắt Buffer giữa một ký tự nhiều byte?
- [ ] Vì sao phải `Buffer.concat` thay vì nối chuỗi từng chunk?
- [ ] Backpressure là gì? `stream.write()` trả `false` nghĩa là gì?
- [ ] Vì sao code ở bài 03 đếm ra 496 thay vì 500?
- [ ] Vì sao `pipeline()` an toàn hơn `.pipe()`?
- [ ] Quên gọi `callback()` trong `_transform` gây ra hiện tượng gì?

---

**Buổi trước:** [Buổi 05 — Router thủ công & parse body](./buoi-05-router-body.md)
**Buổi tiếp theo:** Buổi 07 — Async patterns & xử lý lỗi
