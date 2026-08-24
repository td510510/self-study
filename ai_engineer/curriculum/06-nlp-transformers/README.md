# Phase 06 · NLP & Transformers

**Thời gian:** Tuần 14–15 (~24 giờ) · **Điều kiện:** xong [Phase 05](../05-deep-learning/README.md)

---

## 🎯 Mục tiêu

Đây là phase **mở nắp hộp đen LLM**. Kết thúc, bạn hiểu chính xác điều gì xảy ra bên trong ChatGPT và Claude — vì bạn đã **tự xây một cái thu nhỏ**.

- [ ] Tokenization: văn bản thành số như thế nào
- [ ] Embedding & cosine similarity — nền tảng của tìm kiếm ngữ nghĩa
- [ ] **Attention** — giải thích bằng trực giác rồi bằng code
- [ ] Positional encoding & causal mask
- [ ] **Tự code mini-GPT (~200 dòng)** và train nó sinh tiếng Việt
- [ ] HuggingFace `transformers` — dùng model có sẵn
- [ ] → 🎯 **Project P4: Mini-GPT**

> **Vì sao phase này đáng giá nhất trong 22 tuần:** sau khi tự tay xây Transformer, mọi thứ ở Phase 07–09 (prompt, context window, token, RAG, agent) sẽ có ý nghĩa cơ học rõ ràng thay vì là các quy tắc bạn phải học thuộc.

---

## ⚙️ Chuẩn bị

```powershell
pip install torch                                       # chỉ cần torch cho phần lõi
python curriculum/06-nlp-transformers/tao_du_lieu.py
```

Tạo hai file:

| File | Nội dung | Dùng cho |
|---|---|---|
| `data/van_ban_viet.txt` | 264 KB văn bản tiếng Việt, 100 ký tự khác nhau | Train mini-GPT (Tuần 15) |
| `data/cau_mau.json` | 200 câu ngắn, 5 chủ đề | Tập embedding & tìm kiếm (Tuần 14) |

**Kết quả thật khi chạy trên CPU:** mini-GPT 360.000 tham số, train **64 giây**, sinh được tiếng Việt đúng chính tả và đúng dấu.

> Phần HuggingFace ở bài 4 cần `pip install transformers` và **kết nối mạng** để tải model. Nó là phần bổ sung — mọi nội dung cốt lõi chạy offline chỉ với `torch`.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **14** | Tokenizer, embedding, attention | `01`, `02`, `03` | `ex01`, `ex02`, `ex03` |
| **15** | Mini-GPT + HuggingFace → **P4** | `04` | — |

---

# TUẦN 14 — Từ văn bản đến Attention

## 1. Tokenization — văn bản thành số

Mạng neural chỉ hiểu số. Bước đầu tiên luôn là biến văn bản thành dãy số nguyên.

```
"Xin chào"  →  [88, 12, 45, 3, 27, 15, 33, 41]  →  model
```

### Ba mức tokenization

| Mức | Ví dụ `"lập trình"` | Từ vựng | Độ dài chuỗi |
|---|---|---|---|
| **Ký tự** | `l ậ p _ t r ì n h` | Rất nhỏ (~100) | Rất dài |
| **Từ** | `lập trình` hoặc `lập` `trình` | Rất lớn (~50.000+) | Ngắn |
| **Subword (BPE)** | `lập` `trình` hoặc `lậ` `p` `trì` `nh` | Vừa (~30.000–100.000) | Vừa |

**Đánh đổi cốt lõi:**

```
        từ vựng nhỏ                          từ vựng lớn
        chuỗi dài                            chuỗi ngắn
        ├──────────────┼──────────────┼──────────────┤
      ký tự         subword          từ
                   ← LLM ở đây →
```

**Vì sao subword thắng?**
- Không bao giờ gặp *"từ chưa từng thấy"* — tệ nhất thì tách thành ký tự
- Từ phổ biến giữ nguyên một token (`"nhà"`), từ hiếm bị tách (`"bất_khả_thi"` → 3 token)
- Từ vựng vừa phải → ma trận embedding không quá lớn

### BPE — thuật toán mà GPT dùng

**Byte Pair Encoding**, ý tưởng cực đơn giản:

```
① Bắt đầu: mỗi ký tự là một token
② Tìm CẶP token liền nhau xuất hiện NHIỀU NHẤT
③ Gộp cặp đó thành một token mới
④ Lặp lại N lần
```

Ví dụ với `"nam nam nam nha"`:
```
bước 0:  n a m _ n a m _ n a m _ n h a
bước 1:  cặp ("n","a") nhiều nhất → gộp thành "na"
         na m _ na m _ na m _ n h a
bước 2:  cặp ("na","m") nhiều nhất → gộp thành "nam"
         nam _ nam _ nam _ n h a
```

Bạn sẽ **tự code thuật toán này** ở bài tập 1.

### ⚠️ Ba điều về token mà mọi AI Engineer phải biết

**① Tiếng Việt tốn token hơn tiếng Anh.** Tokenizer của các LLM lớn được huấn luyện chủ yếu trên tiếng Anh, nên tiếng Việt (có dấu) thường bị tách vụn hơn — **cùng một ý, prompt tiếng Việt tốn nhiều token hơn tiếng Anh**, nghĩa là tốn tiền hơn.

**② Token ≈ 0.75 từ tiếng Anh, nhưng với tiếng Việt tỷ lệ khác hẳn.** Đừng ước lượng chi phí bằng số từ — hãy đếm token thật (Phase 07).

**③ Model không "thấy" chữ cái.** Nó thấy token. Đó là lý do LLM hay sai khi được hỏi *"từ 'dâu tây' có mấy chữ â?"* — nó chưa từng nhìn thấy từng ký tự riêng lẻ.

---

## 2. Embedding — số có ý nghĩa

Token ID là số **tuỳ tiện**: `"vua" = 4821`, `"hoàng hậu" = 9033`. Hai số này không nói lên quan hệ gì.

**Embedding** biến mỗi token thành một **vector** mang ngữ nghĩa:

```
"vua"       →  [ 0.21, -0.45,  0.88, ...]   (768 chiều)
"hoàng hậu" →  [ 0.19, -0.41,  0.85, ...]   ← gần nhau!
"bánh mì"   →  [-0.72,  0.13, -0.30, ...]   ← xa
```

Vector không do ai đặt tay — model **học** ra chúng trong lúc train.

### Đo độ giống nhau: cosine similarity

Bạn đã code công thức này ở **Phase 02**:

```
cos(a, b) = (a · b) / (|a| × |b|)      →  luôn trong [-1, 1]
```

| Giá trị | Nghĩa |
|---|---|
| `1.0` | Cùng hướng — rất giống nhau |
| `0.0` | Không liên quan |
| `-1.0` | Ngược hướng |

**Vì sao cosine mà không phải khoảng cách thường?** Vì đoạn văn dài có vector "lớn" hơn đoạn ngắn. Cosine chỉ so **hướng**, loại bỏ ảnh hưởng của độ lớn → so sánh công bằng.

> 🔗 **Đây chính là cơ chế của RAG (Phase 08).** Biến câu hỏi thành vector, biến mọi đoạn tài liệu thành vector, rồi tìm đoạn có cosine cao nhất. Không có gì hơn thế.

### Embedding của TỪ vs của CÂU

| | Cách làm | Vấn đề |
|---|---|---|
| **Token embedding** | Tra bảng: mỗi token một vector cố định | `"đá"` trong *"nước đá"* và *"đá bóng"* có **cùng** vector — sai |
| **Contextual embedding** | Vector phụ thuộc **ngữ cảnh xung quanh** | Chính xác — và đây là thứ Transformer tạo ra |

Chuyển từ cái thứ nhất sang cái thứ hai **chính là công việc của attention**.

---

## 3. ⭐⭐ Attention — trái tim của Transformer

### Vấn đề cần giải

```
"Con mèo đuổi con chuột vì NÓ đói."
```

`NÓ` là mèo hay chuột? Muốn biết, khi xử lý từ `NÓ` ta phải **nhìn lại** các từ trước và quyết định **chú ý vào từ nào**.

Đó chính xác là điều attention làm.

### Ẩn dụ: tra cứu trong thư viện

Mỗi token tạo ra **ba** vector:

| Vector | Vai trò | Ẩn dụ |
|---|---|---|
| **Query (Q)** | *"Tôi đang tìm gì?"* | Câu hỏi tra cứu |
| **Key (K)** | *"Tôi chứa thông tin gì?"* | Nhãn trên gáy sách |
| **Value (V)** | *"Nội dung thật của tôi"* | Nội dung trong sách |

**Cách hoạt động:**
```
① Query của token hiện tại so với Key của MỌI token  →  điểm giống nhau
② Softmax các điểm đó                                 →  trọng số chú ý (tổng = 1)
③ Trung bình có trọng số các Value                    →  đầu ra
```

### Công thức

```
                    Q Kᵀ
Attention = softmax(────) V
                     √d
```

Chỉ có vậy. Bốn phép: nhân ma trận, chia, softmax, nhân ma trận.

**Vì sao chia cho `√d`?** Khi số chiều `d` lớn, tích vô hướng `Q·K` có giá trị rất lớn → softmax trở nên cực nhọn (gần như one-hot) → gradient gần bằng 0 → model không học được. Chia cho `√d` giữ phương sai ổn định. Đây gọi là **scaled** dot-product attention.

### Ma trận attention — nhìn được bằng mắt

```
              Con   mèo  đuổi  chuột   vì    nó
     Con   [ 0.7   0.1   0.1   0.0   0.0   0.1 ]
     mèo   [ 0.2   0.6   0.1   0.0   0.0   0.1 ]
    đuổi   [ 0.1   0.4   0.3   0.1   0.0   0.1 ]
   chuột   [ 0.0   0.1   0.3   0.5   0.0   0.1 ]
      vì   [ 0.0   0.1   0.1   0.1   0.6   0.1 ]
      nó   [ 0.0  [0.5]  0.1   0.2   0.1   0.1 ]   ← "nó" chú ý mạnh vào "mèo"
```

Mỗi **hàng** là một token đang hỏi *"tôi nên chú ý vào ai?"*. Tổng mỗi hàng bằng 1 (do softmax).

Bạn sẽ **vẽ được ma trận này** từ mini-GPT của chính mình ở bài 4.

### Multi-head attention

Một "đầu" attention chỉ học được **một kiểu** quan hệ. Multi-head chạy nhiều đầu **song song**, mỗi đầu học một kiểu:

```
đầu 1: chú ý vào chủ ngữ
đầu 2: chú ý vào từ liền trước
đầu 3: chú ý vào động từ chính
...
```

Rồi nối kết quả lại. Với `d=96` và 4 đầu, mỗi đầu làm việc với 24 chiều.

### ⚠️ Causal mask — thứ làm nên GPT

Khi **sinh** văn bản, token thứ 5 **không được nhìn** token thứ 6, 7, 8 — vì lúc chạy thật chúng chưa tồn tại.

```
       t1    t2    t3    t4
 t1  [ ✓     ✗     ✗     ✗  ]
 t2  [ ✓     ✓     ✗     ✗  ]     ✗ = bị che (đặt -inf trước softmax)
 t3  [ ✓     ✓     ✓     ✗  ]
 t4  [ ✓     ✓     ✓     ✓  ]
```

Đặt `-inf` ở các ô bị che → sau softmax chúng thành 0.

| Kiến trúc | Mask | Ví dụ |
|---|---|---|
| **Decoder-only** (causal) | Có | GPT, Claude, Llama — **sinh** văn bản |
| **Encoder-only** (bidirectional) | Không | BERT — **hiểu** văn bản (phân loại, trích xuất) |

> 🔑 Chỉ một dòng code khác nhau (`masked_fill`) tạo ra khác biệt giữa hai họ model thống trị NLP.

---

## 4. Positional encoding

Attention xử lý mọi token **cùng lúc** — nó không có khái niệm thứ tự. Với nó, *"mèo đuổi chuột"* và *"chuột đuổi mèo"* **giống hệt nhau**.

Giải pháp: cộng thêm thông tin vị trí vào embedding.

```python
x = token_embedding(idx) + position_embedding(vi_tri)
```

| Cách | Ai dùng |
|---|---|
| **Học được** (`nn.Embedding`) | GPT-2, mini-GPT của bạn — đơn giản nhất |
| **Sin/cos cố định** | Transformer gốc (2017) |
| **RoPE** (xoay) | Llama, Claude, hầu hết LLM hiện đại |

> Đây là lý do LLM có **context window** giới hạn: model chỉ học vị trí đến một độ dài nhất định. Vượt qua đó, nó không biết xử lý.

---

# TUẦN 15 — Xây mini-GPT

## 5. Kiến trúc Transformer Block

```
     x ─────────────────────┐
     │                      │
  LayerNorm                 │
     │                      │
  Multi-head attention      │  (skip connection)
     │                      │
     +──────────────────────┘
     │
     ├─────────────────────┐
     │                     │
  LayerNorm                │
     │                     │
  Feed-forward (MLP)       │  (skip connection)
     │                     │
     +─────────────────────┘
     │
     ▼
```

**Ba thành phần, mỗi cái giải một vấn đề:**

| Thành phần | Giải vấn đề gì |
|---|---|
| **Attention** | Token trao đổi thông tin với nhau |
| **Feed-forward** | Mỗi token tự "suy nghĩ" thêm (thường rộng gấp 4 lần) |
| **Skip connection** | Gradient chảy được qua mạng sâu — không có nó, mạng 50 lớp không train nổi |
| **LayerNorm** | Ổn định giá trị, giúp train nhanh và không phân kỳ |

> 💡 **Skip connection** (`x + f(x)`) là phát minh từ ResNet mà bạn đã gặp ở Phase 05. Nó cho gradient một "đường cao tốc" đi thẳng về các lớp đầu.

## 6. GPT hoàn chỉnh

```
tokens
  │
Token embedding + Position embedding
  │
Transformer Block  ×N
  │
LayerNorm
  │
Linear (d → vocab_size)
  │
logits  →  softmax  →  xác suất token tiếp theo
```

**Đó là toàn bộ GPT.** Khác biệt giữa mini-GPT của bạn và GPT-4 chỉ là:

| | Mini-GPT của bạn | GPT-4 |
|---|---|---|
| Tham số | 360.000 | ~1.000.000.000.000 |
| Lớp | 3 | ~100+ |
| Context | 64 token | 128.000+ token |
| Dữ liệu train | 264 KB | ~10 TB |
| Chi phí train | 64 giây CPU | Hàng chục triệu đô |

**Kiến trúc thì giống nhau về bản chất.**

## 7. Sinh văn bản & Temperature

```python
for _ in range(so_token_moi):
    logits = model(idx[:, -block_size:])[:, -1, :]   # chỉ lấy token cuối
    xac_suat = softmax(logits / temperature)
    token_moi = multinomial(xac_suat, 1)             # lấy mẫu
    idx = cat([idx, token_moi])
```

Đây gọi là **autoregressive**: sinh từng token, mỗi token dựa trên toàn bộ những gì đã sinh.

**Temperature điều chỉnh độ ngẫu nhiên:**

| Giá trị | Hiệu ứng |
|---|---|
| `→ 0` | Luôn chọn token có xác suất cao nhất — ổn định nhưng lặp lại |
| `0.7–0.9` | Cân bằng — mặc định thông dụng |
| `> 1.2` | Rất ngẫu nhiên — sáng tạo nhưng dễ vô nghĩa |

Cách hoạt động: chia logits cho temperature **trước** softmax. Chia cho số nhỏ → khoảng cách giữa các logit bị phóng to → phân phối nhọn hơn.

> 🔗 Đây chính xác là tham số `temperature` bạn sẽ gặp trong Claude API ở Phase 07. Giờ bạn biết nó làm gì về mặt cơ học.

**Các chiến lược lấy mẫu khác:**

| Cách | Ý tưởng |
|---|---|
| **Greedy** | Luôn lấy token cao nhất — dễ lặp vô hạn |
| **Top-k** | Chỉ lấy mẫu trong `k` token cao nhất |
| **Top-p (nucleus)** | Lấy mẫu trong nhóm token nhỏ nhất có tổng xác suất ≥ `p` |

## 8. HuggingFace — dùng model có sẵn

Trong công việc thật, bạn hiếm khi train từ đầu:

```python
from transformers import AutoTokenizer, AutoModel

tokenizer = AutoTokenizer.from_pretrained("ten-model")
model = AutoModel.from_pretrained("ten-model")

inputs = tokenizer("Xin chào", return_tensors="pt")
outputs = model(**inputs)
```

**Ba loại model bạn sẽ gặp:**

| Loại | Dùng để | Ví dụ |
|---|---|---|
| **Encoder** | Hiểu, phân loại, trích xuất | BERT, PhoBERT (tiếng Việt) |
| **Decoder** | Sinh văn bản | GPT, Llama |
| **Embedding** | Biến câu thành vector cho tìm kiếm | sentence-transformers |

> 🔗 Loại thứ ba là thứ bạn dùng ở **Phase 08 (RAG)**.

---

## 📝 Thực hành

```powershell
pip install torch
python curriculum/06-nlp-transformers/tao_du_lieu.py

# Tuần 14
code curriculum/06-nlp-transformers/lessons/01_tokenizer.ipynb
code curriculum/06-nlp-transformers/lessons/02_embedding.ipynb
code curriculum/06-nlp-transformers/lessons/03_attention.ipynb
code curriculum/06-nlp-transformers/exercises/ex01_tokenizer.py
code curriculum/06-nlp-transformers/exercises/ex02_embedding.py
code curriculum/06-nlp-transformers/exercises/ex03_attention.py

# Tuần 15
code curriculum/06-nlp-transformers/lessons/04_mini_gpt.ipynb

pytest tests/phase06 -v
```

---

## ✅ Tự kiểm tra

1. Vì sao subword tokenization thắng cả ký tự lẫn từ?
2. BPE hoạt động thế nào? Mô tả 4 bước.
3. Vì sao tiếng Việt tốn nhiều token hơn tiếng Anh?
4. Cosine similarity đo gì? Vì sao không dùng khoảng cách Euclid?
5. Giải thích Q, K, V bằng ẩn dụ thư viện.
6. Vì sao phải chia cho `√d` trong công thức attention?
7. Causal mask làm gì? Nó tạo khác biệt gì giữa GPT và BERT?
8. Vì sao Transformer cần positional encoding?
9. Skip connection giải quyết vấn đề gì?
10. Temperature = 0 và temperature = 2 khác nhau ra sao về mặt cơ học?

📌 Đáp án đầy đủ: [`resources/interview/phase06-nlp.md`](../../resources/interview/phase06-nlp.md)

---

## 🎯 Project P4

Xong Tuần 15 → làm [**P4 — Mini-GPT**](../../projects/P4-mini-gpt/README.md).

---

## 📌 Nộp bài

```powershell
pytest tests/phase06 -v
git add .
git commit -m "Tuan 15: hoan thanh phase 06 - NLP va Transformers"
git push
```

---

⬅️ [Phase 05](../05-deep-learning/README.md) · ➡️ [Phase 07 — LLM Engineering](../07-llm-engineering/README.md)
