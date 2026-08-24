# Phỏng vấn — Tổng hợp cuối khoá

File này khác 10 file trước. Chúng dạy bạn trả lời **câu hỏi kiến thức**; file
này dạy bạn trả lời câu hỏi **về chính bạn và những gì bạn đã làm**.

Đó thường là phần quyết định.

---

## 1. Câu chuyện 5 phút về capstone

Đây là thứ bạn dùng nhiều nhất, và là thứ ít người luyện nhất.

```
30 giây   Vấn đề: ai, khổ vì gì, hiện họ làm thế nào
60 giây   Cách tiếp cận: kiến trúc, và VÌ SAO chọn thế
90 giây   Kết quả: SỐ - bao nhiêu ca test, điểm bao nhiêu, so baseline nào,
          chi phí mỗi request
60 giây   Chỗ khó nhất: thứ bạn tưởng đúng mà đo ra sai, và cách sửa
30 giây   Hạn chế: chưa làm được gì, sẽ làm gì tiếp
30 giây   Link demo
```

<details><summary>Ví dụ một câu chuyện đạt</summary>

> **(Vấn đề)** Công ty tôi có 6 file PDF quy chế, không mục lục. Nhân viên mới
> mất trung bình 20 phút để tìm câu trả lời cho một câu hỏi, và thường là hỏi
> đồng nghiệp thay vì tự tra.
>
> **(Cách tiếp cận)** Tôi làm một hệ hỏi đáp có trích dẫn nguồn. Retrieval dùng
> hybrid BM25 + vector — BM25 vì tài liệu đầy mã quy định dạng `QĐ-04/2024` mà
> embedding gần như mù với chuỗi định danh hiếm; vector vì người dùng gõ bằng
> chữ của họ chứ không phải chữ trong tài liệu.
>
> **(Kết quả)** Tôi gán nhãn 42 câu hỏi vàng, chia 5 loại, trong đó 7 câu **không
> có đáp án** trong tài liệu. Điểm tổng 0.87. Baseline "lấy 3 đoạn đầu" được 0.34.
> Chi phí $0.002 mỗi câu, p95 1,2 giây.
>
> **(Chỗ khó nhất)** Tôi tưởng hybrid luôn tốt hơn BM25. Nhưng khi so theo từng
> ca thì điểm trung bình tăng còn nhóm câu hỏi mã quy định **tụt từ 1.00 xuống
> 0.50** — RRF kéo kết quả của bên yếu lên và đẩy đoạn đúng ra khỏi top-3. Tôi
> thêm một bước định tuyến: câu chứa mã định danh thì ưu tiên BM25. Nhóm đó về
> lại 1.00 mà không mất gì ở các nhóm khác.
>
> **(Hạn chế)** Nó không đọc được tài liệu scan, và ngân sách nằm trong bộ nhớ
> một tiến trình nên chạy nhiều instance sẽ đếm sai. Việc tiếp theo là chuyển
> phần đếm sang Redis.
>
> **(Link)** Demo ở ... , mã nguồn ở ...

**Vì sao câu chuyện này đạt:**

| Đặc điểm | Vì sao quan trọng |
|---|---|
| Mọi khẳng định chất lượng đều có **số kèm cỡ mẫu** | "Hoạt động tốt" không kiểm chứng được |
| Có **baseline** | 0.87 vô nghĩa cho tới khi biết baseline là 0.34 |
| Nêu **7 câu không có đáp án** | Cho thấy bộ test có ca bẫy, không chỉ ca dễ |
| "Chỗ khó nhất" là một **phát hiện phản trực giác** | Chứng minh đã đo thật, không làm theo hướng dẫn |
| Hạn chế **cụ thể**, kèm việc tiếp theo | Người hiểu hệ thống mới nêu được |

</details>

> ⚠️ **Luyện nói to, bấm giờ thật.** Nếu bạn ấp úng ở đoạn 90 giây (phần số
> liệu), đó là dấu hiệu **bạn chưa đo đủ** — không phải dấu hiệu bạn nói chưa hay.

---

## 2. "Kể về một project khó nhất của bạn"

<details><summary>Cấu trúc trả lời</summary>

Bốn phần, mỗi phần một câu:

1. **Bối cảnh và ràng buộc** — *"Tôi có 4 tuần, một mình, không có dữ liệu gán nhãn sẵn."*
2. **Chỗ khó thật sự** — không phải "code khó", mà là một **quyết định**
3. **Bạn quyết định thế nào** — dựa trên gì? Số đo hay cảm giác?
4. **Kết quả và cái giá** — bạn đánh đổi gì

**Chỗ khó nên chọn:** một quyết định có **đánh đổi thật**, không phải một bug.

| ❌ Chọn kém | ✅ Chọn tốt |
|---|---|
| "Debug mãi mới ra lỗi thiếu dấu phẩy" | "Phải chọn giữa recall cao và chi phí gấp ba" |
| "Thư viện X không cài được trên Windows" | "Bộ eval nói cải tiến của tôi làm hỏng một nhóm câu hỏi" |

**Điểm cộng lớn nhất:** kể một chỗ bạn **đã sai và tự phát hiện ra** nhờ đo
lường. Người phỏng vấn nghe hàng chục câu chuyện thành công mỗi tuần; câu chuyện
tự phát hiện sai thì hiếm.

</details>

---

## 3. Câu hỏi thiết kế hệ thống

> *"Công ty có 1.000 nhân viên và 5.000 trang tài liệu nội bộ. Thiết kế hệ thống
> hỏi đáp."*

<details><summary>Cách trả lời</summary>

**Đừng vẽ kiến trúc ngay.** Hỏi lại trước — đó là phần đang được chấm điểm.

| Hỏi gì | Vì sao nó đổi thiết kế |
|---|---|
| Tài liệu **thay đổi bao lâu một lần**? | Tĩnh → prompt caching có thể rẻ hơn RAG |
| Bao nhiêu câu hỏi **mỗi ngày**? | Quyết định ngân sách và có cần cache không |
| Sai thì **hậu quả gì**? | Tra cứu nội bộ khác hẳn tư vấn cho khách hàng |
| Có ai **gán nhãn được** không? | Không có eval thì không có cách nào cải tiến |

Rồi mới thiết kế, và nói rõ **thứ tự làm**:

```
1. Bộ eval 30-50 câu hỏi vàng      <- LÀM TRƯỚC TIÊN
2. Baseline: nhét cả tài liệu + prompt caching
3. RAG nếu baseline không đủ, đo lại
4. API + guardrail + quan sát
5. Deploy, đo với người dùng thật
```

**Ba điểm cộng lớn:**

1. **Đề xuất baseline trước khi đề xuất RAG.** Với 5.000 trang thì RAG gần như
   chắc chắn thắng — nhưng nói ra bước đó cho thấy bạn không mặc định chọn kiến
   trúc phức tạp.

2. **Nêu con số ngay tại chỗ.** 5.000 trang ≈ 3,3 triệu token. Nhét hết vào mỗi
   câu hỏi với Haiku là ~$3,3/câu; RAG với 5 đoạn là ~$0,001/câu. Chênh lệch
   **ba nghìn lần** — nói được điều đó đáng giá hơn nhiều so với vẽ thêm một hộp.

3. **Nói về cái sẽ hỏng.** Tài liệu cập nhật thì index cũ trả lời sai; nhân viên
   hỏi thứ không có trong tài liệu thì hệ thống phải **từ chối**, không được bịa.

</details>

---

## 4. Câu hỏi xuyên suốt cả khoá

> *"Bài học lớn nhất bạn rút ra khi làm mấy project này là gì?"*

<details><summary>Đáp án</summary>

Có một câu trả lời đúng và cụ thể hơn mọi câu chung chung:

> **Điểm trung bình tăng không có nghĩa là hệ thống tốt lên.**

Và nó lặp lại ở bốn chỗ khác nhau trong khoá học, mỗi lần một bộ áo khác:

| Ở đâu | Chỉ số "tốt lên" | Thứ bị giấu |
|---|---|---|
| Classical ML | Accuracy 90% | Dữ liệu 90% một lớp — model luôn đoán một nhãn |
| Prompt engineering | 0.62 → 0.88 | Một câu phân loại đang đúng bị làm hỏng |
| RAG | recall 0.90 → 0.94 | Cả nhóm câu hỏi mã lỗi tụt một nửa |
| Agent | số bước 6 → 5 (rẻ hơn) | Một hành động sai trên dữ liệu thật |

**Cùng một cơ chế, hậu quả tăng dần: từ một con số sai, tới một hành động sai
trên dữ liệu thật.**

Và cách phát hiện luôn giống nhau: **so sánh theo từng ca, kèm baseline, và có
ca bẫy trong bộ test.**

> Câu trả lời này mạnh vì nó vừa cụ thể vừa cho thấy bạn đã gặp nó **nhiều lần**
> ở nhiều ngữ cảnh — chứ không phải đọc được ở đâu đó.

</details>

---

## 5. "Bạn còn yếu ở đâu?"

<details><summary>Cách trả lời</summary>

Đừng dùng điểm mạnh giả trang điểm yếu (*"tôi cầu toàn quá"*). Người phỏng vấn
nghe câu đó mỗi ngày.

Công thức: **một điểm yếu thật + bằng chứng đang xử lý + ranh giới rõ**.

> *"Tôi chưa từng vận hành hệ thống ở quy mô nhiều instance. Capstone của tôi để
> ngân sách và giới hạn tần suất trong bộ nhớ một tiến trình — chạy hai bản sao
> là đếm sai ngay. Tôi biết hướng xử lý là chuyển sang Redis, nhưng tôi chưa làm
> nên tôi ghi nó vào phần hạn chế thay vì nói như thể đã làm."*

Ba thứ câu trả lời trên thể hiện:

| | |
|---|---|
| **Điểm yếu thật** | Không phải điểm mạnh trá hình |
| **Hiểu vì sao nó là điểm yếu** | Nói được cơ chế hỏng, không chỉ tên vấn đề |
| **Ranh giới rõ giữa biết và đã làm** | Thứ khiến người phỏng vấn tin những gì bạn nói ở phần khác |

Ý cuối quan trọng nhất. Một ứng viên phân biệt rõ *"tôi đã làm"* với *"tôi biết
nguyên lý nhưng chưa làm"* là ứng viên mà mọi câu khác cũng đáng tin hơn.

</details>

---

## 6. Trước buổi phỏng vấn — danh sách kiểm

- [ ] Capstone **đang chạy** (kiểm link demo ngay sáng hôm đó)
- [ ] Thuộc **bốn con số**: cỡ bộ test, điểm, baseline, chi phí mỗi request
- [ ] Luyện câu chuyện 5 phút **nói to, bấm giờ**, ít nhất 3 lần
- [ ] Chuẩn bị sẵn **một chỗ mình đã sai** và cách phát hiện ra
- [ ] Mở sẵn README capstone trong một tab
- [ ] Ôn lại file phỏng vấn của phase liên quan nhất tới vị trí ứng tuyển
- [ ] Chuẩn bị **3 câu hỏi ngược** — chọn theo công ty, không hỏi chung chung

---

## Câu hỏi ngược nên hỏi

| Về chất lượng | Về vận hành | Về đội ngũ |
|---|---|---|
| "Team đo chất lượng đầu ra LLM bằng cách nào?" | "Chi phí API được theo dõi ở mức nào?" | "Ai quyết định model nào dùng cho tính năng nào?" |
| "Có bộ eval tự động không? Ai gán nhãn?" | "Khi nhà cung cấp gián đoạn, hệ thống phản ứng thế nào?" | "Review prompt có khác review code không?" |
| "Model mới ra thì quy trình nâng cấp là gì?" | "Có agent nào chạy tự động không? Guardrail ở tầng nào?" | "Người mới mất bao lâu để deploy thay đổi đầu tiên?" |

> 📌 Ba câu này không chỉ để gây ấn tượng. Chúng cho bạn biết **công ty đó có
> nghiêm túc không**. Một team không có bộ eval nào là một team bạn sẽ dành phần
> lớn thời gian đi thuyết phục.

---

[← Về mục lục phỏng vấn](README.md)
