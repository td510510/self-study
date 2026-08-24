# Câu hỏi phỏng vấn — Java Core

> Cách dùng: che phần đáp án, tự trả lời **thành tiếng**, rồi mới đối chiếu.
> Đáp án ở đây là gợi ý khung; hãy diễn đạt bằng lời của bạn kèm ví dụ từ dự án bạn làm.

---

## A. Nền tảng ngôn ngữ

**1. JDK, JRE, JVM khác nhau thế nào?**
JVM thực thi bytecode. JRE = JVM + thư viện chuẩn. JDK = JRE + công cụ phát triển (`javac`, `jar`, `jshell`). Lập trình viên cài JDK.

**2. Vì sao Java "viết một lần, chạy mọi nơi"?**
`javac` biên dịch ra bytecode độc lập nền tảng; mỗi hệ điều hành có JVM riêng dịch bytecode sang mã máy.

**3. Primitive khác wrapper ra sao?**
Primitive lưu giá trị trực tiếp, không null được, nằm trên stack. Wrapper là object trên heap, có thể null, dùng được trong Collections. Autoboxing tự chuyển đổi — cẩn thận NPE khi unbox `null`.

**4. Vì sao `Integer a = 128, b = 128; a == b` trả về `false`?**
JVM cache `Integer` từ -128 đến 127. Ngoài khoảng đó tạo object mới nên `==` (so địa chỉ) sai. **Luôn dùng `.equals()`** cho object.

**5. Vì sao không dùng `double` cho tiền?**
IEEE-754 không biểu diễn chính xác số thập phân: `0.1 + 0.2 = 0.30000000000000004`. Dùng `BigDecimal` (khởi tạo từ String) hoặc `long` theo đơn vị nhỏ nhất.

**6. `String` immutable nghĩa là gì và vì sao thiết kế vậy?**
Không sửa được sau khi tạo; mọi thao tác trả về object mới. Lợi ích: an toàn đa luồng, dùng chung được trong String Pool, `hashCode` cache được nên làm key HashMap rất tốt.

**7. `String` vs `StringBuilder` vs `StringBuffer`?**
`String` bất biến. `StringBuilder` thay đổi được, **không** đồng bộ, nhanh — dùng khi nối chuỗi trong vòng lặp. `StringBuffer` đồng bộ, chậm hơn, hầu như không còn dùng.

**8. `==` khác `.equals()`?**
`==` so sánh giá trị với primitive, so sánh **địa chỉ tham chiếu** với object. `.equals()` so sánh nội dung theo cách class định nghĩa.

**9. `final`, `finally`, `finalize`?**
`final`: biến không gán lại được / method không override được / class không kế thừa được. `finally`: khối luôn chạy sau try-catch. `finalize`: method cũ của `Object`, **đã bị loại bỏ**, không dùng.

**10. Java truyền tham số theo giá trị hay tham chiếu?**
**Luôn theo giá trị.** Với object, cái được sao chép là giá trị của tham chiếu — nên sửa nội dung object thì bên ngoài thấy, nhưng gán lại tham chiếu thì không.

**11. `var` có làm Java thành ngôn ngữ động không?**
Không. Kiểu vẫn được xác định lúc biên dịch, chỉ là compiler tự suy ra.

**12. `record` là gì, khi nào không nên dùng?**
Class chứa dữ liệu bất biến, tự sinh constructor/getter/equals/hashCode/toString. Không dùng cho JPA Entity (cần constructor rỗng, setter, kế thừa proxy).

---

## B. OOP

**13. Bốn tính chất OOP — nêu kèm ví dụ trong dự án của bạn.**
Encapsulation (field private + method có validate), Inheritance (chỉ khi quan hệ "là một"), Polymorphism (một interface nhiều cài đặt), Abstraction (interface/abstract class che chi tiết).

**14. Overloading khác overriding?**
Overloading: cùng class, cùng tên, khác tham số, quyết định lúc **biên dịch**. Overriding: class con định nghĩa lại method của cha, chữ ký giống hệt, quyết định lúc **chạy**.

**15. Interface khác abstract class?**
Interface: implements được nhiều, chỉ hằng số, có `default`/`static` method (Java 8+), diễn tả "có khả năng". Abstract class: chỉ kế thừa một, có field và constructor, diễn tả "là một loại". Mặc định chọn interface.

**16. Vì sao "composition over inheritance"?**
Kế thừa ràng buộc chặt class con vào class cha — sửa cha vỡ hàng loạt con, và chỉ kế thừa được một. Composition linh hoạt hơn, thay thành phần lúc chạy được, dễ test.

**17. `equals()` và `hashCode()` — hợp đồng là gì? Vi phạm thì sao?**
Hai object bằng nhau **phải** có cùng `hashCode`. Vi phạm thì `HashMap`/`HashSet` hoạt động sai: thêm được phần tử trùng, hoặc `contains()` trả `false` cho object vừa thêm.

**18. `static` method có gọi được biến instance không?**
Không. `static` thuộc về class, chạy được khi chưa có object nào.

**19. SOLID — nêu chữ D và cho ví dụ.**
Dependency Inversion: phụ thuộc vào abstraction, không phụ thuộc class cụ thể. Ví dụ: `OrderService` nhận `PaymentGateway` (interface) qua constructor → đổi cổng thanh toán hoặc mock khi test đều không sửa service.

**20. `sealed` dùng để làm gì?**
Giới hạn class nào được kế thừa → compiler kiểm tra được tính đầy đủ của `switch`, hợp để mô hình hóa tập trạng thái đóng.

---

## C. Collections

**21. `ArrayList` vs `LinkedList` — khi nào dùng cái nào?**
`ArrayList` là mảng động: `get(i)` O(1), chèn đầu O(n), tốn ít bộ nhớ. `LinkedList` chèn/xóa đầu O(1) nhưng `get(i)` O(n) và tốn bộ nhớ hơn. **Thực tế 95% dùng `ArrayList`**; cần hàng đợi/ngăn xếp thì dùng `ArrayDeque`.

**22. `HashMap` hoạt động thế nào?**
Tính `hashCode` của key → xác định bucket. Trùng bucket (collision) thì so `equals` trong danh sách liên kết; Java 8+ chuyển sang cây đỏ-đen khi bucket > 8 phần tử. Vượt `capacity × 0.75` thì resize gấp đôi và băm lại.

**23. Vì sao không dùng object mutable làm key của `HashMap`?**
Sửa field sau khi `put` làm `hashCode` đổi → tra ở bucket khác → không tìm lại được, dữ liệu coi như mất.

**24. `HashMap` vs `Hashtable` vs `ConcurrentHashMap`?**
`Hashtable` cũ, đồng bộ toàn bộ, chậm. `HashMap` không an toàn đa luồng. `ConcurrentHashMap` khóa theo từng phần → an toàn và nhanh; đây là lựa chọn cho đa luồng.

**25. `HashSet`, `LinkedHashSet`, `TreeSet` khác nhau?**
Lần lượt: không đảm bảo thứ tự O(1) / giữ thứ tự chèn / đã sắp xếp O(log n).

**26. `ConcurrentModificationException` xảy ra khi nào?**
Sửa collection trong lúc đang duyệt bằng for-each. Khắc phục: `removeIf()`, `Iterator.remove()`, hoặc `CopyOnWriteArrayList`.

**27. `Comparable` vs `Comparator`?**
`Comparable` định nghĩa thứ tự tự nhiên bên trong class (`compareTo`). `Comparator` định nghĩa thứ tự bên ngoài, linh hoạt, kết hợp được (`thenComparing`, `reversed`).

**28. Type erasure là gì?**
Thông tin generic bị xóa lúc chạy. Hệ quả: không `new T()`, không tạo mảng generic, `List<String>` và `List<Integer>` cùng một class lúc runtime.

**29. PECS là gì?**
Producer Extends, Consumer Super: chỉ đọc thì `? extends T`, chỉ ghi thì `? super T`. Cần vì generic là invariant — `List<Integer>` không phải con của `List<Number>`.

---

## D. Exception & I/O

**30. Checked vs unchecked exception?**
Checked (`IOException`) bị compiler ép xử lý — dành cho sự cố ngoài tầm kiểm soát. Unchecked (`RuntimeException`) không bị ép — thường là lỗi lập trình. Xu hướng hiện đại (Spring) ưu tiên unchecked.

**31. `finally` có luôn chạy không?**
Có, kể cả khi `try` có `return`. Trừ khi `System.exit()`, JVM crash, hoặc thread bị kill. Đừng `return` trong `finally` — nó nuốt exception.

**32. try-with-resources hoạt động thế nào?**
Tài nguyên implement `AutoCloseable` được đóng tự động theo thứ tự ngược, kể cả khi có exception. Luôn dùng cho file, socket, `Connection`/`Statement`/`ResultSet`.

**33. Vì sao `catch (Exception e) {}` là tệ?**
Nuốt lỗi: hệ thống chạy sai âm thầm, không log, debug bằng bóng tối. Hãy bắt loại cụ thể, log kèm ngữ cảnh, hoặc ném tiếp.

**34. Bọc exception thì cần chú ý gì?**
Luôn truyền exception gốc làm `cause`: `new DataAccessException("msg", e)`. Không truyền là mất sạch stacktrace gốc.

**35. `Optional` giải quyết vấn đề gì? Dùng sai ở đâu?**
Diễn tả rõ "có thể không có giá trị" ngay ở kiểu trả về. Dùng sai: làm tham số method, làm field entity, gọi `get()` mà không kiểm tra.

**36. Vì sao nên lưu thời gian dạng UTC?**
Không phụ thuộc múi giờ và quy ước giờ mùa hè; đổi sang giờ địa phương chỉ khi hiển thị. Dùng `Instant` trong Java, `TIMESTAMPTZ` trong Postgres.

---

## E. Functional & Stream

**37. Functional interface là gì? Kể 6 cái phổ biến.**
Interface có đúng một method abstract. `Function`, `Predicate`, `Consumer`, `Supplier`, `BiFunction`, `UnaryOperator`.

**38. Stream khác Collection thế nào?**
Collection lưu trữ dữ liệu; Stream mô tả **phép xử lý** trên dữ liệu. Stream lazy, không sửa nguồn, chỉ dùng được một lần.

**39. Lazy evaluation nghĩa là gì?**
Các phép trung gian (`filter`, `map`) chỉ chạy khi có phép kết thúc (`collect`, `count`). Nhờ vậy có short-circuit: `findFirst` dừng ngay khi tìm thấy.

**40. `map` khác `flatMap`?**
`map` biến 1 phần tử thành 1 phần tử. `flatMap` biến 1 phần tử thành một stream rồi làm phẳng — dùng khi có collection lồng nhau.

**41. Khi nào `parallelStream()` có hại?**
Dữ liệu nhỏ, tác vụ I/O, có tác dụng phụ, hoặc trong ứng dụng web (nó dùng chung ForkJoinPool chung, dễ làm nghẽn cả ứng dụng). Với I/O hãy dùng `CompletableFuture` hoặc virtual thread.

**42. `Collectors.toMap` có bẫy gì?**
Trùng key → `IllegalStateException`; value `null` → NPE. Luôn truyền hàm merge.

**43. Vì sao biến dùng trong lambda phải effectively final?**
Lambda có thể chạy ở thread khác/thời điểm khác; Java sao chép giá trị biến cục bộ nên nó không được thay đổi để tránh nhập nhằng.

---

## F. Concurrency

**44. Process khác Thread?**
Process có vùng nhớ riêng; thread nằm trong process, **dùng chung heap** nhưng có stack riêng.

**45. Race condition là gì? Cho ví dụ.**
Nhiều thread cùng đọc-ghi một dữ liệu, kết quả phụ thuộc thứ tự thực thi. `count++` là 3 bước (đọc, cộng, ghi) nên hai thread có thể ghi đè lẫn nhau → mất số đếm.

**46. `synchronized` khác `volatile`?**
`synchronized` đảm bảo cả **tính nguyên tử** lẫn **tính hiển thị**, có khóa. `volatile` chỉ đảm bảo hiển thị (thread khác thấy giá trị mới ngay) — `volatile int count; count++` **vẫn sai**.

**47. `AtomicInteger` hoạt động thế nào?**
Dùng CAS (compare-and-swap) ở mức lệnh CPU: đọc giá trị hiện tại, chỉ ghi nếu nó chưa đổi, không thì thử lại. Không cần khóa nên thường nhanh hơn `synchronized`.

**48. Deadlock là gì, phòng thế nào?**
Hai thread giữ khóa của nhau và cùng chờ. Phòng: lấy khóa theo **cùng một thứ tự**, dùng `tryLock` có timeout, giảm phạm vi khóa, tốt nhất là tránh cần nhiều khóa.

**49. Vì sao không nên `new Thread()` trong ứng dụng web?**
Tạo thread rất tốn (~1MB stack), không giới hạn được số lượng → cạn tài nguyên. Dùng thread pool (`ExecutorService`) hoặc `@Async` có pool cấu hình sẵn.

**50. `Runnable` khác `Callable`?**
`Callable` trả về giá trị và ném được checked exception; `Runnable` thì không.

**51. Virtual thread (Java 21) là gì, dùng khi nào?**
Thread do JVM quản lý, nhẹ (vài KB), tạo hàng triệu được. Khi gặp I/O nó nhả thread hệ điều hành cho task khác. Rất hợp tác vụ **I/O**, không giúp gì cho tác vụ nặng CPU. Trong virtual thread nên dùng `ReentrantLock` thay `synchronized`.

**52. Vì sao bean `@Service` không được có state thay đổi được?**
Bean là singleton, dùng chung cho mọi request đang chạy song song → field mutable gây race condition. Chỉ giữ phụ thuộc bất biến; cần state chung thì dùng `ConcurrentHashMap`, Redis hoặc DB.

---

## G. JVM & hiệu năng

**53. Heap và Stack khác nhau?**
Heap chứa object, dùng chung mọi thread, do GC quản lý. Stack chứa biến cục bộ và khung gọi hàm, riêng từng thread, tự giải phóng khi thoát method.

**54. Young Gen / Old Gen? Minor GC khác Major GC?**
Object mới sinh ở Eden (Young); sống sót nhiều lần GC thì lên Old. Minor GC dọn Young — nhanh. Major/Full GC dọn Old — chậm, gây khựng ứng dụng.

**55. GC quyết định object nào bị dọn bằng cách nào?**
Đánh dấu từ **GC Root** (biến trên stack các thread, biến static, JNI reference); object không tới được từ root sẽ bị thu hồi.

**56. Java có GC rồi sao vẫn memory leak?**
Vì bạn vô tình giữ tham chiếu: cache static không giới hạn, listener không hủy đăng ký, `ThreadLocal` không `remove()` trong thread pool, inner class không static, tài nguyên không đóng.

**57. `OutOfMemoryError` khác `StackOverflowError`?**
OOM: heap (hoặc metaspace) hết chỗ — do leak hoặc nạp quá nhiều dữ liệu. SOE: stack đầy — thường do đệ quy vô hạn.

**58. Production báo API chậm dần và RAM tăng, bạn làm gì?**
`jstat -gc` xem Old Gen có giảm sau Full GC không → `jmap -histo` xem class chiếm nhiều nhất → dump heap → mở bằng Eclipse MAT tìm đường tham chiếu giữ object → sửa code. Chỉ tăng `-Xmx` khi đã loại trừ leak.

**59. JIT ảnh hưởng gì tới benchmark?**
Code chạy nhiều lần mới được biên dịch và tối ưu, nên lần đo đầu luôn chậm bất thường. Phải warm-up, lặp nhiều lần, hoặc dùng JMH.

**60. Thứ tự ưu tiên khi tối ưu một API chậm?**
Truy vấn DB (N+1, thiếu index, `SELECT *`) → gọi mạng (tuần tự, thiếu cache/timeout) → thuật toán/cấu trúc dữ liệu → bộ nhớ/GC → vi tối ưu Java. Và luôn **đo trước, tối ưu sau**.
