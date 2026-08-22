# Lab 03 — Đo lường & ước lượng

| File | Chạy | Học được gì |
|---|---|---|
| `01-capacity.js` | `node labs/lab03-do-luong/01-capacity.js` | Ước lượng QPS/storage/bandwidth và **suy ra quyết định thiết kế** |
| `02-percentile.js` | `node labs/lab03-do-luong/02-percentile.js` | p50/p95/p99 vs trung bình, khuếch đại đuôi, giới hạn của cache |
| `03-load-test.js` | cần server lab 02 chạy trước | Tự đo tải, tìm điểm knee |
| `04-little-law.js` | `node labs/lab03-do-luong/04-little-law.js` | Vì sao latency bùng nổ khi tải > 80% |

## Bài tập bắt buộc

1. **`01-capacity.js`** — Sửa `DE_BAI` thành startup nhỏ: 10.000 user, tỉ lệ DAU 30%, mỗi user
   đăng 1 bài/ngày. Chạy lại và ghi lại: kết luận thay đổi thế nào? Có còn cần sharding không?

2. **`02-percentile.js`** — Sửa hàm `sinhLatency` để đuôi dài hơn (2% request mất 5s). Quan sát:
   trung bình đổi bao nhiêu? p99 đổi bao nhiêu? Cái nào phản ánh đúng trải nghiệm user?

3. **`03-load-test.js`** — Chạy với server lab 02. Ghi lại QPS tối đa và concurrency tại điểm knee.
   Sau đó thêm `await new Promise(r => setTimeout(r, 50))` vào handler `listProducts` của server
   (giả lập query DB chậm), chạy lại. QPS tối đa giảm bao nhiêu lần? Vì sao?

4. **`04-little-law.js`** — Với ρ = 95%, có bao nhiêu request nằm trong hệ thống? Nếu mỗi request
   giữ 1 connection DB và pool chỉ có 20 connection thì chuyện gì xảy ra?

## Câu hỏi tổng kết

> Nếu chỉ được nhớ **một** ý duy nhất từ buổi 03, đó là gì?

Gợi ý đáp án: *Latency không tăng tuyến tính theo tải — nó nổ tung khi hệ thống gần bão hoà. Vì
vậy phải luôn chừa dư địa, và phải đo bằng percentile chứ không phải trung bình.*
