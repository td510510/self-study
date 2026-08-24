# Module 06 — Đa luồng (Concurrency)

> Mục tiêu: hiểu vì sao code chạy sai khi nhiều luồng cùng chạy, dùng đúng `ExecutorService`, `CompletableFuture`, và biết Virtual Threads.
> Thời lượng: 1 tuần.

**Vì sao backend phải học?** Mỗi request HTTP tới Spring Boot đều chạy trên một thread riêng. Nếu bạn để state chung không an toàn (biến static, field của `@Service`), hệ thống sẽ sai dữ liệu **chỉ khi có tải cao** — loại bug khó tái hiện và tốn kém nhất.

---

## 1. Khái niệm nền

- **Process**: một chương trình đang chạy, có vùng nhớ riêng.
- **Thread**: luồng thực thi bên trong process, **dùng chung heap** → nguồn gốc mọi vấn đề.
- **Concurrency** (đồng thời): nhiều việc *xen kẽ* nhau. **Parallelism** (song song): nhiều việc chạy *cùng lúc* trên nhiều nhân CPU.

Mỗi thread có **stack riêng** (biến cục bộ → an toàn) nhưng **heap chung** (object, field → nguy hiểm).

## 2. Tạo thread

```java
// Cách 1: implement Runnable (ưu tiên)
Thread t = new Thread(() -> System.out.println("Chạy trong " + Thread.currentThread().getName()));
t.start();      // ⚠ start() chứ không phải run(); run() chỉ gọi hàm bình thường trên thread hiện tại
t.join();       // đợi thread này xong

// Cách 2: kế thừa Thread — ít dùng, vì đã "tiêu" mất suất kế thừa duy nhất
```

Vòng đời: `NEW → RUNNABLE → (BLOCKED / WAITING / TIMED_WAITING) → TERMINATED`.

> Thực tế **bạn hiếm khi tự `new Thread()`**. Tạo thread rất tốn (~1MB stack). Hãy dùng thread pool.

## 3. Race condition — bài học quan trọng nhất

```java
class Counter {
    private int count = 0;
    public void increment() { count++; }        // KHÔNG nguyên tử!
}
```
`count++` thực chất là 3 bước: **đọc → cộng → ghi**. Hai thread xen kẽ nhau ở giữa 3 bước này sẽ làm mất kết quả của nhau. Chạy 1000 thread mỗi thread tăng 1000 lần, kết quả sẽ **nhỏ hơn** 1.000.000. Xem [src/conc/RaceConditionDemo.java](src/conc/RaceConditionDemo.java).

### Ba cách sửa

```java
// 1. synchronized — khóa, chỉ 1 thread vào tại một thời điểm
public synchronized void increment() { count++; }
// hoặc khóa trên object cụ thể
private final Object lock = new Object();
public void increment() { synchronized (lock) { count++; } }

// 2. AtomicInteger — dùng CAS (compare-and-swap) ở mức CPU, nhanh hơn khóa
private final AtomicInteger count = new AtomicInteger();
count.incrementAndGet();

// 3. Không chia sẻ state — cách tốt nhất
// mỗi thread tính riêng rồi gộp kết quả cuối cùng
```

### `volatile` — chỉ giải quyết *hiển thị*, không giải quyết *nguyên tử*
```java
private volatile boolean running = true;    // ✅ đảm bảo thread khác thấy thay đổi ngay
private volatile int count;                 // ❌ count++ vẫn không an toàn
```
Mỗi CPU core có cache riêng; không có `volatile`, thread B có thể không bao giờ thấy thay đổi của thread A và lặp vô hạn.

## 4. Deadlock

Xảy ra khi hai thread giữ khóa của nhau và cùng chờ:
```java
// Thread 1: synchronized(A) { synchronized(B) { } }
// Thread 2: synchronized(B) { synchronized(A) { } }   -> treo vĩnh viễn
```
**Cách phòng**: luôn lấy khóa theo **cùng một thứ tự**; dùng `tryLock(timeout)` của `ReentrantLock`; giảm phạm vi khóa; tốt nhất là tránh cần nhiều khóa.

## 5. ExecutorService — cách dùng thread trong thực tế

```java
ExecutorService pool = Executors.newFixedThreadPool(4);

pool.submit(() -> System.out.println("task"));           // Runnable
Future<Integer> f = pool.submit(() -> 1 + 1);            // Callable, có kết quả
Integer result = f.get();                                // chờ (blocking)

pool.shutdown();                                          // không nhận task mới, chờ task đang chạy
pool.awaitTermination(10, TimeUnit.SECONDS);
pool.shutdownNow();                                       // hủy ngay
```

| Loại pool | Đặc điểm | Dùng khi |
|---|---|---|
| `newFixedThreadPool(n)` | n thread cố định | **mặc định** |
| `newCachedThreadPool()` | tự co giãn, thread rảnh sống 60s | nhiều task ngắn |
| `newSingleThreadExecutor()` | 1 thread, chạy tuần tự | cần thứ tự |
| `newScheduledThreadPool(n)` | chạy theo lịch/định kỳ | job định kỳ |
| `newVirtualThreadPerTaskExecutor()` | Java 21+, mỗi task 1 virtual thread | **tác vụ I/O** |

Chọn kích thước pool:
- Tác vụ **nặng CPU** (tính toán): số thread ≈ số nhân CPU.
- Tác vụ **I/O** (gọi API, query DB): nhiều hơn số nhân, hoặc dùng virtual thread.

> ⚠ **Luôn `shutdown()`** — nếu không, JVM không thoát vì thread pool là thread non-daemon.

## 6. CompletableFuture — bất đồng bộ có tổ chức

```java
CompletableFuture<String> f = CompletableFuture.supplyAsync(() -> callApi());

f.thenApply(String::toUpperCase)             // biến đổi kết quả
 .thenAccept(System.out::println)            // tiêu thụ
 .exceptionally(ex -> { log(ex); return null; });

// Chạy song song rồi gộp
CompletableFuture<User> u = CompletableFuture.supplyAsync(() -> userService.find(id));
CompletableFuture<List<Order>> o = CompletableFuture.supplyAsync(() -> orderService.findByUser(id));
u.thenCombine(o, (user, orders) -> new UserProfile(user, orders)).join();

// Chờ tất cả
CompletableFuture.allOf(f1, f2, f3).join();
```

Đây chính là cách rút ngắn thời gian phản hồi API: 3 lệnh gọi mỗi cái 300ms nếu chạy tuần tự mất 900ms, chạy song song chỉ ~300ms. Xem [src/conc/CompletableFutureDemo.java](src/conc/CompletableFutureDemo.java).

## 7. Collection an toàn đa luồng

```java
Map<String, Integer> map = new ConcurrentHashMap<>();     // thay HashMap
List<String> list = new CopyOnWriteArrayList<>();          // đọc nhiều, ghi rất ít
BlockingQueue<Task> queue = new LinkedBlockingQueue<>();   // mô hình producer-consumer
AtomicInteger counter = new AtomicInteger();
AtomicLong total = new AtomicLong();
```
`Collections.synchronizedMap()` khóa toàn bộ map — chậm. `ConcurrentHashMap` chỉ khóa từng phần → nhanh hơn nhiều. **Trong Spring, mọi cache thủ công nên dùng `ConcurrentHashMap`.**

> Lưu ý: `ConcurrentHashMap` an toàn cho từng thao tác, nhưng chuỗi thao tác thì không:
> ```java
> if (!map.containsKey(k)) map.put(k, v);       // ❌ vẫn race
> map.putIfAbsent(k, v);                         // ✅ nguyên tử
> map.compute(k, (key, old) -> old == null ? 1 : old + 1);   // ✅
> ```

## 8. Virtual Threads (Java 21) — thay đổi cuộc chơi

Thread thường ánh xạ 1-1 với thread hệ điều hành → tốn ~1MB, tạo được vài nghìn là hết sức. **Virtual thread** do JVM quản lý, chỉ vài KB, tạo **hàng triệu** cái được.

```java
// Mỗi task một virtual thread
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 10_000; i++) {
        executor.submit(() -> { callSlowApi(); return null; });
    }
}   // close() tự chờ tất cả xong
```
Ý nghĩa với backend: code **blocking** viết đơn giản (dễ đọc, dễ debug) mà vẫn chịu tải cao — không cần reactive phức tạp. Spring Boot 3.2+ bật bằng một dòng:
```properties
spring.threads.virtual.enabled=true
```
Lưu ý: virtual thread giỏi ở tác vụ **I/O**, không giúp gì cho tác vụ nặng CPU. Và **không dùng `synchronized`** trong virtual thread (có thể "pin" thread) — dùng `ReentrantLock`.

## 9. Quy tắc an toàn khi viết Spring Boot

1. **`@Service`, `@Component` là singleton** — dùng chung cho mọi request. Tuyệt đối **không** đặt state thay đổi được vào field:
   ```java
   @Service
   public class OrderService {
       private List<Order> cache = new ArrayList<>();   // ❌ bug đa luồng
       private final OrderRepository repo;              // ✅ chỉ phụ thuộc bất biến
   }
   ```
2. Ưu tiên **object bất biến** (`record`, field `final`).
3. Dùng `ConcurrentHashMap` cho cache tự viết.
4. Đừng tự `new Thread()` trong controller — dùng `@Async` hoặc `CompletableFuture` với pool được cấu hình.
5. Cập nhật đồng thời trên DB → dùng **transaction + optimistic locking (`@Version`)**, không tự khóa trong Java (khóa Java vô dụng khi chạy nhiều instance).

---

## Tổng kết
- Heap chung = nguồn gốc race condition; `count++` không nguyên tử.
- `synchronized` / `Atomic` / không chia sẻ state — chọn theo thứ tự ưu tiên ngược lại.
- `volatile` chỉ đảm bảo hiển thị.
- Dùng `ExecutorService`, luôn `shutdown()`.
- `CompletableFuture` để chạy song song các lời gọi I/O.
- Virtual threads (Java 21) cho I/O quy mô lớn.

## Code trong module
- [src/conc/RaceConditionDemo.java](src/conc/RaceConditionDemo.java) — nhìn thấy dữ liệu sai, rồi 3 cách sửa
- [src/conc/ExecutorDemo.java](src/conc/ExecutorDemo.java) — thread pool, Future, shutdown
- [src/conc/CompletableFutureDemo.java](src/conc/CompletableFutureDemo.java) — tuần tự vs song song
- [src/conc/VirtualThreadDemo.java](src/conc/VirtualThreadDemo.java) — 10.000 tác vụ I/O
- [src/conc/DeadlockDemo.java](src/conc/DeadlockDemo.java) — tạo deadlock rồi sửa

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 07 — JVM & Hiệu năng](../07-jvm-performance/).
