# 🎯 P4 · Mini-GPT

**Làm khi:** xong Phase 06 (Tuần 15) · **Thời gian:** 10–14 giờ

---

## Mục tiêu

Xây một mô hình ngôn ngữ **từ đầu**, train nó trên văn bản bạn tự chọn, và **giải thích được từng dòng code**.

> **Đây là project ấn tượng nhất trong CV của bạn.** Rất nhiều người dùng được LLM API. Rất ít người tự xây được một Transformer và giải thích được nó. Trong phỏng vấn, đây là thứ tách bạn ra khỏi đám đông.

---

## Chọn dữ liệu

| Mức | Dữ liệu | Ghi chú |
|---|---|---|
| 🟢 **Tối thiểu** | `data/van_ban_viet.txt` (đã có) | Chạy ngay, nhưng văn bản sinh từ mẫu nên model học quá dễ |
| 🟡 **Nên làm** | Văn bản tiếng Việt **thật** bạn tự thu thập | Kết quả thật hơn nhiều, và bạn thấy được model vật lộn thế nào |
| 🔴 **Thú vị nhất** | Văn bản có **phong cách riêng** | Thơ Việt, lời nhạc, code Python, log hệ thống, tin nhắn của chính bạn |

<details><summary>Gợi ý nguồn văn bản (chú ý bản quyền)</summary>

**An toàn về bản quyền:**
- Văn bản **thuộc phạm vi công cộng** (tác phẩm cổ, ca dao tục ngữ)
- Văn bản do **chính bạn viết**: nhật ký, blog, tin nhắn, ghi chú
- **Code của chính bạn** — train GPT sinh code Python rất thú vị
- Wikipedia tiếng Việt (giấy phép CC BY-SA — nhớ ghi nguồn)
- Log, dữ liệu công khai của tổ chức bạn (nếu được phép)

**Kích thước khuyến nghị:** 200 KB – 5 MB. Nhỏ hơn thì model overfit ngay; lớn hơn thì train lâu trên CPU.

> ⚠️ Đừng dùng sách/báo có bản quyền rồi công khai model. Nếu chỉ train để học và không phát tán thì rủi ro thấp, nhưng hãy ý thức về điều đó.
</details>

---

## Deliverable

```
projects/P4-mini-gpt/
├── README.md            # BÁO CÁO + mẫu văn bản sinh ra
├── mo_hinh.py           # kiến trúc: Head, MultiHead, Block, MiniGPT
├── tokenizer.py         # tokenizer (ký tự hoặc BPE tự viết)
├── train.py             # CLI train + lưu checkpoint
├── sinh.py              # CLI sinh văn bản từ checkpoint
├── kham_pha.ipynb       # phân tích: đường cong học, attention, temperature
├── hinh/                # biểu đồ
└── checkpoint.pt        # model đã train (nếu < 50MB)
```

---

## Yêu cầu

### ① Kiến trúc (`mo_hinh.py`)

- [ ] `Head` — self-attention một đầu, có causal mask
- [ ] `MultiHead` — nhiều đầu song song + lớp chiếu `Wo`
- [ ] `FeedForward` — MLP rộng gấp 4
- [ ] `Block` — attention + FF + **skip connection** + **LayerNorm**
- [ ] `MiniGPT` — token embedding + position embedding + N block + lớp ra
- [ ] Hàm `sinh()` hỗ trợ **temperature** và **top-k**
- [ ] Tự viết, **không** dùng `nn.MultiheadAttention` hay `nn.TransformerBlock`

> Bạn **được phép** tham khảo notebook bài 4, nhưng phải **gõ lại** và giải thích được từng dòng.

### ② Tokenizer (`tokenizer.py`)

- [ ] Class có `ma_hoa()`, `giai_ma()`, `luu()`, `nap()`
- [ ] **Lưu từ vựng ra file** — nếu không, model nạp lại sẽ giải mã sai hoàn toàn
- [ ] Mức ký tự là đủ; **BPE tự viết** thì được cộng điểm

### ③ Train (`train.py`)

```powershell
python train.py --data data/tho.txt --epoch 3000 --d-model 128 --layer 4
```

- [ ] Chia train/val, báo cáo **cả hai** loss
- [ ] Vẽ đường cong học, so với baseline `ln(vocab_size)`
- [ ] Lưu checkpoint (model + tokenizer + cấu hình siêu tham số)
- [ ] Sinh thử vài dòng sau mỗi N bước — để **thấy** model tiến bộ
- [ ] Tự phát hiện GPU, dùng nếu có

### ④ Sinh (`sinh.py`)

```powershell
python sinh.py --ckpt checkpoint.pt --prompt "Hôm nay" --temp 0.8 --n 500
```

- [ ] Nạp checkpoint và sinh văn bản
- [ ] Hỗ trợ `--temp` và `--top-k`
- [ ] Không crash khi prompt chứa ký tự ngoài từ vựng

### ⑤ Khám phá (`kham_pha.ipynb`)

- [ ] Đường cong học (train + val)
- [ ] **So sánh temperature** 0.2 / 0.8 / 1.5 — dán văn bản sinh ra
- [ ] **Vẽ ma trận attention** của model đã train, ít nhất 2 lớp
- [ ] Nhận xét: các đầu attention có khác nhau không? Lớp sau khác lớp đầu thế nào?
- [ ] **Thí nghiệm ít nhất một biến**: số lớp / d_model / block size / có–không skip connection

### ⑥ Báo cáo (README.md)

```markdown
# Mini-GPT trên <loại văn bản>

## Kết quả
[3–5 đoạn văn bản model sinh ra, ở các temperature khác nhau]

## Dữ liệu
Nguồn, kích thước, từ vựng, cách chia train/val.

## Kiến trúc
Bảng: tham số, số lớp, số đầu, context, thời gian train.
Tham số nằm ở đâu (embedding? attention? feed-forward?).

## Đường cong học
[biểu đồ] Loss cuối, perplexity, so với baseline ln(V).

## Attention học được gì
[ma trận attention] Nhận xét cụ thể.

## Thí nghiệm
Bảng: đổi X thì loss/chất lượng thay đổi thế nào.

## Model KHÔNG làm được gì
Trung thực về giới hạn.

## Bài học
```

---

## ✅ Tiêu chí chấm

| Hạng mục | Điểm | Đạt khi |
|---|---|---|
| **Kiến trúc đúng** | 25 | Đủ 5 thành phần, tự viết, có mask + skip + LayerNorm |
| **Train thành công** | 20 | Loss giảm rõ dưới `ln(V)`, có đường cong học |
| **Sinh được văn bản** | 15 | Văn bản có cấu trúc, đúng chính tả cơ bản |
| **Phân tích** | 25 | Vẽ attention + so sánh temperature + **≥1 thí nghiệm có kết luận** |
| **Giải thích được** | 15 | README cho thấy bạn hiểu, không copy |

**Tự chấm mức độ:**

| Mức | Dấu hiệu |
|---|---|
| ❌ Chưa đạt | Copy notebook, loss không giảm, không giải thích được |
| ⚠️ Tạm được | Train được, sinh được, nhưng không phân tích gì |
| ✅ Tốt | Có attention map, so sánh temperature, ≥1 thí nghiệm |
| 🌟 Xuất sắc | Dữ liệu tự chọn thú vị + BPE tự viết + nhiều thí nghiệm có kết luận |

---

## 💡 Bảy lỗi người mới hay mắc

| Lỗi | Triệu chứng | Cách sửa |
|---|---|---|
| **Quên lưu tokenizer** | Nạp checkpoint → sinh ra rác | Lưu từ vựng **cùng** checkpoint |
| **Quên `sorted()` khi xây từ vựng** | Chạy lại ra kết quả khác | `sorted(set(van_ban))` |
| **Quên causal mask** | Loss thấp bất thường, sinh ra rác | Kiểm tra tam giác trên của ma trận attention |
| **Quên skip connection** | Mạng sâu không học được | `x = x + f(x)` |
| **Không cắt context khi sinh** | Lỗi shape sau `BLOCK` token | `idx[:, -BLOCK:]` |
| **Thêm Softmax vào model** | Học rất chậm | `cross_entropy` đã có log-softmax |
| **Loss ra `nan`** | Sau vài bước | Giảm learning rate 10 lần |

> ⚠️ **Cách kiểm tra causal mask hoạt động:** vẽ ma trận attention — **tam giác trên phải luôn trắng**. Nếu không, model đang "nhìn tương lai" và mọi kết quả đều vô nghĩa.

---

## 🌟 Thử thách thêm

- [ ] **Tự viết BPE** thay tokenizer ký tự — so sánh chất lượng và tốc độ
- [ ] **KV cache** khi sinh — đo xem nhanh hơn bao nhiêu lần
- [ ] Thay learned positional embedding bằng **sin/cos** — có khác gì không?
- [ ] **Bỏ positional encoding hoàn toàn** — model tệ đi bao nhiêu? *(thí nghiệm rất đáng làm)*
- [ ] So sánh **pre-norm vs post-norm** trên mạng 6 lớp
- [ ] Train trên **hai loại văn bản** rồi so sánh phong cách sinh ra
- [ ] Đưa lên Gradio để người khác thử sinh văn bản

---

## 📌 Nộp bài

```powershell
git add .
git commit -m "P4: mini-GPT tu xay"
git push
```

Sau đó tự kiểm tra bằng **bài test khắt khe nhất**:

> Mở `mo_hinh.py`, chỉ vào một dòng bất kỳ, và giải thích to trong 30 giây:
> **dòng này làm gì, và điều gì hỏng nếu xoá nó đi?**

Nếu có dòng nào bạn không trả lời được → xoá nó đi và viết lại theo cách bạn hiểu.

---

⬅️ [Phase 06](../../curriculum/06-nlp-transformers/README.md) · ➡️ [Phase 07 — LLM Engineering](../../curriculum/07-llm-engineering/README.md)
