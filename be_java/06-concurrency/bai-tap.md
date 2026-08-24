# Bài tập Module 06 — Đa luồng

## Nhóm A — Thread cơ bản

**A1.** Tạo 5 thread, mỗi thread in tên mình 3 lần. Quan sát thứ tự in thay đổi mỗi lần chạy.

**A2.** So sánh `t.start()` và `t.run()` — in tên thread trong cả hai trường hợp và giải thích.

**A3.** Dùng `join()` để bắt buộc thread A xong mới tới B, B xong mới tới C.

**A4.** Viết thread worker chạy tới khi cờ `volatile boolean running = false`. Thử bỏ `volatile` và chạy với `-server`, quan sát hiện tượng.

## Nhóm B — Race condition

**B1.** Tái hiện `count++` sai với 100 thread × 10.000 lần. Chạy 5 lần, ghi lại 5 kết quả khác nhau.

**B2.** Sửa B1 bằng 3 cách (`synchronized`, `AtomicInteger`, `LongAdder`) và so sánh thời gian.

**B3. Tài khoản ngân hàng.** 2 thread cùng chuyển tiền qua lại 10.000 lần. Chứng minh tổng số dư bị sai khi không đồng bộ, và đúng khi có đồng bộ.

**B4.** Chứng minh `HashMap` mất dữ liệu khi ghi đa luồng; thay bằng `ConcurrentHashMap`.

**B5.** `if (!map.containsKey(k)) map.put(k, v)` vẫn có race. Chỉ ra tình huống và sửa bằng `putIfAbsent`/`compute`.

**B6. Singleton an toàn đa luồng.** Cài bằng 3 cách: eager, double-checked locking (`volatile`), và enum. Giải thích vì sao thiếu `volatile` thì DCL sai.

## Nhóm C — ExecutorService

**C1.** Xử lý 100 task với pool 10 thread; in tên thread thực thi mỗi task.

**C2.** Dùng `invokeAll` chạy 20 tác vụ tính toán, gom kết quả bằng `Future.get()`.

**C3.** So sánh thời gian tải 20 "trang web" (giả lập `sleep(500)`) khi: tuần tự / pool 5 / pool 20 / virtual thread.

**C4.** Viết `ThreadPoolExecutor` tùy chỉnh với hàng đợi giới hạn 100 và `RejectedExecutionHandler` ghi log. Gửi 1000 task và quan sát chính sách từ chối.

**C5.** Producer–Consumer với `BlockingQueue`: 3 producer, 2 consumer, dừng sạch bằng "poison pill".

**C6.** Chứng minh quên `shutdown()` khiến JVM không thoát.

## Nhóm D — CompletableFuture

**D1.** Gọi 3 service giả lập (mỗi cái 300ms), đo thời gian tuần tự vs song song.

**D2.** Chuỗi: lấy user → lấy đơn hàng của user → tính tổng tiền, dùng `thenCompose`.

**D3.** `thenCombine` gộp kết quả 2 lời gọi độc lập.

**D4.** Xử lý lỗi bằng `exceptionally` và `handle`; thêm timeout bằng `orTimeout`/`completeOnTimeout`.

**D5.** `allOf` chờ 10 lời gọi, gom thành `List<Result>`; nếu 1 cái lỗi thì các cái còn lại vẫn có kết quả.

**D6.** Cài `retryAsync(Supplier<CompletableFuture<T>>, int maxRetry)` với backoff.

## Nhóm E — Virtual Threads (Java 21+)

**E1.** Chạy 10.000 tác vụ I/O bằng platform pool và virtual thread, so sánh thời gian + số thread OS.

**E2.** Thử tạo 100.000 platform thread → quan sát `OutOfMemoryError`; làm lại với virtual thread.

**E3.** Đọc tài liệu về "pinning": vì sao không nên dùng `synchronized` trong virtual thread?

## Nhóm F — Deadlock

**F1.** Tạo deadlock 2 khóa; dùng `jconsole` hoặc `jstack` để phát hiện.

**F2.** Sửa bằng cách sắp thứ tự khóa nhất quán.

**F3.** Sửa bằng `ReentrantLock.tryLock(timeout)`.

**F4.** Mô phỏng "bữa ăn của các triết gia" (5 triết gia) và giải quyết không deadlock.

## Nhóm G — Tổng hợp (bắt buộc)

**G1. Trình tải file song song.** Cho danh sách 50 URL (giả lập `sleep` ngẫu nhiên 200–800ms):
- Tải song song với pool cấu hình được.
- Hiển thị tiến độ (đã xong x/50).
- Retry 3 lần nếu lỗi.
- Timeout mỗi file 2 giây.
- Tổng kết: thành công/thất bại, tổng thời gian.

*Đạt khi*: dùng `CompletableFuture` + `AtomicInteger` cho tiến độ, không có race condition, pool được shutdown đúng.

**G2. Kho hàng an toàn đa luồng.**
- `Inventory` với `ConcurrentHashMap<String, Integer>` (mã SP → tồn kho).
- 100 thread đặt hàng đồng thời cùng 1 sản phẩm có 50 cái tồn.
- Yêu cầu: **đúng 50 đơn thành công**, 50 đơn bị từ chối, tồn kho về 0, không âm.

*Đạt khi*: dùng `compute`/`merge` nguyên tử chứ không phải `get` rồi `put`.
*Suy nghĩ thêm*: khi ứng dụng chạy 3 instance thì khóa trong Java còn tác dụng không? (Trả lời: không — cần khóa ở tầng DB hoặc Redis; sẽ học ở Module 12 & 14.)

---

## Câu hỏi phỏng vấn
1. Process khác Thread thế nào?
2. Race condition là gì? Cho ví dụ `count++`.
3. `synchronized` và `volatile` khác nhau ra sao?
4. `AtomicInteger` hoạt động thế nào (CAS)?
5. Deadlock là gì, phòng tránh cách nào?
6. `HashMap` vs `ConcurrentHashMap`?
7. Vì sao không nên `new Thread()` trong ứng dụng web?
8. `Callable` khác `Runnable`?
9. Virtual thread là gì, dùng khi nào?
10. Vì sao không được để state thay đổi được trong field của `@Service`?
