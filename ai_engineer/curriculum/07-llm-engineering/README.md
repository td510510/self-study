# Phase 07 · LLM Engineering ⭐

**Thời gian:** Tuần 16–19 (~48 giờ) · **Điều kiện:** xong [Phase 06](../06-nlp-transformers/README.md)

---

## 🎯 Mục tiêu

Đây là **phase quan trọng nhất** với mục tiêu nghề nghiệp của bạn. Từ đây trở đi bạn không còn train model — bạn **xây sản phẩm** trên nền model có sẵn.

- [ ] Gọi Claude API thành thạo: messages, system prompt, tham số
- [ ] **Đếm token và kiểm soát chi phí** — kỹ năng bị bỏ qua nhiều nhất
- [ ] Prompt engineering: zero-shot, few-shot, chain-of-thought
- [ ] **Structured output** — ép model trả JSON đúng schema
- [ ] **Tool use** — cho model gọi hàm của bạn
- [ ] Streaming, xử lý lỗi, retry, rate limit
- [ ] **Prompt caching** — giảm chi phí tới 90%
- [ ] ⭐⭐ **Eval tự động** — thứ phân biệt kỹ sư với người nghịch prompt
- [ ] → 🎯 **Project P5: Structured Extractor**

> **Điểm mấu chốt của phase này:** ai cũng gọi được API. Rất ít người đo được **chất lượng đầu ra** một cách có hệ thống. Tuần 19 (eval) là tuần đáng giá nhất.

---

## ⚙️ Chuẩn bị

```powershell
pip install -e ".[llm]"
```

Rồi làm theo [SETUP.md mục 5](../../SETUP.md) để lấy API key.

```powershell
copy .env.example .env
# mở .env, dán key vào ANTHROPIC_API_KEY
```

> 💡 **Bài tập của phase này chạy được KHÔNG CẦN API key.** Chúng kiểm tra logic bạn viết (dựng payload, ước tính chi phí, validate schema, chấm eval) chứ không gọi API thật. Chỉ notebook và project mới cần key.

### Ngân sách

Toàn bộ Phase 07 ước tính **dưới $3** nếu bạn dùng model mặc định.

| Model | ID chính xác | Vào $/1M | Ra $/1M | Ngữ cảnh |
|---|---|---|---|---|
| **Claude Haiku 4.5** | `claude-haiku-4-5` | $1.00 | $5.00 | 200K |
| Claude Sonnet 5 | `claude-sonnet-5` | $3.00 | $15.00 | 1M |
| Claude Opus 5 | `claude-opus-5` | $5.00 | $25.00 | 1M |

> ⚠️ **Gõ chính xác ID, KHÔNG thêm hậu tố ngày tháng.** `claude-haiku-4-5` là đúng; `claude-haiku-4-5-20251001` sẽ lỗi *model không tồn tại*. Đây là lỗi rất hay gặp vì các ID cũ từng có dạng đó.

**Khoá học này dùng Haiku 4.5 mặc định** để bạn chạy được hàng trăm lần thử nghiệm với chi phí thấp. Trong công việc thật, hãy bắt đầu bằng **Opus 5** cho chất lượng tốt nhất rồi mới hạ xuống nếu cần tiết kiệm — đừng chọn model rẻ trước rồi ngạc nhiên vì chất lượng.

**Đặt hạn mức chi tiêu** ở Console → Billing → Spend limits: `$10/tháng`. Đây là lưới an toàn khi code bị lỗi gọi API trong vòng lặp.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **16** | API cơ bản, token, chi phí | `01` | `ex01` |
| **17** | Prompt engineering, structured output | `02` | `ex02` |
| **18** | Tool use, streaming, caching, lỗi | `03` | — |
| **19** | ⭐ Eval tự động → **P5** | `04` | `ex03` |

---

# TUẦN 16 — Claude API cơ bản

## 1. Cuộc gọi đầu tiên

```python
import anthropic

client = anthropic.Anthropic()      # tự đọc ANTHROPIC_API_KEY từ môi trường

response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Giải thích RAG trong 2 câu."}
    ],
)

for block in response.content:
    if block.type == "text":
        print(block.text)
```

> ⚠️ **`response.content` là một DANH SÁCH các khối, không phải chuỗi.** Nó có thể chứa `text`, `thinking`, `tool_use`… Luôn kiểm tra `block.type` trước khi đọc `block.text`. Viết `response.content[0].text` là thói quen xấu — nó vỡ ngay khi model bắt đầu trả về khối khác.

## 2. API là STATELESS

Claude **không nhớ** cuộc hội thoại. Mỗi lần gọi, bạn phải gửi lại **toàn bộ** lịch sử.

```python
messages = []

def hoi(noi_dung: str) -> str:
    messages.append({"role": "user", "content": noi_dung})

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1024,
        messages=messages,          # gửi TOÀN BỘ lịch sử
    )

    tra_loi = next(b.text for b in response.content if b.type == "text")
    messages.append({"role": "assistant", "content": tra_loi})
    return tra_loi
```

**Ba hệ quả quan trọng:**

| Hệ quả | Chi tiết |
|---|---|
| **Chi phí tăng theo bình phương** | Lượt thứ N gửi lại N−1 lượt trước → hội thoại dài rất đắt |
| **Có giới hạn** | Vượt context window → lỗi |
| **Bạn kiểm soát bộ nhớ** | Muốn model "quên" thì cắt bớt `messages` |

**Quy tắc:** tin nhắn đầu phải là `user`. Hai tin nhắn cùng vai trò liền nhau được API gộp lại thành một lượt.

## 3. System prompt

```python
response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1024,
    system="Bạn là trợ lý kỹ thuật. Trả lời ngắn gọn, luôn kèm ví dụ code Python.",
    messages=[{"role": "user", "content": "Đọc file JSON thế nào?"}],
)
```

**`system` là tham số RIÊNG**, không phải một phần tử trong `messages`. Nó mang **thẩm quyền cao hơn** nội dung người dùng — đặt vai trò, quy tắc, ràng buộc ở đây.

> 🔒 **Bảo mật:** đừng bao giờ nhét nội dung do người dùng cung cấp thẳng vào `system`. Đó là cửa ngõ của **prompt injection** (Tuần 18).

## 4. Tham số — và một thay đổi quan trọng

```python
response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1024,
    temperature=0,              # ← chỉ dùng được trên Haiku 4.5 và các model cũ
    stop_sequences=["\n\n---"],
    messages=[...],
)
```

| Tham số | Ý nghĩa |
|---|---|
| `max_tokens` | **Bắt buộc.** Trần token ĐẦU RA |
| `temperature` | Độ ngẫu nhiên — xem cảnh báo bên dưới |
| `stop_sequences` | Gặp chuỗi này thì dừng sinh |
| `system` | Prompt hệ thống |

### ⚠️ `temperature` đã bị GỠ BỎ trên các model mới nhất

| Model | `temperature` |
|---|---|
| **Haiku 4.5** (mặc định của khoá học) | ✅ Dùng được |
| Sonnet 4.6, Opus 4.6 | ✅ Dùng được |
| **Sonnet 5, Opus 5, Opus 4.8/4.7** | ❌ **Lỗi 400** |

Trên các model mới, độ sâu suy luận được điều khiển bằng **`effort`** thay vì `temperature`:

```python
# Opus 5 / Sonnet 5 — KHÔNG có temperature
response = client.messages.create(
    model="claude-opus-5",
    max_tokens=16000,
    output_config={"effort": "high"},     # low | medium | high | xhigh | max
    messages=[...],
)
```

> ⚠️ Ngược lại, `effort` **báo lỗi trên Haiku 4.5**. Hai tham số này thuộc hai thế hệ model khác nhau — dùng đúng cái cho đúng model.
>
> 🔗 Ở Phase 06 bạn đã hiểu `temperature` về mặt cơ học: một phép chia trước softmax. Việc nó bị gỡ khỏi model mới không làm kiến thức đó vô ích — nó giải thích **vì sao** `effort` (điều khiển lượng suy luận) là một cách kiểm soát khác về bản chất.

### Chọn `max_tokens` bao nhiêu?

| Loại yêu cầu | Gợi ý |
|---|---|
| Phân loại, trả một nhãn | `256` |
| Trả lời thường, **không** streaming | `~16000` |
| Có streaming, đầu ra dài | `~64000` |

> ⚠️ **Đừng đặt `max_tokens` quá thấp.** Chạm trần thì đầu ra bị **cắt giữa chừng** — bạn mất tiền cho một câu trả lời hỏng và phải gọi lại. Kiểm tra `response.stop_reason == "max_tokens"` để phát hiện.

## 5. ⭐ Token & chi phí — kỹ năng bị bỏ qua nhiều nhất

```python
dem = client.messages.count_tokens(
    model="claude-haiku-4-5",
    system="Bạn là trợ lý...",
    messages=[{"role": "user", "content": van_ban_dai}],
)
print(dem.input_tokens)
```

> ⚠️ **KHÔNG dùng `tiktoken` để đếm token cho Claude.** Đó là tokenizer của OpenAI và cho con số **sai**. Dùng `count_tokens` của SDK.

**Đọc chi phí thực tế từ mỗi response:**

```python
u = response.usage
print(u.input_tokens, u.output_tokens)
print(u.cache_creation_input_tokens, u.cache_read_input_tokens)
```

**Công thức chi phí:**
```
chi_phí = (input_tokens / 1e6) × giá_vào  +  (output_tokens / 1e6) × giá_ra
```

**Ba điều phải nhớ:**

**① Token ra đắt gấp 5 lần token vào.** Với Haiku 4.5: $1 vào, $5 ra. Rút ngắn câu trả lời tiết kiệm nhiều hơn rút ngắn prompt.

**② Tiếng Việt tốn token hơn tiếng Anh** — bạn đã học vì sao ở Phase 06. Cùng một ý, prompt tiếng Việt tốn nhiều token hơn.

**③ Luôn đo trên dữ liệu thật trước khi cam kết.** Đừng ước lượng bằng số từ.

> 🎯 **Câu hỏi bạn phải trả lời được cho mọi tính năng LLM:** *"Chi phí trên mỗi request là bao nhiêu?"* Không trả lời được nghĩa là bạn chưa sẵn sàng đưa nó vào sản xuất.

## 6. `stop_reason` — luôn kiểm tra

```python
if response.stop_reason == "max_tokens":
    print("⚠️ Bị cắt giữa chừng — tăng max_tokens")
```

| Giá trị | Nghĩa |
|---|---|
| `end_turn` | Trả lời xong bình thường ✅ |
| `max_tokens` | **Bị cắt** — tăng `max_tokens` |
| `stop_sequence` | Gặp chuỗi dừng bạn đặt |
| `tool_use` | Model muốn gọi tool → thực thi rồi gọi tiếp |
| `refusal` | Model từ chối vì lý do an toàn |

## 7. Xử lý lỗi

```python
import anthropic

try:
    response = client.messages.create(...)
except anthropic.BadRequestError as e:
    print(f"Request sai: {e.message}")           # sai tham số, sai model ID
except anthropic.AuthenticationError:
    print("API key sai hoặc chưa đặt")
except anthropic.RateLimitError as e:
    cho = int(e.response.headers.get("retry-after", "60"))
    print(f"Vượt giới hạn tần suất, chờ {cho}s")
except anthropic.APIStatusError as e:
    if e.status_code >= 500:
        print("Lỗi phía server, thử lại sau")
    else:
        print(f"Lỗi API: {e.message}")
except anthropic.APIConnectionError:
    print("Lỗi mạng")
```

> ⚠️ **Bắt một chuỗi lỗi cụ thể, không bắt một class chung.** Gộp tất cả vào `except Exception` làm mất phân biệt giữa lỗi **thử lại được** (429, 5xx, mạng) và lỗi **không thử lại được** (400, 404) — thử lại một request sai tham số chỉ tốn tiền vô ích.

**SDK tự retry sẵn** 408/409/429/5xx với exponential backoff (mặc định 2 lần). Chỉnh bằng `max_retries`.

**Khi báo lỗi cho Anthropic**, gửi kèm `response._request_id`.

---

# TUẦN 17 — Prompt Engineering & Structured Output

## 8. Ba kỹ thuật nền tảng

**① Zero-shot** — chỉ mô tả nhiệm vụ:
```python
system = "Phân loại cảm xúc của đánh giá: tích cực, tiêu cực, hoặc trung tính."
```

**② Few-shot** — cho vài ví dụ mẫu:
```python
system = """Phân loại cảm xúc đánh giá sản phẩm.

Ví dụ:
"Giao hàng nhanh, đóng gói kỹ" → tích cực
"Hàng lỗi, shop không phản hồi" → tiêu cực
"Cũng được, không có gì đặc biệt" → trung tính"""
```

> 🔑 **Few-shot là kỹ thuật có tỷ lệ hiệu quả/công sức cao nhất.** Ba ví dụ tốt thường cải thiện nhiều hơn ba đoạn văn mô tả. Và **ví dụ dạy được định dạng** — thứ mà mô tả bằng lời rất khó truyền đạt chính xác.

**③ Chain-of-thought** — bắt model trình bày các bước:
```python
system = """Giải bài toán. Trước khi đưa đáp án, hãy suy luận từng bước
trong thẻ <suy_luan></suy_luan>, rồi đưa đáp án cuối trong <dap_an></dap_an>."""
```

Hiệu quả rõ với bài toán nhiều bước. Đánh đổi: tốn token hơn và chậm hơn.

## 9. Bảy nguyên tắc viết prompt

| # | Nguyên tắc | Ví dụ |
|---|---|---|
| **1** | **Cụ thể, không mơ hồ** | ❌ *"tóm tắt ngắn"* → ✅ *"tóm tắt trong đúng 3 gạch đầu dòng, mỗi dòng dưới 20 từ"* |
| **2** | **Cho phép nói "không biết"** | *"Nếu tài liệu không chứa câu trả lời, hãy nói 'Không tìm thấy thông tin'"* |
| **3** | **Dùng thẻ XML ngăn cách** | `<tai_lieu>...</tai_lieu>` — rõ ràng hơn dấu ngoặc kép |
| **4** | **Đặt ví dụ ở system prompt** | Ổn định, và **cache được** (Tuần 18) |
| **5** | **Mô tả định dạng bằng ví dụ** | Một ví dụ JSON tốt hơn ba đoạn mô tả |
| **6** | **Nói điều NÊN làm, không chỉ điều cấm** | ❌ *"đừng dài dòng"* → ✅ *"trả lời trong 2 câu"* |
| **7** | **Đưa ngữ cảnh trước, câu hỏi sau** | Giúp model đọc tài liệu trước khi biết phải tìm gì |

> ⚠️ **Prefill đã bị gỡ bỏ** trên Opus 5, Sonnet 5 và họ 4.6+. Mẹo cũ *"đặt sẵn `{` vào lượt assistant để ép model trả JSON"* giờ trả về **lỗi 400**. Cách đúng là dùng **structured output** ở mục 10.

## 10. ⭐⭐ Structured Output — ép model trả JSON đúng schema

Đây là kỹ năng **quan trọng nhất tuần này**. Trong sản phẩm thật, bạn hiếm khi cần văn xuôi — bạn cần **dữ liệu có cấu trúc** để code xử lý tiếp.

### Cách làm đúng

```python
from pydantic import BaseModel, Field

class HoaDon(BaseModel):
    ten_cua_hang: str
    tong_tien: float = Field(description="Tổng tiền, đơn vị VND")
    ngay: str = Field(description="Định dạng YYYY-MM-DD")

response = client.messages.parse(
    model="claude-haiku-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": van_ban_hoa_don}],
    output_config={"format": HoaDon},
)

hoa_don = response.parsed_output       # đã là object HoaDon, đã validate
print(hoa_don.tong_tien)
```

`client.messages.parse()` vừa ràng buộc định dạng đầu ra, vừa **validate tự động** theo schema.

> ⚠️ Tham số `output_format` cũ **đã bị khai tử**. Dùng `output_config={"format": ...}`.

### Vì sao Pydantic mà không phải dict thường?

| | dict thường | Pydantic |
|---|---|---|
| Sai kiểu dữ liệu | Phát hiện ở tận cuối hệ thống | **Báo lỗi ngay** |
| Thiếu trường | `KeyError` lúc chạy | Báo rõ thiếu trường nào |
| Tài liệu | Không có | Chính là class |

> 🔗 Bạn đã gặp ý tưởng này ở Phase 01 với `dataclass`. Pydantic là *"dataclass có kiểm tra kiểu thật sự"* — và `Field(description=...)` còn được đưa vào schema để **model đọc được**, nên nó vừa là tài liệu cho người vừa là chỉ dẫn cho máy.

### Ba nguyên tắc thiết kế schema

**① Tên trường mang nghĩa.** `ten_cua_hang` tốt hơn `field1` — model đọc tên trường để hiểu phải điền gì.

**② Dùng `Field(description=...)` cho mọi trường mơ hồ.** Đặc biệt là định dạng ngày, đơn vị tiền tệ.

**③ Cho phép `None` với trường có thể thiếu.**
```python
so_dien_thoai: str | None = Field(default=None, description="None nếu không có")
```
Không có `None`, model sẽ **bịa** ra một số điện thoại. Cho nó một lối thoát hợp lệ.

---

# TUẦN 18 — Tool Use, Streaming, Caching

## 11. ⭐ Tool Use — cho model gọi hàm của bạn

**Model không tự chạy code.** Nó **yêu cầu** bạn chạy, rồi dùng kết quả.

```
① Bạn khai báo tool (tên, mô tả, schema tham số)
② Model quyết định gọi tool nào, với tham số gì
③ BẠN thực thi hàm đó
④ Bạn gửi kết quả về
⑤ Model dùng kết quả để trả lời
```

```python
tools = [{
    "name": "tra_cuu_don_hang",
    "description": "Tra cứu trạng thái đơn hàng theo mã đơn. "
                   "Dùng khi khách hỏi về tình trạng giao hàng.",
    "input_schema": {
        "type": "object",
        "properties": {
            "ma_don": {"type": "string", "description": "Mã đơn, ví dụ DH00123"},
        },
        "required": ["ma_don"],
        "additionalProperties": False,
    },
    "strict": True,       # ← đảm bảo input đúng schema tuyệt đối
}]

response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1024,
    tools=tools,
    messages=[{"role": "user", "content": "Đơn DH00123 của tôi tới đâu rồi?"}],
)

if response.stop_reason == "tool_use":
    for block in response.content:
        if block.type == "tool_use":
            ket_qua = tra_cuu_don_hang(**block.input)      # BẠN chạy
```

> ⚠️ `strict: True` đặt ở **cấp cao nhất của định nghĩa tool**, không phải trong `tool_choice`. Schema phải có `additionalProperties: False` và `required`.

**Gửi kết quả về:**
```python
messages.append({"role": "assistant", "content": response.content})
messages.append({
    "role": "user",
    "content": [{
        "type": "tool_result",
        "tool_use_id": block.id,
        "content": str(ket_qua),
    }],
})
```

### Ba quy tắc tool use

**① Mô tả tool là prompt engineering.** Model chọn tool dựa trên `description`. Mô tả mơ hồ → model gọi sai tool hoặc không gọi. Ghi rõ **khi nào nên dùng**.

**② Gọi song song → trả kết quả trong MỘT tin nhắn.** Model có thể yêu cầu nhiều tool cùng lúc. Phải gom **tất cả** `tool_result` vào **một** tin nhắn `user`. Chia thành nhiều tin nhắn sẽ âm thầm dạy model thôi gọi song song.

**③ Tool lỗi vẫn phải trả kết quả:**
```python
{"type": "tool_result", "tool_use_id": block.id,
 "content": "Lỗi: không tìm thấy đơn hàng", "is_error": True}
```
Bỏ qua sẽ làm hỏng cấu trúc hội thoại.

> 🔗 Vòng lặp `while stop_reason == "tool_use"` chính là **AI Agent**. Phase 09 sẽ đi sâu.

## 12. Streaming

```python
with client.messages.stream(
    model="claude-haiku-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Viết một đoạn văn về Hà Nội."}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)

    final = stream.get_final_message()      # message hoàn chỉnh + usage
```

**Vì sao dùng streaming:**

| Lý do | Chi tiết |
|---|---|
| **Trải nghiệm người dùng** | Thấy chữ chạy ngay thay vì chờ 10 giây màn hình trắng |
| **Tránh timeout** | `max_tokens` lớn mà không stream dễ vượt thời gian chờ HTTP |
| **Huỷ sớm được** | Người dùng thấy sai hướng có thể dừng |

**TTFT (Time To First Token)** là chỉ số quyết định cảm nhận "nhanh", quan trọng hơn tổng thời gian.

> 🔗 Streaming khả thi vì model sinh **từng token một** — chính vòng lặp `sinh()` bạn viết ở Phase 06.

## 13. ⭐ Prompt Caching — giảm chi phí tới 90%

Nếu nhiều request dùng chung một phần prompt lớn (tài liệu, ví dụ few-shot, mô tả tool), bạn đang **trả tiền lặp lại** cho cùng nội dung.

```python
response = client.messages.create(
    model="claude-haiku-4-5",
    max_tokens=1024,
    system=[{
        "type": "text",
        "text": tai_lieu_lon,                        # phần ỔN ĐỊNH
        "cache_control": {"type": "ephemeral"},
    }],
    messages=[{"role": "user", "content": cau_hoi}], # phần THAY ĐỔI
)
```

### Nguyên tắc sống còn: cache khớp theo TIỀN TỐ

Thứ tự dựng prompt là `tools` → `system` → `messages`.

> ⚠️ **Bất kỳ byte nào thay đổi trong tiền tố sẽ vô hiệu hoá toàn bộ phần sau.**

**Đặt nội dung ổn định TRƯỚC, nội dung thay đổi SAU.**

**Bốn thủ phạm phá cache âm thầm:**
```
❌ datetime.now() trong system prompt
❌ UUID hoặc request ID trong tiền tố
❌ json.dumps(dict) không sort_keys=True  → thứ tự khoá đổi
❌ Danh sách tool sắp xếp khác nhau giữa các lần gọi
```

**Kiểm chứng cache có hoạt động không:**
```python
print(response.usage.cache_read_input_tokens)     # > 0 nghĩa là cache hit
```
Nếu con số này **luôn bằng 0** qua nhiều request giống nhau → có thủ phạm ở trên.

**Ba giới hạn cần nhớ:**
- Tiền tố tối thiểu ~**1024 token** — ngắn hơn thì **âm thầm không cache**
- Tối đa **4 điểm cache** mỗi request
- TTL mặc định 5 phút (đặt `"ttl": "1h"` nếu cần lâu hơn)

**Chi phí:** ghi cache ~1.25× giá thường, đọc cache ~**0.1×**. Hoà vốn sau khoảng 2 lần đọc.

---

# TUẦN 19 — ⭐⭐ Eval tự động

## 14. Vì sao eval là kỹ năng phân biệt junior với senior

> Bạn sửa prompt. Nó có tốt hơn không? **Bạn không biết** — trừ khi đo được.

Không có eval, quy trình phát triển LLM trở thành:
```
sửa prompt → thử một ví dụ → "ừ trông ổn" → deploy → người dùng phàn nàn
```

Có eval:
```
sửa prompt → chạy 50 test case → 44/50 đúng (trước là 41/50) → deploy có căn cứ
```

**Eval chính là `pytest` cho LLM** — với một khác biệt: đầu ra **không xác định tuyệt đối**, nên phải chấm theo **tiêu chí** thay vì so bằng.

> 🔗 Bạn đã học toàn bộ nền tảng ở **Phase 04**: precision, recall, ngưỡng, baseline, chi phí sai. Ở đây chúng quay lại nguyên vẹn, chỉ khác đối tượng đo.

## 15. Bốn thành phần của một bộ eval

**① Golden dataset** — bộ câu hỏi kèm đáp án đúng:
```python
bo_test = [
    {"dau_vao": "Đơn DH001 giao chưa?", "mong_doi": {"y_dinh": "tra_cuu_don"}},
    {"dau_vao": "Tôi muốn đổi hàng",     "mong_doi": {"y_dinh": "doi_tra"}},
]
```

**20–50 case là đủ để bắt đầu.** Ưu tiên **case khó và case biên** hơn case dễ.

**② Hàm chấm** — chọn theo loại bài toán:

| Loại | Cách chấm |
|---|---|
| Phân loại | So khớp chính xác |
| Trích xuất JSON | Đúng schema? Đúng từng trường? |
| Tóm tắt | Có chứa các ý bắt buộc? |
| Trả lời tự do | **LLM-as-judge** |

**③ Baseline** — luôn phải có. Prompt một dòng đơn giản nhất đạt bao nhiêu? Nếu prompt tinh vi của bạn không hơn baseline đáng kể, nó không đáng độ phức tạp.

**④ Theo dõi thoái lui.** Sửa prompt để chữa case A có thể **làm hỏng** case B đang chạy tốt. Không chạy lại toàn bộ bộ test thì bạn không bao giờ biết.

## 16. LLM-as-judge

Với đầu ra tự do, dùng một model **chấm điểm** đầu ra của model khác:

```python
prompt_cham = """Đánh giá câu trả lời theo thang 1-5.

<cau_hoi>{cau_hoi}</cau_hoi>
<dap_an_chuan>{chuan}</dap_an_chuan>
<cau_tra_loi>{tra_loi}</cau_tra_loi>

Tiêu chí:
5 = đúng hoàn toàn và đầy đủ
3 = đúng nhưng thiếu ý
1 = sai hoặc lạc đề

Trả về JSON: {{"diem": <1-5>, "ly_do": "<một câu>"}}"""
```

**Bốn quy tắc dùng LLM-as-judge:**

| # | Quy tắc | Vì sao |
|---|---|---|
| **1** | Cho **tiêu chí cụ thể**, đừng hỏi "tốt không?" | Không có tiêu chí, điểm sẽ tuỳ hứng |
| **2** | Yêu cầu **lý do** kèm điểm | Vừa để bạn debug, vừa buộc model suy luận |
| **3** | Thang điểm **hẹp** (1–5) | Thang 1–100 cho ra điểm nhiễu vô nghĩa |
| **4** | **Kiểm chứng chính judge** | Tự chấm tay 20 case, so với judge. Judge sai thì eval vô nghĩa |

> ⚠️ **Cảnh báo:** LLM-as-judge có thiên kiến — thiên vị câu trả lời **dài hơn**, và thiên vị đầu ra của **chính model nó**. Với quyết định quan trọng, hãy chấm tay một mẫu để đối chứng.

## 17. Quy trình phát triển có eval

```
① Viết 20 case khó (KHÔNG dùng để sửa prompt — đó là tập test)
② Đo baseline
③ Sửa prompt
④ Chạy lại TOÀN BỘ bộ test
⑤ So sánh: cải thiện case nào, làm hỏng case nào?
⑥ Chỉ giữ thay đổi nếu tổng thể tốt hơn
```

> 🔗 Đây chính là quy trình **train / validation / test** của Phase 04. Prompt là "tham số", bộ eval là "validation set". Và **overfitting lên bộ eval** là chuyện có thật: nếu bạn sửa prompt 50 lần dựa trên cùng 20 case, prompt sẽ hợp với đúng 20 case đó.
>
> **Cách phòng:** giữ một bộ **holdout** không bao giờ nhìn tới cho đến khi chốt.

## 18. Bốn chỉ số phải theo dõi trong sản xuất

| Chỉ số | Vì sao |
|---|---|
| **Chất lượng** | Điểm eval — chạy lại khi đổi prompt hoặc model |
| **Chi phí / request** | Chỉ số sống còn của app LLM |
| **Độ trễ (TTFT + tổng)** | Trải nghiệm người dùng |
| **Tỷ lệ lỗi** | 429, 5xx, JSON hỏng, timeout |

---

## 📝 Thực hành

```powershell
pip install -e ".[llm]"

# Tuần 16
code curriculum/07-llm-engineering/lessons/01_claude_api_co_ban.ipynb
code curriculum/07-llm-engineering/exercises/ex01_prompt_va_token.py

# Tuần 17
code curriculum/07-llm-engineering/lessons/02_prompt_va_structured_output.ipynb
code curriculum/07-llm-engineering/exercises/ex02_structured_output.py

# Tuần 18
code curriculum/07-llm-engineering/lessons/03_tool_use_streaming_caching.ipynb

# Tuần 19
code curriculum/07-llm-engineering/lessons/04_eval.ipynb
code curriculum/07-llm-engineering/exercises/ex03_eval.py

pytest tests/phase07 -v          # chạy được KHÔNG cần API key
```

---

## ✅ Tự kiểm tra

1. Vì sao `response.content` là một list chứ không phải chuỗi?
2. API stateless nghĩa là gì? Ba hệ quả?
3. `temperature` dùng được trên model nào, không dùng được trên model nào?
4. Vì sao không được dùng `tiktoken` để đếm token cho Claude?
5. Token vào và token ra, cái nào đắt hơn? Gấp mấy lần?
6. Structured output nên làm thế nào? Vì sao không dùng prefill nữa?
7. Trong tool use, ai là người **thực thi** hàm?
8. Model gọi 3 tool cùng lúc — bạn trả kết quả thế nào?
9. Kể bốn thủ phạm phá prompt cache âm thầm.
10. Vì sao eval là kỹ năng quan trọng nhất phase này?
11. LLM-as-judge có những thiên kiến gì?
12. Overfitting lên bộ eval là gì? Phòng thế nào?

📌 Đáp án đầy đủ: [`resources/interview/phase07-llm.md`](../../resources/interview/phase07-llm.md)

---

## 🎯 Project P5

Xong Tuần 19 → làm [**P5 — Structured Extractor**](../../projects/P5-structured-extractor/README.md).

---

## 📌 Nộp bài

```powershell
pytest tests/phase07 -v
git add .
git commit -m "Tuan 19: hoan thanh phase 07 - LLM engineering"
git push
```

---

⬅️ [Phase 06](../06-nlp-transformers/README.md) · ➡️ [Phase 08 — RAG](../08-rag/README.md)
