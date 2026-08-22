# Buổi 17 — File upload & Testing

Giáo án: [`giao-an/phase-2/buoi-17-upload-testing.md`](../../giao-an/phase-2/buoi-17-upload-testing.md)

Không cần Docker.

```bash
npm install
cp .env.example .env
npm start
npm test          # 38 test
npm run coverage
```

## Ba lỗ hổng upload — đều có test canh giữ

### 1. Tin vào kiểu MIME do client khai

```js
// Kẻ tấn công: file .exe, đặt tên .jpg, khai Content-Type: image/jpeg
.attach('anh', fileExe, { filename: 'anh.jpg', contentType: 'image/jpeg' })
// → 400 BỊ CHẶN
```

Cách chặn duy nhất đáng tin: **đọc magic bytes**.

```js
{ loai: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] }
{ loai: 'image/png',  bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }
```

WEBP cần khớp **hai vị trí** (`RIFF` ở byte 0, `WEBP` ở byte 8) — vì `.wav` cũng bắt đầu bằng `RIFF`.

### 2. Path traversal qua tên file

```js
.attach('anh', anh, '../../../../etc/passwd.jpg')
```

Ba lớp phòng thủ:

1. **Không dùng lại tên client gửi** — tự sinh `${Date.now()}-${randomUUID()}${duoi}`
2. Tên gốc chỉ lưu làm metadata, đã qua `basename()` + lọc ký tự
3. Kiểm tra lại đường dẫn cuối vẫn nằm trong thư mục lưu

Và **endpoint xoá cũng phải chặn** — `DELETE /upload/anh/../../.env` xoá mất file cấu hình.

### 3. File độc hại được phục vụ lại (XSS lưu trữ)

File `.html`/`.svg` chứa `<script>` phục vụ từ **cùng domain** → script chạy với đầy đủ quyền của trang, đọc được cookie.

| Biện pháp | Tác dụng |
|---|---|
| Danh sách trắng định dạng | chặn từ đầu |
| Lưu ngoài web root | không truy cập trực tiếp |
| Phục vụ từ domain khác (CDN) | script không đọc được cookie |
| `Content-Disposition: attachment` | tải về thay vì hiển thị |

## Kim tự tháp test

| File | Loại | Cần gì | Số test |
|---|---|---|---|
| `kiem-tra-file.test.js` | Unit — hàm thuần | **không gì cả** | 22 |
| `upload.test.js` | Integration — HTTP thật | app + thư mục tạm | 16 |

```
# tests 38   # pass 38   # duration_ms 393
```

**Unit test bắt trường hợp biên** (6 dòng thay vì 6 HTTP request):

```js
const truongHop = [
  ['../../../etc/passwd', 'passwd'],
  ['..', 'khong-ten'],
  [undefined, 'khong-ten'],
];
```

**Integration test bắt lỗi phối hợp**: middleware sai thứ tự, mã lỗi multer không ánh xạ đúng, route đăng ký nhầm.

## Coverage

```
lib/kiem-tra-file.js   | 100.00 | 100.00 | 100.00 |
upload/upload.routes.js|  94.66 |  80.00 | 100.00 | 61-62 105-106 121
app.js                 |  95.00 |  71.43 |  50.00 | 14 34
```

> ⚠️ **Coverage cao không có nghĩa là code đúng.** Nó chỉ nói "dòng này đã chạy qua", không nói "hành vi đã được kiểm chứng" — có thể đạt 100% mà không có một `assert` nào.
>
> Cột **branch %** thấp hơn line % chỉ ra các nhánh `if` chưa được test — thường là nhánh xử lý lỗi. Đó là chỗ đáng viết thêm.

## memoryStorage hay diskStorage?

`diskStorage` ghi file xuống đĩa **ngay khi nhận**, trước khi kịp kiểm tra → file độc hại đã nằm trên máy chủ rồi mới bị từ chối.

`memoryStorage` giữ trong RAM để kiểm tra trước. Đánh đổi: tốn RAM — với file lớn phải dùng thư mục tạm ngoài web root hoặc stream thẳng lên S3.
