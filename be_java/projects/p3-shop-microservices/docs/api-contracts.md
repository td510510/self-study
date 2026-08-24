# Hợp đồng API giữa các service

> Đây là **hợp đồng**: một khi service khác đã dùng, bạn không được đổi tùy tiện.
> Muốn đổi thì phải tương thích ngược (thêm field mới thì được, xóa/đổi kiểu field cũ thì không).

## Quy ước chung

- Mọi endpoint công khai đi qua Gateway ở `http://localhost:8080`.
- Endpoint nội bộ (`/internal/**`) **chỉ** gọi được từ service khác, gateway không định tuyến tới.
- Gateway xác thực JWT và chuyển tiếp 2 header xuống dưới:
  ```
  X-User-Id: 42
  X-User-Roles: ROLE_USER,ROLE_ADMIN
  X-Trace-Id: 8f14e45f
  ```
- Mọi lỗi trả về cùng cấu trúc `ErrorResponse` như Dự án 2 (timestamp, status, errorCode, message, path, traceId, fieldErrors).

---

## auth-service (:8081)

### POST /api/v1/auth/register
```json
// Request
{ "email": "a@shop.com", "password": "MatKhau123", "fullName": "Khách Hàng" }

// 201 Created
{ "accessToken": "eyJ...", "refreshToken": "uuid-uuid",
  "tokenType": "Bearer", "expiresInSeconds": 900,
  "user": { "id": 42, "fullName": "Khách Hàng" } }
```
Lỗi: `409 EMAIL_EXISTS`, `400 VALIDATION_FAILED`.

### POST /api/v1/auth/login
Giống register về response. Lỗi: `401 UNAUTHORIZED` (thông báo **giống nhau** cho sai email và sai mật khẩu).

### POST /api/v1/auth/refresh
```json
{ "refreshToken": "uuid-uuid" }
```
Trả cặp token mới, token cũ bị thu hồi.

### GET /internal/users/{id}
Dành cho service khác lấy thông tin người dùng.
```json
// 200
{ "id": 42, "email": "a@shop.com", "fullName": "Khách Hàng", "enabled": true }
```
Lỗi: `404 USER_NOT_FOUND`.

---

## product-service (:8082)

### GET /api/v1/products
Tham số: `keyword`, `category`, `minPrice`, `maxPrice`, `page`, `size` (tối đa 100), `sort`.
```json
{ "items": [ { "id": 1, "sku": "LT-DELL-01", "name": "Laptop Dell",
               "category": "Máy tính", "price": 22000000, "stock": 12, "active": true } ],
  "page": 0, "size": 20, "totalElements": 45, "totalPages": 3,
  "first": true, "last": false }
```

### GET /api/v1/products/{id}
`200` hoặc `404 PRODUCT_NOT_FOUND`.

### POST /api/v1/products  (ADMIN)
```json
{ "sku": "LT-DELL-01", "name": "Laptop Dell", "category": "Máy tính",
  "price": 22000000, "stock": 10 }
```

### POST /internal/products/reserve
Giữ tồn kho cho một đơn hàng. **Phải idempotent theo `orderId`**: gọi lại với cùng `orderId` không được trừ thêm lần nữa.
```json
// Request
{ "orderId": 1001,
  "items": [ { "productId": 1, "quantity": 2 }, { "productId": 5, "quantity": 1 } ] }

// 200 — giữ thành công
{ "orderId": 1001, "reserved": true,
  "items": [ { "productId": 1, "quantity": 2, "unitPrice": 22000000 },
             { "productId": 5, "quantity": 1, "unitPrice": 450000 } ],
  "totalAmount": 44450000 }

// 409 — không đủ hàng
{ "status": 409, "errorCode": "INSUFFICIENT_STOCK",
  "message": "Sản phẩm 'Laptop Dell' chỉ còn 1 sản phẩm",
  "details": { "productId": 1, "requested": 2, "available": 1 } }
```
Cài đặt bắt buộc: trừ tồn kho bằng UPDATE nguyên tử
```sql
UPDATE products SET stock = stock - :qty WHERE id = :id AND stock >= :qty
```
Trả về 0 dòng bị ảnh hưởng nghĩa là không đủ hàng. **Không** đọc-kiểm tra-ghi trong Java (race condition — Module 06).

### POST /internal/products/release
Hoàn tồn kho (hành động bù trừ của saga). Cũng phải idempotent theo `orderId`.
```json
{ "orderId": 1001 }
```

---

## order-service (:8083)

### POST /api/v1/orders
```json
// Request (userId lấy từ header X-User-Id, KHÔNG nhận từ body — chống giả mạo)
{ "items": [ { "productId": 1, "quantity": 2 } ],
  "shippingAddress": "123 Đường ABC, Hà Nội" }

// 201 Created
{ "id": 1001, "userId": 42, "status": "CONFIRMED",
  "totalAmount": 44000000,
  "items": [ { "productId": 1, "productName": "Laptop Dell",
               "quantity": 2, "unitPrice": 22000000, "lineTotal": 44000000 } ],
  "createdAt": "2026-08-25T10:15:30Z" }
```
Lỗi:
- `409 INSUFFICIENT_STOCK` — không đủ hàng (chuyển tiếp từ product-service)
- `503 PRODUCT_SERVICE_UNAVAILABLE` — circuit breaker mở; đơn hàng **không** được tạo
- `400 VALIDATION_FAILED` — giỏ rỗng, số lượng ≤ 0

### GET /api/v1/orders
Đơn hàng của **chính người gọi** (lọc theo `X-User-Id`). Người dùng khác không xem được đơn của nhau — kiểm tra ở server, không tin tham số client.

### GET /api/v1/orders/{id}
`404` nếu đơn không thuộc về người gọi (trả 404 chứ không phải 403 để không tiết lộ sự tồn tại).

### POST /api/v1/orders/{id}/cancel
Chỉ hủy được khi trạng thái là `PENDING` hoặc `CONFIRMED`. Hủy thành công thì gọi `release` để hoàn tồn kho và phát sự kiện `orders.cancelled`.

Trạng thái đơn hàng:
```
PENDING ──► CONFIRMED ──► SHIPPED ──► DELIVERED
   │            │
   └────────────┴──► CANCELLED
   └──► REJECTED (không đủ hàng)
```

---

## notification-service (:8084)

Không có API công khai. Chỉ lắng nghe Kafka (xem [events.md](events.md)).

Endpoint nội bộ để kiểm tra khi dev:
```
GET /internal/notifications?userId=42     danh sách thông báo đã "gửi"
```

---

## Quy tắc thay đổi hợp đồng (rất hay bị hỏi khi phỏng vấn)

**Được phép** (tương thích ngược):
- Thêm field **tùy chọn** vào response
- Thêm field tùy chọn vào request
- Thêm endpoint mới

**Không được phép** (phá vỡ client đang chạy):
- Xóa field, đổi tên field, đổi kiểu dữ liệu
- Đổi ý nghĩa của giá trị (ví dụ đơn vị tiền từ đồng sang nghìn đồng)
- Thêm field **bắt buộc** vào request

Cần thay đổi phá vỡ thì làm theo 3 bước: (1) tạo `/api/v2/...` song song, (2) chuyển dần client sang v2, (3) khi không còn ai dùng v1 thì mới xóa.
