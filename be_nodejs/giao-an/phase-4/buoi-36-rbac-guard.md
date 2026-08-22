# Buổi 36 — RBAC bằng Guard + metadata

> **Phase 4** · NestJS
> **Mục tiêu:** Tái hiện RBAC của buổi 16 bằng công cụ đúng chuẩn Nest, và hiểu vì sao cách này scale tốt hơn cho team lớn.
> **Code:** [`src/common/guards/`](../../code/project-04-nestjs/src/common/guards/)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 35 |
| 15–60′ | Đối chiếu: middleware Express vs Guard + metadata |
| 60–110′ | **Phân quyền theo CHỦ SỞ HỮU trong Nest** |
| 110–150′ | `401` vs `403` và thứ tự guard |
| 150–175′ | Mặc định mở hay mặc định đóng |
| 175–180′ | Bài tập |

---

## 1. Đối chiếu (15–60′)

| | Express (buổi 16) | Nest |
|---|---|---|
| Khai báo | `yeuCauVaiTro('admin')` — middleware | `@VaiTroCanThiet('admin')` — metadata |
| Kiểm tra | cùng middleware đó | `VaiTroGuard` đọc metadata |
| Biết ngữ cảnh | chỉ đường dẫn | class + method |
| Đặt ở controller rồi ghi đè | ❌ | ✅ `getAllAndOverride` |
| Công cụ quét được luật | ❌ | ✅ metadata là **dữ liệu** |

Test canh giữ:

```ts
it('khách gọi route admin → 403 (không phải 401)', async () => {
  const r = await goi().post('/san-pham')
    .set('Authorization', `Bearer ${tokenKhach}`)
    .send({ ten: 'X', slug: 'x', giaVND: 1000, danhMucId })
    .expect(403);
  expect(r.body.ma).toBe('KHONG_DU_QUYEN');
});
```

---

## 2. Trọng tâm: phân quyền theo chủ sở hữu (60–110′)

RBAC theo **vai trò** là phần dễ. Phần khó — và là lỗ hổng hạng nhất OWASP (buổi 16) — là **chủ sở hữu**.

> Nhắc lại thứ tự bất di bất dịch: **TÌM → KIỂM QUYỀN → HÀNH ĐỘNG.**

### Hai cách làm trong Nest

**Cách A — kiểm trong Service** (như Project 2):

```ts
async layMot(id: number, nd: NguoiDungHienTai) {
  const don = await this.prisma.donHang.findUnique({ where: { id } });
  if (!don) throw new NotFoundException(...);
  if (nd.vaiTro === 'khach' && don.userId !== nd.id) throw new ForbiddenException(...);
  return don;
}
```

**Cách B — Guard nạp bản ghi rồi kiểm:**

```ts
@Injectable()
export class ChuSoHuuGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const don = await this.prisma.donHang.findUnique({ where: { id: Number(req.params.id) } });
    if (!don) throw new NotFoundException(...);
    if (don.userId !== req.user.id) throw new ForbiddenException(...);
    req.donHang = don;      // ⚠️ gán vào req để handler khỏi nạp lại
    return true;
  }
}
```

| | Cách A (Service) | Cách B (Guard) |
|---|---|---|
| Tái sử dụng | lặp ở mỗi method | một guard cho nhiều route |
| Service độc lập | ✅ test không cần HTTP | ❌ logic quyền nằm ngoài |
| Số truy vấn | 1 | 1 (nếu gán `req`) hoặc **2** |
| Đọc route là biết luật | ❌ | ✅ |

> **📝 Ghi chú giảng viên**
> Không có đáp án đúng tuyệt đối, nhưng có cảnh báo cụ thể cho cách B:
>
> Nếu Guard nạp bản ghi rồi handler **nạp lại**, ta có **2 truy vấn** mỗi request. Gán vào `req` để tránh — nhưng khi đó handler phụ thuộc `req`, mất tính hàm thuần (buổi 33).
>
> **Khuyến nghị:** vai trò → **Guard**; chủ sở hữu → **Service**.
>
> Lý do: chủ sở hữu thường gắn với logic nghiệp vụ (*"đơn đã giao thì không huỷ được"*), mà đó là việc của service. Tách ra Guard sẽ khiến luật nghiệp vụ nằm rải hai nơi.

---

## 3. `401` vs `403` và thứ tự guard (110–150′)

```ts
@UseGuards(AuthGuard('jwt'), VaiTroGuard)
```

> Chạy **trái sang phải**. Đảo lại thì `VaiTroGuard` đọc `req.user` khi chưa được gán → luôn `403`, **kể cả admin**.

| Mã | Nghĩa | Frontend làm gì |
|---|---|---|
| `401` | *"Tôi không biết bạn là ai"* | chuyển tới trang đăng nhập |
| `403` | *"Biết rồi, nhưng không đủ quyền"* | hiện thông báo, **không** chuyển trang |

> Nhầm hai mã này khiến frontend đá người dùng ra trang đăng nhập dù họ **đã** đăng nhập — bug gây khó chịu và rất hay gặp.

### Nối lại buổi 30: Guard chạy trước Pipe

```ts
it('⚠️ Guard chạy TRƯỚC Pipe: dữ liệu sai + thiếu quyền → 403', async () => {
  await goi().post('/san-pham')
    .set('Authorization', `Bearer ${tokenKhach}`)
    .send({ ten: 'X', slug: 'x', giaVND: 99.5, danhMucId })   // giaVND SAI
    .expect(403);                                              // ← không phải 400
});
```

> **Đúng về bảo mật:** không tiết lộ cấu trúc dữ liệu cho người không có quyền. Kẻ tấn công không dò được schema API bằng tài khoản thường.

---

## 4. Mặc định mở hay mặc định đóng (150–175′)

Guard hiện tại:

```ts
if (!canThiet || canThiet.length === 0) return true;   // route không dán nhãn → CHO QUA
```

> An toàn chỉ có được vì guard được gắn **tường minh** bằng `@UseGuards`.
>
> **Rủi ro:** thêm route mới mà quên `@UseGuards` → route đó **mở toang**, và **không có gì cảnh báo**.

**Cách an toàn hơn — đảo mặc định:**

```ts
// app.module.ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: VaiTroGuard },
]
```

```ts
@Get()
@CongKhai()      // ← phải khai TƯỜNG MINH mới mở
danhSach() { ... }
```

| | Mặc định mở | Mặc định đóng |
|---|---|---|
| Quên khai | route **lộ** 🚨 | route bị **chặn** (phát hiện ngay) |
| Công sức | ít hơn | phải khai cho route công khai |
| Rủi ro | cao | thấp |

> Nối lại buổi 16: *"mặc định đóng, mở ra từng trường hợp"* — cùng nguyên tắc với `router.use(yeuCauDangNhap())` ở Express.
>
> **Điểm mấu chốt:** cách nào cũng chạy đúng khi ta cẩn thận. Khác biệt là **cách nào hỏng an toàn khi ta sơ suất**.

---

## 5. Bài tập về nhà

1. **`ChuSoHuuGuard`.** Viết guard kiểm tra chủ sở hữu đơn hàng. Đo số truy vấn database mỗi request. So sánh với cách kiểm trong service.

2. **Đảo thành mặc định đóng.** Đăng ký cả hai guard toàn cục qua `APP_GUARD`, thêm `@CongKhai()`. Chạy lại e2e — bao nhiêu test fail? Mỗi cái fail chỉ ra điều gì về code hiện tại?

3. **Thêm vai trò.** Thêm `kiemDuyet`: xem được mọi thứ, không sửa không xoá. Chỉ sửa metadata trên route, **không** sửa guard.

4. **Đảo thứ tự guard.** `@UseGuards(VaiTroGuard, AuthGuard('jwt'))`, gọi bằng token admin. Kết quả? Giải thích bằng vòng đời request.

5. **Ghi log kiểm toán.** Mỗi lần guard từ chối, log `userId`, đường dẫn, vai trò cần thiết. Vì sao log này quan trọng? (Gợi ý: phát hiện ai đang dò quét hệ thống.)

6. **Nâng cao — quyền động.** Chuyển bảng quyền (buổi 16) từ hằng số sang database, cache bằng Redis (buổi 21). Mỗi request tốn thêm gì? Cache sai thì hậu quả ra sao?

---

## 6. Checklist

- [ ] Guard + metadata hơn middleware Express ở ba điểm nào?
- [ ] Vai trò nên kiểm ở Guard, chủ sở hữu nên kiểm ở đâu? Vì sao?
- [ ] `@UseGuards(A, B)` chạy thứ tự nào? Đảo lại thì sao?
- [ ] Khi nào trả `401`, khi nào `403`?
- [ ] Vì sao Guard trước Pipe là đúng về bảo mật?
- [ ] "Mặc định đóng" an toàn hơn ở điểm nào?

---

**Buổi trước:** [Buổi 35 — Passport JWT](./buoi-35-passport-jwt.md)
**Buổi tiếp theo:** Buổi 37 — Unit test với mock DI
