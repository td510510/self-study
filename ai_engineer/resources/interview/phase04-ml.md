# 💼 Phỏng vấn — Phase 04: Classical ML

> Đây là nhóm câu hỏi **hay gặp nhất** trong phỏng vấn AI/ML. Trả lời to trong 60 giây trước khi mở đáp án.

---

### 1. Vì sao phải chia **ba** tập chứ không phải hai?

<details><summary>Đáp án</summary>

| Tập | Dùng để | Chạm bao nhiêu lần |
|---|---|---|
| **Train** | Model học parameter | Liên tục |
| **Validation** | Chọn hyperparameter, so sánh model | Nhiều lần |
| **Test** | Ước lượng hiệu năng thật | **Đúng một lần, ở cuối** |

**Nếu chỉ có hai tập:** bạn thử 50 cấu hình rồi chọn cái tốt nhất trên test. Bạn vừa *gián tiếp* dùng test để chọn model → điểm test không còn khách quan. Hiện tượng này gọi là **overfitting lên tập test**, tinh vi hơn overfitting thường rất nhiều.

Ẩn dụ: validation là đề thi thử (làm bao nhiêu lần cũng được), test là đề thi thật (chỉ làm một lần).

**Ý ăn điểm:** nhắc tới cross-validation như giải pháp khi dữ liệu ít — nó tận dụng được toàn bộ dữ liệu train làm validation luân phiên, nhưng **vẫn phải giữ tập test riêng**.
</details>

---

### 2. Train 99%, test 62%. Chuyện gì đang xảy ra? Chữa thế nào?

<details><summary>Đáp án</summary>

**Overfitting** — model học thuộc lòng cả nhiễu trong tập train.

**Chữa, theo thứ tự hiệu quả:**

| Cách | Ghi chú |
|---|---|
| **Thêm dữ liệu** | Hiệu quả nhất, nhưng thường không có sẵn |
| **Đơn giản hoá model** | Giảm `max_depth`, giảm số đặc trưng |
| **Regularization** | Ridge/Lasso, dropout, weight decay |
| **Early stopping** | Dừng khi điểm validation bắt đầu xấu đi |
| **Ensemble** | Random Forest ít overfit hơn cây đơn |

**Bảng chẩn đoán đầy đủ:**

| Train | Test | Kết luận |
|---|---|---|
| Dở | Dở | Underfit |
| Tốt | Tốt | ✅ Vừa |
| Rất tốt | Dở | Overfit |
| **Dở** | **Tốt** | 🚨 Có bug — kiểm tra cách chia dữ liệu |

**Ý ăn điểm:** nhắc rằng trước khi kết luận overfit, phải kiểm tra tập test có **đủ lớn** và **đại diện** không. Test 50 dòng thì chênh lệch có thể chỉ là nhiễu ngẫu nhiên.
</details>

---

### 3. Dữ liệu 1% gian lận, model đạt accuracy 99%. Nhận xét?

<details><summary>Đáp án</summary>

**Model có thể hoàn toàn vô dụng.** Một model luôn đoán "không gian lận" đạt đúng 99% accuracy và bắt được **không** giao dịch gian lận nào.

**Phải hỏi ngay:** *recall trên lớp gian lận là bao nhiêu?*

**Metric nên dùng thay thế:**
- **Recall** — bắt được bao nhiêu % gian lận (thường là ưu tiên số 1)
- **Precision** — trong số báo động, bao nhiêu % thật
- **PR-AUC** — tốt hơn ROC-AUC khi lớp cực hiếm
- **Chi phí kinh doanh** — con số duy nhất người ra quyết định hiểu

**Xử lý mất cân bằng, theo thứ tự nên thử:**
1. Đổi metric (luôn làm đầu tiên, không tốn gì)
2. `class_weight="balanced"`
3. Chỉnh ngưỡng
4. Resampling (SMOTE) — chỉ trên train, dễ gây leakage

**Ý ăn điểm:** *"Tôi sẽ hỏi bên nghiệp vụ: bỏ sót một vụ gian lận tốn bao nhiêu, và điều tra nhầm một giao dịch sạch tốn bao nhiêu? Rồi tôi chọn ngưỡng tối thiểu hoá tổng chi phí thay vì tối đa hoá F1."*
</details>

---

### 4. Precision và recall khác nhau ra sao? Cho ví dụ ưu tiên mỗi loại.

<details><summary>Đáp án</summary>

```
              TP                          TP
Precision = ────────           Recall = ────────
            TP + FP                      TP + FN
            ↑                            ↑
      mọi thứ ta BÁO là 1          mọi thứ THẬT SỰ là 1
```

- **Precision:** *"Trong số ta báo, bao nhiêu % đúng?"* → quan tâm **báo động giả**
- **Recall:** *"Trong số thật sự có, ta bắt được bao nhiêu %?"* → quan tâm **bỏ sót**

| Ưu tiên | Bài toán | Vì sao |
|---|---|---|
| **Recall** | Sàng lọc ung thư | Bỏ sót bệnh nhân >> báo động giả (còn xét nghiệm lại được) |
| **Recall** | Phát hiện gian lận | Bỏ sót là mất tiền thật; báo nhầm thì có người duyệt lại |
| **Precision** | Lọc email spam | Đánh nhầm email quan trọng vào spam rất tệ |
| **Precision** | Gợi ý sản phẩm | Gợi ý sai làm người dùng mất niềm tin |

**Đánh đổi:** hạ ngưỡng → recall tăng, precision giảm. Không có bữa trưa miễn phí.

**Ý ăn điểm:** nêu hai cách gian lận — precision = 1.0 dễ đạt bằng cách chỉ báo một mẫu chắc chắn nhất; recall = 1.0 dễ đạt bằng cách báo tất cả. Vì thế **không bao giờ báo cáo một mình một chỉ số**.
</details>

---

### 5. Ngưỡng 0.5 có gì đặc biệt? Khi nào nên đổi?

<details><summary>Đáp án</summary>

**Không có gì đặc biệt cả.** Nó chỉ là mặc định của `.predict()` trong sklearn.

**Ngưỡng đúng là một quyết định kinh doanh**, tính bằng:

```
Chi phí = FP × (chi phí báo động giả) + FN × (chi phí bỏ sót)
```

Chọn ngưỡng tối thiểu hoá con số này.

**Ví dụ churn:** FP = 200k (khuyến mãi nhầm), FN = 3 triệu (mất khách). FN đắt gấp 15 lần → nên hạ ngưỡng xuống ~0.25, chấp nhận báo nhầm nhiều hơn.

**Ba lưu ý:**
1. Chọn ngưỡng trên tập **validation**, không phải test — chọn trên test là overfitting lên test
2. Dùng `predict_proba` chứ không `predict`, để giữ quyền chọn ngưỡng
3. `class_weight="balanced"` tương đương hạ ngưỡng, chỉ là làm ở tầng loss

**Ý ăn điểm:** *"Tôi thường vẽ biểu đồ chi phí theo ngưỡng rồi đưa cho bên nghiệp vụ chọn điểm cân bằng — họ hiểu tiền, không hiểu F1."*
</details>

---

### 6. Kể ba dạng data leakage và cách phát hiện.

<details><summary>Đáp án</summary>

**Leakage** = thông tin model lẽ ra không được biết lúc dự đoán lại lọt vào lúc train. Kết quả: điểm test cao ngất, ra đời thật thất bại.

**① Leakage do tiền xử lý** — phổ biến và tinh vi nhất
```python
# ❌ scaler nhìn thấy cả tập test
X_scaled = scaler.fit_transform(X)
X_train, X_test = train_test_split(X_scaled, ...)

# ✅ chia trước, fit chỉ trên train
X_train, X_test = train_test_split(X, ...)
X_train = scaler.fit_transform(X_train)
X_test = scaler.transform(X_test)
```
Nguy hiểm hơn với **chọn đặc trưng** trước cross-validation: trên dữ liệu hoàn toàn ngẫu nhiên, cách sai vẫn cho AUC ~0.94.
**Cách chống:** đưa mọi tiền xử lý vào `Pipeline`.

**② Leakage do đặc trưng** — khó thấy nhất
Ví dụ: dự đoán churn nhưng có cột `da_goi_tong_dai_huy` — cột này chỉ được ghi nhận **sau khi** khách đã quyết định huỷ.
**Cách chống:** hỏi từng cột *"Lúc tôi CẦN dự đoán, tôi đã có cột này chưa?"*

**③ Leakage do thời gian**
Train trên tháng 12, test trên tháng 6 → model "nhìn thấy tương lai".
**Cách chống:** chia theo mốc thời gian, dùng `TimeSeriesSplit`.

**Ba câu hỏi phát hiện:**
1. Kết quả có tốt bất thường không? (AUC > 0.95 ở bài toán khó → nghi ngờ)
2. Một đặc trưng chiếm gần hết importance?
3. Lúc dự đoán thật, tôi có cột này chưa?

**Ý ăn điểm:** *"Nguyên tắc của tôi là kết quả đẹp bất ngờ là tin xấu cho tới khi chứng minh được ngược lại. Tôi thường chạy thử từng đặc trưng một mình qua cross-validation — cột nào một mình đạt AUC gần 0.9 thì tôi soi kỹ nó."*
</details>

---

### 7. `Pipeline` của sklearn giải quyết vấn đề gì?

<details><summary>Đáp án</summary>

**Ba vấn đề thật, không phải "cho đẹp":**

**① Chống leakage tự động.** Mọi bước `fit` chỉ chạy trên phần train. Không thể vô tình fit scaler trên test.

**② Hoạt động đúng với cross-validation** — lý do quan trọng và tinh vi nhất. Nếu tiền xử lý thủ công trước CV, mỗi fold "test" đã góp phần tính mean/std → điểm CV cao hơn thực tế. Với Pipeline, `cross_val_score` fit lại **toàn bộ** pipeline trên phần train của từng fold.

**③ Triển khai chỉ một đối tượng.** `joblib.dump(pipeline, "model.pkl")` lưu cả tiền xử lý lẫn model. Khi phục vụ chỉ cần `pipeline.predict(du_lieu_tho)` — không thể quên bước nào. *"Quên một bước tiền xử lý khi triển khai"* là một trong những lỗi phổ biến nhất khi đưa ML vào sản xuất.

**Ý ăn điểm:** nhắc `ColumnTransformer` để xử lý riêng cột số và cột hạng mục, và `handle_unknown="ignore"` để hạng mục lạ trong sản xuất không làm sập API.
</details>

---

### 8. Vì sao Random Forest ít overfit hơn một cây đơn lẻ?

<details><summary>Đáp án</summary>

**Hai nguồn ngẫu nhiên tạo ra sự đa dạng:**
1. **Bagging** — mỗi cây train trên một mẫu bootstrap (lấy ngẫu nhiên có hoàn lại)
2. **Random subspace** — ở mỗi lần chia, cây chỉ được xem một tập con ngẫu nhiên các đặc trưng

**Vì sao hiệu quả:** từng cây vẫn overfit, nhưng chúng overfit theo những cách **khác nhau**. Khi lấy trung bình, lỗi ngẫu nhiên triệt tiêu lẫn nhau, còn lại tín hiệu chung.

Nói theo bias–variance: bagging **giảm variance** mà gần như không tăng bias.

**Phân biệt với Gradient Boosting:**

| | Random Forest | Gradient Boosting |
|---|---|---|
| Cách trồng cây | **Song song**, độc lập | **Tuần tự**, cây sau sửa lỗi cây trước |
| Giảm | Variance | Bias |
| Overfit | Khó | **Dễ** nếu quá nhiều cây / lr cao |
| Chỉnh tham số | Ít phải chỉnh | Cần chỉnh kỹ hơn |

**Ý ăn điểm:** *"Random Forest là lựa chọn mặc định an toàn của tôi vì gần như không thể làm hỏng nó. Nhưng với dữ liệu bảng cần điểm cao nhất, Gradient Boosting thường thắng — miễn là tôi chỉnh learning rate và dùng early stopping."*

**Ý ăn điểm thêm:** nhắc rằng với dữ liệu **dạng bảng**, Gradient Boosting vẫn đang thắng deep learning ở hầu hết trường hợp — đừng dùng mạng neural cho file CSV.
</details>

---

### 9. Feature importance có ý nghĩa nhân quả không?

<details><summary>Đáp án</summary>

**Không.** Importance chỉ nói đặc trưng nào giúp model **dự đoán** tốt, không nói can thiệp vào nó sẽ thay đổi kết quả.

**Ví dụ:** model nói `so_lan_goi_tong_dai` rất quan trọng để dự đoán churn. Điều đó **không** có nghĩa chặn tổng đài sẽ giữ được khách — gọi tổng đài là **triệu chứng** của sự không hài lòng, không phải nguyên nhân của việc rời bỏ.

**Ba cảnh báo kỹ thuật:**
1. Importance mặc định của cây **thiên vị** đặc trưng có nhiều giá trị khác nhau
2. Với hai đặc trưng tương quan cao, importance bị **chia đôi** — cả hai trông ít quan trọng
3. Nó tính trên tập **train**, nên phản ánh cả phần model đã overfit

**Giải pháp tốt hơn: permutation importance** — xáo trộn một cột rồi đo điểm số giảm bao nhiêu. Đo trên tập **test**, dùng được với **mọi** model.

**Muốn kết luận nhân quả thì phải:** làm A/B test, hoặc dùng phương pháp suy luận nhân quả (causal inference) chuyên biệt.

**Ý ăn điểm:** *"Tôi luôn nói rõ với bên nghiệp vụ rằng đây là tương quan chứ không phải nhân quả. Nếu họ muốn biết một hành động có hiệu quả không, chúng ta cần A/B test — model chỉ giúp chọn ra nhóm nào đáng thử nghiệm trước."*
</details>

---

### 10. Model đạt AUC 0.98. Bạn phản ứng thế nào?

<details><summary>Đáp án</summary>

**Nghi ngờ trước, ăn mừng sau.** Với bài toán kinh doanh thật, AUC 0.98 gần như luôn nghĩa là có gì đó sai.

**Danh sách kiểm tra:**

1. **Data leakage** — nguyên nhân số 1
   - Có cột nào chỉ tồn tại *sau* sự kiện cần dự đoán?
   - Tiền xử lý có nằm ngoài Pipeline không?
   - Chạy từng đặc trưng một mình — có cột nào một mình đạt AUC ~0.9?

2. **Dòng trùng lặp giữa train và test** — cùng một khách xuất hiện ở cả hai tập

3. **Chia sai với dữ liệu thời gian** — xáo trộn khiến model thấy tương lai

4. **Tập test quá nhỏ hoặc không đại diện**

5. **Bài toán thật sự dễ** — cũng có thể lắm, nhưng phải chứng minh được

**Cách kiểm chứng cuối cùng:** đánh giá trên dữ liệu của một **khoảng thời gian sau** hoàn toàn (out-of-time validation). Nếu điểm rớt mạnh → leakage.

**Ý ăn điểm:** *"Ở một dự án cũ tôi từng có AUC 0.97 và suýt đưa vào sản xuất. Hoá ra có một cột trạng thái được cập nhật sau khi khách huỷ. Sau khi bỏ, con số thật là 0.79 — thấp hơn nhiều nhưng đó mới là thứ dùng được."*

(Nếu bạn chưa có kinh nghiệm thật, hãy kể chính bài học từ dataset churn trong khoá học này — trung thực và vẫn thể hiện được bạn hiểu vấn đề.)
</details>
