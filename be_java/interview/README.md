# Chuẩn bị đi phỏng vấn Java Backend

> Ôn **song song** với việc học, đừng để đến lúc nộp CV mới bắt đầu.

## Tài liệu trong thư mục này

| File | Nội dung |
|---|---|
| [cau-hoi-java-core.md](cau-hoi-java-core.md) | ~60 câu Java core, OOP, Collections, Concurrency, JVM |
| [cau-hoi-spring-database.md](cau-hoi-spring-database.md) | ~60 câu Spring, JPA, SQL, bảo mật, hệ thống |
| [coding-test.md](coding-test.md) | Dạng bài code thường gặp + chiến lược làm |
| [cv-va-du-an.md](cv-va-du-an.md) | Viết CV, trình bày dự án, câu hỏi hành vi, đàm phán lương |

## Thị trường Java Backend Việt Nam (tham khảo)

| Cấp bậc | Kinh nghiệm | Yêu cầu chính |
|---|---|---|
| Fresher | 0–1 năm | Java core, OOP, SQL cơ bản, biết Spring Boot, có dự án cá nhân |
| Junior | 1–2 năm | Spring Boot thành thạo, JPA, REST, Git, viết được test |
| Middle | 2–5 năm | Thiết kế module, tối ưu hiệu năng, microservices, mentor người mới |
| Senior | 5+ năm | Thiết kế hệ thống, đánh đổi kiến trúc, dẫn dắt kỹ thuật |

Loại công ty và điều họ quan tâm:
- **Outsourcing** (FPT, CMC, NashTech, KMS…): nền tảng vững, tiếng Anh, quy trình. Nhiều dự án còn Java 8/11 → phải biết cả cú pháp cũ.
- **Product/Startup**: làm được việc ngay, chủ động, hiểu sản phẩm. Hỏi nhiều về thực chiến.
- **Ngân hàng/Fintech**: cẩn thận, bảo mật, transaction, xử lý tiền tệ (nhớ `BigDecimal`!).

## Quy trình phỏng vấn điển hình

```
1. Sàng lọc CV
2. Bài test code / test online (30–90 phút)
3. Phỏng vấn kỹ thuật vòng 1 — kiến thức nền + hỏi về dự án
4. Phỏng vấn kỹ thuật vòng 2 — code trực tiếp, thiết kế hệ thống
5. Phỏng vấn HR — văn hóa, lương, kỳ vọng
```

## Kế hoạch ôn 4 tuần trước khi nộp CV

| Tuần | Việc cần làm |
|---|---|
| 1 | Trả lời hết `cau-hoi-java-core.md`, **viết ra giấy** thay vì chỉ đọc |
| 2 | Trả lời hết `cau-hoi-spring-database.md`; luyện SQL trên dữ liệu thật |
| 3 | Luyện code (`coding-test.md`), mỗi ngày 2 bài, bấm giờ 30 phút |
| 4 | Hoàn thiện CV + README các dự án; luyện kể dự án thành tiếng, quay video tự xem lại |

## Bảy nguyên tắc khi trả lời

1. **Không biết thì nói không biết** — rồi nói bạn sẽ tìm hiểu thế nào. Người phỏng vấn phát hiện ra bạn đoán bừa trong 10 giây, và mất điểm nặng hơn nhiều so với việc thừa nhận.
2. **Trả lời có cấu trúc**: *khái niệm → ví dụ → khi nào dùng → đánh đổi*.
3. **Luôn kèm ví dụ từ dự án của bạn**: "Trong dự án blog em làm, chỗ này em gặp vấn đề N+1 khi..."
4. **Nói cả nhược điểm.** "Microservices tốt nhưng phức tạp vận hành, dự án nhỏ em sẽ chọn monolith" — câu này gây ấn tượng hơn hẳn việc khen một chiều.
5. **Hỏi lại trước khi code.** "Anh cho em hỏi dữ liệu có thể null không? Kích thước đầu vào cỡ bao nhiêu?" Đó là điều người đi làm thật luôn làm.
6. **Nói to suy nghĩ** khi code. Người phỏng vấn chấm cách bạn tư duy, không chỉ đáp án.
7. **Chuẩn bị 3 câu hỏi cho họ**: quy trình team, cách review code, hệ thống hiện tại đang gặp thách thức gì.

## Những câu trả lời sai kinh điển của người mới

| Câu hỏi | Trả lời sai | Trả lời tốt |
|---|---|---|
| So sánh chuỗi | dùng `==` | `.equals()`, và giải thích String Pool |
| `ArrayList` vs `LinkedList` | "LinkedList chèn nhanh hơn nên tốt hơn" | 95% trường hợp dùng `ArrayList`; giải thích chi phí `get()` O(n) |
| Tiền tệ | `double` | `BigDecimal` / `long`, kèm ví dụ `0.1 + 0.2` |
| Bắt lỗi | `catch (Exception e) {}` | bắt loại cụ thể, log kèm ngữ cảnh, giữ cause |
| Bean Spring | để `List` cache trong field `@Service` | bean singleton phải không có state thay đổi |
| Tối ưu | "em sẽ tăng RAM" | đo trước: query, N+1, index, rồi mới tới JVM |

## Trước ngày phỏng vấn

- [ ] Đọc kỹ JD, đối chiếu từng yêu cầu với kinh nghiệm của mình
- [ ] Tìm hiểu sản phẩm/công ty (5 phút đọc web của họ cũng hơn không)
- [ ] Chuẩn bị kể **3 dự án** theo cấu trúc: bài toán → giải pháp → khó khăn → kết quả
- [ ] Đảm bảo GitHub sạch: README tử tế, code chạy được, commit message rõ ràng
- [ ] Kiểm tra thiết bị nếu phỏng vấn online; chuẩn bị IDE sẵn sàng để chia sẻ màn hình
