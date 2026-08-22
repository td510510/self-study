# Buổi 02 — Event Loop

Giáo án: [`giao-an/phase-0/buoi-02-event-loop.md`](../../giao-an/phase-0/buoi-02-event-loop.md)

Không cần `npm install`.

## `01-order-quiz.js` — Trò chơi đoán thứ tự

**Cho học viên viết dự đoán ra giấy TRƯỚC khi chạy.**

```bash
node 01-order-quiz.js

# Chạy 5 lần để thấy B/C đổi chỗ:
for i in 1 2 3 4 5; do node 01-order-quiz.js | tail -2 | tr '\n' ' '; echo; done
```

Đáp án: `A → F → E → D → B/C` (B và C **không xác định** thứ tự).

## `02-order-in-io.js` — Khi thứ tự trở nên xác định

```bash
node 02-order-in-io.js
```

Bên trong callback I/O, `setImmediate` **luôn** chạy trước `setTimeout`. Chạy bao nhiêu lần cũng vậy.

## `03-blocking-demo.js` — Chặn Event Loop và trả giá

**Phần quan trọng nhất buổi học.**

```bash
node 03-blocking-demo.js
```

Mở **hai** terminal:

```bash
# VÒNG 1 — chặn
time curl http://localhost:3000/chan     # terminal 1
time curl http://localhost:3000/nhanh    # terminal 2, gọi NGAY

# VÒNG 2 — không chặn
time curl http://localhost:3000/khong-chan   # terminal 1
time curl http://localhost:3000/nhanh        # terminal 2
```

Số liệu thật đo được (Node 22, Windows, 5 triệu vòng):

| Kịch bản | Endpoint nặng | `/nhanh` phải chờ |
|---|---|---|
| `/chan` (đồng bộ) | 7785 ms | **7468 ms** 🔴 |
| `/khong-chan` (bất đồng bộ) | 4708 ms | **4 ms** 🟢 |

> ⚠️ Nếu chạy demo nhiều lần, **nhớ tắt hẳn tiến trình server cũ** — tiến trình sót lại vẫn chiếm cổng 3000 và làm số đo sai lệch hoàn toàn.
>
> ```bash
> # Windows PowerShell
> Get-NetTCPConnection -LocalPort 3000 -State Listen |
>   Select-Object -ExpandProperty OwningProcess -Unique |
>   ForEach-Object { Stop-Process -Id $_ -Force }
> ```

Chỉnh hằng số `ITERATIONS` ở đầu file nếu demo chạy quá nhanh/chậm. Mục tiêu: 3–5 giây mỗi lần gọi.

## `04-lag-monitor.js` — Đo mức độ nghẽn

```bash
node 04-lag-monitor.js
```

Kỹ thuật dùng **thật ở production**. Các công cụ APM (New Relic, Datadog) đo bằng đúng nguyên lý này.
