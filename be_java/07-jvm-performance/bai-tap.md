# Bài tập Module 07 — JVM & Hiệu năng

> Module này thiên về **thực hành với công cụ**. Hãy mở terminal và làm thật.

## Nhóm A — Quan sát JVM

**A1.** Chạy `MemoryDemo` với các tham số `-Xmx32m`, `-Xmx128m`, `-Xmx1g`. Ghi lại khác biệt.

**A2.** Dùng `jps -l` tìm PID ứng dụng Java đang chạy, rồi:
```bash
jstat -gc <pid> 1000 10
jmap -histo <pid> | head -20
jcmd <pid> VM.flags
```
Giải thích ý nghĩa các cột `EU`, `OU`, `YGC`, `FGC` của `jstat`.

**A3.** Mở **VisualVM** (hoặc `jconsole`), gắn vào một chương trình Java đang chạy, quan sát đồ thị heap trong lúc chương trình cấp phát object. Chụp lại hình răng cưa của Minor GC.

**A4.** So sánh 3 loại GC trên cùng một workload:
```bash
java -XX:+UseSerialGC   -Xlog:gc -cp out perf.MemoryDemo
java -XX:+UseParallelGC -Xlog:gc -cp out perf.MemoryDemo
java -XX:+UseG1GC       -Xlog:gc -cp out perf.MemoryDemo
```
Đếm số lần GC và tổng thời gian dừng.

## Nhóm B — Lỗi bộ nhớ

**B1.** Tạo `StackOverflowError` bằng đệ quy; đo độ sâu tối đa với `-Xss256k`, `-Xss1m`, `-Xss8m`.

**B2.** Tạo `OutOfMemoryError: Java heap space` với `-Xmx64m`. Bật `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./heap.hprof`, kiểm tra file được sinh ra.

**B3.** Tải **Eclipse MAT**, mở file `heap.hprof` ở B2, chạy "Leak Suspects Report", chỉ ra class chiếm nhiều bộ nhớ nhất.

**B4.** Viết chương trình có memory leak thật (cache static tăng mãi) chạy được 5 phút rồi OOM. Dùng `jstat` quan sát Old Gen không giảm sau Full GC — đó là dấu hiệu leak.

**B5.** Sửa B4 bằng LRU cache có giới hạn, chứng minh RAM ổn định.

**B6.** Mô phỏng leak `ThreadLocal` trong thread pool, rồi sửa bằng `remove()` trong `finally`.

## Nhóm C — Tối ưu thuật toán

**C1.** Cho 100.000 `Order` và 50.000 `User`, ghép order với user bằng 2 cách (lồng vòng lặp vs `Map`). Đo và giải thích.

**C2.** Kiểm tra tồn tại phần tử: `List.contains` vs `HashSet.contains` với 1 triệu phần tử.

**C3.** Đọc file 500MB đếm số dòng chứa "ERROR" bằng 2 cách (`readAllLines` vs `Files.lines`). Đo RAM đỉnh bằng `Runtime`.

**C4.** Sắp xếp 5 triệu số: `Arrays.sort` vs `Arrays.parallelSort`.

**C5.** Tìm 3 đoạn code chậm trong bài tập các module trước của bạn và tối ưu, kèm số đo trước/sau.

## Nhóm D — Benchmark cho đúng

**D1.** Viết benchmark thô đo `StringBuilder` vs `+`; sau đó thêm warm-up 10.000 vòng và so sánh kết quả. Giải thích vì sao khác.

**D2.** (Nâng cao, cần Maven — làm sau Module 09) Viết benchmark JMH cho cùng phép đo và so sánh với kết quả thủ công.

**D3.** Giải thích vì sao 3 kết quả đo sau đây không đáng tin: (a) chạy 1 lần duy nhất, (b) đo cả thời gian khởi động JVM, (c) code bị JIT loại bỏ vì kết quả không được dùng.

## Nhóm E — Tổng hợp

**E1. Chẩn đoán ứng dụng "chậm".** Viết một chương trình cố tình có 3 vấn đề:
- một vòng lặp O(n²),
- một memory leak,
- một chỗ nối chuỗi trong vòng lặp lớn.

Sau đó đóng vai người trực sự cố: dùng công cụ đo, viết báo cáo gồm *triệu chứng → cách phát hiện → nguyên nhân → cách sửa → số đo sau khi sửa*.

*Đạt khi*: báo cáo có số liệu cụ thể, không phải phỏng đoán.

---

## Câu hỏi phỏng vấn
1. Heap và Stack khác nhau thế nào? Cái gì nằm ở đâu?
2. Young Gen / Old Gen là gì? Minor GC khác Major GC ra sao?
3. GC quyết định object nào bị dọn bằng cách nào (GC Root)?
4. Java có GC rồi sao vẫn memory leak được? Nêu 3 nguyên nhân.
5. `OutOfMemoryError` và `StackOverflowError` khác nhau thế nào?
6. `-Xms`, `-Xmx`, `-Xss` là gì?
7. Bạn sẽ làm gì khi production báo API chậm dần và RAM tăng?
8. JIT là gì? Ảnh hưởng thế nào tới benchmark?
9. `System.gc()` có ép GC chạy không?
10. Thứ tự bạn ưu tiên khi tối ưu một API chậm?
