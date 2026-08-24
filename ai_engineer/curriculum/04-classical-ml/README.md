# Phase 04 · Classical ML (nền tảng)

**Thời gian:** Tuần 9–11 (~36 giờ) · **Điều kiện:** xong [Phase 03](../03-data-toolkit/README.md)

---

## 🎯 Mục tiêu

Phase này trả lời câu hỏi: **model học bằng cách nào, và làm sao biết nó tốt hay dở?**

- [ ] Hiểu hồi quy & phân loại — hai bài toán chiếm 90% ML ứng dụng
- [ ] Chia train / validation / test đúng cách, biết **vì sao phải chia ba**
- [ ] Nhận ra overfitting qua đồ thị, biết cách chữa
- [ ] Chọn đúng metric — và biết vì sao **accuracy thường vô dụng**
- [ ] Phát hiện **data leakage** — lỗi chết người số 1
- [ ] Dùng `Pipeline` của sklearn để tiền xử lý không rò rỉ
- [ ] Cây quyết định, Random Forest, Gradient Boosting
- [ ] → 🎯 **Project P2: Churn Prediction**

> **Định vị phase này:** bạn học **LLM Application Engineer**, nên đây không phải nơi để thành chuyên gia XGBoost. Mục tiêu là hiểu bản chất: model học thế nào, sai ở đâu, đo chất lượng ra sao. Những khái niệm đó quay lại **nguyên vẹn** ở Phase 07 khi bạn viết eval cho LLM.

---

## ⚙️ Chuẩn bị

```powershell
pip install -e ".[ml]"
python curriculum/04-classical-ml/tao_du_lieu.py
```

| File | Bài toán | Nội dung |
|---|---|---|
| `data/gia_nha.csv` | **Hồi quy** | 1.200 căn nhà — dự đoán giá (triệu VND) |
| `data/churn.csv` | **Phân loại** | 5.000 khách hàng — dự đoán có rời bỏ không (26% churn) |

> Trong `churn.csv` có **hai cái bẫy cố ý**. Tìm ra chúng là một phần bài học.

---

## 📅 Chia theo tuần

| Tuần | Chủ đề | Bài học | Bài tập |
|---|---|---|---|
| **9** | Hồi quy, train/val/test, overfitting | `01` | `ex01` |
| **10** | Phân loại, metrics, ngưỡng, mất cân bằng | `02` | `ex02` |
| **11** | Pipeline, leakage, CV, cây & ensemble → **P2** | `03`, `04` | `ex03` |

---

# TUẦN 9 — Hồi quy & cách model học

## 1. Machine Learning là gì (định nghĩa dùng được)

> **ML là viết chương trình bằng cách đưa ví dụ thay vì đưa quy tắc.**

```
Lập trình truyền thống        Machine Learning
┌──────────────────┐          ┌──────────────────┐
│ Dữ liệu + Quy tắc│          │ Dữ liệu + Đáp án │
│        ↓         │          │        ↓         │
│    Chương trình  │          │    Học máy       │
│        ↓         │          │        ↓         │
│     Đáp án       │          │   QUY TẮC        │
└──────────────────┘          └──────────────────┘
```

Bạn không viết quy tắc *"nhà 80m² ở Quận 7 giá khoảng X"*. Bạn đưa 1.200 ví dụ và để máy **tự tìm ra quy tắc**.

**Khi nào KHÔNG nên dùng ML:**

| Tình huống | Vì sao |
|---|---|
| Quy tắc rõ ràng, viết được bằng `if/else` | ML chỉ làm phức tạp thêm |
| Không có dữ liệu lịch sử có nhãn | Không có gì để học |
| Sai một lần là không chấp nhận được | ML luôn có tỷ lệ sai |
| Cần giải thích chính xác **vì sao** | Nhiều model là hộp đen |

> Người mới hay muốn dùng ML cho mọi thứ. Kỹ sư giỏi biết khi nào một câu `if` là đủ.

## 2. Hai bài toán bạn sẽ gặp 90% thời gian

| | **Hồi quy** (Regression) | **Phân loại** (Classification) |
|---|---|---|
| Dự đoán | Một **số** | Một **nhãn** |
| Ví dụ | Giá nhà, doanh thu, nhiệt độ | Spam/không, churn/không, loại bệnh |
| Metric | MAE, RMSE, R² | Accuracy, Precision, Recall, AUC |
| Đầu ra | `3850.0` | `1` hoặc xác suất `0.73` |

## 3. Vocabulary — nói đúng ngôn ngữ

```python
X = df[["dien_tich", "so_phong", "tuoi_nha"]]   # FEATURES (đặc trưng)
y = df["gia"]                                    # TARGET / LABEL (biến mục tiêu)
```

```
       X (đặc trưng)                    y (mục tiêu)
  ┌─────────┬────────┬────────┐        ┌────────┐
  │dien_tich│so_phong│tuoi_nha│        │  gia   │   ← mỗi HÀNG là một MẪU
  ├─────────┼────────┼────────┤        ├────────┤
  │   45.4  │   3    │   6    │        │  2935  │
  │   49.2  │   3    │  13    │        │  3850  │
  └─────────┴────────┴────────┘        └────────┘
   shape (n_mẫu, n_đặc_trưng)          shape (n_mẫu,)
```

| Thuật ngữ | Nghĩa |
|---|---|
| **Parameter** | Con số model **tự học** (`w`, `b`) — bạn không đặt |
| **Hyperparameter** | Con số **bạn chọn** trước khi train (learning rate, số cây, độ sâu) |
| **Fit / Train** | Quá trình model điều chỉnh parameter để giảm loss |
| **Predict / Inference** | Dùng model đã train trên dữ liệu mới |
| **Epoch** | Một lượt duyệt hết dữ liệu train |

## 4. Hồi quy tuyến tính — bạn đã tự code ở Phase 02

```
gia = w₁·dien_tich + w₂·so_phong + w₃·tuoi_nha + b
```

Ở Phase 02 bạn tự viết gradient descent để tìm `w` và `b`. Giờ sklearn làm hộ trong **ba dòng**:

```python
from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)          # học
y_pred = model.predict(X_test)       # dự đoán
```

> Bên trong `.fit()` chính là vòng lặp bạn đã viết (thực ra sklearn dùng nghiệm giải tích cho hồi quy tuyến tính — nhanh hơn, nhưng ý tưởng "tối thiểu hoá loss" không đổi).

**Đọc hệ số học được:**
```python
model.coef_          # w — mỗi đặc trưng một hệ số
model.intercept_     # b
```

Hệ số `dien_tich = 55` nghĩa là: *mỗi m² tăng thêm, giá tăng ~55 triệu, khi mọi thứ khác giữ nguyên.*

> ⚠️ **Chỉ so sánh được độ lớn hệ số khi các đặc trưng đã cùng thang đo.** Hệ số của `dien_tich` (đơn vị m²) và `tong_chi_tieu` (đơn vị đồng) không so trực tiếp được.

## 5. Train / Validation / Test — vì sao phải chia BA

Đây là khái niệm quan trọng nhất tuần này.

```
   Toàn bộ dữ liệu (100%)
   ┌────────────────────────┬──────────┬──────────┐
   │        TRAIN 60%       │  VAL 20% │ TEST 20% │
   └────────────────────────┴──────────┴──────────┘
      model học từ đây        chọn siêu   chấm điểm
                              tham số     CUỐI CÙNG
                                          (chỉ 1 lần)
```

| Tập | Dùng để | Chạm bao nhiêu lần |
|---|---|---|
| **Train** | Model học parameter | Liên tục |
| **Validation** | Bạn chọn hyperparameter, so sánh model | Nhiều lần |
| **Test** | Ước lượng hiệu năng thật ngoài đời | **Đúng một lần, ở cuối** |

**Vì sao cần Validation riêng?** Vì nếu bạn thử 50 cấu hình rồi chọn cái tốt nhất trên tập test, bạn đã *gián tiếp* dùng test để chọn model — điểm test không còn khách quan nữa. Hiện tượng này gọi là **overfitting lên tập test**, và nó tinh vi hơn overfitting thường rất nhiều.

```python
from sklearn.model_selection import train_test_split

X_tam, X_test, y_tam, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
X_train, X_val, y_train, y_val = train_test_split(X_tam, y_tam, test_size=0.25, random_state=42)
# 0.25 của 80% = 20% tổng
```

> `random_state=42` để chia lại vẫn ra kết quả y hệt. **Luôn đặt** — nếu không, mỗi lần chạy bạn được một điểm số khác và không biết cải tiến có thật không.

**Với phân loại, thêm `stratify`:**
```python
train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
```
`stratify=y` đảm bảo tỷ lệ churn 26% được giữ nguyên trong cả ba tập. Không có nó, tập test có thể chỉ chứa 15% churn và mọi con số đều lệch.

## 6. Overfitting & Underfitting

```
   UNDERFIT              VỪA ĐỦ                OVERFIT
  (quá đơn giản)                            (học thuộc lòng)

    ─────────            ～～～～～            ∿∿∿⌇⌇∿∿⌇∿
   ·  ·  · · ·          ·  ·  · · ·          ·  ·  · · ·
   train: dở            train: tốt           train: hoàn hảo
   test:  dở            test:  tốt           test:  DỞ TỆ
```

**Chẩn đoán bằng cách so hai điểm số:**

| Train | Test | Kết luận | Chữa bằng |
|---|---|---|---|
| Dở | Dở | **Underfit** | Model phức tạp hơn, thêm đặc trưng, train lâu hơn |
| Tốt | Tốt | ✅ Vừa | — |
| **Rất tốt** | **Dở** | **Overfit** | Nhiều dữ liệu hơn, model đơn giản hơn, regularization |
| Dở | Tốt | 🚨 **Có gì đó sai** | Kiểm tra lại cách chia dữ liệu |

> 💡 Dòng cuối gần như luôn là bug: dữ liệu bị xáo trộn sai, hoặc test set quá nhỏ.

**Bias–Variance tradeoff** — cùng một ý, nói theo cách khác:
- **Bias cao** = model quá đơn giản, sai một cách *hệ thống* (underfit)
- **Variance cao** = model quá nhạy với nhiễu trong tập train (overfit)

Không thể giảm cả hai về 0 cùng lúc. Việc của bạn là tìm điểm cân bằng.

## 7. Metrics cho hồi quy

| Metric | Công thức | Đặc điểm |
|---|---|---|
| **MAE** | trung bình `\|sai số\|` | Cùng đơn vị dữ liệu, dễ giải thích, bền với ngoại lai |
| **MSE** | trung bình `sai số²` | Phạt nặng sai số lớn, đơn vị bị bình phương |
| **RMSE** | `√MSE` | Cùng đơn vị dữ liệu, vẫn phạt nặng sai số lớn |
| **R²** | 1 − MSE/phương sai | Model giải thích được bao nhiêu % biến thiên |

**Đọc R²:**
```
R² = 1.0   hoàn hảo
R² = 0.85  giải thích được 85% biến thiên — khá tốt
R² = 0.0   không hơn gì việc luôn đoán giá trị trung bình
R² < 0     TỆ HƠN cả đoán trung bình  🚨
```

> 📌 **Luôn báo cáo MAE cùng R².** *"R² = 0.85"* nghe hay nhưng vô hình; *"sai số trung bình 1.26 tỷ trên căn nhà giá trung bình 6 tỷ"* mới cho người nghe hình dung được.

## 8. Baseline — thứ bắt buộc phải có

Trước khi khoe model đạt R² = 0.85, hãy hỏi: **so với cái gì?**

```python
from sklearn.dummy import DummyRegressor, DummyClassifier

DummyRegressor(strategy="mean")          # luôn đoán giá trung bình
DummyClassifier(strategy="most_frequent")  # luôn đoán lớp phổ biến nhất
```

Nếu model phức tạp của bạn không hơn baseline ngu ngốc bao nhiêu, nó **không đáng đưa vào production** — vì nó tốn tiền vận hành và tăng rủi ro.

> 🎯 Đây cũng là thói quen bạn mang sang Phase 07: trước khi khoe prompt tinh vi, hãy đo xem prompt một dòng đơn giản làm được đến đâu.

---

# TUẦN 10 — Phân loại & Metrics

## 9. Hồi quy logistic

Tên gây hiểu nhầm: nó dùng cho **phân loại**, không phải hồi quy.

```
z = w·X + b                 ← giống hệt hồi quy tuyến tính
p = sigmoid(z) = 1/(1+e⁻ᶻ)  ← ép về khoảng (0,1) thành XÁC SUẤT
nhãn = 1 nếu p ≥ 0.5        ← so với ngưỡng
```

Bạn đã code `sigmoid` ở Phase 02. Giờ nó có việc làm thật.

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression(max_iter=1000)
model.fit(X_train, y_train)

model.predict(X_test)              # nhãn: [0, 1, 1, 0, ...]
model.predict_proba(X_test)[:, 1]  # XÁC SUẤT: [0.12, 0.87, 0.63, ...]
```

> 💡 **Hầu như luôn dùng `predict_proba`, không dùng `predict`.** Xác suất cho bạn quyền chọn ngưỡng theo bài toán kinh doanh — `predict` khoá cứng ngưỡng 0.5 mà chưa chắc đã đúng.

## 10. ⚠️ Accuracy là cái bẫy

Dữ liệu churn có 26% khách rời bỏ. Một model **luôn đoán "không churn"**:

```
Accuracy = 74%
```

Nghe khá tốt. Nhưng nó **không bắt được một khách rời bỏ nào** — hoàn toàn vô dụng.

> 🔑 **Accuracy chỉ có nghĩa khi các lớp cân bằng.** Với gian lận thẻ (0.1% gian lận), model luôn đoán "sạch" đạt accuracy 99.9% và vô dụng tuyệt đối.

## 11. Confusion matrix — nền tảng của mọi metric phân loại

```
                        DỰ ĐOÁN
                  Không churn   Churn
              ┌──────────────┬──────────┐
   THẬT  Không│      TN      │    FP    │  ← FP: báo động giả
              │     920      │    60    │
              ├──────────────┼──────────┤
         Churn│      FN      │    TP    │  ← FN: BỎ SÓT
              │     130      │   190    │
              └──────────────┴──────────┘
```

| Ký hiệu | Tên | Nghĩa trong bài toán churn |
|---|---|---|
| **TP** | True Positive | Đoán churn, đúng là churn ✅ |
| **TN** | True Negative | Đoán ở lại, đúng là ở lại ✅ |
| **FP** | False Positive | Đoán churn, thật ra ở lại — **tốn tiền khuyến mãi thừa** |
| **FN** | False Negative | Đoán ở lại, thật ra churn — **mất khách** |

**Hai loại sai này có giá khác nhau.** Đó là toàn bộ lý do ta cần nhiều hơn một con số.

## 12. Precision & Recall

```
                    TP                          TP
Precision = ───────────────        Recall = ───────────────
              TP + FP                        TP + FN
```

| | Câu hỏi nó trả lời | Nhớ bằng |
|---|---|---|
| **Precision** | Trong số ta **báo** là churn, bao nhiêu % đúng? | *"Báo có chuẩn không?"* |
| **Recall** | Trong số **thật sự** churn, ta bắt được bao nhiêu %? | *"Có bỏ sót ai không?"* |

Với bảng trên: Precision = 190/250 = **76%** · Recall = 190/320 = **59%**

**Đánh đổi:** đẩy recall lên bằng cách hạ ngưỡng → báo churn nhiều hơn → bắt được nhiều hơn nhưng báo nhầm cũng nhiều hơn → precision giảm. Không có bữa trưa miễn phí.

**Chọn ưu tiên cái nào?**

| Bài toán | Ưu tiên | Vì sao |
|---|---|---|
| Sàng lọc ung thư | **Recall** | Bỏ sót bệnh nhân >> báo động giả |
| Lọc email spam | **Precision** | Đánh nhầm email quan trọng vào spam rất tệ |
| Giữ chân khách hàng | Tuỳ ngân sách | Khuyến mãi nhầm tốn tiền; mất khách tốn nhiều hơn |
| Phát hiện gian lận | **Recall**, rồi người duyệt lại | Bỏ sót gian lận là mất tiền thật |

**F1-score** = trung bình điều hoà của hai cái:
```
F1 = 2 · (P · R) / (P + R)
```
Dùng khi bạn cần **một con số duy nhất** và hai loại sai quan trọng ngang nhau. Nhưng nó che mất sự đánh đổi — **luôn nhìn cả P và R** trước khi rút gọn thành F1.

## 13. Ngưỡng là lựa chọn kinh doanh

```python
p = model.predict_proba(X_test)[:, 1]

y_pred = (p >= 0.5).astype(int)    # mặc định
y_pred = (p >= 0.3).astype(int)    # recall cao hơn, precision thấp hơn
y_pred = (p >= 0.7).astype(int)    # precision cao hơn, recall thấp hơn
```

> **0.5 không thiêng liêng.** Nó chỉ là mặc định. Ngưỡng đúng phụ thuộc vào chi phí của FP so với FN — một quyết định kinh doanh, không phải kỹ thuật.

**Tính bằng tiền:**
```
Chi phí = FP × (chi phí khuyến mãi nhầm) + FN × (giá trị khách bị mất)
```
Chọn ngưỡng tối thiểu hoá con số này. Đây là cách nói chuyện với người không làm kỹ thuật — họ hiểu tiền, không hiểu F1.

## 14. ROC-AUC

**AUC** đo khả năng model **xếp hạng** đúng: lấy ngẫu nhiên một khách churn và một khách không churn, xác suất model chấm người churn điểm cao hơn là bao nhiêu.

```
AUC = 1.0   hoàn hảo
AUC = 0.85  tốt
AUC = 0.70  tạm được
AUC = 0.5   đoán mò (bằng tung đồng xu)
AUC < 0.5   tệ hơn đoán mò 🚨 (thường là do đảo nhãn)
```

**Ưu điểm lớn nhất:** AUC **không phụ thuộc ngưỡng** — nó đo chất lượng của *xác suất*, nên so sánh model với nhau rất công bằng.

> ⚠️ Khi dữ liệu **cực kỳ** mất cân bằng (< 1% lớp dương), AUC vẫn có thể đẹp một cách gây hiểu nhầm. Lúc đó dùng **PR-AUC** (average precision) — nó tập trung vào lớp hiếm.

## 15. Mất cân bằng lớp — bốn cách xử lý

| Cách | Làm gì | Lưu ý |
|---|---|---|
| **Đổi metric** | Bỏ accuracy, dùng F1 / AUC / PR-AUC | **Luôn làm đầu tiên** |
| **`class_weight="balanced"`** | Model phạt nặng hơn khi sai ở lớp hiếm | Đơn giản nhất, thử trước |
| **Chỉnh ngưỡng** | Hạ ngưỡng để tăng recall | Không cần train lại |
| **Resampling** (SMOTE…) | Sinh thêm mẫu lớp hiếm | **Chỉ áp dụng trên tập train**, dễ gây leakage |

> Người mới hay nhảy ngay vào SMOTE. Thực tế, đổi metric + `class_weight` giải quyết được phần lớn trường hợp và ít rủi ro hơn nhiều.

---

# TUẦN 11 — Pipeline, Leakage, Ensemble

## 16. 🚨 Data leakage — lỗi chết người số 1

**Định nghĩa:** thông tin mà model lẽ ra không được biết lúc dự đoán lại lọt vào quá trình train. Kết quả: điểm test cao ngất, ra đời thật thất bại thảm hại.

### Ba dạng, theo thứ tự hay gặp

**① Leakage do tiền xử lý** — phổ biến nhất, tinh vi nhất

```python
# ❌ SAI: scaler nhìn thấy CẢ tập test
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)          # ← mean/std tính trên toàn bộ
X_train, X_test = train_test_split(X_scaled, ...)

# ✅ ĐÚNG: chia trước, fit chỉ trên train
X_train, X_test = train_test_split(X, ...)
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)     # fit + transform
X_test = scaler.transform(X_test)           # CHỈ transform
```

> `fit_transform` trên train, `transform` trên test. Nhầm chỗ này là leakage, và nó **không báo lỗi gì cả**.

**② Leakage do đặc trưng** — nguy hiểm nhất vì rất khó thấy

Trong `churn.csv` có cột `da_goi_tong_dai_huy`. Nghe hợp lý... cho đến khi bạn hỏi:

> *"Lúc tôi CẦN dự đoán, tôi đã có cột này chưa?"*

Không. Khách gọi tổng đài để huỷ **sau khi** đã quyết định rời bỏ. Đưa nó vào model là hỏi *"khách sắp huỷ không?"* bằng thông tin *"khách đã gọi huỷ rồi"*.

```
Không có cột rò rỉ:  AUC = 0.79   ← con số thật
Có cột rò rỉ:        AUC = 0.96   ← đẹp giả tạo, vô dụng ngoài đời
```

**③ Leakage do thời gian**

Train trên dữ liệu tháng 12, test trên tháng 6 → model "nhìn thấy tương lai". Với dữ liệu chuỗi thời gian, **luôn chia theo thời gian**: train quá khứ, test tương lai.

### Ba câu hỏi phát hiện leakage

```
① Kết quả có tốt bất thường không?        AUC > 0.95 ở bài toán khó → nghi ngờ
② Đặc trưng nào chiếm gần hết importance?  Một cột áp đảo → nghi ngờ
③ Lúc dự đoán THẬT, tôi có cột này chưa?   Câu hỏi quan trọng nhất
```

> 🎯 **Nguyên tắc vàng:** kết quả đẹp bất ngờ là tin **xấu** cho đến khi chứng minh được ngược lại.

## 17. Pipeline — cách sklearn chống leakage cho bạn

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

cot_so = ["dien_tich", "so_phong", "tuoi_nha"]
cot_chu = ["quan"]

tien_xu_ly = ColumnTransformer([
    ("so", Pipeline([
        ("dien", SimpleImputer(strategy="median")),
        ("scale", StandardScaler()),
    ]), cot_so),
    ("chu", OneHotEncoder(handle_unknown="ignore"), cot_chu),
])

model = Pipeline([
    ("tien_xu_ly", tien_xu_ly),
    ("model", LogisticRegression(max_iter=1000)),
])

model.fit(X_train, y_train)      # mọi bước đều fit CHỈ trên train
model.predict(X_test)            # mọi bước đều chỉ transform
```

**Ba lợi ích:**
1. **Chống leakage tự động** — không thể vô tình fit trên test
2. **Không quên bước nào** khi predict trên dữ liệu mới
3. **Dùng được với cross-validation** — mỗi fold tự tiền xử lý riêng

> 📌 Đây là lý do Pipeline không phải "cho đẹp" mà là **yêu cầu bắt buộc** trong công việc thật.

## 18. Cross-validation

Chia một lần thì điểm số phụ thuộc may rủi của lần chia đó. K-fold chia k lần:

```
Fold 1: [TEST][train][train][train][train]
Fold 2: [train][TEST][train][train][train]
Fold 3: [train][train][TEST][train][train]
Fold 4: [train][train][train][TEST][train]
Fold 5: [train][train][train][train][TEST]
                                            → 5 điểm số → mean ± std
```

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
diem = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc")
print(f"AUC = {diem.mean():.3f} ± {diem.std():.3f}")
```

> 💡 **Độ lệch chuẩn quan trọng ngang trung bình.** `0.85 ± 0.02` là model ổn định; `0.85 ± 0.12` nghĩa là điểm số của bạn phần lớn do may rủi.

**`StratifiedKFold`** giữ tỷ lệ lớp trong mỗi fold — luôn dùng cho bài toán phân loại.

## 19. Cây quyết định & Ensemble

**Decision Tree** — model duy nhất người thường đọc hiểu được:

```
                dien_tich <= 60?
                 ┌─────┴─────┐
               có           không
                │             │
          quan == Q1?    dien_tich <= 120?
           ┌───┴───┐       ┌────┴────┐
        3200    1800     6500     12000
```

| Ưu | Nhược |
|---|---|
| Dễ giải thích, vẽ ra được | **Rất dễ overfit** — cây đủ sâu học thuộc từng dòng |
| Không cần chuẩn hoá thang đo | Không ổn định: đổi vài dòng dữ liệu, cây khác hẳn |
| Xử lý được cả biến số lẫn hạng mục | Ranh giới quyết định luôn vuông góc |

**Random Forest** — trồng nhiều cây, mỗi cây thấy một phần dữ liệu và một phần đặc trưng, rồi lấy trung bình.

```
🌲 🌲 🌲 🌲 🌲  →  bỏ phiếu / trung bình  →  dự đoán
```

Từng cây yếu và overfit, nhưng lỗi của chúng **triệt tiêu lẫn nhau**. Đây là ý tưởng đẹp nhất của classical ML.

**Gradient Boosting (XGBoost/LightGBM)** — cây sau sửa lỗi của cây trước:

```
Cây 1 → sai ở đâu? → Cây 2 tập trung sửa chỗ đó → Cây 3 sửa tiếp → …
```

| Model | Khi nào dùng |
|---|---|
| **Linear/Logistic** | Cần giải thích, dữ liệu ít, quan hệ tuyến tính |
| **Decision Tree** | Cần vẽ ra giải thích cho người không kỹ thuật |
| **Random Forest** | Mặc định an toàn, ít phải chỉnh, khó overfit |
| **XGBoost/LightGBM** | Cần điểm cao nhất trên dữ liệu **dạng bảng** |
| **Neural network** | Ảnh, văn bản, âm thanh — **không** cho dữ liệu bảng |

> 🔑 **Sự thật ít người mới biết:** với dữ liệu dạng bảng, **Gradient Boosting vẫn thắng deep learning** ở hầu hết trường hợp. Đừng dùng mạng neural cho file CSV.

## 20. Feature importance — và cái bẫy của nó

```python
model.feature_importances_          # cho model dạng cây
```

Cho biết đặc trưng nào ảnh hưởng nhiều đến dự đoán. Rất hữu ích để:
- **Phát hiện leakage** — một cột chiếm gần hết importance là dấu hiệu đỏ
- Bỏ bớt đặc trưng vô dụng
- Giải thích cho người dùng nghiệp vụ

> ⚠️ **Importance ≠ nhân quả.** Model nói `so_lan_ho_tro` quan trọng **không** có nghĩa là chặn tổng đài sẽ giữ được khách. Đây chính là bài học tương quan/nhân quả từ Phase 02, quay lại ở tầng cao hơn.

---

## 📝 Thực hành

```powershell
pip install -e ".[ml]"
python curriculum/04-classical-ml/tao_du_lieu.py

# Tuần 9
code curriculum/04-classical-ml/lessons/01_hoi_quy.ipynb
code curriculum/04-classical-ml/exercises/ex01_hoi_quy.py

# Tuần 10
code curriculum/04-classical-ml/lessons/02_phan_loai_metrics.ipynb
code curriculum/04-classical-ml/exercises/ex02_metrics.py

# Tuần 11
code curriculum/04-classical-ml/lessons/03_pipeline_leakage.ipynb
code curriculum/04-classical-ml/lessons/04_cay_va_ensemble.ipynb
code curriculum/04-classical-ml/exercises/ex03_pipeline.py

pytest tests/phase04 -v
```

---

## ✅ Tự kiểm tra

1. Vì sao phải chia **ba** tập chứ không phải hai?
2. Train 99%, test 62% — chuyện gì đang xảy ra? Chữa thế nào?
3. Dữ liệu 1% gian lận, model đạt accuracy 99%. Nhận xét?
4. Precision và recall khác nhau ra sao? Cho một bài toán ưu tiên mỗi loại.
5. Ngưỡng 0.5 có gì đặc biệt? Khi nào nên đổi?
6. Kể ba dạng data leakage và cách phát hiện.
7. Pipeline giải quyết vấn đề gì?
8. Vì sao Random Forest ít overfit hơn một cây đơn lẻ?

📌 Đáp án đầy đủ: [`resources/interview/phase04-ml.md`](../../resources/interview/phase04-ml.md)

---

## 🎯 Project P2

Xong Tuần 11 → làm [**P2 — Churn Prediction**](../../projects/P2-churn-prediction/README.md).

---

## 📌 Nộp bài

```powershell
pytest tests/phase04 -v
git add .
git commit -m "Tuan 11: hoan thanh phase 04 - classical ML"
git push
```

---

⬅️ [Phase 03](../03-data-toolkit/README.md) · ➡️ [Phase 05 — Deep Learning](../05-deep-learning/README.md)
