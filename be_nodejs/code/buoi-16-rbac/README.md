# Buổi 16 — Authorization & RBAC

Giáo án: [`giao-an/phase-2/buoi-16-rbac.md`](../../giao-an/phase-2/buoi-16-rbac.md)

```bash
docker compose up -d          # Postgres :5435
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma generate

npm test                              # 19 test
node --env-file=.env src/demo-idor.js # tự khai thác lỗ hổng rồi xem bản vá
```

## Tự khai thác IDOR

```
═══ ❌ Phiên bản CÓ LỖ HỔNG ═══
  HTTP 200
  Tiêu đề bài của An giờ là: "ĐÃ BỊ CHIẾM QUYỀN"
  → 🚨 BỊ CHIẾM QUYỀN THÀNH CÔNG

═══ ✅ Phiên bản ĐÃ VÁ ═══
  HTTP 403 — {"loi":"Không đủ quyền thực hiện: baiviet:sua"}
  → ✅ ĐÃ CHẶN
```

Cả hai phiên bản **đều có** `yeuCauDangNhap()`. Khác biệt chỉ là ba dòng:

```js
const bai = await prisma.baiViet.findUnique({ where: { id } });   // 1. NẠP
if (!bai) throw new HttpError(404, 'Không tìm thấy');             // 2. TỒN TẠI?
batBuocQuyen(req.nguoiDung, 'baiviet:sua', bai);                  // 3. ĐƯỢC PHÉP?
```

> **Thứ tự bất di bất dịch: TÌM → KIỂM QUYỀN → HÀNH ĐỘNG.**

## AuthN vs AuthZ

```
Authentication = "Bạn là ai?"       → 401
Authorization  = "Bạn được làm gì?" → 403
```

Có cái thứ nhất **không** có nghĩa là có cái thứ hai. Đây là nhầm lẫn phổ biến nhất, và là lỗ hổng **hạng nhất** OWASP Top 10.

## Bảng quyền — một nguồn sự thật

```js
export const BANG_QUYEN = {
  user:    { 'baiviet:sua': 'own', 'baiviet:xoa': 'own' },
  bienTap: { 'baiviet:sua': 'any', 'baiviet:xoa': 'own' },   // ← khác nhau!
  admin:   { 'baiviet:sua': 'any', 'baiviet:xoa': 'any' },
};
```

Vai trò `bienTap` sửa được bài người khác nhưng chỉ xoá được bài mình. Với `if/else` rải rác thì đây là chỗ chắc chắn sinh bug.

**Fail closed** — mặc định TỪ CHỐI:

```js
if (!quyen) return false;        // vai trò lạ
if (!phamVi) return false;       // hành động không khai
if (!taiNguyen) return false;    // đòi 'own' mà không có tài nguyên
```

## Bốn quyết định thiết kế

| Quyết định | Lý do |
|---|---|
| Bài riêng tư → `404` không phải `403` | `403` xác nhận bài đó **tồn tại** |
| `tacGiaId` lấy từ **token**, không từ body | chống mạo danh tác giả |
| Danh sách cũng lọc theo quyền | bảo vệ `/:id` mà quên `/` là vô nghĩa |
| `router.use(yeuCauDangNhap())` | mặc định đóng, không thể quên sót route |

## Vì sao IDOR khó phát hiện

- Không gây lỗi khi test bằng tài khoản của **chính mình**
- Không cảnh báo, không log — server trả `200` bình thường
- Chỉ lộ khi ai đó **cố tình** đổi id trên URL

> Dùng UUID thay số tăng dần chỉ làm khó khai thác hơn, **không** làm an toàn. Vẫn bắt buộc kiểm tra quyền.
