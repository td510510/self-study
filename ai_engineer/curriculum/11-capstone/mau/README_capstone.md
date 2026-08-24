<!--
MẪU README CHO CAPSTONE.

Chép file này vào thư mục capstone của bạn, đổi tên thành README.md, rồi điền.
Xoá hết phần chú thích <!-- --> khi xong.

BA NGUYÊN TẮC KHI ĐIỀN:
  1. Mọi khẳng định về chất lượng phải kèm SỐ và CỠ MẪU
  2. Phần "Sai ở đâu" và "Hạn chế" là hai phần gây ấn tượng nhất - đừng bỏ
  3. Viết cho người CHƯA biết gì về dự án, không viết cho chính bạn
-->

# <Tên dự án>

> Một câu mô tả nó làm gì, cho ai.

**🔗 Demo:** https://... · **📺 Video 2 phút:** https://...

![Ảnh chụp màn hình](hinh/demo.png)

<!-- Ảnh hoặc GIF đặt ở ĐÂY, không đặt cuối file. Người đọc quyết định có đọc
     tiếp hay không trong 10 giây đầu, và một bảng số liệu không giữ chân được
     ai trong 10 giây đó. -->

---

## Vấn đề

<!-- AI đang khổ vì gì? Hiện họ làm thế nào? Mất bao lâu? -->

Ví dụ: *Nhân viên mới ở công ty X mất trung bình 20 phút để tìm câu trả lời cho
một câu hỏi về quy chế, vì tài liệu nằm rải rác trong 6 file PDF không có mục lục.*

**Phạm vi:**

| | |
|---|---|
| **LÀM** | ... |
| **KHÔNG LÀM** | ... |
| **Biết là tốt khi** | ... *(một con số)* |

---

## Cách tiếp cận

<!-- Sơ đồ luồng. Và quan trọng hơn: VÌ SAO chọn thế. -->

```
người dùng → API (validate, rate limit, ngân sách) → lõi → Claude API
```

| Quyết định | Chọn gì | Vì sao |
|---|---|---|
| Chunking | 600 ký tự / chồng lấn 120 | Đo được recall cao nhất trong 4 cấu hình thử |
| Tìm kiếm | Hybrid BM25 + vector | BM25 mạnh với mã định danh, vector mạnh với diễn đạt khác |
| Model | Haiku 4.5 | Sonnet 5 chỉ hơn 0.03 điểm nhưng đắt gấp 3 |

<!-- Cột "Vì sao" phải chứa SỐ ĐO, không phải cảm giác. Nếu bạn chưa đo,
     hãy viết thật: "chọn theo mặc định, chưa đo". Trung thực ăn điểm hơn bịa. -->

---

## Kết quả

**Bộ eval:** N mẫu do tôi tự gán nhãn, chia làm ... loại.

| Loại | n | Điểm | Baseline |
|---|---|---|---|
| dễ | 20 | 0.95 | 0.31 |
| khó | 15 | 0.78 | 0.10 |
| không có đáp án | 7 | 0.86 | 1.00 ← *baseline "luôn từ chối" ăn trọn* |
| **TỔNG** | **42** | **0.87** | **0.34** |

**Vận hành:**

| | |
|---|---|
| Chi phí / request | $0.0021 |
| p50 / p95 / p99 | 340 ms / 1.2 s / 4.8 s |
| Tỷ lệ lỗi | 0.4% |

<!-- ⚠️ Dòng "không có đáp án" ở trên là ví dụ về việc BÁO CÁO TRUNG THỰC:
     một baseline ngu ngốc vẫn thắng ở loại đó. Giữ những dòng như thế lại -
     chúng cho thấy bạn hiểu số liệu của mình. -->

---

## Sai ở đâu

<!-- PHẦN NÀY GÂY ẤN TƯỢNG MẠNH HƠN PHẦN KẾT QUẢ.
     Nó chứng minh bạn đã đo, đã đọc lỗi, đã sửa - chứ không chỉ làm theo
     hướng dẫn. Viết ít nhất 2 mục. -->

### 1. <Điều bạn tưởng đúng mà đo ra sai>

Tôi nghĩ ... nhưng bộ eval cho thấy ...

Nguyên nhân: ...

Cách sửa: ... Số liệu sau khi sửa: ... → ...

### 2. ...

---

## So sánh phiên bản

| | v1 | v2 | Ghi chú |
|---|---|---|---|
| Tổng | 0.71 | 0.87 | |
| loại A | 0.80 | 0.95 | cải thiện |
| loại B | 0.90 | **0.60** | ⚠️ **thoái lui** — chấp nhận vì ... |

<!-- Nếu bạn không có bảng này, nghĩa là bạn chưa bao giờ so hai phiên bản
     theo TỪNG CA - và bạn không biết mình đã làm hỏng gì. -->

---

## Hạn chế

<!-- Người viết được phần này là người hiểu hệ thống của mình.
     Viết ít nhất 3 mục, cụ thể. -->

- Không dùng được cho ...
- Chưa xử lý được ...
- Trạng thái (ngân sách, giới hạn tần suất) nằm trong bộ nhớ một tiến trình → chạy nhiều instance sẽ đếm sai
- ...

---

## Chạy thử

```bash
git clone ...
cp .env.example .env      # điền ANTHROPIC_API_KEY
docker build -t <ten> .
docker run --env-file .env -p 8000:8000 <ten>
curl http://localhost:8000/khoe
```

**Chạy bộ eval:**

```bash
python eval/chay_eval.py --luu ket_qua.json
```

---

## Bài học

<!-- 3-5 gạch đầu dòng. Viết thật, không viết cho hay. -->

- ...
