# Bài 13 — Module

> **Nhóm:** Đặc thù JavaScript
> **Một câu:** Đóng gói cái gì **riêng tư**, cái gì **công khai** — pattern gốc rễ của JavaScript.

---

## 1. Vì sao bài này quan trọng với người mới

Trước ES6, JavaScript **không có** `private`, không có namespace, không có `import`. Mọi biến
khai báo ở cấp cao nhất đều rơi vào `window` — và hai thư viện dùng chung một tên biến là
xung đột.

Module Pattern ra đời để chữa việc đó, bằng **closure**. Hiểu nó là hiểu closure — thứ nền tảng
nhất của JS mà người mới hay né tránh.

---

## 2. Cái đau

```js
// analytics.js
var soLuotXem = 0;
function ghiNhan() { soLuotXem++; }

// gio-hang.js  ← lập trình viên khác, không biết file kia tồn tại
var soLuotXem = 0;     // 💥 ghi đè biến của file trên
```

Và bất kỳ ai cũng sửa được `soLuotXem = 999999` từ console trình duyệt.

---

## 3. Ý tưởng: IIFE + closure

```js
const Analytics = (function () {
  // ---- RIÊNG TƯ: không ai bên ngoài chạm được ----
  let soLuotXem = 0;
  const KHOA_API = "secret-123";

  function guiLenServer(dl) { /* ... */ }

  // ---- CÔNG KHAI: chỉ những gì trả về ----
  return {
    ghiNhan() { soLuotXem++; guiLenServer({ soLuotXem }); },
    layThongKe() { return { soLuotXem }; },
  };
})();

Analytics.ghiNhan();
Analytics.soLuotXem;   // undefined — không truy cập được ✅
```

```
┌──────────────── Phạm vi closure ────────────────┐
│  soLuotXem      ← riêng tư                       │
│  KHOA_API       ← riêng tư                       │
│  guiLenServer() ← riêng tư                       │
│                                                  │
│  return { ghiNhan, layThongKe }  ──────────────┐ │
└────────────────────────────────────────────────┼─┘
                                                 ▼
                                      Bên ngoài chỉ thấy 2 hàm này
```

**IIFE** (Immediately Invoked Function Expression) = hàm chạy ngay lập tức, tạo ra một phạm vi
đóng kín. Những gì khai báo bên trong sống mãi (vì các hàm trả về vẫn tham chiếu tới chúng),
nhưng bên ngoài không có đường nào chạm tới.

---

## 4. Ba biến thể

| Biến thể | Đặc điểm |
|---|---|
| **Module** | IIFE trả về object — một instance duy nhất |
| **Revealing Module** | Định nghĩa mọi thứ ở trong, cuối cùng "phơi bày" một số cái ra |
| **Factory Module** | Không IIFE, là hàm bình thường → tạo được **nhiều instance**, mỗi cái có dữ liệu riêng |

Biến thể thứ ba quan trọng nhất trong thực tế:

```js
function taoBoDem(khoiDau = 0) {
  let giaTri = khoiDau;                  // riêng cho MỖI bộ đếm
  return { tang: () => ++giaTri, doc: () => giaTri };
}

const a = taoBoDem();
const b = taoBoDem(100);
a.tang();   // 1  — không ảnh hưởng b
```

---

## 5. Trong JS hiện đại

### ESM đã làm sẵn việc này

```js
// analytics.js
let soLuotXem = 0;                  // riêng tư — không export thì không ai thấy
export function ghiNhan() { soLuotXem++; }
```

Không cần IIFE. Không cần `return`. **Không export = riêng tư.**

### `#` private field cho class

```js
class TaiKhoan {
  #soDu = 0;                        // riêng tư THẬT ở mức ngôn ngữ
  napTien(x) { this.#soDu += x; }
}
new TaiKhoan().#soDu;               // SyntaxError
```

### Vậy Module Pattern còn dùng không?

Có, ở ba chỗ:

1. **Factory module** — khi cần nhiều instance có trạng thái riêng mà không muốn dùng `class`.
2. **Khởi tạo một lần** — code chạy lúc module nạp (kết nối, đọc config).
3. **Đọc code cũ** — jQuery, Lodash, Bootstrap đều viết theo pattern này. Bạn sẽ gặp.

---

## 6. Code

```bash
node src/13-module/demo.js
```

---

## 7. Bẫy thường gặp

1. **Nhầm "riêng tư" với "an toàn".** Closure ngăn *lỗi vô ý*, không ngăn kẻ tấn công. Đừng để
   khóa API trong module phía trình duyệt và nghĩ là an toàn — nó vẫn nằm trong file JS tải về.

2. **Vòng lặp import.** `a.js` ↔ `b.js` → một bên nhận `undefined`. Hay xảy ra khi dùng
   module như một kho chứa toàn cục.

3. **Module có trạng thái = singleton ẩn.** Xem lại [Bài 02](02-singleton.md): tiện thì tiện,
   nhưng khó test. Dùng factory module nếu cần test dễ.

4. **Trả ra tham chiếu tới object nội bộ** → phá vỡ đóng gói:
   ```js
   return { layDanhSach: () => danhSachNoiBo };   // ❌ bên ngoài sửa được
   return { layDanhSach: () => [...danhSachNoiBo] };  // ✅
   ```

---

## 8. Bài tập

📂 `src/13-module/bai-tap.js`

1. Viết `taoGioHang()` theo Factory Module: `them`, `xoa`, `tong`, `danhSach`.
   ⚠️ Không được truy cập mảng nội bộ từ bên ngoài; `danhSach()` trả **bản sao**.
2. Chứng minh hai giỏ hàng độc lập nhau.
3. Viết `taoBoNhoDem` (cache) có TTL, với biến `soLanTrung`/`soLanTruot` **riêng tư**.
4. **Bẫy:** trong file có sẵn một module bị **rò rỉ đóng gói** — tìm ra và sửa.
5. **So sánh:** viết lại `taoGioHang` bằng `class` với `#` private field, rồi trả lời:
   cách nào tốt hơn trong tình huống nào?

Lời giải: `src/13-module/loi-giai.js`

---

## 9. Kiểm tra nhanh

1. IIFE là gì và nó tạo ra điều gì?
2. Vì sao ESM khiến Module Pattern gần như không cần thiết nữa?
3. Khi nào vẫn nên dùng factory module thay vì class?
4. "Riêng tư" trong closure có phải là bảo mật không?
5. Vì sao `layDanhSach()` nên trả bản sao?

---

⬅️ [12 — State](12-state.md) | ➡️ [14 — Middleware](14-middleware.md)
