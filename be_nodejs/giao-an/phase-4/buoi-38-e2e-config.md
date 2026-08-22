# Buổi 38 — E2E test & Config module

> **Phase 4** · NestJS
> **Mục tiêu:** Kiểm thử toàn bộ luồng thật qua HTTP, và quản lý cấu hình đúng chuẩn 12-factor.
> **Code:** [`test/api.e2e-spec.ts`](../../code/project-04-nestjs/test/api.e2e-spec.ts) · [`src/app.module.ts`](../../code/project-04-nestjs/src/app.module.ts)

---

## Dòng thời gian

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 37 |
| 15–70′ | **E2E test: dựng app thật, database riêng** |
| 70–105′ | Bẫy: `main.ts` không chạy trong test |
| 105–155′ | **ConfigModule & validate biến môi trường** |
| 155–175′ | Quản lý bí mật |
| 175–180′ | Bài tập |

---

## 1. E2E test (15–70′)

```ts
const moduleRef: TestingModule = await Test.createTestingModule({
  imports: [AppModule],       // ← TOÀN BỘ ứng dụng
}).compile();

app = moduleRef.createNestApplication();
await app.init();

prisma = app.get(PrismaService);
```

> Khác hẳn unit test: ở đây ta dựng **toàn bộ IoC container** — DI, guard, pipe, filter đều **thật**.
>
> Nhờ vậy test đúng thứ chạy ở production.

### `app.init()` chứ không `app.listen()`

> `init()` dựng app nhưng **không mở cổng**. `supertest` gọi trực tiếp qua `app.getHttpServer()`.
>
> Lợi ích: không xung đột cổng, chạy song song nhiều file test được (nếu database cho phép).

### Database test riêng

```bash
docker exec nest-postgres psql -U shop -d shop_nest -c "CREATE DATABASE shop_nest_test;"
DATABASE_URL="...shop_nest_test..." npx prisma migrate deploy
```

```json
"test:e2e": "cross-env NODE_ENV=test jest --config ./test/jest-e2e.json --runInBand --forceExit"
```

Ba cờ, ba lý do:

| Cờ | Vì sao |
|---|---|
| `NODE_ENV=test` | `ConfigModule` đọc `.env.test` thay vì `.env` |
| `--runInBand` | chạy **tuần tự** — nối buổi 19: file test song song xoá dữ liệu của nhau |
| `--forceExit` | thoát dù còn handle mở |

> **⚠️ `--forceExit` là dấu hiệu có handle chưa đóng.** Nó che giấu vấn đề chứ không sửa. Bài tập số 3 là tìm và đóng handle đó.

Và `.env.test` đặt `BCRYPT_COST=4`:

> Test nhanh gấp **256 lần** ở khâu băm (buổi 15: cost tăng 1 → chậm gấp đôi; 12 → 4 là giảm 8 bậc = 2⁸).

---

## 2. Bẫy: `main.ts` không chạy trong test (70–105′)

> **📝 Ghi chú giảng viên — điểm yếu thật của Nest, phải nói thẳng**

```ts
// test/api.e2e-spec.ts — phải LẶP LẠI cấu hình của main.ts
app.useGlobalPipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
);
app.useGlobalFilters(new BoLocLoiToanCuc());
```

**Vì sao?** `Test.createTestingModule` dựng `AppModule`, **không** chạy `main.ts`. Mọi thứ đăng ký trong `main.ts` — pipe, filter, interceptor, helmet, CORS — **không tồn tại** trong test.

**Hậu quả:** cấu hình dễ **lệch** giữa test và production. Test xanh nhưng production hỏng, hoặc ngược lại.

**Cách sửa — tách hàm dùng chung:**

```ts
// src/cau-hinh-app.ts
export function capHinhApp(app: INestApplication) {
  app.use(helmet());
  app.enableCors({ ... });
  app.useGlobalPipes(new ValidationPipe({ ... }));
  app.useGlobalFilters(new BoLocLoiToanCuc());
  app.enableShutdownHooks();
}
```

```ts
// main.ts          → capHinhApp(app);
// api.e2e-spec.ts  → capHinhApp(app);
```

> **Nguyên tắc chung: cấu hình lặp lại ở hai nơi thì sớm muộn cũng lệch.** Tách ra một nguồn sự thật.
>
> Cách khác: đăng ký toàn cục qua `APP_PIPE` / `APP_FILTER` trong `AppModule` — khi đó chúng **là một phần của module** và tự có trong test.

---

## 3. ConfigModule & validate biến môi trường (105–155′)

```ts
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().uri().required(),
    JWT_ACCESS_SECRET: Joi.string().min(16).required(),
    JWT_REFRESH_SECRET: Joi.string().min(16).required(),
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    BCRYPT_COST: Joi.number().min(4).max(15).default(12),
    LOG_LEVEL: Joi.string().default('info'),
    ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  }),
  validationOptions: { abortEarly: false },
})
```

### Fail fast — nối lại buổi 03

> Thiếu `JWT_ACCESS_SECRET` → **ứng dụng không khởi động**, kèm thông báo rõ ràng.
>
> Không có validate: ứng dụng khởi động bình thường, rồi request đầu tiên cần ký token thì lỗi khó hiểu — có thể là **3 giờ sáng**.

`abortEarly: false` → báo **hết** lỗi cùng lúc, không phải sửa từng cái một.

### Ràng buộc có ý nghĩa nghiệp vụ

| Ràng buộc | Vì sao |
|---|---|
| `JWT_ACCESS_SECRET.min(16)` | secret ngắn dễ bị dò (buổi 15) |
| `BCRYPT_COST.min(4).max(15)` | dưới 4 là không an toàn; trên 15 là đăng nhập quá chậm |
| `DATABASE_URL.uri()` | bắt lỗi gõ nhầm định dạng ngay |

> **📝 Ghi chú giảng viên**
> Chỉ ra: đây **không** chỉ là kiểm tra "có tồn tại không". Nó mã hoá **kiến thức bảo mật** thành ràng buộc máy kiểm được.
>
> Người mới vào dự án đặt `BCRYPT_COST=1` cho nhanh sẽ bị **chặn ngay**, không cần ai review.

### `getOrThrow` thay vì `get`

```ts
config.getOrThrow<string>('DATABASE_URL')   // ✅ kiểu là string
config.get<string>('DATABASE_URL')          // ❌ kiểu là string | undefined
```

> `getOrThrow` vừa an toàn hơn vừa cho kiểu chặt hơn — không phải viết `!` hay `?? ''`.

---

## 4. Quản lý bí mật (155–175′)

| Môi trường | Cách làm |
|---|---|
| Máy dev | `.env` (trong `.gitignore`) |
| CI | secrets của CI (buổi 40) |
| Production | secret manager của nền tảng, **không** phải file |

> **⚠️ Nhắc lại buổi 03 và 27:**
> - `.env` **không bao giờ** commit
> - `.env.example` **có** commit, giá trị rỗng hoặc giả
> - `.env` **không bao giờ** vào ảnh Docker (`.dockerignore`)
>
> Ảnh Docker được đẩy lên registry — ai kéo được ảnh là đọc được **mọi** file trong đó, kể cả file đã xoá ở tầng sau.

### Tách config theo namespace (khi dự án lớn)

```ts
export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
}));
```

```ts
constructor(@Inject(databaseConfig.KEY) private cfg: ConfigType<typeof databaseConfig>) {}
```

> Được **kiểu dữ liệu** cho config thay vì chuỗi tự do. Đáng làm khi có trên ~15 biến.

---

## 5. Nghiệm thu

```
Unit test :  9 passed —  1.075 s
E2E test  : 18 passed —  9.956 s
```

E2E canh giữ:

| Nhóm | Kiểm chứng |
|---|---|
| Health | kiểm cả phụ thuộc, không chỉ tiến trình; có `X-Request-Id` |
| ValidationPipe | gộp nhiều lỗi; **chống mass assignment**; trim + lowercase; `ParseIntPipe` |
| Bảo mật | không lộ hash; thông điệp lỗi giống nhau; email trùng → 409 |
| Guard | 401 vs 403; **Guard trước Pipe** |
| Sản phẩm | lọc; P2002 → 409; **xoá mềm** |

---

## 6. Bài tập về nhà

1. **Tách `capHinhApp`.** Gom cấu hình toàn cục vào một hàm dùng chung cho `main.ts` và test. Viết test chứng minh helmet đang hoạt động trong e2e (hiện tại thì **không**).

2. **Đăng ký qua `APP_PIPE`.** Chuyển `ValidationPipe` sang provider `APP_PIPE` trong `AppModule`. So sánh với cách gọi trong `main.ts` — cách nào ít lệch hơn?

3. **Chứng minh fail fast.** Xoá `JWT_ACCESS_SECRET` khỏi `.env`, khởi động. Chụp thông báo lỗi. Rồi đặt secret dài 5 ký tự và thử lại.

4. **Tìm handle chưa đóng.** Bỏ `--forceExit`, chạy `--detectOpenHandles`. Handle nào giữ tiến trình? Đóng nó cho đúng. (Nối buổi 08 và 21.)

5. **Dọn dữ liệu giữa các test.** Hiện tại chỉ dọn ở `beforeAll`/`afterAll`, nên test phụ thuộc thứ tự. Chuyển sang dọn mỗi test. Test có chậm đi nhiều không? Đánh đổi có đáng?

6. **Nâng cao — testcontainers.** Dùng `@testcontainers/postgresql` để mỗi lần chạy test tự dựng một Postgres riêng rồi xoá. Được gì, mất gì so với database test cố định?

---

## 7. Checklist

- [ ] `Test.createTestingModule({ imports: [AppModule] })` dựng những gì?
- [ ] Vì sao dùng `app.init()` chứ không `app.listen()`?
- [ ] Ba cờ của lệnh `test:e2e` mỗi cờ giải quyết gì?
- [ ] `--forceExit` là dấu hiệu của điều gì?
- [ ] Vì sao cấu hình trong `main.ts` không có trong test? Hai cách sửa?
- [ ] `validationSchema` giúp gì? `abortEarly: false` để làm gì?
- [ ] Vì sao ràng buộc `BCRYPT_COST.min(4)` có ý nghĩa nghiệp vụ?
- [ ] `getOrThrow` hơn `get` ở hai điểm nào?
- [ ] Bí mật ở production nên lưu ở đâu?

---

**Buổi trước:** [Buổi 37 — Unit test với mock DI](./buoi-37-unit-test-mock-di.md)
**Buổi tiếp theo:** Buổi 39 — Swagger & tổng kết Project 4
