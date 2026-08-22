# Buổi 21 — Redis: cache-aside, rate limit & session store

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Thêm tầng cache đầu tiên vào hệ thống — kỹ năng bắt buộc khi traffic tăng, và hiểu rõ **cái giá** phải trả.
> **Code thực hành:** [`code/project-02-ecommerce/`](../../code/project-02-ecommerce/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 20 |
| 15–35′ | Redis là gì, dựng bằng Docker |
| 35–90′ | **Cache-aside: lợi ích và cái giá** |
| 90–125′ | **Vô hiệu hoá cache & cấu trúc khoá** |
| 125–155′ | Rate limit dùng chung nhiều tiến trình |
| 155–175′ | Khi Redis chết |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Redis là gì (15–35′)

Một kho **key-value nằm trong RAM**. Ba đặc điểm quyết định mọi cách dùng nó:

| Đặc điểm | Hệ quả |
|---|---|
| Dữ liệu trong RAM | cực nhanh, nhưng **dung lượng có hạn** và tốn tiền |
| Đơn luồng | lệnh chạy tuần tự → **một lệnh chậm chặn tất cả** (giống Node, buổi 02) |
| Có TTL sẵn | tự xoá key hết hạn, không cần dọn tay |

```yaml
redis:
  image: redis:7-alpine
  ports: ['6380:6379']
  command: redis-server --appendonly yes
```

> `appendonly yes` ghi ra đĩa để dữ liệu sống sót qua restart. Với cache thuần thì không cần — nhưng rate-limit và session thì nên có.

---

## 2. Trọng tâm: cache-aside (35–90′)

[`src/lib/redis.js`](../../code/project-02-ecommerce/src/lib/redis.js) · [`src/demo-cache.js`](../../code/project-02-ecommerce/src/demo-cache.js)

### 2.1. Mẫu cache-aside

```
1. Đọc cache. Có → trả về ngay          (cache HIT)
2. Không có → hỏi database              (cache MISS)
3. Ghi vào cache kèm TTL
4. Trả về
```

```js
export async function cacheAside(khoa, ttlGiay, layDuLieuThat) {
  try {
    const daCache = await redis.get(khoa);
    if (daCache !== null) return { duLieu: JSON.parse(daCache), tuCache: true };
  } catch (err) {
    console.error('[cache] đọc lỗi, bỏ qua cache:', err.message);   // ← không ném lỗi
  }

  const duLieu = await layDuLieuThat();

  try {
    await redis.set(khoa, JSON.stringify(duLieu), 'EX', ttlGiay);   // ← LUÔN có TTL
  } catch (err) { /* bỏ qua */ }

  return { duLieu, tuCache: false };
}
```

### 2.2. Kết quả đo thật

240.000 dòng, truy vấn `count + groupBy + aggregate`:

```
  Lần 1 (cache MISS)     41.01 ms   tuCache=false
  Lần 2 (cache HIT)       0.64 ms   tuCache=true
  Lần 3 (cache HIT)       0.73 ms   tuCache=true
  Lần 4 (cache HIT)       0.76 ms   tuCache=true

  → HIT nhanh gấp 58 lần so với MISS
```

> Và quan trọng hơn con số: mỗi lần HIT là **một truy vấn database không phải chạy**. Với 1000 request/phút, database chỉ phải làm việc 1 lần thay vì 1000 lần.

### 2.3. Cái giá — dữ liệu cũ

```
  Trước khi thêm đơn : 240.000
  Cache vẫn trả về   : 240.000  ← CŨ
  Số thật trong DB   : 240.001
```

> **📝 Ghi chú giảng viên**
> Đây là phần học viên hay bỏ qua khi hào hứng với tốc độ. Hãy dừng lại và nhấn mạnh:
>
> **Cache LUÔN đánh đổi tính chính xác lấy tốc độ.** Không có ngoại lệ.
>
> Câu hỏi thiết kế không phải *"có nên cache không?"* mà là:
> ***"Dữ liệu này cũ bao lâu thì chấp nhận được?"***

Bảng để lớp cùng điền:

| Dữ liệu | Cũ bao lâu thì chấp nhận | Cache? |
|---|---|---|
| Danh sách sản phẩm | vài phút | ✅ |
| Số lượng tồn kho | **không được cũ** | ❌ |
| Số dư tài khoản | **không được cũ** | ❌ |
| Bài viết blog | vài giờ | ✅ |
| Kết quả tìm kiếm | vài phút | ✅ |
| Giỏ hàng của tôi | không được cũ | ❌ |

### 2.4. TTL là bắt buộc

```js
await redis.set(khoa, giaTri, 'EX', ttlGiay);
//                              ^^^^ KHÔNG BAO GIỜ bỏ
```

> Không có TTL, cache giữ dữ liệu cũ **vĩnh viễn** — và RAM đầy dần cho tới khi Redis từ chối ghi. Lỗi nguy hiểm và rất hay gặp.

---

## 3. Vô hiệu hoá cache & cấu trúc khoá (90–125′)

### 3.1. Hai chiến lược

| Chiến lược | Ưu | Nhược |
|---|---|---|
| **TTL** — để tự hết hạn | đơn giản, không thể quên | dữ liệu cũ tối đa TTL giây |
| **Xoá tay** khi ghi | chính xác ngay | phải nhớ xoá ở **mọi** chỗ ghi — dễ sót |

> Thực tế dùng **cả hai**: xoá tay khi ghi, cộng TTL làm lưới an toàn.

Áp dụng vào Project 2:

```js
export async function tao(nguoiDung, duLieu) {
  const sp = await prisma.sanPham.create({ data: duLieu });
  await xoaCacheSanPham();     // ← xoá ngay khi có thay đổi
  return sp;
}
```

### 3.2. `SCAN` chứ không `KEYS`

```js
const [cursorMoi, khoas] = await redis.scan(cursor, 'MATCH', mau, 'COUNT', 100);
```

> **⚠️ KHÔNG dùng `KEYS` ở production.** Redis đơn luồng — `KEYS *` quét toàn bộ key và **chặn mọi lệnh khác** trong lúc đó. Với vài triệu key là Redis đứng vài giây, kéo theo toàn bộ ứng dụng.
>
> `SCAN` duyệt từng phần, không chặn. Nối lại buổi 02: cùng một bài học về đơn luồng, lần này ở Redis.

### 3.3. Cấu trúc khoá — chỗ dễ sai nhất

```
sanpham:list:danhMuc=phu-kien:sapXep=gia-tang:trang=1   đủ tham số ✅
sanpham:list                                           thiếu tham số 🚨
user:42:donhang                                        có id người dùng ✅
donhang:list                                           thiếu id 🚨
```

```js
function khoaCacheDanhSach(q) {
  const phan = Object.entries(q)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))   // ← sắp xếp: {a,b} và {b,a} cùng một khoá
    .map(([k, v]) => `${k}=${v}`)
    .join(':');
  return `sanpham:list:${phan || 'all'}`;
}
```

> **⚠️ LỖI BẢO MẬT NGHIÊM TRỌNG NHẤT CỦA CACHE**
>
> Quên đưa **id người dùng** vào khoá → cache dữ liệu riêng tư dùng chung → **người A đọc được đơn hàng của người B**.
>
> Đây là sự cố thật đã xảy ra ở nhiều hệ thống lớn. Và nó đặc biệt khó phát hiện vì chỉ xảy ra khi hai người dùng gọi cùng endpoint trong khoảng TTL.

**Quy tắc:** dữ liệu **công khai** (sản phẩm) thì cache chung được. Dữ liệu **riêng tư** (đơn hàng, giỏ hàng) thì hoặc không cache, hoặc khoá **phải** chứa id người dùng.

> **📝 Ghi chú giảng viên**
> Chỉ vào Project 2: `danhSach` sản phẩm **có** cache, `danhSach` đơn hàng **không**. Hỏi lớp vì sao — để họ tự rút ra quy tắc.

---

## 4. Rate limit dùng chung nhiều tiến trình (125–155′)

Nhắc lại buổi 11 — bản dùng `Map` trong RAM:

```js
const kho = new Map();   // ⚠️ mỗi tiến trình một bộ đếm riêng
```

Chạy 4 bản sao server → giới hạn 5 lần/phút thành **20 lần/phút**.

Bản dùng Redis:

```js
export async function demRateLimit(khoa, cuaSoGiay) {
  const kq = await redis
    .multi()
    .incr(khoa)
    .expire(khoa, cuaSoGiay, 'NX')   // NX: chỉ đặt TTL nếu key CHƯA có TTL
    .ttl(khoa)
    .exec();
  ...
}
```

Kết quả:

```
  request 1: đếm=1  ✅ cho qua
  ...
  request 5: đếm=5  ✅ cho qua
  request 6: đếm=6  🚫 CHẶN (thử lại sau 60s)
```

Hai chi tiết đáng dạy:

**(a) `multi()` gộp ba lệnh thành một lượt đi mạng** — và quan trọng hơn, đảm bảo chúng chạy **liền nhau**, không bị request khác chen vào giữa. Nếu tách rời, hai request có thể cùng `INCR` rồi cùng `EXPIRE`, làm reset cửa sổ.

**(b) `expire(..., 'NX')`** — chỉ đặt TTL nếu key **chưa có** TTL. Không có `NX`, mỗi request lại gia hạn cửa sổ → người dùng gọi liên tục sẽ **không bao giờ** được reset.

---

## 5. Khi Redis chết (155–175′)

```
  Redis không truy cập được → ứng dụng ✅ VẪN CHẠY (15ms)
```

```js
try {
  const daCache = await redis.get(khoa);
  ...
} catch (err) {
  console.error('[cache] đọc lỗi, bỏ qua cache:', err.message);
}
// → rơi xuống database
```

> **NGUYÊN TẮC: cache là thứ TĂNG TỐC, không phải thứ BẮT BUỘC.**
>
> Mọi thao tác Redis phải bọc `try/catch` và có đường lui về database. Redis chết thì ứng dụng **chậm**, không được **chết** theo.

Và cả sự kiện lỗi cũng phải bắt:

```js
_redis.on('error', (err) => {
  // KHÔNG ném lỗi ở đây — nếu không, một sự cố Redis sẽ GIẾT TIẾN TRÌNH
  console.error('[redis] lỗi kết nối:', err.message);
});
```

> Nối lại buổi 07: `EventEmitter` phát sự kiện `'error'` mà không có listener → Node ném `uncaughtException` → tiến trình chết.

### Thundering herd — cái bẫy tiếp theo

> Nhưng lưu ý: nếu hệ thống **đang dựa vào cache** để chịu tải, Redis chết đồng nghĩa **toàn bộ tải dồn xuống database cùng lúc** → database sập theo.

Vẽ lên bảng:

```
Bình thường:  1000 req/s → 950 HIT (Redis) + 50 MISS (DB)
Redis chết :  1000 req/s → 1000 xuống DB   → DB quá tải → sập
```

Ba cách giảm nhẹ (giới thiệu, đào sâu ở buổi 44):
1. **Khoá chống dẫm** — chỉ cho **một** request đi hỏi database khi cache miss, các request khác chờ kết quả đó
2. **TTL ngẫu nhiên** — thay vì 60s cố định, dùng 55–65s để các key không hết hạn cùng lúc
3. **Cache nhiều tầng** — thêm cache trong RAM của tiến trình làm lớp đệm

---

## 6. Bẫy khi test (bổ sung thực tế)

> **📝 Ghi chú giảng viên — lỗi gặp thật khi soạn bài**
>
> Sau khi thêm cache, bộ test **treo vĩnh viễn**, không bao giờ kết thúc.
>
> Nguyên nhân: kết nối Redis là một **handle đang mở**. Nhớ bài học buổi 08 — `process.exitCode` chỉ hiệu quả khi **mọi handle đã đóng**.
>
> ```js
> after(async () => {
>   await prisma.$disconnect();
>   await dongRedis();     // ← thiếu dòng này là test treo
> });
> ```
>
> Và lỗi thứ hai: test đọc phải **cache của test trước** → kết quả sai ngẫu nhiên.
>
> ```js
> async function donSach() {
>   await layRedis().flushdb();    // ← xoá cache trước khi xoá database
>   ...
> }
> ```
>
> **Bài học:** thêm cache vào hệ thống là thêm một **nguồn trạng thái** nữa phải dọn dẹp trong test.

---

## 7. Bài tập về nhà

1. **Cache chi tiết sản phẩm.** Thêm cache cho `GET /san-pham/:id` với khoá `sanpham:chitiet:<id>`. Xoá đúng khoá đó (không xoá toàn bộ) khi sửa sản phẩm.

2. **Đo tỷ lệ HIT.** Thêm bộ đếm `cache:hit` và `cache:miss` bằng `INCR`. Gọi API 100 lần với các bộ lọc khác nhau, tính tỷ lệ HIT. Tỷ lệ bao nhiêu thì cache mới đáng?

3. **Chứng minh lỗ hổng khoá.** Cố tình bỏ id người dùng khỏi khoá cache đơn hàng, đăng nhập bằng hai tài khoản khác nhau, chứng minh người này **thấy đơn của người kia**. Rồi vá và chứng minh đã hết.

4. **Rate limit thật.** Thay middleware `rateLimit` buổi 11 bằng bản Redis, áp cho `/auth/dang-nhap` (5 lần/phút). Chạy **hai** tiến trình server trên hai cổng, gọi xen kẽ — kiểm chứng giới hạn vẫn đúng là 5.

5. **TTL ngẫu nhiên.** Sửa `cacheAside` để TTL dao động ±10%. Giải thích cách này giảm thundering herd thế nào.

6. **Nâng cao — session store.** Chuyển refresh token từ Postgres sang Redis với TTL tự động. So sánh: được gì (không cần dọn token hết hạn), mất gì (Redis chết là mất hết phiên).

---

## 8. Checklist kết thúc buổi

- [ ] Ba đặc điểm của Redis quyết định cách dùng nó?
- [ ] Mẫu cache-aside gồm mấy bước?
- [ ] Vì sao `SET` luôn phải kèm TTL?
- [ ] Câu hỏi thiết kế đúng khi cân nhắc cache là gì?
- [ ] Vì sao không dùng `KEYS` ở production?
- [ ] Lỗi bảo mật nghiêm trọng nhất của cache là gì?
- [ ] Vì sao rate limit dùng `Map` sai khi chạy nhiều bản sao?
- [ ] `expire(..., 'NX')` giải quyết vấn đề gì?
- [ ] Redis chết thì ứng dụng phải cư xử thế nào?
- [ ] Thundering herd là gì? Ba cách giảm nhẹ?

---

**Buổi trước:** [Buổi 20 — Connection pooling & phân trang](./buoi-20-pool-phan-trang.md)
**Buổi tiếp theo:** Buổi 22 — Bảo mật: OWASP Top 10 thực chiến
