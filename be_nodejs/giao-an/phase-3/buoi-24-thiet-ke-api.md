# Buổi 24 — Thiết kế API chuẩn REST

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Nâng chất lượng thiết kế API lên mức mà một team lớn có thể làm việc chung được lâu dài.
> **Code thực hành:** [`src/lib/idempotency.js`](../../code/project-02-ecommerce/src/lib/idempotency.js) · [`test/idempotency.test.js`](../../code/project-02-ecommerce/test/idempotency.test.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 23 |
| 15–50′ | Đặt tên tài nguyên & status code đúng ngữ nghĩa |
| 50–120′ | **Idempotency — chống bấm hai lần** |
| 120–145′ | Versioning API |
| 145–170′ | REST vs GraphQL — khi nào cần gì |
| 170–180′ | Bài tập & tổng kết |

---

## 1. Đặt tên tài nguyên (15–35′)

REST xoay quanh **danh từ** (tài nguyên), không phải **động từ** (hành động).

| ❌ Sai | ✅ Đúng |
|---|---|
| `POST /taoDonHang` | `POST /don-hang` |
| `GET /layDanhSachSanPham` | `GET /san-pham` |
| `POST /xoaSanPham/5` | `DELETE /san-pham/5` |
| `GET /san-pham/5/lay-danh-gia` | `GET /san-pham/5/danh-gia` |

> **Động từ đã nằm ở HTTP method rồi.** Lặp lại nó trong đường dẫn là thừa.

### Khi hành động không phải CRUD

Có những việc không map được vào CRUD: *huỷ đơn*, *gửi lại email*, *xuất báo cáo*.

```
POST /don-hang/5/huy           ← chấp nhận được
POST /don-hang/5/gui-lai-email
```

> Đây là ngoại lệ **có ý thức**. Đừng để nó thành thói quen — nếu API của bạn có 30 endpoint kiểu này thì thiết kế đã sai từ gốc.

Và **quan hệ lồng nhau chỉ nên sâu một cấp**:

```
✅ /don-hang/5/items
❌ /nguoi-dung/3/don-hang/5/items/9/san-pham
```

> Cấp lồng thứ hai trở đi thì dùng query string: `/items?donHangId=5`.

---

## 2. Status code đúng ngữ nghĩa (35–50′)

Nhắc lại và bổ sung từ buổi 01:

| Mã | Khi nào | Project 2 dùng ở |
|---|---|---|
| `200` | thành công, có body | GET, PATCH |
| `201` | **tạo mới** — kèm header `Location` | POST /san-pham, /don-hang |
| `204` | thành công, **không** body | DELETE |
| `207` | một phần thành công | upload nhiều file (buổi 17) |
| `400` | client gửi sai | validate lỗi |
| `401` | **chưa biết bạn là ai** | thiếu/sai token |
| `403` | **biết rồi nhưng không đủ quyền** | RBAC |
| `404` | không tồn tại (hoặc **giấu** sự tồn tại) | buổi 16 |
| `409` | **xung đột trạng thái** | trùng unique, hết hàng, idempotency |
| `413` | body quá lớn | upload |
| `415` | sai `Content-Type` | |
| `422` | cú pháp đúng nhưng nghiệp vụ sai | *(tuỳ chọn, xem dưới)* |
| `429` | quá nhiều request | rate limit |
| `500` | bug của server | |
| `503` | tạm thời không phục vụ | đang tắt (buổi 08) |

> **`400` hay `422`?** Cả hai đều được. Chọn **một** và dùng nhất quán. Project 2 chọn `400` cho mọi lỗi đầu vào — đơn giản hơn cho frontend.

### Body lỗi phải nhất quán

```json
{
  "loi": "Không đủ quyền thực hiện: sanpham:tao",
  "ma": "KHONG_DU_QUYEN",
  "chiTiet": { "tieuDe": "Không được rỗng" },
  "requestId": "4bf58c9a-..."
}
```

> Nhắc lại buổi 18: frontend so khớp **`ma`**, không so khớp chuỗi tiếng Việt.

---

## 3. Trọng tâm: Idempotency (50–120′)

### 3.1. Bài toán thật

> **📝 Ghi chú giảng viên — mở đầu bằng câu chuyện**
>
> *"Bạn đặt hàng trên một app. Mạng chập chờn, màn hình quay mãi. Bạn sốt ruột bấm lại. Sau đó nhận được hai đơn hàng và bị trừ tiền hai lần."*
>
> Hỏi lớp: *"Lỗi của ai?"*
>
> Đa số sẽ nói lỗi người dùng. **Sai.** Client **không có cách nào** biết request trước đã tới server hay chưa. Đây là lỗi **thiết kế API**.

Chứng minh bằng test:

```js
test('🚨 bấm hai lần → HAI đơn hàng', async () => {
  await datHang().expect(201);
  await datHang().expect(201);
  assert.equal(await prisma.donHang.count(), 2);
});
```

### 3.2. Idempotent tự nhiên và không tự nhiên

| Method | Idempotent? | Vì sao |
|---|---|---|
| `GET` | ✅ | chỉ đọc |
| `PUT` | ✅ | ghi đè toàn bộ — kết quả như nhau |
| `DELETE` | ✅ | xoá rồi thì lần sau không làm gì thêm |
| `PATCH` | ❌ | `{ soLuong: { increment: 1 } }` gọi 2 lần là +2 |
| `POST` | ❌ | **tạo mới mỗi lần gọi** |

> `POST /don-hang` **không** idempotent tự nhiên → phải làm cho nó idempotent bằng **khoá**.

### 3.3. Cơ chế

```
1. Client sinh khoá ngẫu nhiên (UUID), gửi qua header Idempotency-Key
2. Server chưa thấy khoá → đặt cờ "đang xử lý", thực thi, LƯU kết quả
3. Server đã thấy khoá  → trả về KẾT QUẢ CŨ, không thực thi lại
```

Đây chính là cơ chế của **Stripe, PayPal** và mọi cổng thanh toán.

```js
if (daCo) {
  const ban = JSON.parse(daCo);
  ...
  res.setHeader('Idempotency-Replayed', 'true');
  return res.status(ban.status).json(ban.body);   // ← trả bản cũ
}
```

Kết quả:

```js
test('gọi lại cùng khoá → trả KẾT QUẢ CŨ, không tạo đơn mới', async () => {
  const lan1 = await datHang(KHOA).expect(201);
  const lan2 = await datHang(KHOA).expect(201);

  assert.equal(lan2.body.id, lan1.body.id);
  assert.equal(lan2.headers['idempotency-replayed'], 'true');
  assert.equal(await prisma.donHang.count(), 1);   // ✅ CHỈ MỘT đơn
});

test('tồn kho chỉ bị trừ MỘT lần', async () => {
  assert.equal(sp.tonKho, 49, 'trừ đúng 1, không phải 2');
});
```

### 3.4. Bốn chi tiết quyết định đúng/sai

**(a) Khoá phải gắn với NGƯỜI DÙNG**

```js
const nguoi = req.nguoiDung?.id ?? `ip:${req.ip}`;
const khoa = `idem:${nguoi}:${khoaTho}`;
```

> Không có `userId`, người A đoán được khoá của người B là **đọc được kết quả đơn hàng của họ**. Cùng một lỗi với cache ở buổi 21.

Test canh giữ:

```js
test('hai người dùng KHÁC NHAU dùng CÙNG khoá → không đụng nhau', ...)
```

**(b) Cùng khoá nhưng nội dung khác → `409`**

```js
if (ban.vanTay !== vt) {
  return next(loi.xungDot('Idempotency-Key đã dùng cho một request có nội dung khác'));
}
```

> Nếu cho qua, ta trả về kết quả của một request **hoàn toàn khác** — client tưởng đã đặt hàng tới địa chỉ mới, thực ra là đơn cũ.

**(c) Cờ "đang xử lý" phải đặt bằng `NX`**

```js
const dat = await redis.set(khoa, JSON.stringify({ trangThai: 'dang-xu-ly', ... }), 'EX', TTL, 'NX');
if (dat === null) return next(loi.xungDot('Request đang được xử lý, vui lòng chờ'));
```

> `NX` = chỉ đặt nếu key **chưa tồn tại**. Đây là **khoá phân tán** — chỉ một trong hai request đồng thời đặt được cờ.
>
> Nối lại buổi 19: cùng một bài toán tranh chấp, lần này giải bằng Redis thay vì `FOR UPDATE`.

**(d) Thất bại thì phải giải phóng khoá**

```js
if (res.statusCode >= 200 && res.statusCode < 300) {
  redis.set(khoa, JSON.stringify({ trangThai: 'xong', ... }), 'EX', TTL);
} else {
  redis.del(khoa);      // ← để client thử lại được
}
```

> Nếu nhớ cả kết quả lỗi, client sẽ **mãi mãi** nhận lỗi đó dù đã sửa nguyên nhân.

Test:

```js
test('request THẤT BẠI thì khoá được giải phóng để thử lại', ...)
```

### 3.5. Khi nào cần idempotency?

| Cần | Không cần |
|---|---|
| Đặt hàng, thanh toán | `GET` bất kỳ |
| Chuyển tiền | `PUT`, `DELETE` (đã idempotent) |
| Gửi email/SMS | tạo bình luận (trùng thì xoá được) |
| Gọi API bên thứ ba tính tiền | |

> Nguyên tắc: **thao tác nào mà làm hai lần gây thiệt hại thật** thì cần.

---

## 4. Versioning API (120–145′)

Ba cách, mỗi cách một đánh đổi:

| Cách | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| **Đường dẫn** | `/v1/san-pham` | rõ ràng, dễ debug, cache tốt | "không thuần REST" |
| **Header** | `Accept: application/vnd.shop.v1+json` | URL sạch | khó thử bằng trình duyệt |
| **Query** | `/san-pham?v=1` | dễ | dễ quên, làm bẩn cache |

> **Khuyến nghị: versioning ở đường dẫn.** Nó thắng ở thứ quan trọng nhất — **người khác đọc log và debug được ngay**.

### Khi nào phải lên version mới?

| Thay đổi | Có phá vỡ client? |
|---|---|
| **Thêm** trường vào response | ❌ không → không cần version mới |
| **Thêm** tham số tuỳ chọn | ❌ không |
| **Xoá** trường | ✅ có → cần version mới |
| **Đổi tên** trường | ✅ có |
| **Đổi kiểu** dữ liệu (`"5"` → `5`) | ✅ có |
| Siết chặt validate | ✅ có |

> **📝 Ghi chú giảng viên**
> Nhấn mạnh: **thêm thì an toàn, xoá và đổi thì không**. Đây là lý do API tốt thường "phình ra" theo thời gian — và vì sao phải cân nhắc kỹ **trước khi** thêm một trường vào response công khai.
>
> Hỏi lớp: *"Đổi `giaVND` từ `Int` sang `String` có phá vỡ client không?"* → **Có**, dù giá trị nhìn giống nhau.

---

## 5. REST vs GraphQL (145–170′)

### Hai vấn đề REST hay bị chê

**Over-fetching** — lấy thừa:

```
GET /san-pham/5   →  trả về 20 trường, frontend chỉ cần 2
```

**Under-fetching** — phải gọi nhiều lần:

```
GET /don-hang/5           →  lấy đơn
GET /don-hang/5/items     →  lấy mặt hàng
GET /san-pham/12          →  lấy chi tiết từng sản phẩm
GET /san-pham/34          →  ...
```

> Đây chính là vấn đề **N+1 ở tầng HTTP** — nối lại buổi 13.

### GraphQL giải quyết bằng cách để client tự khai

```graphql
query {
  donHang(id: 5) {
    maDon
    items { tenSanPham  soLuong }
  }
}
```

### Nhưng đổi lại

| | REST | GraphQL |
|---|---|---|
| Cache HTTP | ✅ dễ (theo URL) | ❌ khó (mọi query đều `POST /graphql`) |
| Rate limit | ✅ đếm request | ❌ phải tính "độ phức tạp query" |
| Giới hạn tải | ✅ theo endpoint | ❌ **một query có thể làm sập database** |
| Học và vận hành | đơn giản | phức tạp hơn nhiều |
| Kiểu dữ liệu | phải tự tài liệu hoá | có sẵn schema |

> **📝 Ghi chú giảng viên**
> Hỏi lớp: *"GraphQL cho client tự chọn dữ liệu. Điều gì có thể sai?"*
>
> → Client viết một query lồng 10 cấp là database phải join khổng lồ. GraphQL **bắt buộc** phải có giới hạn độ sâu và độ phức tạp — thứ REST không cần vì mỗi endpoint đã cố định.

**Nguyên tắc chọn:**

| Chọn REST khi | Chọn GraphQL khi |
|---|---|
| API cho một frontend chính | nhiều client với nhu cầu dữ liệu rất khác nhau |
| Cần cache HTTP tốt | dữ liệu quan hệ sâu, client cần linh hoạt |
| Team nhỏ | có đội chuyên vận hành API |

> Với Project 2 và hầu hết dự án vừa, **REST là lựa chọn đúng**.

---

## 6. Design-first: viết contract trước khi code

```
1. Thống nhất API contract với frontend  (OpenAPI hoặc markdown)
2. Frontend dựng mock server từ contract → làm ngay, không chờ
3. Backend implement theo contract
4. Test tự động kiểm chứng contract
```

> Lợi ích lớn nhất **không phải** tài liệu, mà là: **frontend và backend làm song song, không chặn nhau.**
>
> Ở buổi 39, NestJS sinh OpenAPI **tự động** từ DTO — contract luôn khớp code, không bao giờ lệch.

---

## 7. Nghiệm thu

```
# tests 48
# pass 48
# fail 0
```

7 test mới cho idempotency:

| Test | Canh giữ |
|---|---|
| không có khoá → 2 đơn | chứng minh vấn đề có thật |
| cùng khoá → trả bản cũ | `Idempotency-Replayed: true`, chỉ 1 đơn |
| tồn kho trừ 1 lần | không phải 2 |
| khoá dùng cho nội dung khác | `409` |
| khoá quá ngắn | `400` |
| hai người cùng khoá | không đụng nhau |
| thất bại → giải phóng khoá | client thử lại được |

---

## 8. Bài tập về nhà

1. **Rà soát đặt tên.** Liệt kê mọi endpoint Project 2, chấm điểm theo chuẩn REST. Cái nào sai? Sửa thế nào?

2. **Idempotency cho thanh toán.** Thêm `POST /don-hang/:id/thanh-toan` với `idempotency({ batBuoc: true })`. Vì sao endpoint này phải **bắt buộc** có khoá, khác với đặt hàng?

3. **Client sinh khoá.** Viết một hàm JavaScript phía client tự sinh và **lưu lại** khoá, để khi retry vẫn dùng đúng khoá cũ. Gợi ý: lưu vào `sessionStorage` trước khi gửi request.

4. **Versioning.** Chuyển toàn bộ route sang tiền tố `/v1`. Rồi tạo `/v2/san-pham` đổi tên `giaVND` thành `gia` (kèm đơn vị riêng). Giữ cả hai chạy song song.

5. **Viết OpenAPI.** Viết file `openapi.yaml` mô tả 5 endpoint chính. Dùng Swagger Editor kiểm tra hợp lệ. So sánh công sức với việc NestJS sinh tự động (buổi 39).

6. **Nâng cao — độ phức tạp GraphQL.** Nếu Project 2 dùng GraphQL, một query lồng 5 cấp (`user → donHang → items → sanPham → danhMuc`) sẽ sinh ra bao nhiêu truy vấn database nếu không tối ưu? Cơ chế nào giải quyết? (Gợi ý: DataLoader.)

---

## 9. Checklist kết thúc buổi

- [ ] Vì sao đường dẫn REST dùng danh từ chứ không dùng động từ?
- [ ] Khi nào trả `201` thay vì `200`? Kèm header gì?
- [ ] Khi nào trả `409`?
- [ ] Method nào idempotent tự nhiên? `PATCH` thì sao?
- [ ] Vì sao "bấm hai lần" là lỗi thiết kế API chứ không phải lỗi người dùng?
- [ ] Idempotency key phải gắn với gì? Không gắn thì hậu quả ra sao?
- [ ] Vì sao dùng `SET ... NX` cho cờ "đang xử lý"?
- [ ] Vì sao request thất bại thì phải xoá khoá?
- [ ] Thay đổi nào **không** cần lên version mới?
- [ ] GraphQL có nguy cơ gì mà REST không có?

---

**Buổi trước:** [Buổi 23 — CORS, Helmet & Rate limiting](./buoi-23-cors-helmet-ratelimit.md)
**Buổi tiếp theo:** Buổi 25 — Realtime với WebSocket
