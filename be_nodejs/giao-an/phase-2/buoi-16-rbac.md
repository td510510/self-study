# Buổi 16 — Authorization & RBAC

> **Phase 2** · Express.js
> **Mục tiêu:** Phân biệt rõ **Authentication** (bạn là ai) và **Authorization** (bạn được làm gì) — nhầm lẫn phổ biến nhất ở người mới, và là lỗ hổng **hạng nhất** trong OWASP Top 10.
> **Code thực hành:** [`code/buoi-16-rbac/`](../../code/buoi-16-rbac/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 15 |
| 15–40′ | AuthN vs AuthZ — phân biệt cho rõ |
| 40–75′ | **Tự khai thác lỗ hổng IDOR** |
| 75–120′ | Bảng quyền: RBAC + quyền theo chủ sở hữu |
| 120–155′ | Ba quyết định thiết kế tinh tế |
| 155–175′ | Viết test canh giữ phân quyền |
| 175–180′ | Bài tập & tổng kết |

---

## 1. AuthN vs AuthZ (15–40′)

Viết lên bảng và giữ suốt buổi:

```
Authentication (xác thực)  = "Bạn là ai?"        → 401 nếu không biết
Authorization  (phân quyền) = "Bạn được làm gì?"  → 403 nếu không đủ quyền
```

> **Có cái thứ nhất KHÔNG có nghĩa là có cái thứ hai.**

Ví dụ đời thường: có thẻ nhân viên (đã xác thực) không có nghĩa là vào được phòng máy chủ (chưa phân quyền).

### Ba tầng phân quyền

| Tầng | Câu hỏi | Ví dụ |
|---|---|---|
| **Vai trò** (RBAC) | Bạn thuộc nhóm nào? | admin xoá được mọi bài |
| **Chủ sở hữu** | Tài nguyên này của ai? | chỉ sửa bài của chính mình |
| **Thuộc tính** (ABAC) | Trạng thái, thời gian, điều kiện? | không sửa đơn đã giao |

> Buổi này làm hai tầng đầu. Tầng ba nhắc tới để học viên biết đường khi cần.

---

## 2. Trọng tâm: tự khai thác lỗ hổng IDOR (40–75′)

[`src/demo-idor.js`](../../code/buoi-16-rbac/src/demo-idor.js)

> **📝 Ghi chú giảng viên — dựng kịch**
> Chiếu **chỉ** đoạn code có lỗ hổng lên màn hình. Hỏi lớp: *"Endpoint này an toàn chưa?"*
>
> Nó **có** `yeuCauDangNhap()`. Đa số học viên sẽ nói an toàn.

```js
appHong.patch('/bai-viet/:id', async (req, res) => {
  const bai = await prisma.baiViet.update({
    where: { id: Number(req.params.id) },
    data: { tieuDe: req.body.tieuDe },
  });
  res.json(bai);
});
```

Rồi chạy demo:

```
Bối cảnh:
  An (id=5) có bài viết id=5: "Nhật ký riêng của An"
  Kẻ tấn công (id=6) có tài khoản HỢP LỆ, đã đăng nhập.
  Hắn chỉ cần ĐOÁN id bài viết — thường là số tăng dần: 1, 2, 3...

═══ ❌ Tấn công phiên bản CÓ LỖ HỔNG ═══
  HTTP 200
  Tiêu đề bài của An giờ là: "ĐÃ BỊ CHIẾM QUYỀN"
  → 🚨 BỊ CHIẾM QUYỀN THÀNH CÔNG

═══ ✅ Tấn công phiên bản ĐÃ VÁ ═══
  HTTP 403 — {"loi":"Không đủ quyền thực hiện: baiviet:sua"}
  Tiêu đề bài của An: "Nhật ký riêng của An"
  → ✅ ĐÃ CHẶN
```

### Khác biệt chỉ là ba dòng

```js
const bai = await prisma.baiViet.findUnique({ where: { id } });   // 1. NẠP
if (!bai) throw new HttpError(404, 'Không tìm thấy');             // 2. TỒN TẠI?
batBuocQuyen(req.nguoiDung, 'baiviet:sua', bai);                  // 3. ĐƯỢC PHÉP?
```

> **Thứ tự bất di bất dịch: TÌM → KIỂM QUYỀN → HÀNH ĐỘNG.**
>
> Không bao giờ `update()` thẳng bằng id từ client.

### Vì sao lỗi này phổ biến đến vậy?

- **Không gây lỗi khi test bằng tài khoản của chính mình** — lập trình viên luôn test với dữ liệu của mình, và luôn thấy đúng
- **Không cảnh báo, không log lỗi** — server trả `200`, mọi thứ trông bình thường
- **Chỉ lộ ra khi ai đó cố tình đổi id trên URL**

> Hỏi lớp: *"Nếu id là UUID ngẫu nhiên thay vì số tăng dần thì có an toàn không?"*
> → **Khó khai thác hơn, nhưng KHÔNG an toàn.** Đó là *security through obscurity*. Id vẫn lộ qua chia sẻ link, log, referer, hay chính API khác. Vẫn **bắt buộc** kiểm tra quyền.

---

## 3. Bảng quyền — một nguồn sự thật (75–120′)

[`src/lib/quyen.js`](../../code/buoi-16-rbac/src/lib/quyen.js)

### 3.1. Vì sao không dùng `if/else` rải rác?

Cách người mới hay viết:

```js
if (req.nguoiDung.vaiTro === 'admin' || bai.tacGiaId === req.nguoiDung.id) { ... }
```

Vấn đề: điều kiện này bị **chép lại** ở mọi endpoint. Thêm vai trò mới → phải sửa hàng chục chỗ, và **chắc chắn sót một chỗ**.

### 3.2. Bảng quyền tập trung

```js
export const BANG_QUYEN = {
  user: {
    'baiviet:sua': 'own',    // ← chỉ tài nguyên của mình
    'baiviet:xoa': 'own',
  },
  bienTap: {
    'baiviet:sua': 'any',    // ← sửa được bài người khác
    'baiviet:xoa': 'own',    // ← nhưng chỉ xoá bài mình
  },
  admin: {
    'baiviet:sua': 'any',
    'baiviet:xoa': 'any',
  },
};
```

> **📝 Ghi chú giảng viên**
> Chỉ vào vai trò `bienTap`: **`sua: 'any'` nhưng `xoa: 'own'`**.
>
> Cùng một vai trò, hai hành động, hai phạm vi khác nhau. Với `if/else` thì đây là chỗ **chắc chắn sinh bug**. Với bảng quyền thì nó chỉ là hai dòng dữ liệu.
>
> Và quan trọng hơn: **đọc bảng này là biết ngay toàn bộ chính sách phân quyền của hệ thống** — không phải đi đọc 30 file handler.

### 3.3. Nguyên tắc "fail closed"

```js
const quyen = BANG_QUYEN[nguoiDung?.vaiTro];
if (!quyen) return false;              // vai trò lạ → TỪ CHỐI

const phamVi = quyen[hanhDong];
if (!phamVi) return false;             // hành động không khai → TỪ CHỐI

if (phamVi === 'any') return true;
if (!taiNguyen) return false;          // đòi quyền 'own' mà không có tài nguyên → TỪ CHỐI

return taiNguyen[truongChuSoHuu] === nguoiDung.id;
```

> **Mặc định phải là TỪ CHỐI, không phải cho phép.**
>
> Nếu viết ngược lại (*"không tìm thấy luật thì cho qua"*), thì mỗi khi ai đó thêm hành động mới mà quên khai quyền, hành động đó **mở cho tất cả mọi người**.

---

## 4. Ba quyết định thiết kế tinh tế (120–155′)

### 4.1. Bài riêng tư trả `404`, không phải `403`

```js
if (!bai.daDang && !duocPhep(nguoiDung, 'baiviet:sua', bai)) {
  throw loi.khongTimThay(`Không có bài viết id = ${id}`);   // ← 404, không phải 403
}
```

> Trả `403` là ngầm nói *"bài này CÓ tồn tại, chỉ là bạn không được xem"*. Với nội dung riêng tư, **chính sự tồn tại đã là thông tin rò rỉ**.
>
> Ví dụ: hệ thống bệnh án. `403` cho `/benh-an/12345` xác nhận bệnh nhân đó có hồ sơ.

Có test canh giữ:

```js
test('🔒 người khác nhận 404, KHÔNG phải 403', async () => {
  const r = await nhu(binh).get(`/bai-viet/${baiRieng}`).expect(404);
  assert.equal(r.text.includes('Bí mật'), false, 'không được lộ nội dung');
});
```

> **Khi nào 403, khi nào 404?**
> - Tài nguyên **công khai tồn tại** (bài đã đăng, sản phẩm) → `403`
> - Tài nguyên **riêng tư** (bản nháp, hồ sơ cá nhân) → `404`

### 4.2. Chủ sở hữu lấy từ token, không lấy từ body

```js
return prisma.baiViet.create({
  data: {
    tieuDe: duLieu.tieuDe,
    tacGiaId: nguoiDung.id,    // ← TỪ TOKEN, không phải từ body
  },
});
```

Và schema `.strict()` chặn luôn ở cửa:

```js
const taoSchema = z.object({
  tieuDe: z.string()...,
  noiDung: z.string()...,
  // ⚠️ CỐ TÌNH KHÔNG CÓ tacGiaId
}).strict();
```

Test:

```js
test('🚨 KHÔNG mạo danh được tác giả khác', async () => {
  const r = await nhu(an)
    .post('/bai-viet')
    .send({ tieuDe: 'Mạo danh', noiDung: 'ND', tacGiaId: binh.id })
    .expect(400);
});
```

> Nối lại buổi 09 và 11: đây chính là **mass assignment**, lần này ở dạng nguy hiểm nhất — mạo danh chủ sở hữu.

### 4.3. Danh sách cũng phải lọc theo quyền

Lỗi hay bị bỏ sót: bảo vệ kỹ `GET /bai-viet/:id` nhưng quên `GET /bai-viet`.

```js
const where = thayTatCa
  ? {}
  : { OR: [{ daDang: true }, { tacGiaId: nguoiDung.id }] };
```

Test:

```js
test('user chỉ thấy bài ĐÃ ĐĂNG của người khác + toàn bộ bài của mình', async () => {
  const nhapCuaNguoiKhac = r.body.filter((b) => !b.daDang && b.tacGiaId !== an.id);
  assert.equal(nhapCuaNguoiKhac.length, 0);
});
```

> **Phân quyền phải áp ở MỌI đường vào dữ liệu**, không chỉ ở endpoint chi tiết. Endpoint danh sách, tìm kiếm, xuất báo cáo, thống kê — tất cả.

### 4.4. Không cho client tự chọn vai trò khi đăng ký

```js
// ⚠️ vaiTro CHỈ được nhận khi CHO_PHEP_CHON_VAI_TRO=true (môi trường test).
// Ở production, endpoint đăng ký TUYỆT ĐỐI không cho client chọn vai trò —
// nếu không, ai cũng tự đăng ký làm admin.
```

> **📝 Ghi chú giảng viên**
> Đây là lỗi **thật đã xảy ra** ở nhiều hệ thống. Việc nâng quyền phải qua endpoint riêng, chỉ admin gọi được, và **phải ghi log**.

---

## 5. Đặt middleware `yeuCauDangNhap()` ở đâu (155–165′)

```js
export function taoBaiVietRouter() {
  const router = Router();

  // Toàn bộ router yêu cầu đăng nhập.
  // Đặt Ở ĐÂY thay vì lặp lại từng route → KHÔNG THỂ QUÊN SÓT.
  router.use(yeuCauDangNhap());

  router.get('/', ...);
  router.post('/', ...);
  ...
}
```

> So sánh với việc gắn vào từng route:
> ```js
> router.get('/', yeuCauDangNhap(), ...);
> router.post('/', yeuCauDangNhap(), ...);
> router.delete('/:id', ...);              // ← QUÊN. Và không ai phát hiện.
> ```
>
> **Nguyên tắc: mặc định là đóng, mở ra từng trường hợp** — chứ không phải mặc định mở rồi đóng từng cái.

---

## 6. Nghiệm thu

```
# tests 19
# pass 19
# fail 0
```

| Nhóm test | Canh giữ |
|---|---|
| Tạo bài | tác giả lấy từ token, chặn mạo danh |
| **IDOR** | Bình không sửa/xoá được bài của An → `403`, dữ liệu nguyên vẹn |
| Vai trò | biên tập `sua:any` nhưng `xoa:own`; admin xoá mọi bài |
| Bài chưa đăng | người khác nhận `404` chứ không `403`, không lộ nội dung |
| Danh sách | không thấy bản nháp của người khác |
| Phân biệt | id không tồn tại `404` vs id sai định dạng `400` |

---

## 7. Bài tập về nhà

1. **Thêm vai trò.** Thêm `kiemDuyet`: xem được **mọi** bài kể cả nháp, nhưng **không sửa, không xoá**. Chỉ được sửa `BANG_QUYEN`, không sửa file service nào.

2. **Tự tạo lỗ hổng rồi vá.** Thêm endpoint `GET /bai-viet/:id/thong-ke` cố tình **quên** kiểm quyền. Viết test khai thác chứng minh nó hổng, rồi vá và chứng minh test chuyển sang pass.

3. **Kiểm tra theo thuộc tính (ABAC).** Thêm luật: bài **đã đăng** thì tác giả không sửa được nữa (chỉ biên tập/admin sửa được). Bạn đặt luật này ở đâu — trong `BANG_QUYEN` hay trong service? Giải thích lựa chọn.

4. **403 hay 404?** Với mỗi trường hợp, chọn mã và giải thích:
   - Xem hồ sơ lương của đồng nghiệp
   - Xoá sản phẩm trong shop công khai
   - Xem đơn hàng của người khác
   - Truy cập trang quản trị khi là user thường

5. **Ghi log kiểm toán.** Mỗi lần `batBuocQuyen` từ chối, ghi log kèm `userId`, `hanhDong`, `taiNguyenId`, thời gian. Vì sao log này quan trọng? (Gợi ý: phát hiện ai đang dò quét hệ thống.)

6. **Nâng cao.** Viết middleware `kiemQuyenTaiNguyen(hanhDong, hamNap)` gom sẵn ba bước TÌM → KIỂM QUYỀN → gắn vào `req`, để handler chỉ còn một dòng. Đây chính là ý tưởng **Guard** của NestJS ở buổi 33.

---

## 8. Checklist kết thúc buổi

- [ ] Authentication và Authorization khác nhau thế nào? Mã lỗi tương ứng?
- [ ] IDOR là gì? Vì sao khó phát hiện khi tự test?
- [ ] Thứ tự ba bước bắt buộc khi nhận id từ client?
- [ ] Vì sao dùng bảng quyền thay vì `if/else`?
- [ ] "Fail closed" nghĩa là gì? Nếu làm ngược lại thì sao?
- [ ] Khi nào trả `403`, khi nào trả `404`?
- [ ] Vì sao `tacGiaId` phải lấy từ token?
- [ ] Vì sao endpoint danh sách cũng phải lọc theo quyền?
- [ ] Đặt `yeuCauDangNhap()` ở `router.use()` có lợi gì?

---

**Buổi trước:** [Buổi 15 — Authentication: JWT & bcrypt](./buoi-15-auth-jwt.md)
**Buổi tiếp theo:** Buổi 17 — File upload & Testing
