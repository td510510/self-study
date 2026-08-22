# Bài 06 — Decorator

> **Nhóm:** Structural (Cấu trúc)
> **Một câu:** Thêm hành vi cho một object mà không sửa class gốc, và **xếp chồng được**.

---

## 1. Cái đau

Bạn có `DichVuAPI.layNguoiDung(id)`. Rồi lần lượt các yêu cầu đến:

- "Thêm cache đi, gọi API nhiều quá."
- "Thêm retry, mạng hay rớt."
- "Ghi log mỗi lần gọi."
- "Đo thời gian phản hồi."
- "Giới hạn 100 request/phút."

Nếu nhét hết vào một class:

```js
class DichVuAPI {
  async layNguoiDung(id) {
    // 8 dòng đo thời gian
    // 12 dòng kiểm tra cache
    // 15 dòng vòng lặp retry
    // 5 dòng ghi log
    // 10 dòng rate limit
    // ...và 3 dòng gọi API thật
  }
}
```

Ba vấn đề:

1. Class làm 6 việc — sửa cái này vỡ cái kia.
2. Không tắt riêng lẻ được. Môi trường dev không muốn cache, làm sao?
3. Muốn thêm cache cho `laySanPham()` → copy paste 12 dòng đó lần nữa.

**Cách tiếp cận sai mà người mới hay chọn:** kế thừa.
`DichVuAPICoCache extends DichVuAPI`, rồi `DichVuAPICoCacheVaRetry extends DichVuAPICoCache`…
Với 5 tính năng, để phủ hết mọi tổ hợp bạn cần **2⁵ = 32 class**. Kế thừa **không tổ hợp được**.

---

## 2. Ý tưởng: bọc như bọc củ hành

```mermaid
graph LR
    A["Gọi:<br/>layNguoiDung(7)"] --> L["🪵 Log"]
    L --> R["🔁 Retry"]
    R --> C["💾 Cache"]
    C --> API["🌐 API thật"]
    API -.trả về.-> C
    C -.-> R
    R -.-> L
    L -.-> A

    style API fill:#7f1d1d,color:#fff
```

Mỗi lớp bọc:
- **có cùng interface** với thứ nó bọc (rất quan trọng — đây là điều phân biệt với Adapter),
- làm việc của mình *trước* và/hoặc *sau*,
- rồi **ủy thác** cho lớp bên trong.

```js
let dichVu = new DichVuAPIThat();
dichVu = new CacheDecorator(dichVu);
dichVu = new RetryDecorator(dichVu);
dichVu = new LogDecorator(dichVu);

await dichVu.layNguoiDung(7);   // gọi y hệt như ban đầu
```

Code sử dụng **không biết** mình đang cầm 4 lớp bọc hay object trần. Đó là toàn bộ sức mạnh.

---

## 3. Thứ tự bọc rất quan trọng — hãy dạy kỹ phần này

Đây là điều hay bị bỏ qua nhưng gây bug thật trong dự án.

```
Cache ở NGOÀI retry:            Cache ở TRONG retry:
  Cache → Retry → API             Retry → Cache → API

  Gặp cache hit  → không          Gặp cache hit  → vẫn qua tầng retry
  chạm tới retry (nhanh)          (thừa một tầng, nhưng vô hại)

  Retry thất bại → KHÔNG          Retry thất bại → không lưu cache
  lưu cache lỗi                   (giống nhau)

  ⚠️ Nếu cache lưu cả kết quả lỗi thì hỏng — cache phải chỉ lưu thành công
```

Quy tắc thực dụng để học viên nhớ:

> Xếp từ **ngoài vào trong** theo thứ tự: **quan sát → điều tiết → tăng tốc → thực thi**
> (Log → RateLimit → Retry → Cache → API thật)

Vì sao Log ngoài cùng? Vì bạn muốn log *tổng thời gian thật sự người dùng chờ*, kể cả thời gian
chờ retry.

---

## 4. Decorator trong JavaScript: ba mức độ

### Mức 1 — Class decorator (giống sách GoF, dễ mapping với UML)

```js
class CacheDecorator {
  constructor(boc) { this.boc = boc; this.cache = new Map(); }
  async layNguoiDung(id) {
    if (this.cache.has(id)) return this.cache.get(id);
    const kq = await this.boc.layNguoiDung(id);
    this.cache.set(id, kq);
    return kq;
  }
}
```

❌ Nhược điểm: phải viết lại **mọi** phương thức, kể cả những cái không cần trang trí.

### Mức 2 — Higher-order function (rất JavaScript)

```js
const themCache = (fn) => {
  const cache = new Map();
  return async (...args) => {
    const khoa = JSON.stringify(args);
    if (!cache.has(khoa)) cache.set(khoa, await fn(...args));
    return cache.get(khoa);
  };
};

const layNguoiDung = themLog(themRetry(themCache(layNguoiDungGoc)));
```

Ngắn hơn nhiều, và **tổ hợp tự do**. Đây là cách bạn sẽ gặp trong code JS thật.

### Mức 3 — `Proxy` của JS (trang trí *mọi* phương thức cùng lúc)

```js
const themLogChoMoiHam = (obj) =>
  new Proxy(obj, {
    get(dich, ten) {
      const goc = dich[ten];
      if (typeof goc !== "function") return goc;
      return (...args) => {
        console.log(`→ gọi ${ten}`);
        return goc.apply(dich, args);
      };
    },
  });
```

Giải quyết đúng nhược điểm của Mức 1. Chi tiết ở [Bài 08 — Proxy](08-proxy.md).

---

## 5. Code

```bash
node src/06-decorator/demo.js
```

---

## 6. Ví dụ có thật ngoài đời

- **Express middleware** — chính là Decorator xâu chuỗi ([Bài 14](14-middleware.md)).
- **React HOC** — `withRouter(withTheme(Component))`.
- **Node.js Streams** — `readStream.pipe(gunzip).pipe(parser)`.
- **Redux middleware** — `applyMiddleware(thunk, logger)`.

Chỉ ra những cái này giúp học viên nhận ra họ **đã dùng** Decorator rồi mà không biết tên.

---

## 7. Bẫy thường gặp

1. **Decorator đổi interface** → đó là Adapter, không phải Decorator. Decorator **phải** giữ
   nguyên chữ ký hàm, nếu không mọi thứ bên ngoài sẽ vỡ.

2. **Xếp chồng quá sâu → debug khổ.** Stack trace 12 tầng bọc rất khó đọc. Giữ số lớp ≤ 4–5,
   và đặt tên class/hàm rõ ràng để nhìn stack là biết tầng nào.

3. **Decorator có trạng thái bị chia sẻ nhầm.** Nếu `CacheDecorator` là singleton toàn cục,
   người dùng A sẽ thấy dữ liệu của người dùng B. Bug bảo mật thật, đã xảy ra ở nhiều nơi.

4. **Cache lưu cả kết quả lỗi.** Một lần lỗi mạng bị cache 5 phút → người dùng thấy lỗi 5 phút
   dù hệ thống đã hồi phục.

5. **Quên rằng decorator làm `instanceof` thất bại.** `boc instanceof DichVuAPIThat` là `false`.
   Đừng dựa vào `instanceof` khi có decorator.

---

## 8. Bài tập

📂 `src/06-decorator/bai-tap.js`

**Đề:** Có `KhoDuLieu` với `layNguoiDung(id)` gọi "API" chậm 100ms và **thất bại ngẫu nhiên
40%** (dùng seed cố định để test lặp lại được).

**Yêu cầu — viết bằng higher-order function:**

1. `themCache(fn)` — nhớ kết quả theo tham số. **Chỉ cache khi thành công.**
2. `themRetry(fn, soLan)` — thử lại, có backoff tăng dần.
3. `themDoThoiGian(fn, ten)` — đo và ghi lại thời gian.
4. `themGioiHan(fn, max)` — quá `max` lời gọi đang chạy thì ném lỗi.
5. Xếp chồng đúng thứ tự, chứng minh qua bộ test có sẵn:
   - gọi cùng một `id` 3 lần → API thật chỉ bị gọi 1 lần,
   - lỗi tạm thời được retry qua,
   - lỗi **không** bị cache.
6. **Nâng cao:** viết `themCache` có TTL (hết hạn sau N ms) và giới hạn số phần tử (LRU).

Lời giải: `src/06-decorator/loi-giai.js`

---

## 9. Kiểm tra nhanh

1. Vì sao kế thừa không thay thế được Decorator? (nhắc tới con số 2ⁿ)
2. Điều gì phân biệt Decorator với Adapter?
3. Vì sao Log nên ở lớp ngoài cùng?
4. Nêu hai lý do cache **không** được lưu kết quả lỗi.
5. Kể tên hai thư viện bạn đã dùng mà thực chất là Decorator.

---

⬅️ [05 — Adapter](05-adapter.md) | ➡️ [07 — Facade](07-facade.md)
