# Buổi 17 — File upload & Testing

> **Phase 2** · Express.js
> **Mục tiêu:** Thêm tính năng upload **an toàn** — và bắt đầu viết test có hệ thống. Testing không phải việc "học sau".
> **Code thực hành:** [`code/buoi-17-upload-testing/`](../../code/buoi-17-upload-testing/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 16 |
| 15–45′ | `multipart/form-data` và multer |
| 45–110′ | **Ba lỗ hổng upload và cách chặn** |
| 110–150′ | Kim tự tháp test, coverage |
| 150–175′ | Lưu file ở đâu: local vs cloud |
| 175–180′ | Bài tập & tổng kết |

---

## 1. `multipart/form-data` — định dạng khác hẳn JSON (15–45′)

Nhớ lại buổi 05: ta tự parse JSON body bằng cách gom chunk rồi `JSON.parse`. Với file thì **không làm vậy được**.

```http
POST /upload/anh HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWx

------WebKitFormBoundary7MA4YWx
Content-Disposition: form-data; name="anh"; filename="anh.jpg"
Content-Type: image/jpeg

<dữ liệu nhị phân của ảnh>
------WebKitFormBoundary7MA4YWx--
```

Ba điểm khác biệt:

| | JSON | multipart |
|---|---|---|
| Dữ liệu | văn bản | **nhị phân** |
| Cấu trúc | một object | nhiều phần, ngăn bởi `boundary` |
| Kích thước | vài KB | có thể vài GB |

> `express.json()` **không** xử lý được multipart. Đó là lý do cần multer.

### `memoryStorage` hay `diskStorage`?

```js
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 5, fields: 10 },
});
```

> **📝 Ghi chú giảng viên — quyết định quan trọng**
>
> `diskStorage` ghi file xuống đĩa **ngay khi nhận**, **trước khi** ta kịp kiểm tra. Nghĩa là file độc hại **đã nằm trên máy chủ** rồi mới bị từ chối — và nếu code xoá bị lỗi, nó ở lại vĩnh viễn.
>
> `memoryStorage` giữ trong RAM để kiểm tra trước. Đánh đổi: tốn RAM. Với file lớn (video), phải dùng `diskStorage` vào **thư mục tạm ngoài web root**, hoặc stream thẳng lên S3.

Và `limits` là **lớp phòng thủ thứ nhất** — multer cắt kết nối ngay khi vượt ngưỡng, không đọc hết vào RAM.

---

## 2. Trọng tâm: ba lỗ hổng upload (45–110′)

### 2.1. Lỗ hổng 1 — Tin vào kiểu MIME do client khai

> **📝 Ghi chú giảng viên — mở đầu bằng câu hỏi**
> *"Làm sao biết file người dùng gửi lên là ảnh?"*
>
> Câu trả lời đầu tiên của lớp gần như luôn là: *"kiểm tra `file.mimetype`"* hoặc *"kiểm tra đuôi `.jpg`"*.
>
> Cả hai đều **sai**, vì cả hai đều do **client tự khai**.

Test chứng minh:

```js
test('file .exe đổi tên thành .jpg và khai image/jpeg → BỊ CHẶN', async () => {
  await request(app)
    .post('/upload/anh')
    // Kẻ tấn công làm đủ mọi cách để trông như ảnh:
    //   - đặt tên .jpg
    //   - khai Content-Type là image/jpeg
    // Nhưng NỘI DUNG thật là file thực thi.
    .attach('anh', taoFileGia.exe(), { filename: 'anh.jpg', contentType: 'image/jpeg' })
    .expect(400);
});
```

**Cách chặn duy nhất đáng tin: đọc magic bytes.**

Vài byte đầu tiên của file do **định dạng** quy định, không phải do tên hay lời khai:

```js
const CHU_KY = [
  { loai: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { loai: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { loai: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },   // "%PDF"
];
```

> Kẻ tấn công **không giả được** magic bytes mà không phá hỏng chính file đó.

Chi tiết tinh tế — **WEBP cần khớp ở hai vị trí**:

```js
{ loai: 'image/webp', bytes: [0x52,0x49,0x46,0x46],              // "RIFF" ở byte 0
  boSung: { viTri: 8, bytes: [0x57,0x45,0x42,0x50] } }           // "WEBP" ở byte 8
```

Vì `.wav` cũng bắt đầu bằng `RIFF`. Có test canh giữ:

```js
test('WEBP cần khớp ở HAI vị trí', () => {
  // "RIFF" + "WAVE" → KHÔNG phải webp
  assert.equal(nhanDangKieuThat(sai), null);
});
```

**Và quyết định luôn dựa trên magic bytes, không dựa trên lời khai:**

```js
test('ảnh THẬT nhưng client khai sai kiểu → vẫn nhận, kèm CẢNH BÁO', async () => {
  assert.equal(r.body.loai, 'image/png', 'tin magic bytes, không tin lời khai');
  assert.ok(r.body.canhBao, 'phải ghi nhận việc khai sai');
});
```

> Ghi lại việc client khai sai là **tín hiệu bảo mật** — người dùng bình thường không khai sai kiểu file.

### 2.2. Lỗ hổng 2 — Path traversal qua tên file

```js
await request(app)
  .post('/upload/anh')
  .attach('anh', taoFileGia.jpeg(), '../../../../etc/passwd.jpg');
```

Nếu server dùng thẳng tên gốc để ghi file, nó **ghi đè file hệ thống**.

**Ba lớp phòng thủ:**

```js
// 1. KHÔNG dùng lại tên client gửi — tự sinh tên hoàn toàn mới
export function sinhTenAnToan(duoiThat) {
  return `${Date.now()}-${randomUUID()}${duoiThat}`;
}

// 2. Tên gốc chỉ lưu làm METADATA để hiển thị, đã được làm sạch
sach = basename(tenGoc ?? '');                    // '../../etc/passwd' → 'passwd'
sach = sach.replace(/[/\\:*?"<>|]/g, '_');

// 3. Kiểm tra lại đường dẫn cuối cùng vẫn nằm trong thư mục lưu
if (!duongDan.startsWith(thuMucTuyetDoi)) throw new HttpError(400, ...);
```

> **Phòng thủ theo tầng.** Tên đã do ta tự sinh rồi, nhưng vẫn kiểm tra lại — vì một ngày nào đó có người sửa code và bỏ mất bước sinh tên.

**Và đừng quên endpoint xoá:**

```js
test('xoá file với ../ → BỊ CHẶN', async () => {
  await request(app).delete('/upload/anh/..%2F..%2F.env').expect(400);
});
```

> Client gửi `tenFile = "../../.env"` là **xoá mất file cấu hình** của bạn. Lỗ hổng path traversal không chỉ ở lúc ghi.

### 2.3. Lỗ hổng 3 — File độc hại được phục vụ lại

```js
test('file HTML chứa script khai là ảnh → BỊ CHẶN', async () => {
  // Nếu lọt, file này được phục vụ trên CÙNG DOMAIN
  // → chạy script → đánh cắp cookie của mọi người xem. XSS lưu trữ.
});
```

> **⚠️ Nguy hiểm nhất trong ba lỗ hổng.** File `.html` hoặc `.svg` chứa `<script>` mà được phục vụ từ cùng domain thì script đó chạy **với đầy đủ quyền của trang bạn** — đọc được cookie, gọi được API thay mặt người dùng.

Bốn biện pháp, nên làm **tất cả**:

| Biện pháp | Tác dụng |
|---|---|
| Chỉ cho phép danh sách trắng định dạng | chặn từ đầu |
| Lưu ngoài thư mục web phục vụ | không truy cập trực tiếp được |
| Phục vụ từ **domain khác** (CDN) | script chạy cũng không đọc được cookie |
| `Content-Disposition: attachment` | trình duyệt tải về thay vì hiển thị |

> Chủ đề này quay lại ở buổi 22 (OWASP) và buổi 23 (CSP header).

---

## 3. Kim tự tháp test (110–150′)

Dự án này có **hai tầng test**, cố ý:

| File | Loại | Test gì | Cần gì | Số test |
|---|---|---|---|---|
| `kiem-tra-file.test.js` | **Unit** | hàm thuần | không gì cả | 22 |
| `upload.test.js` | **Integration** | qua HTTP thật | app + thư mục tạm | 16 |

```
# tests 38
# pass 38
# duration_ms 393
```

### 3.1. Vì sao cần cả hai?

**Unit test bắt được thứ integration test không bắt được** — các trường hợp biên:

```js
const truongHop = [
  ['anh.jpg', 'anh.jpg'],
  ['../../../etc/passwd', 'passwd'],
  ['/etc/shadow', 'shadow'],
  ['..', 'khong-ten'],
  ['', 'khong-ten'],
  [undefined, 'khong-ten'],
];
```

Sáu trường hợp này, viết bằng integration test thì phải gửi sáu HTTP request — chậm gấp trăm lần và khó đọc hơn nhiều.

**Integration test bắt được thứ unit test không bắt được** — lỗi phối hợp:

- Middleware multer đặt sai thứ tự
- Mã lỗi của multer không được ánh xạ sang HTTP đúng
- Route đăng ký nhầm đường dẫn

> **📝 Ghi chú giảng viên**
> Chỉ vào cột "Cần gì": unit test **không cần gì cả**. Đó là lý do nó chạy trong mili-giây và ta viết được hàng trăm cái.
>
> Nguyên tắc kim tự tháp: **nhiều unit test, ít integration test, rất ít e2e test.**

### 3.2. Kiểu test "bảng dữ liệu"

```js
for (const [vao, ra] of truongHop) {
  test(`${JSON.stringify(vao)} → ${JSON.stringify(ra)}`, () => {
    assert.equal(lamSachTenGoc(vao), ra);
  });
}
```

Thêm một trường hợp = thêm **một dòng**. Và tên test tự sinh, đọc được ngay.

### 3.3. Test bất biến, không chỉ test ví dụ

```js
test('kết quả KHÔNG BAO GIỜ chứa dấu phân cách đường dẫn', () => {
  for (const [vao] of truongHop) {
    const kq = lamSachTenGoc(vao);
    assert.equal(kq.includes('/'), false);
    assert.equal(kq.includes('\\'), false);
  }
});

test('luôn sinh tên KHÁC NHAU', () => {
  const ds = new Set(Array.from({ length: 100 }, () => sinhTenAnToan('.jpg')));
  assert.equal(ds.size, 100);
});
```

> Đây là **tính chất phải luôn đúng**, không phụ thuộc dữ liệu cụ thể. Loại test này bắt được cả những trường hợp bạn chưa nghĩ ra.

### 3.4. Coverage — đọc cho đúng

```bash
node --test --experimental-test-coverage
```

```
file                    | line % | branch % | funcs % | uncovered lines
------------------------|--------|----------|---------|----------------
 app.js                 |  95.00 |    71.43 |   50.00 | 14 34
 lib/errors.js          | 100.00 |   100.00 |  100.00 |
 lib/kiem-tra-file.js   | 100.00 |   100.00 |  100.00 |
 upload/upload.routes.js|  94.66 |    80.00 |  100.00 | 61-62 105-106 121
```

> **⚠️ Coverage cao KHÔNG có nghĩa là code đúng.**
>
> Nó chỉ nói *"dòng này đã được chạy qua"*, không nói *"hành vi này đã được kiểm chứng"*. Có thể đạt 100% mà không có một `assert` nào.
>
> Cách dùng đúng: coverage là công cụ **tìm chỗ bị bỏ sót**, không phải mục tiêu để đạt.

Chú ý cột **branch %** thấp hơn line %: `app.js` có `71.43%` branch. Nghĩa là còn nhánh `if` chưa được test — thường là các nhánh xử lý lỗi hiếm. Đó chính là chỗ đáng viết thêm test.

---

## 4. Lưu file ở đâu (150–175′)

| | Đĩa cục bộ | S3 / object storage |
|---|---|---|
| Cài đặt | đơn giản | cần SDK, credential |
| Nhiều bản sao server | ❌ mỗi máy một bản khác nhau | ✅ dùng chung |
| Sao lưu | tự lo | có sẵn |
| CDN | phải tự dựng | có sẵn |
| Chi phí | dung lượng máy chủ | trả theo dung lượng + băng thông |

> **⚠️ Điểm chí tử của lưu đĩa cục bộ:** khi chạy nhiều bản sao server (buổi 44), người dùng upload ở máy A rồi request sau rơi vào máy B — **không thấy file**.
>
> Đây là lý do gần như mọi hệ thống production đều dùng object storage.

**Presigned URL** — kỹ thuật nên biết:

```
1. Client hỏi server: "tôi muốn upload ảnh"
2. Server trả về một URL có chữ ký, hạn dùng 5 phút
3. Client upload THẲNG lên S3, KHÔNG qua server
4. Client báo server: "xong rồi, đây là key"
```

> File **không đi qua server** → tiết kiệm băng thông và RAM, và không lo chặn Event Loop (buổi 02).

---

## 5. Bài tập về nhà

1. **Thêm định dạng.** Thêm hỗ trợ `.gif` (magic bytes `GIF8`). Viết unit test trước, rồi mới sửa code — thử **TDD** một lần.

2. **Tự khai thác.** Tạo một file văn bản, đổi tên thành `.jpg`, dùng `curl` upload kèm `Content-Type: image/jpeg`. Chụp lại kết quả. Rồi tạm bỏ kiểm tra magic bytes và thử lại — file có lọt không?

3. **Giới hạn kích thước ảnh.** Đọc chiều rộng/cao từ header PNG (byte 16–23) và từ chối ảnh lớn hơn 4000×4000. Vì sao cần? (Gợi ý: *decompression bomb* — ảnh 100KB giải nén thành 10GB trong RAM.)

4. **Nâng branch coverage.** Chạy coverage, tìm các dòng chưa được test trong `upload.routes.js` (61-62, 105-106, 121), viết test cho chúng. Ghi lại coverage trước/sau.

5. **Chuyển sang `Content-Disposition`.** Thêm endpoint `GET /upload/anh/:tenFile` phục vụ file với header `Content-Disposition: attachment`. Kiểm chứng trình duyệt tải về thay vì hiển thị.

6. **Nâng cao — presigned URL.** Dùng MinIO (S3-compatible, chạy bằng Docker) để thực hiện luồng presigned URL bốn bước ở trên.

---

## 6. Checklist kết thúc buổi

- [ ] `multipart/form-data` khác JSON body ở ba điểm nào?
- [ ] Vì sao dùng `memoryStorage` thay vì `diskStorage`? Khi nào phải đổi lại?
- [ ] Vì sao không được tin `file.mimetype` và phần mở rộng?
- [ ] Magic bytes là gì? Vì sao WEBP cần kiểm tra hai vị trí?
- [ ] Ba lớp phòng thủ chống path traversal?
- [ ] Vì sao file `.svg` được phục vụ từ cùng domain lại nguy hiểm?
- [ ] Unit test và integration test — cái nào bắt được gì?
- [ ] Coverage 100% có nghĩa là code đúng không? Vì sao?
- [ ] Vì sao lưu file trên đĩa cục bộ hỏng khi chạy nhiều bản sao server?

---

**Buổi trước:** [Buổi 16 — Authorization & RBAC](./buoi-16-rbac.md)
**Buổi tiếp theo:** Buổi 18 — Logging, error handling & khởi động Project 2
