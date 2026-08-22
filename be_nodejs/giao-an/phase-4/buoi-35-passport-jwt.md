# Buổi 35 — Auth trong Nest: Passport JWT

> **Phase 4** · NestJS
> **Mục tiêu:** Dựng lại luồng authentication đã quen ở buổi 15, nhưng theo đúng convention Passport + Nest.
> **Code:** [`src/auth/`](../../code/project-04-nestjs/src/auth/)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 34 |
| 15–65′ | **JwtStrategy: khai báo thay vì viết tay** |
| 65–110′ | AuthModule & `registerAsync` |
| 110–150′ | Logic nghiệp vụ — cái gì giữ nguyên từ buổi 15 |
| 150–175′ | Bốn lỗ hổng: còn chặn được không? |
| 175–180′ | Bài tập |

---

## 1. JwtStrategy (15–65′)

**Express (buổi 15) — ta tự viết mọi thứ:**

```js
export function yeuCauDangNhap() {
  return (req, res, next) => {
    const header = req.headers.authorization ?? '';
    if (!header.startsWith('Bearer ')) return next(loi.chuaDangNhap('Thiếu header...'));
    const token = header.slice(7).trim();
    try {
      const payload = xacThucAccessToken(token);
      req.nguoiDung = { id: Number(payload.sub), ... };
      next();
    } catch (err) { next(err); }
  };
}
```

**Nest — ta chỉ KHAI BÁO:**

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),   // lấy token ở đâu
      ignoreExpiration: false,                                     // có kiểm hạn không
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'), // secret nào
      issuer: 'hocbe-auth',
      algorithms: ['HS256'],                                       // ⚠️ BẮT BUỘC
    });
  }

  validate(payload: JwtPayload) {
    return { id: Number(payload.sub), email: payload.email, vaiTro: payload.vaiTro };
  }
}
```

> **📝 Ghi chú giảng viên**
> Chỉ ra `algorithms: ['HS256']` và hỏi: *"Bỏ dòng này thì sao?"*
>
> → Lỗ hổng **`alg: none`** ở buổi 15. Passport **không** tự bảo vệ ta khỏi nó.
>
> **Framework lo phần lặp lại, KHÔNG lo phần suy nghĩ.**

### `validate()` trả về gì?

Giá trị trả về được Nest gán vào `req.user`.

> **⚠️ Đây là dữ liệu TỪ TOKEN, không phải từ database** (buổi 15).
>
> User bị hạ quyền hay khoá tài khoản thì token cũ **vẫn mang thông tin cũ** cho tới khi hết hạn. Đó là cái giá của stateless — và là lý do access token phải sống ngắn.
>
> Nếu nghiệp vụ đòi thu hồi **ngay lập tức**, `validate()` phải truy vấn database — nhưng khi đó mất luôn ưu điểm chính của JWT. Đánh đổi có ý thức, không phải mặc định.

---

## 2. AuthModule & `registerAsync` (65–110′)

```ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    signOptions: {
      expiresIn: (config.get<string>('ACCESS_TOKEN_TTL') ?? '15m') as `${number}m`,
      issuer: 'hocbe-auth',
    },
  }),
})
```

Hai điểm dạy:

**(a) Vì sao `registerAsync`?**

Vì cần `ConfigService` — mà nó là provider, phải chờ container dựng xong. `register()` đồng bộ sẽ đọc `process.env` khi có thể chưa nạp, và **không được validate** (buổi 38).

**(b) Ép kiểu — TypeScript bắt lỗi thật:**

```
Type 'string' is not assignable to type 'number | StringValue | undefined'
```

> Thư viện `ms` đòi định dạng cụ thể (`"15m"`, `"7d"`). Chuỗi `"mười lăm phút"` lỗi lúc **chạy** ở JS, nhưng lỗi lúc **biên dịch** ở TS.
>
> Đây là ví dụ cụ thể về giá trị của TypeScript ở backend.

---

## 3. Logic nghiệp vụ — giữ nguyên từ buổi 15 (110–150′)

```ts
async dangNhap(dto: DangNhapDto) {
  const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

  // Thông điệp GIỐNG NHAU cho cả hai trường hợp — chống dò tài khoản
  const LOI_CHUNG = { loi: 'Email hoặc mật khẩu không đúng', ma: 'SAI_THONG_TIN' };

  if (!user) {
    // Vẫn băm để thời gian phản hồi tương đương — chống dò bằng đo thời gian
    await this.matKhau.bam('chuoi_gia_de_ton_thoi_gian_tuong_duong');
    throw new UnauthorizedException(LOI_CHUNG);
  }

  if (!(await this.matKhau.kiemTra(dto.matKhau, user.matKhauHash))) {
    throw new UnauthorizedException(LOI_CHUNG);
  }
  ...
}
```

> **Từng dòng đều là bài học buổi 15.** Nest không thay đổi gì ở đây — nó chỉ đổi cách `prisma` và `matKhau` được đưa vào.
>
> **Thông điệp cho lớp: Nest không dạy ta bảo mật. Ta mang bảo mật vào Nest.**

### Tách `MatKhauService` thành provider

```ts
@Injectable()
export class MatKhauService {
  constructor(config: ConfigService) {
    this.cost = Number(config.get('BCRYPT_COST') ?? 12);
  }
  bam(matKhauTho: string) { return bcrypt.hash(matKhauTho, this.cost); }
  kiemTra(matKhauTho: string, hash: string) { return bcrypt.compare(matKhauTho, hash); }
}
```

| Vì sao không viết hàm tự do | |
|---|---|
| Test thay được bằng bản giả | cost 4 → test nhanh gấp 256 lần |
| Cost đọc từ `ConfigService` | không rải `process.env` khắp nơi |
| Đổi sang argon2 chỉ sửa một chỗ | |

---

## 4. Bốn lỗ hổng — còn chặn được không? (150–175′)

Đối chiếu với buổi 15:

| Lỗ hổng | Ai chặn ở Nest | Kiểm chứng |
|---|---|---|
| `alg: none` | **ta** khai `algorithms: ['HS256']` | token giả → `401` |
| Dò tài khoản qua thông điệp | **ta** viết `LOI_CHUNG` | hai thông điệp giống nhau |
| Dò qua thời gian phản hồi | **ta** gọi `bam()` giả | unit test kiểm `bam` được gọi |
| Lộ hash mật khẩu | **ta** viết hàm `loc()` | response không có `matKhauHash` |

> **Cả bốn đều do TA làm, không phải Nest.**

Unit test chứng minh điều e2e khó kiểm:

```ts
it('🔒 email KHÔNG tồn tại → VẪN băm một lần', async () => {
  prismaGia.user.findUnique.mockResolvedValue(null);
  await expect(service.dangNhap({ ... })).rejects.toThrow(UnauthorizedException);
  expect(matKhauGia.bam).toHaveBeenCalled();    // ← e2e chỉ đo được thời gian, bấp bênh
});
```

---

## 5. Bài tập về nhà

1. **Refresh token rotation.** Port toàn bộ cơ chế buổi 15 sang Nest: bảng `RefreshToken`, lưu hash, rotation, thu hồi toàn bộ khi phát hiện dùng lại. Viết test cho kịch bản token bị đánh cắp.

2. **Chứng minh `alg: none`.** Xoá `algorithms: ['HS256']`, tạo token `alg: none`, gọi `/auth/toi`. Nó có lọt không? Rồi khôi phục.

3. **Local strategy.** Thêm `LocalStrategy` cho `/auth/dang-nhap` thay vì gọi service trực tiếp. Cách nào rõ ràng hơn cho người đọc code?

4. **Thu hồi ngay lập tức.** Sửa `validate()` để truy vấn database kiểm tra tài khoản còn hoạt động. Đo lại thời gian phản hồi. Đánh đổi có đáng không?

5. **Public decorator.** Đăng ký `AuthGuard('jwt')` toàn cục, thêm `@CongKhai()` cho route không cần đăng nhập. So sánh mức an toàn với cách hiện tại.

6. **Nâng cao — cookie httpOnly.** Chuyển token từ header sang cookie `httpOnly` + `SameSite=Strict`. Cần đổi gì ở `jwtFromRequest`? CSRF trở thành vấn đề — giải quyết thế nào?

---

## 6. Checklist

- [ ] JwtStrategy khai báo bốn thứ gì?
- [ ] Bỏ `algorithms` thì lỗ hổng nào xuất hiện?
- [ ] `validate()` trả về gì và nó đi đâu?
- [ ] Dữ liệu trong `req.user` đến từ token hay database? Hệ quả?
- [ ] Vì sao `JwtModule` phải dùng `registerAsync`?
- [ ] Vì sao tách `MatKhauService` thành provider?
- [ ] Bốn lỗ hổng buổi 15 — Nest chặn hay ta chặn?

---

**Buổi trước:** [Buổi 34 — Exception Filter](./buoi-34-exception-filter.md)
**Buổi tiếp theo:** Buổi 36 — RBAC bằng Guard + metadata
