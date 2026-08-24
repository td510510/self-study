# Module 07 — JVM, bộ nhớ & hiệu năng

> Mục tiêu: hiểu bộ nhớ JVM để chẩn đoán được `OutOfMemoryError`, memory leak, ứng dụng chậm — những việc bạn sẽ phải làm khi hệ thống chạy production.
> Thời lượng: 1 tuần (lý thuyết nhiều, thực hành bằng công cụ).

---

## 1. JVM chạy chương trình như thế nào

```
Mã nguồn .java ──javac──► .class (bytecode)
                            │
                            ▼
                   ┌─────────────────┐
                   │  Class Loader   │  nạp .class vào bộ nhớ
                   └────────┬────────┘
                            ▼
          ┌──────────────── Runtime Data Areas ────────────────┐
          │  Heap  │ Metaspace │ Stack (mỗi thread) │ PC │ ... │
          └────────────────────┬───────────────────────────────┘
                               ▼
                   ┌─────────────────────┐
                   │ Execution Engine    │  Interpreter + JIT + GC
                   └─────────────────────┘
```

**JIT (Just-In-Time)**: JVM ban đầu thông dịch bytecode; đoạn code nào chạy nhiều lần ("hot") sẽ được biên dịch sang mã máy và tối ưu. Đó là lý do vòng lặp đầu tiên trong benchmark luôn chậm hơn — phải "warm-up" trước khi đo.

## 2. Các vùng bộ nhớ

| Vùng | Chứa gì | Riêng/chung | Lỗi khi đầy |
|---|---|---|---|
| **Heap** | mọi object, mảng | chung mọi thread | `OutOfMemoryError: Java heap space` |
| **Stack** | biến cục bộ, khung gọi hàm | riêng từng thread | `StackOverflowError` |
| **Metaspace** | metadata của class | chung | `OutOfMemoryError: Metaspace` |
| **PC Register** | lệnh đang thực thi | riêng | — |
| **Native Method Stack** | code JNI | riêng | — |

```java
void method() {
    int x = 5;                    // x nằm trên STACK
    String s = "hello";           // biến s trên stack, object String trên HEAP
    List<Integer> list = new ArrayList<>();   // list trên stack, object trên HEAP
}   // hết method: khung stack biến mất; object trên heap chờ GC dọn
```

### Cấu trúc Heap
```
┌──────────────── Heap ──────────────────┐
│  Young Generation   │  Old Generation   │
│ ┌─────┬─────┬─────┐ │                   │
│ │Eden │ S0  │ S1  │ │   object sống lâu │
│ └─────┴─────┴─────┘ │                   │
└────────────────────────────────────────┘
```
- Object mới sinh ra ở **Eden**.
- Eden đầy → **Minor GC**: object còn sống chuyển sang Survivor.
- Sống sót qua nhiều lần GC → thăng lên **Old Gen**.
- Old Gen đầy → **Major/Full GC** (tốn kém, làm ứng dụng khựng lại).

**Giả thuyết thế hệ**: đa số object chết trẻ. Vì vậy Minor GC rất nhanh, và đó là lý do phân chia thế hệ.

## 3. Garbage Collection

GC tự động thu hồi object **không còn tham chiếu nào từ GC Root** (biến trên stack các thread, biến static, JNI reference).

```java
User u = new User();     // 1 tham chiếu
u = null;                // 0 tham chiếu -> đủ điều kiện bị dọn
```

Các GC phổ biến:

| GC | Đặc điểm | Dùng khi |
|---|---|---|
| **Serial** | 1 thread | container siêu nhỏ |
| **Parallel** | nhiều thread, tối ưu throughput | batch job |
| **G1** (mặc định từ Java 9) | chia vùng, có mục tiêu độ trễ | **hầu hết ứng dụng web** |
| **ZGC / Shenandoah** | dừng < 1ms, heap rất lớn | hệ thống nhạy độ trễ |

```bash
java -Xms512m -Xmx2g -XX:+UseG1GC -jar app.jar
```
- `-Xms`: heap khởi tạo. `-Xmx`: heap tối đa.
- Trong container: đặt `-Xmx` ≈ 50–75% RAM giới hạn, hoặc dùng `-XX:MaxRAMPercentage=75`.
- Mẹo production: đặt `-Xms` = `-Xmx` để tránh JVM phải co giãn heap.

> **`System.gc()` không ép GC chạy** — chỉ là gợi ý, và gọi nó gần như luôn là dấu hiệu code có vấn đề.

## 4. Memory leak trong Java (có GC vẫn rò rỉ)

GC chỉ dọn object **không còn tham chiếu**. Rò rỉ xảy ra khi bạn *vô tình* giữ tham chiếu mãi:

```java
// 1. Collection static tăng mãi — thủ phạm số 1
public class Cache {
    private static final Map<String, Object> CACHE = new HashMap<>();   // không bao giờ xóa
}
// ✅ Sửa: dùng thư viện cache có TTL/giới hạn (Caffeine), hoặc WeakHashMap

// 2. Không đóng tài nguyên
InputStream is = new FileInputStream(f);   // quên close
// ✅ try-with-resources

// 3. Listener không hủy đăng ký
eventBus.register(this);                   // quên unregister

// 4. Inner class không static giữ tham chiếu tới object bao ngoài
class Outer { class Inner { } }            // Inner giữ Outer sống
// ✅ dùng static nested class

// 5. ThreadLocal không remove trong thread pool
threadLocal.set(bigObject);                // thread sống mãi -> object sống mãi
// ✅ try { ... } finally { threadLocal.remove(); }
```

Triệu chứng: RAM tăng dần theo thời gian, Full GC ngày càng thường xuyên, cuối cùng là `OutOfMemoryError`.

## 5. Bộ công cụ chẩn đoán (JDK có sẵn)

```bash
jps -l                          # liệt kê tiến trình Java + PID
jstat -gc <pid> 1000            # thống kê GC mỗi giây
jmap -histo <pid> | head -20    # top class chiếm bộ nhớ
jmap -dump:live,format=b,file=heap.hprof <pid>   # dump heap để phân tích
jstack <pid>                    # dump toàn bộ thread — tìm deadlock/thread treo
jcmd <pid> VM.flags             # xem tham số JVM đang chạy
```

- **jconsole / VisualVM**: xem heap, thread, GC theo thời gian thực (giao diện đồ họa).
- **Eclipse MAT**: mở file `.hprof`, tìm "Leak Suspects" — công cụ chuẩn để truy memory leak.
- **JFR (Java Flight Recorder)**: ghi hồ sơ hiệu năng chi phí thấp, dùng được cả trên production:
  ```bash
  java -XX:StartFlightRecording=duration=60s,filename=rec.jfr -jar app.jar
  ```

Luôn bật tự động dump khi hết bộ nhớ trên production:
```bash
-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/
```

## 6. Ba lỗi bộ nhớ và cách xử lý

**`OutOfMemoryError: Java heap space`**
Nguyên nhân: heap thật sự thiếu, hoặc memory leak, hoặc nạp quá nhiều dữ liệu một lúc (`findAll()` 5 triệu bản ghi!).
Xử lý: dump heap → MAT → tìm object chiếm nhiều nhất → sửa code. Chỉ tăng `-Xmx` khi đã chắc không phải leak.

**`StackOverflowError`**
Nguyên nhân: đệ quy vô hạn (thường do hàm không có điều kiện dừng), hoặc quan hệ hai chiều JPA gây `toString()` đệ quy.
Xử lý: sửa logic. Tăng `-Xss` chỉ là giải pháp tạm.

**`OutOfMemoryError: Metaspace`**
Nguyên nhân: nạp class không giới hạn (hot reload nhiều lần, sinh proxy động).

## 7. Tối ưu hiệu năng — theo thứ tự ưu tiên

Nguyên tắc: **đo trước, tối ưu sau.** "Tối ưu sớm là gốc rễ của mọi tội lỗi" — Donald Knuth.

Thứ tự tác động thực tế trong backend (từ lớn tới nhỏ):
1. **Truy vấn database** — N+1, thiếu index, `SELECT *`. Đây là 80% nguyên nhân API chậm.
2. **Gọi mạng** — gọi tuần tự thay vì song song, thiếu timeout, không cache.
3. **Thuật toán** — O(n²) trên dữ liệu lớn, tìm kiếm trong `List` thay vì `Map`.
4. **Bộ nhớ/GC** — tạo quá nhiều object rác, nạp dữ liệu quá lớn.
5. **Vi tối ưu Java** — hầu như không đáng kể so với 4 mục trên.

```java
// Ví dụ tác động lớn: tra cứu trong vòng lặp
// ❌ O(n*m)
for (Order o : orders) {
    User u = users.stream().filter(x -> x.getId().equals(o.getUserId())).findFirst().orElse(null);
}
// ✅ O(n+m)
Map<Long, User> userById = users.stream().collect(toMap(User::getId, u -> u));
for (Order o : orders) { User u = userById.get(o.getUserId()); }
```

Vài quy tắc bộ nhớ đáng nhớ:
- `StringBuilder` trong vòng lặp (module 01).
- Khai báo sẵn dung lượng: `new ArrayList<>(1000)`, `new HashMap<>(256)`.
- Dùng `IntStream` thay `Stream<Integer>` khi tính toán số lượng lớn.
- Xử lý dữ liệu lớn theo lô (batch/stream), không nạp hết vào RAM.

## 8. Đo hiệu năng cho đúng

```java
// ❌ Sai: chưa warm-up JIT, bị ảnh hưởng bởi GC
long t = System.currentTimeMillis();
doWork();
System.out.println(System.currentTimeMillis() - t);

// ✅ Đúng: dùng JMH (Java Microbenchmark Harness)
@Benchmark
public void testMethod() { doWork(); }
```
Nếu chỉ đo thô, hãy: chạy warm-up vài nghìn vòng trước, lặp nhiều lần lấy trung bình, dùng `System.nanoTime()`.

Ở tầng ứng dụng thì đo bằng: **Micrometer + Prometheus + Grafana** (module 15), và tracing (Zipkin/Jaeger).

---

## Tổng kết
- Heap chứa object (chung), Stack chứa biến cục bộ (riêng từng thread).
- Young/Old Gen; Minor GC nhanh, Full GC tốn kém.
- Java vẫn leak được — nguyên nhân số 1 là collection static/cache không giới hạn.
- Công cụ: `jps`, `jstat`, `jmap`, `jstack`, VisualVM, MAT, JFR.
- Tối ưu: DB → mạng → thuật toán → bộ nhớ. Luôn đo trước.

## Code trong module
- [src/perf/MemoryDemo.java](src/perf/MemoryDemo.java) — quan sát heap, tạo OOM và StackOverflow có kiểm soát
- [src/perf/LeakDemo.java](src/perf/LeakDemo.java) — mô phỏng memory leak và cách sửa
- [src/perf/PerfDemo.java](src/perf/PerfDemo.java) — so sánh O(n²) vs O(n), boxing, StringBuilder

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 08 — SQL & JDBC](../08-sql-jdbc/).
