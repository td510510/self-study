# Giáo án Tuần 27–31 — Deep Learning & Transformer

> Thuộc [lo-trinh-tu-hoc-ai-engineer.md](./lo-trinh-tu-hoc-ai-engineer.md) — Môn 8, 46h (khung gốc 36h + 10h bù cho tự học).
> Tiếp nối [giao-an-tuan-19-26.md](./giao-an-tuan-19-26.md). **Điều kiện vào:** đã vượt Cổng kiểm tra hết Phần II.

**Cấu trúc mỗi tuần:** ① Lý thuyết (2h) → ② Code ví dụ (2h) → ③ Thực hành có lời giải (2h) → ④ Đồ án tuần (3–4h).
**🎓 Đồ án môn 8:** `mini-gpt` + fine-tune LoRA kèm báo cáo so sánh fine-tune / RAG / prompt (cuối T31).

## Đọc kỹ trước khi bắt đầu

Đây là **giai đoạn dễ bỏ cuộc nhất** của cả lộ trình. Ba điều cần thống nhất trước:

1. **Mục tiêu không phải trở thành nhà nghiên cứu ML.** Mục tiêu là hiểu bên trong mô hình đủ để: chọn model có lý do, chẩn đoán khi model hỏng, quyết định fine-tune hay không, và đọc hiểu tài liệu kỹ thuật.
2. **Toán vừa đủ.** Bạn cần hiểu *nhân ma trận làm gì* và *đạo hàm dùng để làm gì*, không cần chứng minh định lý. Ở đâu cần toán, giáo án sẽ nói rõ mức tối thiểu.
3. **Không có GPU vẫn học được.** Colab free đủ cho T28–T30. Chỉ T31 (fine-tune) nên thuê GPU vài giờ (~$1–3 tổng cộng).

> Nếu tuần 30 bạn thấy quá sức: được phép làm nửa đồ án (chỉ code attention, không train hết mini-GPT) rồi đi tiếp, quay lại sau. Đừng dừng lộ trình ở đây — phần 32–36 mới là phần quyết định nghề nghiệp.

---

# TUẦN 27 — Nền tảng ML & chỉ số đánh giá (9h)

**Mục tiêu:** đọc hiểu và tự tạo được báo cáo đánh giá một mô hình phân loại; hiểu vì sao accuracy hay lừa dối.

## ① Lý thuyết (2h)

### 27.1 Ba loại bài toán bạn sẽ gặp

| Loại | Đầu ra | Ví dụ trong công việc AI Engineer |
|---|---|---|
| Phân loại | nhãn rời rạc | Định tuyến câu hỏi, lọc nội dung độc hại, phát hiện PII |
| Hồi quy | số thực | Dự đoán chi phí token, dự đoán độ trễ |
| Học không giám sát | cấu trúc ẩn | Gom cụm tài liệu, phát hiện bất thường trong log |

### 27.2 Overfitting — khái niệm quan trọng nhất

Model học thuộc dữ liệu huấn luyện thay vì học quy luật. Dấu hiệu: train tốt, validation kém. Ba cách chống: nhiều dữ liệu hơn, model đơn giản hơn, regularization (dropout, weight decay, early stopping).

**Chia dữ liệu bắt buộc:** train (huấn luyện) / validation (chọn siêu tham số) / test (chỉ chạm **một lần** cuối cùng). Chạm test nhiều lần = overfitting lên chính tập test mà không biết.

### 27.3 Vì sao accuracy lừa dối

Dữ liệu 99% âm tính, 1% dương tính. Model luôn đoán "âm tính" đạt **99% accuracy** mà hoàn toàn vô dụng.

| Chỉ số | Công thức | Trả lời câu hỏi |
|---|---|---|
| Precision | TP/(TP+FP) | Trong những cái model báo dương, bao nhiêu đúng? |
| Recall | TP/(TP+FN) | Trong những cái thật sự dương, model bắt được bao nhiêu? |
| F1 | trung bình điều hoà | Cân bằng hai cái trên |

**Chọn theo cái giá của lỗi:** lọc nội dung độc hại → ưu tiên **recall** (bỏ sót nguy hiểm hơn báo nhầm). Tự động xoá email rác → ưu tiên **precision** (xoá nhầm thư quan trọng tệ hơn). Không có chỉ số "đúng" chung — chỉ có chỉ số đúng cho ngữ cảnh.

### 27.4 Ngưỡng quyết định là siêu tham số

Model phân loại trả **xác suất**, không trả nhãn. Ngưỡng 0,5 chỉ là mặc định. Đổi ngưỡng là đổi cân bằng precision/recall mà **không cần train lại** — đây là công cụ chỉnh nhanh nhất và hay bị bỏ qua nhất.

## ② Code ví dụ (2h)

```python
import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (classification_report, confusion_matrix,
                             precision_recall_curve, roc_auc_score)

# --- 1. Chia dữ liệu ĐÚNG cách ---
X_tmp, X_test, y_tmp, y_test = train_test_split(X, y, test_size=0.2,
                                                stratify=y, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_tmp, y_tmp, test_size=0.25,
                                                  stratify=y_tmp, random_state=42)
# stratify=y giữ đúng tỉ lệ lớp trong mọi tập — bắt buộc với dữ liệu mất cân bằng

# --- 2. Pipeline: tránh rò rỉ dữ liệu ---
pipe = Pipeline([
    ("tfidf", TfidfVectorizer(max_features=20_000, ngram_range=(1, 2))),
    ("clf",   LogisticRegression(max_iter=1000, class_weight="balanced")),
])
# class_weight="balanced" phạt nặng hơn khi sai lớp hiếm
pipe.fit(X_train, y_train)

# ⚠️ Rò rỉ dữ liệu: fit vectorizer trên TOÀN BỘ dữ liệu rồi mới chia
#    → thông tin từ test lọt vào train, kết quả đẹp giả tạo.
#    Pipeline chống được vì mọi bước đều fit trong cross-validation.

# --- 3. Báo cáo đầy đủ ---
y_pred  = pipe.predict(X_val)
y_proba = pipe.predict_proba(X_val)[:, 1]

print(classification_report(y_val, y_pred, digits=3))
print(confusion_matrix(y_val, y_pred))
print("ROC-AUC:", round(roc_auc_score(y_val, y_proba), 3))

# --- 4. Chọn ngưỡng theo mục tiêu nghiệp vụ ---
prec, rec, thr = precision_recall_curve(y_val, y_proba)

def threshold_for_recall(target: float = 0.90) -> float:
    """Ngưỡng thấp nhất đạt được recall mong muốn."""
    idx = np.where(rec[:-1] >= target)[0]
    return float(thr[idx[-1]]) if len(idx) else 0.5

t = threshold_for_recall(0.90)
y_pred_t = (y_proba >= t).astype(int)
print(f"Ngưỡng {t:.3f}: precision={prec[np.argmin(np.abs(thr-t))]:.3f}, recall≥0.90")

# --- 5. Cross-validation: một lần chia có thể may rủi ---
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(pipe, X_tmp, y_tmp, cv=cv, scoring="f1")
print(f"F1: {scores.mean():.3f} ± {scores.std():.3f}")     # LUÔN báo cáo cả độ lệch
```

## ③ Thực hành (2h) — 4 bài

### Bài 27.1 — Vạch trần accuracy
Dữ liệu 1000 mẫu, 990 âm / 10 dương. Viết `DummyClassifier` luôn đoán âm. Tính accuracy, precision, recall, F1. Rút ra kết luận.

<details><summary>Lời giải</summary>

```python
from sklearn.dummy import DummyClassifier
dummy = DummyClassifier(strategy="most_frequent").fit(X_train, y_train)
print(classification_report(y_val, dummy.predict(X_val), zero_division=0))
# accuracy 0.99 · precision 0.00 · recall 0.00 · F1 0.00 cho lớp dương
```
Kết luận: accuracy 99% mà giá trị bằng 0. **Luôn so model của bạn với baseline ngu ngốc** — nếu không hơn `DummyClassifier` thì model chưa học được gì. Đây là bước đầu tiên trong mọi dự án ML nghiêm túc.
</details>

### Bài 27.2 — Đọc confusion matrix
Cho ma trận `[[850, 50], [30, 70]]` (hàng = thật, cột = dự đoán). Tính đủ 4 chỉ số và trả lời: nếu đây là bộ lọc nội dung độc hại, vấn đề lớn nhất là gì?

<details><summary>Lời giải</summary>

TN=850, FP=50, FN=30, TP=70.
- accuracy = 920/1000 = 0,92
- precision = 70/120 = **0,583**
- recall = 70/100 = **0,700**
- F1 = 2·0,583·0,7/(0,583+0,7) = **0,636**

Vấn đề lớn nhất: **FN = 30** — bỏ lọt 30% nội dung độc hại. Với bộ lọc an toàn, đây là lỗi đắt hơn nhiều so với FP=50 (báo nhầm, chỉ gây phiền). Hướng xử lý: **hạ ngưỡng** để tăng recall, chấp nhận precision giảm; và thêm một tầng xét duyệt cho các ca ở vùng biên.
</details>

### Bài 27.3 — Phát hiện rò rỉ dữ liệu
```python
vectorizer = TfidfVectorizer().fit(all_texts)      # toàn bộ dữ liệu
X = vectorizer.transform(all_texts)
X_train, X_test, y_train, y_test = train_test_split(X, y)
```
Chỉ ra lỗi và giải thích vì sao kết quả sẽ đẹp giả tạo.

<details><summary>Lời giải</summary>

`fit` trên toàn bộ dữ liệu → từ vựng và IDF được tính từ cả tập test → thông tin từ test rò vào quá trình huấn luyện. Kết quả trên test cao hơn thực tế, và khi ra production sẽ tụt.

Sửa: chia trước, `fit` chỉ trên train, `transform` cho val/test. Dùng `Pipeline` là cách chắc chắn nhất vì cross-validation sẽ tự động fit lại đúng cách trong mỗi fold.

Các dạng rò rỉ khác cần biết: chuẩn hoá số liệu trên toàn bộ dữ liệu; dữ liệu theo thời gian mà chia ngẫu nhiên (dùng dữ liệu tương lai để dự đoán quá khứ); có bản ghi trùng nằm ở cả train lẫn test.
</details>

### Bài 27.4 — Chọn ngưỡng theo chi phí
Bộ lọc PII: bỏ sót PII tốn 100 đơn vị chi phí, báo nhầm tốn 1 đơn vị. Viết hàm tìm ngưỡng tối ưu hoá tổng chi phí.

<details><summary>Lời giải</summary>

```python
def optimal_threshold(y_true, y_proba, cost_fn: float = 100, cost_fp: float = 1) -> tuple[float, float]:
    best = (0.5, float("inf"))
    for t in np.linspace(0.01, 0.99, 99):
        pred = (y_proba >= t).astype(int)
        fp = int(((pred == 1) & (y_true == 0)).sum())
        fn = int(((pred == 0) & (y_true == 1)).sum())
        cost = fp * cost_fp + fn * cost_fn
        if cost < best[1]:
            best = (float(t), cost)
    return best
```
Với tỉ lệ chi phí 100:1, ngưỡng tối ưu thường rơi vào 0,1–0,2 — thấp hơn nhiều so với mặc định 0,5. **Đây là cách đúng để chọn ngưỡng: từ chi phí nghiệp vụ, không phải từ F1.**
</details>

## ④ Đồ án tuần 27 (3h) — bộ phân loại có báo cáo

Gợi ý bài toán gắn với lộ trình: phân loại câu hỏi người dùng (`tra_cuu`/`so_sanh`/`ngoai_pham_vi`) từ log RAG bot của bạn — dữ liệu thật, dùng được ngay.

**Checklist nghiệm thu:**
- [ ] Dữ liệu mất cân bằng thật (hoặc tạo mất cân bằng có chủ đích), chia train/val/test đúng cách.
- [ ] So sánh với `DummyClassifier` — chứng minh model thật sự học được gì.
- [ ] Báo cáo: classification_report, confusion matrix, ROC-AUC, cross-validation ± độ lệch.
- [ ] **Chọn ngưỡng theo chi phí nghiệp vụ**, giải thích lựa chọn.
- [ ] Biểu đồ precision-recall curve.
- [ ] README: nêu rõ chỉ số nào quan trọng nhất với bài toán này và vì sao.

---

# TUẦN 28 — PyTorch từ gốc (10h)

**Mục tiêu:** tự viết training loop, hiểu autograd, train được mạng neural đầu tiên.

## ① Lý thuyết (2h)

### 28.1 Ba khái niệm là toàn bộ deep learning

1. **Tensor** — mảng nhiều chiều chạy được trên GPU. Giống numpy array nhưng nhớ được lịch sử phép tính.
2. **Autograd** — PyTorch tự tính đạo hàm. Bạn viết phép tính xuôi, nó tự suy ra đạo hàm ngược.
3. **Optimizer** — dùng đạo hàm để cập nhật tham số theo hướng giảm loss.

Toàn bộ deep learning là vòng lặp: **dự đoán → tính sai số → tính đạo hàm → cập nhật tham số**. Lặp vài nghìn lần.

### 28.2 Toán tối thiểu cần hiểu

- **Nhân ma trận** `y = xW + b`: biến đổi tuyến tính từ không gian này sang không gian khác.
- **Hàm kích hoạt** (ReLU): thêm tính phi tuyến. Không có nó, chồng bao nhiêu lớp cũng chỉ tương đương một lớp.
- **Đạo hàm**: cho biết "nếu tăng tham số này một chút thì loss thay đổi bao nhiêu và theo chiều nào".
- **Gradient descent**: đi ngược hướng đạo hàm để giảm loss. `learning rate` là độ dài bước đi.

Chỉ cần hiểu đến mức này. Không cần tự tính đạo hàm bằng tay.

### 28.3 Bộ khung training loop

```
for mỗi epoch:
    for mỗi batch:
        optimizer.zero_grad()      # xoá đạo hàm cũ  ← QUÊN BƯỚC NÀY LÀ BUG PHỔ BIẾN NHẤT
        pred = model(x)            # xuôi
        loss = criterion(pred, y)  # tính sai số
        loss.backward()            # ngược: tính đạo hàm
        optimizer.step()           # cập nhật tham số
    đánh giá trên validation
```

### 28.4 Đọc đường loss — kỹ năng chẩn đoán quan trọng nhất

| Hình dạng | Chẩn đoán | Xử lý |
|---|---|---|
| Train giảm, val giảm rồi tăng | Overfitting | Early stopping, dropout, thêm dữ liệu |
| Cả hai đều cao, không giảm | Underfitting / learning rate quá nhỏ | Model lớn hơn, tăng LR, train lâu hơn |
| Loss dao động dữ dội | Learning rate quá lớn | Giảm LR, tăng batch size |
| Loss = NaN | Bùng nổ gradient / chia 0 | Gradient clipping, giảm LR, kiểm tra dữ liệu |
| Loss đứng im ngay từ đầu | Quên `zero_grad`, LR = 0, dữ liệu sai nhãn | Kiểm tra từng thứ |

## ② Code ví dụ (2h)

```python
import torch, torch.nn as nn
from torch.utils.data import Dataset, DataLoader

device = "cuda" if torch.cuda.is_available() else "cpu"

# --- 1. Autograd: hiểu bằng ví dụ nhỏ nhất ---
x = torch.tensor([2.0], requires_grad=True)
y = x ** 2 + 3 * x                # y = x² + 3x  →  dy/dx = 2x + 3 = 7
y.backward()
print(x.grad)                      # tensor([7.]) — PyTorch tự tính

# --- 2. Dataset & DataLoader ---
class TextDataset(Dataset):
    def __init__(self, texts: list[str], labels: list[int], vectorizer):
        self.X = torch.tensor(vectorizer.transform(texts).toarray(), dtype=torch.float32)
        self.y = torch.tensor(labels, dtype=torch.long)
    def __len__(self): return len(self.y)
    def __getitem__(self, i): return self.X[i], self.y[i]

train_dl = DataLoader(TextDataset(...), batch_size=64, shuffle=True)
val_dl   = DataLoader(TextDataset(...), batch_size=128)     # val KHÔNG shuffle

# --- 3. Model ---
class MLP(nn.Module):
    def __init__(self, in_dim: int, hidden: int, n_classes: int, p_drop: float = 0.3):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden), nn.ReLU(), nn.Dropout(p_drop),
            nn.Linear(hidden, hidden // 2), nn.ReLU(), nn.Dropout(p_drop),
            nn.Linear(hidden // 2, n_classes),
        )
    def forward(self, x): return self.net(x)     # KHÔNG softmax ở đây

model = MLP(in_dim=20_000, hidden=256, n_classes=3).to(device)
print(f"Tham số: {sum(p.numel() for p in model.parameters()):,}")

# --- 4. Training loop đầy đủ ---
criterion = nn.CrossEntropyLoss()          # đã bao gồm softmax bên trong
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=2)

def train_epoch() -> float:
    model.train()                          # bật dropout
    total = 0.0
    for xb, yb in train_dl:
        xb, yb = xb.to(device), yb.to(device)
        optimizer.zero_grad()              # ← QUAN TRỌNG NHẤT
        loss = criterion(model(xb), yb)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)   # chống bùng nổ gradient
        optimizer.step()
        total += loss.item() * len(yb)
    return total / len(train_dl.dataset)

@torch.no_grad()                           # tắt autograd → nhanh hơn, ít RAM hơn
def evaluate() -> tuple[float, float]:
    model.eval()                           # tắt dropout
    total, correct = 0.0, 0
    for xb, yb in val_dl:
        xb, yb = xb.to(device), yb.to(device)
        out = model(xb)
        total += criterion(out, yb).item() * len(yb)
        correct += (out.argmax(1) == yb).sum().item()
    return total / len(val_dl.dataset), correct / len(val_dl.dataset)

# --- 5. Vòng huấn luyện có early stopping ---
history, best_val, patience, bad = [], float("inf"), 5, 0
for epoch in range(50):
    tr = train_epoch()
    va, acc = evaluate()
    scheduler.step(va)
    history.append({"epoch": epoch, "train": tr, "val": va, "acc": acc})
    print(f"epoch {epoch:2d} | train {tr:.4f} | val {va:.4f} | acc {acc:.3f}")

    if va < best_val - 1e-4:
        best_val, bad = va, 0
        torch.save({"model": model.state_dict(), "epoch": epoch}, "best.pt")
    else:
        bad += 1
        if bad >= patience:
            print(f"Early stopping tại epoch {epoch}")
            break

# --- 6. Vẽ đường loss ---
import matplotlib.pyplot as plt
h = pd.DataFrame(history)
plt.plot(h.epoch, h.train, label="train"); plt.plot(h.epoch, h.val, label="val")
plt.xlabel("epoch"); plt.ylabel("loss"); plt.legend(); plt.savefig("loss.png", dpi=120)
```

## ③ Thực hành (2h) — 4 bài

### Bài 28.1 — Kiểm chứng autograd bằng tay
Cho `z = (x*y + x**2).sum()` với `x=[1,2], y=[3,4]`. Tính `dz/dx` bằng tay rồi kiểm chứng.

<details><summary>Lời giải</summary>

dz/dx = y + 2x = [3+2, 4+4] = **[5, 8]**

```python
x = torch.tensor([1., 2.], requires_grad=True)
y = torch.tensor([3., 4.])
z = (x * y + x ** 2).sum()
z.backward()
assert torch.allclose(x.grad, torch.tensor([5., 8.]))
```
Làm bài này một lần để tin rằng autograd không phải phép màu — nó chỉ áp dụng quy tắc chuỗi một cách máy móc.
</details>

### Bài 28.2 — Tìm 4 bug trong training loop
```python
for epoch in range(10):
    for xb, yb in train_dl:
        loss = criterion(model(xb), yb)
        loss.backward()
        optimizer.step()
    print(evaluate())
```

<details><summary>Lời giải</summary>

1. **Thiếu `optimizer.zero_grad()`** — đạo hàm cộng dồn qua các batch, model học sai hoàn toàn. Bug phổ biến nhất của PyTorch.
2. **Thiếu `model.train()` / `model.eval()`** — dropout và batchnorm hành xử sai ở giai đoạn đánh giá.
3. **Không đưa dữ liệu lên device** — lỗi nếu model ở GPU còn dữ liệu ở CPU.
4. **`evaluate()` không có `torch.no_grad()`** — tốn RAM vô ích, chậm, và có nguy cơ OOM.

Bonus: không lưu checkpoint → train xong mất sạch.
</details>

### Bài 28.3 — Chẩn đoán qua đường loss
Cho 4 hình dạng đường loss: (a) train↓ val↓ rồi val↑; (b) cả hai đứng im ở mức cao; (c) loss zigzag mạnh; (d) loss thành NaN ở epoch 3. Chẩn đoán và nêu cách xử lý từng cái.

<details><summary>Lời giải</summary>

(a) **Overfitting** → early stopping (đã có), tăng dropout, thêm dữ liệu/augmentation, giảm kích thước model.
(b) **Underfitting hoặc LR quá nhỏ** → tăng LR (thử ×10), model lớn hơn, train lâu hơn. Kiểm tra thêm: nhãn có đúng không, dữ liệu có chuẩn hoá không.
(c) **LR quá lớn** → giảm LR, tăng batch size, dùng warmup.
(d) **Bùng nổ gradient hoặc dữ liệu bẩn** → `clip_grad_norm_`, giảm LR, kiểm tra NaN/inf trong đầu vào (`torch.isnan(x).any()`).

Mẹo chẩn đoán nhanh nhất: **thử overfit cố ý trên 10 mẫu**. Nếu model không đạt loss ≈0 trên 10 mẫu thì có bug trong code, không phải vấn đề dữ liệu hay siêu tham số.
</details>

### Bài 28.4 — Thí nghiệm learning rate
Train cùng model với LR = 1e-5, 1e-3, 1e-1. Vẽ 3 đường loss trên cùng biểu đồ, mô tả từng đường.

<details><summary>Lời giải — kết quả điển hình</summary>

- `1e-5`: giảm rất chậm, sau 20 epoch vẫn chưa hội tụ → tốn thời gian vô ích.
- `1e-3`: giảm mượt, hội tụ tốt → thường là điểm khởi đầu hợp lý cho AdamW.
- `1e-1`: dao động dữ dội hoặc thành NaN → bước đi quá dài, nhảy qua điểm tối ưu.

Kết luận: **learning rate là siêu tham số quan trọng nhất.** Nếu chỉ được chỉnh một thứ, chỉnh nó. Điểm khởi đầu chuẩn: AdamW 1e-3 cho model nhỏ, 1e-4 đến 5e-5 khi fine-tune model lớn.
</details>

## ④ Đồ án tuần 28 (4h) — mạng neural đầu tiên

**Checklist nghiệm thu:**
- [ ] Train MLP trên MNIST/Fashion-MNIST (hoặc bộ phân loại text của T27), đạt >90%.
- [ ] Training loop **tự viết**, không dùng thư viện huấn luyện đóng gói sẵn.
- [ ] Có: early stopping, lưu checkpoint tốt nhất, gradient clipping, LR scheduler.
- [ ] Biểu đồ loss train/val, chẩn đoán bằng lời hình dạng đường loss.
- [ ] Thí nghiệm 3 mức learning rate, biểu đồ so sánh.
- [ ] **Bài kiểm tra tỉnh táo**: chứng minh model overfit được 10 mẫu tới loss ≈0 (nếu không thì code có bug).
- [ ] Chạy được cả trên CPU và GPU (`device` linh hoạt).

---

# TUẦN 29 — CNN & Transfer Learning (9h)

**Mục tiêu:** dùng được model đã huấn luyện sẵn cho bài toán riêng — kỹ năng thực dụng nhất của tuần này.

## ① Lý thuyết (2h)

### 29.1 CNN: ý tưởng cốt lõi trong ba câu

1. **Convolution**: cùng một bộ lọc nhỏ trượt khắp ảnh → phát hiện đặc trưng (cạnh, góc, hoa văn) ở bất kỳ vị trí nào, và **chia sẻ tham số** nên ít tham số hơn nhiều so với fully-connected.
2. **Pooling**: thu nhỏ kích thước, giữ đặc trưng mạnh nhất → bất biến với dịch chuyển nhỏ.
3. **Xếp chồng nhiều lớp**: lớp đầu học cạnh, lớp giữa học hình dạng, lớp cuối học khái niệm.

### 29.2 Transfer learning — vì sao gần như luôn nên dùng

Model đã học trên hàng triệu ảnh đã biết cách "nhìn". Bạn chỉ cần dạy lại phần *phân loại*. Kết quả: **500 ảnh của bạn đạt kết quả tốt hơn 50.000 ảnh train from scratch**, và nhanh hơn hàng chục lần.

| Chiến lược | Cách làm | Khi dùng |
|---|---|---|
| **Feature extraction** | Đóng băng toàn bộ backbone, chỉ train lớp cuối | Dữ liệu ít (<1.000), miền giống dữ liệu gốc |
| **Fine-tune một phần** | Đóng băng lớp đầu, train vài lớp cuối | Dữ liệu vừa, miền hơi khác |
| **Fine-tune toàn bộ** | Train tất cả với LR nhỏ | Dữ liệu nhiều, miền khác hẳn |

> Quy tắc LR khi fine-tune: dùng LR **nhỏ hơn 10–100 lần** so với train from scratch. LR lớn sẽ phá hỏng những gì model đã học ("catastrophic forgetting").

### 29.3 Data augmentation

Tạo biến thể từ dữ liệu có sẵn (lật, xoay, đổi màu, cắt ngẫu nhiên) → tăng dữ liệu miễn phí, giảm overfitting. **Chỉ áp dụng cho tập train, không cho val/test.** Và phải hợp lý về ngữ nghĩa: lật ngang ảnh mèo vẫn là mèo, nhưng lật ngang chữ "b" thành "d".

### 29.4 RNN/LSTM — cần biết ở mức nào

Xử lý chuỗi tuần tự, có bộ nhớ ngắn hạn. Hai hạn chế dẫn tới sự ra đời của Transformer: (1) **không song song hoá được** — phải xử lý từng bước một; (2) **quên thông tin xa** dù có LSTM.

Chỉ cần hiểu đến đây để thấy Transformer giải quyết gì. Không cần cài đặt LSTM.

## ② Code ví dụ (2h)

```python
import torch, torch.nn as nn
from torchvision import datasets, transforms, models

# --- 1. Augmentation: train khác val ---
train_tf = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),  # chuẩn ImageNet
])
val_tf = transforms.Compose([                    # KHÔNG augment
    transforms.Resize(256), transforms.CenterCrop(224), transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

train_ds = datasets.ImageFolder("data/train", transform=train_tf)
val_ds   = datasets.ImageFolder("data/val",   transform=val_tf)

# --- 2. Feature extraction: đóng băng backbone ---
model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
for p in model.parameters():
    p.requires_grad = False                      # đóng băng tất cả
model.fc = nn.Linear(model.fc.in_features, len(train_ds.classes))   # lớp mới, mặc định train được
model = model.to(device)

trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total     = sum(p.numel() for p in model.parameters())
print(f"Train {trainable:,}/{total:,} tham số ({trainable/total:.2%})")

optimizer = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)

# --- 3. Fine-tune một phần: mở khoá layer4 với LR nhỏ hơn ---
for p in model.layer4.parameters():
    p.requires_grad = True

optimizer = torch.optim.AdamW([
    {"params": model.fc.parameters(),     "lr": 1e-3},
    {"params": model.layer4.parameters(), "lr": 1e-4},     # nhỏ hơn 10 lần
], weight_decay=0.01)

# --- 4. CNN tự viết (để hiểu bên trong) ---
class SmallCNN(nn.Module):
    def __init__(self, n_classes: int):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),                     # ra 128×1×1 bất kể kích thước đầu vào
        )
        self.classifier = nn.Linear(128, n_classes)
    def forward(self, x):
        return self.classifier(self.features(x).flatten(1))

# --- 5. Xem model "nhìn" vào đâu (Grad-CAM đơn giản hoá) ---
activations = {}
model.layer4.register_forward_hook(lambda m, i, o: activations.update(feat=o.detach()))
_ = model(img.unsqueeze(0).to(device))
heatmap = activations["feat"].mean(dim=1).squeeze().cpu()      # trung bình theo kênh
```

## ③ Thực hành (2h) — 4 bài

### Bài 29.1 — Đếm tham số
So sánh số tham số: fully-connected cho ảnh 224×224×3 → 1000 lớp, và ResNet18. Giải thích chênh lệch.

<details><summary>Lời giải</summary>

Fully-connected một lớp: 224·224·3 · 1000 ≈ **150 triệu** tham số — chỉ cho **một** lớp.
ResNet18 toàn bộ: ≈ **11,7 triệu** tham số, với 18 lớp sâu.

Lý do: convolution **chia sẻ tham số** — cùng bộ lọc 3×3 (9 tham số/kênh) trượt khắp ảnh, thay vì mỗi pixel một trọng số riêng. Đây chính là lý do CNN thắng fully-connected trên ảnh: ít tham số hơn, khái quát hoá tốt hơn, và tận dụng được tính cục bộ của ảnh.
</details>

### Bài 29.2 — Transfer vs from scratch
Với 500 ảnh chia 5 lớp, train hai bản: ResNet18 pretrained (feature extraction) và `SmallCNN` from scratch. So accuracy, thời gian, đường loss.

<details><summary>Lời giải — kết quả điển hình</summary>

| | From scratch | Transfer learning |
|---|---|---|
| Accuracy sau 20 epoch | 45–60% | 85–95% |
| Thời gian tới hội tụ | 20+ epoch | 3–5 epoch |
| Overfitting | nặng (500 ảnh quá ít) | nhẹ hơn nhiều |

Kết luận thực dụng: **với dữ liệu ít, transfer learning không phải lựa chọn tốt hơn — nó là lựa chọn duy nhất khả thi.** Điều này đúng cả với NLP (T31: fine-tune LLM có sẵn thay vì train từ đầu).
</details>

### Bài 29.3 — Augmentation sai ngữ nghĩa
Nêu 3 trường hợp augmentation làm hỏng nhãn, và cách chọn augmentation đúng cho một bài toán.

<details><summary>Lời giải</summary>

1. **Lật ngang** ảnh chữ số/chữ cái → "b" thành "d", nhãn sai.
2. **Xoay 180°** ảnh X-quang → mất ý nghĩa giải phẫu, model học sai.
3. **ColorJitter mạnh** trên bài toán phân loại theo màu (quả chín/xanh) → phá chính đặc trưng cần học.

Nguyên tắc chọn: augmentation phải mô phỏng **biến thiên thật sẽ gặp lúc suy luận**. Ảnh chụp bằng điện thoại thì có sáng/tối, hơi nghiêng, hơi mờ → augment đúng những thứ đó. Đừng augment thứ không bao giờ xảy ra trong thực tế.
</details>

### Bài 29.4 — Phân tích lỗi bằng hình
Lấy 10 ảnh model đoán sai, xem chúng có điểm chung gì, đề xuất cách chữa.

<details><summary>Lời giải — khung phân tích</summary>

```python
model.eval()
wrong = []
with torch.no_grad():
    for xb, yb in val_dl:
        pred = model(xb.to(device)).argmax(1).cpu()
        for i in (pred != yb).nonzero().flatten():
            wrong.append((xb[i], yb[i].item(), pred[i].item()))
```
Ba nhóm nguyên nhân thường gặp: **nhãn sai trong dữ liệu** (thường chiếm 20–30% số ca sai — sửa nhãn có lợi hơn sửa model); **hai lớp thật sự giống nhau** (cần thêm dữ liệu hoặc gộp lớp); **điều kiện chụp bất thường** (thiếu sáng, che khuất → thêm augmentation tương ứng).

Nhóm đầu tiên là bài học lớn: **nhiều khi vấn đề nằm ở dữ liệu, không phải model.** Đây là lý do Tuần 7–9 quan trọng.
</details>

## ④ Đồ án tuần 29 (3h) — phân loại ảnh tự thu

**Checklist nghiệm thu:**
- [ ] Tập ảnh **tự thu** ~500 ảnh, 5 lớp (chụp bằng điện thoại là được).
- [ ] So sánh 3 chiến lược: from scratch, feature extraction, fine-tune một phần.
- [ ] Bảng: accuracy, thời gian train, số tham số train được, dấu hiệu overfitting.
- [ ] Augmentation phù hợp ngữ nghĩa, giải thích lựa chọn.
- [ ] Phân tích 10 ảnh đoán sai, phân loại nguyên nhân.
- [ ] Confusion matrix chỉ ra hai lớp hay bị nhầm nhất.

---

# TUẦN 30 — Transformer ⭐ (10h)

**Mục tiêu:** hiểu attention đủ sâu để **tự cài đặt được**, và tự train một GPT nhỏ sinh được tiếng Việt.

## ① Lý thuyết (2h)

### 30.1 Vấn đề Transformer giải quyết

RNN xử lý tuần tự → không song song hoá được, và quên thông tin xa. Transformer bỏ hoàn toàn tính tuần tự: **mọi vị trí nhìn thấy mọi vị trí cùng lúc**, nên train song song được trên GPU — đây mới là lý do thật sự khiến LLM khả thi, chứ không chỉ vì chất lượng.

### 30.2 Self-attention: giải thích bằng ẩn dụ tra cứu

Mỗi token sinh ra ba vector:
- **Query (Q)** — "tôi đang tìm thông tin gì?"
- **Key (K)** — "tôi chứa thông tin gì?"
- **Value (V)** — "nội dung thực sự của tôi"

Công thức: `Attention(Q,K,V) = softmax(QKᵀ/√d_k)·V`

Đọc từng phần:
1. `QKᵀ` — mỗi token hỏi mọi token khác "bạn có liên quan đến tôi không?" → ma trận điểm số.
2. `/√d_k` — chia để điểm số không quá lớn (softmax sẽ bão hoà, gradient biến mất).
3. `softmax` — biến điểm số thành trọng số cộng lại bằng 1.
4. `·V` — lấy trung bình có trọng số nội dung các token.

**Kết quả:** mỗi token trở thành hỗn hợp của những token liên quan tới nó. Trong câu "Con mèo ngồi trên thảm vì **nó** mềm", token "nó" sẽ có trọng số cao với "thảm".

### 30.3 Bốn thành phần còn lại

| Thành phần | Làm gì | Vì sao cần |
|---|---|---|
| **Multi-head** | Chạy attention nhiều lần song song với các phép chiếu khác nhau | Mỗi "đầu" học một kiểu quan hệ (ngữ pháp, ngữ nghĩa, vị trí) |
| **Positional encoding** | Cộng thông tin vị trí vào embedding | Attention không có khái niệm thứ tự — không có nó thì "chó cắn người" = "người cắn chó" |
| **Residual + LayerNorm** | `x + f(x)`, chuẩn hoá | Cho phép xếp chồng hàng chục lớp mà gradient không biến mất |
| **Feed-forward** | MLP áp dụng cho từng vị trí | Chứa phần lớn tham số; nơi "lưu kiến thức" |

### 30.4 Ba biến thể kiến trúc

| Kiến trúc | Attention | Ví dụ | Dùng cho |
|---|---|---|---|
| **Encoder-only** | Hai chiều (nhìn cả trước lẫn sau) | BERT, **model embedding bạn dùng ở T10** | Phân loại, embedding, hiểu văn bản |
| **Decoder-only** | Một chiều, có mask (chỉ nhìn về trước) | GPT, Claude, Llama | Sinh văn bản |
| **Encoder-decoder** | Cả hai | T5, model dịch | Dịch, tóm tắt |

**Causal mask** trong decoder là chi tiết then chốt: token vị trí `i` chỉ được nhìn `≤ i`. Không có mask thì model "nhìn trộm" đáp án khi train và vô dụng khi sinh.

## ② Code ví dụ (2h)

```python
import torch, torch.nn as nn, torch.nn.functional as F, math

# --- 1. Attention thô: hiểu bằng ma trận nhỏ ---
def attention(Q, K, V, mask=None):
    d_k = Q.size(-1)
    scores = Q @ K.transpose(-2, -1) / math.sqrt(d_k)      # (B, T, T)
    if mask is not None:
        scores = scores.masked_fill(mask == 0, float("-inf"))
    weights = F.softmax(scores, dim=-1)
    return weights @ V, weights

# Thử tay để thấy nó làm gì
Q = K = V = torch.eye(3).unsqueeze(0)          # 3 token trực giao
out, w = attention(Q, K, V)
print(w[0].round(decimals=2))                  # mỗi token chú ý chính nó nhiều nhất

# --- 2. Multi-head attention có causal mask ---
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0
        self.n_heads, self.d_k = n_heads, d_model // n_heads
        self.qkv  = nn.Linear(d_model, 3 * d_model, bias=False)
        self.proj = nn.Linear(d_model, d_model)
        self.drop = nn.Dropout(dropout)

    def forward(self, x, causal: bool = True):
        B, T, C = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        # tách thành nhiều đầu: (B, T, C) → (B, n_heads, T, d_k)
        q, k, v = (t.view(B, T, self.n_heads, self.d_k).transpose(1, 2) for t in (q, k, v))

        out = F.scaled_dot_product_attention(q, k, v, is_causal=causal,
                                             dropout_p=self.drop.p if self.training else 0.0)
        out = out.transpose(1, 2).contiguous().view(B, T, C)     # gộp các đầu lại
        return self.drop(self.proj(out))

# --- 3. Một khối Transformer (pre-norm, như GPT hiện đại) ---
class Block(nn.Module):
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        self.ln1, self.ln2 = nn.LayerNorm(d_model), nn.LayerNorm(d_model)
        self.attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, 4 * d_model), nn.GELU(),
            nn.Linear(4 * d_model, d_model), nn.Dropout(dropout))

    def forward(self, x):
        x = x + self.attn(self.ln1(x))       # residual: cộng vào, không thay thế
        x = x + self.ffn(self.ln2(x))
        return x

# --- 4. Mini-GPT hoàn chỉnh ---
class MiniGPT(nn.Module):
    def __init__(self, vocab_size: int, d_model: int = 256, n_heads: int = 8,
                 n_layers: int = 6, block_size: int = 256, dropout: float = 0.1):
        super().__init__()
        self.block_size = block_size
        self.tok_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(block_size, d_model)      # positional học được
        self.blocks  = nn.ModuleList([Block(d_model, n_heads, dropout) for _ in range(n_layers)])
        self.ln_f    = nn.LayerNorm(d_model)
        self.head    = nn.Linear(d_model, vocab_size, bias=False)
        self.head.weight = self.tok_emb.weight                # weight tying: giảm tham số

    def forward(self, idx, targets=None):
        B, T = idx.shape
        pos = torch.arange(T, device=idx.device)
        x = self.tok_emb(idx) + self.pos_emb(pos)
        for b in self.blocks:
            x = b(x)
        logits = self.head(self.ln_f(x))
        if targets is None:
            return logits, None
        loss = F.cross_entropy(logits.view(-1, logits.size(-1)), targets.view(-1))
        return logits, loss

    @torch.no_grad()
    def generate(self, idx, max_new_tokens: int, temperature: float = 1.0, top_k: int | None = 50):
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.block_size:]              # cắt theo context window
            logits, _ = self(idx_cond)
            logits = logits[:, -1, :] / temperature            # chỉ lấy token cuối
            if top_k is not None:
                v, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                logits[logits < v[:, [-1]]] = float("-inf")
            idx_next = torch.multinomial(F.softmax(logits, dim=-1), num_samples=1)
            idx = torch.cat([idx, idx_next], dim=1)
        return idx

# --- 5. Tokenizer ký tự (đơn giản nhất, đủ để học) ---
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda l: "".join(itos[i] for i in l)
```

## ③ Thực hành (2h) — 4 bài

### Bài 30.1 — Tính attention bằng tay
Cho 3 token, `d_k=2`, `Q=K=V=[[1,0],[0,1],[1,1]]`. Tính `QKᵀ/√2`, softmax và kết quả. Kiểm chứng bằng code.

<details><summary>Lời giải</summary>

`QKᵀ = [[1,0,1],[0,1,1],[1,1,2]]`, chia `√2 ≈ 1,414` → `[[0.71,0,0.71],[0,0.71,0.71],[0.71,0.71,1.41]]`.

Softmax hàng 1: `exp(0.71)=2.03, exp(0)=1, exp(0.71)=2.03` → tổng 5.06 → `[0.40, 0.20, 0.40]`.

```python
Q = K = V = torch.tensor([[1.,0.],[0.,1.],[1.,1.]]).unsqueeze(0)
out, w = attention(Q, K, V)
print(w[0].round(decimals=2))     # [[0.40,0.20,0.40], ...]
```
Nhận xét đáng nhớ: token 3 (`[1,1]`) nhận trọng số cao từ mọi token vì nó "giống" cả hai — attention chính là **đo độ tương đồng bằng tích vô hướng**, đúng như cosine similarity ở T6.
</details>

### Bài 30.2 — Chứng minh causal mask cần thiết
Train mini-GPT hai lần: có mask và không mask. So loss và chất lượng sinh.

<details><summary>Lời giải</summary>

Không mask: loss train **giảm rất nhanh xuống gần 0** — vì model nhìn thấy token tiếp theo trong đầu vào, chỉ việc "chép". Nhưng khi sinh (không có token tương lai) thì tạo ra rác.

Có mask: loss giảm chậm hơn, dừng ở mức cao hơn, nhưng sinh ra văn bản có nghĩa.

Bài học tổng quát vượt ngoài Transformer: **loss thấp bất thường luôn đáng nghi.** Trước khi mừng, hãy kiểm tra xem model có đang nhìn trộm đáp án không — đây chính là dạng rò rỉ dữ liệu ở bài 27.3.
</details>

### Bài 30.3 — Positional encoding
Bỏ `pos_emb`, train lại, so sánh. Vì sao chất lượng tụt?

<details><summary>Lời giải</summary>

Không có positional encoding, self-attention là **hoán vị bất biến** — đảo thứ tự token cho ra cùng kết quả. Model không phân biệt được "chó cắn người" với "người cắn chó".

Thực nghiệm: loss dừng ở mức cao hơn rõ rệt, văn bản sinh ra thành túi từ không có cấu trúc câu.

Ba cách mã hoá vị trí, biết để đọc tài liệu: **học được** (như code trên, đơn giản, giới hạn độ dài); **sin/cos** (bài báo gốc, ngoại suy được ra ngoài độ dài đã train); **RoPE** (xoay vector Q/K theo vị trí — chuẩn của hầu hết LLM hiện đại).
</details>

### Bài 30.4 — Ảnh hưởng của temperature và top-k
Sinh 5 mẫu với `temperature` = 0,2 / 0,8 / 1,5 và `top_k` = 1 / 50 / None. Mô tả khác biệt.

<details><summary>Lời giải</summary>

- `temperature=0.2`: rất bảo thủ, lặp từ, thường kẹt vòng lặp ("và và và").
- `temperature=0.8`: cân bằng — mặc định tốt cho sinh văn bản.
- `temperature=1.5`: sáng tạo tới mức mất mạch lạc, sinh từ vô nghĩa.
- `top_k=1`: greedy decoding, hoàn toàn tất định, dễ lặp.
- `top_k=50`: lọc bỏ đuôi xác suất thấp — ngăn model chọn nhầm token rất kỳ quặc.

Nối lại với T11: đây chính là các tham số bạn chỉnh khi gọi LLM API. Giờ bạn biết chúng làm gì **bên trong** — và vì sao `temperature=0` cho RAG là lựa chọn đúng.
</details>

## ④ Đồ án tuần 30 (4h) — `mini-gpt` tiếng Việt

**Checklist nghiệm thu:**
- [ ] `MiniGPT` **tự cài đặt**, ~5–15M tham số, không dùng `nn.Transformer` đóng gói sẵn.
- [ ] Train trên văn bản tiếng Việt (truyện, thơ, tài liệu bạn thu ở T8 — tối thiểu ~1MB text).
- [ ] Sinh được văn bản có cấu trúc câu nhận ra được (không cần đúng nghĩa).
- [ ] Thí nghiệm: có/không mask, có/không positional encoding — kèm biểu đồ loss.
- [ ] Bảng so sánh temperature × top_k với mẫu sinh thật.
- [ ] README: **vẽ sơ đồ một khối Transformer** và giải thích bằng lời của bạn.
- [ ] Chạy được trên Colab free (ghi rõ thời gian train).

> Tài liệu đồng hành bắt buộc: **Karpathy "Let's build GPT"** (video ~2h). Xem trước khi làm đồ án, không phải thay cho đồ án.

---

# TUẦN 31 — Hugging Face & Fine-tuning (8h)

**Mục tiêu:** trả lời được câu hỏi phỏng vấn kinh điển *"khi nào fine-tune, khi nào RAG, khi nào chỉ cần prompt?"* — bằng **số liệu của chính bạn**.

## ① Lý thuyết (2h)

### 31.1 Ba cách "dạy" model, chọn theo thứ tự

| Cách | Dạy được gì | Chi phí | Thời gian | Khi dùng |
|---|---|---|---|---|
| **Prompt** | Hành vi, định dạng | ~0 | phút | **Luôn thử đầu tiên** |
| **RAG** | Kiến thức mới, hay thay đổi | thấp | giờ | Cần dữ liệu riêng, cần trích dẫn |
| **Fine-tune** | Phong cách, định dạng chặt, miền hẹp | trung bình–cao | ngày | Prompt và RAG đều không đủ |

**Quy tắc quyết định:**
- Model *không biết* thông tin → **RAG** (fine-tune nhồi kiến thức là cách kém: đắt, khó cập nhật, không trích dẫn được, và vẫn bịa).
- Model *biết nhưng làm sai cách* → **fine-tune** (định dạng đầu ra chặt, giọng văn thương hiệu, thuật ngữ chuyên ngành).
- Chưa thử prompt kỹ → **quay lại làm prompt cho tử tế trước.**

> Câu trả lời phỏng vấn tốt nhất: *"Fine-tune dạy model **cách làm**, RAG cung cấp cho model **cái để biết**. Nhầm hai cái này là sai lầm tốn kém nhất trong dự án LLM."*

### 31.2 LoRA — vì sao ai cũng dùng

Fine-tune toàn bộ model 7B cần ~80GB VRAM. LoRA đóng băng model gốc, chỉ thêm hai ma trận nhỏ hạng thấp vào mỗi lớp → train **<1% tham số**, cần ~16GB VRAM, kết quả gần tương đương.

Lợi ích phụ rất quan trọng: adapter chỉ vài chục MB, đổi được lúc chạy → **một model gốc phục vụ nhiều tác vụ**, thay vì lưu nhiều bản model đầy đủ.

QLoRA = LoRA + model gốc lượng tử hoá 4-bit → chạy được trên GPU 8–12GB (Colab free).

### 31.3 Ba siêu tham số LoRA

| Tham số | Ý nghĩa | Giá trị thường dùng |
|---|---|---|
| `r` (rank) | Dung lượng adapter | 8–16 cho tác vụ đơn, 32–64 cho tác vụ phức tạp |
| `lora_alpha` | Hệ số nhân | thường = `2r` |
| `target_modules` | Lớp nào được gắn adapter | `q_proj, v_proj` (tối thiểu) hoặc tất cả lớp tuyến tính (tốt hơn, tốn hơn) |

### 31.4 Dữ liệu quan trọng hơn siêu tham số

**500 mẫu chất lượng cao thắng 5.000 mẫu lẫn lộn.** Yêu cầu với dữ liệu fine-tune: đúng định dạng chat template của model, đa dạng, không trùng lặp, và **chính xác** (một mẫu sai dạy model làm sai).

Luôn tách 10–20% làm tập đánh giá **trước khi** train, và giữ nguyên bộ eval từ T14 để so sánh công bằng.

## ② Code ví dụ (2h)

```python
# --- 1. Dùng pretrained model có sẵn ---
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM

clf = pipeline("text-classification", model="wonrax/phobert-base-vietnamese-sentiment")
print(clf("Sản phẩm này rất tốt, tôi hài lòng"))

# --- 2. Chuẩn bị dữ liệu fine-tune ---
from datasets import Dataset

# Mỗi mẫu: hội thoại theo chat template của model
rows = [{"messages": [
    {"role": "user", "content": "Trích xuất thông tin đơn hàng: ..."},
    {"role": "assistant", "content": '{"ma_don":"DH-001","tong_tien":150000}'},
]} for ... ]

ds = Dataset.from_list(rows).train_test_split(test_size=0.15, seed=42)

def to_text(batch):
    return {"text": [tokenizer.apply_chat_template(m, tokenize=False)
                     for m in batch["messages"]]}
ds = ds.map(to_text, batched=True)

# --- 3. QLoRA ---
import torch
from transformers import BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

MODEL = "Qwen/Qwen3-1.7B"
tokenizer = AutoTokenizer.from_pretrained(MODEL)

bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                         bnb_4bit_compute_dtype=torch.bfloat16,
                         bnb_4bit_use_double_quant=True)

model = AutoModelForCausalLM.from_pretrained(MODEL, quantization_config=bnb,
                                             device_map="auto")
model = prepare_model_for_kbit_training(model)

lora = LoraConfig(
    r=16, lora_alpha=32, lora_dropout=0.05,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    task_type="CAUSAL_LM",
)
model = get_peft_model(model, lora)
model.print_trainable_parameters()      # ví dụ: trainable 0.62% || 10.7M / 1.72B

# --- 4. Train ---
from trl import SFTTrainer, SFTConfig

trainer = SFTTrainer(
    model=model,
    train_dataset=ds["train"], eval_dataset=ds["test"],
    args=SFTConfig(
        output_dir="out", num_train_epochs=3,
        per_device_train_batch_size=2, gradient_accumulation_steps=8,   # batch hiệu dụng 16
        learning_rate=2e-4,              # LoRA dùng LR CAO hơn full fine-tune nhiều
        warmup_ratio=0.03, lr_scheduler_type="cosine",
        logging_steps=10, eval_strategy="steps", eval_steps=50,
        save_strategy="steps", save_steps=50, load_best_model_at_end=True,
        bf16=True, max_length=1024, report_to="none",
    ),
)
trainer.train()
model.save_pretrained("adapter")        # chỉ vài chục MB

# --- 5. Suy luận với adapter ---
from peft import PeftModel

base = AutoModelForCausalLM.from_pretrained(MODEL, device_map="auto")
tuned = PeftModel.from_pretrained(base, "adapter")

# --- 6. So sánh CÔNG BẰNG: cùng bộ eval, cùng cách đo ---
def compare(cases: list[dict]) -> pd.DataFrame:
    rows = []
    for name, fn in [("prompt_only", run_prompt),
                     ("prompt_fewshot", run_fewshot),
                     ("rag", run_rag),
                     ("finetuned", run_finetuned)]:
        t0 = time.perf_counter()
        correct = sum(judge(c["expected"], fn(c["input"])) for c in cases)
        rows.append({"phuong_phap": name,
                     "do_chinh_xac": round(correct / len(cases), 3),
                     "latency_p50_s": round((time.perf_counter() - t0) / len(cases), 2),
                     "chi_phi_1000": estimate_cost_per_1000(name)})
    return pd.DataFrame(rows)
```

## ③ Thực hành (2h) — 4 bài

### Bài 31.1 — Quyết định: fine-tune, RAG hay prompt?
(a) Bot trả lời quy định nội bộ cập nhật hàng tháng; (b) trích xuất JSON 12 trường từ hoá đơn, model hay sai định dạng; (c) viết theo giọng văn thương hiệu; (d) trả lời kiến thức y khoa chuyên sâu.

<details><summary>Lời giải</summary>

(a) **RAG.** Kiến thức thay đổi hàng tháng — fine-tune lại mỗi tháng vừa đắt vừa không trích dẫn được nguồn.
(b) **Prompt trước** (structured output + schema, T12). Nếu vẫn sai >5% thì **fine-tune** — đây đúng là ca fine-tune mạnh nhất: định dạng chặt, lặp lại nhiều.
(c) **Fine-tune.** Giọng văn là "cách làm", không phải "kiến thức". Prompt mô tả giọng văn luôn kém hơn ví dụ thật.
(d) **RAG** trên tài liệu y khoa được kiểm chứng + trích dẫn bắt buộc. Fine-tune kiến thức y khoa là nguy hiểm: model vẫn bịa mà không có nguồn để kiểm chứng.

Quy luật: **(a),(d) = cần BIẾT → RAG. (b),(c) = cần LÀM ĐÚNG CÁCH → fine-tune.**
</details>

### Bài 31.2 — Kiểm tra chất lượng dữ liệu fine-tune
Viết script kiểm tra dataset trước khi train: trùng lặp, độ dài bất thường, mất cân bằng nhãn, sai định dạng.

<details><summary>Lời giải</summary>

```python
def audit_dataset(rows: list[dict]) -> dict:
    texts = [r["messages"][-1]["content"] for r in rows]
    lens = [len(tokenizer.encode(t)) for t in texts]
    issues = {
        "trung_lap": len(texts) - len(set(texts)),
        "qua_ngan": sum(l < 5 for l in lens),
        "qua_dai": sum(l > 1024 for l in lens),
        "do_dai_p50": int(np.median(lens)), "do_dai_p95": int(np.quantile(lens, 0.95)),
        "thieu_role": sum(not {"user","assistant"} <= {m["role"] for m in r["messages"]}
                          for r in rows),
    }
    if all(t.strip().startswith("{") for t in texts):        # dataset JSON
        issues["json_khong_hop_le"] = sum(not is_valid_json(t) for t in texts)
    return issues
```
Chạy trước mỗi lần train. **Dọn dữ liệu cho lợi nhuận cao hơn nhiều so với chỉnh siêu tham số** — và rẻ hơn hàng chục lần.
</details>

### Bài 31.3 — Phát hiện overfitting khi fine-tune
Sau 3 epoch, train loss 0,05 còn eval loss 1,8. Chẩn đoán và nêu 4 cách xử lý.

<details><summary>Lời giải</summary>

Overfitting nặng — model học thuộc tập train. Với dataset nhỏ (<1.000 mẫu) rất hay gặp.

Xử lý theo thứ tự ưu tiên: (1) **giảm số epoch xuống 1–2** — thường đủ với LoRA; (2) **giảm `r`** (16 → 8) để giảm dung lượng adapter; (3) **thêm dữ liệu** — hiệu quả nhất nhưng tốn công; (4) tăng `lora_dropout`, thêm weight decay, hoặc dùng early stopping theo eval loss.

Điều quan trọng phải nhớ: eval loss thấp **không đảm bảo** model tốt hơn trên bộ eval nghiệp vụ của bạn. Luôn kiểm chứng bằng bộ golden từ T14, không chỉ nhìn loss.
</details>

### Bài 31.4 — So sánh công bằng
Thiết kế thí nghiệm so 4 phương pháp sao cho công bằng. Liệt kê những gì phải giữ giống nhau.

<details><summary>Lời giải</summary>

Phải giữ giống nhau: **cùng bộ test** (chưa từng thấy khi train và khi soạn prompt); **cùng cách chấm** (một judge đã hiệu chuẩn theo T14); **cùng số lần chạy** (≥3, báo cáo trung bình ± độ lệch); **cùng ràng buộc độ dài đầu ra**.

Phải báo cáo riêng: độ chính xác, **chi phí cho 1.000 lượt** (fine-tune phải khấu hao chi phí train), độ trễ p95, và **công sức bảo trì** (fine-tune cần train lại khi đổi model gốc — chi phí ẩn lớn nhất và hay bị bỏ qua nhất).

Kết quả điển hình mà nhiều người bất ngờ: **prompt + few-shot tốt thường ngang fine-tune** cho tác vụ định dạng đơn giản, với công sức bằng một phần nhỏ. Fine-tune chỉ thắng rõ ở tác vụ định dạng rất chặt hoặc miền rất hẹp. Đây là kết luận đáng giá nhất của cả tuần.
</details>

## ④ Đồ án tuần 31 + 🎓 ĐỒ ÁN MÔN 8 (4h)

Hai phần: `mini-gpt` (T30) + fine-tune LoRA (T31) + báo cáo so sánh.

**Checklist nghiệm thu:**
- [ ] Fine-tune LoRA một model nhỏ (Qwen3-1.7B hoặc tương đương) cho tác vụ cụ thể trong miền của bạn.
- [ ] Dataset ≥300 mẫu, có script audit chất lượng, chia train/eval trước khi train.
- [ ] Biểu đồ train/eval loss, nêu rõ đã chống overfitting thế nào.
- [ ] **Bảng so sánh 4 phương pháp** trên cùng bộ test: prompt / prompt+few-shot / RAG / fine-tuned — kèm độ chính xác, chi phí/1000 lượt, p95, công sức bảo trì.
- [ ] **Kết luận có lập luận:** phương pháp nào nên dùng cho bài toán này và vì sao. Nếu kết luận là "không đáng fine-tune" thì đó vẫn là kết luận tốt — miễn có số liệu.
- [ ] `BAOCAO.md` đủ 5 mục.

---

# 🚪 CỔNG KIỂM TRA TRƯỚC TUẦN 32

### Lý thuyết
1. **Vẽ sơ đồ một khối Transformer trên giấy trắng** và giải thích attention làm gì. *(bài kiểm tra quan trọng nhất của khối này)*
2. Vì sao chia `√d_k` trong công thức attention?
3. Causal mask là gì, không có nó thì hỏng ở đâu?
4. Encoder-only, decoder-only, encoder-decoder khác nhau ra sao? Model embedding bạn dùng ở T10 thuộc loại nào?
5. Khi nào fine-tune, khi nào RAG, khi nào chỉ prompt? Cho ví dụ mỗi loại.
6. LoRA hoạt động thế nào và vì sao tiết kiệm được nhiều đến vậy?
7. Accuracy 99% trên dữ liệu 99:1 nói lên điều gì?
8. Bốn dấu hiệu trên đường loss và chẩn đoán tương ứng.

### Thực hành
- [ ] Viết training loop PyTorch từ trí nhớ — **dưới 15 phút**.
- [ ] Cài đặt scaled dot-product attention từ đầu — **dưới 20 phút**.
- [ ] Fine-tune LoRA một model nhỏ trên dataset mới — **dưới 1 giờ** (không tính thời gian train).

### Hiện vật
- [ ] `w27` bộ phân loại + báo cáo chọn ngưỡng theo chi phí
- [ ] `w28` MLP tự train + biểu đồ loss + thí nghiệm LR
- [ ] `w29` phân loại ảnh tự thu, 3 chiến lược transfer
- [ ] `w30` `mini-gpt` sinh được tiếng Việt + ablation mask/position
- [ ] 🎓 **Đồ án môn 8** + BAOCAO.md có bảng so sánh 4 phương pháp
- [ ] `ERRORS.md` ≥35 mục

---

## Phụ lục A: Sổ tay chẩn đoán huấn luyện

| Triệu chứng | Nguyên nhân thường gặp | Kiểm tra đầu tiên |
|---|---|---|
| Loss không giảm | Quên `zero_grad`, LR=0, nhãn sai | Thử overfit 10 mẫu |
| Loss = NaN | LR quá lớn, chia 0, dữ liệu có inf | `torch.isnan(x).any()`, giảm LR |
| Loss giảm quá nhanh về 0 | Rò rỉ dữ liệu, thiếu mask | Kiểm tra pipeline dữ liệu |
| Train tốt, val kém | Overfitting | Early stopping, thêm dữ liệu |
| CUDA out of memory | Batch quá lớn | Giảm batch, `gradient_accumulation_steps`, bf16 |
| Kết quả khác nhau mỗi lần | Chưa cố định seed | `torch.manual_seed`, `np.random.seed` |
| Chậm bất thường | Dữ liệu ở CPU, `num_workers=0` | Kiểm tra `.to(device)`, tăng `num_workers` |

## Phụ lục B: 10 sai lầm khi học Deep Learning

| # | Sai lầm | Hậu quả |
|---|---|---|
| 1 | Học lý thuyết mà không train model nào | Không bao giờ hiểu thật |
| 2 | Không so với baseline ngu ngốc | Không biết model có học được gì không |
| 3 | Chạm tập test nhiều lần | Overfitting lên test, kết quả không đáng tin |
| 4 | Rò rỉ dữ liệu (fit trên toàn bộ) | Kết quả đẹp giả tạo, ra production tụt |
| 5 | Chỉ nhìn accuracy | Bỏ sót vấn đề lớp mất cân bằng |
| 6 | Train from scratch khi có pretrained | Lãng phí thời gian và tài nguyên |
| 7 | Chỉnh siêu tham số trước khi dọn dữ liệu | Sai thứ tự ưu tiên, lợi ích thấp |
| 8 | Fine-tune để nhồi kiến thức | Nên dùng RAG — rẻ hơn, cập nhật được, trích dẫn được |
| 9 | Không lưu checkpoint | Mất sạch khi crash hoặc hết phiên Colab |
| 10 | Không cố định seed | Không tái lập được thí nghiệm |
