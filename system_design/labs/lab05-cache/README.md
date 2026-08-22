# Lab 05 — Caching

| File | Học được gì |
|---|---|
| `01-lru.js` | Tự cài LRU/LFU/FIFO, so hit rate trên 4 mẫu truy cập |
| `02-cache-aside.js` | Cache-aside giảm tải DB bao nhiêu lần; TTL là núm vặn đánh đổi |
| `03-stampede.js` | ⭐ Tái hiện sự cố cache stampede và 3 cách chữa |
| `04-invalidation.js` | Race condition: vì sao **xoá** cache an toàn hơn **cập nhật** |

```bash
node labs/lab05-cache/01-lru.js
node labs/lab05-cache/02-cache-aside.js
node labs/lab05-cache/03-stampede.js
node labs/lab05-cache/04-invalidation.js
```

## Kết quả mong đợi (để giảng viên đối chiếu)

- `01`: Zipf ~67% hit @100 key; phân phối Đều chỉ ~10%; quét tuần tự 0%.
- `02`: cache 100/500 key → giảm tải DB ~×3,8.
- `03`: ngây thơ ~520 query + hàng trăm lỗi quá tải; single-flight ~5 query.
- `04`: cách "cập nhật cache" sai ~25%; cách "xoá cache" sai ~0%.

## Điểm nhấn khi giảng

Ở `04-invalidation.js`, hãy chỉ cho học viên thấy: nếu mô phỏng cache bằng `Map` **đồng bộ**, race
condition **không bao giờ xuất hiện**. Chỉ khi cache có độ trễ mạng riêng (đúng như Redis thật) thì
bug mới hiện ra.

> Đây chính là lý do bug production "không tái hiện được trên máy em".
