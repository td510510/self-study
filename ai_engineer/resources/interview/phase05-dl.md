# 💼 Phỏng vấn — Phase 05: Deep Learning

> Trả lời to trong 60 giây trước khi mở đáp án.

---

### 1. Vì sao mạng neural cần hàm phi tuyến? Không có thì sao?

<details><summary>Đáp án</summary>

**Không có hàm phi tuyến, chồng bao nhiêu lớp cũng chỉ tương đương MỘT lớp:**

```
(X @ W₁) @ W₂ = X @ (W₁ @ W₂) = X @ W_mới
```

Tích của các phép biến đổi tuyến tính vẫn là một phép biến đổi tuyến tính. Mạng 50 lớp không có activation chỉ vẽ được đúng một siêu phẳng — không hơn gì hồi quy tuyến tính.

**Hàm kích hoạt là thứ DUY NHẤT làm mạng sâu có ý nghĩa.**

| Hàm | Dùng khi |
|---|---|
| **ReLU** `max(0,x)` | Mặc định cho lớp ẩn — nhanh, đơn giản |
| **GELU** | Transformer, GPT |
| **Sigmoid** | Chỉ lớp cuối, phân loại nhị phân |
| **Softmax** | Chỉ khi hiển thị xác suất |

**Ý ăn điểm:** giải thích vì sao sigmoid không còn dùng cho lớp ẩn — đạo hàm của nó tối đa chỉ 0.25, qua 10 lớp gradient bị nhân với `0.25¹⁰ ≈ 10⁻⁶` → **vanishing gradient**, các lớp đầu gần như không học được. ReLU có đạo hàm bằng 1 ở vùng dương nên không bị.
</details>

---

### 2. `optimizer.zero_grad()` để làm gì? Quên nó thì hậu quả gì?

<details><summary>Đáp án</summary>

**`.grad` trong PyTorch được CỘNG DỒN, không ghi đè.**

```python
loss.backward()
loss.backward()
w.grad        # gấp đôi!
```

Quên `zero_grad()` → gradient của các batch trước còn nguyên → model cập nhật theo hướng vô nghĩa.

**Triệu chứng:** loss giảm rất chậm, dao động, hoặc bùng nổ. **Không có thông báo lỗi nào** — đây là lý do nó khó tìm.

**Vì sao PyTorch không tự xoá?** Vì có lúc ta *muốn* cộng dồn — **gradient accumulation** mô phỏng batch lớn trên GPU nhỏ:

```python
for i, (xb, yb) in enumerate(loader):
    loss = ham_loss(model(xb), yb) / so_buoc_gop
    loss.backward()                    # cộng dồn
    if (i + 1) % so_buoc_gop == 0:
        opt.step(); opt.zero_grad()
```

**Ý ăn điểm:** nhắc rằng kỹ thuật này rất hay dùng khi fine-tune model lớn trên GPU phổ thông — gộp 4 batch nhỏ để tương đương một batch gấp 4 lần.
</details>

---

### 3. Viết training loop từ trí nhớ.

<details><summary>Đáp án</summary>

```python
for epoch in range(so_epoch):
    model.train()
    for xb, yb in dataloader:
        y_pred = model(xb)               # ① FORWARD
        loss = ham_loss(y_pred, yb)      # ② LOSS

        optimizer.zero_grad()            # ③ XOÁ gradient cũ
        loss.backward()                  #    BACKWARD
        optimizer.step()                 # ④ UPDATE

    model.eval()
    with torch.no_grad():
        val_loss = ham_loss(model(X_val), y_val)
```

**Sáu dòng này là toàn bộ deep learning.** ResNet, BERT, GPT-4 đều train bằng đúng vòng lặp này.

**Bốn chi tiết ăn điểm:**
1. `model.train()` / `model.eval()` — bắt buộc khi có Dropout/BatchNorm
2. `torch.no_grad()` khi đánh giá — nhanh hơn, ít RAM hơn
3. Cộng dồn loss phải dùng `.item()` — nếu không giữ lại đồ thị của mọi batch → rò rỉ bộ nhớ
4. `zero_grad()` phải nằm **giữa** hai lần `backward()`

**Ý ăn điểm thêm:** đối chiếu với gradient descent tự viết bằng NumPy — PyTorch chỉ thay bạn làm bước 3 (tính gradient), ba bước kia vẫn là bạn.
</details>

---

### 4. Vì sao KHÔNG đặt `nn.Softmax()` ở cuối model dùng `CrossEntropyLoss`?

<details><summary>Đáp án</summary>

**`nn.CrossEntropyLoss` đã bao gồm log-softmax bên trong.** Thêm softmax vào model = áp dụng **hai lần**.

Hậu quả: gradient bị bóp nhỏ nghiêm trọng, model học rất kém — và **không có thông báo lỗi nào**. Model vẫn chạy, vẫn ra số, chỉ là kém hơn nhiều.

**Quy tắc:** model phân loại trả về **logits thô**. Chỉ dùng softmax khi cần hiển thị xác suất cho người xem.

```python
# ✅ ĐÚNG
model = nn.Sequential(..., nn.Linear(64, 10))
loss = nn.CrossEntropyLoss()(model(x), y)

# Khi cần xác suất để hiển thị:
xac_suat = torch.softmax(model(x), dim=1)
```

**Bảng loss tương ứng:**

| Bài toán | Loss | Nhận gì |
|---|---|---|
| Nhiều lớp | `CrossEntropyLoss` | logits + nhãn số nguyên |
| Nhị phân | `BCEWithLogitsLoss` | logits |
| Nhị phân (đã sigmoid) | `BCELoss` | xác suất — **tránh dùng**, kém ổn định số |

**Ý ăn điểm:** giải thích vì sao gộp softmax vào loss lại tốt hơn — **ổn định số học**. `log(softmax(x))` tính trực tiếp tránh được tràn số khi logits lớn, thủ thuật gọi là *log-sum-exp trick*.

**Ý ăn điểm thêm:** `argmax` của logits **luôn bằng** argmax của softmax (softmax là hàm đồng biến), nên khi chỉ cần nhãn thì không việc gì phải softmax.
</details>

---

### 5. Vì sao không khởi tạo mạng neural bằng toàn số 0?

<details><summary>Đáp án</summary>

**Symmetry breaking problem.** Nếu mọi nơ-ron trong một lớp có cùng trọng số:
- Chúng tính ra **cùng** giá trị đầu ra
- Nhận **cùng** gradient
- Cập nhật **y hệt** nhau

→ Cả lớp 128 nơ-ron hành xử như **một** nơ-ron, mãi mãi. Mạng mất hết khả năng biểu diễn.

**Cần khởi tạo ngẫu nhiên** để phá vỡ đối xứng.

**Nhưng ngẫu nhiên thế nào cũng quan trọng:**

| Khởi tạo | Vấn đề |
|---|---|
| Quá nhỏ | Tín hiệu tắt dần qua các lớp → vanishing |
| Quá lớn | Tín hiệu bùng nổ → exploding |
| **Xavier/Glorot** | Cho sigmoid/tanh |
| **Kaiming/He** | Cho ReLU — mặc định của PyTorch |

Ý tưởng chung: chọn phương sai sao cho **độ lớn tín hiệu được giữ ổn định** qua các lớp.

**Ý ăn điểm:** lưu ý ngoại lệ — với hồi quy tuyến tính khởi tạo `w = 0` hoàn toàn ổn, vì hàm loss có dạng bát chỉ có **một** cực tiểu. Vấn đề chỉ phát sinh khi có **nhiều nơ-ron trong cùng một lớp**.

**Ý ăn điểm thêm:** *bias* thì khởi tạo 0 được — vì các nơ-ron đã khác nhau nhờ weights rồi.
</details>

---

### 6. Kể ba lý do CNN tốt hơn MLP với ảnh.

<details><summary>Đáp án</summary>

**① Bất biến với dịch chuyển (quan trọng nhất).**
CNN chia sẻ trọng số — cùng một kernel trượt khắp ảnh. Nó học *"cạnh dọc trông thế nào"* **một lần** và dùng ở mọi vị trí.
MLP phải học riêng *"hình tròn ở góc trên trái"*, *"hình tròn ở giữa"*… như những mẫu hoàn toàn khác nhau.

**② Giữ cấu trúc không gian.**
MLP `flatten` ảnh thành vector → hai pixel cạnh nhau và hai pixel ở hai góc đối diện được đối xử **y như nhau**. Thông tin "gần nhau" biến mất hoàn toàn.

**③ Ít tham số hơn (khi ảnh lớn).**
Ảnh 224×224 màu → 150.528 đầu vào. Một lớp ẩn 1.000 nơ-ron cần **150 triệu** tham số chỉ cho lớp đầu. CNN dùng kernel 3×3 chia sẻ nên tham số gần như không phụ thuộc kích thước ảnh.

**Số liệu thật từ khoá học này** (cùng dữ liệu, cùng ~105k tham số):
```
MLP: 82%     CNN: 96%     ← chênh 14 điểm
```

**Ý ăn điểm:** nêu rõ lý do ① là lớn nhất trong trường hợp cụ thể đó — vì dữ liệu có hình **xoay và dịch chuyển ngẫu nhiên**. Với ảnh đã căn giữa hoàn hảo (như MNIST gốc), khoảng cách nhỏ hơn nhiều.

**Ý ăn điểm thêm:** liên hệ Transformer cũng dùng chia sẻ trọng số — cùng một khối attention áp dụng cho mọi vị trí trong chuỗi, đó là lý do nó xử lý được văn bản dài bất kỳ.
</details>

---

### 7. Ảnh 32×32, `Conv2d(3, 16, kernel_size=5, padding=2)` rồi `MaxPool2d(2)` → shape đầu ra?

<details><summary>Đáp án</summary>

**`(batch, 16, 16, 16)`**

```
     vào + 2×padding − kernel
out = ─────────────────────── + 1
              stride

Conv:  (32 + 2×2 − 5) / 1 + 1 = 32     →  (batch, 16, 32, 32)
Pool:  (32 − 2) / 2 + 1       = 16     →  (batch, 16, 16, 16)
```

- Số **kênh** đổi từ 3 → 16 (do `out_channels=16`)
- Kích thước **không gian** giữ nguyên sau conv (`padding = (5-1)/2 = 2`), rồi giảm nửa sau pool

**Mẹo phải nhớ:** `padding = (kernel − 1) // 2` thì kích thước **giữ nguyên** (với stride 1). Đó là lý do `kernel_size=3, padding=1` xuất hiện ở khắp nơi.

**Ý ăn điểm:** nhắc quy ước shape PyTorch là `(batch, kênh, cao, rộng)` — NCHW, khác với thư viện ảnh dùng HWC.

**Ý ăn điểm thêm:** *"Trong thực tế tôi không tính nhẩm — tôi cho một tensor giả chạy qua rồi in `.shape`. Nhanh hơn và không thể sai."*
</details>

---

### 8. `model.train()` và `model.eval()` khác nhau ra sao? Quên thì sao?

<details><summary>Đáp án</summary>

Chúng đổi **hành vi** của hai loại lớp:

| Lớp | `train()` | `eval()` |
|---|---|---|
| **Dropout** | Tắt ngẫu nhiên x% nơ-ron | Dùng toàn bộ mạng |
| **BatchNorm** | Dùng thống kê của batch hiện tại | Dùng trung bình động đã tích luỹ |

**Quên `model.eval()` khi đánh giá:**
- Dropout vẫn bật → kết quả **sai** và **dao động** giữa các lần chạy
- BatchNorm dùng thống kê của batch test → kết quả phụ thuộc vào việc bạn chia batch thế nào

Đây là một trong những bug khó tìm nhất với người mới, vì model **vẫn chạy và vẫn ra số**.

**Quên `model.train()` sau khi đánh giá:** dropout tắt suốt quá trình train → mất hết tác dụng chống overfit.

**⚠️ Phân biệt với `torch.no_grad()`:**

| | Ảnh hưởng |
|---|---|
| `model.eval()` | **Hành vi** của model — vấn đề **đúng/sai** |
| `torch.no_grad()` | Tắt tính đạo hàm — vấn đề **tốc độ/bộ nhớ** |

Hai thứ **khác nhau hoàn toàn**, khi đánh giá phải dùng **cả hai**.

**Ý ăn điểm:** mẹo dùng decorator cho gọn và không quên:
```python
@torch.no_grad()
def danh_gia(model, X, y):
    model.eval()
    ...
```
</details>

---

### 9. Model overfit. Bạn làm gì, theo thứ tự nào?

<details><summary>Đáp án</summary>

**Theo thứ tự hiệu quả:**

| # | Cách | Ghi chú |
|---|---|---|
| **①** | **Thêm dữ liệu** | Hiệu quả nhất, thường không có sẵn |
| **②** | **Data augmentation** | "Dữ liệu miễn phí" — hiệu quả nhất với ảnh |
| **③** | **Early stopping** | Rẻ nhất, luôn nên dùng |
| **④** | **Dropout / Weight decay** | `p=0.2–0.5`, `wd=1e-4` |
| **⑤** | **Model đơn giản hơn** | Ít lớp, ít nơ-ron |
| **⑥** | **Transfer learning** | Khi dữ liệu ít |

**Số liệu thật từ khoá học này** (CNN trên 1.000 ảnh, đo trên tập test 2.000 ảnh):

```
                    train      val    khoảng cách
CNN thô            0.9820   0.8635      +0.1185
+ Dropout          0.9500   0.8650      +0.0850
+ Augmentation     0.9290   0.9020      +0.0270   ← hiệu quả nhất
+ Weight decay     0.9620   0.8725      +0.0895
Đầy đủ             0.9590   0.9395      +0.0195
```

**Vì sao augmentation thắng:** nó tấn công đúng gốc rễ — model overfit vì **thiếu dữ liệu**, còn augmentation tạo dữ liệu mới gần như miễn phí.

**Quy tắc chọn phép biến đổi: phép biến đổi phải KHÔNG làm đổi nhãn.** Lật ngang chữ số `6` là sai; xoay 180° biến `6` thành `9`.

**Ý ăn điểm:** *"Trước khi chống overfit, tôi kiểm tra xem có phải overfit thật không — bằng cách vẽ đường cong loss của cả train và val. Nếu val loss vẫn đang giảm thì chưa cần làm gì, chỉ cần train tiếp."*
</details>

---

### 10. Transfer learning là gì? Vì sao nó hiệu quả?

<details><summary>Đáp án</summary>

**Lấy model đã train trên dữ liệu khổng lồ, giữ phần đã học, chỉ chỉnh lại phần cuối cho bài toán của mình.**

```python
model = models.resnet18(weights="IMAGENET1K_V1")
for p in model.parameters():
    p.requires_grad = False                        # đóng băng
model.fc = nn.Linear(model.fc.in_features, so_lop) # thay lớp cuối
```

**Vì sao hiệu quả:** các lớp đầu học **cạnh, góc, kết cấu** — thứ dùng chung cho **mọi** loại ảnh. Chỉ lớp cuối cần học riêng.

```
lớp 1: ╱ ╲ │ ─      cạnh, góc        ← dùng chung cho mọi bài toán
lớp 2: ○ □ △        hình dạng        ← phần lớn dùng chung
lớp 3: 🚗 🐱 🏠      vật thể          ← đặc thù, cần thay
```

Với 1.000 ảnh, transfer learning cho kết quả tốt hơn **rất nhiều** so với train từ đầu.

**Ba mức độ:**

| Mức | Làm gì | Dùng khi |
|---|---|---|
| Feature extraction | Đóng băng hết, train lớp cuối | Dữ liệu rất ít |
| Fine-tune một phần | Mở băng vài lớp cuối | Dữ liệu vừa |
| Fine-tune toàn bộ | Train hết với lr nhỏ | Dữ liệu nhiều, khác miền |

**🔗 Ý ăn điểm lớn nhất — liên hệ sang LLM:**

> *"Đây chính là ý tưởng nền tảng của toàn bộ ngành LLM. Không ai train GPT từ đầu. Ba lựa chọn khi dùng LLM song ánh với ba mức transfer learning: **prompting** ≈ dùng luôn không train, **RAG** ≈ đưa thêm ngữ cảnh lúc chạy, **fine-tune/LoRA** ≈ mở băng một phần tham số."*

Câu trả lời này cho thấy bạn hiểu bức tranh lớn, không chỉ thuộc kỹ thuật.
</details>
