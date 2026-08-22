# Lab 01 — Khung 4 bước thiết kế

## Mục tiêu

Biến khung lý thuyết thành phản xạ. Sau lab này bạn sẽ tự nhận ra mình hay quên bước nào.

## Cách làm

1. Mở `bai-lam.js`, đọc đề bài trong phần comment.
2. Điền các chỗ `TODO`. **Đừng tra Google** — hãy tự suy luận, sai cũng được.
3. Chạy chấm điểm:

```bash
node labs/lab01-khung-thiet-ke/01-checklist.js
```

4. Sửa các dòng ❌ và chạy lại đến khi đạt 100%.

## Gợi ý tính toán bước 2

```
100.000.000 link/tháng
  ÷ 30 ngày ÷ 86.400 giây  ≈ 38,6 link/giây  → QPS ghi ≈ 39
Mỗi link click trung bình 100 lần → QPS đọc ≈ 3.900
Peak gấp 3 lần → ~12.000 QPS đọc

Storage: 100tr × 500 bytes = 50 GB/tháng
         × 12 × 5 năm      = 3.000 GB = 3 TB
```

## Thảo luận sau lab (giảng viên dẫn dắt)

- QPS đọc gấp 100 lần QPS ghi. Con số này **thay đổi thiết kế như thế nào**?
- 3 TB — có cần sharding không? Một máy chủ hiện đại chứa nổi bao nhiêu?
- Nếu bỏ hoàn toàn cache thì DB phải chịu 12.000 QPS đọc. Có khả thi không?
