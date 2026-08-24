# Phase 05 · Deep Learning (nền tảng)

**Thời gian:** Tuần 12–13 (~24 giờ) · **Điều kiện:** xong [Phase 04](../04-classical-ml/README.md)

---

## 🎯 Mục tiêu

Phase này mở nắp hộp đen. Sau đây, khi nghe *"GPT có 175 tỷ tham số"* bạn biết chính xác **tham số là gì** và **chúng được cập nhật thế nào**.

- [ ] Tensor & `autograd` — PyTorch tự tính đạo hàm ra sao
- [ ] **Tự viết training loop** từ đầu, không dùng thư viện tiện lợi
- [ ] MLP: mạng neural nhiều lớp
- [ ] Hàm kích hoạt, khởi tạo, dropout, batch norm
- [ ] **CNN** — và *thấy tận mắt* vì sao nó thắng MLP với ảnh
- [ ] Chống overfit: augmentation, early stopping, weight decay
- [ ] GPU & Google Colab
- [ ] → 🎯 **Project P3: Image Classifier + Gradio**

> **Định vị:** bạn học LLM Application Engineer, nên đây không phải nơi để thành chuyên gia computer vision. Mục tiêu là **hiểu cơ chế** — vì Transformer (Phase 06) và mọi LLM đều được train bằng đúng vòng lặp bạn viết ở đây.

---

## ⚙️ Chuẩn bị

```powershell
pip install torch                                    # chỉ cần torch, ~200MB
python curriculum/05-deep-learning/tao_du_lieu.py
```

Tạo `data/hinh_khoi.npz` — 10.000 ảnh 28×28, 4 lớp: tròn, vuông, tam giác, chữ thập.

| | Độ chính xác | Thời gian train (CPU) |
|---|---|---|
| MLP trên pixel thô | ~82% | ~2 giây |
| CNN | ~96% | ~13 giây |

> **Vì sao tự sinh dữ liệu thay vì tải MNIST/CIFAR?** Không cần mạng, không cần `torchvision`, train xong trong vài chục giây trên CPU — bạn **lặp lại thí nghiệm** được nhiều lần thay vì chờ hàng giờ.
>
> Ảnh có **nhiễu, xoay, dịch chuyển, đổi kích thước**. Phép xoay là thứ làm khó MLP nhất — và chính là chỗ CNN toả sáng.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **12** | Tensor, autograd, training loop, MLP | `01`, `02` | `ex01`, `ex02` |
| **13** | CNN, chống overfit, GPU → **P3** | `03`, `04` | `ex03` |

---

# TUẦN 12 — Tensor, Autograd & Training Loop

## 1. Deep learning là gì (định nghĩa dùng được)

> **Mạng neural = chuỗi phép nhân ma trận xen kẽ hàm phi tuyến.**

```
output = f( f( f(X @ W₁ + b₁) @ W₂ + b₂ ) @ W₃ + b₃ )
              ↑                ↑                ↑
            lớp 1            lớp 2            lớp 3
```

Bạn đã viết `X @ w + b` ở Phase 02. Deep learning chỉ là **xếp chồng** nhiều lớp như vậy, với một hàm phi tuyến `f` chen giữa.

**Vì sao phải có hàm phi tuyến?** Không có nó, chồng bao nhiêu lớp cũng vô ích:
```
(X @ W₁) @ W₂ = X @ (W₁ @ W₂) = X @ W_mới
```
Ba lớp tuyến tính = một lớp tuyến tính. Hàm kích hoạt là thứ **duy nhất** làm mạng sâu có ý nghĩa.

### Khi nào dùng deep learning?

| Dữ liệu | Nên dùng |
|---|---|
| **Bảng** (CSV, database) | ❌ Gradient Boosting — vẫn thắng DL |
| **Ảnh** | ✅ CNN |
| **Văn bản** | ✅ Transformer |
| **Âm thanh** | ✅ CNN / Transformer |
| Dữ liệu **rất ít** (< 1.000 mẫu) | ❌ Classical ML |

> 🔑 Đừng dùng mạng neural cho file CSV. Đây là lỗi phổ biến của người vừa học xong deep learning.

## 2. Tensor — NumPy array biết tính đạo hàm

```python
import torch

x = torch.tensor([1.0, 2.0, 3.0])
x.shape, x.dtype, x.device
```

Gần như mọi thứ bạn biết về NumPy đều đúng với tensor:

| NumPy | PyTorch |
|---|---|
| `np.array([1,2])` | `torch.tensor([1., 2.])` |
| `np.zeros((2,3))` | `torch.zeros(2, 3)` |
| `a @ b` | `a @ b` |
| `a.reshape(3,2)` | `a.reshape(3, 2)` / `a.view(3, 2)` |
| `a.sum(axis=0)` | `a.sum(dim=0)` |
| `np.concatenate` | `torch.cat` |

**Ba khác biệt quan trọng:**

| | Ý nghĩa |
|---|---|
| `requires_grad=True` | Tensor này cần tính đạo hàm |
| `.to("cuda")` | Chuyển sang GPU |
| `dtype` mặc định là `float32` | NumPy mặc định `float64` — DL dùng 32-bit để nhanh gấp đôi |

> ⚠️ **Lỗi kiểu dữ liệu là lỗi số 1 của người mới với PyTorch.** `torch.tensor([1, 2])` cho `int64`, và mọi phép nhân với `float32` sẽ báo lỗi. Nhớ dấu chấm: `torch.tensor([1., 2.])`.

## 3. ⭐ Autograd — thứ làm nên deep learning

Ở Phase 02 bạn **tự tính** đạo hàm của `f(w) = (w-3)²` bằng tay. Với mạng có hàng triệu tham số, làm bằng tay là bất khả thi.

**PyTorch ghi lại mọi phép tính bạn làm, rồi tự lần ngược để tính đạo hàm.**

```python
w = torch.tensor(0.0, requires_grad=True)

loss = (w - 3) ** 2      # PyTorch ghi lại: trừ, rồi bình phương
loss.backward()          # lần ngược, tính đạo hàm

w.grad                   # tensor(-6.)  ← chính xác bằng 2(w-3) = 2(0-3)
```

### Đồ thị tính toán

```
   w ──(trừ 3)──▶ u ──(bình phương)──▶ loss
     ◀──────────    ◀──────────────
      du/dw = 1      dloss/du = 2u

   dloss/dw = dloss/du × du/dw = 2u × 1 = 2(w-3)
```

Đây là **quy tắc chuỗi** (chain rule) — và đó là toàn bộ nội dung của **backpropagation**. Không có gì huyền bí.

### Ba quy tắc sống còn với autograd

**① `.grad` được CỘNG DỒN, không ghi đè**
```python
loss.backward()
loss.backward()
w.grad        # tensor(-12.) ← cộng dồn hai lần!
```
Vì thế mọi training loop đều bắt đầu bằng `optimizer.zero_grad()`. **Quên nó là bug kinh điển nhất của PyTorch** — model học sai mà không báo lỗi gì.

**② Chỉ tensor "lá" mới có `.grad`**
Kết quả trung gian không giữ gradient (để tiết kiệm bộ nhớ).

**③ `torch.no_grad()` khi không cần đạo hàm**
```python
with torch.no_grad():
    du_doan = model(X_test)      # nhanh hơn, tốn ít RAM hơn
```
Luôn dùng khi đánh giá và khi suy luận.

## 4. ⭐⭐ Training loop — bốn bước, lặp lại mãi mãi

```python
for epoch in range(so_epoch):
    for X_batch, y_batch in dataloader:

        y_pred = model(X_batch)              # ① FORWARD  — dự đoán
        loss = ham_loss(y_pred, y_batch)     # ② LOSS     — sai bao nhiêu

        optimizer.zero_grad()                # ③ XOÁ gradient cũ  ← ĐỪNG QUÊN
        loss.backward()                      #    BACKWARD — sai theo hướng nào
        optimizer.step()                     # ④ UPDATE   — sửa tham số
```

**Sáu dòng này là toàn bộ deep learning.** ResNet, BERT, GPT-4 — tất cả đều được train bằng đúng vòng lặp này.

Đối chiếu với Phase 02:

| Phase 02 (tự viết) | PyTorch |
|---|---|
| `y_pred = X @ w + b` | `y_pred = model(X)` |
| `loss = np.mean((y_pred - y)**2)` | `loss = ham_loss(y_pred, y)` |
| `grad_w = (2/n) * X.T @ sai_so` | `loss.backward()` |
| `w = w - lr * grad_w` | `optimizer.step()` |

PyTorch chỉ thay bạn làm **bước 3** — bước khó nhất. Ba bước kia bạn vẫn tự viết.

## 5. Batch, Epoch, Learning rate

| Thuật ngữ | Nghĩa |
|---|---|
| **Batch** | Một nhóm mẫu xử lý cùng lúc (thường 32–256) |
| **Epoch** | Một lượt duyệt hết dữ liệu train |
| **Iteration** | Một lần cập nhật tham số = một batch |

Với 8.000 mẫu, batch size 64 → **125 iteration mỗi epoch**.

**Vì sao dùng batch mà không dùng cả tập dữ liệu?**

| Cách | Ưu | Nhược |
|---|---|---|
| Cả tập (batch = n) | Gradient chính xác | Không đủ RAM; cập nhật quá ít |
| **Mini-batch (32–256)** | ✅ Cân bằng tốt | — |
| Từng mẫu một (batch = 1) | Cập nhật liên tục | Rất chậm, gradient nhiễu |

> 💡 Nhiễu trong mini-batch thực ra **có lợi** — nó giúp thoát khỏi các cực tiểu địa phương nông.

**Optimizer:**

| | Đặc điểm |
|---|---|
| **SGD** | Đơn giản, cần chỉnh lr kỹ |
| **SGD + momentum** | Nhớ hướng đi trước → mượt hơn |
| **Adam** | Tự điều chỉnh lr cho từng tham số — **mặc định nên dùng** |

Learning rate khởi điểm: **`1e-3` cho Adam**, `0.01–0.1` cho SGD.

## 6. Hàm loss — chọn đúng cái

| Bài toán | Loss | Lưu ý |
|---|---|---|
| Hồi quy | `MSELoss` / `L1Loss` | Giống MSE/MAE ở Phase 04 |
| Phân loại **nhị phân** | `BCEWithLogitsLoss` | Nhận **logits**, không nhận xác suất |
| Phân loại **nhiều lớp** | `CrossEntropyLoss` | Nhận **logits**, nhãn là số nguyên |

> ⚠️ **Bẫy lớn nhất của người mới:** `CrossEntropyLoss` **đã bao gồm softmax bên trong**. Nếu bạn thêm `nn.Softmax()` vào cuối model, bạn áp dụng softmax **hai lần** → model học rất kém mà **không báo lỗi**.
>
> **Quy tắc:** lớp cuối của model phân loại trả về **logits thô**. Chỉ dùng softmax khi cần hiển thị xác suất cho người xem.

## 7. Hàm kích hoạt

| Hàm | Công thức | Dùng khi |
|---|---|---|
| **ReLU** | `max(0, x)` | **Mặc định** cho lớp ẩn — nhanh, đơn giản |
| **GELU** | mượt hơn ReLU | Transformer, GPT |
| **Sigmoid** | `1/(1+e⁻ˣ)` | **Chỉ** lớp cuối, phân loại nhị phân |
| **Softmax** | chuẩn hoá thành xác suất | **Chỉ** khi hiển thị, không đặt trong model |
| **Tanh** | `(-1, 1)` | Ít dùng, còn thấy trong RNN cũ |

**Vì sao sigmoid không dùng cho lớp ẩn nữa?** Đạo hàm của nó tối đa chỉ 0.25. Qua 10 lớp, gradient bị nhân với `0.25¹⁰ ≈ 0.000001` → **vanishing gradient**, các lớp đầu gần như không học được gì. ReLU có đạo hàm bằng 1 ở vùng dương nên không bị.

## 8. Khởi tạo trọng số

> ⚠️ **KHÔNG BAO GIỜ khởi tạo mạng neural bằng toàn số 0.**

Nếu mọi nơ-ron trong một lớp có cùng trọng số, chúng tính ra cùng giá trị, nhận cùng gradient, và cập nhật y hệt nhau **mãi mãi**. Cả lớp 128 nơ-ron hành xử như **một** nơ-ron. Hiện tượng này gọi là *symmetry breaking problem*.

PyTorch mặc định khởi tạo hợp lý (Kaiming cho ReLU), nên bạn thường không cần làm gì. Nhưng phải **biết vì sao** — đây là câu hỏi phỏng vấn hay gặp.

> Ở Phase 04 bạn khởi tạo `w = zeros` cho hồi quy tuyến tính và không sao — vì hàm loss đó có dạng bát, chỉ có **một** đáy duy nhất.

---

# TUẦN 13 — CNN & Chống overfit

## 9. Vì sao MLP dở với ảnh?

MLP phải `flatten` ảnh 28×28 thành vector 784 chiều. Ba hậu quả:

**① Mất cấu trúc không gian.** Hai pixel cạnh nhau và hai pixel ở hai góc đối diện được đối xử **y như nhau**. Thông tin "gần nhau" biến mất.

**② Không bất biến với dịch chuyển.** Hình tròn ở góc trên trái và ở góc dưới phải là **hai mẫu hoàn toàn khác nhau** với MLP. Nó phải học riêng từng vị trí.

**③ Quá nhiều tham số.** Ảnh màu 224×224 → 150.528 đầu vào. Một lớp ẩn 1.000 nơ-ron cần **150 triệu tham số** cho riêng lớp đầu tiên.

## 10. ⭐ CNN — ba ý tưởng

**① Kết nối cục bộ.** Mỗi nơ-ron chỉ nhìn một vùng nhỏ (3×3, 5×5), không nhìn cả ảnh.

**② Chia sẻ trọng số.** Cùng một bộ lọc (kernel) trượt khắp ảnh.

```
   Ảnh 28×28              Kernel 3×3            Feature map
  ┌─────────────┐         ┌───────┐           ┌───────────┐
  │ ▓ ▓ ░ ░ ░ ░ │         │ 1 0 -1│           │           │
  │ ▓ ▓ ░ ░ ░ ░ │    ⊛    │ 1 0 -1│    ──▶    │  cạnh dọc │
  │ ▓ ▓ ░ ░ ░ ░ │         │ 1 0 -1│           │  ở đâu?   │
  └─────────────┘         └───────┘           └───────────┘
                       trượt khắp ảnh
```

Kernel này phát hiện **cạnh dọc** — và nó dùng **cùng 9 con số** ở mọi vị trí. Đó là lý do CNN bất biến với dịch chuyển: học "cạnh dọc trông thế nào" **một lần**, dùng ở mọi nơi.

**③ Phân cấp.** Lớp đầu học cạnh → lớp giữa học hình dạng → lớp sâu học vật thể.

```
lớp 1: ╱ ╲ │ ─      cạnh, góc
lớp 2: ○ □ △        hình dạng
lớp 3: 🚗 🐱 🏠      vật thể
```

### Công thức kích thước đầu ra — phải thuộc

```
     kích_thước_vào + 2×padding − kernel
out = ─────────────────────────────────── + 1
                  stride
```

Ví dụ: `28×28`, kernel 3, padding 1, stride 1 → `(28 + 2 − 3)/1 + 1 = 28` (giữ nguyên).

> 💡 **Mẹo dùng cả sự nghiệp:** `kernel=3, padding=1` giữ nguyên kích thước. `kernel=5, padding=2` cũng vậy. Công thức chung: `padding = (kernel-1)/2`.

### Pooling

`MaxPool2d(2)` giảm mỗi chiều còn một nửa, lấy giá trị lớn nhất trong mỗi ô 2×2.

**Tác dụng:** giảm kích thước → ít tham số hơn, tính nhanh hơn, và tăng nhẹ tính bất biến với dịch chuyển nhỏ.

### Kiến trúc CNN điển hình

```
Ảnh → [Conv → ReLU → Pool] → [Conv → ReLU → Pool] → Flatten → Linear → Linear → logits
        28×28 → 14×14           14×14 → 7×7
```

## 11. Chống overfit trong deep learning

Mạng neural có hàng trăm nghìn tham số — chúng **rất dễ** học thuộc lòng.

| Kỹ thuật | Cách hoạt động | Ghi chú |
|---|---|---|
| **Nhiều dữ liệu hơn** | — | Hiệu quả nhất |
| **Data augmentation** | Xoay/lật/dịch ảnh ngẫu nhiên khi train | Gần như "dữ liệu miễn phí" |
| **Dropout** | Tắt ngẫu nhiên x% nơ-ron mỗi bước | `p=0.2–0.5` |
| **Weight decay** | Phạt trọng số lớn | Chính là L2 ở Phase 04 |
| **Early stopping** | Dừng khi val loss bắt đầu tăng | Rẻ và hiệu quả |
| **Batch normalization** | Chuẩn hoá đầu ra mỗi lớp | Train nhanh và ổn định hơn |

> ⚠️ **`model.train()` và `model.eval()`** — bắt buộc phải gọi đúng lúc.
> Dropout và BatchNorm **hành xử khác nhau** khi train và khi đánh giá. Quên `model.eval()` khiến kết quả đánh giá sai lệch và dao động lung tung — một trong những bug khó tìm nhất với người mới.

### Đọc đường cong học

```
  Loss                              Loss
   │╲                                │╲
   │ ╲___ train                      │ ╲___ train
   │     ╲_____                      │     ╲______
   │  ╲___                           │  ╲___    ___╱─── val  ← BẮT ĐẦU TĂNG
   │      ╲____ val                  │      ╲__╱
   └──────────────▶ epoch            └──────────────▶ epoch
        ✅ Tốt                        ⚠️ Overfit từ đây
```

> **Luôn vẽ đường cong loss của cả train và validation.** Nó cho biết nhiều hơn bất kỳ con số đơn lẻ nào.

## 12. GPU & Google Colab

```python
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)
X, y = X.to(device), y.to(device)
```

> ⚠️ **Model và dữ liệu phải ở CÙNG một thiết bị.** Quên `.to(device)` cho một trong hai → `RuntimeError: Expected all tensors to be on the same device`. Lỗi này bạn sẽ gặp, và giờ bạn biết ngay phải sửa gì.

**GPU nhanh hơn CPU bao nhiêu?** Với CNN: **10–50 lần**. Với mạng nhỏ và batch nhỏ: đôi khi **chậm hơn** (chi phí chuyển dữ liệu lớn hơn lợi ích).

**Google Colab** — GPU miễn phí:
1. https://colab.research.google.com → Upload notebook
2. `Runtime → Change runtime type → T4 GPU`
3. Kiểm tra: `!nvidia-smi`

> 💡 Phase 05 của khoá học này chạy tốt trên **CPU** (CNN train 13 giây). Colab chỉ cần cho project P3 nếu bạn muốn dùng dataset ảnh thật.

## 13. Transfer learning

Với dữ liệu thật, hiếm khi bạn train từ đầu. Thay vào đó lấy model đã học trên hàng triệu ảnh rồi **chỉnh lại lớp cuối**:

```python
from torchvision import models

model = models.resnet18(weights="IMAGENET1K_V1")
for p in model.parameters():
    p.requires_grad = False              # đóng băng phần đã học
model.fc = nn.Linear(model.fc.in_features, so_lop)   # thay lớp cuối
```

**Vì sao hiệu quả:** các lớp đầu học cạnh và kết cấu — thứ **dùng chung** cho mọi loại ảnh. Chỉ lớp cuối cần học riêng cho bài toán của bạn.

Với 1.000 ảnh, transfer learning cho kết quả tốt hơn **rất nhiều** so với train từ đầu.

> 🔗 **Đây chính là ý tưởng nền tảng của toàn bộ ngành LLM.** Bạn không train GPT từ đầu — bạn lấy model đã pretrain rồi *prompt*, *RAG*, hoặc *fine-tune* nó. Phase 06–07 sẽ đi sâu.

---

## 📝 Thực hành

```powershell
pip install torch
python curriculum/05-deep-learning/tao_du_lieu.py

# Tuần 12
code curriculum/05-deep-learning/lessons/01_tensor_autograd.ipynb
code curriculum/05-deep-learning/lessons/02_training_loop.ipynb
code curriculum/05-deep-learning/exercises/ex01_tensor_autograd.py
code curriculum/05-deep-learning/exercises/ex02_training_loop.py

# Tuần 13
code curriculum/05-deep-learning/lessons/03_cnn.ipynb
code curriculum/05-deep-learning/lessons/04_chong_overfit_va_gpu.ipynb
code curriculum/05-deep-learning/exercises/ex03_cnn.py

pytest tests/phase05 -v
```

---

## ✅ Tự kiểm tra

1. Vì sao mạng neural cần hàm phi tuyến? Không có thì sao?
2. `optimizer.zero_grad()` để làm gì? Quên nó thì hậu quả gì?
3. Viết training loop 4 bước từ trí nhớ.
4. Vì sao **không** đặt `nn.Softmax()` ở cuối model dùng `CrossEntropyLoss`?
5. Vì sao không khởi tạo mạng neural bằng toàn số 0?
6. Kể ba lý do CNN tốt hơn MLP với ảnh.
7. Ảnh 32×32, `Conv2d(3, 16, kernel_size=5, padding=2)` rồi `MaxPool2d(2)` → shape đầu ra?
8. `model.train()` và `model.eval()` khác nhau ra sao? Quên thì sao?

📌 Đáp án đầy đủ: [`resources/interview/phase05-dl.md`](../../resources/interview/phase05-dl.md)

---

## 🎯 Project P3

Xong Tuần 13 → làm [**P3 — Image Classifier + Gradio**](../../projects/P3-image-classifier/README.md).

---

## 📌 Nộp bài

```powershell
pytest tests/phase05 -v
git add .
git commit -m "Tuan 13: hoan thanh phase 05 - deep learning"
git push
```

---

⬅️ [Phase 04](../04-classical-ml/README.md) · ➡️ [Phase 06 — NLP & Transformers](../06-nlp-transformers/README.md)
