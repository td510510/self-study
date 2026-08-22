// Prisma 7 — chuỗi kết nối khai ở ĐÂY, không còn trong schema.prisma nữa.
//
// Vì sao Prisma đổi? Vì file config là JavaScript/TypeScript thật,
// nên đọc được biến môi trường, secret manager, hay logic bất kỳ —
// điều mà cú pháp schema.prisma không làm được.
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
