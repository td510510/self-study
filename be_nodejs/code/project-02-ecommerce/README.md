# Project 2 — E-commerce mini API

Sản phẩm của **Phase 2**. Khung ứng dụng được dựng ở buổi 18, hoàn thiện dần qua Phase 3.

Giáo án: [`giao-an/phase-2/buoi-18-logging-project2.md`](../../giao-an/phase-2/buoi-18-logging-project2.md)

---

## Chạy

```bash
docker compose up -d          # Postgres :5436
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma generate
npm run seed

npm run dev                   # log màu, dễ đọc
npm start                     # log JSON
npm test                      # 27 test — chạy trên database RIÊNG, tuần tự
```

Tài khoản mẫu (mật khẩu đều là `matkhau-du-dai`):

| Vai trò | Email |
|---|---|
| `admin` | admin@shop.com |
| `nhanVien` | nhanvien@shop.com |
| `khach` | khach@shop.com |

### Database test riêng

```bash
docker exec shop-postgres psql -U shop -d shop_db -c "CREATE DATABASE shop_test;"
DATABASE_URL="postgresql://shop:matkhau_hoc_tap@localhost:5436/shop_test?schema=public" npx prisma migrate deploy
```

> ⚠️ Test gọi `deleteMany()` — chạy nhầm trên database phát triển là **mất sạch** dữ liệu.
> `.env.test` cũng đặt `BCRYPT_COST=4` để test chạy nhanh gấp 256 lần ở khâu băm.

---

## Cấu trúc — chia theo NGHIỆP VỤ, không theo loại file

```
src/
├── server.js              ← khởi động, graceful shutdown, lưới an toàn
├── app.js                 ← ráp middleware + router
├── lib/
│   ├── logger.js          ← pino + che dữ liệu nhạy cảm
│   ├── errors.js          ← phân loại lỗi + mã lỗi ổn định
│   ├── xu-ly-loi.js       ← error middleware tập trung
│   ├── quyen.js           ← bảng quyền RBAC
│   ├── validate.js        ← middleware zod
│   └── prisma.js
└── modules/
    ├── auth/              ← tái sử dụng từ buổi 15–16
    ├── sanpham/
    ├── giohang/
    └── donhang/           ← 3 phiên bản đặt hàng để so sánh (buổi 19)
```

Sửa tính năng giỏ hàng → mọi thứ cần sửa nằm **trong một thư mục**. Đây cũng là cách NestJS tổ chức module ở Phase 4.

---

## Bốn quyết định thiết kế schema

### 1. Tiền là `Int`, không bao giờ `Float`

```prisma
giaVND Int   // đơn vị: đồng
```

```js
0.1 + 0.2 === 0.3   // false → 0.30000000000000004
```

Số thực nhị phân không biểu diễn chính xác được `0.1`. Cộng dồn nhiều lần → **sai lệch tiền thật**. Với USD thì lưu **cent**.

### 2. Đơn hàng CHÉP LẠI dữ liệu, không tham chiếu

```prisma
model DonHangItem {
  sanPhamId  Int
  tenSanPham String   // ← chép lại
  giaVND     Int      // ← chép lại
}
```

Giá thay đổi theo thời gian. Join sang bảng sản phẩm để lấy giá → đơn hàng năm ngoái hiển thị giá hôm nay: **sai lịch sử, sai kế toán**.

Đây là ngoại lệ có chủ đích với nguyên tắc chuẩn hoá — vì đơn hàng ghi lại một **sự kiện đã xảy ra**, không phải trạng thái hiện tại.

### 3. `onDelete` — mỗi quan hệ một quyết định nghiệp vụ

```prisma
GioHangItem → GioHang  : onDelete: Cascade    ✅ xoá giỏ thì xoá item
DonHangItem → SanPham  : (mặc định Restrict)  ✅ KHÔNG cho xoá lịch sử đơn
```

Vì database từ chối xoá sản phẩm còn trong đơn → phải dùng **xoá mềm** (`conBan: false`).

### 4. Mã đơn tách khỏi id tự tăng

```prisma
maDon String @unique    // DH-20260821-A7K2M
```

id tự tăng lộ số đơn hàng cho đối thủ, và khiến khách đoán được đơn của người khác (IDOR).

---

## Logging — che dữ liệu nhạy cảm

```js
redact: {
  paths: ['req.headers.authorization', 'matKhau', 'accessToken', '*.matKhau', ...],
  censor: '[ĐÃ CHE]',
}
```

Kiểm chứng thật:

```bash
grep -c "matkhau-du-dai" shop.log     # → 0  ✅
grep -c "$TOKEN" shop.log             # → 0  ✅
```

> Log lộ mật khẩu nghiêm trọng hơn database bị lộ — vì log được gửi sang dịch vụ bên thứ ba, sao lưu nhiều nơi, và **nhiều người xem hơn database rất nhiều**.

**Mức log phụ thuộc status code:**

```
2xx  → info
4xx  → warn     ← client gửi sai là chuyện BÌNH THƯỜNG
5xx  → error    ← BUG của ta, cần cảnh báo
/health → debug ← gọi liên tục, đừng làm ngập log
```

Log mọi thứ ở mức `error` → cảnh báo kêu suốt ngày → đến lúc có bug thật không ai để ý.

**Dev vs production:**

```
dev:  [16:58:52] INFO: POST /dang-nhap → 200
prod: {"level":"warn","time":"...","req":{...},"ma":"DU_LIEU_SAI","msg":"..."}
```

---

## Phân loại lỗi

| | Lỗi **vận hành** | Lỗi **lập trình** |
|---|---|---|
| Ví dụ | dữ liệu sai, hết hàng | quên `await`, gọi trên `undefined` |
| Trả client | thông điệp rõ ràng | `500` chung chung |
| Mức log | `warn` | `error` + cảnh báo |

Mọi response lỗi có **mã ổn định** + `requestId`:

```json
{ "loi": "Không đủ quyền thực hiện: sanpham:tao",
  "ma": "KHONG_DU_QUYEN",
  "requestId": "4bf58c9a-8351-409f-a006-48a14903b91f" }
```

- Frontend so khớp **`ma`**, không so khớp chuỗi tiếng Việt (sẽ vỡ khi ta sửa câu chữ, và phải dịch khi đa ngôn ngữ)
- `requestId` dung hoà **bảo mật** (không lộ stack trace) và **hỗ trợ** (tra được log)

---

## API hiện có

| Method | Đường dẫn | Quyền |
|---|---|---|
| `GET` | `/health` | công khai |
| `POST` | `/auth/dang-ky` · `/auth/dang-nhap` · `/auth/lam-moi` · `/auth/dang-xuat` | công khai |
| `GET` | `/auth/toi` | đăng nhập |
| `GET` | `/san-pham` · `/san-pham/:id` | **công khai** |
| `POST` | `/san-pham` | `admin` |
| `PATCH` | `/san-pham/:id` | `nhanVien`, `admin` |
| `DELETE` | `/san-pham/:id` | `admin` (xoá mềm) |
| `GET` | `/gio-hang` | đăng nhập |
| `POST` | `/gio-hang/items` | đăng nhập |
| `PATCH` `DELETE` | `/gio-hang/items/:sanPhamId` | đăng nhập |
| `GET` | `/don-hang` · `/don-hang/:id` | đăng nhập (khách chỉ thấy đơn mình) |
| `POST` | `/don-hang` | đăng nhập — transaction + khoá dòng |

Lọc sản phẩm: `?danhMuc=` `?tuKhoa=` `?giaTu=` `?giaDen=` `?conHang=` `?sapXep=moi-nhat|gia-tang|gia-giam|ten` `?trang=` `?moiTrang=`

---

## Buổi 19 — Tranh chấp & Index

```bash
node --env-file=.env src/demo-tranh-chap.js   # tự tạo ra tồn kho âm
node --env-file=.env src/demo-index.js        # đo index trên 200.000 dòng
```

**10 người cùng lúc mua sản phẩm còn 5 cái:**

```
  phiên bản                        | bán được | tồn kho | kết quả
  ---------------------------------|----------|---------|--------
  1. không transaction             |       10 |      -5 | 🚨 SAI
  2. transaction, không khoá       |       10 |      -5 | 🚨 SAI
  3. transaction + FOR UPDATE      |        5 |       0 | ✅
```

> Phiên bản 2 là cú sốc: **bọc transaction KHÔNG đủ**. Transaction đảm bảo tính nguyên tử, không ngăn hai transaction cùng đọc một giá trị cũ.

**Index trên 200.000 dòng:**

```
WHERE "diaChiGiao" = ... (khớp 1 dòng)   9.572 ms → 0.031 ms   308× nhanh hơn
ORDER BY "tongTienVND" DESC LIMIT 20    14.110 ms → 0.074 ms   190× nhanh hơn

Cái giá: ghi 5.000 dòng  652 ms → 817 ms  (chậm hơn ~25%)
```

Và một điểm tinh tế: với `WHERE tongTienVND > 4000000 LIMIT 100`, Postgres **cố tình không dùng index** — vì truy vấn khớp ~20% số dòng, quét tuần tự còn nhanh hơn. Index chỉ có lợi khi truy vấn **chọn lọc cao**.

### ⚠️ Test đụng database phải chạy tuần tự

```
node --test              → # pass 8   # cancelled 19   🚨
node --test --test-concurrency=1  → # pass 27  ✅
```

Node chạy các file test **song song**. Hai file cùng `deleteMany()` trên cùng database → xoá dữ liệu của nhau.

## Buổi 20 — Pool & phân trang

```bash
node --env-file=.env src/demo-pool.js
node --env-file=.env src/demo-phan-trang.js   # cần chạy demo-index.js trước
```

**Kích thước pool** — 60 truy vấn song song, mỗi cái giữ kết nối 100ms:

```
pool =   1 kết nối    8650 ms
pool =   5 kết nối    1203 ms
pool =  10 kết nối     603 ms
pool =  20 kết nối     339 ms
pool = 120 kết nối    🚨 too many clients already  ← trần max_connections
```

**Mở kết nối mới mỗi lần** (20 lần): `254 ms` vs dùng chung `10 ms` → **chậm gấp 25 lần**.

**Khi pool cạn:** pool 2 kết nối bị transaction giữ 2 giây → một `SELECT 1` phải chờ **1655 ms**.

> Đây là lý do transaction dài nguy hiểm: nó làm tắc nghẽn **mọi request khác**, kể cả những request không liên quan. Và tuyệt đối không gọi API bên ngoài trong transaction.

**Phân trang** trên 240.000 dòng:

```
        | trang 1  | trang 10.000 | chậm đi
--------|----------|--------------|--------
OFFSET  |  1.54 ms |     10.05 ms |  6.5×
CURSOR  |  0.99 ms |      0.97 ms |  không đổi
```

Offset còn **cho kết quả sai** khi dữ liệu đổi giữa các trang: xoá một bản ghi ở trang 1 → bản ghi thứ 21 dịch lên vị trí 20 → **người dùng không bao giờ thấy nó**.

## Còn phải làm (Phase 3)

- [x] Module giỏ hàng
- [x] Đặt hàng an toàn với transaction + khoá dòng
- [x] Sinh mã đơn `DH-20260821-A7K2M`
- [ ] Chuyển trạng thái đơn có kiểm soát
- [ ] Redis cache, rate limit dùng chung nhiều tiến trình
- [ ] Docker hoá toàn bộ
