# Phỏng vấn — Phase 07: LLM Engineering

12 câu hỏi thường gặp cho vị trí **AI/LLM Application Engineer**.

Cách dùng: che phần đáp án, tự trả lời thành tiếng trong 60 giây, rồi đối chiếu.
Nhà tuyển dụng quan tâm bạn có **hiểu vì sao** hơn là bạn thuộc lòng cú pháp.

---

## 1. API của Claude là stateless. Điều đó nghĩa là gì và kéo theo hệ quả gì?

<details><summary>Đáp án</summary>

Server **không lưu** lịch sử hội thoại. Mỗi request phải gửi lại toàn bộ `messages`.

Ba hệ quả:

1. **Chi phí tăng theo bình phương.** Lượt thứ N phải gửi lại N−1 lượt trước. Hội thoại 20 lượt tốn nhiều hơn 20 lần hội thoại 1 lượt.
2. **Có trần cứng.** Vượt context window (200K với Haiku 4.5, 1M với Sonnet 5/Opus 5) là lỗi, không phải cắt bớt tự động.
3. **Bộ nhớ là việc của bạn.** Muốn model "quên", bạn cắt `messages`. Muốn nó nhớ lâu, bạn tự tóm tắt các lượt cũ.

**Điểm cộng khi trả lời:** nhắc đến chiến lược cắt lịch sử — giữ N lượt gần nhất, hoặc tóm tắt các lượt cũ thành một message rồi giữ nguyên vài lượt mới nhất.

</details>

---

## 2. Vì sao `response.content[0].text` là một anti-pattern?

<details><summary>Đáp án</summary>

`content` là một **danh sách khối**, và khối đầu tiên không nhất thiết là text. Nó có thể là `thinking` (khi bật extended thinking) hoặc `tool_use`. Khi đó `.text` ném `AttributeError` — và bug này chỉ xuất hiện *sau khi* bạn bật một tính năng mới, tức là ở production.

Cách đúng:

```python
def van_ban(r):
    return "".join(b.text for b in r.content if b.type == "text")
```

**Điểm cộng:** nói rằng bạn đặt hàm này ở một chỗ dùng chung ngay từ đầu dự án, chứ không phải sửa 40 chỗ sau khi bật thinking.

</details>

---

## 3. Vì sao không dùng `tiktoken` để đếm token cho Claude?

<details><summary>Đáp án</summary>

`tiktoken` là tokenizer của **OpenAI**. Claude dùng tokenizer khác, nên con số sẽ **sai** — và sai nhiều hơn với tiếng Việt.

Cách đúng: `client.messages.count_tokens(model=..., messages=[...])`. Endpoint này miễn phí và tính đúng cả `system`, `tools`, hình ảnh.

**Điểm cộng:** giải thích *vì sao* việc này quan trọng — nếu bạn ước tính chi phí sai 30% thì mọi quyết định chọn model dựa trên nó đều sai.

</details>

---

## 4. `stop_reason` có những giá trị nào? Vì sao phải kiểm tra?

<details><summary>Đáp án</summary>

| Giá trị | Nghĩa |
|---|---|
| `end_turn` | Model kết thúc bình thường |
| `max_tokens` | **Bị cắt giữa chừng** |
| `stop_sequence` | Gặp chuỗi dừng bạn đặt |
| `tool_use` | Model muốn gọi tool |
| `refusal` | Từ chối vì lý do an toàn |

Phải kiểm tra vì `max_tokens` trả về một chuỗi **trông như bình thường nhưng bị cụt**. Rất nhiều bug "JSON không parse được" thực chất là output bị cắt — và bạn đã trả tiền cho kết quả hỏng đó.

```python
if r.stop_reason == "max_tokens":
    raise ValueError("Đầu ra bị cắt — tăng max_tokens")
```

</details>

---

## 5. Kể tên 4 lỗi API và cho biết lỗi nào nên thử lại.

<details><summary>Đáp án</summary>

| Lỗi | Thử lại? |
|---|---|
| `RateLimitError` (429) | ✅ Có — đọc header `retry-after` |
| `APIStatusError` 5xx | ✅ Có — lỗi phía server |
| `APIConnectionError` | ✅ Có — lỗi mạng |
| `BadRequestError` (400) | ❌ Không — tham số sai, thử lại vẫn sai |
| `AuthenticationError` (401) | ❌ Không — key sai |
| `NotFoundError` (404) | ❌ Không — thường là **ID model sai** |

**Điểm cộng:** bắt `Exception` chung là sai vì nó xoá mất phân biệt giữa lỗi thử lại được và không. Và: SDK Anthropic **đã tự retry** 429/5xx với exponential backoff (mặc định 2 lần) — chỉnh bằng `Anthropic(max_retries=5)`. Đừng viết lại lớp retry của mình lên trên nó.

</details>

---

## 6. Bạn có một model đang chạy tốt và muốn nâng cấp lên model mới hơn. Cần cẩn thận điều gì?

<details><summary>Đáp án</summary>

**Tham số không giống nhau giữa các thế hệ model:**

- `temperature`: dùng được trên Haiku 4.5, Sonnet 4.6, Opus 4.6 — **bị từ chối (400)** trên Sonnet 5, Opus 5, Opus 4.8/4.7
- `effort`: dùng được trên Sonnet 5, Opus 5, Opus 4.8/4.7 — **không có** trên Haiku 4.5

Đổi model mà giữ nguyên tham số là lỗi 400 ngay lập tức.

**Và điều quan trọng hơn:** prompt được tinh chỉnh cho model cũ **không tự động tốt** trên model mới. Model mới thường cần ít chỉ dẫn thủ công hơn (ví dụ kỹ thuật "hãy suy nghĩ từng bước" có thể thừa khi model đã có `effort`).

**Câu trả lời hoàn chỉnh:** "Tôi chạy bộ eval trên model cũ để có mốc, đổi model, chạy lại, rồi so sánh **theo từng case** để tìm thoái lui — không chỉ nhìn điểm trung bình."

</details>

---

## 7. Structured output là gì? Nó khác gì với việc viết "hãy trả về JSON" trong prompt?

<details><summary>Đáp án</summary>

`output_config={"format": {"type": "json_schema", "schema": ...}}` ràng buộc đầu ra **ở mức bộ giải mã** — model không thể sinh ra token vi phạm schema.

Viết "hãy trả về JSON" chỉ là *yêu cầu*: model vẫn có thể bọc rào markdown, thêm văn xuôi, hoặc để dấu phẩy thừa.

**Nhưng — và đây là phần quan trọng:** structured output đảm bảo **cấu trúc** đúng, không đảm bảo **nội dung** đúng. Model vẫn có thể trả `{"cam_xuc": "tich_cuc"}` cho một review tiêu cực. Bạn vẫn cần eval.

**Điểm cộng:** biết rằng SDK Python có `client.messages.parse(output_config={"format": LopPydantic})` trả thẳng `r.parsed_output` đã validate.

</details>

---

## 8. Mô tả vòng lặp tool use. Model có tự chạy tool không?

<details><summary>Đáp án</summary>

**Không. Model không bao giờ chạy tool của bạn.** Nó chỉ *nói* nó muốn gọi tool nào với tham số gì. Bạn chạy, rồi gửi kết quả về.

```
① Gửi request kèm tools=[...]
② stop_reason == "tool_use"?  Không -> xong
③ Với mỗi khối tool_use: BẠN chạy hàm tương ứng
④ Gửi tool_result về trong message vai trò "user"
⑤ Quay lại ①  (có max_vong để tránh lặp vô hạn)
```

Bốn quy tắc dễ sai:

1. Append **nguyên** `r.content` vào `messages`, không phải chuỗi text — nếu không sẽ mất khối `tool_use`
2. `tool_use_id` phải khớp `khoi.id`
3. **Mọi** khối `tool_use` phải có `tool_result` tương ứng
4. `tool_result` gửi trong message vai trò **`user`**

**Điểm cộng:** bắt exception trong vòng lặp và gửi lỗi **về cho model** với `is_error: True`, thay vì để chương trình sập — model thường tự phục hồi được.

</details>

---

## 9. Model gọi sai tool. Bạn sửa thế nào?

<details><summary>Đáp án</summary>

**Sửa `description` trước tiên** — đó là thứ duy nhất model dựa vào để chọn tool. `description` là prompt engineering, không phải tài liệu cho người đọc.

So sánh:

- ❌ `"Tra cứu đơn hàng"`
- ✅ `"Tra cứu trạng thái đơn hàng theo mã đơn. Dùng khi khách hỏi về tình trạng, vị trí, hoặc ngày giao của một đơn hàng."`

Cũng viết mô tả cho từng tham số trong `input_schema`.

Chỉ sau khi description đã rõ mà vẫn sai thì mới cân nhắc đổi model. **Phản xạ đổi model trước là dấu hiệu của người chưa hiểu hệ thống.**

</details>

---

## 10. Prompt caching hoạt động thế nào? Cái bẫy phổ biến nhất là gì?

<details><summary>Đáp án</summary>

Đặt `"cache_control": {"type": "ephemeral"}` lên một khối. Mọi thứ **trước** điểm đó được cache. Ghi cache tốn 1.25x giá token vào (5 phút) hoặc 2.0x (1 giờ); **đọc cache chỉ tốn 0.10x** — rẻ hơn 90%.

**Cái bẫy: cache khớp theo TIỀN TỐ, phải giống hệt từng byte.**

Nhét timestamp, tên người dùng, hay session id vào đầu system prompt là tự huỷ cache: tiền tố đổi mỗi request nên **không bao giờ trúng**, và bạn còn trả thêm 25% cho việc ghi cache. Bạn sẽ kết luận sai rằng "caching không hiệu quả".

**Quy tắc:** phần **tĩnh** (tài liệu, hướng dẫn dài, định nghĩa tool) đặt **trước**; phần **động** (câu hỏi người dùng) đặt **sau**.

Bẫy thứ hai: dưới ngưỡng token tối thiểu (2048 với Haiku, 1024 với Sonnet/Opus), `cache_control` bị **bỏ qua im lặng** — không báo lỗi.

**Cách kiểm tra duy nhất:** in `usage.cache_read_input_tokens`. Bằng 0 ở lượt thứ hai nghĩa là cache đang trượt.

</details>

---

## 11. ⭐ Vì sao cần eval? "Chạy thử vài lần thấy ổn" sai ở đâu?

<details><summary>Đáp án</summary>

Ba lý do:

1. **Đầu ra không tất định** — cùng prompt có thể ra kết quả khác nhau. Chạy thử 1 lần không chứng minh gì; bạn đang nhầm may mắn với chất lượng.
2. **Không có "đúng/sai" hiển nhiên** — không có bộ test thì mọi tranh luận về chất lượng đều là cảm tính.
3. **Thoái lui (regression) vô hình** — sửa prompt cho case A hỏng case B, và bạn không biết cho đến khi khách báo.

**Hai điều làm câu trả lời nổi bật:**

- **Luôn dùng `temperature=0` trong eval** để kết quả tái lập được.
- **Luôn báo cáo kèm baseline.** "Model đạt 85%" là câu vô nghĩa cho đến khi biết baseline. Nếu 90% dữ liệu là một nhãn, model luôn đoán nhãn đó cũng đạt 90% mà hoàn toàn vô dụng. (Cùng cái bẫy accuracy ở Phase 04.)

</details>

---

## 12. ⭐ Bạn sửa prompt, điểm eval tăng từ 62% lên 88%. Deploy được chưa?

<details><summary>Đáp án</summary>

**Chưa. Điểm trung bình tăng không loại trừ khả năng có case đang đúng bị làm hỏng.**

Phải so sánh **theo từng case**:

```python
ss = so_sanh_phien_ban(kq_v1, kq_v2)
if ss["thoai_lui"]:
    # ĐỌC từng case hỏng trước khi quyết định
```

Ví dụ thật: prompt v2 dạy model nhận mỉa mai → sửa được 3 case, nhưng model thành quá nhạy và gán `tieu_cuc` cho review khen-chê cân bằng. Trung bình tăng 25 điểm, mà một case đang chạy tốt đã hỏng. Nếu chỉ nhìn con số tổng, bạn deploy mà không hề biết.

**Quy trình đúng:**

```
① Chạy eval trên prompt hiện tại  -> lưu v1
② Sửa prompt
③ Chạy lại                        -> v2
④ so_sanh_phien_ban(v1, v2)
⑤ thoai_lui rỗng -> deploy; không rỗng -> đọc từng case
```

**Câu này phân biệt người biết gọi API với AI Engineer.** Người biết gọi API sửa prompt đến khi "thấy ổn". AI Engineer có eval, biết baseline, và bắt được thoái lui trước khi khách hàng bắt được.

</details>

---

## Câu hỏi ngược nên hỏi nhà tuyển dụng

- "Team đang đo chất lượng LLM bằng cách nào? Có bộ eval tự động không?"
- "Khi model mới ra, quy trình quyết định nâng cấp là gì?"
- "Chi phí API hiện được theo dõi ở mức nào — theo tính năng hay tổng?"

Ba câu này cho thấy bạn nghĩ về **vận hành**, không chỉ về việc gọi API.

---

[← Về mục lục phỏng vấn](README.md)
