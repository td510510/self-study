# Buổi 12–13 — PostgreSQL & Prisma

Giáo án: [buổi 12 — schema & migration](../../giao-an/phase-2/buoi-12-prisma-postgres.md) · [buổi 13 — CRUD & relations](../../giao-an/phase-2/buoi-13-prisma-crud-relations.md)

## Chạy

```bash
docker compose up -d          # Postgres :5433 + Adminer :8081
cp .env.example .env
npm install
npx prisma migrate dev        # dựng bảng
npx prisma generate           # sinh client

node src/01-crud-co-ban.js
node src/02-relations-va-n1.js

PRISMA_LOG=query node src/01-crud-co-ban.js   # xem SQL sinh ra
npx prisma studio                              # giao diện xem dữ liệu
```

Dọn dẹp:

```bash
docker compose down       # dừng, GIỮ dữ liệu
docker compose down -v    # dừng, XOÁ SẠCH dữ liệu
```

## ⚠️ Prisma 7 khác hẳn tài liệu cũ trên mạng

**1. Chuỗi kết nối không còn ở `schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // ❌ Prisma 7: P1012
}
```

Nó chuyển sang `prisma.config.ts`:

```ts
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: process.env['DATABASE_URL'] },
});
```

**2. Generator mặc định sinh TypeScript.** Dự án JS thuần dùng:

```prisma
generator client { provider = "prisma-client-js" }
```

**3. Cần driver adapter để kết nối trực tiếp:**

```js
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
```

**4. Tên cột vi phạm unique nằm ở chỗ khác:**

```
err.meta.target       = undefined      ← mọi tài liệu cũ nói ở đây
chỗ THẬT (Prisma 7)   = [ 'email' ]
```

```js
err.meta?.driverAdapterError?.cause?.constraint?.fields
```

## Kết quả đo thật — vấn đề N+1

30 user × 5 todo:

```
❌ vòng lặp gọi findMany cho từng user     31 query    59ms
✅ include — Prisma tự gộp                  2 query    11ms
✅ select chỉ cột cần                       2 query     5ms
```

**Gấp 16 lần.** Với 1000 user thì là 1001 query so với 2.

`src/02-relations-va-n1.js` **đếm số query thật** qua `prisma.$on('query')`, nên N+1 là con số trên màn hình chứ không phải lý thuyết.

## Mã lỗi Prisma → HTTP

| Mã | Nghĩa | HTTP |
|---|---|---|
| `P2002` | trùng unique | `409` |
| `P2025` | không tìm thấy | `404` |
| `P2003` | vi phạm khoá ngoại | `400` |

## Lỗi hay gặp khi khởi động

**Cổng đã bị chiếm:**

```
Bind for 0.0.0.0:8080 failed: port is already allocated
```

Đổi **số bên trái** trong `docker-compose.yml` (`'8081:8080'`).

**`migrate dev` vs `migrate deploy`:**

| Lệnh | Dùng ở | |
|---|---|---|
| `migrate dev` | máy lập trình viên | sinh migration mới, **có thể reset DB** |
| `migrate deploy` | staging/production | chỉ chạy migration có sẵn |

> ⚠️ Chạy `migrate dev` trên production có thể **xoá sạch database**.
