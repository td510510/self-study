# Buổi 03 — Module system, npm, biến môi trường & CLI tool

> **Phase 0** · Cầu nối tư duy Frontend → Backend
> **Mục tiêu:** Thiết lập một dự án Node chuẩn chỉnh, hiểu cơ chế quản lý phụ thuộc, và hoàn thành sản phẩm đầu tay — Project 0.
> **Code thực hành:** [`code/buoi-03-order-cli/`](../../code/buoi-03-order-cli/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 02 |
| 15–65′ | Lý thuyết: CJS vs ESM, semver, biến môi trường |
| 65–150′ | Thực hành: xây Project 0 — CLI phân tích đơn hàng |
| 150–170′ | Debug với `--inspect` |
| 170–180′ | Bài tập về nhà & tổng kết |

---

## 1. Lý thuyết (15–65′)

### 1.1. Hai hệ module cùng tồn tại

Học viên frontend đã quen `import/export` vì bundler lo hết. Trong Node, sự thật phức tạp hơn: **có hai hệ module song song** và ta phải biết mình đang ở hệ nào.

| | CommonJS (CJS) | ES Modules (ESM) |
|---|---|---|
| Cú pháp | `require()` / `module.exports` | `import` / `export` |
| Kích hoạt | mặc định, hoặc đuôi `.cjs` | `"type": "module"`, hoặc đuôi `.mjs` |
| Nạp module | đồng bộ, lúc chạy tới dòng đó | bất đồng bộ, phân tích trước khi chạy |
| Đường dẫn import | được phép bỏ đuôi `.js` | **bắt buộc** ghi đủ `./file.js` |
| Đường dẫn file hiện tại | `__dirname`, `__filename` | không có sẵn — phải tự dựng |
| Top-level `await` | ❌ | ✅ |

Dựng lại `__dirname` trong ESM:

```js
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Node 20.11+ có sẵn cách ngắn hơn:
// const __dirname = import.meta.dirname;
```

> **📝 Ghi chú giảng viên**
> Khuyến nghị dùng **ESM** cho toàn khoá học: đó là hướng đi tương lai, và giống hệt cú pháp học viên đã quen ở frontend.
> Nhưng **bắt buộc phải dạy CJS** vì rất nhiều thư viện và code cũ vẫn dùng. Học viên sẽ gặp lỗi `"Cannot use import statement outside a module"` ngay tuần đầu nếu không hiểu — hãy cố tình tạo ra lỗi này tại lớp một lần cho họ nhớ.

**Tiền tố `node:`** — từ nay luôn viết `import { readFile } from 'node:fs/promises'` thay vì `'fs/promises'`. Lý do: nói rõ đây là module lõi của Node, không phải package trên npm. Tránh được cả một lớp tấn công gọi là *dependency confusion* (sẽ nói ở buổi 22).

### 1.2. Semver — ba con số quyết định dự án của bạn có sập không

Định dạng `MAJOR.MINOR.PATCH`, ví dụ `4.18.2`:

- **MAJOR** tăng khi có **breaking change** — nâng lên là code cũ có thể hỏng.
- **MINOR** tăng khi thêm tính năng mới, vẫn tương thích ngược.
- **PATCH** tăng khi sửa lỗi.

Ký hiệu trong `package.json`:

| Ký hiệu | Cho phép | Ghi chú |
|---|---|---|
| `^4.18.2` | mọi bản `4.x.x` mới hơn | **mặc định của npm** |
| `~4.18.2` | chỉ `4.18.x` | chặt chẽ hơn |
| `4.18.2` | đúng bản đó | khoá cứng |

Và đây là lý do **`package-lock.json`** tồn tại: nó ghi lại *chính xác* phiên bản đã cài, cho đến từng dependency lồng sâu nhất.

> **Luôn commit `package-lock.json`.** Nó là lời giải cho câu than phiền kinh điển *"nhưng nó chạy được trên máy tôi mà"*.

Câu hỏi hỏi lớp: *"Nếu ai cũng dùng `^`, tại sao dự án vẫn hỏng khi đồng đội `npm install`?"*
→ Vì `^` cho phép cài bản mới hơn. Người cài hôm nay có thể nhận `4.19.0` trong khi bạn đang dùng `4.18.2`. `package-lock.json` chặn điều đó.

### 1.3. Biến môi trường — ranh giới giữa code và cấu hình

**Nguyên tắc bất di bất dịch: code đi lên Git, cấu hình thì không.**

Mật khẩu database, khoá bí mật JWT, API key của bên thứ ba — tất cả nằm ở biến môi trường.

Node 20.6+ đọc file `.env` sẵn, **không cần cài thư viện `dotenv`**:

```bash
node --env-file=.env src/app.js

# Đặt biến trực tiếp cho một lần chạy (Linux/macOS/Git Bash)
PORT=4000 node src/app.js
```

> **⚠️ Quy tắc không bao giờ được phá**
> `.env` phải nằm trong `.gitignore` **ngay từ commit đầu tiên**. Kèm theo đó là `.env.example` có đủ tên biến nhưng giá trị rỗng hoặc giả, để đồng đội biết cần khai báo những gì.
>
> Lộ khoá bí mật lên GitHub công khai là **sự cố bảo mật phổ biến nhất với người mới** — bot quét repo mới trong vòng vài chục giây, không phải vài ngày.

---

## 2. Thực hành — Project 0: CLI phân tích đơn hàng (65–150′)

Sản phẩm: công cụ dòng lệnh đọc file JSON đơn hàng, lọc và thống kê, in báo cáo ra terminal hoặc ghi ra file. **Không framework, không thư viện ngoài.**

Code đầy đủ: [`code/buoi-03-order-cli/`](../../code/buoi-03-order-cli/)

### Cấu trúc thư mục

```
order-cli/
├── package.json
├── .env            ← KHÔNG commit
├── .env.example    ← CÓ commit
├── .gitignore
├── data/
│   └── orders.json
└── src/
    ├── cli.js      ← điểm vào: parse tham số, điều phối, xử lý lỗi cuối cùng
    ├── loader.js   ← đọc & kiểm tra dữ liệu (chạm I/O)
    ├── report.js   ← logic nghiệp vụ THUẦN
    └── format.js   ← trình bày ra terminal
```

> **💡 Đối chiếu Frontend**
> Cách chia file này giống hệt nguyên tắc tách **component trình bày** khỏi **logic nghiệp vụ** mà học viên đã quen.
> `report.js` là hàm thuần — không đọc file, không in màn hình, không đụng `process.env`. **Vào là dữ liệu, ra là dữ liệu.** Nên test được mà không cần chạy cả chương trình.
> Nguyên tắc này theo ta suốt khoá, đến tận tầng **Service** của NestJS ở buổi 34.

### Bước 1 — Khởi tạo (65–75′)

```bash
mkdir order-cli && cd order-cli
npm init -y
npm pkg set type="module"
mkdir src data
printf ".env\nnode_modules/\n" > .gitignore
```

Dừng lại giải thích `npm pkg set type="module"` — lệnh này sửa `package.json` từ dòng lệnh, thay vì mở file sửa tay.

### Bước 2 — Tầng đọc dữ liệu: `loader.js` (75–95′)

Điểm dạy quan trọng nhất của file này là **lớp lỗi riêng**:

```js
export class DataError extends Error {
  constructor(message, { cause } = {}) {
    super(message, { cause });
    this.name = 'DataError';
  }
}
```

**Vì sao cần?** Để tầng trên phân biệt được *"lỗi mình đã lường trước"* với *"bug thật sự"*. File không tồn tại là chuyện bình thường — báo cho người dùng một dòng gọn gàng. Còn lỗi lạ thì phải in cả stack trace để còn debug.

Pattern này ta dùng lại **xuyên suốt khoá học**, đến tận Exception Filter của NestJS ở buổi 35.

Chú ý cách bắt lỗi theo `err.code`:

```js
try {
  raw = await readFile(abs, 'utf8');
} catch (err) {
  if (err.code === 'ENOENT') throw new DataError(`Không tìm thấy file: ${abs}`, { cause: err });
  if (err.code === 'EACCES') throw new DataError(`Không có quyền đọc: ${abs}`, { cause: err });
  throw err;   // lỗi lạ thì để nó nổi lên, ĐỪNG NUỐT
}
```

> **📝 Ghi chú giảng viên**
> Nhấn mạnh dòng `throw err;` cuối cùng. Người mới rất hay viết `catch (err) { console.log('có lỗi') }` rồi đi tiếp — **nuốt lỗi**. Đây là thói quen tệ nhất trong nghề backend: hệ thống hỏng lặng lẽ, không ai biết, dữ liệu sai âm thầm.
> Quy tắc: **hoặc xử lý được lỗi, hoặc để nó nổi lên.** Không có lựa chọn thứ ba.

Còn một điểm nữa — kiểm tra dữ liệu ngay khi nạp:

```js
parsed.forEach((o, i) => {
  if (typeof o.total !== 'number' || Number.isNaN(o.total)) {
    throw new DataError(`Đơn hàng thứ ${i} (${o.id ?? 'không rõ id'}) có total không hợp lệ`);
  }
});
```

**Thà chết sớm với thông báo rõ ràng, còn hơn cho ra báo cáo sai lặng lẽ.** Nguyên tắc *fail fast* — quay lại ở buổi 38 (validate biến môi trường lúc khởi động).

### Bước 3 — Logic nghiệp vụ thuần: `report.js` (95–110′)

Bốn hàm, không hàm nào chạm I/O: `filterByStatus`, `summarize`, `topCustomers`, `groupByStatus`.

Đây là phần học viên frontend làm nhanh nhất — chỉ là `map`/`filter`/`reduce` quen thuộc. Hãy để họ tự viết, đừng đọc code hộ.

### Bước 4 — Trình bày: `format.js` (110–120′)

Giới thiệu **mã màu ANSI** — cách tô màu chữ trong terminal:

```js
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
```

Và `Intl.NumberFormat` để format tiền tệ Việt Nam — API này có sẵn cả ở browser lẫn Node, học viên đã quen.

### Bước 5 — Điểm vào: `cli.js` (120–145′)

Điểm dạy: **`process.argv`**.

```js
// process.argv = [đường dẫn node, đường dẫn script, ...tham số thật]
// Ta tự parse để hiểu bản chất; ở dự án thật sẽ dùng commander/yargs.
```

Cho học viên chạy `node -e "console.log(process.argv)" a b c` để thấy tận mắt cấu trúc mảng này.

Thứ tự ưu tiên cấu hình — quy ước chuẩn của mọi công cụ CLI chuyên nghiệp:

```
tham số dòng lệnh  >  biến môi trường  >  giá trị mặc định
```

```js
const top = Number(args.top ?? process.env.DEFAULT_TOP ?? 3);
```

Và cuối cùng, **bộ bắt lỗi cấp cao nhất**:

```js
main().catch((err) => {
  if (err instanceof DataError) {
    console.error(`\n✖ ${err.message}\n`);   // lỗi lường trước: gọn gàng
    process.exit(1);
  }
  console.error('\n✖ Lỗi không mong đợi:\n', err);   // bug thật: in đủ
  process.exit(2);
});
```

### Bước 6 — Chạy thử (145–150′)

```bash
cp .env.example .env
npm start
node --env-file=.env src/cli.js --status=paid --top=2
node --env-file=.env src/cli.js --out=bao-cao.txt
node --env-file=.env src/cli.js --status=xyz     # không có đơn nào
node --env-file=.env src/cli.js --sai=1          # xem thông báo lỗi

# Kiểm chứng exit code
echo $?
```

Kết quả thật:

```
BÁO CÁO ĐƠN HÀNG — lọc: paid
──────────────────────────────────────────────
Số đơn          : 4
Tổng sản phẩm   : 23
Doanh thu       : 5.440.000 ₫
Giá trị TB/đơn  : 1.360.000 ₫

Theo trạng thái
  paid           4

Khách hàng hàng đầu
  1. Mai Anh             2.340.000 ₫ (2 đơn)
  2. Thu Hà              2.340.000 ₫ (1 đơn)
```

> **📝 Ghi chú giảng viên — đừng bỏ qua exit code**
> Chạy `echo $?` sau **cả** trường hợp thành công lẫn thất bại để học viên thấy tận mắt: `0` và `1`.
>
> Frontend dev gần như chưa bao giờ quan tâm khái niệm này, nhưng nó là cách **duy nhất** để mọi hệ thống tự động — CI, cron, Docker, Kubernetes — biết chương trình của bạn chạy có ổn không.
> Ở buổi 40, khi viết GitHub Actions, cả pipeline sẽ dựa vào đúng con số này để quyết định pass hay fail.

---

## 3. Debug đúng cách (150–170′)

```bash
# Dừng ngay dòng đầu tiên và chờ debugger gắn vào
node --inspect-brk --env-file=.env src/cli.js --status=paid
# → mở Chrome, vào chrome://inspect, bấm "inspect"
```

Hoặc VS Code: nhấn **F5** (repo đã có sẵn `.vscode/launch.json`).

Cho học viên đặt breakpoint trong `topCustomers` và quan sát `byCustomer` lớn dần qua từng vòng lặp.

> **Thông điệp:** từ giờ trở đi, *debugger là công cụ chính, `console.log` chỉ là phương án phụ.*

---

## 4. Bài tập về nhà

1. **Lọc theo ngày.** Thêm `--from=2026-07-05` và `--to=2026-07-11`. Nhớ kiểm tra định dạng ngày và báo lỗi rõ ràng nếu sai.
2. **Xuất JSON.** Thêm `--format=json|text`. Khi chọn `json`, in ra JSON thuần để công cụ khác đọc được — đây là cách các CLI chuyên nghiệp phối hợp với nhau.
3. **Kiểm thử lỗi.** Tự tạo `data/orders-broken.json` với **ba loại lỗi** khác nhau (không phải JSON, không phải mảng, `total` là chuỗi). Kiểm chứng CLI báo đúng lỗi và trả exit code `1` cho cả ba.
4. **Viết README.** Đủ để một người lạ clone về là chạy được ngay: yêu cầu môi trường, cách cài, cách chạy, bảng mô tả tham số.

---

## 5. Checklist kết thúc buổi

- [ ] Khác nhau giữa CJS và ESM? Làm sao bật ESM?
- [ ] `^4.18.2` cho phép cài những phiên bản nào?
- [ ] Vì sao phải commit `package-lock.json` nhưng không được commit `.env`?
- [ ] `process.argv[0]` và `process.argv[1]` là gì?
- [ ] Exit code `0` và khác `0` khác nhau thế nào? Ai đọc con số đó?
- [ ] Vì sao `report.js` không được phép gọi `readFile`?

---

**Buổi trước:** [Buổi 02 — Node.js runtime & Event Loop](./buoi-02-event-loop.md)
**Buổi tiếp theo:** Buổi 04 — Dựng HTTP server bằng tay *(Phase 1)*

---

## 🎓 Kết thúc Phase 0

Học viên giờ đã có:
- Hiểu HTTP là văn bản, stateless, và server là một tiến trình đang chạy
- Hiểu Event Loop và biết vì sao không được chặn nó
- Một dự án Node hoàn chỉnh, chạy được, có xử lý lỗi và exit code đúng chuẩn

**Phase 1 bắt đầu:** dựng HTTP server bằng Node thuần — và tự tay viết mọi thứ mà Express sẽ làm hộ ở Phase 2.
