# Buổi 28 — Vì sao NestJS & Dependency Injection

> **Phase 4** · NestJS
> **Mục tiêu:** Hiểu **vấn đề** mà Nest giải quyết trước khi học cú pháp — tránh cảm giác "phức tạp hoá không cần thiết".
> **Code thực hành:** [`code/project-04-nestjs/`](../../code/project-04-nestjs/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Nhìn lại Project 2: cái gì đã ổn, cái gì chưa |
| 20–70′ | **Dependency Injection — vấn đề thật, không phải mốt** |
| 70–110′ | IoC container hoạt động thế nào |
| 110–150′ | Dựng project Nest đầu tiên, đọc hiểu từng file |
| 150–175′ | TypeScript: cái giá và cái được |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Nhìn lại Project 2 (0–20′)

> **📝 Ghi chú giảng viên**
> **Đừng mở NestJS ra ngay.** Bắt đầu bằng việc chỉ ra vấn đề trong code học viên **đã tự viết** — khi đó Nest xuất hiện như một câu trả lời, không phải một môn học mới.

Mở `src/modules/auth/auth.service.js` của Project 2:

```js
import { prisma } from '../../lib/prisma.js';        // ← tự đi lấy
import { bamMatKhau } from './mat-khau.js';           // ← tự đi lấy

export async function dangKy({ email, ten, matKhau }) {
  const hash = await bamMatKhau(matKhau);
  const user = await prisma.user.create({ ... });
}
```

Hỏi lớp: *"Muốn test hàm này mà **không** đụng database thì làm thế nào?"*

Để lớp vật lộn vài phút. Các câu trả lời thường gặp:
- *"Dùng thư viện mock module"* → phức tạp, phụ thuộc cách bundler hoạt động
- *"Đổi thành hàm nhận `prisma` làm tham số"* → **đúng hướng**, nhưng phải sửa **mọi** chỗ gọi

Chốt lại: **vấn đề nằm ở chỗ hàm TỰ ĐI LẤY phụ thuộc của nó.**

### Ba vấn đề khi codebase lớn dần

| Vấn đề | Biểu hiện ở Project 2 |
|---|---|
| **Khó test** | service tự import `prisma` → muốn test phải có database thật |
| **Không có quy ước bắt buộc** | ai cũng import được của ai; không có rào chắn |
| **Vòng đời tự quản** | ta tự nhớ đóng kết nối trong graceful shutdown |

> Với 5 file thì không sao. Với 200 file và 8 người cùng làm thì thành vấn đề thật.

---

## 2. Dependency Injection (20–70′)

### 2.1. Đảo ngược một câu

```
Không có DI:  "TÔI đi lấy thứ tôi cần"
Có DI      :  "AI ĐÓ đưa cho tôi thứ tôi cần"
```

```ts
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,      // ← được TIÊM vào
    private readonly matKhau: MatKhauService,
    private readonly jwt: JwtService,
  ) {}
}
```

> `AuthService` **không biết** `PrismaService` được tạo ra thế nào, kết nối tới đâu, hay là thật hay giả. Nó chỉ biết **hình dạng** của thứ nó nhận.

### 2.2. Lợi ích cụ thể — không phải lý thuyết

Đây là test thật trong dự án:

```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    AuthService,
    // ⭐ Thay THẬT bằng GIẢ — KHÔNG sửa AuthService một dòng nào
    { provide: PrismaService, useValue: prismaGia },
    { provide: MatKhauService, useValue: matKhauGia },
  ],
}).compile();
```

Kết quả đo thật:

```
Unit test (mock DI) :  9 test —  1.075 s
E2E test (thật)     : 18 test —  9.956 s
```

> **Nhanh gấp ~10 lần, và không cần Docker, database, hay mạng.**
>
> Nối lại buổi 09: ở Project 1 ta **tự thiết kế** service nhận repository qua tham số để test được. Nest biến việc đó thành **mặc định của framework**.

### 2.3. Test bắt được thứ e2e khó bắt

```ts
it('🔒 email KHÔNG tồn tại → VẪN băm một lần (chống dò bằng đo thời gian)', async () => {
  prismaGia.user.findUnique.mockResolvedValue(null);
  await expect(service.dangNhap({ ... })).rejects.toThrow(UnauthorizedException);

  // Xác nhận hàm băm ĐÃ được gọi dù user không tồn tại
  expect(matKhauGia.bam).toHaveBeenCalled();
});
```

> **📝 Ghi chú giảng viên**
> Đây là ví dụ đắt giá. Ở buổi 15 ta viết dòng `await bamMatKhau('chuoi_gia...')` để chống dò tài khoản bằng đo thời gian. Nhưng **làm sao test được** rằng nó vẫn ở đó sau khi ai đó refactor?
>
> E2E test chỉ đo được thời gian — bấp bênh và hay sai. Unit test với mock thì **hỏi thẳng**: "hàm băm có được gọi không?"
>
> Đó là loại kiểm chứng mà DI mở khoá.

### 2.4. DI không phải phát minh của Nest

| Nơi | Cách gọi |
|---|---|
| Angular | DI (Nest học từ đây) |
| Spring (Java) | Bean, `@Autowired` |
| .NET | Service container |
| React | Context — họ hàng gần |

> **💡 Đối chiếu Frontend**
> React Context cũng là *"đưa xuống thay vì tự đi lấy"*. Khác biệt: Context truyền theo **cây component**, còn DI của Nest truyền theo **kiểu dữ liệu** và mạnh hơn nhiều — nó tự phân giải cả chuỗi phụ thuộc lồng nhau.

---

## 3. IoC container (70–110′)

**IoC = Inversion of Control.** Container là "người quản kho" của Nest.

Nó làm ba việc:

```
1. ĐỌC     — quét metadata từ decorator (@Injectable, @Module)
2. DỰNG    — tạo instance theo đúng thứ tự phụ thuộc
3. TIÊM    — đưa instance vào constructor nơi cần
```

### Ví dụ chuỗi phụ thuộc trong dự án

```
AuthService
  ├── PrismaService  ──→ ConfigService
  ├── MatKhauService ──→ ConfigService
  ├── JwtService     ──→ ConfigService
  └── ConfigService
```

> Nest tự tìm ra thứ tự: dựng `ConfigService` **trước**, rồi tới ba cái giữa, cuối cùng mới `AuthService`.
>
> Nếu tự làm bằng tay, ta phải viết đúng thứ tự này — và sửa lại mỗi khi thêm phụ thuộc.

### Singleton mặc định

> Mặc định mỗi provider chỉ có **một instance** cho cả ứng dụng.
>
> Nối lại buổi 13 và 20: *"chỉ tạo MỘT `PrismaClient`"* — ở Express đó là **kỷ luật** ta phải tự giữ. Ở Nest, container **đảm bảo** điều đó.

### Vòng đời được quản

```ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

> **⚠️ Nhưng phải bật shutdown hooks:**
> ```ts
> app.enableShutdownHooks();
> ```
> Không có dòng này, `onModuleDestroy` **không bao giờ chạy** khi nhận `SIGTERM` — graceful shutdown của buổi 08 mất tác dụng.
>
> Framework lo hộ, nhưng vẫn phải **biết** nó lo cái gì và cần bật gì.

---

## 4. Dựng project đầu tiên (110–150′)

```bash
npx @nestjs/cli new project-04-nestjs --package-manager npm --strict
```

Đọc hiểu từng file — **bắt học viên giải thích, đừng giảng**:

| File | Vai trò | Tương đương ở Project 2 |
|---|---|---|
| `main.ts` | khởi động, cấu hình toàn cục | `src/server.js` |
| `app.module.ts` | module gốc, khai báo toàn bộ ứng dụng | `src/app.js` |
| `*.controller.ts` | nhận request | `*.routes.js` |
| `*.service.ts` | logic nghiệp vụ | `*.service.js` |
| `*.module.ts` | đóng gói một nhóm | thư mục `modules/x/` |

> **📝 Ghi chú giảng viên**
> Chỉ ra: cấu trúc này **giống hệt** thứ học viên đã tự nghĩ ra ở buổi 18 (chia theo nghiệp vụ). Khác biệt là ở Express đó là **quy ước tự đặt**; ở Nest nó là **bắt buộc**.
>
> Thông điệp: *"Các bạn không học một kiến trúc mới. Các bạn học cách một framework ép buộc kiến trúc các bạn đã tự chọn."*

---

## 5. TypeScript — cái giá và cái được (150–175′)

Nest là TypeScript-first. Học viên frontend có thể đã dùng TS, nhưng ở backend nó bắt được những lỗi khác.

### Hai lỗi thật gặp khi dựng dự án này

**(a) `req.id` không tồn tại trong kiểu `Request`**

```
error TS2339: Property 'id' does not exist on type 'Request'
```

> Ở Express (JS), ta gán `req.nguoiDung = {...}` thoải mái và **không ai kiểm tra**. TypeScript từ chối.
>
> Nghe phiền, nhưng nó bắt được cả một lớp lỗi: gõ nhầm tên (`req.nguoiDug`), hoặc đọc thuộc tính ở nơi middleware chưa chạy.

Cách khai báo thêm (module augmentation):

```ts
declare global {
  namespace Express {
    interface Request {
      id?: string;
      nguoiDung?: { id: number; email: string; vaiTro: VaiTro };
    }
  }
}
```

**(b) `expiresIn` không nhận `string` chung chung**

```
Type 'string' is not assignable to type 'number | StringValue | undefined'
```

> Thư viện `ms` đòi định dạng cụ thể (`"15m"`, `"7d"`). Chuỗi `"mười lăm phút"` sẽ lỗi lúc **chạy** ở JS, nhưng lỗi lúc **biên dịch** ở TS.

### Cái giá phải thừa nhận

| Được | Mất |
|---|---|
| bắt lỗi lúc biên dịch | phải khai kiểu, đôi khi rườm rà |
| autocomplete chính xác | thời gian build thêm |
| refactor an toàn | học thêm cú pháp |
| decorator sinh được metadata | cần `emitDecoratorMetadata` |

> Nói thẳng: TypeScript **không miễn phí**. Nó đáng với dự án lớn và team đông; với script 100 dòng thì là gánh nặng.

---

## 6. Khi nào KHÔNG nên dùng NestJS

> **📝 Ghi chú giảng viên — phần này quan trọng để giữ tính trung thực**

| Nên dùng Nest | Nên dùng Express |
|---|---|
| team ≥ 3 người | một người làm |
| dự án sống nhiều năm | prototype, script |
| nhiều module nghiệp vụ | vài endpoint |
| cần test kỹ | không cần test nhiều |
| có người biết TypeScript | team chỉ biết JS |

> Nest có **chi phí học** thật: decorator, DI, module, lifecycle. Với một API 5 endpoint, Express nhanh hơn và dễ hơn.
>
> Câu hỏi đúng không phải *"cái nào tốt hơn"* mà là *"dự án này lớn tới đâu và sống bao lâu"*.

---

## 7. Bài tập về nhà

1. **Vẽ sơ đồ phụ thuộc.** Vẽ toàn bộ chuỗi phụ thuộc của `AuthService` trong dự án. Nest phải dựng theo thứ tự nào?

2. **Tự làm DI bằng tay.** Sửa `auth.service.js` của **Project 2** thành hàm nhận `{ prisma, matKhau }` làm tham số. Rồi viết một test dùng bản giả. So sánh công sức với `overrideProvider` của Nest.

3. **Phá vỡ container.** Xoá `@Injectable()` khỏi `MatKhauService`, chạy lại. Đọc thông báo lỗi của Nest và giải thích nó đang nói gì.

4. **Chứng minh singleton.** Thêm `console.log('tạo PrismaService')` vào constructor. Đếm số lần in ra khi khởi động. Vì sao chỉ một lần?

5. **Bỏ shutdown hooks.** Xoá `app.enableShutdownHooks()`, chạy, gửi `SIGTERM`. `onModuleDestroy` có chạy không? Nối lại bài học buổi 08.

6. **Suy nghĩ.** Viết 200 chữ trả lời: *"Với dự án hiện tại của bạn, Nest có đáng không?"* — nêu tiêu chí cụ thể, không nói chung chung.

---

## 8. Checklist kết thúc buổi

- [ ] Ba vấn đề của codebase Express khi lớn dần?
- [ ] DI đảo ngược điều gì?
- [ ] Vì sao DI làm unit test dễ hơn? Nhanh hơn bao nhiêu lần trong dự án này?
- [ ] IoC container làm ba việc gì?
- [ ] Provider mặc định có mấy instance?
- [ ] `onModuleDestroy` cần gì mới chạy được?
- [ ] TypeScript bắt được hai lỗi nào khi dựng dự án này?
- [ ] Khi nào KHÔNG nên dùng NestJS?

---

**Buổi trước:** [Buổi 27 — Docker hoá toàn bộ dự án](../phase-3/buoi-27-docker.md)
**Buổi tiếp theo:** Buổi 29 — Module, Controller, Provider
