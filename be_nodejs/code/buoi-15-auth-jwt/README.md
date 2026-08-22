# Buổi 15 — Authentication: JWT & bcrypt

Giáo án: [`giao-an/phase-2/buoi-15-auth-jwt.md`](../../giao-an/phase-2/buoi-15-auth-jwt.md)

```bash
docker compose up -d          # Postgres :5434
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma generate

npm start
npm test                      # 20 test, gồm cả kịch bản tấn công
node --env-file=.env src/demo-bcrypt-cost.js
```

## API

| Method | Đường dẫn | Cần đăng nhập |
|---|---|---|
| `POST` | `/auth/dang-ky` | |
| `POST` | `/auth/dang-nhap` | |
| `POST` | `/auth/lam-moi` | |
| `POST` | `/auth/dang-xuat` | |
| `POST` | `/auth/dang-xuat-tat-ca` | ✅ |
| `GET` | `/auth/toi` | ✅ |
| `GET` | `/auth/chi-admin` | ✅ + vai trò `admin` |

## Số liệu đo thật — vì sao bcrypt cố tình chậm

```
SHA-256        : 603.304 lần/giây     ← quá nhanh, nguy hiểm cho mật khẩu
bcrypt cost 12 :     4.6 lần/giây

Chênh lệch: ~131.000 lần
```

| cost | thời gian | lần/giây |
|---|---|---|
| 10 | 54ms | 18.5 |
| 11 | 107ms | 9.4 |
| **12** | **215ms** | **4.6** |
| 13 | 427ms | 2.3 |

Tăng cost thêm 1 → chậm **gấp đôi**. Mục tiêu: 200–500ms trên máy chủ production.

## Bốn lỗ hổng được chặn (đều có test)

**1. `alg: none`** — kẻ tấn công tự tạo token không chữ ký:

```js
jwt.verify(token, SECRET, { algorithms: ['HS256'] });   // ⚠️ BẮT BUỘC khai
```

Không khai → thư viện tin thuật toán ghi trong header của chính token.

**2. Dò tài khoản qua thông điệp lỗi** — dùng chung một câu cho cả "sai mật khẩu" và "email không tồn tại".

**3. Dò tài khoản qua thời gian phản hồi** — vẫn băm một lần dù user không tồn tại:

```js
if (!user) {
  await bamMatKhau('chuoi_gia_de_ton_thoi_gian_tuong_duong');
  throw loi.chuaDangNhap(LOI_CHUNG);
}
```

**4. Lộ hash mật khẩu** — luôn lọc qua `locUser()`, không `res.json(user)` thẳng từ Prisma.

## Refresh token rotation

Mỗi refresh token dùng được **đúng một lần**. Dùng lại → **thu hồi toàn bộ phiên**:

```
1. Kẻ tấn công đánh cắp refresh token
2. Hắn dùng trước       → token cũ bị thu hồi
3. Bạn dùng token cũ    → phát hiện DÙNG LẠI
4. → thu hồi TOÀN BỘ phiên
5. → bạn đăng nhập lại được, kẻ tấn công thì không
```

## ⚠️ JWT payload KHÔNG được mã hoá

```js
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
// → đọc được email, vai trò... KHÔNG cần secret
```

Chữ ký đảm bảo **không sửa được**, không đảm bảo **không đọc được**. Không bao giờ đưa dữ liệu nhạy cảm vào payload.

## Access vs Refresh token

| | Access | Refresh |
|---|---|---|
| Tuổi thọ | 15 phút | 7 ngày |
| Lưu DB | ❌ | ✅ (lưu **hash**) |
| Thu hồi | không | có |
| Secret | `JWT_ACCESS_SECRET` | `JWT_REFRESH_SECRET` — **phải khác** |

Dùng chung secret = refresh token gọi API được như access token. Có test canh giữ.
