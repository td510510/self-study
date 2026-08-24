# 💼 Phỏng vấn — Phase 02: Toán vừa đủ dùng

---

### 1. Gradient descent hoạt động như thế nào? Giải thích cho người không biết toán.

<details><summary>Đáp án</summary>

**Ẩn dụ:** Bạn đứng trên sườn đồi trong sương mù dày, muốn xuống thung lũng. Không nhìn thấy gì xa, nhưng cảm nhận được **độ dốc dưới chân**. Bạn bước một bước theo hướng dốc xuống nhất, rồi lặp lại. Sau đủ nhiều bước, bạn tới đáy.

**Ánh xạ sang toán:**
| Ẩn dụ | Toán |
|---|---|
| Độ cao chỗ bạn đứng | Loss — model đang sai bao nhiêu |
| Vị trí của bạn | Bộ tham số (weights) hiện tại |
| Độ dốc dưới chân | Gradient |
| Độ dài mỗi bước | Learning rate |
| Đáy thung lũng | Loss nhỏ nhất — model tốt nhất |

**Công thức:**
```
w_moi = w_cu - learning_rate * gradient
```
Dấu trừ vì gradient chỉ hướng **đi lên**, ta muốn đi xuống.

**Ý ăn điểm:** nhắc tới **local minimum** — có thể mắc kẹt ở một hố nhỏ chưa phải đáy sâu nhất. Với mạng neural nhiều chiều điều này ít gây hại như người ta từng lo, vì hầu hết điểm dừng là saddle point chứ không phải hố thật.
</details>

---

### 2. Learning rate quá lớn / quá nhỏ thì sao?

<details><summary>Đáp án</summary>

| Learning rate | Hiện tượng | Dấu hiệu trên đồ thị loss |
|---|---|---|
| **Quá nhỏ** | Học rất chậm, có thể kẹt ở local minimum | Loss giảm nhưng cực chậm, gần như phẳng |
| **Vừa** | Hội tụ mượt | Loss giảm đều rồi phẳng dần |
| **Quá lớn** | Nhảy qua nhảy lại quanh đáy, không hội tụ | Loss dao động lên xuống |
| **Cực lớn** | Phân kỳ, bay ra vô cực | Loss tăng vọt hoặc thành `NaN` |

**Cách xử lý thực tế:**
- Bắt đầu từ giá trị chuẩn: `0.001` cho Adam, `0.01–0.1` cho SGD
- **Luôn vẽ đồ thị loss theo epoch** — nhìn hình biết ngay vấn đề
- Dùng **learning rate schedule**: bắt đầu lớn cho nhanh, giảm dần về sau cho mịn
- Thấy loss ra `NaN` → gần như chắc chắn learning rate quá lớn

**Ý ăn điểm:** "Learning rate là siêu tham số quan trọng nhất cần chỉnh. Nếu chỉ được tinh chỉnh một thứ, tôi chọn nó."
</details>

---

### 3. Vì sao nhân ma trận lại quan trọng đến vậy trong AI?

<details><summary>Đáp án</summary>

**Vì mọi mạng neural bản chất là chuỗi phép nhân ma trận xen kẽ hàm phi tuyến.**

Một lớp neural network:
```
output = activation(input @ W + b)
```
- `input @ W` — nhân ma trận, phần "học" nằm ở `W`
- `activation` — thêm tính phi tuyến, nếu không có thì chồng bao nhiêu lớp cũng chỉ tương đương một lớp

**Vì sao dùng ma trận thay vì vòng lặp:**
1. **Song song hoá** — GPU có hàng nghìn nhân, nhân ma trận chia được cho tất cả cùng lúc
2. **Xử lý cả batch một lần** — thay vì lặp qua từng mẫu, xếp 32 mẫu thành ma trận `(32, features)` và tính một phát
3. **Thư viện đã tối ưu cực sâu** (BLAS, cuBLAS) — nhanh hơn code tay hàng trăm lần

**Ý ăn điểm:** "Đó cũng là lý do GPU thống trị AI — chúng vốn sinh ra để nhân ma trận cho đồ hoạ 3D, và hoá ra deep learning cần đúng phép tính đó."
</details>

---

### 4. Tương quan (correlation) và nhân quả (causation) khác nhau thế nào? Cho ví dụ.

<details><summary>Đáp án</summary>

- **Tương quan**: hai biến biến thiên cùng nhau — quan sát được từ dữ liệu
- **Nhân quả**: biến này *gây ra* biến kia — cần thí nghiệm hoặc lập luận nhân quả mới kết luận được

**Ví dụ kinh điển:** Doanh số kem và số vụ đuối nước tương quan rất mạnh. Kem không gây đuối nước — biến ẩn là **trời nóng**: nóng thì người ta vừa ăn kem nhiều vừa đi bơi nhiều.

**Ba khả năng khi thấy A tương quan với B:**
1. A gây ra B
2. B gây ra A (đảo chiều)
3. C gây ra cả A và B (biến gây nhiễu — *confounder*)
4. …hoặc đơn thuần là trùng hợp ngẫu nhiên trên dữ liệu nhỏ

**Vì sao quan trọng với AI Engineer:** model chỉ học tương quan. Một model dự đoán "khách hàng gọi tổng đài nhiều → sắp rời bỏ" **không** có nghĩa là chặn tổng đài sẽ giữ được khách. Nhầm lẫn này dẫn tới các quyết định kinh doanh tai hại.

**Ý ăn điểm:** nhắc tới A/B test — cách duy nhất để chứng minh nhân quả là can thiệp có kiểm soát.
</details>

---

### 5. Vì sao phải chuẩn hoá (normalize/scale) dữ liệu?

<details><summary>Đáp án</summary>

**Vấn đề:** cột "tuổi" chạy 20–60, cột "thu nhập" chạy 5.000.000–100.000.000. Cột thu nhập có giá trị lớn gấp triệu lần sẽ **áp đảo** cột tuổi trong các phép tính khoảng cách và gradient.

**Ảnh hưởng cụ thể:**
- **Gradient descent** hội tụ chậm và ngoằn ngoèo khi các chiều có thang đo lệch nhau
- **KNN, K-means, SVM** dựa trên khoảng cách → cột thang lớn quyết định hết
- **Hồi quy có regularization** phạt không công bằng giữa các cột

**Hai cách phổ biến:**
| Cách | Công thức | Kết quả | Dùng khi |
|---|---|---|---|
| Standardization (z-score) | `(x − mean) / std` | mean=0, std=1 | Mặc định, dữ liệu gần chuẩn |
| Min-max normalization | `(x − min) / (max − min)` | nằm trong [0, 1] | Cần khoảng cố định, ít ngoại lai |

**KHÔNG cần chuẩn hoá với:** các model dạng cây (Decision Tree, Random Forest, XGBoost) — chúng chỉ so sánh ngưỡng nên bất biến với thang đo.

**Ý ăn điểm — cực quan trọng:** phải `fit` scaler **chỉ trên tập train**, rồi `transform` cả train lẫn test. Fit trên toàn bộ dữ liệu là **data leakage**.
</details>

---

### 6. Mean, median, mode — khi nào dùng cái nào?

<details><summary>Đáp án</summary>

| Chỉ số | Là gì | Nhạy với ngoại lai | Dùng khi |
|---|---|---|---|
| **Mean** (trung bình) | Tổng chia số lượng | ✅ Rất nhạy | Dữ liệu phân bố đối xứng, không ngoại lai |
| **Median** (trung vị) | Giá trị ở giữa khi sắp xếp | ❌ Bền vững | Có ngoại lai hoặc phân bố lệch |
| **Mode** (yếu vị) | Giá trị xuất hiện nhiều nhất | ❌ | Dữ liệu hạng mục |

**Ví dụ kinh điển:** lương của 10 người: chín người 10 triệu, một người 1 tỷ.
- Mean = 109 triệu → "lương trung bình công ty 109 triệu" — nghe hay nhưng vô nghĩa
- Median = 10 triệu → phản ánh đúng thực tế đa số

**Vì thế** báo chí kinh tế luôn dùng **median** cho thu nhập và giá nhà.

**Áp dụng khi điền giá trị thiếu:** điền bằng **median** an toàn hơn mean, vì không bị một vài giá trị cực đoan kéo lệch.

**Ý ăn điểm:** "Khi mean và median lệch nhau nhiều, đó là tín hiệu phân bố bị lệch hoặc có ngoại lai — tôi sẽ vẽ histogram để nhìn kỹ hơn trước khi quyết định."
</details>
