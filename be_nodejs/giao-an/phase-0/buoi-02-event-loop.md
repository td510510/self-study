# Buổi 02 — Node.js runtime & Event Loop chuyên sâu

> **Phase 0** · Cầu nối tư duy Frontend → Backend
> **Mục tiêu:** Học viên hiểu Node không phải "JavaScript chạy trong terminal" mà là một runtime khác hẳn browser, và nắm được cơ chế đơn luồng — thứ quyết định mọi giới hạn hiệu năng về sau.
> **Code thực hành:** [`code/buoi-02-event-loop/`](../../code/buoi-02-event-loop/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 01 |
| 15–75′ | Lý thuyết: runtime, Event Loop, libuv |
| 75–150′ | Thực hành: đoán thứ tự log → đo blocking → lag monitor |
| 150–180′ | Bài tập về nhà & tổng kết |

---

## 1. Lý thuyết (15–75′)

### 1.1. Cùng V8, khác thế giới

Node và Chrome dùng **chung engine V8** để thực thi JavaScript. Nhưng engine chỉ biết chạy ngôn ngữ — mọi khả năng **tương tác với thế giới** đều do runtime bên ngoài cung cấp. Đó là lý do hai môi trường cho ta hai bộ công cụ hoàn toàn khác:

| | Browser | Node.js |
|---|---|---|
| Object toàn cục | `window` | `global` / `globalThis` |
| Giao diện | `document`, DOM, CSSOM | **không có** — và sẽ không bao giờ có |
| Lưu trữ | `localStorage` (~5MB) | `fs` — toàn bộ ổ đĩa |
| Mạng | `fetch`, XHR (bị CORS chặn) | `http`, `net` — **mở được server**, không có CORS |
| Tiến trình | tab, không kiểm soát | `process`: env, argv, signal, exit code |
| Nhị phân | `Blob`, `ArrayBuffer` | `Buffer` |
| Vòng đời | chết khi đóng tab | **chạy liên tục hàng tháng trời** |

> **💡 Đối chiếu Frontend**
> "Chạy liên tục hàng tháng trời" là khác biệt tư duy lớn nhất.
> Trên frontend, một biến rò rỉ bộ nhớ sẽ được dọn khi người dùng reload trang. Trên backend, **không có ai reload cả** — rò rỉ tích tụ cho đến khi tiến trình sập lúc 3 giờ sáng.
> Từ nay, mọi biến toàn cục đều phải được cân nhắc.

Câu hỏi hỏi lớp: *"Vì sao Node không có CORS?"*
→ Vì CORS là cơ chế **trình duyệt tự áp lên chính nó** để bảo vệ người dùng. Node không phải trình duyệt, không có người dùng nào cần bảo vệ khỏi chính nó. Đây là lý do người ta hay dựng "proxy server" để né CORS — sẽ nói kỹ ở buổi 23.

### 1.2. Một luồng, nhưng không chờ đợi

Node chạy JavaScript của bạn trên **đúng một luồng**.

Nghe như một hạn chế chí mạng — làm sao phục vụ 10.000 người cùng lúc? Câu trả lời: server dành **99% thời gian để *chờ*** (chờ đĩa, chờ database, chờ mạng), chứ không phải để tính toán. Node giao việc chờ cho hệ điều hành và quay lại phục vụ người khác ngay lập tức.

Ví dụ đời thường để giảng: **một người phục vụ bàn giỏi**. Anh ta không đứng chờ bếp nấu xong món của bàn 1 rồi mới đi nhận order bàn 2. Anh ta ghi order bàn 1, chuyển cho bếp, sang bàn 2 ngay. Khi bếp gọi "món bàn 1 xong", anh quay lại bưng ra. **Một người, phục vụ được cả nhà hàng** — miễn là anh ta không tự vào bếp nấu.

> Đoạn "tự vào bếp nấu" chính là CPU-bound blocking mà ta sẽ đo ở phần thực hành.

### 1.3. Các pha của Event Loop

Cơ chế điều phối đó là **Event Loop**, do thư viện **libuv** (viết bằng C) đảm nhiệm. Nó chạy vòng lặp qua các pha, mỗi pha có một hàng đợi callback riêng.

**Vẽ sơ đồ này lên bảng và giữ nguyên suốt buổi học:**

```
   ┌──────────────────────────────┐
┌─>│           timers             │  callback của setTimeout / setInterval
│  ├──────────────────────────────┤
│  │      pending callbacks       │  một số callback I/O của hệ thống
│  ├──────────────────────────────┤
│  │       idle, prepare          │  nội bộ libuv
│  ├──────────────────────────────┤     ┌───────────────┐
│  │           poll               │<────┤  I/O đến nơi  │  ĐỌC FILE, SOCKET…
│  ├──────────────────────────────┤     └───────────────┘
│  │           check              │  callback của setImmediate
│  ├──────────────────────────────┤
│  │      close callbacks         │  socket.on('close')
└──┴──────────────────────────────┘

Sau MỖI callback, Node vét sạch 2 hàng đợi ưu tiên cao hơn:
  1. process.nextTick()   ← ưu tiên cao nhất
  2. microtask (Promise)  ← ngay sau đó
```

---

## 2. Thực hành (75–150′)

### Bước 1 — Trò chơi đoán thứ tự (75–95′)

Chiếu [`01-order-quiz.js`](../../code/buoi-02-event-loop/01-order-quiz.js) lên màn hình. **Chưa chạy vội.**

Cho học viên viết ra giấy thứ tự họ dự đoán, **thu lại**, rồi mới chạy. Sai lệch giữa dự đoán và thực tế chính là bài học.

```js
console.log('A — đồng bộ, chạy ngay');
setTimeout(() => console.log('B — setTimeout 0ms'), 0);
setImmediate(() => console.log('C — setImmediate'));
Promise.resolve().then(() => console.log('D — microtask (Promise)'));
process.nextTick(() => console.log('E — nextTick'));
console.log('F — đồng bộ, chạy ngay');
```

**Kết quả:** `A → F → E → D → B/C`

| Vì sao | Giải thích |
|---|---|
| `A`, `F` trước | Code đồng bộ chạy **hết** trước khi Event Loop bắt đầu quay |
| `E` trước `D` | Hàng đợi `nextTick` có ưu tiên **cao hơn** microtask queue |
| `B`/`C` **không xác định** | Phụ thuộc tiến trình khởi động mất bao nhiêu mili-giây |

**Chứng minh tính không xác định ngay tại lớp** — chạy 5 lần liên tiếp:

```bash
for i in 1 2 3 4 5; do node 01-order-quiz.js | tail -2 | tr '\n' ' '; echo; done
```

Kết quả thật đo được trên máy giảng viên:

```
C — setImmediate  B — setTimeout 0ms
C — setImmediate  B — setTimeout 0ms
B — setTimeout 0ms  C — setImmediate     ← đổi chỗ!
B — setTimeout 0ms  C — setImmediate
C — setImmediate  B — setTimeout 0ms
```

> **📝 Ghi chú giảng viên**
> Đây là chi tiết học viên hay tranh cãi nhất ("nhưng máy em ra khác cơ!"). **Đừng bỏ qua, hãy chạy nhiều lần cho cả lớp thấy**. Bài học: nếu code của bạn phụ thuộc vào thứ tự này, code của bạn đã sai từ thiết kế.
> - Nếu khởi động > 1ms → timer đã "chín", pha `timers` chạy trước → `B` trước
> - Nếu khởi động < 1ms → timer chưa chín, vòng lặp đi tiếp tới pha `check` → `C` trước

### Bước 2 — Khi thứ tự trở nên xác định (95–105′)

Chạy [`02-order-in-io.js`](../../code/buoi-02-event-loop/02-order-in-io.js):

```js
fs.readFile(__filename, () => {
  setTimeout(() => console.log('setTimeout   — luôn đứng SAU'), 0);
  setImmediate(() => console.log('setImmediate — luôn đứng TRƯỚC'));
});
```

Chạy bao nhiêu lần cũng ra **một kết quả**. Vì bên trong callback I/O ta đang đứng ở pha `poll`, mà pha `check` đến ngay sau đó trong cùng vòng lặp, còn `timers` phải chờ hết một vòng nữa.

**Bài học rút ra:** *vị trí trong Event Loop quyết định hành vi, không phải con số `0ms` bạn viết.*

### Bước 3 — Chặn Event Loop và trả giá (105–135′)

**Đây là phần quan trọng nhất buổi học.** Chạy [`03-blocking-demo.js`](../../code/buoi-02-event-loop/03-blocking-demo.js) — server có 3 endpoint:

| Endpoint | Hành vi |
|---|---|
| `/nhanh` | Trả lời ngay lập tức |
| `/chan` | `crypto.pbkdf2Sync` — CPU-bound **đồng bộ** |
| `/khong-chan` | `crypto.pbkdf2` — cùng công việc nhưng **bất đồng bộ** |

Kịch bản tại lớp — mở **hai** cửa sổ terminal:

```bash
# ── VÒNG 1: phiên bản CHẶN ──
# Terminal 1:
time curl http://localhost:3000/chan
# Terminal 2 — gọi NGAY LẬP TỨC:
time curl http://localhost:3000/nhanh

# ── VÒNG 2: phiên bản KHÔNG CHẶN ──
# Terminal 1:
time curl http://localhost:3000/khong-chan
# Terminal 2:
time curl http://localhost:3000/nhanh
```

**Số liệu thật đo được** (Node 22, laptop Windows, 5 triệu vòng lặp):

| Kịch bản | Endpoint nặng | `/nhanh` phải chờ |
|---|---|---|
| `/chan` (đồng bộ) | 7785 ms | **7468 ms** 🔴 |
| `/khong-chan` (bất đồng bộ) | 4708 ms | **4 ms** 🟢 |

Chênh lệch **7468 ms so với 4 ms** — gần **2000 lần**. Viết hai con số này thật to lên bảng.

> **⚠️ Bài học cốt lõi của cả buổi**
> Một request nặng làm chậm **toàn bộ** người dùng khác. Đây là nguyên nhân gốc rễ của rất nhiều sự cố production, và cũng là lý do tồn tại của **background job / queue** mà ta học ở buổi 26.
>
> Mọi hàm có hậu tố `Sync` trong Node đều là một quả mìn tiềm tàng: `readFileSync`, `pbkdf2Sync`, `execSync`.
>
> **QUY TẮC:** chỉ dùng bản `Sync` lúc **khởi động server**. Tuyệt đối không dùng trong request handler.

> **📝 Ghi chú giảng viên**
> Nếu demo chạy quá nhanh hoặc quá chậm, chỉnh hằng số `ITERATIONS` ở đầu file. Mục tiêu là mỗi lần gọi mất khoảng 3–5 giây để cả lớp kịp quan sát.
> **Lưu ý kỹ thuật:** nếu chạy demo nhiều lần, nhớ tắt hẳn tiến trình server cũ trước — tiến trình sót lại vẫn chiếm cổng 3000 và làm số đo sai lệch hoàn toàn (chính giảng viên đã vấp phải khi soạn bài này).

### Bước 4 — Đo mức độ nghẽn của Event Loop (135–150′)

Kỹ thuật ở [`04-lag-monitor.js`](../../code/buoi-02-event-loop/04-lag-monitor.js) được dùng **thật ở production**. Các công cụ APM (New Relic, Datadog) đo bằng đúng nguyên lý này.

Ý tưởng: hẹn giờ đều đặn mỗi 500ms, rồi đo xem thực tế bị trễ bao nhiêu. **Độ trễ đó chính là thời gian Event Loop bị chiếm dụng.**

```js
function monitorLag(intervalMs = 500) {
  let last = process.hrtime.bigint();
  const timer = setInterval(() => {
    const now = process.hrtime.bigint();
    const lagMs = Number(now - last) / 1e6 - intervalMs;
    last = now;
    const canhBao = lagMs > 100 ? '   ⚠️  EVENT LOOP ĐANG BỊ CHẶN' : '';
    console.log(`lag: ${lagMs.toFixed(1).padStart(7)}ms${canhBao}`);
  }, intervalMs);
  timer.unref();  // không giữ tiến trình sống chỉ vì timer này
}
```

Giải thích hai chi tiết học viên hay hỏi:
- **`process.hrtime.bigint()`** trả nanosecond, chính xác hơn `Date.now()` (millisecond) — quan trọng khi đo hiệu năng.
- **`.unref()`** báo cho Node: "đừng giữ tiến trình sống chỉ vì cái timer này". Không có nó, chương trình không bao giờ tự thoát.

---

## 3. Bài tập về nhà

1. **Tự ra đề đoán thứ tự.** Viết một file có ít nhất **8 lệnh log** xen kẽ `setTimeout`, `setImmediate`, `nextTick`, `Promise` và `async/await`. Ghi dự đoán vào comment ở đầu file, chạy, rồi giải thích mọi sai lệch.

2. **Đo lag thật.** Đưa `monitorLag()` vào `03-blocking-demo.js`, gọi `/chan` và chụp lại số liệu lag. So sánh với khi gọi `/khong-chan`.

3. **Thread pool.** Tự tìm hiểu biến môi trường `UV_THREADPOOL_SIZE` làm gì. Thử:
   ```bash
   UV_THREADPOOL_SIZE=1 node 03-blocking-demo.js
   ```
   rồi gọi `/khong-chan` **bốn lần cùng lúc**. Mô tả và giải thích hiện tượng.

---

## 4. Checklist kết thúc buổi

- [ ] Node và Chrome giống nhau ở điểm nào, khác nhau ở điểm nào?
- [ ] Vì sao Node đơn luồng mà vẫn phục vụ được nhiều người cùng lúc?
- [ ] `process.nextTick` và `Promise.then` — cái nào chạy trước?
- [ ] Vì sao thứ tự `setTimeout` vs `setImmediate` lại không xác định ở module chính, nhưng xác định trong callback I/O?
- [ ] Kể tên 3 hàm `Sync` không được dùng trong request handler, và giải thích vì sao.

---

**Buổi trước:** [Buổi 01 — Client–Server & vòng đời HTTP request](./buoi-01-http-lifecycle.md)
**Buổi tiếp theo:** [Buổi 03 — Module, npm, biến môi trường & CLI tool](./buoi-03-module-npm-cli.md)
