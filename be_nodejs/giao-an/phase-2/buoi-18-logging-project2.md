# Buổi 18 — Logging, error handling & khởi động Project 2

> **Phase 2** · Express.js — **buổi tổng kết**
> **Mục tiêu:** Hoàn thiện các mối nối cuối cùng của một API sẵn sàng thực chiến, và chính thức bắt đầu Project 2.
> **Code thực hành:** [`code/project-02-ecommerce/`](../../code/project-02-ecommerce/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 17 |
| 15–70′ | **Structured logging với pino** |
| 70–105′ | **Phân loại lỗi: vận hành vs lập trình** |
| 105–160′ | **Thiết kế schema E-commerce** |
| 160–175′ | Dựng khung Project 2, tiêu chí đánh giá |
| 175–180′ | Tổng kết Phase 2 |

---

## 1. Structured logging (15–70′)

[`src/lib/logger.js`](../../code/project-02-ecommerce/src/lib/logger.js)

### 1.1. Ba lý do bỏ `console.log`

> **📝 Ghi chú giảng viên — mở đầu bằng câu hỏi**
> *"`console.log` có gì sai?"* Học viên frontend đã dùng nó cả đời và chưa từng gặp vấn đề.

| Lý do | Giải thích |
|---|---|
| **Máy đọc log, không phải người** | `console.log('user 5 mua 3 món')` → máy không hiểu gì.<br>`log.info({ userId: 5, soMon: 3 }, 'mua hàng')` → truy vấn được, thống kê được |
| **`console.log` chặn Event Loop** | Khi stdout là file hoặc pipe (tức là ở production), `console.log` ghi **đồng bộ**. Nhớ buổi 02: ghi đồng bộ chặn luồng. **Log nhiều = server chậm.** |
| **Không có mức log** | Không tắt bớt được khi cần, không lọc được khi điều tra |

### 1.2. Che dữ liệu nhạy cảm — phần quan trọng nhất

```js
const TRUONG_CHE = [
  'req.headers.authorization',
  'req.headers.cookie',
  'matKhau', 'matKhauHash', 'password',
  'accessToken', 'refreshToken', 'token',
  '*.matKhau', '*.accessToken',   // ← khớp ở mọi cấp lồng nhau
];

pino({ redact: { paths: TRUONG_CHE, censor: '[ĐÃ CHE]' } });
```

> **⚠️ Vì sao đây là phần quan trọng nhất?**
>
> Log lộ mật khẩu là sự cố bảo mật **nghiêm trọng hơn** người ta tưởng — vì log:
> - được gửi sang **dịch vụ bên thứ ba** (Datadog, Sentry)
> - được **sao lưu** nhiều nơi
> - cho **nhiều người xem** hơn database rất nhiều (cả team dev, DevOps, support)
>
> Database thì được canh giữ cẩn thận. Log thì thường không.

**Kiểm chứng thật tại lớp:**

```bash
curl -X POST localhost:3000/auth/dang-nhap -d '{"matKhau":"matkhau-du-dai",...}'

grep -c "matkhau-du-dai" shop.log     # → 0  ✅
grep -c "$TOKEN" shop.log             # → 0  ✅
```

> **Nguyên tắc: danh sách đen không bao giờ đủ.** Luôn tự hỏi *"còn chỗ nào dữ liệu nhạy cảm có thể lọt vào log?"* — ví dụ: số thẻ trong body đơn hàng, số CMND trong hồ sơ.

### 1.3. Mức log phụ thuộc status code

```js
customLogLevel(req, res, err) {
  if (err || res.statusCode >= 500) return 'error';   // BUG của ta
  if (res.statusCode >= 400) return 'warn';           // client gửi sai — bình thường
  if (req.url === '/health') return 'debug';          // gọi liên tục, đừng làm ngập log
  return 'info';
}
```

> **⚠️ Log mọi thứ ở mức `error` thì cảnh báo mất hết ý nghĩa.**
>
> Nếu hệ thống cảnh báo kêu 500 lần/ngày vì lỗi `400` bình thường, thì đến lúc có bug thật, **không ai còn để ý nữa**. Đây là hiện tượng *alert fatigue*.

Kết quả thật:

```
INFO: POST /dang-nhap → 200
WARN: Lỗi vận hành: Không đủ quyền thực hiện: sanpham:tao
WARN: POST /san-pham → 403
```

### 1.4. Dev đọc được, production máy đọc được

```js
...(pretty && {
  transport: { target: 'pino-pretty', options: { colorize: true } },
})
```

Ở dev — người đọc:

```
[16:58:52] INFO: POST /dang-nhap → 200
```

Ở production — máy đọc:

```json
{"level":"warn","time":"2026-08-21T16:59:08.472Z","req":{"method":"GET","url":"/san-pham?trang=0","ip":"::1"},"ma":"DU_LIEU_SAI","status":400,"msg":"Lỗi vận hành: Dữ liệu không hợp lệ"}
```

> **⚠️ `pino-pretty` CHỈ dùng ở dev.** Nó tốn CPU để tô màu và định dạng. Ở production phải là JSON thuần.

---

## 2. Phân loại lỗi (70–105′)

[`src/lib/errors.js`](../../code/project-02-ecommerce/src/lib/errors.js)

Đây là **phân biệt quan trọng nhất** trong xử lý lỗi backend:

| | Lỗi **vận hành** (operational) | Lỗi **lập trình** (programmer) |
|---|---|---|
| Bản chất | chuyện bình thường, đã lường trước | **BUG** |
| Ví dụ | dữ liệu sai, không tìm thấy, hết hàng | gọi hàm trên `undefined`, quên `await` |
| Xử lý được? | ✅ | ❌ |
| Trả client | thông điệp rõ ràng | `500` chung chung |
| Mức log | `warn` | `error` + cảnh báo |
| Có đánh thức người trực? | không | **có** |

```js
export class HttpError extends Error {
  constructor(statusCode, message, { cause, chiTiet, ma } = {}) {
    ...
    this.laLoiVanHanh = true;   // ← đánh dấu "đã lường trước"
    this.ma = ma;
  }
}
```

### 2.1. Mã lỗi ổn định — chi tiết nhỏ, giá trị lớn

```js
loi.khongDuQuyen()  →  { loi: 'Không đủ quyền', ma: 'KHONG_DU_QUYEN' }
```

Test canh giữ:

```js
test('404 kèm mã lỗi ổn định', async () => {
  assert.equal(r.body.ma, 'KHONG_TIM_THAY',
    'frontend so khớp MÃ, không so khớp chuỗi tiếng Việt');
});
```

> **Vì sao?** Nếu frontend viết `if (res.data.loi === 'Không đủ quyền')`, thì ngày ta sửa câu chữ cho hay hơn là **frontend vỡ**. Mã lỗi là **hợp đồng**; thông điệp là **giao diện**.
>
> Và khi làm đa ngôn ngữ, thông điệp phải dịch — mã thì không.

### 2.2. `requestId` — cầu nối giữa bảo mật và hỗ trợ

```js
res.status(500).json({
  loi: 'Lỗi máy chủ nội bộ',    // ← không lộ gì
  ma: 'LOI_MAY_CHU',
  requestId: req.id,             // ← nhưng vẫn tra được
});
```

> Đây là cách dung hoà hai yêu cầu mâu thuẫn:
> - **Bảo mật**: không lộ stack trace, tên bảng, phiên bản thư viện
> - **Hỗ trợ**: phải điều tra được khi khách báo lỗi
>
> Người dùng đọc cho ta mã `4bf58c9a-...`, ta `grep` log ra **toàn bộ** ngữ cảnh.

### 2.3. Ánh xạ lỗi Prisma

```js
const daChuyen = err.code?.startsWith?.('P2') ? tuLoiPrisma(err) : null;
```

```js
case 'P2002': {
  // Prisma 7 + driver adapter: tên cột nằm sâu, KHÔNG ở err.meta.target
  const cot = err.meta?.driverAdapterError?.cause?.constraint?.fields ?? err.meta?.target;
  return new HttpError(409, `Giá trị đã tồn tại: ${cot}`, { ma: 'TRUNG_DU_LIEU' });
}
```

> Nhắc lại bài học buổi 13, giờ được đóng gói lại thành hàm dùng chung. Có test:
> ```js
> test('slug trùng → 409 với mã TRUNG_DU_LIEU', ...)
> ```

---

## 3. Trọng tâm: thiết kế schema E-commerce (105–160′)

[`prisma/schema.prisma`](../../code/project-02-ecommerce/prisma/schema.prisma)

> **📝 Ghi chú giảng viên**
> **Thiết kế schema là quyết định khó sửa nhất của dự án.** Sửa code thì dễ; sửa cấu trúc database khi đã có 100.000 đơn hàng thì rất khó.
>
> Dành đủ thời gian cho phần này. Vẽ sơ đồ quan hệ lên bảng **trước** khi mở file.

### 3.1. Tiền — không bao giờ dùng `Float`

```prisma
/// ⚠️ TIỀN LƯU BẰNG SỐ NGUYÊN — ĐƠN VỊ NHỎ NHẤT (đồng).
giaVND Int
```

Chứng minh ngay tại lớp:

```js
0.1 + 0.2 === 0.3          // false
0.1 + 0.2                  // 0.30000000000000004
```

> Số thực nhị phân **không biểu diễn chính xác** được 0.1. Cộng dồn nhiều lần sẽ lệch — và với đơn hàng, đó là **sai lệch tiền thật**.
>
> Hai lựa chọn đúng: `Int` (đơn vị nhỏ nhất) hoặc `Decimal`. Ở đây dùng `Int` vì VND không có đơn vị nhỏ hơn đồng. Với USD thì lưu **cent**.

Có test canh giữ:

```js
test('giá là số thực → 400 (tiền phải là số nguyên)', async () => {
  await nhu(admin).post('/san-pham').send({ giaVND: 99.5, ... }).expect(400);
});
```

### 3.2. Đơn hàng phải CHÉP LẠI dữ liệu, không tham chiếu

```prisma
model DonHangItem {
  sanPhamId Int
  sanPham   SanPham @relation(...)

  /// CHÉP LẠI tên và giá tại thời điểm mua — ảnh chụp lịch sử
  tenSanPham String
  giaVND     Int
  soLuong    Int
}
```

> Hỏi lớp: *"Sao không join sang bảng sản phẩm để lấy giá?"*
>
> → Vì **giá thay đổi theo thời gian**. Nếu tính lại, đơn hàng năm ngoái sẽ hiển thị theo giá hôm nay — **sai lịch sử, sai kế toán**, và khách hàng có quyền khiếu nại.
>
> Đây là ngoại lệ có chủ đích với nguyên tắc chuẩn hoá đã học ở buổi 14. Nhân bản dữ liệu ở đây **là đúng**, vì nó ghi lại một **sự kiện đã xảy ra**, không phải trạng thái hiện tại.

Tương tự với `tongTienVND`, `diaChiGiao`, `soDienThoai` — tất cả đều chụp lại tại thời điểm đặt.

### 3.3. `onDelete` — mỗi quan hệ một quyết định

```prisma
model GioHangItem {
  gioHang GioHang @relation(..., onDelete: Cascade)   // ✅ xoá giỏ thì xoá item
}

model DonHangItem {
  /// KHÔNG Cascade! Xoá sản phẩm KHÔNG được phép xoá lịch sử đơn hàng.
  /// Mặc định Prisma là Restrict — database TỪ CHỐI xoá sản phẩm còn trong đơn.
  sanPham SanPham @relation(fields: [sanPhamId], references: [id])
}
```

> **Cùng một dự án, hai quan hệ, hai quyết định ngược nhau.** Đây là câu hỏi **nghiệp vụ**, không phải kỹ thuật.

Và vì database từ chối xoá, ta phải dùng **xoá mềm**:

```js
// XOÁ MỀM: sản phẩm còn nằm trong đơn hàng cũ
return prisma.sanPham.update({ where: { id }, data: { conBan: false } });
```

Test chứng minh:

```js
test('xoá là XOÁ MỀM — biến khỏi danh sách nhưng còn trong DB', async () => {
  await nhu(admin).delete(`/san-pham/${id}`).expect(204);
  await request(app).get(`/san-pham/${id}`).expect(404);

  const conTrongDb = await prisma.sanPham.findUnique({ where: { id } });
  assert.ok(conTrongDb, 'bản ghi VẪN CÒN trong database');
  assert.equal(conTrongDb.conBan, false);
});
```

### 3.4. `@unique` tạo quan hệ 1-1

```prisma
model GioHang {
  userId Int @unique     // ← @unique biến 1-n thành 1-1
  user   User @relation(...)
}
```

> Không có `@unique` thì user có **nhiều giỏ hàng** — sai nghiệp vụ, và code sẽ phải xử lý câu hỏi vô nghĩa *"lấy giỏ nào?"*.

Và ràng buộc kép:

```prisma
/// Một sản phẩm chỉ xuất hiện MỘT LẦN trong một giỏ.
@@unique([gioHangId, sanPhamId])
```

> Ràng buộc này ở **tầng database** nên code không thể phá vỡ — kể cả khi có bug hay hai request chạy đồng thời. Nhớ bài học buổi 14: ràng buộc trong database mới là thứ không ai lách được.

### 3.5. Mã đơn tách khỏi id tự tăng

```prisma
/// Mã đơn hiển thị cho khách. Tách khỏi id tự tăng vì:
///   - id tự tăng LỘ số đơn hàng của shop cho đối thủ
///   - id tự tăng khiến khách đoán được đơn của người khác (IDOR, buổi 16)
maDon String @unique
```

> Đặt hai đơn cách nhau một tuần, trừ hai id, biết ngay shop bán được bao nhiêu đơn trong tuần. Đây gọi là *German tank problem*.

---

## 4. Dựng khung Project 2 (160–175′)

### 4.1. Cấu trúc theo module nghiệp vụ

```
src/
├── server.js              ← khởi động, graceful shutdown, lưới an toàn
├── app.js                 ← ráp middleware + router
├── lib/                   ← dùng chung
│   ├── logger.js          ← pino + che dữ liệu nhạy cảm
│   ├── errors.js          ← phân loại lỗi + mã lỗi
│   ├── xu-ly-loi.js       ← error middleware tập trung
│   ├── quyen.js           ← bảng quyền (buổi 16)
│   ├── validate.js        ← middleware zod (buổi 11)
│   └── prisma.js
└── modules/
    ├── auth/              ← tái sử dụng từ buổi 15-16
    │   ├── auth.routes.js · auth.service.js · auth.schema.js
    │   ├── auth.middleware.js · mat-khau.js · token.js
    └── sanpham/
        ├── sanpham.routes.js · sanpham.service.js · sanpham.schema.js
```

> **Chia theo NGHIỆP VỤ, không chia theo LOẠI FILE.**
>
> Không phải `controllers/`, `services/`, `routes/` — mà `auth/`, `sanpham/`, `donhang/`. Lý do: khi sửa tính năng giỏ hàng, mọi thứ cần sửa nằm **trong một thư mục**.
>
> Đây chính là cách NestJS tổ chức module ở Phase 4.

### 4.2. Database test riêng

```json
"test": "node --env-file=.env.test --test"
```

```bash
docker exec shop-postgres psql -U shop -d shop_db -c "CREATE DATABASE shop_test;"
DATABASE_URL="...shop_test..." npx prisma migrate deploy
```

Và `.env.test` có `BCRYPT_COST=4` thay vì 12 — test chạy nhanh gấp **256 lần** ở khâu băm mật khẩu, mà vẫn kiểm chứng đúng logic.

> **⚠️ Test KHÔNG BAO GIỜ được chạy trên database phát triển.** Test `deleteMany()` là mất sạch dữ liệu bạn đang làm dở.

### 4.3. Seed phải chạy lại được

```js
await prisma.danhMuc.upsert({ where: { slug }, update: {...}, create: {...} });
```

Kiểm chứng: chạy `npm run seed` hai lần → vẫn 8 sản phẩm, không nhân đôi.

---

## 5. Tiêu chí đánh giá Project 2

| Tiêu chí | Điểm |
|---|---|
| Schema thiết kế đúng (tiền `Int`, chép lịch sử, `onDelete` hợp lý) | 20 |
| Auth + RBAC đầy đủ, không lộ hash/token | 20 |
| Giỏ hàng & đơn hàng hoạt động đúng nghiệp vụ | 20 |
| Validate đầu vào ở mọi endpoint, mã lỗi ổn định | 15 |
| Logging có cấu trúc, che dữ liệu nhạy cảm | 10 |
| Test ≥ 40 test, có database test riêng | 10 |
| README + seed chạy được ngay | 5 |

**Điểm trừ:**

| Lỗi | Trừ |
|---|---|
| Dùng `Float` cho tiền | −20 |
| Lộ mật khẩu/token trong log hoặc response | −20 |
| Thiếu kiểm tra chủ sở hữu (IDOR) | −15 |
| Test chạy trên database phát triển | −10 |
| Dùng `console.log` thay logger | −5 |

---

## 6. Bài tập về nhà (làm dần trong Phase 3)

1. **Module giỏ hàng.** `POST /gio-hang/items`, `PATCH .../items/:id`, `DELETE .../items/:id`, `GET /gio-hang`. Nhớ ràng buộc `@@unique([gioHangId, sanPhamId])` — thêm sản phẩm đã có thì **tăng số lượng**, không tạo dòng mới.

2. **Đặt hàng.** `POST /don-hang` từ giỏ hàng: kiểm tra tồn kho, trừ kho, tạo đơn, xoá giỏ.
   → **Cố tình chưa dùng transaction.** Buổi 19 sẽ chỉ ra chuyện gì xảy ra khi hai người mua cùng lúc.

3. **Sinh mã đơn.** Định dạng `DH-20260821-A7K2M`. Vì sao không dùng `id`?

4. **Trạng thái đơn.** `PATCH /don-hang/:id/trang-thai` cho nhân viên. Chỉ cho phép chuyển trạng thái hợp lệ (`choXacNhan → daXacNhan → dangGiao → daGiao`), không nhảy cóc.

5. **Che thêm trường.** Thêm `soThe`, `cvv`, `soCMND` vào danh sách che của logger. Viết test chứng minh chúng không lọt vào log.

6. **Kiểm toán log.** Gửi 10 request đủ loại (thành công, 400, 403, 500), rồi `grep` log tìm mọi chuỗi nhạy cảm. Lập báo cáo.

---

## 7. Checklist kết thúc buổi

- [ ] Ba lý do không dùng `console.log` ở production?
- [ ] Vì sao lộ dữ liệu nhạy cảm trong log nguy hiểm hơn trong database?
- [ ] Vì sao lỗi `4xx` log ở mức `warn` chứ không `error`?
- [ ] Lỗi vận hành và lỗi lập trình khác nhau thế nào? Xử lý khác nhau ra sao?
- [ ] Vì sao response lỗi cần `ma` chứ không chỉ `loi`?
- [ ] `requestId` giải quyết mâu thuẫn nào?
- [ ] Vì sao tiền không được lưu bằng `Float`?
- [ ] Vì sao `DonHangItem` phải chép lại tên và giá sản phẩm?
- [ ] Vì sao `GioHangItem` dùng `Cascade` còn `DonHangItem` thì không?
- [ ] Vì sao mã đơn hàng phải tách khỏi id tự tăng?

---

## 🎓 Kết thúc Phase 2

Học viên giờ đã có:

- API Express với middleware chain, validation zod, xử lý lỗi tập trung
- PostgreSQL + Prisma: schema, migration, quan hệ, tránh N+1
- Hiểu khi nào chọn SQL, khi nào chọn NoSQL
- Authentication JWT với refresh token rotation, chống 4 lỗ hổng phổ biến
- Authorization RBAC + theo chủ sở hữu, chống IDOR
- Upload file an toàn, kiểm tra magic bytes
- Logging có cấu trúc, che dữ liệu nhạy cảm
- Khung Project 2 chạy được với 19 test

**Phase 3 bắt đầu:** những thứ phân biệt "biết CRUD" với "dev backend thực thụ" — transaction, index, cache, bảo mật, queue, Docker.

Và câu hỏi mở đầu buổi 19 đã được gieo sẵn ở bài tập số 2:

> *"Hai người cùng mua sản phẩm cuối cùng trong kho. Chuyện gì xảy ra?"*

---

**Buổi trước:** [Buổi 17 — File upload & Testing](./buoi-17-upload-testing.md)
**Buổi tiếp theo:** Buổi 19 — Transaction, index & vấn đề tranh chấp *(Phase 3)*
