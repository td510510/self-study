# Buổi 08 — fs/promises, process & graceful shutdown

> **Phase 1** · Node.js Core
> **Mục tiêu:** Biết cách một service Node cư xử đúng mực trong môi trường thật — không mất dữ liệu khi bị tắt đột ngột, không hỏng file khi ghi dở.
> **Code thực hành:** [`code/buoi-08-process-shutdown/`](../../code/buoi-08-process-shutdown/)

Đây là buổi chuẩn bị trực tiếp cho **Project 1** ở buổi 09.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 07 |
| 15–65′ | Ghi file an toàn: atomic write + hàng đợi ghi |
| 65–90′ | `process`: env, argv, tín hiệu, mã thoát |
| 90–150′ | **Graceful shutdown: ngây thơ vs đúng cách** ← trọng tâm |
| 150–175′ | Ráp vào server thật |
| 175–180′ | Bài tập & tổng kết |

---

## 1. Ghi file an toàn (15–65′)

[`01-ghi-file-an-toan.js`](../../code/buoi-08-process-shutdown/01-ghi-file-an-toan.js)

### 1.1. Vì sao `writeFile` nguy hiểm

Mở đầu bằng câu hỏi: *"`await writeFile(file, data)` — có gì sai không?"*

Đa số sẽ nói không. Sự thật:

```
writeFile mở file ở chế độ "w":
  1. Cắt cụt file về 0 byte     ← nếu tiến trình chết ở ĐÂY thì MẤT SẠCH
  2. Ghi nội dung mới vào
```

Giữa bước 1 và bước 2 có một khoảnh khắc file **rỗng hoàn toàn**. Mất điện, OOM, `kill -9`, hoặc deploy đúng lúc đó → toàn bộ dữ liệu biến mất.

### 1.2. Atomic write — ghi tạm rồi đổi tên

```js
async function ghiAnToan(duongDan, duLieu) {
  const fileTam = join(dirname(duongDan), `.${Date.now()}.tmp`);

  // Bước 1: ghi vào file TẠM. File thật vẫn còn NGUYÊN VẸN.
  await writeFile(fileTam, JSON.stringify(duLieu, null, 2), 'utf8');

  // Bước 2: đổi tên đè lên file thật — thao tác NGUYÊN TỬ.
  await rename(fileTam, duongDan);
}
```

**Vì sao `rename()` là nguyên tử?** Ở tầng hệ thống tập tin, nó chỉ sửa **một con trỏ** trong thư mục: *"tên này giờ trỏ tới khối dữ liệu kia"*. Không có trạng thái nửa vời. Tại mọi thời điểm, đọc file ra sẽ được **hoặc bản cũ hoàn chỉnh, hoặc bản mới hoàn chỉnh**.

> **⚠️ Điều kiện bắt buộc:** file tạm phải nằm **cùng ổ đĩa** với file đích. Khác ổ đĩa thì `rename()` biến thành *copy + delete* → mất tính nguyên tử.
> Đó là lý do ta đặt file tạm trong cùng thư mục: `dirname(duongDan)`.

> **📝 Ghi chú giảng viên**
> Đây là kỹ thuật **mọi database đều dùng**. Nói rõ điều này để học viên thấy mình đang học thứ thật, không phải bài tập đồ chơi. Ta gặp lại nó ở buổi 19 (transaction).

### 1.3. Hàng đợi ghi — chống tranh chấp

Nhớ buổi 02: Node đơn luồng, **nhưng I/O bất đồng bộ**. Hai request cùng gọi ghi file có thể xen kẽ nhau và ghi đè kết quả của nhau.

```js
function taoHangDoiGhi() {
  let hangDoi = Promise.resolve();

  return function ghi(duongDan, duLieu) {
    // Nối mỗi lần ghi vào CUỐI hàng đợi → tuần tự hoá
    hangDoi = hangDoi.then(
      () => ghiAnToan(duongDan, duLieu),
      () => ghiAnToan(duongDan, duLieu)   // lỗi lần trước không làm hỏng hàng đợi
    );
    return hangDoi;
  };
}
```

Chạy thử — bắn 5 lệnh ghi cùng lúc:

```
Nội dung cuối cùng: { lanGhi: 5, thoiGian: '...' }
→ Đúng là lần ghi cuối, không bị trộn lẫn
```

Hỏi lớp: *"Vì sao nhánh lỗi (`onRejected`) cũng gọi `ghiAnToan`?"*
→ Nếu không, một lần ghi thất bại sẽ làm **mọi lần ghi sau đó** bị bỏ qua vĩnh viễn, vì hàng đợi mắc kẹt ở trạng thái rejected.

---

## 2. `process` — cửa sổ ra thế giới bên ngoài (65–90′)

| Thuộc tính | Ý nghĩa | Đã gặp ở |
|---|---|---|
| `process.env` | biến môi trường | buổi 03 |
| `process.argv` | tham số dòng lệnh | buổi 03 |
| `process.exitCode` | mã thoát | buổi 03 |
| `process.hrtime.bigint()` | đồng hồ độ chính xác nanosecond | buổi 02 |
| `process.on('SIGTERM')` | nhận tín hiệu từ hệ điều hành | **hôm nay** |
| `process.memoryUsage()` | đo bộ nhớ | buổi 06 |

### Tín hiệu (signal) là gì?

Cách hệ điều hành "gõ cửa" một tiến trình:

| Tín hiệu | Ai gửi | Chặn được? |
|---|---|---|
| `SIGINT` | bạn nhấn **Ctrl+C** | ✅ |
| `SIGTERM` | Docker/Kubernetes/PM2 khi deploy | ✅ |
| `SIGKILL` | `kill -9` | ❌ **không bao giờ** |

> **📝 Ghi chú giảng viên — lưu ý cho lớp học trên Windows**
> Windows **không có** hệ thống tín hiệu thật như Unix. `Ctrl+C` trong terminal vẫn tạo ra `SIGINT` và Node xử lý được, **nhưng** không thể gửi `SIGINT`/`SIGTERM` từ một tiến trình khác — `child.kill()` trên Windows giết tiến trình ngay, không qua handler.
>
> Vì vậy file `03` có thêm một kênh **IPC** để viết được test tự động trên Windows. Trên Linux/macOS thì dùng `SIGTERM` như bình thường.

---

## 3. Trọng tâm: graceful shutdown (90–150′)

### 3.1. Cách ngây thơ — không làm gì cả

[`02-shutdown-ngay-tho.js`](../../code/buoi-08-process-shutdown/02-shutdown-ngay-tho.js)

Kịch bản: gọi `/cham` (mất 5 giây), rồi nhấn Ctrl+C khi nó đang chạy dở.

**Kết quả đo thật:**

```
>>> Request A: /cham (mất 5 giây)
  [server] [bắt đầu] request #1
>>> Gửi tín hiệu tắt khi A đang chạy dở

>>> KẾT QUẢ A: {"err":"ECONNRESET","ms":835}
>>> Server thoát với mã: null
```

Request bị **cắt ngang giữa chừng**. Client nhận lỗi kết nối.

**Điều gì đã xảy ra:**
1. Terminal gửi `SIGINT`
2. Node **không có** bộ xử lý nào cho `SIGINT`
3. Hành vi mặc định: **chết ngay lập tức**
4. Request đang xử lý dở → bị cắt

**Hậu quả thật ở production** — mỗi lần deploy, hệ thống gửi `SIGTERM` để tắt bản cũ:

- Đơn hàng đang ghi dở → mất
- Transaction không commit cũng không rollback
- File đang ghi → hỏng (nhớ phần 1: `writeFile` cắt cụt file trước khi ghi)
- Người dùng thấy `502 Bad Gateway`

> Deploy mỗi ngày × 100 người đang dùng = mỗi ngày vài chục người gặp lỗi. Và không ai biết vì log không ghi lại gì cả.

### 3.2. Cách đúng — bốn bước

[`03-shutdown-dung-cach.js`](../../code/buoi-08-process-shutdown/03-shutdown-dung-cach.js)

```js
async function tatTuTe(tinHieu) {
  // Ctrl+C lần hai → thoát ngay. Người vận hành luôn cần "đường thoát hiểm".
  if (dangTat) process.exit(1);
  dangTat = true;

  // Hạn chót ép thoát — không để việc tắt kéo dài vô tận
  const hanChot = setTimeout(() => process.exit(1), HAN_CHOT_MS);
  hanChot.unref();

  // BƯỚC 1: ngừng nhận kết nối MỚI
  server.close(() => console.log('✅ Server đã đóng'));

  // BƯỚC 2: đóng keep-alive đang RẢNH
  server.closeIdleConnections();

  // BƯỚC 3: chờ request đang chạy xong
  while (soRequestDangChay > 0) {
    await new Promise((r) => setTimeout(r, 500));
  }

  // BƯỚC 4: đóng database / redis / queue
  // await db.disconnect(); await redis.quit();

  process.exitCode = 0;
}

process.on('SIGTERM', () => tatTuTe('SIGTERM'));  // deploy
process.on('SIGINT',  () => tatTuTe('SIGINT'));   // Ctrl+C
```

**Kết quả đo thật, cùng kịch bản:**

```
📥 Nhận tín hiệu — bắt đầu tắt tử tế
   Đang có 1 request chạy dở
   Chờ 1 request... (× 9 lần)
[xong] request #1

>>> A = {"status":200,"body":"Request #1 đã hoàn tất","ms":5041}   ✅
>>> B = {"err":"ECONNREFUSED","ms":1331}
>>> Server thoát với mã: 0
```

So sánh trực tiếp — viết bảng này lên bảng:

| | Ngây thơ | Đúng cách |
|---|---|---|
| Request đang chạy dở | ❌ `ECONNRESET` sau 835ms | ✅ `200 OK` sau 5041ms |
| Mã thoát | `null` (bị giết) | `0` (thoát sạch) |
| Dữ liệu | có thể mất | an toàn |

### 3.3. Hai chi tiết dễ dạy sai

> **📝 Ghi chú giảng viên — chính giảng viên đã hiểu sai lúc soạn bài**

**(1) Ai nhận `503`, ai nhận `ECONNREFUSED`?**

Trực giác ban đầu: *"đang tắt thì mọi request mới đều nhận 503"*. **Sai.**

Test cho thấy request B nhận `ECONNREFUSED`, không phải `503`. Vì `server.close()` đã đóng **cổng lắng nghe** — kết nối TCP mới bị từ chối ngay ở tầng hệ điều hành, code JavaScript không hề chạy.

| Loại kết nối | Nhận gì |
|---|---|
| keep-alive **đã mở sẵn** | `503` + `Connection: close` |
| kết nối TCP **mới** | `ECONNREFUSED` |

Vậy nhánh `503` còn cần không? **Có** — trình duyệt và load balancer thường giữ sẵn kết nối keep-alive. Với chúng, `503 + Connection: close` là lời báo tử tế *"tôi sắp nghỉ, đừng gửi nữa"* thay vì cắt ngang.

Ở production, load balancer nên rút server khỏi danh sách **trước** khi gửi `SIGTERM` — đó là lý do Kubernetes có `preStop` hook (buổi 42).

**(2) Vì sao cần `server.closeIdleConnections()`?**

Không có nó, `server.close()` sẽ **chờ tới khi client tự ngắt** — với keep-alive có thể là hàng chục giây. Đây là nguyên nhân phổ biến nhất khiến *"graceful shutdown treo mãi không thoát"*.

**(3) `process.exitCode` hay `process.exit()`?**

```js
process.exit(0)      // thoát NGAY, cắt ngang mọi I/O đang dở
                     // → dòng log cuối có thể không kịp ghi ra đĩa
process.exitCode = 0 // đặt mã thoát, để Node tự thoát khi hết việc  ✅
```

> Một lỗi thật gặp khi soạn bài: tiến trình **không chịu thoát** dù đã in "👋 Thoát sạch sẽ". Nguyên nhân: kênh IPC vẫn mở — nó là một *handle* đang sống, giữ Event Loop không rỗng.
> **Bài học:** `process.exitCode` chỉ hiệu quả khi **mọi handle đã đóng**. Nếu server không thoát, hãy tìm xem còn handle nào đang mở (timer chưa `unref`, kết nối DB, watcher…).

---

## 4. Bài tập về nhà

1. **Ráp vào server buổi 05.** Thêm graceful shutdown đầy đủ 4 bước vào `code/buoi-05-router-body/server.js`. Kiểm chứng bằng kịch bản: gọi endpoint chậm → Ctrl+C → request vẫn hoàn tất.

2. **Lưu trạng thái khi tắt.** Bổ sung bước 4: khi nhận tín hiệu tắt, ghi toàn bộ mảng `todos` ra file bằng `ghiAnToan()`. Khởi động lại thì đọc lên. Đây chính là điều Project 1 cần.

3. **Chứng minh atomic write.** Viết script ghi file liên tục trong vòng lặp, chạy nó rồi `kill -9` (hoặc Task Manager) giữa chừng. Làm hai lần: một lần với `writeFile` thường, một lần với `ghiAnToan`. So sánh tình trạng file sau khi bị giết.

4. **Hạn chót.** Đặt `HAN_CHOT_MS = 2000` rồi gọi `/cham` (5 giây) và tắt. Quan sát thông báo ép thoát và mã thoát. Giải thích vì sao hạn chót là bắt buộc.

5. **Nâng cao — health check.** Thêm endpoint `GET /health` trả `200` khi bình thường và `503` khi `dangTat === true`. Đây là cách load balancer biết khi nào nên ngừng gửi request tới server này (chuẩn bị cho buổi 43).

---

## 5. Checklist kết thúc buổi

- [ ] Vì sao `writeFile` có thể làm mất sạch dữ liệu?
- [ ] `rename()` nguyên tử nghĩa là gì? Điều kiện để nó nguyên tử?
- [ ] Vì sao cần hàng đợi ghi dù Node đơn luồng?
- [ ] `SIGTERM`, `SIGINT`, `SIGKILL` — cái nào chặn được?
- [ ] Kể 4 bước của graceful shutdown.
- [ ] Request nào nhận `503`, request nào nhận `ECONNREFUSED`?
- [ ] Vì sao cần `server.closeIdleConnections()`?
- [ ] Khác nhau giữa `process.exit(0)` và `process.exitCode = 0`?

---

**Buổi trước:** [Buổi 07 — Async patterns & xử lý lỗi](./buoi-07-async.md)
**Buổi tiếp theo:** Buổi 09 — Project 1: Todo REST API Node thuần
