# 💼 Phỏng vấn — Phase 06: NLP & Transformers

> Đây là nhóm câu hỏi **quan trọng nhất** khi phỏng vấn vị trí AI/LLM Engineer. Trả lời to trong 60 giây trước khi mở đáp án.

---

### 1. Vì sao subword tokenization thắng cả mức ký tự lẫn mức từ?

<details><summary>Đáp án</summary>

**Đánh đổi cốt lõi:**

```
        từ vựng nhỏ                          từ vựng lớn
        chuỗi dài                            chuỗi ngắn
        ├──────────────┼──────────────┼──────────────┤
      ký tự         subword          từ
                   ← LLM ở đây →
```

| Mức | Vấn đề |
|---|---|
| **Ký tự** | Chuỗi rất dài → attention O(n²) rất tốn; model phải học từ đầu cách ghép ký tự thành từ |
| **Từ** | Từ vựng khổng lồ (quy luật Zipf: rất nhiều từ chỉ xuất hiện 1–2 lần); từ mới → `<unk>` mất sạch thông tin |
| **Subword** | ✅ Cân bằng cả hai |

**Ba ưu điểm của subword:**
1. **Không bao giờ gặp từ chưa thấy** — tệ nhất thì tách thành ký tự
2. Từ phổ biến giữ nguyên một token; từ hiếm bị tách
3. Từ vựng vừa phải (30.000–130.000) → ma trận embedding không quá lớn

**Con số cụ thể** (đo trên 20.000 ký tự tiếng Việt trong khoá học này):
```
ký tự : 20.000 token
BPE   : 10.619 token
từ    :  4.569 token
```

**Ý ăn điểm:** giải thích vì sao độ dài chuỗi quan trọng — attention là **O(T²)**, chuỗi ngắn đi một nửa thì tính toán giảm bốn lần. Và giải thích vì sao từ vựng không thể phình to: ma trận embedding có `vocab × d_model` tham số; với `d=4096` và vocab 1 triệu thì riêng embedding đã 4 tỷ tham số.
</details>

---

### 2. BPE hoạt động thế nào? Mô tả thuật toán.

<details><summary>Đáp án</summary>

**Byte Pair Encoding — bốn bước:**
```
① Bắt đầu: mỗi ký tự là một token
② Tìm CẶP token liền nhau xuất hiện NHIỀU NHẤT
③ Gộp cặp đó thành một token mới
④ Lặp lại N lần
```

Ví dụ với `"nam nam nam nha"`:
```
bước 0:  n a m _ n a m _ n a m _ n h a
bước 1:  cặp ("n","a") nhiều nhất → "na"
bước 2:  cặp ("na","m") nhiều nhất → "nam"
```

**Kết quả huấn luyện = một DANH SÁCH CÓ THỨ TỰ các phép gộp.** Thứ tự rất quan trọng — phép gộp sau phụ thuộc kết quả phép gộp trước.

**BPE thực tế khác gì bản đơn giản:**
1. Làm việc trên **byte** chứ không phải ký tự Unicode → không bao giờ gặp ký tự lạ, kể cả emoji hay chữ Hán
2. **Tách từ trước bằng regex**, chỉ gộp trong từng từ → tránh tạo token vắt qua ranh giới từ
3. Số lần gộp rất lớn: GPT-2 có 50.257 token, Llama 3 có 128.000

**Ý ăn điểm:** nguồn gốc thú vị — ý tưởng đến từ **nén dữ liệu** (Gage, 1994), không phải NLP. Sennrich (2015) mang nó sang dịch máy.

**Ý ăn điểm thêm:** nhắc phải **phá thế hoà** khi hai cặp cùng tần suất — nếu không, hai lần train trên cùng dữ liệu ra hai tokenizer khác nhau, và model sẽ vô dụng khi nạp lại.
</details>

---

### 3. Vì sao tiếng Việt tốn nhiều token hơn tiếng Anh? Điều đó ảnh hưởng gì?

<details><summary>Đáp án</summary>

**Nguyên nhân:** tokenizer của các LLM lớn được huấn luyện trên kho ngữ liệu **chủ yếu tiếng Anh**. Các cặp ký tự tiếng Anh phổ biến được gộp thành token dài; ký tự tiếng Việt có dấu (`ế`, `ượ`, `ỗ`) ít gặp nên bị tách vụn.

**Ba hệ quả thực tế:**

| Hệ quả | Chi tiết |
|---|---|
| **Tốn tiền hơn** | Cùng một ý, prompt tiếng Việt tốn nhiều token hơn → hoá đơn API cao hơn |
| **Context window nhỏ hơn** | Cùng 128k token, nhét được ít nội dung tiếng Việt hơn |
| **Chậm hơn** | Nhiều token hơn → suy luận lâu hơn |

**Cách xử lý:**
- **Đếm token thật**, đừng ước lượng bằng số từ (tỷ lệ "1 token ≈ 0.75 từ" chỉ đúng với tiếng Anh)
- Cân nhắc viết prompt **hệ thống** bằng tiếng Anh, chỉ để nội dung người dùng bằng tiếng Việt
- Với khối lượng lớn, đo chi phí thực tế trên dữ liệu thật trước khi cam kết

**Ý ăn điểm:** nhắc tới lỗi liên quan — LLM hay sai khi được hỏi *"từ này có mấy chữ â?"* hay *"đảo ngược chuỗi"*. **Model không thấy chữ cái, nó thấy token.** Mẹo xử lý: chèn dấu cách giữa các chữ cái trong prompt để ép tokenizer tách nhỏ.
</details>

---

### 4. Cosine similarity đo gì? Vì sao không dùng khoảng cách Euclid?

<details><summary>Đáp án</summary>

**Cosine đo GÓC giữa hai vector, bỏ qua độ dài:**
```
cos(a, b) = (a · b) / (|a| × |b|)      →  luôn trong [-1, 1]
```

**Vì sao không dùng độ lớn:**
```
[1, 0] · [1, 0]    = 1
[1, 0] · [100, 0]  = 100     ← cùng hướng y hệt, số khác hẳn
cosine cả hai      = 1.0     ← đúng
```

**Vì sao quan trọng với RAG:** đoạn văn **dài** có vector "lớn" hơn đoạn **ngắn**. Nếu dùng tích vô hướng thô, đoạn dài luôn thắng bất kể nội dung. Cosine cho phép so sánh công bằng giữa đoạn 20 từ và đoạn 200 từ.

**Mẹo tối ưu quan trọng:** sau khi **chuẩn hoá** vector về độ dài 1, cosine **trở thành tích vô hướng**:
```python
kho_n = kho / kho.norm(dim=1, keepdim=True)
diem = kho_n @ truy_van_n          # MỘT phép nhân ma trận cho toàn bộ kho
```
Với 1.000 vector, đo được nhanh hơn vòng lặp khoảng 100 lần. **Mọi vector database đều lưu vector đã chuẩn hoá sẵn vì lý do này.**

**Ý ăn điểm:** ba kiểm tra nhanh khi debug ma trận tương đồng — đường chéo chính phải bằng 1, ma trận phải đối xứng, mọi giá trị trong `[-1, 1]`. Sai một trong ba là có bug.
</details>

---

### 5. Giải thích Q, K, V bằng ẩn dụ. Attention hoạt động thế nào?

<details><summary>Đáp án</summary>

**Ẩn dụ tra cứu thư viện** — mỗi token tạo ra ba vector từ chính nó:

| Vector | Vai trò | Ẩn dụ |
|---|---|---|
| **Query (Q)** | *"Tôi đang tìm gì?"* | Câu hỏi tra cứu |
| **Key (K)** | *"Tôi chứa thông tin gì?"* | Nhãn trên gáy sách |
| **Value (V)** | *"Nội dung thật của tôi"* | Nội dung trong sách |

**Ba bước:**
```
① Query của token hiện tại so với Key của MỌI token  →  điểm giống nhau
② Softmax các điểm đó                                 →  trọng số, tổng = 1
③ Trung bình CÓ TRỌNG SỐ các Value                    →  đầu ra
```

**Công thức:**
```
Attention = softmax(Q Kᵀ / √d) V
```

**Vấn đề nó giải:** trong câu *"Con mèo đuổi con chuột vì NÓ đói"*, để hiểu `NÓ`, model phải nhìn lại và **chú ý vào** `mèo`. Mean pooling (Phase 06 bài 2) không làm được điều đó — nó cho `"mèo đuổi chuột"` và `"chuột đuổi mèo"` cùng một vector.

**Ý ăn điểm:** nhắc rằng ma trận attention `T × T` **vẽ ra được** và là công cụ chẩn đoán mạnh nhất khi debug Transformer — mỗi hàng là một token đang hỏi *"tôi nên chú ý vào ai?"*, tổng mỗi hàng bằng 1.
</details>

---

### 6. Vì sao phải chia cho √d trong công thức attention?

<details><summary>Đáp án</summary>

**Để softmax không bị bão hoà.**

**Giải thích toán học:** nếu các phần tử của Q và K độc lập, kỳ vọng 0, phương sai 1, thì tích vô hướng `Q·K` có **phương sai bằng d**. Với `d = 512`, độ lệch chuẩn ~22.6 — các điểm nằm rải từ −70 đến +70.

Softmax trên dải giá trị rộng như vậy trở nên **cực nhọn**: một phần tử gần bằng 1, còn lại gần 0.

**Vì sao đó là thảm hoạ:** đạo hàm của softmax ở vùng bão hoà gần bằng **0** → **gradient biến mất** → model không học được gì.

Chia cho `√d` đưa phương sai về 1 → softmax "mềm" → gradient chảy.

**Số liệu đo thật** (từ notebook của khoá học, trọng số attention lớn nhất của token đầu):
```
   d      không chia √d      có chia √d
   8          0.9911            0.6999
  64          0.9713            0.3629
 512          1.0000            0.6286
```

Không chia, khi `d` lớn softmax gần như one-hot ngay từ đầu.

**Ý ăn điểm:** đó là chữ **"scaled"** trong tên gọi *scaled dot-product attention* — cái tên nói đúng điều quan trọng nhất.
</details>

---

### 7. Causal mask làm gì? Nó tạo khác biệt gì giữa GPT và BERT?

<details><summary>Đáp án</summary>

**Causal mask che không cho token nhìn tương lai:**
```
       t1    t2    t3    t4
 t1  [ ✓     ✗     ✗     ✗  ]
 t2  [ ✓     ✓     ✗     ✗  ]     ✗ = đặt -inf trước softmax → thành 0
 t3  [ ✓     ✓     ✓     ✗  ]
 t4  [ ✓     ✓     ✓     ✓  ]
```

**Vì sao cần:** khi **sinh** thật, token thứ 5 không thể nhìn token thứ 6 — chúng chưa tồn tại. Nếu cho nhìn khi train, model học cách "gian lận": dự đoán token thứ `i` bằng cách nhìn chính token thứ `i`. Loss rất thấp khi train, model **hoàn toàn vô dụng** khi sinh.

> Đây là một dạng **data leakage** ở cấp độ kiến trúc.

**Khác biệt hai họ model:**

| | Decoder-only | Encoder-only |
|---|---|---|
| Mask | Có | Không |
| Nhìn được | Chỉ quá khứ | Cả hai phía |
| Ví dụ | GPT, Claude, Llama | BERT, PhoBERT |
| Dùng để | **Sinh** văn bản | **Hiểu** văn bản (phân loại, trích xuất) |

**Chỉ một dòng `masked_fill` tạo ra khác biệt giữa hai họ model thống trị NLP.**

**Ý ăn điểm:** lợi ích phụ rất lớn — nhờ mask, **một** lần forward trên chuỗi dài `T` cho ta `T` bài toán dự đoán cùng lúc. Đó là lý do train GPT hiệu quả đến vậy: **mọi token trong kho ngữ liệu đều là một ví dụ huấn luyện**.
</details>

---

### 8. Vì sao Transformer cần positional encoding?

<details><summary>Đáp án</summary>

**Attention xử lý mọi token cùng lúc và đối xứng — nó không có khái niệm thứ tự.** Với nó, *"mèo đuổi chuột"* và *"chuột đuổi mèo"* giống hệt nhau.

(Đối lập với RNN: RNN đọc tuần tự nên thứ tự có sẵn. Đó là thứ Transformer **đánh đổi** để được tính song song.)

**Giải pháp:** cộng thông tin vị trí vào embedding.
```python
x = token_embedding(idx) + position_embedding(vi_tri)
```

**Vì sao dùng sin/cos mà không đánh số 0, 1, 2, 3…?**
1. Giá trị **bị chặn** trong `[-1, 1]` — vị trí 5000 không áp đảo tín hiệu ngữ nghĩa
2. Mỗi vị trí có một **"vân tay" duy nhất** (tổ hợp nhiều tần số)
3. **Quan hệ tương đối** suy ra được: `PE(pos+k)` là phép quay tuyến tính của `PE(pos)`

| Cách | Ai dùng |
|---|---|
| Học được (`nn.Embedding`) | GPT-2 — đơn giản nhưng không tổng quát hoá quá độ dài đã train |
| Sin/cos | Transformer gốc (2017) |
| **RoPE** (xoay) | Llama, Claude, hầu hết LLM hiện đại |

**Ý ăn điểm — liên hệ thực tế:** *"Đây chính là lý do LLM có **context window** giới hạn: model chỉ học cách xử lý vị trí đến một độ dài nhất định. Mọi kỹ thuật mở rộng context (rope scaling…) đều xoay quanh việc sửa phần này."*
</details>

---

### 9. Skip connection và LayerNorm giải quyết vấn đề gì?

<details><summary>Đáp án</summary>

**Skip connection (`x + f(x)`):**

Cho gradient một **"đường cao tốc"** đi thẳng về các lớp đầu. Đạo hàm của `x + f(x)` theo `x` là `1 + f'(x)` — có số **1** đó nên gradient không bao giờ biến mất hoàn toàn, dù `f'(x)` nhỏ đến đâu.

Không có nó, mạng 50+ lớp **không train nổi** — gradient tắt dần trước khi về tới lớp đầu.

> Phát minh từ **ResNet** (Phase 05), và là một trong những ý tưởng quan trọng nhất của deep learning hiện đại.

**LayerNorm:**

Chuẩn hoá đầu ra mỗi lớp về mean 0, std 1 **theo từng token** (khác BatchNorm chuẩn hoá theo batch).

| | Chuẩn hoá theo |
|---|---|
| **BatchNorm** | Chiều batch — phụ thuộc các mẫu khác trong batch |
| **LayerNorm** | Chiều đặc trưng — mỗi token độc lập |

**Vì sao Transformer dùng LayerNorm chứ không BatchNorm:**
- Câu có độ dài khác nhau → thống kê theo batch không ổn định
- Khi **suy luận** thường chỉ có 1 mẫu → BatchNorm vô nghĩa
- LayerNorm không phụ thuộc batch → hành vi giống nhau khi train và khi chạy thật

**Ý ăn điểm:** nhắc **pre-norm vs post-norm** — bài báo gốc đặt LayerNorm *sau* attention (post-norm), nhưng các model hiện đại đặt *trước* (pre-norm) vì nó train ổn định hơn nhiều với mạng sâu. Mini-GPT trong khoá học này dùng pre-norm.
</details>

---

### 10. Temperature làm gì? Giải thích về mặt cơ học.

<details><summary>Đáp án</summary>

**Chia logits cho temperature TRƯỚC softmax:**
```python
xac_suat = softmax(logits / temperature)
```

Chia cho số **nhỏ** → khoảng cách giữa các logit bị **phóng to** → phân phối **nhọn** hơn → ít ngẫu nhiên hơn.

| Temperature | Hiệu ứng |
|---|---|
| `→ 0` | Luôn chọn token cao nhất — ổn định nhưng **lặp lại** |
| `0.7–0.9` | Cân bằng — mặc định thông dụng |
| `> 1.2` | Rất ngẫu nhiên — sáng tạo nhưng dễ **vô nghĩa** |

**Không phải "độ sáng tạo" mơ hồ — chỉ là một phép chia trước softmax.**

**Các chiến lược lấy mẫu khác:**

| Cách | Ý tưởng |
|---|---|
| **Greedy** | Luôn lấy token cao nhất — dễ lặp vô hạn |
| **Top-k** | Chỉ lấy mẫu trong `k` token cao nhất |
| **Top-p (nucleus)** | Lấy mẫu trong nhóm nhỏ nhất có tổng xác suất ≥ `p` |

**Khi nào dùng gì:**
- Trích xuất dữ liệu, phân loại, trả JSON → `temperature = 0`
- Viết nội dung, brainstorm → `0.7–1.0`
- Cần đa dạng có kiểm soát → top-p ~0.9

**Ý ăn điểm:** *"Với bài toán cần đầu ra ổn định — trích xuất JSON, phân loại — tôi luôn đặt temperature = 0. Không phải vì nó 'chính xác hơn', mà vì nó **tái lập được**: cùng prompt cho cùng kết quả, nên eval mới có ý nghĩa."*
</details>

---

### 11. Vì sao LLM "ảo giác" (bịa thông tin)?

<details><summary>Đáp án</summary>

**Vì nó chỉ được huấn luyện để đoán token tiếp theo — không phải để nói sự thật.**

Model tối ưu **một** mục tiêu duy nhất: cho ngữ cảnh này, token nào có xác suất cao nhất. Một câu bịa nghe trôi chảy có xác suất cao hơn một câu đúng nhưng lạ lẫm.

Nó **không có** cơ chế tra cứu, **không có** khái niệm "tôi không biết" trừ khi được huấn luyện riêng để nói vậy.

**Ba nguồn ảo giác:**
1. **Không có thông tin** trong dữ liệu train → model vẫn phải sinh gì đó
2. **Thông tin mâu thuẫn** trong dữ liệu train
3. **Ngữ cảnh gợi ý sai** — prompt dẫn dắt model vào vùng nó không chắc

**Cách giảm — theo hiệu quả:**

| Cách | Phase |
|---|---|
| **RAG** — đưa sự thật vào ngữ cảnh, buộc trích dẫn nguồn | 08 |
| **Tool use** — cho model tra cứu thật thay vì nhớ | 09 |
| **Prompt** — cho phép nói *"tôi không biết"*, yêu cầu trích dẫn | 07 |
| **Temperature = 0** | 07 |
| **Eval tự động** đo faithfulness | 07–08 |

**Ý ăn điểm — chốt bằng hiểu biết cơ học:** *"Sau khi tự xây mini-GPT, tôi thấy rõ: nó chỉ nhân ma trận rồi softmax ra phân phối token. Không có bước nào tra cứu sự thật. Nên ảo giác không phải 'lỗi' — nó là hệ quả tất yếu của mục tiêu huấn luyện. Việc của kỹ sư là **thiết kế hệ thống quanh nó**, chứ không phải kỳ vọng model tự hết ảo giác."*

Câu trả lời này cho thấy bạn hiểu bản chất chứ không học thuộc.
</details>

---

### 12. Vì sao attention tốn O(T²)? Điều đó ảnh hưởng gì đến thực tế?

<details><summary>Đáp án</summary>

**Ma trận attention có kích thước `T × T`** — mỗi token phải so với mọi token khác.

```
context     ô trong ma trận      gấp bao nhiêu lần 128
    128              16.384                        1x
  2.048           4.194.304                      256x
 32.768       1.073.741.824                   65.536x
128.000      16.384.000.000                1.000.000x
```

**Chuỗi dài gấp đôi → tính toán gấp bốn**, bộ nhớ cũng gấp bốn.

**Ba hệ quả thực tế:**
1. **Context window dài rất đắt** — cả về tiền lẫn độ trễ
2. Số token trong prompt **trực tiếp** quyết định chi phí
3. Nhét cả tài liệu vào prompt thường **tệ hơn** RAG — vừa đắt vừa dễ bị *"lost in the middle"*

**Các hướng giải quyết đang được nghiên cứu:**

| Kỹ thuật | Ý tưởng |
|---|---|
| **FlashAttention** | Không đổi độ phức tạp nhưng tối ưu truy cập bộ nhớ → nhanh hơn nhiều |
| **Sliding window** | Mỗi token chỉ nhìn `w` token gần nhất → O(T·w) |
| **Linear attention** | Xấp xỉ softmax để đạt O(T) |
| **KV cache** | Khi sinh, lưu lại K/V đã tính → không tính lại từ đầu mỗi token |

**Ý ăn điểm — liên hệ kiến trúc hệ thống:** *"Đây là lý do kỹ thuật khiến RAG thắng 'nhét hết tài liệu vào prompt'. Với 100 trang tài liệu, RAG lấy đúng 3 đoạn liên quan — rẻ hơn hàng trăm lần và thường chính xác hơn, vì model không bị nhiễu bởi 97 trang không liên quan."*
</details>
