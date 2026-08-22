# Buổi 33 — Custom Pipe, Guard & Decorator

> **Phase 4** · NestJS
> **Mục tiêu:** Tự viết ba loại thành phần lifecycle, và hiểu vì sao Nest tách "khai báo" khỏi "thực thi".
> **Code:** [`src/common/`](../../code/project-04-nestjs/src/common/)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 32 |
| 15–60′ | **Decorator dán nhãn + Guard đọc nhãn** |
| 60–100′ | `Reflector` & `getAllAndOverride` |
| 100–140′ | Custom param decorator |
| 140–170′ | Custom Pipe |
| 170–180′ | Bài tập |

---

## 1. Trọng tâm: tách khai báo khỏi thực thi (15–60′)

Ở Express (buổi 16), phân quyền là **một** middleware làm cả hai việc:

```js
router.post('/', yeuCauVaiTro('admin'), handler);
//               ^^^^^^^^^^^^^^^^^^^^^ vừa khai báo, vừa kiểm tra
```

Ở Nest, tách làm **hai**:

```ts
// 1. DECORATOR — chỉ DÁN NHÃN, không kiểm tra gì
export const VaiTroCanThiet = (...vaiTro: VaiTro[]) => SetMetadata(KHOA_VAI_TRO, vaiTro);

// 2. GUARD — ĐỌC NHÃN và quyết định
@Injectable()
export class VaiTroGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean { ... }
}
```

Dùng:

```ts
@Post()
@UseGuards(AuthGuard('jwt'), VaiTroGuard)
@VaiTroCanThiet('admin')
tao(@Body() dto: TaoSanPhamDto) { ... }
```

### Vì sao tách?

| Lợi ích | Giải thích |
|---|---|
| **Đọc là biết luật** | nhìn `@VaiTroCanThiet('admin')` biết ngay, không cần đọc code guard |
| **Guard tái sử dụng** | một guard cho mọi route, mọi module |
| **Đổi cách kiểm tra không đụng route** | sửa guard, 50 route hưởng lợi |
| **Công cụ đọc được** | Swagger, script kiểm toán quét được metadata |

> **📝 Ghi chú giảng viên**
> Hỏi lớp: *"Muốn liệt kê MỌI endpoint mà admin truy cập được — làm thế nào?"*
>
> Với Express: đọc tay từng file router.
> Với Nest: quét metadata bằng script. **Luật trở thành dữ liệu.**
>
> Nối lại buổi 16 (bảng quyền) và buổi 25 (máy trạng thái): cùng một ý tưởng — **đưa luật vào dữ liệu**.

---

## 2. `Reflector` & `getAllAndOverride` (60–100′)

```ts
const canThiet = this.reflector.getAllAndOverride<VaiTro[] | undefined>(KHOA_VAI_TRO, [
  ctx.getHandler(),   // ← metadata ở METHOD  (ưu tiên cao)
  ctx.getClass(),     // ← metadata ở CLASS   (dự phòng)
]);
```

| Phương thức | Hành vi |
|---|---|
| `get` | đọc từ **một** nơi |
| `getAllAndOverride` | method **ghi đè** class |
| `getAllAndMerge` | **gộp** cả hai |

> Nhờ `getAllAndOverride`, đặt `@VaiTroCanThiet('admin')` ở **cấp controller** rồi ghi đè cho một method:
>
> ```ts
> @Controller('quan-tri')
> @VaiTroCanThiet('admin')          // ← mặc định cho cả controller
> export class QuanTriController {
>   @Get('bao-cao')
>   @VaiTroCanThiet('admin', 'nhanVien')   // ← ghi đè, nới lỏng hơn
>   baoCao() { ... }
> }
> ```

### Fail closed

```ts
if (!canThiet || canThiet.length === 0) return true;   // route không dán nhãn
...
if (!nd || !canThiet.includes(nd.vaiTro)) {
  throw new ForbiddenException({ ma: 'KHONG_DU_QUYEN' });
}
```

> **⚠️ Chú ý:** route **không dán nhãn** thì guard cho qua. Nghĩa là mặc định của **guard này** là mở.
>
> An toàn chỉ có được nhờ guard được gắn **tường minh** bằng `@UseGuards`. Nếu đăng ký guard **toàn cục**, phải đảo lại logic: không có nhãn → **từ chối**, và dùng decorator `@CongKhai()` để mở từng route.
>
> Nối lại buổi 16: *"mặc định đóng, mở ra từng trường hợp"*. Bài tập số 3.

---

## 3. Custom param decorator (100–140′)

```ts
export const NguoiDung = createParamDecorator(
  (data: keyof NguoiDungHienTai | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: NguoiDungHienTai }>();
    const nd = req.user;
    return data && nd ? nd[data] : nd;
  },
);
```

Dùng:

```ts
layHoSo(@NguoiDung() nd: NguoiDungHienTai)   // cả object
layHoSo(@NguoiDung('id') id: number)         // chỉ một trường
```

**So với Express:**

```js
// Express: handler đọc req trực tiếp, không có kiểu
const userId = req.nguoiDung.id;
```

| | Express | Nest |
|---|---|---|
| Kiểu dữ liệu | không có | có |
| Handler biết về `req` | **có** | **không** |
| Test handler | phải giả lập `req` | truyền object thường |

> Handler không đụng `req` thì nó là **hàm thuần** — test bằng cách gọi trực tiếp. Đây là lợi ích thật, không phải cú pháp đẹp.

---

## 4. Custom Pipe (140–170′)

```ts
@Injectable()
export class ParseSlugPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new BadRequestException({
        loi: 'Slug chỉ gồm chữ thường, số và dấu gạch ngang',
        ma: 'SLUG_SAI',
      });
    }
    return value;
  }
}
```

> Pipe làm **hai** việc: biến đổi và validate. `ParseIntPipe` làm cả hai (`"5"` → `5`, sai thì `400`).

### Khi nào dùng Pipe, khi nào dùng DTO?

| Dùng | Khi |
|---|---|
| **DTO + ValidationPipe** | validate cả `body` — nhiều trường, có quan hệ |
| **Custom Pipe** | biến đổi **một** tham số (`@Param`, `@Query`) |

> Đừng viết pipe riêng cho từng trường của body — đó là việc của DTO.

---

## 5. Bài tập về nhà

1. **Guard theo chủ sở hữu.** Viết `ChuSoHuuGuard` kiểm tra `req.user.id === taiNguyen.userId` — chống IDOR (buổi 16). Nó cần nạp bản ghi từ database; đặt logic nạp ở đâu cho hợp lý?

2. **Decorator gộp.** Viết `@ChiAdmin()` gộp `@UseGuards(AuthGuard('jwt'), VaiTroGuard)` + `@VaiTroCanThiet('admin')` + `@ApiBearerAuth()` thành một. Gợi ý: `applyDecorators`.

3. **Đảo mặc định thành ĐÓNG.** Đăng ký `VaiTroGuard` toàn cục, đảo logic thành "không có nhãn → từ chối", thêm `@CongKhai()` cho route công khai. Cách nào an toàn hơn? Cách nào dễ sai hơn?

4. **Pipe cho phân trang.** Viết `PhanTrangPipe` ép `trang`/`moiTrang` về số, kẹp trong khoảng hợp lệ, và điền mặc định. So sánh với cách dùng DTO.

5. **Quét metadata.** Viết script dùng `DiscoveryService` liệt kê **mọi** endpoint và vai trò cần thiết. Đây là công cụ kiểm toán bảo mật thật.

6. **Interceptor + decorator.** Viết `@Cache(60)` + `CacheInterceptor` dùng Redis (buổi 21). Nhớ bài học: khoá cache **phải** chứa id người dùng nếu dữ liệu riêng tư.

---

## 6. Checklist

- [ ] Vì sao tách decorator (dán nhãn) khỏi guard (kiểm tra)?
- [ ] `getAllAndOverride` khác `get` thế nào?
- [ ] Guard của dự án mặc định mở hay đóng? Điều đó an toàn khi nào?
- [ ] Custom param decorator giúp test dễ hơn ra sao?
- [ ] Pipe làm mấy việc?
- [ ] Khi nào dùng custom pipe, khi nào dùng DTO?

---

**Buổi trước:** [Buổi 32 — Prisma trong Nest](./buoi-32-prisma-trong-nest.md)
**Buổi tiếp theo:** Buổi 34 — Exception Filter & xử lý lỗi tập trung
