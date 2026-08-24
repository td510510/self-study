# Phase 02 · Toán "vừa đủ dùng"

**Thời gian:** Tuần 5 (~12 giờ) · **Điều kiện:** xong [Phase 01](../01-python-foundations/README.md)

---

## 🎯 Mục tiêu

Không phải học toán để thi. Học **đúng lượng toán cần** để hiểu vì sao model học được, và để đọc tài liệu AI mà không bị chặn ở công thức.

- [ ] Hiểu vector, ma trận và vì sao AI dùng chúng
- [ ] Tự code **gradient descent** từ đầu — thứ làm nên mọi mô hình học máy
- [ ] Hiểu learning rate: quá lớn thì sao, quá nhỏ thì sao
- [ ] Nắm xác suất, phân phối, mean/median, tương quan ở mức dùng được
- [ ] Phân biệt tương quan và nhân quả

> **Cam kết:** phase này **không chứng minh định lý nào**. Mọi khái niệm đều được code bằng NumPy và nhìn thấy kết quả.

---

## Vì sao vẫn cần toán?

Bạn có thể gọi `model.fit(X, y)` mà không hiểu gì bên trong. Nó sẽ chạy. Rồi một ngày:

| Tình huống thật | Không biết toán | Biết toán |
|---|---|---|
| Loss ra `NaN` sau 3 epoch | Google mò cả buổi | *"Learning rate quá lớn"* — sửa trong 10 giây |
| Model đoán mọi thứ về một lớp | Thử đổi model khác | *"Dữ liệu mất cân bằng"* — xử lý đúng gốc |
| Loss giảm rồi phẳng lì | Chờ thêm 100 epoch | *"Kẹt rồi, cần đổi lr hoặc kiến trúc"* |
| Embedding "gần nhau" nghĩa là gì? | Chỉ dùng theo mẫu | Hiểu cosine similarity, biết khi nào nó sai |

Toán ở đây không phải rào cản. Nó là **kính hiển vi** giúp bạn nhìn thấy chuyện gì đang xảy ra.

---

## 1. Vector — dãy số có ý nghĩa

Một vector chỉ là một dãy số. Điều thú vị là **những gì nó biểu diễn**:

```python
khach_hang = [25, 15_000_000, 3, 0.8]
#             tuổi, thu nhập,  số đơn, điểm hài lòng
```

Mọi thứ trong AI đều được biến thành vector:

| Đối tượng | Thành vector bằng cách |
|---|---|
| Khách hàng | Các đặc trưng: tuổi, thu nhập, hành vi... |
| Ảnh | Giá trị pixel |
| Từ / câu | **Embedding** — bạn học ở Phase 06 |
| Sản phẩm | Giá, danh mục, lượt xem, đánh giá |

> Câu thần chú của ngành: **"Mọi thứ đều là vector."** Khi biến được dữ liệu thành vector, mọi công cụ toán học sẵn có đều dùng được.

### Tích vô hướng — đo độ "cùng hướng"

```python
a · b = a₁b₁ + a₂b₂ + ... + aₙbₙ
```

Nhân từng cặp rồi cộng lại. Ý nghĩa: **hai vector cùng hướng đến mức nào**.

```
  Cùng hướng          Vuông góc            Ngược hướng
      ↗ ↗                 ↑ →                  ↗ ↙
  tích LỚN, dương      tích ≈ 0           tích ÂM
```

Đây chính là nền tảng của **tìm kiếm ngữ nghĩa** ở Phase 08: hai đoạn văn gần nghĩa nhau thì vector embedding của chúng có tích vô hướng lớn.

### Cosine similarity

Tích vô hướng bị ảnh hưởng bởi độ dài vector. Muốn chỉ so **hướng**, ta chuẩn hoá:

```
cos(a, b) = (a · b) / (|a| × |b|)      →  luôn nằm trong [-1, 1]
```

| Giá trị | Nghĩa |
|---|---|
| `1.0` | Cùng hướng hoàn toàn — cực kỳ giống nhau |
| `0.0` | Không liên quan |
| `-1.0` | Ngược hướng hoàn toàn |

Bạn sẽ dùng công thức này **rất nhiều** ở Phase 08 để tìm đoạn tài liệu liên quan tới câu hỏi.

---

## 2. Ma trận — bảng số 2 chiều

```python
X = [[25, 15_000_000, 3],      # khách hàng 1
     [31,  8_000_000, 1],      # khách hàng 2
     [45, 30_000_000, 7]]      # khách hàng 3
#    tuổi  thu nhập  số đơn
```

**Quy ước chuẩn trong ML:** ma trận `X` có shape `(số_mẫu, số_đặc_trưng)` — mỗi **hàng** là một mẫu, mỗi **cột** là một đặc trưng. Ghi nhớ điều này giúp bạn không bị lạc khi đọc code người khác.

### Nhân ma trận — phép tính lõi của AI

Một lớp mạng neural chính xác là:

```
output = activation(X @ W + b)
```

- `X @ W` — nhân ma trận
- `W` — trọng số, chính là thứ model **học**
- `activation` — hàm phi tuyến; không có nó thì chồng bao nhiêu lớp cũng chỉ tương đương một lớp

**Quy tắc shape:** `(m, n) @ (n, p) → (m, p)`. Hai số ở giữa **phải khớp**.

```
   (3, 2)  @  (2, 4)   →   (3, 4)
       ↑       ↑
       └───────┘  phải bằng nhau
```

> 🔑 **90% lỗi khi code AI là lỗi shape.** Khi bí, in `.shape` ra trước tiên — trước cả khi đọc lại logic.

### Vì sao GPU thống trị AI?

Nhân ma trận gồm hàng triệu phép nhân **độc lập với nhau** → chia được cho hàng nghìn nhân xử lý cùng lúc. GPU vốn sinh ra để làm việc đó cho đồ hoạ 3D, và hoá ra deep learning cần đúng phép tính ấy.

---

## 3. Gradient descent — cách model "học"

Đây là ý tưởng quan trọng nhất của cả phase, có lẽ của cả chương trình.

### Ẩn dụ

> Bạn đứng trên sườn đồi trong sương mù dày đặc, muốn xuống thung lũng. Không nhìn được xa, nhưng **cảm nhận được độ dốc dưới chân**. Bạn bước một bước theo hướng dốc xuống nhất, rồi lặp lại. Sau đủ nhiều bước, bạn tới đáy.

```
  Loss
   │╲                                     ╱
   │ ╲___                             ___╱
   │     ╲──●                     ╱──╱
   │        ╲──●            ╱──●─╱
   │           ╲──●────●──╱
   │              ╲____╱  ← đáy: loss nhỏ nhất
   └──────────────────────────────────▶  giá trị tham số w
```

### Ánh xạ sang toán

| Ẩn dụ | Toán học |
|---|---|
| Độ cao chỗ bạn đứng | **Loss** — model đang sai bao nhiêu |
| Vị trí của bạn | **Tham số** (weights) hiện tại |
| Độ dốc dưới chân | **Gradient** — đạo hàm của loss theo tham số |
| Độ dài mỗi bước | **Learning rate** |
| Đáy thung lũng | Loss nhỏ nhất — model tốt nhất |

### Công thức

```
w_mới = w_cũ − learning_rate × gradient
```

Dấu trừ vì gradient chỉ hướng **đi lên**, mà ta muốn đi xuống.

Chỉ có vậy. Mọi model từ hồi quy tuyến tính tới GPT-4 đều học bằng công thức này (với nhiều cải tiến, nhưng cốt lõi không đổi).

### Learning rate — siêu tham số quan trọng nhất

| Learning rate | Hiện tượng | Đồ thị loss |
|---|---|---|
| **Quá nhỏ** | Học rất chậm, dễ kẹt | Gần như phẳng, giảm chậm |
| **Vừa** | Hội tụ mượt | Giảm đều rồi phẳng dần |
| **Quá lớn** | Nhảy qua lại quanh đáy | Dao động lên xuống |
| **Cực lớn** | Phân kỳ | Tăng vọt, hoặc ra `NaN` |

```
    quá nhỏ            vừa              quá lớn
      ╲                 ╲                ╱╲  ╱╲
       ╲___              ╲__            ╱  ╲╱  ╲
           ╲___             ╲___       ╱         ╲
```

> 💡 **Thấy loss ra `NaN`?** Gần như chắc chắn là learning rate quá lớn. Đây là chẩn đoán bạn sẽ dùng suốt sự nghiệp.

### Local minimum

Có thể mắc kẹt ở một hố cạn chưa phải đáy sâu nhất:

```
   ╲        ╱╲
    ╲___  ╱   ╲___
        ●          ╲___
    local            ╲___●
   minimum          global minimum
```

Với mạng neural nhiều chiều, chuyện này ít gây hại như người ta từng lo — trong không gian hàng triệu chiều, hầu hết điểm dừng là *saddle point* chứ không phải hố thật.

---

## 4. Xác suất & thống kê

### Mean, median, mode

| Chỉ số | Nhạy với ngoại lai | Dùng khi |
|---|---|---|
| **Mean** (trung bình) | ✅ Rất nhạy | Phân bố đối xứng, không ngoại lai |
| **Median** (trung vị) | ❌ Bền vững | Có ngoại lai hoặc phân bố lệch |
| **Mode** (yếu vị) | ❌ | Dữ liệu hạng mục |

**Ví dụ kinh điển:** 10 người, chín người lương 10 triệu, một người 1 tỷ.
- Mean = 109 triệu → nghe hay nhưng vô nghĩa
- Median = 10 triệu → đúng thực tế đa số

Vì thế báo chí kinh tế luôn dùng **median** cho thu nhập và giá nhà.

> 💡 Khi mean và median lệch nhau nhiều → dấu hiệu phân bố lệch hoặc có ngoại lai. Hãy vẽ histogram nhìn kỹ.

### Độ lệch chuẩn

Đo dữ liệu phân tán nhiều hay ít quanh giá trị trung bình.

```
  std nhỏ                    std lớn
      ▁▃█▇▃▁                ▁▂▃▄▅▄▃▂▁
  (tập trung)              (phân tán)
```

### Phân phối chuẩn (Gaussian)

Hình chuông. Xuất hiện khắp nơi trong tự nhiên: chiều cao, sai số đo, điểm thi.

**Quy tắc 68–95–99.7:**
- 68% dữ liệu nằm trong ±1 std quanh mean
- 95% trong ±2 std
- 99.7% trong ±3 std

Đây là cơ sở của phương pháp phát hiện ngoại lai bằng z-score: điểm nào cách mean quá 3 std thì đáng nghi.

### Tương quan ≠ nhân quả

**Tương quan** đo hai biến biến thiên cùng nhau, từ −1 đến 1.

```
  r ≈ +1              r ≈ 0               r ≈ -1
     ╱                 ·  · ·                ╲
    ╱  ·              · ·  ·                  ╲  ·
   ╱ ·               ·  ·  ·                ·  ╲
  ╱·                  · ·                        ╲
 cùng tăng          không liên quan          ngược chiều
```

**Ví dụ kinh điển:** doanh số kem và số vụ đuối nước tương quan rất mạnh. Kem không gây đuối nước — biến ẩn là **trời nóng**.

**Khi thấy A tương quan với B, có 4 khả năng:**
1. A gây ra B
2. B gây ra A
3. C gây ra cả A và B (*confounder* — biến gây nhiễu)
4. Trùng hợp ngẫu nhiên trên dữ liệu nhỏ

> ⚠️ **Vì sao AI Engineer phải nhớ điều này:** model chỉ học tương quan. Model bảo *"khách gọi tổng đài nhiều → sắp rời bỏ"* **không** có nghĩa là chặn tổng đài sẽ giữ được khách. Nhầm lẫn ở đây dẫn tới quyết định kinh doanh tai hại.
>
> Cách duy nhất chứng minh nhân quả là **can thiệp có kiểm soát** — A/B test.

### Chuẩn hoá dữ liệu

Cột "tuổi" chạy 20–60, cột "thu nhập" chạy 5 triệu–100 triệu. Không chuẩn hoá thì thu nhập **áp đảo** mọi phép tính khoảng cách và gradient.

| Cách | Công thức | Kết quả |
|---|---|---|
| Standardization (z-score) | `(x − mean) / std` | mean=0, std=1 |
| Min-max normalization | `(x − min) / (max − min)` | nằm trong [0, 1] |

**Không cần chuẩn hoá với** các model dạng cây (Decision Tree, Random Forest, XGBoost) — chúng chỉ so ngưỡng nên bất biến với thang đo.

> ⚠️ **Cực quan trọng:** phải tính mean/std **chỉ từ tập train**, rồi áp dụng cho cả train lẫn test. Tính trên toàn bộ dữ liệu là **data leakage** — bạn sẽ học kỹ ở Phase 04.

---

## 📝 Thực hành

```powershell
code curriculum/02-math-essentials/lessons/01_vector_ma_tran.ipynb
code curriculum/02-math-essentials/lessons/02_gradient_descent.ipynb
code curriculum/02-math-essentials/lessons/03_xac_suat_thong_ke.ipynb

code curriculum/02-math-essentials/exercises/ex01_vector_ma_tran.py
code curriculum/02-math-essentials/exercises/ex02_gradient_descent.py

pytest tests/phase02 -v
```

> Notebook `02_gradient_descent.ipynb` là **trái tim của phase này**. Chạy nó, đổi learning rate, nhìn đồ thị. Đừng bỏ qua.

---

## ✅ Tự kiểm tra

1. Giải thích gradient descent cho người không biết toán.
2. Learning rate quá lớn thì đồ thị loss trông thế nào?
3. `a * b` và `a @ b` trong NumPy khác nhau ra sao?
4. Vì sao nhân ma trận lại quan trọng với AI?
5. Cosine similarity đo cái gì? Giá trị nằm trong khoảng nào?
6. Khi nào dùng median thay vì mean?
7. Cho một ví dụ tương quan mà không nhân quả.
8. Vì sao phải chuẩn hoá dữ liệu? Model nào không cần?

📌 Đáp án đầy đủ: [`resources/interview/phase02-math.md`](../../resources/interview/phase02-math.md)

---

## 📌 Nộp bài

```powershell
pytest tests/phase02 -v
git add .
git commit -m "Tuan 5: hoan thanh phase 02 - toan nen tang"
git push
```

---

⬅️ [Phase 01](../01-python-foundations/README.md) · ➡️ [Phase 03 — Data toolkit](../03-data-toolkit/README.md)
