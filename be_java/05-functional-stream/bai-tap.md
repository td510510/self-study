# Bài tập Module 05 — Lambda & Stream

> Dữ liệu mẫu: dùng lại [src/fp/Shop.java](src/fp/Shop.java) (đơn hàng, khách hàng, sản phẩm).

## Nhóm A — Lambda & functional interface

**A1.** Viết `@FunctionalInterface StringTransformer` và tạo 5 lambda: viết hoa, đảo ngược, bỏ khoảng trắng, che ký tự, đếm nguyên âm.

**A2.** Cài `Validator<T>` với `boolean validate(T)` và các method `default and`, `or`, `negate`. Dùng để validate `User` (email hợp lệ + tuổi ≥ 18 + tên không rỗng).

**A3.** Chuyển 10 anonymous class thành lambda, rồi thành method reference (nếu được).

**A4.** Giải thích "effectively final" và chứng minh bằng code không biên dịch được.

**A5.** Viết `<T,R> List<R> mapAll(List<T> list, Function<T,R> f)` tự cài (không dùng stream).

## Nhóm B — Stream cơ bản

Với `List<Integer> numbers`:
**B1.** Lọc số chẵn, bình phương, lấy tổng.
**B2.** Tìm số lớn thứ hai (không dùng `sort` toàn bộ nếu làm được).
**B3.** Đếm số nguyên tố trong khoảng 1..1000 bằng `IntStream`.
**B4.** Sinh 10 số Fibonacci đầu bằng `Stream.iterate`.
**B5.** Trung bình, min, max chỉ bằng **một lần duyệt** (`summaryStatistics`).

Với `List<String> words`:
**B6.** Lọc từ dài > 5, viết hoa, sắp xếp, nối bằng dấu phẩy.
**B7.** Nhóm từ theo chữ cái đầu.
**B8.** Tìm từ dài nhất; nếu bằng nhau lấy từ đứng trước theo alphabet.

## Nhóm C — Stream trên dữ liệu thật (dùng `Shop`)

**C1.** Tổng doanh thu các đơn không bị hủy.
**C2.** Danh sách sản phẩm duy nhất đã bán (dùng `flatMap` + `distinct`).
**C3.** Top 3 đơn hàng giá trị lớn nhất.
**C4.** Khách hàng ở Hà Nội có đơn ≥ 1 triệu.
**C5.** `Map<String, BigDecimal>`: tổng chi tiêu theo tên khách.
**C6.** `Map<String, Long>`: số đơn theo tháng.
**C7.** `Map<Status, List<Long>>`: id đơn theo trạng thái.
**C8.** Sản phẩm bán chạy nhất theo số lượng.
**C9.** Danh mục có doanh thu cao nhất.
**C10.** Đơn hàng lớn nhất của mỗi khách (`groupingBy` + `maxBy`).
**C11.** Chia khách thành 2 nhóm ≥18 và <18 (`partitioningBy`).
**C12.** Báo cáo dạng bảng: tên khách | số đơn | tổng chi | đơn lớn nhất — sắp xếp theo tổng chi giảm dần.

## Nhóm D — Bẫy & tối ưu

**D1.** Chứng minh stream chỉ dùng được một lần.
**D2.** Gây `IllegalStateException` với `Collectors.toMap` trùng key rồi sửa bằng hàm merge.
**D3.** So sánh thời gian: `for` vs `stream()` vs `parallelStream()` trên 10 triệu phần tử. Rút ra kết luận khi nào nên dùng parallel.
**D4.** So sánh `Stream<Integer>.reduce` với `IntStream.sum()` về hiệu năng (boxing).
**D5.** Viết lại đoạn stream 15 dòng khó đọc thành code dễ hiểu (tách biến trung gian hoặc quay lại vòng lặp). Giải thích lựa chọn.

## Nhóm E — Tổng hợp (bắt buộc)

**E1. Hệ thống báo cáo bán hàng.** Từ `List<Order>`, sinh ra báo cáo văn bản gồm:
```
=== BÁO CÁO THÁNG 01/2026 ===
Tổng doanh thu      : 25,600,000 VND
Số đơn              : 12 (PAID: 8, SHIPPED: 3, CANCELLED: 1)
Giá trị đơn TB      : 2,133,333 VND
Top 3 sản phẩm      : ...
Top 3 khách hàng    : ...
Doanh thu theo tuần : ...
```
*Đạt khi*: mỗi mục là một method riêng, không method nào dài quá 15 dòng, dùng `Collectors` thay vòng lặp thủ công.

**E2. Xử lý file log bằng Stream.** Đọc file log (Module 04), dùng `Files.lines()` + Stream để:
- Đếm theo mức log.
- Top 5 message lỗi lặp nhiều nhất.
- Nhóm lỗi theo giờ.
- Xuất kết quả ra file CSV.

**E3. Bộ lọc sản phẩm động (giống trang thương mại điện tử).**
```java
record ProductFilter(String keyword, String category, BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock) { }
List<Product> search(List<Product> all, ProductFilter filter, String sortBy, int page, int size)
```
*Đạt khi*: mỗi tiêu chí null thì bỏ qua (dùng `Predicate` kết hợp động), sắp xếp theo `sortBy`, phân trang bằng `skip`/`limit`.

---

## Câu hỏi phỏng vấn
1. Functional interface là gì? Kể 6 cái có sẵn.
2. Stream khác Collection thế nào?
3. Lazy evaluation trong Stream nghĩa là gì? Cho ví dụ.
4. `map` khác `flatMap` ra sao?
5. Khi nào `parallelStream()` có hại?
6. `Collectors.toMap` có bẫy gì?
7. `reduce` hoạt động thế nào? Cho ví dụ 3 tham số.
8. Vì sao biến dùng trong lambda phải effectively final?
